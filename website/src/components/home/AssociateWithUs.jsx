import React from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';

export const AssociateWithUs = () => {
  return (
    <section className="website-section">
      <Container>
        <div style={{ textAlign: 'center', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-xxl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2>Associate & Partner With Us</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto var(--spacing-lg)' }}>
            Are you a financial advisor, CA, or legal consultant looking to offer investment recovery and mutual fund advisory to your clients? Partner with Parshwa Consultancy.
          </p>
          <Button to="/contact" variant="primary" size="md">
            Become a Partner
          </Button>
        </div>
      </Container>
    </section>
  );
};
