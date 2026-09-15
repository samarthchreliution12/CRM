import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

export const AboutSection = () => {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.12 });

  const coreValues = [
    { title: 'Transparency', description: 'Complete clarity in investment strategies, fee structures, and recovery processes with zero hidden terms.' },
    { title: 'Client-Centric Commitment', description: 'Tailored financial solutions designed around your unique life goals, risk capacity, and timeline.' },
    { title: 'Regulatory Compliance', description: 'Strict adherence to SEBI, AMFI, and legal frameworks to safeguard your wealth and asset claims.' },
    { title: 'Excellence in Recovery', description: 'Specialized focus on resolving complex share transmission, loss certificates, and IEPF claims.' },
  ];

  return (
    <section ref={sectionRef} className="website-section about-full-section">
      <Container>
        {/* Hero Entrance Sequence */}
        <div className={`about-hero-block scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <div className="about-badge-reveal">
            <span className="about-section-badge">About Parshwa Consultancy</span>
          </div>

          <h1 className="about-main-heading">
            Empowering Wealth Creation & Securing Your Investments
          </h1>

          <p className="about-subtitle-lead">
            At Parshwa Consultancy, we provide personalized financial consulting with total transparency and dedicated asset recovery services.
          </p>

          <div className="about-overview-box">
            <p className="about-para-1">
              Established with a vision to make professional financial advisory accessible and trustworthy, <strong>Parshwa Consultancy</strong> brings over 35 years of industry expertise to individual investors, High Net Worth Individuals (HNIs), and corporate families across India.
            </p>
            <p className="about-para-2">
              We specialize in two core pillars: strategic wealth creation through customized mutual fund portfolios and comprehensive investment recovery services to reclaim dormant, lost, or unclaimed shares from the IEPF (Investor Education and Protection Fund).
            </p>
          </div>
        </div>

        {/* Vision & Mission Grid */}
        <div className="about-vm-grid">
          <div
            className={`vm-card vm-card-mission scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          >
            <h3 className="vm-card-title">
              <span className="vm-icon">🎯</span> Our Mission
            </h3>
            <p className="vm-card-desc">
              To empower every client with transparent, data-driven financial advice and to restore lost family wealth by streamlining complex legal and regulatory share recovery procedures.
            </p>
          </div>

          <div
            className={`vm-card vm-card-vision scroll-reveal ${isRevealed ? 'revealed' : ''}`}
          >
            <h3 className="vm-card-title">
              <span className="vm-icon">👁️</span> Our Vision
            </h3>
            <p className="vm-card-desc">
              To be India’s most trusted advisory firm in mutual fund wealth management and investment recovery, recognized for absolute integrity, client satisfaction, and operational excellence.
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <div className={`about-values-header scroll-reveal ${isRevealed ? 'revealed' : ''}`}>
          <SectionHeading badge="Guided By Integrity" title="Our Core Values" center={true} />
        </div>

        <div className="about-values-grid">
          {coreValues.map((value, idx) => (
            <div
              key={idx}
              className={`value-card scroll-reveal ${isRevealed ? 'revealed' : ''}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <h4 className="value-title">{value.title}</h4>
              <p className="value-desc">{value.description}</p>
            </div>
          ))}
        </div>
      </Container>

      <style>{`
        .about-full-section {
          overflow: hidden;
        }

        /* Hero Entrance Sequence */
        .about-hero-block {
          text-align: center;
          margin-bottom: var(--spacing-xxl);
        }

        .about-section-badge {
          display: inline-block;
          padding: 4px 14px;
          border-radius: var(--radius-full, 999px);
          background-color: rgba(158, 36, 29, 0.08);
          color: var(--color-primary);
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
          border: 1px solid rgba(158, 36, 29, 0.15);
        }

        .about-main-heading {
          font-size: 2.35rem;
          font-weight: 800;
          color: var(--color-dark);
          line-height: 1.25;
          margin-bottom: var(--spacing-sm);
          letter-spacing: -0.02em;
        }

        .about-subtitle-lead {
          font-size: 1.15rem;
          color: var(--color-secondary);
          max-width: 680px;
          margin: 0 auto var(--spacing-lg);
          line-height: 1.6;
        }

        .about-hero-block .about-badge-reveal,
        .about-hero-block .about-main-heading,
        .about-hero-block .about-subtitle-lead,
        .about-hero-block .about-para-1,
        .about-hero-block .about-para-2 {
          opacity: 0;
          transform: translateY(20px) scale(0.98);
          will-change: opacity, transform;
        }

        .about-hero-block.revealed .about-badge-reveal {
          animation: aboutHeroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
        }

        .about-hero-block.revealed .about-main-heading {
          animation: aboutHeroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 90ms forwards;
        }

        .about-hero-block.revealed .about-subtitle-lead {
          animation: aboutHeroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 180ms forwards;
        }

        .about-hero-block.revealed .about-para-1 {
          animation: aboutHeroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 270ms forwards;
        }

        .about-hero-block.revealed .about-para-2 {
          animation: aboutHeroFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 360ms forwards;
        }

        @keyframes aboutHeroFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .about-overview-box {
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.8;
          text-align: center;
        }

        .about-para-1 {
          font-size: 1.1rem;
          margin-bottom: var(--spacing-md);
        }

        .about-para-2 {
          font-size: 1.05rem;
          color: var(--color-secondary);
          margin: 0;
        }

        /* Vision & Mission Grid */
        .about-vm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xxl);
        }

        .vm-card {
          background-color: var(--color-white);
          padding: var(--spacing-xl);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
          will-change: opacity, transform;
        }

        .vm-card-mission {
          opacity: 0;
          transform: translateX(-24px) translateY(15px) scale(0.98);
        }

        .vm-card-vision {
          opacity: 0;
          transform: translateX(24px) translateY(15px) scale(0.98);
        }

        .vm-card-mission.revealed {
          animation: vmMissionIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards;
        }

        .vm-card-vision.revealed {
          animation: vmVisionIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 280ms forwards;
        }

        @keyframes vmMissionIn {
          to {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes vmVisionIn {
          to {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        .vm-card-title {
          color: var(--color-primary);
          margin-bottom: var(--spacing-sm);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .vm-card-desc {
          margin: 0;
          color: var(--color-secondary);
          line-height: 1.65;
          font-size: 1rem;
        }

        .vm-icon {
          display: inline-block;
          font-size: 1.35rem;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vm-card:hover {
          transform: translateY(-5px);
          border-color: rgba(158, 36, 29, 0.35);
          box-shadow: 0 14px 28px rgba(158, 36, 29, 0.12);
        }

        .vm-card:hover .vm-icon {
          transform: scale(1.2) rotate(6deg);
        }

        /* Core Values Section */
        .about-values-header {
          opacity: 0;
          transform: translateY(15px);
        }

        .about-values-header.revealed {
          animation: aboutHeroFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
        }

        .about-values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--spacing-lg);
        }

        .value-card {
          background-color: var(--color-white);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          opacity: 0;
          transform: translateY(25px) scale(0.98);
          will-change: opacity, transform;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .value-card.revealed {
          animation: valueCardIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes valueCardIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .value-card:hover {
          transform: translateY(-5px);
          border-color: rgba(158, 36, 29, 0.3);
          box-shadow: 0 12px 24px rgba(158, 36, 29, 0.1);
        }

        .value-title {
          color: var(--color-dark);
          margin-bottom: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .value-card:hover .value-title {
          transform: translateY(-2px);
          color: var(--color-primary);
        }

        .value-desc {
          font-size: 0.925rem;
          color: var(--color-secondary);
          margin: 0;
          line-height: 1.6;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .about-main-heading {
            font-size: 1.85rem;
          }

          .vm-card-mission,
          .vm-card-vision {
            transform: translateY(15px);
          }

          .vm-card-mission.revealed,
          .vm-card-vision.revealed {
            animation: valueCardIn 0.5s ease-out forwards;
          }
        }

        /* Accessibility: Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .about-badge-reveal,
          .about-main-heading,
          .about-subtitle-lead,
          .about-para-1,
          .about-para-2,
          .vm-card-mission,
          .vm-card-vision,
          .value-card,
          .about-values-header {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }

          .vm-icon,
          .vm-card,
          .value-card,
          .value-title {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default AboutSection;

