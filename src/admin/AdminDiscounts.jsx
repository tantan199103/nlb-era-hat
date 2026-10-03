import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Copy,
  Edit3,
  Percent,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

const EMPTY_DRAFT = {
  code: '',
  discountPercent: 15,
  active: true,
  minimumSubtotal: 0,
  usageLimit: '',
  startsAt: '',
  endsAt: '',
};

function statusFor(promo) {
  const now = Date.now();
  const startsAt = promo.startsAt ? new Date(promo.startsAt).getTime() : null;
  const endsAt = promo.endsAt ? new Date(promo.endsAt).getTime() : null;
  if (promo.active === false) return 'PAUSED';
  if (startsAt && startsAt > now) return 'SCHEDULED';
  if (endsAt && endsAt < now) return 'EXPIRED';
  return 'ACTIVE';
}

function statusClass(status) {
  if (status === 'ACTIVE') return 'admin-status-badge is-success';
  if (status === 'SCHEDULED') return 'admin-status-badge is-warning';
  if (status === 'EXPIRED') return 'admin-status-badge is-muted';
  return 'admin-status-badge is-danger';
}

function prettyDate(value) {
  if (!value) return 'Always available';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date not set' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDiscounts({ settings = {}, onSaveSettings }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [notice, setNotice] = useState('');

  const promos = Array.isArray(settings.promoCodes) ? settings.promoCodes : [];
  const filteredPromos = useMemo(() => {
    const term = query.trim().toLowerCase();
    return promos.filter((promo) => {
      const status = statusFor(promo);
      const matchesTerm = !term || String(promo.code || '').toLowerCase().includes(term);
      return matchesTerm && (statusFilter === 'ALL' || status === statusFilter);
    });
  }, [promos, query, statusFilter]);

  const counts = useMemo(() => promos.reduce((result, promo) => {
    result.ALL += 1;
    result[statusFor(promo)] += 1;
    return result;
  }, { ALL: 0, ACTIVE: 0, SCHEDULED: 0, PAUSED: 0, EXPIRED: 0 }), [promos]);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openNew = () => {
    setEditingCode(null);
    setDraft({ ...EMPTY_DRAFT });
    setEditorOpen(true);
  };

  const openEdit = (promo) => {
    setEditingCode(promo.code);
    setDraft({ ...EMPTY_DRAFT, ...promo });
    setEditorOpen(true);
  };

  const persist = (nextPromos, message) => {
    onSaveSettings?.({ ...settings, promoCodes: nextPromos });
    notify(message);
  };

  const saveDiscount = (event) => {
    event.preventDefault();
    const code = String(draft.code || '').trim().toUpperCase();
    if (!code) {
      notify('Discount code is required.');
      return;
    }
    if (!/^([A-Z0-9][A-Z0-9_-]{2,31})$/.test(code)) {
      notify('Use 3–32 letters, numbers, dashes or underscores.');
      return;
    }
    const duplicate = promos.some((promo) => promo.code !== editingCode && String(promo.code).toUpperCase() === code);
    if (duplicate) {
      notify('That discount code already exists.');
      return;
    }
    const normalized = {
      ...draft,
      code,
      discountPercent: Math.min(90, Math.max(1, Number(draft.discountPercent) || 1)),
      minimumSubtotal: Math.max(0, Number(draft.minimumSubtotal) || 0),
      usageLimit: draft.usageLimit === '' ? '' : Math.max(1, Number(draft.usageLimit) || 1),
      active: draft.active !== false,
    };
    const nextPromos = editingCode
      ? promos.map((promo) => promo.code === editingCode ? normalized : promo)
      : [...promos, normalized];
    persist(nextPromos, `${code} ${editingCode ? 'updated' : 'created'}.`);
    setEditorOpen(false);
  };

  const toggleDiscount = (promo) => {
    const nextPromos = promos.map((item) => item.code === promo.code ? { ...item, active: item.active === false } : item);
    persist(nextPromos, `${promo.code} ${promo.active === false ? 'activated' : 'paused'}.`);
  };

  const duplicateDiscount = (promo) => {
    const copy = { ...promo, code: `${promo.code}_COPY`, active: false };
    setEditingCode(null);
    setDraft(copy);
    setEditorOpen(true);
  };

  const deleteDiscount = (promo) => {
    if (!window.confirm(`Delete ${promo.code}? Existing checkouts will no longer accept it.`)) return;
    persist(promos.filter((item) => item.code !== promo.code), `${promo.code} deleted.`);
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">SALES / DISCOUNTS & PROMOTIONS</div>
          <h1>DISCOUNTS</h1>
          <p className="admin-intro-desc">Tạo mã giảm giá, điều kiện áp dụng và thời gian chạy chiến dịch theo mô hình Shopify Discounts.</p>
        </div>
        <button type="button" onClick={openNew} className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5"><Plus size={15} /> Create discount</button>
      </div>

      {notice && <div className="admin-notice is-success"><Check size={16} /><span>{notice}</span></div>}

      <section className="admin-kpi-grid" aria-label="Discount summary">
        {[
          ['ALL', 'All discounts', counts.ALL, 'neutral'],
          ['ACTIVE', 'Active now', counts.ACTIVE, 'success'],
          ['SCHEDULED', 'Scheduled', counts.SCHEDULED, 'warning'],
          ['PAUSED', 'Paused', counts.PAUSED, 'danger'],
        ].map(([key, label, value, tone]) => (
          <button type="button" key={key} onClick={() => setStatusFilter(key)} className={`admin-kpi-card admin-kpi-button is-${tone} ${statusFilter === key ? 'is-selected' : ''}`}>
            <span className="admin-kpi-label"><Tag size={13} /> {label}</span>
            <strong className="admin-kpi-value">{value}</strong>
            <span className="admin-kpi-note">{key === 'ALL' ? 'All discount rules' : statusFor({ active: key === 'ACTIVE' }) === key ? 'Ready for checkout' : 'Requires review'}</span>
          </button>
        ))}
      </section>

      <section className="admin-command-bar" aria-label="Discount filters">
        <label className="admin-search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search discount code…" aria-label="Search discount code" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label>
        <div className="admin-filter-controls">
          <label className="admin-select-field"><Tag size={14} /><span className="sr-only">Discount status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="SCHEDULED">Scheduled</option><option value="PAUSED">Paused</option><option value="EXPIRED">Expired</option></select></label>
          {(query || statusFilter !== 'ALL') && <button type="button" className="admin-clear-filter" onClick={() => { setQuery(''); setStatusFilter('ALL'); }}>Clear filters</button>}
        </div>
      </section>

      <div className="admin-list-meta"><span><strong>{filteredPromos.length}</strong> of {promos.length} discounts</span><span className="admin-list-meta__hint">Changes are saved to Store Settings</span></div>

      <section className="admin-panel admin-table-panel overflow-hidden !p-0">
        <div className="overflow-x-auto"><table className="admin-table min-w-[850px]"><thead><tr><th>Discount</th><th>Status</th><th>Value</th><th>Eligibility</th><th>Schedule</th><th className="text-right">Actions</th></tr></thead><tbody>
          {filteredPromos.length ? filteredPromos.map((promo) => {
            const status = statusFor(promo);
            return <tr key={promo.code}>
              <td><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded border border-red-900/50 bg-red-950/30 text-[#ff3b30]"><Percent size={15} /></span><div><div className="text-xs font-black tracking-wider text-white">{promo.code}</div><div className="text-[10px] text-zinc-500">{promo.usageLimit ? `Limit ${promo.usageLimit} redemptions` : 'Unlimited redemptions'}</div></div></div></td>
              <td><span className={statusClass(status)}>{status}</span></td>
              <td><div className="text-xs font-bold text-white">{promo.discountPercent}% off</div><div className="text-[10px] text-zinc-500">{promo.minimumSubtotal ? `Orders over ${formatPrice(promo.minimumSubtotal, settings.defaultCurrency || 'USD')}` : 'No minimum spend'}</div></td>
              <td><div className="flex items-center gap-1.5 text-xs text-zinc-300"><Users size={13} className="text-zinc-500" /> All customers</div></td>
              <td><div className="flex items-center gap-1.5 text-xs text-zinc-300"><CalendarClock size={13} className="text-zinc-500" />{promo.startsAt || promo.endsAt ? `${prettyDate(promo.startsAt)} → ${prettyDate(promo.endsAt)}` : 'Always available'}</div></td>
              <td><div className="flex justify-end gap-1.5"><button type="button" onClick={() => toggleDiscount(promo)} className="rounded bg-[#1d1d1d] px-2 py-1 text-[10px] font-bold text-zinc-300 hover:bg-[#2a2a2a]">{promo.active === false ? 'Activate' : 'Pause'}</button><button type="button" onClick={() => openEdit(promo)} className="rounded bg-[#2a2116] p-1.5 text-white hover:bg-[#ff3b30]" title="Edit discount"><Edit3 size={13} /></button><button type="button" onClick={() => duplicateDiscount(promo)} className="rounded bg-[#1d1d1d] p-1.5 text-zinc-400 hover:text-white" title="Duplicate discount"><Copy size={13} /></button><button type="button" onClick={() => deleteDiscount(promo)} className="rounded bg-[#1d1d1d] p-1.5 text-zinc-400 hover:text-[#ff3b30]" title="Delete discount"><Trash2 size={13} /></button></div></td>
            </tr>;
          }) : <tr><td colSpan="6" className="py-14 text-center text-sm text-zinc-500">No discounts match these filters.</td></tr>}
        </tbody></table></div>
      </section>

      {editorOpen && <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
        <aside className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby="discount-editor-title">
          <header className="admin-drawer-header"><div><span className="admin-intro-eyebrow">DISCOUNT / CHECKOUT RULE</span><h2 id="discount-editor-title">{editingCode ? 'Edit discount' : 'Create discount'}</h2><p>Mã được lưu trong cấu hình storefront và dùng ở checkout.</p></div><button type="button" className="admin-icon-button" onClick={() => setEditorOpen(false)} aria-label="Close"><X size={18} /></button></header>
          <form className="admin-drawer-body" onSubmit={saveDiscount}>
            <div className="admin-drawer-status-strip"><div><strong>{draft.code || 'NEW CODE'}</strong><div className="admin-drawer-status-value"><span className="admin-status-badge is-warning">{draft.active === false ? 'PAUSED' : 'ACTIVE'}</span><span className="text-xs text-zinc-500">{draft.discountPercent || 0}% off order</span></div></div><Tag size={22} className="text-[#ff3b30]" /></div>
            <section className="admin-detail-section"><div className="admin-section-heading"><h3>Discount details</h3><span className="admin-section-count">Required</span></div><label className="admin-form-label">Code<input required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} className="admin-form-input font-mono uppercase" placeholder="DROP15" /></label><div className="admin-form-grid"><label className="admin-form-label"><span><Percent size={13} /> Percentage</span><input type="number" min="1" max="90" value={draft.discountPercent} onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value })} className="admin-form-input" /></label><label className="admin-form-label">Minimum subtotal<input type="number" min="0" step="0.01" value={draft.minimumSubtotal} onChange={(event) => setDraft({ ...draft, minimumSubtotal: event.target.value })} className="admin-form-input" /></label></div><label className="admin-form-label">Usage limit<input type="number" min="1" value={draft.usageLimit} onChange={(event) => setDraft({ ...draft, usageLimit: event.target.value })} className="admin-form-input" placeholder="Unlimited" /></label><label className="flex items-center gap-2 text-xs font-bold text-zinc-200"><input type="checkbox" checked={draft.active !== false} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="h-4 w-4 accent-[#ff3b30]" /> Enable this discount at checkout</label></section>
            <section className="admin-detail-section"><div className="admin-section-heading"><h3><CalendarClock size={15} /> Schedule</h3><span className="admin-section-count">Optional</span></div><div className="admin-form-grid"><label className="admin-form-label">Starts at<input type="datetime-local" value={draft.startsAt || ''} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} className="admin-form-input" /></label><label className="admin-form-label">Ends at<input type="datetime-local" value={draft.endsAt || ''} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} className="admin-form-input" /></label></div><p className="admin-form-help">Để trống cả hai trường để mã hoạt động liên tục.</p></section>
            <div className="admin-editor-footer"><button type="button" className="btn-secondary text-xs px-4 py-2.5" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="btn-flame text-xs px-4 py-2.5"><Check size={14} /> Save discount</button></div>
          </form>
        </aside>
      </div>}
    </div>
  );
}
