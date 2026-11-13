# Đặc tả 02 – Kiến trúc, bảo mật, phân quyền

> Bộ đặc tả gồm 5 file: mục 1 `01-tong-quan.md` · mục 2–3 `02-kien-truc-bao-mat.md` · mục 4–5 `03-du-lieu.md` · mục 6–9 `04-quy-trinh.md` · mục 10 `05-giao-dien.md`. "Mục N" trong mọi file là mục N của bộ này. Kế hoạch và tiêu chí hoàn thành ở `docs/KE-HOACH.md`.

## 2. Kiến trúc bắt buộc (miễn phí)

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Giao diện | HTML/CSS/JavaScript thuần, không cần build, đặt trong thư mục `web/` và phát hành lên GitHub Pages (repo public) | Trang công khai cho người mượn: tìm thiết bị, danh sách mượn, QR yêu cầu, tra cứu phiếu, xin gia hạn. Trang quản lý: quét QR, giao, nhận lại, biên bản, điều chuyển, in tem |
| Đăng nhập | Google Identity Services (nút "Đăng nhập bằng Google"), OAuth Client ID loại Web application | Chỉ dành cho Admin, Quản lý, Chỉ xem. Đăng nhập Google một lần, server cấp mã phiên 12 giờ (mục 3) |
| Backend/API | Google Apps Script web app, triển khai "Execute as: Me" và "Who has access: Anyone" | API quản lý: kiểm tra mã phiên, phân quyền, đọc/ghi dữ liệu. API công khai: giới hạn chặt (mục 3) |
| Cơ sở dữ liệu | Google Sheet thuộc tài khoản chủ sở hữu (`ADMIN_EMAIL`), không chia sẻ cho ai | Lưu toàn bộ dữ liệu |
| Lưu file | Thư mục Google Drive riêng, không chia sẻ | Ảnh thiết bị, ảnh hư hỏng, biên bản, minh chứng điều chuyển, bản sao lưu |
| Thông báo | MailApp của Apps Script | 1 email tổng hợp mỗi sáng cho Admin và Quản lý; email ngay chỉ khi có hư hỏng nặng, mất, lệch serie hoặc điều chuyển phòng (mục 9) |

Thư viện frontend chép sẵn vào `web/vendor/`, không nạp từ CDN lúc chạy. File `web/vendor/README.md` ghi phiên bản, nguồn tải và mã băm SHA-256 của từng file. Riêng script Google Identity Services bắt buộc nạp từ `https://accounts.google.com/gsi/client`.

- html5-qrcode 2.3.8: quét QR và mã vạch (CODE_128, CODE_39, EAN-13). Thư viện này đang ở chế độ bảo trì, không còn được sửa lỗi, nên chỉ được gọi qua một lớp bọc riêng (`web/js/scanner.js` với `start(onResult)` và `stop()`). Khi cần đổi thư viện quét thì chỉ sửa file này.
- qrcode-generator: tạo QR ngay trên trình duyệt, không gọi API bên ngoài.
- SheetJS từ bản 0.20.3, tải từ nguồn chính thức `cdn.sheetjs.com`: đọc và xuất file Excel. Không dùng gói `xlsx` trên npm (dừng ở 0.18.5, còn lỗ hổng đã công bố). Chỉ nạp ở màn hình nhập và xuất Excel.

Quy ước gọi API:

- Frontend gọi Apps Script bằng `fetch`, phương thức POST, header `Content-Type: text/plain;charset=utf-8`, body JSON dạng `{action, session, requestId, data}`. Cách này tránh preflight CORS, vì Apps Script không xử lý được preflight.
- API công khai không cần `session`; mọi API còn lại bắt buộc có mã phiên hợp lệ.
- Apps Script dùng `doPost` làm router và trả JSON thống nhất `{ok, data, error}` qua ContentService.
- `error` có dạng `{code, message}`. `code` là hằng số tiếng Anh không đổi (ví dụ `DEVICE_NOT_AVAILABLE`, `SESSION_EXPIRED`, `RATE_LIMITED`, `BUSY`), liệt kê đủ trong hợp đồng dữ liệu. `message` bằng tiếng Việt, dễ hiểu, không lộ chi tiết kỹ thuật.
- Mọi action ghi dữ liệu bắt buộc có `requestId`: UUID do trình duyệt sinh, giữ nguyên khi gửi lại. Server lưu `requestId` cùng bản ghi chính nó tạo ra và kiểm tra trong vùng khóa; gặp lại `requestId` đã xử lý thì trả đúng kết quả cũ, không ghi lần hai. Mạng điện thoại hay mất phản hồi sau khi server đã ghi xong, nên thiếu cơ chế này sẽ sinh phiếu trùng.
- Thời gian trong JSON dùng ISO 8601 kèm múi giờ (ví dụ `2026-11-10T08:30:00+07:00`). Dạng dd/MM/yyyy chỉ dùng ở lớp hiển thị.

