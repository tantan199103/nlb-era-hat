import React, { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckoutSuccess,
  customerEmail = '',
  currency = 'USD'
}) {
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState(customerEmail);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (customerEmail) setCheckoutEmail(customerEmail);
  }, [customerEmail]);

  if (!isOpen) return null;

  // Calculate financials
  const FREE_SHIPPING_THRESHOLD = 99.0;
  
  const rawSubtotal = cartItems.reduce((sum, item) => {
    const p = parseFloat(item.price.replace('$', '')) || 49.99;
    return sum + p * item.quantity;
  }, 0);

  const discountAmount = discountApplied ? rawSubtotal * 0.15 : 0;
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const amountAway = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const accessPoints = Math.floor(subtotal * 10);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toLowerCase() === 'drop15' || promoCode.trim().toLowerCase() === 'lids15') {
      setDiscountApplied(true);
    } else {
      alert('Invalid promo code. Try "DROP15" for 15% off!');
    }
  };

  const handleCheckout = () => {
    const normalizedEmail = checkoutEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setCheckoutError('Enter the email address you want to use for the order confirmation.');
      return;
    }
    setCheckoutError('');
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      if (onCheckoutSuccess) onCheckoutSuccess(cartItems, subtotal, normalizedEmail);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-[440px] bg-[#121212] border-l border-[#242424] h-full flex flex-col z-10 shadow-2xl animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-white" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-wider">
              YOUR CART ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-5 py-3.5 bg-[#181818] border-b border-[#252525]">
          <div className="flex items-center gap-2 mb-1.5">
            <Truck size={14} className={amountAway === 0 ? 'text-[#3ed660]' : 'text-gray-300'} />
            <span className="text-xs font-bold text-gray-200">
              {amountAway === 0 ? (
                <span className="text-[#3ed660]">🎉 YOU UNLOCKED FREE STANDARD SHIPPING!</span>
              ) : (
                <span>Add <span className="text-white font-extrabold">{formatPrice(amountAway, currency)}</span> more for FREE SHIPPING!</span>
              )}
            </span>
          </div>

          <div className="w-full bg-[#282828] h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                amountAway === 0 ? 'bg-[#3ed660]' : 'bg-[#e10600]'
              }`}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Access Pass Points Banner */}
        {cartItems.length > 0 && (
          <div className="px-5 py-2 bg-[#1b1b1b] border-b border-[#262626] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Sparkles size={12} className="text-[#ffaa00]" />
              <span>Access Pass Reward:</span>
            </div>
            <span className="font-bold text-[#ffaa00]">+{accessPoints} Points</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scroll">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div 
                key={`${item.id}-${item.size}`} 
                className="bg-[#181818] border border-[#262626] p-3 sm:p-4 rounded-md flex gap-3 sm:gap-4 items-center group relative hover:border-[#333333] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 bg-[#121212] rounded overflow-hidden flex-shrink-0 border border-[#2b2b2b]">
                  <img 
                    src={item.thumbnail || item.images[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center" 
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate line-clamp-1 leading-tight">
                      {item.title}
                    </h4>
                    <button 
                      onClick={() => onRemoveItem(item.id, item.size)}
                      className="text-gray-500 hover:text-[#ff3b30] p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Size Pill */}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="bg-[#242424] text-white text-[10px] font-extrabold px-2 py-0.5 rounded border border-[#383838]">
                      Size: {item.size}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{item.team}</span>
                  </div>

                  {/* Price & Quantity Adjuster */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center border border-[#333333] rounded bg-[#131313]">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.size, item.quantity - 1)}
                        className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#222222] transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.size, item.quantity + 1)}
                        className="px-2 py-1 text-gray-400 hover:text-white hover:bg-[#222222] transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-display text-sm font-black text-white">
                        {formatPrice((parseFloat(item.price.replace('$', '')) || 49.99) * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-center text-gray-400 mb-4">
                <ShoppingBag size={28} />
              </div>
              <h4 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                YOUR CART IS EMPTY
              </h4>
              <p className="text-xs text-gray-400 max-w-[240px] mb-6">
                Fresh drops go fast. Explore our latest fitted caps and pins to build your rotation.
              </p>
              <button 
                onClick={onClose}
                className="btn-primary text-xs py-2.5 px-6"
              >
                START SHOPPING DROPS
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#161616] space-y-3">
            
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Discount code (try DROP15)" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-[#1f1f1f] border border-[#333333] rounded px-3 py-1.5 text-xs text-white uppercase placeholder:normal-case placeholder:text-gray-500 focus:outline-none focus:border-white"
              />
              <button 
                type="submit"
                className="btn-secondary text-xs px-3 py-1.5"
              >
                APPLY
              </button>
            </form>

            {discountApplied && (
              <div className="flex items-center justify-between text-xs text-[#3ed660] font-bold">
                <span>15% Drop VIP Discount Applied:</span>
                <span>-{formatPrice(discountAmount, currency)}</span>
              </div>
            )}

            <div>
              <label htmlFor="checkout-email" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Order confirmation email</label>
              <input
                id="checkout-email"
                type="email"
                autoComplete="email"
                required
                value={checkoutEmail}
                onChange={(event) => {
                  setCheckoutEmail(event.target.value);
                  setCheckoutError('');
                }}
                placeholder="you@example.com"
                className="w-full rounded border border-[#333333] bg-[#1f1f1f] px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-white focus:outline-none"
              />
              {checkoutError && <p role="alert" className="mt-1.5 text-[11px] leading-4 text-amber-200">{checkoutError}</p>}
            </div>

            {/* Subtotal */}
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">SUBTOTAL</span>
              <span className="font-display text-2xl font-black text-white">
                {formatPrice(subtotal, currency)}
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Shipping & taxes calculated at checkout. Free 30-day returns.
            </p>

            {/* Main Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full btn-flame text-sm py-3.5 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isCheckingOut ? (
                <span>PROCESSING CHECKOUT...</span>
              ) : (
                <>
                  <span>CHECKOUT • {formatPrice(subtotal, currency)}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Fast Wallets Badges */}
            <div className="pt-2 text-center">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                Guaranteed Safe & Accelerated Checkout
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold">
                <span className="bg-[#242424] px-2 py-1 rounded border border-[#333333] text-[#5a31f4]">Shop Pay</span>
                <span className="bg-[#242424] px-2 py-1 rounded border border-[#333333] text-white"> Pay</span>
                <span className="bg-[#242424] px-2 py-1 rounded border border-[#333333] text-[#0070ba]">PayPal</span>
                <span className="bg-[#242424] px-2 py-1 rounded border border-[#333333] text-[#4285f4]">G Pay</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
