import React from 'react';
import { Container } from '../common/Container';
import { Button } from '../common/Button';
import heroImg2 from '../../../assets/website/images/hero_img_2.png';

export const Hero = () => {
  return (
    <section className="website-hero-section">
      <video
        className="website-hero-video"
        autoPlay
        loop
        muted
        playsInline
        src="/assets/videos/hero-video.mp4"
      />
      <div className="website-hero-video-overlay" />

      <Container style={{ position: 'relative', zIndex: 3, width: '100%' }}>
        <div className="website-hero-grid">
          {/* Left Column: Hero Content */}
          <div className="website-hero-content hero-text-animate">
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

          {/* Right Column: Hero Image Card */}
          <div className="website-hero-image-col hero-fade-item stagger-4">
            <div className="website-hero-image-card">
              <img
                src={heroImg2}
                alt="Parshwa Consultancy Professional Financial Advisory"
                className="website-hero-card-img"
              />
              <div className="website-hero-card-overlay" />
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
          animation: videoSlowZoom 18s ease-in-out infinite alternate;
        }

        @keyframes videoSlowZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        .website-hero-video-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(
            90deg,
            rgba(20, 25, 28, 0.94) 0%,
            rgba(20, 25, 28, 0.85) 50%,
            rgba(20, 25, 28, 0.70) 100%
          );
          pointer-events: none;
        }

        .website-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 40px;
          align-items: center;
          width: 100%;
        }

        .website-hero-content {
          max-width: 600px;
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
          font-size: 2.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-top: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }

        .website-hero-description {
          color: #E5E7E8 !important;
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: var(--spacing-xl);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        }

        .website-hero-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .website-hero-btn-primary {
          background-color: var(--color-primary) !important;
          color: #FFFFFF !important;
          box-shadow: 0 4px 14px rgba(139, 35, 29, 0.45);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease !important;
        }

        .website-hero-btn-primary:hover {
          background-color: var(--color-primary-hover) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 22px rgba(139, 35, 29, 0.55);
        }

        .website-hero-btn-outline {
          border: 1px solid #FFFFFF !important;
          color: #FFFFFF !important;
          background-color: rgba(20, 25, 28, 0.45) !important;
          backdrop-filter: blur(4px);
          transition: transform 0.25s ease, background-color 0.25s ease, color 0.25s ease !important;
        }

        .website-hero-btn-outline:hover {
          background-color: #FFFFFF !important;
          color: var(--color-dark) !important;
          transform: translateY(-3px) scale(1.02);
        }

        /* Right Image Column & Card */
        .website-hero-image-col {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .website-hero-image-card {
          position: relative;
          width: 100%;
          max-width: 460px;
          height: 380px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
        }

        .website-hero-image-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
        }

        .website-hero-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.5s ease;
        }

        .website-hero-image-card:hover .website-hero-card-img {
          transform: scale(1.04);
        }

        .website-hero-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(20, 25, 28, 0.1) 0%,
            rgba(20, 25, 28, 0.35) 100%
          );
          pointer-events: none;
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

        @media (prefers-reduced-motion: reduce) {
          .website-hero-video,
          .website-hero-card-img {
            animation: none;
          }
          .hero-text-animate .hero-fade-item {
            animation: none;
            opacity: 1;
          }
        }

        @media (max-width: 992px) {
          .website-hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .website-hero-content {
            max-width: 100%;
          }

          .website-hero-heading {
            font-size: 2.35rem;
          }

          .website-hero-image-col {
            justify-content: center;
          }

          .website-hero-image-card {
            max-width: 100%;
            height: 320px;
          }
        }

        @media (max-width: 768px) {
          .website-hero-section {
            min-height: 540px;
          }

          .website-hero-content {
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

          .website-hero-image-card {
            height: 260px;
          }
        }
      `}</style>
    </section>
  );
};
