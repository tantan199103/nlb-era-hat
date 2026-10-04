import React, { useState, useEffect, useMemo } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import LatestDrops from './components/LatestDrops';
import ShopByLeague from './components/ShopByLeague';
import PinsAccessories from './components/PinsAccessories';
import ChicagoSoleBanner from './components/ChicagoSoleBanner';
import UpcomingDrops from './components/UpcomingDrops';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import SearchModal from './components/SearchModal';
import NotifyModal from './components/NotifyModal';
import CheckoutSuccessModal from './components/CheckoutSuccessModal';
import WishlistDrawer from './components/WishlistDrawer';
import AccountModal from './components/AccountModal';
import CapCustomizerModal from './components/CapCustomizerModal';
import Footer from './components/Footer';
import { createOrder, fetchMyOrders, fetchProducts, saveProfile, subscribeToDrop } from './services/storeApi';
import { fetchStorefrontCollections, fetchStorefrontMenus } from './services/adminApi';

// Full Pages
import CollectionsPage from './pages/CollectionsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccessPassPage from './pages/AccessPassPage';
import StoresPage from './pages/StoresPage';
import TrackOrderPage from './pages/TrackOrderPage';
import PolicyPage from './pages/PolicyPage';
import AdminShell from './admin/AdminShell';

import { products } from './data/storeData';
import { supabase } from './lib/supabase';
import { selectedProductPrice } from './lib/productPricing';
import { 
  defaultMenus, 
  defaultCollections, 
  defaultOrders, 
  defaultMembers, 
  defaultSettings 
} from './admin/adminData';

function readStorefrontRoute() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);
  const policySlug = pathname.slice(1);
  if (['about', 'privacy', 'terms', 'sustainability', 'accessibility'].includes(policySlug)) return { view: 'policy', params: { slug: policySlug } };
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const tab = pathname.slice('/admin'.length).replace(/^\/+/, '') || 'overview';
    return { view: 'admin', params: { tab } };
  }
  if (pathname === '/collections' || pathname === '/shop' || pathname.startsWith('/category/')) {
    const routeParams = Object.fromEntries(params.entries());
    if (routeParams.stock === '1') routeParams.inStockOnly = true;
    if (routeParams.sort) routeParams.sortBy = routeParams.sort;
    return { view: 'collections', params: routeParams };
  }
  if (pathname.startsWith('/product/')) return { view: 'product', handle: decodeURIComponent(pathname.slice('/product/'.length)), params: {} };
  if (pathname === '/access-pass') return { view: 'access-pass', params: {} };
  if (pathname === '/stores') return { view: 'stores', params: {} };
  if (pathname === '/track-order') return { view: 'track-order', params: {} };
  if (pathname === '/calendar') return { view: 'calendar', params: {} };
  return { view: 'home', params: {} };
}

function routePath(view, params = {}, product = null) {
  if (view === 'collections') {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === true) query.set(key === 'inStockOnly' ? 'stock' : key, '1');
      else if (value !== '' && value != null) query.set(key === 'sortBy' ? 'sort' : key, value);
    });
    const suffix = query.toString();
    return `/collections${suffix ? `?${suffix}` : ''}`;
  }
  if (view === 'product') return `/product/${encodeURIComponent(product?.handle || product?.id || '')}`;
  if (view === 'admin') return params.tab && params.tab !== 'overview' ? `/admin/${params.tab}` : '/admin';
  if (view === 'access-pass') return '/access-pass';
  if (view === 'stores') return '/stores';
  if (view === 'track-order') return '/track-order';
  if (view === 'calendar') return '/calendar';
  if (view === 'policy') return `/${params.slug || 'about'}`;
  return '/';
}

function is1688Matched(product) {
  return String(product?.source1688Status || product?.source_1688_status || '').toUpperCase() === 'MATCHED';
}

function accountFromSession(authUser) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Collector',
    user_metadata: authUser.user_metadata,
  };
}

