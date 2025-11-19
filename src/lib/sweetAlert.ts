import Swal from 'sweetalert2';

// Color theme matching the application
const theme = {
  primary: '#2563eb', // blue-600
  success: '#16a34a', // green-600
  warning: '#ea580c', // orange-600
  error: '#dc2626', // red-600
  info: '#0891b2', // cyan-600
  background: '#ffffff',
  text: '#1f2937', // gray-800
  border: '#e5e7eb', // gray-200
};

// Custom configuration for SweetAlert2
const defaultConfig = {
  customClass: {
    popup: 'swal2-popup-custom',
    title: 'swal2-title-custom',
    content: 'swal2-content-custom',
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom',
    denyButton: 'swal2-deny-custom',
  },
  buttonsStyling: false,
  showCloseButton: true,
  showCancelButton: true,
  confirmButtonColor: theme.primary,
  cancelButtonColor: theme.error,
  reverseButtons: true,
};

// Success alert
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...defaultConfig,
    confirmButtonText: 'OK',
    confirmButtonColor: theme.success,
    showCancelButton: false,
    html: `
      <div style="
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #16a34a, #22c55e);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1rem auto;
        box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.2L4.8 12L3.4 13.4L9 19L21 7L19.6 5.6L9 16.2Z" fill="white"/>
        </svg>
      </div>
      <h2 style="margin-top: 0.75rem; margin-bottom: 0.5rem; color: #1f2937; font-size: 1.25rem; font-weight: 600;">${title}</h2>
      ${text ? `<p style="color: #6b7280; margin: 0; line-height: 1.5;">${text}</p>` : ''}
    `,
  });
};

// Error alert
export const showError = (title: string, text?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: theme.error,
    showCancelButton: false,
  });
};

// Warning alert
export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: theme.warning,
    showCancelButton: false,
  });
};

// Info alert
export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    confirmButtonColor: theme.info,
    showCancelButton: false,
  });
};

// Confirmation dialog
export const showConfirm = (
  title: string,
  text?: string,
  confirmText: string = 'Yes, proceed',
  cancelText: string = 'Cancel'
) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title,
    text,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: theme.primary,
    cancelButtonColor: theme.error,
  });
};

// Delete confirmation with danger styling
export const showDeleteConfirm = (
  title: string,
  text?: string,
  itemName?: string
) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: text || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: theme.error,
    cancelButtonColor: theme.primary,
    showCancelButton: true,
    focusCancel: true,
  });
};

// Loading alert
export const showLoading = (title: string = 'Loading...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading alert
export const closeLoading = () => {
  Swal.close();
};

// Toast notifications
export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: type,
    title: message,
  });
};

export default Swal;