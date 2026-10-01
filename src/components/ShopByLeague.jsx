import React from 'react';
import { featuredCollections } from '../data/storeData';
import { ChevronRight } from 'lucide-react';

export default function ShopByLeague({ onSelectCollection }) {
  return (
    <section className="py-14 sm:py-20 px-4 lg:px-8 max-w-[1440px] mx-auto border-b border-[#222222]">
      
      {/* Section Header */}
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[#888888] block mb-1">
          CURATED VAULT
        </span>
        <h2 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          FEATURED COLLECTIONS
        </h2>
      </div>

      {/* 6 Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {featuredCollections.map((col) => (
          <div 
            key={col.id}
            onClick={() => onSelectCollection && onSelectCollection(col.title)}
            className="group relative h-[280px] sm:h-[380px] md:h-[440px] rounded-md overflow-hidden border border-[#242424] hover:border-[#444444] cursor-pointer transition-all duration-300"
          >
            {/* Background Image */}
            <img 
              src={col.imageDesktop} 
              alt={col.title} 
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-[0.7] group-hover:brightness-[0.85]" 
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Content at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex flex-col items-start">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#cccccc] mb-1">
                {col.subtitle}
              </span>
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                {col.title}
              </h3>
              
              <button className="bg-white/10 hover:bg-white text-white hover:text-black border border-white/30 hover:border-white px-3.5 py-1.5 rounded text-xs font-display font-extrabold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 group-hover:bg-white group-hover:text-black">
                <span>SHOP NOW</span>
                <ChevronRight size={14} />
              </button>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
