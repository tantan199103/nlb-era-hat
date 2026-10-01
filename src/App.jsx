import React, { useState, useEffect } from 'react';
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
import { createOrder, fetchProducts, saveProfile, subscribeToDrop } from './services/storeApi';

// Full Pages
import CollectionsPage from './pages/CollectionsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccessPassPage from './pages/AccessPassPage';
import StoresPage from './pages/StoresPage';
import TrackOrderPage from './pages/TrackOrderPage';

import { products } from './data/storeData';

export default function App() {
  // Navigation / View state
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'collections' | 'product' | 'access-pass' | 'stores' | 'calendar' | 'track-order'
  const [selectedProductForPDP, setSelectedProductForPDP] = useState(products[0]);
  const [catalogProducts, setCatalogProducts] = useState(products);

  useEffect(() => {
    let active = true;
    fetchProducts().then((remoteProducts) => {
      if (!active || !remoteProducts?.length) return;
      setCatalogProducts(remoteProducts);
      setSelectedProductForPDP((current) => remoteProducts.find((item) => item.id === current?.id) || remoteProducts[0]);
    });
    return () => { active = false; };
  }, []);

  // Currency state
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('lidshd_currency') || 'USD';
  });

  // User & Preferred Size state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lidshd_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

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
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Initial sample item
    return [
      {
        id: products[0]?.id || 1,
        title: products[0]?.title || 'Boston Red Sox MLB Playing with Fire New Era 59FIFTY',
        price: products[0]?.price || '$49.99',
        size: '7 3/8',
        thumbnail: products[0]?.thumbnail || 'https://www.lidshd.com/cdn/shop/files/23235120_04.png?v=1790339447&width=2048',
        quantity: 1,
        team: products[0]?.team || 'Boston Red Sox'
      }
    ];
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

  // Filters for collections/drops
  const [activeLeagueFilter, setActiveLeagueFilter] = useState(null);
  const [activeTeamFilter, setActiveTeamFilter] = useState(null);

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
      if (user) {
        localStorage.setItem('lidshd_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('lidshd_user');
      }
    } catch (e) {}
  }, [user]);

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

  // Global Navigation Router
  const handleNavigate = (view, params = {}) => {
    setCurrentView(view);
    if (params.league) {
      setActiveLeagueFilter(params.league);
      setActiveTeamFilter(null);
    } else if (params.team) {
      setActiveTeamFilter(params.team);
      setActiveLeagueFilter(null);
    } else if (view === 'collections') {
      setActiveLeagueFilter(null);
      setActiveTeamFilter(null);
    }

    if (view === 'product' && params.product) {
      setSelectedProductForPDP(params.product);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPDP = (product) => {
    setSelectedProductForPDP(product);
    setCurrentView('product');
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
  const handleLogin = (userData) => {
    setUser(userData);
    saveProfile(userData, userPreferredSize);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleUpdatePreferredSize = (size) => {
    setUserPreferredSize(size);
  };

  // Cart Handlers
  const handleAddToCart = (product, size) => {
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
            price: product.price,
            size: size,
            thumbnail: product.thumbnail,
            quantity: 1,
            team: product.team
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

  const handleCheckoutSuccess = (items, subtotal) => {
    setCartOpen(false);
    createOrder({ items, subtotal, currency, user }).then((order) => {
      setCheckoutOrder({ items, subtotal, orderNumber: order?.order_number });
    });
    setCart([]);
  };

  const handleDropNotification = (dropTitle, email) => {
    subscribeToDrop(dropTitle, email);
  };

  const handleResetFilters = () => {
    setActiveLeagueFilter(null);
    setActiveTeamFilter(null);
  };

  const scrollToDrops = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('latest-drops');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('latest-drops');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-body">
      
      {/* 1. Rotating Announcement Bar with Currency Switcher */}
      <AnnouncementBar 
        onNavigate={handleNavigate}
        currency={currency}
        onSelectCurrency={setCurrency}
      />

      {/* 2. Main Navigation with Mega Menu, Search, Wishlist, Account, Customizer */}
      <Navbar 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenCustomizer={() => setCustomizerOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onNavigate={handleNavigate}
        onSelectLeague={(league) => {
          setActiveLeagueFilter(league);
          setActiveTeamFilter(null);
          setCurrentView('collections');
        }}
        onSelectTeam={(team) => {
          setActiveTeamFilter(team);
          setActiveLeagueFilter(null);
          setCurrentView('collections');
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
              products={catalogProducts}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              onNavigateProduct={handleOpenPDP}
              activeLeagueFilter={activeLeagueFilter}
              activeTeamFilter={activeTeamFilter}
              onResetFilters={handleResetFilters}
              wishlistIds={wishlist.map(w => w.id)}
              onToggleWishlist={handleToggleWishlist}
              currency={currency}
            />

            {/* Featured Curated Collections (Shop By League) */}
            <ShopByLeague 
              onSelectCollection={(title) => {
                setActiveTeamFilter(title);
                setCurrentView('collections');
              }}
            />

            {/* Pins & Chains Section */}
            <PinsAccessories 
              products={catalogProducts}
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
                setActiveTeamFilter('Chicago');
                setCurrentView('collections');
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
            products={catalogProducts}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            onNavigateProduct={handleOpenPDP}
            initialLeague={activeLeagueFilter}
            initialTeam={activeTeamFilter}
            wishlistIds={wishlist.map(w => w.id)}
            onToggleWishlist={handleToggleWishlist}
            currency={currency}
          />
        )}

        {currentView === 'product' && (
          <ProductDetailPage 
            product={selectedProductForPDP}
            allProducts={catalogProducts}
            onAddToCart={handleAddToCart}
            onBackToCatalog={() => setCurrentView('collections')}
            onNavigateProduct={handleOpenPDP}
            currency={currency}
            isWishlisted={wishlist.some(w => w.id === selectedProductForPDP?.id)}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlist.map(w => w.id)}
          />
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
        currency={currency}
      />

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
        onLogin={handleLogin}
        onLogout={handleLogout}
        userPreferredSize={userPreferredSize}
        onUpdatePreferredSize={handleUpdatePreferredSize}
      />

      <CapCustomizerModal 
        isOpen={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        products={catalogProducts}
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
        products={catalogProducts}
        onSelectProduct={handleOpenPDP}
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
