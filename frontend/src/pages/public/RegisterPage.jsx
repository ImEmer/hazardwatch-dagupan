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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
      if (!agreedToTerms) {
        setErrors((prev) => ({ ...prev, agreedToTerms: 'You must agree to the Terms of Service.' }));
        await showError('You must agree to the Terms of Service.');
        return;
      }

      await register({ name: form.name.trim(), email: trimmedEmail, password: form.password, role: 'user', agreedToTerms: true });
      await showSuccess('Account created! Check your email to verify your account.');
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
        <label className="flex items-start gap-3 rounded-lg border border-[#2e303a] bg-[#111318] p-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => {
              setAgreedToTerms(event.target.checked);
              setErrors((prev) => ({ ...prev, agreedToTerms: '' }));
            }}
            className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#0a0b0f] text-blue-500 focus:ring-blue-500"
          />
          <span>
            I agree to the <a href="/terms" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>.
          </span>
        </label>
        {errors.agreedToTerms && <span className="mt-1 block text-xs text-red-400">{errors.agreedToTerms}</span>}
        <button disabled={submitting || !agreedToTerms} className="auth-button disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Creating account...' : 'Register'}</button>
        <p className="text-center text-sm text-gray-400">Already have an account? <Link className="auth-link" to="/login">Login</Link></p>
      </form>
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
