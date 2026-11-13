# Hợp đồng dữ liệu

Nguồn sự thật về tên sheet, cột, khóa cấu hình, action, mã lỗi. Code (`gas/Config.js`) và tài liệu phải khớp nhau.

- Sau khi người dùng nghiệm thu một mốc, **không đổi tên** sheet, cột, action, mã lỗi đã dùng ở mốc đó.
- Muốn đổi thì hỏi người dùng trước. Đổi cấu trúc thì phải kèm một bước nâng cấp trong `gas/Migrations.js`.
- Mốc sau được thêm tham số tùy chọn và thêm trường vào kết quả, không được bỏ trường cũ.

Phiên bản: M0, 13/11/2026. `SCHEMA_VERSION` = 1.

---

## 1. Quy ước

### 1.1 Kiểu dữ liệu của cột

| Ký hiệu | Kiểu | Định dạng ô do `setup()` đặt | Ghi chú |
| --- | --- | --- | --- |
| T | Văn bản thuần | `@` | Mã, SĐT, serie, tên, mô tả. Luôn ghi và đọc dạng chuỗi |
| N | Số | Không đặt | STT, số lượng, chi phí |
| D | Ngày | `dd/MM/yyyy` | Lưu giá trị ngày thật, 00:00 giờ Việt Nam |
| DT | Ngày giờ | `dd/MM/yyyy HH:mm` | Lưu giá trị ngày giờ thật. Hạn trả chỉ có ngày lưu là 23:59:59 ngày đó |
| J | JSON | `@` | Ô chứa danh sách. Không vượt 50.000 ký tự; vượt thì tách bản ghi |
| B | Có/Không | `@` | Chỉ hai giá trị "Có", "Không" |

**Quy tắc ghi:**

- Mọi chuỗi đi qua `Util.toSheetText` trước khi ghi. Chuỗi bắt đầu bằng `=`, `+`, `-`, `@` hoặc `'` được thêm một dấu nháy đơn phía trước, để Sheet giữ nguyên văn bản; đọc lại vẫn ra chuỗi gốc.
- Dòng mới được đặt định dạng theo kiểu cột trước khi ghi giá trị, không dựa vào định dạng kế thừa.
- Tìm dòng theo giá trị mã đã chuẩn hóa (`Util.normCode`: bỏ khoảng trắng, viết hoa), không theo vị trí dòng.
- Email so sánh sau khi viết thường (`Util.normEmail`). Serie so sánh sau khi bỏ khoảng trắng và viết hoa (`Util.normSerial`).
- Hàng 1 của mọi sheet là tiêu đề: cố định khi cuộn, in đậm, được bảo vệ ở mức cảnh báo (Admin sửa vẫn được nhưng có hộp nhắc).
- Không đặt công thức trong các sheet của app. Khi ghi lại một dòng, công thức trong dòng đó sẽ bị thay bằng giá trị.

### 1.2 Thời gian

- Múi giờ `Asia/Ho_Chi_Minh` (UTC+7 cố định, không có giờ mùa hè).
- Trong JSON giữa trình duyệt và server: chuỗi ISO 8601 kèm múi giờ, ví dụ `2026-11-10T08:30:00+07:00`.
- Ngày không kèm giờ gửi dạng `yyyy-MM-dd`.
- Dạng `dd/MM/yyyy` chỉ dùng ở lớp hiển thị. Server có đọc được dạng này khi người dùng gõ tay (`Util.parseDate`), nhưng không bao giờ dùng `new Date(chuỗi dd/MM/yyyy)`.

### 1.3 Đặt tên

- Tên sheet, tên cột, chuỗi hiển thị: tiếng Việt, đúng như bảng ở mục 4.
- Tên action, mã lỗi, khóa cấu hình, khóa bộ đệm: tiếng Anh hoặc không dấu, không đổi.

---

## 2. Script Properties

Chỉ chủ sở hữu thấy. Mỗi lần chạy, backend đọc một lần bằng `getProperties()`.

| Thuộc tính | Ai tạo | Nội dung |
| --- | --- | --- |
| `SHEET_ID` | `setup()` | Mã file Google Sheet dữ liệu |
| `DRIVE_FOLDER_ID` | `setup()`, hoặc người dùng điền trước để dùng thư mục có sẵn | Thư mục Drive gốc |
| `FOLDER_ANH_THIET_BI`, `FOLDER_ANH_HU_HONG`, `FOLDER_BIEN_BAN`, `FOLDER_DIEU_CHUYEN`, `FOLDER_SAO_LUU` | `setup()` | Mã 5 thư mục con `AnhThietBi`, `AnhHuHong`, `BienBan`, `DieuChuyen`, `SaoLuu` |
| `ADMIN_EMAIL` | `setup()`, lấy từ tài khoản đang chạy | Email chủ sở hữu, viết thường. Luôn là Admin, không khóa được |
| `SESSION_SECRET` | `setup()` | 64 ký tự hex ngẫu nhiên, khóa ký mã phiên. Đổi giá trị này thì mọi phiên đăng nhập mất hiệu lực |
| `CLIENT_ID` | Người dùng (M1) | OAuth Client ID loại Web application |
| `MOI_TRUONG` | Người dùng | `DEV` hoặc `PROD`. `smokeTest()` chỉ chạy khi là `DEV` |
| `PHIEN_BAN_DU_LIEU` | `setup()` đặt 1; tăng sau mỗi lần ghi `ThietBi` | Số `phienBanDuLieu` (mục 2.3 của đặc tả). Trình duyệt chỉ tải lại danh sách khi số này đổi |

---

## 3. Sheet `CauHinh`

Cột: `Khóa` (T), `Giá trị` (T), `Mô tả` (T).

- `setup()` chỉ thêm khóa còn thiếu, không ghi đè giá trị Admin đã sửa.
- Mọi giá trị lưu dạng chuỗi.
- Admin sửa trên app (action `config.save`, M1); sửa tay trên Sheet thì có hiệu lực ở lần đọc sau.

| Khóa | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `SCHEMA_VERSION` | (tự động) | Phiên bản cấu trúc dữ liệu. Không sửa tay |
| `TEN_DON_VI` | KHOA CÔNG NGHỆ NĂNG LƯỢNG | Tên trên app và tem |
| `PHONG_MAC_DINH` | 201-VNB | Phòng gán cho thiết bị mới |
| `HAN_MUON_NGAY` | 2 | Hạn mượn mặc định (ngày). Theo câu hỏi C1 |
| `HAN_DE_XUAT_TOI_DA_NGAY` | 2 | Hạn trả tối đa người mượn được đề xuất |
| `NHAC_TRUOC_HAN_NGAY` | 1 | Nhắc trước hạn trả |
| `GIA_HAN_TOI_DA_LAN` | 2 | Số lần gia hạn tối đa mỗi phiếu |
| `GIA_HAN_TOI_DA_NGAY` | 7 | Số ngày tối đa mỗi lần gia hạn |
| `GIU_CHO_PHUT` | 30 | Thời hạn QR yêu cầu và giữ chỗ |
| `LAM_MOI_QR_TOI_DA` | 2 | Số lần làm mới QR tối đa |
| `HOI_TT_NHANH_GIAY` / `HOI_TT_NHANH_TRONG_GIAY` / `HOI_TT_CHAM_GIAY` | 5 / 120 / 15 | Nhịp trang người mượn hỏi trạng thái |
| `SO_DONG_TOI_DA_YC` | 10 | Số dòng tối đa mỗi yêu cầu |
| `SO_YC_CHO_DUYET_MOI_SDT` | 1 | Số yêu cầu chờ duyệt tối đa mỗi SĐT |
| `PHIEN_GIO` | 12 | Thời hạn phiên đăng nhập |
| `GIO_EMAIL_TONG_HOP` | 7 | Giờ gửi email tổng hợp (xấp xỉ, trigger chạy trong khung giờ đó) |
| `MUC_LAP_BIEN_BAN` | HONG_NANG,MAT | Mã tình trạng phải lập biên bản |
| `SO_NHAN_CHUNG_TOI_THIEU` | 2 | Số nhân chứng tối thiểu |
| `MA_TRUY_CAP_BAT` | Không | Bật mã truy cập trang công khai (Có/Không) |
| `MA_TRUY_CAP` | (trống) | Mã 4–6 chữ số |
| `GH_GUI_YC_SDT` / `GH_GUI_YC_SDT_PHUT` | 3 / 10 | Gửi yêu cầu: 3 lần mỗi 10 phút mỗi SĐT |
| `GH_GUI_YC_HE_THONG_MOI_PHUT` | 30 | Gửi yêu cầu: 30 lần mỗi phút toàn hệ thống |
| `GH_TRA_CUU_SAI_SDT` / `GH_TRA_CUU_SAI_PHUT` | 5 / 15 | Tra cứu phiếu: 5 lần sai mỗi 15 phút mỗi SĐT |
| `GH_TRA_CUU_HE_THONG_MOI_PHUT` | 60 | Tra cứu phiếu: 60 lần mỗi phút toàn hệ thống |
| `GH_MA_TRUY_CAP_SAI` / `GH_MA_TRUY_CAP_SAI_PHUT` | 5 / 15 | Nhập mã truy cập: 5 lần sai mỗi 15 phút mỗi trình duyệt |
| `GH_MA_TRUY_CAP_SAI_HE_THONG` / `GH_MA_TRUY_CAP_SAI_HE_THONG_PHUT` | 30 / 10 | Nhập mã truy cập: 30 lần sai trong 10 phút trên toàn hệ thống thì chặn nhập mã 10 phút (C6) |
| `ANH_TOI_DA_KB` / `PDF_TOI_DA_KB` / `SO_FILE_TOI_DA` | 1024 / 5120 / 5 | Giới hạn file tải lên |
| `ANH_NHO_TOI_DA_KY_TU` | 30000 | Độ dài tối đa base64 ảnh thu nhỏ |
| `CACHE_CONG_KHAI_GIAY` | 300 | Thời gian lưu đệm danh sách công khai |
| `LUU_TT_CA_NHAN_THANG` | 24 | Thời gian lưu thông tin cá nhân sau khi phiếu đóng |
| `LIEN_HE_DU_LIEU_CA_NHAN` | (trống) | Đầu mối liên hệ ghi trong thông báo dùng thông tin cá nhân |
| `EMAIL_NHAN_THONG_BAO` | (trống) | Email nhận thông báo ngay, ngoài Admin |
| `TEN_MIEN_WORKSPACE` | (trống) | Tên miền Google Workspace được đăng nhập; trống thì chỉ `@gmail.com` |
| `TEN_TT_TOT` … `TEN_TT_KHAC` | xem mục 5 | Tên hiển thị của 8 tình trạng |

