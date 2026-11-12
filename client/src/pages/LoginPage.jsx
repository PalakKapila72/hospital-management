import React, { useState } from 'react';
import {
  Hospital,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Stethoscope,
  UserCheck,
  Shield,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p, roleKey) => {
    setUsername(u);
    setPassword(p);
    setActivePreset(roleKey);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #162a38 0%, #0a0f1d 75%)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Accent Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Hospital Branding Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '2.25rem 2rem 1.85rem',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.15rem',
              boxShadow: '0 6px 18px rgba(13, 148, 136, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Hospital size={28} color="#ffffff" />
          </div>

          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              lineHeight: 1.25,
            }}
          >
            Apex General Hospital
          </h1>
          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--teal-400)',
              fontWeight: 600,
              marginTop: '0.35rem',
              letterSpacing: '0.02em',
            }}
          >
            Hospital Administration & DBMS Portal
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.85rem',
              padding: '0.2rem 0.65rem',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              fontSize: '0.725rem',
              color: '#94a3b8',
            }}
          >
            <Database size={12} color="var(--teal-400)" />
            <span>PostgreSQL 18 Relational Backend</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div style={{ padding: '2rem 2.25rem 2.25rem' }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                <span>Username or Staff ID</span>
              </label>
              <div className="search-input-wrapper" style={{ width: '100%' }}>
                <User size={18} />
                <input
                  id="login-username"
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin or dr.sarah"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setActivePreset(null);
                  }}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="login-password">
                <span>Password</span>
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter staff password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActivePreset(null);
                  }}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                borderRadius: 'var(--radius-md)',
              }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#fff' }} />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Clinical Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Academic Demonstration */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <ShieldCheck size={14} color="var(--teal-600)" />
                <span>Demo Academic Accounts</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Click to fill</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('admin', 'Admin@123', 'admin')}
                style={{
                  padding: '0.55rem 0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  borderColor: activePreset === 'admin' ? 'var(--teal-600)' : 'var(--border-light)',
                  background: activePreset === 'admin' ? 'var(--teal-50)' : '#ffffff',
                }}
              >
                <Shield size={15} color={activePreset === 'admin' ? 'var(--teal-600)' : '#64748b'} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Admin</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('dr.sarah', 'Doctor@123', 'doctor')}
                style={{
                  padding: '0.55rem 0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  borderColor: activePreset === 'doctor' ? 'var(--teal-600)' : 'var(--border-light)',
                  background: activePreset === 'doctor' ? 'var(--teal-50)' : '#ffffff',
                }}
              >
                <Stethoscope size={15} color={activePreset === 'doctor' ? 'var(--teal-600)' : '#64748b'} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Doctor</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('receptionist', 'Staff@123', 'receptionist')}
                style={{
                  padding: '0.55rem 0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  borderColor: activePreset === 'receptionist' ? 'var(--teal-600)' : 'var(--border-light)',
                  background: activePreset === 'receptionist' ? 'var(--teal-50)' : '#ffffff',
                }}
              >
                <UserCheck size={15} color={activePreset === 'receptionist' ? 'var(--teal-600)' : '#64748b'} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reception</span>
              </button>
            </div>

            <p
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-light)',
                marginTop: '0.75rem',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              Pre-seeded third-year DBMS project accounts with role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
