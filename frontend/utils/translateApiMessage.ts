const EXACT: Record<string, string> = {
  'Email already exists': 'Email đã được sử dụng',
  'Phone number already exists': 'Số điện thoại đã được sử dụng',
  'Invalid credentials': 'Email hoặc mật khẩu không đúng',
  'Please sign in with Google': 'Vui lòng đăng nhập bằng Google',
  'Google account has no email': 'Tài khoản Google không có email',
  'User account is inactive': 'Tài khoản đã bị vô hiệu hóa',
  'Invalid or expired Google login code': 'Mã đăng nhập Google không hợp lệ hoặc đã hết hạn',
  'Invalid Google login code': 'Mã đăng nhập Google không hợp lệ',
  'User not found or inactive': 'Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu',
  'Invalid refresh token': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'Refresh token required': 'Yêu cầu đăng nhập lại',
  'Invalid or expired token': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
  'Invalid or expired reset token': 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
  'If the email exists, a reset link was sent':
    'Nếu email đã đăng ký, bạn sẽ nhận liên kết đặt lại mật khẩu trong vài phút.',
  'Password updated successfully': 'Mật khẩu đã được cập nhật',
  'Logged out successfully': 'Đã đăng xuất',
  'Shipping address not found': 'Không tìm thấy địa chỉ giao hàng',
  'Cart is empty': 'Giỏ hàng trống',
  'Insufficient stock': 'Không đủ hàng trong kho',
  'Quantity must be at least 1': 'Số lượng phải ít nhất là 1',
  'Product not found or unavailable': 'Sản phẩm không tồn tại hoặc đã ngừng bán',
  'Product not found': 'Không tìm thấy sản phẩm',
  'Cart item not found': 'Không tìm thấy sản phẩm trong giỏ hàng',
  'Order not found': 'Không tìm thấy đơn hàng',
  'Order not found or cannot be cancelled': 'Không tìm thấy đơn hàng hoặc không thể hủy',
  'Order is not eligible for payment': 'Đơn hàng không đủ điều kiện thanh toán',
  'Order is already paid': 'Đơn hàng đã được thanh toán',
  'SePay is not configured': 'Cổng thanh toán SePay chưa được cấu hình',
  'Order amount must be greater than 0': 'Số tiền đơn hàng phải lớn hơn 0',
  'Insufficient permissions': 'Bạn không có quyền thực hiện thao tác này',
  'Category not found': 'Không tìm thấy danh mục',
  'Comment not found': 'Không tìm thấy bình luận',
  'Comment content is required': 'Nội dung bình luận không được để trống',
  'Reply content is required': 'Nội dung trả lời không được để trống',
  'Not your comment': 'Đây không phải bình luận của bạn',
  'Parent comment not found': 'Không tìm thấy bình luận gốc',
  'Maximum 5 images allowed': 'Tối đa 5 ảnh',
  'Rating not found': 'Không tìm thấy đánh giá',
  'Not your rating': 'Đây không phải đánh giá của bạn',
  'You can only rate products from completed paid orders':
    'Bạn chỉ có thể đánh giá sản phẩm từ đơn hàng đã thanh toán và hoàn tất',
  'You already rated this purchase': 'Bạn đã đánh giá đơn mua này',
  'Product is not an available PC component': 'Sản phẩm không phải linh kiện PC khả dụng',
  'One or more components not found': 'Không tìm thấy một hoặc nhiều linh kiện',
  'Component not found': 'Không tìm thấy linh kiện',
  'Build is not compatible': 'Cấu hình PC không tương thích',
  'Build not found': 'Không tìm thấy cấu hình đã lưu',
  'Not your build': 'Đây không phải cấu hình của bạn',
  'Cloudinary is not configured': 'Dịch vụ tải ảnh chưa được cấu hình',
  'PC component specs are required when isPcComponent is true':
    'Cần nhập thông số linh kiện PC khi đánh dấu là linh kiện PC',
  'Invalid image URL': 'URL ảnh không hợp lệ',
  'longDescription exceeds 50000 characters': 'Mô tả chi tiết vượt quá 50.000 ký tự',
  'User not found': 'Không tìm thấy người dùng',
  'Address not found': 'Không tìm thấy địa chỉ',
  'Payment successful': 'Thanh toán thành công',
  'Payment pending or failed': 'Thanh toán đang xử lý hoặc thất bại',
  'Transaction not found': 'Không tìm thấy giao dịch thanh toán',
  'Missing invoice number': 'Thiếu mã hóa đơn thanh toán',
  'Passwords do not match': 'Mật khẩu xác nhận không khớp',
  'Phone must be a valid Vietnamese number (10 digits)':
    'Số điện thoại phải là số Việt Nam hợp lệ (10 chữ số)',
};

const PATTERNS: { test: RegExp; format: (match: RegExpMatchArray) => string }[] = [
  {
    test: /^Insufficient stock for "(.+)"\. Available: (\d+)$/i,
    format: (m) => `Không đủ tồn kho cho "${m[1]}". Còn lại: ${m[2]}`,
  },
  {
    test: /^Insufficient stock for "(.+)"$/i,
    format: (m) => `Không đủ tồn kho cho "${m[1]}"`,
  },
  {
    test: /^Invalid component type\. Allowed: (.+)$/i,
    format: (m) => `Loại linh kiện không hợp lệ. Cho phép: ${m[1]}`,
  },
  {
    test: /^PC component field "(.+)" is required for type (.+)$/i,
    format: (m) => `Trường "${m[1]}" là bắt buộc cho loại linh kiện ${m[2]}`,
  },
  {
    test: /^Invalid image URL: (.+)$/i,
    format: (m) => `URL ảnh không hợp lệ: ${m[1]}`,
  },
];

function hasVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
}

export function translateApiMessage(message: unknown): string {
  if (message == null) return 'Đã xảy ra lỗi';
  if (Array.isArray(message)) {
    return translateApiMessage(message[0]);
  }
  if (typeof message !== 'string') {
    return translateApiMessage(String(message));
  }

  const trimmed = message.trim();
  if (!trimmed) return 'Đã xảy ra lỗi';
  if (hasVietnamese(trimmed)) return trimmed;

  if (EXACT[trimmed]) return EXACT[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [en, vi] of Object.entries(EXACT)) {
    if (en.toLowerCase() === lower) return vi;
  }

  for (const { test, format } of PATTERNS) {
    const match = trimmed.match(test);
    if (match) return format(match);
  }

  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Không thể kết nối máy chủ. Vui lòng thử lại sau.';
  }
  if (lower.includes('unauthorized')) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
  if (lower.includes('forbidden')) return 'Bạn không có quyền thực hiện thao tác này';
  if (lower.includes('not found')) return 'Không tìm thấy dữ liệu yêu cầu';
  if (lower.includes('bad request')) return 'Yêu cầu không hợp lệ';

  return trimmed;
}

export function extractApiMessage(error: unknown, fallback = 'Đã xảy ra lỗi'): string {
  const e = error as {
    data?: { message?: unknown; error?: { message?: unknown } };
    message?: unknown;
  };
  const raw =
    e?.data?.error?.message ??
    e?.data?.message ??
    e?.message ??
    fallback;
  return translateApiMessage(raw);
}
