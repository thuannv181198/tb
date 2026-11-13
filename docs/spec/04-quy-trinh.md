# Đặc tả 04 – Quy trình nghiệp vụ

> Bộ đặc tả gồm 5 file: mục 1 `01-tong-quan.md` · mục 2–3 `02-kien-truc-bao-mat.md` · mục 4–5 `03-du-lieu.md` · mục 6–9 `04-quy-trinh.md` · mục 10 `05-giao-dien.md`. "Mục N" trong mọi file là mục N của bộ này. Kế hoạch và tiêu chí hoàn thành ở `docs/KE-HOACH.md`.

## 6. Quy trình mượn

Có 3 cách giao thiết bị. Ở mọi cách, người mượn không nhập tình trạng và không ký điện tử; người quản lý là người thao tác trên app.

**Bước chung khi giao từng thiết bị** (áp dụng cho cả 3 cách):

- Thiết bị không sẵn sàng bị chặn: đang mượn, đang được giữ chỗ cho yêu cầu khác, Hư hỏng nặng, Đang sửa chữa, Chờ thanh lý, Đã thanh lý, Mất. Thiết bị Hư hỏng nhẹ hoặc Khác thì cảnh báo, cho giao sau khi người quản lý xác nhận. Riêng thiết bị đang được giữ chỗ cho yêu cầu khác: người quản lý được chọn "Hủy giữ chỗ và giao" (bắt buộc ghi lý do); thiết bị bị bỏ khỏi yêu cầu kia và người gửi yêu cầu đó thấy thông báo.
- Tình trạng điền sẵn theo ghi nhận lần gần nhất. Người mượn kiểm tra thực tế và báo lại. Người quản lý bấm "Tất cả đúng như ghi nhận" cho các thiết bị không đổi, chỉ mở chi tiết thiết bị có thay đổi: chọn tình trạng mới và nhập chi tiết hư phần nào. Tình trạng mới cập nhật vào cột Tình trạng và là giá trị điền sẵn cho lần sau.
- Đối chiếu serie theo mục 5 (không bắt buộc, không chặn thao tác).
- Với bộ: quét tem bộ hoặc chọn bộ trong danh sách, rồi tích các món giao. Với hộp: quét tem hộp, nhập số lượng giao (không vượt số lượng sẵn sàng); app tự chọn Mã TB như mục 5.
- Mọi cách giao đều ghi mỗi thiết bị một dòng `ChiTietPhieu`, kèm tình trạng lúc giao.
- Khi mở yêu cầu hoặc nhập SĐT của người mượn, app cảnh báo nếu SĐT đó đang có phiếu quá hạn hoặc biên bản chưa hoàn tất. Người quản lý vẫn giao được sau khi xác nhận.

### Cách 1. Giao theo yêu cầu (người mượn trình QR, nhiều thiết bị một lần)

**Phía người mượn (không đăng nhập):**

