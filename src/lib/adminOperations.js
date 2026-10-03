export const ORDER_STAGES = {
  pending: { label: 'Chờ thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'info' },
  processing: { label: 'Đang đóng gói', tone: 'warning' },
  shipped: { label: 'Đang giao', tone: 'info' },
  delivered: { label: 'Đã giao', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
};

export const SOURCE_STAGES = {
  PENDING: 'Chưa kiểm tra', REVIEW: 'Cần đối chiếu', MATCHED: 'Đã khớp mẫu', NOT_FOUND: 'Không có mẫu',
};

const TRANSITIONS = {
  pending: ['pending', 'paid', 'cancelled'],
  paid: ['paid', 'processing', 'shipped', 'cancelled'],
  processing: ['processing', 'shipped', 'delivered', 'cancelled'],
  shipped: ['shipped', 'delivered'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
};

export function orderStage(order = {}) {
  if (ORDER_STAGES[order.status]) return order.status;
  const stages = { CANCELLED: 'cancelled', DELIVERED: 'delivered', SHIPPED: 'shipped', IN_PROGRESS: 'processing' };
  return stages[order.fulfillmentStatus] || (order.paymentStatus === 'PAID' ? 'paid' : 'pending');
}

export function allowedOrderStages(order) { return TRANSITIONS[orderStage(order)]; }

export function safeHttpUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function is1688OfferUrl(value) {
  const safe = safeHttpUrl(value);
  if (!safe) return false;
  const url = new URL(safe);
  return (url.hostname === '1688.com' || url.hostname.endsWith('.1688.com'))
    && /^\/offer\/\d+(?:\.html)?\/?$/.test(url.pathname);
}

export function parseAmount(value) {
  const text = String(value ?? '').trim().replace(/^\s*\$\s*/, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return NaN;
  const amount = Number(text);
  return Number.isFinite(amount) && amount >= 0 && amount <= 99999999.99 ? amount : NaN;
}

export function inventorySummary(product = {}) {
  const variants = product.sizes || [];
  const counts = variants.map(v => Number(v.inventoryCount ?? v.inventory_count ?? 0));
  return { total: counts.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0),
    low: counts.some(n => n > 0 && n <= 2), available: counts.filter(n => n > 0).length, variants: variants.length };
}

export function validateProduct(product) {
  if (!String(product.title || '').trim()) throw new Error('Nhập tên sản phẩm.');
  if (!Number.isFinite(parseAmount(product.price))) throw new Error('Giá USD phải là số không âm, tối đa 2 chữ số thập phân.');
  if (!product.images?.length || product.images.some(url => !safeHttpUrl(url))) throw new Error('Cần ít nhất một URL ảnh http/https hợp lệ.');
  if (!SOURCE_STAGES[product.source1688Status]) throw new Error('Trạng thái nguồn 1688 không hợp lệ.');
  if (product.source1688Status === 'MATCHED' && !is1688OfferUrl(product.source1688Url)) throw new Error('MATCHED cần URL mẫu dạng https://detail.1688.com/offer/123456.html.');
  if (product.status === 'PUBLISHED' && product.source1688Status !== 'MATCHED') throw new Error('Chỉ sản phẩm đã khớp mẫu 1688 mới được bán.');
  if (product.source1688Score !== '' && product.source1688Score != null && (!Number.isFinite(Number(product.source1688Score)) || Number(product.source1688Score) < 0 || Number(product.source1688Score) > 100)) throw new Error('Độ tương đồng phải từ 0 đến 100.');
  if (product.source1688ImageUrl && !safeHttpUrl(product.source1688ImageUrl)) throw new Error('URL ảnh nguồn không hợp lệ.');
  const seen = new Set();
  for (const variant of product.sizes || []) {
    const size = String(variant.size || '').trim().toLowerCase();
    if (!size || seen.has(size)) throw new Error('Mỗi size phải có tên và không được trùng nhau.');
    seen.add(size);
    const count = Number(variant.inventoryCount);
    if (variant.inventoryCount === '' || !Number.isSafeInteger(count) || count < 0 || count > 2147483647) throw new Error(`Tồn kho size ${variant.size} phải là số nguyên không âm.`);
    if (!Number.isFinite(parseAmount(variant.price ?? product.price))) throw new Error(`Giá size ${variant.size} không hợp lệ.`);
  }
  return product;
}

export function validateOrderUpdate(previous, next, { confirmPayment = false, confirmCancellation = false } = {}) {
  const from = orderStage(previous);
  const to = orderStage(next);
  if (!TRANSITIONS[from]?.includes(to)) throw new Error('Không thể chuyển sang bước này. Tải lại đơn để kiểm tra trạng thái mới nhất.');
  if (from !== to && to === 'paid' && !confirmPayment) throw new Error('Xác nhận đã kiểm tra khoản thanh toán thực tế trước khi ghi nhận.');
  if (from !== to && to === 'cancelled' && !confirmCancellation) throw new Error('Cần xác nhận hủy đơn. Thao tác này không tự hoàn tiền hoặc hoàn tồn kho.');
  if (next.trackingUrl && !safeHttpUrl(next.trackingUrl)) throw new Error('URL theo dõi phải dùng http/https.');
  if (['shipped', 'delivered'].includes(to)) {
    if (!String(next.trackingNumber || '').trim() || !String(next.carrier || '').trim()) throw new Error('Nhập đơn vị vận chuyển và mã vận đơn trước khi giao hàng.');
    const address = next.shippingAddress || {};
    if (!(address.street || address.address1 || address.line1) || !address.city || !address.country) throw new Error('Cần địa chỉ, thành phố và quốc gia giao hàng.');
  }
  if (['shipped', 'delivered', 'cancelled'].includes(from)) {
    const shippingOnly = address => Object.fromEntries(Object.entries(address || {}).filter(([key]) => !['carrier', 'trackingUrl'].includes(key)).sort(([a], [b]) => a.localeCompare(b)));
    if (JSON.stringify(shippingOnly(previous.shippingAddress)) !== JSON.stringify(shippingOnly(next.shippingAddress))) throw new Error('Không thể sửa địa chỉ khi đơn đã giao cho vận chuyển hoặc đã hủy.');
  }
  return next;
}

export function trackingLink(carrier, number) {
  if (!String(number || '').trim()) return '';
  const encoded = encodeURIComponent(String(number).trim());
  const name = String(carrier || '').toLowerCase();
  if (name.includes('ups')) return `https://www.ups.com/track?tracknum=${encoded}`;
  if (name.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
  if (name.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
  if (name.includes('dhl')) return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
  return '';
}

export function displayDate(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Chưa có dữ liệu';
}
