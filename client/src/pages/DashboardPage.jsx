import React, { useState, useEffect } from 'react';
import {
  Users,
  Stethoscope,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Building2,
  CreditCard,
  Clock,
  Sparkles,
  CalendarCheck,
  FilePlus2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to query live metrics from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ height: '90px' }} className="skeleton-box" />
        <LoadingSkeleton variant="stat-grid" count={6} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>PostgreSQL Connection Notice:</strong> {error}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    stats = {},
    recentAppointments = [],
    departmentStats = [],
    recentPayments = [],
    statusBreakdown = [],
  } = data || {};

  // Calculate total appointments across status breakdown
  const totalAppointmentsCount = statusBreakdown.reduce(
    (acc, cur) => acc + parseInt(cur.count || 0, 10),
    0
  );

  return (
    <div className="page-container">
      {/* Executive Welcome & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '1.5rem 1.85rem',
          borderRadius: 'var(--radius-xl)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--teal-400)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.25rem',
            }}
          >
            <Sparkles size={14} />
            <span>{todayFormatted}</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            {getGreeting()}, {user?.full_name || 'Administrator'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Live clinical database overview aggregated across {stats?.total_departments || 0} active hospital departments.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('book-appointment')}
          >
            <CalendarCheck size={16} />
            <span>Schedule Appointment</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('patients')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Users size={16} />
            <span>Patient Registry</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate('medical-records')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <FilePlus2 size={16} />
            <span>Clinical Records</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          variant="teal"
          label="Total Patients"
          value={stats?.total_patients || 0}
          subtext="Active clinical profiles"
        />

        <StatCard
          icon={Stethoscope}
          variant="blue"
          label="Medical Staff"
          value={stats?.total_doctors || 0}
          subtext={`Across ${stats?.total_departments || 0} clinical units`}
        />

        <StatCard
          icon={Calendar}
          variant="amber"
          label="Today's Appointments"
          value={stats?.today_appointments || 0}
          subtext="Scheduled consultation queue"
        />

        <StatCard
          icon={CheckCircle2}
          variant="emerald"
          label="Completed Consults"
          value={stats?.completed_appointments || 0}
          subtext={`${stats?.cancelled_appointments || 0} cancellations`}
        />

        <StatCard
          icon={TrendingUp}
          variant="emerald"
          label="Settled Revenue"
          value={formatCurrency(stats?.total_revenue)}
          subtext="Total transaction receipts"
        />

        <StatCard
          icon={AlertCircle}
          variant="rose"
          label="Pending Invoices"
          value={formatCurrency(stats?.pending_balance)}
          subtext="Outstanding patient balance"
        />
      </div>

      {/* Interactive Middle Visualizer Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Appointment Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Clock size={19} color="var(--teal-600)" />
                <span>Appointment Status Distribution</span>
              </h3>
              <p className="card-subtitle">Breakdown across all lifetime recorded bookings</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('appointments')}
            >
              <span>Manage Queue</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {statusBreakdown.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings recorded"
              description="Schedule a doctor appointment to begin tracking status metrics."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginTop: '0.5rem' }}>
              {statusBreakdown.map((item) => {
                const count = parseInt(item.count || 0, 10);
                const pct = totalAppointmentsCount > 0 ? Math.round((count / totalAppointmentsCount) * 100) : 0;
                
                let barColor = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
                if (item.status === 'Completed') barColor = 'linear-gradient(90deg, #059669, #10b981)';
                if (item.status === 'Cancelled') barColor = 'linear-gradient(90deg, #e11d48, #f43f5e)';
                if (item.status === 'No Show') barColor = 'linear-gradient(90deg, #64748b, #94a3b8)';

                return (
                  <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StatusBadge status={item.status} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                          {count} Appointments
                        </span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Workload & Staffing */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Building2 size={19} color="var(--blue-600)" />
                <span>Department Workload & Staffing</span>
              </h3>
              <p className="card-subtitle">Consultation volume distributed across clinical departments</p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('departments')}
            >
              <span>Departments</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {departmentStats.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No department data"
              description="Department statistics will populate automatically upon adding medical divisions."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {departmentStats.map((dept) => {
                const maxAppts = Math.max(
                  ...departmentStats.map((d) => parseInt(d.appointment_count || 0, 10)),
                  1
                );
                const apptCount = parseInt(dept.appointment_count || 0, 10);
                const percentage = Math.round((apptCount / maxAppts) * 100);

                return (
                  <div key={dept.department_id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.88rem' }}>
                        {dept.department_name}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <strong>{dept.doctor_count}</strong> Specialists • <strong>{apptCount}</strong> Consults
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--teal-600) 0%, var(--teal-400) 100%)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Consultations Queue Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Calendar size={19} color="var(--teal-600)" />
              <span>Recent Consultations Queue</span>
            </h3>
            <p className="card-subtitle">Real-time appointments log synchronized with PostgreSQL</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('appointments')}
          >
            <span>View All Appointments</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments scheduled"
            description="Book an appointment to populate the consultation queue."
            actionLabel="Schedule Appointment"
            onAction={() => onNavigate('book-appointment')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient Name & Code</th>
                  <th>Assigned Specialist</th>
                  <th>Department</th>
                  <th>Consultation Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-circle">
                          {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                            {appt.patient_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {appt.appointment_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--navy-800)' }}>{appt.doctor_name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.15rem 0.55rem',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}
                      >
                        {appt.department_name}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(appt.appointment_date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatTime(appt.appointment_time)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments Ledger Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <CreditCard size={19} color="var(--mint-600)" />
              <span>Latest Financial Settlements</span>
            </h3>
            <p className="card-subtitle">ACID-compliant payment receipts registered in PostgreSQL</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('payments')}
          >
            <span>Full Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment records found"
            description="Payments settled against hospital bills will be logged here."
            actionLabel="View Billing"
            onAction={() => onNavigate('billing')}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Reference</th>
                  <th>Patient</th>
                  <th>Bill Number</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Settlement Time</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.payment_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {p.payment_reference}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.patient_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {p.bill_number}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--mint-50)',
                          color: 'var(--mint-700)',
                          borderColor: 'var(--mint-100)',
                        }}
                      >
                        {p.payment_method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--teal-700)', fontSize: '0.925rem' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
