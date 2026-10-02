import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Truck, Check, ExternalLink, Clock, 
  AlertCircle, CheckCircle2, X, ChevronRight, Filter, ShieldCheck 
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function AdminOrders({ orders, onSaveOrders, currency = 'USD' }) {
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Drawer Form State
  const [form, setForm] = useState({
    fulfillmentStatus: 'UNFULFILLED',
    carrier: 'UPS Ground Tracked',
    trackingNumber: '',
    trackingUrl: ''
  });

  const carriers = [
    'UPS Ground Tracked',
    'UPS 2nd Day Air',
    'FedEx Home Delivery',
    'USPS Priority Mail',
    'DHL Express International'
  ];

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchFilter = 
        filterStatus === 'ALL' || 
        o.fulfillmentStatus === filterStatus ||
        (filterStatus === 'PAID' && o.paymentStatus === 'PAID');

      const matchQuery = !query.trim() ||
        o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        o.customerName.toLowerCase().includes(query.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(query.toLowerCase()) ||
        (o.trackingNumber && o.trackingNumber.toLowerCase().includes(query.toLowerCase()));

      return matchFilter && matchQuery;
    });
  }, [orders, filterStatus, query]);

  const handleOpenDrawer = (order) => {
    setSelectedOrder(order);
    setForm({
      fulfillmentStatus: order.fulfillmentStatus || 'UNFULFILLED',
      carrier: order.carrier || 'UPS Ground Tracked',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || ''
    });
    setDrawerOpen(true);
  };

  const handleSaveFulfillment = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let updatedTrackingUrl = form.trackingUrl;
    if (!updatedTrackingUrl && form.trackingNumber) {
      if (form.carrier.toLowerCase().includes('ups')) {
        updatedTrackingUrl = `https://www.ups.com/track?tracknum=${form.trackingNumber}`;
      } else if (form.carrier.toLowerCase().includes('fedex')) {
        updatedTrackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${form.trackingNumber}`;
      } else if (form.carrier.toLowerCase().includes('usps')) {
        updatedTrackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${form.trackingNumber}`;
      }
    }

    const updatedOrders = orders.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          fulfillmentStatus: form.fulfillmentStatus,
          carrier: form.carrier,
          trackingNumber: form.trackingNumber,
          trackingUrl: updatedTrackingUrl
        };
      }
      return o;
    });

    onSaveOrders(updatedOrders);
    setSelectedOrder({
      ...selectedOrder,
      fulfillmentStatus: form.fulfillmentStatus,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber,
      trackingUrl: updatedTrackingUrl
    });
    setNotice(`Order ${selectedOrder.orderNumber} fulfillment updated to ${form.fulfillmentStatus}!`);
    setTimeout(() => setNotice(''), 3500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SHIPPED':
      case 'DELIVERED':
        return 'bg-[#3ed660]/20 text-[#3ed660] border border-[#3ed660]/40';
      case 'IN_PROGRESS':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      case 'UNFULFILLED':
      default:
        return 'bg-red-500/20 text-red-400 border border-red-500/40';
    }
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">ORDER OPERATIONS & DISPATCH</div>
          <h1>DROP FULFILLMENT & ORDERS</h1>
          <p className="admin-intro-desc">
            Verify payment confirmation, inspect limited fitted line items, and attach tracked carrier shipments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#141414] border border-[#262626] rounded text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3ed660] animate-pulse" />
            <span>Real-time dispatch sync active</span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-[#3ed660]" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button 
          onClick={() => setFilterStatus('ALL')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            filterStatus === 'ALL' ? 'bg-[#1e1e1e] border-zinc-500' : 'bg-[#141414] border-[#222]'
          }`}
        >
          <div className="text-[10px] text-zinc-500 font-bold uppercase">All Orders</div>
          <div className="text-xl font-black text-white">{orders.length}</div>
        </button>

        <button 
          onClick={() => setFilterStatus('UNFULFILLED')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            filterStatus === 'UNFULFILLED' ? 'bg-[#1e1e1e] border-red-500' : 'bg-[#141414] border-[#222]'
          }`}
        >
          <div className="text-[10px] text-red-400 font-bold uppercase">Unfulfilled</div>
          <div className="text-xl font-black text-red-400">
            {orders.filter(o => o.fulfillmentStatus === 'UNFULFILLED').length}
          </div>
        </button>

        <button 
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            filterStatus === 'IN_PROGRESS' ? 'bg-[#1e1e1e] border-amber-500' : 'bg-[#141414] border-[#222]'
          }`}
        >
          <div className="text-[10px] text-amber-400 font-bold uppercase">In Pick & Pack</div>
          <div className="text-xl font-black text-amber-400">
            {orders.filter(o => o.fulfillmentStatus === 'IN_PROGRESS').length}
          </div>
        </button>

        <button 
          onClick={() => setFilterStatus('SHIPPED')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            filterStatus === 'SHIPPED' ? 'bg-[#1e1e1e] border-[#3ed660]' : 'bg-[#141414] border-[#222]'
          }`}
        >
          <div className="text-[10px] text-[#3ed660] font-bold uppercase">Shipped / In Transit</div>
          <div className="text-xl font-black text-[#3ed660]">
            {orders.filter(o => o.fulfillmentStatus === 'SHIPPED').length}
          </div>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#141414] p-3 rounded-lg border border-[#262626]">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by order #, customer name, email, or tracking number..."
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#262626] rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3b30]"
          />
        </div>

        <div className="text-xs text-zinc-500">
          Showing <span className="text-white font-bold">{filteredOrders.length}</span> of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-panel !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#181818] transition-colors">
                  <td className="font-mono font-bold text-white text-xs whitespace-nowrap">
                    {order.orderNumber}
                  </td>
                  <td className="text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="font-bold text-white text-xs">{order.customerName}</div>
                    <div className="text-[11px] text-zinc-500">{order.customerEmail}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="relative group/thumb">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title} 
                            className="w-8 h-8 rounded object-cover bg-zinc-900 border border-zinc-700"
                          />
                          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span className="text-[10px] text-zinc-500 font-bold ml-1">
                          +{order.items.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-black text-white text-xs whitespace-nowrap">
                    {formatPrice(order.grandTotal, currency)}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-emerald-950/70 text-[#3ed660] border border-emerald-500/30">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${getStatusBadge(order.fulfillmentStatus)}`}>
                      {order.fulfillmentStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleOpenDrawer(order)}
                      className="px-3 py-1.5 bg-[#222] hover:bg-[#ff3b30] text-zinc-300 hover:text-white rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Truck size={13} />
                      <span>Fulfill</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="admin-empty">
            <Package size={36} className="text-zinc-600 mb-2" />
            <h3 className="text-sm font-bold text-white uppercase">No Orders Found</h3>
            <p className="text-xs text-zinc-400">No customer drop orders match your filter criteria.</p>
          </div>
        )}
      </div>

      {/* Slide-out Order Fulfillment Drawer (Directly inspired by custom pod) */}
      {drawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-[#111] border-l border-[#262626] h-full overflow-y-auto flex flex-col z-10 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#222] bg-[#161616] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#ff3b30] uppercase">
                  ORDER FULFILLMENT DRAWER
                </span>
                <h2 className="text-lg font-black text-white">{selectedOrder.orderNumber}</h2>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Payment Lock Alert */}
            <div className="p-4 bg-emerald-950/40 border-b border-emerald-900/40 flex items-start gap-3 text-xs text-emerald-300">
              <ShieldCheck size={18} className="text-[#3ed660] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Payment Confirmed: PAID</strong>
                <span className="text-zinc-400 text-[11px]">
                  Verified merchant capture. This order is safe to pick, pack, and release into courier dispatch.
                </span>
              </div>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Customer & Address Summary */}
              <div className="bg-[#181818] p-4 rounded-lg border border-[#2a2a2a] space-y-2">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Customer & Shipping Destination
                </div>
                <div className="text-sm font-bold text-white">{selectedOrder.customerName}</div>
                <div className="text-xs text-zinc-400">{selectedOrder.customerEmail}</div>
                <div className="text-xs text-zinc-300 pt-2 border-t border-[#262626]">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Line Items ({selectedOrder.items?.length || 0})
                </div>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex gap-3 bg-[#181818] p-3 rounded-lg border border-[#262626]">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-14 h-14 rounded object-cover bg-zinc-900 border border-zinc-700 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono">
                            Size: {item.size}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            SKU: {item.sku}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          Qty: <span className="text-white font-bold">{item.quantity}</span> × {formatPrice(item.price, currency)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white">
                          {formatPrice(item.price * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 text-sm">
                  <span className="text-zinc-400 font-bold">Total Order Value:</span>
                  <span className="text-base font-black text-white">
                    {formatPrice(selectedOrder.grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Fulfillment Controls Form */}
              <form onSubmit={handleSaveFulfillment} className="bg-[#181818] p-4 rounded-lg border border-[#2a2a2a] space-y-4">
                <div className="text-[10px] font-black text-[#ff3b30] uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} />
                  <span>Update Carrier Dispatch</span>
                </div>

                <div>
                  <label className="admin-form-label">Fulfillment Status Stage</label>
                  <select 
                    value={form.fulfillmentStatus}
                    onChange={e => setForm({ ...form, fulfillmentStatus: e.target.value })}
                    className="admin-form-select"
                  >
                    <option value="UNFULFILLED">UNFULFILLED (Awaiting packing)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Pick & Pack ongoing)</option>
                    <option value="SHIPPED">SHIPPED (Handed to courier)</option>
                    <option value="DELIVERED">DELIVERED (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-form-label">Shipping Courier</label>
                  <select 
                    value={form.carrier}
                    onChange={e => setForm({ ...form, carrier: e.target.value })}
                    className="admin-form-select"
                  >
                    {carriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-form-label">Tracking Number</label>
                  <input 
                    type="text"
                    value={form.trackingNumber}
                    onChange={e => setForm({ ...form, trackingNumber: e.target.value })}
                    placeholder="Carrier tracking number"
                    className="admin-form-input font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="admin-form-label">Tracking URL (Optional, auto-generated)</label>
                  <input 
                    type="url"
                    value={form.trackingUrl}
                    onChange={e => setForm({ ...form, trackingUrl: e.target.value })}
                    placeholder="https://www.ups.com/track?tracknum=..."
                    className="admin-form-input font-mono text-xs"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#ff3b30] hover:bg-[#e03026] text-white rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"
                >
                  <Truck size={15} />
                  <span>SAVE FULFILLMENT DISPATCH</span>
                </button>
              </form>

              {/* Order Event Log */}
              <div className="space-y-2">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Event Milestones
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex gap-2.5 items-start text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3ed660] mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-white">Order Created & Verified</strong>
                      <div className="text-[11px] text-zinc-500">Inventory reserved for 59FIFTY drop.</div>
                    </div>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <div className="flex gap-2.5 items-start text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <strong className="text-white">Shipping Label Generated</strong>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {selectedOrder.carrier}: {selectedOrder.trackingNumber}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
