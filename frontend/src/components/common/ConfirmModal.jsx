import React, { useEffect, useRef } from 'react';

const variants = {
  danger: { button: 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400', icon: 'text-red-400' },
  warning: { button: 'bg-amber-600 hover:bg-amber-500 focus-visible:ring-amber-400', icon: 'text-amber-400' },
  info: { button: 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400', icon: 'text-blue-400' },
};

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  description = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef(null);
  const modalRef = useRef(null);
  const style = variants[variant] || variants.danger;

  useEffect(() => {
    if (!isOpen) return undefined;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll('button');
      if (focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}
    >
      <div
        ref={modalRef}
        className="confirm-modal w-full max-w-md rounded-2xl border border-[#2e303a] bg-[#14151d] p-6 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? 'confirm-modal-description' : undefined}
      >
        <div className={`mb-4 text-2xl ${style.icon}`} aria-hidden="true">!</div>
        <h2 id="confirm-modal-title" className="text-xl font-semibold">{title}</h2>
        {description && <p id="confirm-modal-description" className="confirm-modal-description mt-2 text-sm leading-6 text-gray-300">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="confirm-modal-cancel rounded-lg border border-[#3a3d49] px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-[#20222d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
