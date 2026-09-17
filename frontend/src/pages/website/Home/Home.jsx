import React from 'react';
import SEO from '../../../components/SEO';
import { Hero } from '../../../components/website/home/Hero';
import { TrustMetrics } from '../../../components/website/home/TrustMetrics';
import { AboutPreview } from '../../../components/website/home/AboutPreview';
import { FinancialJourney } from '../../../components/website/home/FinancialJourney';
import { ServicesPreview } from '../../../components/website/home/ServicesPreview';
import { InvestmentRecovery } from '../../../components/website/home/InvestmentRecovery';
import { WhyParshwa } from '../../../components/website/home/WhyParshwa';
import { WhoWeServe } from '../../../components/website/home/WhoWeServe';
import { AssociateWithUs } from '../../../components/website/home/AssociateWithUs';
import { Testimonials } from '../../../components/website/home/Testimonials';
import { ContactPreview } from '../../../components/website/home/ContactPreview';

export const Home = () => {
  const homeSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "name": "Parshwa Consultancy",
      "url": "https://parshwaconsultancy.in/",
      "logo": "https://parshwaconsultancy.in/logo.png",
      "telephone": "+91 98765 43210",
      "email": "info@parshwaconsultancy.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "addressCountry": "India"
      },
      "description": "Trusted partner in equity advisory, mutual funds, IPO applications, physical share dematerialization, and IEPF investment recovery services.",
      "priceRange": "$$"
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Parshwa Consultancy",
      "url": "https://parshwaconsultancy.in/"
    }
  ];

  return (
    <>
      <SEO
        title="Investment & Financial Consulting Experts"
        description="Parshwa Consultancy provides comprehensive financial advisory including mutual funds, equity investment, Demat, physical share dematerialization, and IEPF recovery in Ahmedabad, Gujarat."
        canonical="/"
        keywords={['Parshwa Consultancy', 'Investment Recovery', 'Physical Shares Demat', 'IEPF Recovery', 'Mutual Funds Advisory', 'Ahmedabad Financial Consultant']}
        schemaData={homeSchemas}
      />
      <Hero />
      <TrustMetrics />
      <AboutPreview />
      <FinancialJourney />
      <ServicesPreview />
      <InvestmentRecovery />
      <WhyParshwa />
      <WhoWeServe />
      <AssociateWithUs />
      <Testimonials />
      <ContactPreview />
    </>
  );
};

export default Home;
