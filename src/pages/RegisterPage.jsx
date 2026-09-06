import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { showError, showSuccess, showWarning } from '../services/alerts';
import { validateEmail, validatePassword } from '../services/validation';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      name: !form.name.trim() ? 'Full name is required.' : form.name.trim().length < 2 ? 'Name must be at least 2 characters.' : form.name.trim().length > 50 ? 'Name must be 50 characters or fewer.' : '',
      email: validateEmail(form.email),
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
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      await showSuccess('Account created! Please login.');
      navigate('/login');
    } catch (error) {
      const message = error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('exist')
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
          <input type="email" id="email" name="email" autoComplete="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={`auth-input mt-2 ${errors.email ? 'border-red-500' : ''}`} />
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </label>
        <label className="block text-sm text-gray-300">Password
          <input minLength="6" type="password" id="password" name="password" autoComplete="new-password" placeholder="Password (minimum 6 characters)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`auth-input mt-2 ${errors.password ? 'border-red-500' : ''}`} />
          {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password}</span>}
        </label>
        <label className="block text-sm text-gray-300">Confirm Password
          <input minLength="6" type="password" id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className={`auth-input mt-2 ${errors.confirmPassword ? 'border-red-500' : ''}`} />
          {errors.confirmPassword && <span className="mt-1 block text-xs text-red-400">{errors.confirmPassword}</span>}
        </label>
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
