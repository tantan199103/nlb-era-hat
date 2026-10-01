import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Award, MapPin, Globe } from 'lucide-react';

export default function AnnouncementBar({ onNavigate, currency = 'USD', onSelectCurrency }) {
  const announcements = [
    'FREE SHIPPING ON U.S. ORDERS OVER $99',
    'SEPTEMBER 28 AT 7 PM ET: MLB PLAYING WITH FIRE 59FIFTY DROPS NOW',
    'DOWNLOAD THE LIDS HD APP FOR EXCLUSIVE 15-MINUTE EARLY DROP ACCESS',
    'ACCESS PASS MEMBERS EARN DOUBLE POINTS ON ALL NEW RELEASES'
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div className="bg-[#111111] border-b border-[#222222] text-[#e0e0e0] text-[11px] font-semibold tracking-wider">
      {/* Top Utility Row (Desktop) */}
      <div className="max-w-[1440px] mx-auto px-4 py-1.5 flex items-center justify-between">
        {/* Left: Access Pass & Store */}
        <div className="hidden md:flex items-center gap-5">
          <button 
            onClick={() => onNavigate ? onNavigate('access-pass') : null} 
            className="flex items-center gap-1.5 text-white hover:text-[#ff3b30] transition-colors bg-transparent border-none cursor-pointer"
          >
            <img 
              src="https://www.lidshd.com/cdn/shop/files/access_pass.svg?v=1773394925&width=150" 
              alt="AccessPass" 
              className="h-[14px] w-auto inline-block invert" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="font-bold tracking-widest text-[10px]">ACCESS PASS</span>
          </button>
          <span className="text-[#333333]">|</span>
          <button 
            onClick={() => onNavigate ? onNavigate('stores') : null} 
            className="flex items-center gap-1 hover:text-white transition-colors text-[11px] text-[#888888] bg-transparent border-none cursor-pointer"
          >
            <MapPin size={12} />
            <span>NYC FLAGSHIP OPENING OCT 10</span>
          </button>
        </div>

        {/* Center: Rotating Announcement */}
        <div className="flex-1 flex items-center justify-center gap-3 px-2">
          <button 
            onClick={prevAnnouncement}
            className="text-[#666666] hover:text-white p-0.5 transition-colors cursor-pointer"
            aria-label="Previous announcement"
          >
            <ChevronLeft size={14} />
          </button>
          
          <div className="h-5 overflow-hidden flex items-center justify-center text-center max-w-[550px]">
            <span className="text-white uppercase font-bold tracking-widest text-[11px] sm:text-[12px] truncate transition-all duration-300">
              {announcements[currentIndex]}
            </span>
          </div>

          <button 
            onClick={nextAnnouncement}
            className="text-[#666666] hover:text-white p-0.5 transition-colors cursor-pointer"
            aria-label="Next announcement"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Right: Currency Selector & Track Order */}
        <div className="hidden md:flex items-center gap-3 text-[#888888]">
          <button 
            onClick={() => onNavigate ? onNavigate('track-order') : null}
            className="hover:text-white transition-colors text-[11px] bg-transparent border-none cursor-pointer text-gray-400"
          >
            Track Order
          </button>
          <span className="text-[#333333]">|</span>
          <div className="flex items-center gap-1 text-[11px] text-white">
            <Globe size={12} className="text-gray-400" />
            <select
              value={currency}
              onChange={(e) => onSelectCurrency && onSelectCurrency(e.target.value)}
              className="bg-transparent text-white text-[11px] font-bold border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="USD" className="bg-[#141414] text-white">US ($)</option>
              <option value="CAD" className="bg-[#141414] text-white">CA (C$)</option>
              <option value="EUR" className="bg-[#141414] text-white">EU (€)</option>
              <option value="GBP" className="bg-[#141414] text-white">UK (£)</option>
              <option value="JPY" className="bg-[#141414] text-white">JP (¥)</option>
              <option value="VND" className="bg-[#141414] text-white">VN (₫)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
