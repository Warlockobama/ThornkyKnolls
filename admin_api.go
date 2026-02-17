package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func jsonOK(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

// handleEntries serves GET (list all) and POST (create new).
func handleEntries(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleListEntries(w, r)
	case http.MethodPost:
		handleCreateEntry(w, r)
	default:
		jsonError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleEntry serves GET, PUT, DELETE for a single entry by ?slug=X.
func handleEntry(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		jsonError(w, "slug parameter required", http.StatusBadRequest)
		return
	}
	// Sanitize slug
	slug = sanitizeSlug(slug)
	if slug == "" {
		jsonError(w, "invalid slug", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGetEntry(w, r, slug)
	case http.MethodPut:
		handleUpdateEntry(w, r, slug)
	case http.MethodDelete:
		handleDeleteEntry(w, r, slug)
	default:
		jsonError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func sanitizeSlug(s string) string {
	// Only allow alphanumeric, hyphens, underscores
	var b strings.Builder
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '_' {
			b.WriteRune(c)
		} else if c >= 'A' && c <= 'Z' {
			b.WriteRune(c + 32) // lowercase
		}
	}
	return b.String()
}

func handleListEntries(w http.ResponseWriter, r *http.Request) {
	entries, err := readManifest()
	if err != nil {
		jsonError(w, "failed to read manifest: "+err.Error(), http.StatusInternalServerError)
		return
	}
	jsonOK(w, entries)
}

func handleGetEntry(w http.ResponseWriter, r *http.Request, slug string) {
	entry, err := findEntry(slug)
	if err != nil {
		jsonError(w, "failed to read manifest: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if entry == nil {
		jsonError(w, "entry not found", http.StatusNotFound)
		return
	}

	// Read the HTML file
	htmlPath := filepath.Join("stories", slug+".html")
	htmlData, err := os.ReadFile(htmlPath)
	if err != nil {
		// Entry exists in manifest but HTML missing
		jsonOK(w, map[string]interface{}{
			"slug":     slug,
			"manifest": entry,
			"html":     "",
		})
		return
	}

	jsonOK(w, map[string]interface{}{
		"slug":     slug,
		"manifest": entry,
		"html":     string(htmlData),
	})
}

func handleCreateEntry(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		jsonError(w, "failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	slug := sanitizeSlug(r.FormValue("slug"))
	if slug == "" {
		jsonError(w, "slug is required", http.StatusBadRequest)
		return
	}

	entryType := r.FormValue("type")
	if entryType == "" {
		entryType = "cattle"
	}

	html := r.FormValue("html")
	if html == "" {
		jsonError(w, "html is required", http.StatusBadRequest)
		return
	}

	// Build manifest entry
	entry := ManifestEntry{
		Slug: slug,
		Type: entryType,
	}

	// Parse optional manifest JSON for extra fields (animals, date)
	if manifestJSON := r.FormValue("manifest"); manifestJSON != "" {
		var extra ManifestEntry
		if err := json.Unmarshal([]byte(manifestJSON), &extra); err == nil {
			if len(extra.Animals) > 0 {
				entry.Animals = extra.Animals
			}
			if extra.Date != "" {
				entry.Date = extra.Date
			}
		}
	}

	// Process uploaded images
	images, err := processUploadedImages(r, slug)
	if err != nil {
		jsonError(w, "image processing failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(images) > 0 {
		entry.Images = images
	}

	// Save HTML file
	htmlPath := filepath.Join("stories", slug+".html")
	if err := os.WriteFile(htmlPath, []byte(html), 0644); err != nil {
		jsonError(w, "failed to write HTML: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add to manifest
	if err := addEntry(entry); err != nil {
		// Clean up HTML file on manifest failure
		os.Remove(htmlPath)
		jsonError(w, "failed to update manifest: "+err.Error(), http.StatusConflict)
		return
	}

	jsonOK(w, map[string]interface{}{
		"slug":     slug,
		"manifest": entry,
	})
}

func handleUpdateEntry(w http.ResponseWriter, r *http.Request, slug string) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		jsonError(w, "failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	entryType := r.FormValue("type")
	if entryType == "" {
		entryType = "cattle"
	}

	html := r.FormValue("html")
	if html == "" {
		jsonError(w, "html is required", http.StatusBadRequest)
		return
	}

	// Build updated manifest entry
	updated := ManifestEntry{
		Slug: slug,
		Type: entryType,
	}

	// Parse optional manifest JSON for extra fields
	if manifestJSON := r.FormValue("manifest"); manifestJSON != "" {
		var extra ManifestEntry
		if err := json.Unmarshal([]byte(manifestJSON), &extra); err == nil {
			if len(extra.Animals) > 0 {
				updated.Animals = extra.Animals
			}
			if extra.Date != "" {
				updated.Date = extra.Date
			}
		}
	}

	// Preserve existing images from manifest, then add new uploads
	existingEntry, _ := findEntry(slug)
	if existingEntry != nil {
		updated.Images = existingEntry.Images
	}

	// Parse kept_images to know which existing images to retain
	if keptJSON := r.FormValue("kept_images"); keptJSON != "" {
		var kept []ImageEntry
		if err := json.Unmarshal([]byte(keptJSON), &kept); err == nil {
			updated.Images = kept
		}
	}

	// Process new uploaded images
	newImages, err := processUploadedImages(r, slug)
	if err != nil {
		jsonError(w, "image processing failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	updated.Images = append(updated.Images, newImages...)

	// Save HTML file
	htmlPath := filepath.Join("stories", slug+".html")
	if err := os.WriteFile(htmlPath, []byte(html), 0644); err != nil {
		jsonError(w, "failed to write HTML: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update manifest
	if err := updateEntry(slug, updated); err != nil {
		jsonError(w, "failed to update manifest: "+err.Error(), http.StatusNotFound)
		return
	}

	jsonOK(w, map[string]interface{}{
		"slug":     slug,
		"manifest": updated,
	})
}

func handleDeleteEntry(w http.ResponseWriter, r *http.Request, slug string) {
	// Fetch entry before removing to get image list for S3 cleanup
	entry, _ := findEntry(slug)

	// Remove from manifest
	if err := removeEntry(slug); err != nil {
		jsonError(w, "failed to remove from manifest: "+err.Error(), http.StatusNotFound)
		return
	}

	// Delete images from S3 (best effort)
	if s3Enabled && entry != nil {
		for _, img := range entry.Images {
			if err := deleteFromS3(context.Background(), img.Path); err != nil {
				fmt.Fprintf(os.Stderr, "failed to delete S3 object %s: %v\n", img.Path, err)
			}
		}
	}

	// Delete HTML file (best effort)
	htmlPath := filepath.Join("stories", slug+".html")
	os.Remove(htmlPath)

	jsonOK(w, map[string]string{"slug": slug, "deleted": "true"})
}

// handleConfig returns the public configuration (no auth required).
func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	imageBaseURL := "stories/"
	if s3Enabled && s3PublicURL != "" {
		imageBaseURL = strings.TrimRight(s3PublicURL, "/") + "/"
	}

	cfg := map[string]string{"imageBaseUrl": imageBaseURL}

	// Umami analytics config (optional)
	if umamiURL := os.Getenv("UMAMI_URL"); umamiURL != "" {
		cfg["umamiUrl"] = strings.TrimRight(umamiURL, "/")
	}
	if websiteID := os.Getenv("UMAMI_WEBSITE_ID"); websiteID != "" {
		cfg["umamiWebsiteId"] = websiteID
	}

	jsonOK(w, cfg)
}

// processUploadedImages handles image_0..image_N file uploads and also_0..also_N tags.
func processUploadedImages(r *http.Request, slug string) ([]ImageEntry, error) {
	var images []ImageEntry

	// Find the next available image index by checking existing files
	nextIdx := 0
	for {
		path := filepath.Join(imageDir, fmt.Sprintf("%s_%d-1600w.jpg", slug, nextIdx))
		if _, err := os.Stat(path); os.IsNotExist(err) {
			break
		}
		nextIdx++
	}

	for i := 0; i < 20; i++ { // Max 20 images per upload
		key := fmt.Sprintf("image_%d", i)
		file, _, err := r.FormFile(key)
		if err != nil {
			break // No more images
		}

		imgPath, err := processImage(io.Reader(file), slug, nextIdx)
		file.Close()
		if err != nil {
			return images, fmt.Errorf("processing image %d: %w", i, err)
		}

		entry := ImageEntry{Path: imgPath}

		// Check for also tags
		alsoKey := fmt.Sprintf("also_%d", i)
		if alsoJSON := r.FormValue(alsoKey); alsoJSON != "" {
			var also []string
			if err := json.Unmarshal([]byte(alsoJSON), &also); err == nil && len(also) > 0 {
				entry.Also = also
			}
		}

		images = append(images, entry)
		nextIdx++
	}

	return images, nil
}
