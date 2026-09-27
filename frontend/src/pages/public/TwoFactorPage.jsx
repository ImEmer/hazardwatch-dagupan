import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from './RegisterPage';
import CodeInput from '../../components/common/CodeInput';
import useAuth from '../../hooks/useAuth';
import { authApi } from '../../services/api';
import { showSuccess } from '../../services/alerts';

const TwoFactorPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const tempToken = state?.tempToken;
  const email = state?.email || 'your email';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = window.setInterval(() => setResendSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  if (!tempToken) return <Navigate to="/login" replace />;

  const finishVerification = async (submittedCode = code) => {
    if (requestInFlightRef.current || verifying) return;
    requestInFlightRef.current = true;
    setVerifying(true);
    setError('');
    try {
      const response = await authApi.verifyTwoFactorLogin(tempToken, submittedCode);
      const user = completeLogin(response.data);
      await showSuccess(`Welcome back, ${user?.name || email}!`);
      const role = user?.role?.toLowerCase();
      const destination = role === 'barangay' ? '/barangay/dashboard' : role === 'superadmin' ? '/superadmin/dashboard' : role === 'admin' ? '/admin/dashboard' : '/';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify the security code.');
    } finally {
      requestInFlightRef.current = false;
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (resendSeconds || verifying) return;
    setError('');
    try {
      await authApi.resendTwoFactorLoginCode(tempToken);
      setResendSeconds(60);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to resend the security code.');
    }
  };

  return (
    <AuthCard title="Two-factor verification" description={`Enter the security code sent to ${email}.`}>
      <form onSubmit={(event) => { event.preventDefault(); finishVerification(); }} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <label className="block text-sm text-gray-300">6-digit security code
          <CodeInput value={code} onChange={setCode} onComplete={finishVerification} disabled={verifying} className="auth-input mt-2 text-center font-mono text-2xl tracking-[0.5em]" inputProps={{ required: true, 'aria-label': '6-digit security code' }} />
        </label>
        <button type="submit" disabled={verifying || code.length !== 6} className="auth-button disabled:cursor-not-allowed disabled:opacity-50">{verifying ? 'Verifying...' : 'Verify code'}</button>
        <button type="button" onClick={resendCode} disabled={Boolean(resendSeconds) || verifying} className="w-full text-sm text-gray-400 hover:text-white disabled:opacity-50">{resendSeconds ? `Resend code in ${resendSeconds}s` : 'Resend security code'}</button>
        <p className="text-center text-sm"><Link className="auth-link" to="/login">Back to Login</Link></p>
      </form>
    </AuthCard>
  );
};

export default TwoFactorPage;