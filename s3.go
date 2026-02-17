package main

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	s3Client    *s3.Client
	s3Enabled   bool
	s3Bucket    string
	s3PublicURL string // e.g. "https://thornyknolls.fsn1.your-objectstorage.com"
)

// initS3 creates an S3 client from environment variables.
// Returns nil if S3_ENDPOINT is not set (local filesystem mode).
func initS3() *s3.Client {
	endpoint := os.Getenv("S3_ENDPOINT")
	if endpoint == "" {
		return nil
	}

	bucket := os.Getenv("S3_BUCKET")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	region := os.Getenv("S3_REGION")
	publicURL := os.Getenv("S3_PUBLIC_URL")

	if bucket == "" || accessKey == "" || secretKey == "" {
		fmt.Fprintln(os.Stderr, "S3_ENDPOINT set but missing S3_BUCKET, S3_ACCESS_KEY, or S3_SECRET_KEY — falling back to local storage")
		return nil
	}
	if region == "" {
		region = "us-east-1"
	}
	if publicURL == "" {
		publicURL = endpoint
	}

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load S3 config: %v\n", err)
		return nil
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	s3Bucket = bucket
	s3PublicURL = publicURL
	s3Enabled = true
	return client
}

// uploadToS3 uploads data to the configured S3 bucket at the given key.
func uploadToS3(ctx context.Context, key string, body io.Reader, contentType string) error {
	if s3Client == nil {
		return fmt.Errorf("S3 client not initialized")
	}
	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s3Bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	return err
}

// deleteFromS3 deletes an object from the configured S3 bucket.
func deleteFromS3(ctx context.Context, key string) error {
	if s3Client == nil {
		return fmt.Errorf("S3 client not initialized")
	}
	_, err := s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	})
	return err
}

// migrateImagesToS3 uploads all existing images from the local optimized directory to S3.
func migrateImagesToS3() error {
	if !s3Enabled {
		return fmt.Errorf("S3 is not configured")
	}

	entries, err := os.ReadDir(imageDir)
	if err != nil {
		return fmt.Errorf("read image dir: %w", err)
	}

	total := 0
	for _, e := range entries {
		if !e.IsDir() {
			total++
		}
	}

	uploaded := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		localPath := imageDir + "/" + name
		key := "images/optimized/" + name

		f, err := os.Open(localPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "  SKIP %s: %v\n", name, err)
			continue
		}

		contentType := "image/jpeg"
		if len(name) > 5 && name[len(name)-5:] == ".webp" {
			contentType = "image/webp"
		} else if len(name) > 4 && name[len(name)-4:] == ".png" {
			contentType = "image/png"
		}

		err = uploadToS3(context.Background(), key, f, contentType)
		f.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "  FAIL %s: %v\n", name, err)
			continue
		}
		uploaded++
		fmt.Printf("  Uploaded %d/%d: %s\n", uploaded, total, name)
	}

	fmt.Printf("Migration complete: %d/%d images uploaded\n", uploaded, total)
	return nil
}
