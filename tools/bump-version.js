'use strict';

/**
 * Đổi số phiên bản giao diện ở mọi chỗ cùng lúc: web/js/version.js, tham số ?v= trong index.html
 * và trong mọi lệnh import của web/js. Dùng: npm run bump -- 0.3.0
 * Điện thoại nhận bản mới vì đường dẫn file đổi theo số phiên bản (đặc tả mục 10).
 */
const fs = require('node:fs');
const path = require('node:path');

const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next || '')) {
  console.error('Cách dùng: npm run bump -- <x.y.z>');
  process.exit(1);
}
const WEB = path.join(__dirname, '..', 'web');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'vendor' ? [] : walk(p);
    return /\.(js|html)$/.test(d.name) ? [p] : [];
  });
}

let changed = 0;
for (const file of walk(WEB)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before.replace(/\?v=\d+\.\d+\.\d+/g, `?v=${next}`);
  if (file.endsWith(path.join('js', 'version.js'))) {
    after = after.replace(/VERSION = '\d+\.\d+\.\d+'/, `VERSION = '${next}'`);
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}
console.log(`Đã đổi phiên bản thành ${next} ở ${changed} tệp.`);
