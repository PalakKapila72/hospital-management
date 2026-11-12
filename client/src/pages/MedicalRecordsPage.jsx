import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pill,
  Calendar,
  User,
  Stethoscope,
  Activity,
  Printer,
  CheckCircle2,
  AlertCircle,
  Heart,
  Thermometer,
  Weight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const MedicalRecordsPage = ({ onPrintPrescription, initialAppointmentId }) => {
  const { isDoctor, isAdmin } = useAuth();
  const canCreate = isDoctor || isAdmin;

  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    appointment_id: initialAppointmentId || '',
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    clinical_notes: '',
    bp: '120/80',
    pulse: '72',
    temperature: '98.6 F',
    weight_kg: '68',
    follow_up_date: '',
    prescriptions: [
      { medicine_name: '', dosage: '', frequency: 'Twice daily after meals', duration: '5 days', instructions: '' },
    ],
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/medical-records', params);
      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to query medical records from database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments', { limit: 50 });
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchAppointments();
  }, [page]);

  useEffect(() => {
    if (initialAppointmentId) {
      setFormData((prev) => ({ ...prev, appointment_id: initialAppointmentId }));
      setIsModalOpen(true);
    }
  }, [initialAppointmentId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleAddRxRow = () => {
    setFormData({
      ...formData,
      prescriptions: [
        ...formData.prescriptions,
        { medicine_name: '', dosage: '', frequency: 'Once daily', duration: '5 days', instructions: '' },
      ],
    });
  };

  const handleRemoveRxRow = (index) => {
    const updated = formData.prescriptions.filter((_, idx) => idx !== index);
    setFormData({ ...formData, prescriptions: updated });
  };

  const handleRxChange = (index, field, value) => {
    const updated = [...formData.prescriptions];
    updated[index][field] = value;
    setFormData({ ...formData, prescriptions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.appointment_id || !formData.diagnosis.trim() || !formData.treatment_plan.trim()) {
      setError('Please select an appointment, enter diagnosis, and provide a treatment plan.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        appointment_id: parseInt(formData.appointment_id, 10),
        diagnosis: formData.diagnosis.trim(),
        symptoms: formData.symptoms.trim(),
        treatment_plan: formData.treatment_plan.trim(),
        clinical_notes: formData.clinical_notes.trim(),
        vital_signs: {
          bp: formData.bp,
          pulse: parseInt(formData.pulse, 10) || 72,
          temperature: formData.temperature,
          weight_kg: parseFloat(formData.weight_kg) || 65,
        },
        follow_up_date: formData.follow_up_date || null,
        prescriptions: formData.prescriptions.filter((rx) => rx.medicine_name.trim() !== ''),
      };

      const res = await api.post('/medical-records', payload);
      if (res.success) {
        setSuccessMsg(`Clinical record ${res.record.record_code} and prescriptions recorded successfully.`);
        setIsModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      setError(err.message || 'Failed to create medical record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRecord = async (recordId) => {
    try {
      const res = await api.get(`/medical-records/${recordId}`);
      if (res.success) {
        setSelectedRecord(res);
      }
    } catch (err) {
      setError(err.message || 'Error fetching clinical record details.');
    }
  };

  return (
    <div className="page-container">
      {/* Header and Action */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Clinical Medical Records
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Diagnostic documentation, clinical symptoms, patient vitals, and pharmacological prescriptions.
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>New Clinical Record</span>
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
            placeholder="Search by diagnosis, record code (e.g. REC-1001), or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find Records
        </button>
        {search && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
          >
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </form>

      {/* Records Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Clinical Records Found"
            description="Complete a patient consultation to generate a formal diagnosis and pharmacy prescription."
            actionLabel={canCreate ? "New Clinical Record" : undefined}
            onAction={canCreate ? () => setIsModalOpen(true) : undefined}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Record Code</th>
                  <th>Patient Details</th>
                  <th>Attending Specialist</th>
                  <th>Primary Diagnosis</th>
                  <th>Patient Vitals</th>
                  <th>Rx Prescriptions</th>
                  <th>Follow-up Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const vitals = r.vital_signs || {};
                  return (
                    <tr key={r.record_id}>
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
                          {r.record_code}
                        </span>
                      </td>
                      <td>
                        <div className="table-avatar-cell">
                          <div className="avatar-circle">
                            {r.patient_name ? r.patient_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                              {r.patient_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {r.patient_code} &bull; {r.patient_age} yrs, {r.patient_gender}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{r.doctor_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: 500 }}>
                          {r.department_name}
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{r.diagnosis}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(r.created_at)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                          BP: <strong>{vitals.bp || '120/80'}</strong> &bull; Pulse: <strong>{vitals.pulse || 72}</strong> bpm
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: 'var(--teal-50)',
                            color: 'var(--teal-700)',
                            borderColor: 'var(--teal-100)',
                            fontWeight: 600,
                          }}
                        >
                          <Pill size={12} /> {r.prescription_count} medicines
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {r.follow_up_date ? formatDate(r.follow_up_date) : 'None required'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn-icon"
                            title="View Full Clinical Details"
                            onClick={() => handleViewRecord(r.record_id)}
                            aria-label="View record"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Print Prescription Slip"
                            onClick={() => onPrintPrescription && onPrintPrescription(r.record_id)}
                            style={{ color: 'var(--teal-600)' }}
                            aria-label="Print prescription"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* View Record Details Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Clinical Medical Record: ${selectedRecord?.record?.record_code}`}
        maxWidth="750px"
      >
        {selectedRecord && (
          <div>
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient:</span>{' '}
                <strong>{selectedRecord.record.patient_name}</strong> ({selectedRecord.record.patient_code})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Consulting Specialist:</span>{' '}
                <strong>{selectedRecord.record.doctor_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Consultation Date:</span>{' '}
                <strong>{formatDate(selectedRecord.record.created_at)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Follow-up Date:</span>{' '}
                <strong>{selectedRecord.record.follow_up_date ? formatDate(selectedRecord.record.follow_up_date) : 'None'}</strong>
              </div>
            </div>

            {/* Vitals Bar */}
            {selectedRecord.record.vital_signs && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ padding: '0.65rem 0.85rem', background: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: 600 }}>Blood Pressure</div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e40af' }}>{selectedRecord.record.vital_signs.bp || '120/80'}</strong>
                </div>
                <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Heart Rate / Pulse</div>
                  <strong style={{ fontSize: '0.95rem', color: '#065f46' }}>{selectedRecord.record.vital_signs.pulse || 72} bpm</strong>
                </div>
                <div style={{ padding: '0.65rem 0.85rem', background: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>Temperature</div>
                  <strong style={{ fontSize: '0.95rem', color: '#92400e' }}>{selectedRecord.record.vital_signs.temperature || '98.6 F'}</strong>
                </div>
                <div style={{ padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600 }}>Weight</div>
                  <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{selectedRecord.record.vital_signs.weight_kg || 65} kg</strong>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.15rem' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                Primary Diagnosis
              </h4>
              <div style={{ background: 'var(--teal-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--teal-100)', color: 'var(--teal-800)', fontWeight: 600 }}>
                {selectedRecord.record.diagnosis}
              </div>
            </div>

            {selectedRecord.record.symptoms && (
              <div style={{ marginBottom: '1.15rem' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  Reported Symptoms & Clinical Presentation
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {selectedRecord.record.symptoms}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '1.15rem' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                Treatment Plan & Clinical Directives
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {selectedRecord.record.treatment_plan}
              </p>
            </div>

            {selectedRecord.record.clinical_notes && (
              <div style={{ marginBottom: '1.15rem' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                  Diagnostic Notes & Observations
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {selectedRecord.record.clinical_notes}
                </p>
              </div>
            )}

            {/* Prescriptions Table */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Pill size={16} color="var(--teal-600)" />
                <span>Prescribed Medications ({selectedRecord.prescriptions?.length || 0})</span>
              </h4>

              {selectedRecord.prescriptions?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Special Directives</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.prescriptions.map((rx, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{rx.medicine_name}</td>
                          <td>{rx.dosage}</td>
                          <td>{rx.frequency}</td>
                          <td>{rx.duration}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{rx.instructions || 'As advised'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No medications were prescribed for this consultation.</p>
              )}
            </div>

            <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onPrintPrescription && onPrintPrescription(selectedRecord.record.record_id);
                  setSelectedRecord(null);
                }}
              >
                <Printer size={16} /> Print Prescription Slip
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Clinical Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Document Clinical Medical Record"
        maxWidth="750px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Linked Consultation Appointment *</label>
            <select
              className="form-control"
              required
              value={formData.appointment_id}
              onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
            >
              <option value="">-- Choose Consultation Appointment --</option>
              {appointments.map((a) => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  {a.appointment_code} &bull; {a.patient_name} ({formatDate(a.appointment_date)}) &bull; Dr. {a.doctor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Vitals Row */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label className="form-label">Vital Signs</label>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>BP (mmHg)</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="120/80"
                  value={formData.bp}
                  onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Pulse (bpm)</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="72"
                  value={formData.pulse}
                  onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Temp</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="98.6 F"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Weight (kg)</span>
                <input
                  type="number"
                  step="0.5"
                  className="form-control"
                  placeholder="65"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Diagnosis *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Essential Primary Hypertension (Grade II)"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Presenting Symptoms</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Patient reported headaches, dizziness, elevated readings over 10 days..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment Plan & Directives *</label>
            <textarea
              className="form-control"
              rows={2}
              required
              placeholder="Initiate ACE inhibitors, low sodium diet, lifestyle modifications..."
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                className="form-control"
                min={new Date().toISOString().slice(0, 10)}
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Clinical Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="Diagnostic impressions or labs advised..."
                value={formData.clinical_notes}
                onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
              />
            </div>
          </div>

          {/* Pharmacological Prescriptions Section */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.15rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)' }}>
                Prescribed Medications
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddRxRow}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {formData.prescriptions.map((rx, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr auto',
                  gap: '0.5rem',
                  alignItems: 'center',
                  marginBottom: '0.65rem',
                }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder="Medicine Name (e.g. Amlodipine)"
                  value={rx.medicine_name}
                  onChange={(e) => handleRxChange(idx, 'medicine_name', e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Dosage (5mg)"
                  value={rx.dosage}
                  onChange={(e) => handleRxChange(idx, 'dosage', e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Frequency (OD / BD)"
                  value={rx.frequency}
                  onChange={(e) => handleRxChange(idx, 'frequency', e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Duration"
                  value={rx.duration}
                  onChange={(e) => handleRxChange(idx, 'duration', e.target.value)}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => handleRemoveRxRow(idx)}
                  disabled={formData.prescriptions.length === 1}
                  style={{ color: 'var(--rose-600)' }}
                  aria-label="Remove medicine"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
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
              {submitting ? 'Saving to Database...' : 'Save Clinical Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
