import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { COMPANY_INFO } from '../../../utils/website/constants';
import { Button } from '../common/Button';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const ContactPreview = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="website-section contact-preview-cinematic">
      <Container>
        <div className="contact-cta-card">
          <div className="contact-cta-glow" />

          <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
            <SectionHeading
              badge="GET IN TOUCH"
              title="Ready to Build & Secure Your Wealth?"
              subtitle="Connect with our team to discuss customized mutual fund advisory or specialized investment recovery."
              center={true}
            />
          </div>

          <div className={`contact-info-pills scroll-reveal ${isRevealed ? 'revealed' : ''}`} style={{ transitionDelay: '0.15s' }}>
            <div className="contact-pill">
              <span className="pill-icon">📍</span>
              <span className="pill-text">{COMPANY_INFO.address}</span>
            </div>
            <div className="contact-pill">
              <span className="pill-icon">📞</span>
              <span className="pill-text">{COMPANY_INFO.phone}</span>
            </div>
            <div className="contact-pill">
              <span className="pill-icon">✉️</span>
              <span className="pill-text">{COMPANY_INFO.email}</span>
            </div>
          </div>

          <div
            className={`contact-btn-box scroll-reveal ${isRevealed ? 'revealed' : ''}`}
            style={{ transitionDelay: '0.3s' }}
          >
            <Button to="/contact" variant="primary" size="lg" className="website-btn contact-primary-btn">
              Contact Us Today →
            </Button>
          </div>
        </div>
      </Container>

      <style>{`
        .contact-preview-cinematic {
          padding: var(--spacing-xxl) 0;
        }

        .contact-cta-card {
          background: linear-gradient(135deg, #14191C 0%, #202427 100%);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xxl) var(--spacing-xl);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        .contact-cta-card .website-section-heading h2 {
          color: #FFFFFF !important;
        }

        .contact-cta-card .website-section-heading p {
          color: #E5E7E8 !important;
          opacity: 0.9;
        }

        .contact-cta-card .website-section-heading span {
          background-color: rgba(158, 36, 29, 0.25) !important;
          color: #FF8F88 !important;
          border: 1px solid rgba(255, 143, 136, 0.3) !important;
        }

        .contact-cta-glow {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: var(--color-primary, #9E241D);
          filter: blur(100px);
          opacity: 0.25;
          pointer-events: none;
        }

        .contact-info-pills {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin: var(--spacing-xl) 0;
        }

        .contact-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 8px 16px;
          border-radius: var(--radius-full, 999px);
          color: #E5E7E8;
          font-size: 0.95rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
        }

        .contact-primary-btn {
          background-color: var(--color-primary, #9E241D) !important;
          color: #FFFFFF !important;
          box-shadow: 0 6px 20px rgba(158, 36, 29, 0.45);
        }

        .contact-primary-btn:hover {
          background-color: var(--color-primary-hover, #861D18) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 28px rgba(158, 36, 29, 0.6);
        }

        @media (max-width: 768px) {
          .contact-cta-card {
            padding: var(--spacing-xl) var(--spacing-md);
          }

          .contact-info-pills {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
};

export default ContactPreview;
