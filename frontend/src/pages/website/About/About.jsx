import React from 'react';
import { AboutSection } from '../../../components/website/about/AboutSection';
import { TrustMetrics } from '../../../components/website/home/TrustMetrics';
import { WhyParshwa } from '../../../components/website/home/WhyParshwa';

export const About = () => {
  return (
    <>
      <AboutSection />
      <TrustMetrics />
      <WhyParshwa />
    </>
  );
};

export default About;
