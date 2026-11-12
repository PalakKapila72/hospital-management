import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: isDanger ? 'var(--rose-50)' : 'var(--amber-50)',
            color: isDanger ? 'var(--rose-600)' : 'var(--amber-600)',
            border: `1px solid ${isDanger ? 'var(--rose-100)' : 'var(--amber-100)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isDanger ? <AlertCircle size={22} /> : <AlertTriangle size={22} />}
        </div>
        <div>
          <p style={{ color: 'var(--navy-800)', fontSize: '0.92rem', lineHeight: '1.55' }}>
            {message}
          </p>
        </div>
      </div>

      <div
        className="modal-footer"
        style={{
          margin: '1.5rem -1.75rem -1.5rem',
          paddingTop: '1rem',
        }}
      >
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </button>
        <button
          className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#fff' }} />
              <span>Processing...</span>
            </div>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
};
