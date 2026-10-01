const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

const sectionIds = [
  'sections--22327692034236__header_section',
  'template--22327697309884__hero_banner_T7GJGm',
  'template--22327697309884__hero_banner_E7nHEV',
  'template--22327697309884__product_slider_F6HLc7',
  'template--22327697309884__collection_grid_ppF9NA',
  'template--22327697309884__product_slider_PHRUa6',
  'template--22327697309884__hero_banner_KxpWfX',
  'template--22327697309884__hero_banner_Kmx9Tj',
  'sections--22327691903164__new_footer_mNGDkR'
];

sectionIds.forEach(id => {
  const marker = `id="${id}"`;
  const pos = html.indexOf(marker);
  if (pos !== -1) {
    console.log(`\n================== SECTION: ${id} ==================`);
    const slice = html.slice(pos, pos + 12000);
    // Find images in this section
    const imgs = [...slice.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)].map(m => m[0]);
    // Find headings
    const headings = [...slice.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    // Find buttons/links
    const links = [...slice.matchAll(/<a[^>]+href="([^">]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({
      href: m[1],
      text: m[2].replace(/<[^>]+>/g, '').trim()
    })).filter(l => l.text);
    
    console.log('Headings:', headings);
    console.log('Sample links (first 5):', links.slice(0, 5));
    console.log('Images count:', imgs.length);
    if (imgs.length > 0) {
      console.log('First 2 images:');
      imgs.slice(0, 2).forEach(img => console.log('  ', img.slice(0, 150)));
    }
    // Also print snippet of clean text
    const cleanText = slice.slice(0, 1000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Text preview:', cleanText.slice(0, 250));
  }
});
