const list = value => Array.isArray(value) ? value : [];
const upper = value => String(value || '').toUpperCase();
const cancelled = order => [order.fulfillmentStatus, order.paymentStatus, order.status].some(value => ['CANCELLED', 'CANCELED'].includes(upper(value)));
const paid = order => upper(order.paymentStatus) === 'PAID' && !cancelled(order);

// Amounts are already denominated in order.currency; never apply storefront FX.
export function formatOrderAmount(amount, currency = 'USD') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 'Unavailable';
  const code = String(currency || 'USD').toUpperCase();
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value); }
  catch { return `${value.toFixed(2)} ${code}`; }
}

export function getAdminMetrics({ products, orders, now = new Date() } = {}) {
  const loadedProducts = list(products);
  const loadedOrders = list(orders);
  const paidOrders = loadedOrders.filter(paid);
  // UTC month boundaries make this deterministic across admin browsers.
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const revenueByCurrency = {};
  let paidMonthCount = 0;
  for (const order of paidOrders) {
    const timestamp = Date.parse(order.date || order.created_at || '');
    const amount = Number(order.grandTotal);
    if (timestamp < start || timestamp > now.getTime() || !Number.isFinite(timestamp) || !Number.isFinite(amount) || order.grandTotal == null) continue;
    const code = upper(order.currency) || 'USD';
    revenueByCurrency[code] = (revenueByCurrency[code] || 0) + amount;
    paidMonthCount++;
  }
  const sales = new Map();
  for (const order of paidOrders) for (const item of list(order.items)) {
    const id = item.productId ?? item.product_id ?? item.product?.id ?? item.id;
    const quantity = Number(item.quantity);
    if (id == null || !Number.isFinite(quantity) || quantity <= 0) continue;
    const key = String(id);
    const existing = sales.get(key) || { product: loadedProducts.find(p => String(p.id) === key) || { ...item, id }, sold: 0 };
    existing.sold += quantity;
    sales.set(key, existing);
  }
  let inventoryKnownCount = 0;
  let lowStockCount = 0;
  for (const product of loadedProducts) {
    const counts = list(product.sizes).map(s => s.inventoryCount ?? s.inventory_count)
      .filter(value => value != null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0).map(Number);
    if (counts.length) inventoryKnownCount++;
    if (counts.some(value => value > 0 && value <= 2)) lowStockCount++;
  }
  return {
    revenueByCurrency, paidMonthCount, inventoryKnownCount, lowStockCount,
    publishedCount: loadedProducts.filter(p => (!p.status || p.status === 'PUBLISHED') && p.source1688Status === 'MATCHED').length,
    sourceQueueCount: loadedProducts.filter(p => (p.source1688Status || 'PENDING') !== 'MATCHED').length,
    pendingOrdersCount: loadedOrders.filter(o => !cancelled(o) && !['DELIVERED', 'SHIPPED'].includes(upper(o.fulfillmentStatus))).length,
    topProducts: [...sales.values()].sort((a, b) => b.sold - a.sold).slice(0, 4),
  };
}
