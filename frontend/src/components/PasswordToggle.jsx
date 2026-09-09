import React from 'react';

const PasswordToggle = ({ visible, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-white"
    aria-label={visible ? `Hide ${label}` : `Show ${label}`}
    title={visible ? `Hide ${label}` : `Show ${label}`}
  >
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {visible ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6a2 2 0 002.8 2.8M9.9 4.3A10.8 10.8 0 0112 4c5 0 8.7 4 10 8a12.7 12.7 0 01-3.2 5.2M6.2 6.2A12.7 12.7 0 002 12c1.3 4 5 8 10 8 1.2 0 2.3-.2 3.3-.6" />
        </>
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z" />
      )}
    </svg>
  </button>
);

export default PasswordToggle;
