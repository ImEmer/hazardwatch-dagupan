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
  iconColor: '#3b82f6',
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

export const confirmAction = (text, confirmButtonText) => Swal.fire({
  ...base,
  title: 'Are you sure?',
  text,
  icon: 'warning',
  showCancelButton: true,
  cancelButtonColor: '#ef4444',
  confirmButtonText,
});
