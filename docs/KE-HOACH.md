# Kế hoạch thực hiện và tiêu chí hoàn thành

Làm theo 9 mốc, M0 đến M8. Mỗi mốc là một phần chạy được từ đầu đến cuối, có kiểm thử tự động và danh sách thử tay. Xong một mốc thì dừng, báo cáo và chờ người dùng xác nhận rồi mới sang mốc sau.

## Quy trình cho mỗi mốc

1. **Lập kế hoạch** (plan mode). Đọc `docs/TIEN-DO.md`, `docs/QUYET-DINH.md`, `docs/CAU-HOI-MO.md` và các mục đặc tả ghi ở dòng "Đọc" của mốc. Nêu câu hỏi và giả định. Trình kế hoạch gồm: file sẽ tạo hoặc sửa, action API, thay đổi hợp đồng dữ liệu, kiểm thử sẽ viết. Chờ người dùng duyệt.
2. **Viết kiểm thử trước** cho các quy tắc trong "Kiểm thử bắt buộc" của mốc, rồi viết code đến khi `npm test` và `npm run lint` đều đạt.
3. **Rà soát độc lập.** Dùng subagent `spec-reviewer` rà soát thay đổi của mốc. Sửa các vấn đề thuộc loại Nghiêm trọng và Cần sửa; chạy lại kiểm thử.
4. **Cập nhật tài liệu:** `docs/HOP-DONG-DU-LIEU.md` (nếu có action, cột mới), `docs/TIEN-DO.md`, `docs/QUYET-DINH.md`, `docs/KIEM-THU-THU-CONG.md`, `docs/HUONG-DAN-TRIEN-KHAI.md` (chỉ phần thay đổi).
5. **Commit** với thông điệp bắt đầu bằng tên mốc (ví dụ `M3: trang công khai và yêu cầu mượn`).
6. **Báo cáo:** việc đã làm, kết quả lệnh kiểm thử, phần chưa kiểm chứng được, các bước người dùng cần thử tay.

## Tiêu chí hoàn thành chung cho mọi mốc

- `npm test` và `npm run lint` đạt; mọi mục "Kiểm thử bắt buộc" của mốc có kiểm thử tương ứng.
- Mỗi action mới có trong bảng action trung tâm, trong hợp đồng dữ liệu, và có kiểm thử "vai trò không đủ quyền bị từ chối".
- Code đầy đủ, không để chỗ trống kiểu "phần còn lại tương tự".
- Không có bí mật, email cá nhân, số điện thoại, dữ liệu thật trong repo.
- Thiết kế nằm trong các giới hạn ở mục 2.1 của đặc tả.

## Môi trường

- **Trên máy:** `npm run dev` chạy frontend cùng backend giả lập. Dùng cho phần lớn việc phát triển; không cần tài khoản Google.
- **DEV:** một project Apps Script riêng với Sheet và thư mục Drive riêng, chỉ chứa dữ liệu thử. Trong suốt M1–M8, GitHub Pages trỏ vào backend DEV để thử trên điện thoại (camera cần HTTPS).
- **PROD:** tạo ở M8, sau khi nghiệm thu. Chỉ người dùng chạy lệnh deploy PROD. Đổi `web/config.js` sang PROD là bước cuối cùng.

## Việc chỉ người dùng làm được

Claude Code viết hướng dẫn từng bước bấm chuột cho các việc sau vào `docs/HUONG-DAN-TRIEN-KHAI.md`, sau khi tra tài liệu chính thức hiện hành, rồi chờ người dùng làm:

- Đăng nhập clasp bằng tài khoản chủ sở hữu; bật Apps Script API trong phần cài đặt người dùng của Apps Script.
- Chạy `setup()` lần đầu trong trình soạn thảo Apps Script và cấp quyền.
- Tạo project Google Cloud, cấu hình màn hình đồng ý OAuth, tạo OAuth Client ID loại Web application, khai báo Authorized JavaScript origins (địa chỉ GitHub Pages và địa chỉ `localhost` dùng cho `npm run dev`).
- Tạo tài khoản và repo GitHub, bật GitHub Pages. Tên tài khoản và tên repo quyết định `BASE_URL` in trên tem: chốt trước khi in tem hàng loạt.
- Thêm Gmail của người quản lý, in tem, thử trên điện thoại thật.

