# web/vendor

Thư viện bên ngoài được chép sẵn vào đây; giao diện không nạp thư viện từ CDN lúc chạy (đặc tả mục 2).
Mỗi file ghi phiên bản, nguồn tải và mã băm SHA-256.

| File | Phiên bản | Nguồn | SHA-256 | Mốc dùng |
| --- | --- | --- | --- | --- |
| (chưa có) | | | | |

Dự kiến:

- `html5-qrcode` 2.3.8 (M4, quét QR);
- `qrcode-generator` (M2, tạo QR tem và QR yêu cầu);
- SheetJS 0.20.3 từ `cdn.sheetjs.com` (M2, đọc và xuất Excel).

Ngoại lệ duy nhất: script Google Identity Services nạp từ `https://accounts.google.com/gsi/client`, vì Google không cho phép chép về.
