'use client';
import { createContext, useContext, useState, useRef } from 'react';
import { TrashIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ConfirmModalContext = createContext();

export function ConfirmModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger', // danger, warning, info
  });
  const resolveRef = useRef(null);

  const confirm = (opts) => {
    // Determine default title based on variant if not provided
    let defaultTitle = 'Confirmação';
    if (opts.variant === 'danger') defaultTitle = 'Atenção';
    if (opts.variant === 'warning') defaultTitle = 'Aviso';

    setOptions({
      title: opts.title || defaultTitle,
      message: opts.message || 'Tem a certeza?',
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      variant: opts.variant || 'danger',
    });
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(false);
  };

  const getIcon = () => {
    if (options.variant === 'danger') return <TrashIcon className="h-8 w-8 text-red-500" />;
    if (options.variant === 'warning') return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />;
    return <InformationCircleIcon className="h-8 w-8 text-blue-500" />;
  };

  const getButtonStyles = () => {
    if (options.variant === 'danger') return 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-600';
    if (options.variant === 'warning') return 'bg-yellow-500 text-white shadow-yellow-500/30 hover:bg-yellow-600';
    return 'bg-blue-500 text-white shadow-blue-500/30 hover:bg-blue-600';
  };

  const getIconBg = () => {
    if (options.variant === 'danger') return 'bg-red-100 dark:bg-red-900/30';
    if (options.variant === 'warning') return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-blue-100 dark:bg-blue-900/30';
  };

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-xl animate-fade-in transition-all" onClick={handleCancel} />
          
          <div className="relative w-full max-w-md bg-white/90 dark:bg-dark-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl animate-scale-in border border-white/20 dark:border-dark-700/50 p-8 text-center z-[101]">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${getIconBg()}`}>
              {getIcon()}
            </div>
            
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">{options.title}</h3>
            <p className="text-dark-500 dark:text-dark-300 mb-8 font-medium">
              {options.message}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleCancel}
                className="flex-1 py-3 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white font-bold text-sm hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
              >
                {options.cancelText}
              </button>
              <button 
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-all ${getButtonStyles()}`}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmModalContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmModalContext);