## Các mốc

### M0 – Nền móng và hợp đồng dữ liệu

Đọc: toàn bộ `docs/spec/` (lướt), kỹ mục 2, 3, 4, 5.

Phạm vi:

- Khởi tạo repo: `package.json` với các lệnh ghi trong `CLAUDE.md`, `.gitignore` (gồm `node_modules`, `.clasprc.json`, `.env*`, `CLAUDE.local.md`), ESLint, cấu trúc thư mục. Hạn chế phụ thuộc; ưu tiên trình chạy kiểm thử có sẵn của Node.
- Bộ giả lập dịch vụ Google trên Node (Spreadsheet, Properties, Cache, Lock, Drive, Mail, UrlFetch, Utilities, Session, ContentService) ở mức đủ dùng, theo `.claude/rules/gas-backend.md`.
- `docs/HOP-DONG-DU-LIEU.md`: mọi sheet và cột (tên, kiểu, định dạng, bắt buộc hay không); mọi action (tham số, vai trò được gọi, kết quả, mã lỗi); danh sách mã lỗi; khóa `CauHinh`, Script Properties, CacheService (tên, thời hạn), localStorage.
- `setup()`, cơ chế nâng cấp theo `SCHEMA_VERSION`, `smokeTest()`.
- Hàm thuần nền tảng: chuẩn hóa chuỗi, làm sạch đầu vào, sinh mã từ `BoDem`, tạo mã nhóm, xử lý thời gian.
- Khởi tạo `docs/TIEN-DO.md` và `docs/QUYET-DINH.md`.

Tên file backend gợi ý (đổi được, ghi vào hợp đồng dữ liệu): `Config`, `Setup`, `Migrations`, `Auth`, `Api` (`doPost` và router), `PublicApi`, `ThietBi`, `YeuCau`, `MuonTra`, `BienBan`, `BoHop`, `DieuChuyen`, `DieuChinh`, `HinhAnh`, `NhapHang`, `BaoCao`, `Triggers`, `SmokeTest`.

Kiểm thử bắt buộc:

- `setup()` chạy hai lần không mất dữ liệu, không tạo trùng sheet hay dòng; chạy trên cấu trúc đời cũ thì nâng cấp đúng thứ tự.
- Tạo mã nhóm: có dấu, chữ Đ, trùng mã và gợi ý mã thay thế, tên dạng NFC và NFD cho cùng kết quả, từ bắt đầu bằng số, mã dài quá 6, mã ngắn hơn 2 (các ví dụ ở mục 5).
- Cấp số thứ tự tiếp theo; không cấp lại số đã dùng; vượt 999.
- SĐT và serie có số 0 đầu, serie toàn chữ số dài, chuỗi dạng `1E5`, `3-4` ghi rồi đọc lại vẫn đúng chuỗi gốc.
- Chuỗi bắt đầu bằng `=`, `+`, `-`, `@` không thành công thức và đọc lại đúng chuỗi gốc.

Nghiệm thu: người dùng duyệt `docs/HOP-DONG-DU-LIEU.md`.

### M1 – Chạy thật: đăng nhập và phân quyền

Đọc: mục 2, 3; phần điều hướng của mục 10.

Phạm vi:

- Project Apps Script DEV qua clasp; `appsscript.json` (múi giờ, danh sách quyền tối thiểu, web app chạy dưới quyền người deploy và ai cũng truy cập được); deploy web app DEV; cách cập nhật phiên bản mà không đổi URL.
- Router `doPost`, bảng action, định dạng trả về, `requestId`, `NhatKy`.
- Đăng nhập: xác minh ID token, mã phiên, đối chiếu `NguoiDung` có lưu đệm, đăng xuất, đăng xuất mọi thiết bị; màn hình quản lý tài khoản của Admin.
- Khung frontend: trang công khai (chưa có nội dung), khu vực quản lý, thanh điều hướng theo vai trò, `api.js`, phát hiện trình duyệt nhúng, `npm run dev`.
- Phát hành `web/` lên GitHub Pages, trỏ vào backend DEV.

