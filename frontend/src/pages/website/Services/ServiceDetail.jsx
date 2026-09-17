import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { Container } from '../../../components/website/common/Container';
import { Button } from '../../../components/website/common/Button';
import { ServiceCard } from '../../../components/website/services/ServiceCard';
import Service3DIcon from '../../../components/website/services/Service3DIcon';
import { servicesData } from '../../../data/website/services';
import { useScrollReveal } from '../../../hooks/website/useScrollReveal';

// Service Image Map - easily add local images (e.g., demat.jpg, mutual-fund.jpg, etc.)
const serviceImageMap = {
  // Example: demat: require('../../../assets/website/services/demat.jpg'),
};

const ServiceHeroVisual = ({ service }) => {
  const imageSrc = service.image || serviceImageMap[service.slug];

  if (imageSrc) {
    return (
      <div className="service-hero-image-wrapper">
        <img
          src={imageSrc}
          alt={`${service.title} - Parshwa Consultancy`}
          className="service-hero-img"
        />
        <div className="service-hero-img-overlay" />
        <div className="service-hero-3d-badge">
          <Service3DIcon slug={service.slug} size={48} />
        </div>
      </div>
    );
  }

  // Styled Premium Financial Visual Card (when image file is pending)
  return (
    <div className="service-hero-placeholder-card">
      <div className="placeholder-glow-bg" />
      <div className="placeholder-content">
        <div className="placeholder-icon-circle">
          <Service3DIcon slug={service.slug} size={64} />
        </div>
        <span className="placeholder-badge">PARSHWA CONSULTANCY</span>
        <h4 className="placeholder-title">{service.title}</h4>
        <p className="placeholder-sub">Trusted Financial Advisory & Operational Support</p>
        <div className="placeholder-features">
          <span>✓ SEBI & Regulatory Compliant</span>
          <span>✓ Dedicated Relationship Desk</span>
        </div>
      </div>
    </div>
  );
};

