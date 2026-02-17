package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/image/draw"
)

const (
	targetWidth = 1600
	jpegQuality = 85
	imageDir    = "stories/images/optimized"
)

// processImage reads an image from r, resizes it to targetWidth, and saves as JPEG.
// If S3 is enabled, uploads to S3. Otherwise writes to local filesystem.
// Returns the relative path (from stories/) suitable for the manifest.
func processImage(r io.Reader, slug string, index int) (string, error) {
	src, _, err := image.Decode(r)
	if err != nil {
		return "", fmt.Errorf("decode image: %w", err)
	}

	bounds := src.Bounds()
	srcW := bounds.Dx()
	srcH := bounds.Dy()

	// Calculate target dimensions
	newW := targetWidth
	newH := srcH * targetWidth / srcW
	if srcW <= targetWidth {
		// Don't upscale
		newW = srcW
		newH = srcH
	}

	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, bounds, draw.Over, nil)

	filename := fmt.Sprintf("%s_%d-1600w.jpg", slug, index)
	relPath := "images/optimized/" + filename

	// Encode to buffer first (needed for S3 upload, also avoids partial writes locally)
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, dst, &jpeg.Options{Quality: jpegQuality}); err != nil {
		return "", fmt.Errorf("encode jpeg: %w", err)
	}

	if s3Enabled {
		// Upload to S3
		if err := uploadToS3(context.Background(), relPath, bytes.NewReader(buf.Bytes()), "image/jpeg"); err != nil {
			return "", fmt.Errorf("upload to S3: %w", err)
		}
	} else {
		// Write to local filesystem
		if err := os.MkdirAll(imageDir, 0755); err != nil {
			return "", fmt.Errorf("create image dir: %w", err)
		}
		outPath := filepath.Join(imageDir, filename)
		if err := os.WriteFile(outPath, buf.Bytes(), 0644); err != nil {
			return "", fmt.Errorf("write image file: %w", err)
		}
	}

	return relPath, nil
}
