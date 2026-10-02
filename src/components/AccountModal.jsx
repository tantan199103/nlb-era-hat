import React, { useState } from 'react';
import { X, User, Sparkles, Package, MapPin, Ruler, LogOut, Check, ArrowRight } from 'lucide-react';
import { hasSupabase } from '../lib/supabase';
import { formatPrice } from '../utils/currency';

export default function AccountModal({ 
  isOpen, 
  onClose, 
  user, 
  orders = [],
  ordersLoading = false,
  ordersError = '',
  onLogin, 
  onLogout,
  userPreferredSize,
  onUpdatePreferredSize
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'settings' | 'points'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  if (!isOpen) return null;

  const fittedSizes = ['6 7/8', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2', '7 5/8', '7 3/4', '7 7/8', '8'];

  // Order history is supplied by the authenticated user's RLS-scoped query.
  // Never render seeded/demo orders here because they look like purchases.
  const pastOrders = Array.isArray(orders) ? orders : [];
  const formatOrderDate = (value) => {
    if (!value) return 'Date pending';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date pending' : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const result = await onLogin({ email: email.trim(), password, signUp: isSignUp });
      setPassword('');
      setAuthMessage(result?.message || '');
      if (isSignUp) setIsSignUp(false);
    } catch (error) {
      setAuthError(error.message || 'Unable to authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      await onLogout();
    } catch (error) {
      setAuthError(error.message || 'Unable to sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[620px] max-h-[90vh] bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col custom-scroll">
        
        {/* Header */}
        <div className="p-5 border-b border-[#242424] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-[#ff3b30]" />
            <h3 className="font-display text-lg font-black text-white uppercase tracking-wider">
              {user ? 'MY LIDS HD ACCOUNT' : 'SIGN IN / JOIN ACCESS PASS'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scroll">
          {authError && <p role="alert" className="mb-4 text-sm text-red-400">{authError}</p>}
          {authMessage && <p role="status" className="mb-4 text-sm text-gray-300">{authMessage}</p>}
          {user ? (
            <div className="space-y-6">
              
              {/* Member Profile Summary */}
              <div className="bg-[#1a1a1a] border border-[#2b2b2b] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-display text-xl font-black text-white uppercase">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                  <div className="inline-flex items-center gap-1.5 mt-2 bg-[#2b200b] border border-[#ffaa00]/40 px-2.5 py-0.5 rounded text-[11px] font-bold text-[#ffaa00]">
                    <Sparkles size={12} />
                    <span>{user.offline ? 'Offline demo account' : 'Authenticated account'}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSignOut}
                  disabled={busy}
                  className="btn-secondary text-[11px] py-1.5 px-3 text-gray-400 hover:text-[#ff3b30] flex items-center gap-1"
                >
                  <LogOut size={12} />
                  <span>Log Out</span>
                </button>
              </div>

              {/* Sub-nav Tabs */}
              <div className="flex border-b border-[#242424] text-xs">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`pb-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                    activeTab === 'orders' ? 'text-white border-b-2 border-[#e10600]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Past Drop Orders
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`pb-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                    activeTab === 'settings' ? 'text-white border-b-2 border-[#e10600]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Fitted Size Preference
                </button>
              </div>

              {/* Tab 1: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {ordersLoading && <p className="text-xs text-gray-400">Loading your order history…</p>}
                  {!ordersLoading && ordersError && <p role="alert" className="text-xs leading-5 text-amber-200">{ordersError}</p>}
                  {!ordersLoading && !ordersError && !pastOrders.length && <p className="text-xs text-gray-400">No orders are linked to this account yet.</p>}
                  {!ordersLoading && pastOrders.map((ord) => (
                    <div key={ord.id} className="bg-[#181818] border border-[#252525] p-3.5 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-display font-black text-white">{ord.orderNumber || 'Order reference pending'}</span>
                        <span className="bg-[#1f2d22] text-[#3ed660] text-[10px] font-bold px-2 py-0.5 rounded">
                          {String(ord.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-gray-200">{ord.items?.length || 0} item{ord.items?.length === 1 ? '' : 's'} • {formatOrderDate(ord.date)}</div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                        <span>{ord.items?.[0]?.size ? `Size: ${ord.items[0].size}` : 'Drop order'}</span>
                        <span className="font-bold text-white">{formatPrice(ord.subtotal || 0, ord.currency || 'USD')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Fitted Size Preference */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                      Your Preferred 59FIFTY Fitted Size:
                    </h4>
                    <p className="text-[11px] text-gray-500 mb-3">
                      When selected, this size will automatically be pre-highlighted across all product cards and drop collections!
                    </p>

                    <div className="grid grid-cols-5 gap-2">
                      {fittedSizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => onUpdatePreferredSize(sz)}
                          className={`h-10 rounded font-bold text-xs flex items-center justify-center transition-all ${
                            userPreferredSize === sz
                              ? 'bg-white text-black font-extrabold shadow-md'
                              : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#282828] border border-[#2c2c2c]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>

                    {userPreferredSize && (
                      <div className="flex items-center gap-1.5 text-xs text-[#3ed660] font-bold mt-3">
                        <Check size={14} />
                        <span>Saved preference: Size {userPreferredSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight mb-1">
                  {isSignUp ? 'CREATE YOUR COLLECTOR ACCOUNT' : 'SIGN IN TO YOUR COLLECTOR VAULT'}
                </h3>
                <p className="text-xs text-gray-400">
                  {hasSupabase ? 'Sign in securely with your email and password.' : 'Account access is unavailable until Supabase Auth is configured.'}
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    autoComplete="email"
                    disabled={busy}
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333333] rounded px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    Password
                  </label>
                  <input 
                    type="password" 
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={isSignUp ? 6 : undefined}
                    disabled={busy}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333333] rounded px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={busy}
                  className="w-full btn-flame text-xs py-3 mt-2"
                >
                  {busy ? 'PLEASE WAIT…' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN TO LIDS HD'}
                </button>
              </form>

              <div className="text-center text-xs text-gray-500 pt-2 border-t border-[#222222]">
                {isSignUp ? 'Already have an account?' : 'New to Lids Hat Drop?'} <br />
                <button 
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setIsSignUp((value) => !value);
                    setAuthError('');
                    setAuthMessage('');
                  }}
                  className="text-white hover:underline font-bold mt-1 inline-block"
                >
                  {isSignUp ? 'Sign in instead' : 'Create an account'} &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
