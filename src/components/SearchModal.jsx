import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, ChevronRight } from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function SearchModal({ isOpen, onClose, products, onSelectProduct, currency = 'USD' }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const popularSearches = [
    'Playing with Fire',
    'Yankees',
    'Los Angeles Dodgers',
    'Boston Red Sox',
    'Wu-Tang Pin',
    'Minor League'
  ];

  const results = query.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.team.toLowerCase().includes(query.toLowerCase()) ||
        p.league.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="relative w-full max-w-[760px] bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-10 overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#252525] flex items-center gap-3">
          <Search size={22} className="text-[#e10600] flex-shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search teams, collections, drops, pins..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-base sm:text-lg font-bold placeholder:text-gray-500 focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-xs font-bold text-gray-400 hover:text-white uppercase px-2 py-1 bg-[#202020] rounded"
          >
            ESC
          </button>
        </div>

        {/* Results or Suggested Section */}
        <div className="max-h-[60vh] overflow-y-auto p-5 custom-scroll">
          {query.trim() === '' ? (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Flame size={14} className="text-[#ff3b30]" />
                <span>POPULAR SEARCHES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="bg-[#202020] hover:bg-white text-gray-300 hover:text-black border border-[#2e2e2e] hover:border-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Found {results.length} Products
              </div>
              <div className="space-y-3">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex items-center gap-4 p-2.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#252525] hover:border-[#383838] cursor-pointer transition-all group"
                  >
                    <img 
                      src={product.thumbnail} 
                      alt={product.title} 
                      className="w-14 h-14 object-cover rounded bg-[#101010] flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">
                        {product.league} • {product.team}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ff3b30] truncate transition-colors">
                        {product.title}
                      </div>
                      <div className="text-xs font-bold text-gray-300 mt-0.5">
                        {formatPrice(product.price, currency)}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm font-medium">No results found for "{query}".</p>
              <p className="text-gray-500 text-xs mt-1">Try searching for Yankees, Dodgers, Fire, or Pins.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
