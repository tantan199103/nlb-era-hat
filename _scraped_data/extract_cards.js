const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// Search for product card HTML blocks
// Let's find every block that contains a product link
const regex = /<div[^>]*class="[^"]*product-card[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
const cards = [...html.matchAll(regex)];

console.log('Product cards found by class:', cards.length);

// Let's search by slider item or card wrapper
const sliderRegex = /<li[^>]*class="[^"]*slider__slide[^"]*"[\s\S]*?<\/li>/gi;
const slides = [...html.matchAll(sliderRegex)];
console.log('Slider slides found:', slides.length);

const items = [];
slides.forEach(s => {
  const text = s[0];
  const titleM = text.match(/<h[2-4][^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h[2-4]>/i) 
    || text.match(/<a[^>]+class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  const imgM = text.match(/<img[^>]+src="([^">]+)"/i);
  const linkM = text.match(/<a[^>]+href="(\/products\/[^"]+)"/i);
  const priceM = text.match(/\$\d+(\.\d{2})?/);
  
  if (linkM) {
    items.push({
      title: titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : 'Fitted Cap',
      link: linkM[1],
      img: imgM ? (imgM[1].startsWith('//') ? 'https:' + imgM[1] : imgM[1]) : '',
      price: priceM ? priceM[0] : '$54.99'
    });
  }
});

console.log('Extracted slide items:', items.length);
console.log(items);
