import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { showError, showSuccess, showWarning } from '../services/alerts';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2 || !form.email || !form.password || !form.confirmPassword) {
      await showWarning('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      await showWarning('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      await showWarning('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      await showSuccess('Your account has been created. You can now log in.');
      navigate('/login');
    } catch (error) {
      await showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create Account" description="Register for HazardWatch">
      <form onSubmit={submit} className="space-y-4">
        <input required minLength="2" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="auth-input" />
        <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="auth-input" />
        <input required minLength="6" type="password" placeholder="Password (minimum 6 characters)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="auth-input" />
        <input required minLength="6" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="auth-input" />
        <button disabled={submitting} className="auth-button">{submitting ? 'Creating account...' : 'Register'}</button>
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
