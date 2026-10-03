import { supabase } from '../lib/supabase';
import { mapCatalogRow } from './catalogApi';
import { is1688OfferUrl } from '../lib/adminOperations';

function sortRows(left, right) {
  return Number(left.sort_order ?? left.position ?? 0) - Number(right.sort_order ?? right.position ?? 0);
}

function treeFromRows(rows = []) {
  const byParent = new Map();
  for (const row of rows) {
    const key = row.parent_id || null;
    const list = byParent.get(key) || [];
    list.push({
      id: row.id,
      label: row.label,
      target: row.target,
      type: row.link_type || row.type || 'PAGE',
      visible: row.visible !== false,
      imageMode: row.image_mode || 'AUTO',
      imageUrl: row.image_url || '',
      imageAlt: row.image_alt || '',
      settings: row.settings || {},
      children: [],
      _parentId: row.parent_id || null,
      _sortOrder: row.sort_order || 0,
    });
    byParent.set(key, list);
  }
  const attach = (parentId) => (byParent.get(parentId) || []).sort((a, b) => a._sortOrder - b._sortOrder).map(item => ({
    ...item,
    children: attach(item.id),
    _parentId: undefined,
    _sortOrder: undefined,
  }));
  return attach(null);
}

function flattenItems(items = [], menuId, parentId = null, result = [], sortBase = 0) {
  items.forEach((item, index) => {
    result.push({
      id: item.id,
      menu_id: menuId,
      parent_id: parentId,
      label: String(item.label || 'Link').slice(0, 120),
      target: String(item.target || '/').slice(0, 500),
      link_type: String(item.type || item.link_type || 'PAGE').toUpperCase(),
      visible: item.visible !== false,
      sort_order: sortBase + index,
      image_mode: String(item.imageMode || item.image_mode || 'AUTO').toUpperCase(),
      image_url: item.imageUrl || item.image_url || '',
      image_alt: item.imageAlt || item.image_alt || '',
      settings: item.settings || {},
    });
    flattenItems(item.children || [], menuId, item.id, result);
  });
  return result;
}

export async function fetchStorefrontMenus(fallback = []) {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from('store_menus').select('id,name,location,status,updated_at,store_menu_items(*)').eq('status', 'PUBLISHED').order('updated_at', { ascending: false });
  if (error || !data?.length) return fallback;
  return data.map(menu => ({
    id: menu.id,
    name: menu.name,
    location: menu.location,
    status: menu.status,
    updatedAt: menu.updated_at,
    items: treeFromRows(menu.store_menu_items || []),
  }));
}

