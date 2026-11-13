# Đặc tả 01 – Tổng quan, phạm vi, thông số

> Bộ đặc tả gồm 5 file: mục 1 `01-tong-quan.md` · mục 2–3 `02-kien-truc-bao-mat.md` · mục 4–5 `03-du-lieu.md` · mục 6–9 `04-quy-trinh.md` · mục 10 `05-giao-dien.md`. "Mục N" trong mọi file là mục N của bộ này. Kế hoạch và tiêu chí hoàn thành ở `docs/KE-HOACH.md`.

## 1. Mục tiêu, phạm vi và thông số

Phần mềm "Quản lý thiết bị phòng thực hành" cho Khoa Công nghệ Năng lượng: quản lý danh mục thiết bị, cho mượn và nhận lại bằng mã QR, biên bản hư hỏng, điều chuyển phòng, kiểm kê.

Người triển khai và vận hành không phải lập trình viên. Mọi hướng dẫn dành cho họ viết từng bước bấm chuột, bằng tiếng Việt.

### 1.1 Mục tiêu

- Mỗi thiết bị, dụng cụ có một Mã TB riêng. Thiết bị gắn được tem thì có tem QR riêng. Thiết bị, dụng cụ không gắn được tem (quá nhỏ, bề mặt không dán được) thì gom vào bộ hoặc hộp có một tem QR chung; với dụng cụ số lượng lớn, quét tem hộp là ra số lượng.
- Người mượn không cần tài khoản: mở đường link công khai, tìm thiết bị, thêm vào danh sách mượn, gửi yêu cầu và nhận mã QR. Người mượn không nhập tình trạng thiết bị và không ký điện tử.
- Khu vực quản lý đăng nhập bằng Gmail được phân quyền, gồm 3 vai trò: Admin, Quản lý, Chỉ xem. Chỉ Admin và Quản lý được quét mã QR và thao tác giao, nhận thiết bị.
- Giao thiết bị theo 2 cách chính: quét QR yêu cầu do người mượn trình ra (nhiều thiết bị một lần), hoặc quét tem QR từng thiết bị (mượn lẻ, trực tiếp). Có thêm cách giao theo buổi thực hành cho cả lớp.
- Nhận lại thiết bị theo 2 cách, dùng xen kẽ được: tích chọn thiết bị trong phiếu, hoặc quét tem QR trên từng thiết bị.
- Số serie chỉ để người quản lý đối chiếu đúng thiết bị đã bàn giao. Thiết bị, dụng cụ không có serie vẫn mượn, trả bình thường. Chỉ Admin được sửa serie.
- Trả thiết bị hư hỏng nhẹ: mô tả, chụp ảnh, người quản lý xác nhận. Hư hỏng nặng hoặc mất: bắt buộc lập biên bản giấy có nhân chứng ký, người quản lý chụp và tải lên làm minh chứng. Tình trạng thiết bị tự cập nhật.
- Quản lý được thêm ảnh thực tế của thiết bị nhưng không được xóa; muốn xóa phải gửi yêu cầu để Admin duyệt.
- Khi điều chuyển phòng thực hành, Admin hoặc Quản lý đổi phòng trên app, bắt buộc tải biên bản/minh chứng, ghi rõ lý do và phòng mới.
- Thao tác càng ít bước càng tốt: tự điền thông tin đã biết, có nút xử lý hàng loạt, camera quét liên tục không phải mở lại.
- Dữ liệu lưu trên Google Sheet của tài khoản chủ sở hữu: tài khoản Google chạy `setup()` và deploy web app (gọi là `ADMIN_EMAIL`). Địa chỉ email thật không ghi vào repo vì repo công khai.
- Chi phí vận hành bằng 0: không thuê server, không dùng dịch vụ trả phí.
- Giao diện tiếng Việt, ưu tiên dùng trên điện thoại.

### 1.2 Ngoài phạm vi

Không làm và không tự thêm các phần sau; nếu thấy cần thì ghi vào `docs/CAU-HOI-MO.md` để người dùng quyết:

