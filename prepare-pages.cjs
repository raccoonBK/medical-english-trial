const fs = require('node:fs');
const path = require('node:path');

const output = path.join(__dirname, 'dist');
const indexPath = path.join(output, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('<html lang="en">', '<html lang="zh-CN">');
html = html.replace('You need to enable JavaScript to run this app.', '请启用浏览器脚本以体验试学。');
fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
