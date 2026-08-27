import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';

export const AboutSection = () => {
  const coreValues = [
    { title: 'Transparency', description: 'Complete clarity in investment strategies, fee structures, and recovery processes with zero hidden terms.' },
    { title: 'Client-Centric Commitment', description: 'Tailored financial solutions designed around your unique life goals, risk capacity, and timeline.' },
    { title: 'Regulatory Compliance', description: 'Strict adherence to SEBI, AMFI, and legal frameworks to safeguard your wealth and asset claims.' },
    { title: 'Excellence in Recovery', description: 'Specialized focus on resolving complex share transmission, loss certificates, and IEPF claims.' },
  ];

  return (
    <section className="website-section">
      <Container>
        <SectionHeading
          badge="About Parshwa Consultancy"
          title="Empowering Wealth Creation & Securing Your Investments"
          subtitle="At Parshwa Consultancy, we provide personalized financial consulting with total transparency and dedicated asset recovery services."
        />
        
        {/* Company Overview & Experience */}
        <div style={{ maxWidth: '900px', margin: '0 auto var(--spacing-xxl)', lineHeight: 1.8 }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-md)' }}>
            Established with a vision to make professional financial advisory accessible and trustworthy, <strong>Parshwa Consultancy</strong> brings over 15 years of industry expertise to individual investors, High Net Worth Individuals (HNIs), and corporate families across India.
          </p>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-secondary)' }}>
            We specialize in two core pillars: strategic wealth creation through customized mutual fund portfolios and comprehensive investment recovery services to reclaim dormant, lost, or unclaimed shares from the IEPF (Investor Education and Protection Fund).
          </p>
        </div>

        {/* Vision & Mission Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>🎯 Our Mission</h3>
            <p style={{ margin: 0 }}>
              To empower every client with transparent, data-driven financial advice and to restore lost family wealth by streamlining complex legal and regulatory share recovery procedures.
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-sm)' }}>👁️ Our Vision</h3>
            <p style={{ margin: 0 }}>
              To be India’s most trusted advisory firm in mutual fund wealth management and investment recovery, recognized for absolute integrity, client satisfaction, and operational excellence.
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <SectionHeading badge="Guided By Integrity" title="Our Core Values" center={true} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {coreValues.map((value, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--color-white)',
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h4 style={{ color: 'var(--color-dark)', marginBottom: '8px' }}>{value.title}</h4>
              <p style={{ fontSize: '0.925rem', color: 'var(--color-secondary)', margin: 0 }}>{value.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