// Service-Specific Feature Visual Widget
const ServiceVisualWidget = ({ slug }) => {
  if (slug === 'demat') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Digital Securities Vault</h3>
        <p className="widget-card-sub">Integrated electronic holding repository across key investment instruments.</p>
        <div className="widget-grid-2x2">
          <div className="widget-chip">
            <span className="chip-icon">📈</span>
            <div>
              <strong>Equity Shares</strong>
              <small>NSDL / CDSL Book Entry</small>
            </div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">📊</span>
            <div>
              <strong>Mutual Fund Units</strong>
              <small>Electronic Demat Units</small>
            </div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">🏛️</span>
            <div>
              <strong>Government Bonds</strong>
              <small>Sovereign Debt & T-Bills</small>
            </div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">🥇</span>
            <div>
              <strong>Sovereign Gold Bonds</strong>
              <small>RBI SGB Demat Credits</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'mutual-fund') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Goal-Aligned Asset Allocation</h3>
        <p className="widget-card-sub">Diversified categories designed to optimize return across market cycles.</p>
        <div className="allocation-bars">
          <div className="alloc-row">
            <span className="alloc-label">Equity Growth Schemes (60%)</span>
            <div className="alloc-bar-track"><div className="alloc-bar-fill" style={{ width: '60%', backgroundColor: '#9E241D' }} /></div>
          </div>
          <div className="alloc-row">
            <span className="alloc-label">Fixed Income & Debt (25%)</span>
            <div className="alloc-bar-track"><div className="alloc-bar-fill" style={{ width: '25%', backgroundColor: '#2563EB' }} /></div>
          </div>
          <div className="alloc-row">
            <span className="alloc-label">Hybrid & Index Funds (15%)</span>
            <div className="alloc-bar-track"><div className="alloc-bar-fill" style={{ width: '15%', backgroundColor: '#059669' }} /></div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'ipo') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">IPO Application Flow</h3>
        <p className="widget-card-sub">Structured primary market participation workflow.</p>
        <div className="flow-steps-horizontal">
          <div className="flow-pill"><span>1. RHP Research</span></div>
          <span className="flow-arrow">→</span>
          <div className="flow-pill"><span>2. ASBA / UPI Bid</span></div>
          <span className="flow-arrow">→</span>
          <div className="flow-pill"><span>3. Bank Block</span></div>
          <span className="flow-arrow">→</span>
          <div className="flow-pill"><span>4. Demat Allotment</span></div>
        </div>
      </div>
    );
  }

  if (slug === 'slbm') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">SLBM Yield Architecture</h3>
        <p className="widget-card-sub">100% Exchange Cleared Securities Lending & Borrowing.</p>
        <div className="widget-feature-list">
          <div className="feature-row">
            <span className="row-check">✓</span>
            <div><strong>Clearing Guarantee:</strong> NSCCL / ICCL 100% settlement counterparty protection.</div>
          </div>
          <div className="feature-row">
            <span className="row-check">✓</span>
            <div><strong>Corporate Action Rights:</strong> All dividends and stock splits remain with the lender.</div>
          </div>
          <div className="feature-row">
            <span className="row-check">✓</span>
            <div><strong>Upfront Yield:</strong> Lending fee credited directly upon contract execution.</div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'insurance') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Family Protection Spectrum</h3>
        <p className="widget-card-sub">Essential financial safety net for dependents and life milestones.</p>
        <div className="widget-grid-2x2">
          <div className="widget-chip">
            <span className="chip-icon">🛡️</span>
            <div><strong>Pure Term Life</strong><small>High Sum-Assured</small></div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">🏥</span>
            <div><strong>Health Coverage</strong><small>Cashless Hospital Access</small></div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">🩺</span>
            <div><strong>Critical Illness</strong><small>Lump-sum Support</small></div>
          </div>
          <div className="widget-chip">
            <span className="chip-icon">👨‍👩‍👧</span>
            <div><strong>Family Floater</strong><small>Comprehensive Umbrella</small></div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'physical-shares') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Paper-to-Digital Recovery Transformation</h3>
        <p className="widget-card-sub">Resolving paper certificate bottlenecks into electronic Demat credit.</p>
        <div className="transformation-flow">
          <div className="trans-box paper-box">
            <span>📄 Legacy Paper Folio</span>
            <small>Lost Certificate / Signature Mismatch</small>
          </div>
          <span className="trans-icon">➔</span>
          <div className="trans-box digital-box">
            <span>💻 NSDL/CDSL Demat</span>
            <small>Electronic Shares & Direct Credit</small>
          </div>
        </div>
      </div>
    );
  }

  if (slug === 'iepf') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">IEPF Recovery Roadmap</h3>
        <p className="widget-card-sub">Reclaiming transferred shares and dividends from MCA IEPF Authority.</p>
        <div className="iepf-timeline">
          <div className="iepf-node"><span className="node-num">1</span><span>Folio Search</span></div>
          <div className="iepf-node"><span className="node-num">2</span><span>Form IEPF-5</span></div>
          <div className="iepf-node"><span className="node-num">3</span><span>Nodal Review</span></div>
          <div className="iepf-node"><span className="node-num">4</span><span>Demat Release</span></div>
        </div>
      </div>
    );
  }

  if (slug === 'trading') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Multi-Asset Execution Desk</h3>
        <p className="widget-card-sub">High-speed exchange access across cash and derivative segments.</p>
        <div className="trading-chip-grid">
          <span className="t-chip">Equity Cash Intraday</span>
          <span className="t-chip">Stock & Index Futures</span>
          <span className="t-chip">Options Hedging</span>
          <span className="t-chip">Currency Derivatives</span>
        </div>
      </div>
    );
  }

  if (slug === 'pms') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Direct Stock Ownership Blueprint</h3>
        <p className="widget-card-sub">Concentrated, research-backed equity portfolios for HNIs (Min ₹50L).</p>
        <div className="pms-stats-grid">
          <div className="pms-stat-box"><strong>15–25</strong><span>Concentrated Stocks</span></div>
          <div className="pms-stat-box"><strong>Direct</strong><span>Demat Ownership</span></div>
          <div className="pms-stat-box"><strong>SEBI</strong><span>Regulated Framework</span></div>
        </div>
      </div>
    );
  }

  if (slug === 'aif') {
    return (
      <div className="service-widget-card">
        <h3 className="widget-card-title">Private Market & Alternative Assets</h3>
        <p className="widget-card-sub">Institutional-grade exposure beyond public equities (Min ₹1 Cr).</p>
        <div className="aif-cat-list">
          <div className="aif-cat-item"><strong>Category I AIF:</strong> Venture Capital, Angel Funds & Infrastructure</div>
          <div className="aif-cat-item"><strong>Category II AIF:</strong> Private Equity, Real Estate Funds & Debt</div>
          <div className="aif-cat-item"><strong>Category III AIF:</strong> Hedge Funds & Complex Derivative Strategies</div>
        </div>
      </div>
    );
  }

  return null;
};

