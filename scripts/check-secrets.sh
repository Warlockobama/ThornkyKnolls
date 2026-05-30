#!/usr/bin/env bash
set -euo pipefail

if git rev-parse --git-dir >/dev/null 2>&1; then
  files=$(git diff --cached --name-only --diff-filter=ACMR)
else
  files=$(find . -type f)
fi

[ -n "$files" ] || exit 0

failed=0

while IFS= read -r file; do
  [ -n "$file" ] || continue
  [ -f "$file" ] || continue

  case "$file" in
    .env|*/.env|*.pem|*.key|id_rsa|id_ed25519|*/id_rsa|*/id_ed25519)
      printf 'Refusing to commit probable secret file: %s\n' "$file" >&2
      failed=1
      continue
      ;;
  esac

  if grep -Iq . "$file"; then
    if grep -En '(S3_SECRET_KEY|S3_ACCESS_KEY|ADMIN_PASS|UMAMI_SECRET|UMAMI_DB_PASS|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY|GH_TOKEN|GITHUB_TOKEN)=.+[A-Za-z0-9_/\+=-]{8,}' "$file" >/dev/null; then
      printf 'Refusing to commit probable secret value in: %s\n' "$file" >&2
      failed=1
    fi
  fi
done <<EOF
$files
EOF

exit "$failed"

