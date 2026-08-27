import React from 'react';

/**
 * Centered container wrapper
 */
export const Container = ({ children, className = '', ...props }) => {
  return (
    <div className={`website-container ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};
