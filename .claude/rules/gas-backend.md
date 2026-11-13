---
paths:
  - "gas/**"
  - "tests/**"
---

# Quy tắc backend Apps Script

## Tổ chức code

- Runtime V8, không có `import`/`export`: mọi file trong `gas/` chung một phạm vi toàn cục. Gom hàm theo đối tượng không gian tên (`Auth`, `Repo`, `MuonTra`...) để không trùng tên.
- Tách ba lớp: router (`doPost` → bảng action) → nghiệp vụ (hàm thuần: nhận dữ liệu, trả kết quả, không gọi dịch vụ Google) → truy cập dữ liệu (`Repo`: đọc, ghi Sheet, Drive, Cache). Kiểm thử nhắm vào lớp nghiệp vụ.
- Mỗi action khai báo ở một bảng trung tâm duy nhất: tên, vai trò được gọi, có ghi dữ liệu hay không, hàm xử lý. Router dựa vào bảng này để kiểm tra phiên, quyền và `requestId`. Thêm action nào thì cập nhật `docs/HOP-DONG-DU-LIEU.md` và thêm kiểm thử "vai trò không đủ quyền bị từ chối" cho action đó.
- Không có cửa sau đăng nhập trong `gas/`. Đăng nhập giả để chạy trên máy chỉ nằm trong `tools/` và `tests/`.

## Đọc, ghi Sheet

- Đọc theo tên tiêu đề cột, không theo vị trí (riêng cột 1–9 của `ThietBi` cố định thứ tự).
- Đọc và ghi theo khối (`getValues`, `setValues`); không gọi dịch vụ Google trong vòng lặp.
- Action ghi theo đúng trình tự ở mục 2.2 của đặc tả: khóa → đọc → kiểm tra → ghi → `flush()` → nhả khóa trong `finally`.
- Mã và chuỗi số (Mã TB, serie, SĐT, mã xác nhận) luôn là chuỗi; chuẩn hóa trước khi so sánh; cột tương ứng ở định dạng văn bản thuần.
- Chuỗi người dùng nhập đi qua một hàm làm sạch chung trước khi ghi (chặn chèn công thức).
- Ngày giờ: lưu giá trị `Date`; định dạng bằng `Utilities.formatDate` với múi giờ `Asia/Ho_Chi_Minh`; không phân tích chuỗi dd/MM/yyyy bằng `new Date(chuỗi)`.
- CacheService chỉ là bộ đệm: code phải chạy đúng khi mọi khóa đệm đều trống.

## An toàn dữ liệu

- Không ghi họ tên, SĐT, email người mượn ra `console` hoặc `Logger`.
- Bí mật chỉ nằm trong Script Properties; mỗi lần chạy đọc một lần bằng `getProperties()`.
- Lỗi trả cho trình duyệt chỉ gồm `code` và `message` tiếng Việt; không trả stack trace.

## Kiểm thử

- Kiểm thử chạy trên Node bằng bộ giả lập trong `tests/`. Bộ giả lập chỉ cài các phương thức backend thật sự dùng; gọi phương thức chưa giả lập thì ném lỗi, không trả giá trị mặc định.
- Điều gì bộ giả lập chỉ phỏng đoán về hành vi thật của Google (định dạng ô, chèn công thức, khóa, bộ đệm) thì thêm một ca vào `smokeTest()` để người dùng chạy trên project DEV. `smokeTest()` từ chối chạy khi môi trường không phải DEV.
- Sửa lỗi: viết kiểm thử tái hiện lỗi trước, rồi mới sửa.
