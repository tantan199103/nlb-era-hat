import React, { useState } from 'react';
import { X, Check, ShoppingBag, ShieldCheck, Ruler, Truck, Flame, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { selectedProductPrice } from '../lib/productPricing';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, currency = 'USD' }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const displayPrice = selectedProductPrice(product, selectedSize);

  const handleSizeClick = (s) => {
    if (!s.inStock) return;
    setSelectedSize(s.size);
    setSizeError(false);
  };

  const handleAddToCart = () => {
    const effectiveSize = selectedSize || (product.sizes?.length === 1 ? product.sizes[0].size : null);

    if (!effectiveSize) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    setIsAdded(true);
    if (onAddToCart) {
      onAddToCart(product, effectiveSize);
    }
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[1000px] max-h-[92vh] bg-[#141414] border border-[#2e2e2e] rounded-lg shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden custom-scroll">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black text-gray-400 hover:text-white rounded-full transition-colors backdrop-blur-xs"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 bg-[#101010] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#242424]">
          {/* Main Display Image */}
          <div className="relative aspect-square w-full rounded-md overflow-hidden bg-[#161616] mb-4 flex items-center justify-center">
            <img 
              src={images[activeImageIndex]} 
              alt={product.title} 
              className="w-full h-full object-contain p-2"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 bg-[#e10600] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 border-2 bg-[#161616] p-1 transition-all ${
                    activeImageIndex === idx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 overflow-y-auto custom-scroll flex flex-col justify-between space-y-6">
          
          <div>
            {/* League & Silhouette */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              <span>{product.league}</span>
              <span>•</span>
              <span className="text-[#3ed660]">{product.team}</span>
              <span>•</span>
              <span>{product.silhouette}</span>
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-snug mb-3">
              {product.title}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display text-3xl font-black text-white">
                {formatPrice(displayPrice, currency)}
              </span>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{currency}</span>
              <span className="text-xs bg-[#242424] text-[#3ed660] font-bold px-2 py-0.5 rounded border border-[#333]">
                IN STOCK
              </span>
            </div>

            {/* Urgency indicator */}
            <div className="flex items-center gap-2 text-xs text-[#ffaa00] font-bold mb-6 bg-[#201a0c] p-2 rounded border border-[#443515]">
              <Flame size={14} className="text-[#ff3b30] animate-pulse" />
              <span>High demand: 18 cap collectors viewing this drop right now</span>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Select Fitted Size: {selectedSize && <span className="text-white font-extrabold">{selectedSize}</span>}
                  </span>
                  <button 
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-[#ff3b30] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Ruler size={13} />
                    <span>Size Guide</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id || s.size}
                      type="button"
                      disabled={!s.inStock}
                      onClick={() => handleSizeClick(s)}
                      className={`h-10 rounded font-bold text-xs flex items-center justify-center transition-all ${
                        selectedSize === s.size
                          ? 'bg-white text-black font-extrabold shadow-md'
                          : (!s.inStock 
                              ? 'bg-[#181818] text-gray-600 line-through border border-[#222] cursor-not-allowed' 
                              : 'bg-[#202020] text-gray-200 hover:bg-[#2e2e2e] border border-[#2d2d2d]')
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>

                {sizeError && (
                  <p className="text-[#ff3b30] text-xs font-bold mt-2">
                    ⚠️ Please select a size to continue.
                  </p>
                )}

                {/* Size Guide Overlay Popup */}
                {showSizeGuide && (
                  <div className="mt-3 p-3 bg-[#1e1e1e] border border-[#383838] rounded text-xs text-gray-300 space-y-1.5 animate-fade-in">
                    <div className="font-bold text-white uppercase tracking-wider">59FIFTY Sizing Reference:</div>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      <div>7: 55.8 cm (22")</div>
                      <div>7 1/8: 56.8 cm (22 3/8")</div>
                      <div>7 1/4: 57.7 cm (22 3/4")</div>
                      <div>7 3/8: 58.7 cm (23 1/8")</div>
                      <div>7 1/2: 59.6 cm (23 1/2")</div>
                      <div>7 5/8: 60.6 cm (23 7/8")</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description & Features */}
            <div className="space-y-3 text-xs text-gray-300 font-normal border-t border-[#262626] pt-4">
              <p>
                Authentic New Era 59FIFTY custom drop fitted cap. Designed exclusively for Lids Hat Drop with precision embroidered logos, anniversary commemorative side patch, and contrast under-visor styling.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Material: 100% Woven Polyester Crown & Visor</li>
                <li>Fit: Structured high-crown profile, flat brim can be curved</li>
                <li>Official MLB / New Era licensed headwear</li>
                <li>Imported from authorized New Era manufacturing vault</li>
              </ul>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#242424] space-y-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`w-full py-3.5 px-6 rounded text-sm font-display font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                isAdded 
                  ? 'bg-[#3ed660] text-black' 
                  : 'bg-white hover:bg-[#e0e0e0] text-black'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={18} />
                  <span>ADDED TO CART!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>ADD TO CART • {formatPrice(displayPrice, currency)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pt-2 font-medium">
              <span className="flex items-center gap-1">
                <Truck size={13} className="text-[#3ed660]" />
                Free Shipping over $99
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#2563eb]" />
                100% Authentic Guarantee
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
