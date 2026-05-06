import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      {createPortal(
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'none'
        }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: t.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontSize: 14,
                fontWeight: 600,
                pointerEvents: 'auto',
                animation: 'slideUpFade 0.3s ease forwards',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>{t.type === 'success' ? '✓' : '✕'}</span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
