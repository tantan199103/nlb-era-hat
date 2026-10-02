import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const TARGET_URL = process.env.TARGET_SUPABASE_URL || 'https://bnygkahseqvuiiurzwut.supabase.co';
const TARGET_KEY = process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_ENV_FILE = process.env.CUSTOM_POD_ENV_FILE || 'D:\\APP Dự Án\\custom pod\\.env.local';
const PAGE_SIZE = Math.max(50, Math.min(500, Number(process.env.SYNC_PAGE_SIZE || 250)));
const VARIANT_CHUNK_SIZE = Math.max(25, Math.min(100, Number(process.env.SYNC_VARIANT_CHUNK_SIZE || 75)));
const WRITE_BATCH_SIZE = Math.max(25, Math.min(250, Number(process.env.SYNC_WRITE_BATCH_SIZE || 100)));
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='));
const PRODUCT_LIMIT = LIMIT_ARG ? Math.max(0, Number(LIMIT_ARG.slice('--limit='.length)) || 0) : 0;

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function hashHex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function stableProductId(sourceId) {
  // Keep the value well below Number.MAX_SAFE_INTEGER while avoiding the
  // existing 10^12-range IDs in the destination catalog.
  const suffix = BigInt(`0x${hashHex(sourceId).slice(0, 10)}`);
  return (20_000_000_000_000n + suffix).toString();
}

function stableVariantId(sourceProductId, label) {
  return `cp-${hashHex(`${sourceProductId}|${label}`).slice(0, 24)}`;
}

