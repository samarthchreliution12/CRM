import React from "react";

/**
 * Service3DIcon - Simple, Clean, Professional Financial Icons for Parshwa Consultancy
 * Palette: Parshwa Crimson Maroon (#9E241D), Charcoal Slate (#475569 / #0F172A), Soft Tint (rgba(158, 36, 29, 0.08)).
 * Zero gold color - clean, flat, modern professional financial design.
 */
export const Service3DIcon = ({ slug, size = 32, className = "" }) => {
  const renderIconContent = () => {
    switch (slug) {
      case "demat":
        // Demat Services: Electronic Security Vault & Digital Certificate
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" strokeWidth="2" />
            <rect x="12" y="24" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
            <rect x="12" y="30" width="10" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="34" cy="28" r="4" fill="currentColor" opacity="0.9" />
            <path d="M34 26V30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case "mutual-fund":
        // Mutual Fund Advisory: Goal-Aligned Growth & Diversified Allocation
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <rect x="8" y="28" width="7" height="12" rx="1.5" fill="currentColor" opacity="0.6" />
            <rect x="18" y="20" width="7" height="20" rx="1.5" fill="currentColor" opacity="0.8" />
            <rect x="28" y="12" width="7" height="28" rx="1.5" fill="currentColor" />
            <path d="M8 24C16 18 24 14 38 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M38 8H30M38 8V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case "ipo":
        // IPO Services: Primary Market Share Listing & Ascending Rocket
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <rect x="8" y="10" width="32" height="30" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M16 28L24 16L32 28H28V34H20V28H16Z" fill="currentColor" />
            <line x1="14" y1="36" x2="34" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case "trading":
        // Trading Account: Professional Candlestick Chart
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <line x1="14" y1="8" x2="14" y2="40" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <rect x="10" y="14" width="8" height="16" rx="1.5" fill="currentColor" opacity="0.8" />
            <line x1="28" y1="6" x2="28" y2="42" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <rect x="24" y="10" width="8" height="22" rx="1.5" fill="currentColor" />
            <line x1="40" y1="12" x2="40" y2="38" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <rect x="36" y="18" width="8" height="12" rx="1.5" fill="currentColor" opacity="0.6" />
          </svg>
        );

      case "slbm":
        // SLBM Services: Two-Way Securities Lending & Borrowing Arrows
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <path d="M12 20H36M36 20L28 12M36 20L28 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 32H12M12 32L20 24M12 32L20 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case "insurance":
        // Insurance Advisory: Financial Safety Shield
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <path d="M24 6L38 12V22C38 32 24 40 24 40C24 40 10 32 10 22V12L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
            <path d="M18 22L22 26L30 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case "physical-shares":
        // Physical Shares: Legacy Paper Share Certificate & Folder
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <path d="M10 14C10 12.3 11.3 11 13 11H22L26 15H37C38.7 15 40 16.3 40 18V37C40 38.7 38.7 40 37 40H13C11.3 40 10 38.7 10 37V14Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <line x1="16" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            <line x1="16" y1="30" x2="28" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        );

      case "iepf":
        // IEPF Services: Unclaimed Asset Vault & Key Lock
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <rect x="10" y="18" width="28" height="22" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M16 18V14C16 9.6 19.6 6 24 6C28.4 6 32 9.6 32 14V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="27" r="3" fill="currentColor" />
            <line x1="24" y1="30" x2="24" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case "pms":
        // PMS: Concentrated Portfolio Briefcase & Alpha Trajectory
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <rect x="8" y="16" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M18 16V12C18 10.3 19.3 9 21 9H27C28.7 9 30 10.3 30 12V16" stroke="currentColor" strokeWidth="2" />
            <path d="M14 30C20 26 26 22 34 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case "aif":
        // AIF: Alternative Asset Crystal / Structured Instrument
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <path d="M24 6L38 16V32L24 42L10 32V16L24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
            <path d="M24 6V42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            <path d="M10 16L24 24L38 16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="simple-service-icon-svg">
            <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" fill="none" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`simple-service-icon-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {renderIconContent()}

      <style>{`
        .simple-service-icon-svg {
          width: 100%;
          height: 100%;
          transition: transform 0.25s ease;
        }

        .website-service-card:hover .simple-service-icon-svg,
        .simple-service-icon-container:hover .simple-service-icon-svg {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default Service3DIcon;
