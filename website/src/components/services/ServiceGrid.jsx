import React from 'react';
import { servicesData } from '../../data/services';
import { ServiceCard } from './ServiceCard';

export const ServiceGrid = ({ limit }) => {
  const displayedServices = limit ? servicesData.slice(0, limit) : servicesData;

  return (
    <div className="website-services-grid">
      {displayedServices.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}

      <style>{`
        .website-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-xl);
          width: 100%;
        }

        @media (max-width: 1199px) {
          .website-services-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-lg);
          }
        }

        @media (max-width: 768px) {
          .website-services-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};