Có ba loại mã QR. Cả ba chỉ Admin và Quản lý thao tác được:

- **QR thiết bị** (in tem dán trên thiết bị): `<BASE_URL>?tb=<Mã TB>`. Với quản lý đã đăng nhập, mở thẻ thiết bị với nút hành động theo trạng thái: "Giao cho mượn" khi thiết bị sẵn sàng, "Nhận lại" khi đang mượn, kèm các thao tác kiểm kê, điều chuyển, báo hỏng.
- **QR bộ/hộp** (in tem dán trên bộ hoặc hộp): `<BASE_URL>?bo=<Mã bộ/hộp>`. Bộ: mở danh sách các món trong bộ. Hộp: hiện số lượng tổng, sẵn sàng, đang mượn, hư hỏng.
- **QR yêu cầu mượn** (hiện trên điện thoại người mượn sau khi gửi yêu cầu): `<BASE_URL>?yc=<Mã YC>&k=<mã xác nhận>`. Mở yêu cầu để người quản lý giao thiết bị.

`BASE_URL` là địa chỉ GitHub Pages của app, khai báo trong `config.js` khi triển khai. Đường link công khai cho người mượn chính là `BASE_URL`; Khoa gửi link này cho người mượn qua nhóm lớp, email hoặc bảng tin.

`BASE_URL` được in vào tem, nên phải chốt trước khi in tem hàng loạt: đổi tên tài khoản hoặc tên repo GitHub về sau sẽ làm tem cũ không mở được khi quét bằng camera điện thoại. Để giảm rủi ro này, nút Quét QR trong app chấp nhận cả ba dạng nội dung: URL đầy đủ ở bất kỳ tên miền nào có tham số `tb`, `bo` hoặc `yc`; riêng chuỗi tham số; hoặc chỉ mã (ví dụ `MKCT-001`).

Cách quét chính của quản lý là nút Quét QR trong app: camera mở liên tục, quét xong thiết bị này quét tiếp thiết bị khác, không mở tab mới. App tra thiết bị vừa quét ngay trên máy từ dữ liệu đã tải (mục 10), không gọi server cho từng lần quét; server chỉ kiểm tra lại khi người quản lý bấm xác nhận.

Quét bằng camera điện thoại mở đúng trang, và trang đó còn đăng nhập nếu mở trong cùng trình duyệt đã đăng nhập. Hai trường hợp không giữ được đăng nhập, hướng dẫn vận hành phải nêu rõ:

- iPhone: app đã cài ra màn hình chính và Safari lưu dữ liệu tách biệt, nên link mở từ camera sẽ yêu cầu đăng nhập lại trong Safari.
- Link mở bên trong Zalo, Messenger, Facebook (trình duyệt nhúng): Google chặn đăng nhập trong trình duyệt nhúng và dữ liệu lưu cũng tách biệt. App phát hiện trường hợp này và hiện hướng dẫn "Mở bằng Chrome hoặc Safari" (mục 10).

Repo GitHub Pages miễn phí là public. Vì vậy frontend chỉ được chứa `BASE_URL`, Client ID và URL web app, không chứa bất kỳ bí mật nào. Toàn bộ repo, kể cả mã backend và tài liệu, không chứa bí mật, email cá nhân, số điện thoại hay dữ liệu thật. Mọi kiểm tra quyền đều thực hiện ở Apps Script.

### 2.1 Giới hạn nền tảng phải thiết kế theo

