import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  };

  return (
    <footer className="bg-[#0c0c0c] border-t border-[#222222] text-[#8e8e93] text-xs">
      
      {/* Newsletter Signup Row */}
      <div className="border-b border-[#1c1c1c] py-12 px-4 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff3b30] block mb-1">
              EXCLUSIVE RELEASES & EARLY ACCESS
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              BE THE FIRST TO KNOW
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-[420px]">
              Subscribe for launch reminders, surprise fitted drops, restock alerts, and VIP Access Pass perks.
            </p>
          </div>

          <div className="w-full max-w-[460px]">
            {subscribed ? (
              <div className="bg-[#1f2d22] border border-[#2e5236] text-[#3ed660] px-4 py-3 rounded-md flex items-center gap-2 font-bold animate-fade-in">
                <Check size={16} />
                <span>You're subscribed! Check your inbox for the welcome perk.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-[#2e2e2e] rounded-md pl-10 pr-3 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <button 
                  type="submit"
                  className="btn-flame text-xs px-6 py-3 flex items-center gap-1.5"
                >
                  <span>JOIN</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <button 
              onClick={() => onNavigate ? onNavigate('home') : null}
              className="bg-transparent border-none cursor-pointer p-0 text-left"
            >
              <img 
                src="https://www.lidshd.com/cdn/shop/files/Lids_Hat_Drop_Logo_RGB.png?height=40&v=1637245831" 
                alt="Lids Hat Drop" 
                className="h-[36px] w-auto brightness-110" 
              />
            </button>
            <p className="text-xs text-gray-400 leading-relaxed">
              Lids Hat Drop is the premier destination for exclusive New Era 59FIFTY fitted cap releases, bespoke street-inspired story drops, and custom collectibles.
            </p>
            <div className="text-[11px] text-gray-500">
              Need assistance? Email us: <br />
              <a href="mailto:support@lidshatdrop.com" className="text-white hover:underline font-semibold">
                support@lidshatdrop.com
              </a>
            </div>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate ? onNavigate('access-pass') : null} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left text-gray-400">Access Pass Portal</button></li>
              <li><button onClick={() => onNavigate ? onNavigate('stores') : null} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left text-gray-400">Store Locator & Flagship</button></li>
              <li><button onClick={() => onNavigate ? onNavigate('collections') : null} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left text-gray-400">All Available Drops</button></li>
              <li><button onClick={() => onNavigate ? onNavigate('calendar') : null} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-left text-gray-400">Drop Release Schedule</button></li>
            </ul>
          </div>

          {/* Company & Policies */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              POLICIES & LEGAL
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#sustainability" className="hover:text-white transition-colors">2026 Sustainability</a></li>
              <li><a href="#accessibility" className="hover:text-white transition-colors">Accessibility Statement</a></li>
            </ul>
          </div>

          {/* Socials & Community */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              CONNECT WITH US
            </h4>
            <p className="text-xs text-gray-400">
              Follow @lidshd for live drop announcements, behind-the-scenes designs, and wearer fit-checks.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://www.instagram.com/lidshd" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-[#1c1c1c] hover:bg-[#ff3b30] text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a 
                href="https://www.youtube.com/@LidsHD" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-[#1c1c1c] hover:bg-[#ff0000] text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a 
                href="https://x.com/lidshatdrop" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-[#1c1c1c] hover:bg-white text-gray-300 hover:text-black rounded-full flex items-center justify-center transition-all"
                aria-label="Twitter/X"
              >
                <svg className="w-3.5 h-3.5 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a 
                href="https://www.facebook.com/lidshatdrop" 
                target="_blank" 
                rel="noreferrer"
                className="w-9 h-9 bg-[#1c1c1c] hover:bg-[#1877f2] text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z"/></svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Payment Methods */}
        <div className="mt-12 pt-8 border-t border-[#1c1c1c] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-500 text-center md:text-left">
            © 2026 Lids Hat Drop (Lids HD). All Rights Reserved. Major League Baseball trademarks and copyrights are used with permission of Major League Baseball.
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] text-gray-400">
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded">VISA</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded">MASTERCARD</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded">AMEX</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded">DISCOVER</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded text-[#5a31f4] font-bold">Shop Pay</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded text-white font-bold"> Pay</span>
            <span className="bg-[#181818] border border-[#282828] px-2 py-1 rounded text-[#0070ba] font-bold">PayPal</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
