# Thorny Knolls Codex Guide

This working copy matches the live VPS deployment at `/opt/thornyknolls`.
Treat the live site as the current source of truth until the repository remote is
cleaned up intentionally.

## Rules

- Do not deploy without explicit approval from James.
- Do not commit `.env` or any live secret values.
- Phone-shared photos must become a complete journal draft, not only staged
  images.
- Keep draft work under `drafts/<date>-<slug>/` until James approves publishing.
- Production story files live under `stories/`; do not copy a draft there unless
  asked to publish.

## Journal Draft Contract

Every photo-driven draft must include:

- `entry.html`: complete journal entry body.
- `manifest.entry.json`: proposed manifest entry with `slug`, `type`, `title`,
  `date`, `summary`, and `images`.
- `notes.md`: source notes, tone guidance, and remaining review questions.
- `originals/`: original phone photos.
- `optimized/`: site-ready image files referenced by `manifest.entry.json`.

Use:

```bash
scripts/new-journal-draft.sh "Morning with Pumpkin" /path/to/photo1.jpg /path/to/photo2.jpg
scripts/check-journal-drafts.sh
```

## Live Deployment Notes

- VPS: `root@178.156.228.201`
- Path: `/opt/thornyknolls`
- Stack: Docker Compose with `app`, `caddy`, `umami`, and `db`
- Public site: `https://thornyknolls.com`
- Analytics: `https://analytics.thornyknolls.com`

