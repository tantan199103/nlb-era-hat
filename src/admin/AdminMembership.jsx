import React, { useEffect, useState } from 'react';
import { 
  Users, Award, Sparkles, Clock, ShieldCheck, Plus, 
  Search, Edit3, ArrowRight, Save, CheckCircle2, Star, Flame, Crown, X, Mail, CalendarDays, ShoppingBag
} from 'lucide-react';

export default function AdminMembership({ members, onSaveMembers, settings = {}, onSaveSettings }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [notice, setNotice] = useState('');
  const [membersList, setMembersList] = useState(members);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // VIP Program Rules State
  const [programRules, setProgramRules] = useState({
    name: 'Lids Access Pass VIP',
    pointsPerDollar: 10,
    rookieThreshold: 0,
    allStarThreshold: 500,
    hallOfFameThreshold: 2000,
    earlyAccessMins: 15,
    hofEarlyAccessMins: 30,
    exclusiveDrops: true,
    freeShippingHof: true,
    ...(settings.accessPass || {}),
  });

  const selectedMember = membersList.find((member) => member.id === selectedMemberId) || null;

  useEffect(() => {
    setMembersList(Array.isArray(members) ? members : []);
  }, [members]);

  // Filter members
  const filteredMembers = membersList.filter(m => {
    const matchTier = tierFilter === 'ALL' || m.tier === tierFilter;
    const matchQuery = !query.trim() || 
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()) ||
      (m.preferredSize && m.preferredSize.toLowerCase().includes(query.toLowerCase()));
    return matchTier && matchQuery;
  });

  const handleAdjustPoints = (memberId, delta) => {
    const updated = membersList.map(m => {
      if (m.id === memberId) {
        const newPoints = Math.max(0, m.points + delta);
        let newTier = m.tier;
        if (newPoints >= programRules.hallOfFameThreshold) newTier = 'Hall of Fame';
        else if (newPoints >= programRules.allStarThreshold) newTier = 'All-Star VIP';
        else newTier = 'Rookie Collector';

        return { ...m, points: newPoints, tier: newTier };
      }
      return m;
    });

    setMembersList(updated);
    onSaveMembers(updated);
    setNotice(`Adjusted points for collector.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleSaveRules = (e) => {
    e.preventDefault();
    onSaveSettings?.({ ...settings, accessPass: programRules });
    setNotice('Access Pass VIP rules and early drop release windows saved!');
    setTimeout(() => setNotice(''), 3500);
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Hall of Fame':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'All-Star VIP':
        return 'bg-[#ff3b30]/20 text-[#ff3b30] border-[#ff3b30]/40';
      default:
        return 'bg-zinc-700/50 text-zinc-300 border-zinc-600';
    }
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">LOYALTY & RETENTION</div>
          <h1>ACCESS PASS VIP & COLLECTORS CLUB</h1>
          <p className="admin-intro-desc">
            Drive repeat drop engagement with tiered early access, points-per-fitted rewards, and exclusive member reservations.
          </p>
        </div>

        <button 
          onClick={handleSaveRules}
          className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
        >
          <Save size={15} />
          <span>SAVE VIP SETTINGS</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#3ed660]" />
          <span>{notice}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#262626] gap-2">
        {[
          { id: 'overview', label: 'Program Overview' },
          { id: 'members', label: `Members Directory (${membersList.length})` },
          { id: 'rules', label: 'Tiers & Early Drop Rules' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-3 text-xs font-black tracking-wider uppercase transition-colors cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === t.id
                ? 'border-[#ff3b30] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="admin-panel !p-4">
              <div className="text-[10px] text-zinc-500 font-black uppercase">Total Collectors</div>
              <div className="text-2xl font-black text-white mt-1">{membersList.length}</div>
              <div className="text-xs text-[#3ed660] mt-1 font-bold">+18% this month</div>
            </div>

            <div className="admin-panel !p-4">
              <div className="text-[10px] text-zinc-500 font-black uppercase">Hall of Fame VIPs</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {membersList.filter(m => m.tier === 'Hall of Fame').length}
              </div>
              <div className="text-xs text-zinc-400 mt-1">Top tier collectors</div>
            </div>

            <div className="admin-panel !p-4">
              <div className="text-[10px] text-zinc-500 font-black uppercase">Points Issued</div>
              <div className="text-2xl font-black text-white mt-1">
                {membersList.reduce((sum, m) => sum + (m.points || 0), 0).toLocaleString()} PTS
              </div>
              <div className="text-xs text-zinc-400 mt-1">10 pts per $1 spent</div>
            </div>

            <div className="admin-panel !p-4">
              <div className="text-[10px] text-zinc-500 font-black uppercase">Early Access Priority</div>
              <div className="text-2xl font-black text-[#ff3b30] mt-1">30 Mins</div>
              <div className="text-xs text-zinc-400 mt-1">Ahead of public drops</div>
            </div>
          </div>

          {/* Tiers Visual Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Rookie */}
            <div className="admin-panel space-y-3 border-t-4 border-t-zinc-600">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tier 1</span>
                <Users size={18} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-black text-white">ROOKIE COLLECTOR</h3>
              <p className="text-xs text-zinc-400">Entry level for newly registered fitted enthusiasts.</p>
              <div className="space-y-1.5 pt-2 border-t border-[#222] text-xs text-zinc-300">
                <div>• Earn 10 points per $1</div>
                <div>• Save favorite fitted size preferences</div>
                <div>• Email drop notifications</div>
              </div>
            </div>

            {/* All-Star */}
            <div className="admin-panel space-y-3 border-t-4 border-t-[#ff3b30]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#ff3b30] tracking-wider">Tier 2</span>
                <Star size={18} className="text-[#ff3b30]" />
              </div>
              <h3 className="text-lg font-black text-white">ALL-STAR VIP</h3>
              <p className="text-xs text-zinc-400">Achieved at 500+ points ($50 spent on drops).</p>
              <div className="space-y-1.5 pt-2 border-t border-[#222] text-xs text-zinc-300">
                <div>• <strong>15-minute early access</strong> on weekly drops</div>
                <div>• $10 reward voucher every 1,000 points</div>
                <div>• Exclusive members-only pins</div>
              </div>
            </div>

            {/* Hall of Fame */}
            <div className="admin-panel space-y-3 border-t-4 border-t-amber-400">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Tier 3 (Elite)</span>
                <Crown size={18} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white">HALL OF FAME</h3>
              <p className="text-xs text-zinc-400">Achieved at 2,000+ points ($200 spent on drops).</p>
              <div className="space-y-1.5 pt-2 border-t border-[#222] text-xs text-zinc-300">
                <div>• <strong>30-minute priority drop window</strong></div>
                <div>• Free shipping on every order</div>
                <div>• Guaranteed reservation on 1 limited cap/month</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS DIRECTORY TAB */}
      {activeTab === 'members' && (
        <div className="space-y-4 animate-fade-in">
          {/* Search & Tier Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#141414] p-3 rounded-lg border border-[#262626]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search collector name, email, or fitted size (e.g. 7 1/2)..."
                className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'Hall of Fame', 'All-Star VIP', 'Rookie Collector'].map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    tierFilter === tier 
                      ? 'bg-[#ff3b30] text-white shadow-sm' 
                      : 'bg-[#1e1e1e] text-zinc-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div className="admin-panel !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Collector Name</th>
                    <th>Tier</th>
                    <th>Points Balance</th>
                    <th>Fitted Size</th>
                    <th>Orders Placed</th>
                    <th>Early Drop Access</th>
                    <th className="text-right">Points Grant</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-[#181818] transition-colors">
                      <td>
                        <button type="button" onClick={() => setSelectedMemberId(m.id)} className="text-left font-bold text-white text-xs hover:text-[#ff3b30]">{m.name}</button>
                        <div className="text-[11px] text-zinc-500">{m.email}</div>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getTierBadge(m.tier)}`}>
                          {m.tier}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-white text-xs">
                        {m.points.toLocaleString()} PTS
                      </td>
                      <td>
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-200 rounded font-mono text-xs">
                          {m.preferredSize || '7 1/4'}
                        </span>
                      </td>
                      <td className="text-zinc-300 text-xs">
                        {m.ordersCount} drops
                      </td>
                      <td>
                        {m.earlyAccess ? (
                          <span className="text-[#3ed660] text-xs font-bold flex items-center gap-1">
                            <Sparkles size={12} /> Active
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">Public</span>
                        )}
                      </td>
                      <td className="text-right space-x-1.5">
                        <button 
                          onClick={() => handleAdjustPoints(m.id, 100)}
                          className="px-2 py-1 bg-[#222] hover:bg-[#3ed660] hover:text-black rounded text-[11px] font-bold text-zinc-300 transition-colors cursor-pointer"
                          title="Grant +100 bonus points"
                        >
                          +100 pts
                        </button>
                        <button 
                          onClick={() => handleAdjustPoints(m.id, -100)}
                          className="px-2 py-1 bg-[#222] hover:bg-red-600 hover:text-white rounded text-[11px] font-bold text-zinc-300 transition-colors cursor-pointer"
                          title="Deduct 100 points"
                        >
                          -100 pts
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="admin-empty">
                <Users size={36} className="text-zinc-600 mb-2" />
                <h3 className="text-sm font-bold text-white uppercase">No Collectors Found</h3>
                <p className="text-xs text-zinc-400">Try changing your search term or tier filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRules} className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="admin-panel space-y-4">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Award className="text-[#ff3b30]" size={16} />
              <span>Tier Thresholds & Multipliers</span>
            </h3>

            <div>
              <label className="admin-form-label">All-Star VIP Point Threshold</label>
              <input 
                type="number"
                value={programRules.allStarThreshold}
                onChange={e => setProgramRules({ ...programRules, allStarThreshold: Number(e.target.value) })}
                className="admin-form-input font-mono text-xs"
              />
            </div>

            <div>
              <label className="admin-form-label">Hall of Fame Point Threshold</label>
              <input 
                type="number"
                value={programRules.hallOfFameThreshold}
                onChange={e => setProgramRules({ ...programRules, hallOfFameThreshold: Number(e.target.value) })}
                className="admin-form-input font-mono text-xs"
              />
            </div>

            <div>
              <label className="admin-form-label">Points Earned Per $1 Spent</label>
              <input 
                type="number"
                value={programRules.pointsPerDollar}
                onChange={e => setProgramRules({ ...programRules, pointsPerDollar: Number(e.target.value) })}
                className="admin-form-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="admin-panel space-y-4">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Clock className="text-amber-400" size={16} />
              <span>Early Access Release Windows</span>
            </h3>

            <div>
              <label className="admin-form-label">All-Star Early Access Window (Minutes)</label>
              <input 
                type="number"
                value={programRules.earlyAccessMins}
                onChange={e => setProgramRules({ ...programRules, earlyAccessMins: Number(e.target.value) })}
                className="admin-form-input font-mono text-xs"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Minutes before public drop drops on the site.</span>
            </div>

            <div>
              <label className="admin-form-label">Hall of Fame Priority Window (Minutes)</label>
              <input 
                type="number"
                value={programRules.hofEarlyAccessMins}
                onChange={e => setProgramRules({ ...programRules, hofEarlyAccessMins: Number(e.target.value) })}
                className="admin-form-input font-mono text-xs"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">Maximum priority reservation window.</span>
            </div>

            <div className="pt-3 border-t border-[#222] space-y-2">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input 
                  type="checkbox"
                  checked={programRules.freeShippingHof}
                  onChange={e => setProgramRules({ ...programRules, freeShippingHof: e.target.checked })}
                  className="accent-[#ff3b30]"
                />
                <span>Free Express Shipping automatically applied for Hall of Fame collectors</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input 
                  type="checkbox"
                  checked={programRules.exclusiveDrops}
                  onChange={e => setProgramRules({ ...programRules, exclusiveDrops: e.target.checked })}
                  className="accent-[#ff3b30]"
                />
                <span>Enable VIP-Exclusive Mystery Hat Pin giveaways with drops over $100</span>
              </label>
            </div>
          </div>
        </form>
      )}

      {selectedMember && (
        <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMemberId(null); }}>
          <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
            <header className="admin-drawer-header">
              <div><span className="admin-intro-eyebrow">CUSTOMER / ACCESS PASS PROFILE</span><h2 id="customer-detail-title">Customer details</h2><p>Thông tin thành viên và quyền lợi được lưu trong hồ sơ Supabase.</p></div>
              <button type="button" className="admin-icon-button" onClick={() => setSelectedMemberId(null)} aria-label="Close customer details"><X size={18} /></button>
            </header>
            <div className="admin-drawer-body">
              <div className="admin-drawer-status-strip"><div><strong>{selectedMember.name}</strong><div className="admin-drawer-status-value"><span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${getTierBadge(selectedMember.tier)}`}>{selectedMember.tier}</span><span className="text-xs text-zinc-500">{selectedMember.points.toLocaleString()} points</span></div></div><Users size={22} className="text-[#ff3b30]" /></div>
              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Contact & profile</h3><span className="admin-section-count">Customer record</span></div><div className="space-y-3 text-xs"><div className="flex items-center gap-2 text-zinc-300"><Mail size={14} className="text-zinc-500" />{selectedMember.email || 'Email not available'}</div><div className="flex items-center gap-2 text-zinc-300"><CalendarDays size={14} className="text-zinc-500" />Joined {selectedMember.joinedDate || 'Date not available'}</div><div className="flex items-center gap-2 text-zinc-300"><ShoppingBag size={14} className="text-zinc-500" />{selectedMember.ordersCount || 0} orders placed</div><div className="flex items-center gap-2 text-zinc-300"><Award size={14} className="text-zinc-500" />Preferred fitted size {selectedMember.preferredSize || 'Not set'}</div></div></section>
              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Points actions</h3><span className="admin-section-count">Manual adjustment</span></div><p className="admin-form-help">Điều chỉnh điểm sẽ tự cập nhật tier theo ngưỡng Access Pass hiện tại.</p><div className="flex gap-2"><button type="button" className="btn-secondary flex-1 text-xs" onClick={() => handleAdjustPoints(selectedMember.id, 100)}>+100 points</button><button type="button" className="btn-secondary flex-1 text-xs" onClick={() => handleAdjustPoints(selectedMember.id, -100)}>-100 points</button></div></section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
