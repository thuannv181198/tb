# Tiến độ

Đọc đầu mỗi phiên, cập nhật cuối mỗi phiên.

| Mốc | Trạng thái | Ghi chú |
| --- | --- | --- |
| Khởi động | Xong 12/11/2026 | Rà đặc tả, câu hỏi C1–C7, kế hoạch M0 |
| M0 | **Xong code 13/11/2026, chờ người dùng duyệt `docs/HOP-DONG-DU-LIEU.md`** | `npm test` 52/52, `npm run lint` 0 lỗi |
| M1–M8 | Chưa làm | |

## M0 – Nền móng và hợp đồng dữ liệu

### Đã làm

- Repo:
  - `package.json` với lệnh `test` và `lint`; `.gitignore` có sẵn từ bộ kit;
  - ESLint 10 (`eslint.config.js`): khai báo biến toàn cục cho `gas/`, cấm `import`/`export`, cấm `console.log` trong backend.
- Backend `gas/`:
  - `Config.js`: 25 sheet và cột, 8 tình trạng, 46 khóa `CauHinh`, Script Properties, loại mã.
  - `Util.js`: chuẩn hóa chuỗi, mã nhóm, làm sạch đầu vào, thời gian giờ Việt Nam, định dạng mã, mã xác nhận.
  - `Repo.js`:
    - đọc theo tên cột, ghi theo khối; dòng mới đặt định dạng trước khi ghi;
    - `withLock` luôn flush rồi nhả khóa trong `finally`;
    - `nextCodes` (lấy số từ `BoDem`), `nextDeviceCodes` (cấp Mã TB);
    - đọc `CauHinh`, quy đổi tên tình trạng.
  - `Migrations.js`: bước nâng cấp theo `SCHEMA_VERSION`, ghi version sau từng bước.
  - `Setup.js`:
    - `setup()` tạo Sheet, thư mục Drive và 5 thư mục con, Script Properties;
    - đặt định dạng văn bản thuần, cố định và bảo vệ tiêu đề, danh sách thả xuống;
    - tạo dữ liệu ban đầu: cấu hình, phòng 201-VNB, Admin;
    - thêm lại sheet hoặc cột bị xóa nhầm.
  - `SmokeTest.js`: 13 ca kiểm chứng trên Google thật; từ chối chạy khi `MOI_TRUONG` khác `DEV`.
- Kiểm thử `tests/`:
  - bộ giả lập 10 dịch vụ Google; bảng tính giả mô phỏng việc Sheet tự đổi kiểu và tự biến chuỗi thành công thức; gọi phương thức chưa giả lập thì báo lỗi;
  - đồng hồ giả;
  - 52 ca kiểm thử, phủ đủ "Kiểm thử bắt buộc" của M0.
- Kiểm tra bằng cách cố ý làm hỏng code (bỏ dấu nháy; bỏ định dạng văn bản): kiểm thử đều phát hiện.
- Rà soát độc lập (`spec-reviewer`) ra 4 điểm "Cần sửa", đã sửa cả 4:
  - `withLock` flush cả khi lỗi;
  - `Repo.append` bắt buộc khóa;
  - thêm `nextDeviceCodes` cho Mã TB;
  - hợp đồng dữ liệu bổ sung tham số, kết quả, lỗi cho mọi action M2–M8.
- Tài liệu:
  - `docs/HOP-DONG-DU-LIEU.md`, `docs/QUYET-DINH.md` (Q1–Q21);
  - `docs/CAU-HOI-MO.md`: thêm câu hỏi C8.

### Chưa kiểm chứng được

- Hành vi thật của Google Sheet với dấu nháy đơn, định dạng văn bản thuần và công thức. Phải chạy `smokeTest()` trên project DEV, việc này làm ở M1 khi đã có clasp và project DEV.
- `KIEM-THU-THU-CONG.md` và `HUONG-DAN-TRIEN-KHAI.md` chưa tạo: M0 chưa có thao tác nào người dùng làm trên Google hay điện thoại. Hai file này được tạo ở M1.

### Người dùng cần làm để nghiệm thu M0

1. Đọc `docs/HOP-DONG-DU-LIEU.md`, chủ yếu mục 3 (khóa cấu hình), mục 4 (sheet, cột), mục 6 (mã) và mục 7.5 (danh sách chức năng).
2. Trả lời các câu C2, C6, C8 trong `docs/CAU-HOI-MO.md`, hoặc đồng ý theo phương án đề xuất.
3. Báo "duyệt M0" hoặc ghi chỗ cần sửa.

## Mốc tiếp theo: M1 – Chạy thật: đăng nhập và phân quyền

Mở phiên mới ngay trong thư mục `qltb` rồi gửi lời giao việc M1 trong `HUONG-DAN-GIAO-VIEC.md`. M1 cần người dùng làm:

- đồng ý cài `@google/clasp`;
- đăng nhập clasp bằng tài khoản chủ sở hữu;
- bật Apps Script API;
- tạo OAuth Client ID;
- tạo repo GitHub và bật Pages.

Các bước chi tiết sẽ có trong `docs/HUONG-DAN-TRIEN-KHAI.md`.
