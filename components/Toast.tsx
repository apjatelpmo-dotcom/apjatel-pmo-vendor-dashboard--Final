
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading';

export interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds for success/error
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-white border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'loading':
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl border shadow-xl transition-all animate-in slide-in-from-top-2 fade-in duration-300 ${getStyles()}`}>
      <div className="shrink-0">{getIcon()}</div>
      <div className="flex flex-col">
          <span className="font-semibold text-sm">
              {type === 'loading' ? 'Memproses...' : (type === 'success' ? 'Berhasil' : 'Gagal')}
          </span>
          <span className="text-xs opacity-90">{message}</span>
      </div>
      {type !== 'loading' && (
        <button onClick={onClose} className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
