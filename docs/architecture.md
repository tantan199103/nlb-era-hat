# NLB ERA HAT — storefront architecture

This document describes the catalog, navigation and admin architecture after
the Custom POD data model was adapted for a hat-only storefront.

## Product experience

The storefront keeps the existing visual direction: near-black surfaces, red
drop accents, Barlow Condensed for display text and Inter for interface copy.
The information architecture is organized around how a customer chooses a hat:

```text
Home
├── Shop
│   ├── All hats
│   ├── Caps
│   ├── Knit hats
│   └── In stock now
├── Sports
│   ├── MLB / NBA / NFL / NHL / MiLB
│   └── league collections and teams
├── Teams
├── Collections
├── New & Trending
├── Calendar
└── Access Pass
```

The tree is stored as `store_menus` and `store_menu_items`, with separate
`HEADER`, `FOOTER` and `MOBILE_DRAWER` locations. This is the same useful
pattern used by Custom POD: merchandising can change the tree without a code
release, while each device location can keep its own information density.

## Storefront routes

The current app uses a small history router in `src/App.jsx` so Vercel can
serve the SPA while links remain crawlable and shareable.

| Route | Purpose | Query parameters |
| --- | --- | --- |
| `/` | Hero, latest drops, curated content | — |
| `/collections` | Hat catalog | `search`, `league`, `team`, `group`, `silhouette`, `tag`, `size`, `stock=1`, `priceMin`, `priceMax`, `sort` |
| `/product/:handle` | Product detail page | — |
| `/calendar` | Drop calendar | — |
| `/access-pass` | VIP membership and rewards | — |
| `/stores` | Store locator | — |
| `/track-order` | Shipment lookup | — |
| `/admin` | Authenticated control room | tab state is local to the session |

Navigation targets are parsed by `Navbar.jsx`; the same query names are passed
to `CollectionsPage.jsx`, so a menu link, search submission and filter chip
all produce the same catalog state.

## Catalog model and filtering

Products are in `products`; sizes and inventory are in
`product_variants`. Imported hats are identified by:

- `category = hats`
- `metadata.source_product_group = Caps` or `Knit Hats`
- `is_active = true` for the public catalog

`src/lib/catalogFilters.js` provides one shared taxonomy and search vocabulary
for the storefront and admin:

- normalized text without accents or punctuation;
- aliases such as `cap` → `hat`, `beanie` → `knit hat`, and `fitted` → `59FIFTY`;
- title, team, league, silhouette, tags, group and source SKU matching;
- typo tolerance through bounded edit distance;
- filters for league, team, product group, silhouette, tag, size, inventory and price;
- relevance, price and title sorting.

The first storefront request is bounded. `fetchCatalogPage()` applies filters,
counting and pagination in Supabase and returns 24 cards per page. Search uses
`fetchCatalogSearch()` with a small ranked result set for the command palette.
The browser retains the bundled catalog as a fallback when Supabase is not
configured or is temporarily unavailable.

Facet values currently derive from the bounded browser catalog for immediate
fallback rendering. For a production catalog with all 26k hats, add a
`catalog_facets` SQL view or RPC and use it for full league/team/size counts.

## Admin control room

`src/admin/AdminShell.jsx` is a separate authenticated surface with modules:

| Module | Responsibility | Persistence |
| --- | --- | --- |
| Overview | sales, stock and membership snapshot | reads current app state |
| Drop Inventory | search, league/status filtering, pagination, publish toggle, create, duplicate, delete | `products`, `product_variants` |
| Curated Drops | collection rules, hero, status and product membership | `store_collections`, `store_collection_products` |
| Dynamic Menus | nested links, visibility, target and location | `store_menus`, `store_menu_items` |
| Orders & Fulfillment | status and tracking workflow | `orders` and `order_items` |
| Access Pass VIP | members, tier and points | `profiles` (extend with a membership ledger when points need auditing) |
| Store Settings | currency, shipping, promotions and gateway flags | `store_settings` |

Admin entry is protected by Supabase Auth and `profiles.role = 'admin'`.
The migration adds `is_store_admin()` and RLS policies for catalog writes,
menus, collections, settings and audit records. The public storefront can
only read published menus and collections and active products.

Product create/update/delete and publish toggles now go through
`src/services/adminApi.js`; when Supabase is unavailable, the existing local
state fallback keeps the demo usable. Menu and collection saves preserve
drafts in the admin state even though storefront reads intentionally filter to
published rows.

## Custom POD alignment

The source project contributed four design decisions:

1. Menu trees are content data with separate header, footer and mobile locations.
2. Taxonomy is hierarchical: category → product group → sport/league → team.
3. Search is normalized and ranked instead of a plain title substring check.
4. The admin surface is a protected module with server-side catalog pagination.

The hat import is intentionally narrow. `scripts/sync_hats_from_custom_pod.mjs`
imports only published `Caps` and `Knit Hats`, upserts 26,074 products and
103,818 variants from the source project, and leaves source image URLs intact.
It never deletes destination rows.

## Deployment checklist

1. Apply both migrations in `supabase/migrations/` to the target project.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel.
3. Set `profiles.role = 'admin'` for the real admin user after Auth signup.
4. Verify `/collections`, `/product/:handle`, `/admin`, a search query and one
   checkout order on the Vercel deployment.
5. Keep the service role key only in the local sync command or a server-side
   secret; never put it in Vite client variables.
