-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — RELATIONAL DATABASE SCHEMA (PostgreSQL)
-- Target DBMS: PostgreSQL 14+ (Compatible with PostgreSQL 18)
-- Design: Third Normal Form (3NF) with referential integrity & audit capabilities
-- ============================================================================

-- Drop tables if re-running (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DEPARTMENTS TABLE
-- Stores medical departments within the hospital
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_of_department VARCHAR(100),
    location VARCHAR(100) DEFAULT 'Main Building',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- Stores credentials and roles for staff authentication (Admin, Doctor, Receptionist)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Receptionist')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. DOCTORS TABLE
-- Normalized doctor profiles referencing departments and optional user accounts
-- ----------------------------------------------------------------------------
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(user_id) ON DELETE SET NULL,
    department_id INT NOT NULL REFERENCES departments(department_id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(100) NOT NULL DEFAULT 'MBBS',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00 CHECK (consultation_fee >= 0),
    available_days VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    available_time_start TIME NOT NULL DEFAULT '09:00:00',
    available_time_end TIME NOT NULL DEFAULT '17:00:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. PATIENTS TABLE
-- Stores registered patient demographic and emergency contact details
-- ----------------------------------------------------------------------------
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    patient_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE
-- Manages patient doctor consultations and prevents double booking via UNIQUE constraint
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    appointment_code VARCHAR(25) NOT NULL UNIQUE,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason_for_visit TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' 
        CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')),
    cancellation_reason TEXT,
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Concurrency & integrity rule: Prevent booking the same doctor at the same slot
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- ----------------------------------------------------------------------------
-- 6. MEDICAL RECORDS TABLE
-- Clinical documentation for completed consultations
-- ----------------------------------------------------------------------------
CREATE TABLE medical_records (
    record_id SERIAL PRIMARY KEY,
    record_code VARCHAR(25) NOT NULL UNIQUE,
    appointment_id INT NOT NULL UNIQUE REFERENCES appointments(appointment_id) ON DELETE RESTRICT,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_plan TEXT NOT NULL,
    clinical_notes TEXT,
    vital_signs JSONB DEFAULT '{"bp": "120/80", "pulse": 72, "temperature": "98.6 F", "weight_kg": 65}'::jsonb,
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. PRESCRIPTIONS TABLE
-- Medication items prescribed during a medical consultation
-- ----------------------------------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    record_id INT NOT NULL REFERENCES medical_records(record_id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,         -- e.g. '500 mg'
    frequency VARCHAR(50) NOT NULL,      -- e.g. 'Twice daily after meals'
    duration VARCHAR(50) NOT NULL,       -- e.g. '5 days'
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. BILLS TABLE
-- Master invoice linked to an appointment, maintaining consultation and items totals
-- ----------------------------------------------------------------------------
CREATE TABLE bills (
    bill_id SERIAL PRIMARY KEY,
    bill_number VARCHAR(30) NOT NULL UNIQUE,
    appointment_id INT NOT NULL UNIQUE REFERENCES appointments(appointment_id) ON DELETE RESTRICT,
    patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (consultation_fee >= 0),
    additional_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (additional_charges >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(10, 2) NOT NULL CHECK (balance_amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' 
        CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid')),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance_valid CHECK (balance_amount = (total_amount - paid_amount))
);

-- ----------------------------------------------------------------------------
-- 9. BILL ITEMS TABLE
-- Itemized hospital services and diagnostics attached to an invoice
-- ----------------------------------------------------------------------------
CREATE TABLE bill_items (
    item_id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL REFERENCES bills(bill_id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. PAYMENTS TABLE
-- Ledger of actual payment transactions against invoices
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    payment_reference VARCHAR(50) NOT NULL UNIQUE,
    bill_id INT NOT NULL REFERENCES bills(bill_id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Online')),
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    recorded_by INT REFERENCES users(user_id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- Tracks critical changes (appointments status changes, payments, user actions)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id INT,
    changed_by VARCHAR(50),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- Optimizes frequent queries, joins, and search operations
-- ============================================================================
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_doctors_dept ON doctors(department_id);
CREATE INDEX idx_doctors_active ON doctors(is_active);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_prescriptions_record ON prescriptions(record_id);
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_appointment ON bills(appointment_id);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_payments_bill ON payments(bill_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name, action_type);
