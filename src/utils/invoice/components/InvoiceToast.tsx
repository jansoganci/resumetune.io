/**
 * Invoice Toast Notification Component
 * 
 * Displays success/error messages for invoice operations following design guardrails.
 * Uses consistent brand colors and minimal design approach.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, XIcon } from 'lucide-react';

interface InvoiceToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function InvoiceToast({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: InvoiceToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsShowing(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsShowing(false);
    }
  }, [isVisible, autoClose, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
          flex items-center gap-3 p-4 border rounded-lg shadow-sm max-w-sm
          transform transition-all duration-300 ease-in-out
          ${isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${getToastStyles()}
        `}
      >
        {getIcon()}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            setIsShowing(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 hover:bg-black hover:bg-opacity-10 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for managing toast state
 * 
 * Usage:
 * const { showToast, ToastComponent } = useInvoiceToast();
 * 
 * // Show toast
 * showToast('Invoice sent to your email!', 'success');
 * 
 * // Render component
 * return (
 *   <div>
 *     {/* Your content *\/}
 *     {ToastComponent}
 *   </div>
 * );
 */
export function useInvoiceToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <InvoiceToast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
  ) : null;

  return { showToast, ToastComponent };
}
