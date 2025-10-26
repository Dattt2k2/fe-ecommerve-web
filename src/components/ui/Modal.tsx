import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
  useEffect(() => {
    if (isOpen) {
      // Tự động đóng sau 3 giây
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: '✓',
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: '✗',
        };
      default:
        return {
          bg: 'bg-blue-500',
          icon: 'i',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${styles.bg} text-white px-6 py-4 rounded-lg shadow-lg max-w-md flex items-center space-x-3`}>
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 font-bold">
          {styles.icon}
        </div>
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          <div className={title ? 'text-sm' : ''}>{message}</div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 text-xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Modal;
