import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WebsiteLayout } from '../components/layout/WebsiteLayout';

// Pages
import Home from '../pages/Home/Home';
import About from '../pages/About/About';
import Services from '../pages/Services/Services';
import Contact from '../pages/Contact/Contact';
import NotFound from '../pages/NotFound/NotFound';

export const AppRoutes = () => {
  return (
    <WebsiteLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WebsiteLayout>
  );
};
