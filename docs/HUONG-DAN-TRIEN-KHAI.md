# Hướng dẫn triển khai

Dành cho người triển khai, không cần biết lập trình. Mỗi bước là một thao tác.

- Câu lệnh trong khung xám: gõ vào cửa sổ dòng lệnh (Terminal) của VS Code đang mở thư mục `qltb`, rồi nhấn Enter.
- Có thể nhờ Claude Code chạy giúp các lệnh này; lệnh nào gửi dữ liệu lên Google hay GitHub đều hiện hộp hỏi lại trước khi chạy.

Cập nhật đến **M1** (13/11/2026). Giao diện Google và GitHub thay đổi thường xuyên; nếu tên nút khác đôi chút, tìm nút có ý nghĩa tương tự.

**Các tài khoản cần có:**

- **Gmail chủ sở hữu**: chứa dữ liệu. Tài khoản này chạy `setup()` và triển khai web app.
- **Tài khoản GitHub `thuannv181198`**: chứa giao diện.

**Hai bản Apps Script:**

- **DEV** (thử nghiệm, chỉ có dữ liệu thử): dùng từ M1 đến M8.
- **PROD** (chạy thật): tạo ở M8.

Hướng dẫn dưới đây làm bản DEV.

---

## Bước 1. Bật Apps Script API (một lần cho tài khoản)

1. Đăng nhập Gmail chủ sở hữu trên trình duyệt.
2. Mở `https://script.google.com/home/usersettings`.
3. Ở dòng **Google Apps Script API**, gạt công tắc sang **Bật (On)**.

Nguồn: https://github.com/google/clasp (mục "Enable the Apps Script API").

## Bước 2. Đăng nhập clasp (công cụ đẩy code lên Apps Script)

clasp được cài vào thư mục dự án (bản 3.4.1) khi bạn đồng ý cho Claude Code cài.

1. Gõ:
   ```
   npx clasp login
   ```
2. Trình duyệt mở trang Google. Chọn **Gmail chủ sở hữu** → bấm **Cho phép (Allow)**.
3. Trang báo đăng nhập thành công thì đóng tab.

Thông tin đăng nhập được lưu ở `C:\Users\<tên máy>\.clasprc.json`, nằm ngoài thư mục dự án và không đưa lên GitHub. **Không gửi file này cho ai.**

## Bước 3. Tạo project Apps Script DEV và đẩy code lên

1. Gõ:
   ```
   npx clasp create-script --title "QLTB DEV" --rootDir gas
   ```
   Lệnh này tạo file `.clasp.json` chứa mã project.
2. Gõ lệnh sau để giữ đúng file cấu hình của app nếu clasp vừa ghi đè:
   ```
   git checkout -- gas/appsscript.json
   ```
3. Gõ:
   ```
   npm run push:dev
   ```
   Màn hình báo đã đẩy khoảng 10 file là xong.

Mỗi lần có code mới (các mốc sau) chỉ cần chạy lại lệnh `npm run push:dev`, rồi làm mục 7.2.

## Bước 4. Đặt môi trường DEV và chạy `setup()`

1. Gõ lệnh sau để mở trình soạn thảo Apps Script trên trình duyệt:
   ```
   npx clasp open-script
   ```
2. Thanh bên trái → biểu tượng **bánh răng ⚙ Cài đặt dự án (Project Settings)** → cuộn xuống **Thuộc tính tập lệnh (Script Properties)** → **Thêm thuộc tính tập lệnh (Add script property)**.
3. Điền: Thuộc tính `MOI_TRUONG`, Giá trị `DEV` → **Lưu thuộc tính tập lệnh (Save script properties)**.
4. Thanh bên trái → **< > Trình chỉnh sửa (Editor)** → bấm file **Setup**.
5. Ở ô chọn hàm trên thanh công cụ (cạnh nút "Gỡ lỗi"), chọn **setup** → bấm **▶ Chạy (Run)**.
6. Lần đầu sẽ hiện **Cần cấp quyền (Authorization required)**:
   - **Xem xét quyền (Review permissions)** → chọn Gmail chủ sở hữu;
   - màn hình "Google chưa xác minh ứng dụng này" là bình thường, vì chính bạn tạo app: bấm **Nâng cao (Advanced)** → **Đi tới QLTB DEV (không an toàn)**;
   - bấm **Chọn tất cả (Select all)** nếu có → **Tiếp tục (Continue)**.
