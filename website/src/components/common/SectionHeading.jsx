import React from 'react';

/**
 * Standardized Section Heading with optional subtitle and badge
 */
export const SectionHeading = ({
  badge,
  title,
  subtitle,
  center = true,
  className = '',
}) => {
  const alignClass = center ? 'text-center' : '';

  return (
    <div className={`website-section-heading ${alignClass} ${className}`.trim()} style={{ marginBottom: 'var(--spacing-xl)', textAlign: center ? 'center' : 'left' }}>
      {badge && (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(139, 35, 29, 0.1)',
            color: 'var(--color-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          {badge}
        </span>
      )}
      {title && <h2>{title}</h2>}
      {subtitle && <p style={{ maxWidth: center ? '680px' : '100%', margin: center ? '0 auto' : '0' }}>{subtitle}</p>}
    </div>
  );
};
