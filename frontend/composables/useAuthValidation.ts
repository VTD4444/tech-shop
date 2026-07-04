const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;

export function useAuthValidation() {
  function validateEmail(email: string): string | null {
    if (!email.trim()) return 'Vui lòng nhập email';
    if (!EMAIL_RE.test(email.trim())) return 'Email không hợp lệ';
    return null;
  }

  function validatePassword(password: string, min = 6): string | null {
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < min) return `Mật khẩu phải có ít nhất ${min} ký tự`;
    return null;
  }

  function validateFullName(fullName: string): string | null {
    const value = fullName.trim();
    if (!value) return 'Vui lòng nhập họ tên';
    if (value.length < 2) return 'Họ tên phải có ít nhất 2 ký tự';
    if (value.length > 100) return 'Họ tên tối đa 100 ký tự';
    return null;
  }

  function validatePhone(phone: string): string | null {
    const value = phone.trim();
    if (!value) return 'Vui lòng nhập số điện thoại';
    if (!PHONE_RE.test(value)) return 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0';
    return null;
  }

  function validateConfirmPassword(password: string, confirmPassword: string): string | null {
    if (!confirmPassword) return 'Vui lòng nhập lại mật khẩu';
    if (password !== confirmPassword) return 'Mật khẩu nhập lại không khớp';
    return null;
  }

  return {
    validateEmail,
    validatePassword,
    validateFullName,
    validatePhone,
    validateConfirmPassword,
  };
}
