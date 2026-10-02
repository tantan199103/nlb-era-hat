import { supabase } from '../lib/supabase';
import { catalogSearchScore } from '../lib/catalogFilters';

export const DEFAULT_CATALOG_PAGE_SIZE = 24;

function safeTerm(value) {
  return String(value || '').replace(/[%,().]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function numberPrice(value) {
  return Number(String(value ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

export function mapCatalogRow(row = {}) {
  const variants = (row.product_variants || []).map(variant => ({
    id: variant.id,
    size: variant.size,
    price: `$${Number(variant.price ?? row.price ?? 0).toFixed(2)}`,
    inStock: Boolean(variant.in_stock) || Number(variant.inventory_count || 0) > 0,
    inventoryCount: Number(variant.inventory_count || 0),
  }));
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    ...row,
    price: `$${numberPrice(row.price).toFixed(2)}`,
    secondaryImage: row.secondary_image,
    sizes: variants,
    productGroup: metadata.source_product_group || row.product_group || '',
    sourceSku: metadata.source_sku || row.sku || '',
    sku: metadata.source_sku || row.sku || '',
    source: metadata.source || '',
    source1688Status: row.source_1688_status || 'PENDING',
    source1688Url: row.source_1688_url || '',
    source1688Title: row.source_1688_title || '',
    source1688ImageUrl: row.source_1688_image_url || '',
    source1688Score: row.source_1688_score == null ? null : Number(row.source_1688_score),
    source1688CheckedAt: row.source_1688_checked_at || null,
    source1688CheckedBy: row.source_1688_checked_by || null,
    source1688Note: row.source_1688_note || '',
    status: row.status || (row.is_active === false ? 'DRAFT' : 'PUBLISHED'),
  };
}

function applySort(query, sortBy) {
  if (sortBy === 'price-low') return query.order('price', { ascending: true });
  if (sortBy === 'price-high') return query.order('price', { ascending: false });
  if (sortBy === 'title-asc') return query.order('title', { ascending: true });
  return query.order('updated_at', { ascending: false });
}

/**
 * Fetch one bounded catalog page. The previous storefront loaded every row
 * and every variant on first paint; this keeps the browser response bounded
 * and lets the database own filtering, ordering and count calculation.
 */
export async function fetchCatalogPage({
  page = 1,
  pageSize = DEFAULT_CATALOG_PAGE_SIZE,
  query = '',
  league = '',
  team = '',
  group = '',
  silhouette = '',
  tag = '',
  size = '',
  inStockOnly = false,
  priceMin = '',
  priceMax = '',
  sortBy = 'newest',
  category = 'hats',
  includeInactive = false,
  status = '',
  sourceStatus = '',
} = {}) {
  if (!supabase) return { products: [], count: 0, page, pageSize, source: 'fallback' };

  const boundedPage = Math.max(1, Number(page) || 1);
  const boundedSize = Math.max(1, Math.min(60, Number(pageSize) || DEFAULT_CATALOG_PAGE_SIZE));
  const start = (boundedPage - 1) * boundedSize;
  const end = start + boundedSize - 1;
  const hasVariantFilter = Boolean(size || inStockOnly);
  let select = hasVariantFilter ? '*, product_variants!inner(*)' : '*, product_variants(*)';
  let request = supabase.from('products').select(select, { count: 'exact' });
  if (includeInactive) {
    if (status === 'DRAFT') request = request.eq('is_active', false);
    if (status === 'PUBLISHED') request = request.eq('is_active', true);
  } else {
    request = request.eq('is_active', true);
    // This explicit predicate mirrors the database RLS policy and keeps the
    // sell gate visible in the client query as well as in the database.
    request = request.eq('source_1688_status', 'MATCHED');
  }
  if (sourceStatus) request = request.eq('source_1688_status', sourceStatus);
  if (category) request = request.eq('category', category);
  if (league) request = request.eq('league', league);
  if (team) request = request.ilike('team', `%${safeTerm(team)}%`);
  if (group) request = request.eq('metadata->>source_product_group', group);
  if (silhouette) request = request.ilike('silhouette', `%${safeTerm(silhouette)}%`);
  if (tag) request = request.contains('tags', [tag]);
  if (size) request = request.eq('product_variants.size', size);
  if (inStockOnly) request = request.gt('product_variants.inventory_count', 0);
  if (priceMin !== '' && priceMin != null) request = request.gte('price', Number(priceMin) || 0);
  if (priceMax !== '' && priceMax != null) request = request.lte('price', Number(priceMax) || 0);

  const term = safeTerm(query);
  if (term) {
    const pattern = `%${term}%`;
    request = request.or([
      `title.ilike.${pattern}`,
      `handle.ilike.${pattern}`,
      `team.ilike.${pattern}`,
      `league.ilike.${pattern}`,
      `silhouette.ilike.${pattern}`,
      `description.ilike.${pattern}`,
    ].join(','));
  }

  request = applySort(request, sortBy).range(start, end);
  const { data, count, error } = await request;
  if (error) throw new Error(`Catalog page failed: ${error.message}`);
  const products = (data || []).map(mapCatalogRow);
  return {
    products,
    count: Number(count || 0),
    page: boundedPage,
    pageSize: boundedSize,
    totalPages: Math.max(1, Math.ceil(Number(count || 0) / boundedSize)),
    source: 'supabase',
  };
}

export async function fetchCatalogSearch(query, { limit = 12, category = 'hats' } = {}) {
  const term = safeTerm(query);
  if (!term) return [];
  if (!supabase) return [];
  const pattern = `%${term}%`;
  let request = supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('is_active', true)
    .eq('source_1688_status', 'MATCHED')
    .eq('category', category)
    .or([
      `title.ilike.${pattern}`,
      `handle.ilike.${pattern}`,
      `team.ilike.${pattern}`,
      `league.ilike.${pattern}`,
      `silhouette.ilike.${pattern}`,
      `description.ilike.${pattern}`,
    ].join(','))
    .limit(Math.max(1, Math.min(40, limit * 3)));
  const { data, error } = await request;
  if (error) throw new Error(`Catalog search failed: ${error.message}`);
  return (data || [])
    .map(mapCatalogRow)
    .map(product => ({ product, score: catalogSearchScore(product, term) }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(result => result.product);
}

export async function fetchCatalogFacets({ category = 'hats' } = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('catalog_facets', { category_filter: category });
  if (error || !data) return null;
  return data;
}
