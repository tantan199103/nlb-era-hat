# Lids HD Store

Vite + React storefront backed by Supabase and deployed on Vercel.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` to enable catalog reads and order/drop-notification writes. The UI still falls back to the bundled catalog when the variables are absent.

## Supabase

The schema is in [supabase/migrations/20261001000000_initial_store.sql](supabase/migrations/20261001000000_initial_store.sql). The catalog seed helper is [supabase/seed_products.mjs](supabase/seed_products.mjs).

The storefront and admin structure is documented in [docs/architecture.md](docs/architecture.md). Apply [supabase/migrations/20261001010000_catalog_navigation_admin.sql](supabase/migrations/20261001010000_catalog_navigation_admin.sql) after the initial schema to enable editable menus, collections, full catalog facets and the protected admin modules. Then apply [supabase/migrations/20261002000000_1688_source_gate.sql](supabase/migrations/20261002000000_1688_source_gate.sql): it hides every product until an admin records a comparable 1688 listing URL and marks it `MATCHED`.

RLS is enabled for all application tables; public catalog reads and guest order creation are allowed, while profiles and wishlists are scoped to the authenticated user.

The 1688 check is intentionally human-in-the-loop. The admin opens the
product image and 1688 Image Search, completes any 1688 login/CAPTCHA in the
browser, then stores the chosen result URL. The app never attempts to bypass
1688 verification or infer a match from a generic search result.

Every attempt can also be persisted in `source_1688_search_runs` (apply
[supabase/migrations/20261002010000_1688_search_runs.sql](supabase/migrations/20261002010000_1688_search_runs.sql)). The queue CLI exports a bounded batch and ingests browser/API results without publishing anything:

```powershell
node scripts/1688_search_queue.mjs --export --limit=25
node scripts/1688_search_queue.mjs --ingest --input=.tmp/1688-search-results.json --mark-review
```

`--mark-review` only records the best candidate as `REVIEW`; an administrator
must compare the logo, colour and silhouette and explicitly choose `MATCHED`
before a hat can be sold. Keep any 1688 API/service key server-side.

### Sync hat products from Custom POD

The import helper is [scripts/sync_hats_from_custom_pod.mjs](scripts/sync_hats_from_custom_pod.mjs). It imports only `PUBLISHED` products in the `Caps` or `Knit Hats` groups, upserts their variants, and does not delete existing destination rows.

The source project credentials are read from `D:\APP Dự Án\custom pod\.env.local`. Set the destination service-role key only for the command:

```powershell
$env:TARGET_SUPABASE_SERVICE_ROLE_KEY = Get-Clipboard
npm run db:sync-hats
```

Use `node scripts/sync_hats_from_custom_pod.mjs --dry-run` to inspect a run without writes, or add `--limit=10` for a small test. The source media URLs are kept in the imported product records.

## Vercel

Vercel uses the standard Vite build (`npm run build`) and the SPA rewrite in `vercel.json`. Add these production environment variables before deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
