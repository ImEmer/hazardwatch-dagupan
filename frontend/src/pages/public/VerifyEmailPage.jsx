import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from './RegisterPage';
import CodeInput from '../../components/common/CodeInput';
import api from '../../services/api';
import { showSuccess } from '../../services/alerts';
import { validateEmail } from '../../services/validation';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const redirectTimerRef = useRef(null);
  const verificationInFlightRef = useRef(false);

  useEffect(() => () => window.clearTimeout(redirectTimerRef.current), []);

  const submit = async (event, codeToVerify = code) => {
    event?.preventDefault();
    if (verificationInFlightRef.current || submitting || verified) return;
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!/^\d{6}$/.test(codeToVerify)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    verificationInFlightRef.current = true;
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email: normalizedEmail, code: codeToVerify });
      setVerified(true);
      await showSuccess(data.message || 'Email verified. You can now log in.');
      redirectTimerRef.current = window.setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to verify your email.');
    } finally {
      verificationInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Verify Email" description="Enter the 6-digit code sent to your email address.">
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {verified && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">Email verified. Redirecting to login...</p>}
        <label className="block text-sm text-gray-300">Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input mt-2"
          />
        </label>
        <label className="block text-sm text-gray-300">6-digit code
          <CodeInput value={code} onChange={setCode} onComplete={(fullCode) => submit(null, fullCode)} disabled={submitting || verified} className="auth-input mt-2 text-center font-mono text-3xl tracking-[0.5em]" inputProps={{ name: 'code', required: true, 'aria-label': '6-digit verification code' }} />
        </label>
        <button type="submit" disabled={submitting || verified} className="auth-button disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? 'Verifying...' : 'Verify Email'}
        </button>
        <p className="text-center text-sm text-gray-400">Already verified? <Link className="auth-link" to="/login">Log in</Link></p>
      </form>
    </AuthCard>
  );
};

export default VerifyEmailPage;