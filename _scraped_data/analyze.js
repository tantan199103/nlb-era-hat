const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

console.log('=== ANALYZING LIDSHD.COM ===');

// 1. Shopify Sections
const sectionMatches = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map(m => m[1]);
console.log('\n--- SHOPIFY SECTIONS ---');
console.log(sectionMatches);

// 2. Navigation items
const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
if (navMatch) {
  const links = [...navMatch[1].matchAll(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, '').trim()
  })).filter(l => l.text);
  console.log('\n--- MAIN NAV ---');
  console.log(links);
}

// 3. Header & Announcement Bar
const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
console.log('\n--- HEADER FOUND ---', !!headerMatch);

// 4. Products mentioned or displayed
const productCards = [...html.matchAll(/class="[^"]*product-card[^"]*"[\s\S]*?<\/div>/gi)];
console.log('\n--- PRODUCT CARD COUNT ---', productCards.length);

// Extract titles/prices
const products = [];
const cardRegex = /<a[^>]*class="[^"]*product[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
// Let's also look for product JSON or Collection data
const scriptJson = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
console.log('\n--- JSON SCRIPTS COUNT ---', scriptJson.length);

// 5. Look for images, banners, logos
const images = [...html.matchAll(/<img[^>]+src="([^">]+)"[^>]*alt="([^"]*)"/gi)].map(m => ({
  src: m[1],
  alt: m[2]
}));
console.log('\n--- IMAGES (Sample 15) ---');
console.log(images.slice(0, 15));

// 6. Look for drops / release schedule / banner headlines
const headings = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
console.log('\n--- HEADINGS ---');
console.log([...new Set(headings)]);

// 7. Footer structure
const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
if (footerMatch) {
  const footerLinks = [...footerMatch[1].matchAll(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, '').trim()
  })).filter(l => l.text);
  console.log('\n--- FOOTER LINKS ---');
  console.log(footerLinks);
}
