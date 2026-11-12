-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — FUNCTIONS & STORED PROCEDURES
-- Academic Requirement: Concurrency-Safe Stored Logic & Business Rules
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function 1: fn_sync_bill_totals
-- Recalculates and synchronizes invoice totals, discounts, taxes, and balance
-- ----------------------------------------------------------------------------
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
    -- Sum all line items for this bill
    SELECT COALESCE(SUM(total_price), 0.00)
    INTO v_items_total
    FROM bill_items
    WHERE bill_id = p_bill_id;

    -- Fetch current consultation fee, discount, and tax
    SELECT 
        consultation_fee,
        COALESCE(discount_amount, 0.00),
        COALESCE(tax_amount, 0.00),
        COALESCE(paid_amount, 0.00)
    INTO v_consultation, v_discount, v_tax, v_paid
    FROM bills
    WHERE bill_id = p_bill_id;

    -- Compute grand total
    v_total := GREATEST(0.00, (v_consultation + v_items_total + v_tax - v_discount));
    v_balance := GREATEST(0.00, (v_total - v_paid));

    -- Determine payment status
    IF v_paid <= 0 THEN
        v_status := 'Unpaid';
    ELSIF v_balance <= 0 THEN
        v_status := 'Paid';
    ELSE
        v_status := 'Partially Paid';
    END IF;

    -- Update bill record
    UPDATE bills
    SET additional_charges = v_items_total,
        total_amount = v_total,
        balance_amount = v_balance,
        payment_status = v_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Procedure 2: sp_process_payment
-- Concurrency-safe payment recording with pessimistic row locking (FOR UPDATE)
-- ----------------------------------------------------------------------------
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

    -- Acquire row-level lock on the bill to prevent concurrent race conditions
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
        payment_reference,
        bill_id,
        amount,
        payment_method,
        transaction_reference,
        notes,
        recorded_by
    ) VALUES (
        v_pay_ref,
        p_bill_id,
        p_amount,
        p_method,
        p_tx_ref,
        p_notes,
        p_recorded_by
    ) RETURNING payment_id INTO p_payment_id;

    -- Update bill balance and status atomically
    p_new_balance := v_bill.balance_amount - p_amount;
    
    IF p_new_balance = 0 THEN
        p_status := 'Paid';
    ELSE
        p_status := 'Partially Paid';
    END IF;

    UPDATE bills
    SET paid_amount = paid_amount + p_amount,
        balance_amount = p_new_balance,
        payment_status = p_status,
        updated_at = CURRENT_TIMESTAMP
    WHERE bill_id = p_bill_id;

END;
$$;

-- ----------------------------------------------------------------------------
-- Procedure 3: sp_book_appointment
-- Books an appointment safely, checking conflicts and generating initial bill
-- ----------------------------------------------------------------------------
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
    SELECT is_active, consultation_fee
    INTO v_doc_active, v_doctor_fee
    FROM doctors
    WHERE doctor_id = p_doctor_id;

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
    SELECT COUNT(*)
    INTO v_conflict_count
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
        appointment_code,
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason_for_visit,
        status,
        created_by
    ) VALUES (
        p_appointment_code,
        p_patient_id,
        p_doctor_id,
        p_date,
        p_time,
        p_reason,
        'Scheduled',
        p_user_id
    ) RETURNING appointment_id INTO p_appointment_id;

    -- Generate corresponding initial invoice for consultation
    v_bill_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(p_appointment_id::TEXT, 4, '0');

    INSERT INTO bills (
        bill_number,
        appointment_id,
        patient_id,
        consultation_fee,
        additional_charges,
        discount_amount,
        tax_amount,
        total_amount,
        paid_amount,
        balance_amount,
        payment_status,
        bill_date,
        due_date,
        notes
    ) VALUES (
        v_bill_num,
        p_appointment_id,
        p_patient_id,
        v_doctor_fee,
        0.00,
        0.00,
        0.00,
        v_doctor_fee,
        0.00,
        v_doctor_fee,
        'Unpaid',
        p_date,
        p_date + INTERVAL '7 days',
        'Auto-generated consultation fee invoice.'
    );

END;
$$;