export async function fetchStorefrontCollections(fallback = []) {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from('store_collections').select('id,handle,name,description,hero,status,sort_mode,rules,updated_at,store_collection_products(product_id,position)').eq('status', 'PUBLISHED').order('updated_at', { ascending: false });
  if (error || !data?.length) return fallback;
  return data.map(row => ({
    id: row.id,
    handle: row.handle,
    name: row.name,
    description: row.description || '',
    hero: row.hero || '',
    status: row.status,
    sort: row.sort_mode || 'NEWEST',
    automation: row.rules || {},
    products: (row.store_collection_products || []).sort(sortRows).map(item => item.product_id),
    count: row.store_collection_products?.length || 0,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminSession() {
  if (!supabase) return { authenticated: false, isAdmin: false, user: null };
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user || null;
  if (!user) return { authenticated: false, isAdmin: false, user: null };
  const { data: profile } = await supabase.from('profiles').select('role,display_name').eq('id', user.id).maybeSingle();
  // Admin access is controlled by the RLS-backed profile role. Auth metadata
  // is user-editable and must never be treated as an authorization source.
  const isAdmin = profile?.role === 'admin';
  return { authenticated: true, isAdmin, user, profile: profile || null };
}

export async function signInAdmin(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const status = await getAdminSession();
  if (!status.isAdmin) {
    await supabase.auth.signOut();
    throw new Error('Tài khoản chưa có quyền admin. Gán profiles.role = admin trước khi đăng nhập.');
  }
  return { ...status, user: data.user };
}

export async function signOutAdmin() {
  if (supabase) await supabase.auth.signOut();
}

export async function saveAdminMenus(menus = []) {
  if (!supabase) return menus;
  for (const menu of menus) {
    const { error: menuError } = await supabase.from('store_menus').upsert({ id: menu.id, name: menu.name, location: menu.location, status: menu.status || 'DRAFT' });
    if (menuError) throw menuError;
    const { error: deleteError } = await supabase.from('store_menu_items').delete().eq('menu_id', menu.id);
    if (deleteError) throw deleteError;
    const rows = flattenItems(menu.items || [], menu.id);
    if (rows.length) {
      const { error: itemError } = await supabase.from('store_menu_items').insert(rows);
      if (itemError) throw itemError;
    }
  }
  // The storefront reader intentionally filters to PUBLISHED rows. Admin
  // needs to keep DRAFT/ARCHIVED menus in its editor after saving, so return
  // the submitted tree instead of re-reading the published-only projection.
  return menus;
}

export async function saveAdminCollections(collections = []) {
  if (!supabase) return collections;
  for (const collection of collections) {
    const { error } = await supabase.from('store_collections').upsert({
      id: collection.id,
      handle: collection.handle,
      name: collection.name,
      description: collection.description || '',
      hero: collection.hero || '',
      status: collection.status || 'DRAFT',
      sort_mode: collection.sort || collection.sort_mode || 'NEWEST',
      rules: collection.automation || collection.rules || {},
    });
    if (error) throw error;
    await supabase.from('store_collection_products').delete().eq('collection_id', collection.id);
    const productIds = (collection.products || []).map((productId, position) => ({ collection_id: collection.id, product_id: Number(productId), position })).filter(row => Number.isFinite(row.product_id));
    if (productIds.length) {
      const { error: productError } = await supabase.from('store_collection_products').insert(productIds);
      if (productError) throw productError;
    }
  }
  // Keep draft collections in the admin state; fetchStorefrontCollections()
  // only returns published collections by design.
  return collections;
}

function money(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function productPayload(product = {}) {
  const id = Number(product.id) || Date.now();
  const title = String(product.title || 'Untitled hat').trim();
  const metadata = product.metadata && typeof product.metadata === 'object' ? product.metadata : {};
  const source1688Status = String(
    product.source1688Status || product.source_1688_status || 'PENDING',
  ).toUpperCase();
  const source1688Url = product.source1688Url || product.source_1688_url || '';
  if (source1688Status === 'MATCHED' && !is1688OfferUrl(source1688Url)) {
    throw new Error('MATCHED cần URL listing hợp lệ trên 1688.');
  }
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.filter(Boolean)
    : [product.thumbnail, product.secondaryImage || product.secondary_image].filter(Boolean);
  const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];
  return {
    id,
    handle: String(product.handle || `${slugify(title)}-${id}`).slice(0, 180),
    title,
    team: product.team || null,
    league: product.league || null,
    category: product.category || 'hats',
    silhouette: product.silhouette || null,
    price: money(product.price),
    images,
    thumbnail: product.thumbnail || images[0] || null,
    secondary_image: product.secondaryImage || product.secondary_image || images[1] || null,
    tags,
    badge: product.badge || null,
    description: product.description || null,
    metadata: {
      ...metadata,
      ...(product.productGroup ? { source_product_group: product.productGroup } : {}),
      ...(product.sourceSku ? { source_sku: product.sourceSku } : {}),
    },
    source_1688_status: source1688Status,
    source_1688_url: source1688Url || null,
    source_1688_title: product.source1688Title || product.source_1688_title || null,
    source_1688_image_url: product.source1688ImageUrl || product.source_1688_image_url || null,
    source_1688_score: product.source1688Score == null || product.source1688Score === ''
      ? null
      : Number(product.source1688Score),
    source_1688_checked_at: product.source1688CheckedAt || product.source_1688_checked_at || null,
    source_1688_checked_by: product.source1688CheckedBy || product.source_1688_checked_by || null,
    source_1688_note: product.source1688Note || product.source_1688_note || null,
    // A publication toggle cannot bypass the source gate. The database
    // trigger enforces this again for writes made outside this UI.
    is_active: source1688Status === 'MATCHED'
      && product.status !== 'DRAFT'
      && product.is_active !== false,
  };
}

function variantRows(productId, product = {}) {
  const variants = Array.isArray(product.sizes) ? product.sizes : [];
  return variants
    .map((variant, index) => {
      const size = String(variant.size || '').trim();
      if (!size) return null;
      const inventoryCount = Number(variant.inventoryCount ?? variant.inventory_count ?? (variant.inStock || variant.in_stock ? 1 : 0)) || 0;
      return {
        id: String(variant.id || `${productId}-${slugify(size) || index}`),
        product_id: productId,
        size,
        price: money(variant.price ?? product.price),
        in_stock: Boolean(variant.inStock ?? variant.in_stock) || inventoryCount > 0,
        inventory_count: Math.max(0, inventoryCount),
      };
    })
    .filter(Boolean);
}

export async function saveAdminProduct(product) {
  if (!supabase) return product;
  const payload = productPayload(product);
  const { error: productError } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
  if (productError) throw productError;

  const variants = variantRows(payload.id, product);
  if (variants.length) {
    const { error: variantError } = await supabase.from('product_variants').upsert(variants, { onConflict: 'id' });
    if (variantError) throw variantError;
  }
  // Keep the database in lockstep with the editor. Without this cleanup a
  // removed size would remain purchasable because an old variant row survives
  // every subsequent product save.
  const { data: existingVariants, error: existingVariantError } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', payload.id);
  if (existingVariantError) throw existingVariantError;
  const desiredVariantIds = new Set(variants.map((variant) => String(variant.id)));
  const staleVariantIds = (existingVariants || [])
    .map((variant) => variant.id)
    .filter((variantId) => !desiredVariantIds.has(String(variantId)));
  if (staleVariantIds.length) {
    const { error: staleVariantError } = await supabase
      .from('product_variants')
      .delete()
      .in('id', staleVariantIds);
    if (staleVariantError) throw staleVariantError;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', payload.id)
    .single();
  if (error) throw error;
  return mapCatalogRow(data);
}

export async function deleteAdminProduct(productId) {
  if (!supabase) return true;
  const { error } = await supabase.from('products').delete().eq('id', Number(productId));
  if (error) throw error;
  return true;
}

export async function updateAdminProductStatus(productId, status) {
  if (!supabase) {
    if (status !== 'DRAFT') throw new Error('Listing chưa được xác nhận có mẫu tương ứng trên 1688.');
    return { id: productId, status, is_active: false };
  }
  if (status !== 'DRAFT') {
    const { data: current, error: currentError } = await supabase
      .from('products')
      .select('source_1688_status')
      .eq('id', Number(productId))
      .single();
    if (currentError) throw currentError;
    if (current?.source_1688_status !== 'MATCHED') {
      throw new Error('Listing chưa được xác nhận có mẫu tương ứng trên 1688.');
    }
  }
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: status !== 'DRAFT' })
    .eq('id', Number(productId))
    .select('*, product_variants(*)')
    .single();
  if (error) throw error;
  return mapCatalogRow(data);
}

export async function updateAdminProduct1688Verification(productId, verification = {}) {
  const status = String(verification.status || verification.source1688Status || 'PENDING').toUpperCase();
  const allowed = new Set(['PENDING', 'MATCHED', 'NOT_FOUND', 'REVIEW']);
  if (!allowed.has(status)) throw new Error('Trạng thái xác minh 1688 không hợp lệ.');
  const sourceUrl = verification.url || verification.source1688Url || '';
  if (status === 'MATCHED' && !is1688OfferUrl(sourceUrl)) {
    throw new Error('MATCHED phải có URL listing hợp lệ dạng https://detail.1688.com/offer/....');
  }
  const checkedAt = verification.checkedAt || new Date().toISOString();
  const patch = {
    source_1688_status: status,
    source_1688_url: sourceUrl || null,
    source_1688_title: verification.title || verification.source1688Title || null,
    source_1688_image_url: verification.imageUrl || verification.source1688ImageUrl || null,
    source_1688_score: verification.score === '' || verification.score == null ? null : Number(verification.score),
    source_1688_checked_at: checkedAt,
    source_1688_note: verification.note || verification.source1688Note || null,
    // MATCHED is the only status that is allowed to be sold. A matched row
    // is activated here; the normal publication toggle can still hide it.
    is_active: status === 'MATCHED' && verification.publish !== false,
  };
  if (!supabase) {
    return mapCatalogRow({
      ...verification.product,
      id: productId,
      source_1688_status: status,
      source_1688_url: patch.source_1688_url,
      source_1688_title: patch.source_1688_title,
      source_1688_image_url: patch.source_1688_image_url,
      source_1688_score: patch.source_1688_score,
      source_1688_checked_at: checkedAt,
      source_1688_note: patch.source_1688_note,
      is_active: patch.is_active,
    });
  }
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', Number(productId))
    .select('*, product_variants(*)')
    .single();
  if (error) throw error;
  return mapCatalogRow(data);
}

export async function fetchStoreSettings(fallback = {}) {
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'storefront')
    .maybeSingle();
  return error || !data?.value ? fallback : data.value;
}

export async function saveStoreSettings(settings = {}) {
  if (!supabase) return settings;
  const { error } = await supabase.from('store_settings').upsert({
    key: 'storefront',
    value: settings,
  }, { onConflict: 'key' });
  if (error) throw error;
  return settings;
}

function mapOrderRow(row = {}) {
  const status = String(row.status || 'pending').toLowerCase();
  const fulfillmentStatus = status === 'delivered'
    ? 'DELIVERED'
    : status === 'shipped'
      ? 'SHIPPED'
      : status === 'processing'
        ? 'IN_PROGRESS'
        : status === 'cancelled'
          ? 'CANCELLED'
          : 'UNFULFILLED';
  const paymentStatus = ['paid', 'processing', 'shipped', 'delivered'].includes(status)
    ? 'PAID'
    : status === 'cancelled' ? 'CANCELLED' : 'PENDING';
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: row.created_at,
    customerName: row.shipping_address?.name || row.customer_email?.split('@')[0] || 'Guest collector',
    customerEmail: row.customer_email || '',
    shippingAddress: row.shipping_address || {},
    paymentStatus,
    fulfillmentStatus,
    carrier: row.shipping_address?.carrier || '',
    trackingNumber: row.tracking_number || '',
    trackingUrl: row.shipping_address?.trackingUrl || '',
    grandTotal: Number(row.subtotal || 0),
    currency: row.currency || 'USD',
    items: (row.order_items || []).map((item) => ({
      id: item.product_id,
      title: item.title,
      size: item.size,
      sku: item.variant_id || '',
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      thumbnail: item.thumbnail,
    })),
  };
}

export async function fetchAdminOrders(fallback = []) {
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from('orders')
    .select('id,order_number,customer_email,status,currency,subtotal,tracking_number,shipping_address,created_at,order_items(*)')
    .order('created_at', { ascending: false });
  return error || !data ? fallback : data.map(mapOrderRow);
}

export async function saveAdminOrder(order) {
  if (!supabase) return order;
  const status = order.fulfillmentStatus === 'CANCELLED'
    ? 'cancelled'
    : order.fulfillmentStatus === 'DELIVERED'
    ? 'delivered'
    : order.fulfillmentStatus === 'SHIPPED'
      ? 'shipped'
      : order.fulfillmentStatus === 'IN_PROGRESS'
        ? 'processing'
        : order.paymentStatus === 'PAID' ? 'paid' : 'pending';
  const shippingAddress = {
    ...(order.shippingAddress || {}),
    carrier: order.carrier || '',
    trackingUrl: order.trackingUrl || '',
  };
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      tracking_number: order.trackingNumber || null,
      shipping_address: shippingAddress,
    })
    .eq('id', order.id)
    .select('id,order_number,customer_email,status,currency,subtotal,tracking_number,shipping_address,created_at,order_items(*)')
    .single();
  if (error) throw error;
  return mapOrderRow(data);
}