---

## 4. Các sheet

`setup()` tạo 25 sheet theo đúng thứ tự dưới đây.

- Cột "Bắt buộc" là dữ liệu server luôn ghi khi tạo dòng.
- Danh sách thả xuống do `setup()` đặt được ghi ở cột "Ghi chú".

### 4.1 `ThietBi` – mỗi dòng một thiết bị

Cột 1–9 cố định thứ tự. `setup()` dừng và báo lỗi nếu sai.

| # | Cột | Kiểu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- | --- |
| 1 | STT | N | | Tự đánh lại khi thêm, bớt dòng |
| 2 | Tên thiết bị | T | Có | Tên đầy đủ, không gồm hãng |
| 3 | Mã TB | T | Có | `MKCT-001`; duy nhất, không sửa sau khi lưu |
| 4 | Số serie | T | Có | "Không có" nếu không có; khác "Không có" thì không trùng. Chỉ Admin sửa |
| 5 | Tình trạng | T | Có | Tên hiển thị của 8 tình trạng (mục 5, câu hỏi C4); danh sách thả xuống. Note của ô: chi tiết, mới nhất trên cùng, tối đa 10 lần |
| 6 | Lưu trữ | T | | "Đang mượn", "Phòng TH", hoặc trống khi Mất, Đã thanh lý |
| 7 | Tổng SL thực tế | N | | Script tính: số thiết bị cùng Mã nhóm, trừ Mất và Đã thanh lý |
| 8 | Ngày nhận bàn giao | D | | Lấy từ đợt nhập |
| 9 | Ghi chú | T | | Tự do |
| 10 | Mã nhóm | T | Có | |
| 11 | Hãng/Model | T | | |
| 12 | Phòng/Vị trí | T | Có | Mã phòng trong `DanhMucPhong`. Chỉ đổi qua Điều chuyển phòng |
| 13 | Mã bộ/hộp | T | | |
| 14 | Gắn tem riêng | B | Có | "Không" khi nằm trong bộ/hộp |
| 15 | Mã đợt nhập | T | | |
| 16 | Chi tiết tình trạng | T | | Chi tiết gần nhất; có thể ghi "Chờ biên bản BB-…" hoặc Mã BB |
| 17 | Ảnh đại diện | T | | Mã ảnh trong `AnhThietBi` |
| 18 | Người đang mượn | T | | Họ tên |
| 19 | SĐT người đang mượn | T | | |
| 20 | Mã phiếu đang mượn | T | | |
| 21 | Hạn trả | DT | | |
| 22 | Mã yêu cầu giữ chỗ | T | | Mã YC đang giữ chỗ |
| 23 | Giữ chỗ đến | DT | | Hết thời điểm này thì giữ chỗ coi như không còn, kể cả khi chưa dọn |
| 24 | Cần in lại tem | B | | |
| 25 | Mã tham chiếu | T | | Mã cũ hoặc mã tài sản của Trường |
| 26 | Cập nhật lần cuối | DT | | |
| 27 | Người cập nhật | T | | Email |

Dòng đã có giao dịch trong `LichSu` thì không xóa. Nhập hàng **không** ghi `LichSu`, nên dòng nhập nhầm chưa mượn lần nào vẫn xóa được.

### 4.2 Các sheet còn lại

Mọi cột mã, SĐT, email là kiểu T. Cột `requestId` (T) có ở mọi sheet bản ghi chính.

