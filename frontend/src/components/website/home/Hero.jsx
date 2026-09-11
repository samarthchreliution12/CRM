import React, { useState, useEffect } from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import { heroSlides } from '../../../data/website/heroSlides';

export const Hero = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="website-hero-section">
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
                className={`website-hero-img ${isActive ? 'ken-burns-active' : ''}`}
              />
            </div>
          );
        })}
      </div>

      <div className="website-hero-overlay" />

      <Container style={{ position: 'relative', zIndex: 3, height: '100%' }}>
        <div key={currentSlideIndex} className="website-hero-content hero-text-animate">
          <span className="website-hero-eyebrow hero-fade-item stagger-1">
            Parshwa Consultancy
          </span>
          <h1 className="website-hero-heading hero-fade-item stagger-2">
            Empowering Your Financial Growth & Securing Your Investments
          </h1>
          <p className="website-hero-description hero-fade-item stagger-3">
            Expert financial advisory, customized mutual fund portfolios, and specialized investment recovery services designed for your long-term success.
          </p>
          <div className="website-hero-buttons hero-fade-item stagger-4">
            <Button to="/contact" variant="primary" size="lg" className="website-hero-btn-primary website-btn">
              Book a Consultation
            </Button>
            <Button to="/services" variant="outline" size="lg" className="website-hero-btn-outline website-btn">
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
          transform: scale(1);
          transition: transform 0.5s ease-out;
        }

        .website-hero-img.ken-burns-active {
          animation: kenBurns 5.5s ease-out forwards;
        }

        @keyframes kenBurns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        .hero-text-animate .hero-fade-item {
          opacity: 0;
          animation: heroFadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-text-animate .stagger-1 { animation-delay: 0.1s; }
        .hero-text-animate .stagger-2 { animation-delay: 0.22s; }
        .hero-text-animate .stagger-3 { animation-delay: 0.34s; }
        .hero-text-animate .stagger-4 { animation-delay: 0.46s; }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease !important;
        }

        .website-hero-btn-primary:hover {
          background-color: var(--color-primary-hover) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 20px rgba(139, 35, 29, 0.5);
        }

        .website-hero-btn-outline {
          border: 1px solid #FFFFFF !important;
          color: #FFFFFF !important;
          background-color: rgba(20, 25, 28, 0.4) !important;
          backdrop-filter: blur(4px);
          transition: transform 0.25s ease, background-color 0.25s ease, color 0.25s ease !important;
        }

        .website-hero-btn-outline:hover {
          background-color: #FFFFFF !important;
          color: var(--color-dark) !important;
          transform: translateY(-3px) scale(1.02);
        }

        @media (prefers-reduced-motion: reduce) {
          .website-hero-img.ken-burns-active {
            animation: none;
          }
          .hero-text-animate .hero-fade-item {
            animation: none;
            opacity: 1;
          }
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
