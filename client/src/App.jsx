import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { PrescriptionsPage } from './pages/PrescriptionsPage';
import { BillingPage } from './pages/BillingPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Cross-page state transfers
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedAppointmentIdForRecord, setSelectedAppointmentIdForRecord] = useState(null);
  const [selectedRecordIdForPrint, setSelectedRecordIdForPrint] = useState(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--navy-900)',
          color: '#ffffff',
          gap: '1rem',
        }}
      >
        <div className="spinner" style={{ width: '44px', height: '44px', borderWidth: '3.5px' }} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Apex General Hospital
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Connecting to PostgreSQL database & verifying session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Navigation handlers
  const handleSelectPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setCurrentTab('patient-detail');
  };

  const handleBookForPatient = (patientId) => {
    setSelectedPatientId(patientId);
    setCurrentTab('book-appointment');
  };

  const handleConsultAppointment = (appointmentId) => {
    setSelectedAppointmentIdForRecord(appointmentId);
    setCurrentTab('medical-records');
  };

  const handlePrintPrescription = (recordId) => {
    setSelectedRecordIdForPrint(recordId);
    setCurrentTab('prescriptions');
  };

  const handleOpenPaymentForBill = (bill) => {
    setSelectedBillForPayment(bill);
    setCurrentTab('payments');
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Executive Clinical Overview',
          sub: 'Real-time database aggregated metrics, queues & ledger',
          crumbs: ['Overview'],
        };
      case 'patients':
        return {
          title: 'Patients Directory',
          sub: 'Comprehensive clinical registry & demographic profiles',
          crumbs: ['Clinical', 'Patients'],
        };
      case 'patient-detail':
        return {
          title: 'Patient Profile & Medical History',
          sub: 'Detailed consultation chronology & invoice ledger',
          crumbs: ['Clinical', 'Patients', 'Profile'],
        };
      case 'doctors':
        return {
          title: 'Medical Staff & Specialists',
          sub: 'Doctor schedules, departmental assignments & consultation fees',
          crumbs: ['Clinical', 'Specialists'],
        };
      case 'departments':
        return {
          title: 'Clinical Departments',
          sub: 'Hospital divisions, capacity limits & ward locations',
          crumbs: ['Clinical', 'Departments'],
        };
      case 'appointments':
        return {
          title: 'Appointments Management',
          sub: 'Consultation scheduling queue & live status tracking',
          crumbs: ['Scheduling', 'Appointments'],
        };
      case 'book-appointment':
        return {
          title: 'Book Doctor Appointment',
          sub: 'Concurrency-safe booking with timeslot conflict guard',
          crumbs: ['Scheduling', 'Book Appointment'],
        };
      case 'medical-records':
        return {
          title: 'Clinical Medical Records',
          sub: 'Diagnostic documentation, clinical symptoms & treatment plans',
          crumbs: ['Records', 'Medical Records'],
        };
      case 'prescriptions':
        return {
          title: 'Pharmacy & Prescriptions',
          sub: 'Medication management & printable Rx treatment slips',
          crumbs: ['Records', 'Prescriptions'],
        };
      case 'billing':
        return {
          title: 'Billing & Invoicing',
          sub: 'Consultation charges, diagnostic tests & line-item totals',
          crumbs: ['Finance', 'Invoices'],
        };
      case 'payments':
        return {
          title: 'Payments Ledger',
          sub: 'ACID transactional payment records & overpayment check',
          crumbs: ['Finance', 'Payments Ledger'],
        };
      case 'reports':
        return {
          title: 'Academic DBMS SQL Reports',
          sub: 'Relational queries, aggregates, views & CSV export for demonstration',
          crumbs: ['Analytics', 'DBMS Reports'],
        };
      case 'users':
        return {
          title: 'Staff Accounts & Roles',
          sub: 'Role-based access control & user administration',
          crumbs: ['Administration', 'Staff Users'],
        };
      case 'profile':
        return {
          title: 'User Account & Security',
          sub: 'Personal credentials & password management',
          crumbs: ['Settings', 'My Account'],
        };
      default:
        return {
          title: 'Hospital Management System',
          sub: 'Central Administration',
          crumbs: ['Portal'],
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="main-wrapper">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.sub}
          breadcrumbs={pageInfo.crumbs}
          onToggleMobile={() => setIsMobileOpen((prev) => !prev)}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}

          {currentTab === 'patients' && (
            <PatientsPage
              onSelectPatient={handleSelectPatient}
              onBookAppointmentForPatient={handleBookForPatient}
            />
          )}

          {currentTab === 'patient-detail' && (
            <PatientDetailPage
              patientId={selectedPatientId}
              onBack={() => setCurrentTab('patients')}
              onBookAppointment={handleBookForPatient}
            />
          )}

          {currentTab === 'doctors' && <DoctorsPage />}

          {currentTab === 'departments' && <DepartmentsPage />}

          {currentTab === 'appointments' && (
            <AppointmentsPage
              onNavigateToBooking={() => setCurrentTab('book-appointment')}
              onNavigateToMedicalRecord={handleConsultAppointment}
              onNavigateToBill={() => setCurrentTab('billing')}
            />
          )}

          {currentTab === 'book-appointment' && (
            <AppointmentBookingPage
              preselectedPatientId={selectedPatientId}
              onBookingSuccess={() => {}}
              onNavigateToAppointments={() => setCurrentTab('appointments')}
            />
          )}

          {currentTab === 'medical-records' && (
            <MedicalRecordsPage
              initialAppointmentId={selectedAppointmentIdForRecord}
              onPrintPrescription={handlePrintPrescription}
            />
          )}

          {currentTab === 'prescriptions' && (
            <PrescriptionsPage selectedRecordIdToPrint={selectedRecordIdForPrint} />
          )}

          {currentTab === 'billing' && (
            <BillingPage onOpenPaymentModal={handleOpenPaymentForBill} />
          )}

          {currentTab === 'payments' && (
            <PaymentsPage
              prefilledBill={selectedBillForPayment}
              onCloseModal={() => setSelectedBillForPayment(null)}
            />
          )}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'users' && <UsersPage />}

          {currentTab === 'profile' && <ProfilePage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
