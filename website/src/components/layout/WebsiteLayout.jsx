import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useScrollToTop } from '../../hooks/useScrollToTop';

export const WebsiteLayout = ({ children }) => {
  // Automatically scroll to top on page navigation
  useScrollToTop();

  return (
    <div className="website-root-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main className="website-main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};
