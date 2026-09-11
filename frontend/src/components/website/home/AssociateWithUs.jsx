import React from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const AssociateWithUs = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="website-section">
      <Container>
        <div
          className={`associate-box scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          style={{ textAlign: 'center', backgroundColor: 'var(--color-white)', padding: 'var(--spacing-xxl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h2 style={{ color: 'var(--color-dark)', marginBottom: 'var(--spacing-sm)' }}>Associate & Partner With Us</h2>
          <p style={{ maxWidth: '600px', margin: '0 auto var(--spacing-lg)', color: 'var(--color-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Are you a financial advisor, CA, or legal consultant looking to offer investment recovery and mutual fund advisory to your clients? Partner with Parshwa Consultancy.
          </p>
          <Button to="/contact" variant="primary" size="md" className="website-btn">
            Become a Partner
          </Button>
        </div>
      </Container>
    </section>
  );
};
