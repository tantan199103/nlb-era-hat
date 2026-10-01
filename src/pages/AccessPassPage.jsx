import React, { useState } from 'react';
import { Award, Sparkles, Flame, Check, Gift, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function AccessPassPage({ onShopDrops }) {
  const [spendAmount, setSpendAmount] = useState(150);
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');

  const pointsEarned = Math.floor(spendAmount * 10);
  const rewardDollar = (pointsEarned / 100) * 5; // $5 reward per 100 pts

  const handleJoin = (e) => {
    e.preventDefault();
    if (!email) return;
    setJoined(true);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 sm:py-16 animate-fade-in">
      
      {/* Hero Showcase */}
      <div className="text-center max-w-[800px] mx-auto mb-16">
        <div className="inline-flex items-center gap-2 bg-[#201c10] border border-[#ffaa00]/40 text-[#ffaa00] px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6">
          <Sparkles size={14} />
          <span>OFFICIAL LOYALTY PROGRAM</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.95] mb-4">
          LIDS HD ACCESS PASS
        </h1>

        <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-[620px] mx-auto mb-8">
          Unlock the ultimate collector status. Earn points on every fitted cap and pin purchase, secure 15-minute early drop access, and redeem rewards for free heat.
        </p>

        {joined ? (
          <div className="bg-[#1f2d22] border border-[#2e5236] text-[#3ed660] p-4 rounded-lg inline-flex items-center gap-2 font-bold text-sm">
            <Check size={18} />
            <span>Welcome to Access Pass VIP! Your 100 bonus welcome points have been applied.</span>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-2 max-w-[460px] mx-auto">
            <input 
              type="email"
              required
              placeholder="Enter your email to join free"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#181818] border border-[#333333] rounded px-4 py-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
            />
            <button type="submit" className="btn-flame text-xs py-3 px-6 whitespace-nowrap">
              JOIN NOW (FREE)
            </button>
          </form>
        )}
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        <div className="bg-[#141414] border border-[#262626] p-6 sm:p-8 rounded-xl text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#e10600]/20 text-[#e10600] rounded-full flex items-center justify-center mb-5">
            <Clock size={28} />
          </div>
          <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-2">
            15-MIN EARLY ACCESS
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Get private drop links before the public release. Never take an L on rare sizes like 7 1/4 and 7 3/8.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-6 sm:p-8 rounded-xl text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#ffaa00]/20 text-[#ffaa00] rounded-full flex items-center justify-center mb-5">
            <Sparkles size={28} />
          </div>
          <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-2">
            10 POINTS PER $1 SPENT
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every fitted cap earns 500 points. Redeem points for direct cash discounts on your next grail purchase.
          </p>
        </div>

        <div className="bg-[#141414] border border-[#262626] p-6 sm:p-8 rounded-xl text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#2563eb]/20 text-[#2563eb] rounded-full flex items-center justify-center mb-5">
            <Gift size={28} />
          </div>
          <h3 className="font-display text-xl font-black text-white uppercase tracking-wider mb-2">
            BIRTHDAY & VAULT PERKS
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Annual birthday voucher, surprise restock pings, and access to the members-only archive drops.
          </p>
        </div>
      </div>

      {/* Tier Comparison Table */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 sm:p-10 mb-20">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            ACCESS PASS TIERS
          </h2>
          <p className="text-xs text-gray-400 mt-1">Level up as your fitted collection expands.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">FREE TIER</span>
              <h4 className="font-display text-2xl font-black text-white uppercase mb-2">ROOKIE</h4>
              <div className="text-xs font-bold text-[#ffaa00] mb-4">0 – 499 Points</div>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> 10 Points per $1 spent</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> Drop calendar notifications</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> Standard free shipping over $99</li>
              </ul>
            </div>
            <button className="btn-secondary w-full text-xs mt-6">Active Tier</button>
          </div>

          {/* Tier 2 */}
          <div className="bg-[#1c1917] border-2 border-[#ffaa00] rounded-lg p-6 relative flex flex-col justify-between shadow-xl">
            <span className="absolute -top-3 right-4 bg-[#ffaa00] text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded">
              POPULAR
            </span>
            <div>
              <span className="text-[10px] font-bold text-[#ffaa00] uppercase tracking-widest block mb-1">COLLECTOR</span>
              <h4 className="font-display text-2xl font-black text-white uppercase mb-2">ALL-STAR</h4>
              <div className="text-xs font-bold text-[#ffaa00] mb-4">500 – 1,499 Points</div>
              <ul className="space-y-2.5 text-xs text-gray-200">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> 12 Points per $1 spent (20% boost)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> 15-Minute Early Access to all drops</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> $15 Annual Birthday Reward</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> Free shipping on all orders over $75</li>
              </ul>
            </div>
            <button className="btn-flame w-full text-xs mt-6">Unlock All-Star</button>
          </div>

          {/* Tier 3 */}
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-lg p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">ELITE VAULT</span>
              <h4 className="font-display text-2xl font-black text-white uppercase mb-2">HALL OF FAME</h4>
              <div className="text-xs font-bold text-[#e10600] mb-4">1,500+ Points</div>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> 15 Points per $1 spent (50% boost)</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> 30-Minute Priority Drop Access</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> Free Pin or Chain with every cap drop</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#3ed660]" /> Free Express 2-Day Shipping</li>
              </ul>
            </div>
            <button className="btn-secondary w-full text-xs mt-6">Learn More</button>
          </div>
        </div>
      </div>

      {/* Interactive Reward Calculator */}
      <div className="bg-[#141414] border border-[#282828] rounded-xl p-6 sm:p-10 text-center max-w-[700px] mx-auto">
        <h3 className="font-display text-2xl font-black text-white uppercase tracking-wider mb-2">
          CALCULATE YOUR REWARD SAVINGS
        </h3>
        <p className="text-xs text-gray-400 mb-6">
          See how quickly your cap pickups turn into store credit.
        </p>

        <div className="mb-6">
          <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
            <span>Estimated Annual Spend:</span>
            <span className="text-white text-base font-black">${spendAmount} USD</span>
          </div>
          <input 
            type="range"
            min="50"
            max="1000"
            step="25"
            value={spendAmount}
            onChange={(e) => setSpendAmount(Number(e.target.value))}
            className="w-full h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#e10600]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 bg-[#1c1c1c] p-4 rounded-lg mb-6">
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Points You'll Earn:</div>
            <div className="font-display text-2xl sm:text-3xl font-black text-[#ffaa00]">
              {pointsEarned.toLocaleString()} PTS
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Reward Credit Value:</div>
            <div className="font-display text-2xl sm:text-3xl font-black text-[#3ed660]">
              ${rewardDollar.toFixed(2)} USD
            </div>
          </div>
        </div>

        <button 
          onClick={onShopDrops}
          className="btn-flame text-xs py-3 px-8 inline-flex items-center gap-2"
        >
          <span>SHOP DROPS TO EARN POINTS</span>
          <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
