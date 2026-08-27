import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { Button } from '../common/Button';

export const AboutPreview = () => {
  return (
    <section className="website-section">
      <Container>
        <SectionHeading
          badge="About Parshwa Consultancy"
          title="Guiding You Towards Smarter Investment Decisions"
          center={true}
        />

        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: 'var(--color-secondary)', marginBottom: 'var(--spacing-md)' }}>
            Investing can feel complicated, especially when you're unsure where to begin. At Parshwa Consultancy, we help you understand your financial options and guide you towards investment solutions that align with your goals, priorities, and financial journey.
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-secondary)', marginBottom: 'var(--spacing-xl)' }}>
            Whether you're new to investing or looking to manage your existing investments more effectively, our team helps simplify the process—from understanding different investment options to building a more informed and structured approach to growing your wealth.
          </p>

          <Button to="/about" variant="secondary" size="md">
            Learn More About Us →
          </Button>
        </div>
      </Container>
    </section>
  );
};
