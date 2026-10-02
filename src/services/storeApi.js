import { supabase } from '../lib/supabase';
import { fetchCatalogPage, mapCatalogRow } from './catalogApi';

export function mapProduct(row) {
  return mapCatalogRow(row);
}

export async function fetchProducts(options = {}) {
  if (!supabase) return null;
  try {
    const page = await fetchCatalogPage({ page: 1, pageSize: 48, ...options });
    return page.products;
  } catch (error) {
    console.warn('Supabase product fetch failed:', error.message);
    return null;
  }
}

export async function saveProfile(user, preferredSize) {
  if (!supabase || !user?.id) return;
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Collector',
    preferred_size: preferredSize,
  });
  if (error) console.warn('Supabase profile save failed:', error.message);
}

export async function createOrder({ items, subtotal, currency = 'USD', user, customerEmail }) {
  if (!supabase) return null;
  const normalizedEmail = String(customerEmail ?? user?.email ?? '').trim().toLowerCase() || null;
  if (!normalizedEmail) throw new Error('A valid checkout email is required.');
  const { data, error } = await supabase.rpc('create_checkout_order', {
    p_customer_email: normalizedEmail,
    p_currency: currency,
    p_items: items.map((item) => ({
      id: Number(item.id),
      variant_id: item.variantId || null,
      size: item.size,
      quantity: Number(item.quantity) || 1,
    })),
  });
  if (error) throw error;
  const order = Array.isArray(data) ? data[0] : data;
  if (!order?.order_number) throw new Error('The order reference was not returned by the store.');
  return {
    id: order.order_id,
    order_number: order.order_number,
    subtotal: Number(order.subtotal || subtotal || 0),
    currency: order.currency || currency,
  };
}

export async function fetchMyOrders(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('id,order_number,status,currency,subtotal,created_at,updated_at,order_items(title,size,unit_price,quantity,thumbnail)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    status: row.status || 'pending',
    currency: row.currency || 'USD',
    subtotal: Number(row.subtotal || 0),
    date: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items || []).map((item) => ({
      title: item.title,
      size: item.size,
      price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      thumbnail: item.thumbnail,
    })),
  }));
}

export async function subscribeToDrop(dropTitle, email) {
  if (!supabase || !email || !dropTitle) return;
  const { error } = await supabase.from('drop_notifications').upsert(
    { drop_title: dropTitle, email },
    { onConflict: 'email,drop_title' },
  );
  if (error) console.warn('Supabase drop notification failed:', error.message);
}
