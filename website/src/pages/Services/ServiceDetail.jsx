import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { ServiceCard } from '../../components/services/ServiceCard';
import { servicesData } from '../../data/services';

export const ServiceDetail = () => {
  const { slug } = useParams();

  const service = servicesData.find((s) => s.slug === slug);

  if (!service) {
    return (
      <section className="website-section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <Container>
          <div style={{ textAlign: 'center', maxWidth: '540px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: 'var(--spacing-xs)' }}>
              Service Not Found
            </h1>
            <p style={{ color: 'var(--color-secondary)', marginBottom: 'var(--spacing-xl)' }}>
              The financial service you are looking for does not exist or has been moved.
            </p>
            <Button to="/services" variant="primary" size="md">
              ← Back to All Services
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  const relatedServices = servicesData
    .filter((s) => s.slug !== service.slug)
    .slice(0, 3);

  return (
    <article className="service-detail-page">
      {/* Top Header & Service Hero */}
      <div className="service-detail-header-bg">
        <Container>
          <div className="service-detail-top-nav">
            <Link to="/services" className="back-services-link">
              ← Back to All Services
            </Link>
            <div className="service-breadcrumb">
              <Link to="/">Home</Link> &nbsp;/&nbsp; <Link to="/services">Services</Link> &nbsp;/&nbsp; <span>{service.title}</span>
            </div>
          </div>

          <div className="service-hero-content">
            <div className="service-hero-icon-box">
              {service.icon}
            </div>
            <h1 className="service-hero-title">{service.title}</h1>
            <p className="service-hero-subtitle">{service.description}</p>
            {service.intro && (
              <p className="service-hero-intro">
                {service.intro}
              </p>
            )}
          </div>
        </Container>
      </div>

      {/* Main Service Content Sections */}
      <section className="website-section">
        <Container>
          <div className="service-content-wrapper">
            {/* Overview */}
            <div className="service-content-block">
              <h2 className="service-block-heading">Overview</h2>
              <p className="service-overview-text">{service.overview}</p>
            </div>

            {/* Key Benefits */}
            {service.keyBenefits && service.keyBenefits.length > 0 && (
              <div className="service-content-block">
                <h2 className="service-block-heading">Key Benefits</h2>
                <div className="service-benefits-grid">
                  {service.keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="service-benefit-card">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Who Can Benefit / Who It Is Suitable For */}
            {service.whoItIsFor && (
              <div className="service-content-block">
                <h2 className="service-block-heading">Who Can Benefit</h2>
                <div className="service-target-box">
                  <p>{service.whoItIsFor}</p>
                </div>
              </div>
            )}

            {/* Process / How It Works */}
            {service.process && service.process.length > 0 && (
              <div className="service-content-block">
                <h2 className="service-block-heading">How It Works</h2>
                <div className="service-process-grid">
                  {service.process.map((stepItem) => (
                    <div key={stepItem.step} className="service-process-card">
                      <span className="process-step-number">{stepItem.step}</span>
                      <h4 className="process-step-title">{stepItem.title}</h4>
                      <p className="process-step-desc">{stepItem.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Consultation CTA Banner */}
          <div className="service-cta-banner">
            <h3>Need Help Choosing the Right Solution?</h3>
            <p>Speak with our team to discuss your financial needs and explore the services that may be suitable for you.</p>
            <Button to="/contact" variant="primary" size="md">
              Talk to Our Team →
            </Button>
          </div>

          {/* Related Services */}
          <div className="related-services-section">
            <h2 className="service-block-heading" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              Related Financial Services
            </h2>
            <div className="related-services-grid">
              {relatedServices.map((relService) => (
                <ServiceCard key={relService.id} service={relService} />
              ))}
            </div>
          </div>
        </Container>
      </section>

      <style>{`
        .service-detail-header-bg {
          background-color: var(--color-background);
          border-bottom: 1px solid var(--color-border);
          padding: var(--spacing-xl) 0 var(--spacing-xxl) 0;
        }

        .service-detail-top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          gap: 12px;
        }

        .back-services-link {
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
        }

        .back-services-link:hover {
          color: var(--color-primary-hover);
        }

        .service-breadcrumb {
          font-size: 0.875rem;
          color: var(--color-muted);
        }

        .service-breadcrumb a {
          color: var(--color-secondary);
          text-decoration: none;
        }

        .service-hero-content {
          max-width: 820px;
        }

        .service-hero-icon-box {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background-color: var(--color-primary);
          color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-md);
          box-shadow: var(--shadow-sm);
        }

        .service-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-dark);
          margin-bottom: var(--spacing-xs);
        }

        .service-hero-subtitle {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--color-primary);
          line-height: 1.5;
          margin: 0 0 var(--spacing-md) 0;
        }

        .service-hero-intro {
          font-size: 1.05rem;
          line-height: 1.65;
          color: var(--color-secondary);
          margin: 0;
        }

        .service-content-wrapper {
          max-width: 900px;
          margin: 0 auto;
        }

        .service-content-block {
          margin-bottom: var(--spacing-xxl);
        }

        .service-block-heading {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--color-dark);
          margin-bottom: var(--spacing-md);
        }

        .service-overview-text {
          font-size: 1.1rem;
          line-height: 1.75;
          color: var(--color-secondary);
        }

        .service-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .service-benefit-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-md) var(--spacing-lg);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-weight: 500;
          color: var(--color-dark);
          line-height: 1.5;
        }

        .service-target-box {
          background-color: var(--color-white);
          border-left: 4px solid var(--color-primary);
          border: 1px solid var(--color-border);
          border-left-width: 4px;
          border-radius: var(--radius-sm);
          padding: var(--spacing-lg);
        }

        .service-target-box p {
          margin: 0;
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--color-dark);
        }

        .service-process-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
        }

        .service-process-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
        }

        .process-step-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-primary);
          display: block;
          margin-bottom: 4px;
        }

        .process-step-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-dark);
          margin-bottom: 6px;
        }

        .process-step-desc {
          font-size: 0.925rem;
          color: var(--color-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .service-cta-banner {
          background-color: var(--color-dark);
          color: var(--color-white);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xxl) var(--spacing-xl);
          text-align: center;
          margin-top: var(--spacing-xxl);
          margin-bottom: var(--spacing-xxl);
        }

        .service-cta-banner h3 {
          color: var(--color-white);
          font-size: 1.75rem;
          margin-bottom: var(--spacing-xs);
        }

        .service-cta-banner p {
          color: var(--color-border);
          font-size: 1.05rem;
          margin-bottom: var(--spacing-lg);
        }

        .related-services-section {
          margin-top: var(--spacing-xxl);
        }

        .related-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
        }

        @media (max-width: 992px) {
          .service-benefits-grid {
            grid-template-columns: 1fr;
          }

          .service-process-grid {
            grid-template-columns: 1fr;
          }

          .related-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .service-hero-title {
            font-size: 1.875rem;
          }

          .related-services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
};

export default ServiceDetail;
