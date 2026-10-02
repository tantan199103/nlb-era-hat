import React, { useEffect } from 'react';
import { CheckCircle2, Package, Truck, Sparkles, X, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessModal({ isOpen, onClose, orderDetails }) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e10600', '#ffaa00', '#ffffff', '#2563eb', '#3ed660']
      });
    }
  }, [isOpen]);

  if (!isOpen || !orderDetails) return null;

  // The order reference must come from the persisted order returned by Supabase.
  // Never manufacture a number in the confirmation UI: a fabricated reference
  // cannot be used on the tracking page and makes failed checkouts look paid.
  const orderNumber = String(orderDetails.orderNumber || '').trim();
  const pointsEarned = Math.floor(orderDetails.subtotal * 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[540px] bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 sm:p-8 z-10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center pb-6 border-b border-[#252525]">
          <div className="w-16 h-16 bg-[#3ed660]/20 text-[#3ed660] rounded-full flex items-center justify-center mx-auto mb-4 animate-check-pop">
            <CheckCircle2 size={36} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#3ed660] block mb-1">
            DROP ORDER CONFIRMED
          </span>
          <h2 className="font-display text-3xl font-black text-white uppercase tracking-tight">
            THANK YOU FOR YOUR ORDER!
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {orderNumber
              ? <>Order #{orderNumber} • A confirmation has been sent to your email.</>
              : 'Your order was received. The order reference will appear once it is confirmed.'}
          </p>
        </div>

        {/* Order Items Preview */}
        <div className="py-4 border-b border-[#252525] max-h-[160px] overflow-y-auto space-y-2.5 custom-scroll">
          {orderDetails.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img src={item.thumbnail} alt={item.title} className="w-10 h-10 object-cover rounded bg-[#101010]" />
                <div>
                  <div className="font-bold text-white truncate max-w-[240px]">{item.title}</div>
                  <div className="text-[10px] text-gray-400">Size: {item.size} • Qty: {item.quantity}</div>
                </div>
              </div>
              <div className="font-bold text-white">${item.price}</div>
            </div>
          ))}
        </div>

        {/* Access Pass Points Callout */}
        <div className="my-4 p-3 bg-[#1e1c16] border border-[#3e341f] rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#ffaa00]" />
            <span className="text-gray-200">Access Pass Points Earned:</span>
          </div>
          <span className="font-bold text-[#ffaa00]">+{pointsEarned} Points</span>
        </div>

        {/* Shipping details */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-400 mb-6 bg-[#1a1a1a] p-3 rounded">
          <div>
            <div className="font-bold text-gray-200 uppercase mb-0.5">Shipping Method:</div>
            <div>Tracked Priority Delivery (2-3 Business Days)</div>
          </div>
          <div>
            <div className="font-bold text-gray-200 uppercase mb-0.5">Payment Total:</div>
            <div className="font-bold text-white text-xs">${orderDetails.subtotal.toFixed(2)} USD</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full btn-flame text-xs py-3 flex items-center justify-center gap-2"
        >
          <span>CONTINUE BROWSING MORE DROPS</span>
          <ArrowRight size={14} />
        </button>

      </div>
    </div>
  );
}
