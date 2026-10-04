import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, Plus, Trash2, Copy, Edit3, Check, X, Filter, 
  Flame, ExternalLink, Image, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw,
  ShieldCheck, Link2, CircleAlert, Boxes, CircleDollarSign, Warehouse, Save, RotateCcw
} from 'lucide-react';
import { formatPrice } from '../utils/currency';
import { supabase } from '../lib/supabase';
import { fetchCatalogFacets, fetchCatalogPage } from '../services/catalogApi';
import { validateProduct } from '../lib/adminOperations';

const DEFAULT_HAT_SIZES = ['7', '7 1/8', '7 1/4', '7 3/8', '7 1/2', '7 5/8', '7 3/4', '8'];

function slugifyClient(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function variantPrice(value, fallback = '') {
  const parsed = String(value ?? fallback).replace(/[^0-9.]/g, '');
  return parsed;
}

function createVariant(size = '', price = '', inventoryCount = 0) {
  return { id: undefined, size, price: variantPrice(price), inventoryCount: Math.max(0, Number(inventoryCount) || 0) };
}

export default function AdminProducts({ 
  products, 
  onSaveProducts, 
  onSaveProduct,
  onDeleteProduct,
  onToggleProductStatus,
  onVerifyProduct1688,
  currency = 'USD',
  onOpenPDP,
  catalogStats = null,
}) {
  const [query, setQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSilhouette, setSelectedSilhouette] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSourceStatus, setSelectedSourceStatus] = useState('ALL');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [facets, setFacets] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editorForm, setEditorForm] = useState(null);
  const [editorSaving, setEditorSaving] = useState(false);
  const [bulkVariantPrice, setBulkVariantPrice] = useState('');
  const [bulkVariantInventory, setBulkVariantInventory] = useState('');
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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(() => new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  // Form state for creating / editing product
  const [formState, setFormState] = useState({
    title: '',
    handle: '',
    team: 'Boston Red Sox',
    league: 'MLB',
    silhouette: '59FIFTY Fitted',
    productGroup: 'Caps',
    sourceSku: '',
    brand: 'New Era',
    tags: 'new-era, mlb, fitted',
    price: '$49.99',
    compareAtPrice: '',
    badge: 'HOT DROP',
    images: [
      'https://www.lidshd.com/cdn/shop/files/23235120_04.png?v=1790339447&width=2048',
      'https://www.lidshd.com/cdn/shop/files/23235120_03.png?v=1790339447&width=2048',
    ],
    imageInput: '',
    imageAlt: '',
    description: '',
    material: '',
    fitNote: '',
    care: '',
    seoTitle: '',
    seoDescription: '',
    noindex: false,
    variants: DEFAULT_HAT_SIZES.map((size) => createVariant(size, '$49.99', size === '7 5/8' ? 0 : 1)),
    category: 'hats',
    status: 'PUBLISHED'
  });
  const [newBulkVariantPrice, setNewBulkVariantPrice] = useState('');
  const [newBulkVariantInventory, setNewBulkVariantInventory] = useState('');

  const facetValues = (key) => (Array.isArray(facets?.[key]) ? facets[key] : [])
    .map((item) => typeof item === 'string' ? item : item?.value)
    .filter(Boolean);
  const loadedRows = [...(Array.isArray(products) ? products : []), ...(Array.isArray(remoteRows) ? remoteRows : [])];
  const loadedFacetValues = (key) => loadedRows
    .map((product) => key === 'groups' ? (product.productGroup || product.product_group) : product[key === 'silhouettes' ? 'silhouette' : 'league'])
    .filter(Boolean);
  const leagues = useMemo(() => [
    'ALL',
    ...new Set(['MLB', 'NBA', 'NFL', 'NHL', 'MiLB', 'NCAA', 'OTHER', 'PINS', ...facetValues('leagues'), ...loadedFacetValues('leagues')]),
  ], [facets, products, remoteRows]);
  const groupOptions = useMemo(() => [...new Set([...facetValues('groups'), ...loadedFacetValues('groups')])].sort((a, b) => a.localeCompare(b)), [facets, products, remoteRows]);
  const silhouetteOptions = useMemo(() => [...new Set([...facetValues('silhouettes'), ...loadedFacetValues('silhouettes')])].sort((a, b) => a.localeCompare(b)), [facets, products, remoteRows]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!supabase) {
      setFacets(null);
      return undefined;
    }
    let cancelled = false;
    fetchCatalogFacets({ category: 'hats' })
      .then((result) => {
        if (!cancelled) setFacets(result || null);
      })
      .catch(() => {
        if (!cancelled) setFacets(null);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const productMetrics = useMemo(() => {
    const rows = Array.isArray(remoteRows) ? remoteRows : (Array.isArray(products) ? products : []);
    const lowStock = rows.filter((product) => (product.sizes || []).some((variant) => {
      const count = Number(variant.inventoryCount ?? variant.inventory_count);
      return Number.isFinite(count) && count > 0 && count <= 2;
    })).length;
    const sourceQueue = rows.filter((product) => (product.source1688Status || 'PENDING') !== 'MATCHED').length;
    return {
      total: catalogStats?.total != null ? Number(catalogStats.total) : rows.length,
      sellable: catalogStats?.matchedActive != null ? Number(catalogStats.matchedActive) : rows.filter((product) => product.source1688Status === 'MATCHED' && product.status !== 'DRAFT').length,
      sourceQueue: catalogStats?.queue != null ? Number(catalogStats.queue) : sourceQueue,
      lowStock,
    };
  }, [catalogStats, products, remoteRows]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = !query.trim() || 
        String(p.title || '').toLowerCase().includes(query.toLowerCase()) ||
        String(p.team || '').toLowerCase().includes(query.toLowerCase()) ||
        String(p.sku || p.sourceSku || '').toLowerCase().includes(query.toLowerCase()) ||
        String(p.badge || '').toLowerCase().includes(query.toLowerCase()) ||
        String(p.productGroup || p.product_group || '').toLowerCase().includes(query.toLowerCase());
      
      const matchLeague = selectedLeague === 'ALL' || p.league?.toUpperCase() === selectedLeague.toUpperCase();
      const matchGroup = !selectedGroup || (p.productGroup || p.product_group || '') === selectedGroup;
      const matchSilhouette = !selectedSilhouette || String(p.silhouette || '').toLowerCase().includes(selectedSilhouette.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || (p.status || 'PUBLISHED') === selectedStatus;
      const matchSourceStatus = selectedSourceStatus === 'ALL'
        || (selectedSourceStatus === 'QUEUE' ? (p.source1688Status || 'PENDING') !== 'MATCHED' : (p.source1688Status || 'PENDING') === selectedSourceStatus);
      const matchStock = !inStockOnly || (p.sizes || []).some((variant) => Number(variant.inventoryCount ?? variant.inventory_count) > 0 || variant.inStock);

      return matchQuery && matchLeague && matchGroup && matchSilhouette && matchStatus && matchSourceStatus && matchStock;
    });
  }, [products, query, selectedLeague, selectedGroup, selectedSilhouette, selectedStatus, selectedSourceStatus, inStockOnly]);

  useEffect(() => {
    if (!supabase) { setRemoteRows(null); return undefined; }
    let cancelled = false;
    setRemoteLoading(true);
    fetchCatalogPage({
      page: catalogPage,
      pageSize: 24,
      query: debouncedQuery,
      league: selectedLeague === 'ALL' ? '' : selectedLeague,
      group: selectedGroup,
      silhouette: selectedSilhouette,
      inStockOnly,
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
  }, [catalogPage, debouncedQuery, selectedLeague, selectedGroup, selectedSilhouette, selectedStatus, selectedSourceStatus, inStockOnly, refreshKey]);

  useEffect(() => { setCatalogPage(1); }, [query, selectedLeague, selectedGroup, selectedSilhouette, selectedStatus, selectedSourceStatus, inStockOnly]);

  useEffect(() => {
    setSelectedProductIds(new Set());
  }, [query, selectedLeague, selectedGroup, selectedSilhouette, selectedStatus, selectedSourceStatus, inStockOnly, catalogPage]);

  const displayedProducts = remoteRows ?? filteredProducts;
  const displayedCount = remoteRows ? remoteCount : filteredProducts.length;
  const displayedTotal = remoteRows ? remoteCount : products.length;
  const displayedProductIds = displayedProducts.map((product) => String(product.id));
  const allDisplayedSelected = displayedProductIds.length > 0 && displayedProductIds.every((id) => selectedProductIds.has(id));

  const toggleProductSelection = (productId, checked) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (checked) next.add(String(productId));
      else next.delete(String(productId));
      return next;
    });
  };

  const toggleAllDisplayed = (checked) => {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      displayedProductIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const handleBulkStatus = async (status) => {
    const targets = displayedProducts.filter((product) => selectedProductIds.has(String(product.id)));
    if (!targets.length || bulkSaving) return;
    setBulkSaving(true);
    const savedById = new Map();
    let successCount = 0;
    let failedCount = 0;
    for (const product of targets) {
      try {
        const saved = await onToggleProductStatus?.(product, status);
        if (saved) savedById.set(String(saved.id), saved);
        successCount += 1;
      } catch (error) {
        failedCount += 1;
      }
    }
    if (savedById.size) {
      setRemoteRows((rows) => rows ? rows.map((row) => savedById.get(String(row.id)) || row) : rows);
      setRefreshKey((value) => value + 1);
    }
    setSelectedProductIds(new Set());
    setBulkSaving(false);
    setNotice(`${successCount} listing${successCount === 1 ? '' : 's'} updated${failedCount ? `, ${failedCount} skipped by source gate` : ''}.`);
    setTimeout(() => setNotice(''), 4500);
  };

  // Actions
  const handleOpenAddModal = () => {
    setFormState({
      title: '',
      handle: '',
      team: 'New York Yankees',
      league: 'MLB',
      silhouette: '59FIFTY Fitted',
      productGroup: 'Caps',
      sourceSku: '',
      brand: 'New Era',
      tags: 'new-era, mlb, fitted',
      price: '$49.99',
      compareAtPrice: '',
      badge: 'HOT DROP',
      images: [
        'https://www.lidshd.com/cdn/shop/files/23235133_04.png?v=1790339447&width=2048',
        'https://www.lidshd.com/cdn/shop/files/23235133_03.png?v=1790339447&width=2048',
      ],
      imageInput: '',
      imageAlt: '',
      description: '',
      material: '',
      fitNote: '',
      care: '',
      seoTitle: '',
      seoDescription: '',
      noindex: false,
      variants: DEFAULT_HAT_SIZES.map((size) => createVariant(size, '$49.99', size === '7 5/8' ? 0 : 1)),
      category: 'hats',
      status: 'DRAFT'
    });
    setNewBulkVariantPrice('');
    setNewBulkVariantInventory('');
    setIsNewModalOpen(true);
  };

  const updateCreateField = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const updateCreateVariant = (index, key, value) => {
    setFormState((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => variantIndex === index
        ? { ...variant, [key]: key === 'inventoryCount' ? Math.max(0, Number(value) || 0) : key === 'price' ? variantPrice(value) : value }
        : variant),
    }));
  };

  const addCreateVariant = (size = '', price = formState.price, inventoryCount = 0) => {
    setFormState((current) => ({
      ...current,
      variants: [...current.variants, createVariant(size, price, inventoryCount)],
    }));
  };

  const removeCreateVariant = (index) => {
    setFormState((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }));
  };

  const generateCreateSizes = () => {
    setFormState((current) => ({
      ...current,
      variants: DEFAULT_HAT_SIZES.map((size) => {
        const existing = current.variants.find((variant) => variant.size === size);
        return existing || createVariant(size, current.price, 0);
      }),
    }));
  };

  const applyCreateBulkVariantPrice = () => {
    if (newBulkVariantPrice === '') return;
    setFormState((current) => ({
      ...current,
      variants: current.variants.map((variant) => ({ ...variant, price: variantPrice(newBulkVariantPrice) })),
    }));
  };

  const applyCreateBulkVariantInventory = () => {
    if (newBulkVariantInventory === '') return;
    setFormState((current) => ({
      ...current,
      variants: current.variants.map((variant) => ({ ...variant, inventoryCount: Math.max(0, Number(newBulkVariantInventory) || 0) })),
    }));
  };

  const addCreateImage = () => {
    const imageUrl = String(formState.imageInput || '').trim();
    if (!imageUrl) return;
    setFormState((current) => ({ ...current, images: [...current.images, imageUrl], imageInput: '' }));
  };

  const removeCreateImage = (index) => {
    setFormState((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }));
  };

  const moveCreateImageToCover = (index) => {
    setFormState((current) => {
      const next = [...current.images];
      const [cover] = next.splice(index, 1);
      return { ...current, images: [cover, ...next] };
    });
  };

  const suggestCreateTitle = () => {
    const title = [formState.brand || 'New Era', formState.team, formState.silhouette, formState.league]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(' ');
    setFormState((current) => ({ ...current, title, handle: slugifyClient(title) }));
  };

  const suggestCreateDescription = () => {
    const title = formState.title || `${formState.team} ${formState.silhouette}`.trim();
    const description = `${title} made for collectors who want an authentic fit and a clean team finish. `
      + `Built in ${formState.silhouette || 'a structured cap'} with a comfortable everyday profile.`;
    setFormState((current) => ({ ...current, description }));
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const images = (formState.images || []).map((image) => String(image || '').trim()).filter(Boolean);
    const variants = (formState.variants || [])
      .map((variant) => ({
        ...variant,
        size: String(variant.size || '').trim(),
        price: variantPrice(variant.price, formState.price),
        inventoryCount: Math.max(0, Number(variant.inventoryCount) || 0),
        inStock: Number(variant.inventoryCount) > 0,
      }))
      .filter((variant) => variant.size);
    if (!formState.title.trim()) {
      setNotice('Product title is required.');
      return;
    }
    if (!images.length) {
      setNotice('Add at least one product image.');
      return;
    }
    const newProduct = {
      id: Date.now(),
      title: formState.title,
      handle: formState.handle || slugifyClient(formState.title),
      team: formState.team,
      league: formState.league,
      silhouette: formState.silhouette,
      price: formState.price.startsWith('$') ? formState.price : `$${formState.price}`,
      badge: formState.badge,
      thumbnail: images[0],
      secondaryImage: images[1] || '',
      images,
      category: formState.category,
      status: formState.status,
      sizes: variants,
      tags: formState.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      productGroup: formState.productGroup,
      sourceSku: formState.sourceSku,
      brand: formState.brand,
      description: formState.description,
      source1688Status: 'PENDING',
      metadata: {
        brand: formState.brand,
        source_product_group: formState.productGroup,
        source_sku: formState.sourceSku,
        image_alt: formState.imageAlt || formState.title,
        compare_at_price: variantPrice(formState.compareAtPrice),
        content: {
          material: formState.material,
          fit: formState.fitNote,
          care: formState.care,
        },
        seo_title: formState.seoTitle || formState.title,
        seo_description: formState.seoDescription || formState.description,
        seo_noindex: Boolean(formState.noindex),
      },
    };

    try {
      validateProduct(newProduct);
    } catch (error) {
      setNotice(error.message);
      return;
    }

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
      onSaveProducts?.([saved, ...products.filter((product) => product.id !== saved.id)]);
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
      onSaveProducts?.([saved, ...products.filter((product) => product.id !== saved.id)]);
      setRemoteRows((rows) => rows ? rows.map((product) => product.id === saved.id ? saved : product) : rows);
      setVerificationProduct(null);
      setNotice(`${saved.title || verificationProduct.title}: đã lưu trạng thái 1688 ${verificationForm.status}.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Không lưu được xác minh 1688: ${error.message}`);
    }
    setTimeout(() => setNotice(''), 5000);
  };

  const openEditor = (product) => {
    setEditingProduct(product);
    setBulkVariantPrice('');
    setBulkVariantInventory('');
    const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
    const seo = metadata.seo && typeof metadata.seo === 'object' ? metadata.seo : {};
    const content = metadata.content && typeof metadata.content === 'object' ? metadata.content : {};
    const imageList = (Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.thumbnail, product.secondaryImage || product.secondary_image]
    ).filter(Boolean);
    setEditorForm({
      title: product.title || '',
      handle: product.handle || '',
      team: product.team || '',
      league: product.league || 'MLB',
      silhouette: product.silhouette || '59FIFTY Fitted',
      productGroup: product.productGroup || metadata.source_product_group || '',
      sourceSku: product.sourceSku || metadata.source_sku || product.sku || '',
      brand: metadata.brand || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      price: String(product.price || '').replace('$', ''),
      compareAtPrice: metadata.compare_at_price || '',
      badge: product.badge || '',
      images: imageList,
      imageInput: '',
      imageAlt: metadata.image_alt || product.title || '',
      source1688ImageUrl: product.source1688ImageUrl || '',
      source1688Score: product.source1688Score == null ? '' : String(product.source1688Score),
      description: product.description || '',
      material: content.material || '',
      fitNote: content.fit || '',
      care: content.care || '',
      seoTitle: metadata.seo_title || seo.title || '',
      seoDescription: metadata.seo_description || seo.description || '',
      noindex: Boolean(metadata.seo_noindex ?? seo.noindex),
      status: product.status || (product.is_active === false ? 'DRAFT' : 'PUBLISHED'),
      source1688Status: product.source1688Status || 'PENDING',
      source1688Url: product.source1688Url || '',
      source1688Title: product.source1688Title || '',
      source1688Note: product.source1688Note || '',
      sizes: (product.sizes || []).map((variant) => ({
        id: variant.id,
        size: variant.size || '',
        price: String(variant.price || product.price || '').replace('$', ''),
        inventoryCount: Number(variant.inventoryCount ?? variant.inventory_count ?? (variant.inStock ? 1 : 0)),
      })),
    });
  };

  const closeEditor = () => {
    if (!editorSaving) {
      setEditingProduct(null);
      setEditorForm(null);
    }
  };

  const updateEditorSize = (index, key, value) => {
    setEditorForm((current) => ({
      ...current,
      sizes: current.sizes.map((variant, variantIndex) => variantIndex === index
        ? { ...variant, [key]: key === 'inventoryCount' ? Math.max(0, Number(value) || 0) : key === 'price' ? variantPrice(value) : value }
        : variant),
    }));
  };

  const addEditorSize = () => {
    setEditorForm((current) => ({ ...current, sizes: [...current.sizes, { id: undefined, size: '', price: current.price, inventoryCount: 0 }] }));
  };

  const removeEditorSize = (index) => {
    setEditorForm((current) => ({ ...current, sizes: current.sizes.filter((_, variantIndex) => variantIndex !== index) }));
  };

  const applyEditorBulkVariantPrice = () => {
    if (!editorForm || bulkVariantPrice === '') return;
    setEditorForm((current) => ({
      ...current,
      sizes: current.sizes.map((variant) => ({ ...variant, price: variantPrice(bulkVariantPrice) })),
    }));
  };

  const applyEditorBulkVariantInventory = () => {
    if (!editorForm || bulkVariantInventory === '') return;
    setEditorForm((current) => ({
      ...current,
      sizes: current.sizes.map((variant) => ({ ...variant, inventoryCount: Math.max(0, Number(bulkVariantInventory) || 0) })),
    }));
  };

  const updateEditorImage = (index, value) => {
    setEditorForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => imageIndex === index ? value : image),
    }));
  };

  const addEditorImage = () => {
    if (!editorForm?.imageInput?.trim()) return;
    setEditorForm((current) => ({ ...current, images: [...current.images, current.imageInput.trim()], imageInput: '' }));
  };

  const removeEditorImage = (index) => {
    setEditorForm((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }));
  };

  const moveEditorImageToCover = (index) => {
    setEditorForm((current) => {
      const next = [...current.images];
      const [cover] = next.splice(index, 1);
      return { ...current, images: [cover, ...next] };
    });
  };

  const handleSaveEditor = async (event) => {
    event.preventDefault();
    if (!editingProduct || !editorForm || editorSaving) return;
    if (!editorForm.title.trim()) {
      setNotice('Product title is required.');
      return;
    }
    if (editorForm.status === 'PUBLISHED' && editorForm.source1688Status !== 'MATCHED') {
      setNotice('Chỉ listing MATCHED trên 1688 mới được publish.');
      return;
    }
    const nextProduct = {
      ...editingProduct,
      ...editorForm,
      handle: editorForm.handle.trim(),
      tags: editorForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      metadata: {
        ...(editingProduct.metadata || {}),
        brand: editorForm.brand.trim(),
        image_alt: editorForm.imageAlt.trim(),
        compare_at_price: variantPrice(editorForm.compareAtPrice),
        content: {
          material: editorForm.material.trim(),
          fit: editorForm.fitNote.trim(),
          care: editorForm.care.trim(),
        },
        seo_title: editorForm.seoTitle.trim(),
        seo_description: editorForm.seoDescription.trim(),
        seo_noindex: Boolean(editorForm.noindex),
      },
      price: editorForm.price.startsWith('$') ? editorForm.price : `$${editorForm.price}`,
      sizes: editorForm.sizes.filter((variant) => variant.size.trim()).map((variant) => ({
        ...variant,
        price: variantPrice(variant.price, editorForm.price),
        inStock: Number(variant.inventoryCount) > 0,
      })),
      source1688Status: editorForm.source1688Status,
      source1688Url: editorForm.source1688Url,
      source1688Title: editorForm.source1688Title,
      source1688ImageUrl: editorForm.source1688ImageUrl,
      source1688Score: editorForm.source1688Score,
      source1688Note: editorForm.source1688Note,
      images: editorForm.images.filter(Boolean),
      thumbnail: editorForm.images.filter(Boolean)[0] || '',
      secondaryImage: editorForm.images.filter(Boolean)[1] || '',
      is_active: editorForm.status === 'PUBLISHED' && editorForm.source1688Status === 'MATCHED',
    };
    try {
      validateProduct(nextProduct);
    } catch (error) {
      setNotice(error.message);
      return;
    }
    setEditorSaving(true);
    try {
      const saved = await onSaveProduct?.(nextProduct) || nextProduct;
      onSaveProducts?.([saved, ...products.filter((product) => product.id !== saved.id)]);
      setRemoteRows((rows) => rows ? rows.map((product) => product.id === saved.id ? saved : product) : rows);
      setEditingProduct(null);
      setEditorForm(null);
      setNotice(`Đã lưu ${saved.title}.`);
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setNotice(`Không lưu được sản phẩm: ${error.message}`);
    } finally {
      setEditorSaving(false);
    }
    setTimeout(() => setNotice(''), 4500);
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

      {/* The catalog is a source-verification queue first, and a product list second. */}
      <section className="admin-kpi-grid admin-product-kpis" aria-label="Catalog summary">
        <button type="button" className="admin-kpi-card admin-kpi-button is-neutral" onClick={() => { setSelectedSourceStatus('ALL'); setSelectedStatus('ALL'); setSelectedLeague('ALL'); setSelectedGroup(''); setSelectedSilhouette(''); setInStockOnly(false); }}>
          <span className="admin-kpi-label"><Boxes size={13} /> Catalog rows</span>
          <strong className="admin-kpi-value">{productMetrics.total.toLocaleString()}</strong>
          <span className="admin-kpi-note">All hat records in Supabase</span>
        </button>
        <button type="button" className="admin-kpi-card admin-kpi-button is-success" onClick={() => { setSelectedSourceStatus('MATCHED'); setSelectedStatus('PUBLISHED'); }}>
          <span className="admin-kpi-label"><ShieldCheck size={13} /> Sellable now</span>
          <strong className="admin-kpi-value">{productMetrics.sellable.toLocaleString()}</strong>
          <span className="admin-kpi-note">MATCHED + published</span>
        </button>
        <button type="button" className="admin-kpi-card admin-kpi-button is-warning" onClick={() => { setSelectedSourceStatus('QUEUE'); setSelectedStatus('ALL'); }}>
          <span className="admin-kpi-label"><CircleAlert size={13} /> Source queue</span>
          <strong className="admin-kpi-value">{productMetrics.sourceQueue.toLocaleString()}</strong>
          <span className="admin-kpi-note">All records not yet MATCHED</span>
        </button>
        <button type="button" className="admin-kpi-card admin-kpi-button is-danger" onClick={() => { setSelectedStatus('ALL'); setSelectedSourceStatus('ALL'); }}>
          <span className="admin-kpi-label"><Warehouse size={13} /> Low stock</span>
          <strong className="admin-kpi-value">{productMetrics.lowStock.toLocaleString()}</strong>
          <span className="admin-kpi-note">Detected in the loaded result set</span>
        </button>
      </section>

      {/* Toolbar / Search & Filter Controls */}
      <div className="bg-[#121212] border border-[#242424] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search title, team, SKU, badge..."
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

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="max-w-[150px] bg-[#1a1a1a] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              <option value="">All groups</option>
              {groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Silhouette:</span>
            <select
              value={selectedSilhouette}
              onChange={(e) => setSelectedSilhouette(e.target.value)}
              className="max-w-[150px] bg-[#1a1a1a] border border-[#333333] rounded px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none"
            >
              <option value="">All silhouettes</option>
              {silhouetteOptions.map((silhouette) => <option key={silhouette} value={silhouette}>{silhouette}</option>)}
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
              <option value="QUEUE">Source queue (not matched)</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEW">Review</option>
              <option value="MATCHED">Matched / sellable</option>
              <option value="NOT_FOUND">Not found</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400">
            <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-3.5 w-3.5 accent-[#3ed660]" />
            In stock
          </label>

          {(query || selectedLeague !== 'ALL' || selectedGroup || selectedSilhouette || selectedStatus !== 'ALL' || selectedSourceStatus !== 'ALL' || inStockOnly) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedLeague('ALL');
                setSelectedGroup('');
                setSelectedSilhouette('');
                setSelectedStatus('ALL');
                setSelectedSourceStatus('ALL');
                setInStockOnly(false);
              }}
              className="text-[10px] font-black uppercase tracking-wider text-[#ff3b30] hover:underline"
            >
              Clear filters
            </button>
          )}

          <span className="text-xs text-gray-400 font-semibold ml-2">
            {remoteLoading ? 'Loading catalog…' : `Showing ${displayedCount.toLocaleString()} of ${displayedTotal.toLocaleString()}`}
          </span>
        </div>

      </div>

      {/* Product Table */}
      <div className="bg-[#121212] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
        {selectedProductIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#293629] bg-[#142016] px-4 py-2.5 text-xs text-[#b7d9bd]">
            <strong>{selectedProductIds.size} selected</strong>
            <span className="text-[#6f9276]">Bulk actions</span>
            <button type="button" onClick={() => handleBulkStatus('PUBLISHED')} disabled={bulkSaving} className="rounded border border-[#3c6a45] px-2.5 py-1 font-bold text-[#9be5a5] hover:bg-[#1d3822] disabled:opacity-50">{bulkSaving ? 'Saving…' : 'Publish matched'}</button>
            <button type="button" onClick={() => handleBulkStatus('DRAFT')} disabled={bulkSaving} className="rounded border border-[#444] px-2.5 py-1 font-bold text-zinc-300 hover:bg-[#252525] disabled:opacity-50">Set draft</button>
            <button type="button" onClick={() => setSelectedProductIds(new Set())} className="ml-auto text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white">Clear selection</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="w-10"><input type="checkbox" checked={allDisplayedSelected} onChange={(event) => toggleAllDisplayed(event.target.checked)} aria-label="Select visible products" /></th>
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
              {displayedProducts.length === 0 && !remoteLoading && (
                <tr><td colSpan="8" className="py-12 text-center text-sm text-gray-500">No catalog rows match these filters.</td></tr>
              )}
              {displayedProducts.map((p) => {
                const inStockSizesCount = p.sizes?.filter((s) => s.inStock || Number(s.inventoryCount ?? s.inventory_count) > 0).length || 0;
                return (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selectedProductIds.has(String(p.id))} onChange={(event) => toggleProductSelection(p.id, event.target.checked)} aria-label={`Select ${p.title}`} /></td>
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
                          {(p.sourceSku || p.sku) && (
                            <div className="mt-1 text-[10px] font-mono text-gray-500 truncate">SKU {p.sourceSku || p.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Team & League */}
                    <td>
                      <div className="font-bold text-white text-xs">{p.team}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{p.league}</div>
                      {p.productGroup && <div className="max-w-[150px] truncate text-[10px] text-zinc-500">{p.productGroup}</div>}
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
                      {p.sizes?.length ? (
                        <span className="text-xs font-semibold text-gray-300">
                          {inStockSizesCount} / {p.sizes.length} sizes in stock
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-300">No variants</span>
                      )}
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
                          onClick={() => openEditor(p)}
                          className="p-1.5 text-white bg-[#2a2116] hover:bg-[#ff3b30] rounded transition-colors"
                          title="Edit product and inventory"
                        >
                          <Edit3 size={13} />
                        </button>
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

      {editingProduct && editorForm && (
        <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
          <aside className="admin-drawer admin-product-drawer" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
            <header className="admin-drawer-header">
              <div>
                <span className="admin-intro-eyebrow">CATALOG RECORD / {editingProduct.id}</span>
                <h2 id="product-editor-title">Edit drop listing</h2>
                <p>Giữ source gate của 1688 và tồn kho theo từng size.</p>
              </div>
              <button type="button" className="admin-icon-button" onClick={closeEditor} aria-label="Close editor"><X size={18} /></button>
            </header>
            <form className="admin-drawer-body admin-product-editor" onSubmit={handleSaveEditor}>
              <div className="admin-editor-hero">
                <img src={editorForm.images?.[0] || undefined} alt={editorForm.imageAlt || editorForm.title} />
                <div><strong>{editorForm.title || 'Untitled listing'}</strong><span>{editorForm.handle || `product-${editingProduct.id}`}</span><button type="button" className="admin-text-action" onClick={() => setEditorForm({ ...editorForm, images: editorForm.images })}><RotateCcw size={13} /> Keep current media</button></div>
              </div>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Merchandising details</h3><span className="admin-section-count">Customer-facing</span></div><label className="admin-form-label">Product title<input required value={editorForm.title} onChange={(event) => setEditorForm({ ...editorForm, title: event.target.value })} className="admin-form-input" /></label><div className="admin-form-grid"><label className="admin-form-label">Team<input value={editorForm.team} onChange={(event) => setEditorForm({ ...editorForm, team: event.target.value })} className="admin-form-input" /></label><label className="admin-form-label">League<select value={editorForm.league} onChange={(event) => setEditorForm({ ...editorForm, league: event.target.value })} className="admin-form-select">{leagues.filter((league) => league !== 'ALL').map((league) => <option value={league} key={league}>{league}</option>)}</select></label></div><div className="admin-form-grid"><label className="admin-form-label">Silhouette<input value={editorForm.silhouette} onChange={(event) => setEditorForm({ ...editorForm, silhouette: event.target.value })} className="admin-form-input" /></label><label className="admin-form-label"><span><CircleDollarSign size={13} /> Base price</span><input inputMode="decimal" value={editorForm.price} onChange={(event) => setEditorForm({ ...editorForm, price: event.target.value })} className="admin-form-input" /></label></div><div className="admin-form-grid"><label className="admin-form-label">Compare-at price<input inputMode="decimal" value={editorForm.compareAtPrice} onChange={(event) => setEditorForm({ ...editorForm, compareAtPrice: event.target.value })} className="admin-form-input" placeholder="Optional sale reference" /></label><label className="admin-form-label">Badge<input value={editorForm.badge} onChange={(event) => setEditorForm({ ...editorForm, badge: event.target.value })} className="admin-form-input" placeholder="HOT DROP / EXCLUSIVE" /></label></div><label className="admin-form-label">Description<textarea value={editorForm.description} onChange={(event) => setEditorForm({ ...editorForm, description: event.target.value })} className="admin-form-input admin-form-textarea" rows={4} placeholder="Short merchandising story" /><span className="admin-form-help">Write the first sentence for the shopper. Mention the silhouette, team detail and why this drop is different.</span></label><div className="admin-form-grid"><label className="admin-form-label">Material<input value={editorForm.material} onChange={(event) => setEditorForm({ ...editorForm, material: event.target.value })} className="admin-form-input" placeholder="100% cotton twill" /></label><label className="admin-form-label">Fit note<input value={editorForm.fitNote} onChange={(event) => setEditorForm({ ...editorForm, fitNote: event.target.value })} className="admin-form-input" placeholder="Structured, high crown" /></label></div><label className="admin-form-label">Care instructions<input value={editorForm.care} onChange={(event) => setEditorForm({ ...editorForm, care: event.target.value })} className="admin-form-input" placeholder="Spot clean only" /></label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><Image size={15} /> Product media</h3><span className="admin-section-count">{editorForm.images.length} image{editorForm.images.length === 1 ? '' : 's'}</span></div><div className="admin-media-grid">{editorForm.images.map((image, index) => <div className={`admin-media-card ${index === 0 ? 'is-cover' : ''}`} key={`${image}-${index}`}><img src={image} alt={editorForm.imageAlt || editorForm.title} /><div className="admin-media-card__actions"><button type="button" onClick={() => moveEditorImageToCover(index)} disabled={index === 0}>{index === 0 ? 'Cover' : 'Set cover'}</button><button type="button" onClick={() => removeEditorImage(index)} aria-label={`Remove image ${index + 1}`}><X size={12} /></button></div><input value={image} onChange={(event) => updateEditorImage(index, event.target.value)} className="admin-form-input font-mono" aria-label={`Image URL ${index + 1}`} /></div>)}{!editorForm.images.length && <div className="admin-media-empty">Add a cover image to make this listing shoppable.</div>}</div><div className="admin-media-add"><input value={editorForm.imageInput} onChange={(event) => setEditorForm({ ...editorForm, imageInput: event.target.value })} className="admin-form-input font-mono" placeholder="Paste another image URL" /><button type="button" className="admin-button" onClick={addEditorImage}><Plus size={13} /> Add image</button></div><label className="admin-form-label">Image alt text<input value={editorForm.imageAlt} onChange={(event) => setEditorForm({ ...editorForm, imageAlt: event.target.value })} className="admin-form-input" placeholder="Describe the hat for search and accessibility" /></label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Catalog organization</h3><span className="admin-section-count">Shopify style</span></div><div className="admin-form-grid"><label className="admin-form-label">URL handle<input value={editorForm.handle} onChange={(event) => setEditorForm({ ...editorForm, handle: event.target.value })} className="admin-form-input font-mono" placeholder="new-era-yankees" /></label><label className="admin-form-label">Product group<input value={editorForm.productGroup} onChange={(event) => setEditorForm({ ...editorForm, productGroup: event.target.value })} className="admin-form-input" placeholder="Caps" /></label></div><div className="admin-form-grid"><label className="admin-form-label">Source SKU<input value={editorForm.sourceSku} onChange={(event) => setEditorForm({ ...editorForm, sourceSku: event.target.value })} className="admin-form-input font-mono" /></label><label className="admin-form-label">Brand<input value={editorForm.brand} onChange={(event) => setEditorForm({ ...editorForm, brand: event.target.value })} className="admin-form-input" placeholder="New Era" /></label></div><label className="admin-form-label">Tags<input value={editorForm.tags} onChange={(event) => setEditorForm({ ...editorForm, tags: event.target.value })} className="admin-form-input" placeholder="new-era, mlb, fitted" /><span className="admin-form-help">Separate tags with commas for search and collections.</span></label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><Warehouse size={15} /> Variants & inventory</h3><button type="button" className="admin-text-action" onClick={addEditorSize}><Plus size={13} /> Add variant</button></div><p className="admin-form-help">Mỗi size có thể có giá và tồn kho riêng. Giá/tồn kho hàng loạt chỉ áp dụng trên bảng này và được lưu cùng sản phẩm.</p><div className="admin-variant-bulkbar"><label className="admin-form-label"><span><CircleDollarSign size={12} /> Apply price to all</span><input inputMode="decimal" value={bulkVariantPrice} onChange={(event) => setBulkVariantPrice(event.target.value)} className="admin-form-input" placeholder={editorForm.price || '49.99'} /></label><button type="button" className="admin-button" onClick={applyEditorBulkVariantPrice}>Apply price</button><label className="admin-form-label"><span><Warehouse size={12} /> Set stock for all</span><input type="number" min="0" value={bulkVariantInventory} onChange={(event) => setBulkVariantInventory(event.target.value)} className="admin-form-input" placeholder="0" /></label><button type="button" className="admin-button" onClick={applyEditorBulkVariantInventory}>Apply stock</button></div><div className="admin-variant-table"><div className="admin-variant-table__head"><span>Option / size</span><span>Price</span><span>Available</span><span aria-hidden="true" /></div>{editorForm.sizes.map((variant, index) => <div className="admin-variant-row" key={`${variant.id || 'new'}-${index}`}><input aria-label={`Size ${index + 1}`} value={variant.size} onChange={(event) => updateEditorSize(index, 'size', event.target.value)} className="admin-form-input" placeholder="7 1/4" /><div className="admin-price-input"><span>$</span><input aria-label={`Price for ${variant.size || index + 1}`} inputMode="decimal" value={variant.price} onChange={(event) => updateEditorSize(index, 'price', event.target.value)} className="admin-form-input" /></div><input aria-label={`Inventory for size ${variant.size || index + 1}`} type="number" min="0" value={variant.inventoryCount} onChange={(event) => updateEditorSize(index, 'inventoryCount', event.target.value)} className="admin-form-input" /><button type="button" onClick={() => removeEditorSize(index)} aria-label={`Remove variant ${variant.size || index + 1}`}><X size={13} /></button></div>)}{!editorForm.sizes.length && <div className="admin-inventory-empty">No variants yet. Add the first fitted size.</div>}</div></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Search preview</h3><span className="admin-section-count">SEO content</span></div><label className="admin-form-label">SEO title<input maxLength="60" value={editorForm.seoTitle} onChange={(event) => setEditorForm({ ...editorForm, seoTitle: event.target.value })} className="admin-form-input" placeholder="New Era Yankees 59FIFTY | NLB ERA HAT" /></label><label className="admin-form-label">SEO description<textarea maxLength="160" rows={3} value={editorForm.seoDescription} onChange={(event) => setEditorForm({ ...editorForm, seoDescription: event.target.value })} className="admin-form-input admin-form-textarea" placeholder="Describe the hat, fit and drop story in one clear sentence." /></label><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={editorForm.noindex} onChange={(event) => setEditorForm({ ...editorForm, noindex: event.target.checked })} className="h-4 w-4 accent-[#ff3b30]" /> Hide this listing from search engines</label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><ShieldCheck size={15} /> Publish & source gate</h3><span className="admin-section-count">Required for sale</span></div><div className="admin-source-gate-card"><div className="admin-source-gate-card__top"><label className="admin-form-label">Listing status<select value={editorForm.status} onChange={(event) => setEditorForm({ ...editorForm, status: event.target.value })} className="admin-form-select"><option value="DRAFT">Draft — hidden</option><option value="PUBLISHED" disabled={editorForm.source1688Status !== 'MATCHED'}>Published — storefront</option></select></label><label className="admin-form-label">1688 check<select value={editorForm.source1688Status} onChange={(event) => setEditorForm({ ...editorForm, source1688Status: event.target.value, status: event.target.value === 'MATCHED' ? editorForm.status : 'DRAFT' })} className="admin-form-select"><option value="PENDING">PENDING</option><option value="REVIEW">REVIEW</option><option value="MATCHED">MATCHED / sellable</option><option value="NOT_FOUND">NOT_FOUND</option></select></label></div>{editorForm.source1688Status !== 'MATCHED' && <div className="admin-source-gate-warning"><CircleAlert size={14} /> Listing này vẫn bị khóa bán cho tới khi có URL mẫu tương ứng trên 1688.</div>}<div className="admin-form-grid"><label className="admin-form-label">1688 listing URL<input type="url" value={editorForm.source1688Url} onChange={(event) => setEditorForm({ ...editorForm, source1688Url: event.target.value })} className="admin-form-input font-mono" placeholder="https://detail.1688.com/offer/..." /></label><label className="admin-form-label">Match score (0–100)<input type="number" min="0" max="100" step="0.01" value={editorForm.source1688Score} onChange={(event) => setEditorForm({ ...editorForm, source1688Score: event.target.value })} className="admin-form-input" placeholder="88" /></label></div><label className="admin-form-label">1688 listing title<input value={editorForm.source1688Title} onChange={(event) => setEditorForm({ ...editorForm, source1688Title: event.target.value })} className="admin-form-input" /></label><label className="admin-form-label">1688 image URL<input type="url" value={editorForm.source1688ImageUrl} onChange={(event) => setEditorForm({ ...editorForm, source1688ImageUrl: event.target.value })} className="admin-form-input font-mono" /></label><label className="admin-form-label">Verification note<textarea value={editorForm.source1688Note} onChange={(event) => setEditorForm({ ...editorForm, source1688Note: event.target.value })} className="admin-form-input admin-form-textarea" rows={2} placeholder="Màu, logo, form mũ, nhà cung cấp…" /></label></div></section>

              <div className="admin-editor-footer"><button type="button" className="btn-secondary text-xs px-4 py-2.5" onClick={closeEditor}>Cancel</button><button type="submit" className="btn-flame text-xs px-4 py-2.5" disabled={editorSaving}><Save size={14} /> {editorSaving ? 'Saving…' : 'Save product'}</button></div>
            </form>
          </aside>
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
        <div className="admin-drawer-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsNewModalOpen(false); }}>
          <aside className="admin-drawer admin-product-drawer admin-create-product-drawer" role="dialog" aria-modal="true" aria-labelledby="new-product-title">
            <header className="admin-drawer-header">
              <div>
                <span className="admin-intro-eyebrow">CATALOG / NEW PRODUCT</span>
                <h2 id="new-product-title">Create product</h2>
                <p>Chuẩn hoá nội dung, media và biến thể trước khi gửi listing đi kiểm tra 1688.</p>
              </div>
              <button type="button" className="admin-icon-button" onClick={() => setIsNewModalOpen(false)} aria-label="Close new product form"><X size={18} /></button>
            </header>

            <form onSubmit={handleCreateProduct} className="admin-drawer-body admin-product-editor">
              <div className="admin-create-summary"><div><strong>Draft workspace</strong><span>Listing mới luôn ẩn khỏi storefront cho tới khi được MATCHED trên 1688.</span></div><span className="admin-status-badge is-warning">DRAFT</span></div>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Product information</h3><span className="admin-section-count">Title & content</span></div><div className="admin-title-field"><label className="admin-form-label">Product title<input required autoFocus value={formState.title} onChange={(event) => updateCreateField('title', event.target.value)} className="admin-form-input admin-form-input--title" placeholder="New Era Yankees 59FIFTY Championship" /></label><div className="admin-field-meta"><span>{formState.title.length}/70 characters</span><span className={formState.title.length >= 20 && formState.title.length <= 70 ? 'is-good' : ''}>{formState.title.length >= 20 && formState.title.length <= 70 ? 'Search-ready title' : 'Aim for 20–70 characters'}</span><button type="button" className="admin-text-action" onClick={suggestCreateTitle}><Flame size={12} /> Suggest title</button></div></div><div className="admin-form-grid"><label className="admin-form-label">Team<input required value={formState.team} onChange={(event) => updateCreateField('team', event.target.value)} className="admin-form-input" /></label><label className="admin-form-label">League<select value={formState.league} onChange={(event) => updateCreateField('league', event.target.value)} className="admin-form-select"><option value="MLB">MLB</option><option value="NBA">NBA</option><option value="NFL">NFL</option><option value="NHL">NHL</option><option value="MiLB">MiLB</option><option value="NCAA">NCAA</option><option value="PINS">PINS</option></select></label></div><div className="admin-form-grid"><label className="admin-form-label">Silhouette<input value={formState.silhouette} onChange={(event) => updateCreateField('silhouette', event.target.value)} className="admin-form-input" placeholder="59FIFTY Fitted" /></label><label className="admin-form-label">Product group<input value={formState.productGroup} onChange={(event) => updateCreateField('productGroup', event.target.value)} className="admin-form-input" placeholder="Caps" /></label></div><div className="admin-form-grid"><label className="admin-form-label">Brand<input value={formState.brand} onChange={(event) => updateCreateField('brand', event.target.value)} className="admin-form-input" placeholder="New Era" /></label><label className="admin-form-label">Source SKU<input value={formState.sourceSku} onChange={(event) => updateCreateField('sourceSku', event.target.value)} className="admin-form-input font-mono" placeholder="Optional supplier SKU" /></label></div><div className="admin-form-grid"><label className="admin-form-label">URL handle<input value={formState.handle} onChange={(event) => updateCreateField('handle', event.target.value)} className="admin-form-input font-mono" placeholder="new-era-yankees-59fifty" /></label><label className="admin-form-label">Tags<input value={formState.tags} onChange={(event) => updateCreateField('tags', event.target.value)} className="admin-form-input" placeholder="new-era, mlb, fitted" /></label></div><label className="admin-form-label">Description<textarea value={formState.description} onChange={(event) => updateCreateField('description', event.target.value)} className="admin-form-input admin-form-textarea" rows={5} placeholder="Tell shoppers what makes this hat worth collecting." /><span className="admin-form-help">Keep the first sentence specific: silhouette, team detail and the reason to collect this drop.</span></label><button type="button" className="admin-text-action admin-content-suggestion" onClick={suggestCreateDescription}><Flame size={12} /> Fill a merchandising description</button><div className="admin-form-grid"><label className="admin-form-label">Material<input value={formState.material} onChange={(event) => updateCreateField('material', event.target.value)} className="admin-form-input" placeholder="100% cotton twill" /></label><label className="admin-form-label">Fit note<input value={formState.fitNote} onChange={(event) => updateCreateField('fitNote', event.target.value)} className="admin-form-input" placeholder="Structured, high crown" /></label></div><label className="admin-form-label">Care instructions<input value={formState.care} onChange={(event) => updateCreateField('care', event.target.value)} className="admin-form-input" placeholder="Spot clean only" /></label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><Image size={15} /> Images</h3><span className="admin-section-count">{formState.images.length} image{formState.images.length === 1 ? '' : 's'} / cover first</span></div><div className="admin-media-grid">{formState.images.map((image, index) => <div className={`admin-media-card ${index === 0 ? 'is-cover' : ''}`} key={`${image}-${index}`}><img src={image} alt={formState.imageAlt || formState.title} /><div className="admin-media-card__actions"><button type="button" onClick={() => moveCreateImageToCover(index)} disabled={index === 0}>{index === 0 ? 'Cover image' : 'Set cover'}</button><button type="button" onClick={() => removeCreateImage(index)} aria-label={`Remove image ${index + 1}`}><X size={12} /></button></div></div>)}{!formState.images.length && <div className="admin-media-empty">Add a cover image before saving this listing.</div>}</div><div className="admin-media-add"><input type="url" value={formState.imageInput} onChange={(event) => updateCreateField('imageInput', event.target.value)} className="admin-form-input font-mono" placeholder="Paste image URL from supplier or 1688" /><button type="button" className="admin-button" onClick={addCreateImage}><Plus size={13} /> Add image</button></div><label className="admin-form-label">Image alt text<input value={formState.imageAlt} onChange={(event) => updateCreateField('imageAlt', event.target.value)} className="admin-form-input" placeholder="Describe colour, team and silhouette" /><span className="admin-form-help">This text is saved with the product for accessibility and image search.</span></label></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><CircleDollarSign size={15} /> Pricing</h3><span className="admin-section-count">Base & compare-at</span></div><div className="admin-form-grid"><label className="admin-form-label"><span><CircleDollarSign size={12} /> Base price</span><input required inputMode="decimal" value={formState.price} onChange={(event) => updateCreateField('price', event.target.value)} className="admin-form-input" placeholder="49.99" /></label><label className="admin-form-label">Compare-at price<input inputMode="decimal" value={formState.compareAtPrice} onChange={(event) => updateCreateField('compareAtPrice', event.target.value)} className="admin-form-input" placeholder="Optional sale reference" /></label></div><label className="admin-form-label">Badge<input value={formState.badge} onChange={(event) => updateCreateField('badge', event.target.value)} className="admin-form-input" placeholder="HOT DROP / EXCLUSIVE" /></label><p className="admin-form-help">Base price is the fallback. Each variant below can override it with its own price.</p></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3><Warehouse size={15} /> Variants</h3><div className="admin-section-heading__actions"><button type="button" className="admin-text-action" onClick={generateCreateSizes}><RotateCcw size={12} /> Generate fitted sizes</button><button type="button" className="admin-text-action" onClick={() => addCreateVariant()}><Plus size={13} /> Add variant</button></div></div><p className="admin-form-help">Tạo bao nhiêu size tuỳ ý. Giá và tồn kho được lưu riêng cho từng dòng, nên bạn có thể bán size hiếm với giá khác.</p><div className="admin-variant-bulkbar"><label className="admin-form-label"><span><CircleDollarSign size={12} /> Apply price to all</span><input inputMode="decimal" value={newBulkVariantPrice} onChange={(event) => setNewBulkVariantPrice(event.target.value)} className="admin-form-input" placeholder={formState.price || '49.99'} /></label><button type="button" className="admin-button" onClick={applyCreateBulkVariantPrice}>Apply price</button><label className="admin-form-label"><span><Warehouse size={12} /> Set stock for all</span><input type="number" min="0" value={newBulkVariantInventory} onChange={(event) => setNewBulkVariantInventory(event.target.value)} className="admin-form-input" placeholder="0" /></label><button type="button" className="admin-button" onClick={applyCreateBulkVariantInventory}>Apply stock</button></div><div className="admin-variant-table"><div className="admin-variant-table__head"><span>Option / size</span><span>Price</span><span>Available</span><span aria-hidden="true" /></div>{formState.variants.map((variant, index) => <div className="admin-variant-row" key={`${variant.id || 'new'}-${index}`}><input aria-label={`Variant ${index + 1} size`} value={variant.size} onChange={(event) => updateCreateVariant(index, 'size', event.target.value)} className="admin-form-input" placeholder="7 1/4" /><div className="admin-price-input"><span>$</span><input aria-label={`Variant ${index + 1} price`} inputMode="decimal" value={variant.price} onChange={(event) => updateCreateVariant(index, 'price', event.target.value)} className="admin-form-input" /></div><input aria-label={`Variant ${index + 1} inventory`} type="number" min="0" value={variant.inventoryCount} onChange={(event) => updateCreateVariant(index, 'inventoryCount', event.target.value)} className="admin-form-input" /><button type="button" onClick={() => removeCreateVariant(index)} aria-label={`Remove variant ${index + 1}`}><X size={13} /></button></div>)}{!formState.variants.length && <div className="admin-inventory-empty">No variants yet. Add a size or generate fitted sizes.</div>}</div></section>

              <section className="admin-detail-section"><div className="admin-section-heading"><h3>Search preview</h3><span className="admin-section-count">SEO content</span></div><label className="admin-form-label">SEO title<input maxLength="60" value={formState.seoTitle} onChange={(event) => updateCreateField('seoTitle', event.target.value)} className="admin-form-input" placeholder="New Era Yankees 59FIFTY | NLB ERA HAT" /></label><label className="admin-form-label">SEO description<textarea maxLength="160" rows={3} value={formState.seoDescription} onChange={(event) => updateCreateField('seoDescription', event.target.value)} className="admin-form-input admin-form-textarea" placeholder="Describe the hat, fit and drop story in one clear sentence." /></label><label className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={formState.noindex} onChange={(event) => updateCreateField('noindex', event.target.checked)} className="h-4 w-4 accent-[#ff3b30]" /> Hide this listing from search engines</label></section>

              <div className="admin-source-gate-card"><div className="admin-source-gate-warning"><CircleAlert size={14} /> Draft mới chỉ được bán sau khi bạn mở Image Search 1688, tìm thấy mẫu tương ứng và lưu trạng thái MATCHED.</div></div>
              <div className="admin-editor-footer"><button type="button" className="btn-secondary text-xs px-4 py-2.5" onClick={() => setIsNewModalOpen(false)}>Cancel</button><button type="submit" className="btn-flame text-xs px-4 py-2.5"><Save size={14} /> Save draft</button></div>
            </form>
          </aside>
        </div>
      )}

    </div>
  );
}
