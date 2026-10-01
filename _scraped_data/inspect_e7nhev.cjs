const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'lidshd_full.html.bak'), 'utf8');

const pos = html.indexOf('template--22327697309884__hero_banner_E7nHEV');
if (pos !== -1) {
  const chunk = html.slice(pos, pos + 5000);
  console.log(chunk.slice(0, 2500));
}
