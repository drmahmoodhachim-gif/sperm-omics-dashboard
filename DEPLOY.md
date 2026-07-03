# Deploy: GitHub + Netlify + Supabase

## 1. Supabase setup (one-time)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Run the migration: `supabase/migrations/20260703_performance.sql`
3. Copy from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

4. Sync data locally:
```bash
npm run ingest          # fetch GEO, PRIDE, PubMed, SperMD
npm run sync:supabase   # push to Supabase
```

## 2. GitHub

```bash
git init
git add .
git commit -m "SpermOmics live dashboard with Supabase"
gh repo create sperm-omics-dashboard --public --source=. --push
```

## 3. Netlify

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import from GitHub**
2. Select `sperm-omics-dashboard`
3. Build settings (auto-detected from `netlify.toml`):
   - Build: `npm run build`
   - Plugin: `@netlify/plugin-nextjs`
4. **Environment variables** (Site settings → Environment):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NCBI_API_KEY` (optional)

5. Deploy → your site goes live at `https://your-site.netlify.app`

## 4. Weekly data refresh

GitHub Actions (`.github/workflows/ingest-schedule.yml`) runs ingest weekly and commits updated `data/`. Re-run `npm run sync:supabase` after ingest, or trigger ingest from `/ingest` page cron endpoint.

## Performance

| Layer | What it does |
|-------|----------------|
| **Supabase** | Indexed DB, paginated queries, stats RPC |
| **API cache** | `revalidate=300` on `/api/*` |
| **Netlify CDN** | Edge cache headers on API responses |
| **Client pagination** | 50 datasets / 25 pubs per page |
