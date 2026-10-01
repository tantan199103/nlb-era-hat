import React, { useState, useEffect } from 'react';
import { Flame, Clock, Bell, ChevronRight, ChevronLeft, MapPin, Sparkles } from 'lucide-react';

export default function HeroBanner({ onShopNow, onNotifyMe, onNavigate }) {
  const [currentSlide, setCurrentSlide] = useState(0); // 0: Playing with Fire, 1: NYC Flagship
  const [isHovered, setIsHovered] = useState(false);

  // Live Drop Countdown Timer for Playing with Fire
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 8,
    minutes: 42,
    seconds: 15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance banner every 7 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const slides = [
    {
      id: 'fire-drop',
      bgImage: 'https://www.lidshd.com/cdn/shop/files/jxft9s3bfh__bannerDesk__LHD_Playing_with_Fire_Web_banner_2000x878_4fc7ecd9-876d-4424-91d1-5aa6992ad77c.jpg?v=1790565524&width=4000',
      badgeIcon: <Flame size={14} className="animate-pulse" />,
      badgeText: 'SEPTEMBER 28 AT 7 PM ET',
      badgeClass: 'bg-[#e10600] text-white shadow-lg shadow-red-900/40',
      title: 'MLB PLAYING WITH FIRE',
      subtitle: 'NEW ERA 59FIFTY FITTED DROP',
      description: "The season's hottest drop is here. Featuring scorched metallic team logos, custom World Series side patches, vibrant fire-accent embroidery, and premium contrast undervisors.",
      hasCountdown: true,
      primaryBtnText: 'SHOP THE DROP',
      primaryAction: onShopNow,
      secondaryBtnText: 'SET RESTOCK NOTIFY',
      secondaryAction: onNotifyMe
    },
    {
      id: 'nyc-store',
      bgImage: 'https://www.lidshd.com/cdn/shop/files/LHD_NYC_Opens10_10.jpg?v=1790607742&width=3083',
      badgeIcon: <MapPin size={14} className="text-[#3ed660]" />,
      badgeText: 'TIMES SQUARE FLAGSHIP • OPENS OCT 10',
      badgeClass: 'bg-[#1b2b1d] text-[#3ed660] border border-[#2e5236]',
      title: 'LIDS HD NYC FLAGSHIP',
      subtitle: '42ND & BROADWAY GRAND OPENING',
      description: 'Step into the holy grail of fitted culture. 5,000+ exclusive caps, live custom heat-press embroidery studio, bespoke enamel Pin Bar, and limited-edition in-store launch collections.',
      hasCountdown: false,
      primaryBtnText: 'EXPLORE NYC FLAGSHIP',
      primaryAction: () => onNavigate ? onNavigate('stores') : null,
      secondaryBtnText: 'BROWSE CATALOG',
      secondaryAction: () => onNavigate ? onNavigate('collections') : null
    }
  ];

  const activeSlide = slides[currentSlide];

  return (
    <section 
      className="relative w-full bg-[#0a0a0a] overflow-hidden border-b border-[#222222] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Graphic & Banner Image */}
      <div className="relative w-full min-h-[540px] md:min-h-[660px] flex items-center justify-center transition-all duration-700">
        
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={activeSlide.bgImage} 
            alt={activeSlide.title} 
            className="w-full h-full object-cover object-center brightness-[0.38] contrast-110 transition-opacity duration-700" 
          />
          {/* Streetwear Dark Vignette & Flame Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 py-16 text-center flex flex-col items-center animate-fade-in key={activeSlide.id}">
          
          {/* Drop Badge & Date */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6 ${activeSlide.badgeClass}`}>
            {activeSlide.badgeIcon}
            <span>{activeSlide.badgeText}</span>
          </div>

          {/* Main Drop Headline (Lids HD Signature Boxed Athletic Headline) */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tight leading-[0.9] max-w-[1050px] mb-4 drop-shadow-2xl">
            {activeSlide.title}
          </h1>
          
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-[#e0e0e0] tracking-wider uppercase mb-5">
            {activeSlide.subtitle}
          </h2>

          <p className="max-w-[640px] text-sm sm:text-base text-gray-300 font-normal leading-relaxed mb-8">
            {activeSlide.description}
          </p>

          {/* Countdown Clock Box (for drop slide) */}
          {activeSlide.hasCountdown && (
            <div className="bg-[#141414]/90 border border-[#333333] backdrop-blur-md rounded-xl p-4 sm:p-5 mb-9 shadow-2xl flex items-center gap-4 sm:gap-7 animate-fade-in">
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl sm:text-4xl font-black text-white">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">DAYS</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[#e10600] pb-2">:</span>
              
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl sm:text-4xl font-black text-white">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">HOURS</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[#e10600] pb-2">:</span>

              <div className="flex flex-col items-center">
                <span className="font-display text-2xl sm:text-4xl font-black text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">MINS</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-[#e10600] pb-2">:</span>

              <div className="flex flex-col items-center">
                <span className="font-display text-2xl sm:text-4xl font-black text-[#ff3b30]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest uppercase">SECS</span>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={activeSlide.primaryAction}
              className="btn-flame text-sm sm:text-base flex items-center gap-2 group cursor-pointer"
            >
              <span>{activeSlide.primaryBtnText}</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={activeSlide.secondaryAction}
              className="btn-secondary text-sm sm:text-base flex items-center gap-2 cursor-pointer"
            >
              {activeSlide.hasCountdown && <Bell size={16} />}
              <span>{activeSlide.secondaryBtnText}</span>
            </button>
          </div>

        </div>

        {/* Carousel Navigation Arrows */}
        <button 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-gray-400 hover:text-white border border-white/10 transition-colors z-20"
          aria-label="Previous banner"
        >
          <ChevronLeft size={22} />
        </button>

        <button 
          onClick={() => setCurrentSlide(prev => (prev === 0 ? 1 : 0))}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-gray-400 hover:text-white border border-white/10 transition-colors z-20"
          aria-label="Next banner"
        >
          <ChevronRight size={22} />
        </button>

        {/* Slide Indicators / Tabs */}
        <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                currentSlide === idx ? 'w-8 bg-[#e10600]' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
