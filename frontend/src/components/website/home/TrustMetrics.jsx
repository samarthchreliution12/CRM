import React, { useEffect, useState } from 'react';
import { Container } from '../common/Container';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const TrustMetrics = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.2 });
  const [countProgress, setCountProgress] = useState(0);

  useEffect(() => {
    if (!isRevealed) return;
    let startTime;
    let animationFrame;
    const duration = 1600; // ms

    const animate = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCountProgress(easedProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRevealed]);

  const metrics = [
    {
      label: 'YEARS OF EXPERIENCE',
      targetNum: 35,
      format: (val) => `${Math.floor(val)}+`,
    },
    {
      label: 'HAPPY CLIENTS',
      targetNum: 10,
      format: (val) => `${Math.floor(val)}K+`,
    },
    {
      label: 'AMC PARTNERS',
      targetNum: 35,
      format: (val) => `${Math.floor(val)}+`,
    },
    {
      label: 'SKILLED EXPERTS',
      targetNum: 10,
      format: (val) => `${Math.floor(val)}+`,
    },
  ];

  return (
    <section ref={sectionRef} className="website-section website-metrics-section">
      <Container>
        <div className="website-metrics-grid">
          {metrics.map((item, idx) => {
            const displayValue = isRevealed
              ? item.format(item.targetNum * countProgress)
              : item.format(0);

            return (
              <div
                key={idx}
                className={`website-metric-card scroll-reveal ${isRevealed ? 'revealed' : ''}`}
                style={{ transitionDelay: `${idx * 0.1}s` }}
              >
                <h2 className="website-metric-value">{displayValue}</h2>
                <p className="website-metric-label">{item.label}</p>
              </div>
            );
          })}
        </div>
      </Container>

      <style>{`
        .website-metrics-section {
          background-color: var(--color-light, #F7F7F5);
          padding: 2.5rem 0;
          border-top: 1px solid var(--color-border, #E2E2DF);
          border-bottom: 1px solid var(--color-border, #E2E2DF);
        }

        .website-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
        }

        .website-metric-card {
          padding: 1rem 1.5rem;
          text-align: center;
          position: relative;
        }

        .website-metric-card:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 15%;
          height: 70%;
          width: 1px;
          background-color: var(--color-primary-light, #C4726C);
          opacity: 0.6;
        }

        .website-metric-value {
          font-size: 2.25rem;
          color: var(--color-dark, #0F172A);
          margin-bottom: 0.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .website-metric-label {
          color: var(--color-primary, #9E241D);
          margin: 0;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .website-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem 0;
          }

          .website-metric-card:nth-child(2)::after {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .website-metrics-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .website-metric-card::after {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
};
