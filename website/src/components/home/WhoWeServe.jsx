import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';

const clientCategories = [
  {
    id: 'nri',
    title: 'NRI',
    description: 'Investment and financial solutions for Non-Resident Indians managing their financial interests in India.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 'individual-investors',
    title: 'Individual Investors',
    description: 'Helping individual investors understand investment opportunities and make informed financial decisions.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'huf',
    title: 'HUF',
    description: 'Financial and investment solutions designed for Hindu Undivided Families.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M9 21v-2a4 4 0 0 1 3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'companies',
    title: 'Companies',
    description: 'Supporting companies with suitable financial and investment solutions based on their business requirements.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="9" y1="6" x2="9.01" y2="6" />
        <line x1="15" y1="6" x2="15.01" y2="6" />
        <line x1="9" y1="10" x2="9.01" y2="10" />
        <line x1="15" y1="10" x2="15.01" y2="10" />
        <line x1="9" y1="14" x2="9.01" y2="14" />
        <line x1="15" y1="14" x2="15.01" y2="14" />
        <path d="M10 22v-4h4v4" />
      </svg>
    ),
  },
  {
    id: 'partnership-firms',
    title: 'Partnership Firms',
    description: 'Investment and financial solutions for partnership businesses and firms.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
        <path d="m7 21 1.6-1.4c.4-.4.4-1 0-1.4l-2.2-2.2c-.4-.4-1-.4-1.4 0L2 19" />
        <path d="M13 9h-2a2 2 0 1 0 0 4h3c.6 0 1.1-.2 1.4-.6L21 7" />
        <path d="m17 3-1.6 1.4c-.4.4-.4 1 0 1.4l2.2 2.2c.4.4 1 .4 1.4 0L22 5" />
      </svg>
    ),
  },
  {
    id: 'trusts',
    title: 'Trusts',
    description: 'Financial and investment support for trusts based on their financial objectives and requirements.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

export const WhoWeServe = () => {
  return (
    <section className="website-section website-section-light who-we-serve-section">
      <Container>
        {/* Section Heading */}
        <SectionHeading
          badge="WHO WE SERVE"
          title="Financial Solutions for Every Type of Investor"
          subtitle="At Parshwa Consultancy, we serve a diverse range of clients with different financial goals, investment needs, and financial structures. Our approach is focused on understanding each client's requirements and helping them explore suitable financial and investment solutions."
          center={true}
        />

        {/* 6 Client Categories Grid */}
        <div className="client-categories-grid">
          {clientCategories.map((client) => (
            <div key={client.id} className="client-category-card">
              <div className="client-icon-wrapper">
                {client.icon}
              </div>
              <h3 className="client-category-title">{client.title}</h3>
              <p className="client-category-description">{client.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="client-cta-box">
          <h3 className="client-cta-heading">Not Sure Which Solution Is Right for You?</h3>
          <p className="client-cta-text">
            Speak with our team to discuss your financial needs and explore the services that may be suitable for you.
          </p>
          <Button to="/contact" variant="primary" size="md">
            Talk to Our Team →
          </Button>
        </div>
      </Container>

      <style>{`
        .client-categories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-xl);
          width: 100%;
        }

        .client-category-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-xl) var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          transition: all var(--transition-normal);
        }

        .client-category-card:hover {
          transform: translateY(-4px);
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
        }

        .client-icon-wrapper {
          color: var(--color-primary);
          margin-bottom: var(--spacing-md);
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          background-color: rgba(139, 35, 29, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .client-category-card:hover .client-icon-wrapper {
          background-color: var(--color-primary);
          color: var(--color-white);
        }

        .client-category-title {
          color: var(--color-dark);
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 var(--spacing-xs) 0;
        }

        .client-category-description {
          color: var(--color-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .client-cta-box {
          margin-top: var(--spacing-xxl);
          background-color: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          text-align: center;
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
        }

        .client-cta-heading {
          color: var(--color-dark);
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: var(--spacing-xs);
        }

        .client-cta-text {
          color: var(--color-secondary);
          font-size: 1rem;
          margin-bottom: var(--spacing-md);
        }

        @media (max-width: 1199px) {
          .client-categories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-lg);
          }
        }

        @media (max-width: 768px) {
          .client-categories-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }

          .client-cta-box {
            padding: var(--spacing-lg) var(--spacing-md);
          }
        }
      `}</style>
    </section>
  );
};