Số liệu tra ngày 10/11/2026 cho tài khoản Gmail cá nhân. Google có thể đổi bất cứ lúc nào: kiểm tra lại trang hạn mức chính thức của Apps Script trước khi viết phần hướng dẫn vận hành.

| Giới hạn | Giá trị | Hệ quả thiết kế |
| --- | --- | --- |
| Thời gian chạy mỗi lần gọi | 6 phút | Nhập hàng, điều chuyển, báo cáo xử lý theo lô |
| Số lần chạy đồng thời | 30 mỗi tài khoản | Web app chạy dưới quyền chủ sở hữu, nên mọi người dùng dùng chung hạn mức này. API hỏi trạng thái phải rất nhẹ và giãn nhịp theo mục 1 |
| Email | 100 người nhận mỗi ngày | Thứ tự ưu tiên khi sắp hết: email ngay cho Admin, email tổng hợp, rồi mới nhắc người mượn |
| UrlFetch | 20.000 lần mỗi ngày | Chỉ gọi khi đăng nhập |
| Tổng thời gian chạy trigger | 90 phút mỗi ngày | Trigger chạy ngắn, không quét toàn bộ sheet lớn mỗi giờ |
| Đọc, ghi Properties | 50.000 lần mỗi ngày | Mỗi lần chạy đọc một lần bằng `getProperties()`; API hỏi trạng thái không đọc Properties |
| CacheService | 100 KB mỗi khóa; khóa dài tối đa 250 ký tự; lưu tối đa 6 giờ; khoảng 1.000 mục; có thể bị xóa sớm | Chỉ là bộ đệm: mất dữ liệu đệm không được làm sai nghiệp vụ. Không dùng làm nơi lưu duy nhất cho giữ chỗ, `requestId`, bộ đếm mã |
| Google Sheet | 10 triệu ô mỗi file; 50.000 ký tự mỗi ô | `NhatKy`, `LichSu` chỉ ghi nối tiếp và có chức năng lưu trữ theo năm (mục 9). Kiểm tra độ dài trước khi ghi ô chứa danh sách mã hoặc ảnh thu nhỏ |
| Trigger theo giờ | `atHour(7)` chạy vào một phút bất kỳ trong khung 07:00–08:00; `nearMinute()` lệch tới 15 phút | Mốc "07:00" trong đặc tả là xấp xỉ |

### 2.2 Bảo đảm đúng đắn khi ghi

Google Sheet không có giao dịch (transaction): một lần ghi nhiều sheet có thể dừng giữa chừng. Vì vậy:

- Mỗi action ghi làm theo đúng trình tự: lấy khóa bằng `LockService.getScriptLock().tryLock()` (chờ tối đa 10 giây, quá thời gian thì trả lỗi `BUSY` để người dùng bấm lại) → đọc dữ liệu cần thiết một lần → kiểm tra toàn bộ điều kiện → ghi → `SpreadsheetApp.flush()` → nhả khóa trong `finally`.
- Thứ tự ghi cố định: bản ghi chính (`YeuCauMuon`, `PhieuMuon`, `BienBan`, `DieuChuyen`...) → `ChiTietPhieu` → `ThietBi` → `LichSu` → `NhatKy`. Bản ghi chính mang `requestId`, nên khi gửi lại sau lỗi, server chạy tiếp phần còn thiếu thay vì tạo bản ghi trùng.
- Hàm `kiemTraNhatQuan()` (Admin chạy từ app, và chạy tự động hằng ngày) đối chiếu `ThietBi` với `ChiTietPhieu`, `PhieuMuon`, giữ chỗ và bộ đếm mã; ghi sai lệch vào `NhatKy` và hiện cảnh báo trên Trang tổng quan. Hàm chỉ báo cáo, không tự sửa dữ liệu.
- Tìm dòng theo giá trị mã đã chuẩn hóa, không theo vị trí dòng, vì Admin có thể sắp xếp hoặc lọc tay trên Sheet.

### 2.3 Hiệu năng

- Mục tiêu trên mạng 4G với quy mô ở mục 1: API đọc dưới 3 giây, API ghi dưới 5 giây.
- Mỗi request mở Spreadsheet một lần, đọc mỗi sheet cần dùng một lần, ghi theo khối.
- Server giữ số `phienBanDuLieu`, tăng sau mỗi lần ghi `ThietBi`. Ảnh chụp danh sách thiết bị (bản công khai và bản quản lý) lưu đệm theo số này; trình duyệt chỉ tải lại khi số thay đổi.

