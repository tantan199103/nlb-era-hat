import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { 
  ShoppingBag, Check, Heart, Share2, Ruler, ShieldCheck, Truck, 
  RotateCcw, Sparkles, Flame, Star, ChevronRight, Plus, Minus, ArrowLeft 
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { selectedProductPrice } from '../lib/productPricing';

export default function ProductDetailPage({ 
  product, 
  allProducts, 
  onAddToCart, 
  onBackToCatalog,
  onNavigateProduct,
  currency = 'USD',
  isWishlisted = false,
  onToggleWishlist,
  wishlistIds = []
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showError, setShowError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('specs');
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImageIndex(0);
    setSelectedSize(null);
    setQuantity(1);
  }, [product?.id]);

  // Monitor scroll for sticky Add-to-Cart bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const displayPrice = selectedProductPrice(product, selectedSize);

  // Complementary pin recommendation
  const complementaryPin = allProducts.find(p => p.category === 'pins') || allProducts[allProducts.length - 1];

  const handleSizeClick = (s) => {
    if (!s.inStock) return;
    setSelectedSize(s.size);
    setShowError(false);
  };

  const handleAddToCart = () => {
    const effectiveSize = selectedSize || (product.sizes?.length === 1 ? product.sizes[0].size : null);

    if (!effectiveSize) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsAdded(true);

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, effectiveSize);
    }

    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  // Related drops (same league or similar team)
  const relatedDrops = allProducts
    .filter(p => p.id !== product.id && (p.league === product.league || p.category === product.category))
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 sm:py-10 animate-fade-in">
      
      {/* Breadcrumbs & Back Button */}
      <div className="flex items-center justify-between text-xs text-gray-400 mb-6 pb-3 border-b border-[#222222]">
        <button 
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 text-white hover:text-[#ff3b30] font-bold uppercase transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Drops</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-wider">
          <button onClick={onBackToCatalog} className="hover:text-white">Home</button>
          <span>/</span>
          <span className="text-gray-300">{product.league}</span>
          <span>/</span>
          <span className="text-white font-bold truncate max-w-[200px]">{product.team}</span>
        </div>
      </div>

      {/* Main PDP Grid: Gallery (Left) & Buy Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 mb-20">
        
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Large Image */}
          <div className="relative aspect-square w-full bg-[#121212] border border-[#242424] rounded-lg overflow-hidden flex items-center justify-center group">
            <img 
              src={images[activeImageIndex]} 
              alt={product.title} 
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
            />
            {product.badge && (
              <div className="absolute top-4 left-4 bg-[#e10600] text-white text-[11px] font-black uppercase px-3 py-1 rounded tracking-wider shadow-lg">
                {product.badge}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square rounded-md overflow-hidden bg-[#141414] border-2 p-1 transition-all ${
                    activeImageIndex === idx ? 'border-white opacity-100 shadow-md' : 'border-[#262626] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#222222] text-center text-[11px] text-gray-400">
            <div className="bg-[#141414] p-3 rounded border border-[#222]">
              <ShieldCheck size={18} className="text-[#2563eb] mx-auto mb-1" />
              <span className="font-bold text-gray-200 block">100% Authentic</span>
              Official New Era Drop
            </div>
            <div className="bg-[#141414] p-3 rounded border border-[#222]">
              <Truck size={18} className="text-[#3ed660] mx-auto mb-1" />
              <span className="font-bold text-gray-200 block">Fast Dispatch</span>
              Tracked 2-3 Day Delivery
            </div>
            <div className="bg-[#141414] p-3 rounded border border-[#222]">
              <RotateCcw size={18} className="text-[#ffaa00] mx-auto mb-1" />
              <span className="font-bold text-gray-200 block">30-Day Returns</span>
              Hassle-Free Exchanges
            </div>
          </div>

        </div>

        {/* Buy Box Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              <span>{product.league}</span>
              <span>•</span>
              <span className="text-[#3ed660]">{product.team}</span>
              <span>•</span>
              <span>{product.silhouette}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight mb-3">
              {product.title}
            </h1>

            {/* Price & Access Pass points */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-3xl font-black text-white">
                {formatPrice(displayPrice, currency)}
              </span>
              <span className="text-xs text-gray-400 font-semibold uppercase">{currency}</span>
              <span className="text-xs bg-[#1f2d22] text-[#3ed660] border border-[#2e5236] px-2.5 py-0.5 rounded font-bold">
                IN STOCK
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#ffaa00] font-semibold mb-5">
              <Sparkles size={13} />
              <span>Access Pass: Earn 500 points with this pickup</span>
            </div>

            {/* Live Demand Notice */}
            <div className="bg-[#1f1614] border border-[#44231f] p-3 rounded-lg flex items-center gap-2.5 text-xs text-[#ff3b30] font-bold mb-6">
              <Flame size={16} className="animate-pulse" />
              <span>HIGH DEMAND: Over 32 cap collectors currently viewing this drop</span>
            </div>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  Select Size: {selectedSize && <span className="text-white font-extrabold text-sm ml-1">{selectedSize}</span>}
                </span>
                <button 
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-xs text-[#ff3b30] hover:underline flex items-center gap-1 font-bold"
                >
                  <Ruler size={13} />
                  <span>Size Chart</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.id || s.size}
                    type="button"
                    disabled={!s.inStock}
                    onClick={() => handleSizeClick(s)}
                    className={`h-11 rounded font-bold text-xs flex items-center justify-center transition-all ${
                      selectedSize === s.size
                        ? 'bg-white text-black font-extrabold shadow-lg shadow-white/20'
                        : (!s.inStock 
                            ? 'bg-[#161616] text-gray-600 line-through border border-[#222] cursor-not-allowed' 
                            : 'bg-[#202020] text-gray-200 hover:bg-[#2c2c2c] border border-[#2d2d2d]')
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>

              {showError && (
                <p className="text-[#ff3b30] text-xs font-bold mt-2">
                  ⚠️ Please pick your fitted size before adding to cart.
                </p>
              )}

              {/* Size Guide Accordion */}
              {showSizeGuide && (
                <div className="mt-3 p-4 bg-[#181818] border border-[#333333] rounded-lg text-xs space-y-2 animate-fade-in">
                  <div className="font-bold text-white uppercase tracking-wider">New Era 59FIFTY Fitted Sizing Chart:</div>
                  <div className="grid grid-cols-2 gap-2 text-gray-300 text-[11px]">
                    <div>Size 7: 55.8 cm (22")</div>
                    <div>Size 7 1/8: 56.8 cm (22 3/8")</div>
                    <div>Size 7 1/4: 57.7 cm (22 3/4")</div>
                    <div>Size 7 3/8: 58.7 cm (23 1/8")</div>
                    <div>Size 7 1/2: 59.6 cm (23 1/2")</div>
                    <div>Size 7 5/8: 60.6 cm (23 7/8")</div>
                    <div>Size 7 3/4: 61.5 cm (24 1/4")</div>
                    <div>Size 8: 63.5 cm (25")</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              {/* Quantity Box */}
              <div className="flex items-center border border-[#333333] rounded bg-[#181818] px-2">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Minus size={13} />
                </button>
                <span className="px-3 text-xs font-bold text-white min-w-[28px] text-center">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 py-3.5 px-6 rounded text-xs sm:text-sm font-display font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                  isAdded 
                    ? 'bg-[#3ed660] text-black' 
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={18} className="animate-check-pop" />
                    <span>ADDED TO CART!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>ADD TO CART • {formatPrice(displayPrice, currency)}</span>
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => onToggleWishlist && onToggleWishlist(product)}
                className={`p-3.5 rounded border transition-colors flex items-center justify-center ${
                  isWishlisted 
                    ? 'bg-[#2a1313] border-[#ff3b30] text-[#ff3b30]' 
                    : 'bg-[#181818] border-[#333333] text-gray-300 hover:text-white hover:border-[#555]'
                }`}
                title={isWishlisted ? 'Saved to Vault' : 'Save to Vault'}
              >
                <Heart size={18} className={isWishlisted ? 'fill-[#ff3b30]' : ''} />
              </button>
            </div>

            {/* Quick Buy Button */}
            <button 
              onClick={handleAddToCart}
              className="w-full btn-flame text-xs sm:text-sm py-3 flex items-center justify-center gap-2"
            >
              <span>BUY NOW • FAST SECURE CHECKOUT</span>
            </button>
          </div>

          {/* Complete the Look Bundle */}
          {complementaryPin && (
            <div className="bg-[#181818] border border-[#2a2a2a] p-4 rounded-lg flex items-center justify-between gap-3 mt-6">
              <img 
                src={complementaryPin.thumbnail} 
                alt={complementaryPin.title} 
                className="w-12 h-12 object-cover rounded bg-[#121212]" 
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[#ffaa00] uppercase tracking-wider block">PAIRS PERFECTLY</span>
                <div className="text-xs font-bold text-white truncate">{complementaryPin.title}</div>
                <div className="text-xs text-gray-400">{formatPrice(complementaryPin.price, currency)}</div>
              </div>
              <button 
                onClick={() => onAddToCart(complementaryPin, 'ONE SIZE')}
                className="btn-secondary text-[11px] py-1.5 px-3 flex-shrink-0"
              >
                + Add Pin
              </button>
            </div>
          )}

          {/* Description & Accordion Tabs */}
          <div className="pt-4 border-t border-[#242424] space-y-3">
            <div className="flex border-b border-[#242424] text-xs">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'specs' ? 'text-white border-b-2 border-[#ff3b30]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Cap Specifications
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`pb-2.5 px-3 font-bold uppercase tracking-wider transition-colors ${
                  activeTab === 'shipping' ? 'text-white border-b-2 border-[#ff3b30]' : 'text-gray-400 hover:text-white'
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            {activeTab === 'specs' ? (
              <div className="text-xs text-gray-300 space-y-2 leading-relaxed pt-1">
                <p>
                  Official New Era 59FIFTY Fitted cap. High-grade metallic raised embroidery on front crown with matching commemorative side patch. Finished with contrast under-visor stitching.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400 pt-1">
                  <li>Profile: Structured 6-Panel High Crown</li>
                  <li>Visor: Flat bill with ability to curve</li>
                  <li>Material: 100% Woven Performance Polyester</li>
                  <li>Backing: Closed fitted back with MLB Batterman embroidery</li>
                </ul>
              </div>
            ) : (
              <div className="text-xs text-gray-300 space-y-2 leading-relaxed pt-1">
                <p>
                  Orders over $99 receive Free Standard U.S. Shipping. All orders ship double-boxed to ensure cap crown integrity.
                </p>
                <p className="text-gray-400">
                  Easy 30-day return policy. Caps must be unworn with original metallic visor stickers intact.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="border-t border-[#222222] pt-14 mb-20">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-4 border-b border-[#242424]">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              COLLECTOR REVIEWS
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex text-[#ffaa00]">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#ffaa00" />)}
              </div>
              <span className="text-xs font-bold text-white">4.9 / 5.0</span>
              <span className="text-xs text-gray-400">(48 verified collector reviews)</span>
            </div>
          </div>
          <button className="btn-secondary text-xs mt-3 sm:mt-0">Write a Review</button>
        </div>

        {/* Sample Collector Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-[#242424] p-5 rounded-lg space-y-2">
            <div className="flex text-[#ffaa00]">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#ffaa00" />)}
            </div>
            <div className="font-bold text-white text-xs">"Scorching details on the embroidery!"</div>
            <p className="text-xs text-gray-400">
              The metallic threading pops in sunlight. Undervisor color matches my sneaker rotation perfectly. Shipped in a pristine hat box.
            </p>
            <div className="text-[10px] text-gray-500 pt-2">— Marcus K., Verified Buyer (Size 7 3/8)</div>
          </div>

          <div className="bg-[#141414] border border-[#242424] p-5 rounded-lg space-y-2">
            <div className="flex text-[#ffaa00]">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#ffaa00" />)}
            </div>
            <div className="font-bold text-white text-xs">"True to size, crown structure is 10/10"</div>
            <p className="text-xs text-gray-400">
              New Era's quality control on this Lids HD exclusive is top tier. High crown sits perfectly without creasing.
            </p>
            <div className="text-[10px] text-gray-500 pt-2">— Anthony V., Cap Vault Member (Size 7 1/2)</div>
          </div>

          <div className="bg-[#141414] border border-[#242424] p-5 rounded-lg space-y-2">
            <div className="flex text-[#ffaa00]">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#ffaa00" />)}
            </div>
            <div className="font-bold text-white text-xs">"World Series patch embroidery is incredible"</div>
            <p className="text-xs text-gray-400">
              Must-have for any serious collector. Grabbed it right at 7 PM ET using the Access Pass early link.
            </p>
            <div className="text-[10px] text-gray-500 pt-2">— Derek R., VIP Collector (Size 7 1/4)</div>
          </div>
        </div>
      </div>

      {/* Related Drops Carousel */}
      {relatedDrops.length > 0 && (
        <div className="border-t border-[#222222] pt-14">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#242424]">
            <h3 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              YOU MAY ALSO LIKE
            </h3>
            <button onClick={onBackToCatalog} className="text-xs text-[#ff3b30] font-bold uppercase hover:underline">
              View All Drops &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedDrops.map((rel) => (
              <ProductCard 
                key={rel.id}
                product={rel}
                onAddToCart={onAddToCart}
                onQuickView={() => onNavigateProduct && onNavigateProduct(rel)}
                onNavigateProduct={onNavigateProduct}
                isWishlisted={wishlistIds.includes(rel.id)}
                onToggleWishlist={onToggleWishlist}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Add-to-Cart Bar on Mobile & Scroll */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-md border-t border-[#2a2a2a] p-3 px-4 sm:px-8 flex items-center justify-between gap-4 animate-fade-in shadow-2xl">
          <div className="flex items-center gap-3">
            <img src={product.thumbnail} alt={product.title} className="w-11 h-11 object-contain rounded bg-[#181818]" />
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white truncate max-w-[300px]">{product.title}</div>
              <div className="text-[11px] text-[#ffaa00] font-bold">
                {selectedSize ? `Size: ${selectedSize}` : 'Pick a size'} • {formatPrice(displayPrice, currency)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              className="btn-flame text-xs py-2.5 px-6 whitespace-nowrap"
            >
              {isAdded ? 'ADDED!' : `ADD TO CART • ${formatPrice(displayPrice, currency)}`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
