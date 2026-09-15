import React, { useEffect, useState } from 'react';
import { Container } from '../common/Container';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const TrustMetrics = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.2 });
  const [countProgress, setCountProgress] = useState(0);

  useEffect(() => {
    if (!isRevealed) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCountProgress(1);
      return;
    }

    let startTime;
    let animationFrame;
    const duration = 1400; // ms

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
      path: 'M 0 30 Q 30 20 60 25 T 120 10 T 180 5',
    },
    {
      label: 'HAPPY CLIENTS',
      targetNum: 10,
      format: (val) => `${Math.floor(val)}K+`,
      path: 'M 0 35 Q 40 25 80 15 T 160 8 T 200 4',
    },
    {
      label: 'AMC PARTNERS',
      targetNum: 35,
      format: (val) => `${Math.floor(val)}+`,
      path: 'M 0 28 Q 50 20 100 15 T 150 10 T 190 6',
    },
    {
      label: 'SKILLED EXPERTS',
      targetNum: 10,
      format: (val) => `${Math.floor(val)}+`,
      path: 'M 0 32 Q 40 18 80 22 T 140 12 T 180 4',
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

                {/* Decorative Sparkline */}
                <div className="metric-sparkline-box">
                  <svg viewBox="0 0 200 40" className="metric-sparkline-svg" fill="none">
                    <path
                      d={item.path}
                      stroke="var(--color-primary, #9E241D)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.35"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      <style>{`
        .website-metrics-section {
          background-color: var(--color-light, #F7F7F5);
          padding: 3rem 0;
          border-top: 1px solid var(--color-border, #E2E2DF);
          border-bottom: 1px solid var(--color-border, #E2E2DF);
          position: relative;
          overflow: hidden;
        }

        .website-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
        }

        .website-metric-card {
          padding: 1.25rem 1.5rem;
          text-align: center;
          position: relative;
          opacity: 0;
          transform: translateY(16px);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        }

        .website-metric-card.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .website-metric-card:hover {
          transform: translateY(-4px);
        }

        .website-metric-card:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 15%;
          height: 70%;
          width: 1px;
          background-color: var(--color-primary-light, #C4726C);
          opacity: 0.5;
          transform: scaleY(0);
          transform-origin: top center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }

        .website-metric-card.revealed::after {
          transform: scaleY(1);
        }

        .website-metric-value {
          font-size: 2.5rem;
          color: var(--color-dark, #0F172A);
          margin-bottom: 0.25rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.1;
          transition: color 0.3s ease;
        }

        .website-metric-label {
          color: var(--color-primary, #9E241D);
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .metric-sparkline-box {
          width: 100%;
          max-width: 140px;
          margin: 0 auto;
          height: 24px;
          overflow: hidden;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }

        .website-metric-card:hover .metric-sparkline-box {
          opacity: 1;
        }

        .metric-sparkline-svg {
          width: 100%;
          height: 100%;
        }

        @media (max-width: 768px) {
          .website-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem 0;
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

        @media (prefers-reduced-motion: reduce) {
          .website-metric-card {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }

          .website-metric-card::after {
            transform: scaleY(1) !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};
