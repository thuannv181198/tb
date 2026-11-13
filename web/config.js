/**
 * Cấu hình công khai của giao diện. Repo công khai: chỉ chứa địa chỉ, không chứa bí mật.
 * Điền theo docs/HUONG-DAN-TRIEN-KHAI.md sau khi deploy web app và tạo OAuth Client ID.
 * Khi chạy `npm run dev`, máy phát triển tự thay tệp này bằng cấu hình trên máy.
 */
export const CONFIG = Object.freeze({
  // Địa chỉ GitHub Pages của app; in vào tem QR, chốt trước khi in tem hàng loạt
  BASE_URL: 'https://thuannv181198.github.io/tb/',
  // OAuth Client ID loại Web application (dạng ...apps.googleusercontent.com)
  CLIENT_ID: '',
  // URL web app Apps Script (dạng https://script.google.com/macros/s/.../exec)
  API_URL: ''
});
