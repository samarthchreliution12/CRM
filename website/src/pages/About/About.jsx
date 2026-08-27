import React from 'react';
import { AboutSection } from '../../components/about/AboutSection';
import { TrustMetrics } from '../../components/home/TrustMetrics';
import { WhyParshwa } from '../../components/home/WhyParshwa';

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
