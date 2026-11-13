# Câu hỏi mở

Người dùng điền cột "Trả lời". Ô nào còn trống thì Claude Code làm theo cột "Mặc định". Claude Code ghi thêm câu hỏi mới vào cuối bảng tương ứng, không tự quyết thay người dùng.

## A. Cần trả lời trước khi bắt đầu (ảnh hưởng kiến trúc)

| # | Câu hỏi | Vì sao cần | Mặc định | Trả lời |
| --- | --- | --- | --- | --- |
| A1 | Tài khoản chủ sở hữu là Gmail cá nhân của Admin, một Gmail lập riêng cho Khoa, hay tài khoản Google Workspace của Trường? | Quyết định hạn mức (Gmail: 100 email/ngày), và việc hệ thống có phụ thuộc một cá nhân hay không | Gmail cá nhân của Admin | Gmail cá nhân của Admin (06/11/2026). Không ghi địa chỉ vào repo; `setup()` tự lấy. Người quản lý cũng dùng Gmail cá nhân, không khai báo tên miền Workspace |
| A2 | Sinh viên có tài khoản Google do Trường cấp không? | Nếu có, về sau có thể xác thực người mượn thay vì tin vào SĐT tự khai | Không; người mượn không đăng nhập | |
| A3 | Quy mô thật: số thiết bị, số người quản lý, số lớp mượn mỗi ngày, lớp đông nhất bao nhiêu người? | Thiết kế hiệu năng và hạn mức | Như mục 1.3 của đặc tả | Khoảng 200 thiết bị (06/11/2026). Các con số khác chưa có: giữ thiết kế theo mục 1.3 (dư cho 200 thiết bị) |
| A4 | Có file Excel danh sách thiết bị hiện tại không? Thiết bị đã có mã cũ hoặc tem cũ chưa? | Làm chức năng nhập danh sách ban đầu theo dữ liệu thật | Nhập theo file mẫu của app; mã cũ ghi vào cột Mã tham chiếu | Chưa có file, người dùng nhập sau (06/11/2026) |
| A5 | Khoa hoặc Trường có mẫu biên bản hư hỏng, mất, biên bản bàn giao khi điều chuyển không? | Biên bản in ra phải đúng mẫu đang dùng | Claude Code soạn mẫu A4, người dùng duyệt | Chưa có mẫu (06/11/2026): theo mặc định |
| A6 | In tem bằng gì: máy in thường trên decal A4, hay máy in tem nhiệt khổ 40 × 30 mm? | Bố cục trang in khác nhau | Decal A4 | Decal trơn A4, máy in thường (06/11/2026) |
| A7 | Tên tài khoản GitHub và tên repo? | Tạo thành `BASE_URL` in trên tem, không nên đổi sau khi in | Chưa in tem hàng loạt cho đến khi chốt | Tài khoản `thuannv181198`, repo `tb` → `BASE_URL` = `https://thuannv181198.github.io/tb/` (06/11/2026). Xem thêm C2 |
| A8 | Máy chạy Claude Code là Windows? Mạng có proxy hay chặn `script.google.com`, `github.com` không? | Viết script và hướng dẫn cài đặt cho đúng | Windows, không có proxy | Windows 11; Node.js LTS và Git cài bằng winget ngày 12/11/2026. Proxy: chưa rõ, theo mặc định |
| A9 | Ai là Admin thứ hai? | Hệ thống không nên phụ thuộc một người | Chưa có; nhắc lại ở M8 | |

## B. Nghiệp vụ (trả lời trước mốc tương ứng)

| # | Câu hỏi | Mốc | Mặc định | Trả lời |
| --- | --- | --- | --- | --- |
| B1 | Có quản lý vật tư tiêu hao (gas lạnh, que hàn, ống đồng...) theo kiểu nhập, xuất, tồn không? | Sau M8 | Ngoài phạm vi | |
| B2 | Có cần theo dõi hạn kiểm định, hiệu chuẩn, bảo dưỡng định kỳ và chặn cho mượn khi quá hạn không? | M2 | Ngoài phạm vi | |
| B3 | Có thu Mã sinh viên hoặc Mã cán bộ của người mượn không? Bắt buộc hay không? | M3 | Không thu | |
| B4 | Người mượn đang có phiếu quá hạn hoặc biên bản chưa hoàn tất: chỉ cảnh báo hay chặn mượn tiếp? | M4 | Chỉ cảnh báo | |
| B5 | Sau biên bản, có theo dõi kết quả xử lý (bồi thường, sửa chữa, miễn trách nhiệm) không? | M5 | Không | |
| B6 | Thời gian lưu thông tin cá nhân người mượn và nội dung thông báo trên form: ai duyệt? | M3 | 24 tháng; Claude Code soạn thông báo, Khoa duyệt với bộ phận pháp chế | |
| B7 | Dụng cụ trong hộp: giữ cách mỗi món một Mã TB, hay chỉ quản lý theo số lượng của hộp? | M2 | Mỗi món một Mã TB | |
| B8 | Trang công khai liệt kê từng thiết bị, hay gộp theo nhóm kèm số lượng sẵn sàng (người mượn chọn số lượng, người quản lý gán thiết bị cụ thể khi giao)? | M3 | Liệt kê từng thiết bị | |
| B9 | Vai trò Chỉ xem quét QR thiết bị: bị chặn, hay được xem thẻ thiết bị chỉ đọc? | M4 | Bị chặn | |
| B10 | Mã truy cập trang công khai có bật ngay từ đầu không? | M3 | Tắt | |