Kiểm thử bắt buộc:

- Mã phiên hết hạn, sai chữ ký, hoặc cấp trước "Đăng xuất mọi thiết bị" bị từ chối.
- Email không có trong danh sách, bị khóa hoặc hết hạn bị từ chối.
- ID token sai `aud`, sai `iss`, `email_verified` sai, hết hạn, hoặc email ngoài tên miền cho phép bị từ chối.
- Action dành cho Admin bị từ chối khi Quản lý hoặc Chỉ xem gọi, và có dòng `NhatKy` "Từ chối".
- Tài khoản chủ sở hữu không thể bị khóa.
- Gửi lại cùng `requestId` trả kết quả cũ, không ghi lần hai.
- Không lấy được khóa thì action ghi trả lỗi `BUSY`, không ghi gì.

Nghiệm thu: trên điện thoại, Gmail được cấp quyền đăng nhập được và thấy đúng vai trò; Gmail khác bị từ chối; người dùng chạy `smokeTest()` trên DEV và gửi lại kết quả.

### M2 – Danh mục thiết bị, nhập hàng, bộ và hộp, in tem

Đọc: mục 4, 5, 8; phần "Bộ và hộp", "In tem QR" của mục 9; mục 10.

Phạm vi: danh sách thiết bị (lọc, tìm, hai chế độ xem, xuất Excel); nhập hàng theo đợt với đủ các cách nhập, màn hình xem trước, lưu theo lô; nhập danh sách ban đầu; file Excel mẫu; tạo và sửa bộ, hộp; Admin sửa serie trực tiếp; in tem QR; `TongHop` và cột Tổng SL thực tế; `phienBanDuLieu`.

Kiểm thử bắt buộc:

- Chặn serie trùng nhưng cho nhiều thiết bị "Không có" serie.
- Quản lý gọi API sửa serie bị từ chối; Admin sửa được và có dòng `LichSu` kèm giá trị cũ, mới.
- Tính cột Tổng SL thực tế và `TongHop` sau khi nhập, sau khi đổi tình trạng sang Mất hoặc Đã thanh lý.
- Mã TB không sửa được sau khi lưu; không xóa được dòng đã có giao dịch.
- Hộp chỉ nhận dụng cụ cùng mã nhóm; số lượng bộ, hộp đếm từ `ThietBi`.
- Nhập 501 thiết bị thì tự chia lô; gửi lại một lô không tạo dòng trùng.
- Quét tem bộ mở đúng danh sách món.
- Hàm phân tích nội dung quét nhận đúng cả ba dạng: URL đầy đủ ở tên miền khác, chuỗi tham số, mã trần.

Nghiệm thu: nhập thử từ file Excel thật của Khoa (nếu có); in một tờ tem A4 và quét thử bằng điện thoại.

### M3 – Trang công khai và yêu cầu mượn

Đọc: phần "API công khai" của mục 3; phần "Phía người mượn" của mục 6; mục 10.

Phạm vi: tải danh sách công khai (lưu đệm, chia khối, không kèm ảnh) và ảnh thu nhỏ; tìm, lọc tại chỗ; danh sách mượn; gửi yêu cầu, giữ chỗ, QR yêu cầu, hỏi trạng thái, làm mới, hủy; mã truy cập; giới hạn tần suất; trường ẩn chống bot; thông báo và ô đồng ý về thông tin cá nhân; trigger dọn yêu cầu hết hạn.

Kiểm thử bắt buộc:

