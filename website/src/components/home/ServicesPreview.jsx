import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { ServiceGrid } from '../services/ServiceGrid';
import { Button } from '../common/Button';

export const ServicesPreview = () => {
  return (
    <section className="website-section website-section-light">
      <Container>
        <SectionHeading
          badge="Our Core Expertise"
          title="Our Financial Services"
          subtitle="Comprehensive financial solutions designed to support your investment and wealth management journey."
          center={true}
        />
        
        <ServiceGrid limit={6} />

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xxl)' }}>
          <Button to="/services" variant="primary" size="lg">
            View All Services
          </Button>
        </div>
      </Container>
    </section>
  );
};
