# Đặc tả 03 – Cấu trúc dữ liệu và quy tắc mã

> Bộ đặc tả gồm 5 file: mục 1 `01-tong-quan.md` · mục 2–3 `02-kien-truc-bao-mat.md` · mục 4–5 `03-du-lieu.md` · mục 6–9 `04-quy-trinh.md` · mục 10 `05-giao-dien.md`. "Mục N" trong mọi file là mục N của bộ này. Kế hoạch và tiêu chí hoàn thành ở `docs/KE-HOACH.md`.

## 4. Cấu trúc dữ liệu Google Sheet

Hàm `setup()` tự tạo toàn bộ phần sau:

- file Google Sheet và thư mục Drive gốc nếu chưa có, rồi tự lưu `SHEET_ID`, `DRIVE_FOLDER_ID` và `ADMIN_EMAIL` (email tài khoản đang chạy) vào Script Properties; người triển khai không phải chép ID bằng tay;
- các sheet, hàng tiêu đề (cố định khi cuộn, được bảo vệ chống sửa nhầm), định dạng, data validation; cột mã và chuỗi số đặt định dạng văn bản thuần (mục 3);
- dòng phòng ban đầu 201-VNB trong `DanhMucPhong`, các dòng cấu hình ban đầu trong `CauHinh`, tài khoản Admin trong `NguoiDung`, khóa `SESSION_SECRET` ngẫu nhiên trong Script Properties (nếu chưa có);
- thư mục Drive gồm `AnhThietBi`, `AnhHuHong`, `BienBan`, `DieuChuyen`, `SaoLuu`;
- khóa `SCHEMA_VERSION` trong `CauHinh`. Mỗi lần đổi cấu trúc (thêm sheet, thêm cột) viết một bước nâng cấp có đánh số; `setup()` chạy các bước còn thiếu theo thứ tự.

Chạy lại `setup()` nhiều lần không được làm mất dữ liệu. Múi giờ Asia/Ho_Chi_Minh. Ngày giờ lưu trong Sheet là giá trị ngày giờ thật, không phải chuỗi; hiển thị dạng dd/MM/yyyy và dd/MM/yyyy HH:mm. Hạn trả chỉ có ngày được hiểu là 23:59 của ngày đó; quá hạn nghĩa là thời điểm hiện tại đã sau hạn trả.

**Sheet `ThietBi`** là danh sách tổng, mỗi dòng là một thiết bị (một cái). Cột 1–9 giữ đúng thứ tự sau:

| Cột | Tên cột | Nội dung |
| --- | --- | --- |
| 1 | STT | Số thứ tự, tự đánh lại khi thêm hoặc bớt dòng |
| 2 | Tên thiết bị | Tên đầy đủ, dùng để tạo mã nhóm (mục 5) |
| 3 | Mã TB | Mã riêng của từng cái, ví dụ MKCT-001 (mục 5) |
| 4 | Số serie | Serie của nhà sản xuất, chỉ để đối chiếu; không có thì ghi "Không có". Chỉ Admin được sửa |
| 5 | Tình trạng | Giá trị trong danh mục tình trạng. Chi tiết hư phần nào, ngày nào ghi vào Note của chính ô này |
| 6 | Lưu trữ | "Đang mượn" hoặc "Phòng TH" |
| 7 | Tổng SL thực tế | Tổng số cái cùng nhóm hiện có trong toàn Khoa, script tự tính (mục 5) |
| 8 | Ngày nhận bàn giao | Lấy từ đợt nhập |
| 9 | Ghi chú | Tự do |

Các cột bổ sung bắt đầu từ cột 10: Mã nhóm, Hãng/Model, Phòng/Vị trí, Mã bộ/hộp, Gắn tem riêng (Có/Không), Mã đợt nhập, Chi tiết tình trạng, Ảnh đại diện, Người đang mượn, SĐT người đang mượn, Mã phiếu đang mượn, Hạn trả, Mã yêu cầu giữ chỗ, Giữ chỗ đến, Cần in lại tem (Có/Không), Mã tham chiếu (mã cũ hoặc mã tài sản của Trường, không bắt buộc), Cập nhật lần cuối, Người cập nhật.

Dòng `ThietBi` đã có giao dịch trong `LichSu` thì không xóa, chỉ đổi tình trạng (Đã thanh lý, Mất). Admin chỉ xóa được dòng nhập nhầm chưa phát sinh giao dịch.

Các sheet khác:

