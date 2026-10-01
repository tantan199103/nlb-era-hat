import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import { applyCatalogFilters, deriveCatalogFacets } from '../lib/catalogFilters';
import { fetchCatalogFacets, fetchCatalogPage } from '../services/catalogApi';

const initialState = (initialLeague, initialTeam, initialSearch, initialGroup = '', initialSize = '', initialInStockOnly = false, initialSort = 'newest') => ({
  query: initialSearch || '', league: initialLeague || '', team: initialTeam || '', group: initialGroup || '', silhouette: '', size: initialSize || '', tag: '',
  inStockOnly: Boolean(initialInStockOnly), priceMin: '', priceMax: '', sortBy: initialSort || 'newest',
});

function FilterSelect({ label, value, onChange, options, allLabel = 'All' }) {
  return <label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-[#333] bg-[#1a1a1a] px-2.5 py-2 text-xs font-semibold text-white focus:border-white focus:outline-none"><option value="">{allLabel}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.value} ({option.count})</option>)}</select></label>;
}

export default function CollectionsPage({ products = [], onAddToCart, onQuickView, onNavigateProduct, initialLeague = null, initialTeam = null, initialSearch = '', initialGroup = '', initialSize = '', initialInStockOnly = false, initialSort = 'newest', wishlistIds = [], onToggleWishlist, currency = 'USD' }) {
  const [filters, setFilters] = useState(() => initialState(initialLeague, initialTeam, initialSearch, initialGroup, initialSize, initialInStockOnly, initialSort));
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [remotePage, setRemotePage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remoteFacets, setRemoteFacets] = useState(null);

  useEffect(() => {
    setFilters((current) => ({ ...current, league: initialLeague || '', team: initialTeam || '', query: initialSearch || '', group: initialGroup || '', size: initialSize || '', inStockOnly: Boolean(initialInStockOnly), sortBy: initialSort || 'newest' }));
    setPage(1);
  }, [initialLeague, initialTeam, initialSearch, initialGroup, initialSize, initialInStockOnly, initialSort]);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;
    setRemotePage(null);
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const result = await fetchCatalogPage({ ...filters, page, pageSize: 24 });
        if (!cancelled) setRemotePage(result);
      } catch {
        if (!cancelled) setError('Không tải được catalog trực tiếp. Đang hiển thị dữ liệu đã có.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 160);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters, page]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    fetchCatalogFacets().then((result) => {
      if (active && result) setRemoteFacets(result);
    });
    return () => { active = false; };
  }, []);

  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const localProducts = useMemo(() => applyCatalogFilters(products, filters), [products, filters]);
  const visibleProducts = supabase && remotePage ? remotePage.products : localProducts;
  const localFacets = useMemo(() => deriveCatalogFacets(products), [products]);
  const facets = remoteFacets || localFacets;
  const activeFilterEntries = Object.entries(filters).filter(([key, value]) => value && !['sortBy', 'query', 'inStockOnly'].includes(key));
  const activeCount = activeFilterEntries.length + (filters.query ? 1 : 0) + (filters.inStockOnly ? 1 : 0);
  const total = remotePage?.count ?? localProducts.length;
  const totalPages = remotePage?.totalPages ?? 1;
  const clearFilters = () => { setPage(1); setFilters(initialState('', '', '', '', '', false, 'newest')); };
  const options = { leagues: facets.leagues, teams: facets.teams, groups: facets.groups, silhouettes: facets.silhouettes, sizes: facets.sizes, tags: facets.tags };

  const renderFilters = () => <div className="space-y-4">
    <FilterSelect label="League" value={filters.league} onChange={(value) => updateFilter('league', value)} options={options.leagues} />
    <FilterSelect label="Team" value={filters.team} onChange={(value) => updateFilter('team', value)} options={options.teams} />
    <FilterSelect label="Product group" value={filters.group} onChange={(value) => updateFilter('group', value)} options={options.groups} />
    <FilterSelect label="Silhouette" value={filters.silhouette} onChange={(value) => updateFilter('silhouette', value)} options={options.silhouettes} />
    <FilterSelect label="Size" value={filters.size} onChange={(value) => updateFilter('size', value)} options={options.sizes} />
    <FilterSelect label="Tag" value={filters.tag} onChange={(value) => updateFilter('tag', value)} options={options.tags.slice(0, 14)} />
    <div className="grid grid-cols-2 gap-2 border-t border-[#262626] pt-4"><label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Min price</span><input value={filters.priceMin} onChange={(event) => updateFilter('priceMin', event.target.value)} inputMode="decimal" placeholder="$0" className="rounded border border-[#333] bg-[#1a1a1a] px-2.5 py-2 text-xs text-white focus:border-white focus:outline-none" /></label><label className="grid gap-1.5"><span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Max price</span><input value={filters.priceMax} onChange={(event) => updateFilter('priceMax', event.target.value)} inputMode="decimal" placeholder="$250" className="rounded border border-[#333] bg-[#1a1a1a] px-2.5 py-2 text-xs text-white focus:border-white focus:outline-none" /></label></div>
    <label className="flex cursor-pointer items-center gap-2 border-t border-[#262626] pt-4 text-xs font-semibold text-gray-200"><input type="checkbox" checked={filters.inStockOnly} onChange={(event) => updateFilter('inStockOnly', event.target.checked)} className="h-4 w-4 accent-[#3ed660]" /><span>Only show in-stock sizes</span></label>
  </div>;

  return <div className="mx-auto max-w-[1440px] animate-fade-in px-4 py-8 sm:py-12 lg:px-8">
    <div className="mb-7 border-b border-[#242424] pb-6"><div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff3b30]">Headwear catalog / live inventory</div><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">{filters.query ? `Search: ${filters.query}` : filters.team ? `${filters.team} drops` : filters.league ? `${filters.league} collection` : 'All hat releases'}</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500">Browse caps and knit hats by team, league, silhouette, size and availability. Filters are shared with search and the admin catalog.</p></div><span className="text-xs font-semibold text-gray-400">{loading ? 'Updating…' : `${total.toLocaleString()} products`}</span></div></div>

    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#242424] bg-[#141414] p-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="Search team, hat, SKU, league or tag…" className="w-full rounded border border-[#333] bg-[#0f0f0f] py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-gray-600 focus:border-white focus:outline-none" /></label><div className="flex items-center gap-2"><button onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-1.5 rounded border border-[#333] bg-[#1d1d1d] px-3 py-2 text-xs font-bold text-gray-200 lg:hidden"><SlidersHorizontal size={14} /> Filters {activeCount > 0 ? `(${activeCount})` : ''}</button><div className="flex items-center gap-2 text-xs text-gray-500"><ArrowUpDown size={14} /><span className="hidden sm:inline">Sort</span></div><select value={filters.sortBy} onChange={(event) => updateFilter('sortBy', event.target.value)} className="rounded border border-[#333] bg-[#1d1d1d] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white focus:border-white focus:outline-none"><option value="newest">Newest</option><option value="relevance">Relevance</option><option value="price-low">Price: low</option><option value="price-high">Price: high</option><option value="title-asc">A–Z</option></select></div></div>

    {activeCount > 0 && <div className="mb-6 flex flex-wrap items-center gap-2"><span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">Active</span>{filters.query && <button onClick={() => updateFilter('query', '')} className="flex items-center gap-1 rounded-full border border-[#383838] bg-[#242424] px-2.5 py-1 text-xs text-white">Search: {filters.query} <X size={12} /></button>}{activeFilterEntries.map(([key, value]) => <button key={key} onClick={() => updateFilter(key, '')} className="flex items-center gap-1 rounded-full border border-[#383838] bg-[#242424] px-2.5 py-1 text-xs text-white">{key}: {value} <X size={12} /></button>)}{filters.inStockOnly && <button onClick={() => updateFilter('inStockOnly', false)} className="flex items-center gap-1 rounded-full border border-emerald-800/50 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300">In stock <X size={12} /></button>}<button onClick={clearFilters} className="ml-2 text-xs font-bold text-[#ff3b30] hover:underline">Clear all</button></div>}

    <div className="flex items-start gap-8"><aside className="sticky top-24 hidden w-[260px] flex-shrink-0 rounded-lg border border-[#222] bg-[#121212] p-5 lg:block"><div className="mb-4 flex items-center justify-between border-b border-[#242424] pb-3"><span className="font-display text-base font-black uppercase tracking-wider text-white">Filters</span>{activeCount > 0 && <button onClick={clearFilters} className="text-[11px] font-bold text-[#ff3b30] hover:underline">Reset</button>}</div>{renderFilters()}</aside><div className="min-w-0 flex-1">{error && <div className="mb-4 rounded border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">{error}</div>}{visibleProducts.length > 0 ? <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onQuickView={onQuickView} onNavigateProduct={onNavigateProduct} isWishlisted={wishlistIds.includes(product.id)} onToggleWishlist={onToggleWishlist} currency={currency} />)}</div> : <div className="rounded-lg border border-[#262626] bg-[#141414] py-20 text-center"><p className="mb-2 text-base font-bold text-gray-300">No hats match these filters.</p><p className="mb-6 text-xs text-gray-500">Try a broader team, league or price range.</p><button onClick={clearFilters} className="btn-primary px-6 py-2 text-xs">Clear all filters</button></div>}{totalPages > 1 && <div className="mt-8 flex items-center justify-between border-t border-[#242424] pt-4"><span className="text-xs text-gray-500">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex items-center gap-1 rounded border border-[#333] px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"><ChevronLeft size={14} /> Previous</button><button disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="flex items-center gap-1 rounded border border-[#333] px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40">Next <ChevronRight size={14} /></button></div></div>}</div></div>

    {mobileFilterOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close filters" onClick={() => setMobileFilterOpen(false)} className="absolute inset-0 bg-black/80" /><aside className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto border-l border-[#2e2e2e] bg-[#141414] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between border-b border-[#252525] pb-4"><span className="font-display text-lg font-black uppercase text-white">Filters</span><button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button></div>{renderFilters()}<button onClick={() => setMobileFilterOpen(false)} className="btn-flame mt-8 w-full py-3 text-xs">Show {total.toLocaleString()} products</button></aside></div>}
  </div>;
}