| Sheet | Cột (kiểu khác T ghi trong ngoặc) | Giá trị cố định |
| --- | --- | --- |
| `NhomTB` | Mã nhóm, Tên chuẩn hóa, Tên hiển thị, Đơn vị tính, Số thứ tự cuối đã cấp (N), Ảnh thu nhỏ của nhóm | |
| `BoHop` | Mã bộ/hộp, Loại, Tên, Mã nhóm, Phòng/Vị trí, Mô tả, Ảnh đại diện, Trạng thái, Ngày tạo (D), Ghi chú | Loại: Bộ, Hộp. Trạng thái: Đang dùng, Ngừng dùng. Mã nhóm chỉ với hộp |
| `DotNhap` | Mã đợt, Nội dung đề xuất, Số tờ trình/QĐ, Ngày đề xuất (D), Ngày nhận bàn giao (D), Nhà cung cấp, Nguồn kinh phí, Trạng thái đợt, Người nhập, Ghi chú, requestId | Trạng thái đợt: Đã đề xuất, Nhận một phần, Đã nhận đủ. Đợt "Tồn đầu kỳ" có Nội dung đề xuất = "Tồn đầu kỳ" |
| `ChiTietDot` | Mã đợt, Tên thiết bị, Hãng/Model, SL đề xuất (N), SL đã nhận (N), Đơn giá (N), Ghi chú | |
| `YeuCauMuon` | Mã YC, Thời gian tạo (DT), Họ tên, Đơn vị/Lớp, SĐT, Email, Danh sách mượn (J), Mục đích/Học phần, Hạn trả đề xuất (DT), Mã xác nhận, Hết hạn QR (DT), Trạng thái, Email người duyệt, Thời gian duyệt (DT), Lý do từ chối, Mã phiếu tạo ra, Số lần làm mới QR (N), Thời điểm đồng ý dùng thông tin cá nhân (DT), requestId | Trạng thái: Chờ duyệt, Đã duyệt, Từ chối, Đã hủy, Hết hạn |
| `PhieuMuon` | Mã phiếu, Cách giao, Mã YC, Họ tên, Đơn vị/Lớp, SĐT, Email, Giảng viên phụ trách, Email người giao, Thời gian mượn (DT), Hạn trả (DT), Số lần gia hạn (N), Mục đích/Học phần, Số TB (N), Số TB đã trả (N), Trạng thái phiếu, requestId | Cách giao: Theo yêu cầu, Trực tiếp, Buổi thực hành. Trạng thái phiếu: Đang mượn, Trả một phần, Chờ biên bản, Đã trả đủ |
| `ChiTietPhieu` | Mã phiếu, Mã TB, Mã bộ/hộp, Nhóm hoặc người nhận, Tình trạng lúc giao, Thời gian giao (DT), Trạng thái dòng, Tình trạng lúc trả, Thời gian trả (DT), Người trả thực tế, Mã biên bản | Trạng thái dòng: Đang mượn, Đã trả, Chờ biên bản, Mất |
| `YeuCauGiaHan` | Mã GH, Mã phiếu, SĐT, Hạn hiện tại (DT), Hạn đề xuất (DT), Lý do, Thời gian gửi (DT), Trạng thái, Email người duyệt, Thời gian duyệt (DT), Ghi chú, requestId | Trạng thái: Chờ duyệt, Đã duyệt, Từ chối |
| `LichSu` | Mã GD, Thời gian (DT), Loại, Mã phiếu, Mã TB, Tình trạng trước, Tình trạng sau, Chi tiết hư hỏng, Cách xác nhận, Đối chiếu serie, Giá trị cũ, Giá trị mới, Mã biên bản, Mã điều chuyển, File ảnh (J), Người mượn, Người trả thực tế, Email người thao tác | Loại: Mượn, Trả, Gia hạn, Báo hỏng, Sửa chữa, Kiểm kê, Điều chuyển, Sửa serie, Thanh lý, Điều chỉnh. Cách xác nhận: Tích, Quét QR. Đối chiếu serie: Khớp, Lệch, Không có serie, Không đối chiếu. Người mượn: "Họ tên – SĐT". Chỉ ghi nối tiếp |
| `BienBan` | Mã BB, Mã phiếu, Danh sách Mã TB (J), Họ tên và SĐT người mượn, Email người lập, Thời gian lập (DT), Mô tả hư hỏng từng thiết bị (J), Tình trạng xác nhận (J), Nhân chứng (J), File biên bản đã ký (J), Ảnh hiện trạng (J), Trạng thái, requestId | Trạng thái: Chờ minh chứng, Hoàn tất. Mã phiếu trống khi báo hỏng ngoài phiếu |
| `DanhMucPhong` | Mã phòng, Tên phòng, Trạng thái, Ngày bắt đầu (D), Ngày ngừng (D), Mã điều chuyển liên quan, Ghi chú | Trạng thái: Đang dùng, Ngừng dùng. Dòng ban đầu 201-VNB |
| `DieuChuyen` | Mã ĐC, Thời gian (DT), Loại, Phòng cũ, Phòng mới, Danh sách Mã TB (J), Số TB (N), Lý do, Số quyết định/văn bản, File minh chứng (J), Email người thực hiện, Ghi chú, requestId | Loại: Một số thiết bị, Toàn bộ phòng, Đổi tên phòng. Không sửa, không xóa |
| `AnhThietBi` | Mã ảnh, Mã TB, File ID, Mô tả, Email người tải, Thời gian tải (DT), Trạng thái, requestId | Trạng thái: Hiển thị, Chờ xóa, Đã xóa |
| `AnhNho` | Mã TB, Ảnh thu nhỏ, Cập nhật lần cuối (DT) | Ảnh thu nhỏ: base64 JPEG, cạnh dài tối đa 300 px, không quá 30.000 ký tự |
| `YeuCauDieuChinh` | Mã YCĐC, Loại, Mã đối tượng, Giá trị hiện tại, Giá trị đề xuất, Lý do, Ảnh kèm theo (J), Email người yêu cầu, Thời gian (DT), Trạng thái, Email người duyệt, Thời gian duyệt (DT), Ghi chú duyệt, requestId | Loại: Xóa ảnh, Xóa minh chứng, Sửa serie. Trạng thái: Chờ duyệt, Đã duyệt, Từ chối |
| `SuaChua` | Mã SC, Mã TB, Ngày gửi (D), Nội dung hư hỏng, Nơi sửa, Chi phí (N), Ngày nhận lại (D), Kết quả, requestId | |
| `DotKiemKe` | Mã đợt KK, Phòng, Email người mở, Thời gian mở (DT), Thời gian đóng (DT), Trạng thái, Số phải có (N), Đủ (N), Sai phòng (N), Không tìm thấy (N), Ghi chú, requestId | Trạng thái: Đang kiểm, Đã đóng |
| `KiemKe` | Mã đợt KK, Mã TB hoặc Mã bộ/hộp, Thời gian xác nhận (DT), Cách xác nhận, Số lượng đếm (N), Email người kiểm, Phòng thực tế, Kết quả | Kết quả: Đủ, Sai phòng, Không tìm thấy |
| `TongHop` | Mã nhóm, Tên TB, Phòng, Tổng SL thực tế (N), Tại phòng (N), Đang mượn (N), Tốt (N), Hư hỏng (N), Đang sửa (N) | Script ghi giá trị, không dùng công thức |
| `NguoiDung` | Email, Họ tên, Vai trò, SĐT, Trạng thái, Ngày hết hạn (D), Phiên hợp lệ từ (DT), Ngày tạo (DT) | Vai trò: Admin, Quản lý, Chỉ xem. Trạng thái: Hoạt động, Khóa |
| `NhatKy` | Thời gian (DT), Email, Action, Đối tượng, Kết quả, Chi tiết | Email: email người thao tác, hoặc "công khai" (kèm SĐT trong Chi tiết khi có). Kết quả: Thành công, Từ chối, Lỗi. Chỉ ghi nối tiếp |
| `CauHinh` | Khóa, Giá trị, Mô tả | Mục 3 |
| `BoDem` | Loại mã, Kỳ, Số cuối đã cấp (N) | Mục 6 |
| `KetQuaRequest` | requestId, Thời gian (DT), Action, Email, Kết quả (J) | Câu hỏi C3. Mục 7.3 |

### 4.3 Cấu trúc các ô JSON

| Ô | Dạng |
| --- | --- |
| `YeuCauMuon.Danh sách mượn` | `[{"loai":"TB","ma":"MKCT-001"}, {"loai":"BO","ma":"BO-001","mon":["KD-001","KD-002"]}, {"loai":"HOP","ma":"HOP-001","soLuong":5}]`. Server thêm `"giuCho":[Mã TB]` cho bộ và hộp, `"boRa":true,"lyDo":"…"` khi thiết bị bị bỏ khỏi yêu cầu |
| `BienBan.Danh sách Mã TB` | `["MKCT-001", …]` |
| `BienBan.Mô tả hư hỏng từng thiết bị` | `[{"ma":"MKCT-001","moTa":"…"}]` |
| `BienBan.Tình trạng xác nhận` | `[{"ma":"MKCT-001","truoc":"Tốt","sau":"Hư hỏng nặng"}]` |
| `BienBan.Nhân chứng` | `[{"hoTen":"…","donVi":"…"}]` |
| `BienBan.File biên bản đã ký`, `BienBan.Ảnh hiện trạng`, `DieuChuyen.File minh chứng`, `YeuCauDieuChinh.Ảnh kèm theo`, `LichSu.File ảnh` | `[{"ma":"MC-20261105-001","fileId":"…","loai":"image/jpeg","trangThai":"Hiển thị"}]`. Tạm thời, chờ câu hỏi C8 |
| `KetQuaRequest.Kết quả` | Phần `data` của phản hồi đã trả. Nếu vượt 45.000 ký tự thì lưu `{"tomTat":true,"ma":"<mã bản ghi chính>"}`; khi gửi lại, server dựng lại kết quả từ bản ghi chính |

---

## 5. Tình trạng thiết bị

| Mã nội bộ | Tên hiển thị mặc định | Màu | Cho mượn | Tính vào Tổng SL thực tế |
| --- | --- | --- | --- | --- |
| `TOT` | Tốt | Xanh lá | Có | Có |
| `HONG_NHE` | Hư hỏng nhẹ | Vàng | Có, sau khi người quản lý xác nhận | Có |
| `HONG_NANG` | Hư hỏng nặng | Đỏ | Không | Có |
| `DANG_SUA` | Đang sửa chữa | Cam | Không | Có |
| `CHO_THANH_LY` | Chờ thanh lý | Xám | Không | Có |
| `DA_THANH_LY` | Đã thanh lý | Xám | Không | Không |
| `MAT` | Mất | Đỏ | Không | Không |
| `KHAC` | Khác | Xanh dương | Có, sau khi người quản lý xác nhận | Có |

- Cột Tình trạng lưu **tên hiển thị** (câu hỏi C4).
- Admin đổi tên trong `CauHinh` (khóa `TEN_TT_<mã>`) thì server ghi lại cột 5 của `ThietBi` và danh sách thả xuống trong vùng khóa.
- `LichSu`, `ChiTietPhieu` giữ tên tại thời điểm ghi.
- Code luôn quy về mã nội bộ (`Repo.statusCode`) trước khi xử lý.

