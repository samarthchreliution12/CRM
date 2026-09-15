import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

import img01 from '../../../assets/website/finacial-lifecycle/img-01.png';
import img02 from '../../../assets/website/finacial-lifecycle/img-02.png';
import img03 from '../../../assets/website/finacial-lifecycle/img-03.png';
import img04 from '../../../assets/website/finacial-lifecycle/img-04.png';
import img05 from '../../../assets/website/finacial-lifecycle/img-05.png';

const journeySteps = [
  {
    step: '01',
    phase: 'UNDERSTAND',
    title: 'Financial Profile & Goal Evaluation',
    description:
      'We begin by analyzing your financial horizon, risk capacity, asset preference, and unique personal or corporate objectives.',
    highlights: ['Financial Needs Analysis', 'Risk Tolerance Evaluation', 'Goal-Oriented Mapping'],
    image: img01,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    step: '02',
    phase: 'PLAN',
    title: 'Customized Wealth Roadmap',
    description:
      'Developing a structured asset allocation strategy tailored to your investment objectives across equity, debt, mutual funds, and alternative instruments.',
    highlights: ['Tailored Portfolio Blueprint', 'Tax Efficiency Planning', 'Asset Allocation Strategy'],
    image: img02,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    step: '03',
    phase: 'INVEST',
    title: 'Disciplined Execution & Distribution',
    description:
      'Executing investments across top-performing mutual fund schemes, Demat holdings, IPO opportunities, PMS, or AIF products with absolute transparency.',
    highlights: ['Seamless Execution', 'Top Scheme Shortlisting', 'Demat & SIP Integration'],
    image: img03,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    step: '04',
    phase: 'GROW',
    title: 'Active Portfolio Rebalancing & Review',
    description:
      'Continuous portfolio monitoring, periodic performance reviews, and tactical rebalancing to adapt to evolving market cycles.',
    highlights: ['Periodic Rebalancing', 'Performance Statements', 'Market Cycle Adaptation'],
    image: img04,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    step: '05',
    phase: 'PROTECT',
    title: 'Asset Recovery & Risk Safeguard',
    description:
      'Protecting family wealth through term & health insurance advisory while recovering lost shares, physical certificates, and IEPF unclaimed dividends.',
    highlights: ['IEPF Share Recovery', 'Physical Share Demat', 'Insurance Protection'],
    image: img05,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const JourneyCardItem = ({ step, index }) => {
  const [cardRef, isRevealed] = useScrollReveal({ threshold: 0.1 });

  const stickyTopDesktop = 100 + index * 32;
  const stickyTopMobile = 85 + index * 24;

  return (
    <div
      ref={cardRef}
      className={`journey-card-item scroll-reveal ${isRevealed ? 'revealed' : ''}`}
      style={{
        '--sticky-top-desktop': `${stickyTopDesktop}px`,
        '--sticky-top-mobile': `${stickyTopMobile}px`,
        zIndex: index + 1,
      }}
    >
      <div className="journey-card-left">
        <div className="journey-card-badge">
          <span className="journey-badge-icon">{step.icon}</span>
          <span className="journey-badge-phase">{step.step} {step.phase}</span>
        </div>

        <h3 className="journey-card-title">{step.title}</h3>
        <p className="journey-card-desc">{step.description}</p>

        <div className="journey-highlights-list">
          {step.highlights.map((item, hIdx) => (
            <div key={hIdx} className="journey-highlight-tag">
              <span className="tag-check">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="journey-card-right">
        <div className="journey-image-wrapper">
          <img
            src={step.image}
            alt={`${step.phase} Phase - ${step.title}`}
            className="journey-step-image"
          />
          <div className="journey-image-overlay" />
        </div>
      </div>
    </div>
  );
};

export const FinancialJourney = () => {
  const [headerRef, isHeaderRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section className="website-section financial-journey-section">
      <Container>
        <div ref={headerRef} className={`scroll-reveal ${isHeaderRevealed ? 'revealed' : ''}`}>
          <SectionHeading
            badge="FINANCIAL LIFECYCLE"
            title="Your Financial Journey"
            subtitle="A structured, step-by-step approach to building wealth, optimizing portfolios, and protecting family assets."
            center={true}
          />
        </div>

        {/* 5 Stacked Vertical Cards with CSS Sticky Scroll Stacking */}
        <div className="journey-cards-stack">
          {journeySteps.map((step, idx) => (
            <JourneyCardItem key={step.phase} step={step} index={idx} />
          ))}
        </div>
      </Container>

      <style>{`
        .financial-journey-section {
          background-color: var(--color-white, #FFFFFF);
          border-top: 1px solid var(--color-border, #E2E2DF);
          border-bottom: 1px solid var(--color-border, #E2E2DF);
          position: relative;
          overflow: visible !important; /* Required for CSS position: sticky to stick */
        }

        .journey-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 48px;
          max-width: 980px;
          margin: var(--spacing-xl) auto 0;
          position: relative;
          padding-bottom: 80px;
        }

        /* Individual Card Styling with CSS Sticky Scroll Stacking */
        .journey-card-item {
          position: sticky;
          top: var(--sticky-top-desktop);
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-lg, 16px);
          padding: var(--spacing-xxl, 2.5rem);
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: var(--spacing-xxl, 2.5rem);
          align-items: center;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03), 0 16px 36px rgba(0, 0, 0, 0.08);
          min-height: 380px;
          opacity: 0;
          transform: translateY(24px) scale(0.98);
          will-change: transform, opacity;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .journey-card-item.revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .journey-card-item:hover {
          transform: translateY(-4px);
          border-color: rgba(158, 36, 29, 0.35);
          box-shadow: 0 20px 40px rgba(158, 36, 29, 0.1);
        }

        /* Content Elements Inside Card */
        .journey-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(158, 36, 29, 0.08);
          color: var(--color-primary, #9E241D);
          padding: 6px 14px;
          border-radius: var(--radius-full, 999px);
          border: 1px solid rgba(158, 36, 29, 0.15);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-bottom: var(--spacing-md);
        }

        .journey-badge-icon {
          display: flex;
          align-items: center;
        }

        .journey-card-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-dark, #0F172A);
          margin-bottom: var(--spacing-sm);
          line-height: 1.3;
        }

        .journey-card-desc {
          color: var(--color-secondary, #475569);
          font-size: 1.05rem;
          line-height: 1.65;
          margin-bottom: var(--spacing-lg);
        }

        .journey-highlights-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .journey-highlight-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #F8F9FA;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 8px 14px;
          border-radius: var(--radius-sm, 6px);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .journey-highlight-tag:hover {
          transform: translateY(-2px);
          border-color: rgba(158, 36, 29, 0.3);
          box-shadow: 0 6px 14px rgba(158, 36, 29, 0.08);
        }

        .tag-check {
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        /* Image Column Styling & Hover Zoom */
        .journey-card-right {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .journey-image-wrapper {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--color-border, #E2E2DF);
          background-color: #FFFFFF;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .journey-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 70%, rgba(0, 0, 0, 0.04) 100%);
          pointer-events: none;
        }

        .journey-step-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (hover: hover) {
          .journey-image-wrapper:hover .journey-step-image {
            transform: scale(1.03);
          }
        }

        /* Responsive Mobile Layout */
        @media (max-width: 860px) {
          .journey-cards-stack {
            gap: 28px;
            padding-bottom: 40px;
          }

          .journey-card-item {
            top: var(--sticky-top-mobile);
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
            padding: var(--spacing-xl) var(--spacing-lg);
            min-height: auto;
          }

          .journey-image-wrapper {
            max-height: 250px;
            aspect-ratio: auto;
          }
        }

        /* Accessibility: Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .journey-card-item,
          .journey-step-image {
            position: static !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FinancialJourney;
