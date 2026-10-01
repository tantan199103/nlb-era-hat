const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// Pins products
const pinsHandles = [
  'wu-tang-rhinestone-gold-chain',
  'wu-tang-rhinestone-silver-pin',
  'wu-tang-og-logo-pin',
  'hello-kitty-red-glitter-bow'
];

const pinItems = [];
pinsHandles.forEach((handle, i) => {
  const pos = html.indexOf(handle);
  if (pos !== -1) {
    const chunk = html.slice(pos - 400, pos + 1000);
    const titleM = chunk.match(/alt="([^"]+)"/i) || chunk.match(/>([^<]+)<\/span>/);
    const imgM = chunk.match(/src="([^">]+)"/i);
    const priceM = chunk.match(/\$\d+(\.\d{2})?/);

    pinItems.push({
      id: 5 + i,
      title: handle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      link: `/products/${handle}`,
      image: imgM ? (imgM[1].startsWith('//') ? 'https:' + imgM[1] : imgM[1]) : '',
      price: priceM ? priceM[0] : (i === 0 ? '$34.99' : '$14.99'),
      category: 'pins',
      sizes: [{ id: `pin-${i}`, size: 'ONE SIZE', price: priceM ? priceM[0] : '$14.99', disabled: false }]
    });
  }
});

console.log('Pin items:', pinItems);

const productsData = JSON.parse(fs.readFileSync('products_data.json', 'utf8'));
const allProducts = [...productsData, ...pinItems];
fs.writeFileSync('all_products.json', JSON.stringify(allProducts, null, 2));
console.log('Total combined products:', allProducts.length);