1. Mở đường link công khai `BASE_URL`. Danh sách thiết bị tải một lần; tìm theo tên hoặc Mã TB và lọc theo nhóm, phòng, "Chỉ hiện thiết bị sẵn sàng" ngay trên máy, không phải chờ server. Mỗi thiết bị hiển thị tên, Mã TB, tình trạng, phòng, ảnh đại diện và nhãn "Sẵn sàng" hoặc "Không sẵn sàng".
2. Bấm "Thêm vào danh sách mượn" ở thiết bị sẵn sàng. Với bộ: thêm cả bộ hoặc chọn từng món. Với hộp: nhập số lượng muốn mượn, không vượt số lượng sẵn sàng. Thiết bị sẵn sàng là thiết bị đang ở "Phòng TH", tình trạng Tốt, Hư hỏng nhẹ hoặc Khác, và không bị giữ chỗ. Danh sách mượn lưu trong trình duyệt của máy người mượn (localStorage).
3. Mở "Danh sách mượn", tích chọn các thiết bị muốn mượn lần này (tối đa 10 dòng). Họ tên, đơn vị/lớp, SĐT, email (không bắt buộc) tự điền từ lần trước, có nút "Không phải tôi" để xóa. Nhập mục đích/học phần và hạn trả đề xuất (mặc định hôm nay + 7 ngày, không vượt hạn tối đa ở mục 1). Tích ô đồng ý về việc dùng thông tin cá nhân (mục 3).
4. Bấm "Mượn". Server kiểm tra lại từng thiết bị và các giới hạn chống lạm dụng (mục 3), tạo `YeuCauMuon` trạng thái "Chờ duyệt", giữ chỗ các thiết bị 30 phút, rồi trả về mã QR. Thiết bị nào không còn sẵn sàng thì báo rõ để người mượn bỏ ra.
5. App hiển thị QR cỡ lớn, kèm Mã YC, mã xác nhận 6 ký tự, danh sách thiết bị và đồng hồ đếm ngược. Mã YC và mã xác nhận được lưu trong trình duyệt để người mượn mở lại. Trang tự hỏi trạng thái yêu cầu theo nhịp ở mục 1: 5 giây trong 2 phút đầu, sau đó 15 giây; dừng khi tab bị ẩn và hỏi lại ngay khi tab hiện lại. QR hết hạn thì bấm "Làm mới QR" một chạm: giữ nguyên Mã YC, danh sách và thông tin, cấp mã xác nhận mới, server kiểm tra lại thiết bị còn sẵn sàng. Mỗi yêu cầu làm mới tối đa 2 lần, sau đó phải gửi yêu cầu mới. Người mượn hủy được yêu cầu khi chưa duyệt.

**Phía người quản lý:**

1. Bấm Quét QR, quét QR trên điện thoại người mượn. Khi camera lỗi, mở màn hình "Yêu cầu chờ duyệt" và nhập mã xác nhận 6 ký tự.
2. Server chỉ mở yêu cầu khi đủ 4 điều kiện: người quét có vai trò Quản lý hoặc Admin, mã xác nhận khớp, còn hạn, đang "Chờ duyệt". Trong lúc yêu cầu còn "Chờ duyệt", người quản lý mở lại được nhiều lần (ví dụ khi lỡ đóng màn hình). Mỗi yêu cầu chỉ được duyệt hoặc từ chối một lần; sau đó mã xác nhận hết hiệu lực.
3. App hiển thị người mượn (họ tên, đơn vị/lớp, SĐT) và danh sách thiết bị (ảnh, tên, Mã TB, serie, tình trạng). Người quản lý đối chiếu giấy tờ của người mượn (thẻ sinh viên hoặc thẻ cán bộ) và sửa thông tin nếu sai.
4. Xác nhận từng thiết bị đã giao bằng một trong hai cách, dùng xen kẽ được:
    - tích vào thiết bị trong danh sách (có nút "Chọn tất cả");
    - quét tem QR trên thiết bị: app tự tích; quét phải thiết bị không thuộc yêu cầu thì báo lỗi;
    - với bộ, hộp: quét tem bộ/hộp rồi tích món hoặc xác nhận số lượng.
5. Áp dụng bước chung khi giao từng thiết bị. Có thể bỏ thiết bị khỏi yêu cầu (bắt buộc ghi lý do) và sửa hạn trả. Thiết bị chưa được tích thì không giao.
6. Bấm "Đồng ý giao" hoặc "Từ chối" (bắt buộc ghi lý do).
7. Khi đồng ý, server khóa ghi, kiểm tra lại toàn bộ điều kiện, rồi:
    - chuyển `YeuCauMuon` sang "Đã duyệt", tạo `PhieuMuon` với Cách giao "Theo yêu cầu" và các dòng `ChiTietPhieu` (thứ tự ghi theo mục 2.2);
    - ghi `LichSu`, mỗi thiết bị một dòng, kèm cách xác nhận (Tích/Quét QR) và kết quả đối chiếu serie;
    - cập nhật `ThietBi`: cột Tình trạng và Note (nếu đổi), cột Lưu trữ = "Đang mượn", người đang mượn, SĐT, mã phiếu, hạn trả; xóa giữ chỗ;
    - ghi `NhatKy`.