| Sheet | Các cột chính |
| --- | --- |
| NhomTB | Mã nhóm, Tên chuẩn hóa, Tên hiển thị, Đơn vị tính, Số thứ tự cuối đã cấp, Ảnh thu nhỏ của nhóm (quy cách như `AnhNho`) |
| BoHop | Mã bộ/hộp, Loại (Bộ/Hộp), Tên, Mã nhóm (chỉ với hộp), Phòng/Vị trí, Mô tả, Ảnh đại diện, Trạng thái (Đang dùng/Ngừng dùng), Ngày tạo, Ghi chú. Số lượng không nhập tay, script đếm từ `ThietBi` |
| DotNhap | Mã đợt, Nội dung đề xuất, Số tờ trình/QĐ, Ngày đề xuất, Ngày nhận bàn giao, Nhà cung cấp, Nguồn kinh phí, Trạng thái đợt, Người nhập, Ghi chú |
| ChiTietDot | Mã đợt, Tên thiết bị, Hãng/Model, SL đề xuất, SL đã nhận, Đơn giá, Ghi chú |
| YeuCauMuon | Mã YC, Thời gian tạo, Họ tên, Đơn vị/Lớp, SĐT, Email, Danh sách mượn (Mã TB lẻ; Mã bộ kèm các món chọn; Mã hộp kèm số lượng), Mục đích/Học phần, Hạn trả đề xuất, Mã xác nhận, Hết hạn QR, Trạng thái (Chờ duyệt/Đã duyệt/Từ chối/Đã hủy/Hết hạn), Email người duyệt, Thời gian duyệt, Lý do từ chối, Mã phiếu tạo ra, Số lần làm mới QR, Thời điểm đồng ý dùng thông tin cá nhân |
| PhieuMuon | Mã phiếu, Cách giao (Theo yêu cầu/Trực tiếp/Buổi thực hành), Mã YC, Họ tên, Đơn vị/Lớp, SĐT, Email, Giảng viên phụ trách (phiếu buổi), Email người giao, Thời gian mượn, Hạn trả, Số lần gia hạn, Mục đích/Học phần, Số TB, Số TB đã trả, Trạng thái phiếu (Đang mượn/Trả một phần/Chờ biên bản/Đã trả đủ) |
| ChiTietPhieu | Mã phiếu, Mã TB, Mã bộ/hộp (khi giao theo bộ/hộp), Nhóm hoặc người nhận (phiếu buổi), Tình trạng lúc giao, Thời gian giao, Trạng thái dòng (Đang mượn/Đã trả/Chờ biên bản/Mất), Tình trạng lúc trả, Thời gian trả, Người trả thực tế, Mã biên bản. Mỗi thiết bị trong phiếu một dòng. Đây là nguồn chính để biết phiếu gồm những gì, còn thiếu gì, và tình trạng lúc giao |
| YeuCauGiaHan | Mã GH, Mã phiếu, SĐT, Hạn hiện tại, Hạn đề xuất, Lý do, Thời gian gửi, Trạng thái (Chờ duyệt/Đã duyệt/Từ chối), Email người duyệt, Thời gian duyệt, Ghi chú |
| LichSu | Mã GD, Thời gian, Loại (Mượn, Trả, Gia hạn, Báo hỏng, Sửa chữa, Kiểm kê, Điều chuyển, Sửa serie, Thanh lý, Điều chỉnh), Mã phiếu, Mã TB, Tình trạng trước, Tình trạng sau, Chi tiết hư hỏng, Cách xác nhận (Tích/Quét QR), Đối chiếu serie (Khớp/Lệch/Không có serie/Không đối chiếu), Giá trị cũ, Giá trị mới, Mã biên bản, Mã điều chuyển, File ảnh, Người mượn (họ tên, SĐT), Người trả thực tế, Email người thao tác |
| BienBan | Mã BB, Mã phiếu, Danh sách Mã TB, Họ tên và SĐT người mượn, Email người lập, Thời gian lập, Mô tả hư hỏng từng thiết bị, Tình trạng xác nhận, Nhân chứng (họ tên, đơn vị), File biên bản đã ký, Ảnh hiện trạng, Trạng thái (Chờ minh chứng/Hoàn tất) |
| DanhMucPhong | Mã phòng, Tên phòng, Trạng thái (Đang dùng/Ngừng dùng), Ngày bắt đầu, Ngày ngừng, Mã điều chuyển liên quan, Ghi chú. Dòng ban đầu: 201-VNB, Đang dùng |
| DieuChuyen | Mã ĐC, Thời gian, Loại (Một số thiết bị/Toàn bộ phòng/Đổi tên phòng), Phòng cũ, Phòng mới, Danh sách Mã TB, Số TB, Lý do, Số quyết định/văn bản, File minh chứng, Email người thực hiện, Ghi chú |
| AnhThietBi | Mã ảnh, Mã TB, File ID, Mô tả, Email người tải, Thời gian tải, Trạng thái (Hiển thị/Chờ xóa/Đã xóa) |
| AnhNho | Mã TB, Ảnh thu nhỏ (base64 của JPEG, cạnh dài tối đa 300 px, chuỗi không quá 30.000 ký tự; vượt thì nén lại nhỏ hơn rồi mới lưu), Cập nhật lần cuối. Thiết bị chưa có ảnh riêng dùng ảnh thu nhỏ của nhóm trong `NhomTB` |
| YeuCauDieuChinh | Mã YCĐC, Loại (Xóa ảnh/Xóa minh chứng/Sửa serie), Mã đối tượng (mã ảnh, mã minh chứng hoặc Mã TB), Giá trị hiện tại, Giá trị đề xuất, Lý do, Ảnh kèm theo (ví dụ ảnh nhãn serie), Email người yêu cầu, Thời gian, Trạng thái (Chờ duyệt/Đã duyệt/Từ chối), Email người duyệt, Thời gian duyệt, Ghi chú duyệt |
| SuaChua | Mã SC, Mã TB, Ngày gửi, Nội dung hư hỏng, Nơi sửa, Chi phí, Ngày nhận lại, Kết quả |
| DotKiemKe | Mã đợt KK, Phòng, Email người mở, Thời gian mở, Thời gian đóng, Trạng thái (Đang kiểm/Đã đóng), Số phải có, Đủ, Sai phòng, Không tìm thấy, Ghi chú |
| KiemKe | Mã đợt KK, Mã TB hoặc Mã bộ/hộp, Thời gian xác nhận, Cách xác nhận (Tích/Quét QR), Số lượng đếm (với hộp), Email người kiểm, Phòng thực tế, Kết quả |
| TongHop | Mã nhóm, Tên TB, Phòng, Tổng SL thực tế, Tại phòng, Đang mượn, Tốt, Hư hỏng, Đang sửa (script ghi giá trị, không dùng công thức) |
| NguoiDung | Email, Họ tên, Vai trò (Admin/Quản lý/Chỉ xem), SĐT, Trạng thái (Hoạt động/Khóa), Ngày hết hạn, Phiên hợp lệ từ, Ngày tạo |
| NhatKy | Thời gian, Email hoặc "công khai", Action, Đối tượng, Kết quả, Chi tiết |
| CauHinh | Khóa, Giá trị: các thông số ở mục 1, ngưỡng giới hạn tần suất API công khai, tên hiển thị của các tình trạng, email nhận thông báo, tên miền Google Workspace được phép đăng nhập (nếu có), `SCHEMA_VERSION` |
| BoDem | Loại mã, Kỳ (ngày hoặc năm), Số cuối đã cấp. Mọi mã có số thứ tự lấy số từ đây, trong vùng khóa |

