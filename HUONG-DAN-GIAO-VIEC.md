# Hướng dẫn giao việc cho Claude Code trong VS Code

File này dành cho người giao việc. Claude Code không cần đọc.

## 1. Chuẩn bị một lần

1. Cài Node.js bản LTS, Git for Windows, VS Code và tiện ích Claude Code.
2. Tạo một thư mục trống (ví dụ `qltb-phong-th`), giải nén bộ file này vào đó. Thư mục `.claude` là thư mục ẩn, phải nằm cùng cấp với `CLAUDE.md`.
3. Mở thư mục bằng VS Code, mở cửa sổ dòng lệnh và chạy `git init`.
4. Điền cột "Trả lời" trong `docs/CAU-HOI-MO.md`, ít nhất là bảng A. Nếu có file Excel danh sách thiết bị hoặc mẫu biên bản, chép vào `docs/mau/` sau khi xóa thông tin cá nhân.
5. Không chép file prompt gốc vào thư mục này: nó chứa địa chỉ email cá nhân, mà repo sẽ công khai.

Kiểm tra trước khi giao việc:

- Gõ `/context` trong Claude Code: mục Memory files phải có `CLAUDE.md`.
- Gõ `/permissions`: phải thấy các luật trong `.claude/settings.json`. Nếu Claude Code báo luật nào không hợp lệ thì nhờ nó sửa theo tài liệu hiện hành.

## 2. Lời giao việc

### Khởi động (làm một lần)

Chuyển sang Plan mode bằng nút chọn chế độ ở cuối ô nhập, rồi gửi:

```text
Đọc CLAUDE.md, docs/KE-HOACH.md, docs/CAU-HOI-MO.md và toàn bộ docs/spec/. Chưa viết code.

1. Liệt kê mọi điểm trong đặc tả còn mơ hồ, mâu thuẫn hoặc thiếu để làm được M0 và M1. Với mỗi điểm, đề xuất một cách xử lý. Những điểm ảnh hưởng tới cấu trúc dữ liệu hoặc bảo mật thì hỏi tôi bằng AskUserQuestion; các điểm còn lại ghi vào bảng C của docs/CAU-HOI-MO.md.
2. Trình kế hoạch M0: cây thư mục, công cụ kiểm thử, cách giả lập dịch vụ Google trên Node, dàn ý docs/HOP-DONG-DU-LIEU.md.
```

Đọc kế hoạch, sửa trực tiếp hoặc ghi nhận xét, rồi duyệt.

### Mỗi mốc (M0 đến M8)

Mở phiên mới cho mỗi mốc (hoặc gõ `/clear`), rồi gửi:

```text
Làm mốc M<số> theo docs/KE-HOACH.md, đúng "Quy trình cho mỗi mốc". Bắt đầu bằng kế hoạch và chờ tôi duyệt.
```

### Khi có lỗi

```text
Lỗi: <hiện tượng nhìn thấy>.
Các bước tái hiện: <bước 1, bước 2...>.
Kết quả mong đợi: <...>.
Viết một kiểm thử tái hiện lỗi trước, rồi sửa nguyên nhân gốc, sau đó chạy lại toàn bộ kiểm thử.
```

Kèm ảnh chụp màn hình nếu là lỗi giao diện.

### Khi muốn đổi yêu cầu

Sửa file trong `docs/spec/` trước (hoặc nhờ Claude Code sửa và xem lại phần thay đổi), rồi mới yêu cầu sửa code. Đặc tả là nguồn sự thật; yêu cầu chỉ nói trong hội thoại sẽ mất khi mở phiên mới.

## 3. Thói quen giúp kết quả ổn định

- Mỗi mốc một phiên. Hội thoại càng dài, Claude Code càng dễ bỏ sót chỉ dẫn ban đầu.
- Đã sửa hai lần cùng một lỗi mà chưa được: gõ `/clear`, viết lại yêu cầu cho rõ hơn, không sửa tiếp trong phiên cũ.
- Chỉ chấp nhận "xong" khi có kết quả `npm test` kèm theo, và sau khi tự thử các bước trong phần "Nghiệm thu" của mốc.
- Sau mỗi mốc đã nghiệm thu: yêu cầu commit. Muốn quay lại thì dùng git, không dựa vào lịch sử hội thoại.
- Lệnh deploy và `git push` luôn hiện hộp hỏi lại: đọc lệnh trước khi bấm đồng ý.
- Claude Code lặp lại một sai sót ở nhiều phiên: thêm đúng một dòng quy tắc vào `CLAUDE.md` hoặc `.claude/rules/`. Giữ `CLAUDE.md` dưới 200 dòng.

## 4. Việc Claude Code không làm thay được

Đăng nhập Google và clasp, bấm cấp quyền lần đầu, tạo OAuth Client ID, tạo repo và bật GitHub Pages, in tem, thử trên điện thoại thật. Claude Code sẽ viết từng bước vào `docs/HUONG-DAN-TRIEN-KHAI.md` khi tới mốc cần làm.
