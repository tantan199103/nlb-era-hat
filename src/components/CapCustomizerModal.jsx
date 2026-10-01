import React, { useState } from 'react';
import { X, Sparkles, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function CapCustomizerModal({ 
  isOpen, 
  onClose, 
  products, 
  onAddBundleToCart,
  currency = 'USD' 
}) {
  const hatProducts = products.filter(p => p.category === 'hats');
  const pinProducts = products.filter(p => p.category === 'pins');

  const [selectedHat, setSelectedHat] = useState(hatProducts[0]);
  const [selectedPin, setSelectedPin] = useState(pinProducts[0]);
  const [pinPosition, setPinPosition] = useState('front-right'); // 'front-right', 'left-temple', 'visor', 'rear'
  const [selectedSize, setSelectedSize] = useState('7 3/8');
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !selectedHat || !selectedPin) return null;

  // Bundle financials: 10% discount when bundled
  const hatPriceNum = parseFloat(selectedHat.price.replace('$', '')) || 49.99;
  const pinPriceNum = parseFloat(selectedPin.price.replace('$', '')) || 14.99;
  const originalTotal = hatPriceNum + pinPriceNum;
  const bundleDiscount = originalTotal * 0.10;
  const discountedTotal = originalTotal - bundleDiscount;

  // Pin coordinates on the cap preview
  const positionStyles = {
    'front-right': { top: '35%', left: '68%', transform: 'scale(0.85) rotate(5deg)' },
    'left-temple': { top: '38%', left: '22%', transform: 'scale(0.8) rotate(-8deg)' },
    'visor': { top: '72%', left: '50%', transform: 'scale(0.75)' },
    'rear': { top: '22%', left: '48%', transform: 'scale(0.7)' }
  };

  const handleAddBundle = () => {
    setIsAdded(true);
    if (onAddBundleToCart) {
      onAddBundleToCart(selectedHat, selectedSize, selectedPin);
    }
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[960px] max-h-[92vh] bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row custom-scroll">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black text-gray-400 hover:text-white rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left: Cap & Pin Live Styler Canvas */}
        <div className="w-full md:w-1/2 p-6 bg-[#0f0f0f] border-b md:border-b-0 md:border-r border-[#242424] flex flex-col justify-between items-center relative select-none">
          
          <div className="w-full flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-1.5 text-[#ffaa00]">
              <Sparkles size={14} />
              <span>CUSTOM PIN STYLER</span>
            </span>
            <span className="text-gray-500">Interactive Preview</span>
          </div>

          {/* Interactive Cap Canvas with Placed Pin */}
          <div className="relative w-full aspect-square max-w-[340px] my-4 flex items-center justify-center bg-[#161616] rounded-xl border border-[#262626] overflow-hidden">
            {/* Base Cap */}
            <img 
              src={selectedHat.thumbnail || selectedHat.images[0]} 
              alt={selectedHat.title} 
              className="w-full h-full object-contain p-4 transition-all duration-300"
            />

            {/* Placed Pin Overlay */}
            <div 
              className="absolute pointer-events-none transition-all duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
              style={positionStyles[pinPosition]}
            >
              <img 
                src={selectedPin.thumbnail || selectedPin.images[0]} 
                alt={selectedPin.title} 
                className="w-16 h-16 object-contain"
              />
            </div>

            {/* Pin Position Selector Buttons */}
            <div className="absolute bottom-2 inset-x-2 flex justify-center gap-1.5">
              {[
                { id: 'front-right', label: 'Right Crown' },
                { id: 'left-temple', label: 'Left Temple' },
                { id: 'visor', label: 'Visor' }
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setPinPosition(pos.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    pinPosition === pos.id 
                      ? 'bg-white text-black font-extrabold shadow' 
                      : 'bg-black/70 text-gray-300 hover:text-white border border-white/20'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-400">
            Previewing: <span className="text-white font-bold">{selectedHat.team}</span> + <span className="text-[#ffaa00] font-bold">{selectedPin.title}</span>
          </div>

        </div>

        {/* Right: Customizer Controls */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-5 overflow-y-auto custom-scroll">
          
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3ed660] block mb-1">
              BUNDLE & SAVE 10%
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
              BUILD YOUR PINNED GRAIL
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pair any fitted cap with an authentic enamel pin or chain accessory. Both items will be packaged together in our premium collector box.
            </p>
          </div>

          {/* 1. Pick Cap */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-2">
              1. Select Fitted Cap ({hatProducts.length} Available)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {hatProducts.slice(0, 4).map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHat(h)}
                  className={`aspect-square rounded-md overflow-hidden bg-[#181818] p-1 border-2 transition-all ${
                    selectedHat.id === h.id ? 'border-[#e10600] opacity-100 shadow-md' : 'border-[#262626] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={h.thumbnail} alt={h.title} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-white mt-1.5 truncate">
              {selectedHat.title}
            </div>
          </div>

          {/* 2. Pick Size */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-2">
              2. Cap Size: <span className="text-white font-bold">{selectedSize}</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-1 rounded text-xs font-bold ${
                    selectedSize === sz ? 'bg-white text-black' : 'bg-[#1e1e1e] text-gray-300 border border-[#2c2c2c]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Pick Pin */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-2">
              3. Select Enamel Pin / Chain
            </label>
            <div className="grid grid-cols-4 gap-2">
              {pinProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPin(p)}
                  className={`aspect-square rounded-md overflow-hidden bg-[#181818] p-1.5 border-2 transition-all ${
                    selectedPin.id === p.id ? 'border-[#ffaa00] opacity-100 shadow-md' : 'border-[#262626] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-[#ffaa00] mt-1.5 truncate">
              {selectedPin.title} ({formatPrice(selectedPin.price, currency)})
            </div>
          </div>

          {/* Bundle Price & Add to Cart */}
          <div className="pt-4 border-t border-[#262626]">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400">Bundle Price (10% OFF):</span>
                <div className="text-[11px] text-gray-500 line-through">
                  Reg: {formatPrice(originalTotal, currency)}
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-2xl font-black text-white">
                  {formatPrice(discountedTotal, currency)}
                </span>
                <span className="text-[10px] text-[#3ed660] font-bold block">
                  You save {formatPrice(bundleDiscount, currency)}
                </span>
              </div>
            </div>

            <button
              onClick={handleAddBundle}
              disabled={isAdded}
              className={`w-full py-3.5 px-6 rounded text-xs font-display font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                isAdded ? 'bg-[#3ed660] text-black' : 'btn-flame'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={18} />
                  <span>BUNDLE ADDED TO CART!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={16} />
                  <span>ADD CUSTOM BUNDLE TO CART</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