## 3. Bảo mật và phân quyền

App có hai khu vực. Khu vực công khai dành cho người mượn, không đăng nhập. Khu vực quản lý bắt buộc đăng nhập Gmail cá nhân, gồm 3 vai trò: Admin, Quản lý, Chỉ xem. Mọi API quản lý phải có mã phiên hợp lệ, cấp theo các bước sau:

1. Quản lý bấm "Đăng nhập bằng Google" một lần. Frontend nhận ID token từ Google Identity Services và gửi lên server.
2. Server xác minh ID token bằng `UrlFetchApp` gọi `https://oauth2.googleapis.com/tokeninfo?id_token=...`. Phải kiểm tra đủ: `aud` đúng Client ID; `iss` là `accounts.google.com` hoặc `https://accounts.google.com`; `email_verified` là true; `exp` chưa quá hạn. Chỉ chấp nhận email đuôi `@gmail.com`, hoặc email thuộc tên miền Google Workspace khai báo trong `CauHinh` kèm `hd` của token đúng tên miền đó; với các email khác Google không bảo đảm quyền sở hữu. Google ghi endpoint `tokeninfo` là để phát triển và gỡ lỗi; ở đây chỉ gọi một lần mỗi lần đăng nhập nên chấp nhận được, ghi lựa chọn này vào `docs/QUYET-DINH.md`. Khi `tokeninfo` lỗi thì báo "Chưa đăng nhập được, vui lòng thử lại"; các phiên đã cấp vẫn dùng bình thường.
3. Server đối chiếu email (viết thường) với sheet `NguoiDung`. Email phải có trong danh sách, Trạng thái = "Hoạt động", và chưa quá Ngày hết hạn (để trống nghĩa là không hết hạn).
4. Hợp lệ thì server cấp mã phiên: chuỗi chứa email, thời điểm cấp và thời điểm hết hạn (12 giờ), ký bằng HMAC-SHA256 với khóa bí mật `SESSION_SECRET` lưu trong Script Properties. Frontend lưu mã phiên trong localStorage, nên tab mới mở trong cùng trình duyệt (ví dụ do quét bằng camera điện thoại) vẫn còn đăng nhập.
5. Mỗi request quản lý, server kiểm tra chữ ký và hạn của mã phiên, rồi đối chiếu lại `NguoiDung` (trạng thái, vai trò, cột "Phiên hợp lệ từ": mã phiên cấp trước thời điểm này bị từ chối). Kết quả đối chiếu được lưu đệm bằng CacheService tối đa 5 phút; khi Admin khóa tài khoản, đổi vai trò hoặc đăng xuất mọi thiết bị thì xóa ngay bộ đệm của email đó.
6. Kiểm tra vai trò có quyền thực hiện action đó không. Không đạt thì trả lỗi và ghi `NhatKy` với kết quả "Từ chối".
7. Có nút "Đăng xuất". Admin có nút "Đăng xuất mọi thiết bị" cho từng tài khoản: ghi thời điểm hiện tại vào cột "Phiên hợp lệ từ", mọi mã phiên cấp trước đó mất hiệu lực. Máy dùng chung ở phòng thực hành phải đăng xuất sau khi dùng.

Email chủ sở hữu (`ADMIN_EMAIL` trong Script Properties) luôn có vai trò Admin và không thể bị khóa. Hướng dẫn triển khai nhắc Khoa thêm ít nhất một tài khoản Admin thứ hai để hệ thống không phụ thuộc một người.

**API công khai** (không đăng nhập) chỉ gồm: tải danh sách thiết bị; gửi yêu cầu mượn; xem, làm mới hoặc hủy yêu cầu của mình bằng Mã YC kèm mã xác nhận; tra cứu phiếu và xin gia hạn bằng SĐT kèm Mã phiếu. Các biện pháp chống lạm dụng:

