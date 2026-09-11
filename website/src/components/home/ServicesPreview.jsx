import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { ServiceGrid } from '../services/ServiceGrid';
import { Button } from '../common/Button';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const ServicesPreview = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.1 });

  return (
    <section ref={sectionRef} className="website-section website-section-light">
      <Container>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading
            badge="Our Core Expertise"
            title="Our Financial Services"
            subtitle="Comprehensive financial solutions designed to support your investment and wealth management journey."
            center={true}
          />
        </div>

        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.15s' }}>
          <ServiceGrid limit={6} />
        </div>

        <div
          className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          style={{ textAlign: 'center', marginTop: 'var(--spacing-xxl)', transitionDelay: '0.3s' }}
        >
          <Button to="/services" variant="primary" size="lg" className="website-btn">
            View All Services
          </Button>
        </div>
      </Container>
    </section>
  );
};
