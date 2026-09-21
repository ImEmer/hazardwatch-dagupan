import React from 'react';
import { toast } from 'sonner';

const styles = {
  success: { icon: 'text-emerald-500', bar: 'bg-emerald-500', label: 'Success' },
  error: { icon: 'text-red-500', bar: 'bg-red-500', label: 'Error' },
  warning: { icon: 'text-amber-500', bar: 'bg-amber-500', label: 'Warning' },
  info: { icon: 'text-blue-500', bar: 'bg-blue-500', label: 'Information' },
};

const ToastContent = ({ id, type, title, description, duration }) => {
  const style = styles[type] || styles.info;

  return (
    <div className="toast-card relative w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white p-4 pr-10 text-slate-900 shadow-xl">
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="toast-close absolute right-3 top-3 text-lg leading-none text-slate-400 transition hover:text-slate-700"
        aria-label="Close alert"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
        </svg>
      </button>
      <div className="flex gap-3">
        <span className={`mt-0.5 text-sm font-bold ${style.icon}`} aria-hidden="true">●</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="toast-description mt-1 text-sm text-slate-600">{description}</p>}
        </div>
      </div>
      <div className={`toast-progress absolute bottom-0 left-0 h-1 w-full ${style.bar}`} style={{ '--toast-duration': `${duration}ms` }} aria-hidden="true" />
      <span className="sr-only">{style.label}</span>
    </div>
  );
};

export default ToastContent;
