'use client';

import { useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
    warning: <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-500/20 dark:bg-green-950/40 border-green-500/30 dark:border-green-500/20 backdrop-blur-xl',
    error: 'bg-red-500/20 dark:bg-red-950/40 border-red-500/30 dark:border-red-500/20 backdrop-blur-xl',
    warning: 'bg-amber-500/20 dark:bg-amber-950/40 border-amber-500/30 dark:border-amber-500/20 backdrop-blur-xl',
    info: 'bg-blue-500/20 dark:bg-blue-950/40 border-blue-500/30 dark:border-blue-500/20 backdrop-blur-xl',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-amber-800 dark:text-amber-200',
    info: 'text-blue-800 dark:text-blue-200',
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in-right">
      <div className={`
        flex items-center gap-4 p-4 pr-12 rounded-2xl border-2 shadow-premium backdrop-blur-xl
        ${bgColors[type]}
        min-w-[320px] max-w-md
        transform transition-all duration-300 hover:scale-105
      `}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        
        <p className={`font-medium text-sm leading-relaxed ${textColors[type]}`}>
          {message}
        </p>

        <button
          onClick={onClose}
          className={`
            absolute top-3 right-3 p-1 rounded-lg transition-all
            hover:bg-black/5 dark:hover:bg-white/5
            ${textColors[type]}
          `}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-2xl overflow-hidden">
          <div 
            className={`h-full ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
