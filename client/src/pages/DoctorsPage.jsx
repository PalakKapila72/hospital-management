import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Power,
  Edit2,
  CalendarDays,
  User,
  GraduationCap,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const DoctorsPage = () => {
  const { isAdmin } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [scheduleDoctor, setScheduleDoctor] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    full_name: '',
    department_id: '',
    specialization: '',
    qualification: 'MBBS, MD',
    phone: '',
    email: '',
    consultation_fee: 500,
    available_days: 'Mon,Tue,Wed,Thu,Fri',
    available_time_start: '09:00:00',
    available_time_end: '17:00:00',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors', {
          search: search.trim() || undefined,
          department_id: deptFilter || undefined,
        }),
        api.get('/departments'),
      ]);

      if (docRes.success) setDoctors(docRes.doctors);
      if (deptRes.success) {
        setDepartments(deptRes.departments);
        if (!formData.department_id && deptRes.departments.length > 0) {
          setFormData((prev) => ({ ...prev, department_id: deptRes.departments[0].department_id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Error fetching doctor records from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAdd = () => {
    setEditingDoctor(null);
    setFormData({
      ...initialForm,
      department_id: departments[0]?.department_id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      full_name: doc.full_name,
      department_id: doc.department_id,
      specialization: doc.specialization,
      qualification: doc.qualification,
      phone: doc.phone,
      email: doc.email,
      consultation_fee: doc.consultation_fee,
      available_days: doc.available_days,
      available_time_start: doc.available_time_start,
      available_time_end: doc.available_time_end,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor.doctor_id}`, formData);
        setSuccessMsg(`Specialist '${formData.full_name}' profile updated successfully.`);
      } else {
        await api.post('/doctors', formData);
        setSuccessMsg(`Specialist '${formData.full_name}' added to clinical registry.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Operation failed. Verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (doctor) => {
    try {
      const res = await api.patch(`/doctors/${doctor.doctor_id}/toggle-status`);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle status.');
    }
  };

  const handleOpenSchedule = (doctor) => {
    setScheduleDoctor(doctor);
    fetchSchedule(doctor.doctor_id, scheduleDate);
  };

  const fetchSchedule = async (doctorId, date) => {
    setLoadingSchedule(true);
    try {
      const res = await api.get(`/doctors/${doctorId}/schedule`, { date });
      if (res.success) {
        setScheduleSlots(res.bookedSlots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Banner & Actions */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Medical Staff & Specialists
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Clinical doctors, departmental appointments, consultation schedules, and fees.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Specialist</span>
          </button>
        )}
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
            placeholder="Search specialist by name, qualification, or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '190px' }}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.department_id} value={d.department_id}>
              {d.department_name}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find
        </button>

        {(search || deptFilter) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setDeptFilter('');
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </form>

      {/* Doctors Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          <LoadingSkeleton variant="card" count={4} />
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No Medical Specialists Found"
          description="No doctors match the selected search criteria or department filter."
          actionLabel={isAdmin ? "Add Specialist" : undefined}
          onAction={isAdmin ? handleOpenAdd : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.35rem' }}>
          {doctors.map((doc) => (
            <div
              key={doc.doctor_id}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: doc.is_active ? '4px solid var(--teal-600)' : '4px solid var(--border-medium)',
                opacity: doc.is_active ? 1 : 0.8,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, var(--teal-50), var(--blue-50))',
                        color: 'var(--teal-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        border: '1px solid var(--teal-100)',
                        flexShrink: 0,
                      }}
                    >
                      {doc.full_name ? doc.full_name.replace('Dr. ', '').charAt(0) : 'D'}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        {doc.full_name}
                      </h3>
                      <div style={{ fontSize: '0.825rem', color: 'var(--teal-600)', fontWeight: 600 }}>
                        {doc.specialization}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.qualification}</div>
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: doc.is_active ? 'var(--mint-50)' : '#f1f5f9',
                      color: doc.is_active ? 'var(--mint-700)' : 'var(--text-muted)',
                      borderColor: doc.is_active ? 'var(--mint-100)' : 'var(--border-light)',
                    }}
                  >
                    {doc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Info Block */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    margin: '1rem 0',
                    fontSize: '0.825rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--navy-800)' }}>
                    <Building2 size={15} color="var(--blue-600)" />
                    <strong>{doc.department_name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={15} color="var(--text-muted)" />
                    <span>Clinic Days: {doc.available_days}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Clock size={15} color="var(--text-muted)" />
                    <span>Hours: {doc.available_time_start?.slice(0, 5)} - {doc.available_time_end?.slice(0, 5)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Banknote size={15} /> Consultation Fee:
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--teal-700)', fontSize: '1.05rem' }}>
                    {formatCurrency(doc.consultation_fee)}
                  </span>
                </div>

                <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div>Phone: {doc.phone}</div>
                  <div>Email: {doc.email}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.25rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenSchedule(doc)}
                  style={{ fontSize: '0.785rem' }}
                >
                  <CalendarDays size={14} /> Schedule
                </button>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn-icon"
                      title="Edit Doctor Details"
                      onClick={() => handleOpenEdit(doc)}
                      aria-label={`Edit ${doc.full_name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      title={doc.is_active ? 'Deactivate Specialist' : 'Reactivate Specialist'}
                      onClick={() => handleToggleStatus(doc)}
                      style={{ color: doc.is_active ? 'var(--rose-600)' : 'var(--mint-600)' }}
                      aria-label="Toggle status"
                    >
                      <Power size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? `Edit Doctor: ${editingDoctor.full_name}` : 'Register Medical Specialist'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Dr. Sarah Jenkins"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-control"
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Specialization *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Interventional Cardiology"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Qualification *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. MBBS, MD, DM"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-control"
                required
                placeholder="+91-9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="doctor@apexgeneral.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Consultation Fee (INR) *</label>
              <input
                type="number"
                min="0"
                step="50"
                className="form-control"
                required
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Available Days *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Mon,Tue,Wed,Thu,Fri"
                value={formData.available_days}
                onChange={(e) => setFormData({ ...formData, available_days: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shift Start Time</label>
              <input
                type="time"
                className="form-control"
                value={formData.available_time_start}
                onChange={(e) => setFormData({ ...formData, available_time_start: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shift End Time</label>
              <input
                type="time"
                className="form-control"
                value={formData.available_time_end}
                onChange={(e) => setFormData({ ...formData, available_time_end: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingDoctor ? 'Update Specialist' : 'Register Specialist'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Doctor Schedule Modal */}
      <Modal
        isOpen={!!scheduleDoctor}
        onClose={() => setScheduleDoctor(null)}
        title={`Consultation Schedule: ${scheduleDoctor?.full_name}`}
        maxWidth="550px"
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Select Date to Inspect Schedule</label>
          <input
            type="date"
            className="form-control"
            value={scheduleDate}
            onChange={(e) => {
              setScheduleDate(e.target.value);
              if (scheduleDoctor) fetchSchedule(scheduleDoctor.doctor_id, e.target.value);
            }}
          />
        </div>

        {loadingSchedule ? (
          <div className="state-empty" style={{ padding: '1.5rem' }}>
            <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
            <p>Querying slot bookings...</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.65rem' }}>
              Reserved Consultation Slots ({scheduleSlots.length}):
            </div>
            {scheduleSlots.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--mint-50)',
                  border: '1px solid var(--mint-100)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--mint-700)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                All consultation slots are currently open and available for this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {scheduleSlots.map((slot, idx) => (
                  <span
                    key={idx}
                    className="badge"
                    style={{
                      background: 'var(--blue-50)',
                      color: 'var(--blue-700)',
                      border: '1px solid var(--blue-100)',
                      padding: '0.35rem 0.65rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <Clock size={12} /> {slot.slice(0, 5)} (Booked)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setScheduleDoctor(null)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
