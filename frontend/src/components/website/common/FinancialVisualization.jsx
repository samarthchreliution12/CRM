import React from 'react';

export const FinancialVisualization = ({ title = 'Strategic Asset Growth Trajectory' }) => {
  return (
    <div className="financial-vis-card">
      <div className="vis-header">
        <span className="vis-dot pulsing" />
        <span className="vis-title">{title}</span>
      </div>

      <div className="vis-svg-container">
        <svg viewBox="0 0 400 160" className="vis-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary, #9E241D)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-primary, #9E241D)" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C4726C" />
              <stop offset="50%" stopColor="var(--color-primary, #9E241D)" />
              <stop offset="100%" stopColor="#861D18" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(0,0,0,0.05)" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            d="M 10 140 C 60 135, 100 120, 150 95 C 200 70, 250 80, 300 45 C 340 25, 370 20, 390 15 L 390 150 L 10 150 Z"
            fill="url(#chartGradient)"
          />

          {/* Growth Curve */}
          <path
            d="M 10 140 C 60 135, 100 120, 150 95 C 200 70, 250 80, 300 45 C 340 25, 370 20, 390 15"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="chart-path-animated"
          />

          {/* Data Nodes */}
          <circle cx="150" cy="95" r="4" fill="#ffffff" stroke="var(--color-primary, #9E241D)" strokeWidth="2" />
          <circle cx="300" cy="45" r="4" fill="#ffffff" stroke="var(--color-primary, #9E241D)" strokeWidth="2" />
          <circle cx="390" cy="15" r="5" fill="var(--color-primary, #9E241D)" stroke="#ffffff" strokeWidth="2" className="pulsing-node" />
        </svg>
      </div>

      <div className="vis-footer-legend">
        <span className="legend-item"><span className="legend-dot active" /> Disciplined Wealth Accumulation</span>
        <span className="legend-item"><span className="legend-dot protection" /> IEPF Asset Protection</span>
      </div>

      <style>{`
        .financial-vis-card {
          background-color: var(--color-white);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }

        .vis-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--spacing-sm);
        }

        .vis-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-primary);
        }

        .vis-dot.pulsing {
          animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
          0% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.4; transform: scale(0.9); }
        }

        .vis-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-dark);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .vis-svg-container {
          width: 100%;
          height: auto;
          overflow: hidden;
        }

        .vis-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .chart-path-animated {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: drawPath 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes drawPath {
          to {
            stroke-dashoffset: 0;
          }
        }

        .vis-footer-legend {
          display: flex;
          gap: 16px;
          margin-top: var(--spacing-sm);
          font-size: 0.75rem;
          color: var(--color-secondary);
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default FinancialVisualization;
