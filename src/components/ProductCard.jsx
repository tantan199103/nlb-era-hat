import React, { useState } from 'react';
import { ShoppingBag, Check, Eye, AlertCircle, Heart } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { selectedProductPrice } from '../lib/productPricing';

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onQuickView, 
  onNavigateProduct,
  isWishlisted = false,
  onToggleWishlist,
  currency = 'USD'
}) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [showError, setShowError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSizeClick = (sizeObj) => {
    if (!sizeObj.inStock) return;
    setSelectedSize(sizeObj.size);
    setShowError(false);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    // For pins and accessories with ONE SIZE, auto select
    const effectiveSize = selectedSize || (product.sizes?.length === 1 ? product.sizes[0].size : null);

    if (!effectiveSize) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsAdded(true);
    
    if (onAddToCart) {
      onAddToCart(product, effectiveSize);
    }

    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  const handleOpenProduct = () => {
    if (onNavigateProduct) {
      onNavigateProduct(product);
    } else if (onQuickView) {
      onQuickView(product);
    }
  };

  // Determine current display image
  const displayImage = isHovered && product.secondaryImage 
    ? product.secondaryImage 
    : product.thumbnail;
  const displayPrice = selectedProductPrice(product, selectedSize);

  return (
    <div className="product-card group bg-[#141414] border border-[#222222] hover:border-[#383838] transition-all duration-300 rounded-md overflow-hidden flex flex-col justify-between">
      
      {/* Top Image Container */}
      <div 
        className="product-image-container cursor-pointer relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOpenProduct}
      >
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
              product.badge === 'HOT DROP' 
                ? 'bg-[#e10600] text-white shadow-md shadow-red-900/40' 
                : (product.badge === 'EXCLUSIVE' ? 'bg-[#2563eb] text-white' : 'bg-[#e5e5e5] text-black')
            }`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Top Right Action Icons: Heart & Eye */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist(product);
            }}
            className={`p-2 rounded-full transition-all duration-200 shadow-md backdrop-blur-sm ${
              isWishlisted 
                ? 'bg-black text-[#ff3b30] opacity-100' 
                : 'bg-[#1c1c1c]/80 hover:bg-black text-white opacity-0 group-hover:opacity-100'
            }`}
            title={isWishlisted ? 'In your Vault' : 'Save to Vault'}
            aria-label="Wishlist"
          >
            <Heart size={14} className={isWishlisted ? 'fill-[#ff3b30]' : ''} />
          </button>

          {/* Quick View Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView(product);
            }}
            className="p-2 bg-[#1c1c1c]/80 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md backdrop-blur-sm"
            title="Quick View"
            aria-label="Quick View"
          >
            <Eye size={14} />
          </button>
        </div>

        {/* Product Image */}
        <img 
          src={displayImage} 
          alt={product.title} 
          className="main-img w-full h-full object-cover object-center transition-transform duration-500"
          loading="lazy"
        />

        {/* Undervisor / Angle Preview Mini Hint */}
        {product.secondaryImage && (
          <div className="absolute bottom-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-black/70 px-1.5 py-0.5 rounded text-gray-300 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Hover for flip
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        
        {/* Title & Price */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>{product.league} • {product.silhouette}</span>
            <span className="text-[#3ed660] font-bold">{product.team}</span>
          </div>

          <h3 
            onClick={handleOpenProduct}
            className="text-sm font-bold text-white hover:text-[#ff3b30] transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
          >
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-lg font-black text-white tracking-wider">
              {formatPrice(displayPrice, currency)}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">{currency}</span>
          </div>
        </div>

        {/* Interactive Size Selector Pills (Lids HD Signature direct-on-card variant selector) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              <span>Select Size:</span>
              {selectedSize && (
                <span className="text-white font-extrabold text-[11px]">
                  {selectedSize}
                </span>
              )}
            </div>

            <div 
              className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar cursor-grab active:cursor-grabbing select-none"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              {product.sizes.map((s) => (
                <button
                  key={s.id || s.size}
                  type="button"
                  onClick={() => handleSizeClick(s)}
                  disabled={!s.inStock}
                  className={`size-pill ${selectedSize === s.size ? 'selected' : ''} ${!s.inStock ? 'disabled' : ''}`}
                  title={s.inStock ? `Size ${s.size}` : `Size ${s.size} (Sold out)`}
                >
                  {s.size}
                </button>
              ))}
            </div>

            {/* Validation Message */}
            {showError && (
              <div className="flex items-center gap-1 text-[#ff3b30] text-[11px] font-bold mt-1 animate-fade-in">
                <AlertCircle size={12} />
                <span>Please select a size first</span>
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        <div>
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`w-full py-2.5 px-3 rounded text-xs font-display font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isAdded 
                ? 'bg-[#3ed660] text-black' 
                : 'bg-[#1f1f1f] hover:bg-white text-white hover:text-black border border-[#333333] hover:border-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={16} className="animate-check-pop" />
                <span>ADDED TO CART!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>ADD TO CART • {formatPrice(displayPrice, currency)}</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
