import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  User,
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Info,
  Banknote,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AppointmentBookingPage = ({ preselectedPatientId, onBookingSuccess, onNavigateToAppointments }) => {
  const [patients, setPatients] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Form State
  const [patientId, setPatientId] = useState(preselectedPatientId || '');
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Doctor schedule & booked slots
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Standard consultation timeslots
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        setInitialLoading(true);
        const [patRes, deptRes, docRes] = await Promise.all([
          api.get('/patients', { limit: 100 }),
          api.get('/departments'),
          api.get('/doctors', { is_active: 'true' }),
        ]);

        if (patRes.success) setPatients(patRes.data);
        if (deptRes.success) setDepartments(deptRes.departments);
        if (docRes.success) {
          setDoctors(docRes.doctors);
          setFilteredDoctors(docRes.doctors);
          if (docRes.doctors.length > 0) {
            setDoctorId(docRes.doctors[0].doctor_id);
            setDepartmentId(docRes.doctors[0].department_id);
          }
        }
      } catch (err) {
        setError(err.message || 'Error loading booking prerequisites.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPrerequisites();
  }, []);

  // Filter doctors when department changes
  useEffect(() => {
    if (departmentId) {
      const filtered = doctors.filter((d) => d.department_id === parseInt(departmentId, 10));
      setFilteredDoctors(filtered);
      if (filtered.length > 0) {
        setDoctorId(filtered[0].doctor_id);
      } else {
        setDoctorId('');
      }
    } else {
      setFilteredDoctors(doctors);
    }
  }, [departmentId, doctors]);

  // Fetch booked slots whenever doctor or date changes
  useEffect(() => {
    if (doctorId && appointmentDate) {
      const fetchSlots = async () => {
        setLoadingSchedule(true);
        try {
          const res = await api.get(`/doctors/${doctorId}/schedule`, { date: appointmentDate });
          if (res.success) {
            setBookedSlots(res.bookedSlots || []);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSchedule(false);
        }
      };
      fetchSlots();
    }
  }, [doctorId, appointmentDate]);

  const selectedDoctor = doctors.find((d) => d.doctor_id === parseInt(doctorId, 10));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !reasonForVisit.trim()) {
      setError('Please select a patient, doctor, appointment date, consultation timeslot, and reason for visit.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        patient_id: parseInt(patientId, 10),
        doctor_id: parseInt(doctorId, 10),
        appointment_date: appointmentDate,
        appointment_time: `${appointmentTime}:00`,
        reason_for_visit: reasonForVisit.trim(),
      };

      const res = await api.post('/appointments', payload);
      if (res.success) {
        setConfirmedBooking(res);
        if (onBookingSuccess) onBookingSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to book appointment. Timeslot conflict detected.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfirmedBooking(null);
    setAppointmentTime('');
    setReasonForVisit('');
  };

  if (initialLoading) {
    return (
      <div className="page-container" style={{ maxWidth: '850px' }}>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  if (confirmedBooking) {
    const { appointment, bill } = confirmedBooking;
    return (
      <div className="page-container" style={{ maxWidth: '620px', margin: '1rem auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '2.5rem 2rem',
            borderTop: '5px solid var(--mint-500)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--mint-50)',
              color: 'var(--mint-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)' }}>
            Appointment Confirmed!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            The timeslot has been reserved in PostgreSQL and an itemized consultation invoice has been issued.
          </p>

          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem',
              margin: '1.75rem 0',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.885rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Appointment Code:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-700)', fontSize: '0.95rem' }}>
                {appointment?.appointment_code}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Consultation Time:</span>
              <strong>{formatDate(appointment?.appointment_date)} at {formatTime(appointment?.appointment_time)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Attending Specialist:</span>
              <strong>{selectedDoctor?.full_name} ({selectedDoctor?.specialization})</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Invoice Number:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{bill?.bill_number}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Consultation Fee:</span>
              <strong style={{ color: 'var(--teal-700)', fontSize: '1.15rem' }}>
                {formatCurrency(bill?.total_amount)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={resetForm}>
              <RotateCcw size={15} /> Book Another
            </button>
            <button className="btn btn-primary" onClick={onNavigateToAppointments}>
              <span>View in Appointment Queue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '850px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Book Doctor Consultation
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Schedule an in-person clinical appointment with real-time slot conflict detection.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Booking Notice:</strong> {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
        {/* Step 1: Patient Selection */}
        <div>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={16} color="var(--teal-600)" />
              <span>Select Registered Patient *</span>
            </span>
          </label>
          <select
            className="form-control"
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">-- Choose Patient from Clinical Directory --</option>
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.full_name} ({p.patient_code}) &bull; {p.phone} &bull; {p.gender}, {p.age} yrs
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Department and Doctor */}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Building2 size={16} color="var(--blue-600)" />
                <span>Department</span>
              </span>
            </label>
            <select
              className="form-control"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Stethoscope size={16} color="var(--teal-600)" />
                <span>Assigned Specialist *</span>
              </span>
            </label>
            <select
              className="form-control"
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">-- Choose Specialist --</option>
              {filteredDoctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.full_name} ({doc.specialization} &bull; {formatCurrency(doc.consultation_fee)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Details Summary Banner */}
        {selectedDoctor && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{selectedDoctor.full_name}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                ({selectedDoctor.qualification}) &bull; {selectedDoctor.department_name}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Available: {selectedDoctor.available_days} ({selectedDoctor.available_time_start?.slice(0, 5)} - {selectedDoctor.available_time_end?.slice(0, 5)})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Fee</div>
              <strong style={{ color: 'var(--teal-700)', fontSize: '1.05rem' }}>
                {formatCurrency(selectedDoctor.consultation_fee)}
              </strong>
            </div>
          </div>
        )}

        {/* Step 3: Date & Timeslot Chips */}
        <div>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Calendar size={16} color="var(--teal-600)" />
              <span>Consultation Date *</span>
            </span>
          </label>
          <input
            type="date"
            className="form-control"
            required
            min={new Date().toISOString().slice(0, 10)}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
          />
        </div>

        {/* Timeslot Chips */}
        <div>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Clock size={16} color="var(--teal-600)" />
              <span>Select Consultation Timeslot *</span>
            </span>
            {loadingSchedule && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Refreshing doctor availability...
              </span>
            )}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
            {defaultTimeSlots.map((time) => {
              const isBooked = bookedSlots.some((bs) => bs.slice(0, 5) === time);
              const isSelected = appointmentTime === time;

              return (
                <button
                  key={time}
                  type="button"
                  disabled={isBooked}
                  onClick={() => setAppointmentTime(time)}
                  style={{
                    padding: '0.55rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '2px solid var(--teal-600)'
                      : isBooked
                      ? '1px dashed #cbd5e1'
                      : '1px solid var(--border-light)',
                    background: isSelected
                      ? 'var(--teal-50)'
                      : isBooked
                      ? '#f8fafc'
                      : '#ffffff',
                    color: isSelected
                      ? 'var(--teal-700)'
                      : isBooked
                      ? 'var(--text-light)'
                      : 'var(--navy-900)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.825rem',
                    cursor: isBooked ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem',
                    transition: 'var(--transition-fast)',
                    textDecoration: isBooked ? 'line-through' : 'none',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Open'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Reason for Consultation */}
        <div>
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <FileText size={16} color="var(--teal-600)" />
              <span>Reason for Visit & Reported Symptoms *</span>
            </span>
          </label>
          <textarea
            className="form-control"
            required
            rows={2}
            placeholder="e.g. Routine hypertension checkup, persistent cough, follow-up on lab report..."
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
          />
        </div>

        {/* Database Concurrency Conflict Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            background: 'var(--blue-50)',
            border: '1px solid var(--blue-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--blue-700)',
            fontSize: '0.8rem',
          }}
        >
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>ACID Concurrency Protection:</strong> Booking utilizes database transactional row-locks (`SELECT ... FOR UPDATE`) to guarantee zero double-booking conflicts even during concurrent requests.
          </span>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateToAppointments}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !appointmentTime || !patientId}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#fff' }} />
                <span>Reserving Timeslot...</span>
              </div>
            ) : (
              <>
                <CalendarCheck size={16} />
                <span>Confirm Consultation ({formatCurrency(selectedDoctor?.consultation_fee || 0)})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
