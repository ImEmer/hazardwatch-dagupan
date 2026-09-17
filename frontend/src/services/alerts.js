import { toast } from 'sonner';
import { requestConfirmation } from '../context/ConfirmContext';

export const showSuccess = (title, description) => toast.success(title, { description });
export const showError = (title, description) => toast.error(title, { description });
export const showWarning = (title, description) => toast.warning(title, { description });
export const showInfo = (title, description) => toast.info(title, { description });

export const showConfirm = (title, text, options = {}) => requestConfirmation({
  title,
  description: text,
  confirmText: options.confirmText || options.confirmButtonText || 'Confirm',
  cancelText: options.cancelText || 'Cancel',
  variant: options.variant || 'danger',
});

export const confirmAction = (text, confirmButtonText = 'Logout') => showConfirm('Are you sure?', text, {
  confirmText: confirmButtonText,
  variant: confirmButtonText.toLowerCase().includes('logout') ? 'warning' : 'danger',
}).then((isConfirmed) => ({ isConfirmed }));