---

## 6. Mã

| Mã | Định dạng | Khóa `BoDem` (Loại mã / Kỳ) |
| --- | --- | --- |
| Mã nhóm | 2–6 ký tự A–Z, 0–9 (mục 5 của đặc tả) | không dùng `BoDem` |
| Mã TB | `<Mã nhóm>-###`, ví dụ `MKCT-001`, sau 999 là 1000 | `NhomTB.Số thứ tự cuối đã cấp` (`Repo.nextDeviceCodes`): số tiếp theo lớn hơn cả bộ đếm lẫn mọi Mã TB đang có của nhóm, kể cả thiết bị Mất, Đã thanh lý |
| Yêu cầu mượn | `YC-yyyyMMdd-###` | YC / yyyyMMdd |
| Mã xác nhận | 6 ký tự từ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | không dùng |
| Phiếu mượn | `PM-yyyyMMdd-###` | PM / yyyyMMdd |
| Yêu cầu gia hạn | `GH-yyyy-###` | GH / yyyy |
| Biên bản | `BB-yyyy-###` | BB / yyyy |
| Điều chuyển | `DC-yyyy-###` | DC / yyyy |
| Ảnh thiết bị | `ANH-yyyyMMdd-###` | ANH / yyyyMMdd |
| Yêu cầu điều chỉnh | `YCDC-yyyy-###` | YCDC / yyyy |
| Đợt nhập | `DN-yyyy-##` | DN / yyyy |
| Sửa chữa | `SC-yyyy-###` | SC / yyyy |
| Đợt kiểm kê | `KK-yyyyMMdd-##` | KK / yyyyMMdd |
| Bộ | `BO-###` | BO / (trống) |
| Hộp | `HOP-###` | HOP / (trống) |
| Giao dịch (`LichSu.Mã GD`) | `GD-yyyyMMdd-####` | GD / yyyyMMdd. Đặc tả không quy định; xem `QUYET-DINH.md` |
| Minh chứng | `MC-yyyyMMdd-###` | MC / yyyyMMdd. Tạm thời, chờ C8 |

- Số chữ số trong bảng là tối thiểu; hết số thì mã dài thêm.
- Số lấy từ `BoDem` trong vùng khóa (`Repo.nextCodes`) và ghi ngay, nên số đã cấp không bao giờ bị cấp lại, kể cả khi bước sau bị lỗi.

---

## 7. API

### 7.1 Dạng request và response

Trình duyệt gửi `POST` tới URL web app với header `Content-Type: text/plain;charset=utf-8`, body là JSON:

```json
{ "action": "loan.checkin", "session": "<mã phiên>", "requestId": "<UUID>", "data": { } }
```

- `session`: bắt buộc với mọi action trừ `auth.login` và các action `pub.*`.
- `requestId`: bắt buộc với mọi action có cột "Ghi" = Có. Trình duyệt sinh UUID và giữ nguyên khi gửi lại.
- Action `pub.*` gửi thêm `data.clientId` (mã trình duyệt, `qltb.clientId`) và `data.accessCode` khi mã truy cập đang bật.

Phản hồi luôn là JSON:

```json
{ "ok": true, "data": { }, "serverTime": "2026-11-10T08:30:00+07:00" }
{ "ok": false, "error": { "code": "DEVICE_NOT_AVAILABLE", "message": "…tiếng Việt…", "details": { } }, "serverTime": "…" }
```

`message` dễ hiểu, không lộ chi tiết kỹ thuật, không có stack trace.

### 7.2 Trình tự xử lý ở server

1. Đọc JSON. Sai dạng → `BAD_REQUEST`; action không có trong bảng → `UNKNOWN_ACTION`.
2. Action quản lý: kiểm tra mã phiên (chữ ký, hạn, "Phiên hợp lệ từ"), đối chiếu `NguoiDung` (lưu đệm 5 phút), kiểm tra vai trò. Không đạt → lỗi, và ghi `NhatKy` "Từ chối" khi đã biết email. Mọi lần ghi nối tiếp (`NhatKy`, `LichSu`, `KetQuaRequest`) đều chạy trong khóa, kể cả khi ghi nhật ký cho action chỉ đọc.
3. Action công khai: kiểm tra mã truy cập, giới hạn tần suất, trường ẩn chống bot.
4. Action ghi:
   - lấy khóa (chờ tối đa 10 giây; không được thì trả `BUSY` và không ghi gì);
   - tìm `requestId` trong `KetQuaRequest`, có thì trả lại kết quả cũ;
   - nếu có bản ghi chính mang `requestId` nhưng chưa ghi xong thì chạy tiếp phần còn thiếu;
   - nếu không, đọc → kiểm tra → ghi theo thứ tự: bản ghi chính → `ChiTietPhieu` → `ThietBi` → `LichSu` → `NhatKy` → `KetQuaRequest`;
   - `flush()` → nhả khóa.
5. Ghi `ThietBi` thì tăng `PHIEN_BAN_DU_LIEU`.

### 7.3 `KetQuaRequest`

- Mỗi action ghi thành công có một dòng ở đây.
- Dòng cũ hơn 30 ngày được trigger hằng ngày dọn (M8).
- Bộ đệm `req:<requestId>` (10 phút) chỉ để tra nhanh. Không có bộ đệm thì tra Sheet.

### 7.4 Mã lỗi

| Mã | Khi nào | Câu báo mẫu |
| --- | --- | --- |
| `BAD_REQUEST` | JSON sai, thiếu `action`, thiếu `requestId` ở action ghi | Yêu cầu không hợp lệ. Hãy tải lại trang |
| `UNKNOWN_ACTION` | Action không có trong bảng | Chức năng không tồn tại |
| `VALIDATION` | Dữ liệu sai; `details.fields` liệt kê trường lỗi | (tùy trường) |
| `AUTH_REQUIRED` | Thiếu mã phiên | Vui lòng đăng nhập |
| `SESSION_INVALID` | Sai chữ ký hoặc sai dạng | Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại |
| `SESSION_EXPIRED` | Quá 12 giờ, hoặc cấp trước "Phiên hợp lệ từ" | Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại |
| `LOGIN_FAILED` | ID token sai `aud`, `iss`, `email_verified`, hết hạn, email ngoài tên miền cho phép, hoặc `tokeninfo` lỗi | Chưa đăng nhập được, vui lòng thử lại |
| `ACCOUNT_NOT_ALLOWED` | Email không có trong `NguoiDung`, bị khóa hoặc hết hạn quyền | Tài khoản chưa được cấp quyền |
| `FORBIDDEN` | Vai trò không đủ quyền | Bạn không có quyền thực hiện thao tác này |
| `QR_MANAGER_ONLY` | Vai trò Chỉ xem mở QR thiết bị hoặc QR yêu cầu | Chỉ người quản lý được thao tác bằng mã QR |
| `CONFIG_MISSING` | Thiếu `CLIENT_ID` hoặc thuộc tính bắt buộc | Hệ thống chưa cấu hình xong, báo Admin |
| `ACCESS_CODE_REQUIRED` | Mã truy cập đang bật, thiếu hoặc sai mã | Vui lòng nhập mã truy cập |
| `RATE_LIMITED` | Vượt giới hạn tần suất | Hệ thống đang bận, vui lòng thử lại sau |
| `NOT_FOUND` | Không có đối tượng; tra cứu phiếu sai SĐT hoặc Mã phiếu | Không tìm thấy |
| `DEVICE_NOT_AVAILABLE` | Thiết bị không sẵn sàng; `details.items` liệt kê mã và lý do | Một số thiết bị không còn sẵn sàng |
| `RESERVED_BY_OTHER` | Thiết bị đang giữ chỗ cho yêu cầu khác; `details` có Mã YC | Thiết bị đang được giữ cho yêu cầu khác |
| `CONFLICT` | Đối tượng đã đổi trạng thái (ví dụ yêu cầu đã được người khác duyệt) | Dữ liệu vừa thay đổi, hãy tải lại |
| `EXPIRED` | QR hoặc giữ chỗ đã hết hạn | Mã QR đã hết hạn |
| `LIMIT_EXCEEDED` | Vượt số dòng, số lần làm mới, số yêu cầu chờ duyệt, giới hạn gia hạn | (tùy giới hạn) |
| `DUPLICATE_SERIAL` | Serie trùng | Số serie đã có ở thiết bị khác |
| `DUPLICATE_CODE` | Mã nhóm, mã phòng hoặc mã bộ/hộp đã có | Mã đã tồn tại |
| `EVIDENCE_REQUIRED` | Thiếu ảnh, minh chứng hoặc nhân chứng | Cần tải minh chứng |
| `FILE_INVALID` | Sai loại file hoặc quá kích thước | File không hợp lệ |
| `HAS_TRANSACTIONS` | Xóa thiết bị đã có giao dịch | Thiết bị đã có giao dịch, không xóa được |
| `BUSY` | Không lấy được khóa ghi | Hệ thống đang bận, vui lòng bấm lại sau vài giây |
| `SERVER_ERROR` | Lỗi khác; chi tiết chỉ ghi `NhatKy` | Có lỗi xảy ra, vui lòng thử lại |

