import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/alerts';
import { AuthCard } from './RegisterPage';
import { validateEmail, validatePassword } from '../../services/validation';
import PasswordToggle from '../../components/PasswordToggle';

const LoginPage = () => {
  const { login, user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getFriendlyError = (message = '') => {
    const normalized = message.toLowerCase();

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

  const getBarangayDashboardUrl = (barangay) => {
    const normalized = (barangay || '').trim().toLowerCase();
    if (normalized === 'bonuan') return '/barangay/bonuan/dashboard';
    if (normalized === 'lucao') return '/barangay/lucao/dashboard';
    if (normalized === 'tapuac') return '/barangay/tapuac/dashboard';
    return '/barangay/bonuan/dashboard';
  };

  if (isAuthenticated) {
    const targetRoute = user?.role === 'barangay'
      ? getBarangayDashboardUrl(user?.barangay)
      : user?.role === 'superadmin'
        ? '/superadmin/dashboard'
        : ['admin'].includes(user?.role)
          ? '/admin/dashboard'
          : '/';
    return <Navigate to={targetRoute} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const nextErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      await showError('Please fill in all required fields correctly.');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      const name = form.email.split('@')[0];
      await showSuccess(`Welcome back, ${name}!`);

      const targetRoute = loggedInUser?.role === 'barangay'
        ? getBarangayDashboardUrl(loggedInUser?.barangay)
        : loggedInUser?.role === 'superadmin'
          ? '/superadmin/dashboard'
          : ['admin'].includes(loggedInUser?.role)
            ? '/admin/dashboard'
            : '/';
      navigate(targetRoute, { replace: true });
    } catch (loginError) {
      const friendlyMessage = getFriendlyError(loginError?.message);
      setError(friendlyMessage);
      await showError(friendlyMessage);
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
    </AuthCard>
  );
};

export default LoginPage;
