import React, { useEffect, useState } from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';

export const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const videoScale = 1 + Math.min(scrollY / 1200, 0.08);
  const contentOpacity = Math.max(1 - scrollY / 600, 0);
  const contentTranslateY = Math.min(scrollY * 0.25, 100);

  return (
    <section className="website-hero-section">
      <video
        className="website-hero-video"
        autoPlay
        loop
        muted
        playsInline
        src="/assets/videos/hero-video.mp4"
        style={{
          transform: `scale(${videoScale})`,
        }}
      />

      <div className="website-hero-video-overlay" />

      <Container style={{ position: 'relative', zIndex: 3, width: '100%' }}>
        <div
          className="website-hero-grid"
          style={{
            opacity: contentOpacity,
            transform: `translateY(${contentTranslateY}px)`,
            transition: 'opacity 0.1s linear, transform 0.1s linear',
          }}
        >
          {/* Hero Content Column */}
          <div className="website-hero-content hero-text-animate">
            <div className="hero-fade-item stagger-1">
              <span className="website-hero-eyebrow">
                PARSHWA CONSULTANCY
              </span>
            </div>

            <h1 className="website-hero-heading hero-fade-item stagger-2">
              Empowering Your Financial Growth & Securing Your Investments
            </h1>

            <p className="website-hero-description hero-fade-item stagger-3">
              Expert financial advisory, customized mutual fund portfolios, and specialized investment recovery services designed for your long-term success.
            </p>

            <div className="website-hero-buttons hero-fade-item stagger-4">
              <Button to="/contact" variant="primary" size="lg" className="website-hero-btn-primary website-btn">
                Book a Consultation →
              </Button>
              <Button to="/services" variant="outline" size="lg" className="website-hero-btn-outline website-btn">
                Explore Services
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <style>{`
        .website-hero-section {
          position: relative;
          width: 100%;
          min-height: calc(100vh - var(--header-height, 80px));
          min-height: 650px;
          display: flex;
          align-items: center;
          background-color: #14191C;
          overflow: hidden;
          padding: var(--spacing-xxl) 0;
        }

        .website-hero-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 1;
          will-change: transform;
          transition: transform 0.2s ease-out;
        }

        .website-hero-video-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            90deg,
            rgba(20, 25, 28, 0.94) 0%,
            rgba(20, 25, 28, 0.85) 55%,
            rgba(20, 25, 28, 0.70) 100%
          );
          pointer-events: none;
        }

        .website-hero-grid {
          display: flex;
          align-items: center;
          width: 100%;
          will-change: transform, opacity;
        }

        .website-hero-content {
          max-width: 680px;
        }

        .website-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: var(--radius-full, 999px);
          background-color: rgba(158, 36, 29, 0.2);
          border: 1px solid rgba(255, 107, 97, 0.3);
          color: #FF6B61;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-size: 0.8125rem;
          margin-bottom: var(--spacing-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .website-hero-heading {
          color: #FFFFFF !important;
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin-bottom: var(--spacing-md);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .website-hero-description {
          color: #E5E7E8 !important;
          font-size: 1.15rem;
          line-height: 1.65;
          margin-bottom: var(--spacing-xl);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          max-width: 620px;
        }

        .website-hero-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .website-hero-btn-primary {
          background-color: var(--color-primary, #9E241D) !important;
          color: #FFFFFF !important;
          box-shadow: 0 6px 18px rgba(158, 36, 29, 0.45);
        }

        .website-hero-btn-primary:hover {
          background-color: var(--color-primary-hover, #861D18) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 25px rgba(158, 36, 29, 0.6);
        }

        .website-hero-btn-outline {
          border: 1px solid rgba(255, 255, 255, 0.7) !important;
          color: #FFFFFF !important;
          background-color: rgba(20, 25, 28, 0.4) !important;
          backdrop-filter: blur(8px);
        }

        .website-hero-btn-outline:hover {
          background-color: #FFFFFF !important;
          color: var(--color-dark, #0F172A) !important;
          border-color: #FFFFFF !important;
          transform: translateY(-3px) scale(1.02);
        }

        .hero-text-animate .hero-fade-item {
          opacity: 0;
          animation: heroFadeUp 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-text-animate .stagger-1 { animation-delay: 0.1s; }
        .hero-text-animate .stagger-2 { animation-delay: 0.22s; }
        .hero-text-animate .stagger-3 { animation-delay: 0.34s; }
        .hero-text-animate .stagger-4 { animation-delay: 0.46s; }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .website-hero-video {
            transition: none;
            transform: none !important;
          }
          .hero-text-animate .hero-fade-item {
            animation: none;
            opacity: 1;
          }
        }

        @media (max-width: 992px) {
          .website-hero-heading {
            font-size: 2.4rem;
          }
        }

        @media (max-width: 768px) {
          .website-hero-section {
            min-height: 560px;
          }

          .website-hero-content {
            text-align: center;
            margin: 0 auto;
          }

          .website-hero-heading {
            font-size: 2rem;
          }

          .website-hero-description {
            font-size: 1rem;
          }

          .website-hero-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