8. Trang của người mượn tự chuyển sang "Đã duyệt", hiển thị mã phiếu, danh sách thiết bị, hạn trả để người mượn chụp màn hình làm biên nhận. Thiết bị đã mượn được xóa khỏi danh sách mượn trên trình duyệt.
9. Khi từ chối hoặc QR hết hạn: bỏ giữ chỗ; trang người mượn hiển thị kết quả kèm lý do; thiết bị vẫn nằm trong danh sách mượn trên trình duyệt.

### Cách 2. Giao trực tiếp từng thiết bị (mượn lẻ, không cần QR yêu cầu)

Dùng khi người mượn đến trực tiếp, mượn ít thiết bị, hoặc không mang điện thoại.

1. Người quản lý quét tem QR trên thiết bị (hoặc tìm trong danh sách) và bấm "Giao cho mượn". Quét tem bộ/hộp thì chọn món hoặc nhập số lượng. Quét tiếp các thiết bị khác để thêm vào cùng phiếu.
2. Nhập SĐT người mượn. Nếu SĐT đã từng mượn, app tự điền họ tên, đơn vị/lớp, email từ phiếu gần nhất; nếu chưa, nhập mới. Nhập mục đích (không bắt buộc) và hạn trả (mặc định hôm nay + 7 ngày).
3. Áp dụng bước chung khi giao từng thiết bị.
4. Bấm "Xác nhận giao". Server khóa ghi, kiểm tra lại, tạo `PhieuMuon` với Cách giao "Trực tiếp", ghi `LichSu`, cập nhật `ThietBi`, ghi `NhatKy`.
5. App hiển thị mã phiếu và hạn trả cỡ chữ lớn để người mượn chụp lại, dùng tra cứu về sau.

### Cách 3. Giao theo buổi thực hành (cả lớp)

1. Quản lý tạo phiếu buổi: lớp, học phần, giảng viên phụ trách (họ tên, SĐT), giờ bắt đầu và kết thúc. Hạn trả = giờ kết thúc buổi.
2. Quét liên tục tem các thiết bị phát cho lớp, hoặc tích chọn trong danh sách. Ghi nhóm hoặc người nhận cho từng thiết bị (không bắt buộc). Áp dụng bước chung khi giao từng thiết bị.
3. Bấm "Xác nhận giao". Server tạo `PhieuMuon` với Cách giao "Buổi thực hành"; người chịu trách nhiệm là giảng viên phụ trách.
4. Cuối buổi thu về theo mục 7. Thiết bị chưa thu sau giờ kết thúc được tô đỏ trên Trang tổng quan.

Mang thiết bị sang phòng khác để dạy một buổi thì dùng cách này, không cần lập điều chuyển phòng.

**Tra cứu và gia hạn (người mượn, không đăng nhập):**

- Màn hình "Yêu cầu của tôi" liệt kê yêu cầu và phiếu đã lưu trong trình duyệt. Đổi máy vẫn xem được bằng cách tra cứu SĐT kèm Mã phiếu.
- Hạn trả hiển thị nổi bật khi còn 1 ngày hoặc đã quá hạn.
- Nút "Xin gia hạn": chọn hạn mới (tối đa 7 ngày mỗi lần, tối đa 2 lần mỗi phiếu) và nhập lý do. Server tạo `YeuCauGiaHan` "Chờ duyệt". Quản lý duyệt một chạm trong màn hình "Yêu cầu chờ duyệt"; kết quả hiện trên trang tra cứu của người mượn. Không áp dụng cho phiếu buổi thực hành.
- Người mượn có email thì nhận 1 email nhắc trước hạn và 1 email khi quá hạn.

Giữ chỗ hết hạn được coi là không còn hiệu lực ngay khi đọc dữ liệu. Thêm một trigger mỗi giờ chuyển các yêu cầu quá hạn sang "Hết hạn" và dọn cột giữ chỗ.

