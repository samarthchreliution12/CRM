import React, { useEffect, useState } from 'react';
import { Container } from '../common/Container';
import { Navbar } from './Navbar';
import { MobileMenu } from './MobileMenu';
import { useMobileMenu } from '../../../hooks/website/useMobileMenu';

export const Header = () => {
  const { isOpen, toggle, close } = useMobileMenu();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`website-header header-animate-in ${isScrolled ? 'is-scrolled' : ''}`}
    >
      <Container style={{ width: '100%' }}>
        <Navbar onMobileToggle={toggle} />
      </Container>
      <MobileMenu isOpen={isOpen} onClose={close} />

      <style>{`
        .website-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--header-height, 80px);
          background-color: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border, #E2E2DF);
          z-index: 1000;
          display: flex;
          align-items: center;
          transition: background-color 0.3s ease, boxShadow 0.3s ease, border-color 0.3s ease;
        }

        .website-header.is-scrolled {
          background-color: rgba(255, 255, 255, 0.98);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border-bottom-color: rgba(158, 36, 29, 0.15);
        }
      `}</style>
    </header>
  );
};

export default Header;
