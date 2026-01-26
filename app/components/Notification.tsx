'use client';

import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3000
}) => {
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return `${currentTheme.bg} text-gray-900`;
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return `${currentTheme.bg} text-gray-900`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'error':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✓';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl ${getNotificationStyles()} max-w-sm`}> 
        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-xl">
          <span aria-hidden>{getIcon()}</span>
        </div>
        <div className="flex-1">
          <div className="font-semibold">{message}</div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};