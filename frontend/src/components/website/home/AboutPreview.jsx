import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const AboutPreview = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="website-section">
      <Container>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading
            badge="About Parshwa Consultancy"
            title="Guiding You Towards Smarter Investment Decisions"
            center={true}
          />
        </div>

        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <p
            className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
            style={{
              fontSize: '1.1rem',
              lineHeight: 1.7,
              color: 'var(--color-secondary)',
              marginBottom: 'var(--spacing-md)',
              transitionDelay: '0.12s',
            }}
          >
            Investing can feel complicated, especially when you're unsure where to begin. At Parshwa Consultancy, we help you understand your financial options and guide you towards investment solutions that align with your goals, priorities, and financial journey.
          </p>
          <p
            className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: 'var(--color-secondary)',
              marginBottom: 'var(--spacing-xl)',
              transitionDelay: '0.24s',
            }}
          >
            Whether you're new to investing or looking to manage your existing investments more effectively, our team helps simplify the process—from understanding different investment options to building a more informed and structured approach to growing your wealth.
          </p>

          <div
            className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
            style={{ transitionDelay: '0.36s' }}
          >
            <Button to="/about" variant="secondary" size="md" className="website-btn">
              Learn More About Us →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
