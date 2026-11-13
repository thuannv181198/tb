# Kiểm thử thủ công trên điện thoại

Những phần kiểm thử tự động không làm được: camera, đăng nhập Google thật, Apps Script và Google Sheet thật, trình duyệt nhúng của Zalo.

**Chuẩn bị:**

- 2 điện thoại;
- 3 Gmail: Gmail chủ sở hữu (Admin), một Gmail làm Quản lý, một Gmail làm Chỉ xem;
- một Gmail chưa được cấp quyền.

**Cách ghi kết quả:** ghi ĐẠT hoặc KHÔNG ĐẠT ở cột cuối, kèm ảnh chụp màn hình khi không đạt.

## M1 – Đăng nhập và phân quyền

Làm sau khi xong Bước 1–11 của `docs/HUONG-DAN-TRIEN-KHAI.md`.

| # | Thao tác | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- |
| 1.1 | Chạy `smokeTest()` trên DEV (Bước 5) | "KẾT QUẢ smokeTest: 13/13 ca đạt". Chép nhật ký gửi Claude Code | |
| 1.2 | Điện thoại 1, Chrome: mở `https://thuannv181198.github.io/tb/` | Trang **Tìm thiết bị**; thanh dưới có Tìm thiết bị, Danh sách mượn, Yêu cầu của tôi; góc trên có **Đăng nhập quản lý** | |
| 1.3 | Bấm **Đăng nhập quản lý** → **Đăng nhập bằng Google** → Gmail chủ sở hữu | Vào **Hôm nay**, ghi vai trò Admin. Thanh dưới có Hôm nay, Đang mượn, Quét QR (nút giữa to), Danh sách, Thêm | |
| 1.4 | **Thêm** → **Tài khoản** → thêm Gmail Quản lý (vai trò Quản lý) và Gmail Chỉ xem (vai trò Chỉ xem) | Mỗi lần Lưu đều có hộp xác nhận; danh sách hiện đủ; chủ sở hữu có nhãn "Chủ sở hữu", không có nút Khóa | |
| 1.5 | Điện thoại 2: đăng nhập bằng Gmail Quản lý | Thấy nút **Quét QR**. Trong **Thêm** không có Tài khoản, Cấu hình | |
| 1.6 | Điện thoại 2: đăng xuất (Thêm → Đăng xuất), đăng nhập bằng Gmail Chỉ xem | Không có nút Quét QR. Gõ thêm `#/cauhinh` vào cuối địa chỉ → "Bạn không có quyền mở màn hình này" | |
| 1.7 | Điện thoại 2: đăng xuất, đăng nhập bằng Gmail chưa được cấp quyền | Báo "Tài khoản chưa được cấp quyền" | |
| 1.8 | Điện thoại 2 đăng nhập lại bằng Gmail Quản lý. Điện thoại 1 (Admin): Tài khoản → Gmail Quản lý → **Đăng xuất mọi thiết bị** → Xác nhận. Điện thoại 2: tải lại trang (kéo xuống để làm mới) | Điện thoại 2 báo "Phiên đăng nhập đã hết hạn" và về màn hình đăng nhập | |
| 1.9 | Điện thoại 1: **Khóa** Gmail Quản lý. Điện thoại 2 thử đăng nhập lại | Báo "Tài khoản chưa được cấp quyền". Mở khóa lại sau khi thử | |
| 1.10 | Mở Google Sheet DEV → sheet `NhatKy` | Có dòng đăng nhập (Thành công), dòng "Từ chối" của bước 1.7, dòng sửa tài khoản, đăng xuất mọi thiết bị | |
| 1.11 | Điện thoại 1: **Thêm** → **Cấu hình** → đổi "Hạn mượn mặc định" thành 3 → **Lưu** → Xác nhận. Tải lại trang, mở lại Cấu hình | Giá trị là 3. Đổi lại thành 2 | |
| 1.12 | Cấu hình: đặt "Bật mã truy cập" = Có nhưng để trống mã → Lưu | Báo "Bật mã truy cập thì phải đặt mã 4–6 chữ số", không lưu | |
| 1.13 | Điện thoại 1: bật **chế độ máy bay**, thêm một tài khoản thử → Lưu → Xác nhận | Báo mất kết nối, nút đổi thành **Gửi lại**, dữ liệu đang nhập còn nguyên | |
| 1.14 | Tắt chế độ máy bay → bấm **Gửi lại** | Lưu thành công. Sheet `NguoiDung` chỉ có 1 dòng cho tài khoản đó | |
| 1.15 | Gửi link app vào một nhóm Zalo, mở link từ Zalo | Dải vàng "Mở bằng Chrome hoặc Safari để dùng đầy đủ" và nút **Chép link**; không có nút Đăng nhập quản lý | |
| 1.16 | Trên trình duyệt chưa đăng nhập (cửa sổ ẩn danh), mở `https://thuannv181198.github.io/tb/?tb=THU-001` | Thông báo "Chỉ người quản lý được thao tác bằng mã QR" kèm nút đăng nhập. Sheet `NhatKy` không có dòng mới | |
| 1.17 | Chrome Android: menu ⋮ → **Thêm vào màn hình chính**. iPhone Safari: **Chia sẻ** → **Thêm vào MH chính** | Biểu tượng xanh "CNNL"; mở lên không có thanh địa chỉ | |
| 1.18 | Điện thoại 1: **Thêm** → cuối trang | Hiện "Phiên bản giao diện 0.2.0 · máy chủ 0.2.0" | |
