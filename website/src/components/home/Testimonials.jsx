import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';

const testimonialsData = [
  {
    id: 1,
    name: 'Rajesh Shah',
    role: 'Managing Director',
    company: 'Apex Logistics & Freight',
    rating: 5,
    quote: 'Parshwa Consultancy helped our family recover 30-year-old lost physical share certificates from IEPF seamlessly. Their legal and documentation team handled everything end-to-end without hassle.',
    avatarBg: '#8B231D',
    initials: 'RS',
    verified: true,
  },
  {
    id: 2,
    name: 'Meera Patel',
    role: 'Senior Software Architect',
    company: 'TechCorp Solutions',
    rating: 5,
    quote: 'Exceptional mutual fund portfolio advisory. Their data-driven asset allocation aligned perfectly with my retirement roadmap and risk capacity. Highly transparent guidance.',
    avatarBg: '#4E565A',
    initials: 'MP',
    verified: true,
  },
  {
    id: 3,
    name: 'Vikramaditya Mehta',
    role: 'Founder & CEO',
    company: 'Mehta Global Trading',
    rating: 5,
    quote: 'As an HNI investor, I value disciplined wealth preservation. Parshwa Consultancy has consistently delivered superior quarterly portfolio rebalancing and risk management.',
    avatarBg: '#202427',
    initials: 'VM',
    verified: true,
  },
  {
    id: 4,
    name: 'Ananya Desai',
    role: 'NRI Investor',
    company: 'London, UK',
    rating: 5,
    quote: 'Managing Indian financial investments from abroad used to be stressful until I partnered with Parshwa Consultancy. Their team handles regulatory compliance and mutual funds flawlessly.',
    avatarBg: '#8B231D',
    initials: 'AD',
    verified: true,
  },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = testimonialsData.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-play timer with pause on hover/touch
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch Swipe Handlers for mobile device support
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const swipeDelta = touchStartX.current - touchEndX.current;

    if (touchEndX.current !== 0) {
      if (swipeDelta > swipeThreshold) {
        nextSlide();
      } else if (swipeDelta < -swipeThreshold) {
        prevSlide();
      }
    }
    // Reset touch coordinates and resume auto-play
    touchStartX.current = 0;
    touchEndX.current = 0;
    setIsPaused(false);
  };

  const current = testimonialsData[currentIndex];

  return (
    <section className="website-section website-section-light testimonials-section">
      <Container>
        <SectionHeading
          badge="Client Voice"
          title="What Our Clients Say"
          subtitle="Real stories of financial growth, portfolio management, and successful investment recovery."
          center={true}
        />

        <div
          className="testimonials-carousel-container"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            maxWidth: '820px',
            margin: '0 auto',
            padding: '0 48px',
          }}
        >
          {/* Active Testimonial Card */}
          <div
            key={current.id}
            className="testimonial-card fade-in"
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-xxl) var(--spacing-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
            }}
          >
            {/* Header: Rating Stars & Verified Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {/* Star Rating */}
              <div style={{ color: '#FFB800', fontSize: '1.25rem', letterSpacing: '2px' }}>
                {'★'.repeat(current.rating)}
              </div>

              {/* Verified Client Badge */}
              {current.verified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    color: '#28A745',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(40, 167, 69, 0.2)',
                  }}
                >
                  ✓ Verified Client
                </span>
              )}
            </div>

            {/* Client Quote */}
            <blockquote
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.6,
                color: 'var(--color-dark)',
                fontStyle: 'italic',
                marginBottom: 'var(--spacing-xl)',
                margin: '0 0 var(--spacing-xl) 0',
              }}
            >
              "{current.quote}"
            </blockquote>

            {/* Client Info & Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Avatar Circle */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: current.avatarBg,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0,
                }}
              >
                {current.initials}
              </div>

              {/* Client Details */}
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-dark)' }}>
                  {current.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
                  {current.role} &bull; <span style={{ color: 'var(--color-muted)' }}>{current.company}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous testimonial"
            style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-dark)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-white)';
              e.currentTarget.style.color = 'var(--color-dark)';
            }}
          >
            ‹
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next testimonial"
            style={{
              position: 'absolute',
              top: '50%',
              right: '0',
              transform: 'translateY(-50%)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-dark)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-white)';
              e.currentTarget.style.color = 'var(--color-dark)';
            }}
          >
            ›
          </button>

          {/* Indicator Dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: 'var(--spacing-xl)',
            }}
          >
            {testimonialsData.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    width: isActive ? '24px' : '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>
        </div>
      </Container>

      <style>{`
        @media (max-width: 768px) {
          .testimonials-carousel-container {
            padding: 0 !important;
          }
          
          .testimonial-card {
            padding: var(--spacing-xl) var(--spacing-md) !important;
          }
          
          blockquote {
            font-size: 1rem !important;
          }
        }
      `}</style>
    </section>
  );
};
