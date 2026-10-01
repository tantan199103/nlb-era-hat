const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'lidshd_full.html.bak'), 'utf8');

const sectionMatches = [...html.matchAll(/id="shopify-section-([^"]+)"/g)].map(m => m[1]);
console.log('=== SHOPIFY SECTIONS ===');
sectionMatches.forEach(s => console.log(' -', s));

// Search for any banners and text
console.log('\n=== HERO BANNERS & HEADINGS ===');
const headings = [...html.matchAll(/<h[1-5][^>]*>([\s\S]*?)<\/h[1-5]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
[...new Set(headings)].forEach(h => console.log(' Heading:', h));

// Sample image sources
console.log('\n=== BANNER IMAGES ===');
const imgs = [...html.matchAll(/<img[^>]+src="([^">]+)"[^>]*alt="([^"]*)"/gi)].map(m => ({ src: m[1], alt: m[2] }));
imgs.filter(i => i.src.includes('banner') || i.src.includes('files/') || i.alt.length > 5).slice(0, 15).forEach(i => {
  console.log(` Alt: "${i.alt}" | Src: ${i.src}`);
});
