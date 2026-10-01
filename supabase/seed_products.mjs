import { createClient } from '@supabase/supabase-js';
import { products, upcomingDropsSchedule } from '../src/data/storeData.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or the VITE_* equivalents) before seeding.');
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const money = (value) => Number(String(value ?? 0).replace(/[^0-9.-]/g, '')) || 0;

const productRows = products.map((product) => ({
  id: product.id,
  handle: product.handle,
  title: product.title,
  team: product.team ?? null,
  league: product.league ?? null,
  category: product.category ?? 'hats',
  silhouette: product.silhouette ?? null,
  price: money(product.price),
  images: product.images ?? [],
  thumbnail: product.thumbnail ?? null,
  secondary_image: product.secondaryImage ?? null,
  tags: product.tags ?? [],
  badge: product.badge ?? null,
  description: product.description ?? null,
  metadata: { source: 'src/data/storeData.js' },
  is_active: true,
}));

const variantRows = products.flatMap((product) => (product.sizes ?? []).map((variant) => ({
  id: String(variant.id),
  product_id: product.id,
  size: variant.size,
  price: money(variant.price || product.price),
  in_stock: Boolean(variant.inStock),
  inventory_count: variant.inStock ? 1 : 0,
})));

const dropRows = upcomingDropsSchedule.map((drop) => ({
  id: drop.id,
  drop_date: new Date(`${new Date().getFullYear()} ${drop.date.replace(/^\w+,\s*/, '')}`).toISOString().slice(0, 10),
  drop_time: drop.time,
  title: drop.title,
  teams: drop.teams,
  description: drop.desc,
  badge: drop.badge,
}));

for (const [table, rows] of [['products', productRows], ['product_variants', variantRows], ['drop_calendar', dropRows]]) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: table === 'products' ? 'id' : table === 'product_variants' ? 'id' : 'id' });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`Seeded ${rows.length} ${table}.`);
}
