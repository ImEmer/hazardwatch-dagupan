import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess, showWarning } from '../../services/alerts';
import { passwordPattern, validateEmail, validatePassword } from '../../services/validation';
import PasswordToggle from '../../components/PasswordToggle';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api'}/auth/google`;
  const passwordCriteria = [
    form.password.length >= 8,
    /[a-z]/.test(form.password) && /[A-Z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z\d]/.test(form.password),
  ];
  const passwordStrength = !form.password ? '' : passwordPattern.test(form.password) ? 'strong' : passwordCriteria.filter(Boolean).length >= 2 ? 'fair' : 'weak';
  const passwordError = form.password ? validatePassword(form.password) : errors.password;

  const submit = async (event) => {
    event.preventDefault();
    const trimmedEmail = form.email.trim();
    const nextErrors = {
      name: !form.name.trim() ? 'Full name is required.' : form.name.trim().length < 2 ? 'Name must be at least 2 characters.' : form.name.trim().length > 50 ? 'Name must be 50 characters or fewer.' : '',
      email: validateEmail(trimmedEmail),
      password: validatePassword(form.password),
      confirmPassword: !form.confirmPassword ? 'Please confirm your password.' : form.password !== form.confirmPassword ? 'Passwords do not match.' : '',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      await showWarning('Please fill in all required fields correctly.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api'}/auth/check-email?email=${encodeURIComponent(trimmedEmail)}`);
      const emailCheck = await response.json();
      if (emailCheck?.exists) {
        setErrors((prev) => ({ ...prev, email: 'Email already registered. Please use a different email.' }));
        await showError('Email already registered. Please use a different email.');
        return;
      }
      await register({ name: form.name.trim(), email: trimmedEmail, password: form.password, role: 'user' });
      await showSuccess('Account created! Please login.');
      navigate('/login');
    } catch (error) {
      const message = error.message && error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('exist')
        ? 'Email already registered. Please use a different email.'
        : error.message;
      await showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create Account" description="Register for HazardWatch">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-gray-300">Full Name
          <input type="text" id="name" name="name" autoComplete="name" maxLength="50" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`auth-input mt-2 ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <span className="mt-1 block text-xs text-red-400">{errors.name}</span>}
        </label>
        <label className="block text-sm text-gray-300">Email
          <input type="email" id="email" name="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value.replace(/\s+/g, '') })} className={`auth-input mt-2 ${errors.email ? 'border-red-500' : ''}`} />
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </label>
        <label className="block text-sm text-gray-300">Password
          <div className="relative mt-2">
            <input minLength="8" type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="new-password" placeholder="" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`auth-input ${passwordError ? 'border-red-500' : ''}`} />
            <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} label="password" />
          </div>
          {passwordStrength && <span className={`mt-1 block text-xs ${passwordStrength === 'strong' ? 'text-emerald-400' : passwordStrength === 'fair' ? 'text-amber-400' : 'text-red-400'}`}>Strength: {passwordStrength}</span>}
          <span className="mt-1 block text-xs text-gray-400">At least 8 characters; uppercase and lowercase letters; one number; one special character.</span>
          {passwordError && <span className="mt-1 block text-xs text-red-400">{passwordError}</span>}
        </label>
        <label className="block text-sm text-gray-300">Confirm Password
          <div className="relative mt-2">
            <input minLength="8" type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className={`auth-input ${errors.confirmPassword ? 'border-red-500' : ''}`} />
            <PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((value) => !value)} label="confirmed password" />
          </div>
          {errors.confirmPassword && <span className="mt-1 block text-xs text-red-400">{errors.confirmPassword}</span>}
        </label>
        <button disabled={submitting} className="auth-button">{submitting ? 'Creating account...' : 'Register'}</button>
        <p className="text-center text-sm text-gray-400">Already have an account? <Link className="auth-link" to="/login">Login</Link></p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-700" /><span>OR</span><span className="h-px flex-1 bg-gray-700" /></div>
      <button type="button" onClick={() => { window.location.href = googleAuthUrl; }} className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#1d1f29] dark:text-white dark:hover:bg-[#272b36]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.36l3.25-2.53-3.25 2.53Z" /><path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.13 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 7.86 9.46 6.14 12 6.14Z" /></svg>
        Sign up with Google
      </button>
    </AuthCard>
  );
};

export const AuthCard = ({ title, description, children }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 pt-16">
    <div className="w-full max-w-md rounded-xl border border-[#2e303a] bg-[#14151d] p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  </div>
);

export default RegisterPage;
