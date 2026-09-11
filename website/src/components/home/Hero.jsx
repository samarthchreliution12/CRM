import React from 'react';
import { Button } from '../common/Button';
import heroImg from '../../assets/images/hero_img_2.png';

export const Hero = () => {
  return (
    <section className="website-hero-split-section">
      <div className="website-hero-split-container">
        {/* Left Side: Cinematic Video Background & Hero Content (55% width) */}
        <div className="website-hero-left">
          <video
            className="website-hero-video"
            autoPlay
            loop
            muted
            playsInline
            src="/assets/videos/hero-video.mp4"
          />
          <div className="website-hero-video-overlay" />

          <div className="website-hero-left-content hero-text-animate">
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
        </div>

        {/* Right Side: Existing Parshwa Hero Image (45% width) */}
        <div className="website-hero-right">
          <img
            src={heroImg}
            alt="Parshwa Consultancy Financial Services"
            className="website-hero-right-img"
          />
          <div className="website-hero-right-overlay" />
        </div>
      </div>

      <style>{`
        .website-hero-split-section {
          position: relative;
          width: 100%;
          min-height: calc(100vh - var(--header-height, 80px));
          min-height: 650px;
          background-color: #14191C;
          overflow: hidden;
        }

        .website-hero-split-container {
          display: flex;
          width: 100%;
          min-height: 650px;
          height: 100%;
        }

        .website-hero-left {
          position: relative;
          width: 55%;
          display: flex;
          align-items: center;
          padding: var(--spacing-xxl) 4% var(--spacing-xxl) 6%;
          overflow: hidden;
          z-index: 1;
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
            rgba(20, 25, 28, 0.86) 55%,
            rgba(20, 25, 28, 0.72) 100%
          );
          pointer-events: none;
        }

        .website-hero-left-content {
          position: relative;
          z-index: 3;
          max-width: 580px;
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

        .website-hero-right {
          position: relative;
          width: 45%;
          min-height: 100%;
          overflow: hidden;
          z-index: 1;
        }

        .website-hero-right-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: imageSlowZoom 18s ease-in-out infinite alternate;
        }

        @keyframes imageSlowZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.06);
          }
        }

        .website-hero-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(20, 25, 28, 0.75) 0%,
            rgba(20, 25, 28, 0.25) 50%,
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
          .website-hero-right-img {
            animation: none;
          }
          .hero-text-animate .hero-fade-item {
            animation: none;
            opacity: 1;
          }
        }

        @media (max-width: 1100px) {
          .website-hero-left {
            width: 60%;
            padding-left: 4%;
          }
          .website-hero-right {
            width: 40%;
          }
          .website-hero-heading {
            font-size: 2.35rem;
          }
        }

        @media (max-width: 992px) {
          .website-hero-split-container {
            flex-direction: column;
            min-height: auto;
          }

          .website-hero-left {
            width: 100%;
            min-height: 520px;
            padding: var(--spacing-xxl) var(--spacing-lg);
          }

          .website-hero-right {
            width: 100%;
            height: 320px;
            min-height: 320px;
          }

          .website-hero-video-overlay {
            background: linear-gradient(
              180deg,
              rgba(20, 25, 28, 0.94) 0%,
              rgba(20, 25, 28, 0.88) 100%
            );
          }

          .website-hero-right-overlay {
            background: linear-gradient(
              180deg,
              rgba(20, 25, 28, 0.35) 0%,
              rgba(20, 25, 28, 0.70) 100%
            );
          }
        }

        @media (max-width: 768px) {
          .website-hero-left {
            min-height: 480px;
            padding: var(--spacing-xl) var(--spacing-md);
            text-align: center;
          }

          .website-hero-left-content {
            max-width: 100%;
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

          .website-hero-right {
            height: 240px;
            min-height: 240px;
          }
        }
      `}</style>
    </section>
  );
};

