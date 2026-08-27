import React from 'react';
import { Container } from '../common/Container';

export const TrustMetrics = () => {
  const metrics = [
    { label: 'Years of Experience', value: '15+' },
    { label: 'Satisfied Clients', value: '5,000+' },
    { label: 'Assets Under Advisory', value: '₹500+ Cr' },
    { label: 'Investment Recovery Success', value: '98%' },
  ];

  return (
    <section className="website-section website-section-dark">
      <Container>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-xl)', textAlign: 'center' }}>
          {metrics.map((item, idx) => (
            <div key={idx}>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-accent)', marginBottom: '4px' }}>{item.value}</h2>
              <p style={{ color: 'var(--color-border)', margin: 0, fontSize: '0.95rem' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
