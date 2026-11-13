# Quyết định

Ghi các lựa chọn kỹ thuật, nghiệp vụ đã chốt, kèm lý do. Đọc đầu mỗi phiên, cập nhật cuối mỗi phiên. Câu hỏi còn mở nằm ở `docs/CAU-HOI-MO.md`.

| # | Ngày | Quyết định | Lý do | Nguồn |
| --- | --- | --- | --- | --- |
| Q1 | 12/11/2026 | Làm lại từ đầu theo bộ kit; code giai đoạn 1 cũ chỉ để tham khảo, không chép vào repo | Code cũ chứa email cá nhân và khác hợp đồng dữ liệu mới | C7 (theo phương án đề xuất) |
| Q2 | 12/11/2026 | Repo đặt trong OneDrive, thư mục `qltb` | Người dùng chọn. Phụ thuộc ít (chỉ ESLint) nên OneDrive đồng bộ nhẹ; Git báo lỗi khóa file thì tạm dừng đồng bộ | Người dùng |
| Q3 | 13/11/2026 | Node.js 26.13.1 và MinGit 2.56.0 bản portable trong `%LOCALAPPDATA%\Programs`, thêm vào PATH người dùng | Bộ cài winget treo ở bước xin quyền quản trị. Đã đối chiếu SHA-256 với nguồn chính thức | |
| Q4 | 13/11/2026 | Commit dùng tên `thuannv181198` và email `thuannv181198@users.noreply.github.com` | Repo công khai: không lộ email cá nhân trong lịch sử Git | Bất biến 2 của `CLAUDE.md` |
| Q5 | 12/11/2026 | Hạn mượn mặc định 2 ngày; người mượn đề xuất tối đa 2 ngày; gia hạn giữ 2 lần × 7 ngày | Người dùng trả lời | C1 |
| Q6 | 12/11/2026 | Thêm sheet `KetQuaRequest` lưu kết quả của mọi action ghi | Thao tác không tạo bản ghi chính vẫn cần chống ghi trùng khi gửi lại | C3 |
| Q7 | 12/11/2026 | Cột Tình trạng lưu tên hiển thị; đổi tên thì ghi lại cả cột | Sheet dễ đọc cho người không lập trình | C4 |
| Q8 | 13/11/2026 | `smokeTest()` nhận biết DEV bằng Script Property `MOI_TRUONG` | Không có cách nào khác phân biệt project DEV và PROD | C5 (theo phương án đề xuất) |
| Q9 | 13/11/2026 | Xác minh ID token bằng endpoint `tokeninfo` | Google ghi endpoint này dành cho phát triển và gỡ lỗi; ở đây chỉ gọi một lần mỗi lần đăng nhập. Thư viện xác minh chữ ký JWT không có sẵn trong Apps Script | Đặc tả mục 3 |
| Q10 | 13/11/2026 | Mã giao dịch `LichSu`: `GD-yyyyMMdd-####` | Đặc tả không quy định | |
| Q11 | 13/11/2026 | Mã minh chứng `MC-yyyyMMdd-###`, lưu trong ô JSON của bản ghi chính (tạm thời) | Đặc tả cần "mã minh chứng" cho yêu cầu xóa nhưng không có sheet minh chứng | Chờ C8 |
| Q12 | 13/11/2026 | `CauHinh` có thêm cột `Mô tả` | Admin sửa tay trên Sheet hiểu được từng khóa | |
| Q13 | 13/11/2026 | Mọi bước nâng cấp phải chạy lại được; `setup()` luôn rà và thêm lại sheet, cột bị xóa nhầm | Tránh vòng lặp "thiếu cột, hãy chạy setup()" khi bước nâng cấp đã chạy | |
| Q14 | 13/11/2026 | Giờ Việt Nam tính bằng độ lệch cố định UTC+7 | Việt Nam không dùng giờ mùa hè; tránh phụ thuộc múi giờ của máy chạy | |
| Q15 | 13/11/2026 | Nhập hàng không ghi `LichSu` | Đặc tả: dòng có giao dịch trong `LichSu` thì không xóa được; dòng nhập nhầm phải xóa được | Đặc tả mục 4, 5 |
| Q16 | 13/11/2026 | Bảo vệ hàng tiêu đề ở mức cảnh báo | Sheet chỉ chủ sở hữu sửa; mục đích là chống sửa nhầm | |
| Q17 | 13/11/2026 | Gợi ý mã nhóm thay thế: thêm lần lượt chữ cái của từ cuối; vượt 6 ký tự hoặc hết chữ thì không gợi ý, Admin tự đặt | Đặc tả chỉ nêu bước đầu | Đặc tả mục 5 |
| Q18 | 13/11/2026 | Màu của tình trạng "Khác": xanh dương | Đặc tả không quy định | |
| Q19 | 13/11/2026 | Kiểm thử: trình chạy có sẵn của Node; ESLint 10.13.0, `@eslint/js` 10.0.1, `globals` 17.13.0 (phát hành trước 2 tuần trở lên) | ESLint 9 đã hết hỗ trợ. `npm audit` báo 4 lỗ hổng mức trung bình ở `minimatch` (thư viện con của ESLint): chỉ chạy trên máy phát triển với mẫu đường dẫn của chính repo, không vào app; chấp nhận, xem lại khi nâng ESLint | |
| Q20 | 13/11/2026 | Bộ giả lập coi chuỗi bắt đầu bằng `=` là công thức kể cả ô văn bản thuần; mọi chuỗi đi qua `Util.toSheetText` | Giả định chặt hơn thực tế thì an toàn hơn; `smokeTest()` kiểm chứng trên Sheet thật | |
| Q21 | 13/11/2026 | Không dùng định dạng số "General"; cột không có định dạng riêng thì để nguyên | Chưa chắc Sheet nhận chuỗi định dạng này | |