Mỗi sheet bản ghi chính (`YeuCauMuon`, `PhieuMuon`, `YeuCauGiaHan`, `BienBan`, `DieuChuyen`, `YeuCauDieuChinh`, `DotNhap`, `SuaChua`, `AnhThietBi`, `DotKiemKe`) có thêm cột `requestId` (mục 2).

Ô chứa danh sách (ví dụ Danh sách Mã TB của `DieuChuyen`, Danh sách mượn của `YeuCauMuon`) lưu dạng JSON và phải được kiểm tra không vượt 50.000 ký tự trước khi ghi; vượt thì tách thành nhiều bản ghi.

## 5. Quy tắc mã TB, serie, tình trạng, số lượng

**Mã nhóm** (gộp các thiết bị giống nhau, không phân biệt hãng):

1. Chuẩn hóa tên thiết bị: đưa Unicode về dạng NFC (tên chép từ Excel hoặc máy Mac có thể ở dạng tổ hợp, nhìn giống nhau nhưng so sánh không bằng nhau), bỏ khoảng trắng thừa, chuyển chữ thường. Tên thiết bị không gồm tên hãng; hãng nhập ở cột riêng. Nếu tên chứa một hãng đã có trong cột Hãng/Model thì app nhắc người nhập tách ra, không tự cắt.
2. Các thiết bị có cùng tên chuẩn hóa thuộc cùng một nhóm.
3. Mã nhóm = chữ cái đầu của mỗi từ, bỏ dấu tiếng Việt (Đ/đ → D), viết hoa. Ví dụ: "Máy khoan cầm tay" → MKCT; "Đồng hồ vạn năng" → DHVN. Từ bắt đầu bằng chữ số thì lấy chữ số đó; ký tự không phải chữ hoặc số thì bỏ qua ("Bộ loe ống 1/4" → BLO1). Mã dài quá 6 ký tự thì lấy 6 ký tự đầu ("Máy hút chân không hai cấp loại lớn 2 HP" → MHCKHC). Mã ngắn hơn 2 ký tự ("Kìm" → K) thì Admin phải tự đặt.
4. Nếu tên mới cho ra mã nhóm trùng với nhóm khác (ví dụ "Máy cắt" và "Mỏ cặp" đều ra MC; "Máy đo nhiệt độ" và "Máy đo nồng độ" đều ra MDND), app phải cảnh báo và gợi ý mã thay thế bằng cách thêm chữ cái tiếp theo của từ cuối (Mỏ cặp → MCA). Admin xác nhận hoặc tự đặt mã nhóm tùy ý 2–6 ký tự (chỉ gồm A–Z và 0–9) trước khi lưu.
5. Khi nhập hàng, app hiển thị danh sách mã nhóm đã có để chọn nhanh. Quan hệ tên → mã nhóm lưu trong `NhomTB`; những lần nhập sau dùng lại mã này.

