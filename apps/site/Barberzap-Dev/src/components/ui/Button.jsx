import React from 'react';

export const Button = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded hover:opacity-90 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
