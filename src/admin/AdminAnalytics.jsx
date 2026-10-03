import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
];

function amountOf(order) {
  return Number(order?.grandTotal ?? order?.total ?? order?.subtotal ?? 0) || 0;
}

function orderDate(order) {
  const date = new Date(order?.date || order?.created_at || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPaid(order) {
  return String(order?.paymentStatus || '').toUpperCase() === 'PAID'
    || ['SHIPPED', 'DELIVERED'].includes(String(order?.fulfillmentStatus || '').toUpperCase());
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function shortDay(date, days) {
  return date.toLocaleDateString('en-US', days > 31 ? { month: 'short' } : { month: 'short', day: 'numeric' });
}

function MetricCard({ label, value, note, icon: Icon, tone = 'red', delta }) {
  return (
    <div className={`admin-kpi-card border-l-4 ${tone === 'green' ? 'border-l-[#3ed660]' : tone === 'gold' ? 'border-l-[#ffaa00]' : tone === 'blue' ? 'border-l-[#2563eb]' : 'border-l-[#ff3b30]'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="admin-kpi-label">{label}</span>
        <Icon size={15} className={tone === 'green' ? 'text-[#3ed660]' : tone === 'gold' ? 'text-[#ffaa00]' : tone === 'blue' ? 'text-[#60a5fa]' : 'text-[#ff3b30]'} />
      </div>
      <div className="admin-kpi-value">{value}</div>
      <div className="admin-kpi-note flex items-center gap-1">
        {delta && (delta.direction === 'up' ? <ArrowUpRight size={13} className="text-[#3ed660]" /> : <ArrowDownRight size={13} className="text-amber-300" />)}
        <span>{delta?.label || note}</span>
      </div>
    </div>
  );
}

export default function AdminAnalytics({ products = [], orders = [], members = [], catalogStats = null, currency = 'USD' }) {
  const [range, setRange] = useState('30');
  const days = RANGE_OPTIONS.find((option) => option.value === range)?.days || 30;

  const rangeOrders = useMemo(() => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return orders.filter((order) => {
      const date = orderDate(order);
      return date && date.getTime() >= cutoff;
    });
  }, [days, orders]);

  const paidOrders = useMemo(() => rangeOrders.filter(isPaid), [rangeOrders]);
  const grossSales = useMemo(() => paidOrders.reduce((sum, order) => sum + amountOf(order), 0), [paidOrders]);
  const averageOrderValue = paidOrders.length ? grossSales / paidOrders.length : 0;
  const sellableCount = catalogStats?.matchedActive != null
    ? Number(catalogStats.matchedActive)
    : products.filter((product) => product.source1688Status === 'MATCHED' && product.status !== 'DRAFT').length;

  const chart = useMemo(() => {
    const today = new Date();
    const points = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (days - index - 1));
      return { key: dayKey(date), label: shortDay(date, days), value: 0, orders: 0 };
    });
    const byDay = new Map(points.map((point) => [point.key, point]));
    paidOrders.forEach((order) => {
      const date = orderDate(order);
      const point = date && byDay.get(dayKey(date));
      if (point) {
        point.value += amountOf(order);
        point.orders += 1;
      }
    });
    return points;
  }, [days, paidOrders]);

  const maxChartValue = Math.max(1, ...chart.map((point) => point.value));

  const topProducts = useMemo(() => {
    const byProduct = new Map();
    paidOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.id || item.title || 'unknown';
        const current = byProduct.get(key) || { id: key, title: item.title || 'Untitled product', quantity: 0, revenue: 0, thumbnail: item.thumbnail };
        const quantity = Number(item.quantity || 1);
        current.quantity += quantity;
        current.revenue += (Number(item.price || item.unitPrice || 0) || 0) * quantity;
        byProduct.set(key, current);
      });
    });
    return [...byProduct.values()].sort((left, right) => right.quantity - left.quantity).slice(0, 5);
  }, [paidOrders]);

  const inventoryHealth = useMemo(() => {
    const result = { matched: 0, pending: 0, review: 0, notFound: 0, draft: 0 };
    products.forEach((product) => {
      const status = String(product.source1688Status || 'PENDING').toUpperCase();
      if (status === 'MATCHED' && product.status !== 'DRAFT') result.matched += 1;
      else if (status === 'REVIEW') result.review += 1;
      else if (status === 'NOT_FOUND') result.notFound += 1;
      else result.pending += 1;
      if (product.status === 'DRAFT') result.draft += 1;
    });
    if (catalogStats) {
      result.matched = Number(catalogStats.matchedActive || 0);
      result.pending = Number(catalogStats.pending || 0);
      result.review = Number(catalogStats.review || 0);
      result.notFound = Number(catalogStats.notFound || 0);
    }
    return result;
  }, [catalogStats, products]);

  const totalTracked = inventoryHealth.matched + inventoryHealth.pending + inventoryHealth.review + inventoryHealth.notFound;
  const paidLabel = paidOrders.length ? `${paidOrders.length} paid order${paidOrders.length === 1 ? '' : 's'}` : 'No paid orders in this period';

  return (
    <div className="admin-content animate-fade-in space-y-6">
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">ANALYTICS / STORE PERFORMANCE</div>
          <h1>ANALYTICS OVERVIEW</h1>
          <p className="admin-intro-desc">Theo dõi doanh thu, đơn hàng, khách hàng và độ sẵn sàng của catalog theo đúng luồng báo cáo của Shopify.</p>
        </div>
        <label className="admin-select-field min-w-[170px]">
          <CalendarDays size={14} aria-hidden="true" />
          <span className="sr-only">Reporting period</span>
          <select value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGE_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <section className="admin-kpi-grid" aria-label="Analytics summary">
        <MetricCard label="Gross sales" value={formatPrice(grossSales, currency)} note={paidLabel} icon={TrendingUp} />
        <MetricCard label="Orders" value={paidOrders.length.toLocaleString()} note={`${rangeOrders.length.toLocaleString()} records in period`} icon={ShoppingBag} tone="gold" />
        <MetricCard label="Average order value" value={formatPrice(averageOrderValue, currency)} note="Paid orders only" icon={BarChart3} tone="blue" />
        <MetricCard label="Sellable listings" value={sellableCount.toLocaleString()} note={`${totalTracked.toLocaleString()} catalog records tracked`} icon={Package} tone="green" />
        <MetricCard label="Customers" value={members.length.toLocaleString()} note="Profiles in Access Pass" icon={Users} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <section className="admin-panel xl:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-[#242424] pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Sales over time</h2>
              <p className="mt-1 text-xs text-zinc-500">Paid order value in {currency}. Zero bars mean there is no persisted order for that day.</p>
            </div>
            <span className="text-xs font-bold text-zinc-400">{formatPrice(grossSales, currency)}</span>
          </div>
          <div className="flex h-56 items-end gap-1.5 border-b border-[#2a2a2a] px-1 pb-1">
            {chart.map((point) => (
              <div key={point.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2" title={`${point.label}: ${formatPrice(point.value, currency)}`}>
                <div className="relative flex min-h-[4px] flex-1 items-end">
                  <div className="w-full rounded-t bg-[#ff3b30] opacity-80 transition-opacity group-hover:opacity-100" style={{ height: `${Math.max(2, (point.value / maxChartValue) * 100)}%` }} />
                  {point.value > 0 && <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#242424] px-2 py-1 text-[10px] font-bold text-white group-hover:block">{formatPrice(point.value, currency)}</span>}
                </div>
                {(days <= 30 || point.key === chart[0]?.key || point.key === chart[chart.length - 1]?.key) && <span className="truncate text-center text-[9px] text-zinc-600">{point.label}</span>}
              </div>
            ))}
          </div>
          {!paidOrders.length && <div className="flex items-center gap-2 rounded border border-dashed border-[#333] px-3 py-2 text-xs text-zinc-500"><CircleAlert size={14} /> Chưa có đơn đã thanh toán trong khoảng thời gian này.</div>}
        </section>

        <section className="admin-panel space-y-4">
          <div className="border-b border-[#242424] pb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Catalog health</h2>
            <p className="mt-1 text-xs text-zinc-500">Nguồn 1688 quyết định listing có thể bán hay chưa.</p>
          </div>
          <div className="space-y-3">
            {[
              ['MATCHED / sellable', inventoryHealth.matched, 'bg-[#3ed660]', 'text-[#3ed660]'],
              ['PENDING review', inventoryHealth.pending, 'bg-[#ffaa00]', 'text-[#ffaa00]'],
              ['REVIEW', inventoryHealth.review, 'bg-[#60a5fa]', 'text-[#60a5fa]'],
              ['NOT_FOUND', inventoryHealth.notFound, 'bg-[#ff3b30]', 'text-[#ff3b30]'],
            ].map(([label, value, bar, text]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-xs"><span className="text-zinc-300">{label}</span><strong className={text}>{Number(value).toLocaleString()}</strong></div>
                <div className="h-1.5 overflow-hidden rounded bg-[#262626]"><div className={`h-full rounded ${bar}`} style={{ width: `${totalTracked ? Math.max(2, (Number(value) / totalTracked) * 100) : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 border-t border-[#242424] pt-3 text-[11px] leading-5 text-zinc-500"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#3ed660]" /> Chỉ MATCHED và có URL 1688 mới được bật bán trên storefront.</div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <section className="admin-panel xl:col-span-2 overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-[#242424] px-5 py-4">
            <div><h2 className="text-sm font-black uppercase tracking-wider text-white">Top products</h2><p className="mt-1 text-xs text-zinc-500">Xếp theo số lượng đã bán từ đơn persisted.</p></div>
            <Sparkles size={16} className="text-[#ff3b30]" />
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table"><thead><tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr></thead><tbody>
              {topProducts.length ? topProducts.map((product, index) => (
                <tr key={product.id}><td><div className="flex items-center gap-3"><span className="w-5 text-center text-xs font-black text-zinc-600">{index + 1}</span>{product.thumbnail ? <img src={product.thumbnail} alt="" className="h-9 w-9 rounded border border-[#333] bg-[#0d0d0d] object-contain" /> : <div className="h-9 w-9 rounded border border-[#333] bg-[#191919]" />}<span className="max-w-[340px] truncate text-xs font-bold text-white">{product.title}</span></div></td><td className="text-xs font-bold text-zinc-300">{product.quantity.toLocaleString()}</td><td className="text-xs font-bold text-white">{formatPrice(product.revenue, currency)}</td></tr>
              )) : <tr><td colSpan="3" className="py-12 text-center text-sm text-zinc-500">Chưa có dữ liệu bán hàng để xếp hạng.</td></tr>}
            </tbody></table>
          </div>
        </section>

        <section className="admin-panel space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Next actions</h2>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 rounded border border-[#2a2a2a] bg-[#181818] p-3"><Package size={14} className="mt-0.5 text-[#ffaa00]" /><span className="leading-5 text-zinc-300">Review {inventoryHealth.pending + inventoryHealth.review + inventoryHealth.notFound} listing chưa có nguồn 1688 MATCHED.</span></div>
            <div className="flex items-start gap-2 rounded border border-[#2a2a2a] bg-[#181818] p-3"><Users size={14} className="mt-0.5 text-[#60a5fa]" /><span className="leading-5 text-zinc-300">Phân tích nhóm khách hàng VIP trước đợt drop tiếp theo.</span></div>
            <div className="flex items-start gap-2 rounded border border-[#2a2a2a] bg-[#181818] p-3"><BarChart3 size={14} className="mt-0.5 text-[#3ed660]" /><span className="leading-5 text-zinc-300">Doanh thu chỉ tính từ order đã thanh toán trong Supabase.</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
