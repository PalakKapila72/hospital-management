import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Stethoscope,
  Building2,
  CreditCard,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('registrations');
  const [reportData, setReportData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      let endpoint = '';
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      switch (activeTab) {
        case 'registrations':
          endpoint = '/reports/patient-registrations';
          break;
        case 'doctors':
          endpoint = '/reports/doctor-appointments';
          break;
        case 'departments':
          endpoint = '/reports/department-summary';
          break;
        case 'revenue':
          endpoint = '/reports/revenue';
          break;
        case 'outstanding':
          endpoint = '/reports/outstanding-bills';
          break;
        case 'status':
          endpoint = '/reports/appointment-status';
          break;
        default:
          endpoint = '/reports/patient-registrations';
      }

      const res = await api.get(endpoint, params);
      if (res.success) {
        setReportData(res.data);
        setSummaryData(res.summary || null);
      }
    } catch (err) {
      setError(err.message || 'Error executing reporting SQL queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleExportCSV = async () => {
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'registrations':
          endpoint = '/reports/patient-registrations';
          break;
        case 'doctors':
          endpoint = '/reports/doctor-appointments';
          break;
        case 'departments':
          endpoint = '/reports/department-summary';
          break;
        case 'revenue':
          endpoint = '/reports/revenue';
          break;
        case 'outstanding':
          endpoint = '/reports/outstanding-bills';
          break;
        default:
          endpoint = '/reports/patient-registrations';
      }

      const params = { format: 'csv' };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const blob = await api.get(endpoint, params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to export CSV: ' + err.message);
    }
  };

  const tabs = [
    { id: 'registrations', label: 'Patient Registrations', icon: Users },
    { id: 'doctors', label: 'Doctor Workloads', icon: Stethoscope },
    { id: 'departments', label: 'Department Summary', icon: Building2 },
    { id: 'revenue', label: 'Revenue & Payments', icon: CreditCard },
    { id: 'outstanding', label: 'Outstanding Balances', icon: AlertCircle },
    { id: 'status', label: 'Status Distribution', icon: BarChart3 },
  ];

  return (
    <div className="page-container">
      {/* Header and Export Action */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Academic DBMS SQL Reports & Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Multi-table relational joins, GROUP BY aggregates, analytical views, and CSV export for college evaluation.
          </p>
        </div>
        {activeTab !== 'status' && (
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV Dataset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Report Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.75rem',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                border: isActive ? '1px solid var(--teal-600)' : '1px solid var(--border-light)',
                background: isActive ? 'var(--teal-50)' : '#ffffff',
                color: isActive ? 'var(--teal-800)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--teal-600)' : '#64748b'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filters for applicable reports */}
      {['registrations', 'revenue'].includes(activeTab) && (
        <div className="filter-bar" style={{ marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--navy-800)' }}>
            <Calendar size={16} color="var(--teal-600)" />
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>Filter Query Date Range:</span>
          </div>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-light)' }}>to</span>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={fetchReport}>
            Apply Filter
          </button>
          {(startDate || endDate) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setTimeout(fetchReport, 50);
              }}
            >
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      )}

      {/* Report Data Body Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={6} />
          </div>
        ) : reportData.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No Records in Query Result"
            description="The current SQL parameters returned 0 matching records. Try modifying your date filter."
          />
        ) : (
          <div>
            {/* Tab 1: Patient Registrations */}
            {activeTab === 'registrations' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient Code</th>
                      <th>Full Patient Name</th>
                      <th>Gender</th>
                      <th>Blood Group</th>
                      <th>Phone Number</th>
                      <th>Email Address</th>
                      <th>Date Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.patient_id}>
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
                            {row.patient_code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{row.full_name}</td>
                        <td>{row.gender}</td>
                        <td>
                          <span className="badge" style={{ background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3' }}>
                            {row.blood_group || '—'}
                          </span>
                        </td>
                        <td>{row.phone}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{row.email || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatDate(row.registration_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Doctor Workloads */}
            {activeTab === 'doctors' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Specialist Name</th>
                      <th>Department</th>
                      <th>Specialization</th>
                      <th>Consultation Fee</th>
                      <th>Total Appointments</th>
                      <th>Scheduled</th>
                      <th>Completed</th>
                      <th>Cancelled / No Show</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.doctor_id}>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{row.doctor_name}</td>
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
                            {row.department_name}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{row.specialization}</td>
                        <td style={{ fontWeight: 600, color: 'var(--teal-700)' }}>{formatCurrency(row.consultation_fee)}</td>
                        <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>{row.total_appointments}</td>
                        <td>
                          <span className="badge badge-scheduled">{row.scheduled_count}</span>
                        </td>
                        <td>
                          <span className="badge badge-completed">{row.completed_count}</span>
                        </td>
                        <td>
                          <span className="badge badge-cancelled">
                            {parseInt(row.cancelled_count || 0, 10) + parseInt(row.noshow_count || 0, 10)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Department Summary */}
            {activeTab === 'departments' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Location / Wing</th>
                      <th>Head of Department</th>
                      <th>Total Specialists</th>
                      <th>Active Specialists</th>
                      <th>Total Patient Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.department_id}>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{row.department_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{row.location}</td>
                        <td>{row.head_of_department || 'Pending'}</td>
                        <td style={{ fontWeight: 600 }}>{row.total_doctors}</td>
                        <td>
                          <span className="badge badge-completed">{row.active_doctors} Active</span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--teal-700)' }}>{row.total_appointments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 4: Revenue & Payments */}
            {activeTab === 'revenue' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Payment Reference</th>
                      <th>Patient Name</th>
                      <th>Invoice Number</th>
                      <th>Payment Method</th>
                      <th>Settled Amount</th>
                      <th>Transaction Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.payment_id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--teal-700)' }}>
                          {row.payment_reference}
                        </td>
                        <td style={{ fontWeight: 600 }}>{row.patient_name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{row.bill_number}</td>
                        <td>
                          <span className="badge" style={{ background: 'var(--mint-50)', color: 'var(--mint-700)', borderColor: 'var(--mint-100)' }}>
                            {row.payment_method}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--teal-700)', fontSize: '0.95rem' }}>
                          {formatCurrency(row.amount)}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(row.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 5: Outstanding Balances */}
            {activeTab === 'outstanding' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice Number</th>
                      <th>Patient Name & Code</th>
                      <th>Phone Number</th>
                      <th>Invoice Total</th>
                      <th>Amount Paid</th>
                      <th>Outstanding Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.bill_id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy-900)' }}>
                          {row.bill_number}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.patient_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.patient_code}</div>
                        </td>
                        <td>{row.patient_phone}</td>
                        <td>{formatCurrency(row.total_amount)}</td>
                        <td style={{ color: 'var(--mint-700)' }}>{formatCurrency(row.paid_amount)}</td>
                        <td style={{ fontWeight: 800, color: 'var(--rose-600)', fontSize: '0.95rem' }}>
                          {formatCurrency(row.balance_amount)}
                        </td>
                        <td>
                          <StatusBadge status={row.payment_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 6: Status Distribution */}
            {activeTab === 'status' && (
              <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Appointment Status</th>
                      <th>Total Bookings</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.status}>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>{row.count}</td>
                        <td style={{ fontWeight: 700, color: 'var(--teal-700)' }}>{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
