import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Users,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Stethoscope,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const DepartmentsPage = () => {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    department_name: '',
    description: '',
    head_of_department: '',
    location: 'Main Building',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/departments');
      if (res.success) {
        setDepartments(res.departments);
      }
    } catch (err) {
      setError(err.message || 'Failed to query clinical departments from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      department_name: dept.department_name,
      description: dept.description || '',
      head_of_department: dept.head_of_department || '',
      location: dept.location || 'Main Building',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.department_id}`, formData);
        setSuccessMsg(`Department '${formData.department_name}' details updated.`);
      } else {
        await api.post('/departments', formData);
        setSuccessMsg(`Department '${formData.department_name}' established successfully.`);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Operation failed. Verify department name uniqueness.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Top Banner and Actions */}
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Clinical Departments
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hospital divisions, faculty leadership, physical wing locations, and active specialist allocations.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Establish Department</span>
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

      {/* Department Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Departments Established"
          description="Create your first hospital department to begin organizing medical staff and wards."
          actionLabel={isAdmin ? "Create Department" : undefined}
          onAction={isAdmin ? handleOpenAdd : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.35rem' }}>
          {departments.map((dept) => (
            <div
              key={dept.department_id}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '4px solid var(--blue-600)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--blue-50)',
                        color: 'var(--blue-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--blue-100)',
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        {dept.department_name}
                      </h3>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        Department ID: #{dept.department_id}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      className="btn-icon"
                      title="Edit Department Details"
                      onClick={() => handleOpenEdit(dept)}
                      aria-label={`Edit ${dept.department_name}`}
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.85rem',
                    lineHeight: '1.45',
                  }}
                >
                  {dept.description || 'Clinical department providing specialized diagnosis and patient care.'}
                </p>

                {/* Meta pills */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    margin: '1.15rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    fontSize: '0.825rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--navy-800)' }}>
                    <UserCheck size={16} color="var(--teal-600)" />
                    <span>Head: <strong>{dept.head_of_department || 'Pending Appointment'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--navy-800)' }}>
                    <MapPin size={16} color="var(--blue-600)" />
                    <span>Facility Wing: <strong>{dept.location}</strong></span>
                  </div>
                </div>
              </div>

              {/* Doctors Allocation Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Stethoscope size={14} /> Medical Staff
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    background: 'var(--blue-50)',
                    color: 'var(--blue-700)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--blue-100)',
                    fontSize: '0.785rem',
                  }}
                >
                  {dept.total_doctors} Doctors ({dept.active_doctors} Active)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.department_name}` : 'Establish Clinical Department'}
        maxWidth="520px"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Cardiology & Vascular Surgery"
              value={formData.department_name}
              onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Clinical Overview & Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Clinical specialty, diagnostic scope and treatments..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Head of Department (Faculty Lead)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Rajesh Sharma, MD"
              value={formData.head_of_department}
              onChange={(e) => setFormData({ ...formData, head_of_department: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hospital Location / Wing</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Block B, 3rd Floor"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
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
              {submitting ? 'Saving to Database...' : editingDept ? 'Update Department' : 'Establish Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
