import React, { useEffect } from 'react';

interface BackdropProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const Backdrop: React.FC<BackdropProps> = ({ isOpen, onClose, className = '' }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 fade-in ${className}`}
      onClick={onClose}
      role="presentation"
      style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
    />
  );
};

export default Backdrop;
