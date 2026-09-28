import React, { lazy, Suspense } from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';
import { partnerLogos } from '../../../data/website/partners';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';
import Tilt3DCard from '../common/Tilt3DCard';

const Recovery3DScene = lazy(() => import('../3d/Recovery3DScene'));

export const InvestmentRecovery = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  // Customizable 4 Step Cards Data
  const recoverySteps = [
    {
      title: "LOST INVESTMENT",
      desc: "Unclaimed dividends, physical share certificates, forgotten accounts",
    },
    {
      title: "DOCUMENTATION",
      desc: "IEPF verification, legal affidavits, signature validation",
    },
    {
      title: "RECOVERY PROCESS",
      desc: "Liaison with RTA, company registrar, and IEPF authority",
    },
    {
      title: "SECURED WEALTH",
      desc: "Dematerialization into your active demat account safely",
    },
  ];

  const trustPoints = [
    'Client-Centric Approach',
    'Transparent Guidance',
    'Long-Term Relationships',
  ];

  return (
    <section ref={sectionRef} className="website-section website-section-light trusted-partners-section">
      <Container>
        {/* 3D Investment Recovery Storytelling Block */}
        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`} style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <SectionHeading
            badge="SPECIALIZED RECOVERY"
            title="Recover Your Unclaimed Wealth & Physical Shares"
            subtitle="From lost certificates to seamless IEPF dematerialization — your journey to recovered wealth."
            center={true}
          />
          <div className="recovery-3d-wrapper" style={{ marginTop: '1.5rem' }}>
            <Suspense fallback={<div style={{ minHeight: '300px' }} />}>
              <Recovery3DScene steps={recoverySteps} />
            </Suspense>
          </div>

          {/* Clean Mobile Representation of Recovery Journey */}
          <div className="recovery-steps-mobile-container">
            {recoverySteps.map((step, sIdx) => (
              <div key={sIdx} className="recovery-mobile-step-card">
                <div className="recovery-mobile-step-num">0{sIdx + 1}</div>
                <div className="recovery-mobile-step-content">
                  <h4 className="recovery-mobile-step-title">{step.title}</h4>
                  <p className="recovery-mobile-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading
            badge="TRUSTED PARTNERS"
            title="Trusted Partnerships. Stronger Financial Solutions."
            center={true}
          />
        </div>

        <div
          className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          style={{ maxWidth: '820px', margin: '0 auto var(--spacing-xxl)', textAlign: 'center', transitionDelay: '0.12s' }}
        >
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--color-secondary)', marginBottom: 'var(--spacing-md)' }}>
            At Parshwa Consultancy, we believe the right financial decisions are supported by trusted relationships. We work with established financial institutions and industry partners to help connect our clients with a broader range of investment and financial solutions.
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-secondary)', margin: 0 }}>
            Whether you are beginning your investment journey or exploring new opportunities, our trusted network helps us provide informed guidance and solutions tailored to your financial goals.
          </p>
        </div>

        <div className="partner-logo-grid">
          {partnerLogos.map((partner, index) => (
            <Tilt3DCard key={partner.id} maxTilt={6} scale={1.04}>
              <div
                className={`partner-card scroll-reveal-scale ${isRevealed ? 'revealed' : ''}`}
                style={{ transitionDelay: `${0.18 + index * 0.06}s` }}
              >
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="partner-img"
                  />
                ) : (
                  <div className="partner-placeholder-emblem">
                    <div className="partner-placeholder-bar" />
                    <div className="partner-placeholder-circle" />
                    <div className="partner-placeholder-bar short" />
                  </div>
                )}
              </div>
            </Tilt3DCard>
          ))}
        </div>

        <div
          className={`scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          style={{
            marginTop: 'var(--spacing-xxl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-lg)',
            transitionDelay: '0.45s',
          }}
        >
          <div className="partner-trust-points">
            {trustPoints.map((point, index) => (
              <div key={index} className="trust-point-item">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <Button to="/contact" variant="primary" size="lg" className="website-btn">
            Talk to Our Team →
          </Button>
        </div>
      </Container>

      <style>{`
        .recovery-3d-wrapper {
          display: block;
        }

        .recovery-steps-mobile-container {
          display: none;
        }

        .partner-logo-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: var(--spacing-md);
          width: 100%;
        }

        .partner-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-sm);
          box-shadow: var(--shadow-sm);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
        }

        .partner-card:hover {
          border-color: var(--color-primary);
          box-shadow: 0 8px 20px rgba(139, 35, 29, 0.15);
          transform: translateY(-4px) scale(1.04);
        }

        .partner-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .partner-card:hover .partner-img {
          transform: scale(1.05);
        }

        .partner-placeholder-emblem {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0.25;
        }

        .partner-placeholder-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: var(--color-dark);
        }

        .partner-placeholder-bar {
          width: 32px;
          height: 8px;
          border-radius: 4px;
          background-color: var(--color-dark);
        }

        .partner-placeholder-bar.short {
          width: 16px;
        }

        .partner-trust-points {
          display: flex;
          gap: var(--spacing-xl);
          flex-wrap: wrap;
          justify-content: center;
        }

        .trust-point-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--color-dark);
        }

        @media (max-width: 1024px) {
          .recovery-3d-wrapper {
            display: none !important;
          }

          .recovery-steps-mobile-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-top: 1.5rem;
          }

          .recovery-mobile-step-card {
            background-color: #FFFFFF;
            border: 1px solid var(--color-border, #E2E2DF);
            border-radius: var(--radius-md, 8px);
            padding: 1.25rem 1rem;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .recovery-mobile-step-num {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(158, 36, 29, 0.1);
            color: var(--color-primary, #9E241D);
            font-weight: 800;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid rgba(158, 36, 29, 0.2);
          }

          .recovery-mobile-step-title {
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--color-dark, #0F172A);
            margin: 0 0 4px 0;
            letter-spacing: 0.02em;
          }

          .recovery-mobile-step-desc {
            font-size: 0.85rem;
            color: var(--color-secondary, #475569);
            margin: 0;
            line-height: 1.5;
          }

          .partner-logo-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: var(--spacing-md);
          }
        }

        @media (max-width: 768px) {
          .recovery-steps-mobile-container {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .partner-logo-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .partner-card {
            height: 72px;
            padding: 8px;
          }

          .partner-trust-points {
            gap: var(--spacing-sm);
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .partner-logo-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .partner-card {
            height: 64px;
            padding: 6px;
          }

          .trust-point-item {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </section>
  );
};
