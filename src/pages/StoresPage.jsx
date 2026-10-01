import React, { useState } from 'react';
import { MapPin, Clock, Phone, Navigation, Sparkles, Shield, ChevronRight } from 'lucide-react';

export default function StoresPage() {
  const [selectedCity, setSelectedCity] = useState('nyc');

  const stores = [
    {
      id: 'nyc',
      name: 'Lids HD NYC Flagship (Opens Oct 10)',
      address: '1501 Broadway (42nd & Broadway), Times Square, New York, NY 10036',
      phone: '+1 (212) 555-0199',
      hours: 'Mon - Sat: 10:00 AM – 9:00 PM | Sun: 11:00 AM – 7:00 PM',
      badge: 'GRAND OPENING OCT 10',
      description: 'Our world flagship destination spanning two floors of fitted cap culture. Featuring the Custom Heat Embroidery Bar, Collector Vault, and Exclusive NYC Commemorative Subway Series Drops.',
      image: 'https://www.lidshd.com/cdn/shop/files/LHD_NYC_Opens10_10.jpg?v=1790607742&width=3083',
      features: ['Live In-Store Embroidery Bar', 'Exclusive NYC Only 59FIFTY Colorways', 'Custom Enamel Pin Press', 'Access Pass VIP Priority Line']
    },
    {
      id: 'chicago',
      name: 'Lids HD Chicago Michigan Ave',
      address: '645 N Michigan Ave, Chicago, IL 60611',
      phone: '+1 (312) 555-0144',
      hours: 'Mon - Sat: 10:00 AM – 8:00 PM | Sun: 11:00 AM – 6:00 PM',
      badge: 'PREMIER VAULT',
      description: 'Home of the Chicago Sole Collection. Specializing in Bulls & White Sox vintage color sync editions, throwback script caps, and custom regional stitching.',
      image: 'https://www.lidshd.com/cdn/shop/files/qvqqbxpnd7__bannerDesk__LHD_Chicago_Sole_Web_banner_2000x878_eb03b30f-2ef8-4de0-9af9-b05b1fe93f47.jpg?v=1790566841&width=2000',
      features: ['Chicago Sole Capsule Showcase', 'Custom Visor Curving Station', 'Historic World Series Side Patches']
    },
    {
      id: 'la',
      name: 'Lids HD Los Angeles Melrose',
      address: '7820 Melrose Ave, Los Angeles, CA 90046',
      phone: '+1 (323) 555-0188',
      hours: 'Mon - Sun: 11:00 AM – 8:00 PM',
      badge: 'WEST COAST FLAGSHIP',
      description: 'The epicenter of West Coast streetwear headwear. Featuring Dodgers Blue Heaven capsules, Angels anniversary drops, and curated hip-hop pin collaborations.',
      image: 'https://www.lidshd.com/cdn/shop/files/LHD_Web_Update-03.jpg?v=1788241236&width=1939',
      features: ['Blue Heaven Vault Room', 'Sanrio & Hip-Hop Pin Collections', 'Streetwear Collab Showcases']
    }
  ];

  const currentStore = stores.find(s => s.id === selectedCity) || stores[0];

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 sm:py-16 animate-fade-in">
      
      {/* Header */}
      <div className="text-center max-w-[700px] mx-auto mb-14">
        <span className="text-xs font-bold uppercase tracking-widest text-[#ff3b30] block mb-1">
          FLAGSHIP DESTINATIONS
        </span>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-white uppercase tracking-tight">
          LIDS HD RETAIL STORES
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Experience the heat in person. In-store exclusive drops, on-site custom embroidery, and cap steaming services.
        </p>
      </div>

      {/* City Switcher Buttons */}
      <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {stores.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedCity(s.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-display font-black tracking-wider uppercase transition-all cursor-pointer ${
              selectedCity === s.id
                ? 'bg-white text-black shadow-lg shadow-white/20'
                : 'bg-[#181818] text-gray-400 hover:text-white border border-[#282828]'
            }`}
          >
            {s.name.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Spotlight Store Card */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
        
        {/* Left: Image */}
        <div className="relative h-[320px] sm:h-[450px] lg:h-full min-h-[380px] bg-[#161616]">
          <img 
            src={currentStore.image} 
            alt={currentStore.name} 
            className="w-full h-full object-cover object-center brightness-90"
          />
          <div className="absolute top-4 left-4 bg-[#e10600] text-white text-[10px] font-black uppercase px-3 py-1 rounded tracking-wider shadow-lg">
            {currentStore.badge}
          </div>
        </div>

        {/* Right: Info */}
        <div className="p-6 sm:p-10 space-y-6">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3">
              {currentStore.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {currentStore.description}
            </p>
          </div>

          <div className="space-y-3 text-xs text-gray-300 border-t border-b border-[#242424] py-4">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-[#ff3b30] flex-shrink-0 mt-0.5" />
              <span>{currentStore.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={16} className="text-[#3ed660] flex-shrink-0" />
              <span>{currentStore.hours}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="text-[#2563eb] flex-shrink-0" />
              <span>{currentStore.phone}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Store Amenities & Experiences:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-200">
              {currentStore.features.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#1a1a1a] p-2 rounded border border-[#292929]">
                  <Sparkles size={13} className="text-[#ffaa00]" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(currentStore.address)}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-flame text-xs py-3 px-6 inline-flex items-center gap-2"
            >
              <Navigation size={14} />
              <span>GET DIRECTIONS</span>
            </a>
            <a 
              href={`tel:${currentStore.phone.replace(/[^0-9+]/g, '')}`}
              className="btn-secondary text-xs py-3 px-5 inline-flex items-center gap-2"
            >
              <Phone size={14} />
              <span>CALL STORE</span>
            </a>
          </div>

        </div>

      </div>

    </div>
  );
}
