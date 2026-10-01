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

The project currently contains 34 products, 304 product variants, and 4 upcoming drops. RLS is enabled for all application tables; public catalog reads and guest order creation are allowed, while profiles and wishlists are scoped to the authenticated user.

## Vercel

Vercel uses the standard Vite build (`npm run build`) and the SPA rewrite in `vercel.json`. Add these production environment variables before deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