## 7. Quy trình nhận lại

Người mượn mang thiết bị đến trả, có thể nhờ người khác trả hộ. Người quản lý kiểm tra đủ danh sách và tình trạng, rồi xác nhận trên app. Người mượn không nhập liệu.

1. Mở phiếu cần trả bằng một trong các cách:
    - quét tem QR của bất kỳ thiết bị, bộ hoặc hộp nào trong phiếu: app mở thẳng phiếu đó và tự tích thiết bị vừa quét (tem hộp có trong nhiều phiếu thì app cho chọn phiếu);
    - mở màn hình "Đang mượn" (nhóm theo người mượn và phiếu, quá hạn tô đỏ), tìm theo tên, SĐT, Mã phiếu hoặc Mã TB.
2. Xác nhận từng thiết bị nhận lại bằng một trong hai cách, dùng xen kẽ được:
    - tích vào thiết bị trong danh sách của phiếu (có nút "Chọn tất cả");
    - quét tem QR trên từng thiết bị (quét liên tục). Quét phải thiết bị thuộc phiếu khác thì app hỏi có chuyển sang phiếu đó không;
    - với bộ: quét tem bộ rồi tích các món nhận lại; với hộp: quét tem hộp, app hiện số lượng còn phải trả của phiếu, người quản lý nhập số lượng nhận lại.
3. Tình trạng điền sẵn tình trạng lúc giao. Bấm "Tất cả như lúc mượn" cho các thiết bị không đổi; chỉ mở chi tiết thiết bị có thay đổi. Đối chiếu serie theo mục 5 (không bắt buộc, không chặn thao tác).
4. Nhập "Người trả thực tế" nếu khác người mượn (không bắt buộc).
5. Thiết bị có thay đổi được xử lý theo mức (mức nào phải lập biên bản lấy theo `CauHinh`, mặc định Hư hỏng nặng và Mất):
    - Hư hỏng nhẹ hoặc Khác: chọn tình trạng, mô tả hư phần nào, chụp ảnh hiện trạng (bắt buộc). Người quản lý xác nhận, không cần biên bản.
    - Hư hỏng nặng: chọn tình trạng, mô tả, chụp ảnh hiện trạng (bắt buộc), rồi lập biên bản (bên dưới).
    - Mất hoặc thiếu (với hộp: số lượng nhận lại ít hơn số đã mượn): lập biên bản Mất (bên dưới).
6. Bấm "Xác nhận nhận lại". Server khóa ghi, rồi với mọi thiết bị đã nhận lại về tay, kể cả thiết bị hư hỏng: cập nhật ngay cột Lưu trữ = "Phòng TH", cột Tình trạng, Note và Chi tiết tình trạng; xóa người đang mượn, SĐT, mã phiếu, hạn trả; ghi `LichSu` kèm cách xác nhận (Tích/Quét QR) và kết quả đối chiếu serie. Thiết bị Hư hỏng nặng tự động không cho mượn, cột Chi tiết tình trạng ghi thêm "Chờ biên bản BB-…". Trong cùng lần ghi này, server tự tạo một `BienBan` trạng thái "Chờ minh chứng" cho các thiết bị Hư hỏng nặng, Mất hoặc thiếu của phiếu và cấp Mã BB; nhân chứng và minh chứng nhập sau ở màn hình biên bản. Thiết bị mất hoặc thiếu giữ "Đang mượn" cho đến khi biên bản Mất hoàn tất.
7. Server cập nhật số TB đã trả và trạng thái `PhieuMuon`: "Trả một phần", "Chờ biên bản" (còn biên bản chưa hoàn tất) hoặc "Đã trả đủ". App hiển thị các thiết bị còn thiếu của phiếu (nếu có). Thiết bị đã được điều chuyển trong lúc đang mượn thì app nhắc đưa về phòng mới.
8. Ở lần mượn sau, ô tình trạng tự điền tình trạng vừa xác nhận khi nhận lại.