7. Chờ **Nhật ký thực thi (Execution log)** hiện **"Đã chạy setup() thành công."**

Kết quả:

- Trong Google Drive có thư mục **QLTB_DuLieu_DEV**, bên trong có file **QLTB_DuLieu_DEV** (25 sheet) và 5 thư mục con.
- Mục Thuộc tính tập lệnh có thêm `SHEET_ID`, `DRIVE_FOLDER_ID`, `ADMIN_EMAIL`, `SESSION_SECRET`, `PHIEN_BAN_DU_LIEU` và 5 mục `FOLDER_…`.
- **Không chia sẻ** file Sheet và thư mục này cho ai.

## Bước 5. Chạy `smokeTest()` và gửi kết quả

1. Trong trình soạn thảo, bấm file **SmokeTest** → chọn hàm **smokeTest** → **▶ Chạy**.
2. Chờ dòng **"KẾT QUẢ smokeTest: …/13 ca đạt"**.
3. Chép toàn bộ Nhật ký thực thi gửi Claude Code, kể cả khi có ca **KHÔNG ĐẠT**. Kết quả này cho biết Google Sheet thật xử lý số 0 đầu và công thức có giống giả định trong code không.

## Bước 6. Tạo OAuth Client ID (cho nút "Đăng nhập bằng Google")

Nguồn:

- https://support.google.com/cloud/answer/15549257
- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

### 6.1. Tạo project Google Cloud

1. Mở `https://console.cloud.google.com`, đăng nhập Gmail chủ sở hữu. Lần đầu: chọn quốc gia Việt Nam và đồng ý điều khoản.
2. Bấm ô chọn project trên cùng → **Dự án mới (New project)** → Tên `QLTB-CNNL` → **Tạo (Create)**.
3. Chọn project `QLTB-CNNL` ở ô chọn project.

### 6.2. Đăng ký app với Google Auth Platform

1. Gõ **Google Auth Platform** vào ô tìm kiếm trên cùng → mở → **Bắt đầu (Get started)**.
2. **App name:** `Quản lý thiết bị – Khoa CNNL`. **User support email:** Gmail chủ sở hữu → **Next**.
3. **Audience:** chọn **External** → **Next**.
4. **Contact information:** Gmail chủ sở hữu → **Next** → tích đồng ý → **Continue** → **Create**.
5. Menu trái **Audience (Đối tượng)** → **Publish app (Xuất bản ứng dụng)** → **Confirm**. Trạng thái thành **In production**.
   - Để ở "Testing" thì chỉ những Gmail có trong danh sách Test users mới đăng nhập được.
   - App chỉ xin email và tên nên không cần Google thẩm định.

### 6.3. Tạo Client

1. Menu trái **Clients** → **+ Create client**.
2. **Application type:** **Web application**. **Name:** `QLTB GitHub Pages`.
3. **Authorized JavaScript origins** → **+ Add URI**, thêm lần lượt 3 dòng (không có dấu `/` ở cuối, không có `/tb`):
   ```
   https://thuannv181198.github.io
   http://localhost
   http://localhost:8080
   ```
   Hai dòng `localhost` dùng cho máy phát triển (`npm run dev`).
4. Để trống **Authorized redirect URIs** → **Create**.
5. Sao chép **Client ID** (dạng `….apps.googleusercontent.com`) vào Notepad. Không cần Client secret.

Thay đổi origin có thể mất từ 5 phút đến vài giờ mới có hiệu lực.

### 6.4. Khai báo Client ID cho Apps Script

1. Trình soạn thảo Apps Script → **⚙ Cài đặt dự án** → **Thuộc tính tập lệnh** → **Thêm thuộc tính tập lệnh**.
2. Thuộc tính `CLIENT_ID`, Giá trị: Client ID vừa chép → **Lưu**.

## Bước 7. Triển khai web app (API)

### 7.1. Lần đầu

