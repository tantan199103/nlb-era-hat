const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// Extract all 8 products in full detail
const productCardRegex = /<div\s+class="product-card\s+block__custom-product-card[^"]*"[\s\S]*?<\/form><\/product-form-component>\s*<button[^>]*>Add to cart<\/button>\s*<\/div>\s*<\/div>/gi;
const cardBlocks = [...html.matchAll(productCardRegex)];

console.log('Matched complete card blocks:', cardBlocks.length);

const products = cardBlocks.map((b, idx) => {
  const content = b[0];
  const titleM = content.match(/alt="([^"]+)"/i);
  const linkM = content.match(/href="(\/products\/[^"?]+)/i);
  const imgM = content.match(/src="([^">]+)"/i);
  const priceM = content.match(/class="main-price">([^<]+)<\/span>/i) || content.match(/\$\d+(\.\d{2})?/);
  
  // Extract variants/sizes
  const sizes = [...content.matchAll(/<li[^>]*data-variant-id="([^"]*)"[^>]*data-variant-price="([^"]*)"(?: class="([^"]*)")?>([^<]+)<\/li>/gi)].map(m => ({
    id: m[1],
    price: m[2],
    disabled: (m[3] || '').includes('disable'),
    size: m[4].trim()
  }));

  return {
    id: idx + 1,
    title: titleM ? titleM[1] : `Product ${idx + 1}`,
    link: linkM ? linkM[1] : '#',
    image: imgM ? (imgM[1].startsWith('//') ? 'https:' + imgM[1] : imgM[1]) : '',
    price: priceM ? (priceM[1] || priceM[0]) : '$49.99',
    category: idx < 4 ? 'hats' : 'pins',
    sizes: sizes.length > 0 ? sizes : [
      { size: 'ONE SIZE', price: priceM ? (priceM[1] || priceM[0]) : '$14.99', disabled: false }
    ]
  };
});

fs.writeFileSync('products_data.json', JSON.stringify(products, null, 2));
console.log('Saved products_data.json:');
console.log(JSON.stringify(products, null, 2));
