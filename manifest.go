package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
)

// ImageEntry handles both string and {path, also} formats in the manifest.
type ImageEntry struct {
	Path string   `json:"path"`
	Also []string `json:"also,omitempty"`
}

func (ie *ImageEntry) UnmarshalJSON(data []byte) error {
	// Try string first
	var s string
	if err := json.Unmarshal(data, &s); err == nil {
		ie.Path = s
		ie.Also = nil
		return nil
	}
	// Try object
	type raw struct {
		Path string   `json:"path"`
		Also []string `json:"also,omitempty"`
	}
	var r raw
	if err := json.Unmarshal(data, &r); err != nil {
		return err
	}
	ie.Path = r.Path
	ie.Also = r.Also
	return nil
}

func (ie ImageEntry) MarshalJSON() ([]byte, error) {
	if len(ie.Also) == 0 {
		return json.Marshal(ie.Path)
	}
	type raw struct {
		Path string   `json:"path"`
		Also []string `json:"also,omitempty"`
	}
	return json.Marshal(raw{Path: ie.Path, Also: ie.Also})
}

// ManifestEntry represents a single entry in the manifest.
type ManifestEntry struct {
	Slug    string       `json:"slug"`
	Type    string       `json:"type"`
	Images  []ImageEntry `json:"images,omitempty"`
	Animals []string     `json:"animals,omitempty"`
	Date    string       `json:"date,omitempty"`
}

var manifestMu sync.Mutex

func manifestPath() string {
	return "stories/manifest.json"
}

func readManifest() ([]ManifestEntry, error) {
	data, err := os.ReadFile(manifestPath())
	if err != nil {
		if os.IsNotExist(err) {
			return []ManifestEntry{}, nil
		}
		return nil, err
	}
	var entries []ManifestEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}
	return entries, nil
}

func writeManifest(entries []ManifestEntry) error {
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return err
	}
	tmp := manifestPath() + ".tmp"
	if err := os.WriteFile(tmp, data, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, manifestPath())
}

func addEntry(entry ManifestEntry) error {
	manifestMu.Lock()
	defer manifestMu.Unlock()

	entries, err := readManifest()
	if err != nil {
		return err
	}
	// Check for duplicate slug
	for _, e := range entries {
		if e.Slug == entry.Slug {
			return fmt.Errorf("entry with slug %q already exists", entry.Slug)
		}
	}
	entries = append(entries, entry)
	return writeManifest(entries)
}

func updateEntry(slug string, updated ManifestEntry) error {
	manifestMu.Lock()
	defer manifestMu.Unlock()

	entries, err := readManifest()
	if err != nil {
		return err
	}
	found := false
	for i, e := range entries {
		if e.Slug == slug {
			updated.Slug = slug // preserve original slug
			entries[i] = updated
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("entry with slug %q not found", slug)
	}
	return writeManifest(entries)
}

func removeEntry(slug string) error {
	manifestMu.Lock()
	defer manifestMu.Unlock()

	entries, err := readManifest()
	if err != nil {
		return err
	}
	filtered := entries[:0]
	found := false
	for _, e := range entries {
		if e.Slug == slug {
			found = true
			continue
		}
		filtered = append(filtered, e)
	}
	if !found {
		return fmt.Errorf("entry with slug %q not found", slug)
	}
	return writeManifest(filtered)
}

func findEntry(slug string) (*ManifestEntry, error) {
	entries, err := readManifest()
	if err != nil {
		return nil, err
	}
	for _, e := range entries {
		if e.Slug == slug {
			return &e, nil
		}
	}
	return nil, nil
}
