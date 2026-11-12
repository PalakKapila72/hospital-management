# Chapter 5: Advanced SQL Queries, Views, Procedures & Triggers

## 1. Overview

In an enterprise database application, business logic must not reside exclusively in client or server scripts. Relational database engines like **PostgreSQL** provide native, compiled procedural environments (**PL/pgSQL**) to enforce referential integrity, manage concurrent race conditions, execute multi-table analytics, and maintain audit trails directly within the database layer.

This chapter details the actual SQL queries, analytical views, stored procedures, triggers, constraints, and indexes implemented in the **Hospital Management System**.

---

## 2. Practical SQL Queries from the Codebase

All queries below are taken directly from [`database/reports.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/reports.sql) and the backend controllers.

---

### Part 1: Basic DML, Sorting & Filtering Queries

#### Q1: Retrieve Active Patients Alphabetically
Demonstrates `SELECT`, projection, `WHERE` boolean filtering, and `ORDER BY` ascending sorting.
```sql
SELECT patient_id, patient_code, full_name, gender, blood_group, phone
FROM patients
WHERE is_active = TRUE
ORDER BY full_name ASC;
```

#### Q2: Top 5 Most Recently Registered Patients
Demonstrates sorting on `TIMESTAMPTZ` and `LIMIT` execution for pagination.
```sql
SELECT patient_code, full_name, date_of_birth, created_at
FROM patients
ORDER BY created_at DESC
LIMIT 5;
```

#### Q3: Distinct Blood Groups Available in the Hospital
Demonstrates the `DISTINCT` keyword filtering out duplicate values and ignoring `NULL` records.
```sql
SELECT DISTINCT blood_group
FROM patients
WHERE blood_group IS NOT NULL
ORDER BY blood_group;
```

---

### Part 2: Inner Joins, Multi-Table Joins & Outer Joins

#### Q4: Doctor Directory with Department Details (INNER JOIN)
Joins `doctors` and `departments` using foreign key `department_id`.
```sql
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
```

#### Q5: 4-Way Multi-Table Join for Scheduled Appointments
Demonstrates joining 4 tables (`appointments`, `patients`, `doctors`, `departments`) in a single query to compose a complete outpatient consultation schedule.
```sql
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
```

#### Q6: Find Patients Who Have Never Booked an Appointment (LEFT JOIN with NULL Check)
Demonstrates finding non-matching records using an outer join.
```sql
SELECT 
    p.patient_id,
    p.patient_code,
    p.full_name,
    p.phone
FROM patients p
LEFT JOIN appointments a ON p.patient_id = a.patient_id
WHERE a.appointment_id IS NULL;
```

---

### Part 3: Aggregates (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) & `GROUP BY` / `HAVING`

#### Q7: Doctor Headcount & Consultation Fee Analytics by Department
Demonstrates `COUNT`, `AVG`, `MIN`, `MAX`, `ROUND`, and grouping across parent-child entities.
```sql
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
```

#### Q8: Departments Handling Heavy Consultation Volumes (`HAVING` Clause)
Demonstrates filtering aggregated groups using `HAVING` instead of `WHERE`.
```sql
SELECT 
    dept.department_name,
    COUNT(a.appointment_id) AS appointment_count
FROM departments dept
JOIN doctors d ON dept.department_id = d.department_id
JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY dept.department_name
HAVING COUNT(a.appointment_id) >= 2
ORDER BY appointment_count DESC;
```

#### Q9: Revenue Collected by Payment Mode
Demonstrates financial reconciliation grouping payments by method (Cash, Card, UPI, Online).
```sql
SELECT 
    payment_method,
    COUNT(payment_id) AS transactions_count,
    SUM(amount) AS total_amount_collected,
    ROUND(AVG(amount), 2) AS average_transaction_value
FROM payments
GROUP BY payment_method
ORDER BY total_amount_collected DESC;
```

---

### Part 4: Subqueries & Correlated Subqueries

#### Q10: Doctors Charging Higher Than the Hospital Average (Scalar Subquery)
Uses an inner scalar subquery calculating `AVG(consultation_fee)` to filter outer records.
```sql
SELECT 
    full_name,
    specialization,
    consultation_fee
FROM doctors
WHERE consultation_fee > (SELECT AVG(consultation_fee) FROM doctors)
ORDER BY consultation_fee DESC;
```

#### Q11: Patients with Outstanding Balance Above ₹500 (Correlated Subquery with `EXISTS`)
Demonstrates a correlated subquery where the inner query refers to `p.patient_id` from the outer query for each candidate tuple.
```sql
SELECT 
    p.patient_id,
    p.patient_code,
    p.full_name,
    p.phone,
    (SELECT SUM(b.balance_amount) 
     FROM bills b 
     WHERE b.patient_id = p.patient_id AND b.payment_status <> 'Paid') AS total_outstanding
FROM patients p
WHERE EXISTS (
    SELECT 1 
    FROM bills b 
    WHERE b.patient_id = p.patient_id 
      AND b.balance_amount > 500
);
```

#### Q12: Count Prescriptions Issued Per Medical Record (Correlated Subquery in `SELECT`)
Calculates the number of prescribed medications dynamically without group-by overhead.
```sql
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
```

---

## 3. Analytical Database Views

The project defines 5 pre-compiled analytical views in [`database/views.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/views.sql).

