#!/usr/bin/env bash
set -euo pipefail

if [ ! -d drafts ]; then
  exit 0
fi

failed=0

for draft in drafts/*; do
  [ -d "$draft" ] || continue

  has_images=0
  if find "$draft" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.heic' -o -iname '*.heif' \) | grep -q .; then
    has_images=1
  fi

  [ "$has_images" -eq 1 ] || continue

  for required in entry.html manifest.entry.json notes.md; do
    if [ ! -s "$draft/$required" ]; then
      printf 'Journal draft incomplete: %s is missing %s\n' "$draft" "$required" >&2
      failed=1
    fi
  done

  if [ ! -d "$draft/originals" ] || ! find "$draft/originals" -type f | grep -q .; then
    printf 'Journal draft incomplete: %s has no originals/ photos\n' "$draft" >&2
    failed=1
  fi

  if [ ! -d "$draft/optimized" ] || ! find "$draft/optimized" -type f | grep -q .; then
    printf 'Journal draft incomplete: %s has no optimized/ images\n' "$draft" >&2
    failed=1
  fi

  if [ -s "$draft/manifest.entry.json" ]; then
    DRAFT_DIR="$draft" node - <<'NODE' || failed=1
const fs = require("fs");
const path = require("path");

const draft = process.env.DRAFT_DIR;
const manifestPath = path.join(draft, "manifest.entry.json");
let manifest;

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Journal draft invalid JSON: ${manifestPath}: ${error.message}`);
  process.exit(1);
}

const required = ["slug", "type", "title", "date", "summary", "images"];
let failed = false;

for (const key of required) {
  if (!(key in manifest) || manifest[key] === "" || manifest[key] == null) {
    console.error(`Journal draft missing required manifest field: ${draft}: ${key}`);
    failed = true;
  }
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(String(manifest.date || ""))) {
  console.error(`Journal draft date must be YYYY-MM-DD: ${draft}`);
  failed = true;
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(manifest.slug || ""))) {
  console.error(`Journal draft slug must be lowercase kebab-case: ${draft}`);
  failed = true;
}

if (!Array.isArray(manifest.images) || manifest.images.length === 0) {
  console.error(`Journal draft must reference at least one optimized image: ${draft}`);
  failed = true;
} else {
  for (const image of manifest.images) {
    const imagePath = typeof image === "string" ? image : image && image.path;
    if (!imagePath) {
      console.error(`Journal draft image is missing a path: ${draft}`);
      failed = true;
      continue;
    }
    if (/^https?:\/\//.test(imagePath)) {
      continue;
    }
    const fullPath = path.join(draft, imagePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`Journal draft references missing image: ${draft}/${imagePath}`);
      failed = true;
    }
  }
}

const entryPath = path.join(draft, "entry.html");
if (fs.existsSync(entryPath)) {
  const html = fs.readFileSync(entryPath, "utf8");
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(/\s+/).length : 0;

  if (/\bTODO\b/i.test(html)) {
    console.error(`Journal draft still contains TODO markers: ${entryPath}`);
    failed = true;
  }

  if (words < 150) {
    console.error(`Journal draft is too thin (${words} words, expected at least 150): ${entryPath}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
NODE
  fi
done

exit "$failed"

