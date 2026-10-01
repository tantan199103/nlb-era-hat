const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');
const regex = /<div[^>]*class="[^"]*product-card[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
const cards = [...html.matchAll(regex)];
cards.forEach((c, idx) => {
  console.log(`=== CARD ${idx + 1} ===`);
  console.log(c[0].slice(0, 800));
});