**Biên bản xác nhận hư hỏng** (bắt buộc với Hư hỏng nặng và Mất; Hư hỏng nhẹ không cần):

1. App tự đưa vào biên bản các thiết bị Hư hỏng nặng và Mất của phiếu, kèm tình trạng, mô tả, ảnh đã nhập ở bước nhận lại. Nhập họ tên, đơn vị của các nhân chứng, tối thiểu 2 người.
2. Biên bản đã được tạo ở trạng thái "Chờ minh chứng" khi xác nhận nhận lại. App sinh biên bản theo mẫu để in: khổ A4, in bằng trình duyệt. Muốn in sau thì chọn "Lưu thành PDF" trong hộp thoại in của trình duyệt; không dùng thư viện tạo PDF. Biên bản điền sẵn: Mã BB, thời gian, người mượn, mã phiếu, danh sách thiết bị (mã, tên, serie), tình trạng lúc mượn, tình trạng khi trả, mô tả hư hỏng. Có chỗ ký tay cho người mượn, người quản lý và từng nhân chứng.
3. Các bên ký tay vào biên bản. Người quản lý chụp ảnh biên bản đã ký (nhiều ảnh hoặc PDF) và tải lên mục "Minh chứng xác nhận hư hỏng" của biên bản đó.
4. Bấm "Hoàn tất biên bản". Server chặn nếu chưa có minh chứng hoặc thiếu nhân chứng. Khi hợp lệ, server khóa ghi rồi tự động:
    - thiết bị Hư hỏng nặng: cột Chi tiết tình trạng và Note của ô thay "Chờ biên bản" bằng Mã BB (tình trạng và lưu trữ đã cập nhật khi nhận lại);
    - thiết bị Mất: cột Tình trạng = "Mất", cột Lưu trữ để trống, xóa người đang mượn, ghi Mã BB vào Chi tiết tình trạng; tính lại cột Tổng SL thực tế;
    - ghi `LichSu` gắn Mã BB, cập nhật `PhieuMuon`, chuyển `BienBan` sang "Hoàn tất";
    - gửi email ngay cho Admin và danh sách email nhận thông báo khi có Hư hỏng nặng hoặc Mất, kèm Mã BB và tóm tắt.
5. Biên bản "Chờ minh chứng" hiển thị trên Trang tổng quan cho đến khi hoàn tất. Minh chứng đã tải lên thì Quản lý không xóa được, chỉ gửi yêu cầu xóa để Admin duyệt.

**Báo hỏng ngoài phiếu mượn** (phát hiện khi thiết bị đang ở phòng, khi kiểm kê hoặc khi chuẩn bị giao): Admin hoặc Quản lý mở thẻ thiết bị, chọn tình trạng mới, mô tả và chụp ảnh (bắt buộc). Hư hỏng nhẹ hoặc Khác: lưu ngay. Hư hỏng nặng hoặc Mất: lập biên bản như trên, phần người mượn để trống, vẫn cần tối thiểu 2 nhân chứng và minh chứng.

**Tìm lại thiết bị đã ghi Mất**: chỉ Admin thực hiện, qua chức năng Điều chỉnh, bắt buộc ghi lý do và tải minh chứng. Admin chọn tình trạng mới; cột Lưu trữ = "Phòng TH"; ghi `LichSu` loại "Điều chỉnh"; tính lại cột Tổng SL thực tế.

## 8. Nhập hàng theo đợt đề xuất

Chỉ Admin được nhập hàng. Hàng mới tự cập nhật vào danh sách tổng `ThietBi`.

