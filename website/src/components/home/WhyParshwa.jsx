import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';

export const WhyParshwa = () => {
  const reasons = [
    { title: 'Client-Centric Integrity', desc: 'Unbiased financial advice focused strictly on your objectives.' },
    { title: 'Proven Track Record', desc: 'Decades of experience managing portfolios and recovering unclaimed wealth.' },
    { title: 'End-to-End Support', desc: 'From initial consultation to final execution, we handle every detail.' },
  ];

  return (
    <section className="website-section">
      <Container>
        <SectionHeading badge="Why Choose Us" title="Why Work With Parshwa Consultancy" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {reasons.map((r, idx) => (
            <div key={idx} style={{ padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h4>{r.title}</h4>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
