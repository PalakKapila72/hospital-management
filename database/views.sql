-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — DATABASE VIEWS
-- Academic Requirement: Practical Views for Reporting & Analytics
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View 1: v_dashboard_stats
-- Aggregates real-time core metrics for the executive dashboard
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM patients WHERE is_active = TRUE) AS total_patients,
    (SELECT COUNT(*) FROM doctors WHERE is_active = TRUE) AS total_doctors,
    (SELECT COUNT(*) FROM departments WHERE is_active = TRUE) AS total_departments,
    (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) AS today_appointments,
    (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') AS completed_appointments,
    (SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled') AS cancelled_appointments,
    (SELECT COALESCE(SUM(amount), 0.00) FROM payments) AS total_revenue,
    (SELECT COALESCE(SUM(balance_amount), 0.00) FROM bills WHERE payment_status <> 'Paid') AS pending_balance;

-- ----------------------------------------------------------------------------
-- View 2: v_appointment_details
-- Multi-table join combining appointment, patient, doctor, and department info
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointment_details AS
SELECT 
    a.appointment_id,
    a.appointment_code,
    a.appointment_date,
    a.appointment_time,
    a.reason_for_visit,
    a.status,
    a.cancellation_reason,
    p.patient_id,
    p.patient_code,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    p.gender AS patient_gender,
    d.doctor_id,
    d.full_name AS doctor_name,
    d.specialization,
    d.consultation_fee,
    dept.department_id,
    dept.department_name,
    b.bill_id,
    b.bill_number,
    b.total_amount AS bill_total,
    b.paid_amount AS bill_paid,
    b.balance_amount AS bill_balance,
    b.payment_status,
    mr.record_id,
    mr.record_code
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
JOIN doctors d ON a.doctor_id = d.doctor_id
JOIN departments dept ON d.department_id = dept.department_id
LEFT JOIN bills b ON a.appointment_id = b.appointment_id
LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id;

-- ----------------------------------------------------------------------------
-- View 3: v_doctor_appointments
-- Summarizes appointment workload and performance metrics per doctor
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_doctor_appointments AS
SELECT 
    d.doctor_id,
    d.full_name AS doctor_name,
    d.specialization,
    dept.department_name,
    d.consultation_fee,
    COUNT(a.appointment_id) AS total_appointments,
    COUNT(CASE WHEN a.status = 'Scheduled' THEN 1 END) AS scheduled_count,
    COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN a.status = 'Cancelled' THEN 1 END) AS cancelled_count,
    COUNT(CASE WHEN a.status = 'No-Show' THEN 1 END) AS noshow_count
FROM doctors d
JOIN departments dept ON d.department_id = dept.department_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY d.doctor_id, d.full_name, d.specialization, dept.department_name, d.consultation_fee;

-- ----------------------------------------------------------------------------
-- View 4: v_patient_billing_summary
-- Aggregated financial status per patient (total billed, paid, and outstanding)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_patient_billing_summary AS
SELECT 
    p.patient_id,
    p.patient_code,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    COUNT(b.bill_id) AS total_invoices,
    COALESCE(SUM(b.total_amount), 0.00) AS total_billed,
    COALESCE(SUM(b.paid_amount), 0.00) AS total_paid,
    COALESCE(SUM(b.balance_amount), 0.00) AS total_outstanding,
    CASE 
        WHEN COALESCE(SUM(b.balance_amount), 0.00) = 0 THEN 'Clear'
        ELSE 'Has Outstanding'
    END AS account_status
FROM patients p
LEFT JOIN bills b ON p.patient_id = b.patient_id
GROUP BY p.patient_id, p.patient_code, p.full_name, p.phone;

-- ----------------------------------------------------------------------------
-- View 5: v_daily_revenue_report
-- Daily financial collections grouped by payment method
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_daily_revenue_report AS
SELECT 
    DATE(p.payment_date) AS payment_date,
    p.payment_method,
    COUNT(p.payment_id) AS transaction_count,
    SUM(p.amount) AS total_collected
FROM payments p
GROUP BY DATE(p.payment_date), p.payment_method
ORDER BY payment_date DESC, total_collected DESC;
