import React from 'react';
import { Container } from '../../components/common/Container';
import { SectionHeading } from '../../components/common/SectionHeading';
import { ServiceGrid } from '../../components/services/ServiceGrid';

export const Services = () => {
  return (
    <>
      <section className="website-section">
        <Container>
          <SectionHeading
            badge="Our Complete Catalog"
            title="Financial Services"
            subtitle="Explore our comprehensive range of financial and investment solutions designed to help you manage, grow, and protect your wealth."
            center={true}
          />
          <ServiceGrid />
        </Container>
      </section>
    </>
  );
};

export default Services;
