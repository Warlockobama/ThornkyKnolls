#!/usr/bin/env bash
set -euo pipefail

failed=0

if command -v go >/dev/null 2>&1; then
  go_version=$(go version | awk '{print $3}' | sed 's/^go//')
  go_major=${go_version%%.*}
  go_minor=${go_version#*.}
  go_minor=${go_minor%%.*}

  if [ "${go_major:-0}" -lt 1 ] || { [ "${go_major:-0}" -eq 1 ] && [ "${go_minor:-0}" -lt 22 ]; }; then
    printf 'Warning: skipping Go checks because local Go is %s and this project requires Go 1.22+\n' "$go_version" >&2
  else
    unformatted=$(gofmt -l *.go 2>/dev/null || true)
    if [ -n "$unformatted" ]; then
      printf 'Go files need gofmt:\n%s\n' "$unformatted" >&2
      failed=1
    fi

    if ! go test ./...; then
      failed=1
    fi
  fi
fi

node - <<'NODE' || failed=1
const fs = require("fs");
const path = require("path");

const manifestPath = path.join("stories", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
let failed = false;
const slugs = new Set();

for (const entry of manifest) {
  if (!entry.slug) {
    console.error("Manifest entry missing slug");
    failed = true;
    continue;
  }

  if (slugs.has(entry.slug)) {
    console.error(`Duplicate manifest slug: ${entry.slug}`);
    failed = true;
  }
  slugs.add(entry.slug);

  const htmlPath = path.join("stories", `${entry.slug}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.error(`Manifest references missing story file: ${htmlPath}`);
    failed = true;
  }

  for (const image of entry.images || []) {
    const imagePath = typeof image === "string" ? image : image && image.path;
    if (!imagePath || /^https?:\/\//.test(imagePath)) {
      continue;
    }

    const localPath = path.join("stories", imagePath);
    if (!fs.existsSync(localPath)) {
      // In production these are usually backed by S3/Object Storage, so this is
      // a warning rather than a hard failure.
      console.warn(`Warning: manifest image not present locally: ${localPath}`);
    }
  }
}

process.exit(failed ? 1 : 0);
NODE

exit "$failed"
