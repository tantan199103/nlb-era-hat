const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// Section names
const sectionMatches = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map(m => m[1]);
console.log('=== SHOPIFY SECTIONS ===');
console.log(sectionMatches);

// Announcement bar
const annMatch = html.match(/class="[^"]*announcement[^"]*"[\s\S]*?<\/div>/gi);
console.log('\n=== ANNOUNCEMENT BARS ===');
if (annMatch) {
  annMatch.forEach(a => console.log(a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));
}

// Banners / Hero
const banners = [...html.matchAll(/<div[^>]*class="[^"]*(?:banner|hero|slideshow|image-with-text|featured)[^"]*"[\s\S]*?<\/div>/gi)];
console.log('\n=== BANNER DIVS FOUND ===', banners.length);

// Let's inspect products in the grid
console.log('\n=== PRODUCTS DATA ===');
// Often Shopify outputs items with product-card, product-item, or has data-product-id
const productMatches = [...html.matchAll(/<li[^>]*class="[^"]*grid__item[^"]*"[\s\S]*?<\/li>/gi)];
console.log('Grid items found:', productMatches.length);

if (productMatches.length > 0) {
  productMatches.slice(0, 10).forEach((p, idx) => {
    const text = p[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const img = p[0].match(/<img[^>]+src="([^">]+)"/i);
    const link = p[0].match(/<a[^>]+href="([^">]+)"/i);
    console.log(`[Product ${idx + 1}]`);
    console.log('  Text:', text.slice(0, 120));
    console.log('  Img:', img ? img[1] : 'none');
    console.log('  Link:', link ? link[1] : 'none');
  });
}

// Also check any hero/featured drop banners
const heroImages = [...html.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)]
  .map(m => m[0])
  .filter(img => img.includes('banner') || img.includes('LHD') || img.includes('width=') || img.includes('drop'));
console.log('\n=== HERO / BANNER IMAGES ===');
console.log(heroImages.slice(0, 10));
