import React from 'react';
import { ShieldCheck, Menu, ChevronRight, Home, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title, subtitle, breadcrumbs = [], onToggleMobile }) => {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="header-menu-toggle"
          onClick={onToggleMobile}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-title-group">
          <div className="header-breadcrumbs">
            <Home size={12} style={{ color: 'var(--text-light)' }} />
            <span>Portal</span>
            <ChevronRight size={10} style={{ color: 'var(--text-light)' }} />
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span className={idx === breadcrumbs.length - 1 ? 'active' : ''}>
                  {crumb}
                </span>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight size={10} style={{ color: 'var(--text-light)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <h2>{title}</h2>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-actions">
        {/* Live PostgreSQL Connection Badge */}
        <div className="live-status-pill" title="Live connection active on PostgreSQL database">
          <span className="pulse-beacon" />
          <Database size={13} style={{ color: 'var(--mint-600)' }} />
          <span>PostgreSQL Active</span>
        </div>

        {/* User Role Badge */}
        <div className="header-role-badge">
          <ShieldCheck size={15} color="var(--teal-600)" />
          <span>Role: <strong>{user?.role || 'User'}</strong></span>
        </div>
      </div>
    </header>
  );
};
