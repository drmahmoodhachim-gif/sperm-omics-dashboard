# Deploy: GitHub + Netlify + Supabase

## Live site

- **Production:** https://sperm-omics-dashboard.netlify.app
- **Netlify project:** `sperm-omics-dashboard` (`512e6fa5-d8d9-4062-8340-7adbc199a141`)
- **GitHub:** https://github.com/drmahmoodhachim-gif/sperm-omics-dashboard (branch `master`)

## Auto-deploy (GitHub Actions → Netlify cloud)

Pushes to `master` run `.github/workflows/netlify-deploy.yml`:

1. Build on **GitHub-hosted runners** (no local disk needed)
2. `netlify build` pulls **production env vars** from the Netlify site
3. `netlify deploy --prod --no-build` publishes to production

One-time setup (already done if secrets exist):

```bash
node scripts/setup-github-netlify-secrets.js
```

Required GitHub secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

Optional: link GitHub natively in Netlify UI for deploy previews:
https://app.netlify.com/projects/sperm-omics-dashboard/link

## Netlify environment variables (production)

Set in **Site settings → Environment variables**:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Already set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Already set |
| `NEXT_PUBLIC_SUPABASE_SCHEMA` | Yes | `sperm_omics` |
| `CRON_SECRET` | Yes | For `/api/cron/ingest` |
| `AUTH_SECRET` | Yes | Session signing (32+ char random hex) |
| `AUTH_USERNAME` | Yes | Approved login email |
| `AUTH_PASSWORD` | Yes | Approved login password |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side ingest sync — get from Supabase Dashboard → Settings → API → **service_role** (secret) |
| `NCBI_API_KEY` | Optional | Faster GEO/PubMed ingest |

## Build settings (Next.js plugin)

- **Build command:** `npm run build` (in `netlify.toml`)
- **Publish directory:** leave **blank** in Netlify UI (do not set `.next`)
- **Plugin:** `@netlify/plugin-nextjs`

If builds fail with “publish directory” errors, open
https://app.netlify.com/projects/sperm-omics-dashboard/settings/deploys
and clear the Publish directory field.

## Supabase data sync

```bash
npm run ingest
npm run sync:supabase   # needs SUPABASE_SERVICE_ROLE_KEY locally
npm run db:verify
```

## Weekly ingest

GitHub Actions (`.github/workflows/ingest-schedule.yml`) can refresh data weekly.
After ingest, run `npm run sync:supabase` or call `/api/cron/ingest` in production
(requires `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` on Netlify).
