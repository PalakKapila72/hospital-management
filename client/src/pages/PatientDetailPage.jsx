import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Clock,
  PlusCircle,
  AlertCircle,
  Shield,
  Activity,
  User,
  HeartPulse,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const PatientDetailPage = ({ patientId, onBack, onBookAppointment }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/patients/${patientId}`);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Error fetching patient clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ height: '36px', width: '180px' }} className="skeleton-box" />
        <LoadingSkeleton variant="card" count={1} />
        <LoadingSkeleton variant="stat-grid" count={3} />
        <LoadingSkeleton variant="card" count={1} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Patients
        </button>
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          <AlertCircle size={20} />
          <span>{error || 'Patient profile could not be loaded.'}</span>
        </div>
      </div>
    );
  }

  const { patient, appointments = [], billingSummary = {} } = data;

  return (
    <div className="page-container">
      {/* Top Navigation & Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Patients Directory</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => onBookAppointment(patient.patient_id)}
        >
          <PlusCircle size={16} />
          <span>Book Appointment for {patient.full_name}</span>
        </button>
      </div>

      {/* Patient Profile Header Card */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--teal-600)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--teal-600), var(--teal-700))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                flexShrink: 0,
              }}
            >
              {patient.full_name ? patient.full_name.charAt(0).toUpperCase() : 'P'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
                  {patient.full_name}
                </h2>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: 'var(--teal-50)',
                    color: 'var(--teal-700)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--teal-100)',
                  }}
                >
                  {patient.patient_code}
                </span>
                <span
                  className="badge"
                  style={{
                    background: patient.is_active ? 'var(--mint-50)' : '#f1f5f9',
                    color: patient.is_active ? 'var(--mint-700)' : 'var(--text-muted)',
                    borderColor: patient.is_active ? 'var(--mint-100)' : 'var(--border-light)',
                  }}
                >
                  {patient.is_active ? 'Active Patient' : 'Archived'}
                </span>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                {patient.age} years old ({formatDate(patient.date_of_birth)}) &bull; Gender: <strong>{patient.gender}</strong>
              </p>
            </div>
          </div>

          {/* Blood Group Highlight Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 1.15rem',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Activity size={24} color="#e11d48" />
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#9f1239', fontWeight: 700, letterSpacing: '0.04em' }}>
                Blood Group
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#be123c', lineHeight: 1.1 }}>
                {patient.blood_group || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--teal-50)', borderRadius: 'var(--radius-sm)', color: 'var(--teal-600)' }}>
              <Phone size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</div>
              <div style={{ fontWeight: 600, fontSize: '0.885rem', color: 'var(--navy-900)' }}>{patient.phone}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--teal-50)', borderRadius: 'var(--radius-sm)', color: 'var(--teal-600)' }}>
              <Mail size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
              <div style={{ fontWeight: 600, fontSize: '0.885rem', color: 'var(--navy-900)' }}>{patient.email || 'None on record'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--teal-50)', borderRadius: 'var(--radius-sm)', color: 'var(--teal-600)' }}>
              <MapPin size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Residential Address</div>
              <div style={{ fontWeight: 600, fontSize: '0.885rem', color: 'var(--navy-900)' }}>{patient.address}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--blue-50)', borderRadius: 'var(--radius-sm)', color: 'var(--blue-600)' }}>
              <Shield size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Contact</div>
              <div style={{ fontWeight: 600, fontSize: '0.885rem', color: 'var(--navy-900)' }}>
                {patient.emergency_contact_name || '—'}{' '}
                {patient.emergency_contact_phone ? `(${patient.emergency_contact_phone})` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="stats-grid">
        <StatCard
          icon={CreditCard}
          variant="blue"
          label="Total Invoiced"
          value={formatCurrency(billingSummary.total_billed)}
          subtext="Cumulative hospital charges"
        />

        <StatCard
          icon={CreditCard}
          variant="emerald"
          label="Total Paid"
          value={formatCurrency(billingSummary.total_paid)}
          subtext="Settled receipts"
        />

        <StatCard
          icon={AlertCircle}
          variant={parseFloat(billingSummary.outstanding_balance) > 0 ? 'rose' : 'emerald'}
          label="Outstanding Balance"
          value={formatCurrency(billingSummary.outstanding_balance)}
          subtext={parseFloat(billingSummary.outstanding_balance) > 0 ? 'Pending invoice balance' : 'Account in good standing'}
        />
      </div>

      {/* Consultation History Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Calendar size={19} color="var(--teal-600)" />
              <span>Consultation & Visit Chronology ({appointments.length})</span>
            </h3>
            <p className="card-subtitle">Lifetime consultation records linked to patient profile</p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments recorded"
            description="Schedule a doctor consultation for this patient to begin tracking visits."
            actionLabel="Schedule Appointment"
            onAction={() => onBookAppointment(patient.patient_id)}
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Appointment Code</th>
                  <th>Consultation Time</th>
                  <th>Attending Doctor</th>
                  <th>Department</th>
                  <th>Reason for Visit</th>
                  <th>Status</th>
                  <th>Invoice Balance</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {appt.appointment_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(appt.appointment_date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatTime(appt.appointment_time)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{appt.doctor_name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.15rem 0.5rem',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                        }}
                      >
                        {appt.department_name}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', color: 'var(--text-secondary)' }}>
                      {appt.reason_for_visit}
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      {appt.total_amount ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                            {formatCurrency(appt.total_amount)}
                          </div>
                          <StatusBadge status={appt.payment_status} />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>
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
