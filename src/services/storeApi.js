import { supabase } from '../lib/supabase';
import { fetchCatalogPage, mapCatalogRow } from './catalogApi';

const money = (value) => Number(value ?? 0);

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
  const { data: order, error } = await supabase.from('orders').insert({
    user_id: user?.id ?? null,
    customer_email: customerEmail ?? user?.email ?? null,
    currency,
    subtotal,
    status: 'pending',
  }).select('id, order_number').single();
  if (error) {
    console.warn('Supabase order creation failed:', error.message);
    return null;
  }
  const lines = items.map((item) => ({
    order_id: order.id,
    product_id: Number(item.id) || null,
    variant_id: item.variantId ?? null,
    title: item.title,
    size: item.size,
    unit_price: money(String(item.price).replace('$', '')),
    quantity: item.quantity,
    thumbnail: item.thumbnail ?? null,
  }));
  const { error: lineError } = await supabase.from('order_items').insert(lines);
  if (lineError) console.warn('Supabase order item creation failed:', lineError.message);
  return order;
}

export async function subscribeToDrop(dropTitle, email) {
  if (!supabase || !email || !dropTitle) return;
  const { error } = await supabase.from('drop_notifications').upsert(
    { drop_title: dropTitle, email },
    { onConflict: 'email,drop_title' },
  );
  if (error) console.warn('Supabase drop notification failed:', error.message);
}
