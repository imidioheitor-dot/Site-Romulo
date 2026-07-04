import { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastCtx = createContext(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span className="toast__dot" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