- Chỉ trả về tên, Mã TB, nhóm, tình trạng, phòng, ảnh đại diện thu nhỏ, nhãn "Sẵn sàng"/"Không sẵn sàng", và với hộp là số lượng sẵn sàng. Không trả serie, người đang mượn, lịch sử, ghi chú.
- Yêu cầu mượn bắt buộc có họ tên, đơn vị/lớp, SĐT (10 chữ số), mục đích; email không bắt buộc. Không có trường tình trạng.
- Mỗi yêu cầu tối đa 10 dòng (một thiết bị lẻ, một bộ hoặc một hộp tính là 1 dòng); mỗi SĐT chỉ có 1 yêu cầu đang chờ duyệt.
- Khi Admin bật mã truy cập: người mượn nhập mã một lần, trình duyệt ghi nhớ; mọi API công khai kiểm tra mã ở server. Admin đổi mã thì mọi trình duyệt phải nhập lại. Nhập sai nhiều lần thì bị chặn tạm theo giới hạn tần suất.
- Tra cứu phiếu bắt buộc đúng cả SĐT và Mã phiếu. Sai thì chỉ báo "Không tìm thấy", không tiết lộ phiếu có tồn tại hay không. Mã phiếu đánh số theo ngày nên đoán được; vì vậy giới hạn số lần tra sai theo từng SĐT (mục 1).
- Giới hạn tần suất gửi yêu cầu, tra cứu theo hai tầng bằng CacheService: theo từng SĐT và trên toàn hệ thống (ngưỡng ở mục 1, lưu trong `CauHinh`). Apps Script không cho web app biết địa chỉ IP của người gọi, nên không giới hạn theo IP được. Vượt ngưỡng thì báo "Hệ thống đang bận, vui lòng thử lại sau".
- API hỏi trạng thái yêu cầu (trang người mượn gọi lặp lại) chỉ đọc CacheService, không mở Spreadsheet, không đọc Properties. Server ghi trạng thái vào bộ đệm mỗi khi yêu cầu đổi trạng thái; khi bộ đệm không còn thì đọc Sheet một lần rồi ghi lại bộ đệm.
- Form có trường ẩn chống bot; request có trường này được điền thì bị bỏ qua.
- Yêu cầu chưa duyệt chỉ giữ chỗ 30 phút và không làm thay đổi dữ liệu gốc của thiết bị. Admin và Quản lý hủy được giữ chỗ của bất kỳ yêu cầu nào (bắt buộc ghi lý do, ghi `NhatKy`), để yêu cầu rác không chặn việc giao trực tiếp.
- Form gửi yêu cầu hiện thông báo ngắn về việc dùng thông tin cá nhân: mục đích (chỉ để quản lý việc mượn, trả thiết bị của Khoa), thời gian lưu, đầu mối liên hệ; kèm ô tích đồng ý bắt buộc. Server lưu thời điểm đồng ý cùng yêu cầu.

| Quyền | Admin | Quản lý | Chỉ xem | Người mượn (không đăng nhập) |
| --- | --- | --- | --- | --- |
| Tìm, xem danh sách thiết bị | Có | Có | Có | Có, giới hạn |
| Gửi yêu cầu mượn, tra cứu phiếu, xin gia hạn | Có | Có | Có | Có |
| Xem phiếu mượn, lịch sử, báo cáo | Có | Có | Có | Chỉ phiếu của mình (SĐT + Mã phiếu) |
| Quét QR, giao thiết bị, nhận lại, duyệt gia hạn | Có | Có | Không | Không |
| Đối chiếu serie khi giao, nhận | Có | Có | Không | Không |
| Sửa số serie | Có | Không, chỉ gửi yêu cầu sửa | Không | Không |
| Lập biên bản hư hỏng, tải minh chứng | Có | Có | Không | Không |
| Điều chuyển phòng (kèm minh chứng) | Có | Có | Không | Không |
| Báo hỏng, sửa chữa, kiểm kê, in tem QR | Có | Có | Không | Không |
| Thêm ảnh thiết bị | Có | Có | Không | Không |
| Xóa ảnh, minh chứng | Có (duyệt yêu cầu) | Chỉ gửi yêu cầu xóa | Không | Không |
| Nhập hàng theo đợt | Có | Không | Không | Không |
| Tạo, sửa bộ/hộp; đưa thiết bị vào hoặc rút ra | Có | Không | Không | Không |
| Sửa/xóa dữ liệu gốc, thanh lý | Có | Không | Không | Không |
| Quản lý tài khoản, cấu hình | Có | Không | Không | Không |