export const ServiceDetail = () => {
  const { slug } = useParams();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [heroRef, isHeroRevealed] = useScrollReveal({ threshold: 0.1 });
  const [overviewRef, isOverviewRevealed] = useScrollReveal({ threshold: 0.1 });
  const [benefitsRef, isBenefitsRevealed] = useScrollReveal({ threshold: 0.1 });
  const [offeringsRef, isOfferingsRevealed] = useScrollReveal({ threshold: 0.1 });
  const [processRef, isProcessRevealed] = useScrollReveal({ threshold: 0.1 });
  const [visualRef, isVisualRevealed] = useScrollReveal({ threshold: 0.1 });
  const [audienceRef, isAudienceRevealed] = useScrollReveal({ threshold: 0.1 });
  const [notesRef, isNotesRevealed] = useScrollReveal({ threshold: 0.1 });
  const [faqsRef, isFaqsRevealed] = useScrollReveal({ threshold: 0.1 });
  const [ctaRef, isCtaRevealed] = useScrollReveal({ threshold: 0.1 });
  const [relatedRef, isRelatedRevealed] = useScrollReveal({ threshold: 0.1 });

  // Scroll Progress Bar calculation
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const serviceSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `${service.title} - Parshwa Consultancy`,
      "serviceType": service.title,
      "provider": {
        "@type": "FinancialService",
        "name": "Parshwa Consultancy",
        "url": "https://parshwaconsultancy.in/"
      },
      "description": service.intro || service.description,
      "areaServed": "India"
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
          "name": "Services",
          "item": "https://parshwaconsultancy.in/services"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": service.title,
          "item": `https://parshwaconsultancy.in/services/${service.slug}`
        }
      ]
    },
    ...(service.faqs && service.faqs.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": service.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    }] : [])
  ];

  return (
    <>
      <SEO
        title={`${service.title} - Expert Financial Solutions`}
        description={service.intro ? `${service.intro.slice(0, 155)}...` : service.description}
        canonical={`/services/${service.slug}`}
        keywords={[service.title, 'Parshwa Consultancy', 'Financial Advisory', service.slug.replace('-', ' ')]}
        schemaData={serviceSchemas}
      />
      <article className="service-detail-page">
      {/* Top Subtle Scroll Progress Indicator */}
      <div className="service-scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />

      {/* 1. Cinematic 2-Column Hero */}
      <div className="service-detail-hero-bg">
        <Container>
          <div className="service-detail-top-nav">
            <Link to="/services" className="back-services-link">
              ← Back to All Services
            </Link>
            <div className="service-breadcrumb">
              <Link to="/">Home</Link> &nbsp;/&nbsp; <Link to="/services">Services</Link> &nbsp;/&nbsp; <span>{service.title}</span>
            </div>
          </div>

          <div ref={heroRef} className={`service-hero-grid scroll-reveal ${isHeroRevealed ? 'revealed' : ''}`}>
            <div className="service-hero-left">
              <div className="service-badge-pill">
                <span className="hero-icon-span">{service.icon}</span>
                <span>{service.categoryPill || 'FINANCIAL ADVISORY'}</span>
              </div>
              <h1 className="service-hero-title">{service.title}</h1>
              <p className="service-hero-subtitle">{service.description}</p>
              {service.intro && <p className="service-hero-intro">{service.intro}</p>}
            </div>

            <div className="service-hero-right">
              <ServiceHeroVisual service={service} />
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content Sections */}
      <section className="website-section service-main-section">
        <Container>
          <div className="service-content-container">
            {/* 2. Overview Section */}
            <div ref={overviewRef} className={`service-content-block scroll-reveal ${isOverviewRevealed ? 'revealed' : ''}`}>
              <span className="section-mini-badge">OVERVIEW</span>
              <h2 className="service-block-heading">{service.overviewHeading || 'Service Overview'}</h2>
              <div className="service-paragraphs">
                {service.overviewParagraphs ? (
                  service.overviewParagraphs.map((para, pIdx) => (
                    <p key={pIdx} className="service-overview-text">{para}</p>
                  ))
                ) : (
                  <p className="service-overview-text">{service.overview}</p>
                )}
              </div>
            </div>

            {/* 3. Key Benefits Cards */}
            {service.keyBenefits && service.keyBenefits.length > 0 && (
              <div ref={benefitsRef} className={`service-content-block scroll-reveal ${isBenefitsRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">KEY BENEFITS</span>
                <h2 className="service-block-heading">Why Choose Our {service.title}</h2>
                <div className="service-benefits-grid">
                  {service.keyBenefits.map((benefit, idx) => {
                    const isObj = typeof benefit === 'object';
                    const bTitle = isObj ? benefit.title : `Benefit 0${idx + 1}`;
                    const bDesc = isObj ? benefit.desc : benefit;

                    return (
                      <div key={idx} className="service-benefit-card" style={{ animationDelay: `${idx * 90}ms` }}>
                        <div className="benefit-card-header">
                          <span className="benefit-check-icon">✓</span>
                          <h4 className="benefit-card-title">{bTitle}</h4>
                        </div>
                        <p className="benefit-card-desc">{bDesc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. What We Offer / Services */}
            {service.whatWeOffer && service.whatWeOffer.length > 0 && (
              <div ref={offeringsRef} className={`service-content-block scroll-reveal ${isOfferingsRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">WHAT WE OFFER</span>
                <h2 className="service-block-heading">Our {service.title} Solutions</h2>
                <div className="service-offerings-grid">
                  {service.whatWeOffer.map((item, oIdx) => (
                    <div key={oIdx} className="service-offering-card" style={{ animationDelay: `${oIdx * 90}ms` }}>
                      <div className="offering-card-badge">{`0${oIdx + 1}`}</div>
                      <h4 className="offering-card-title">{item.title}</h4>
                      <p className="offering-card-desc">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Service-Specific Feature Visual Block */}
            <div ref={visualRef} className={`service-content-block scroll-reveal ${isVisualRevealed ? 'revealed' : ''}`}>
              <ServiceVisualWidget slug={service.slug} />
            </div>

            {/* 6. How It Works - Step-by-Step Process */}
            {service.process && service.process.length > 0 && (
              <div ref={processRef} className={`service-content-block scroll-reveal ${isProcessRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">PROCESS</span>
                <h2 className="service-block-heading">How It Works</h2>
                <div className="service-process-timeline">
                  {service.process.map((stepItem, pIdx) => (
                    <div key={stepItem.step} className="process-timeline-card" style={{ animationDelay: `${pIdx * 100}ms` }}>
                      <div className="timeline-node-circle">{stepItem.step}</div>
                      <div className="timeline-card-body">
                        <h4 className="process-step-title">{stepItem.title}</h4>
                        <p className="process-step-desc">{stepItem.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Who Can Benefit (Target Audience Chips) */}
            {service.whoItIsFor && (
              <div ref={audienceRef} className={`service-content-block scroll-reveal ${isAudienceRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">SUITABILITY</span>
                <h2 className="service-block-heading">Who Can Benefit</h2>
                <div className="audience-chips-grid">
                  {Array.isArray(service.whoItIsFor) ? (
                    service.whoItIsFor.map((target, tIdx) => (
                      <div key={tIdx} className="audience-chip" style={{ animationDelay: `${tIdx * 80}ms` }}>
                        <span className="chip-bullet">•</span>
                        <span>{target}</span>
                      </div>
                    ))
                  ) : (
                    <div className="service-target-box">
                      <p>{service.whoItIsFor}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. Important Considerations / Service Notes */}
            {service.importantConsiderations && service.importantConsiderations.length > 0 && (
              <div ref={notesRef} className={`service-content-block scroll-reveal ${isNotesRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">SERVICE NOTES</span>
                <h2 className="service-block-heading">Important Considerations</h2>
                <div className="service-notes-box">
                  <ul>
                    {service.importantConsiderations.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 9. Frequently Asked Questions */}
            {service.faqs && service.faqs.length > 0 && (
              <div ref={faqsRef} className={`service-content-block scroll-reveal ${isFaqsRevealed ? 'revealed' : ''}`}>
                <span className="section-mini-badge">FREQUENTLY ASKED QUESTIONS</span>
                <h2 className="service-block-heading">Frequently Asked Questions</h2>
                <div className="service-faq-accordion">
                  {service.faqs.map((faq, fIdx) => {
                    const isOpen = openFaqIndex === fIdx;
                    return (
                      <div key={fIdx} className={`faq-accordion-item ${isOpen ? 'active' : ''}`}>
                        <button
                          className="faq-accordion-question"
                          onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                          aria-expanded={isOpen}
                        >
                          <span className="faq-question-text">{faq.question}</span>
                          <span className="faq-chevron-icon">{isOpen ? '−' : '+'}</span>
                        </button>
                        <div className={`faq-accordion-answer ${isOpen ? 'show' : ''}`}>
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 10. CTA Consultation Banner */}
            <div ref={ctaRef} className={`service-cta-banner scroll-reveal ${isCtaRevealed ? 'revealed' : ''}`}>
              <h3>{service.ctaHeading || `Need Help With Your ${service.title}?`}</h3>
              <p>{service.ctaSubtext || 'Speak with our senior advisory team to discuss your specific requirements and explore customized solutions.'}</p>
              <Button to="/contact" variant="primary" size="md" className="website-btn cta-talk-btn">
                <span>{service.ctaButtonText || 'Talk to Our Team'}</span> <span className="btn-arrow">→</span>
              </Button>
            </div>

            {/* 11. Related Financial Services */}
            <div ref={relatedRef} className={`related-services-section scroll-reveal ${isRelatedRevealed ? 'revealed' : ''}`}>
              <h2 className="service-block-heading" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                Related Financial Services
              </h2>
              <div className="related-services-grid">
                {relatedServices.map((relService) => (
                  <ServiceCard key={relService.id} service={relService} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <style>{`
        /* Scroll Progress Bar */
        .service-scroll-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #9E241D 0%, #C43229 100%);
          z-index: 1200;
          transition: width 0.1s ease-out;
        }

        /* Top Hero Section */
        .service-detail-hero-bg {
          background-color: var(--color-background, #F8F9FA);
          border-bottom: 1px solid var(--color-border, #E2E2DF);
          padding: var(--spacing-xl) 0 var(--spacing-xxl) 0;
          overflow-x: hidden;
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
          color: var(--color-primary, #9E241D);
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .back-services-link:hover {
          color: var(--color-primary-hover, #861D18);
          transform: translateX(-4px);
        }

        .service-breadcrumb {
          font-size: 0.875rem;
          color: var(--color-muted, #64748B);
        }

        .service-breadcrumb a {
          color: var(--color-secondary, #475569);
          text-decoration: none;
        }

        /* 2-Column Hero Grid Reveal Animations */
        .service-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: var(--spacing-xxl, 2.5rem);
          align-items: center;
        }

        /* Initial unrevealed state for Left Content (start 60px left) */
        .service-hero-grid.scroll-reveal .service-hero-left {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        /* Initial unrevealed state for Right Image/Visual (start 60px right, 120ms stagger) */
        .service-hero-grid.scroll-reveal .service-hero-right {
          opacity: 0;
          transform: translateX(60px);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1) 120ms, transform 800ms cubic-bezier(0.16, 1, 0.3, 1) 120ms;
          will-change: opacity, transform;
        }

        /* Revealed state when hero section enters viewport */
        .service-hero-grid.scroll-reveal.revealed .service-hero-left {
          opacity: 1;
          transform: translateX(0);
        }

        .service-hero-grid.scroll-reveal.revealed .service-hero-right {
          opacity: 1;
          transform: translateX(0);
        }

        .service-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(158, 36, 29, 0.08);
          color: var(--color-primary, #9E241D);
          padding: 6px 14px;
          border-radius: var(--radius-full, 999px);
          border: 1px solid rgba(158, 36, 29, 0.15);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-bottom: var(--spacing-md);
        }

        .hero-icon-span {
          display: flex;
          align-items: center;
        }

        .service-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-dark, #0F172A);
          margin-bottom: var(--spacing-xs);
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .service-hero-subtitle {
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--color-primary, #9E241D);
          line-height: 1.5;
          margin: 0 0 var(--spacing-md) 0;
        }

        .service-hero-intro {
          font-size: 1.05rem;
          line-height: 1.65;
          color: var(--color-secondary, #475569);
          margin: 0;
        }

        /* Hero Image & Placeholder Styling */
        .service-hero-image-wrapper {
          position: relative;
          width: 100%;
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--color-border, #E2E2DF);
          aspect-ratio: 4 / 3;
        }

        .service-hero-3d-badge {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(253, 251, 247, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(212, 175, 55, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(158, 36, 29, 0.2);
          z-index: 5;
        }

        @keyframes heroImageEntrance {
          0% {
            opacity: 0;
            transform: scale(0.96);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .service-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .service-hero-image-wrapper:hover .service-hero-img {
          transform: scale(1.03);
        }

        .service-hero-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 70%, rgba(0, 0, 0, 0.05) 100%);
          pointer-events: none;
        }

        .service-hero-placeholder-card {
          position: relative;
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          color: #FFFFFF;
          border-radius: var(--radius-lg, 12px);
          padding: 2rem;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.1);
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }

        .placeholder-glow-bg {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 240px;
          height: 240px;
          background: var(--color-primary, #9E241D);
          filter: blur(90px);
          opacity: 0.35;
          pointer-events: none;
        }

        .placeholder-icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba(158, 36, 29, 0.25);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border: 1px solid rgba(255, 143, 136, 0.3);
        }

        .placeholder-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #FF8F88;
          display: block;
          margin-bottom: 6px;
        }

        .placeholder-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 4px;
        }

        .placeholder-sub {
          font-size: 0.9rem;
          color: #94A3B8;
          margin-bottom: 16px;
        }

        .placeholder-features {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.825rem;
          color: #E2E8F0;
        }

        /* Main Content Layout */
        .service-content-container {
          max-width: 920px;
          margin: 0 auto;
        }

        .service-content-block {
          margin-bottom: var(--spacing-xxl, 3rem);
        }

        .section-mini-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-primary, #9E241D);
          display: block;
          margin-bottom: 4px;
        }

        .service-block-heading {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-dark, #0F172A);
          margin-bottom: var(--spacing-md);
          line-height: 1.3;
        }

        .service-overview-text {
          font-size: 1.1rem;
          line-height: 1.75;
          color: var(--color-secondary, #475569);
          margin-bottom: 1rem;
        }

        /* Benefit Cards Grid */
        .service-benefits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg, 1.5rem);
        }

        .service-benefit-card {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-md, 8px);
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .service-benefit-card:hover {
          transform: translateY(-5px);
          border-color: rgba(158, 36, 29, 0.35);
          box-shadow: 0 12px 28px rgba(158, 36, 29, 0.08);
        }

        .benefit-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .benefit-check-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: rgba(158, 36, 29, 0.1);
          color: var(--color-primary, #9E241D);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .benefit-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-dark, #0F172A);
          margin: 0;
        }

        .benefit-card-desc {
          font-size: 0.925rem;
          color: var(--color-secondary, #475569);
          line-height: 1.6;
          margin: 0;
        }

        /* What We Offer Cards Grid */
        .service-offerings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-lg, 1.5rem);
        }

        .service-offering-card {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-md, 8px);
          padding: 1.5rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          position: relative;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .service-offering-card:hover {
          transform: translateY(-4px);
          border-color: rgba(158, 36, 29, 0.35);
          box-shadow: 0 12px 28px rgba(158, 36, 29, 0.08);
        }

        .offering-card-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-primary, #9E241D);
          background: rgba(158, 36, 29, 0.08);
          padding: 3px 10px;
          border-radius: 12px;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(158, 36, 29, 0.15);
        }

        .offering-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-dark, #0F172A);
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }

        .offering-card-desc {
          font-size: 0.95rem;
          color: var(--color-secondary, #475569);
          margin: 0;
          line-height: 1.6;
        }

        /* FAQ Accordion Styling */
        .service-faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-accordion-item {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .faq-accordion-item.active {
          border-color: rgba(158, 36, 29, 0.4);
          box-shadow: 0 6px 20px rgba(158, 36, 29, 0.06);
        }

        .faq-accordion-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: none;
          border: none;
          text-align: left;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--color-dark, #0F172A);
          cursor: pointer;
          gap: 1rem;
          transition: color 0.2s ease;
        }

        .faq-accordion-question:hover {
          color: var(--color-primary, #9E241D);
        }

        .faq-chevron-icon {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--color-primary, #9E241D);
          flex-shrink: 0;
          line-height: 1;
        }

        .faq-accordion-answer {
          padding: 0 1.5rem 1.25rem 1.5rem;
          color: var(--color-secondary, #475569);
          font-size: 0.975rem;
          line-height: 1.65;
          display: none;
        }

        .faq-accordion-answer.show {
          display: block;
        }

        /* Widget Card Styling */
        .service-widget-card {
          background-color: var(--color-background, #F8F9FA);
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-lg, 12px);
          padding: 2rem;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
        }

        .widget-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--color-dark, #0F172A);
          margin-bottom: 4px;
        }

        .widget-card-sub {
          font-size: 0.95rem;
          color: var(--color-secondary, #475569);
          margin-bottom: 1.25rem;
        }

        .widget-grid-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .widget-chip {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .widget-chip strong {
          display: block;
          font-size: 0.95rem;
          color: var(--color-dark, #0F172A);
        }

        .widget-chip small {
          font-size: 0.8rem;
          color: var(--color-secondary, #475569);
        }

        .chip-icon {
          font-size: 1.35rem;
        }

        /* Allocation Bars */
        .allocation-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alloc-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .alloc-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
        }

        .alloc-bar-track {
          height: 10px;
          background-color: #E2E8F0;
          border-radius: 999px;
          overflow: hidden;
        }

        .alloc-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 1s ease-out;
        }

        /* Flow steps horizontal */
        .flow-steps-horizontal {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .flow-pill {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .flow-arrow {
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        /* Widget feature list */
        .widget-feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background-color: #FFFFFF;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #E2E2DF);
          font-size: 0.925rem;
          color: var(--color-dark, #0F172A);
        }

        .row-check {
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        /* Transformation Flow */
        .transformation-flow {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 16px;
          flex-wrap: wrap;
        }

        .trans-box {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          flex: 1;
          min-width: 200px;
        }

        .trans-box span {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-dark, #0F172A);
          margin-bottom: 4px;
        }

        .trans-box small {
          color: var(--color-secondary, #475569);
          font-size: 0.825rem;
        }

        .trans-icon {
          font-size: 1.5rem;
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        /* IEPF Timeline */
        .iepf-timeline {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .iepf-node {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .node-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--color-primary, #9E241D);
          color: #FFFFFF;
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .iepf-node span:last-child {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
        }

        /* Trading chips */
        .trading-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .t-chip {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
        }

        /* PMS stats */
        .pms-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .pms-stat-box {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .pms-stat-box strong {
          display: block;
          font-size: 1.35rem;
          color: var(--color-primary, #9E241D);
          font-weight: 800;
        }

        .pms-stat-box span {
          font-size: 0.825rem;
          color: var(--color-secondary, #475569);
        }

        /* AIF List */
        .aif-cat-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aif-cat-item {
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          color: var(--color-dark, #0F172A);
        }

        /* Process Timeline */
        .service-process-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .process-timeline-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          border-radius: var(--radius-md, 8px);
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .process-timeline-card:hover {
          transform: translateY(-3px);
          border-color: rgba(158, 36, 29, 0.35);
          box-shadow: 0 10px 24px rgba(158, 36, 29, 0.08);
        }

        .timeline-node-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: rgba(158, 36, 29, 0.1);
          color: var(--color-primary, #9E241D);
          font-weight: 800;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(158, 36, 29, 0.2);
        }

        .process-step-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-dark, #0F172A);
          margin-bottom: 4px;
        }

        .process-step-desc {
          font-size: 0.95rem;
          color: var(--color-secondary, #475569);
          margin: 0;
          line-height: 1.55;
        }

        /* Audience Chips */
        .audience-chips-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .audience-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #FFFFFF;
          border: 1px solid var(--color-border, #E2E2DF);
          padding: 10px 18px;
          border-radius: var(--radius-full, 999px);
          font-size: 0.925rem;
          font-weight: 600;
          color: var(--color-dark, #0F172A);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .audience-chip:hover {
          transform: translateY(-2px);
          border-color: rgba(158, 36, 29, 0.3);
          box-shadow: 0 6px 16px rgba(158, 36, 29, 0.08);
        }

        .chip-bullet {
          color: var(--color-primary, #9E241D);
          font-size: 1.2rem;
        }

        /* Important Considerations Notes Box */
        .service-notes-box {
          background-color: rgba(158, 36, 29, 0.04);
          border: 1px solid rgba(158, 36, 29, 0.15);
          border-left: 4px solid var(--color-primary, #9E241D);
          border-radius: var(--radius-md, 8px);
          padding: 1.25rem 1.5rem;
        }

        .service-notes-box ul {
          margin: 0;
          padding-left: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .service-notes-box li {
          font-size: 0.95rem;
          color: var(--color-dark, #0F172A);
          line-height: 1.6;
        }

        /* CTA Banner */
        .service-cta-banner {
          background: linear-gradient(135deg, #14191C 0%, #202427 100%);
          color: #FFFFFF;
          border-radius: var(--radius-lg, 12px);
          padding: 3rem 2rem;
          text-align: center;
          margin-top: var(--spacing-xxl, 3rem);
          margin-bottom: var(--spacing-xxl, 3rem);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .service-cta-banner h3 {
          color: #FFFFFF !important;
          font-size: 1.85rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .service-cta-banner p {
          color: #E5E7E8 !important;
          font-size: 1.05rem;
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .cta-talk-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.25s ease, box-shadow 0.25s ease !important;
        }

        .cta-talk-btn .btn-arrow {
          transition: transform 0.25s ease;
        }

        .cta-talk-btn:hover {
          transform: translateY(-2px);
        }

        .cta-talk-btn:hover .btn-arrow {
          transform: translateX(5px);
        }

        /* Related Services */
        .related-services-section {
          margin-top: var(--spacing-xxl, 3rem);
        }

        .related-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg, 1.5rem);
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .service-hero-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .service-benefits-grid {
            grid-template-columns: 1fr;
          }

          .related-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .widget-grid-2x2,
          .iepf-timeline,
          .pms-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .service-hero-grid.scroll-reveal .service-hero-left {
            transform: translateX(-25px);
          }

          .service-hero-grid.scroll-reveal .service-hero-right {
            transform: translateX(25px);
          }

          .service-hero-title {
            font-size: 1.85rem;
          }

          .related-services-grid {
            grid-template-columns: 1fr;
          }

          .flow-steps-horizontal {
            flex-direction: column;
            align-items: stretch;
          }

          .flow-arrow {
            text-align: center;
            transform: rotate(90deg);
          }
        }

        /* Accessibility: Prefers Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .service-hero-grid,
          .service-hero-left,
          .service-hero-right,
          .service-content-block,
          .service-benefit-card,
          .process-timeline-card,
          .audience-chip,
          .service-cta-banner,
          .related-services-section,
          .service-hero-img {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
            will-change: auto !important;
          }
        }
      `}</style>
    </article>
    </>
  );
};

export default ServiceDetail;