- API công khai chỉ trả các trường được phép; không có serie, người đang mượn, SĐT, ghi chú, lịch sử.
- Vượt 10 dòng mỗi yêu cầu, hoặc đã có 1 yêu cầu chờ duyệt cho SĐT đó, thì bị chặn.
- Thiết bị không còn sẵn sàng bị loại và báo rõ; hộp vượt số lượng sẵn sàng bị chặn.
- Giữ chỗ hết hạn mất hiệu lực ngay khi đọc; trigger chuyển yêu cầu sang "Hết hạn".
- Làm mới QR giữ Mã YC, đổi mã xác nhận; lần thứ 3 bị chặn. QR hết hạn bị từ chối.
- Khi bật mã truy cập: API công khai từ chối mã sai; sai quá ngưỡng bị chặn tạm; đổi mã thì mã cũ hết hiệu lực.
- Giới hạn tần suất theo SĐT và trên toàn hệ thống.
- Request có trường ẩn được điền bị bỏ qua. Thiếu ô đồng ý bị từ chối. SĐT sai định dạng bị từ chối.
- API hỏi trạng thái không mở Spreadsheet và không đọc Properties khi bộ đệm còn dữ liệu.

Nghiệm thu: mở link ở cửa sổ ẩn danh trên điện thoại, gửi yêu cầu, thấy QR và đồng hồ đếm ngược; mở link từ Zalo thì thấy dải hướng dẫn mở bằng trình duyệt.

### M4 – Giao và nhận lại

Đọc: mục 5 (serie, bộ và hộp, tình trạng), mục 6, mục 7 bước 1–8, mục 10.

Phạm vi: màn hình Quét QR; giao cách 1 và cách 2; bước chung khi giao; hủy giữ chỗ; đối chiếu serie; nhận lại bằng tích và bằng quét; hư hỏng nhẹ kèm ảnh; màn hình Hôm nay (bản tối thiểu), Đang mượn, Yêu cầu chờ duyệt; trang người mượn tự chuyển trạng thái. Khi nhận lại có Hư hỏng nặng hoặc Mất, server tạo `BienBan` "Chờ minh chứng" và đổi trạng thái đúng mục 7; màn hình biên bản làm ở M5.

Kiểm thử bắt buộc:

- Chặn giao thiết bị đang mượn, đang giữ chỗ cho yêu cầu khác, và ở các tình trạng bị chặn; Hư hỏng nhẹ và Khác cần xác nhận.
- "Hủy giữ chỗ và giao" bắt buộc lý do; yêu cầu kia mất thiết bị đó.
- Giao cách 1 bằng tích và bằng quét; quét thiết bị không thuộc yêu cầu thì báo lỗi; thiết bị chưa tích không được giao.
- Yêu cầu mở lại được nhiều lần khi còn chờ duyệt; chỉ duyệt hoặc từ chối được một lần; hai người duyệt cùng lúc thì chỉ một người thành công.
- Giao cách 2 tự điền theo SĐT.
- Thiết bị "Không có" serie mượn, trả được.
- Đối chiếu "Lệch" rồi tiếp tục thì tạo `YeuCauDieuChinh` và `LichSu` ghi "Lệch"; so serie bỏ khoảng trắng, không phân biệt chữ hoa, thường.
- Giao hộp theo số lượng chọn đúng số Mã TB sẵn sàng (ưu tiên Tốt, rồi số thứ tự nhỏ); vượt số lượng sẵn sàng bị chặn.
- Sau khi giao: mỗi thiết bị có một dòng `ChiTietPhieu`; `kiemTraNhatQuan()` không báo sai lệch.
- Ghi bị dừng giữa chừng rồi gửi lại cùng `requestId`: dữ liệu cuối đầy đủ, không trùng.
- Nhận lại bằng tích, bằng quét, và quét thiết bị thuộc phiếu khác.
- Tem hộp có trong nhiều phiếu thì trả danh sách phiếu để chọn.
- Tình trạng cập nhật khi nhận lại và được điền sẵn ở lần mượn sau.
- Hư hỏng nhẹ thiếu ảnh bị chặn và không tạo biên bản.
- Hư hỏng nặng về "Phòng TH" ngay, không cho mượn, phiếu chuyển "Chờ biên bản".
- Thiết bị mất giữ "Đang mượn" đến khi biên bản hoàn tất.
- Trả một phần: số TB đã trả và trạng thái phiếu đúng.
- Người chưa đăng nhập và vai trò Chỉ xem không giao, không nhận được.
- Có cảnh báo khi SĐT đang có phiếu quá hạn hoặc biên bản chưa hoàn tất.

