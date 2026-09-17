import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

const ConfirmContext = createContext(null);
let confirmRequest = null;

export const requestConfirmation = (options = {}) => {
  if (!confirmRequest) return Promise.resolve(false);
  return confirmRequest(options);
};

export const ConfirmProvider = ({ children }) => {
  const [pending, setPending] = useState(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    setPending((current) => {
      current?.resolve(false);
      return { ...options, resolve };
    });
  }), []);

  const finish = useCallback((result) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  confirmRequest = confirm;

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        isOpen={Boolean(pending)}
        title={pending?.title}
        description={pending?.description}
        confirmText={pending?.confirmText}
        cancelText={pending?.cancelText}
        variant={pending?.variant}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
  return context.confirm;
};
