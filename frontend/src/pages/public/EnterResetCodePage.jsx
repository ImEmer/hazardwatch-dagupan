import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess, showWarning } from '../../services/alerts';
import { validateEmail } from '../../services/validation';

const EnterResetCodePage = () => {
  const { forgotPassword, verifyResetCode } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  React.useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resendCode = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      await showError(emailError);
      return;
    }
    setResending(true);
    try {
      await forgotPassword(email.trim());
      setResendSeconds(60);
      await showSuccess('A new code has been sent to your email.');
    } catch (requestError) {
      const message = requestError.message || 'Unable to resend the reset code.';
      setError(message);
      await showError(message);
    } finally {
      setResending(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError || !/^\d{6}$/.test(code)) {
      const message = emailError || 'Enter the 6-digit reset code.';
      setError(message);
      await showWarning(message);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await verifyResetCode(email.trim(), code);
      navigate(`/reset-password/${encodeURIComponent(response.token)}`, { replace: true });
    } catch (requestError) {
      const message = requestError.message || 'Invalid or expired reset code.';
      setError(message);
      await showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Enter Reset Code" description="Enter the 6-digit code sent to your email to continue.">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <label className="block text-sm text-gray-300">Email
          <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input mt-2" />
        </label>
        <label className="block text-sm text-gray-300">6-digit code
          <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" id="code" name="code" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="auth-input mt-2 text-center tracking-[0.35em]" />
        </label>
        <button type="button" disabled={resending || resendSeconds > 0} onClick={resendCode} className="w-full rounded-lg border border-gray-600 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50">
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s...` : resending ? 'Sending...' : 'Resend Code'}
        </button>
        <button disabled={submitting} className="auth-button">{submitting ? 'Verifying...' : 'Verify Code'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default EnterResetCodePage;