### 7.5 Bảng action

- Vai trò: A = Admin, Q = Quản lý, X = Chỉ xem, P = công khai (không đăng nhập).
- Ghi = Có: bắt buộc `requestId`, chạy trong khóa, ghi `NhatKy`.
- Mọi action có kiểm thử "vai trò không đủ quyền bị từ chối".
- Lỗi chung có thể xảy ra ở mọi action, không ghi lại trong từng dòng:
  - action quản lý: `AUTH_REQUIRED`, `SESSION_*`, `ACCOUNT_NOT_ALLOWED`, `FORBIDDEN`;
  - action ghi: `BUSY`, `VALIDATION`;
  - action `pub.*`: `ACCESS_CODE_REQUIRED`, `RATE_LIMITED`;
  - mọi action: `SERVER_ERROR`.
- Mốc thực hiện được thêm trường tùy chọn, không bỏ trường đã ghi ở đây.

**Kiểu dữ liệu dùng chung** (tên trường không dấu, giá trị chuỗi trừ khi ghi khác; thời gian dạng ISO 8601):

| Kiểu | Trường |
| --- | --- |
| `TB` (thiết bị, bản quản lý) | `ma, ten, maNhom, hangModel, serie, tinhTrang` (tên hiển thị), `tinhTrangMa` (mã nội bộ), `chiTietTinhTrang, luuTru, phong, maBoHop, temRieng` (bool), `maDot, ngayNhan, ghiChu, maThamChieu, anhDaiDien, nguoiMuon, sdtMuon, maPhieu, hanTra, giuChoYC, giuChoDen, canInLaiTem` (bool), `sanSang` (bool), `lyDoKhongSanSang` |
| `TBCongKhai` | `ma, ten, maNhom, tinhTrang, phong, sanSang` (bool), `maBoHop`. Không có serie, người mượn, SĐT, ghi chú, lịch sử |
| `BoHop` | `ma, loai` (Bộ/Hộp), `ten, maNhom, phong, moTa, trangThai, anhDaiDien, tong, sanSang, dangMuon, huHong` (số), `mon` (mảng Mã TB) |
| `File` (tải lên) | `ten, loai` (`image/jpeg`, `image/png`, `application/pdf`), `base64`, `moTa` (tùy chọn) |
| `MinhChung` (trả về) | `ma` (MC-…), `loai, trangThai, ten` |
| `NguoiMuon` | `hoTen, donVi, sdt` (10 chữ số), `email` (tùy chọn) |
| `DongGiao` (gửi lên khi giao) | `ma, cachXacNhan` (Tích/Quét QR), `doiChieuSerie` (Khớp/Lệch/Không có serie/Không đối chiếu), `tinhTrangMoi` (mã nội bộ, khi đổi), `chiTiet`, `xacNhanCanhBao` (bool, với Hư hỏng nhẹ, Khác), `lech` (`{ghiChu, anh: File}`, khi Lệch và vẫn tiếp tục), `nhomNguoiNhan` (phiếu buổi) |
| `DongBoHop` (gửi lên) | `maBoHop`, `mon` (Mã TB chọn cụ thể) hoặc `soLuong` (hộp; server tự chọn Mã TB: Tốt trước, số thứ tự nhỏ trước) |
| `DongTra` (gửi lên khi nhận lại) | `ma, cachXacNhan, doiChieuSerie, tinhTrang` (mã nội bộ), `chiTiet, anh` (mảng `File`, bắt buộc khi khác Tốt), `lech` |
| `Phieu` | `maPhieu, cachGiao, maYC, nguoiMuon` (`NguoiMuon`), `giangVien, nguoiGiao, thoiGianMuon, hanTra, soLanGiaHan, mucDich, soTB, soTBDaTra, trangThai, quaHan` (bool), `dong` (mảng `{ma, ten, maBoHop, nhomNguoiNhan, tinhTrangLucGiao, trangThaiDong, tinhTrangLucTra, thoiGianTra, nguoiTra, maBB}`) |
| `YeuCau` | `maYC, thoiGianTao, nguoiMuon, mucDich, hanTraDeXuat, hetHanQR, trangThai, soLanLamMoi, lyDoTuChoi, maPhieu, dong` (mảng `{loai, ma, ten, mon, soLuong, giuCho, boRa, lyDo, tinhTrang, serie}`; `serie` chỉ có ở API quản lý) |
| `BienBan` | `maBB, maPhieu, nguoiMuon, nguoiLap, thoiGianLap, thietBi` (mảng `{ma, ten, serie, truoc, sau, moTa}`), `nhanChung` (mảng `{hoTen, donVi}`), `fileDaKy, anhHienTrang` (mảng `MinhChung`), `trangThai` |

**M1 – đăng nhập, tài khoản, cấu hình**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `auth.login` | P | Chỉ `NhatKy`, không cần `requestId` | `idToken` | `session`, `expiresAt`, `user {email, name, role}` | `LOGIN_FAILED`, `ACCOUNT_NOT_ALLOWED`, `CONFIG_MISSING` |
| `auth.me` | A, Q, X | Không | – | `user`, `expiresAt` | |
| `auth.logout` | A, Q, X | Chỉ `NhatKy` | – | – | |
| `user.list` | A | Không | – | `users[] {email, name, role, phone, status, expiresOn, validFrom, createdAt, isOwner}` | |
| `user.save` | A | Có | `email, name, role, phone, status, expiresOn` | `user` | `VALIDATION` (khóa hoặc hạ quyền chủ sở hữu, email sai, không phải Gmail/tên miền cho phép) |
| `user.revokeSessions` | A | Có | `email` | `validFrom` | `NOT_FOUND` |
| `config.get` | A | Không | – | `values {khóa: giá trị}`, `descriptions {khóa: mô tả}`, `statuses[] {code, name, color, lendable, confirm}` | |
| `config.save` | A | Có | `values {khóa: giá trị}` (chỉ khóa đã đổi) | như `config.get` | `VALIDATION` (khóa không được sửa, giá trị ngoài khoảng, bật mã truy cập mà thiếu mã, trùng tên tình trạng, phòng chưa có) |
| `app.bootstrap` | A, Q, X | Không | `knownVersion` | `user`, `expiresAt`, `unitName`, `statuses`, `rooms[] {ma, ten, trangThai}`, `dataVersion`, `limits {hanMuonNgay, hanDeXuatToiDaNgay, phienGio}`, `serverVersion`; từ M2 thêm `devices` khi `knownVersion` khác `dataVersion` | |

