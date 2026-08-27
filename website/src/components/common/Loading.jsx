import React from 'react';

/**
 * Reusable Loading Spinner Component
 */
export const Loading = ({ text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-xxl)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-secondary)' }}>{text}</p>
    </div>
  );
};
