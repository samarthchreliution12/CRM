import React, { useState, useEffect } from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { heroSlides } from '../../data/heroSlides';

export const Hero = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Automatic background crossfade slider interval (5 seconds)
  useEffect(() => {
    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="website-hero-section">
      {/* Layer 1: Full-Width Background Images */}
      <div className="website-hero-slider-bg">
        {heroSlides.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`website-hero-slide ${isActive ? 'active' : ''}`}
              style={{ opacity: isActive ? 1 : 0 }}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="website-hero-img"
              />
            </div>
          );
        })}
      </div>

      {/* Layer 2: Dark Left-Side Gradient Overlay */}
      <div className="website-hero-overlay" />

      {/* Layer 3: Fixed Hero Content */}
      <Container style={{ position: 'relative', zIndex: 3, height: '100%' }}>
        <div className="website-hero-content">
          <span className="website-hero-eyebrow">
            Parshwa Consultancy
          </span>
          <h1 className="website-hero-heading">
            Empowering Your Financial Growth & Securing Your Investments
          </h1>
          <p className="website-hero-description">
            Expert financial advisory, customized mutual fund portfolios, and specialized investment recovery services designed for your long-term success.
          </p>
          <div className="website-hero-buttons">
            <Button to="/contact" variant="primary" size="lg" className="website-hero-btn-primary">
              Book a Consultation
            </Button>
            <Button to="/services" variant="outline" size="lg" className="website-hero-btn-outline">
              Explore Services
            </Button>
          </div>
        </div>
      </Container>

      <style>{`
        .website-hero-section {
          position: relative;
          width: 100%;
          min-height: 650px;
          display: flex;
          align-items: center;
          overflow: hidden;
          background-color: #14191C;
        }

        /* Layer 1: Background Images */
        .website-hero-slider-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
        }

        .website-hero-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity 1000ms ease-in-out;
        }

        .website-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        /* Layer 2: Left-Heavy Dark Gradient Overlay */
        .website-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            90deg,
            rgba(20, 25, 28, 0.90) 0%,
            rgba(20, 25, 28, 0.78) 35%,
            rgba(20, 25, 28, 0.45) 60%,
            rgba(20, 25, 28, 0.15) 100%
          );
          pointer-events: none;
        }

        /* Layer 3: Hero Content */
        .website-hero-content {
          max-width: 600px;
          padding: var(--spacing-xxl) 0;
        }

        .website-hero-eyebrow {
          color: #FF6B61;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-size: 0.875rem;
          display: block;
          margin-bottom: var(--spacing-xs);
        }

        .website-hero-heading {
          color: #FFFFFF !important;
          font-size: 2.875rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-top: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .website-hero-description {
          color: #E5E7E8 !important;
          font-size: 1.15rem;
          line-height: 1.6;
          margin-bottom: var(--spacing-xl);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .website-hero-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .website-hero-btn-primary {
          background-color: var(--color-primary) !important;
          color: #FFFFFF !important;
          box-shadow: 0 4px 12px rgba(139, 35, 29, 0.4);
        }

        .website-hero-btn-primary:hover {
          background-color: var(--color-primary-hover) !important;
        }

        .website-hero-btn-outline {
          border: 1px solid #FFFFFF !important;
          color: #FFFFFF !important;
          background-color: rgba(20, 25, 28, 0.4) !important;
          backdrop-filter: blur(4px);
        }

        .website-hero-btn-outline:hover {
          background-color: #FFFFFF !important;
          color: var(--color-dark) !important;
        }

        @media (max-width: 992px) {
          .website-hero-heading {
            font-size: 2.35rem;
          }

          .website-hero-section {
            min-height: 580px;
          }
        }

        @media (max-width: 768px) {
          .website-hero-section {
            min-height: 540px;
          }

          .website-hero-overlay {
            background: linear-gradient(
              180deg,
              rgba(20, 25, 28, 0.92) 0%,
              rgba(20, 25, 28, 0.85) 100%
            );
          }

          .website-hero-content {
            max-width: 100%;
            text-align: center;
          }

          .website-hero-heading {
            font-size: 1.95rem;
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
