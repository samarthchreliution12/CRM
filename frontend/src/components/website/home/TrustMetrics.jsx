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
      label: 'Years of Experience',
      targetNum: 15,
      format: (val) => `${Math.floor(val)}+`,
    },
    {
      label: 'Satisfied Clients',
      targetNum: 5000,
      format: (val) => `${Math.floor(val).toLocaleString()}+`,
    },
    {
      label: 'Assets Under Advisory',
      targetNum: 500,
      format: (val) => `₹${Math.floor(val)}+ Cr`,
    },
    {
      label: 'Investment Recovery Success',
      targetNum: 98,
      format: (val) => `${Math.floor(val)}%`,
    },
  ];

  return (
    <section ref={sectionRef} className="website-section website-section-dark">
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
        .website-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-xl);
          text-align: center;
        }

        .website-metric-card {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          transition: transform 0.3s ease, background-color 0.3s ease;
        }

        .website-metric-card:hover {
          transform: translateY(-4px);
        }

        .website-metric-value {
          font-size: 2.5rem;
          color: var(--color-accent);
          margin-bottom: 4px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .website-metric-label {
          color: var(--color-border);
          margin: 0;
          font-size: 0.95rem;
        }
      `}</style>
    </section>
  );
};
