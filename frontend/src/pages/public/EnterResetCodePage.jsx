import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CodeInput from '../../components/common/CodeInput';
import useAuth from '../../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showSuccess, showWarning } from '../../services/alerts';

const maskEmail = (value = '') => {
  if (!value) return 'your verified email';
  const [localPart, domain = ''] = value.split('@');
  if (!domain) return value;
  const safeLocal = localPart.length <= 2 ? localPart : `${localPart.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

const EnterResetCodePage = () => {
  const { forgotPassword, verifyResetCode } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const verificationInFlightRef = useRef(false);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resendCode = async () => {
    if (!email) {
      const message = 'Reset request is missing the associated email. Please start again.';
      setError(message);
      await showError(message);
      return;
    }
    setResending(true);
    try {
      await forgotPassword(email.trim());
      setResendSeconds(60);
      await showSuccess('A new code has been sent to your verified email.');
    } catch (requestError) {
      const message = requestError.message || 'Unable to resend the reset code.';
      setError(message);
      await showError(message);
    } finally {
      setResending(false);
    }
  };

  const submit = async (event, codeToVerify = code) => {
    event?.preventDefault();
    if (verificationInFlightRef.current || submitting) return;
    if (!email) {
      const message = 'Reset request is missing the associated email. Please start again.';
      setError(message);
      await showWarning(message);
      return;
    }
    if (!/^\d{6}$/.test(codeToVerify)) {
      const message = 'Enter the 6-digit reset code.';
      setError(message);
      await showWarning(message);
      return;
    }

    verificationInFlightRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const response = await verifyResetCode(email.trim(), codeToVerify);
      navigate(`/reset-password/${encodeURIComponent(response.token)}`, { replace: true });
    } catch (requestError) {
      const message = requestError.message || 'Invalid or expired reset code.';
      setError(message);
      await showError(message);
    } finally {
      verificationInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Enter Reset Code" description={`Enter the 6-digit code sent to ${maskEmail(email)} to continue.`}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-gray-300">
          Code sent to: <span className="font-medium text-white">{maskEmail(email)}</span>
        </div>
        <label className="block text-sm text-gray-300">6-digit code
          <CodeInput value={code} onChange={setCode} onComplete={(fullCode) => submit(null, fullCode)} disabled={submitting} className="auth-input mt-2 text-center tracking-[0.35em]" inputProps={{ id: 'code', name: 'code', required: true }} />
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