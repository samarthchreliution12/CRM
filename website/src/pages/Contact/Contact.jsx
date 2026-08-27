import React from 'react';
import { Container } from '../../components/common/Container';
import { SectionHeading } from '../../components/common/SectionHeading';
import { ContactForm } from '../../components/contact/ContactForm';
import { COMPANY_INFO } from '../../utils/constants';

export const Contact = () => {
  return (
    <>
      <section className="website-section">
        <Container>
          <SectionHeading
            badge="Contact Us"
            title="Connect With Our Advisory Team"
            subtitle="Have questions about mutual funds, portfolio advisory, or investment recovery? Get in touch with our experts today."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-xxl)', marginBottom: 'var(--spacing-xxl)' }}>
            {/* Left Column: Contact & Office Details */}
            <div style={{ backgroundColor: 'var(--color-white)', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>Head Office Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>📍 Office Address:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.address}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>📞 Phone:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.phone}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>✉️ Email:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.email}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>🕒 Working Hours:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.workingHours}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>

    </>
  );
};

export default Contact;
