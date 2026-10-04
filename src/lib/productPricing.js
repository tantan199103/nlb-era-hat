import { parseAmount } from './adminOperations.js';

export function selectedProductVariant(product, selection) {
  return (product?.sizes || []).find(variant => variant.size === selection)
    || (product?.sizes?.length === 1 ? product.sizes[0] : null);
}

export function selectedProductPrice(product, selection) {
  return selectedProductVariant(product, selection)?.price ?? product?.price;
}

export function productPriceRange(product) {
  const prices = (product?.sizes || []).map(variant => parseAmount(variant.price ?? product.price)).filter(Number.isFinite);
  if (!prices.length) return { min: parseAmount(product?.price), max: parseAmount(product?.price) };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
