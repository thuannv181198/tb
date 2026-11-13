/**
 * Cấu hình tĩnh của hệ thống: định nghĩa sheet và cột, tình trạng, khóa CauHinh,
 * Script Properties, loại mã. Nguồn sự thật: docs/HOP-DONG-DU-LIEU.md.
 * Chỉ khai báo hằng số; không gọi dịch vụ Google ở đây.
 */
var Config = (function () {
  var TZ = 'Asia/Ho_Chi_Minh';

  // Kiểu cột: T văn bản thuần, N số, D ngày, DT ngày giờ, J JSON, B Có/Không
  var TYPE = { T: 'T', N: 'N', D: 'D', DT: 'DT', J: 'J', B: 'B' };

  // Định dạng số của từng kiểu cột (null: để Sheet tự định dạng)
  var FORMAT = { T: '@', J: '@', B: '@', D: 'dd/MM/yyyy', DT: 'dd/MM/yyyy HH:mm', N: null };

  // Ô Google Sheet chứa tối đa 50.000 ký tự
  var MAX_CELL_CHARS = 50000;

  function col(name, type, required) {
    return { name: name, type: type, required: !!required };
  }

  var T = TYPE.T, N = TYPE.N, D = TYPE.D, DT = TYPE.DT, J = TYPE.J, B = TYPE.B;

  var SHEETS = [
    {
      name: 'ThietBi',
      fixedColumns: 9, // cột 1–9 giữ đúng thứ tự
      cols: [
        col('STT', N), col('Tên thiết bị', T, true), col('Mã TB', T, true), col('Số serie', T, true),
        col('Tình trạng', T, true), col('Lưu trữ', T), col('Tổng SL thực tế', N), col('Ngày nhận bàn giao', D),
        col('Ghi chú', T),
        col('Mã nhóm', T, true), col('Hãng/Model', T), col('Phòng/Vị trí', T, true), col('Mã bộ/hộp', T),
        col('Gắn tem riêng', B, true), col('Mã đợt nhập', T), col('Chi tiết tình trạng', T), col('Ảnh đại diện', T),
        col('Người đang mượn', T), col('SĐT người đang mượn', T), col('Mã phiếu đang mượn', T), col('Hạn trả', DT),
        col('Mã yêu cầu giữ chỗ', T), col('Giữ chỗ đến', DT), col('Cần in lại tem', B), col('Mã tham chiếu', T),
        col('Cập nhật lần cuối', DT), col('Người cập nhật', T)
      ]
    },
    {
      name: 'NhomTB',
      cols: [
        col('Mã nhóm', T, true), col('Tên chuẩn hóa', T, true), col('Tên hiển thị', T, true), col('Đơn vị tính', T),
        col('Số thứ tự cuối đã cấp', N, true), col('Ảnh thu nhỏ của nhóm', T)
      ]
    },
    {
      name: 'BoHop',
      cols: [
        col('Mã bộ/hộp', T, true), col('Loại', T, true), col('Tên', T, true), col('Mã nhóm', T), col('Phòng/Vị trí', T, true),
        col('Mô tả', T), col('Ảnh đại diện', T), col('Trạng thái', T, true), col('Ngày tạo', D, true), col('Ghi chú', T)
      ]
    },
    {
      name: 'DotNhap',
      cols: [
        col('Mã đợt', T, true), col('Nội dung đề xuất', T, true), col('Số tờ trình/QĐ', T), col('Ngày đề xuất', D),
        col('Ngày nhận bàn giao', D), col('Nhà cung cấp', T), col('Nguồn kinh phí', T), col('Trạng thái đợt', T, true),
        col('Người nhập', T, true), col('Ghi chú', T), col('requestId', T, true)
      ]
    },
    {
      name: 'ChiTietDot',
      cols: [
        col('Mã đợt', T, true), col('Tên thiết bị', T, true), col('Hãng/Model', T), col('SL đề xuất', N, true),
        col('SL đã nhận', N, true), col('Đơn giá', N), col('Ghi chú', T)
      ]
    },
    {
      name: 'YeuCauMuon',
      cols: [
        col('Mã YC', T, true), col('Thời gian tạo', DT, true), col('Họ tên', T, true), col('Đơn vị/Lớp', T, true),
        col('SĐT', T, true), col('Email', T), col('Danh sách mượn', J, true), col('Mục đích/Học phần', T, true),
        col('Hạn trả đề xuất', DT, true), col('Mã xác nhận', T, true), col('Hết hạn QR', DT, true), col('Trạng thái', T, true),
        col('Email người duyệt', T), col('Thời gian duyệt', DT), col('Lý do từ chối', T), col('Mã phiếu tạo ra', T),
        col('Số lần làm mới QR', N, true), col('Thời điểm đồng ý dùng thông tin cá nhân', DT, true), col('requestId', T, true)
      ]
    },
    {
      name: 'PhieuMuon',
      cols: [
        col('Mã phiếu', T, true), col('Cách giao', T, true), col('Mã YC', T), col('Họ tên', T, true), col('Đơn vị/Lớp', T),
        col('SĐT', T, true), col('Email', T), col('Giảng viên phụ trách', T), col('Email người giao', T, true),
        col('Thời gian mượn', DT, true), col('Hạn trả', DT, true), col('Số lần gia hạn', N, true), col('Mục đích/Học phần', T),
        col('Số TB', N, true), col('Số TB đã trả', N, true), col('Trạng thái phiếu', T, true), col('requestId', T, true)
      ]
    },
    {
      name: 'ChiTietPhieu',
      cols: [
        col('Mã phiếu', T, true), col('Mã TB', T, true), col('Mã bộ/hộp', T), col('Nhóm hoặc người nhận', T),
        col('Tình trạng lúc giao', T, true), col('Thời gian giao', DT, true), col('Trạng thái dòng', T, true),
        col('Tình trạng lúc trả', T), col('Thời gian trả', DT), col('Người trả thực tế', T), col('Mã biên bản', T)
      ]
    },
    {
      name: 'YeuCauGiaHan',
      cols: [
        col('Mã GH', T, true), col('Mã phiếu', T, true), col('SĐT', T, true), col('Hạn hiện tại', DT, true),
        col('Hạn đề xuất', DT, true), col('Lý do', T, true), col('Thời gian gửi', DT, true), col('Trạng thái', T, true),
        col('Email người duyệt', T), col('Thời gian duyệt', DT), col('Ghi chú', T), col('requestId', T, true)
      ]
    },
    {
      name: 'LichSu',
      cols: [
        col('Mã GD', T, true), col('Thời gian', DT, true), col('Loại', T, true), col('Mã phiếu', T), col('Mã TB', T, true),
        col('Tình trạng trước', T), col('Tình trạng sau', T), col('Chi tiết hư hỏng', T), col('Cách xác nhận', T),
        col('Đối chiếu serie', T), col('Giá trị cũ', T), col('Giá trị mới', T), col('Mã biên bản', T),
        col('Mã điều chuyển', T), col('File ảnh', J), col('Người mượn', T), col('Người trả thực tế', T),
        col('Email người thao tác', T, true)
      ]
    },
    {
      name: 'BienBan',
      cols: [
        col('Mã BB', T, true), col('Mã phiếu', T), col('Danh sách Mã TB', J, true), col('Họ tên và SĐT người mượn', T),
        col('Email người lập', T, true), col('Thời gian lập', DT, true), col('Mô tả hư hỏng từng thiết bị', J, true),
        col('Tình trạng xác nhận', J, true), col('Nhân chứng', J), col('File biên bản đã ký', J), col('Ảnh hiện trạng', J),
        col('Trạng thái', T, true), col('requestId', T, true)
      ]
    },
    {
      name: 'DanhMucPhong',
      cols: [
        col('Mã phòng', T, true), col('Tên phòng', T, true), col('Trạng thái', T, true), col('Ngày bắt đầu', D),
        col('Ngày ngừng', D), col('Mã điều chuyển liên quan', T), col('Ghi chú', T)
      ]
    },
    {
      name: 'DieuChuyen',
      cols: [
        col('Mã ĐC', T, true), col('Thời gian', DT, true), col('Loại', T, true), col('Phòng cũ', T, true),
        col('Phòng mới', T, true), col('Danh sách Mã TB', J, true), col('Số TB', N, true), col('Lý do', T, true),
        col('Số quyết định/văn bản', T), col('File minh chứng', J, true), col('Email người thực hiện', T, true),
        col('Ghi chú', T), col('requestId', T, true)
      ]
    },
    {
      name: 'AnhThietBi',
      cols: [
        col('Mã ảnh', T, true), col('Mã TB', T, true), col('File ID', T, true), col('Mô tả', T),
        col('Email người tải', T, true), col('Thời gian tải', DT, true), col('Trạng thái', T, true), col('requestId', T, true)
      ]
    },
    {
      name: 'AnhNho',
      cols: [col('Mã TB', T, true), col('Ảnh thu nhỏ', T, true), col('Cập nhật lần cuối', DT, true)]
    },
    {
      name: 'YeuCauDieuChinh',
      cols: [
        col('Mã YCĐC', T, true), col('Loại', T, true), col('Mã đối tượng', T, true), col('Giá trị hiện tại', T),
        col('Giá trị đề xuất', T), col('Lý do', T, true), col('Ảnh kèm theo', J), col('Email người yêu cầu', T, true),
        col('Thời gian', DT, true), col('Trạng thái', T, true), col('Email người duyệt', T), col('Thời gian duyệt', DT),
        col('Ghi chú duyệt', T), col('requestId', T, true)
      ]
    },
    {
      name: 'SuaChua',
      cols: [
        col('Mã SC', T, true), col('Mã TB', T, true), col('Ngày gửi', D, true), col('Nội dung hư hỏng', T, true),
        col('Nơi sửa', T), col('Chi phí', N), col('Ngày nhận lại', D), col('Kết quả', T), col('requestId', T, true)
      ]
    },
    {
      name: 'DotKiemKe',
      cols: [
        col('Mã đợt KK', T, true), col('Phòng', T, true), col('Email người mở', T, true), col('Thời gian mở', DT, true),
        col('Thời gian đóng', DT), col('Trạng thái', T, true), col('Số phải có', N), col('Đủ', N), col('Sai phòng', N),
        col('Không tìm thấy', N), col('Ghi chú', T), col('requestId', T, true)
      ]
    },
    {
      name: 'KiemKe',
      cols: [
        col('Mã đợt KK', T, true), col('Mã TB hoặc Mã bộ/hộp', T, true), col('Thời gian xác nhận', DT, true),
        col('Cách xác nhận', T, true), col('Số lượng đếm', N), col('Email người kiểm', T, true), col('Phòng thực tế', T),
        col('Kết quả', T)
      ]
    },
    {
      name: 'TongHop',
      cols: [
        col('Mã nhóm', T, true), col('Tên TB', T, true), col('Phòng', T, true), col('Tổng SL thực tế', N, true),
        col('Tại phòng', N, true), col('Đang mượn', N, true), col('Tốt', N, true), col('Hư hỏng', N, true),
        col('Đang sửa', N, true)
      ]
    },
    {
      name: 'NguoiDung',
      cols: [
        col('Email', T, true), col('Họ tên', T), col('Vai trò', T, true), col('SĐT', T), col('Trạng thái', T, true),
        col('Ngày hết hạn', D), col('Phiên hợp lệ từ', DT), col('Ngày tạo', DT, true)
      ]
    },
    {
      name: 'NhatKy',
      cols: [
        col('Thời gian', DT, true), col('Email', T, true), col('Action', T, true), col('Đối tượng', T),
        col('Kết quả', T, true), col('Chi tiết', T)
      ]
    },
    {
      name: 'CauHinh',
      cols: [col('Khóa', T, true), col('Giá trị', T), col('Mô tả', T)]
    },
    {
      name: 'BoDem',
      cols: [col('Loại mã', T, true), col('Kỳ', T), col('Số cuối đã cấp', N, true)]
    },
    {
      name: 'KetQuaRequest',
      cols: [
        col('requestId', T, true), col('Thời gian', DT, true), col('Action', T, true), col('Email', T, true),
        col('Kết quả', J, true)
      ]
    }
  ];

  var SHEET_BY_NAME = {};
  SHEETS.forEach(function (s) { SHEET_BY_NAME[s.name] = s; });

  /**
   * Tám tình trạng cố định (mục 5). code: mã nội bộ không đổi; name: tên hiển thị mặc định
   * (Admin đổi được trong CauHinh); lendable: có cho mượn không; confirm: cho mượn sau khi
   * người quản lý xác nhận; counted: có tính vào Tổng SL thực tế không.
   */
  var STATUSES = [
    { code: 'TOT', name: 'Tốt', color: 'xanh lá', lendable: true, confirm: false, counted: true },
    { code: 'HONG_NHE', name: 'Hư hỏng nhẹ', color: 'vàng', lendable: true, confirm: true, counted: true },
    { code: 'HONG_NANG', name: 'Hư hỏng nặng', color: 'đỏ', lendable: false, confirm: false, counted: true },
    { code: 'DANG_SUA', name: 'Đang sửa chữa', color: 'cam', lendable: false, confirm: false, counted: true },
    { code: 'CHO_THANH_LY', name: 'Chờ thanh lý', color: 'xám', lendable: false, confirm: false, counted: true },
    { code: 'DA_THANH_LY', name: 'Đã thanh lý', color: 'xám', lendable: false, confirm: false, counted: false },
    { code: 'MAT', name: 'Mất', color: 'đỏ', lendable: false, confirm: false, counted: false },
    { code: 'KHAC', name: 'Khác', color: 'xanh dương', lendable: true, confirm: true, counted: true }
  ];

  var STORAGE = { BORROWED: 'Đang mượn', IN_ROOM: 'Phòng TH' };
  var YES = 'Có';
  var NO = 'Không';
  var NO_SERIAL = 'Không có';
  var ROLE = { ADMIN: 'Admin', MANAGER: 'Quản lý', VIEWER: 'Chỉ xem' };
  var USER_STATUS = { ACTIVE: 'Hoạt động', LOCKED: 'Khóa' };
  var ROOM_STATUS = { ACTIVE: 'Đang dùng', INACTIVE: 'Ngừng dùng' };
  var KIT_TYPE = { SET: 'Bộ', BOX: 'Hộp' };

  /** Danh sách thả xuống do setup() đặt (sheet → cột → giá trị). Tình trạng lấy từ CauHinh. */
  var VALIDATIONS = [
    { sheet: 'ThietBi', col: 'Lưu trữ', values: [STORAGE.BORROWED, STORAGE.IN_ROOM] },
    { sheet: 'ThietBi', col: 'Gắn tem riêng', values: [YES, NO] },
    { sheet: 'ThietBi', col: 'Cần in lại tem', values: [YES, NO] },
    { sheet: 'NguoiDung', col: 'Vai trò', values: [ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER] },
    { sheet: 'NguoiDung', col: 'Trạng thái', values: [USER_STATUS.ACTIVE, USER_STATUS.LOCKED] },
    { sheet: 'DanhMucPhong', col: 'Trạng thái', values: [ROOM_STATUS.ACTIVE, ROOM_STATUS.INACTIVE] },
    { sheet: 'BoHop', col: 'Loại', values: [KIT_TYPE.SET, KIT_TYPE.BOX] },
    { sheet: 'BoHop', col: 'Trạng thái', values: [ROOM_STATUS.ACTIVE, ROOM_STATUS.INACTIVE] }
  ];

  /**
   * Khóa CauHinh và giá trị ban đầu. setup() chỉ thêm khóa còn thiếu, không ghi đè.
   * Mọi giá trị lưu dạng chuỗi.
   */
  var CONFIG_DEFAULTS = [
    ['TEN_DON_VI', 'KHOA CÔNG NGHỆ NĂNG LƯỢNG', 'Tên đơn vị hiển thị trên app và tem'],
    ['PHONG_MAC_DINH', '201-VNB', 'Phòng gán cho thiết bị mới nhập'],
    ['HAN_MUON_NGAY', '2', 'Hạn mượn mặc định (ngày)'],
    ['HAN_DE_XUAT_TOI_DA_NGAY', '2', 'Hạn trả tối đa người mượn được đề xuất (ngày)'],
    ['NHAC_TRUOC_HAN_NGAY', '1', 'Nhắc trước hạn trả (ngày)'],
    ['GIA_HAN_TOI_DA_LAN', '2', 'Số lần gia hạn tối đa mỗi phiếu'],
    ['GIA_HAN_TOI_DA_NGAY', '7', 'Số ngày tối đa mỗi lần gia hạn'],
    ['GIU_CHO_PHUT', '30', 'Thời hạn QR yêu cầu mượn và giữ chỗ (phút)'],
    ['LAM_MOI_QR_TOI_DA', '2', 'Số lần làm mới QR tối đa mỗi yêu cầu'],
    ['HOI_TT_NHANH_GIAY', '5', 'Nhịp hỏi trạng thái yêu cầu lúc đầu (giây)'],
    ['HOI_TT_NHANH_TRONG_GIAY', '120', 'Thời gian dùng nhịp nhanh (giây)'],
    ['HOI_TT_CHAM_GIAY', '15', 'Nhịp hỏi trạng thái sau đó (giây)'],
    ['SO_DONG_TOI_DA_YC', '10', 'Số dòng tối đa mỗi yêu cầu mượn'],
    ['SO_YC_CHO_DUYET_MOI_SDT', '1', 'Số yêu cầu chờ duyệt tối đa mỗi SĐT'],
    ['PHIEN_GIO', '12', 'Thời hạn phiên đăng nhập quản lý (giờ)'],
    ['GIO_EMAIL_TONG_HOP', '7', 'Giờ gửi email tổng hợp (xấp xỉ, 0–23)'],
    ['MUC_LAP_BIEN_BAN', 'HONG_NANG,MAT', 'Mã tình trạng phải lập biên bản, cách nhau bởi dấu phẩy'],
    ['SO_NHAN_CHUNG_TOI_THIEU', '2', 'Số nhân chứng tối thiểu ký biên bản'],
    ['MA_TRUY_CAP_BAT', 'Không', 'Bật mã truy cập trang công khai (Có/Không)'],
    ['MA_TRUY_CAP', '', 'Mã truy cập 4–6 chữ số, nên đổi theo học kỳ'],
    ['GH_GUI_YC_SDT', '3', 'Gửi yêu cầu: số lần tối đa mỗi SĐT trong cửa sổ'],
    ['GH_GUI_YC_SDT_PHUT', '10', 'Gửi yêu cầu: cửa sổ tính theo SĐT (phút)'],
    ['GH_GUI_YC_HE_THONG_MOI_PHUT', '30', 'Gửi yêu cầu: số lần tối đa mỗi phút trên toàn hệ thống'],
    ['GH_TRA_CUU_SAI_SDT', '5', 'Tra cứu phiếu: số lần sai tối đa mỗi SĐT trong cửa sổ'],
    ['GH_TRA_CUU_SAI_PHUT', '15', 'Tra cứu phiếu: cửa sổ tính lần sai (phút)'],
    ['GH_TRA_CUU_HE_THONG_MOI_PHUT', '60', 'Tra cứu phiếu: số lần tối đa mỗi phút trên toàn hệ thống'],
    ['GH_MA_TRUY_CAP_SAI', '5', 'Nhập mã truy cập: số lần sai tối đa mỗi trình duyệt trong cửa sổ'],
    ['GH_MA_TRUY_CAP_SAI_PHUT', '15', 'Nhập mã truy cập: cửa sổ tính lần sai (phút)'],
    ['ANH_TOI_DA_KB', '1024', 'Kích thước ảnh tối đa sau khi nén (KB)'],
    ['PDF_TOI_DA_KB', '5120', 'Kích thước PDF minh chứng tối đa (KB)'],
    ['SO_FILE_TOI_DA', '5', 'Số file tối đa mỗi lần gửi'],
    ['ANH_NHO_TOI_DA_KY_TU', '30000', 'Độ dài tối đa chuỗi base64 của ảnh thu nhỏ'],
    ['CACHE_CONG_KHAI_GIAY', '300', 'Thời gian lưu đệm danh sách công khai (giây)'],
    ['LUU_TT_CA_NHAN_THANG', '24', 'Thời gian lưu thông tin cá nhân sau khi phiếu đóng (tháng)'],
    ['LIEN_HE_DU_LIEU_CA_NHAN', '', 'Đầu mối liên hệ ghi trong thông báo dùng thông tin cá nhân'],
    ['EMAIL_NHAN_THONG_BAO', '', 'Email nhận thông báo ngay, ngoài Admin (cách nhau bởi dấu phẩy)'],
    ['TEN_MIEN_WORKSPACE', '', 'Tên miền Google Workspace được phép đăng nhập (để trống: chỉ @gmail.com)']
  ];
  STATUSES.forEach(function (s) {
    CONFIG_DEFAULTS.push(['TEN_TT_' + s.code, s.name, 'Tên hiển thị của tình trạng ' + s.code]);
  });

  /** Script Properties dùng trong hệ thống. */
  var PROP = {
    SHEET_ID: 'SHEET_ID',
    DRIVE_FOLDER_ID: 'DRIVE_FOLDER_ID',
    ADMIN_EMAIL: 'ADMIN_EMAIL',
    SESSION_SECRET: 'SESSION_SECRET',
    CLIENT_ID: 'CLIENT_ID',
    ENV: 'MOI_TRUONG',
    DATA_VERSION: 'PHIEN_BAN_DU_LIEU'
  };

  /** Thư mục con trong thư mục Drive gốc: [Script Property, tên thư mục]. */
  var FOLDERS = [
    ['FOLDER_ANH_THIET_BI', 'AnhThietBi'],
    ['FOLDER_ANH_HU_HONG', 'AnhHuHong'],
    ['FOLDER_BIEN_BAN', 'BienBan'],
    ['FOLDER_DIEU_CHUYEN', 'DieuChuyen'],
    ['FOLDER_SAO_LUU', 'SaoLuu']
  ];

  /**
   * Loại mã có số thứ tự (mục 5). period: day → yyyyMMdd, year → yyyy, none → không có kỳ.
   * digits: số chữ số tối thiểu; hết số thì tự tăng thêm chữ số.
   */
  var CODE_TYPES = {
    YC: { prefix: 'YC', period: 'day', digits: 3 },
    PM: { prefix: 'PM', period: 'day', digits: 3 },
    GH: { prefix: 'GH', period: 'year', digits: 3 },
    BB: { prefix: 'BB', period: 'year', digits: 3 },
    DC: { prefix: 'DC', period: 'year', digits: 3 },
    ANH: { prefix: 'ANH', period: 'day', digits: 3 },
    YCDC: { prefix: 'YCDC', period: 'year', digits: 3 },
    DN: { prefix: 'DN', period: 'year', digits: 2 },
    SC: { prefix: 'SC', period: 'year', digits: 3 },
    KK: { prefix: 'KK', period: 'day', digits: 2 },
    BO: { prefix: 'BO', period: 'none', digits: 3 },
    HOP: { prefix: 'HOP', period: 'none', digits: 3 },
    GD: { prefix: 'GD', period: 'day', digits: 4 },
    MC: { prefix: 'MC', period: 'day', digits: 3 }
  };

  // Chữ cái của mã xác nhận: bỏ O, 0, I, 1 (32 ký tự)
  var CONFIRM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  return {
    TZ: TZ,
    TYPE: TYPE,
    FORMAT: FORMAT,
    MAX_CELL_CHARS: MAX_CELL_CHARS,
    SHEETS: SHEETS,
    sheet: function (name) {
      var def = SHEET_BY_NAME[name];
      if (!def) throw new Error('Không có định nghĩa sheet: ' + name);
      return def;
    },
    STATUSES: STATUSES,
    STORAGE: STORAGE,
    YES: YES,
    NO: NO,
    NO_SERIAL: NO_SERIAL,
    ROLE: ROLE,
    USER_STATUS: USER_STATUS,
    ROOM_STATUS: ROOM_STATUS,
    KIT_TYPE: KIT_TYPE,
    VALIDATIONS: VALIDATIONS,
    CONFIG_DEFAULTS: CONFIG_DEFAULTS,
    PROP: PROP,
    FOLDERS: FOLDERS,
    CODE_TYPES: CODE_TYPES,
    CONFIRM_ALPHABET: CONFIRM_ALPHABET,
    HEADER_PROTECTION: 'QLTB – hàng tiêu đề',
    DEFAULT_SHEET_NAMES: ['Sheet1', 'Trang tính1', 'Trang tính 1']
  };
})();