- Vật tư tiêu hao (gas lạnh, que hàn, ống đồng, băng keo...): loại xuất dùng không trả lại, quản lý theo số lượng tồn.
- Lịch kiểm định, hiệu chuẩn, bảo dưỡng định kỳ của thiết bị.
- Đặt lịch phòng thực hành, thời khóa biểu.
- Khấu hao, kế toán tài sản, kết nối với phần mềm khác của Trường.
- Theo dõi bồi thường sau biên bản hư hỏng, mất.
- Tài khoản đăng nhập cho người mượn.
- Chế độ ngoại tuyến, thông báo đẩy, ứng dụng cài từ kho ứng dụng.

### 1.3 Quy mô giả định

Dùng để thiết kế hiệu năng và hạn mức; người dùng xác nhận lại trong `docs/CAU-HOI-MO.md`:

- tối đa 2.000 thiết bị, 10 tài khoản quản lý, 100 phiếu mượn mỗi ngày;
- tối đa 60 người mượn thao tác cùng lúc (một lớp gửi yêu cầu trước buổi thực hành).

### 1.4 Thông số ban đầu

Lưu trong sheet `CauHinh`, Admin sửa được trên app:

| Thông số | Giá trị |
| --- | --- |
| Tên đơn vị hiển thị trên app và tem | KHOA CÔNG NGHỆ NĂNG LƯỢNG |
| Email Admin (chủ sở hữu Sheet và Apps Script) | `setup()` tự lấy email tài khoản đang chạy, lưu vào Script Properties (`ADMIN_EMAIL`) |
| Phòng thực hành hiện tại | 201-VNB |
| Hạn mượn mặc định | 7 ngày |
| Hạn trả tối đa người mượn được đề xuất | Bằng hạn mượn mặc định. Người quản lý đặt dài hơn được khi giao |
| Nhắc trước hạn trả | 1 ngày |
| Gia hạn | Tối đa 2 lần mỗi phiếu, mỗi lần tối đa 7 ngày |
| Thời hạn QR yêu cầu mượn và giữ chỗ | 30 phút |
| Số lần làm mới QR tối đa mỗi yêu cầu | 2 |
| Nhịp trang người mượn hỏi trạng thái yêu cầu | 5 giây trong 2 phút đầu, sau đó 15 giây; dừng khi tab bị ẩn |
| Số dòng tối đa mỗi yêu cầu | 10 (một thiết bị lẻ, một bộ hoặc một hộp tính là 1 dòng) |
| Số yêu cầu chờ duyệt tối đa mỗi SĐT | 1 |
| Thời hạn phiên đăng nhập quản lý | 12 giờ |
| Giờ gửi email tổng hợp | 07:00 |
| Mức hư hỏng phải lập biên bản | Hư hỏng nặng, Mất |
| Số nhân chứng tối thiểu ký biên bản hư hỏng | 2 |
| Mã truy cập trang công khai | Tắt. Admin bật được và đặt mã 4–6 chữ số, nên đổi theo học kỳ |
| Kích thước tem QR | 40 × 30 mm, giấy decal A4. QR mức sửa lỗi M, cạnh mỗi ô vuông nhỏ (module) từ 0,4 mm trở lên |
| Giới hạn tần suất API công khai | Gửi yêu cầu: 3 lần/10 phút mỗi SĐT, 30 lần/phút toàn hệ thống. Tra cứu phiếu: 5 lần sai/15 phút mỗi SĐT, 60 lần/phút toàn hệ thống. Nhập mã truy cập: 5 lần sai/15 phút mỗi trình duyệt |
| Kích thước file tải lên tối đa | Ảnh sau khi nén: 1 MB. PDF minh chứng: 5 MB. Tối đa 5 file mỗi lần gửi |
| Thời gian lưu thông tin cá nhân người mượn | 24 tháng sau khi phiếu đóng, sau đó ẩn danh (mục 3) |
