import { useEffect, useRef, useState } from 'react';

export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced-motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          if (options.triggerOnce !== false) {
            observer.unobserve(element);
          }
        }
      },
      {
        threshold: options.threshold !== undefined ? options.threshold : 0.15,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    );

    observer.observe(element);
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.triggerOnce]);

  return [ref, isRevealed];
};

export default useScrollReveal;
