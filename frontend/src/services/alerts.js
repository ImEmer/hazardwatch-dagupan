import Swal from 'sweetalert2';

const base = {
  background: '#14151d',
  color: '#ffffff',
  confirmButtonColor: '#3b82f6',
};

export const showSuccess = (text) => Swal.fire({
  ...base,
  icon: 'success',
  title: 'Success!',
  text,
  timer: 3000,
  showConfirmButton: false,
  iconColor: '#22c55e',
  confirmButtonColor: '#22c55e',
});

export const showError = (text) => Swal.fire({
  ...base,
  icon: 'error',
  title: 'Oops...',
  text,
});

export const showWarning = (text) => Swal.fire({
  ...base,
  icon: 'warning',
  title: 'Wait...',
  text,
});

export const confirmAction = (text, confirmButtonText = 'Logout') => Swal.fire({
  ...base,
  title: 'Are you sure?',
  text,
  icon: 'warning',
  showCancelButton: true,
  reverseButtons: true,
  cancelButtonText: 'Cancel',
  cancelButtonColor: '#6b7280',
  confirmButtonColor: '#dc2626',
  confirmButtonText,
});
