-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — TRIGGERS
-- Academic Requirement: Justified Database Triggers for Integrity & Auditing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger 1: Automatic Timestamp Synchronization
-- Keeps updated_at current across core entities
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
DROP TRIGGER IF EXISTS trg_departments_timestamp ON departments;
CREATE TRIGGER trg_departments_timestamp
BEFORE UPDATE ON departments
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_users_timestamp ON users;
CREATE TRIGGER trg_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_doctors_timestamp ON doctors;
CREATE TRIGGER trg_doctors_timestamp
BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_patients_timestamp ON patients;
CREATE TRIGGER trg_patients_timestamp
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_appointments_timestamp ON appointments;
CREATE TRIGGER trg_appointments_timestamp
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_medical_records_timestamp ON medical_records;
CREATE TRIGGER trg_medical_records_timestamp
BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

DROP TRIGGER IF EXISTS trg_bills_timestamp ON bills;
CREATE TRIGGER trg_bills_timestamp
BEFORE UPDATE ON bills
FOR EACH ROW EXECUTE FUNCTION trg_fn_update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger 2: Appointment Status Audit Trigger
-- Logs state transitions (e.g. Scheduled -> Cancelled / Completed) for clinical governance
-- ----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_appointments_audit ON appointments;
CREATE TRIGGER trg_appointments_audit
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_appointment();

-- ----------------------------------------------------------------------------
-- Trigger 3: Automatic Invoice Recalculation on Bill Item Changes
-- Ensures additional_charges and grand total remain 100% consistent
-- ----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_bill_items_sync ON bill_items;
CREATE TRIGGER trg_bill_items_sync
AFTER INSERT OR UPDATE OR DELETE ON bill_items
FOR EACH ROW EXECUTE FUNCTION trg_fn_sync_bill_on_item_change();

-- ----------------------------------------------------------------------------
-- Trigger 4: Payment Audit Trigger
-- Creates an immutable trail whenever a financial payment is recorded
-- ----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_payments_audit ON payments;
CREATE TRIGGER trg_payments_audit
AFTER INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_payment();
