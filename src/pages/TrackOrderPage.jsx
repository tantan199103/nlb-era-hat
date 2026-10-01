import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, ArrowRight } from 'lucide-react';

export default function TrackOrderPage() {
  const [orderInput, setOrderInput] = useState('LHD-789210');
  const [emailInput, setEmailInput] = useState('');
  const [searched, setSearched] = useState(true);

  const trackingSteps = [
    { title: 'Order Confirmed', date: 'Sept 28, 7:02 PM ET', done: true, desc: 'Payment verified and drop inventory allocated.' },
    { title: 'Vault Inspection & Steaming', date: 'Sept 29, 9:15 AM ET', done: true, desc: 'Crown structure checked, visor inspected, packed in rigid hat box.' },
    { title: 'Shipped with UPS Priority', date: 'Sept 29, 2:30 PM ET', done: true, desc: 'Package in transit with tracking number 1Z9999999999999999.' },
    { title: 'Out for Delivery', date: 'Estimated Oct 1', done: false, desc: 'On courier vehicle for final delivery to your door.' },
    { title: 'Delivered', date: 'Estimated Oct 1', done: false, desc: 'Package will be left in a safe location.' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!orderInput) return;
    setSearched(true);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10 sm:py-16 animate-fade-in">
      
      {/* Header */}
      <div className="text-center max-w-[600px] mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[#ff3b30] block mb-1">
          SHIPMENT TRACKING
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
          TRACK YOUR DROP
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Check live shipping progress, courier status, and estimated delivery times for your order.
        </p>
      </div>

      {/* Tracker Search Box */}
      <div className="bg-[#141414] border border-[#282828] p-5 sm:p-6 rounded-xl mb-12 shadow-xl max-w-[680px] mx-auto">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Order Number (e.g. LHD-789210)"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2.5 text-xs text-white uppercase placeholder:normal-case placeholder:text-gray-500 focus:outline-none focus:border-white font-bold"
            />
          </div>
          <button type="submit" className="btn-flame text-xs py-2.5 px-6 flex items-center justify-center gap-1.5">
            <Search size={14} />
            <span>TRACK SHIPMENT</span>
          </button>
        </form>
      </div>

      {/* Tracking Results Timeline */}
      {searched && (
        <div className="bg-[#121212] border border-[#242424] rounded-xl p-6 sm:p-10 shadow-2xl space-y-8 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#242424] gap-3">
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase">Tracking Order:</div>
              <div className="font-display text-2xl font-black text-white">{orderInput}</div>
            </div>
            <div className="text-right sm:text-right">
              <span className="bg-[#1f2d22] text-[#3ed660] border border-[#2e5236] px-3 py-1 rounded text-xs font-bold uppercase inline-block">
                IN TRANSIT • ON SCHEDULE
              </span>
              <div className="text-xs text-gray-400 mt-1">Carrier: UPS Ground Tracked</div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#252525]">
            {trackingSteps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4 pl-8">
                {/* Step Circle */}
                <div className={`absolute left-1.5 -translate-x-1/2 top-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                  step.done ? 'bg-[#3ed660] ring-4 ring-[#1f2d22]' : 'bg-[#333333] border border-[#555]'
                }`}>
                  {step.done && <CheckCircle2 size={12} className="text-black" />}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h4 className={`font-display text-base font-bold uppercase ${step.done ? 'text-white' : 'text-gray-500'}`}>
                      {step.title}
                    </h4>
                    <span className="text-xs text-[#ffaa00] font-semibold">{step.date}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
