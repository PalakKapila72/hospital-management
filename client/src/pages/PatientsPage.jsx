import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  UserCheck,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const PatientsPage = ({ onSelectPatient, onBookAppointmentForPatient }) => {
  const { isAdmin, isReceptionist } = useAuth();
  const canManage = isAdmin || isReceptionist;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    full_name: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (gender) params.gender = gender;
      if (bloodGroup) params.blood_group = bloodGroup;

      const res = await api.get('/patients', params);
      if (res.success) {
        setPatients(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Error fetching patients list from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, gender, bloodGroup]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleResetFilters = () => {
    setSearch('');
    setGender('');
    setBloodGroup('');
    setPage(1);
  };

  const handleOpenRegister = () => {
    setEditingPatient(null);
    setFormData(initialForm);
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPatient(p);
    setFormData({
      full_name: p.full_name,
      date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
      gender: p.gender,
      blood_group: p.blood_group || '',
      phone: p.phone,
      email: p.email || '',
      address: p.address,
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || '',
    });
    setIsRegisterOpen(true);
  };

  const handleSubmitPatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.patient_id}`, formData);
        setSuccessMsg(`Patient '${formData.full_name}' details updated successfully.`);
      } else {
        await api.post('/patients', formData);
        setSuccessMsg(`Patient '${formData.full_name}' registered successfully.`);
      }
      setIsRegisterOpen(false);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Operation failed. Please verify form inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchivePatient = async () => {
    if (!deleteConfirmPatient) return;
    setSubmitting(true);
    try {
      await api.delete(`/patients/${deleteConfirmPatient.patient_id}`);
      setSuccessMsg(`Patient '${deleteConfirmPatient.full_name}' safely archived.`);
      setDeleteConfirmPatient(null);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to archive patient record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header & Quick Action */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Patients Clinical Directory
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Comprehensive medical records, contact profiles, and consultation histories.
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenRegister}>
            <Plus size={18} />
            <span>Register New Patient</span>
          </button>
        )}
      </div>

      {/* Notifications */}
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

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, ID (e.g. PAT-1001), phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '135px' }}
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '150px' }}
          value={bloodGroup}
          onChange={(e) => {
            setBloodGroup(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Blood Groups</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find
        </button>

        {(search || gender || bloodGroup) && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            <RefreshCw size={14} /> Reset
          </button>
        )}
      </form>

      {/* Patients Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Patients Found"
            description="No patient matches your search or filter criteria. Try clearing filters or register a new patient."
            actionLabel={canManage ? "Register Patient" : undefined}
            onAction={canManage ? handleOpenRegister : undefined}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Patient Code</th>
                  <th>Patient Name & Demographic</th>
                  <th>Age & Gender</th>
                  <th>Blood Group</th>
                  <th>Contact Information</th>
                  <th>Address</th>
                  <th style={{ textAlign: 'center' }}>Total Visits</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.patient_id}>
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
                        {p.patient_code}
                      </span>
                    </td>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-circle">
                          {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                            {p.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            DOB: {formatDate(p.date_of_birth)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{p.age} yrs</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.gender}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: '#fff1f2',
                          color: '#e11d48',
                          borderColor: '#fecdd3',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                        }}
                      >
                        {p.blood_group || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.phone}</div>
                      {p.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                      )}
                    </td>
                    <td
                      style={{
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-secondary)',
                      }}
                      title={p.address}
                    >
                      {p.address}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--teal-700)' }}>
                      {p.total_visits}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: p.is_active ? 'var(--mint-50)' : '#f1f5f9',
                          color: p.is_active ? 'var(--mint-700)' : 'var(--text-muted)',
                          borderColor: p.is_active ? 'var(--mint-100)' : 'var(--border-light)',
                        }}
                      >
                        {p.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn-icon"
                          title="View Profile & Medical History"
                          onClick={() => onSelectPatient(p.patient_id)}
                          aria-label={`View ${p.full_name}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn-icon"
                          title="Schedule Doctor Appointment"
                          onClick={() => onBookAppointmentForPatient(p.patient_id)}
                          aria-label={`Book appointment for ${p.full_name}`}
                          style={{ color: 'var(--teal-600)' }}
                        >
                          <Calendar size={15} />
                        </button>
                        {canManage && (
                          <button
                            className="btn-icon"
                            title="Edit Patient Details"
                            onClick={() => handleOpenEdit(p)}
                            aria-label={`Edit ${p.full_name}`}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}
                        {isAdmin && p.is_active && (
                          <button
                            className="btn-icon"
                            title="Archive Record"
                            onClick={() => setDeleteConfirmPatient(p)}
                            style={{ color: 'var(--rose-600)' }}
                            aria-label={`Archive ${p.full_name}`}
                          >
                            <Trash2 size={15} />
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

      {/* Register / Edit Patient Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title={editingPatient ? `Edit Patient: ${editingPatient.full_name}` : 'Register New Clinical Patient'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmitPatient}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-control"
                required
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-control"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-control"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
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
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address *</label>
            <textarea
              className="form-control"
              rows={2}
              required
              placeholder="Full residential street address, city, state, pincode..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Sunita Kumar (Spouse)"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+91-9876500000"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsRegisterOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving to Database...' : editingPatient ? 'Update Patient Record' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPatient}
        onClose={() => setDeleteConfirmPatient(null)}
        onConfirm={handleArchivePatient}
        title="Archive Patient Record"
        message={`Are you sure you want to archive patient ${deleteConfirmPatient?.full_name} (${deleteConfirmPatient?.patient_code})? The record will be safely deactivated without deleting past medical records.`}
        confirmText="Archive Record"
        isDanger={true}
        loading={submitting}
      />
    </div>
  );
};
