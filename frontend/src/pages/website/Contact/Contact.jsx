import React from 'react';
import SEO from '../../../components/SEO';
import { Container } from '../../../components/website/common/Container';
import { SectionHeading } from '../../../components/website/common/SectionHeading';
import { ContactForm } from '../../../components/website/contact/ContactForm';
import { COMPANY_INFO } from '../../../utils/website/constants';

export const Contact = () => {
  const contactSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Parshwa Consultancy",
      "url": "https://parshwaconsultancy.in/contact",
      "description": "Get in touch with Parshwa Consultancy for expert financial advisory, mutual fund management, and investment recovery."
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://parshwaconsultancy.in/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Contact Us",
          "item": "https://parshwaconsultancy.in/contact"
        }
      ]
    }
  ];

  return (
    <>
      <SEO
        title="Contact Us - Parshwa Consultancy Advisory Team"
        description="Connect with Parshwa Consultancy in Ahmedabad, Gujarat for financial advisory, mutual funds, physical share demat, and IEPF recovery assistance."
        canonical="/contact"
        keywords={['Contact Parshwa Consultancy', 'Financial Advisory Contact', 'Ahmedabad Investment Consultant', 'IEPF Recovery Help']}
        schemaData={contactSchemas}
      />
      <section className="website-section">
        <Container>
          <SectionHeading
            badge="Contact Us"
            title="Connect With Our Advisory Team"
            subtitle="Have questions about mutual funds, portfolio advisory, or investment recovery? Get in touch with our experts today."
          />

          <div className="contact-page-grid">
            {/* Left Column: Contact & Office Details */}
            <div className="contact-info-card">
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>Head Office Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>📍 Office Address:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)', wordBreak: 'break-word' }}>{COMPANY_INFO.address}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>📞 Phone:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.phone}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>✉️ Email:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)', wordBreak: 'break-all' }}>{COMPANY_INFO.email}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-dark)' }}>🕒 Working Hours:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-secondary)' }}>{COMPANY_INFO.workingHours}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="contact-form-col">
              <ContactForm />
            </div>
          </div>
        </Container>

        <style>{`
          .contact-page-grid {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: var(--spacing-xxl);
            margin-bottom: var(--spacing-xxl);
          }

          .contact-info-card {
            background-color: var(--color-white);
            padding: var(--spacing-xl);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            height: fit-content;
          }

          @media (max-width: 992px) {
            .contact-page-grid {
              grid-template-columns: 1fr;
              gap: var(--spacing-xl);
            }
          }

          @media (max-width: 480px) {
            .contact-info-card {
              padding: 1.25rem 1rem;
            }
          }
        `}</style>
      </section>

    </>
  );
};

export default Contact;
