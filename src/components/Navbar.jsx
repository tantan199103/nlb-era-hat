import React, { useState } from 'react';
import { Search, ShoppingBag, User, Menu, X, ChevronDown, Flame, Heart, Sparkles } from 'lucide-react';
import { megaMenuData } from '../data/storeData';

export default function Navbar({ 
  cartCount, 
  wishlistCount = 0,
  onOpenCart, 
  onOpenWishlist,
  onOpenAccount,
  onOpenCustomizer,
  onOpenSearch, 
  onNavigate,
  onSelectLeague, 
  onSelectTeam 
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedLeague, setMobileExpandedLeague] = useState(null);

  const leagues = [
    { key: 'mlb', name: 'MLB', icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-1.png?v=1775464602&width=40' },
    { key: 'nba', name: 'NBA', icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-2.png?v=1775464603&width=40' },
    { key: 'nfl', name: 'NFL', icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342.png?v=1775464603&width=40' },
    { key: 'nhl', name: 'NHL', icon: 'https://www.lidshd.com/cdn/shop/files/76b9c733bddbad1ffbf4a5f647caa4bbec110a6e.png?v=1776335641&width=40' },
    { key: 'ncaa', name: 'NCAA', icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-5.png?v=1775464603&width=40' },
    { key: 'milb', name: 'MiLB', icon: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-4.png?v=1775464603&width=40' },
  ];

  const handleTeamClick = (team) => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('collections', { team });
    } else if (onSelectTeam) {
      onSelectTeam(team);
      const element = document.getElementById('latest-drops');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLeagueClick = (leagueKey) => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('collections', { league: leagueKey.toUpperCase() });
    } else if (onSelectLeague) {
      onSelectLeague(leagueKey.toUpperCase());
      const element = document.getElementById('latest-drops');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#222222]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-[70px] flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-white hover:text-gray-300 transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu size={24} />
          </button>
          <button 
            onClick={onOpenSearch} 
            className="p-1.5 text-white hover:text-gray-300 transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Brand Logo */}
        <div className="flex items-center">
          <button 
            onClick={() => onNavigate ? onNavigate('home') : null} 
            className="flex items-center gap-2 group cursor-pointer bg-transparent border-none"
          >
            <img 
              src="https://www.lidshd.com/cdn/shop/files/Lids_Hat_Drop_Logo_RGB.png?height=40&v=1637245831" 
              alt="Lids Hat Drop" 
              className="h-[36px] sm:h-[40px] w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {leagues.map((league) => (
            <div 
              key={league.key}
              className="relative"
              onMouseEnter={() => setActiveMenu(league.key)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <button 
                onClick={() => handleLeagueClick(league.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-wider transition-colors uppercase ${
                  activeMenu === league.key ? 'text-[#ff3b30]' : 'text-gray-200 hover:text-white'
                }`}
              >
                <img 
                  src={league.icon} 
                  alt={league.name} 
                  className="w-4 h-4 object-contain brightness-95" 
                />
                <span>{league.name}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === league.key ? 'rotate-180 text-[#ff3b30]' : 'text-gray-500'}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {activeMenu === league.key && megaMenuData[league.key] && (
                <div 
                  className="absolute top-full left-0 w-[680px] bg-[#141414] border border-[#2e2e2e] shadow-2xl rounded-b-md p-6 z-50 animate-fade-in"
                  onMouseEnter={() => setActiveMenu(league.key)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252525]">
                    <div className="flex items-center gap-2">
                      <img src={league.icon} alt={league.name} className="w-5 h-5 object-contain" />
                      <span className="font-display text-lg font-bold text-white tracking-wider">
                        {league.name} COLLECTIONS & TEAMS
                      </span>
                    </div>
                    <button 
                      onClick={() => handleLeagueClick(league.key)}
                      className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider"
                    >
                      Shop All {league.name} &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    {megaMenuData[league.key].divisions.map((div, dIdx) => (
                      <div key={dIdx} className="space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-[#888888] pb-1 border-b border-[#222222]">
                          {div.name}
                        </div>
                        <ul className="space-y-1.5">
                          {div.teams.map((team, tIdx) => (
                            <li key={tIdx}>
                              <button 
                                onClick={() => handleTeamClick(team)}
                                className="text-[12px] text-gray-300 hover:text-white hover:translate-x-1 transition-all text-left block w-full truncate py-0.5"
                              >
                                {team}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Quick Links */}
          <button 
            onClick={() => onNavigate ? onNavigate('collections') : null}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-wider text-white hover:text-[#ff3b30] transition-colors uppercase bg-transparent border-none cursor-pointer"
          >
            <Flame size={14} className="text-[#ff3b30]" />
            <span>DROPS</span>
          </button>
          <button 
            onClick={() => onNavigate ? onNavigate('collections', { league: 'PINS' }) : null}
            className="px-3 py-2 text-[13px] font-bold tracking-wider text-gray-200 hover:text-white transition-colors uppercase bg-transparent border-none cursor-pointer"
          >
            PINS
          </button>
          <button 
            onClick={() => onNavigate ? onNavigate('calendar') : null}
            className="px-3 py-2 text-[13px] font-bold tracking-wider text-[#ffaa00] hover:text-[#ffbb22] transition-colors uppercase bg-transparent border-none cursor-pointer"
          >
            CALENDAR
          </button>
          <button 
            onClick={() => onNavigate ? onNavigate('access-pass') : null}
            className="px-3 py-2 text-[13px] font-bold tracking-wider text-[#3ed660] hover:text-[#55ee78] transition-colors uppercase bg-transparent border-none cursor-pointer"
          >
            ACCESS PASS
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Desktop Search Trigger */}
          <button 
            onClick={onOpenSearch}
            className="hidden lg:flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2c2c2c] px-3.5 py-1.5 rounded-full text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <Search size={14} />
            <span className="tracking-wide">Search hats, teams, pins...</span>
            <kbd className="text-[10px] bg-[#2a2a2a] px-1.5 py-0.5 rounded text-gray-400 border border-[#383838]">⌘K</kbd>
          </button>

          {/* Cap & Pin Styler Button */}
          <button
            onClick={onOpenCustomizer}
            className="hidden sm:flex items-center gap-1.5 bg-[#221c10] hover:bg-[#2e2412] border border-[#ffaa00]/40 px-2.5 py-1.5 rounded-full text-xs text-[#ffaa00] font-bold transition-all cursor-pointer"
            title="Cap & Pin Customizer Studio"
          >
            <Sparkles size={13} className="text-[#ffaa00]" />
            <span className="text-[11px] font-display uppercase tracking-wider">PIN STYLER</span>
          </button>

          {/* Wishlist Icon */}
          <button 
            onClick={onOpenWishlist}
            className="p-2 text-gray-300 hover:text-white transition-colors relative cursor-pointer bg-transparent border-none"
            aria-label="Wishlist Vault"
            title="My Vault"
          >
            <Heart size={20} className={wishlistCount > 0 ? 'text-[#ff3b30] fill-[#ff3b30]' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#ff3b30] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-check-pop">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Account Icon */}
          <button 
            onClick={onOpenAccount}
            className="p-2 text-gray-300 hover:text-white transition-colors relative cursor-pointer bg-transparent border-none"
            aria-label="Account"
            title="My Account & Access Pass"
          >
            <User size={20} />
          </button>

          {/* Cart Icon & Drawer Trigger */}
          <button 
            onClick={onOpenCart}
            className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#282828] border border-[#303030] px-3 py-1.5 rounded-full text-white transition-all duration-200 cursor-pointer group"
            aria-label="View Cart"
          >
            <div className="relative">
              <ShoppingBag size={18} className="group-hover:scale-110 transition-transform text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#e10600] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-check-pop">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold font-display tracking-wider hidden sm:inline">
              CART
            </span>
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[85%] max-w-[360px] bg-[#121212] border-r border-[#262626] h-full flex flex-col z-10 animate-slide-in-right custom-scroll overflow-y-auto">
            
            {/* Mobile Drawer Header */}
            <div className="p-4 border-b border-[#222222] flex items-center justify-between">
              <img 
                src="https://www.lidshd.com/cdn/shop/files/Lids_Hat_Drop_Logo_RGB.png?height=40&v=1637245831" 
                alt="Lids Hat Drop" 
                className="h-[32px] w-auto" 
              />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Leagues Accordion */}
            <div className="p-4 flex-1 space-y-1">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1">
                Shop By League
              </div>
              {leagues.map((league) => (
                <div key={league.key} className="border-b border-[#1f1f1f]">
                  <button 
                    onClick={() => setMobileExpandedLeague(mobileExpandedLeague === league.key ? null : league.key)}
                    className="w-full flex items-center justify-between px-2 py-3 text-sm font-bold text-white uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={league.icon} alt={league.name} className="w-5 h-5 object-contain" />
                      <span>{league.name}</span>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 transition-transform ${mobileExpandedLeague === league.key ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {mobileExpandedLeague === league.key && megaMenuData[league.key] && (
                    <div className="px-4 pb-3 pt-1 space-y-3 bg-[#181818] rounded-md my-1">
                      <button 
                        onClick={() => handleLeagueClick(league.key)}
                        className="text-xs font-bold text-[#ff3b30] block w-full text-left uppercase py-1"
                      >
                        View All {league.name} Drop Hats &rarr;
                      </button>
                      {megaMenuData[league.key].divisions.map((div, dIdx) => (
                        <div key={dIdx} className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {div.name}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {div.teams.slice(0, 6).map((team, tIdx) => (
                              <button 
                                key={tIdx}
                                onClick={() => handleTeamClick(team)}
                                className="text-[11px] text-gray-300 hover:text-white text-left py-0.5 truncate"
                              >
                                {team}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 space-y-2">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('collections');
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2.5 text-sm font-bold text-white uppercase tracking-wider hover:text-[#ff3b30] text-left bg-transparent border-none"
                >
                  <Flame size={16} className="text-[#ff3b30]" />
                  <span>All Drop Caps</span>
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('collections', { league: 'PINS' });
                  }}
                  className="w-full block px-2 py-2.5 text-sm font-bold text-white uppercase tracking-wider hover:text-gray-300 text-left bg-transparent border-none"
                >
                  Pins & Chains
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('calendar');
                  }}
                  className="w-full block px-2 py-2.5 text-sm font-bold text-[#ffaa00] uppercase tracking-wider text-left bg-transparent border-none"
                >
                  Release Calendar
                </button>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigate) onNavigate('access-pass');
                  }}
                  className="w-full block px-2 py-2.5 text-sm font-bold text-[#3ed660] uppercase tracking-wider text-left bg-transparent border-none"
                >
                  Access Pass Loyalty
                </button>
              </div>
            </div>

            {/* Mobile Footer Links */}
            <div className="p-4 border-t border-[#222222] bg-[#0c0c0c] text-xs text-gray-400 space-y-2">
              <button onClick={() => { setMobileMenuOpen(false); if (onNavigate) onNavigate('stores'); }} className="block hover:text-white text-left bg-transparent border-none">Store Locator & Flagship</button>
              <button onClick={() => { setMobileMenuOpen(false); if (onNavigate) onNavigate('access-pass'); }} className="block hover:text-white text-left bg-transparent border-none">Access Pass Rewards</button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