**Mã TB** của từng cái = Mã nhóm + "-" + số thứ tự tối thiểu 3 chữ số, ví dụ MKCT-001, MKCT-002; sau 999 là 1000.

- Số thứ tự tăng tiếp từ số lớn nhất đã cấp trong nhóm.
- Không cấp lại số của thiết bị đã thanh lý hoặc bị mất.
- Mã TB là duy nhất và không sửa được sau khi lưu; màn hình xem trước ở mục 8 là chỗ cuối cùng để sửa. Cấp nhầm thì Admin xóa dòng chưa có giao dịch và cấp mã mới.

**Bộ và hộp** (thiết bị, dụng cụ không gắn được tem riêng):

- Mỗi thiết bị, dụng cụ trong bộ/hộp vẫn có Mã TB và một dòng riêng trong `ThietBi` (cột Gắn tem riêng = "Không", cột Mã bộ/hộp ghi mã bộ/hộp). Chỉ bộ/hộp có tem QR.
- **Bộ**: gồm các thiết bị khác loại, hay đi cùng nhau. Quét tem bộ mở danh sách các món (ảnh, tên, Mã TB, tình trạng); giao, nhận bằng cách tích từng món hoặc "Chọn tất cả".
- **Hộp**: gồm các dụng cụ cùng Mã nhóm, số lượng lớn. Quét tem hộp hiện số lượng: tổng, sẵn sàng, đang mượn, hư hỏng. Giao, nhận bằng cách nhập số lượng (nút + / −). App tự chọn các Mã TB sẵn sàng để ghi phiếu, ưu tiên tình trạng Tốt rồi số thứ tự nhỏ; người quản lý mở danh sách để chọn món cụ thể khi cần (ví dụ món bị hư).
- Số lượng của bộ/hộp do script đếm từ `ThietBi`, không nhập tay. Chỉ Admin tạo, sửa bộ/hộp và đưa thiết bị vào hoặc rút ra; mỗi lần thay đổi ghi `LichSu` loại "Điều chỉnh".
- Khi điều chuyển phòng, thiết bị trong bộ/hộp đi theo bộ/hộp.

**Số serie** (chỉ để người quản lý đối chiếu đúng thiết bị đã bàn giao):

