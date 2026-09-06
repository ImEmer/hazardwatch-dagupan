import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { showError, showSuccess } from '../services/alerts';
import { AuthCard } from './RegisterPage';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      await showSuccess('Login successful. Welcome back!');
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      await showError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" description="Login to HazardWatch">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <input type="email" required placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="auth-input" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="auth-input" />
        <div className="text-right"><Link className="auth-link text-sm" to="/forgot-password">Forgot Password?</Link></div>
        <button disabled={submitting} className="auth-button">{submitting ? 'Signing in...' : 'Login'}</button>
        <p className="text-center text-sm text-gray-400">Don't have an account? <Link className="auth-link" to="/register">Register</Link></p>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
