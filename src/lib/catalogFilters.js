const SYNONYMS = Object.freeze({
  cap: ['cap', 'caps', 'hat', 'hats', 'headwear'],
  hats: ['cap', 'caps', 'hat', 'hats', 'headwear'],
  beanie: ['beanie', 'beanies', 'knit', 'knit hat', 'knit hats'],
  fitted: ['fitted', '59fifty', '59fifty fitted'],
  snapback: ['snapback', '9fifty', 'adjustable'],
});

export function normalizeCatalogText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function productTaxonomy(product = {}) {
  const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
  const taxonomy = metadata.source_taxonomy || product.taxonomy || {};
  const tags = Array.isArray(product.tags)
    ? product.tags
    : Array.isArray(metadata.source_tags) ? metadata.source_tags : [];
  return {
    category: product.category || taxonomy.category || '',
    group: product.productGroup || product.product_group || metadata.source_product_group || taxonomy.productGroup || '',
    type: product.type || metadata.source_type || taxonomy.accessoryType || '',
    league: product.league || taxonomy.league || '',
    team: product.team || taxonomy.team || '',
    silhouette: product.silhouette || taxonomy.silhouette || '',
    tags: [...new Set(tags.map(value => String(value).trim()).filter(Boolean))],
  };
}

export function productSizes(product = {}) {
  const variants = Array.isArray(product.sizes)
    ? product.sizes
    : Array.isArray(product.product_variants) ? product.product_variants : [];
  return [...new Set(variants.map(variant => String(variant.size || '').trim()).filter(Boolean))];
}

export function productHasStock(product = {}, size = '') {
  const variants = Array.isArray(product.sizes)
    ? product.sizes
    : Array.isArray(product.product_variants) ? product.product_variants : [];
  return variants.some(variant => {
    if (size && String(variant.size) !== String(size)) return false;
    return Boolean(variant.inStock ?? variant.in_stock) || Number(variant.inventory_count ?? variant.inventory ?? 0) > 0;
  });
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 0; i < left.length; i += 1) {
    const current = [i + 1];
    for (let j = 0; j < right.length; j += 1) {
      current.push(Math.min(
        current[j] + 1,
        previous[j + 1] + 1,
        previous[j] + (left[i] === right[j] ? 0 : 1),
      ));
    }
    previous = current;
  }
  return previous[right.length];
}

function queryTokens(query) {
  return normalizeCatalogText(query).split(' ').filter(Boolean);
}

function tokenAlternatives(token) {
  return [...new Set([token, ...(SYNONYMS[token] || [])])];
}

export function productSearchText(product = {}) {
  const taxonomy = productTaxonomy(product);
  const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
  return normalizeCatalogText([
    product.title,
    product.handle,
    product.description,
    product.badge,
    taxonomy.group,
    taxonomy.type,
    taxonomy.league,
    taxonomy.team,
    taxonomy.silhouette,
    taxonomy.tags.join(' '),
    metadata.source_sku,
  ].filter(Boolean).join(' '));
}

export function catalogSearchScore(product, query) {
  const tokens = queryTokens(query);
  if (!tokens.length) return 0;
  const title = normalizeCatalogText(product.title);
  const taxonomy = productTaxonomy(product);
  const haystack = productSearchText(product);
  let score = 0;
  for (const token of tokens) {
    const alternatives = tokenAlternatives(token);
    const matched = alternatives.find(candidate => haystack.includes(candidate) || haystack.split(' ').some(word => (
      candidate.length >= 4 && editDistance(candidate, word) <= (candidate.length > 7 ? 2 : 1)
    )));
    if (!matched) return 0;
    score += title.includes(matched) ? 120 : 25;
    if (normalizeCatalogText(taxonomy.team).includes(matched)) score += 80;
    if (normalizeCatalogText(taxonomy.league).includes(matched)) score += 60;
    if (normalizeCatalogText(taxonomy.group).includes(matched)) score += 40;
  }
  return score;
}