**M2 – danh mục, nhập hàng, bộ và hộp, tem**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `device.list` | A, Q, X | Không | `knownVersion` | `dataVersion, unchanged` (bool); khi đổi thì thêm `devices[]` (`TB`), `kits[]` (`BoHop`) | |
| `device.get` | A, Q, X | Không | `ma` | `device` (`TB`), `history[]` (dòng `LichSu`), `photos[]` (`{ma, moTa, trangThai, laDaiDien}`), `loan` (`Phieu` đang mượn, nếu có) | `NOT_FOUND` |
| `device.update` | A | Có | `ma`, `fields {ten, hangModel, ghiChu, maThamChieu, ngayNhan}` (không có Mã TB, serie, phòng, tình trạng) | `device` | `NOT_FOUND` |
| `device.updateSerial` | A | Có | `ma, serie, lyDo` | `device`; ghi `LichSu` "Sửa serie" kèm giá trị cũ, mới | `NOT_FOUND`, `DUPLICATE_SERIAL` |
| `device.delete` | A | Có | `ma, lyDo` | `ma` | `NOT_FOUND`, `HAS_TRANSACTIONS` |
| `group.list` | A, Q, X | Không | – | `groups[] {maNhom, tenHienThi, tenChuanHoa, donViTinh, soCuoi, tong}` | |
| `group.suggest` | A | Không | `names[]` | `items[] {ten, tenChuanHoa, maNhom` (đã có hoặc dự kiến), `daCo` (bool), `trung` (bool), `goiY, canTuDat` (bool), `canhBaoHang` (tên hãng tìm thấy trong tên)`}` | |
| `group.update` | A | Có | `maNhom, tenHienThi, donViTinh` | `group` | `NOT_FOUND` |
| `room.list` | A, Q, X | Không | – | `rooms[] {ma, ten, trangThai}` | |
| `kit.list` | A, Q, X | Không | `loai` (tùy chọn) | `kits[]` (`BoHop`) | |
| `kit.get` | A, Q, X | Không | `ma` | `kit` (`BoHop`), `items[]` (`TB`), `loans[]` (Mã phiếu đang giữ món của bộ/hộp) | `NOT_FOUND` |
| `kit.create` | A | Có | `loai, ten, maNhom` (bắt buộc với hộp), `phong, moTa` | `kit` | `VALIDATION` |
| `kit.update` | A | Có | `ma, ten, moTa, trangThai` | `kit` | `NOT_FOUND` |
| `kit.addItems` | A | Có | `ma, items[]` (Mã TB) | `kit`; ghi `LichSu` "Điều chỉnh"; thiết bị thành "Gắn tem riêng" = Không | `NOT_FOUND`, `VALIDATION` (hộp khác Mã nhóm, thiết bị đang mượn, đã thuộc bộ/hộp khác) |
| `kit.removeItems` | A | Có | `ma, items[]` | `kit`; thiết bị rút ra thành "Gắn tem riêng" = Có, "Cần in lại tem" = Có | `NOT_FOUND` |
| `batch.list` | A, Q, X | Không | `trangThai` (tùy chọn) | `batches[] {ma, noiDung, soToTrinh, ngayDeXuat, ngayNhan, nhaCungCap, nguonKinhPhi, trangThai, slDeXuat, slDaNhan}` | |
| `batch.get` | A, Q, X | Không | `ma` | `batch`, `lines[] {stt, ten, hangModel, maNhom, slDeXuat, slDaNhan, donGia, ghiChu}` | `NOT_FOUND` |
| `batch.create` | A | Có | `noiDung, soToTrinh, ngayDeXuat, nhaCungCap, nguonKinhPhi, ghiChu, lines[] {ten, hangModel, slDeXuat, donGia, maNhom}` (`maNhom` khi Admin tự đặt hoặc chọn nhóm có sẵn) | `batch` (mã DN-…), `lines` | `VALIDATION`, `DUPLICATE_CODE` |
| `batch.update` | A | Có | `ma`, các trường như `batch.create` | `batch` | `NOT_FOUND`, `VALIDATION` (giảm SL đề xuất dưới SL đã nhận) |
| `batch.receive` | A | Có | `ma, ngayNhan, dryRun` (bool), `items[] {dong` (số dòng hàng), `serie` hoặc `soLuong` (không serie), `tinhTrang, phong, boHop {ma}` hoặc `boHopMoi {loai, ten}` `}`; tối đa 500 thiết bị | `dryRun`: `preview[] {maTB, ten, serie, tinhTrang, phong, boHop, loi[]}`; lưu: `created[]` (Mã TB), `kitsCreated[]`, `labels[]` (mã cần in), `batch` | `VALIDATION`, `DUPLICATE_SERIAL`, `LIMIT_EXCEEDED` (quá 500) |
| `batch.importInitial` | A | Có | `dryRun, rows[] {dongExcel, ten, hangModel, serie, soLuong, tinhTrang, phong, maBoHop, maThamChieu, ngayNhan, ghiChu}` | như `batch.receive`; lỗi theo `dongExcel` | `VALIDATION`, `DUPLICATE_SERIAL`, `LIMIT_EXCEEDED` |
| `label.list` | A, Q | Không | `nguon` (dot/nhom/ma/boHop/inLai), `giaTri` (mã đợt, mã nhóm hoặc mảng mã) | `labels[] {ma, ten, loai` (TB/Bộ/Hộp)`, url}`; thiết bị trong bộ/hộp được thay bằng tem bộ/hộp | |
| `label.markPrinted` | A, Q | Có | `codes[]` | `count` | |

**M3 – trang công khai** (mọi action `pub.*` không cần phiên)

| Action | Ghi | `data` gửi lên (ngoài `clientId`, `accessCode`) | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- |
| `pub.init` | Không | – | `unitName, accessCodeRequired` (bool), `accessCodeOk` (bool), `dataVersion, limits {soDongToiDa, hanDeXuatToiDaNgay, hanMacDinhNgay, giuChoPhut, nhipHoi}`, `privacyNotice {mucDich, thoiGianLuuThang, lienHe}` | |
| `pub.devices` | Không | `knownVersion` | `dataVersion, unchanged`; khi đổi: `devices[]` (`TBCongKhai`), `kits[] {ma, loai, ten, phong, tong, sanSang, mon[]` (bộ: `TBCongKhai`)`}` | |
| `pub.thumbs` | Không | `codes[]` (Mã TB, tối đa 50) | `thumbs {mã: base64}`; thiết bị dùng ảnh nhóm trả `groupThumbs {maNhom: base64}` | |
| `pub.createRequest` | Có | `nguoiMuon` (`NguoiMuon`), `mucDich, hanTra` (yyyy-MM-dd), `dong[] {loai` (TB/BO/HOP)`, ma, mon[], soLuong}`, `dongY` (true), `hp` (trường ẩn, phải rỗng) | `maYC, maXacNhan, hetHanQR, yeuCau` (`YeuCau`) | `VALIDATION` (thiếu ô đồng ý, SĐT sai, hạn quá giới hạn), `LIMIT_EXCEEDED` (quá 10 dòng, đã có yêu cầu chờ duyệt), `DEVICE_NOT_AVAILABLE` (`details.items[] {ma, lyDo}`) |
| `pub.requestStatus` | Không | `maYC, maXacNhan` | `trangThai, hetHanQR, maPhieu, lyDo, boRa[]` | `NOT_FOUND` |
| `pub.getRequest` | Không | `maYC, maXacNhan` | `yeuCau` (`YeuCau`, không có serie) | `NOT_FOUND` |
| `pub.refreshRequest` | Có | `maYC, maXacNhan` | `maXacNhan` (mới), `hetHanQR, yeuCau` | `NOT_FOUND`, `LIMIT_EXCEEDED` (lần thứ 3), `CONFLICT` (không còn chờ duyệt), `DEVICE_NOT_AVAILABLE` |
| `pub.cancelRequest` | Có | `maYC, maXacNhan` | `trangThai` = Đã hủy | `NOT_FOUND`, `CONFLICT` |