1. Tạo đợt: mã đợt tự sinh. Admin nhập nội dung đề xuất, số tờ trình/QĐ, ngày đề xuất, nhà cung cấp, nguồn kinh phí, ghi chú. Trạng thái ban đầu là "Đã đề xuất".
2. Khai báo các dòng hàng của đợt: tên thiết bị, hãng/model, SL đề xuất, đơn giá (không bắt buộc). App hiển thị ngay mã nhóm dự kiến, danh sách mã nhóm đã có để chọn, và cảnh báo nếu trùng mã nhóm (mục 5).
3. Nhận hàng: nhập ngày nhận bàn giao, rồi nhập từng cái theo một trong các cách:
    - form, mỗi dòng một số serie;
    - quét liên tiếp mã vạch serie bằng camera;
    - dán từ Excel hoặc tải lên file .xlsx theo mẫu (app có nút tải file mẫu);
    - với thiết bị, dụng cụ không có serie: nhập số lượng N, app tự tạo N dòng với serie "Không có";
    - thiết bị, dụng cụ không gắn được tem riêng: chọn "Gom vào bộ/hộp" (bộ, hộp có sẵn hoặc tạo mới). Hộp chỉ nhận dụng cụ cùng Mã nhóm.
4. Màn hình xem trước liệt kê mỗi cái một dòng: Mã TB sẽ cấp, serie, tình trạng mặc định "Tốt", phòng mặc định là phòng đang dùng (hiện là 201-VNB). App báo lỗi serie trùng hoặc thiếu dữ liệu; chỉ khi hết lỗi mới cho lưu.
5. Lưu:
    - ghi tất cả dòng trong một lần `setValues`, đánh lại STT; mỗi lần lưu tối đa 500 thiết bị, nhiều hơn thì app tự chia lô, mỗi lô một `requestId`;
    - tính lại cột Tổng SL thực tế và `TongHop`, cập nhật SL đã nhận;
    - trạng thái đợt tự chuyển thành "Nhận một phần" hoặc "Đã nhận đủ".
6. Sau khi lưu, app chuyển sang màn hình in tem QR cho các thiết bị gắn tem riêng và các bộ/hộp mới vừa nhập.

Chức năng "Nhập danh sách ban đầu": tải lên file Excel thiết bị đang có, tạo một đợt "Tồn đầu kỳ" và cấp mã theo quy tắc ở mục 5. Mã cũ hoặc mã tài sản của Trường có trong file thì ghi vào cột Mã tham chiếu.

**Lọc hiển thị** (áp dụng cho màn hình Danh sách thiết bị và Đợt nhập):

- Lọc kết hợp nhiều điều kiện: đợt nhập, tên/mã nhóm, tình trạng, lưu trữ, phòng, khoảng ngày nhận bàn giao, người đang mượn.
- Ô tìm nhanh theo Mã TB hoặc số serie.
- Hai chế độ xem: từng thiết bị, hoặc gộp theo nhóm (Tên, Tổng SL, Tại phòng, Đang mượn, Hư hỏng).
- Phân trang hoặc cuộn tải dần; xuất kết quả lọc ra Excel.

## 9. Tính năng bổ sung

