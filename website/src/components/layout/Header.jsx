import React from 'react';
import { Container } from '../common/Container';
import { Navbar } from './Navbar';
import { MobileMenu } from './MobileMenu';
import { useMobileMenu } from '../../hooks/useMobileMenu';

export const Header = () => {
  const { isOpen, toggle, close } = useMobileMenu();

  return (
    <header
      className="website-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-height)',
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Container style={{ width: '100%' }}>
        <Navbar onMobileToggle={toggle} />
      </Container>
      <MobileMenu isOpen={isOpen} onClose={close} />
    </header>
  );
};
