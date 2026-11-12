-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — SQL LAB & ACADEMIC VIVA QUERIES
-- Third-Year BE Computer Science DBMS Demonstration Script
-- Demonstrates DDL, DML, Joins, Aggregates, Subqueries, & Correlated Subqueries
-- ============================================================================

-- ============================================================================
-- PART 1: BASIC DML & FILTERING QUERIES
-- ============================================================================

-- Q1. Retrieve all active patients sorted by name (SELECT, WHERE, ORDER BY)
SELECT patient_id, patient_code, full_name, gender, blood_group, phone
FROM patients
WHERE is_active = TRUE
ORDER BY full_name ASC;

-- Q2. Find top 5 most recently registered patients (LIMIT)
SELECT patient_code, full_name, date_of_birth, created_at
FROM patients
ORDER BY created_at DESC
LIMIT 5;

-- Q3. List all distinct blood groups currently represented in the hospital (DISTINCT)
SELECT DISTINCT blood_group
FROM patients
WHERE blood_group IS NOT NULL
ORDER BY blood_group;

-- ============================================================================
-- PART 2: INNER JOINS, LEFT JOINS & MULTI-TABLE JOINS
-- ============================================================================

-- Q4. Doctor listing with their assigned department details (INNER JOIN)
SELECT 
    d.doctor_id,
    d.full_name AS doctor_name,
    d.specialization,
    d.consultation_fee,
    dept.department_name,
    dept.location AS department_location
FROM doctors d
INNER JOIN departments dept ON d.department_id = dept.department_id
WHERE d.is_active = TRUE;

-- Q5. Appointments with Patient, Doctor, and Department names (Multi-Table JOIN)
SELECT 
    a.appointment_code,
    a.appointment_date,
    a.appointment_time,
    a.status,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    d.full_name AS doctor_name,
    dept.department_name
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
JOIN doctors d ON a.doctor_id = d.doctor_id
JOIN departments dept ON d.department_id = dept.department_id
WHERE a.status = 'Scheduled'
ORDER BY a.appointment_date ASC, a.appointment_time ASC;

-- Q6. Patients who have never booked an appointment (LEFT JOIN with NULL check)
SELECT 
    p.patient_id,
    p.patient_code,
    p.full_name,
    p.phone
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;

-- ============================================================================
-- PART 3: AGGREGATE QUERIES (COUNT, SUM, AVG, MIN, MAX) & GROUP BY / HAVING
-- ============================================================================

-- Q7. Count of active doctors and average consultation fee per department (GROUP BY, COUNT, AVG)
SELECT 
    dept.department_name,
    COUNT(d.doctor_id) AS total_doctors,
    ROUND(AVG(d.consultation_fee), 2) AS average_consultation_fee,
    MIN(d.consultation_fee) AS min_fee,
    MAX(d.consultation_fee) AS max_fee
FROM departments dept
LEFT JOIN doctors d ON dept.department_id = d.department_id AND d.is_active = TRUE
GROUP BY dept.department_id, dept.department_name
ORDER BY total_doctors DESC;

-- Q8. Departments handling more than 2 total appointments (HAVING clause)
SELECT 
    dept.department_name,
    COUNT(a.appointment_id) AS appointment_count
FROM departments dept
JOIN doctors d ON dept.department_id = d.department_id
JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY dept.department_name
HAVING COUNT(a.appointment_id) >= 2
ORDER BY appointment_count DESC;

-- Q9. Total revenue collected by payment method (SUM, COUNT)
SELECT 
    payment_method,
    COUNT(payment_id) AS transactions_count,
    SUM(amount) AS total_amount_collected,
    ROUND(AVG(amount), 2) AS average_transaction_value
FROM payments
GROUP BY payment_method
ORDER BY total_amount_collected DESC;

-- ============================================================================
-- PART 4: SUBQUERIES & CORRELATED SUBQUERIES
-- ============================================================================

-- Q10. Find doctors whose consultation fee is higher than the hospital-wide average (Subquery)
SELECT 
    full_name,
    specialization,
    consultation_fee
FROM doctors
WHERE consultation_fee > (SELECT AVG(consultation_fee) FROM doctors)
ORDER BY consultation_fee DESC;

-- Q11. Correlated Subquery: Find patients who have outstanding balances above ₹500
SELECT 
    p.patient_id,
    p.patient_code,
    p.full_name,
    p.phone,
    (SELECT SUM(b.balance_amount) FROM bills b WHERE b.patient_id = p.patient_id AND b.payment_status <> 'Paid') AS total_outstanding
FROM patients p
WHERE EXISTS (
    SELECT 1 
    FROM bills b 
    WHERE b.patient_id = p.patient_id 
      AND b.balance_amount > 500
);

-- Q12. Correlated Subquery: Count the number of prescriptions issued per medical record
SELECT 
    mr.record_code,
    mr.diagnosis,
    p.full_name AS patient_name,
    d.full_name AS doctor_name,
    (SELECT COUNT(*) FROM prescriptions pr WHERE pr.record_id = mr.record_id) AS total_medicines_prescribed
FROM medical_records mr
JOIN patients p ON mr.patient_id = p.patient_id
JOIN doctors d ON mr.doctor_id = d.doctor_id
ORDER BY total_medicines_prescribed DESC;

-- ============================================================================
-- PART 5: TRANSACTIONS & CONCURRENCY DEMONSTRATION
-- ============================================================================

-- Demonstration of explicit ACID transaction with COMMIT / ROLLBACK:
/*
BEGIN;
    -- Step 1: Lock and verify the bill
    SELECT bill_id, total_amount, paid_amount, balance_amount 
    FROM bills 
    WHERE bill_id = 1 
    FOR UPDATE;

    -- Step 2: Record payment
    INSERT INTO payments (payment_reference, bill_id, amount, payment_method, notes)
    VALUES ('PAY-DEMO-001', 1, 500.00, 'Cash', 'Demo cash payment');

    -- Step 3: Update invoice balance
    UPDATE bills
    SET paid_amount = paid_amount + 500.00,
        balance_amount = balance_amount - 500.00,
        payment_status = CASE WHEN balance_amount - 500.00 = 0 THEN 'Paid' ELSE 'Partially Paid' END
    WHERE bill_id = 1;

COMMIT; -- Or ROLLBACK in case of error
*/
