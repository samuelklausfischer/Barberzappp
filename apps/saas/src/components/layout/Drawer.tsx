import React, { useEffect, useRef } from 'react';
export type DrawerPosition = 'left' | 'right';
interface DrawerProps { isOpen: boolean; onClose: () => void; children: React.ReactNode; position?: DrawerPosition; width?: string; className?: string; }
const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, position = 'left', width = '16rem', className = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!isOpen) return; const frame = window.requestAnimationFrame(() => panelRef.current?.focus()); return () => window.cancelAnimationFrame(frame); }, [isOpen]);
  if (!isOpen) return null;
  const positionClass = position === 'left' ? 'left-0' : 'right-0'; const animationClass = position === 'left' ? 'slide-in-left' : 'slide-in-right';
  return <div ref={panelRef} className={`fixed inset-y-0 ${positionClass} z-50 overflow-hidden border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ${position === 'left' ? 'border-r' : 'border-l'} ${animationClass} ${className}`} style={{ width }} role="dialog" aria-modal="true" aria-label="Menu principal" tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}>{children}</div>;
};
export default Drawer;
