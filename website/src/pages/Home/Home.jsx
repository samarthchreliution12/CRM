import React from 'react';
import { Hero } from '../../components/home/Hero';
import { TrustMetrics } from '../../components/home/TrustMetrics';
import { AboutPreview } from '../../components/home/AboutPreview';
import { ServicesPreview } from '../../components/home/ServicesPreview';
import { InvestmentRecovery } from '../../components/home/InvestmentRecovery';
import { WhyParshwa } from '../../components/home/WhyParshwa';
import { WhoWeServe } from '../../components/home/WhoWeServe';
import { AssociateWithUs } from '../../components/home/AssociateWithUs';
import { Testimonials } from '../../components/home/Testimonials';
import { ContactPreview } from '../../components/home/ContactPreview';

export const Home = () => {
  return (
    <>
      <Hero />
      <TrustMetrics />
      <AboutPreview />
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
