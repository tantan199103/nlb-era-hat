import React from 'react';
import ProductCard from './ProductCard';
import { Sparkles, ChevronRight } from 'lucide-react';

export default function PinsAccessories({ 
  products, 
  onAddToCart, 
  onQuickView, 
  onNavigateProduct,
  wishlistIds = [],
  onToggleWishlist,
  currency = 'USD'
}) {
  const pinProducts = products.filter(p => p.category === 'pins');

  return (
    <section id="pins-section" className="py-14 sm:py-20 px-4 lg:px-8 max-w-[1440px] mx-auto border-b border-[#222222]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#242424]">
        <div>
          <div className="flex items-center gap-1.5 text-[#3ed660] font-bold text-xs uppercase tracking-widest mb-1.5">
            <Sparkles size={14} />
            <span>HAT CUSTOMIZATION ESSENTIALS</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            SHOP NEW PINS & CHAINS
          </h2>
        </div>

        <button 
          onClick={() => {
            const el = document.getElementById('latest-drops');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-3 sm:mt-0 text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider flex items-center gap-1"
        >
          <span>VIEW ALL ACCESSORIES</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {pinProducts.map((product) => (
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

    </section>
  );
}
