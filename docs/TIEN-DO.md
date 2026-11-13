# Tiến độ

Đọc đầu mỗi phiên, cập nhật cuối mỗi phiên.

| Mốc | Trạng thái | Ghi chú |
| --- | --- | --- |
| Khởi động | Xong 12/11/2026 | Đã rà đặc tả, ghi câu hỏi C1–C7 vào `docs/CAU-HOI-MO.md`, lập kế hoạch M0 (bên dưới) |
| M0 | **Chờ duyệt kế hoạch** | |
| M1–M8 | Chưa làm | |

## Kế hoạch M0 – Nền móng và hợp đồng dữ liệu (chờ người dùng duyệt)

### Cây thư mục

```
qltb/
├── package.json            lệnh: test, lint (M0); dev, push:dev (M1)
├── eslint.config.js
├── gas/                    file .js; clasp đẩy lên thành .gs (M1)
│   ├── Config.js           hằng số, định nghĩa sheet và cột, mã tình trạng, khóa CauHinh mặc định
│   ├── Util.js             hàm thuần: chuẩn hóa chuỗi, làm sạch đầu vào, thời gian, mã nhóm
│   ├── Repo.js             đọc theo tên cột, ghi theo khối, ghi nối tiếp; BoDem; KetQuaRequest
│   ├── Migrations.js       các bước nâng cấp đánh số theo SCHEMA_VERSION
│   ├── Setup.js            setup(): Sheet, thư mục Drive, định dạng, validation, bảo vệ tiêu đề, dữ liệu ban đầu
│   └── SmokeTest.js        smokeTest(): chỉ chạy khi Script Property MOI_TRUONG = DEV (C5)
├── tests/
│   ├── fakes/              giả lập SpreadsheetApp, PropertiesService, CacheService, LockService,
│   │                       DriveApp, MailApp, UrlFetchApp, Utilities, Session, ContentService
│   ├── load-gas.js         nạp mọi file gas/*.js vào một vm context chung với bộ giả lập
│   └── *.test.js
└── docs/                   HOP-DONG-DU-LIEU.md, TIEN-DO.md, QUYET-DINH.md (mới) + các file sẵn có
```

`web/`, `tools/`, `appsscript.json` làm ở M1.

### Công cụ kiểm thử

- Trình chạy có sẵn của Node (`node --test`), không thêm thư viện kiểm thử.
- ESLint 9: thư viện phát triển duy nhất ở M0 (`eslint`, `@eslint/js`, `globals`). Cần người dùng đồng ý `npm install`.
- `npm test` chạy toàn bộ `tests/`; `npm run lint` kiểm tra `gas/`, `tests/` (và `web/` từ M1).

### Giả lập dịch vụ Google trên Node

- Mỗi kiểm thử tạo một môi trường mới: nạp `gas/*.js` vào `vm.createContext` cùng bộ giả lập, đồng hồ giả (đặt được "bây giờ"), Script Properties ban đầu.
- Bảng tính giả lưu giá trị và định dạng từng ô. `setValues` mô phỏng việc Sheet tự đổi kiểu: chuỗi `0123`, `1E5`, `3-4`, `2026-11-05`, `TRUE` thành số, ngày, logic; chuỗi đầu `=`, `+`, `-`, `@` thành công thức. Ô định dạng văn bản thuần (`@`) hoặc chuỗi có dấu nháy đơn đầu thì giữ nguyên chuỗi. Nhờ vậy kiểm thử bắt được lỗi mất số 0 đầu và chèn công thức.
- Khóa giả đặt được "không lấy được khóa" để thử lỗi `BUSY`. Bộ đệm giả có hạn lưu và xóa toàn bộ được, để thử trường hợp mất bộ đệm.
- Phương thức chưa giả lập thì ném lỗi, không trả giá trị mặc định.
- Những điều bộ giả lập chỉ phỏng đoán thì có ca tương ứng trong `smokeTest()`: dấu nháy đơn, định dạng văn bản thuần, công thức, múi giờ, khóa, bộ đệm, thùng rác Drive.

### Dàn ý `docs/HOP-DONG-DU-LIEU.md`

1. Quy ước: kiểu dữ liệu (Văn bản thuần, Số, Ngày, Ngày giờ, JSON, Có/Không), múi giờ, ISO 8601, cách đặt tên.
2. Script Properties: `SHEET_ID`, `DRIVE_FOLDER_ID`, `ADMIN_EMAIL`, `SESSION_SECRET`, `CLIENT_ID`, `MOI_TRUONG`, mã các thư mục con.
3. Khóa `CauHinh`: tên, kiểu, giá trị ban đầu (hạn mượn 2 ngày theo C1), ai sửa.
4. 25 sheet: 24 sheet của mục 4 + `KetQuaRequest` (C3). Mỗi cột: tên, kiểu, định dạng, bắt buộc, ai ghi.
5. Tám tình trạng: mã nội bộ, tên hiển thị mặc định, màu, có cho mượn không; cột 5 lưu tên hiển thị (C4).
6. Các loại mã, khóa `BoDem` tương ứng.
7. API: dạng request, response, `requestId`; bảng mã lỗi; bảng mọi action M1–M8 (tham số, vai trò, có ghi không, kết quả, mã lỗi, mốc làm).
8. Khóa CacheService (tên, thời hạn); khóa localStorage (`qltb.*`).
9. Lịch sử `SCHEMA_VERSION`; danh sách file backend.

### Kiểm thử sẽ viết (theo "Kiểm thử bắt buộc" của M0)

| File | Nội dung |
| --- | --- |
| `fakes.test.js` | Bộ giả lập tự đổi kiểu giống Sheet thật, để các kiểm thử sau có ý nghĩa |
| `setup.test.js` | Chạy `setup()` 2 lần không mất dữ liệu, không trùng sheet, dòng; nâng cấp từ cấu trúc đời cũ đúng thứ tự; Script Properties được tạo |
| `ma-nhom.test.js` | Có dấu, chữ Đ, trùng mã và gợi ý mã thay thế (MC → MCA, MDND → MDNDO), NFC và NFD cho cùng kết quả, từ bắt đầu bằng số (BLO1), cắt 6 ký tự (MHCKHC), mã ngắn hơn 2 ký tự (K → Admin tự đặt) |
| `bo-dem.test.js` | Cấp số tiếp theo, không cấp lại số đã dùng, vượt 999 thành 1000, sang ngày/năm mới đếm lại |
| `van-ban.test.js` | SĐT, serie có số 0 đầu, serie toàn chữ số dài, `1E5`, `3-4` ghi rồi đọc lại đúng chuỗi gốc; chuỗi đầu `=`, `+`, `-`, `@` không thành công thức |

### Giả định (sửa được khi duyệt)

- Gợi ý mã nhóm thay thế: thêm lần lượt chữ cái tiếp theo của từ cuối; hết chữ mà vẫn trùng thì không gợi ý, Admin tự đặt.
- Code backend viết đuôi `.js` trong `gas/`, vì clasp đẩy file `.js` lên thành `.gs`.

### Điểm của M1 đã ghi nhận trước

- Phát hành `web/` bằng GitHub Actions (C2).
- Content-Security-Policy phải cho phép kết nối tới `script.google.com` và `script.googleusercontent.com`, vì Apps Script chuyển hướng phản hồi sang tên miền sau.
- Authorized JavaScript origins thêm `http://localhost:<cổng>` cho `npm run dev`.
- Cần đồng ý cài `@google/clasp`; tra `npx clasp --help` trước khi viết lệnh.
