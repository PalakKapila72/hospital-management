import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Hospital,
  AlertCircle,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const PrescriptionsPage = ({ selectedRecordIdToPrint }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Printable sheet state
  const [printData, setPrintData] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/prescriptions', params);
      if (res.success) {
        setPrescriptions(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to query prescriptions ledger from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [page]);

  useEffect(() => {
    if (selectedRecordIdToPrint) {
      handleOpenPrint(selectedRecordIdToPrint);
    }
  }, [selectedRecordIdToPrint]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPrescriptions();
  };

  const handleOpenPrint = async (recordId) => {
    try {
      const res = await api.get(`/prescriptions/print/${recordId}`);
      if (res.success) {
        setPrintData(res);
        setIsPrintModalOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load printable prescription template.');
    }
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Pharmacy & Prescriptions Ledger
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Active medication orders, pharmacological dosage schedules, duration, and printable Rx slips.
          </p>
        </div>
      </div>

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
            placeholder="Search medicine (e.g. Atenolol, Amoxicillin), patient name, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find Medication
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

      {/* Prescriptions Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No Prescriptions Found"
            description="Prescriptions issued during doctor consultations will be logged in this ledger."
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Prescribed Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency & Duration</th>
                  <th>Patient Name & Code</th>
                  <th>Prescribing Specialist</th>
                  <th>Clinical Diagnosis</th>
                  <th>Date Issued</th>
                  <th style={{ textAlign: 'right' }}>Print Slip</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.prescription_id}>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--teal-700)', fontSize: '0.95rem' }}>
                        {rx.medicine_name}
                      </div>
                      {rx.instructions && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rx.instructions}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--bg-subtle)',
                          color: 'var(--navy-800)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          borderColor: 'var(--border-light)',
                        }}
                      >
                        {rx.dosage}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{rx.frequency}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For {rx.duration}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{rx.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {rx.patient_code}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{rx.doctor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: 500 }}>
                        {rx.department_name}
                      </div>
                    </td>
                    <td style={{ maxWidth: '190px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {rx.diagnosis}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                      {formatDate(rx.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenPrint(rx.record_id)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Printer size={13} /> Print Rx
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Printable Prescription Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Hospital Prescription Slip"
        maxWidth="820px"
      >
        {printData && (
          <div>
            <div className="printable-sheet" id="printable-prescription">
              {/* Hospital Letterhead */}
              <div className="sheet-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, var(--teal-600), var(--teal-500))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      <Hospital size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                        Apex General Hospital
                      </h2>
                      <span style={{ fontSize: '0.7rem', color: 'var(--teal-700)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Tertiary Care & Academic Health Center
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.45rem' }}>
                    Department of {printData.record.department_name} &bull; {printData.record.department_location}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Emergency Helpline: +91-80-22001100 &bull; Web: apexgeneral.hospital
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--teal-700)' }}>
                    {printData.record.doctor_name}
                  </h4>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    {printData.record.qualification}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {printData.record.specialization}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Doctor Phone: {printData.record.doctor_phone}
                  </div>
                </div>
              </div>

              {/* Patient Demographics Box */}
              <div className="sheet-meta-grid">
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Patient Full Name
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem' }}>
                    {printData.record.patient_name}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    ID: <strong>{printData.record.patient_code}</strong> &bull; {printData.record.patient_age} yrs /{' '}
                    {printData.record.patient_gender} &bull; Blood Group: <strong>{printData.record.blood_group || 'N/A'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Prescription Reference
                  </div>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--teal-700)' }}>
                    {printData.record.record_code}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Consultation Date: <strong>{formatDate(printData.record.created_at)}</strong>
                  </div>
                </div>
              </div>

              {/* Vitals Summary */}
              {printData.record.vital_signs && (
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div>BP: <strong>{printData.record.vital_signs.bp || '120/80'}</strong></div>
                  <div>Pulse: <strong>{printData.record.vital_signs.pulse || 72} bpm</strong></div>
                  <div>Temp: <strong>{printData.record.vital_signs.temperature || '98.6 F'}</strong></div>
                  <div>Weight: <strong>{printData.record.vital_signs.weight_kg || 65} kg</strong></div>
                </div>
              )}

              {/* Diagnosis Notice */}
              <div style={{ marginBottom: '1.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Clinical Diagnosis:
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                  {printData.record.diagnosis}
                </div>
              </div>

              {/* Rx Prescribed Medicines Table */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--teal-700)', fontFamily: 'serif' }}>
                    ℞
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)' }}>
                    Pharmacological Prescriptions
                  </span>
                </div>

                <table className="table" style={{ border: '1px solid var(--border-light)' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Medicine & Formulation</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Administration Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.prescriptions.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{p.medicine_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{p.dosage}</td>
                        <td>{p.frequency}</td>
                        <td>{p.duration}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {p.instructions || 'As advised'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Directives & Treatment Plan */}
              {printData.record.treatment_plan && (
                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Dietary & Lifestyle Advice:
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {printData.record.treatment_plan}
                  </p>
                </div>
              )}

              {/* Doctor Signature & Hospital Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '2.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Follow-up Date:{' '}
                    <strong>
                      {printData.record.follow_up_date ? formatDate(printData.record.follow_up_date) : 'As needed'}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                    Generated electronically via Apex General DBMS Clinical Portal.
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '180px' }}>
                  <div style={{ borderBottom: '1px solid var(--navy-900)', width: '100%', height: '35px' }} />
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.35rem' }}>
                    {printData.record.doctor_name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Authorized Medical Officer</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsPrintModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={triggerBrowserPrint}
              >
                <Printer size={16} /> Print Prescription Sheet
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