export function matchesCatalogSearch(product, query) {
  return !normalizeCatalogText(query) || catalogSearchScore(product, query) > 0;
}

export function deriveCatalogFacets(products = []) {
  const facets = {
    leagues: new Map(),
    teams: new Map(),
    groups: new Map(),
    silhouettes: new Map(),
    sizes: new Map(),
    tags: new Map(),
    minPrice: Number.POSITIVE_INFINITY,
    maxPrice: 0,
  };

  const increment = (map, value) => {
    const clean = String(value || '').trim();
    if (clean) map.set(clean, (map.get(clean) || 0) + 1);
  };

  for (const product of products) {
    const taxonomy = productTaxonomy(product);
    increment(facets.leagues, taxonomy.league);
    increment(facets.teams, taxonomy.team);
    increment(facets.groups, taxonomy.group);
    increment(facets.silhouettes, taxonomy.silhouette);
    taxonomy.tags.forEach(tag => increment(facets.tags, tag));
    productSizes(product).forEach(size => increment(facets.sizes, size));
    const price = Number(String(product.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
    facets.minPrice = Math.min(facets.minPrice, price);
    facets.maxPrice = Math.max(facets.maxPrice, price);
  }

  return {
    leagues: [...facets.leagues.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })),
    teams: [...facets.teams.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })),
    groups: [...facets.groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })),
    silhouettes: [...facets.silhouettes.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })),
    sizes: [...facets.sizes.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(value => ({ value, count: facets.sizes.get(value) })),
    tags: [...facets.tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count })),
    minPrice: Number.isFinite(facets.minPrice) ? facets.minPrice : 0,
    maxPrice: facets.maxPrice,
  };
}

export function applyCatalogFilters(products = [], filters = {}) {
  const query = String(filters.query || '').trim();
  const priceMin = filters.priceMin === '' || filters.priceMin == null ? null : Number(filters.priceMin);
  const priceMax = filters.priceMax === '' || filters.priceMax == null ? null : Number(filters.priceMax);
  const list = products.filter(product => {
    const taxonomy = productTaxonomy(product);
    const price = Number(String(product.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
    if (!matchesCatalogSearch(product, query)) return false;
    if (filters.league && normalizeCatalogText(taxonomy.league) !== normalizeCatalogText(filters.league)) return false;
    if (filters.team && !normalizeCatalogText(taxonomy.team).includes(normalizeCatalogText(filters.team))) return false;
    if (filters.group && normalizeCatalogText(taxonomy.group) !== normalizeCatalogText(filters.group)) return false;
    if (filters.silhouette && !normalizeCatalogText(taxonomy.silhouette).includes(normalizeCatalogText(filters.silhouette))) return false;
    if (filters.tag && !taxonomy.tags.some(tag => normalizeCatalogText(tag) === normalizeCatalogText(filters.tag))) return false;
    if (filters.size && !productSizes(product).includes(filters.size)) return false;
    if (filters.inStockOnly && !productHasStock(product, filters.size)) return false;
    if (priceMin != null && price < priceMin) return false;
    if (priceMax != null && price > priceMax) return false;
    return true;
  });
  const sort = filters.sortBy || 'newest';
  return list.sort((left, right) => {
    const leftPrice = Number(String(left.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
    const rightPrice = Number(String(right.price ?? 0).replace(/[^0-9.]/g, '')) || 0;
    if (sort === 'price-low') return leftPrice - rightPrice;
    if (sort === 'price-high') return rightPrice - leftPrice;
    if (sort === 'title-asc') return String(left.title).localeCompare(String(right.title));
    if (sort === 'relevance') return catalogSearchScore(right, query) - catalogSearchScore(left, query);
    return new Date(right.updated_at || right.updatedAt || 0) - new Date(left.updated_at || left.updatedAt || 0);
  });
}
