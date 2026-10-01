const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'lidshd_full.html.bak'), 'utf8');

const pos = html.indexOf('template--22327697309884__collection_grid_ppF9NA');
if (pos !== -1) {
  const chunk = html.slice(pos, pos + 6000);
  const imgs = [...chunk.matchAll(/<img[^>]+src="([^">]+)"[^>]*alt="([^"]*)"/gi)].map(m => ({ src: m[1], alt: m[2] }));
  const links = [...chunk.matchAll(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }));
  console.log('Collection grid images:', imgs);
  console.log('Collection grid links:', links.slice(0, 10));
}
