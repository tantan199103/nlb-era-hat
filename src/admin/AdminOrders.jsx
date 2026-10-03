import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Filter,
  Mail,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { validateOrderUpdate } from '../lib/adminOperations';

const STATUS_META = {
  UNFULFILLED: { label: 'Unfulfilled', tone: 'danger', description: 'Awaiting pick & pack' },
  IN_PROGRESS: { label: 'Processing', tone: 'warning', description: 'Being picked or packed' },
  SHIPPED: { label: 'Shipped', tone: 'success', description: 'With the courier' },
  DELIVERED: { label: 'Delivered', tone: 'success', description: 'Completed delivery' },
  CANCELLED: { label: 'Cancelled', tone: 'muted', description: 'Order stopped' },
};

const CARRIERS = [
  'UPS Ground Tracked',
  'UPS 2nd Day Air',
  'FedEx Home Delivery',
  'USPS Priority Mail',
  'DHL Express International',
];

function upper(value) {
  return String(value || '').toUpperCase();
}

function safeText(value, fallback = '—') {
  return String(value || '').trim() || fallback;
}

function orderDate(order) {
  const raw = order?.date || order?.created_at;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function formatDate(order, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const parsed = orderDate(order);
  return parsed ? parsed.toLocaleDateString('en-US', options) : 'Date unavailable';
}

function normalizedStatus(order) {
  const status = upper(order?.fulfillmentStatus || order?.status);
  return STATUS_META[status] ? status : 'UNFULFILLED';
}

function statusClass(status) {
  const tone = STATUS_META[status]?.tone || 'muted';
  return {
    danger: 'admin-status-badge is-danger',
    warning: 'admin-status-badge is-warning',
    success: 'admin-status-badge is-success',
    muted: 'admin-status-badge is-muted',
  }[tone];
}

function paymentClass(status) {
  const normalized = upper(status);
  if (normalized === 'PAID') return 'admin-status-badge is-success';
  if (normalized === 'CANCELLED') return 'admin-status-badge is-muted';
  return 'admin-status-badge is-warning';
}

function trackingUrlFor(carrier, trackingNumber) {
  const number = String(trackingNumber || '').trim();
  if (!number) return '';
  const encoded = encodeURIComponent(number);
  const name = String(carrier || '').toLowerCase();
  if (name.includes('ups')) return `https://www.ups.com/track?tracknum=${encoded}`;
  if (name.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  if (name.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  return '';
}

function addressLines(address = {}) {
  const line1 = address.street || address.address1 || address.line1;
  const line2 = address.address2 || address.line2;
  const city = [address.city, address.state || address.province, address.postalCode || address.zip].filter(Boolean).join(', ');
  const country = address.country || address.countryCode;
  return [line1, line2, city, country].filter(Boolean);
}

function itemCount(order) {
  return (order?.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function OrderStatusBadge({ status }) {
  const key = normalizedStatus({ fulfillmentStatus: status });
  return <span className={statusClass(key)}>{STATUS_META[key].label}</span>;
}

function PaymentBadge({ status }) {
  return <span className={paymentClass(status)}>{safeText(status, 'PENDING')}</span>;
}

export default function AdminOrders({ orders = [], onSaveOrders, currency = 'USD' }) {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [dateWindow, setDateWindow] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeTone, setNoticeTone] = useState('success');
  const [form, setForm] = useState({
    fulfillmentStatus: 'UNFULFILLED',
    carrier: CARRIERS[0],
    trackingNumber: '',
    trackingUrl: '',
  });

  const counts = useMemo(() => orders.reduce((result, order) => {
    const status = normalizedStatus(order);
    result.ALL += 1;
    if (result[status] != null) result[status] += 1;
    if (upper(order.paymentStatus) === 'PAID') result.PAID += 1;
    return result;
  }, { ALL: 0, UNFULFILLED: 0, IN_PROGRESS: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0, PAID: 0 }), [orders]);

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    const cutoff = dateWindow === 'ALL' ? null : Date.now() - Number(dateWindow) * 24 * 60 * 60 * 1000;
    return orders
      .filter((order) => {
        const status = normalizedStatus(order);
        const searchable = [
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.trackingNumber,
          order.shippingAddress?.city,
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesQuery = !term || searchable.includes(term);
        const matchesStatus = filterStatus === 'ALL' || status === filterStatus;
        const matchesPayment = filterPayment === 'ALL' || upper(order.paymentStatus) === filterPayment;
        const date = orderDate(order);
        const matchesDate = !cutoff || (date && date.getTime() >= cutoff);
        return matchesQuery && matchesStatus && matchesPayment && matchesDate;
      })
      .sort((left, right) => (orderDate(right)?.getTime() || 0) - (orderDate(left)?.getTime() || 0));
  }, [dateWindow, filterPayment, filterStatus, orders, query]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const showNotice = (message, tone = 'success') => {
    setNotice(message);
    setNoticeTone(tone);
    window.setTimeout(() => setNotice(''), 4200);
  };

  const openDrawer = (order) => {
    const status = normalizedStatus(order);
    setSelectedOrder(order);
    setForm({
      fulfillmentStatus: status,
      carrier: order.carrier || CARRIERS[0],
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (!saving) setDrawerOpen(false);
  };

  const handleSaveFulfillment = async (event) => {
    event.preventDefault();
    if (!selectedOrder || saving) return;
    const trackingNumber = form.trackingNumber.trim();
    const status = form.fulfillmentStatus;
    const updatedTrackingUrl = form.trackingUrl.trim() || trackingUrlFor(form.carrier, trackingNumber);
    const updatedOrder = {
      ...selectedOrder,
      fulfillmentStatus: status,
      carrier: form.carrier,
      trackingNumber,
      trackingUrl: updatedTrackingUrl,
    };
    try {
      validateOrderUpdate(selectedOrder, updatedOrder, {
        confirmPayment: true,
        confirmCancellation: status === 'CANCELLED' ? window.confirm('Xác nhận chuyển đơn này sang CANCELLED? Thao tác không tự hoàn tiền.') : false,
      });
    } catch (error) {
      showNotice(error.message, 'error');
      return;
    }
    const updatedOrders = orders.map((order) => order.id === selectedOrder.id ? updatedOrder : order);
    setSaving(true);
    try {
      await Promise.resolve(onSaveOrders?.(updatedOrders));
      setSelectedOrder(updatedOrder);
      setForm((current) => ({ ...current, trackingUrl: updatedTrackingUrl }));
      showNotice(`${safeText(selectedOrder.orderNumber)} updated to ${STATUS_META[status]?.label || status}.`);
    } catch (error) {
      showNotice(`Could not save ${safeText(selectedOrder.orderNumber)}: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setFilterStatus('ALL');
    setFilterPayment('ALL');
    setDateWindow('ALL');
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">ORDER OPERATIONS / DISPATCH DESK</div>
          <h1>ORDER CONTROL ROOM</h1>
          <p className="admin-intro-desc">Theo dõi từ lúc thanh toán đến giao hàng. Mỗi thay đổi đều được ghi vào đơn thật trong Supabase.</p>
        </div>
        <div className="admin-live-chip"><span className="admin-live-dot" /> <span>LIVE ORDER QUEUE</span></div>
      </div>

      {notice && (
        <div className={`admin-notice ${noticeTone === 'error' ? 'is-error' : 'is-success'}`} role="status">
          {noticeTone === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notice}</span>
        </div>
      )}

      <section className="admin-kpi-grid admin-order-kpis" aria-label="Order queue summary">
        {[
          ['ALL', 'All orders', counts.ALL, 'neutral'],
          ['UNFULFILLED', 'Needs action', counts.UNFULFILLED, 'danger'],
          ['IN_PROGRESS', 'Pick & pack', counts.IN_PROGRESS, 'warning'],
          ['SHIPPED', 'In transit', counts.SHIPPED, 'success'],
          ['DELIVERED', 'Delivered', counts.DELIVERED, 'success'],
        ].map(([key, label, value, tone]) => (
          <button key={key} type="button" className={`admin-kpi-card admin-kpi-button is-${tone} ${filterStatus === key ? 'is-selected' : ''}`} onClick={() => setFilterStatus(key)}>
            <span className="admin-kpi-label">{label}</span>
            <strong className="admin-kpi-value">{value}</strong>
            <span className="admin-kpi-note">{key === 'ALL' ? `${counts.PAID} paid orders` : STATUS_META[key]?.description}</span>
          </button>
        ))}
      </section>

      <section className="admin-command-bar" aria-label="Order filters">
        <label className="admin-search-field">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, email, customer or tracking…" aria-label="Search orders" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
        </label>
        <div className="admin-filter-controls">
          <label className="admin-select-field"><Filter size={14} aria-hidden="true" /><span className="sr-only">Payment status</span><select value={filterPayment} onChange={(event) => setFilterPayment(event.target.value)}><option value="ALL">All payments</option><option value="PAID">Paid</option><option value="PENDING">Pending</option><option value="CANCELLED">Cancelled</option></select><ChevronDown size={13} aria-hidden="true" /></label>
          <label className="admin-select-field"><Clock3 size={14} aria-hidden="true" /><span className="sr-only">Date range</span><select value={dateWindow} onChange={(event) => setDateWindow(event.target.value)}><option value="ALL">All dates</option><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><ChevronDown size={13} aria-hidden="true" /></label>
          {(query || filterStatus !== 'ALL' || filterPayment !== 'ALL' || dateWindow !== 'ALL') && <button type="button" className="admin-clear-filter" onClick={clearFilters}>Clear filters</button>}
        </div>
      </section>

      <div className="admin-list-meta"><span><strong>{filteredOrders.length.toLocaleString()}</strong> of {orders.length.toLocaleString()} orders</span><span className="admin-list-meta__hint">Select a row to inspect the full shipment record</span></div>

      <section className="admin-panel admin-table-panel" aria-label="Orders table">
        <div className="admin-table-scroll">
          <table className="admin-table admin-orders-table">
            <thead><tr><th>Order</th><th>Placed</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Fulfillment</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {filteredOrders.map((order) => {
                const status = normalizedStatus(order);
                return <tr key={order.id || order.orderNumber}>
                  <td><button type="button" className="admin-order-link" onClick={() => openDrawer(order)}>{safeText(order.orderNumber)}<span>{safeText(order.id, 'local record')}</span></button></td>
                  <td className="admin-muted-cell">{formatDate(order)}</td>
                  <td><div className="admin-customer-cell"><strong>{safeText(order.customerName, 'Guest collector')}</strong><span>{safeText(order.customerEmail)}</span></div></td>
                  <td><div className="admin-item-stack">{(order.items || []).slice(0, 3).map((item, index) => <div className="admin-item-thumb" key={`${item.id || item.sku || 'item'}-${index}`}><img src={item.thumbnail || undefined} alt="" /><b>{item.quantity || 1}</b></div>)}{(order.items || []).length > 3 && <span className="admin-item-more">+{order.items.length - 3}</span>}<span className="sr-only">{itemCount(order)} total items</span></div></td>
                  <td className="admin-money-cell">{formatPrice(order.grandTotal, order.currency || currency)}</td>
                  <td><PaymentBadge status={order.paymentStatus} /></td>
                  <td><OrderStatusBadge status={status} /></td>
                  <td className="admin-row-action"><button type="button" onClick={() => openDrawer(order)} aria-label={`Open ${order.orderNumber}`}><ExternalLink size={14} /></button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && <div className="admin-empty admin-empty--orders"><Package size={36} /><h3>No orders in this queue</h3><p>Try clearing a filter or wait for the next verified checkout.</p>{(query || filterStatus !== 'ALL' || filterPayment !== 'ALL' || dateWindow !== 'ALL') && <button type="button" className="btn-secondary text-xs px-4 py-2" onClick={clearFilters}>Reset view</button>}</div>}

        <div className="admin-mobile-order-list">
          {filteredOrders.map((order) => { const status = normalizedStatus(order); return <button type="button" className="admin-mobile-order-card" key={`mobile-${order.id || order.orderNumber}`} onClick={() => openDrawer(order)}><div className="admin-mobile-order-card__top"><span className="admin-order-link">{safeText(order.orderNumber)}</span><OrderStatusBadge status={status} /></div><div className="admin-customer-cell"><strong>{safeText(order.customerName, 'Guest collector')}</strong><span>{safeText(order.customerEmail)}</span></div><div className="admin-mobile-order-card__bottom"><span>{formatDate(order, { month: 'short', day: 'numeric' })}</span><span>{itemCount(order)} item{itemCount(order) === 1 ? '' : 's'}</span><strong>{formatPrice(order.grandTotal, order.currency || currency)}</strong></div></button>; })}
        </div>
      </section>

      {drawerOpen && selectedOrder && <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer(); }}>
        <aside className="admin-drawer admin-order-drawer" role="dialog" aria-modal="true" aria-labelledby="order-drawer-title">
          <header className="admin-drawer-header"><div><span className="admin-intro-eyebrow">ORDER RECORD / {safeText(selectedOrder.orderNumber)}</span><h2 id="order-drawer-title">Shipment desk</h2><p>{formatDate(selectedOrder)} · {itemCount(selectedOrder)} item{itemCount(selectedOrder) === 1 ? '' : 's'}</p></div><button type="button" className="admin-icon-button" onClick={closeDrawer} aria-label="Close order details"><X size={18} /></button></header>

          <div className="admin-drawer-body">
            <div className="admin-drawer-status-strip"><div><span className="admin-section-kicker">Current stage</span><div className="admin-drawer-status-value"><OrderStatusBadge status={normalizedStatus(selectedOrder)} /><PaymentBadge status={selectedOrder.paymentStatus} /></div></div><strong>{formatPrice(selectedOrder.grandTotal, selectedOrder.currency || currency)}</strong></div>

            <section className="admin-detail-section"><div className="admin-section-heading"><h3>Customer & destination</h3><a href={`mailto:${selectedOrder.customerEmail || ''}`} className="admin-text-action"><Mail size={14} /> Email</a></div><div className="admin-customer-detail"><strong>{safeText(selectedOrder.customerName, 'Guest collector')}</strong><a href={`mailto:${selectedOrder.customerEmail || ''}`}>{safeText(selectedOrder.customerEmail)}</a>{addressLines(selectedOrder.shippingAddress).length > 0 ? <address>{addressLines(selectedOrder.shippingAddress).map((line) => <span key={line}>{line}</span>)}</address> : <span className="admin-muted-cell">No shipping address captured</span>}</div></section>

            <section className="admin-detail-section"><div className="admin-section-heading"><h3>Line items</h3><span className="admin-section-count">{itemCount(selectedOrder)} units</span></div><div className="admin-line-items">{(selectedOrder.items || []).map((item, index) => <div className="admin-line-item" key={`${item.id || item.sku || 'line'}-${index}`}><img src={item.thumbnail || undefined} alt="" /><div className="admin-line-item__copy"><strong>{safeText(item.title, 'Hat')}</strong><span>{item.size ? `Size ${item.size}` : 'One size'} · SKU {safeText(item.sku)}</span><span>Qty {item.quantity || 1} × {formatPrice(item.price, selectedOrder.currency || currency)}</span></div><b>{formatPrice((Number(item.price) || 0) * (Number(item.quantity) || 1), selectedOrder.currency || currency)}</b></div>)}{!(selectedOrder.items || []).length && <p className="admin-muted-cell">No line items returned for this order.</p>}</div></section>

            <section className="admin-detail-section"><div className="admin-section-heading"><h3>Fulfillment timeline</h3><span className="admin-section-count">{STATUS_META[normalizedStatus(selectedOrder)]?.label}</span></div><div className="admin-timeline">{['UNFULFILLED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED'].map((stage) => { const current = normalizedStatus(selectedOrder); const stages = ['UNFULFILLED', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED']; const active = current !== 'CANCELLED' && stages.indexOf(current) >= stages.indexOf(stage); return <div className={`admin-timeline-step ${active ? 'is-active' : ''}`} key={stage}><span className="admin-timeline-marker">{active ? <CheckCircle2 size={14} /> : <span />}</span><div><strong>{STATUS_META[stage].label}</strong><span>{STATUS_META[stage].description}</span></div></div>; })}{normalizedStatus(selectedOrder) === 'CANCELLED' && <div className="admin-timeline-step is-cancelled"><span className="admin-timeline-marker"><X size={14} /></span><div><strong>Cancelled</strong><span>This order is no longer in the dispatch queue.</span></div></div>}</div></section>

            <form className="admin-dispatch-form" onSubmit={handleSaveFulfillment}><div className="admin-section-heading"><h3><Truck size={15} /> Update dispatch</h3><span className="admin-section-count">Supabase write</span></div><p className="admin-form-help">Only paid orders should move into pick & pack. Add tracking before handing a parcel to the courier.</p><label className="admin-form-label">Fulfillment stage<select value={form.fulfillmentStatus} onChange={(event) => setForm({ ...form, fulfillmentStatus: event.target.value })} className="admin-form-select"><option value="UNFULFILLED">Unfulfilled — awaiting packing</option><option value="IN_PROGRESS">Processing — pick & pack</option><option value="SHIPPED">Shipped — with courier</option><option value="DELIVERED">Delivered — completed</option><option value="CANCELLED">Cancelled — stop order</option></select></label><label className="admin-form-label">Carrier<select value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} className="admin-form-select">{CARRIERS.map((carrier) => <option value={carrier} key={carrier}>{carrier}</option>)}</select></label><div className="admin-form-grid"><label className="admin-form-label">Tracking number<input value={form.trackingNumber} onChange={(event) => setForm({ ...form, trackingNumber: event.target.value })} className="admin-form-input font-mono" placeholder="e.g. 1Z…" /></label><label className="admin-form-label">Tracking URL<input type="url" value={form.trackingUrl} onChange={(event) => setForm({ ...form, trackingUrl: event.target.value })} className="admin-form-input font-mono" placeholder="Auto-generated if blank" /></label></div><div className="admin-dispatch-form__footer"><span><ShieldCheck size={14} /> Payment: <strong>{safeText(selectedOrder.paymentStatus, 'PENDING')}</strong></span><button type="submit" className="btn-flame text-xs px-4 py-2.5" disabled={saving}>{saving ? 'Saving…' : 'Save dispatch update'}</button></div></form>

            {selectedOrder.trackingNumber && <a className="admin-tracking-link" href={selectedOrder.trackingUrl || trackingUrlFor(selectedOrder.carrier, selectedOrder.trackingNumber) || '#'} target="_blank" rel="noreferrer"><Truck size={15} /><span><strong>{safeText(selectedOrder.carrier, 'Carrier')} tracking</strong><small>{selectedOrder.trackingNumber}</small></span><ExternalLink size={14} /></a>}
          </div>
        </aside>
      </div>}
    </div>
  );
}
