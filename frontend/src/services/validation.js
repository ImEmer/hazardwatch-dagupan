export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const validateEmail = (email) => {
  if (!email.trim()) return 'Email is required.';
  if (!emailPattern.test(email.trim())) return 'Enter a valid email address.';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (!passwordPattern.test(password)) return 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';
  return '';
};
