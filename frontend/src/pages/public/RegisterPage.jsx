import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess, showWarning } from '../../services/alerts';
import { passwordPattern, validateEmail, validatePassword } from '../../services/validation';
import PasswordToggle from '../../components/PasswordToggle';
import CodeInput from '../../components/common/CodeInput';
import api from '../../services/api';

const fullNamePattern = /^[\p{L} '-]+$/u;
const fullNameValidationMessage = 'Full name must contain letters only.';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [reactivationOpen, setReactivationOpen] = useState(false);
  const [reactivationStarted, setReactivationStarted] = useState(false);
  const [reactivationEmail, setReactivationEmail] = useState('');
  const [reactivationCode, setReactivationCode] = useState('');
  const [reactivationSubmitting, setReactivationSubmitting] = useState(false);
  const [reactivationError, setReactivationError] = useState('');
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
    const trimmedName = form.name.trim();
    const nextErrors = {
      name: !trimmedName ? 'Full name is required.' : !fullNamePattern.test(trimmedName) ? fullNameValidationMessage : trimmedName.length < 2 ? 'Name must be at least 2 characters.' : trimmedName.length > 50 ? 'Name must be 50 characters or fewer.' : '',
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
      await showSuccess('Account created. Check your email for the 6-digit code.');
      navigate(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (error) {
      if (error.data?.code === 'ACCOUNT_EXISTS_DELETED') {
        setReactivationEmail(trimmedEmail);
        setReactivationOpen(true);
        setReactivationStarted(false);
        setReactivationCode('');
        setReactivationError('');
        return;
      }
      const message = error.message && error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('exist')
        ? 'Email already registered. Please use a different email.'
        : error.message;
      await showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendReactivationCode = async () => {
    setReactivationSubmitting(true);
    setReactivationError('');
    try {
      const { data } = await api.post('/auth/request-reactivation', { email: reactivationEmail });
      if (data.code === 'ACCOUNT_ACTIVE') {
        setReactivationError(data.message);
        return;
      }
      setReactivationStarted(true);
      setReactivationCode('');
      await showSuccess('Check your email', 'If the account exists, a code has been sent.');
    } catch (error) {
      setReactivationError(error.response?.data?.message || 'Unable to send a reactivation code. Please try again.');
    } finally {
      setReactivationSubmitting(false);
    }
  };

  const verifyReactivationCode = async () => {
    setReactivationSubmitting(true);
    setReactivationError('');
    try {
      const { data } = await api.post('/auth/verify-reactivation', {
        email: reactivationEmail,
        code: reactivationCode,
      });
      await showSuccess(data.message || 'Account reactivated. Please log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      setReactivationError(error.response?.data?.message || 'Unable to verify the code. Please try again.');
    } finally {
      setReactivationSubmitting(false);
    }
  };

  const closeReactivation = () => {
    setReactivationOpen(false);
    setReactivationStarted(false);
    setReactivationCode('');
    setReactivationError('');
  };

  return (
    <AuthCard title="Create Account" description="Register for HazardWatch">
      <>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-gray-300">Full Name
          <input type="text" id="name" name="name" autoComplete="name" maxLength="50" placeholder="Full name" value={form.name} onChange={(event) => {
            const name = event.target.value;
            setForm((previous) => ({ ...previous, name }));
            setErrors((previous) => ({ ...previous, name: name.trim() && !fullNamePattern.test(name.trim()) ? fullNameValidationMessage : '' }));
          }} className={`auth-input mt-2 ${errors.name ? 'border-red-500' : ''}`} />
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
      {reactivationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reactivation-title"
            className="w-full max-w-md rounded-xl border border-[#2e303a] bg-[#14151d] p-6 text-white shadow-2xl motion-reduce:transition-none"
          >
            <h2 id="reactivation-title" className="text-xl font-bold">Account Previously Deleted</h2>
            {!reactivationStarted ? (
              <>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  An account with this email was previously deleted. Would you like to reactivate it?
                </p>
                {reactivationError && <p role="alert" className="mt-3 text-sm text-red-400">{reactivationError}</p>}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={closeReactivation} disabled={reactivationSubmitting} className="rounded-lg border border-[#3a3d48] px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
                  <button type="button" onClick={sendReactivationCode} disabled={reactivationSubmitting} className="auth-button disabled:opacity-50">{reactivationSubmitting ? 'Sending...' : 'Send Reactivation Code'}</button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  Enter the 6-digit code sent to <span className="font-medium text-white">{reactivationEmail}</span>.
                </p>
                <CodeInput
                  value={reactivationCode}
                  onChange={setReactivationCode}
                  length={6}
                  disabled={reactivationSubmitting}
                  className="auth-input mt-4 text-center tracking-[0.5em]"
                  inputProps={{ 'aria-label': '6-digit reactivation code', autoFocus: true }}
                />
                {reactivationError && <p role="alert" className="mt-3 text-sm text-red-400">{reactivationError}</p>}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={closeReactivation} disabled={reactivationSubmitting} className="rounded-lg border border-[#3a3d48] px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50">Cancel</button>
                  <button type="button" onClick={sendReactivationCode} disabled={reactivationSubmitting} className="rounded-lg border border-[#3a3d48] px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50">{reactivationSubmitting ? 'Sending...' : 'Resend code'}</button>
                  <button type="button" onClick={verifyReactivationCode} disabled={reactivationSubmitting || reactivationCode.length !== 6} className="auth-button disabled:opacity-50">{reactivationSubmitting ? 'Verifying...' : 'Verify'}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
      </>
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
