import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Button Component supporting both button and router link modes
 */
export const Button = ({
  children,
  to,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'text'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseClass = 'website-btn';
  const variantClass = `website-btn-${variant}`;
  const sizeClass = `website-btn-${size}`;
  const combinedClasses = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={combinedClasses} onClick={onClick} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
