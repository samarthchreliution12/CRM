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
        >
          <h2>Associate & Partner With Us</h2>
          <p>
            Are you a financial advisor, CA, or legal consultant looking to offer investment recovery and mutual fund advisory to your clients? Partner with Parshwa Consultancy.
          </p>
          <Button to="/contact" variant="primary" size="md" className="website-btn">
            Become a Partner
          </Button>
        </div>
      </Container>

      <style>{`
        .associate-box {
          text-align: center;
          background-color: var(--color-white);
          padding: var(--spacing-xxl);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
        }

        .associate-box h2 {
          color: var(--color-dark);
          margin-bottom: var(--spacing-sm);
        }

        .associate-box p {
          max-width: 600px;
          margin: 0 auto var(--spacing-lg);
          color: var(--color-secondary);
          font-size: 1.05rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .associate-box {
            padding: var(--spacing-xl) var(--spacing-md);
          }
          .associate-box h2 {
            font-size: 1.4rem;
          }
          .associate-box p {
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .associate-box {
            padding: var(--spacing-lg) var(--spacing-sm);
          }
          .associate-box h2 {
            font-size: 1.25rem;
          }
          .associate-box p {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </section>
  );
};