1. Trình soạn thảo → nút **Triển khai (Deploy)** góc phải → **Triển khai mới (New deployment)**.
2. Bấm **⚙** cạnh "Chọn loại" → **Ứng dụng web (Web app)**.
3. **Mô tả:** `DEV`.
4. **Thực thi dưới dạng (Execute as):** **Tôi (Me)**.
5. **Người có quyền truy cập (Who has access):** **Bất kỳ ai (Anyone)**.
6. **Triển khai (Deploy)**.
7. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`) vào Notepad.
8. Dán URL vào tab mới: thấy dòng chữ có `"ok":true` và `"Quản lý thiết bị"` là đúng.

### 7.2. Cập nhật code mà KHÔNG đổi URL

1. `npm run push:dev`.
2. Trình soạn thảo → **Triển khai** → **Quản lý các lần triển khai (Manage deployments)**.
3. Chọn bản `DEV` → bút chì **✏ Chỉnh sửa**.
4. **Phiên bản (Version):** **Phiên bản mới (New version)** → **Triển khai**.

**Không** bấm "Triển khai mới" lần nữa: làm vậy tạo URL khác, giao diện sẽ gọi nhầm bản cũ.

## Bước 8. Đưa code lên GitHub

1. Mở `https://github.com`, đăng nhập **thuannv181198**.
2. Bấm **+** góc phải → **New repository**:
   - **Repository name:** `tb`;
   - chọn **Public** (GitHub Pages miễn phí cần repo công khai; repo không chứa bí mật);
   - **không** tích tạo README;
   - **Create repository**.
3. Báo Claude Code đã tạo repo. Claude Code sẽ nối repo trên máy với GitHub và đẩy code lên, có hỏi bạn trước khi đẩy. Lần đầu, trình duyệt mở trang đăng nhập GitHub để cấp quyền.

## Bước 9. Bật GitHub Pages bằng GitHub Actions

Nguồn: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

1. Trong repo `tb` → **Settings** → menu trái **Pages**.
2. **Build and deployment → Source:** chọn **GitHub Actions**. Repo đã có sẵn workflow `.github/workflows/pages.yml`, không cần chọn mẫu.
3. Mở tab **Actions** của repo:
   - đợi dòng "Phát hành GitHub Pages" có dấu tích xanh, khoảng 1–2 phút;
   - nếu chưa có lần chạy nào: bấm vào workflow đó → **Run workflow**.
4. Mở `https://thuannv181198.github.io/tb/`: thấy trang **Tìm thiết bị**.

## Bước 10. Điền `web/config.js`

Gửi cho Claude Code 2 giá trị trong Notepad: Client ID (bước 6.3) và URL web app (bước 7.1). Claude Code điền vào `web/config.js`, commit và đẩy lên; GitHub Actions tự phát hành lại.

Hai giá trị này không phải bí mật: ai mở app cũng xem được.

## Bước 11. Thêm Gmail người quản lý

1. Mở `https://thuannv181198.github.io/tb/` bằng Chrome hoặc Safari (không mở trong Zalo) → **Đăng nhập quản lý** → **Đăng nhập bằng Google** → Gmail chủ sở hữu.
2. **Thêm** → **Tài khoản** → **+ Thêm tài khoản**: nhập Gmail, họ tên, chọn vai trò → **Lưu** → **Xác nhận**.
3. **Nên thêm ít nhất một Admin thứ hai**, để hệ thống không phụ thuộc một người.

## Bước 12. Nghiệm thu M1

Làm theo phần M1 của `docs/KIEM-THU-THU-CONG.md`, rồi báo kết quả cho Claude Code.

---

## Khi gặp sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| `clasp` báo "User has not enabled the Apps Script API" | Làm lại Bước 1, chờ vài phút rồi chạy lại |
| Nút Google báo `origin_mismatch` hoặc không hiện | Kiểm tra Authorized JavaScript origins đúng `https://thuannv181198.github.io` (không có `/` cuối) và Client ID trong `web/config.js`. Chờ 5 phút đến vài giờ sau khi sửa |
| Đăng nhập báo "Tài khoản chưa được cấp quyền" | Gmail chưa có trong Tài khoản, bị khóa hoặc hết hạn quyền |
| Báo "Hệ thống chưa cấu hình đăng nhập (thiếu CLIENT_ID)" | Làm Bước 6.4 |
| Báo "Không kết nối được máy chủ" | Kiểm tra mạng; kiểm tra URL trong `web/config.js` kết thúc bằng `/exec`; kiểm tra web app triển khai với "Bất kỳ ai" |
| Sửa code nhưng app vẫn chạy như cũ | Chưa làm mục 7.2 |
| Mở link trong Zalo không đăng nhập được | Đúng thiết kế: bấm **Chép link**, mở Chrome hoặc Safari rồi dán link |
| Báo "Thiếu sheet …" hoặc "thiếu cột …" | Chạy lại `setup()` |
