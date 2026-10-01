import React, { useState } from 'react';
import { X, Bell, Check, Sparkles } from 'lucide-react';

export default function NotifyModal({ isOpen, onClose, dropTitle, onSubmit }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    onSubmit?.(dropTitle, email);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      setPhone('');
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[460px] bg-[#141414] border border-[#2e2e2e] rounded-xl p-6 sm:p-8 z-10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 bg-[#3ed660]/20 text-[#3ed660] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} />
            </div>
            <h3 className="font-display text-2xl font-black text-white uppercase tracking-wider mb-2">
              YOU'RE ON THE VIP LIST!
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              We'll send you a drop reminder 15 minutes before launch so you don't miss out on sizes.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[#e10600] font-bold text-xs uppercase tracking-widest mb-2">
              <Bell size={15} />
              <span>DROP NOTIFICATION</span>
            </div>

            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight mb-2">
              NEVER MISS A HEAT DROP
            </h3>

            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Sign up to receive instantaneous SMS & email alerts for <span className="text-white font-bold">{dropTitle || 'Upcoming Drops'}</span> before inventory sells out.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1.5">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1.5">
                  Mobile Number (Optional for SMS drop ping)
                </label>
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-400">
                <input type="checkbox" id="consent" defaultChecked className="mt-0.5 accent-[#e10600]" />
                <label htmlFor="consent">
                  Send me exclusive early access codes and notifications via SMS & email.
                </label>
              </div>

              <button 
                type="submit"
                className="w-full btn-flame text-xs py-3 mt-4"
              >
                NOTIFY ME WHEN IT DROPS
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
