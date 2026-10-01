const fs = require('fs');
const html = fs.readFileSync('lidshd_full.html', 'utf8');

// Find all css link tags
const cssLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi)].map(m => m[1]);
console.log('=== CSS STYLESHEETS ===');
console.log(cssLinks);

// Extract inline styles for typography, colors, fonts
const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
console.log('Total inline style tags:', inlineStyles.length);

// Search for font-family
const fontFamilies = new Set();
html.match(/font-family:\s*[^;]+/gi)?.forEach(f => fontFamilies.add(f.trim()));
console.log('Font families:', [...fontFamilies]);

// Search for colors
const colors = new Set();
html.match(/#[0-9a-fA-F]{3,6}/g)?.slice(0, 30).forEach(c => colors.add(c.toLowerCase()));
console.log('Sample colors:', [...colors]);
