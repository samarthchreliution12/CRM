import React from 'react';
import SEO from '../../../components/SEO';
import { AboutSection } from '../../../components/website/about/AboutSection';
import { TrustMetrics } from '../../../components/website/home/TrustMetrics';
import { WhyParshwa } from '../../../components/website/home/WhyParshwa';

export const About = () => {
  const aboutSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Parshwa Consultancy",
      "url": "https://parshwaconsultancy.in/about",
      "logo": "https://parshwaconsultancy.in/logo.png",
      "telephone": "+91 98765 43210",
      "email": "info@parshwaconsultancy.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ahmedabad",
        "addressRegion": "Gujarat",
        "addressCountry": "India"
      },
      "description": "Over 35 years of dedicated experience in investment consulting, mutual funds, physical share dematerialization, and unclaimed investment recovery."
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
          "name": "About Us",
          "item": "https://parshwaconsultancy.in/about"
        }
      ]
    }
  ];

  return (
    <>
      <SEO
        title="About Us - 35+ Years in Financial Growth & Recovery"
        description="Learn about Parshwa Consultancy, our 35+ years legacy in financial advisory, mutual fund management, and specialized physical share & IEPF investment recovery."
        canonical="/about"
        keywords={['About Parshwa Consultancy', 'Financial Advisors Ahmedabad', 'Investment Recovery Experts', '35 Years Financial Legacy']}
        schemaData={aboutSchemas}
      />
      <AboutSection />
      <TrustMetrics />
      <WhyParshwa />
    </>
  );
};

export default About;
