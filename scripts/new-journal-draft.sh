#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s "Draft Title" PHOTO [PHOTO ...]\n' "$0" >&2
  exit 2
}

if [ "$#" -lt 2 ]; then
  usage
fi

title=$1
shift

date_stamp=${DRAFT_DATE:-$(date +%F)}
slug=$(
  TITLE="$title" node - <<'NODE'
const title = process.env.TITLE || "";
const slug = title
  .toLowerCase()
  .replace(/['"]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 80);
process.stdout.write(slug || "journal-entry");
NODE
)

draft_dir="drafts/${date_stamp}-${slug}"
originals_dir="${draft_dir}/originals"
optimized_dir="${draft_dir}/optimized"

if [ -e "$draft_dir" ]; then
  printf 'Draft already exists: %s\n' "$draft_dir" >&2
  exit 1
fi

mkdir -p "$originals_dir" "$optimized_dir"

image_json_lines=()
index=1
for photo in "$@"; do
  if [ ! -f "$photo" ]; then
    printf 'Photo not found: %s\n' "$photo" >&2
    exit 1
  fi

  ext=${photo##*.}
  ext=$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')
  case "$ext" in
    jpg|jpeg|png|webp|heic|heif) ;;
    *)
      printf 'Unsupported photo extension for %s\n' "$photo" >&2
      exit 1
      ;;
  esac

  original_name=$(basename "$photo")
  cp "$photo" "${originals_dir}/${original_name}"

  output_name="${slug}_${index}-1600w.jpg"
  output_path="${optimized_dir}/${output_name}"

  if command -v magick >/dev/null 2>&1; then
    magick "$photo" -auto-orient -resize '1600x1600>' -quality 84 "$output_path"
  elif command -v convert >/dev/null 2>&1; then
    convert "$photo" -auto-orient -resize '1600x1600>' -quality 84 "$output_path"
  else
    cp "$photo" "$output_path"
  fi

  image_json_lines+=("    { \"path\": \"optimized/${output_name}\", \"alt\": \"${title}\", \"caption\": \"TODO: write a specific caption.\" }")
  index=$((index + 1))
done

{
  printf '{\n'
  printf '  "slug": "%s",\n' "$slug"
  printf '  "type": "note",\n'
  printf '  "title": "%s",\n' "$title"
  printf '  "date": "%s",\n' "$date_stamp"
  printf '  "summary": "TODO: summarize this journal entry in one sentence.",\n'
  printf '  "images": [\n'
  for i in "${!image_json_lines[@]}"; do
    line=${image_json_lines[$i]}
    if [ "$i" -lt "$((${#image_json_lines[@]} - 1))" ]; then
      printf '%s,\n' "$line"
    else
      printf '%s\n' "$line"
    fi
  done
  printf '  ]\n'
  printf '}\n'
} > "${draft_dir}/manifest.entry.json"

cat > "${draft_dir}/entry.html" <<EOF
<article class="story story-note">
  <h1>${title}</h1>
  <p class="story-date">${date_stamp}</p>

  <p>TODO: Draft the journal entry from the photos and James's notes. Keep it warm, plainspoken, and true to Thorny Knolls.</p>

  <figure>
    <img src="images/optimized/${slug}_1-1600w.jpg" alt="${title}" loading="lazy">
    <figcaption>TODO: write a specific caption.</figcaption>
  </figure>
</article>
EOF

cat > "${draft_dir}/notes.md" <<EOF
# ${title}

- Date: ${date_stamp}
- Slug: ${slug}
- Status: draft
- Source: phone photo intake

## Codex Instructions

Draft a complete Thorny Knolls journal entry from these photos. Do not publish
or deploy without explicit approval from James.

## Review Questions

- TODO: Identify the animals or location if unclear.
- TODO: Confirm whether this should be a field note, cattle profile update, or
  general journal entry.
EOF

printf 'Created journal draft: %s\n' "$draft_dir"

