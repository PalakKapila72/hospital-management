import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  Printer,
  CreditCard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Hospital,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const BillingPage = ({ onOpenPaymentModal }) => {
  const { isAdmin, isReceptionist } = useAuth();
  const canManage = isAdmin || isReceptionist;

  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Manage Items Modal
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [billPayments, setBillPayments] = useState([]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Print Invoice Modal
  const [printBillData, setPrintBillData] = useState(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/bills', params);
      if (res.success) {
        setBills(res.data);
        setSummary(res.summary || {});
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to query billing invoices from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const handleOpenManageItems = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      if (res.success) {
        setSelectedBill(res.bill);
        setBillItems(res.items || []);
        setBillPayments(res.payments || []);
      }
    } catch (err) {
      setError(err.message || 'Error fetching invoice items.');
    }
  };

  const handleAddBillItem = async (e) => {
    e.preventDefault();
    if (!newItemDesc.trim() || !newItemPrice || !selectedBill) return;

    setSubmittingItem(true);
    try {
      const res = await api.post(`/bills/${selectedBill.bill_id}/items`, {
        description: newItemDesc.trim(),
        unit_price: parseFloat(newItemPrice),
        quantity: parseInt(newItemQty, 10) || 1,
      });

      if (res.success) {
        setSuccessMsg(`Service item '${newItemDesc}' added to invoice. Total automatically synchronized.`);
        setNewItemDesc('');
        setNewItemPrice('');
        setNewItemQty(1);
        handleOpenManageItems(selectedBill.bill_id);
        fetchBills();
      }
    } catch (err) {
      setError(err.message || 'Failed to add bill item.');
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!selectedBill) return;
    try {
      const res = await api.delete(`/bills/${selectedBill.bill_id}/items/${itemId}`);
      if (res.success) {
        setSuccessMsg('Service item removed. Invoice total recalculated.');
        handleOpenManageItems(selectedBill.bill_id);
        fetchBills();
      }
    } catch (err) {
      setError(err.message || 'Failed to remove line item.');
    }
  };

  const handleOpenPrintBill = async (billId) => {
    try {
      const res = await api.get(`/bills/${billId}`);
      if (res.success) {
        setPrintBillData(res);
      }
    } catch (err) {
      setError(err.message || 'Error preparing printable tax invoice.');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Hospital Billing & Invoicing
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Patient invoices, itemized diagnostics, automatic subtotal triggers, and outstanding balances.
          </p>
        </div>
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

      {/* Aggregate Financial KPIs */}
      <div className="stats-grid">
        <StatCard
          icon={Receipt}
          variant="blue"
          label="Total Invoiced"
          value={formatCurrency(summary.total_billed)}
          subtext="Lifetime consultation & service billings"
        />

        <StatCard
          icon={TrendingUp}
          variant="emerald"
          label="Settled Receipts"
          value={formatCurrency(summary.total_paid)}
          subtext="Total collected payments"
        />

        <StatCard
          icon={AlertCircle}
          variant={parseFloat(summary.total_outstanding) > 0 ? 'rose' : 'emerald'}
          label="Receivable Balance"
          value={formatCurrency(summary.total_outstanding)}
          subtext="Cumulative unpaid patient invoices"
        />
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search invoice number (e.g. INV-1001) or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Invoices</option>
          <option value="Paid">Paid / Settled</option>
          <option value="Partial">Partial Payments</option>
          <option value="Unpaid">Unpaid / Due</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find Invoice
        </button>

        {(statusFilter || search) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPage(1);
            }}
          >
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </form>

      {/* Invoices Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Invoices Found"
            description="Patient consultation appointments generate official hospital invoices automatically."
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Patient Details</th>
                  <th>Consulting Specialist</th>
                  <th>Date Issued</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const isDue = parseFloat(bill.balance_amount) > 0;
                  return (
                    <tr key={bill.bill_id}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--navy-900)',
                            background: 'var(--bg-subtle)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-light)',
                            fontSize: '0.8rem',
                          }}
                        >
                          {bill.bill_number}
                        </span>
                      </td>
                      <td>
                        <div className="table-avatar-cell">
                          <div className="avatar-circle">
                            {bill.patient_name ? bill.patient_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                              {bill.patient_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {bill.patient_code} &bull; {bill.patient_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{bill.doctor_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-600)', fontWeight: 500 }}>
                          {bill.department_name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {formatDate(bill.bill_date)}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.95rem' }}>
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td style={{ color: 'var(--mint-700)', fontWeight: 600 }}>
                        {formatCurrency(bill.paid_amount)}
                      </td>
                      <td style={{ fontWeight: 800, color: isDue ? 'var(--rose-600)' : 'var(--mint-700)' }}>
                        {formatCurrency(bill.balance_amount)}
                      </td>
                      <td>
                        <StatusBadge status={bill.payment_status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Manage Line Items & Recalculate"
                            onClick={() => handleOpenManageItems(bill.bill_id)}
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          >
                            <Eye size={13} /> Items ({bill.items_count})
                          </button>

                          <button
                            className="btn-icon"
                            title="Print Official Tax Invoice"
                            onClick={() => handleOpenPrintBill(bill.bill_id)}
                            aria-label="Print invoice"
                          >
                            <Printer size={15} />
                          </button>

                          {canManage && isDue && (
                            <button
                              className="btn btn-primary btn-sm"
                              title="Collect Payment"
                              onClick={() => onOpenPaymentModal && onOpenPaymentModal(bill)}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <CreditCard size={13} /> Pay
                            </button>
                          )}
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

      {/* Manage Invoice Items Modal */}
      <Modal
        isOpen={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={`Invoice Breakdown: ${selectedBill?.bill_number}`}
        maxWidth="750px"
      >
        {selectedBill && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                background: 'var(--bg-subtle)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>{' '}
                <strong>{selectedBill.patient_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Specialist Fee:</span>{' '}
                <strong>{formatCurrency(selectedBill.consultation_fee)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Invoiced:</span>{' '}
                <strong style={{ color: 'var(--teal-700)' }}>{formatCurrency(selectedBill.total_amount)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Balance Remaining:</span>{' '}
                <strong style={{ color: parseFloat(selectedBill.balance_amount) > 0 ? 'var(--rose-600)' : 'var(--mint-700)' }}>
                  {formatCurrency(selectedBill.balance_amount)}
                </strong>
              </div>
            </div>

            {/* Line items table */}
            <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.65rem' }}>
              Itemized Clinical Services & Diagnostics
            </h4>

            {billItems.length === 0 ? (
              <div className="state-empty" style={{ padding: '1.25rem' }}>
                <p>No additional service items attached yet. (Base specialist consultation fee applied).</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ marginBottom: '1.25rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service Description</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                      {canManage && <th style={{ textAlign: 'right' }}>Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item) => (
                      <tr key={item.item_id}>
                        <td style={{ fontWeight: 600 }}>{item.description}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{formatCurrency(item.total_price)}</td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="btn-icon"
                              title="Delete Item"
                              onClick={() => handleDeleteItem(item.item_id)}
                              style={{ color: 'var(--rose-600)' }}
                              aria-label="Delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Item Form (Admin/Receptionist) */}
            {canManage && (
              <form
                onSubmit={handleAddBillItem}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.65rem' }}>
                  Add Itemized Diagnostic / Lab Service
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. 12-Lead ECG / Blood Profile"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                  />
                  <input
                    type="number"
                    step="10"
                    min="0"
                    className="form-control"
                    required
                    placeholder="Price (₹)"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    placeholder="Qty"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingItem}>
                    <Plus size={15} /> Add Service
                  </button>
                </div>
              </form>
            )}

            {/* Attached Payments History */}
            {billPayments.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.65rem' }}>
                  Payments Recorded for this Invoice
                </h4>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Payment Reference</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Transaction Date</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billPayments.map((p) => (
                        <tr key={p.payment_id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.payment_reference}</td>
                          <td style={{ fontWeight: 700, color: 'var(--mint-700)' }}>{formatCurrency(p.amount)}</td>
                          <td>
                            <span className="badge" style={{ background: 'var(--mint-50)', color: 'var(--mint-700)' }}>
                              {p.payment_method}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.cashier_name || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable Tax Invoice Modal */}
      <Modal
        isOpen={!!printBillData}
        onClose={() => setPrintBillData(null)}
        title="Official Hospital Tax Invoice Receipt"
        maxWidth="820px"
      >
        {printBillData && (
          <div>
            <div className="printable-sheet" id="printable-bill">
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
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-900)' }}>
                        Apex General Hospital
                      </h2>
                      <span style={{ fontSize: '0.7rem', color: 'var(--teal-700)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Accounts & Patient Billing Registry &bull; GSTIN: 29ABCDE1234F1Z5
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Billing Counter & Cash Office &bull; Ph: +91-80-22001199 &bull; Web: apexgeneral.hospital
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    TAX INVOICE RECEIPT
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--teal-700)', fontFamily: 'var(--font-mono)' }}>
                    {printBillData.bill.bill_number}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Issued: {formatDate(printBillData.bill.bill_date)}
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    <StatusBadge status={printBillData.bill.payment_status} />
                  </div>
                </div>
              </div>

              {/* Patient Demographics Grid */}
              <div className="sheet-meta-grid">
                <div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Billed To Patient
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem' }}>
                    {printBillData.bill.patient_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ID: <strong>{printBillData.bill.patient_code}</strong> &bull; Ph: {printBillData.bill.patient_phone}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{printBillData.bill.patient_address}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Attending Specialist
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                    {printBillData.bill.doctor_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--teal-700)', fontWeight: 600 }}>
                    {printBillData.bill.department_name} ({printBillData.bill.specialization})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Appointment Ref: {printBillData.bill.appointment_code}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '2rem' }}>
                <table className="table" style={{ width: '100%', border: '1px solid var(--border-light)' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '55%' }}>Service / Clinical Item Description</th>
                      <th>Unit Rate</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>
                        <strong>Specialist Consultation Charge</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Primary clinical review with {printBillData.bill.doctor_name}
                        </div>
                      </td>
                      <td>{formatCurrency(printBillData.bill.consultation_fee)}</td>
                      <td>1</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(printBillData.bill.consultation_fee)}
                      </td>
                    </tr>
                    {printBillData.items?.map((item, idx) => (
                      <tr key={item.item_id}>
                        <td>{idx + 2}</td>
                        <td>
                          <strong>{item.description}</strong>
                        </td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Box */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
                <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.885rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                    <span>{formatCurrency(parseFloat(printBillData.bill.consultation_fee) + parseFloat(printBillData.bill.additional_charges))}</span>
                  </div>
                  {parseFloat(printBillData.bill.discount_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mint-700)' }}>
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(printBillData.bill.discount_amount)}</span>
                    </div>
                  )}
                  {parseFloat(printBillData.bill.tax_amount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Taxes (GST):</span>
                      <span>{formatCurrency(printBillData.bill.tax_amount)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      paddingTop: '0.5rem',
                      borderTop: '2px solid var(--navy-900)',
                      marginTop: '0.25rem',
                      color: 'var(--navy-900)',
                    }}
                  >
                    <span>Grand Total:</span>
                    <span>{formatCurrency(printBillData.bill.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mint-700)', fontWeight: 700 }}>
                    <span>Amount Settled:</span>
                    <span>{formatCurrency(printBillData.bill.paid_amount)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 800,
                      color: parseFloat(printBillData.bill.balance_amount) > 0 ? 'var(--rose-600)' : 'var(--mint-700)',
                      fontSize: '1.05rem',
                      paddingTop: '0.35rem',
                      borderTop: '1px dashed var(--border-medium)',
                    }}
                  >
                    <span>Balance Due:</span>
                    <span>{formatCurrency(printBillData.bill.balance_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Signature Line & Disclaimer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '1rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', maxWidth: '360px' }}>
                  This is a verified computer-generated tax invoice issued by Apex General Hospital DBMS.
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid var(--navy-900)', width: '160px', marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Authorized Accounts Officer</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPrintBillData(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> Print Official Invoice (PDF)
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
