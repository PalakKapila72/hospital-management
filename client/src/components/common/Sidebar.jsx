import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  CalendarCheck,
  CalendarPlus,
  FileText,
  Pill,
  CreditCard,
  Receipt,
  BarChart3,
  UserCheck,
  User,
  LogOut,
  Hospital,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ currentTab, onSelectTab, isMobileOpen, onCloseMobile }) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, section: 'Core' },
    { id: 'patients', label: 'Patients', icon: Users, section: 'Clinical' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, section: 'Clinical' },
    { id: 'departments', label: 'Departments', icon: Building2, section: 'Clinical' },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, section: 'Scheduling' },
    { id: 'book-appointment', label: 'Book Appointment', icon: CalendarPlus, section: 'Scheduling' },
    { id: 'medical-records', label: 'Medical Records', icon: FileText, section: 'Clinical Records' },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, section: 'Clinical Records' },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, section: 'Finance' },
    { id: 'payments', label: 'Payments Ledger', icon: CreditCard, section: 'Finance' },
    { id: 'reports', label: 'DBMS Reports', icon: BarChart3, section: 'Analytics' },
    ...(isAdmin ? [{ id: 'users', label: 'Staff Accounts', icon: UserCheck, section: 'Administration' }] : []),
    { id: 'profile', label: 'Account & Security', icon: User, section: 'Settings' },
  ];

  const sections = ['Core', 'Clinical', 'Scheduling', 'Clinical Records', 'Finance', 'Analytics', 'Administration', 'Settings'];

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="sidebar-logo-badge">
              <Hospital size={22} />
            </div>
            <div className="sidebar-brand-text">
              <h1>Apex General</h1>
              <span>DBMS Portal</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {sections.map((sec) => {
            const items = navItems.filter((item) => item.section === sec);
            if (items.length === 0) return null;
            return (
              <div key={sec} style={{ marginBottom: '0.4rem' }}>
                <div className="nav-section-title">{sec}</div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar-badge">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-meta">
              <div className="user-display-name" title={user?.full_name}>
                {user?.full_name || 'Staff User'}
              </div>
              <div className="user-role-chip">
                <Shield size={10} />
                <span>{user?.role || 'Staff'}</span>
              </div>
            </div>
          </div>
          <button
            className="sidebar-signout-btn"
            title="Sign out of account"
            onClick={logout}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};
