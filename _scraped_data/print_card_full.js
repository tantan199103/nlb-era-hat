const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');
const regex = /<div[^>]*class="[^"]*product-card[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
const card1 = regex.exec(html);
if (card1) {
  console.log(card1[0]);
}
