import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, ExternalLink, Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STATUS_STEPS = [
  { key: 'pending', title: 'Order confirmed', desc: 'Your order is waiting for payment and fulfillment review.' },
  { key: 'processing', title: 'Vault inspection', desc: 'The team is preparing and inspecting your drop inventory.' },
  { key: 'shipped', title: 'Shipped', desc: 'Your parcel has been handed to the carrier.' },
  { key: 'delivered', title: 'Delivered', desc: 'The carrier marked this parcel as delivered.' },
];

function normaliseOrderNumber(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function normaliseStatus(value) {
  const status = String(value || 'pending').toLowerCase();
  return STATUS_STEPS.some((step) => step.key === status) ? status : 'pending';
}

function formatDate(value) {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TrackOrderPage() {
  const [orderInput, setOrderInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentStatus = normaliseStatus(order?.status);
  const currentIndex = useMemo(() => STATUS_STEPS.findIndex((step) => step.key === currentStatus), [currentStatus]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const orderNumber = normaliseOrderNumber(orderInput);
    const email = emailInput.trim().toLowerCase();
    setSearched(true);
    setOrder(null);
    setError('');

    if (!orderNumber || !email) {
      setError('Enter both the order number and the email used at checkout.');
      return;
    }
    if (!supabase) {
      setError('Live order tracking is not configured in this environment yet.');
      return;
    }

    setLoading(true);
    try {
      // Guest orders are intentionally hidden by the normal orders SELECT
      // policy. The RPC performs the exact order-number + email match inside
      // Supabase and returns only the tracking fields needed here.
      const { data, error: queryError } = await supabase.rpc('lookup_order_for_tracking', {
        p_order_number: orderNumber,
        p_email: email,
      });
      if (queryError) throw queryError;
      const matchedOrder = Array.isArray(data) ? data[0] : data;
      if (!matchedOrder) {
        setError('No order matched that number and email. Check the details and try again.');
        return;
      }
      setOrder(matchedOrder);
    } catch (queryError) {
      setError(queryError?.message || 'Unable to load tracking details right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] animate-fade-in px-4 py-10 sm:py-16 lg:px-8">
      <div className="mx-auto mb-10 max-w-[600px] text-center">
        <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-[#ff3b30]">Shipment tracking</span>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Track your drop</h1>
        <p className="mt-2 text-xs text-gray-400 sm:text-sm">Use the order number and checkout email to view the latest carrier status.</p>
      </div>

      <div className="mx-auto mb-10 max-w-[680px] rounded-xl border border-[#282828] bg-[#141414] p-5 shadow-xl sm:p-6">
        <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="sr-only" htmlFor="track-order-number">Order number</label>
          <input id="track-order-number" type="text" placeholder="Order number from confirmation email" value={orderInput} onChange={(event) => setOrderInput(event.target.value)} autoComplete="off" className="w-full rounded border border-[#333] bg-[#1e1e1e] px-3 py-2.5 text-xs font-bold uppercase text-white placeholder:normal-case placeholder:text-gray-500 focus:border-white focus:outline-none" />
          <label className="sr-only" htmlFor="track-order-email">Checkout email</label>
          <input id="track-order-email" type="email" placeholder="Checkout email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} autoComplete="email" className="w-full rounded border border-[#333] bg-[#1e1e1e] px-3 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-white focus:outline-none" />
          <button type="submit" disabled={loading} className="btn-flame flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs disabled:opacity-60"><Search size={14} aria-hidden="true" /><span>{loading ? 'LOOKING UP…' : 'TRACK SHIPMENT'}</span></button>
        </form>
        {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs leading-5 text-amber-200"><CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</div>}
      </div>

      {searched && order && (
        <div className="space-y-8 rounded-xl border border-[#242424] bg-[#121212] p-6 shadow-2xl sm:p-10">
          <div className="flex flex-col justify-between gap-3 border-b border-[#242424] pb-6 sm:flex-row sm:items-center">
            <div><div className="text-xs font-semibold uppercase text-gray-400">Tracking order</div><div className="font-display text-2xl font-black text-white">{order.order_number}</div><div className="mt-1 text-xs text-gray-500">Placed {formatDate(order.created_at)}</div></div>
            <div className="sm:text-right"><span className="inline-flex items-center gap-1.5 rounded border border-[#2e5236] bg-[#1f2d22] px-3 py-1 text-xs font-bold uppercase text-[#3ed660]"><Package size={13} aria-hidden="true" /> {currentStatus}</span><div className="mt-2 text-xs text-gray-400">Carrier: {order.shipping_address?.carrier || 'Awaiting carrier scan'}</div>{order.tracking_number && <div className="mt-1 text-xs text-gray-300">Tracking: <span className="font-mono">{order.tracking_number}</span></div>}</div>
          </div>

          <div className="relative space-y-6 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-[#252525]">
            {STATUS_STEPS.map((step, index) => {
              const done = index <= currentIndex;
              const date = step.key === 'pending' ? order.created_at : step.key === currentStatus ? order.updated_at : null;
              return <div key={step.key} className="relative flex items-start gap-4 pl-8"><div className={`absolute left-1.5 top-0.5 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full ${done ? 'bg-[#3ed660] ring-4 ring-[#1f2d22]' : 'border border-[#555] bg-[#333]'}`}>{done && <CheckCircle2 size={12} className="text-black" aria-hidden="true" />}</div><div className="flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline"><h4 className={`font-display text-base font-bold uppercase ${done ? 'text-white' : 'text-gray-500'}`}>{step.title}</h4><span className="text-xs font-semibold text-[#ffaa00]">{formatDate(date)}</span></div><p className="mt-0.5 text-xs leading-relaxed text-gray-400">{step.desc}</p></div></div>;
            })}
          </div>

          {order.shipping_address?.trackingUrl && <a href={order.shipping_address.trackingUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs">Open carrier tracking <ExternalLink size={13} aria-hidden="true" /></a>}
        </div>
      )}

      {searched && !order && !error && !loading && <div className="rounded-lg border border-[#262626] bg-[#141414] px-6 py-14 text-center text-sm text-gray-500">Enter your order details to see live tracking.</div>}
    </div>
  );
}
