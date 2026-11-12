import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wallet,
  Smartphone,
  Building2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const PaymentsPage = ({ prefilledBill, onCloseModal }) => {
  const { isAdmin, isReceptionist } = useAuth();
  const canManage = isAdmin || isReceptionist;

  const [payments, setPayments] = useState([]);
  const [methodBreakdown, setMethodBreakdown] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(!!prefilledBill);
  const [selectedBillId, setSelectedBillId] = useState(prefilledBill?.bill_id || '');
  const [amount, setAmount] = useState(prefilledBill ? prefilledBill.balance_amount : '');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (methodFilter) params.payment_method = methodFilter;

      const res = await api.get('/payments', params);
      if (res.success) {
        setPayments(res.data);
        setMethodBreakdown(res.methodBreakdown || []);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to query payments ledger from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidBills = async () => {
    try {
      const res = await api.get('/bills', { limit: 100 });
      if (res.success) {
        const outstanding = res.data.filter((b) => parseFloat(b.balance_amount) > 0);
        setUnpaidBills(outstanding);
        if (!selectedBillId && outstanding.length > 0) {
          setSelectedBillId(outstanding[0].bill_id);
          setAmount(outstanding[0].balance_amount);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchUnpaidBills();
  }, [page, methodFilter]);

  useEffect(() => {
    if (prefilledBill) {
      setSelectedBillId(prefilledBill.bill_id);
      setAmount(prefilledBill.balance_amount);
      setIsModalOpen(true);
    }
  }, [prefilledBill]);

  const handleBillSelectChange = (billId) => {
    setSelectedBillId(billId);
    const chosen = unpaidBills.find((b) => b.bill_id === parseInt(billId, 10));
    if (chosen) {
      setAmount(chosen.balance_amount);
    }
  };

  const currentSelectedBill = unpaidBills.find((b) => b.bill_id === parseInt(selectedBillId, 10)) || prefilledBill;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedBillId || !amount || !paymentMethod) {
      setError('Please select an invoice, enter payment amount, and select payment method.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        bill_id: parseInt(selectedBillId, 10),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim(),
        notes: notes.trim(),
      };

      const res = await api.post('/payments', payload);
      if (res.success) {
        setSuccessMsg(res.message);
        setIsModalOpen(false);
        if (onCloseModal) onCloseModal();
        fetchPayments();
        fetchUnpaidBills();
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed. Transaction rolled back safely.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header and Actions */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Payments & Collections Ledger
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ACID transaction-backed payment records, overpayment checks, and cashier settlement ledger.
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Record Settlement</span>
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

      {/* Payment Method Distribution KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          { method: 'UPI', icon: Smartphone, color: 'var(--teal-600)', bg: 'var(--teal-50)', border: 'var(--teal-100)' },
          { method: 'Card', icon: CreditCard, color: 'var(--blue-600)', bg: 'var(--blue-50)', border: 'var(--blue-100)' },
          { method: 'Cash', icon: Wallet, color: 'var(--mint-600)', bg: 'var(--mint-50)', border: 'var(--mint-100)' },
          { method: 'Online', icon: TrendingUp, color: 'var(--amber-600)', bg: 'var(--amber-50)', border: 'var(--amber-100)' },
        ].map((item) => {
          const stats = methodBreakdown.find((m) => m.payment_method === item.method);
          const Icon = item.icon;
          return (
            <div key={item.method} className="card" style={{ padding: '1.25rem 1.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.method} Collections
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: item.bg, border: `1px solid ${item.border}`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.45rem', letterSpacing: '-0.02em' }}>
                {formatCurrency(stats?.total || 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {stats?.count || 0} registered transactions
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by payment reference (e.g. PAY-1001), invoice number, or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '160px' }}
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Payment Modes</option>
          <option value="Cash">Cash Counter</option>
          <option value="Card">Debit / Credit Card (POS)</option>
          <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
          <option value="Online">Online NetBanking</option>
        </select>

        <button type="submit" className="btn btn-primary btn-sm">
          <Search size={15} /> Find Payments
        </button>

        {(methodFilter || search) && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch('');
              setMethodFilter('');
              setPage(1);
            }}
          >
            <RefreshCw size={14} /> Clear
          </button>
        )}
      </form>

      {/* Payments Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={5} />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Payment Transactions Found"
            description="Payments collected at the hospital billing cashier will be displayed in this ledger."
            actionLabel={canManage ? "Record Settlement" : undefined}
            onAction={canManage ? () => setIsModalOpen(true) : undefined}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Payment Ref</th>
                  <th>Patient Details</th>
                  <th>Invoice Number</th>
                  <th>Payment Method</th>
                  <th>Amount Settled</th>
                  <th>Transaction Reference</th>
                  <th>Cashier / Recorded By</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
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
                        {p.payment_reference}
                      </span>
                    </td>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-circle">
                          {p.patient_name ? p.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                            {p.patient_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {p.patient_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                        {p.bill_number}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        Total: {formatCurrency(p.invoice_total)}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--mint-50)',
                          color: 'var(--mint-700)',
                          borderColor: 'var(--mint-100)',
                          fontWeight: 600,
                        }}
                      >
                        {p.payment_method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--teal-700)', fontSize: '0.95rem' }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.transaction_reference || '—'}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {p.cashier_name || 'Accounts Staff'}
                    </td>
                    <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      {formatDate(p.payment_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModal) onCloseModal();
        }}
        title="Record Invoice Settlement Payment"
        maxWidth="550px"
      >
        <form onSubmit={handleSubmitPayment}>
          <div className="form-group">
            <label className="form-label">Target Invoice (with Outstanding Balance) *</label>
            <select
              className="form-control"
              required
              value={selectedBillId}
              onChange={(e) => handleBillSelectChange(e.target.value)}
            >
              <option value="">-- Choose Pending Invoice --</option>
              {unpaidBills.map((b) => (
                <option key={b.bill_id} value={b.bill_id}>
                  {b.bill_number} &bull; {b.patient_name} &bull; Bal: {formatCurrency(b.balance_amount)}
                </option>
              ))}
            </select>
          </div>

          {currentSelectedBill && (
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Invoiced:</span>{' '}
                <strong>{formatCurrency(currentSelectedBill.total_amount)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Current Balance:</span>{' '}
                <strong style={{ color: 'var(--rose-600)' }}>{formatCurrency(currentSelectedBill.balance_amount)}</strong>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={currentSelectedBill ? currentSelectedBill.balance_amount : undefined}
                className="form-control"
                required
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Overpayment is guarded against automatically by PostgreSQL triggers.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Counter</option>
                <option value="Card">Credit / Debit Card (POS)</option>
                <option value="Online">Online NetBanking</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction / POS Receipt Reference</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. UPI-REF-981240 / POS-SLIP-449"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Notes & Remarks</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Partial advance settlement or complete balance clearance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                if (onCloseModal) onCloseModal();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Committing Transaction...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