| Tính năng | Mô tả | Vai trò |
| --- | --- | --- |
| Trang tổng quan | Khối "Hôm nay": yêu cầu mượn và gia hạn chờ duyệt, phiếu đến hạn hôm nay, quá hạn, buổi thực hành đang diễn ra, biên bản chờ minh chứng, yêu cầu điều chỉnh chờ duyệt. Số liệu tổng: tổng thiết bị, đang mượn, hư hỏng, đang sửa. 10 giao dịch gần nhất | Admin, Quản lý, Chỉ xem |
| Email tổng hợp | Trigger hằng ngày vào khoảng 07:00, một email cho Admin và Quản lý: thiết bị sắp đến hạn (trước 1 ngày), quá hạn kèm họ tên và SĐT người mượn, biên bản chờ minh chứng, yêu cầu chờ duyệt | Hệ thống |
| Email ngay | Chỉ gửi khi có hư hỏng nặng, mất, lệch serie hoặc điều chuyển phòng | Hệ thống |
| Nhắc người mượn | Người mượn có email: 1 email trước hạn, 1 email khi quá hạn | Hệ thống |
| Lịch sử thiết bị | Dòng thời gian của từng thiết bị: mượn, trả, gia hạn, hư hỏng, biên bản, điều chuyển, sửa serie, sửa chữa, kiểm kê; xem ảnh và minh chứng | Admin, Quản lý, Chỉ xem |
| Lịch sử người mượn | Tra theo SĐT: thiết bị đang giữ, lịch sử mượn, số lần trả trễ, số biên bản hư hỏng. Danh sách quá hạn hiển thị SĐT dạng bấm để gọi | Admin, Quản lý, Chỉ xem |
| Ảnh thiết bị | Tải nhiều ảnh thực tế cho mỗi thiết bị, có mô tả; chọn ảnh đại diện hiển thị ở trang công khai và thẻ thiết bị khi giao, nhận | Admin, Quản lý |
| Yêu cầu điều chỉnh | Quản lý gửi yêu cầu xóa ảnh, xóa minh chứng hoặc sửa serie kèm lý do và ảnh; Admin duyệt hoặc từ chối | Admin, Quản lý |
| Điều chuyển phòng | Đổi phòng cho một số thiết bị, toàn bộ phòng, hoặc đổi tên phòng; bắt buộc lý do và minh chứng | Admin, Quản lý |
| Sửa chữa | Gửi sửa (tình trạng → Đang sửa chữa); nhận về và cập nhật kết quả, chi phí | Admin, Quản lý |
| Kiểm kê | Mở đợt kiểm kê theo phòng (ghi `DotKiemKe`); xác nhận từng thiết bị bằng quét tem hoặc tích trong danh sách; với hộp, quét tem hộp và nhập số lượng đếm được, app so với số lượng phải có. Cuối đợt báo cáo: đủ, sai phòng, không tìm thấy (không tính thiết bị đang mượn) | Admin, Quản lý |
| Thanh lý | Chuyển Chờ thanh lý → Đã thanh lý, ghi số quyết định, tính lại cột Tổng SL thực tế | Admin |
| Bộ và hộp | Tạo bộ/hộp, đưa thiết bị vào hoặc rút ra, in tem bộ/hộp; số lượng script tự đếm | Admin |
| Mã truy cập trang công khai | Bật/tắt, đặt và đổi mã 4–6 chữ số; đổi mã thì mọi trình duyệt phải nhập lại | Admin |
| In tem QR | Chọn theo đợt, nhóm, từng mã, bộ/hộp, hoặc danh sách "Cần in lại tem". Tem 40 × 30 mm gồm QR, Mã TB (hoặc Mã bộ/hộp), tên, dòng "KHOA CÔNG NGHỆ NĂNG LƯỢNG"; xếp trên giấy decal A4, in bằng trình duyệt. Khuyến nghị decal chống nước hoặc ép plastic | Admin, Quản lý |
| Báo cáo | Danh sách tổng, theo đợt, theo phòng, quá hạn, hư hỏng/biên bản, điều chuyển, sửa chữa, kiểm kê, lịch sử theo khoảng ngày; xuất Excel, in PDF qua trình duyệt | Admin, Quản lý, Chỉ xem |
| Quản lý tài khoản | Thêm, khóa, đổi vai trò, đặt ngày hết hạn quyền, đăng xuất mọi thiết bị cho Gmail quản lý | Admin |
| Sao lưu | Trigger hằng tuần sao chép file Sheet vào thư mục `SaoLuu`, giữ 8 bản gần nhất. Sao lưu lỗi thì email ngay cho Admin; Trang tổng quan hiện ngày sao lưu gần nhất. Bản sao nằm cùng tài khoản nên không cứu được khi mất tài khoản: Admin được chia sẻ quyền xem thư mục `SaoLuu` cho một tài khoản thứ hai của Khoa, và hướng dẫn vận hành có bước tải bản sao về máy mỗi học kỳ cùng bài tập khôi phục thử | Hệ thống |
| Nhật ký hệ thống | Xem và lọc `NhatKy`, gồm cả các lần truy cập bị từ chối | Admin |
| Kiểm tra nhất quán | Chạy `kiemTraNhatQuan()` (mục 2.2) theo yêu cầu và tự động hằng ngày; liệt kê sai lệch để Admin xử lý | Admin |
| Lưu trữ theo năm | Chuyển các dòng `NhatKy`, `LichSu` của năm đã kết thúc sang một file Sheet lưu trữ trong thư mục `SaoLuu`; lịch sử thiết bị vẫn tra được khi cần | Admin |
| Ẩn danh dữ liệu cá nhân | Trigger hằng tháng theo quy tắc ở mục 3 | Hệ thống |

