const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// 1. Find all sections and their exact HTML boundary
const sectionRegex = /<div id="shopify-section-([^"]+)" class="shopify-section([^"]*)">([\s\S]*?)<\/div>\s*<\/div>/g;
// Or let's inspect the main content
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

console.log('Main element found:', !!mainMatch);

// Let's find all product cards / items across the whole page
// In modern Shopify themes (Dawn / custom), products are usually inside class="card-wrapper" or "product-card" or "card"
const productBlocks = [];
const pRegex = /<a[^>]+href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
let m;
const seen = new Set();
while ((m = pRegex.exec(html)) !== null) {
  const href = m[1].split('?')[0];
  if (!seen.has(href)) {
    seen.add(href);
    // Find enclosing block or image
    const pIdx = m.index;
    const surrounding = html.slice(Math.max(0, pIdx - 500), Math.min(html.length, pIdx + 1200));
    
    // Look for image
    const imgMatch = surrounding.match(/<img[^>]+src="([^">]+)"[^>]*alt="([^"]*)"/i) 
      || surrounding.match(/<img[^>]+src="([^">]+)"/i);
    // Look for price
    const priceMatch = surrounding.match(/\$\d+(\.\d{2})?/g);
    
    // Look for title
    const titleMatch = surrounding.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i);
    const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();

    productBlocks.push({
      handle: href.replace('/products/', ''),
      url: href,
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : rawTitle,
      img: imgMatch ? imgMatch[1] : null,
      price: priceMatch ? priceMatch[0] : '$54.99'
    });
  }
}

console.log('\nTotal unique products extracted:', productBlocks.length);
console.log('Sample products:');
console.log(JSON.stringify(productBlocks.slice(0, 15), null, 2));

// Check hero banners in detail
console.log('\n=== HERO BANNERS & PROMOS ===');
const heroMatches = [...html.matchAll(/hero_banner[^\n]*>([\s\S]*?)(?:<div id="shopify-section-|\s*<\/main>)/gi)];
console.log('Hero matches count:', heroMatches.length);
heroMatches.forEach((hm, i) => {
  console.log(`\n--- Hero ${i + 1} ---`);
  const imgs = [...hm[1].matchAll(/<img[^>]+src="([^">]+)"/gi)].map(x => x[1]);
  const links = [...hm[1].matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(x => ({
    href: x[1],
    text: x[2].replace(/<[^>]+>/g, '').trim()
  })).filter(x => x.text);
  const text = hm[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('Images:', imgs);
  console.log('Links:', links);
  console.log('Text snippet:', text.slice(0, 200));
});

// Check collection grid
const collGrid = html.match(/collection_grid[^\n]*>([\s\S]*?)(?:<div id="shopify-section-|\s*<\/main>)/i);
if (collGrid) {
  console.log('\n=== COLLECTION GRID ===');
  const cLinks = [...collGrid[1].matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(x => ({
    href: x[1],
    text: x[2].replace(/<[^>]+>/g, '').trim()
  })).filter(x => x.text);
  const cImgs = [...collGrid[1].matchAll(/<img[^>]+src="([^">]+)"/gi)].map(x => x[1]);
  console.log('Collection Links:', cLinks);
  console.log('Collection Images:', cImgs);
}