export default function App() {
  // Navigation / View state ('home' | 'collections' | 'product' | 'access-pass' | 'stores' | 'calendar' | 'track-order' | 'admin')
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedProductForPDP, setSelectedProductForPDP] = useState(products[0]);
  // Connected storefronts start empty while the source-approved page loads;
  // otherwise the local seed briefly flashes as if it were sellable data.
  const [catalogProducts, setCatalogProducts] = useState(() => supabase ? [] : products);
  const [catalogLoading, setCatalogLoading] = useState(() => Boolean(supabase));
  const [catalogLoadError, setCatalogLoadError] = useState(false);
  // The admin keeps the full local/remote state, while every storefront
  // surface receives only rows that passed the 1688 source gate.
  const publicCatalogProducts = useMemo(() => catalogProducts.filter(is1688Matched), [catalogProducts]);
  const catalogStatus = useMemo(() => ({
    matchedCount: publicCatalogProducts.length,
    // When the public API is connected it intentionally cannot expose the
    // private review queue. The count is still useful for the local/offline
    // seed and for an admin preview, while the public copy remains generic.
    pendingCount: catalogProducts.filter((product) => !is1688Matched(product)).length,
    loading: catalogLoading,
    error: catalogLoadError,
  }), [catalogProducts, publicCatalogProducts, catalogLoading, catalogLoadError]);

  // Admin Portal & Merchandising State
  const [adminTab, setAdminTab] = useState('overview');

  const [menus, setMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_menus');
      if (saved) {
        const parsed = JSON.parse(saved);
        const header = parsed.find((menu) => menu.location === 'HEADER');
        if (header?.items?.some((item) => item.label === 'SHOP')) return parsed;
      }
    } catch (e) {}
    return defaultMenus;
  });

  const [collections, setCollections] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_collections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultCollections;
  });

  const [orders, setOrders] = useState(() => {
    // Connected mode reads orders from Supabase after admin auth. Do not
    // surface stale local preview orders while that request is pending.
    if (supabase) return [];
    try {
      const saved = localStorage.getItem('lidshd_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultOrders;
  });

  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_members');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultMembers;
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultSettings;
  });

  // LocalStorage persistence for Admin data
  useEffect(() => {
    try { localStorage.setItem('lidshd_menus', JSON.stringify(menus)); } catch (e) {}
  }, [menus]);

  useEffect(() => {
    try { localStorage.setItem('lidshd_collections', JSON.stringify(collections)); } catch (e) {}
  }, [collections]);

  useEffect(() => {
    try { localStorage.setItem('lidshd_orders', JSON.stringify(orders)); } catch (e) {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem('lidshd_members', JSON.stringify(members)); } catch (e) {}
  }, [members]);

  useEffect(() => {
    try { localStorage.setItem('lidshd_settings', JSON.stringify(settings)); } catch (e) {}
  }, [settings]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    setCatalogLoading(true);
    setCatalogLoadError(false);
    fetchProducts().then((remoteProducts) => {
      if (!active) return;
      if (!Array.isArray(remoteProducts)) {
        setCatalogLoadError(true);
        return;
      }
      // An empty result is meaningful: Supabase is reachable, but there are
      // currently no MATCHED listings. Do not keep stale seed rows visible.
      setCatalogProducts(remoteProducts);
      setSelectedProductForPDP((current) => remoteProducts.find((item) => item.id === current?.id) || remoteProducts[0] || null);
    }).catch(() => {
      if (active) setCatalogLoadError(true);
    }).finally(() => {
      if (active) setCatalogLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Currency state
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('lidshd_currency') || 'USD';
  });

  // User & Preferred Size state
  const [user, setUser] = useState(() => {
    // A browser cache is never an authenticated identity in connected mode.
    if (supabase) return null;
    try {
      const saved = localStorage.getItem('lidshd_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [accountOrders, setAccountOrders] = useState([]);
  const [accountOrdersLoading, setAccountOrdersLoading] = useState(false);
  const [accountOrdersError, setAccountOrdersError] = useState('');

  const [userPreferredSize, setUserPreferredSize] = useState(() => {
    return localStorage.getItem('lidshd_pref_size') || '7 3/8';
  });

  // Wishlist state
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_wishlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Load cart from localStorage or initialize with sample cap
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_cart');
      if (saved) return JSON.parse(saved).filter(is1688Matched);
    } catch (e) {}
    // Never pre-fill the cart with an unverified sample listing.
    return [];
  });

  // Modals & Drawers state
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [notifyDropTitle, setNotifyDropTitle] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Filters for collections/drops
  const [activeLeagueFilter, setActiveLeagueFilter] = useState(null);
  const [activeTeamFilter, setActiveTeamFilter] = useState(null);
  const [activeSearchFilter, setActiveSearchFilter] = useState('');
  const [activeCatalogParams, setActiveCatalogParams] = useState({});

  useEffect(() => {
    const applyRoute = () => {
      const route = readStorefrontRoute();
      setCurrentView(route.view);
      setActiveCatalogParams(route.params || {});
      if (route.view === 'admin') setAdminTab(route.params?.tab || 'overview');
      setActiveLeagueFilter(route.params?.league || null);
      setActiveTeamFilter(route.params?.team || null);
      setActiveSearchFilter(route.params?.search || '');
      if (route.view === 'product' && route.handle) {
        setSelectedProductForPDP((current) => publicCatalogProducts.find((product) => String(product.handle || product.id) === route.handle) || current);
      }
    };
    applyRoute();
    window.addEventListener('popstate', applyRoute);
    return () => window.removeEventListener('popstate', applyRoute);
  }, [catalogProducts, publicCatalogProducts]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lidshd_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Persist wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lidshd_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Persist user to localStorage
  useEffect(() => {
    try {
      if (user && !supabase) {
        localStorage.setItem('lidshd_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('lidshd_user');
      }
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (active) setUser(accountFromSession(session?.user));
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authEventReceived) setUser(error ? null : accountFromSession(data.session?.user));
    }).catch(() => {
      if (active && !authEventReceived) setUser(null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setAccountOrders([]);
      setAccountOrdersLoading(false);
      setAccountOrdersError('');
      return undefined;
    }
    let active = true;
    setAccountOrdersLoading(true);
    setAccountOrdersError('');
    fetchMyOrders(user.id).then((rows) => {
      if (active) setAccountOrders(rows);
    }).catch((error) => {
      if (active) {
        setAccountOrders([]);
        setAccountOrdersError(error?.message || 'Unable to load order history right now.');
      }
    }).finally(() => {
      if (active) setAccountOrdersLoading(false);
    });
    return () => { active = false; };
  }, [user?.id]);

  // Persist preferred size & currency
  useEffect(() => {
    try {
      localStorage.setItem('lidshd_pref_size', userPreferredSize);
    } catch (e) {}
  }, [userPreferredSize]);

  useEffect(() => {
    try {
      localStorage.setItem('lidshd_currency', currency);
    } catch (e) {}
  }, [currency]);

  // Keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchStorefrontMenus(defaultMenus),
      fetchStorefrontCollections(defaultCollections),
    ]).then(([remoteMenus, remoteCollections]) => {
      if (!active) return;
      setMenus(remoteMenus);
      setCollections(remoteCollections);
    });
    return () => { active = false; };
  }, []);

  // Global Navigation Router
  const handleNavigate = (view, params = {}) => {
    window.history.pushState({}, '', routePath(view, params));
    setCurrentView(view);
    setActiveCatalogParams(params || {});
    if (params.league) {
      setActiveLeagueFilter(params.league);
      setActiveTeamFilter(null);
      setActiveSearchFilter('');
    } else if (params.team) {
      setActiveTeamFilter(params.team);
      setActiveLeagueFilter(null);
      setActiveSearchFilter('');
    } else if (params.search) {
      setActiveSearchFilter(params.search);
      setActiveLeagueFilter(null);
      setActiveTeamFilter(null);
    } else if (view === 'collections') {
      setActiveLeagueFilter(null);
      setActiveTeamFilter(null);
      setActiveSearchFilter('');
    }

    if (view === 'product' && params.product) {
      setSelectedProductForPDP(params.product);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminTabChange = (tab) => {
    setAdminTab(tab);
    window.history.pushState({}, '', routePath('admin', { tab }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPDP = (product) => {
    if (!is1688Matched(product)) return;
    setSelectedProductForPDP(product);
    setCurrentView('product');
    window.history.pushState({}, '', routePath('product', {}, product));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wishlist Handlers
  const handleToggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  // Cap & Pin Customizer Bundle Handler
  const handleAddBundleToCart = (hat, size, pin) => {
    handleAddToCart(hat, size);
    handleAddToCart(pin, 'ONE SIZE');
    setCartOpen(true);
  };

  // User Auth Handlers
  const handleLogin = async ({ email, password, signUp = false }) => {
    if (!supabase) {
      throw new Error('Account sign-in is unavailable because Supabase is not configured. Please configure authentication first.');
    }
    const { data, error } = signUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) {
      return { message: 'Check your email to confirm your account, then sign in.' };
    }
    const authenticatedUser = accountFromSession(data.session.user);
    setUser(authenticatedUser);
    await saveProfile(authenticatedUser, userPreferredSize);
    return {};
  };

  const handleLogout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
  };

  const handleUpdatePreferredSize = (size) => {
    setUserPreferredSize(size);
  };

  // Cart Handlers
  const handleAddToCart = (product, size) => {
    if (!is1688Matched(product)) return;
    const selectedVariant = product.sizes?.find((variant) => variant.size === size);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && item.size === size
      );

    if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            price: selectedProductPrice(product, size),
            size: size,
            thumbnail: product.thumbnail,
            quantity: 1,
            team: product.team,
            variantId: selectedVariant?.id || null,
            source1688Status: 'MATCHED',
          }
        ];
      }
    });

    // Auto open cart drawer
    setCartOpen(true);
  };

  const handleUpdateQuantity = (productId, size, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId && item.size === size
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleRemoveItem = (productId, size) => {
    setCart((prev) =>
      prev.filter((item) => !(item.id === productId && item.size === size))
    );
  };

  const handleCheckoutSuccess = async (items, subtotal, customerEmail) => {
    if (!items?.length || items.some((item) => !is1688Matched(item))) {
      setCart((current) => current.filter(is1688Matched));
      setCartOpen(false);
      return;
    }
    setCheckoutError('');
    setCartOpen(false);
    try {
      const order = await createOrder({ items, subtotal, currency, user, customerEmail });
      if (!order?.order_number) {
        throw new Error('The order reference was not returned by the store.');
      }
      // The confirmation and admin queue are sourced from the persisted order.
      // Do not manufacture a local order number or a paid order when persistence fails.
      setCheckoutOrder({ items, subtotal, orderNumber: order.order_number });
      setCart([]);
    } catch (error) {
      console.warn('Checkout could not be completed:', error?.message || error);
      setCheckoutError('We could not place your order right now. Your cart is still saved — please try again.');
      setCartOpen(true);
    }
  };

  const handleDropNotification = (dropTitle, email) => {
    subscribeToDrop(dropTitle, email);
  };

  const handleResetFilters = () => {
    setActiveLeagueFilter(null);
    setActiveTeamFilter(null);
    setActiveSearchFilter('');
    setActiveCatalogParams({});
  };

  const scrollToDrops = () => {
    if (currentView !== 'home') {
      handleNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('latest-drops');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('latest-drops');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Full-Screen Dedicated Admin Shell (Modeled after custom pod's admin dashboard)
  if (currentView === 'admin') {
    return (
      <AdminShell 
        currentTab={adminTab}
        onTabChange={handleAdminTabChange}
        onExitAdmin={() => handleNavigate('home')}
        products={catalogProducts}
        onSaveProducts={(updated) => setCatalogProducts(updated)}
        collections={collections}
        onSaveCollections={(updated) => setCollections(updated)}
        menus={menus}
        onSaveMenus={(updated) => setMenus(updated)}
        orders={orders}
        onSaveOrders={(updated) => setOrders(updated)}
        members={members}
        onSaveMembers={(updated) => setMembers(updated)}
        settings={settings}
        onSaveSettings={(updated) => setSettings(updated)}
        currency={currency}
        onOpenPDP={handleOpenPDP}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-body">
      
      {/* 1. Rotating Announcement Bar with Currency Switcher */}
      <AnnouncementBar 
        onNavigate={handleNavigate}
        currency={currency}
        onSelectCurrency={setCurrency}
      />

      {/* 2. Main Navigation with Dynamic Menus from Menu Builder */}
      <Navbar 
        menus={menus}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenCustomizer={() => setCustomizerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onNavigate={handleNavigate}
        onSelectLeague={(league) => {
          handleNavigate('collections', { league });
        }}
        onSelectTeam={(team) => {
          handleNavigate('collections', { team });
        }}
      />

      {/* 3. Main Dynamic View Routing */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* Hero Drop Banner with Live Countdown Timer & Dual Showcases */}
            <HeroBanner 
              onShopNow={scrollToDrops}
              onNotifyMe={() => setNotifyDropTitle('MLB Playing with Fire 59FIFTY')}
              onNavigate={handleNavigate}
            />

            {/* Latest Drops Section with On-Card Size Selector */}
            <LatestDrops 
              products={publicCatalogProducts}
              catalogStatus={catalogStatus}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              onNavigateProduct={handleOpenPDP}
              activeLeagueFilter={activeLeagueFilter}
              activeTeamFilter={activeTeamFilter}
              onResetFilters={handleResetFilters}
              wishlistIds={wishlist.map(w => w.id)}
              onToggleWishlist={handleToggleWishlist}
              currency={currency}
              onBrowseCalendar={() => handleNavigate('calendar')}
              onNotify={() => setNotifyDropTitle('Verified hat drops')}
            />

            {/* Featured Curated Collections (Shop By League) */}
            <ShopByLeague 
              onSelectCollection={(title) => {
                handleNavigate('collections', { team: title });
              }}
            />

            {/* Pins & Chains Section */}
            <PinsAccessories 
              products={publicCatalogProducts}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              onNavigateProduct={handleOpenPDP}
              wishlistIds={wishlist.map(w => w.id)}
              onToggleWishlist={handleToggleWishlist}
              currency={currency}
            />

            {/* Chicago Sole Banner */}
            <ChicagoSoleBanner 
              onExplore={() => {
                handleNavigate('collections', { team: 'Chicago' });
              }}
            />

            {/* Upcoming Drops Calendar */}
            <UpcomingDrops 
              onNotifyMe={(title) => setNotifyDropTitle(title)}
            />
          </>
        )}

        {currentView === 'collections' && (
          <CollectionsPage 
            products={publicCatalogProducts}
            catalogStatus={catalogStatus}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateProduct={handleOpenPDP}
            initialLeague={activeLeagueFilter}
            initialTeam={activeTeamFilter}
            initialSearch={activeSearchFilter}
            initialGroup={activeCatalogParams.group || ''}
            initialSize={activeCatalogParams.size || ''}
            initialInStockOnly={Boolean(activeCatalogParams.inStockOnly)}
            initialSort={activeCatalogParams.sortBy || 'newest'}
            wishlistIds={wishlist.map(w => w.id)}
            onToggleWishlist={handleToggleWishlist}
            currency={currency}
            onBrowseCalendar={() => handleNavigate('calendar')}
            onNotify={() => setNotifyDropTitle('Verified hat drops')}
          />
        )}

        {currentView === 'product' && is1688Matched(selectedProductForPDP) && (
          <ProductDetailPage 
            product={selectedProductForPDP}
            allProducts={publicCatalogProducts}
            onAddToCart={handleAddToCart}
            onBackToCatalog={() => handleNavigate('collections')}
            onNavigateProduct={handleOpenPDP}
            currency={currency}
            isWishlisted={wishlist.some(w => w.id === selectedProductForPDP?.id)}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlist.map(w => w.id)}
          />
        )}

        {currentView === 'product' && !is1688Matched(selectedProductForPDP) && (
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h1 className="font-display text-3xl font-black uppercase text-white">Listing chưa sẵn sàng</h1>
            <p className="mt-3 text-sm text-zinc-500">Sản phẩm chỉ được bán sau khi admin xác nhận có mẫu tương ứng trên 1688.</p>
            <button onClick={() => handleNavigate('collections')} className="btn-flame mt-6 px-5 py-2 text-xs">Quay lại catalog</button>
          </div>
        )}

        {currentView === 'access-pass' && (
          <AccessPassPage 
            onShopDrops={() => handleNavigate('collections')}
          />
        )}

        {currentView === 'stores' && (
          <StoresPage />
        )}

        {currentView === 'track-order' && (
          <TrackOrderPage />
        )}

        {currentView === 'calendar' && (
          <div className="py-10">
            <UpcomingDrops onNotifyMe={(title) => setNotifyDropTitle(title)} />
          </div>
        )}

        {currentView === 'policy' && (
          <PolicyPage slug={activeCatalogParams.slug || 'about'} onBack={() => handleNavigate('home')} />
        )}
      </main>

      {/* 4. Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Modals & Slide-out Drawers */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckoutSuccess={handleCheckoutSuccess}
        customerEmail={user?.email || ''}
        currency={currency}
      />

      {checkoutError && (
        <div role="alert" className="fixed bottom-5 left-1/2 z-[60] flex w-[min(92vw,460px)] -translate-x-1/2 items-start gap-3 rounded-lg border border-amber-800/70 bg-[#241a0f] px-4 py-3 text-xs leading-5 text-amber-100 shadow-2xl">
          <span className="flex-1">{checkoutError}</span>
          <button type="button" onClick={() => setCheckoutError('')} className="shrink-0 font-bold uppercase tracking-wider text-amber-300 hover:text-white" aria-label="Dismiss checkout error">Dismiss</button>
        </div>
      )}

      <WishlistDrawer 
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlistItems={wishlist}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={handleAddToCart}
        currency={currency}
      />

      <AccountModal 
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={user}
        orders={accountOrders}
        ordersLoading={accountOrdersLoading}
        ordersError={accountOrdersError}
        onLogin={handleLogin}
        onLogout={handleLogout}
        userPreferredSize={userPreferredSize}
        onUpdatePreferredSize={handleUpdatePreferredSize}
      />

      <CapCustomizerModal 
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        products={publicCatalogProducts}
        onAddBundleToCart={handleAddBundleToCart}
        currency={currency}
      />

      <ProductDetailModal 
        isOpen={!!quickViewProduct}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        currency={currency}
      />

      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={publicCatalogProducts}
        onSelectProduct={handleOpenPDP}
        onBrowseSearch={(query) => handleNavigate('collections', { search: query })}
        currency={currency}
      />

      <NotifyModal 
        isOpen={!!notifyDropTitle}
        dropTitle={notifyDropTitle}
        onClose={() => setNotifyDropTitle(null)}
        onSubmit={handleDropNotification}
      />

      <CheckoutSuccessModal 
        isOpen={!!checkoutOrder}
        orderDetails={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
      />

    </div>
  );
}
