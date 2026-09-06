import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

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
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f] px-4 pt-16">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white">Staff login</h1>
        <p className="mt-2 text-sm text-gray-400">Access the HazardWatch response console.</p>
        {error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <div className="mt-5 space-y-4">
          <input type="email" required placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-3 text-white outline-none focus:border-[#3b82f6]" />
          <input type="password" required placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-3 text-white outline-none focus:border-[#3b82f6]" />
        </div>
        <button disabled={submitting} className="mt-5 w-full rounded-xl bg-[#3b82f6] px-4 py-3 font-semibold text-white hover:bg-[#2563eb] disabled:opacity-60">{submitting ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
};

export default LoginPage;
