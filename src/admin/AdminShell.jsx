import React, { useEffect, useState } from 'react';
import { 
  Flame, LayoutDashboard, Package, Layers, Menu as MenuIcon, 
  Truck, Users, Settings, ExternalLink, ChevronRight, Bell, 
  Sparkles, ShieldCheck, Plus, ArrowLeft, Menu, X 
} from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminCollections from './AdminCollections';
import AdminMenus from './AdminMenus';
import AdminOrders from './AdminOrders';
import AdminMembership from './AdminMembership';
import AdminSettings from './AdminSettings';
import './admin.css';
import AdminAccess from './AdminAccess';
import {
  deleteAdminProduct,
  fetchAdminMembers,
  fetchAdminCatalogStats,
  fetchAdminOrders,
  fetchStoreSettings,
  getAdminSession,
  saveAdminCollections,
  saveAdminMenus,
  saveAdminProduct,
  saveAdminOrder,
  saveStoreSettings,
  updateAdminProductStatus,
  updateAdminProduct1688Verification,
} from '../services/adminApi';

export default function AdminShell({ 
  currentTab = 'overview',
  onTabChange,
  onExitAdmin,
  // Data props
  products,
  onSaveProducts,
  onSaveProduct,
  onDeleteProduct,
  onToggleProductStatus,
  onVerifyProduct1688,
  collections,
  onSaveCollections,
  menus,
  onSaveMenus,
  orders,
  onSaveOrders,
  members,
  onSaveMembers,
  settings,
  onSaveSettings,
  currency = 'USD',
  onOpenPDP
}) {
  const [adminSession, setAdminSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [adminNotice, setAdminNotice] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [catalogStats, setCatalogStats] = useState(null);

  // Unfulfilled orders count for badge
  const unfulfilledOrdersCount = orders.filter(o => o.fulfillmentStatus === 'UNFULFILLED').length;

  useEffect(() => {
    let active = true;
    getAdminSession().then((session) => {
      if (!active) return;
      setAdminSession(session.isAdmin ? session : null);
      setAuthChecked(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!adminSession) return undefined;
    let active = true;
    Promise.all([
      fetchAdminOrders(orders),
      fetchAdminMembers(members),
      fetchStoreSettings(settings),
      fetchAdminCatalogStats(null),
    ]).then(([remoteOrders, remoteMembers, remoteSettings, remoteCatalogStats]) => {
      if (!active) return;
      onSaveOrders?.(remoteOrders);
      onSaveMembers?.(remoteMembers);
      onSaveSettings?.(remoteSettings);
      setCatalogStats(remoteCatalogStats);
    });
    return () => { active = false; };
  }, [adminSession]);

  const saveMenus = async (updated) => {
    try {
      const next = await saveAdminMenus(updated);
      onSaveMenus(next);
      setAdminNotice('Menu đã lưu vào Supabase và được publish.');
    } catch (error) {
      setAdminNotice(`Không lưu được menu: ${error.message}`);
    }
  };

  const saveCollections = async (updated) => {
    try {
      const next = await saveAdminCollections(updated);
      onSaveCollections(next);
      setAdminNotice('Collection đã lưu vào Supabase.');
    } catch (error) {
      setAdminNotice(`Không lưu được collection: ${error.message}`);
    }
  };

  const saveProduct = async (product) => {
    const saved = await saveAdminProduct(product);
    onSaveProducts?.([
      ...products.filter((item) => item.id !== saved.id),
      saved,
    ]);
    return saved;
  };

  const deleteProduct = async (productId) => {
    await deleteAdminProduct(productId);
    onSaveProducts?.(products.filter((item) => item.id !== productId));
  };

  const toggleProductStatus = async (product, status) => {
    const saved = await updateAdminProductStatus(product.id, status);
    onSaveProducts?.([
      ...products.filter((item) => item.id !== product.id),
      saved,
    ]);
    return saved;
  };

  const verifyProduct1688 = async (product, verification) => {
    const saved = await updateAdminProduct1688Verification(product.id, {
      ...verification,
      product,
    });
    onSaveProducts?.([
      ...products.filter((item) => item.id !== product.id),
      saved,
    ]);
    return saved;
  };

  const saveOrders = async (updated) => {
    const previousById = new Map(orders.map((order) => [order.id, order]));
    const changed = updated.find((order) => {
      const previous = previousById.get(order.id);
      return previous && (
        previous.fulfillmentStatus !== order.fulfillmentStatus ||
        previous.trackingNumber !== order.trackingNumber ||
        previous.trackingUrl !== order.trackingUrl ||
        previous.carrier !== order.carrier
      );
    });
    try {
      const saved = changed ? await saveAdminOrder(changed) : null;
      onSaveOrders?.(saved ? updated.map((order) => order.id === saved.id ? saved : order) : updated);
      setAdminNotice('Order fulfillment đã được lưu.');
    } catch (error) {
      setAdminNotice(`Không lưu được fulfillment: ${error.message}`);
    }
  };

  const saveSettings = async (updated) => {
    try {
      const saved = await saveStoreSettings(updated);
      onSaveSettings?.(saved);
      setAdminNotice('Store settings đã lưu vào Supabase.');
    } catch (error) {
      setAdminNotice(`Không lưu được settings: ${error.message}`);
    }
  };

  if (!authChecked) return <div className="admin-access"><div className="admin-access__card"><span className="admin-access__eyebrow">CONTROL ROOM / SECURE CHECK</span><h1>Đang kiểm tra quyền truy cập…</h1></div></div>;
  if (!adminSession) return <AdminAccess onAuthenticated={setAdminSession} onExit={onExitAdmin} />;

  const navGroups = [
    {
      group: 'MAIN',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard }
      ]
    },
    {
      group: 'CATALOG & MERCHANDISE',
      items: [
        { id: 'products', label: 'Drop Inventory', icon: Package, badge: products.length },
        { id: 'collections', label: 'Curated Drops', icon: Layers, badge: collections.length }
      ]
    },
    {
      group: 'STOREFRONT EXPERIENCE',
      items: [
        { id: 'menus', label: 'Dynamic Menus', icon: MenuIcon, badge: menus.length }
      ]
    },
    {
      group: 'OPERATIONS & GROWTH',
      items: [
        { 
          id: 'orders', 
          label: 'Orders & Fulfillment', 
          icon: Truck, 
          badge: unfulfilledOrdersCount > 0 ? `${unfulfilledOrdersCount} new` : null,
          badgeColor: 'bg-red-600 text-white' 
        },
        { id: 'membership', label: 'Access Pass VIP', icon: Users, badge: members.length }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Store Settings', icon: Settings }
      ]
    }
  ];

  const handleSelectTab = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="admin-shell">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ADMIN SIDEBAR */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'block fixed inset-y-0 left-0 z-50 w-72' : 'hidden lg:flex'}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#ff3b30] flex items-center justify-center shadow-lg shadow-red-900/50">
              <Flame size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black tracking-widest text-[#ff3b30] uppercase">
                CONTROL ROOM
              </div>
              <div className="text-sm font-black text-white tracking-wider uppercase font-athletic">
                LIDS HD PORTAL
              </div>
            </div>
          </div>

          {/* Close for mobile */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Storefront Switcher Button */}
        <div className="p-3 border-b border-[#222]">
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 px-3 bg-[#1e1e1e] hover:bg-[#ff3b30] text-zinc-300 hover:text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>LIVE STOREFRONT</span>
            </div>
            <ExternalLink size={13} className="text-zinc-500 group-hover:text-white" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="admin-sidebar-nav flex-1">
          {navGroups.map(group => (
            <div key={group.group} className="admin-sidebar-group">
              <div className="admin-sidebar-group-title">{group.group}</div>
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`admin-nav-item w-full ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon size={16} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`admin-nav-badge ${item.badgeColor || ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin Footer User Pill */}
        <div className="admin-sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-white">
              HD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">HEAD MERCHANDISER</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ed660] animate-pulse" />
                <span>ONLINE & LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ADMIN MAIN WRAPPER */}
      <div className="admin-main flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="admin-topbar sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-[#0f0f0f]/95 backdrop-blur border-b border-[#222]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 bg-[#1a1a1a] text-zinc-300 hover:text-white rounded"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="text-zinc-500 uppercase tracking-wider">LIDS HAT DROP</span>
              <ChevronRight size={14} className="text-zinc-600" />
              <span className="text-white uppercase tracking-wider">{currentTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live drop indicator banner */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-950/40 border border-red-900/50 rounded-full text-xs text-red-300">
              <span className="w-2 h-2 rounded-full bg-[#ff3b30] animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-[11px]">Playing With Fire Drop Active</span>
            </div>

            {/* Quick exit to storefront button */}
            <button
              onClick={onExitAdmin}
              className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#ff3b30] text-zinc-300 hover:text-white rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>VIEW STORE</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </header>

        {/* Active Tab View Body */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {adminNotice && <div className="mb-4 rounded border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">{adminNotice}</div>}
          {currentTab === 'overview' && (
            <AdminOverview
              products={products}
              orders={orders}
              members={members}
              collections={collections}
              catalogStats={catalogStats}
              currency={currency}
              onNavigateTab={onTabChange}
              onOpenNewProductModal={() => {
                onTabChange('products');
              }}
            />
          )}

          {currentTab === 'products' && (
            <AdminProducts 
              products={products}
              onSaveProducts={onSaveProducts}
              onSaveProduct={onSaveProduct || saveProduct}
              onDeleteProduct={onDeleteProduct || deleteProduct}
              onToggleProductStatus={onToggleProductStatus || toggleProductStatus}
              onVerifyProduct1688={onVerifyProduct1688 || verifyProduct1688}
              currency={currency}
              onOpenPDP={onOpenPDP}
            />
          )}

          {currentTab === 'collections' && (
            <AdminCollections 
              collections={collections}
              products={products}
              onSaveCollections={saveCollections}
              onViewCollection={(handle) => {
                onExitAdmin();
              }}
            />
          )}

          {currentTab === 'menus' && (
            <AdminMenus 
              menus={menus}
              onSaveMenus={saveMenus}
              onViewStorefront={onExitAdmin}
            />
          )}

          {currentTab === 'orders' && (
            <AdminOrders 
              orders={orders}
              onSaveOrders={saveOrders}
              currency={currency}
            />
          )}

          {currentTab === 'membership' && (
            <AdminMembership 
              members={members}
              onSaveMembers={onSaveMembers}
            />
          )}

          {currentTab === 'settings' && (
            <AdminSettings 
              settings={settings}
              onSaveSettings={saveSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
