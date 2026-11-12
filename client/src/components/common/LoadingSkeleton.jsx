import React from 'react';

export const LoadingSkeleton = ({ variant = 'card', count = 1, height, width }) => {
  if (variant === 'table') {
    return (
      <div className="table-responsive" style={{ border: 'none' }}>
        <table className="table">
          <thead>
            <tr>
              <th><div className="skeleton-box skeleton-text" style={{ width: '60%' }} /></th>
              <th><div className="skeleton-box skeleton-text" style={{ width: '70%' }} /></th>
              <th><div className="skeleton-box skeleton-text" style={{ width: '50%' }} /></th>
              <th><div className="skeleton-box skeleton-text" style={{ width: '40%' }} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="skeleton-box skeleton-circle" style={{ width: '36px', height: '36px' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton-box skeleton-text" style={{ width: '80%', height: '14px' }} />
                      <div className="skeleton-box skeleton-text" style={{ width: '45%', height: '10px', marginBottom: 0 }} />
                    </div>
                  </div>
                </td>
                <td><div className="skeleton-box skeleton-text" style={{ width: '65%' }} /></td>
                <td><div className="skeleton-box skeleton-text" style={{ width: '55%' }} /></td>
                <td><div className="skeleton-box" style={{ width: '75px', height: '22px', borderRadius: '9999px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === 'stat-grid') {
    return (
      <div className="stats-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="stat-card">
            <div style={{ flex: 1 }}>
              <div className="skeleton-box skeleton-text" style={{ width: '50%', height: '12px' }} />
              <div className="skeleton-box skeleton-text" style={{ width: '70%', height: '28px', marginTop: '0.5rem' }} />
              <div className="skeleton-box skeleton-text" style={{ width: '60%', height: '10px', marginTop: '0.25rem', marginBottom: 0 }} />
            </div>
            <div className="skeleton-box" style={{ width: '50px', height: '50px', borderRadius: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: width || '100%' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="skeleton-box skeleton-text"
            style={{ height: height || '14px', width: width || '100%', marginBottom: 0 }}
          />
        ))}
      </div>
    );
  }

  // Default card variant
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="skeleton-box skeleton-text" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-box skeleton-text" style={{ width: '80px', height: '18px' }} />
          </div>
          <div className="skeleton-box skeleton-text" style={{ width: '90%', height: '12px' }} />
          <div className="skeleton-box skeleton-text" style={{ width: '75%', height: '12px' }} />
          <div className="skeleton-box skeleton-text" style={{ width: '50%', height: '12px', marginBottom: 0 }} />
        </div>
      ))}
    </div>
  );
};
