import React, { useState, useEffect } from 'react';
import { Check, Save, Wifi, WifiOff } from 'lucide-react';

// Auto-save indicator
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  className = ''
}) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, lastSaved]);

  if (isSaving) {
    return (
      <div className={`flex items-center space-x-1 text-blue-600 ${className}`}>
        <Save className="w-3 h-3 animate-spin" />
        <span className="text-xs">Saving...</span>
      </div>
    );
  }

  if (showSaved) {
    return (
      <div className={`flex items-center space-x-1 text-green-600 animate-fadeIn ${className}`}>
        <Check className="w-3 h-3" />
        <span className="text-xs">Saved</span>
      </div>
    );
  }

  if (lastSaved) {
    const timeAgo = getTimeAgo(lastSaved);
    return (
      <div className={`flex items-center space-x-1 text-gray-500 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs">Saved {timeAgo}</span>
      </div>
    );
  }

  return null;
};

// Connection status indicator
export const ConnectionStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className={`flex items-center space-x-1 text-red-600 ${className}`}>
        <WifiOff className="w-3 h-3" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 text-green-600 ${className}`}>
      <Wifi className="w-3 h-3" />
      <span className="text-xs">Online</span>
    </div>
  );
};

// Tooltip component
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 500,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    setIsVisible(false);
  };

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg animate-fadeIn ${placementClasses[placement]}`}>
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" style={{
            top: placement === 'bottom' ? '-4px' : placement === 'top' ? 'auto' : '50%',
            bottom: placement === 'top' ? '-4px' : 'auto',
            left: placement === 'right' ? '-4px' : placement === 'left' ? 'auto' : '50%',
            right: placement === 'left' ? '-4px' : 'auto',
            marginTop: ['left', 'right'].includes(placement) ? '-4px' : '0',
            marginLeft: ['top', 'bottom'].includes(placement) ? '-4px' : '0'
          }} />
        </div>
      )}
    </div>
  );
};

// Success celebration with confetti effect
interface ConfettiCelebrationProps {
  show: boolean;
  duration?: number;
  className?: string;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  show,
  duration = 2000,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => setIsActive(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isActive) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random()}s`
          }}
        />
      ))}
    </div>
  );
};

// Keyboard shortcut hint
interface ShortcutHintProps {
  shortcut: string;
  description: string;
  show: boolean;
  className?: string;
}

export const ShortcutHint: React.FC<ShortcutHintProps> = ({
  shortcut,
  description,
  show,
  className = ''
}) => {
  if (!show) return null;

  return (
    <div className={`bg-blue-900 text-blue-100 px-3 py-2 rounded-lg text-sm animate-slideInFromBottom ${className}`}>
      <div className="flex items-center space-x-2">
        <kbd className="px-1 py-0.5 bg-blue-800 rounded text-xs">{shortcut}</kbd>
        <span>{description}</span>
      </div>
    </div>
  );
};

// Helper function for time ago formatting
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
