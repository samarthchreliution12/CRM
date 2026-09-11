import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { COMPANY_INFO } from '../../utils/constants';
import { Button } from '../common/Button';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const ContactPreview = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="website-section">
      <Container>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading badge="Get In Touch" title="We are Here to Help" />
        </div>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`} style={{ textAlign: 'center', transitionDelay: '0.15s' }}>
          <p style={{ color: 'var(--color-secondary)', fontSize: '1.05rem' }}>
            📍 {COMPANY_INFO.address} | 📞 {COMPANY_INFO.phone} | ✉️ {COMPANY_INFO.email}
          </p>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <Button to="/contact" variant="primary" size="md" className="website-btn">
              Contact Us →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
