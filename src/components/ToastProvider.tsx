import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ToastType = 'error' | 'success' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  messageKey: string;
  params?: Record<string, any>;
}

interface ToastContextValue {
  error: (messageKey: string, params?: Record<string, any>) => void;
  info: (messageKey: string, params?: Record<string, any>) => void;
  success: (messageKey: string, params?: Record<string, any>) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const push = useCallback((type: ToastType, messageKey: string, params?: Record<string, any>) => {
    const id = Date.now() + Math.random();
    setMessages((prev) => [...prev, { id, type, messageKey, params }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 4500);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    error: (key, params) => push('error', key, params),
    info: (key, params) => push('info', key, params),
    success: (key, params) => push('success', key, params),
    clear: () => setMessages([])
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`rounded-lg shadow-lg px-4 py-3 flex items-start space-x-2 border bg-white ${
            m.type === 'error' ? 'border-red-300' : m.type === 'success' ? 'border-green-300' : 'border-blue-300'
          }`}>
            <AlertCircle className={`w-4 h-4 mt-0.5 ${m.type === 'error' ? 'text-red-600' : m.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
            <div className="text-sm text-gray-800">
              {t(m.messageKey, m.params)}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


