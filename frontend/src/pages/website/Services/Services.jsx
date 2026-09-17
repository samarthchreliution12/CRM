import React from 'react';
import SEO from '../../../components/SEO';
import { Container } from '../../../components/website/common/Container';
import { SectionHeading } from '../../../components/website/common/SectionHeading';
import { ServiceGrid } from '../../../components/website/services/ServiceGrid';

export const Services = () => {
  const servicesSchema = [
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
          "name": "Financial Services",
          "item": "https://parshwaconsultancy.in/services"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Parshwa Consultancy Financial Services Catalog",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Demat Services", "url": "https://parshwaconsultancy.in/services/demat" },
        { "@type": "ListItem", "position": 2, "name": "Mutual Fund Advisory", "url": "https://parshwaconsultancy.in/services/mutual-fund" },
        { "@type": "ListItem", "position": 3, "name": "IPO Services", "url": "https://parshwaconsultancy.in/services/ipo" },
        { "@type": "ListItem", "position": 4, "name": "SLBM Services", "url": "https://parshwaconsultancy.in/services/slbm" },
        { "@type": "ListItem", "position": 5, "name": "Insurance Advisory", "url": "https://parshwaconsultancy.in/services/insurance" },
        { "@type": "ListItem", "position": 6, "name": "Physical Shares Solutions", "url": "https://parshwaconsultancy.in/services/physical-shares" },
        { "@type": "ListItem", "position": 7, "name": "IEPF Services", "url": "https://parshwaconsultancy.in/services/iepf" },
        { "@type": "ListItem", "position": 8, "name": "Trading Account Services", "url": "https://parshwaconsultancy.in/services/trading" },
        { "@type": "ListItem", "position": 9, "name": "Portfolio Management Services (PMS)", "url": "https://parshwaconsultancy.in/services/pms" },
        { "@type": "ListItem", "position": 10, "name": "Alternative Investment Funds (AIF)", "url": "https://parshwaconsultancy.in/services/aif" }
      ]
    }
  ];

  return (
    <>
      <SEO
        title="Financial Services Catalog - Investments, Demat & Recovery"
        description="Comprehensive catalog of financial solutions: Demat, Mutual Funds, IPO, SLBM, Term & Health Insurance, Physical Share Dematerialization, IEPF Recovery, Trading & PMS."
        canonical="/services"
        keywords={['Financial Services Catalog', 'Mutual Funds Advisor', 'IEPF Share Recovery', 'Physical Shares Dematerialization', 'Demat Account Opening']}
        schemaData={servicesSchema}
      />
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
