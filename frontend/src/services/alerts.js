import React from 'react';
import { toast } from 'sonner';
import { requestConfirmation } from '../context/ConfirmContext';
import ToastContent from '../components/common/ToastContent';

const durations = { success: 4000, error: 6000, warning: 5000, info: 4000 };

const showToast = (type, title, description) => {
  const duration = durations[type];
  return toast.custom((id) => React.createElement(ToastContent, { id, type, title, description, duration }), { duration });
};

export const showSuccess = (title, description) => showToast('success', title, description);
export const showError = (title, description) => showToast('error', title, description);
export const showWarning = (title, description) => showToast('warning', title, description);
export const showInfo = (title, description) => showToast('info', title, description);

export const showConfirm = (title, text, options = {}) => requestConfirmation({
  title,
  description: text,
  confirmText: options.confirmText || options.confirmButtonText || 'Confirm',
  cancelText: options.cancelText || 'Cancel',
  variant: options.variant || 'danger',
});

export const confirmAction = (text, confirmButtonText = 'Logout') => showConfirm('Are you sure?', text, {
  confirmText: confirmButtonText,
  variant: confirmButtonText.toLowerCase().includes('logout') ? 'danger-outline' : 'danger',
}).then((isConfirmed) => ({ isConfirmed }));
