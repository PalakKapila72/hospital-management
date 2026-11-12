import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  RotateCcw,
  Receipt,
  User,
  Stethoscope,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const AppointmentsPage = ({ onNavigateToBooking, onNavigateToMedicalRecord, onNavigateToBill }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Reschedule & Cancel Modal states
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [cancelAppt, setCancelAppt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await api.get('/appointments', params);
      if (res.success) {
        setAppointments(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Error querying appointments queue from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [page, statusFilter, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDateFilter('');
    setPage(1);
  };

  const handleMarkStatus = async (apptId, newStatus) => {
    try {
      setSubmitting(true);
      const res = await api.patch(`/appointments/${apptId}/status`, { status: newStatus });
      if (res.success) {
        setSuccessMsg(`Appointment marked as ${newStatus}.`);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.message || 'Failed to update consultation status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelAppt) return;
    try {
      setSubmitting(true);
      const res = await api.patch(`/appointments/${cancelAppt.appointment_id}/status`, {
        status: 'Cancelled',
        cancellation_reason: cancellationReason || 'Patient requested cancellation',
      });
      if (res.success) {
        setSuccessMsg(`Appointment ${cancelAppt.appointment_code} marked as Cancelled.`);
        setCancelAppt(null);
        setCancellationReason('');
        fetchAppointments();
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleAppt || !rescheduleDate || !rescheduleTime) return;

    try {
      setSubmitting(true);
      const res = await api.patch(`/appointments/${rescheduleAppt.appointment_id}/reschedule`, {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
      });
      if (res.success) {
        setSuccessMsg(`Appointment rescheduled to ${formatDate(rescheduleDate)} at ${formatTime(rescheduleTime)}.`);
        setRescheduleAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      setError(err.message || 'Rescheduling failed. Timeslot might be in conflict with another appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRescheduleModal = (appt) => {
    setRescheduleAppt(appt);
    setRescheduleDate(appt.appointment_date.slice(0, 10));
    setRescheduleTime(appt.appointment_time.slice(0, 5));
  };

  return (
    <div className="page-container">
      {/* Top Banner and Actions */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Appointments & Consultation Queue
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time scheduling queue with automated double-booking conflict prevention.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNavigateToBooking}>
          <Plus size={18} />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by code (e.g. APT-1001), patient name, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '150px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No Show">No Show</option>
        </select>

        <input
          type="date"
          className="form-control"
          style={{ width: 'auto' }}
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
        />

        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find
        </button>

        {(statusFilter || dateFilter || search) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </form>

      {/* Appointments Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No Appointments Found"
            description="No scheduled consultations match your query or filter criteria."
            actionLabel="Schedule Appointment"
            onAction={onNavigateToBooking}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Appointment Code</th>
                  <th>Patient Details</th>
                  <th>Assigned Specialist</th>
                  <th>Consultation Date & Time</th>
                  <th>Reason / Symptoms</th>
                  <th>Status</th>
                  <th>Invoice Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--teal-700)',
                          background: 'var(--teal-50)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--teal-100)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {appt.appointment_code}
                      </span>
                    </td>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-circle">
                          {appt.patient_name ? appt.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                            {appt.patient_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {appt.patient_code} &bull; {appt.patient_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{appt.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: 500 }}>
                        {appt.department_name} ({appt.specialization})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatDate(appt.appointment_date)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formatTime(appt.appointment_time)}
                      </div>
                    </td>
                    <td style={{ maxWidth: '220px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {appt.reason_for_visit}
                      {appt.cancellation_reason && (
                        <div style={{ color: 'var(--rose-600)', fontSize: '0.725rem', marginTop: '0.2rem' }}>
                          Reason: {appt.cancellation_reason}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td>
                      {appt.bill_id ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)' }}>
                            {formatCurrency(appt.bill_total)}
                          </div>
                          <StatusBadge status={appt.payment_status} />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {appt.status === 'Scheduled' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Reschedule Consultation"
                              onClick={() => openRescheduleModal(appt)}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <RotateCcw size={13} /> Reschedule
                            </button>

                            <button
                              className="btn btn-primary btn-sm"
                              title="Begin Consultation"
                              onClick={() => {
                                if (onNavigateToMedicalRecord) {
                                  onNavigateToMedicalRecord(appt.appointment_id);
                                } else {
                                  handleMarkStatus(appt.appointment_id, 'Completed');
                                }
                              }}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <CheckCircle2 size={13} /> Consult
                            </button>

                            <button
                              className="btn-icon"
                              title="Cancel Appointment"
                              onClick={() => setCancelAppt(appt)}
                              style={{ color: 'var(--rose-600)' }}
                              aria-label="Cancel consultation"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {appt.status === 'Completed' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Inspect Clinical Records"
                            onClick={() => onNavigateToMedicalRecord && onNavigateToMedicalRecord(appt.appointment_id)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          >
                            <FileText size={13} /> Records
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleAppt}
        onClose={() => setRescheduleAppt(null)}
        title={`Reschedule Consultation: ${rescheduleAppt?.appointment_code}`}
        maxWidth="480px"
      >
        <form onSubmit={handleConfirmReschedule}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Updating consultation for <strong>{rescheduleAppt?.patient_name}</strong> with specialist{' '}
            <strong>{rescheduleAppt?.doctor_name}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">New Appointment Date *</label>
            <input
              type="date"
              className="form-control"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Appointment Time *</label>
            <input
              type="time"
              className="form-control"
              required
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRescheduleAppt(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Verifying Conflict...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelAppt}
        onClose={() => setCancelAppt(null)}
        title={`Cancel Appointment: ${cancelAppt?.appointment_code}`}
        maxWidth="480px"
      >
        <form onSubmit={handleConfirmCancel}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--rose-50)',
                color: 'var(--rose-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <XCircle size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.885rem', color: 'var(--navy-900)', fontWeight: 600 }}>
                Cancel consultation for {cancelAppt?.patient_name}?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                The appointment slot will be released back to the doctor's available schedule.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cancellation Reason *</label>
            <textarea
              className="form-control"
              required
              rows={2}
              placeholder="e.g. Patient emergency, schedule conflict, or physician unavailable..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCancelAppt(null)}
            >
              Keep Appointment
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
