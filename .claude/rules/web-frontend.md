---
paths:
  - "web/**"
---

# Quy tắc frontend

- Không có bước build, không framework: HTML, CSS, JavaScript thuần dạng ES module.
- Thư viện bên ngoài chỉ lấy từ `web/vendor/`, kèm phiên bản, nguồn và SHA-256 trong `web/vendor/README.md`. Ngoại lệ duy nhất: script Google Identity Services nạp từ `accounts.google.com`.
- Mọi lời gọi server đi qua một module duy nhất (`web/js/api.js`): POST `text/plain`, gắn `requestId` cho action ghi, đặt thời gian chờ, gửi lại với đúng `requestId` cũ, xử lý `SESSION_EXPIRED` bằng cách đưa về màn hình đăng nhập và giữ lại thao tác đang làm.
- Quét mã chỉ gọi qua `web/js/scanner.js`; không gọi trực tiếp thư viện quét ở màn hình.
- Không đưa dữ liệu vào trang bằng `innerHTML` hoặc ghép chuỗi HTML. Dùng `textContent` hoặc hàm tạo phần tử dùng chung.
- localStorage: mọi khóa có tiền tố `qltb.`. Khu vực quản lý chỉ lưu mã phiên và tùy chọn giao diện; dữ liệu quản lý (serie, người mượn, SĐT) chỉ giữ trong bộ nhớ.
- Ưu tiên điện thoại: bố cục từ 360 px, vùng chạm tối thiểu 44 px, không phụ thuộc thao tác rê chuột.
- Chuỗi giao diện tiếng Việt gom vào một file để dễ sửa câu chữ.
- Mọi màn hình có đủ ba trạng thái: đang tải, lỗi (kèm nút thử lại), rỗng.
- Kiểm tra giao diện bằng `npm run dev` ở khung rộng 360 px trước khi báo xong; phần cần camera và đăng nhập Google thật thì ghi vào `docs/KIEM-THU-THU-CONG.md` cho người dùng thử.