### View 1: `v_dashboard_stats`
**Purpose**: Powers the real-time KPI stat cards on the executive dashboard. Executes subqueries in a single atomic database read:
```sql
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
```

### View 2: `v_appointment_details`
**Purpose**: Joins appointments, patients, doctors, departments, invoices, and medical records to produce a complete clinical view without requiring client applications to write 6-table joins:
```sql
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
```

### View 3: `v_doctor_appointments`
**Purpose**: Computes consultation workload metrics per doctor, breaking down status counts via conditional aggregation:
```sql
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
```

### View 4: `v_patient_billing_summary`
**Purpose**: Financial status per patient, computing total invoices, total billed, total paid, total outstanding, and flagging account status (`Clear` vs. `Has Outstanding`):
```sql
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
```

### View 5: `v_daily_revenue_report`
**Purpose**: Aggregates daily cashier collections grouped by payment method:
```sql
CREATE OR REPLACE VIEW v_daily_revenue_report AS
SELECT 
    DATE(p.payment_date) AS payment_date,
    p.payment_method,
    COUNT(p.payment_id) AS transaction_count,
    SUM(p.amount) AS total_collected
FROM payments p
GROUP BY DATE(p.payment_date), p.payment_method
ORDER BY payment_date DESC, total_collected DESC;
```

---

## 4. Stored Functions & Procedures (PL/pgSQL)