- Thiết bị, dụng cụ không có serie ghi "Không có". Chúng vẫn mượn, trả, kiểm kê bình thường; nhận diện bằng tem QR, tên và ảnh.
- Serie khác "Không có" không được trùng trong toàn bộ danh sách; trùng thì chặn lưu.
- Khi giao và nhận lại, thẻ thiết bị hiển thị serie đã ghi (chữ to, kèm ảnh đại diện) để người quản lý đối chiếu với nhãn trên thiết bị. Đối chiếu không bắt buộc và không chặn thao tác. Người quản lý có thể bấm "Khớp" hoặc "Lệch"; nếu nhãn có mã vạch thì quét để app tự so (bỏ khoảng trắng, không phân biệt chữ hoa/thường).
- Bấm "Lệch": app hỏi "Không giao/không nhận thiết bị này" hoặc "Vẫn tiếp tục, báo Admin". Chọn tiếp tục thì bắt buộc ghi chú và nên chụp ảnh nhãn serie. Server tạo `YeuCauDieuChinh` loại "Sửa serie", ghi `LichSu` kết quả đối chiếu "Lệch" và email ngay cho Admin.
- Chỉ Admin được sửa serie, trực tiếp hoặc khi duyệt yêu cầu. Mỗi lần sửa ghi `LichSu` loại "Sửa serie" kèm giá trị cũ và mới. Màn hình của Quản lý không có ô sửa serie, và API từ chối nếu Quản lý gọi trực tiếp.

**Danh mục tình trạng** (cột 5): Tốt; Hư hỏng nhẹ (vẫn dùng được); Hư hỏng nặng (không dùng được); Đang sửa chữa; Chờ thanh lý; Đã thanh lý; Mất; Khác (bắt buộc ghi rõ).

Tám tình trạng này cố định, vì quy tắc cho mượn, màu sắc và biên bản đều dựa vào chúng. Code dùng mã nội bộ không đổi: `TOT`, `HONG_NHE`, `HONG_NANG`, `DANG_SUA`, `CHO_THANH_LY`, `DA_THANH_LY`, `MAT`, `KHAC`. Trong `CauHinh`, Admin chỉ sửa được tên hiển thị và mức phải lập biên bản.


- Mọi tình trạng khác "Tốt" bắt buộc nhập chi tiết hư phần nào. Ngày tự lấy theo ngày thao tác.
- Chi tiết được ghi đồng thời vào 3 nơi: Note của ô cột 5, cột Chi tiết tình trạng, và sheet `LichSu`.
- Note có dạng "05/11/2026 – nứt vỏ, gãy chân sạc – ghi bởi <email>". Lần ghi mới nhất nằm trên cùng; giữ tối đa 10 lần gần nhất.

**Lưu trữ** (cột 6): "Đang mượn" khi đã mượn chưa trả; "Phòng TH" khi thiết bị ở phòng; để trống khi thiết bị bị mất hoặc đã thanh lý. Phòng cụ thể ghi ở cột Phòng/Vị trí, lấy từ sheet `DanhMucPhong`; thiết bị mới mặc định ở phòng đang dùng (hiện là 201-VNB). Cột Phòng/Vị trí chỉ được đổi qua chức năng Điều chuyển phòng (mục 9).

**Tổng SL thực tế** (cột 7) = số thiết bị cùng Mã nhóm trong toàn Khoa có tình trạng khác "Đã thanh lý" và "Mất".

- Giá trị giống nhau trên mọi dòng của cùng nhóm. Số theo từng phòng xem ở sheet `TongHop`.
- Script tự tính lại mỗi khi nhập hàng, thanh lý, báo mất, điều chuyển hoặc sửa nhóm, đồng thời cập nhật `TongHop`.
- Mọi con số tổng hợp đều do script đếm, không nhập tay.

**Các mã khác:**

| Mã | Định dạng |
| --- | --- |
| Yêu cầu mượn | YC-yyyyMMdd-### |
| Mã xác nhận yêu cầu | 6 ký tự ngẫu nhiên (chữ in hoa và số, bỏ O, 0, I, 1) |
| Phiếu mượn (mọi cách giao) | PM-yyyyMMdd-### |
| Yêu cầu gia hạn | GH-yyyy-### |
| Biên bản hư hỏng | BB-yyyy-### |
| Điều chuyển phòng | DC-yyyy-### |
| Ảnh thiết bị | ANH-yyyyMMdd-### |
| Yêu cầu điều chỉnh | YCDC-yyyy-### |
| Đợt nhập | DN-yyyy-## |
| Sửa chữa | SC-yyyy-### |
| Đợt kiểm kê | KK-yyyyMMdd-## |
| Bộ | BO-### |
| Hộp | HOP-### |

Số thứ tự trong mọi mã lấy từ sheet `BoDem` trong vùng khóa. Số chữ số trong bảng là tối thiểu; hết số thì tăng thêm chữ số.
