import React from 'react';
import { Link } from 'react-router-dom';

export const Button = ({
  children,
  to,
  type = 'button',
  variant = 'primary',
  size = 'md',
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
    const isExternal =
      to.startsWith('http://') ||
      to.startsWith('https://') ||
      to.startsWith('mailto:') ||
      to.startsWith('tel:');

    if (isExternal) {
      return (
        <a
          href={to}
          className={combinedClasses}
          onClick={onClick}
          target={props.target || '_blank'}
          rel={props.rel || 'noopener noreferrer'}
          {...props}
        >
          {children}
        </a>
      );
    }

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
