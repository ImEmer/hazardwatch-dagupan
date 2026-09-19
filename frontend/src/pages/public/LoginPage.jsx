import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import { AuthCard } from './RegisterPage';
import { validateEmail } from '../../services/validation';
import PasswordToggle from '../../components/PasswordToggle';

const LoginPage = () => {
  const { login, user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(() => searchParams.get('error') === 'google_failed' ? 'Google sign-in could not be completed. Please try again.' : '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const googleAuthUrl = `${import.meta.env.VITE_API_URL || 'https://hazardwatch-dagupan.onrender.com/api'}/auth/google`;

  const getFriendlyError = (message = '') => {
    const normalized = message.toLowerCase();

    if (normalized.includes('suspended') || normalized.includes('banned')) return message;

    if (normalized.includes('secretorprivatekey') || normalized.includes('must have a value') || normalized.includes('jwt') || normalized.includes('token')) {
      return 'Something went wrong. Please try again later.';
    }

    if (normalized.includes('invalid') || normalized.includes('credential') || normalized.includes('password')) {
      return 'Invalid email or password. Please try again.';
    }

    if (normalized.includes('too many') || normalized.includes('5 minutes')) {
      return message;
    }

    if (normalized.includes('not found') || normalized.includes('account')) {
      return 'Account not found. Please check your email or register.';
    }

    if (normalized.includes('fetch') || normalized.includes('network') || normalized.includes('failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    return 'Something went wrong. Please try again later.';
  };

  if (isAuthenticated) {
    const role = user?.role?.toLowerCase();
    const targetRoute = role === 'barangay'
      ? '/barangay/dashboard'
      : role === 'superadmin'
        ? '/superadmin/dashboard'
        : role === 'admin'
          ? '/admin/dashboard'
          : '/';
    return <Navigate to={targetRoute} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = {
      email: validateEmail(form.email),
      password: form.password.trim() ? '' : 'Please enter your password.',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      await showError('Please fill in all required fields correctly.');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      const role = loggedInUser?.role?.toLowerCase();
      const name = form.email.split('@')[0];
      await showSuccess(`Welcome back, ${name}!`);

      const targetRoute = role === 'barangay'
        ? '/barangay/dashboard'
        : role === 'superadmin'
          ? '/superadmin/dashboard'
          : role === 'admin'
            ? '/admin/dashboard'
            : '/';
      navigate(targetRoute, { replace: true });
    } catch (loginError) {
      const friendlyMessage = getFriendlyError(loginError?.message);
      setError(friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" description="Login to HazardWatch">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <label className="block text-sm text-gray-300">Email
          <input type="email" id="email" name="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`auth-input mt-2 ${errors.email ? 'border-red-500' : ''}`} />
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </label>
        <label className="block text-sm text-gray-300">Password
          <div className="relative mt-2">
            <input type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="current-password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`auth-input ${errors.password ? 'border-red-500' : ''}`} />
            <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} label="password" />
          </div>
          {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password}</span>}
        </label>
        <div className="text-right"><Link className="auth-link text-sm" to="/forgot-password">Forgot Password?</Link></div>
        <button disabled={submitting} className="auth-button">{submitting ? 'Signing in...' : 'Login'}</button>
        <p className="text-center text-sm text-gray-400">Don't have an account? <Link className="auth-link" to="/register">Register</Link></p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-700" /><span>OR</span><span className="h-px flex-1 bg-gray-700" /></div>
      <button type="button" onClick={() => { window.location.href = googleAuthUrl; }} className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#1d1f29] dark:text-white dark:hover:bg-[#272b36]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.36l3.25-2.53Z" /><path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.13 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 7.86 9.46 6.14 12 6.14Z" /></svg>
        Sign in with Google
      </button>
    </AuthCard>
  );
};

export default LoginPage;
