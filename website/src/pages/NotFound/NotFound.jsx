import React from 'react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';

export const NotFound = () => {
  return (
    <section className="website-section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
      <Container>
        <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '4rem', color: 'var(--color-primary)', marginBottom: '8px' }}>404</h1>
          <h2>Page Not Found</h2>
          <p style={{ marginBottom: 'var(--spacing-xl)' }}>
            The page you are looking for does not exist or has been moved.
          </p>
          <Button to="/" variant="primary" size="lg">
            Return to Homepage
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default NotFound;
