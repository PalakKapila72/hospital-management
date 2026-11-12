import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldAlert,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'Receptionist',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/auth/users');
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      setError(err.message || 'Failed to query staff accounts from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.full_name.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/auth/users', {
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
      });
      if (res.success) {
        setSuccessMsg(`Staff account '${formData.username}' created successfully.`);
        setIsModalOpen(false);
        setFormData(initialForm);
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Failed to create user account. Username or email may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin':
        return { bg: 'var(--amber-50)', color: 'var(--amber-700)', border: 'var(--amber-100)', Icon: ShieldAlert };
      case 'Doctor':
        return { bg: 'var(--blue-50)', color: 'var(--blue-700)', border: 'var(--blue-100)', Icon: Stethoscope };
      case 'Receptionist':
      default:
        return { bg: 'var(--teal-50)', color: 'var(--teal-700)', border: 'var(--teal-100)', Icon: UserCheck };
    }
  };

  return (
    <div className="page-container">
      {/* Header and Actions */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Hospital Staff Accounts & Permissions
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            System users, role-based access control (Admin, Doctor, Receptionist), and session logs.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Staff Account</span>
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

      {/* Users Data Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <LoadingSkeleton variant="table" count={4} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No Staff Accounts Found"
            description="Create staff credentials to grant system access to doctors and frontdesk personnel."
            actionLabel="New Staff Account"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Username Identifier</th>
                  <th>Full Name & Identity</th>
                  <th>Work Email</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Last Authentication</th>
                  <th>Creation Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleStyle = getRoleBadgeStyle(u.role);
                  const RoleIcon = roleStyle.Icon;

                  return (
                    <tr key={u.user_id}>
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
                          {u.username}
                        </span>
                      </td>
                      <td>
                        <div className="table-avatar-cell">
                          <div className="avatar-circle">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{u.full_name}</div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Staff ID #{u.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            borderColor: roleStyle.border,
                            fontWeight: 700,
                          }}
                        >
                          <RoleIcon size={12} /> {u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: u.is_active ? 'var(--mint-50)' : '#f1f5f9',
                            color: u.is_active ? 'var(--mint-700)' : 'var(--text-muted)',
                            borderColor: u.is_active ? 'var(--mint-100)' : 'var(--border-light)',
                          }}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {u.last_login ? formatDate(u.last_login) : 'Never logged in'}
                      </td>
                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Hospital Staff User Account"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Dr. Rajesh Khanna"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. rajesh.khanna"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              className="form-control"
              required
              placeholder="rajesh@apexgeneral.hospital"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password *</label>
            <input
              type="password"
              className="form-control"
              required
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Role & Permissions *</label>
            <select
              className="form-control"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Receptionist">Receptionist (Frontdesk, Patients & Scheduling)</option>
              <option value="Doctor">Doctor (Clinical Records, Prescriptions & Consults)</option>
              <option value="Admin">Admin (Full System Management & Staff Accounts)</option>
            </select>
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
              {submitting ? 'Creating Account...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
