package main

import (
	"crypto/subtle"
	"flag"
	"fmt"
	"net/http"
	"os"
	"time"
)

func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	user := os.Getenv("ADMIN_USER")
	pass := os.Getenv("ADMIN_PASS")
	if user == "" {
		user = "admin"
	}
	if pass == "" {
		pass = "thornyknolls"
	}

	return func(w http.ResponseWriter, r *http.Request) {
		u, p, ok := r.BasicAuth()
		if !ok ||
			subtle.ConstantTimeCompare([]byte(u), []byte(user)) != 1 ||
			subtle.ConstantTimeCompare([]byte(p), []byte(pass)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="Admin"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

func main() {
	migrate := flag.Bool("migrate", false, "Upload existing images to S3 and exit")
	flag.Parse()

	// Initialize S3 (nil if not configured)
	s3Client = initS3()
	if s3Enabled {
		fmt.Printf("S3 enabled: bucket=%s publicURL=%s\n", s3Bucket, s3PublicURL)
	} else {
		fmt.Println("S3 not configured — using local filesystem for images")
	}

	// Handle migration mode
	if *migrate {
		if err := migrateImagesToS3(); err != nil {
			fmt.Fprintf(os.Stderr, "migration failed: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// Public API routes (no auth required)
	http.HandleFunc("/api/config", handleConfig)

	// Admin API routes (registered before the catch-all static handler)
	http.HandleFunc("/api/admin/entries", requireAuth(handleEntries))
	http.HandleFunc("/api/admin/entry", requireAuth(handleEntry))

	// Static file server for everything else
	http.Handle("/", http.FileServer(http.Dir(".")))

	addr := ":8080"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}

	srv := &http.Server{
		Addr:         addr,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	fmt.Printf("Thorny Knolls server listening on %s\n", addr)
	if err := srv.ListenAndServe(); err != nil {
		fmt.Fprintf(os.Stderr, "server error: %v\n", err)
		os.Exit(1)
	}
}
