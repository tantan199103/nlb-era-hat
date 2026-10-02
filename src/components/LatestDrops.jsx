import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { Flame, Sparkles, Filter, ChevronRight } from 'lucide-react';
import CatalogAvailabilityNotice from './CatalogAvailabilityNotice';

export default function LatestDrops({ 
  products, 
  onAddToCart, 
  onQuickView, 
  onNavigateProduct,
  activeLeagueFilter, 
  activeTeamFilter,
  onResetFilters,
  wishlistIds = [],
  onToggleWishlist,
  currency = 'USD',
  catalogStatus = null,
  onBrowseCalendar,
  onNotify,
}) {
  const [selectedTab, setSelectedTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'ALL DROPS' },
    { id: 'fire', label: 'PLAYING WITH FIRE' },
    { id: 'blue-heaven', label: 'BLUE HEAVEN' },
    { id: 'milb', label: 'MINOR LEAGUE MONDAYS' },
    { id: 'pins', label: 'PINS & ACCESSORIES' }
  ];

  // Filter products based on selected tab or navbar mega menu filter
  const filteredProducts = useMemo(() => {
    let result = products;

    // Navbar filter takes priority if active
    if (activeTeamFilter) {
      result = result.filter(p => p.team.toLowerCase().includes(activeTeamFilter.toLowerCase()) || p.title.toLowerCase().includes(activeTeamFilter.toLowerCase()));
      return result;
    }

    if (activeLeagueFilter) {
      result = result.filter(p => p.league.toUpperCase() === activeLeagueFilter.toUpperCase());
      return result;
    }

    // Otherwise apply tab filter
    if (selectedTab === 'fire') {
      result = result.filter(p => p.title.toLowerCase().includes('playing with fire'));
    } else if (selectedTab === 'blue-heaven') {
      result = result.filter(p => p.title.toLowerCase().includes('blue heaven') || p.team.toLowerCase().includes('dodgers'));
    } else if (selectedTab === 'milb') {
      result = result.filter(p => p.league === 'MiLB' || p.title.toLowerCase().includes('minor league'));
    } else if (selectedTab === 'pins') {
      result = result.filter(p => p.category === 'pins');
    }

    return result;
  }, [products, selectedTab, activeLeagueFilter, activeTeamFilter]);

  const hasVerifiedCatalog = catalogStatus
    ? Number(catalogStatus.matchedCount) > 0
    : products.length > 0;
  const hasActiveCollectionFilter = Boolean(activeTeamFilter || activeLeagueFilter || selectedTab !== 'all');
  const emptyReason = catalogStatus?.error
    ? 'error'
    : hasVerifiedCatalog && hasActiveCollectionFilter ? 'filtered' : 'verification';

  return (
    <section id="latest-drops" className="py-14 sm:py-20 px-4 lg:px-8 max-w-[1440px] mx-auto border-b border-[#222222]">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#242424]">
        <div>
          <div className="flex items-center gap-2 text-[#e10600] font-bold text-xs uppercase tracking-widest mb-1.5">
            <Flame size={15} />
            <span>AUTHENTIC NEW ERA 59FIFTY DROPS</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            LATEST DROPS
          </h2>
        </div>

        {/* Active external filter notice */}
        {(activeTeamFilter || activeLeagueFilter) && (
          <div className="mt-3 md:mt-0 flex items-center gap-2 bg-[#202020] px-3 py-1.5 rounded-full border border-[#333333] text-xs">
            <span className="text-gray-400">Filtering:</span>
            <span className="font-bold text-[#ff3b30]">
              {activeTeamFilter || activeLeagueFilter}
            </span>
            <button 
              onClick={onResetFilters}
              className="text-gray-400 hover:text-white ml-2 text-xs font-bold"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {!activeTeamFilter && !activeLeagueFilter && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-display font-extrabold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedTab === tab.id
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'bg-[#181818] text-gray-300 hover:bg-[#242424] hover:text-white border border-[#2b2b2b]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid: 4 columns desktop, 3 tablet, 2 mobile */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.slice(0, 16).map((product) => (
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
        <CatalogAvailabilityNotice
          reason={emptyReason}
          pendingCount={catalogStatus?.pendingCount}
          onBrowseCalendar={onBrowseCalendar}
          onNotify={onNotify}
          onClearFilters={onResetFilters}
          compact
        />
      )}

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        {hasVerifiedCatalog ? (
          <button
            onClick={() => {
              setSelectedTab('all');
              if (onResetFilters) onResetFilters();
            }}
            className="btn-secondary px-8 py-3.5 text-sm inline-flex items-center gap-2 group cursor-pointer"
          >
            <span>VIEW ALL VERIFIED CAPS</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        ) : onBrowseCalendar ? (
          <button
            type="button"
            onClick={onBrowseCalendar}
            className="btn-secondary px-8 py-3.5 text-sm inline-flex items-center gap-2 group cursor-pointer"
          >
            <span>VIEW DROP CALENDAR</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        ) : null}
      </div>

    </section>
  );
}
