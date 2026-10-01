import React from 'react';
import { X, Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function WishlistDrawer({ 
  isOpen, 
  onClose, 
  wishlistItems, 
  onRemoveFromWishlist, 
  onAddToCart,
  currency = 'USD'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-[420px] bg-[#121212] border-l border-[#242424] h-full flex flex-col z-10 shadow-2xl animate-slide-in-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2 text-white">
            <Heart size={18} className="text-[#ff3b30] fill-[#ff3b30]" />
            <h3 className="font-display text-lg font-black uppercase tracking-wider">
              MY VAULT / WISHLIST ({wishlistItems.length})
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scroll">
          {wishlistItems.length > 0 ? (
            wishlistItems.map((item) => (
              <div 
                key={item.id}
                className="bg-[#181818] border border-[#262626] p-3 sm:p-4 rounded-md flex gap-3 items-center group relative hover:border-[#383838] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-18 h-18 bg-[#121212] rounded overflow-hidden flex-shrink-0 border border-[#2b2b2b]">
                  <img 
                    src={item.thumbnail || item.images?.[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center" 
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate line-clamp-1">
                      {item.title}
                    </h4>
                    <button 
                      onClick={() => onRemoveFromWishlist(item.id)}
                      className="text-gray-500 hover:text-[#ff3b30] p-1 transition-colors"
                      title="Remove from vault"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-400 font-semibold mt-0.5">
                    {item.team} • {item.silhouette}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-sm font-black text-white">
                      {formatPrice(item.price, currency)}
                    </span>

                    <button
                      onClick={() => {
                        const defaultSize = item.sizes?.find(s => s.inStock)?.size || '7 3/8';
                        onAddToCart(item, defaultSize);
                      }}
                      className="btn-flame text-[10px] py-1 px-3 flex items-center gap-1"
                    >
                      <ShoppingBag size={11} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-gray-500 mb-4">
                <Heart size={28} />
              </div>
              <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                YOUR VAULT IS EMPTY
              </h4>
              <p className="text-xs text-gray-400 max-w-[240px] mb-6">
                Save your grail caps and accessories by tapping the heart icon on any product card.
              </p>
              <button 
                onClick={onClose}
                className="btn-primary text-xs py-2.5 px-6"
              >
                BROWSE NEW ERA DROPS
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlistItems.length > 0 && (
          <div className="p-4 border-t border-[#222222] bg-[#161616]">
            <button
              onClick={() => {
                wishlistItems.forEach(item => {
                  const defaultSize = item.sizes?.find(s => s.inStock)?.size || '7 3/8';
                  onAddToCart(item, defaultSize);
                });
                onClose();
              }}
              className="w-full btn-primary text-xs py-3 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} />
              <span>MOVE ALL TO CART ({wishlistItems.length})</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