The database implements 3 critical functions and stored procedures in [`database/functions.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/functions.sql).

---

### Function 1: `fn_sync_bill_totals(p_bill_id INT)`
**Academic Requirement**: Automated business logic calculation inside DBMS.  
**Role**: Recalculates `additional_charges`, grand `total_amount`, `balance_amount`, and auto-determines `payment_status` (`Unpaid`, `Partially Paid`, `Paid`).

```sql
CREATE OR REPLACE FUNCTION fn_sync_bill_totals(p_bill_id INT)
RETURNS VOID AS $$
DECLARE
    v_items_total NUMERIC(10, 2) := 0.00;
    v_consultation NUMERIC(10, 2) := 0.00;
    v_discount NUMERIC(10, 2) := 0.00;
    v_tax NUMERIC(10, 2) := 0.00;
    v_total NUMERIC(10, 2) := 0.00;
    v_paid NUMERIC(10, 2) := 0.00;
    v_balance NUMERIC(10, 2) := 0.00;
    v_status VARCHAR(20) := 'Unpaid';
BEGIN
    -- 1. Sum all line items for this bill
    SELECT COALESCE(SUM(total_price), 0.00)
    INTO v_items_total
    FROM bill_items
    WHERE bill_id = p_bill_id;

    -- 2. Fetch current consultation fee, discount, and tax
    SELECT 
        consultation_fee,
        COALESCE(discount_amount, 0.00),
        COALESCE(tax_amount, 0.00),
        COALESCE(paid_amount, 0.00)
    INTO v_consultation, v_discount, v_tax, v_paid
    FROM bills
    WHERE bill_id = p_bill_id;

    -- 3. Compute grand total and outstanding balance
    v_total := GREATEST(0.00, (v_consultation + v_items_total + v_tax - v_discount));
    v_balance := GREATEST(0.00, (v_total - v_paid));

    -- 4. Determine settlement status
    IF v_paid <= 0 THEN
        v_status := 'Unpaid';
    ELSIF v_balance <= 0 THEN
        v_status := 'Paid';
    ELSE
        v_status := 'Partially Paid';
    END IF;

    -- 5. Update invoice atomically
    UPDATE bills
    SET additional_charges = v_items_total,
        total_amount = v_total,
        balance_amount = v_balance,
        payment_status = v_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = p_bill_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Procedure 2: `sp_process_payment(...)`
**Academic Requirement**: Concurrency control via pessimistic locking (`SELECT ... FOR UPDATE`) and overpayment protection.

```sql
CREATE OR REPLACE PROCEDURE sp_process_payment(
    p_bill_id INT,
    p_amount NUMERIC(10, 2),
    p_method VARCHAR(20),
    p_tx_ref VARCHAR(100),
    p_notes TEXT,
    p_recorded_by INT,
    INOUT p_payment_id INT DEFAULT NULL,
    INOUT p_new_balance NUMERIC(10, 2) DEFAULT NULL,
    INOUT p_status VARCHAR(20) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_bill RECORD;
    v_pay_ref VARCHAR(50);
BEGIN
    -- Validate positive payment
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero. Received: %', p_amount;
    END IF;

    -- Acquire pessimistic row-level lock on the bill
    SELECT bill_id, total_amount, paid_amount, balance_amount, payment_status
    INTO v_bill
    FROM bills
    WHERE bill_id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill with ID % does not exist.', p_bill_id;
    END IF;

    -- Overpayment validation
    IF p_amount > v_bill.balance_amount THEN
        RAISE EXCEPTION 'Payment amount (₹%) exceeds outstanding balance (₹%). Overpayment is not allowed.', 
            p_amount, v_bill.balance_amount;
    END IF;

    -- Generate human-readable unique payment reference
    v_pay_ref := 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Insert payment ledger entry
    INSERT INTO payments (
        payment_reference, bill_id, amount, payment_method,
        transaction_reference, notes, recorded_by
    ) VALUES (
        v_pay_ref, p_bill_id, p_amount, p_method, p_tx_ref, p_notes, p_recorded_by
    ) RETURNING payment_id INTO p_payment_id;

    -- Compute new balance & status
    p_new_balance := v_bill.balance_amount - p_amount;
    
    IF p_new_balance = 0 THEN
        p_status := 'Paid';
    ELSE
        p_status := 'Partially Paid';
    END IF;

    -- Update bill record atomically
    UPDATE bills
    SET paid_amount = paid_amount + p_amount,
        balance_amount = p_new_balance,
        payment_status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = p_bill_id;

END;
$$;
```

---

### Procedure 3: `sp_book_appointment(...)`
**Academic Requirement**: Atomic multi-table insertion with conflict checking.  
**Role**: Books appointment, verifies doctor and patient active status, prevents timeslot conflict, and creates an initial consultation invoice in `bills`.

```sql
CREATE OR REPLACE PROCEDURE sp_book_appointment(
    p_patient_id INT,
    p_doctor_id INT,
    p_date DATE,
    p_time TIME,
    p_reason TEXT,
    p_user_id INT,
    INOUT p_appointment_id INT DEFAULT NULL,
    INOUT p_appointment_code VARCHAR(25) DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_doctor_fee NUMERIC(10, 2);
    v_doc_active BOOLEAN;
    v_conflict_count INT;
    v_bill_num VARCHAR(30);
BEGIN
    -- Verify doctor exists and is active
    SELECT is_active, consultation_fee INTO v_doc_active, v_doctor_fee
    FROM doctors WHERE doctor_id = p_doctor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Doctor with ID % not found.', p_doctor_id;
    END IF;
    IF v_doc_active = FALSE THEN
        RAISE EXCEPTION 'Cannot book with an inactive doctor.';
    END IF;

    -- Verify patient exists and is active
    IF NOT EXISTS (SELECT 1 FROM patients WHERE patient_id = p_patient_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Active patient with ID % not found.', p_patient_id;
    END IF;

    -- Conflict check: doctor cannot have two active appointments at the same time
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_date
      AND appointment_time = p_time
      AND status NOT IN ('Cancelled');

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Doctor is already booked on % at %. Please select a different slot.', p_date, p_time;
    END IF;

    -- Generate appointment code
    p_appointment_code := 'APT-' || TO_CHAR(p_date, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

    -- Insert appointment record
    INSERT INTO appointments (
        appointment_code, patient_id, doctor_id, appointment_date,
        appointment_time, reason_for_visit, status, created_by
    ) VALUES (
        p_appointment_code, p_patient_id, p_doctor_id, p_date, p_time, p_reason, 'Scheduled', p_user_id
    ) RETURNING appointment_id INTO p_appointment_id;

    -- Auto-generate initial consultation fee invoice
    v_bill_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(p_appointment_id::TEXT, 4, '0');

    INSERT INTO bills (
        bill_number, appointment_id, patient_id, consultation_fee,
        additional_charges, discount_amount, tax_amount, total_amount,
        paid_amount, balance_amount, payment_status, bill_date, due_date, notes
    ) VALUES (
        v_bill_num, p_appointment_id, p_patient_id, v_doctor_fee,
        0.00, 0.00, 0.00, v_doctor_fee, 0.00, v_doctor_fee, 'Unpaid',
        p_date, p_date + INTERVAL '7 days', 'Auto-generated consultation fee invoice.'
    );
END;
$$;
```

---

## 5. Database Triggers (PL/pgSQL)

The system implements 4 distinct trigger architectures in [`database/triggers.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/triggers.sql).

---

### Trigger 1: Automatic Timestamp Synchronization
**Purpose**: Automatically sets `updated_at = CURRENT_TIMESTAMP` before any `UPDATE` operation across 7 primary tables (`departments`, `users`, `doctors`, `patients`, `appointments`, `medical_records`, `bills`).

```sql
CREATE OR REPLACE FUNCTION trg_fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_timestamp
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();
```

---

### Trigger 2: Appointment Status Audit Trail Trigger
**Purpose**: Detects status transitions (e.g., `Scheduled` &rarr; `Completed`, or `Scheduled` &rarr; `Cancelled`) or rescheduling events on the `appointments` table. It captures both `old_data` and `new_data` snapshots as JSONB documents and writes them to `audit_logs`.

```sql
CREATE OR REPLACE FUNCTION trg_fn_audit_appointment()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.appointment_date IS DISTINCT FROM NEW.appointment_date) THEN
        INSERT INTO audit_logs (
            table_name,
            action_type,
            record_id,
            changed_by,
            old_data,
            new_data
        ) VALUES (
            'appointments',
            'UPDATE',
            NEW.appointment_id,
            'System/User',
            json_build_object(
                'status', OLD.status,
                'appointment_date', OLD.appointment_date,
                'appointment_time', OLD.appointment_time,
                'cancellation_reason', OLD.cancellation_reason
            )::jsonb,
            json_build_object(
                'status', NEW.status,
                'appointment_date', NEW.appointment_date,
                'appointment_time', NEW.appointment_time,
                'cancellation_reason', NEW.cancellation_reason
            )::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointments_audit
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_appointment();
```

---

### Trigger 3: Automatic Invoice Recalculation on Bill Item Changes
**Purpose**: Fired `AFTER INSERT OR UPDATE OR DELETE ON bill_items`. Invokes `fn_sync_bill_totals` for the affected invoice, ensuring that adding or removing a diagnostic test instantly updates the invoice's `total_amount` and `balance_amount`.

```sql
CREATE OR REPLACE FUNCTION trg_fn_sync_bill_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
    v_target_bill_id INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_target_bill_id := OLD.bill_id;
    ELSE
        v_target_bill_id := NEW.bill_id;
    END IF;

    -- Invoke our stored synchronization function
    PERFORM fn_sync_bill_totals(v_target_bill_id);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bill_items_sync
AFTER INSERT OR UPDATE OR DELETE ON bill_items
FOR EACH ROW EXECUTE FUNCTION trg_fn_sync_bill_on_item_change();
```

---

### Trigger 4: Payment Audit Trigger
**Purpose**: Creates an immutable record in `audit_logs` whenever a new payment is entered into the `payments` table.

```sql
CREATE OR REPLACE FUNCTION trg_fn_audit_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        action_type,
        record_id,
        changed_by,
        new_data
    ) VALUES (
        'payments',
        'INSERT',
        NEW.payment_id,
        COALESCE(NEW.recorded_by::TEXT, 'System'),
        json_build_object(
            'payment_reference', NEW.payment_reference,
            'bill_id', NEW.bill_id,
            'amount', NEW.amount,
            'method', NEW.payment_method,
            'date', NEW.payment_date
        )::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_audit
AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_payment();
```

---

## 6. Database Constraints Summary

The schema enforces domain, entity, and referential integrity through standard PostgreSQL constraints:

| Constraint Name | Target Table | Type | Expression / Rule | Purpose & Impact |
| :--- | :--- | :---: | :--- | :--- |
| `uq_doctor_slot` | `appointments` | **UNIQUE** | `(doctor_id, appointment_date, appointment_time)` | Physically prevents double-booking the same doctor at the same slot. |
| `chk_balance_valid`| `bills` | **CHECK** | `balance_amount = (total_amount - paid_amount)` | Mathematical check guaranteeing the invoice balance cannot disagree with payments. |
| `chk_role_valid` | `users` | **CHECK** | `role IN ('Admin', 'Doctor', 'Receptionist')` | Restricts staff roles to authorized access levels. |
| `chk_gender_valid` | `patients` | **CHECK** | `gender IN ('Male', 'Female', 'Other')` | Enforces standard demographic gender domain. |
| `chk_blood_group` | `patients` | **CHECK** | `blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')` | Enforces valid clinical ABO / Rh blood groups. |
| `chk_appt_status` | `appointments` | **CHECK** | `status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')` | Restricts appointment lifecycle states. |
| `chk_payment_status`| `bills` | **CHECK** | `payment_status IN ('Unpaid', 'Partially Paid', 'Paid')` | Enforces valid payment settlement states. |
| `chk_pay_method` | `payments` | **CHECK** | `payment_method IN ('Cash', 'Card', 'UPI', 'Online')` | Enforces permitted tender channels. |
| `chk_positive_fee` | `doctors` | **CHECK** | `consultation_fee >= 0` | Prevents negative doctor consultation pricing. |
| `chk_positive_amt` | `payments` | **CHECK** | `amount > 0` | Prohibits zero or negative payment entries. |

