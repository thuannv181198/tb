# Tiến độ

Đọc đầu mỗi phiên, cập nhật cuối mỗi phiên.

| Mốc | Trạng thái | Ghi chú |
| --- | --- | --- |
| Khởi động | Xong 12/11/2026 | Rà đặc tả, câu hỏi C1–C7, kế hoạch M0 |
| M0 | Nghiệm thu 13/11/2026 | Người dùng duyệt; C2, C6, C8 theo đề xuất |
| M1 | **Xong code 13/11/2026, chờ người dùng triển khai DEV và thử trên điện thoại** | `npm test` 76/76, `npm run lint` 0 lỗi |
| M2–M8 | Chưa làm | |

## M1 – Chạy thật: đăng nhập và phân quyền

### Đã làm

- Backend:
  - `Api.js`: `doPost`, `doGet`, bảng action trung tâm, kiểm tra phiên và vai trò, `requestId` lưu ở `KetQuaRequest` kèm bộ đệm, `BUSY`, `NhatKy` (Thành công, Từ chối, Lỗi).
  - `Auth.js`: tokeninfo kiểm tra aud, iss, email_verified, exp, tên miền và hd; mã phiên HMAC; "Phiên hợp lệ từ"; bộ đệm `nd:` 5 phút, xóa ngay khi sửa tài khoản; tài khoản (`user.*`), chủ sở hữu không khóa được.
  - `HeThong.js`: `config.get`, `config.save` (kiểm tra từng khóa, đổi tên tình trạng ghi lại cột 5 theo C4, chạy lại được), `app.bootstrap`.
  - Lưu đệm `CauHinh` (khóa `ch`), tăng `phienBanDuLieu`.
  - `appsscript.json`.
  - Thêm khóa C6.
- Frontend `web/`:
  - CSP theo hướng dẫn của Google Identity Services; `api.js` (POST text/plain, `requestId`, thời gian chờ 30 giây, Gửi lại, mất phiên);
  - đăng nhập Google; phát hiện Zalo, Messenger; màn hình chặn khi chưa đăng nhập mà quét QR;
  - điều hướng 2 khu vực theo vai trò; màn hình Tài khoản, Cấu hình;
  - PWA (manifest, icon); số phiên bản `?v=` ở mọi file.
- Công cụ:
  - `npm run dev` (máy phát triển, đăng nhập thử);
  - `npm run bump`, `npm run push:dev`;
  - workflow GitHub Pages.
- Đã xem giao diện ở khổ 360 px bằng Edge ẩn (13 màn hình): không lỗi JS, không lỗi CSP, không tràn ngang; localStorage chỉ có `qltb.session`.
- Rà soát độc lập: 2 điểm "Cần sửa", đã sửa và có kiểm thử tái hiện (chạy trên code cũ thì không đạt):
  - request ẩn danh gửi rác vào `auth.login` làm đầy `NhatKy`;
  - đổi tên tình trạng bị ngắt giữa chừng thì gửi lại không chạy tiếp.
- Tài liệu: `HUONG-DAN-TRIEN-KHAI.md` (Bước 1–12), `KIEM-THU-THU-CONG.md` (phần M1), cập nhật `HOP-DONG-DU-LIEU.md`, `QUYET-DINH.md` (Q22–Q30).

### Chưa kiểm chứng được

Đăng nhập Google thật, Apps Script thật, `smokeTest()` trên DEV, GitHub Pages, Zalo, điện thoại thật.

### Triển khai DEV (13/11/2026)

- Đã xong: Bước 1–3 (đăng nhập clasp, gh; tạo project "QLTB DEV", `npm run push:dev` 10 file); tạo repo công khai `thuannv181198/tb`, đẩy nhánh `main`.
- Bước 4–5: `setup()` chạy xong; `smokeTest()` trên DEV **13/13 ca đạt** (13/11/2026 19:40) – hành vi Sheet thật khớp giả định của bộ giả lập.
- Bước 9: GitHub Pages (nguồn GitHub Actions) chạy, `https://thuannv181198.github.io/tb/` trả HTTP 200.
- Bước 7: Claude Code triển khai web app DEV bằng `clasp create-deployment` (bản @1, 14/11/2026); gọi GET trả `"ok":true`; đã điền `API_URL` vào `web/config.js`.
- Sửa lỗi đỏ khi gõ `npx`: PowerShell chặn `npx.ps1` → `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (người dùng tự chạy).

### Chờ người dùng

1. ~~Đồng ý cài clasp và GitHub CLI~~ (đã xong).
2. Làm `HUONG-DAN-TRIEN-KHAI.md` Bước 6 (Client ID; gửi Claude Code để điền `web/config.js`), rồi Bước 11–12. Claude Code chạy giúp các lệnh `clasp`, `git push`.
3. Gửi nhật ký `smokeTest()`, Client ID, URL web app.
4. Chạy kiểm thử M1 trong `KIEM-THU-THU-CONG.md`, rồi báo kết quả.

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
