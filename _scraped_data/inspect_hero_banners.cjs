const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'lidshd_full.html.bak'), 'utf8');

const banners = [
  'template--22327697309884__hero_banner_T7GJGm',
  'template--22327697309884__hero_banner_E7nHEV',
  'template--22327697309884__hero_banner_KxpWfX',
  'template--22327697309884__hero_banner_Kmx9Tj'
];

banners.forEach(b => {
  console.log(`\n================ ${b} ================`);
  const pos = html.indexOf(b);
  if (pos !== -1) {
    const chunk = html.slice(pos, pos + 3000);
    const imgs = [...chunk.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)].map(m => m[1]);
    const links = [...chunk.matchAll(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
    const text = chunk.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Images:', imgs);
    console.log('Links:', links);
    console.log('Text preview:', text.slice(0, 300));
  }
});
