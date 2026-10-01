import React from 'react';
import { banners } from '../data/storeData';
import { ChevronRight } from 'lucide-react';

export default function ChicagoSoleBanner({ onExplore }) {
  const { chicagoSole } = banners;

  return (
    <section className="py-8 px-4 lg:px-8 max-w-[1440px] mx-auto">
      <div 
        onClick={onExplore}
        className="relative w-full h-[320px] sm:h-[450px] md:h-[520px] rounded-lg overflow-hidden border border-[#2b2b2b] group cursor-pointer"
      >
        {/* Background Image Desktop & Mobile */}
        <picture>
          <source media="(max-width: 640px)" srcSet={chicagoSole.mobileImg} />
          <img 
            src={chicagoSole.desktopImg} 
            alt={chicagoSole.title} 
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700" 
            loading="lazy"
          />
        </picture>

        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10">
          <div className="max-w-[600px]">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#ff3b30] block mb-1">
              {chicagoSole.subtitle}
            </span>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tight mb-3">
              {chicagoSole.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-normal mb-5 line-clamp-2">
              {chicagoSole.desc}
            </p>
            <button className="btn-primary text-xs sm:text-sm py-2.5 px-6">
              <span>{chicagoSole.ctaText}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
