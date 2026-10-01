import React, { useState } from 'react';
import { 
  Settings, DollarSign, Tag, CreditCard, Bell, Save, 
  CheckCircle2, Plus, Trash2, Shield, Globe, Sparkles 
} from 'lucide-react';

export default function AdminSettings({ settings, onSaveSettings }) {
  const [form, setForm] = useState(settings);
  const [notice, setNotice] = useState('');
  const [newPromoCode, setNewPromoCode] = useState({ code: '', discountPercent: 15 });

  const handleTogglePromo = (code) => {
    const updatedPromos = form.promoCodes.map(p => 
      p.code === code ? { ...p, active: !p.active } : p
    );
    const updated = { ...form, promoCodes: updatedPromos };
    setForm(updated);
    onSaveSettings(updated);
  };

  const handleDeletePromo = (code) => {
    const updatedPromos = form.promoCodes.filter(p => p.code !== code);
    const updated = { ...form, promoCodes: updatedPromos };
    setForm(updated);
    onSaveSettings(updated);
    setNotice(`Promo code "${code}" removed.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleAddPromo = (e) => {
    e.preventDefault();
    if (!newPromoCode.code.trim()) return;

    const codeUpper = newPromoCode.code.trim().toUpperCase();
    if (form.promoCodes.some(p => p.code === codeUpper)) {
      alert('This promo code already exists!');
      return;
    }

    const newPromo = {
      code: codeUpper,
      discountPercent: Number(newPromoCode.discountPercent) || 15,
      active: true
    };

    const updated = { ...form, promoCodes: [...form.promoCodes, newPromo] };
    setForm(updated);
    onSaveSettings(updated);
    setNewPromoCode({ code: '', discountPercent: 15 });
    setNotice(`Promo code "${codeUpper}" created!`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggleGateway = (key) => {
    const updated = {
      ...form,
      paymentGateways: {
        ...form.paymentGateways,
        [key]: !form.paymentGateways[key]
      }
    };
    setForm(updated);
    onSaveSettings(updated);
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    onSaveSettings(form);
    setNotice('Store settings saved successfully!');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">SYSTEM & STORE CONFIGURATION</div>
          <h1>STORE OPERATIONS & SETTINGS</h1>
          <p className="admin-intro-desc">
            Fine-tune free shipping thresholds, global currency conversions, drop promo codes, and checkout payment gateways.
          </p>
        </div>

        <button 
          onClick={handleSaveGeneral}
          className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
        >
          <Save size={15} />
          <span>SAVE STORE SETTINGS</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#3ed660]" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Store Details */}
        <form onSubmit={handleSaveGeneral} className="admin-panel space-y-4">
          <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <Globe className="text-[#ff3b30]" size={16} />
            <span>Storefront Profile</span>
          </h3>

          <div>
            <label className="admin-form-label">Store Brand Name</label>
            <input 
              type="text"
              value={form.storeName}
              onChange={e => setForm({ ...form, storeName: e.target.value })}
              className="admin-form-input text-xs"
            />
          </div>

          <div>
            <label className="admin-form-label">Storefront Tagline</label>
            <input 
              type="text"
              value={form.tagline}
              onChange={e => setForm({ ...form, tagline: e.target.value })}
              className="admin-form-input text-xs"
            />
          </div>

          <div>
            <label className="admin-form-label">Customer Support Email</label>
            <input 
              type="email"
              value={form.supportEmail}
              onChange={e => setForm({ ...form, supportEmail: e.target.value })}
              className="admin-form-input text-xs"
            />
          </div>

          <div className="pt-2">
            <label className="admin-form-label">Free Domestic Shipping Threshold ($ USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
              <input 
                type="number"
                min="0"
                step="1"
                value={form.freeShippingThreshold}
                onChange={e => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })}
                className="admin-form-input pl-7 font-mono text-xs"
              />
            </div>
            <span className="text-[10px] text-zinc-500 block mt-1">
              Customers receive free standard tracked shipping once their cart reaches this amount (currently $99).
            </span>
          </div>
        </form>

        {/* Promo Codes Engine */}
        <div className="admin-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <Tag className="text-amber-400" size={16} />
              <span>Active Drop Promo Codes</span>
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {form.promoCodes?.length || 0} Codes
            </span>
          </div>

          {/* List of active codes */}
          <div className="space-y-2">
            {form.promoCodes?.map(promo => (
              <div 
                key={promo.code}
                className="flex items-center justify-between p-3 bg-[#181818] rounded-lg border border-[#2a2a2a]"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-[#222] text-[#ff3b30] font-mono font-black text-xs rounded border border-red-900/40">
                    {promo.code}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {promo.discountPercent}% OFF Order
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Applied at slide-out checkout drawer
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleTogglePromo(promo.code)}
                    className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-colors cursor-pointer ${
                      promo.active 
                        ? 'bg-[#3ed660]/20 text-[#3ed660] border border-[#3ed660]/40' 
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {promo.active ? 'ACTIVE' : 'PAUSED'}
                  </button>

                  <button 
                    onClick={() => handleDeletePromo(promo.code)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete promo code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new promo code */}
          <form onSubmit={handleAddPromo} className="pt-3 border-t border-[#222] flex gap-2">
            <input 
              type="text"
              required
              value={newPromoCode.code}
              onChange={e => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
              placeholder="NEW CODE (e.g. FLASH25)"
              className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs font-mono uppercase text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3b30]"
            />
            <input 
              type="number"
              min="1"
              max="90"
              value={newPromoCode.discountPercent}
              onChange={e => setNewPromoCode({ ...newPromoCode, discountPercent: e.target.value })}
              className="w-20 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs font-mono text-white focus:outline-none focus:border-[#ff3b30]"
              placeholder="%"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-[#222] hover:bg-[#ff3b30] text-white text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Payment Gateways */}
        <div className="admin-panel space-y-4">
          <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <CreditCard className="text-[#3ed660]" size={16} />
            <span>Supported Payment Rails</span>
          </h3>

          <div className="space-y-2">
            {[
              { key: 'shopPay', label: 'Shop Pay Express Checkout', desc: '1-tap accelerated fitted checkout with SMS OTP' },
              { key: 'applePay', label: 'Apple Pay & Google Pay', desc: 'Native biometric mobile checkout' },
              { key: 'payPal', label: 'PayPal & Pay in 4', desc: 'Split payments across 4 bi-weekly installments' },
              { key: 'creditCard', label: 'Credit / Debit Card (Stripe / Adyen)', desc: 'Visa, Mastercard, Amex, Discover' }
            ].map(gateway => (
              <div 
                key={gateway.key}
                className="flex items-center justify-between p-3 bg-[#181818] rounded-lg border border-[#262626]"
              >
                <div>
                  <div className="text-xs font-bold text-white">{gateway.label}</div>
                  <div className="text-[11px] text-zinc-500">{gateway.desc}</div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={Boolean(form.paymentGateways?.[gateway.key])}
                    onChange={() => handleToggleGateway(gateway.key)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3ed660]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Drop Notification Settings */}
        <div className="admin-panel space-y-4">
          <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <Bell className="text-sky-400" size={16} />
            <span>Drop Alerts & Push Dispatch</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#181818] rounded-lg border border-[#262626]">
              <div>
                <div className="text-xs font-bold text-white">SMS Drop Broadcasts</div>
                <div className="text-[11px] text-zinc-500">Twilio / Klaviyo drop blast 10 minutes prior to drop time</div>
              </div>
              <input 
                type="checkbox" 
                checked={form.notifications?.smsDrops ?? true}
                onChange={e => setForm({
                  ...form,
                  notifications: { ...form.notifications, smsDrops: e.target.checked }
                })}
                className="accent-[#ff3b30] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#181818] rounded-lg border border-[#262626]">
              <div>
                <div className="text-xs font-bold text-white">Email Drop Notifications</div>
                <div className="text-[11px] text-zinc-500">Send high-res calendar lookbooks to all subscriber lists</div>
              </div>
              <input 
                type="checkbox" 
                checked={form.notifications?.emailDrops ?? true}
                onChange={e => setForm({
                  ...form,
                  notifications: { ...form.notifications, emailDrops: e.target.checked }
                })}
                className="accent-[#ff3b30] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
