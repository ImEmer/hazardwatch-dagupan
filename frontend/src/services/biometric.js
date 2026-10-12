import { startAuthentication } from '@simplewebauthn/browser';
import { authApi } from './api';

export const isPlatformAuthenticatorAvailable = async () => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const isBiometricPromptCancelled = (error) => ['AbortError', 'NotAllowedError'].includes(error?.name);

export const authenticateBiometricLogin = async (email, tempToken) => {
  const { data: challenge } = await authApi.biometricLoginChallenge(email, tempToken);
  const credential = await startAuthentication({ optionsJSON: challenge.options });
  const { data: session } = await authApi.verifyBiometricLogin(email, tempToken, credential);
  return session;
};