Mã QR chỉ dành cho Admin và Quản lý. Người chưa đăng nhập hoặc có vai trò Chỉ xem mà quét QR thiết bị hay QR yêu cầu mượn sẽ thấy thông báo "Chỉ người quản lý được thao tác bằng mã QR" kèm nút đăng nhập. App không hiển thị thông tin quản lý nào. Lần truy cập của tài khoản đã đăng nhập nhưng không đủ quyền được ghi vào `NhatKy`. Với người chưa đăng nhập, trang chỉ hiện thông báo, không gọi server và không ghi nhật ký, để không ai lợi dụng được việc này làm đầy `NhatKy`.

Yêu cầu bảo mật khác:

- Sheet và thư mục Drive không chia sẻ cho ai. Mọi người chỉ thao tác qua app. Ngoại lệ duy nhất là thư mục `SaoLuu` (mục 9).
- Mọi thao tác ghi dùng `LockService.getScriptLock()` theo trình tự ở mục 2.2. Ngay trước khi ghi phải kiểm tra lại trạng thái thiết bị, tránh hai yêu cầu cùng giữ hoặc cùng mượn một thiết bị.
- Kiểm tra và làm sạch mọi dữ liệu đầu vào ở server. Chuỗi người dùng nhập bắt đầu bằng `=`, `+`, `-`, `@` phải được lưu thành văn bản, không bao giờ thành công thức, và đọc lại ra đúng chuỗi gốc (cách làm dự kiến: thêm dấu nháy đơn phía trước; kiểm chứng trên Sheet thật bằng `smokeTest()`).
- Các cột mã và chuỗi số (Mã TB, Số serie, SĐT, mã xác nhận, mọi cột mã) được `setup()` đặt định dạng văn bản thuần và luôn ghi, đọc, so sánh dưới dạng chuỗi. Nếu không, Sheet tự đổi thành số hoặc ngày và làm mất số 0 đầu của SĐT, của serie.
- Ảnh thiết bị (trừ ảnh đại diện thu nhỏ ở trang công khai), ảnh hư hỏng, biên bản và minh chứng chỉ xem được qua API quản lý (server trả về base64), không tạo link công khai. Server kiểm tra loại file (JPEG, PNG, PDF) và kích thước (mục 1) trước khi lưu vào Drive.
- Quyền sửa serie, xóa ảnh, xóa minh chứng được kiểm tra ở server, không chỉ ẩn nút trên giao diện. Quản lý chỉ gửi được yêu cầu điều chỉnh để Admin duyệt (mục 9).
- Ghi `NhatKy` cho mọi thao tác ghi dữ liệu, đăng nhập, đăng xuất và mọi lần bị từ chối quyền: thời gian, email (hoặc "công khai" kèm SĐT), action, đối tượng (mã TB, mã yêu cầu, mã phiếu, mã biên bản, mã điều chuyển), kết quả, chi tiết. Không ghi các lượt đọc của trang công khai (tải danh sách, hỏi trạng thái).
- Frontend không đưa dữ liệu vào trang bằng `innerHTML` hay chuỗi HTML ghép tay; dùng `textContent` hoặc một hàm tạo phần tử dùng chung. `index.html` khai báo Content-Security-Policy theo hướng dẫn của Google Identity Services, chỉ cho chạy script của chính trang và của `https://accounts.google.com`. Lý do: mã phiên nằm trong localStorage, một lỗi XSS là mất phiên quản lý.
- Dữ liệu cá nhân người mượn (họ tên, đơn vị/lớp, SĐT, email): chỉ thu đúng các trường đã nêu; không hiện ở trang công khai; không gửi ra ngoài danh sách quản lý. Sau thời gian lưu ở mục 1, một trigger hằng tháng thay họ tên, SĐT, email của các phiếu đã đóng trong `YeuCauMuon`, `PhieuMuon`, `ChiTietPhieu`, `LichSu` bằng giá trị ẩn danh; phiếu có biên bản hư hỏng, mất thì giữ nguyên. Căn cứ: Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực 01/01/2026). Nội dung thông báo và thời gian lưu cần Khoa xác nhận với bộ phận pháp chế của Trường.
