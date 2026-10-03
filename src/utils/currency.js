// Currency Conversion Rates (Base USD)
export const currencies = {
  USD: { symbol: '$', rate: 1.0, label: 'US (USD $)', name: 'US Dollar' },
  CAD: { symbol: 'C$', rate: 1.36, label: 'CA (CAD C$)', name: 'Canadian Dollar' },
  EUR: { symbol: '€', rate: 0.92, label: 'EU (EUR €)', name: 'Euro' },
  GBP: { symbol: '£', rate: 0.78, label: 'UK (GBP £)', name: 'British Pound' },
  JPY: { symbol: '¥', rate: 154.5, label: 'JP (JPY ¥)', name: 'Japanese Yen' },
  VND: { symbol: '₫', rate: 25400, label: 'VN (VND ₫)', name: 'Vietnamese Dong' }
};

export function formatPrice(priceInUSD, currencyKey = 'USD') {
  const parsed = typeof priceInUSD === 'number'
    ? priceInUSD
    : parseFloat(String(priceInUSD ?? '').replace(/[^0-9.]/g, ''));
  const num = Number.isFinite(parsed) ? parsed : 0;
  
  const curr = currencies[currencyKey] || currencies.USD;
  const converted = num * curr.rate;

  if (currencyKey === 'VND') {
    return Math.round(converted).toLocaleString('vi-VN') + ' ₫';
  } else if (currencyKey === 'JPY') {
    return '¥' + Math.round(converted).toLocaleString('ja-JP');
  } else {
    return curr.symbol + converted.toFixed(2);
  }
}
