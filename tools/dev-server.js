'use strict';

/**
 * npm run dev: chạy giao diện web/ cùng backend gas/ trên bộ giả lập Google, không cần tài khoản Google.
 * - http://localhost:8080 phục vụ web/; riêng /config.js thay bằng cấu hình máy phát triển (API_URL = /api).
 * - POST /api chuyển vào doPost của backend (mỗi request là một lần chạy mới, dữ liệu giữ trong bộ nhớ).
 * - Đăng nhập thử: ID token dạng "dev:<email>" được tokeninfo giả chấp nhận. Chỉ có ở đây, không có trong gas/.
 * Biến môi trường: PORT (mặc định 8080), DEV_CLIENT_ID (Client ID thật nếu muốn thử nút Google trên localhost).
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { loadGas } = require('../tests/load-gas');

const PORT = Number(process.env.PORT || 8080);
const WEB_DIR = path.join(__dirname, '..', 'web');
const DEV_CLIENT_ID = process.env.DEV_CLIENT_ID || 'dev-client-id';
const ACCOUNTS = [
  ['admin.dev@gmail.com', 'Admin'],
  ['quanly.dev@gmail.com', 'Quản lý'],
  ['chixem.dev@gmail.com', 'Chỉ xem']
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createBackend() {
  const { gas, env } = loadGas({
    email: ACCOUNTS[0][0],
    props: { CLIENT_ID: DEV_CLIENT_ID, MOI_TRUONG: 'DEV' },
    now: Date.now()
  });
  // Đồng hồ giả chạy theo đồng hồ thật
  env.state.clock.now = () => Date.now();
  gas.setup();
  const run = env.newExecution().gas;
  run.Repo.withLock(() => {
    const t = run.Repo.table('NguoiDung');
    ACCOUNTS.slice(1).forEach(([email, role]) => {
      t.append({ 'Email': email, 'Họ tên': `Tài khoản thử (${role})`, 'Vai trò': role, 'Trạng thái': 'Hoạt động', 'Ngày tạo': new run.Date() });
    });
    t.flush();
  });
  env.state.urlFetch.handler = (url) => {
    const token = decodeURIComponent(url.split('id_token=')[1] || '');
    if (!token.startsWith('dev:')) return { code: 400, body: { error: 'invalid_token' } };
    return {
      code: 200,
      body: {
        aud: DEV_CLIENT_ID, iss: 'https://accounts.google.com', email: token.slice(4),
        email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) + 3600)
      }
    };
  };
  return env;
}

const backend = createBackend();

function devConfig() {
  return [
    '// Cấu hình máy phát triển do tools/dev-server.js tạo, không phải web/config.js',
    'export const CONFIG = Object.freeze({',
    `  BASE_URL: 'http://localhost:${PORT}/',`,
    `  CLIENT_ID: ${JSON.stringify(process.env.DEV_CLIENT_ID || '')},`,
    "  API_URL: '/api',",
    '  DEV_LOGIN: true',
    '});',
    ''
  ].join('\n');
}

function sendFile(res, urlPath) {
  const rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  const file = path.normalize(path.join(WEB_DIR, rel));
  if (!file.startsWith(WEB_DIR)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không có tệp');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'POST' && url.pathname === '/api') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      let out;
      try {
        out = backend.newExecution().gas.doPost({ postData: { contents: body } }).getContent();
      } catch (err) {
        out = JSON.stringify({ ok: false, error: { code: 'SERVER_ERROR', message: 'Lỗi máy phát triển: ' + err.message } });
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(out);
    });
    return;
  }
  if (req.method !== 'GET') {
    res.writeHead(405).end();
    return;
  }
  if (url.pathname === '/config.js') {
    res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' });
    res.end(devConfig());
    return;
  }
  sendFile(res, url.pathname);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Máy phát triển: http://localhost:${PORT}`);
  console.log('Tài khoản thử: ' + ACCOUNTS.map(([e, r]) => `${e} (${r})`).join(', '));
});