Nghiệm thu: chạy trọn kịch bản mượn rồi trả trên hai điện thoại (người mượn và người quản lý), gồm một bộ và một hộp.

### M5 – Biên bản, ảnh thiết bị, yêu cầu điều chỉnh

Đọc: phần biên bản, báo hỏng ngoài phiếu, tìm lại thiết bị của mục 7; phần ảnh và yêu cầu điều chỉnh của mục 9; mục 3.

Kiểm thử bắt buộc:

- Hoàn tất biên bản bị chặn khi thiếu minh chứng hoặc thiếu nhân chứng.
- Hoàn tất biên bản: thiết bị Hư hỏng nặng thay "Chờ biên bản" bằng Mã BB; thiết bị Mất có tình trạng Mất, cột Lưu trữ trống, cột Tổng SL thực tế được tính lại; phiếu được cập nhật.
- Báo hỏng ngoài phiếu: mức nhẹ cần ảnh; mức nặng hoặc mất tạo biên bản không có người mượn.
- Tìm lại thiết bị đã ghi Mất: chỉ Admin, cần lý do và minh chứng.
- Quản lý gọi API xóa ảnh, xóa minh chứng bị từ chối, nhưng gửi yêu cầu được. Admin duyệt thì file vào thùng rác và dòng chuyển "Đã xóa"; Admin từ chối thì giữ nguyên.
- Admin duyệt yêu cầu sửa serie thì cập nhật và ghi `LichSu` giá trị cũ, mới; serie trùng bị chặn.
- File sai loại hoặc quá kích thước bị từ chối; ảnh thu nhỏ quá 30.000 ký tự bị từ chối.
- API trả ảnh và minh chứng chỉ khi có phiên hợp lệ.
- Gửi email ngay khi hoàn tất biên bản nặng, mất và khi lệch serie; hết hạn mức email thì ghi `NhatKy`, không làm hỏng thao tác chính.

Nghiệm thu: in một biên bản A4; đối chiếu với mẫu biên bản của Khoa (nếu có).

### M6 – Điều chuyển phòng, buổi thực hành, tra cứu và gia hạn

Đọc: cách 3 và phần "Tra cứu và gia hạn" của mục 6; phần điều chuyển phòng của mục 9.

Kiểm thử bắt buộc:

- Điều chuyển bị chặn khi thiếu lý do hoặc minh chứng.
- Thiết bị trong bộ, hộp đi theo bộ, hộp; đổi tên phòng; chuyển toàn bộ thì phòng cũ "Ngừng dùng".
- Bản ghi điều chuyển không sửa, không xóa được; cột Phòng/Vị trí không đổi được qua action nào khác.
- Thiết bị đang mượn vẫn điều chuyển được; khi nhận lại có nhắc phòng mới.
- Phiếu buổi thực hành: hạn trả bằng giờ kết thúc; không được gia hạn; quá giờ thì tính là quá hạn.
- Tra cứu sai SĐT hoặc sai Mã phiếu cho cùng một phản hồi "Không tìm thấy"; sai quá ngưỡng bị chặn tạm.
- Gia hạn quá 2 lần hoặc quá 7 ngày bị chặn; duyệt gia hạn cập nhật hạn trả và số lần gia hạn.

Nghiệm thu: giao và thu một buổi thực hành thử; người mượn tra cứu và xin gia hạn trên điện thoại khác.

### M7 – Kiểm kê, sửa chữa, thanh lý, báo cáo

Đọc: các dòng tương ứng của mục 9; phần "Lọc hiển thị" của mục 8.

Kiểm thử bắt buộc:

