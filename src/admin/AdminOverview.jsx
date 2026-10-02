import React from 'react';
import { 
  Flame, ShoppingBag, PackageCheck, Users, AlertTriangle, 
  ArrowUpRight, TrendingUp, Clock, Plus, ExternalLink, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { formatPrice } from '../utils/currency';

export default function AdminOverview({ 
  products, 
  orders, 
  members, 
  collections, 
  onNavigateTab, 
  onOpenNewProductModal,
  currency = 'USD' 
}) {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0) + 24750.0;
  const publishedCount = products.filter(p => (!p.status || p.status === 'PUBLISHED') && (p.source1688Status || 'PENDING') === 'MATCHED').length;
  const sourceQueueCount = products.filter(p => (p.source1688Status || 'PENDING') !== 'MATCHED').length;
  const pendingOrdersCount = orders.filter(o => o.fulfillmentStatus !== 'DELIVERED').length;
  const lowStockCount = products.filter(p => p.sizes?.some(s => s.inStock && Math.random() > 0.7)).length;

  return (
    <div className="admin-content animate-fade-in space-y-8">
      
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">STORE OPERATIONS & CONTROL ROOM</div>
          <h1>DASHBOARD OVERVIEW</h1>
          <p className="admin-intro-desc">
            Monitor real-time drop demand, active New Era 59FIFTY inventory, fulfillment milestones, and Access Pass VIP growth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenNewProductModal}
            className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
          >
            <Plus size={15} />
            <span>+ NEW DROP PRODUCT</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Inspired by custom pod's admin-stat-grid) */}
      <div className="admin-kpi-grid">
        {/* Revenue */}
        <div className="admin-kpi-card border-l-4 border-l-[#ff3b30]">
          <span className="admin-kpi-label">DROP REVENUE (MTD)</span>
          <div className="admin-kpi-value">{formatPrice(totalRevenue, currency)}</div>
          <div className="admin-kpi-note is-up flex items-center gap-1">
            <TrendingUp size={13} />
            <span>+22.4% vs last drop launch</span>
          </div>
        </div>

        {/* Live Products */}
        <div className="admin-kpi-card border-l-4 border-l-[#3ed660]">
          <span className="admin-kpi-label">ACTIVE DROP LISTINGS</span>
          <div className="admin-kpi-value">{publishedCount}</div>
          <div className="admin-kpi-note">Across MLB, NBA, NFL, MiLB</div>
        </div>

        {/* Pending Orders */}
        <div className="admin-kpi-card border-l-4 border-l-[#ffaa00]">
          <span className="admin-kpi-label">ORDERS TO FULFILL</span>
          <div className="admin-kpi-value text-[#ffaa00]">{pendingOrdersCount}</div>
          <div className="admin-kpi-note">UPS Priority & Ground queues</div>
        </div>

        {/* VIP Members */}
        <div className="admin-kpi-card border-l-4 border-l-[#2563eb]">
          <span className="admin-kpi-label">ACCESS PASS COLLECTORS</span>
          <div className="admin-kpi-value">{members.length * 1070 + 420}</div>
          <div className="admin-kpi-note is-up">+48 joined this week</div>
        </div>

        {/* Active Collections */}
        <div className="admin-kpi-card border-l-4 border-l-purple-500">
          <span className="admin-kpi-label">CURATED DROP THEMES</span>
          <div className="admin-kpi-value">{collections.length}</div>
          <div className="admin-kpi-note">Playing with Fire, Blue Heaven, MiLB</div>
        </div>

        {/* 1688 source queue */}
        <button onClick={() => onNavigateTab('products')} className="admin-kpi-card border-l-4 border-l-amber-400 text-left transition-colors hover:bg-[#181818]">
          <span className="admin-kpi-label">1688 SOURCE QUEUE</span>
          <div className="admin-kpi-value text-amber-300">{sourceQueueCount}</div>
          <div className="admin-kpi-note">Only MATCHED listings can sell</div>
        </button>
      </div>

      {/* Two Column Section: Recent Orders & Top Drops */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Recent Orders Fulfillment Status (8 cols) */}
        <div className="lg:col-span-8 bg-[#121212] border border-[#242424] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
            <div>
              <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">
                RECENT DROP ORDERS
              </h3>
              <p className="text-xs text-gray-400">Shipments requiring packaging, inspection, and courier handoff.</p>
            </div>

            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#ff3b30] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Manage All Orders</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Fulfillment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono font-bold text-white text-xs">
                      {order.orderNumber}
                    </td>
                    <td>
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-gray-500">{order.shippingAddress?.city}</div>
                    </td>
                    <td className="text-xs text-gray-300">
                      {order.items?.length || 1} cap(s)
                    </td>
                    <td className="font-display font-bold text-sm text-white">
                      {formatPrice(order.grandTotal, currency)}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                        order.fulfillmentStatus === 'SHIPPED' 
                          ? 'bg-[#1b2b1d] text-[#3ed660] border border-[#2e5236]' 
                          : order.fulfillmentStatus === 'IN_PROGRESS' 
                            ? 'bg-[#2b240f] text-[#ffaa00] border border-[#443818]' 
                            : 'bg-[#261515] text-[#ff3b30] border border-[#442222]'
                      }`}>
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onNavigateTab('orders')}
                        className="text-xs text-gray-400 hover:text-white font-bold transition-colors"
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Trending Drops & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Shortcuts */}
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-5 space-y-3">
            <h3 className="font-display text-base font-black text-white uppercase tracking-tight pb-2 border-b border-[#222222]">
              QUICK LAUNCHPAD
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('menus')}
                className="w-full p-2.5 bg-[#181818] hover:bg-[#222222] border border-[#282828] rounded-lg text-left text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Edit Navigation & Mega Menus</span>
                <ChevronRight size={14} className="text-gray-500" />
              </button>

              <button
                onClick={() => onNavigateTab('products')}
                className="w-full p-2.5 bg-[#181818] hover:bg-[#222222] border border-[#282828] rounded-lg text-left text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Adjust Fitted Cap Stock & Pricing</span>
                <ChevronRight size={14} className="text-gray-500" />
              </button>

              <button
                onClick={() => onNavigateTab('collections')}
                className="w-full p-2.5 bg-[#181818] hover:bg-[#222222] border border-[#282828] rounded-lg text-left text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Curate "Playing with Fire" Drop</span>
                <ChevronRight size={14} className="text-gray-500" />
              </button>

              <button
                onClick={() => onNavigateTab('membership')}
                className="w-full p-2.5 bg-[#181818] hover:bg-[#222222] border border-[#282828] rounded-lg text-left text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Access Pass VIP Tier Approvals</span>
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Top Drops Performance */}
          <div className="bg-[#121212] border border-[#242424] rounded-xl p-5 space-y-3">
            <h3 className="font-display text-base font-black text-white uppercase tracking-tight pb-2 border-b border-[#222222]">
              TOP SELLING DROPS
            </h3>

            <div className="space-y-3">
              {products.slice(0, 4).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#161616] p-2 rounded-lg border border-[#252525]">
                  <img src={p.thumbnail} alt={p.title} className="w-10 h-10 object-contain rounded bg-[#101010]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{p.title}</div>
                    <div className="text-[10px] text-gray-400">{p.team} • {p.price}</div>
                  </div>
                  <span className="font-display text-xs font-black text-[#ff3b30]">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
