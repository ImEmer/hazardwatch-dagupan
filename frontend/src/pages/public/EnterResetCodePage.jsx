import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { AuthCard } from './RegisterPage';
import { showError, showWarning } from '../../services/alerts';
import { validateEmail } from '../../services/validation';

const EnterResetCodePage = () => {
  const { verifyResetCode } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <AuthCard title="Enter Reset Code" description="Enter the 6-digit code sent to your email. We sent a 6-digit code and a reset link to your email.">
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <label className="block text-sm text-gray-300">Email
          <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input mt-2" />
        </label>
        <label className="block text-sm text-gray-300">6-digit code
          <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" id="code" name="code" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="auth-input mt-2 text-center tracking-[0.35em]" />
        </label>
        <button disabled={submitting} className="auth-button">{submitting ? 'Verifying...' : 'Verify Code'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default EnterResetCodePage;