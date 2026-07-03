# SpermOmics Resource Library

Publication-ready dashboard and automated data pipeline for **male infertility** and **sperm biology** research.

## Features

- **Automated ingestion** from GEO, PRIDE, PubMed, and SperMD (266 datasets)
- **Weekly scheduled sync** via GitHub Actions + Vercel cron
- **Publication-ready figures** with SVG, PNG, and PDF export
- **Methods & materials** library with full analysis protocols
- **Merged library API** at `/api/library`

## Quick Start

```bash
npm install
npm run ingest   # Pull latest public data (first run ~2-5 min)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Ingestion Pipeline

| Source | Method | Output |
|--------|--------|--------|
| NCBI GEO | E-utilities esearch/esummary | `data/geo-ingest.json` |
| PRIDE Archive | REST API v3 `/search/projects` | `data/pride-ingest.json` |
| PubMed | E-utilities + efetch abstracts | `data/pubmed-ingest.json` |
| SperMD | Figshare docx + 266-entry catalog | `data/spermd-ingest.json` |

Merged output: `data/library-merged.json` + `data/ingest-manifest.json`

```bash
npm run ingest              # Full pipeline
npm run ingest:geo          # Legacy alias (runs full pipeline)
```

## Scheduled Ingestion

### GitHub Actions (recommended)
Runs every **Sunday 03:00 UTC**. See `.github/workflows/ingest-schedule.yml`.

Set `NCBI_API_KEY` secret for higher NCBI rate limits.

### Vercel Cron
`vercel.json` triggers `POST /api/cron/ingest` weekly. Set `CRON_SECRET` in env.

```bash
curl -X POST https://your-app.vercel.app/api/cron/ingest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Figure Export

On the **Figures & Tables** page, each figure has **SVG**, **PNG**, and **PDF** export buttons for manuscript use.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/library` | Full merged library JSON |
| `GET /api/ingest/status` | Ingestion stats and manifest |
| `POST /api/cron/ingest` | Trigger full ingest (requires CRON_SECRET) |

## Environment

Copy `.env.example` to `.env.local`:

- `CRON_SECRET` — Protects cron endpoint
- `NCBI_API_KEY` — Optional, increases PubMed/GEO rate limits

## License

MIT — Data remains under original repository licenses.
