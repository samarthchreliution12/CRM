import React from 'react';
import { Hero } from '../../../components/website/home/Hero';
import { TrustMetrics } from '../../../components/website/home/TrustMetrics';
import { AboutPreview } from '../../../components/website/home/AboutPreview';
import { ServicesPreview } from '../../../components/website/home/ServicesPreview';
import { InvestmentRecovery } from '../../../components/website/home/InvestmentRecovery';
import { WhyParshwa } from '../../../components/website/home/WhyParshwa';
import { WhoWeServe } from '../../../components/website/home/WhoWeServe';
import { AssociateWithUs } from '../../../components/website/home/AssociateWithUs';
import { Testimonials } from '../../../components/website/home/Testimonials';
import { ContactPreview } from '../../../components/website/home/ContactPreview';

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
