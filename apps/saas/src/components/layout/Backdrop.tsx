import React, { useEffect } from 'react';
interface BackdropProps { isOpen: boolean; onClose: () => void; className?: string; }
const Backdrop: React.FC<BackdropProps> = ({ isOpen, onClose, className = '' }) => {
  useEffect(() => { if (!isOpen) return; const previousOverflow = document.body.style.overflow; const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = previousOverflow; }; }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <button type="button" className={`fixed inset-0 z-40 cursor-default bg-slate-900/25 backdrop-blur-[2px] ${className}`} onClick={onClose} aria-label="Fechar menu" />;
};
export default Backdrop;
