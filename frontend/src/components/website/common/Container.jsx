import React from 'react';

export const Container = ({ children, className = '', ...props }) => {
  return (
    <div className={`website-container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
