# Đặc tả 05 – Giao diện

> Bộ đặc tả gồm 5 file: mục 1 `01-tong-quan.md` · mục 2–3 `02-kien-truc-bao-mat.md` · mục 4–5 `03-du-lieu.md` · mục 6–9 `04-quy-trinh.md` · mục 10 `05-giao-dien.md`. "Mục N" trong mọi file là mục N của bộ này. Kế hoạch và tiêu chí hoàn thành ở `docs/KE-HOACH.md`.

## 10. Giao diện

- Ưu tiên điện thoại (rộng từ 360 px), vẫn dùng tốt trên máy tính. Nút lớn, thao tác được bằng một tay.
- Tiêu đề app: "Quản lý thiết bị – KHOA CÔNG NGHỆ NĂNG LƯỢNG".
- Thanh điều hướng dưới thay đổi theo khu vực:
    - Trang công khai (người mượn): Tìm thiết bị, Danh sách mượn (hiện số dòng đã thêm), Yêu cầu của tôi (tra cứu, gia hạn). Góc trên có nút "Đăng nhập quản lý".
    - Admin và Quản lý: Hôm nay, Đang mượn, Quét QR (nút giữa, cỡ lớn), Danh sách, Thêm. Mục Thêm chứa Giao trực tiếp, Buổi thực hành, Nhập hàng, Kiểm kê, Biên bản, Điều chuyển phòng, Yêu cầu điều chỉnh, Tài khoản, Cấu hình, hiển thị theo quyền.
- Màn hình quét: camera mở liên tục. Mỗi lần quét thành công, app phát tiếng bíp, rung nếu máy hỗ trợ, và hiện thẻ thiết bị nhỏ với nút hành động theo trạng thái (Giao cho mượn, Nhận lại, Thêm vào phiếu). Có ô nhập Mã TB thủ công khi tem mờ hoặc bong; thiết bị nhập thủ công được đánh dấu "Cần in lại tem".
- Thẻ thiết bị khi giao, nhận: ảnh đại diện, tên, Mã TB, serie chữ to, tình trạng, để đối chiếu nhanh bằng mắt.
- Thẻ hộp: số lượng sẵn sàng chữ to (ví dụ "Sẵn sàng 15 / 20"), nút + / − để chọn số lượng. Thẻ bộ: danh sách các món có ảnh và ô tích.
- Khi Admin bật mã truy cập, trang công khai hiện màn hình nhập mã ở lần mở đầu tiên.
- Màn hình QR yêu cầu mượn: QR cỡ lớn trên nền trắng, Mã YC, mã xác nhận 6 ký tự chữ to, đồng hồ đếm ngược, nút Làm mới QR và Hủy yêu cầu.
- Màu tình trạng nhất quán: Tốt xanh lá; Hư hỏng nhẹ vàng; Hư hỏng nặng và Mất đỏ; Đang sửa chữa cam; Chờ thanh lý và Đã thanh lý xám.
- Mọi thao tác ghi đều có màn hình xác nhận. Nút xác nhận bị khóa trong lúc gửi để tránh bấm hai lần. Mất mạng hoặc quá thời gian chờ khi ghi: giữ nguyên dữ liệu đang nhập và hiện nút "Gửi lại", dùng lại đúng `requestId` cũ.
- Hiển thị trạng thái đang tải; thông báo thành công và lỗi rõ ràng bằng tiếng Việt.
- Cài được lên màn hình chính điện thoại (PWA: manifest, icon). Không lưu đệm để dùng ngoại tuyến. File tĩnh gắn số phiên bản (`?v=`), và trang Thêm hiện số phiên bản để biết máy đã nhận bản mới.
- Mở trong trình duyệt nhúng của Zalo, Messenger, Facebook: hiện dải thông báo "Mở bằng Chrome hoặc Safari để dùng đầy đủ" kèm nút chép link. Trang công khai vẫn dùng được; nút đăng nhập quản lý bị ẩn.
- Ảnh được nén trước khi tải lên: cạnh dài tối đa 1280 px, JPEG chất lượng 0,7. Ảnh đại diện ở trang công khai dùng bản thu nhỏ trong `AnhNho`, tải dần theo trang danh sách.
- Danh sách công khai: server trả toàn bộ trong một lần gọi, không kèm ảnh, và lưu đệm bằng CacheService vài phút (chia khối nếu vượt giới hạn kích thước của CacheService); trình duyệt tìm và lọc tại chỗ. Ảnh thu nhỏ tải dần theo trang, mỗi nhóm thiết bị chỉ tải một lần khi các thiết bị dùng chung ảnh của nhóm.
- Khu vực quản lý: sau khi đăng nhập, app tải một lần danh sách thiết bị bản quản lý (có serie, người đang mượn, phiếu) và chỉ tải lại khi `phienBanDuLieu` đổi (mục 2.3). Nhờ vậy quét tem hiện thẻ thiết bị tức thì. Dữ liệu này chỉ giữ trong bộ nhớ của tab, không ghi vào localStorage; localStorage của khu vực quản lý chỉ chứa mã phiên và tùy chọn giao diện.
