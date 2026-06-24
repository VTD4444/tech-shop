const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useAuthValidation() {
  function validateEmail(email: string): string | null {
    if (!email.trim()) return 'Email is required';
    if (!EMAIL_RE.test(email.trim())) return 'Invalid email format';
    return null;
  }

  function validatePassword(password: string, min = 6): string | null {
    if (!password) return 'Password is required';
    if (password.length < min) return `Password must be at least ${min} characters`;
    return null;
  }

  function validateUsername(username: string): string | null {
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (username.trim().length > 50) return 'Username must be at most 50 characters';
    return null;
  }

  return { validateEmail, validatePassword, validateUsername };
}
