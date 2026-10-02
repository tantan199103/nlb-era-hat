import React, { useState } from 'react';
import { 
  Search, ShoppingBag, User, Menu, X, ChevronDown, Flame, 
  Heart, Sparkles, Shield, ExternalLink, SlidersHorizontal 
} from 'lucide-react';
import { megaMenuData } from '../data/storeData';
import { defaultMenus } from '../admin/adminData';

export default function Navbar({ 
  cartCount, 
  wishlistCount = 0,
  menus = defaultMenus,
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

  const leagueIconMap = {
    mlb: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-1.png?v=1775464602&width=40',
    nba: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-2.png?v=1775464603&width=40',
    nfl: 'https://www.lidshd.com/cdn/shop/files/Frame_61342.png?v=1775464603&width=40',
    nhl: 'https://www.lidshd.com/cdn/shop/files/76b9c733bddbad1ffbf4a5f647caa4bbec110a6e.png?v=1776335641&width=40',
    ncaa: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-5.png?v=1775464603&width=40',
    milb: 'https://www.lidshd.com/cdn/shop/files/Frame_61342-4.png?v=1775464603&width=40',
  };

  // Header menu from dynamic state
  const headerMenu = menus?.find(m => m.location === 'HEADER') || defaultMenus[0];
  const headerItems = (headerMenu?.items || []).filter(item => item.visible !== false);

  // Mobile drawer menu from dynamic state
  const mobileMenu = menus?.find(m => m.location === 'MOBILE_DRAWER') || defaultMenus[2];
  const mobileItems = (mobileMenu?.items || []).filter(item => item.visible !== false);
  const hasDynamicSportsMenu = mobileItems.some(item => item.label?.toUpperCase() === 'SPORTS');

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

  const handleItemClick = (item) => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
    if (!onNavigate) return;

    const target = item.target || '';
    if (target.startsWith('http')) {
      window.open(target, '_blank');
      return;
    }

    if (target === '/' || target === '/home') {
      onNavigate('home');
      return;
    }

    try {
      const parsed = new URL(target, window.location.origin);
      if (parsed.pathname === '/collections' || parsed.pathname === '/shop' || parsed.pathname === '/sports' || parsed.pathname === '/teams' || parsed.pathname.startsWith('/category/')) {
        const params = {};
        ['league', 'team', 'group', 'size', 'sort'].forEach((key) => {
          const value = parsed.searchParams.get(key);
          if (value) params[key === 'sort' ? 'sortBy' : key] = value;
        });
        if (parsed.searchParams.get('stock') === '1') params.inStockOnly = true;
        onNavigate('collections', params);
        return;
      }
    } catch {
      // Fall through to the legacy route mapping below.
    }

    if (target.startsWith('/collections')) {
      if (target.includes('league=')) {
        const league = new URLSearchParams(target.split('?')[1]).get('league');
        onNavigate('collections', { league });
      } else if (target === '/collections/mlb') {
        onNavigate('collections', { league: 'MLB' });
      } else if (target === '/collections/nba') {
        onNavigate('collections', { league: 'NBA' });
      } else if (target === '/collections/nfl') {
        onNavigate('collections', { league: 'NFL' });
      } else if (target === '/collections/nhl') {
        onNavigate('collections', { league: 'NHL' });
      } else if (target === '/collections/milb') {
        onNavigate('collections', { league: 'MILB' });
      } else {
        onNavigate('collections');
      }
      return;
    }

    if (target === '/calendar') {
      onNavigate('calendar');
      return;
    }

    if (target === '/access-pass') {
      onNavigate('access-pass');
      return;
    }

    if (target === '/stores') {
      onNavigate('stores');
      return;
    }

    if (target === '/track-order') {
      onNavigate('track-order');
      return;
    }

    if (target === '/admin') {
      onNavigate('admin');
      return;
    }

    onNavigate(target.replace(/^\//, '') || 'home');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#222222]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-[70px] flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-white hover:text-gray-300 transition-colors cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu size={24} />
          </button>
          <button 
            onClick={onOpenSearch} 
            className="p-1.5 text-white hover:text-gray-300 transition-colors cursor-pointer"
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

        {/* Desktop Dynamic Navigation Links (Driven by Menu Builder) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {headerItems.map((item) => {
            const leagueKey = item.label.toLowerCase();
            const isLeague = Boolean(megaMenuData[leagueKey]);
            const leagueIcon = leagueIconMap[leagueKey];

            if (isLeague) {
              return (
                <div 
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setActiveMenu(leagueKey)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button 
                    onClick={() => handleLeagueClick(leagueKey)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-wider transition-colors uppercase cursor-pointer ${
                      activeMenu === leagueKey ? 'text-[#ff3b30]' : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    {leagueIcon && (
                      <img 
                        src={leagueIcon} 
                        alt={item.label} 
                        className="w-4 h-4 object-contain brightness-95" 
                      />
                    )}
                    <span>{item.label}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${activeMenu === leagueKey ? 'rotate-180 text-[#ff3b30]' : 'text-gray-500'}`} />
                  </button>

                  {/* Mega Menu Dropdown */}
                  {activeMenu === leagueKey && megaMenuData[leagueKey] && (
                    <div 
                      className="absolute top-full left-0 w-[680px] bg-[#141414] border border-[#2e2e2e] shadow-2xl rounded-b-md p-6 z-50 animate-fade-in"
                      onMouseEnter={() => setActiveMenu(leagueKey)}
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#252525]">
                        <div className="flex items-center gap-2">
                          {leagueIcon && <img src={leagueIcon} alt={item.label} className="w-5 h-5 object-contain" />}
                          <span className="font-display text-lg font-bold text-white tracking-wider">
                            {item.label} COLLECTIONS & TEAMS
                          </span>
                        </div>
                        <button 
                          onClick={() => handleLeagueClick(leagueKey)}
                          className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Shop All {item.label} &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        {megaMenuData[leagueKey].divisions.map((div, dIdx) => (
                          <div key={dIdx} className="space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-[#888888] pb-1 border-b border-[#222222]">
                              {div.name}
                            </div>
                            <ul className="space-y-1.5">
                              {div.teams.map((team, tIdx) => (
                                <li key={tIdx}>
                                  <button 
                                    onClick={() => handleTeamClick(team)}
                                    className="text-[12px] text-gray-300 hover:text-white hover:translate-x-1 transition-all text-left block w-full truncate py-0.5 cursor-pointer"
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
              );
            }

            // Standard or Custom Menu Link
            const isDrops = item.label.toUpperCase() === 'DROPS';
            const isCalendar = item.label.toUpperCase() === 'CALENDAR';
            const isAccessPass = item.label.toUpperCase().includes('ACCESS PASS');
            const hasChildren = Array.isArray(item.children) && item.children.some(child => child.visible !== false);

            if (hasChildren) {
              return (
                <div key={item.id} className="relative" onMouseEnter={() => setActiveMenu(item.id)} onMouseLeave={() => setActiveMenu(null)}>
                  <button onClick={() => handleItemClick(item)} className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-wider transition-colors uppercase cursor-pointer ${activeMenu === item.id ? 'text-[#ff3b30]' : 'text-gray-200 hover:text-white'}`}>
                    {isDrops && <Flame size={14} className="text-[#ff3b30]" />}
                    <span>{item.label}</span><ChevronDown size={12} className={activeMenu === item.id ? 'rotate-180 text-[#ff3b30]' : 'text-gray-500'} />
                  </button>
                  {activeMenu === item.id && <div className="absolute left-0 top-full z-50 min-w-[250px] rounded-b-md border border-[#2e2e2e] bg-[#141414] p-3 shadow-2xl animate-fade-in" onMouseEnter={() => setActiveMenu(item.id)} onMouseLeave={() => setActiveMenu(null)}>
                    <div className="border-b border-[#252525] px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Explore {item.label.toLowerCase()}</div>
                    {item.children.filter(child => child.visible !== false).map(child => <button key={child.id} onClick={() => handleItemClick(child)} className="block w-full rounded px-2 py-2 text-left text-xs font-semibold text-gray-300 hover:bg-[#222] hover:text-white">{child.label}</button>)}
                  </div>}
                </div>
              );
            }

            return (
              <button 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold tracking-wider transition-colors uppercase bg-transparent border-none cursor-pointer ${
                  isDrops ? 'text-white hover:text-[#ff3b30]' :
                  isCalendar ? 'text-[#ffaa00] hover:text-[#ffbb22]' :
                  isAccessPass ? 'text-[#3ed660] hover:text-[#55ee78]' :
                  'text-gray-200 hover:text-white'
                }`}
              >
                {isDrops && <Flame size={14} className="text-[#ff3b30]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
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

      {/* Mobile Drawer Navigation (Dynamic with Menu Builder) */}
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
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Leagues & Dynamic Links Accordion */}
            <div className="p-4 flex-1 space-y-1">
              {!hasDynamicSportsMenu && <><div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1">Shop By League</div>
              {['mlb', 'nba', 'nfl', 'nhl', 'milb'].map((key) => {
                const name = key.toUpperCase();
                const icon = leagueIconMap[key];
                return (
                  <div key={key} className="border-b border-[#1f1f1f]">
                    <button 
                      onClick={() => setMobileExpandedLeague(mobileExpandedLeague === key ? null : key)}
                      className="w-full flex items-center justify-between px-2 py-3 text-sm font-bold text-white uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {icon && <img src={icon} alt={name} className="w-5 h-5 object-contain" />}
                        <span>{name}</span>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform ${mobileExpandedLeague === key ? 'rotate-180' : ''}`} 
                      />
                    </button>

                    {mobileExpandedLeague === key && megaMenuData[key] && (
                      <div className="px-4 pb-3 pt-1 space-y-3 bg-[#181818] rounded-md my-1">
                        <button 
                          onClick={() => handleLeagueClick(key)}
                          className="text-xs font-bold text-[#ff3b30] block w-full text-left uppercase py-1 cursor-pointer"
                        >
                          View All {name} Drop Hats &rarr;
                        </button>
                        {megaMenuData[key].divisions.map((div, dIdx) => (
                          <div key={dIdx} className="space-y-1">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {div.name}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {div.teams.slice(0, 6).map((team, tIdx) => (
                                <button 
                                  key={tIdx}
                                  onClick={() => handleTeamClick(team)}
                                  className="text-[11px] text-gray-300 hover:text-white text-left py-0.5 truncate cursor-pointer"
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
                );
              })}</>}

              <div className="pt-4 space-y-2">
                {mobileItems.map(item => (
                  <div key={item.id} className="border-b border-[#1f1f1f] pb-1">
                    <button onClick={() => handleItemClick(item)} className="w-full flex items-center gap-2 px-2 py-2.5 text-sm font-bold text-white uppercase tracking-wider hover:text-[#ff3b30] text-left bg-transparent border-none cursor-pointer">
                      {item.label.toUpperCase() === 'DROPS' && <Flame size={16} className="text-[#ff3b30]" />}
                      <span>{item.label}</span>
                    </button>
                    {item.children?.filter(child => child.visible !== false).map(child => <button key={child.id} onClick={() => handleItemClick(child)} className="block w-full px-8 py-1.5 text-left text-xs font-medium text-gray-400 hover:text-white">{child.label}</button>)}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Footer Links */}
            <div className="p-4 border-t border-[#222222] bg-[#0c0c0c] text-xs text-gray-400 space-y-2">
              <button onClick={() => { setMobileMenuOpen(false); if (onNavigate) onNavigate('stores'); }} className="block hover:text-white text-left bg-transparent border-none cursor-pointer">Store Locator & Flagship</button>
              <button onClick={() => { setMobileMenuOpen(false); if (onNavigate) onNavigate('access-pass'); }} className="block hover:text-white text-left bg-transparent border-none cursor-pointer">Access Pass Rewards</button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
