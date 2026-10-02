import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Plus, Trash2, Copy, Edit3, Check, X, Filter, 
  Flame, ExternalLink, Image, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw,
  ShieldCheck, Link2, CircleAlert
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { supabase } from '../lib/supabase';
import { fetchCatalogPage } from '../services/catalogApi';

export default function AdminProducts({ 
  products, 
  onSaveProducts, 
  onSaveProduct,
  onDeleteProduct,
  onToggleProductStatus,
  onVerifyProduct1688,
  currency = 'USD',
  onOpenPDP,
}) {
  const [query, setQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSourceStatus, setSelectedSourceStatus] = useState('ALL');
  const [editingProduct, setEditingProduct] = useState(null);
  const [verificationProduct, setVerificationProduct] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    status: 'MATCHED',
    url: '',
    title: '',
    score: '',
    imageUrl: '',
    note: '',
  });
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [remoteRows, setRemoteRows] = useState(null);
  const [remoteCount, setRemoteCount] = useState(products.length);
  const [remotePages, setRemotePages] = useState(1);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state for creating / editing product
  const [formState, setFormState] = useState({
    title: '',
    team: 'Boston Red Sox',
    league: 'MLB',
    silhouette: '59FIFTY Fitted',
    price: '$49.99',
    badge: 'HOT DROP',
    thumbnail: 'https://www.lidshd.com/cdn/shop/files/23235120_04.png?v=1790339447&width=2048',
    secondaryImage: 'https://www.lidshd.com/cdn/shop/files/23235120_03.png?v=1790339447&width=2048',
    category: 'hats',
    status: 'PUBLISHED'
  });

  const leagues = ['ALL', 'MLB', 'NBA', 'NFL', 'NHL', 'MiLB', 'PINS'];

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = !query.trim() || 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.team.toLowerCase().includes(query.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()));
      
      const matchLeague = selectedLeague === 'ALL' || p.league?.toUpperCase() === selectedLeague.toUpperCase();
      const matchStatus = selectedStatus === 'ALL' || (p.status || 'PUBLISHED') === selectedStatus;
      const matchSourceStatus = selectedSourceStatus === 'ALL'
        || (p.source1688Status || 'PENDING') === selectedSourceStatus;

      return matchQuery && matchLeague && matchStatus && matchSourceStatus;
    });
  }, [products, query, selectedLeague, selectedStatus, selectedSourceStatus]);

  useEffect(() => {
    if (!supabase) { setRemoteRows(null); return undefined; }
    let cancelled = false;
    setRemoteLoading(true);
    fetchCatalogPage({
      page: catalogPage,
      pageSize: 24,
      query,
      league: selectedLeague === 'ALL' ? '' : selectedLeague,
      category: 'hats',
      includeInactive: true,
      status: selectedStatus === 'ALL' ? '' : selectedStatus,
      sourceStatus: selectedSourceStatus === 'ALL' ? '' : selectedSourceStatus,
    }).then((result) => {
      if (cancelled) return;
      setRemoteRows(result.products);
      setRemoteCount(result.count);
      setRemotePages(result.totalPages);
    }).catch(() => {
      if (!cancelled) setRemoteRows(null);
    }).finally(() => {
      if (!cancelled) setRemoteLoading(false);
    });
    return () => { cancelled = true; };
  }, [catalogPage, query, selectedLeague, selectedStatus, selectedSourceStatus, refreshKey]);

  useEffect(() => { setCatalogPage(1); }, [query, selectedLeague, selectedStatus, selectedSourceStatus]);

  const displayedProducts = remoteRows ?? filteredProducts;
  const displayedCount = remoteRows ? remoteCount : filteredProducts.length;
  const displayedTotal = remoteRows ? remoteCount : products.length;

  // Actions
  const handleOpenAddModal = () => {
    setFormState({
      title: 'New Drop Cap New Era 59FIFTY',
      team: 'New York Yankees',
      league: 'MLB',
      silhouette: '59FIFTY Fitted',
      price: '$49.99',
      badge: 'HOT DROP',
      thumbnail: 'https://www.lidshd.com/cdn/shop/files/23235133_04.png?v=1790339447&width=2048',
      secondaryImage: 'https://www.lidshd.com/cdn/shop/files/23235133_03.png?v=1790339447&width=2048',
      category: 'hats',
      status: 'DRAFT'
    });
    setIsNewModalOpen(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now(),
      title: formState.title,
      team: formState.team,
      league: formState.league,
      silhouette: formState.silhouette,
      price: formState.price.startsWith('$') ? formState.price : `$${formState.price}`,
      badge: formState.badge,
      thumbnail: formState.thumbnail,
      secondaryImage: formState.secondaryImage,
      images: [formState.thumbnail, formState.secondaryImage],
      category: formState.category,
      status: formState.status,
      sizes: [
        { size: '7', inStock: true },
        { size: '7 1/8', inStock: true },
        { size: '7 1/4', inStock: true },
        { size: '7 3/8', inStock: true },
        { size: '7 1/2', inStock: true },
        { size: '7 5/8', inStock: false },
        { size: '7 3/4', inStock: true },
        { size: '8', inStock: true }
      ],
      tags: [formState.league, formState.team, formState.silhouette]
    };

    try {
      const saved = await onSaveProduct?.(newProduct) || newProduct;
      onSaveProducts?.([saved, ...products.filter((product) => product.id !== saved.id)]);
      setRemoteRows((rows) => rows ? [saved, ...rows.filter((product) => product.id !== saved.id)].slice(0, 24) : rows);
      setIsNewModalOpen(false);
      setNotice(`New drop "${saved.title}" đã lưu ở hàng chờ — cần xác minh 1688 trước khi bán.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Could not save product: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 3500);
  };

  const handleDuplicateProduct = async (prod) => {
    const clone = {
      ...prod,
      id: Date.now(),
      title: `${prod.title} (Draft Copy)`,
      status: 'DRAFT',
      source1688Status: 'PENDING',
      source1688Url: '',
      source1688Title: '',
      source1688Score: null,
      source1688ImageUrl: '',
      source1688Note: '',
      handle: undefined,
      sizes: (prod.sizes || []).map((variant) => ({ ...variant, id: undefined })),
    };
    try {
      const saved = await onSaveProduct?.(clone) || clone;
      onSaveProducts?.([saved, ...products.filter((product) => product.id !== saved.id)]);
      setRemoteRows((rows) => rows ? [saved, ...rows.filter((product) => product.id !== saved.id)].slice(0, 24) : rows);
      setNotice(`Duplicated "${prod.title}" as draft!`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Could not duplicate product: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      await onDeleteProduct?.(id);
      onSaveProducts?.(products.filter(p => p.id !== id));
      setRemoteRows((rows) => rows ? rows.filter((product) => product.id !== id) : rows);
      setNotice('Product removed from catalog.');
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Could not delete product: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggleStatus = async (prod) => {
    const nextStatus = prod.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    try {
      const saved = await onToggleProductStatus?.(prod, nextStatus) || { ...prod, status: nextStatus, is_active: nextStatus === 'PUBLISHED' };
      onSaveProducts?.(products.map(p => p.id === prod.id ? saved : p));
      setRemoteRows((rows) => rows ? rows.map((product) => product.id === prod.id ? saved : product) : rows);
      setNotice(`${saved.title || prod.title} is now ${nextStatus.toLowerCase()}.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Could not update status: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 3000);
  };

  const open1688Search = (product) => {
    // 1688's image-search upload is protected by its own login/CAPTCHA flow,
    // so the admin completes the upload in the opened tab and then records
    // the chosen result in the verification form below.
    if (product.thumbnail) window.open(product.thumbnail, '_blank', 'noopener,noreferrer');
    window.open('https://air.1688.com/kapp/1688-search/pc-image-search/?tab=imageSearch', '_blank', 'noopener,noreferrer');
    setNotice('Đã mở ảnh sản phẩm và Image Search 1688 ở tab mới. Chọn listing tương ứng rồi dán URL vào bước xác minh.');
    setTimeout(() => setNotice(''), 6000);
  };

  const openVerification = (product) => {
    setVerificationProduct(product);
    setVerificationForm({
      status: product.source1688Status || 'PENDING',
      url: product.source1688Url || '',
      title: product.source1688Title || '',
      score: product.source1688Score == null ? '' : String(product.source1688Score),
      imageUrl: product.source1688ImageUrl || '',
      note: product.source1688Note || '',
    });
  };

  const handleSaveVerification = async (event) => {
    event.preventDefault();
    if (!verificationProduct) return;
    if (verificationForm.status === 'MATCHED' && !verificationForm.url.trim()) {
      setNotice('Không thể MATCHED nếu chưa có URL listing 1688.');
      return;
    }
    try {
      const saved = await onVerifyProduct1688?.(verificationProduct, verificationForm)
        || {
          ...verificationProduct,
          source1688Status: verificationForm.status,
          source1688Url: verificationForm.url,
          source1688Title: verificationForm.title,
          source1688Score: verificationForm.score === '' ? null : Number(verificationForm.score),
          source1688ImageUrl: verificationForm.imageUrl,
          source1688Note: verificationForm.note,
          source1688CheckedAt: new Date().toISOString(),
          is_active: verificationForm.status === 'MATCHED',
          status: verificationForm.status === 'MATCHED' ? 'PUBLISHED' : 'DRAFT',
        };
      onSaveProducts?.(products.map((product) => product.id === saved.id ? saved : product));
      setRemoteRows((rows) => rows ? rows.map((product) => product.id === saved.id ? saved : product) : rows);
      setVerificationProduct(null);
      setNotice(`${saved.title || verificationProduct.title}: đã lưu trạng thái 1688 ${verificationForm.status}.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Không lưu được xác minh 1688: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 5000);
  };

  return (
    <div className="admin-content animate-fade-in space-y-6">
      
      {/* Intro Header */}
      <div className="admin-intro">
        <div>
          <div className="admin-intro-eyebrow">CATALOG / INVENTORY MANAGEMENT</div>
          <h1>PRODUCT LISTINGS</h1>
          <p className="admin-intro-desc">
            Quản lý catalog mũ, tồn kho và kiểm tra nguồn 1688. Listing chưa có mẫu đối chiếu sẽ luôn bị ẩn khỏi storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddModal}
            className="btn-flame text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/30"
          >
            <Plus size={15} />
            <span>+ ADD NEW DROP PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notice && (
        <div className="p-3.5 bg-[#1b2b1d] border border-[#2e5236] rounded-lg text-[#3ed660] text-xs font-bold flex items-center gap-2 animate-fade-in">
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Toolbar / Search & Filter Controls */}
      <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by title, team, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* League Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">League:</span>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              {leagues.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">1688:</span>
            <select
              value={selectedSourceStatus}
              onChange={(e) => setSelectedSourceStatus(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              <option value="ALL">All checks</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEW">Review</option>
              <option value="MATCHED">Matched / sellable</option>
              <option value="NOT_FOUND">Not found</option>
            </select>
          </div>

          <span className="text-xs text-gray-400 font-semibold ml-2">
            {remoteLoading ? 'Loading catalog…' : `Showing ${displayedCount.toLocaleString()} of ${displayedTotal.toLocaleString()}`}
          </span>
        </div>

      </div>

      {/* Product Table */}
      <div className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cap / Item</th>
                <th>Team & League</th>
                <th>Silhouette</th>
                <th>Price</th>
                <th>Sizes Available</th>
                <th>Publish / 1688</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => {
                const inStockSizesCount = p.sizes?.filter(s => s.inStock).length || 0;
                return (
                  <tr key={p.id}>
                    {/* Item Thumbnail & Title */}
                    <td>
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.thumbnail} 
                          alt={p.title} 
                          className="w-12 h-12 object-contain rounded bg-[#161616] p-1 border border-[#282828]" 
                        />
                        <div className="min-w-0 max-w-[280px]">
                          <div className="font-bold text-white text-xs truncate">
                            {p.title}
                          </div>
                          {p.badge && (
                            <span className="inline-block bg-[#e10600] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5">
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Team & League */}
                    <td>
                      <div className="font-bold text-white text-xs">{p.team}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{p.league}</div>
                    </td>

                    {/* Silhouette */}
                    <td className="text-xs text-gray-300">
                      {p.silhouette}
                    </td>

                    {/* Price */}
                    <td className="font-display font-bold text-sm text-white">
                      {formatPrice(p.price, currency)}
                    </td>

                    {/* Sizes Count */}
                    <td>
                      <span className="text-xs font-semibold text-gray-300">
                        {inStockSizesCount} / {p.sizes?.length || 8} sizes in stock
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            (p.status || 'PUBLISHED') === 'PUBLISHED'
                              ? 'bg-[#1b2b1d] text-[#3ed660] border border-[#2e5236]'
                              : 'bg-[#291717] text-[#ff3b30] border border-[#442222]'
                          }`}
                        >
                            {p.status || (p.is_active === false ? 'DRAFT' : 'PUBLISHED')}
                        </button>
                        <button
                          onClick={() => openVerification(p)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer transition-colors ${
                            (p.source1688Status || 'PENDING') === 'MATCHED'
                              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/70'
                              : (p.source1688Status || 'PENDING') === 'NOT_FOUND'
                                ? 'bg-red-950/50 text-red-300 border border-red-800/70'
                                : 'bg-amber-950/50 text-amber-300 border border-amber-800/70'
                          }`}
                        >
                          <ShieldCheck size={11} /> {p.source1688Status || 'PENDING'}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => open1688Search(p)}
                          className="p-1.5 text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 rounded transition-colors"
                          title="Tìm ảnh sản phẩm trên 1688"
                        >
                          <Image size={13} />
                        </button>
                        <button
                          onClick={() => openVerification(p)}
                          className="p-1.5 text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 rounded transition-colors"
                          title="Xác nhận kết quả 1688"
                        >
                          <ShieldCheck size={13} />
                        </button>
                        <button
                          onClick={() => onOpenPDP && onOpenPDP(p)}
                          className="p-1.5 text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-[#252525] rounded transition-colors"
                          title="View on Storefront"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-[#252525] rounded transition-colors"
                          title="Duplicate Listing"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-gray-400 hover:text-[#ff3b30] bg-[#1a1a1a] hover:bg-[#281818] rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {remoteRows && remotePages > 1 && (
        <div className="flex items-center justify-between border-t border-[#242424] pt-4">
          <span className="text-xs text-gray-500">Page {catalogPage} of {remotePages}</span>
          <div className="flex gap-2">
            <button disabled={catalogPage <= 1 || remoteLoading} onClick={() => setCatalogPage((current) => Math.max(1, current - 1))} className="flex items-center gap-1 rounded border border-[#333] px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
            <button disabled={catalogPage >= remotePages || remoteLoading} onClick={() => setCatalogPage((current) => Math.min(remotePages, current + 1))} className="flex items-center gap-1 rounded border border-[#333] px-3 py-2 text-xs font-bold text-gray-300 disabled:opacity-40">Next <ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {verificationProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl max-w-[680px] w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#252525]">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">SOURCE CHECK / 1688 IMAGE SEARCH</div>
                <h3 className="mt-1 font-display text-xl font-black text-white uppercase tracking-tight">VERIFY BEFORE SELLING</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">Chỉ trạng thái MATCHED mới được phép bật Published và xuất hiện ở storefront.</p>
              </div>
              <button onClick={() => setVerificationProduct(null)} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-4 rounded-lg border border-[#292929] bg-[#101010] p-3">
              <img src={verificationProduct.thumbnail} alt={verificationProduct.title} className="h-20 w-20 rounded border border-[#333] bg-[#181818] object-contain p-1" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">{verificationProduct.title}</div>
                <div className="mt-1 text-[11px] text-zinc-500">Product ID: {verificationProduct.id}</div>
                <button type="button" onClick={() => open1688Search(verificationProduct)} className="mt-3 inline-flex items-center gap-1.5 rounded border border-amber-800/60 bg-amber-950/40 px-3 py-1.5 text-[11px] font-black uppercase text-amber-200 hover:bg-amber-900/60">
                  <Image size={13} /> Mở Image Search 1688
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveVerification} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-zinc-400">Trạng thái xác minh
                  <select value={verificationForm.status} onChange={(e) => setVerificationForm({ ...verificationForm, status: e.target.value })} className="mt-1 w-full rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:outline-none">
                    <option value="PENDING">PENDING — chưa kiểm tra</option>
                    <option value="REVIEW">REVIEW — cần đối chiếu</option>
                    <option value="MATCHED">MATCHED — có mẫu tương ứng</option>
                    <option value="NOT_FOUND">NOT_FOUND — không có mẫu</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-zinc-400">Độ tương đồng (0–100)
                  <input type="number" min="0" max="100" step="0.01" value={verificationForm.score} onChange={(e) => setVerificationForm({ ...verificationForm, score: e.target.value })} className="mt-1 w-full rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:outline-none" placeholder="Ví dụ: 88" />
                </label>
              </div>

              <label className="block text-xs font-bold text-zinc-400">URL listing tương ứng trên 1688 {verificationForm.status === 'MATCHED' && <span className="text-red-300">*</span>}
                <input type="url" required={verificationForm.status === 'MATCHED'} value={verificationForm.url} onChange={(e) => setVerificationForm({ ...verificationForm, url: e.target.value })} className="mt-1 w-full rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none" placeholder="https://detail.1688.com/offer/..." />
              </label>

              <label className="block text-xs font-bold text-zinc-400">Tên listing trên 1688
                <input type="text" value={verificationForm.title} onChange={(e) => setVerificationForm({ ...verificationForm, title: e.target.value })} className="mt-1 w-full rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:outline-none" placeholder="Tên sản phẩm hiển thị trên kết quả tìm kiếm" />
              </label>

              <label className="block text-xs font-bold text-zinc-400">URL ảnh listing (tuỳ chọn)
                <input type="url" value={verificationForm.imageUrl} onChange={(e) => setVerificationForm({ ...verificationForm, imageUrl: e.target.value })} className="mt-1 w-full rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:outline-none" placeholder="https://..." />
              </label>

              <label className="block text-xs font-bold text-zinc-400">Ghi chú đối chiếu
                <textarea value={verificationForm.note} onChange={(e) => setVerificationForm({ ...verificationForm, note: e.target.value })} rows={2} className="mt-1 w-full resize-none rounded border border-[#333] bg-[#1c1c1c] px-3 py-2 text-xs text-white focus:outline-none" placeholder="Màu, logo, form mũ, nhà cung cấp..." />
              </label>

              <div className="flex items-center justify-between gap-3 border-t border-[#252525] pt-4">
                <div className="flex items-center gap-2 text-[11px] text-amber-200"><CircleAlert size={14} /> Không có URL 1688 thì không thể bán.</div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setVerificationProduct(null)} className="btn-secondary text-xs px-4 py-2">Huỷ</button>
                  <button type="submit" className="btn-flame text-xs px-5 py-2 font-bold"><ShieldCheck size={14} className="mr-1 inline" /> Lưu xác minh</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Product Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl max-w-[560px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#252525]">
              <h3 className="font-display text-xl font-black text-white uppercase tracking-tight">
                CREATE NEW DROP LISTING
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Product Title</label>
                <input 
                  type="text" 
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white font-bold focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Team Name</label>
                  <input 
                    type="text" 
                    required
                    value={formState.team}
                    onChange={(e) => setFormState({ ...formState, team: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">League</label>
                  <select 
                    value={formState.league}
                    onChange={(e) => setFormState({ ...formState, league: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="MLB">MLB</option>
                    <option value="NBA">NBA</option>
                    <option value="NFL">NFL</option>
                    <option value="NHL">NHL</option>
                    <option value="MiLB">MiLB</option>
                    <option value="PINS">PINS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Price (e.g. $49.99)</label>
                  <input 
                    type="text" 
                    required
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Badge</label>
                  <input 
                    type="text" 
                    value={formState.badge}
                    onChange={(e) => setFormState({ ...formState, badge: e.target.value })}
                    placeholder="HOT DROP, EXCLUSIVE"
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Thumbnail Image URL</label>
                <input 
                  type="text" 
                  required
                  value={formState.thumbnail}
                  onChange={(e) => setFormState({ ...formState, thumbnail: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#252525]">
                <button 
                  type="button" 
                  onClick={() => setIsNewModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-flame text-xs px-5 py-2 font-bold"
                >
                  Publish Drop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
