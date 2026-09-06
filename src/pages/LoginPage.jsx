import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { showError, showSuccess } from '../services/alerts';
import { AuthCard } from './RegisterPage';
import { validateEmail, validatePassword } from '../services/validation';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

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
      await login(form.email, form.password);
      const name = form.email.split('@')[0];
      await showSuccess(`Welcome back, ${name}!`);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      await showError('Invalid email or password. Please try again.');
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
          <input type="password" id="password" name="password" autoComplete="current-password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`auth-input mt-2 ${errors.password ? 'border-red-500' : ''}`} />
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
