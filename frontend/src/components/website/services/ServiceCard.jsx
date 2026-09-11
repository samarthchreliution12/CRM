import React from 'react';
import { Link } from 'react-router-dom';

export const ServiceCard = ({ service }) => {
  const detailUrl = `/services/${service.slug}`;

  return (
    <div className="website-service-card">
      <div className="website-service-icon-wrapper">
        {service.icon}
      </div>
      <h3 className="website-service-title">{service.title}</h3>
      <p className="website-service-description">{service.description}</p>
      
      <div className="website-service-footer">
        <Link to={detailUrl} className="website-service-link">
          Learn More →
        </Link>
      </div>

      <style>{`
        .website-service-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-xl) var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
          position: relative;
        }

        .website-service-card:hover {
          transform: translateY(-6px);
          border-color: var(--color-primary);
          box-shadow: 0 12px 28px rgba(139, 35, 29, 0.12);
        }

        .website-service-icon-wrapper {
          color: var(--color-primary);
          margin-bottom: var(--spacing-md);
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          background-color: rgba(139, 35, 29, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
        }

        .website-service-card:hover .website-service-icon-wrapper {
          background-color: var(--color-primary);
          color: var(--color-white);
          transform: scale(1.08);
        }

        .website-service-title {
          color: var(--color-dark);
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 var(--spacing-xs) 0;
        }

        .website-service-description {
          color: var(--color-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 var(--spacing-lg) 0;
          flex-grow: 1;
        }

        .website-service-footer {
          margin-top: auto;
        }

        .website-service-link {
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .website-service-card:hover .website-service-link {
          transform: translateX(4px);
        }

        .website-service-link:hover {
          color: var(--color-primary-hover);
        }
      `}</style>
    </div>
  );
};