**M4 – giao và nhận lại**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `request.listPending` | A, Q, X | Không | – | `requests[]` (`YeuCau` tóm tắt, không có mã xác nhận); từ M6 thêm `extensions[]` (`{maGH, maPhieu, sdt, hanHienTai, hanDeXuat, lyDo, thoiGianGui}`) | |
| `request.open` | A, Q | Không | `maYC, maXacNhan` | `yeuCau` (`YeuCau` có serie, ảnh đại diện), `warnings[] {loai` (QUA_HAN/BIEN_BAN)`, maPhieu, maBB}` | `QR_MANAGER_ONLY` (Chỉ xem), `NOT_FOUND`, `EXPIRED`, `CONFLICT` (đã duyệt, từ chối, hủy) |
| `request.approve` | A, Q | Có | `maYC, maXacNhan, nguoiMuon` (đã sửa nếu sai), `hanTra, dong[]` (`DongGiao`), `boHop[]` (`DongBoHop`), `boRa[] {ma, lyDo}` | `maPhieu, hanTra, phieu` (`Phieu`) | `CONFLICT` (người khác đã duyệt), `EXPIRED`, `DEVICE_NOT_AVAILABLE`, `VALIDATION` (thiết bị không thuộc yêu cầu, thiếu lý do bỏ ra, chưa xác nhận Hư hỏng nhẹ) |
| `request.reject` | A, Q | Có | `maYC, maXacNhan, lyDo` | `trangThai` | `CONFLICT`, `VALIDATION` |
| `request.cancelHold` | A, Q | Có | `ma` (Mã TB đang bị giữ), `lyDo` | `maYC` bị bỏ thiết bị | `NOT_FOUND`, `VALIDATION` |
| `loan.lookupBorrower` | A, Q | Không | `sdt` | `nguoiMuon` (từ phiếu gần nhất, hoặc rỗng), `warnings[]` | `VALIDATION` |
| `loan.checkout` | A, Q | Có | `cachGiao` (Trực tiếp; từ M6 thêm Buổi thực hành), `nguoiMuon, mucDich, hanTra, dong[]` (`DongGiao`), `boHop[]` (`DongBoHop`), `huyGiuCho[] {ma, lyDo}`; phiếu buổi thêm `lop, hocPhan, giangVien {hoTen, sdt}, batDau, ketThuc` | `maPhieu, hanTra, phieu` | `DEVICE_NOT_AVAILABLE`, `RESERVED_BY_OTHER`, `VALIDATION` |
| `loan.listActive` | A, Q, X | Không | `tuKhoa` (tên, SĐT, Mã phiếu, Mã TB; tùy chọn) | `loans[]` (`Phieu`, nhóm theo người mượn ở giao diện) | |
| `loan.get` | A, Q, X | Không | `maPhieu` | `phieu` | `NOT_FOUND` |
| `loan.findByDevice` | A, Q | Không | `ma` (Mã TB hoặc Mã bộ/hộp) | `loans[] {maPhieu, nguoiMuon, hanTra, dongConMuon[]}` | `NOT_FOUND` |
| `loan.checkin` | A, Q | Có | `maPhieu, nguoiTra, dong[]` (`DongTra`), `boHop[] {maBoHop, soLuong, mon[]}` | `phieu, maBB` (khi có Hư hỏng nặng, Mất), `conThieu[], nhacPhongMoi[] {ma, phong}` | `NOT_FOUND`, `CONFLICT` (thiết bị thuộc phiếu khác: `details.maPhieu`), `EVIDENCE_REQUIRED` (khác Tốt mà thiếu ảnh) |
| `device.markRelabel` | A, Q | Có | `ma` | `ma` | `NOT_FOUND` |
| `dash.get` | A, Q, X | Không | – | `homNay {ycChoDuyet, ghChoDuyet, denHanHomNay, quaHan, buoiDangDienRa, bbChoMinhChung, dcChoDuyet}`, `tong {thietBi, dangMuon, huHong, dangSua}`, `ganDay[]` (10 dòng `LichSu`), `canhBao[]` (từ M8 thêm `saoLuuGanNhat`, sai lệch nhất quán, hạn mức email) | |

**M5 – biên bản, ảnh, yêu cầu điều chỉnh**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `damage.list` | A, Q, X | Không | `trangThai` (tùy chọn) | `reports[]` (`BienBan` tóm tắt) | |
| `damage.get` | A, Q, X | Không | `maBB` | `report` (`BienBan`) | `NOT_FOUND` |
| `damage.update` | A, Q | Có | `maBB, nhanChung[] {hoTen, donVi}, moTa[] {ma, moTa}` | `report` | `NOT_FOUND`, `CONFLICT` (đã hoàn tất) |
| `damage.uploadEvidence` | A, Q | Có | `maBB, loai` (fileDaKy/anhHienTrang), `files[]` (`File`, tối đa 5) | `report` | `FILE_INVALID`, `LIMIT_EXCEEDED`, `CONFLICT` |
| `damage.complete` | A, Q | Có | `maBB` | `report`; thiết bị và phiếu được cập nhật theo mục 7 của đặc tả; email Admin | `EVIDENCE_REQUIRED` (thiếu minh chứng hoặc nhân chứng), `CONFLICT` |
| `damage.reportOutside` | A, Q | Có | `ma, tinhTrang` (mã nội bộ), `chiTiet, anh[]` (`File`, bắt buộc) | `device`; mức nặng hoặc Mất thêm `maBB` | `EVIDENCE_REQUIRED`, `CONFLICT` (thiết bị đang mượn: dùng nhận lại) |
| `device.recoverLost` | A | Có | `ma, tinhTrang, lyDo, files[]` | `device` | `VALIDATION` (không ở trạng thái Mất), `EVIDENCE_REQUIRED` |
| `photo.list` | A, Q, X | Không | `ma` | `photos[] {ma, moTa, trangThai, laDaiDien, thoiGian, nguoiTai}` | `NOT_FOUND` |
| `photo.upload` | A, Q | Có | `ma, files[]` (`File` ảnh, đã nén), `moTa` | `photos[]` | `FILE_INVALID`, `LIMIT_EXCEEDED` |
| `photo.setPrimary` | A, Q | Có | `maAnh, thumb` (base64 ≤ 30.000 ký tự) | `device` | `NOT_FOUND`, `FILE_INVALID` (ảnh thu nhỏ quá dài) |
| `file.get` | A, Q, X | Không | `ma` (Mã ảnh ANH-… hoặc mã minh chứng MC-…) | `ten, loai, base64` | `NOT_FOUND` |
| `adjust.create` | A, Q | Có | `loai` (Xóa ảnh/Xóa minh chứng/Sửa serie), `maDoiTuong, giaTriDeXuat, lyDo, anh[]` | `maYCDC` | `VALIDATION`, `NOT_FOUND` |
| `adjust.list` | A, Q | Không | `trangThai` | `items[] {maYCDC, loai, maDoiTuong, giaTriHienTai, giaTriDeXuat, lyDo, nguoiYeuCau, thoiGian, trangThai, ghiChuDuyet}` | |
| `adjust.decide` | A | Có | `maYCDC, dongY` (bool), `ghiChu` | `item` | `CONFLICT` (đã xử lý), `DUPLICATE_SERIAL` |

**M6 – điều chuyển, buổi thực hành, tra cứu, gia hạn**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `transfer.create` | A, Q | Có | `loai` (Một số thiết bị/Toàn bộ phòng/Đổi tên phòng), `phongCu, phongMoi` (mã có sẵn) hoặc `phongMoiTao {ma, ten}`, `thietBi[]` (Mã TB, Mã bộ/hộp), `lyDo, soQuyetDinh, files[]` (bắt buộc) | `maDC, soTB, thietBi[]` | `VALIDATION`, `EVIDENCE_REQUIRED`, `DUPLICATE_CODE` |
| `transfer.list` | A, Q, X | Không | `phong` (tùy chọn) | `transfers[] {maDC, thoiGian, loai, phongCu, phongMoi, soTB, lyDo, soQuyetDinh, nguoiThucHien}` | |
| `room.create` | A, Q | Có | `ma, ten` | `room` | `DUPLICATE_CODE` |
| `pub.lookupLoan` | P | Không (chỉ đếm lần sai trong bộ đệm) | `sdt, maPhieu` | `phieu` (`Phieu` không có serie), `extensions[]` | `NOT_FOUND` (cùng một câu cho sai SĐT hoặc sai mã), `RATE_LIMITED` |
| `pub.requestExtension` | P | Có | `sdt, maPhieu, hanMoi` (yyyy-MM-dd), `lyDo` | `maGH, trangThai` | `NOT_FOUND`, `LIMIT_EXCEEDED` (quá 2 lần, quá 7 ngày, đang có yêu cầu chờ), `VALIDATION` (phiếu buổi thực hành) |
| `extension.decide` | A, Q | Có | `maGH, dongY, ghiChu` | `phieu` (hạn trả và số lần gia hạn mới) | `CONFLICT` |

