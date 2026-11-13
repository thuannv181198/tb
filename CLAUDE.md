# QLTB – Quản lý thiết bị phòng thực hành

Web app cho mượn và nhận lại thiết bị bằng mã QR cho Khoa Công nghệ Năng lượng. Backend Google Apps Script + Google Sheet, frontend HTML/CSS/JS thuần trên GitHub Pages. Chi phí vận hành bằng 0. Người giao việc và người vận hành không phải lập trình viên.

## Tài liệu

Đọc đúng phần cần cho việc đang làm, không đọc hết một lượt.

- `docs/spec/01-tong-quan.md` – mục 1: mục tiêu, ngoài phạm vi, quy mô, thông số
- `docs/spec/02-kien-truc-bao-mat.md` – mục 2–3: kiến trúc, quy ước API, giới hạn nền tảng, phân quyền
- `docs/spec/03-du-lieu.md` – mục 4–5: sheet, cột, quy tắc mã, tình trạng
- `docs/spec/04-quy-trinh.md` – mục 6–9: mượn, nhận lại, biên bản, nhập hàng, tính năng khác
- `docs/spec/05-giao-dien.md` – mục 10: giao diện
- `docs/KE-HOACH.md` – các mốc M0–M8, tiêu chí hoàn thành, kiểm thử bắt buộc
- `docs/CAU-HOI-MO.md` – điểm chờ người dùng quyết; chưa có trả lời thì theo cột "Mặc định"
- `docs/HOP-DONG-DU-LIEU.md` – nguồn sự thật về tên sheet, cột, action, mã lỗi (tạo ở M0)
- `docs/TIEN-DO.md`, `docs/QUYET-DINH.md` – đọc đầu mỗi phiên, cập nhật cuối mỗi phiên

Khi đặc tả và hợp đồng dữ liệu khác nhau: dừng lại hỏi, không tự chọn.

## Lệnh

Được tạo ở M0; sửa mục này nếu tên lệnh đổi.

- `npm test` – toàn bộ kiểm thử backend, chạy trên Node với dịch vụ Google giả lập
- `npm test -- <đường dẫn file>` – chạy một file kiểm thử
- `npm run lint`
- `npm run dev` – chạy frontend và backend giả lập trên máy
- `npm run push:dev` – đẩy `gas/` lên project Apps Script DEV
- Tên lệnh clasp thay đổi giữa các phiên bản: chạy `npx clasp --help` trước khi dùng, không đoán.

Máy phát triển là Windows: viết script bằng Node, không viết script bash.

## Cấu trúc

- `gas/` – backend Apps Script, đẩy lên bằng clasp
- `web/` – frontend, phát hành lên GitHub Pages; thư viện bên ngoài nằm trong `web/vendor/`
- `tests/` – kiểm thử và bộ giả lập dịch vụ Google
- `tools/` – script Node cho dev và triển khai
- `docs/` – đặc tả, kế hoạch, hướng dẫn

## Bất biến

1. Chi phí bằng 0: không thêm dịch vụ trả phí, không thêm server.
2. Repo công khai: không commit bí mật, email cá nhân, số điện thoại, dữ liệu thật, `.clasprc.json`.
3. Mọi kiểm tra quyền và kiểm tra dữ liệu thực hiện ở server; ẩn nút trên giao diện không phải là phân quyền.
4. Không đổi tên sheet, cột, action, mã lỗi đã có trong hợp đồng dữ liệu khi chưa hỏi. Đổi cấu trúc thì kèm bước nâng cấp.
5. Kiểm thử không bao giờ chạm vào Sheet thật. Project PROD chỉ người dùng deploy.
6. Không thêm tính năng ngoài đặc tả, kể cả khi thấy hữu ích; ghi đề xuất vào `docs/CAU-HOI-MO.md`.

## Cách làm việc

- Mỗi lần làm một mốc, theo "Quy trình cho mỗi mốc" trong `docs/KE-HOACH.md`.
- Thiếu dữ kiện hoặc đặc tả mâu thuẫn: dừng lại hỏi. Không tự đặt ra quy tắc nghiệp vụ.
- Số liệu hạn mức, cú pháp dòng lệnh, các bước bấm trên giao diện Google và GitHub thay đổi thường xuyên: tra tài liệu chính thức lúc viết và ghi đường dẫn nguồn, không viết theo trí nhớ.
- Hỏi trước khi: deploy, `git push`, cài thêm thư viện, xóa file ngoài phạm vi mốc, đổi hợp đồng dữ liệu.
- Khi báo xong: kèm kết quả thật của `npm test` và `npm run lint`, nêu phần chưa kiểm chứng được và phần người dùng phải thử tay trên điện thoại.
- Trả lời người dùng bằng tiếng Việt, ngắn gọn. Việc cần người dùng tự bấm thì ghi từng bước, mỗi bước một thao tác.

## Quy ước code

- Chú thích và chuỗi giao diện bằng tiếng Việt; tên hàm, biến, file bằng tiếng Anh, đặt nhất quán.
- Quy tắc riêng cho backend và frontend nằm trong `.claude/rules/`, tự nạp khi làm việc với `gas/`, `tests/`, `web/`.

## Khi nén hội thoại

Giữ lại: mốc đang làm, danh sách file đã sửa, lệnh kiểm thử, các câu hỏi đang chờ người dùng trả lời.
