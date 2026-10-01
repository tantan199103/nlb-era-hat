import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal, ChevronDown, Check, X, ArrowUpDown, Sparkles } from 'lucide-react';

export default function CollectionsPage({ 
  products, 
  onAddToCart, 
  onQuickView, 
  onNavigateProduct,
  initialLeague = null,
  initialTeam = null,
  wishlistIds = [],
  onToggleWishlist,
  currency = 'USD'
}) {
  // Filter states
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedSilhouette, setSelectedSilhouette] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const leagues = ['MLB', 'NBA', 'NFL', 'NHL', 'MiLB', 'PINS'];
  const silhouettes = ['59FIFTY Fitted', '9FORTY A-Frame', 'Enamel Pin', 'Chain / Accessory'];
  const sizes = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2', '7 5/8', '7 3/4', '7 7/8', '8', 'ONE SIZE'];

  // Extract all unique teams
  const allTeams = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.team && p.team !== 'MLB Classic') set.add(p.team);
    });
    return Array.from(set).sort();
  }, [products]);

  // Apply filters and sort
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedLeague) {
      list = list.filter(p => p.league.toUpperCase() === selectedLeague.toUpperCase());
    }

    if (selectedTeam) {
      list = list.filter(p => p.team.toLowerCase().includes(selectedTeam.toLowerCase()) || p.title.toLowerCase().includes(selectedTeam.toLowerCase()));
    }

    if (selectedSilhouette !== 'all') {
      list = list.filter(p => p.silhouette.toLowerCase().includes(selectedSilhouette.toLowerCase()));
    }

    if (selectedSize !== 'all') {
      list = list.filter(p => p.sizes.some(s => s.size === selectedSize && (!inStockOnly || s.inStock)));
    }

    if (inStockOnly) {
      list = list.filter(p => p.sizes.some(s => s.inStock));
    }

    // Sort
    if (sortBy === 'newest') {
      // default list order
    } else if (sortBy === 'price-low') {
      list.sort((a, b) => parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', '')));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', '')));
    } else if (sortBy === 'title-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [products, selectedLeague, selectedTeam, selectedSilhouette, selectedSize, inStockOnly, sortBy]);

  const activeFiltersCount = [
    selectedLeague,
    selectedTeam,
    selectedSilhouette !== 'all' ? selectedSilhouette : null,
    selectedSize !== 'all' ? selectedSize : null,
    inStockOnly ? 'In Stock' : null
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedLeague(null);
    setSelectedTeam(null);
    setSelectedSilhouette('all');
    setSelectedSize('all');
    setInStockOnly(false);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 sm:py-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="mb-8 pb-6 border-b border-[#242424]">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#ff3b30] mb-1">
          LIDS HAT DROP CATALOG
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="font-display text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
            {selectedLeague ? `${selectedLeague} COLLECTION` : (selectedTeam ? `${selectedTeam} DROPS` : 'ALL RELEASES')}
          </h1>
          <span className="text-xs font-semibold text-gray-400">
            Showing {filteredProducts.length} limited-edition drops
          </span>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-[#141414] p-3.5 rounded-lg border border-[#242424]">
        
        {/* Left: Mobile Filter Trigger & Quick League Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <SlidersHorizontal size={14} />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          {/* Quick League Pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setSelectedLeague(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedLeague === null 
                  ? 'bg-white text-black' 
                  : 'bg-[#1e1e1e] text-gray-300 hover:text-white border border-[#2c2c2c]'
              }`}
            >
              All
            </button>
            {leagues.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLeague(selectedLeague === l ? null : l)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  selectedLeague === l 
                    ? 'bg-white text-black' 
                    : 'bg-[#1e1e1e] text-gray-300 hover:text-white border border-[#2c2c2c]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Sort By Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
            <ArrowUpDown size={14} />
            <span className="hidden sm:inline">Sort by:</span>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1.5 text-xs text-white font-bold uppercase tracking-wider focus:outline-none focus:border-white cursor-pointer"
          >
            <option value="newest">Newest Releases</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="title-asc">Alphabetical (A-Z)</option>
          </select>
        </div>

      </div>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-1">Active:</span>
          {selectedLeague && (
            <span className="bg-[#242424] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#383838]">
              League: {selectedLeague}
              <button onClick={() => setSelectedLeague(null)} className="hover:text-[#ff3b30]"><X size={12} /></button>
            </span>
          )}
          {selectedTeam && (
            <span className="bg-[#242424] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#383838]">
              Team: {selectedTeam}
              <button onClick={() => setSelectedTeam(null)} className="hover:text-[#ff3b30]"><X size={12} /></button>
            </span>
          )}
          {selectedSilhouette !== 'all' && (
            <span className="bg-[#242424] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#383838]">
              Fit: {selectedSilhouette}
              <button onClick={() => setSelectedSilhouette('all')} className="hover:text-[#ff3b30]"><X size={12} /></button>
            </span>
          )}
          {selectedSize !== 'all' && (
            <span className="bg-[#242424] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#383838]">
              Size: {selectedSize}
              <button onClick={() => setSelectedSize('all')} className="hover:text-[#ff3b30]"><X size={12} /></button>
            </span>
          )}
          {inStockOnly && (
            <span className="bg-[#242424] text-[#3ed660] text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#383838]">
              In Stock Only
              <button onClick={() => setInStockOnly(false)} className="hover:text-[#ff3b30]"><X size={12} /></button>
            </span>
          )}
          <button 
            onClick={clearAllFilters}
            className="text-xs text-[#ff3b30] hover:underline font-bold ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="flex gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0 bg-[#121212] border border-[#222222] rounded-lg p-5 space-y-6 sticky top-24">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <span className="font-display text-base font-black text-white uppercase tracking-wider">
              FILTERS
            </span>
            {activeFiltersCount > 0 && (
              <button onClick={clearAllFilters} className="text-[11px] text-[#ff3b30] hover:underline font-bold">
                Reset
              </button>
            )}
          </div>

          {/* Silhouette / Fit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2.5">
              Silhouette
            </h4>
            <div className="space-y-1.5 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input 
                  type="radio" 
                  name="silhouette" 
                  checked={selectedSilhouette === 'all'} 
                  onChange={() => setSelectedSilhouette('all')}
                  className="accent-[#e10600]"
                />
                <span>All Silhouettes</span>
              </label>
              {silhouettes.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input 
                    type="radio" 
                    name="silhouette" 
                    checked={selectedSilhouette === s} 
                    onChange={() => setSelectedSilhouette(s)}
                    className="accent-[#e10600]"
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size Pills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2.5">
              Size
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => setSelectedSize('all')}
                className={`py-1 rounded text-xs font-bold ${
                  selectedSize === 'all' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-gray-300 border border-[#2c2c2c]'
                }`}
              >
                All
              </button>
              {sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(selectedSize === sz ? 'all' : sz)}
                  className={`py-1 rounded text-xs font-bold transition-all ${
                    selectedSize === sz ? 'bg-white text-black font-extrabold' : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#282828] border border-[#2c2c2c]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-2 border-t border-[#242424]">
            <label className="flex items-center gap-2.5 text-xs text-gray-200 font-bold cursor-pointer">
              <input 
                type="checkbox" 
                checked={inStockOnly} 
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-[#3ed660] rounded"
              />
              <span>In Stock Only</span>
            </label>
          </div>

        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={onQuickView}
                  onNavigateProduct={onNavigateProduct}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  currency={currency}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#141414] rounded-lg border border-[#262626]">
              <p className="text-base text-gray-300 font-bold mb-2">No drops match the selected filters.</p>
              <p className="text-xs text-gray-500 mb-6">Try clearing some filters or searching another team.</p>
              <button onClick={clearAllFilters} className="btn-primary text-xs py-2 px-6">
                CLEAR ALL FILTERS
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fade-in">
          <div className="fixed inset-0 bg-black/80" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative w-[85%] max-w-[320px] bg-[#141414] border-l border-[#2e2e2e] h-full p-5 overflow-y-auto flex flex-col justify-between z-10 animate-slide-in-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#252525] mb-5">
                <span className="font-display text-lg font-black text-white uppercase">FILTERS</span>
                <button onClick={() => setMobileFilterOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* League filter */}
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">League</h4>
                <div className="flex flex-wrap gap-1.5">
                  {leagues.map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLeague(selectedLeague === l ? null : l)}
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        selectedLeague === l ? 'bg-white text-black' : 'bg-[#202020] text-gray-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size filter */}
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Size</h4>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? 'all' : sz)}
                      className={`py-1 rounded text-xs font-bold ${
                        selectedSize === sz ? 'bg-white text-black' : 'bg-[#202020] text-gray-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setMobileFilterOpen(false)}
              className="btn-flame w-full py-3 text-xs mt-6"
            >
              SHOW {filteredProducts.length} PRODUCTS
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
