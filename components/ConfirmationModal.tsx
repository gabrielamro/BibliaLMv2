
import React from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSecondaryAction?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  secondaryText?: string;
  cancelText?: string;
  variant?: 'danger' | 'success' | 'info' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSecondaryAction,
  title,
  message,
  confirmText = "Confirmar",
  secondaryText,
  cancelText = "Cancelar",
  variant = 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger': return <AlertCircle size={32} className="text-red-500" />;
      case 'success': return <CheckCircle2 size={32} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={32} className="text-amber-500" />;
      case 'info': return <Info size={32} className="text-blue-500" />;
      default: return <HelpCircle size={32} className="text-bible-gold" />;
    }
  };

  const getThemeColor = () => {
    switch (variant) {
      case 'danger': return 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
      default: return 'bg-bible-gold/5 border-bible-gold/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-bible-darkPaper w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border ${getThemeColor()}`}>
            {getIcon()}
          </div>

          <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-3">
            {title}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
            {message}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
                variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                  : 'bg-bible-leather dark:bg-bible-gold dark:text-black hover:opacity-90 shadow-bible-leather/20 dark:shadow-bible-gold/20'
              }`}
            >
              {confirmText}
            </button>

            {onSecondaryAction && secondaryText && (
              <button 
                onClick={onSecondaryAction}
                className="w-full py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
              >
                {secondaryText}
              </button>
            )}

            {!onSecondaryAction && (
                <button 
                  onClick={onClose}
                  className="w-full py-3 text-xs font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-[0.2em] transition-colors"
                >
                  {cancelText}
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
