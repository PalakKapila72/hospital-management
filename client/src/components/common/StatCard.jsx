import React from 'react';

export const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  variant = 'teal',
  trend,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <div className="stat-value">{value}</div>
        {subtext && (
          <div className="stat-sub">
            {trend && <span style={{ fontWeight: 600, color: 'var(--mint-600)' }}>{trend}</span>}
            <span>{subtext}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper ${variant}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
