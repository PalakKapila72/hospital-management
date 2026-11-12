import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg('');
    setProfileErr('');

    try {
      const res = await api.put('/auth/profile', { full_name: fullName.trim(), email: email.trim() });
      if (res.success) {
        setProfileMsg('Profile information updated successfully.');
        updateUser(res.user);
      }
    } catch (err) {
      setProfileErr(err.message || 'Failed to update profile information.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordErr('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr('Password must be at least 6 characters in length.');
      return;
    }

    setUpdatingPassword(true);
    setPasswordMsg('');
    setPasswordErr('');

    try {
      const res = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (res.success) {
        setPasswordMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordErr(err.message || 'Failed to change password. Verify current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '850px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            User Account & Security Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage staff credentials, display name, work email address, and security passwords.
          </p>
        </div>
      </div>

      {/* Account Overview Header Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--teal-600), var(--teal-500))',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
          }}
        >
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              {user?.full_name || 'Staff User'}
            </h3>
            <span
              style={{
                fontSize: '0.725rem',
                padding: '0.15rem 0.55rem',
                background: 'rgba(45, 212, 191, 0.2)',
                color: 'var(--teal-400)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {user?.role}
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginTop: '0.2rem' }}>
            Username: <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{user?.username}</strong> &bull; Email: {user?.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.15rem' }}>
            <User size={18} color="var(--teal-600)" />
            <span>Profile Information</span>
          </h3>

          {profileMsg && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{profileMsg}</span>
            </div>
          )}

          {profileErr && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{profileErr}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                disabled
                value={user?.username || ''}
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                Username identifier is immutable in PostgreSQL.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Hospital Staff Role</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className="badge"
                  style={{
                    background: 'var(--teal-50)',
                    color: 'var(--teal-700)',
                    borderColor: 'var(--teal-100)',
                    fontWeight: 700,
                    padding: '0.35rem 0.65rem',
                  }}
                >
                  <ShieldCheck size={14} /> {user?.role}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={updatingProfile}
            >
              {updatingProfile ? 'Saving...' : 'Update Information'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.15rem' }}>
            <KeyRound size={18} color="var(--blue-600)" />
            <span>Change Security Password</span>
          </h3>

          {passwordMsg && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordErr && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{passwordErr}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={updatingPassword}
            >
              {updatingPassword ? 'Encrypting & Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
