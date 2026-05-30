import React from 'react';

export type DrawerPosition = 'left' | 'right';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: DrawerPosition;
  width?: string;
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
  width = '16rem',
  className = '',
}) => {
  if (!isOpen) return null;

  const getPositionClass = () => {
    return position === 'left' ? 'left-0' : 'right-0';
  };

  const getAnimationClass = () => {
    return position === 'left' ? 'slide-in-left' : 'slide-in-right';
  };

  return (
    <div
      className={`fixed top-0 bottom-0 ${getPositionClass()} ${className} ${getAnimationClass()} bg-zinc-950 z-50 shadow-2xl`}
      style={{ width }}
    >
      {children}
    </div>
  );
};

export default Drawer;
