import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Flame, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { catalogSearchScore, matchesCatalogSearch } from '../lib/catalogFilters';
import { fetchCatalogSearch } from '../services/catalogApi';
import { formatPrice } from '../utils/currency';

const POPULAR_SEARCHES = ['New Era', 'Yankees', 'Dodgers', '59FIFTY', 'Knit Hats', 'MLB'];

export default function SearchModal({ isOpen, onClose, products = [], onSelectProduct, onBrowseSearch, currency = 'USD' }) {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 60);
    else { setQuery(''); setRemoteResults(null); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim() || !supabase) return undefined;
    let cancelled = false;
    setRemoteResults(null);
    const timer = setTimeout(async () => {
      try {
        const rows = await fetchCatalogSearch(query, { limit: 12 });
        if (!cancelled) setRemoteResults(rows);
      } catch {
        if (!cancelled) setRemoteResults([]);
      }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOpen, query]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  if (!isOpen) return null;

  const localResults = products
    .filter(product => matchesCatalogSearch(product, query))
    .map(product => ({ product, score: catalogSearchScore(product, query) }))
    .filter(result => !query.trim() || result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12)
    .map(result => result.product);
  const results = remoteResults ?? localResults;

  const choose = (product) => { onSelectProduct?.(product); onClose(); };
  const submitSearch = () => { if (query.trim()) { onBrowseSearch?.(query.trim()); onClose(); } };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') return onClose();
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)); }
    if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); results[activeIndex] ? choose(results[activeIndex]) : submitSearch(); }
  };

  return <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 animate-fade-in"><button aria-label="Close search" className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} /><div className="relative z-10 w-full max-w-[780px] overflow-hidden rounded-xl border border-[#2e2e2e] bg-[#141414] shadow-2xl"><div className="flex items-center gap-3 border-b border-[#252525] p-4 sm:p-5"><Search size={22} className="flex-shrink-0 text-[#e10600]" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Search hats, teams, leagues, SKUs…" className="flex-1 bg-transparent text-base font-bold text-white placeholder:text-gray-500 focus:outline-none" />{query && <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-white" aria-label="Clear search"><X size={18} /></button>}<button onClick={onClose} className="rounded bg-[#202020] px-2 py-1 text-xs font-bold text-gray-400 hover:text-white">ESC</button></div>
    <div className="max-h-[65vh] overflow-y-auto p-5 custom-scroll">{!query.trim() ? <div><div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400"><Flame size={14} className="text-[#ff3b30]" /> Popular searches</div><div className="flex flex-wrap gap-2">{POPULAR_SEARCHES.map(term => <button key={term} onClick={() => setQuery(term)} className="rounded-full border border-[#333] bg-[#1c1c1c] px-3 py-1.5 text-xs font-semibold text-gray-300 hover:border-white hover:text-white">{term}</button>)}</div><div className="mt-6 border-t border-[#252525] pt-4 text-xs leading-5 text-gray-500">Search recognizes team names, leagues, hat silhouettes, source tags and SKU metadata. Use ↑/↓ and Enter to choose a result.</div></div> : <div>{results.length ? <div className="space-y-1">{results.map((product, index) => <button key={product.id} onClick={() => choose(product)} className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${activeIndex === index ? 'bg-[#242424]' : 'hover:bg-[#1d1d1d]'}`}><img src={product.thumbnail} alt="" className="h-14 w-14 rounded border border-[#333] bg-[#0f0f0f] object-contain" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs font-bold text-white">{product.title}</strong><small className="mt-1 block truncate text-[11px] text-gray-500">{product.team || product.league || product.productGroup || 'Hat'} · {product.silhouette || 'Headwear'}</small></span><span className="text-xs font-bold text-white">{formatPrice(product.price, currency)}</span><ArrowRight size={14} className="text-gray-600" /></button>)}</div> : <div className="py-10 text-center"><Search size={28} className="mx-auto mb-3 text-gray-600" /><p className="text-sm font-bold text-gray-300">No matching hats</p><p className="mt-1 text-xs text-gray-500">Try a team, league, silhouette or SKU.</p></div>}<button onClick={submitSearch} className="mt-4 flex w-full items-center justify-center gap-2 border-t border-[#252525] pt-4 text-xs font-bold uppercase tracking-wider text-[#ff3b30] hover:underline">View all results for “{query}” <ArrowRight size={14} /></button></div>}</div></div></div>;
}