export async function fetchAdminMembers(fallback = []) {
  if (!supabase) return fallback;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,preferred_size,tier,points,joined_year,created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return fallback;
  return data.map((profile) => ({
    id: profile.id,
    name: profile.display_name || 'Collector',
    email: '',
    tier: profile.tier || 'Rookie Collector',
    points: Number(profile.points || 0),
    preferredSize: profile.preferred_size || '',
    joinedDate: profile.created_at?.slice(0, 10) || '',
    ordersCount: 0,
    earlyAccess: profile.tier !== 'Rookie Collector',
  }));
}

/**
 * Fetch small aggregate counts for the admin overview without downloading the
 * entire 26k-row catalog. This query is protected by the existing admin RLS
 * policy and returns null when the dashboard is running in offline mode.
 */
export async function fetchAdminCatalogStats(fallback = null) {
  if (!supabase) return fallback;
  const count = async (queryBuilder) => {
    const { count: value, error } = await queryBuilder;
    if (error) throw error;
    return Number(value || 0);
  };
  try {
    const [matchedActive, matched, pending, review, notFound] = await Promise.all([
      count(supabase.from('products').select('id', { count: 'exact', head: true }).eq('source_1688_status', 'MATCHED').eq('is_active', true)),
      count(supabase.from('products').select('id', { count: 'exact', head: true }).eq('source_1688_status', 'MATCHED')),
      count(supabase.from('products').select('id', { count: 'exact', head: true }).eq('source_1688_status', 'PENDING')),
      count(supabase.from('products').select('id', { count: 'exact', head: true }).eq('source_1688_status', 'REVIEW')),
      count(supabase.from('products').select('id', { count: 'exact', head: true }).eq('source_1688_status', 'NOT_FOUND')),
    ]);
    return {
      total: matched + pending + review + notFound,
      matchedActive,
      matched,
      pending,
      review,
      notFound,
      queue: pending + review + notFound,
    };
  } catch (error) {
    console.warn('Supabase catalog stats failed:', error.message);
    return fallback;
  }
}
