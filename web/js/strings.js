/** Chuỗi giao diện tiếng Việt, gom một chỗ để dễ sửa câu chữ. */
export const S = Object.freeze({
  appTitle: 'Quản lý thiết bị',
  loading: 'Đang tải…',
  retry: 'Thử lại',
  resend: 'Gửi lại',
  cancel: 'Hủy',
  confirm: 'Xác nhận',
  close: 'Đóng',
  save: 'Lưu',
  saved: 'Đã lưu.',
  networkError: 'Không kết nối được máy chủ. Kiểm tra mạng rồi bấm Gửi lại.',
  timeoutError: 'Máy chủ phản hồi quá lâu. Bấm Gửi lại; thao tác sẽ không bị ghi hai lần.',
  notConfigured: 'Ứng dụng chưa được cấu hình địa chỉ máy chủ (config.js). Báo Admin.',
  serverBadResponse: 'Máy chủ trả dữ liệu không đọc được. Vui lòng thử lại.',

  navPublic: { tim: 'Tìm thiết bị', gio: 'Danh sách mượn', cuatoi: 'Yêu cầu của tôi' },
  navManager: { homnay: 'Hôm nay', dangmuon: 'Đang mượn', quet: 'Quét QR', danhsach: 'Danh sách', them: 'Thêm' },

  loginManager: 'Đăng nhập quản lý',
  loginTitle: 'Đăng nhập khu vực quản lý',
  loginHint: 'Dùng Gmail đã được Admin cấp quyền. Người mượn không cần đăng nhập.',
  loginFailed: 'Chưa đăng nhập được, vui lòng thử lại.',
  loginNoClientId: 'Chưa cấu hình đăng nhập Google (CLIENT_ID). Báo Admin.',
  loginGisFailed: 'Không tải được nút Đăng nhập bằng Google. Kiểm tra mạng rồi tải lại trang.',
  devLogin: 'Đăng nhập thử (chỉ trên máy phát triển)',
  logout: 'Đăng xuất',
  logoutDone: 'Đã đăng xuất.',
  sessionLost: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
  backToPublic: 'Về trang mượn thiết bị',

  embedded: 'Bạn đang mở trong ứng dụng Zalo/Messenger/Facebook. Mở bằng Chrome hoặc Safari để dùng đầy đủ.',
  copyLink: 'Chép link',
  copied: 'Đã chép link. Mở Chrome hoặc Safari và dán vào thanh địa chỉ.',

  qrManagerOnly: 'Chỉ người quản lý được thao tác bằng mã QR.',

  comingSoon: (milestone) => `Chức năng này có ở mốc ${milestone}.`,
  publicEmpty: 'Danh sách thiết bị sẽ có ở mốc M3.',
  version: (v) => `Phiên bản giao diện ${v}`,

  users: 'Tài khoản',
  addUser: '+ Thêm tài khoản',
  editUser: 'Sửa tài khoản',
  owner: 'Chủ sở hữu',
  lock: 'Khóa',
  unlock: 'Mở khóa',
  revoke: 'Đăng xuất mọi thiết bị',
  revokeConfirm: (email) => `Mọi phiên đăng nhập hiện có của ${email} sẽ mất hiệu lực. Người này phải đăng nhập lại.`,
  revoked: 'Đã đăng xuất mọi thiết bị của tài khoản này.',
  usersEmpty: 'Chưa có tài khoản nào ngoài chủ sở hữu.',
  fields: {
    email: 'Gmail', name: 'Họ tên', role: 'Vai trò', phone: 'SĐT', status: 'Trạng thái', expiresOn: 'Ngày hết hạn quyền (để trống: không hết hạn)'
  },

  settings: 'Cấu hình',
  settingsHint: 'Chỉ sửa khi cần. Thay đổi có hiệu lực ngay.',
  settingsNoChange: 'Chưa có thay đổi nào.',
  settingsConfirm: (keys) => `Lưu ${keys.length} thay đổi: ${keys.join(', ')}?`,

  more: 'Thêm',
  moreItems: {
    giaotructiep: ['Giao trực tiếp', 'M4'],
    buoi: ['Buổi thực hành', 'M6'],
    nhaphang: ['Nhập hàng', 'M2'],
    kiemke: ['Kiểm kê', 'M7'],
    bienban: ['Biên bản', 'M5'],
    dieuchuyen: ['Điều chuyển phòng', 'M6'],
    dieuchinh: ['Yêu cầu điều chỉnh', 'M5'],
    taikhoan: ['Tài khoản', ''],
    cauhinh: ['Cấu hình', '']
  },
  roleLabel: (role, email) => `${email} – ${role}`
});