**M7 – kiểm kê, sửa chữa, thanh lý, báo cáo**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `inventory.list` | A, Q, X | Không | – | `rounds[] {maKK, phong, nguoiMo, thoiGianMo, thoiGianDong, trangThai, soPhaiCo, du, saiPhong, khongThay}` | |
| `inventory.get` | A, Q, X | Không | `maKK` | `round`, `items[] {ma, ten, loai, phong, ketQua, soLuongDem, soPhaiCo}` | `NOT_FOUND` |
| `inventory.open` | A, Q | Có | `phong` | `round` (mã KK-…) | `VALIDATION` (phòng đang có đợt mở) |
| `inventory.mark` | A, Q | Có | `maKK, items[] {ma, cachXacNhan, soLuongDem` (hộp)`}` | `items[]` kèm kết quả tạm | `CONFLICT` (đợt đã đóng), `NOT_FOUND` |
| `inventory.close` | A, Q | Có | `maKK` | `round` với đủ, sai phòng, không tìm thấy (không tính thiết bị đang mượn) | `CONFLICT` |
| `repair.list` | A, Q, X | Không | `trangThai` (tùy chọn) | `repairs[] {maSC, ma, ngayGui, noiDung, noiSua, chiPhi, ngayNhan, ketQua}` | |
| `repair.send` | A, Q | Có | `ma, noiDung, noiSua, ngayGui` | `maSC`; tình trạng thành Đang sửa chữa | `DEVICE_NOT_AVAILABLE` (đang mượn) |
| `repair.receive` | A, Q | Có | `maSC, ngayNhan, ketQua, chiPhi, tinhTrang` (mã nội bộ sau sửa), `chiTiet` | `repair, device` | `CONFLICT` (đã nhận) |
| `device.setStatus` | A | Có | `codes[], tinhTrang` (mã nội bộ), `chiTiet` (bắt buộc khi khác Tốt) | `devices[]` | `VALIDATION` (thiết bị đang mượn; Mất, Đã thanh lý phải qua biên bản, thanh lý) |
| `disposal.complete` | A | Có | `codes[], soQuyetDinh, ngay` | `devices[]`; Tổng SL thực tế tính lại | `VALIDATION` (không ở Chờ thanh lý) |
| `report.get` | A, Q, X | Không | `loai` (tong/dot/phong/quaHan/huHong/dieuChuyen/suaChua/kiemKe/lichSu), `tuNgay, denNgay`, bộ lọc | `columns[], rows[]` (giao diện xuất Excel, in) | `VALIDATION` |
| `borrower.history` | A, Q, X | Không | `sdt` | `nguoiMuon, dangGiu[]` (`TB`), `phieu[]` (`Phieu` tóm tắt), `soLanTreHan, soBienBan` | `VALIDATION` |

**M8 – vận hành**

| Action | Vai trò | Ghi | `data` gửi lên | `data` trả về | Lỗi riêng |
| --- | --- | --- | --- | --- | --- |
| `log.list` | A | Không | `tuNgay, denNgay, email, action, ketQua, trang` | `rows[] {thoiGian, email, action, doiTuong, ketQua, chiTiet}`, `tong` | |
| `consistency.run` | A | Chỉ `NhatKy` | – | `issues[] {loai, ma, moTa}`, `thoiGian` | |
| `archive.run` | A | Có | `nam` (năm đã kết thúc) | `fileId`, `soDong {NhatKy, LichSu}` | `VALIDATION` (năm chưa kết thúc) |

**Hàm chạy tay và trigger** (không gọi qua API): `setup()`, `smokeTest()`, `recalcAll()` (M2), `installTriggers()` (M3).

| Trigger | Mốc | Việc |
| --- | --- | --- |
| `triggerHourly` | M3 | Chuyển yêu cầu quá hạn QR sang "Hết hạn", dọn giữ chỗ |
| `triggerDaily` | M8 | Email tổng hợp khoảng 07:00, nhắc hạn, `kiemTraNhatQuan()`, dọn `KetQuaRequest` |
| `triggerWeekly` | M8 | Sao lưu, giữ 8 bản |
| `triggerMonthly` | M8 | Ẩn danh dữ liệu cá nhân quá hạn lưu |

---

## 8. Bộ đệm và lưu trữ trình duyệt

### 8.1 CacheService

Mất bộ đệm không được làm sai nghiệp vụ. Khóa tối đa 250 ký tự, giá trị tối đa 100 KB.

| Khóa | Thời hạn | Nội dung |
| --- | --- | --- |
| `nd:<email>` | 300 giây | Kết quả đối chiếu `NguoiDung`. Xóa ngay khi Admin khóa, đổi vai trò, đăng xuất mọi thiết bị |
| `ch` | 300 giây | Bản đọc `CauHinh`. Xóa khi `config.save` |
| `pub:<dataVersion>:n` và `pub:<dataVersion>:<i>` | `CACHE_CONG_KHAI_GIAY` | Danh sách công khai chia khối 30.000 ký tự (tiếng Việt tối đa 3 byte mỗi ký tự, vẫn dưới 100 KB) |
| `yc:<Mã YC>` | 6 giờ | Trạng thái yêu cầu cho `pub.requestStatus`. Ghi lại mỗi khi yêu cầu đổi trạng thái |
| `req:<requestId>` | 600 giây | Kết quả đã trả của action ghi (bản sao nhanh của `KetQuaRequest`) |
| `rl:<loại>:<khóa>:<cửa sổ>` | Bằng cửa sổ | Đếm giới hạn tần suất (SĐT, toàn hệ thống, mã trình duyệt) |

### 8.2 localStorage (tiền tố `qltb.`)

| Khóa | Khu vực | Nội dung |
| --- | --- | --- |
| `qltb.session` | Quản lý | Mã phiên |
| `qltb.ui` | Cả hai | Tùy chọn giao diện (chế độ xem, bộ lọc gần nhất) |
| `qltb.clientId` | Công khai | Mã trình duyệt ngẫu nhiên |
| `qltb.accessCode` | Công khai | Mã truy cập đã nhập |
| `qltb.cart` | Công khai | Danh sách mượn |
| `qltb.borrower` | Công khai | Họ tên, đơn vị/lớp, SĐT, email của người mượn trên máy đó (nút "Không phải tôi" xóa) |
| `qltb.myRequests` | Công khai | Mã YC và mã xác nhận đã gửi |
| `qltb.myLoans` | Công khai | Mã phiếu và SĐT để tra cứu |

Dữ liệu quản lý (serie, người mượn, SĐT, danh sách bản quản lý) chỉ giữ trong bộ nhớ của tab, không ghi localStorage.

---

## 9. Phiên bản cấu trúc và file backend

| `SCHEMA_VERSION` | Mốc | Thay đổi |
| --- | --- | --- |
| 1 | M0 | Tạo 25 sheet ở mục 4 |

`setup()` còn chạy một bước rà soát sau các bước nâng cấp: thêm lại sheet hoặc cột bị xóa nhầm. Bước này không đổi dữ liệu đã có.

File backend trong `gas/` (clasp đẩy lên thành `.gs`):

- Đã có từ M0: `Config`, `Util`, `Repo`, `Migrations`, `Setup`, `SmokeTest`.
- Đã có từ M1:
  - `Api`: `doPost`, `doGet`, bảng action, `requestId`, `NhatKy`;
  - `Auth`: đăng nhập, mã phiên, tài khoản;
  - `HeThong`: cấu hình, `app.bootstrap`;
  - `appsscript.json`.
- Dự kiến: `PublicApi`, `ThietBi`, `NhapHang`, `BoHop`, `YeuCau`, `MuonTra`, `BienBan`, `HinhAnh`, `DieuChinh`, `DieuChuyen`, `BaoCao`, `Triggers`.

`appsscript.json`:

- múi giờ `Asia/Ho_Chi_Minh`, runtime V8;
- web app chạy dưới quyền người deploy (`USER_DEPLOYING`), ai cũng truy cập được (`ANYONE_ANONYMOUS`);
- quyền ở M1: `spreadsheets`, `drive`, `script.external_request` (gọi `tokeninfo`), `userinfo.email` (`setup()` lấy email chủ sở hữu);
- mốc sau thêm `script.send_mail` (M5) và `script.scriptapp` (trigger, M3), kèm cấp quyền lại.

### 9.1 Mã phiên

- Dạng: `base64url(JSON {"e": email, "i": ms cấp, "x": ms hết hạn}) + "." + base64url(HMAC-SHA256(phần đầu, SESSION_SECRET))`.
- Server từ chối khi:
  - sai chữ ký hoặc sai dạng (`SESSION_INVALID`);
  - quá `x`, hoặc `i` trước "Phiên hợp lệ từ" của tài khoản (`SESSION_EXPIRED`).
- Đổi `SESSION_SECRET` thì mọi phiên mất hiệu lực.

### 9.2 Giao diện `web/`

- `index.html` khai báo Content-Security-Policy theo hướng dẫn của Google Identity Services:
  - script chỉ từ chính trang và `https://accounts.google.com/gsi/client`;
  - kết nối tới `script.google.com` và `script.googleusercontent.com`, vì Apps Script chuyển hướng phản hồi sang tên miền sau.
- Mọi file JS gắn `?v=<phiên bản>`, kể cả trong lệnh `import`. Đổi phiên bản bằng `npm run bump -- x.y.z`.
- Phát hành bằng GitHub Actions (`.github/workflows/pages.yml`, câu hỏi C2).
- `npm run dev` thay `config.js` bằng cấu hình máy phát triển và chấp nhận ID token dạng `dev:<email>`. Phần này chỉ có trong `tools/dev-server.js`, không có trong `gas/`, nên server thật không chấp nhận mã đó.
