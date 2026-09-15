import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useScrollToTop } from '../../../hooks/website/useScrollToTop';
import '../../../styles/website/globals.css';

export const WebsiteLayout = ({ children }) => {
  // Automatically scroll to top on page navigation
  useScrollToTop();

  return (
    <div className="website-root-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main className="website-main-content website-page-transition">
        {children}
      </main>
      <Footer />

      <style>{`
        .website-page-transition {
          animation: pageFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .website-page-transition {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default WebsiteLayout;