function cleanText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function humanizeSlug(value) {
  const text = cleanText(value);
  if (!text) return null;
  return text
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTaxonomy(product) {
  return product?.taxonomy && typeof product.taxonomy === 'object' ? product.taxonomy : {};
}

function deriveLeague(product, taxonomy, sourceTags) {
  const text = `${taxonomy.league || ''} ${sourceTags.join(' ')} ${product.title || ''} ${product.subtitle || ''}`.toLowerCase();
  const known = [
    ['mlb', 'MLB'], ['baseball', 'MLB'],
    ['nba', 'NBA'], ['basketball', 'NBA'],
    ['nfl', 'NFL'], ['football', 'NFL'],
    ['nhl', 'NHL'], ['hockey', 'NHL'],
    ['mls', 'MLS'], ['soccer', 'MLS'],
    ['ncaa', 'NCAA'], ['college', 'NCAA'],
  ];
  return known.find(([needle]) => text.includes(needle))?.[1] || 'OTHER';
}

function deriveSilhouette(product) {
  const text = `${product.title || ''} ${product.subtitle || ''} ${product.description || ''}`.toLowerCase();
  if (/39thirty|stretch/.test(text)) return '39THIRTY Stretch';
  if (/59fifty|fitted/.test(text)) return '59FIFTY Fitted';
  if (/9forty|a[- ]?frame/.test(text)) return '9FORTY A-Frame';
  if (/9fifty|snapback/.test(text)) return '9FIFTY Snapback';
  if (/trucker/.test(text)) return 'Trucker';
  if (/strapback/.test(text)) return 'Strapback';
  if (/beanie|knit|skully|toque/.test(text)) return 'Knit Hat';
  if (/bucket/.test(text)) return 'Bucket Hat';
  return 'Cap';
}

function imageUrls(product) {
  const media = Array.isArray(product.media) ? product.media : [];
  const urls = [
    product.image,
    ...media.map((item) => item?.url),
  ].filter((value) => /^https?:\/\//i.test(String(value || '').trim()));
  return [...new Set(urls.map((value) => String(value).trim()))];
}

function optionValue(options, pattern) {
  if (!options || typeof options !== 'object') return null;
  const key = Object.keys(options).find((candidate) => pattern.test(candidate));
  return key ? cleanText(options[key]) : null;
}

function variantLabel(variant) {
  const options = variant?.option_values && typeof variant.option_values === 'object'
    ? variant.option_values
    : {};
  const size = optionValue(options, /size|fit/i);
  const color = optionValue(options, /colou?r|colourway/i);
  if (size && color && size.toUpperCase() === 'ONE SIZE') return `${size} / ${color}`;
  return size || color || 'ONE SIZE';
}

function normalizeProduct(product) {
  const taxonomy = getTaxonomy(product);
  const images = imageUrls(product);
  const sourceId = String(product.id);
  const sourceTags = Array.isArray(product.tags) ? product.tags.filter(Boolean).map(String) : [];
  const metadata = {
    source: 'custom-pod',
    source_product_id: sourceId,
    source_sku: cleanText(product.sku),
    source_product_group: cleanText(product.product_group),
    source_type: cleanText(product.type),
    source_taxonomy: taxonomy,
    source_tags: sourceTags,
    source_updated_at: product.updated_at || null,
    source_inventory: Number(product.inventory || 0),
    source_seo_status: cleanText(product.seo_status),
  };
  return {
    id: stableProductId(sourceId),
    handle: `cp-${String(product.handle || sourceId)}`,
    title: String(product.title || product.handle || sourceId),
    team: humanizeSlug(taxonomy.team) || 'General',
    league: deriveLeague(product, taxonomy, sourceTags),
    category: 'hats',
    silhouette: deriveSilhouette(product),
    price: Number(product.price || 0),
    images,
    thumbnail: images[0] || null,
    secondary_image: images[1] || null,
    tags: sourceTags,
    badge: cleanText(product.badge),
    description: cleanText(product.description || product.subtitle),
    metadata,
    // The destination database owns publication now. New/changed source
    // products enter the 1688 verification queue and the database trigger
    // prevents an unverified row from becoming publicly active. Do not send
    // is_active here: including it would reset an administrator's MATCHED
    // decision every time the source catalog is synchronized.
    created_at: product.created_at || undefined,
    updated_at: product.updated_at || undefined,
    _source_id: sourceId,
  };
}

function normalizeVariants(product, sourceVariants) {
  const targetProductId = stableProductId(product.id);
  const variants = Array.isArray(sourceVariants) ? sourceVariants.filter((item) => item?.status === 'ACTIVE') : [];
  const groups = new Map();

  for (const sourceVariant of variants) {
    const size = variantLabel(sourceVariant);
    const available = Math.max(0, Number(sourceVariant.inventory || 0) - Number(sourceVariant.reserved_inventory || 0));
    const price = Number(sourceVariant.price || product.price || 0);
    const key = size.toUpperCase();
    const existing = groups.get(key) || {
      id: stableVariantId(product.id, size),
      product_id: targetProductId,
      size,
      price,
      in_stock: false,
      inventory_count: 0,
    };
    existing.price = Math.min(existing.price, price);
    existing.in_stock = existing.in_stock || available > 0;
    existing.inventory_count += available;
    groups.set(key, existing);
  }

  if (!groups.size) {
    const inventory = Math.max(0, Number(product.inventory || 0));
    groups.set('ONE SIZE', {
      id: stableVariantId(product.id, 'ONE SIZE'),
      product_id: targetProductId,
      size: 'ONE SIZE',
      price: Number(product.price || 0),
      in_stock: inventory > 0,
      inventory_count: inventory,
    });
  }

  return [...groups.values()];
}

async function fetchAllProducts(source) {
  const products = [];
  const pageSize = PRODUCT_LIMIT ? Math.min(PAGE_SIZE, PRODUCT_LIMIT) : PAGE_SIZE;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = source
      .from('pod_products')
      .select('id,handle,title,subtitle,description,price,status,badge,type,image,inventory,sku,media,tags,product_group,taxonomy,seo_status,created_at,updated_at')
      .eq('status', 'PUBLISHED')
      .in('product_group', ['Caps', 'Knit Hats'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    const { data, error } = await query;
    if (error) throw new Error(`Source products page ${offset}: ${error.message}`);
    const page = data || [];
    products.push(...page);
    console.log(`Fetched ${products.length} hat products from custom pod.`);
    if (page.length < pageSize || (PRODUCT_LIMIT && products.length >= PRODUCT_LIMIT)) break;
  }
  return PRODUCT_LIMIT ? products.slice(0, PRODUCT_LIMIT) : products;
}

async function fetchVariants(source, products) {
  const variantsByProduct = new Map();
  for (let start = 0; start < products.length; start += VARIANT_CHUNK_SIZE) {
    const ids = products.slice(start, start + VARIANT_CHUNK_SIZE).map((product) => product.id);
    const { data, error } = await source
      .from('pod_product_variants')
      .select('id,product_id,option_values,price,inventory,reserved_inventory,status')
      .in('product_id', ids);
    if (error) throw new Error(`Source variants chunk ${start}: ${error.message}`);
    for (const variant of data || []) {
      const list = variantsByProduct.get(variant.product_id) || [];
      list.push(variant);
      variantsByProduct.set(variant.product_id, list);
    }
    console.log(`Fetched variants for ${Math.min(start + VARIANT_CHUNK_SIZE, products.length)}/${products.length} products.`);
  }
  return variantsByProduct;
}

async function upsertBatches(client, table, rows, onConflict) {
  for (let start = 0; start < rows.length; start += WRITE_BATCH_SIZE) {
    const batch = rows.slice(start, start + WRITE_BATCH_SIZE);
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`Destination ${table} batch ${start}: ${error.message}`);
    console.log(`Upserted ${table}: ${Math.min(start + batch.length, rows.length)}/${rows.length}.`);
  }
}

async function deactivateNonHatProducts(client) {
  // This destination is a hat-only storefront. Keep legacy rows recoverable,
  // but prevent accessories or other categories from leaking into the public catalog.
  const { data, error } = await client
    .from('products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .neq('category', 'hats')
    .eq('is_active', true)
    .select('id');
  if (error) throw new Error(`Destination non-hat cleanup failed: ${error.message}`);
  if (data?.length) console.log(`Deactivated non-hat products: ${data.length}.`);
}

async function main() {
  const sourceEnv = parseEnvFile(SOURCE_ENV_FILE);
  const sourceUrl = process.env.CUSTOM_POD_SUPABASE_URL || sourceEnv.SUPABASE_URL || sourceEnv.VITE_SUPABASE_URL;
  const sourceKey = process.env.CUSTOM_POD_SUPABASE_SERVICE_ROLE_KEY || sourceEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!sourceUrl || !sourceKey) throw new Error(`Missing source Supabase credentials in ${SOURCE_ENV_FILE}.`);
  if (!TARGET_KEY) throw new Error('Set TARGET_SUPABASE_SERVICE_ROLE_KEY before running the sync.');

  const source = createClient(sourceUrl, sourceKey, { auth: { persistSession: false } });
  const target = createClient(TARGET_URL, TARGET_KEY, { auth: { persistSession: false } });
  const sourceProducts = await fetchAllProducts(source);
  const sourceVariants = await fetchVariants(source, sourceProducts);
  const targetProducts = sourceProducts.map(normalizeProduct);
  const targetVariants = sourceProducts.flatMap((product) => normalizeVariants(product, sourceVariants.get(product.id)));

  console.log(JSON.stringify({
    sourceUrl,
    targetUrl: TARGET_URL,
    dryRun: DRY_RUN,
    productLimit: PRODUCT_LIMIT || null,
    products: targetProducts.length,
    variants: targetVariants.length,
    sample: targetProducts.slice(0, 2).map(({ _source_id, ...product }) => ({ ...product, source_id: _source_id })),
  }, null, 2));

  if (DRY_RUN) return;

  await upsertBatches(target, 'products', targetProducts.map(({ _source_id, ...product }) => product), 'id');
  await upsertBatches(target, 'product_variants', targetVariants, 'id');
  await deactivateNonHatProducts(target);
  console.log('Hat catalog sync completed. Existing hat rows were retained; non-hat rows are inactive.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