- Kiểm kê cho đúng ba kết quả: đủ, sai phòng, không tìm thấy; không tính thiết bị đang mượn; hộp so số lượng đếm với số phải có.
- Hai đợt kiểm kê trong cùng một ngày có mã khác nhau.
- Gửi sửa thì tình trạng thành Đang sửa chữa và không cho mượn; nhận về thì cập nhật kết quả, chi phí.
- Thanh lý chỉ Admin làm được, chỉ từ Chờ thanh lý, và tính lại cột Tổng SL thực tế.
- Số liệu báo cáo khớp bộ dữ liệu mẫu.
- Lịch sử người mượn cho đúng số lần trả trễ và số biên bản.

Nghiệm thu: kiểm kê thử một phòng bằng quét tem; xuất một báo cáo ra Excel.

### M8 – Thông báo, sao lưu, hoàn thiện, bàn giao

Đọc: các dòng còn lại của mục 9; mục 2.1, 2.2; phần dữ liệu cá nhân của mục 3.

Phạm vi: email tổng hợp, nhắc hạn, các email ngay còn lại; cài trigger; sao lưu; Trang tổng quan đầy đủ; màn hình kiểm tra nhất quán; lưu trữ theo năm; ẩn danh dữ liệu cá nhân; rà soát toàn bộ repo bằng `spec-reviewer`; hoàn thiện tài liệu; tạo PROD.

Kiểm thử bắt buộc:

- Email tổng hợp đúng nội dung; khi sắp hết hạn mức thì theo đúng thứ tự ưu tiên; hết hạn mức thì ghi `NhatKy` và hiện cảnh báo trên Trang tổng quan.
- Người mượn có email nhận đúng 1 email trước hạn và 1 email khi quá hạn, không lặp.
- Sao lưu giữ đúng 8 bản gần nhất; sao lưu lỗi thì gửi email cho Admin.
- Ẩn danh chỉ áp dụng cho phiếu đã đóng quá thời gian lưu; phiếu có biên bản giữ nguyên.
- `kiemTraNhatQuan()` phát hiện từng loại sai lệch được tạo sẵn trong dữ liệu thử.
- Lưu trữ theo năm không làm mất dòng nào.

Nghiệm thu: người dùng chạy toàn bộ `docs/KIEM-THU-THU-CONG.md` trên PROD bằng dữ liệu thử, rồi xóa dữ liệu thử.

## Tài liệu phải có khi bàn giao

- `docs/HUONG-DAN-TRIEN-KHAI.md`: từng bước bấm chuột cho người không lập trình, theo thứ tự: tài khoản Google và clasp; chạy `setup()` và cấp quyền; kiểm tra Script Properties; Google Cloud và OAuth Client ID; deploy web app và cách cập nhật không đổi URL; GitHub và GitHub Pages; điền `web/config.js`; cài trigger; thêm Gmail người quản lý; bài kiểm tra cuối (gửi một yêu cầu ở cửa sổ ẩn danh rồi giao bằng tài khoản quản lý; quét QR thiết bị khi chưa đăng nhập để xác nhận bị chặn).
- `docs/HUONG-DAN-VAN-HANH.md`: hạn mức miễn phí và dấu hiệu khi chạm hạn mức; xử lý khi mã phiên hết hạn; máy dùng chung phải đăng xuất; lưu ý iPhone và link mở từ Zalo; việc cần làm trước khi đổi `BASE_URL`; đổi mã truy cập theo học kỳ; tải bản sao lưu về nơi thứ hai mỗi học kỳ; các bước khôi phục dữ liệu từ bản sao lưu và một lần khôi phục thử; cách đọc kết quả kiểm tra nhất quán.
- `docs/KIEM-THU-THU-CONG.md`: kịch bản thử trên điện thoại cho các luồng: tìm thiết bị và gửi yêu cầu không đăng nhập; giao theo yêu cầu; giao trực tiếp; giao theo buổi; giao và nhận bộ, hộp; nhận lại bằng tích và bằng quét; lập biên bản hư hỏng; gia hạn; điều chuyển phòng; yêu cầu điều chỉnh; nhập hàng; in tem.