## C. Câu hỏi phát sinh trong lúc làm

| # | Ngày | Câu hỏi | Phương án đề xuất | Trả lời |
| --- | --- | --- | --- | --- |
| C1 | 12/11/2026 | Hạn mượn mặc định: lần trước trả lời "tối đa 2 ngày", đặc tả mục 1.4 ghi 7 ngày | `CauHinh` ban đầu: hạn mượn mặc định 2 ngày; hạn người mượn đề xuất tối đa = 2 ngày; gia hạn giữ 2 lần × 7 ngày | 2 ngày (12/11/2026) |
| C2 | 12/11/2026 | GitHub Pages "Deploy from a branch" chỉ phát hành được thư mục gốc hoặc `/docs` của repo, không phát hành được `web/` | Phát hành `web/` bằng GitHub Actions (workflow tĩnh có sẵn của GitHub, miễn phí với repo công khai); `BASE_URL` không đổi. Làm ở M1 | Theo đề xuất (13/11/2026) |
| C3 | 12/11/2026 | Thao tác ghi không tạo bản ghi chính (đổi tình trạng, sửa tài khoản, lưu cấu hình): lưu `requestId` ở đâu? | Sheet mới `KetQuaRequest` (requestId, Thời gian, Action, Email, Kết quả JSON), tra trong vùng khóa, dọn dòng cũ hơn 30 ngày; bản ghi chính vẫn giữ cột `requestId` | Thêm sheet `KetQuaRequest` (12/11/2026) |
| C4 | 12/11/2026 | Cột Tình trạng của `ThietBi` lưu tên hiển thị hay mã nội bộ, khi Admin được đổi tên hiển thị? | Lưu tên hiển thị; đổi tên thì server ghi lại cột 5 và danh sách thả xuống trong vùng khóa; `LichSu` giữ tên tại thời điểm ghi; code quy về mã nội bộ trước khi xử lý | Lưu tên hiển thị (12/11/2026) |
| C5 | 12/11/2026 | `smokeTest()` phải từ chối chạy ngoài DEV: nhận biết DEV bằng gì? | Script Property `MOI_TRUONG` = `DEV` hoặc `PROD`, người dùng đặt tay theo hướng dẫn triển khai; thiếu thuộc tính này thì `smokeTest()` từ chối | |
| C6 | 12/11/2026 | Giới hạn nhập sai mã truy cập chỉ tính theo trình duyệt (mục 1.4); mã trình duyệt do máy khách tự sinh nên xóa dữ liệu trình duyệt là né được | Thêm tầng toàn hệ thống: 30 lần sai/10 phút thì chặn nhập mã 10 phút. Quyết trước M3 | Theo đề xuất (13/11/2026) |
| C8 | 13/11/2026 | Minh chứng (ảnh, PDF biên bản đã ký, minh chứng điều chuyển) cần "mã minh chứng" để gửi yêu cầu xóa (mục 9), nhưng đặc tả không có sheet minh chứng | Mỗi file một mã `MC-yyyyMMdd-###`, lưu trong ô JSON của bản ghi chính (`BienBan`, `DieuChuyen`...) kèm File ID và trạng thái (Hiển thị/Chờ xóa/Đã xóa). Phương án khác: thêm sheet `MinhChung`. Quyết trước M4 | Theo đề xuất (13/11/2026): lưu trong ô JSON |
| C7 | 12/11/2026 | Code giai đoạn 1 cũ (thư mục `backend/`, `frontend/` ngoài repo) | Không chép vào repo (chứa email cá nhân, khác hợp đồng dữ liệu mới). Chỉ tham khảo khi viết lại; Apps Script và Sheet cũ (nếu đã tạo) để nguyên, xóa sau khi DEV chạy | |
