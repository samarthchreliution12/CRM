import React, { lazy, Suspense } from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';
import Tilt3DCard from '../common/Tilt3DCard';

const TrustRing3DScene = lazy(() => import('../3d/TrustRing3DScene'));

export const WhyParshwa = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const reasons = [
    { title: 'Client-Centric Integrity', desc: 'Unbiased financial advice focused strictly on your objectives.' },
    { title: 'Proven Track Record', desc: 'Decades of experience managing portfolios and recovering unclaimed wealth.' },
    { title: 'End-to-End Support', desc: 'From initial consultation to final execution, we handle every detail.' },
  ];

  return (
    <section ref={sectionRef} className="website-section why-parshwa-3d-section">
      <Container>
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading badge="Why Choose Us" title="Why Work With Parshwa Consultancy" />
        </div>

        <div className="why-parshwa-grid">
          <div className="why-parshwa-cards-col">
            {reasons.map((r, idx) => (
              <Tilt3DCard key={idx} maxTilt={6} scale={1.02}>
                <div
                  className={`why-parshwa-card scroll-reveal ${isRevealed ? 'revealed' : ''}`}
                  style={{ transitionDelay: `${0.12 + idx * 0.1}s` }}
                >
                  <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px', fontSize: '1.15rem' }}>{r.title}</h4>
                  <p style={{ color: 'var(--color-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{r.desc}</p>
                </div>
              </Tilt3DCard>
            ))}
          </div>

          <div className="why-parshwa-3d-col">
            <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
              <TrustRing3DScene />
            </Suspense>
          </div>
        </div>
      </Container>

      <style>{`
        .why-parshwa-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2rem;
          align-items: center;
        }

        .why-parshwa-cards-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .why-parshwa-card {
          padding: var(--spacing-lg);
          background-color: var(--color-white);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .why-parshwa-card:hover {
          transform: translateY(-5px);
          border-color: var(--color-primary);
          box-shadow: 0 10px 24px rgba(139, 35, 29, 0.1);
        }

        @media (max-width: 992px) {
          .why-parshwa-grid {
            grid-template-columns: 1fr;
          }
          .why-parshwa-3d-col {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};
