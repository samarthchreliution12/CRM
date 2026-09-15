import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';
import { FinancialVisualization } from '../common/FinancialVisualization';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const AboutPreview = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section ref={sectionRef} className="website-section about-preview-section">
      <Container>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading
            badge="About Parshwa Consultancy"
            title="Guiding You Towards Smarter Investment Decisions"
            center={true}
          />
        </div>

        <div className="about-preview-grid">
          <div className="about-text-column">
            <p
              className={`about-para scroll-reveal ${isRevealed ? 'revealed' : ''}`}
              style={{ transitionDelay: '0.12s' }}
            >
              Investing can feel complicated, especially when you're unsure where to begin. At Parshwa Consultancy, we help you understand your financial options and guide you towards investment solutions that align with your goals, priorities, and financial journey.
            </p>

            <p
              className={`about-para scroll-reveal ${isRevealed ? 'revealed' : ''}`}
              style={{ transitionDelay: '0.24s' }}
            >
              Whether you're new to investing or looking to manage your existing investments more effectively, our team helps simplify the process—from understanding different investment options to building a more informed and structured approach to growing your wealth.
            </p>

            <div
              className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
              style={{ transitionDelay: '0.36s', marginTop: 'var(--spacing-lg)' }}
            >
              <Button to="/about" variant="secondary" size="md" className="website-btn">
                Learn More About Us →
              </Button>
            </div>
          </div>

          <div
            className={`about-vis-column scroll-reveal ${isRevealed ? 'revealed' : ''}`}
            style={{ transitionDelay: '0.28s' }}
          >
            <FinancialVisualization title="Wealth & Portfolio Growth Path" />
          </div>
        </div>
      </Container>

      <style>{`
        .about-preview-section {
          background-color: var(--color-white);
          border-bottom: 1px solid var(--color-border);
        }

        .about-preview-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: var(--spacing-xxl);
          align-items: center;
          max-width: 1060px;
          margin: 0 auto;
        }

        .about-para {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--color-secondary);
          margin-bottom: var(--spacing-md);
        }

        @media (max-width: 992px) {
          .about-preview-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-xl);
          }

          .about-text-column {
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
};

export default AboutPreview;
