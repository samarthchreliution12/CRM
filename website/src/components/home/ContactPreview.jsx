import React from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { COMPANY_INFO } from '../../utils/constants';
import { Button } from '../common/Button';

export const ContactPreview = () => {
  return (
    <section className="website-section">
      <Container>
        <SectionHeading badge="Get In Touch" title="We are Here to Help" />
        <div style={{ textAlign: 'center' }}>
          <p>📍 {COMPANY_INFO.address} | 📞 {COMPANY_INFO.phone} | ✉️ {COMPANY_INFO.email}</p>
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <Button to="/contact" variant="primary" size="md">
              Contact Us →
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};
