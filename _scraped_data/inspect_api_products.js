const fs = require('fs');
const products = JSON.parse(fs.readFileSync('lidshd_products_api.json', 'utf8'));

console.log('Total products loaded:', products.length);
console.log('Sample product 1:');
console.log({
  title: products[0].title,
  handle: products[0].handle,
  product_type: products[0].product_type,
  tags: products[0].tags,
  images_count: products[0].images.length,
  variants_count: products[0].variants.length,
  sample_price: products[0].variants[0]?.price,
  sample_sizes: products[0].variants.map(v => v.title).slice(0, 8),
  first_image: products[0].images[0]?.src
});

console.log('\nAll 30 product titles:');
products.forEach((p, idx) => console.log(`${idx + 1}. [${p.product_type || 'Cap'}] ${p.title} - $${p.variants[0]?.price || '49.99'}`));
