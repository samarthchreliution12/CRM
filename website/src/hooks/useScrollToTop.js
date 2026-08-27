import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to reset window scroll position to top when navigating routes
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);
};