**Quy tắc ảnh thiết bị và yêu cầu điều chỉnh:**

- Quản lý và Admin tải ảnh lên thư mục `AnhThietBi` (ảnh được nén như mục 10), mỗi ảnh một dòng trong sheet `AnhThietBi`. Khi chọn ảnh đại diện, app tạo thêm bản thu nhỏ lưu vào `AnhNho`.
- Quản lý không có quyền xóa ảnh, xóa minh chứng hay sửa serie. Quản lý bấm "Yêu cầu xóa" hoặc "Yêu cầu sửa serie" và nhập lý do; yêu cầu sửa serie phải nhập serie đúng và nên chụp nhãn. Server tạo `YeuCauDieuChinh` "Chờ duyệt"; ảnh chờ xóa vẫn hiển thị với trạng thái "Chờ xóa".
- Admin duyệt yêu cầu xóa: file trên Drive chuyển vào thùng rác, dòng ảnh chuyển "Đã xóa" (giữ dòng để truy vết). Admin duyệt yêu cầu sửa serie: cập nhật cột Số serie, ghi `LichSu` loại "Sửa serie" kèm giá trị cũ và mới. Admin từ chối: giữ nguyên, người yêu cầu thấy kết quả và ghi chú trên app.
- Yêu cầu chờ duyệt có trong email tổng hợp buổi sáng; riêng yêu cầu sửa serie phát sinh do lệch khi giao, nhận thì email Admin ngay. Mọi bước đều ghi `NhatKy`.

**Quy tắc điều chuyển phòng** (phòng hiện tại là 201-VNB):

1. Admin hoặc Quản lý mở "Điều chuyển phòng" và chọn loại:
    - một số thiết bị: chọn theo bộ lọc, tích trong danh sách hoặc quét QR từng thiết bị, bộ, hộp (thiết bị trong bộ/hộp chuyển theo bộ/hộp);
    - toàn bộ thiết bị của một phòng;
    - đổi tên phòng (phòng giữ nguyên, chỉ đổi tên).
2. Chọn phòng mới từ `DanhMucPhong`, hoặc thêm phòng mới (mã và tên phòng).
3. Bắt buộc nhập lý do điều chuyển, số quyết định/văn bản (nếu có), và tải lên biên bản bàn giao hoặc minh chứng liên quan (ảnh hoặc PDF). Thiếu lý do hoặc minh chứng thì không cho lưu.
4. Màn hình xác nhận hiển thị phòng cũ, phòng mới, số thiết bị, danh sách Mã TB. Thiết bị đang mượn vẫn được điều chuyển; khi nhận lại, app nhắc người quản lý đưa về phòng mới.
5. Server khóa ghi rồi:
    - tạo dòng `DieuChuyen`, lưu minh chứng vào thư mục `DieuChuyen`;
    - cập nhật cột Phòng/Vị trí của các thiết bị, ghi `LichSu` loại "Điều chuyển" cho từng thiết bị;
    - cập nhật `DanhMucPhong`: phòng mới "Đang dùng"; phòng cũ "Ngừng dùng" khi chuyển toàn bộ hoặc đổi tên;
    - cập nhật `TongHop`, ghi `NhatKy`, email ngay cho Admin khi người thực hiện là Quản lý.
6. Bản ghi điều chuyển không sửa, không xóa được. Điều chuyển nhầm thì lập điều chuyển ngược, cũng kèm minh chứng. Minh chứng chỉ xóa được qua yêu cầu điều chỉnh do Admin duyệt.
