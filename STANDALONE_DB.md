# Standalone Supabase Database for SpermOmics

SpermOmics uses its **own isolated schema** (`sperm_omics`) — completely separate from your other projects (IDCC, Radix, COVID dashboards, etc.).

## Two setup options

### Option A — New Supabase project (recommended)

Best for a truly standalone database with its own URL, keys, and billing.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `sperm-omics-library`
3. Copy **Project URL**, **anon key**, **service_role key**
4. SQL Editor → paste and run `supabase/migrations/001_sperm_omics_standalone.sql`
5. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_SCHEMA=sperm_omics
```

6. Sync data:

```bash
npm run sync:supabase
```

### Option B — Isolated schema on existing project

If you keep one Supabase account, the `sperm_omics` schema keeps all SpermOmics tables separate from `public.idcc_*`, `public.radix_*`, etc.

The migration has been applied to create:
- `sperm_omics.publications`
- `sperm_omics.datasets`
- `sperm_omics.methods`
- `sperm_omics.figures`
- `sperm_omics.measurements`
- `sperm_omics.ingest_manifest`

The app **only reads/writes the `sperm_omics` schema** — it never touches your other tables.

## Verify isolation

```bash
npm run db:verify
```

This confirms the app connects to `sperm_omics` and reports row counts.

## Old tables (safe to ignore)

These empty tables in `public` from an earlier attempt can be dropped if you want:

```sql
DROP TABLE IF EXISTS public.sperm_lib_measurements;
DROP TABLE IF EXISTS public.sperm_lib_figures;
DROP TABLE IF EXISTS public.sperm_lib_methods;
DROP TABLE IF EXISTS public.sperm_lib_datasets;
DROP TABLE IF EXISTS public.sperm_lib_publications;
```

## Netlify env vars

Set the **new project** credentials on Netlify (not your other apps' keys):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_SCHEMA=sperm_omics`
