const db = require('../config/db');

// @desc    Get all appointments with filters (doctor, patient, date, status)
// @route   GET /api/appointments
const getAppointments = async (req, res, next) => {
  try {
    const { doctor_id, patient_id, date, status, search, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (doctor_id) {
      conditions.push(`a.doctor_id = $${paramIndex}`);
      params.push(doctor_id);
      paramIndex++;
    }

    if (patient_id) {
      conditions.push(`a.patient_id = $${paramIndex}`);
      params.push(patient_id);
      paramIndex++;
    }

    if (date) {
      conditions.push(`a.appointment_date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        p.full_name ILIKE $${paramIndex} OR 
        p.patient_code ILIKE $${paramIndex} OR 
        d.full_name ILIKE $${paramIndex} OR 
        a.appointment_code ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        a.appointment_id,
        a.appointment_code,
        a.appointment_date,
        a.appointment_time,
        a.reason_for_visit,
        a.status,
        a.cancellation_reason,
        a.created_at,
        p.patient_id,
        p.patient_code,
        p.full_name AS patient_name,
        p.phone AS patient_phone,
        p.gender AS patient_gender,
        d.doctor_id,
        d.full_name AS doctor_name,
        d.specialization,
        d.consultation_fee,
        dept.department_name,
        b.bill_id,
        b.bill_number,
        b.total_amount AS bill_total,
        b.payment_status,
        mr.record_id
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN bills b ON a.appointment_id = b.appointment_id
      LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        a.*,
        p.patient_code,
        p.full_name AS patient_name,
        p.phone AS patient_phone,
        p.email AS patient_email,
        p.gender AS patient_gender,
        p.date_of_birth,
        d.full_name AS doctor_name,
        d.specialization,
        d.consultation_fee,
        dept.department_name,
        b.bill_id,
        b.bill_number,
        b.total_amount,
        b.paid_amount,
        b.balance_amount,
        b.payment_status,
        mr.record_id,
        mr.diagnosis,
        mr.treatment_plan
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN bills b ON a.appointment_id = b.appointment_id
      LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id
      WHERE a.appointment_id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.json({ success: true, appointment: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// @desc    Book an appointment with conflict prevention & concurrency safety
// @route   POST /api/appointments
const bookAppointment = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit } = req.body;

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time || !reason_for_visit) {
      return res.status(400).json({
        success: false,
        message: 'Patient, doctor, date, time, and reason for visit are required.',
      });
    }

    await client.query('BEGIN');

    // 1. Verify doctor is active and retrieve consultation fee
    const docRes = await client.query(
      'SELECT doctor_id, full_name, consultation_fee, is_active FROM doctors WHERE doctor_id = $1',
      [doctor_id]
    );

    if (docRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    if (!docRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cannot book appointment with an inactive doctor.' });
    }

    const doctor = docRes.rows[0];

    // 2. Verify patient is active
    const patRes = await client.query(
      'SELECT patient_id, full_name, is_active FROM patients WHERE patient_id = $1',
      [patient_id]
    );

    if (patRes.rows.length === 0 || !patRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Active patient not found.' });
    }

    // 3. Concurrency-Safe Conflict Check:
    // Check if slot is already booked for this doctor on this date and time
    const conflictQuery = `
      SELECT appointment_id 
      FROM appointments 
      WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status <> 'Cancelled'
      FOR UPDATE
    `;
    const conflictRes = await client.query(conflictQuery, [doctor_id, appointment_date, appointment_time]);

    if (conflictRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `Conflict: ${doctor.full_name} is already booked at ${appointment_time} on ${appointment_date}. Please pick an available time.`,
        error_code: 'APPOINTMENT_CONFLICT',
      });
    }

    // 4. Generate unique appointment code
    const dateFormatted = appointment_date.replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const appointment_code = `APT-${dateFormatted}-${randNum}`;

    // 5. Insert appointment
    const insertApptQuery = `
      INSERT INTO appointments (
        appointment_code, patient_id, doctor_id, appointment_date,
        appointment_time, reason_for_visit, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled', $7)
      RETURNING *
    `;
    const apptInsertRes = await client.query(insertApptQuery, [
      appointment_code,
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason_for_visit.trim(),
      req.user ? req.user.user_id : null,
    ]);

    const appointment = apptInsertRes.rows[0];

    // 6. Automatically generate initial draft invoice for consultation fee
    const billNumber = `INV-${dateFormatted}-${appointment.appointment_id.toString().padStart(4, '0')}`;
    const fee = parseFloat(doctor.consultation_fee);

    const insertBillQuery = `
      INSERT INTO bills (
        bill_number, appointment_id, patient_id, consultation_fee,
        additional_charges, discount_amount, tax_amount, total_amount,
        paid_amount, balance_amount, payment_status, bill_date, due_date, notes
      ) VALUES ($1, $2, $3, $4, 0.00, 0.00, 0.00, $4, 0.00, $4, 'Unpaid', $5, $6, 'Consultation appointment invoice')
      RETURNING *
    `;

    const dueDate = new Date(appointment_date);
    dueDate.setDate(dueDate.getDate() + 7);

    const billRes = await client.query(insertBillQuery, [
      billNumber,
      appointment.appointment_id,
      patient_id,
      fee,
      appointment_date,
      dueDate.toISOString().split('T')[0],
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Appointment booked and consultation bill generated successfully.',
      appointment,
      bill: billRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Update appointment status (Completed, Cancelled, No-Show)
// @route   PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const result = await db.query(
      `UPDATE appointments 
       SET status = $1, 
           cancellation_reason = CASE WHEN $1 = 'Cancelled' THEN COALESCE($2, cancellation_reason) ELSE cancellation_reason END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE appointment_id = $3 
       RETURNING *`,
      [status, cancellation_reason || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    res.json({
      success: true,
      message: `Appointment marked as ${status}.`,
      appointment: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule appointment to a new date and time
// @route   PATCH /api/appointments/:id/reschedule
const rescheduleAppointment = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: 'New appointment date and time are required.',
      });
    }

    await client.query('BEGIN');

    // Fetch existing appointment
    const currentApptRes = await client.query(
      'SELECT * FROM appointments WHERE appointment_id = $1 FOR UPDATE',
      [id]
    );

    if (currentApptRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const currentAppt = currentApptRes.rows[0];

    if (currentAppt.status === 'Completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a consultation that has already been Completed.',
      });
    }

    // Check conflict on new slot
    const conflictRes = await client.query(
      `SELECT appointment_id 
       FROM appointments 
       WHERE doctor_id = $1 
         AND appointment_date = $2 
         AND appointment_time = $3 
         AND appointment_id <> $4
         AND status <> 'Cancelled'`,
      [currentAppt.doctor_id, appointment_date, appointment_time, id]
    );

    if (conflictRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Selected doctor is already booked at that timeslot. Please pick another time.',
        error_code: 'APPOINTMENT_CONFLICT',
      });
    }

    const updateRes = await client.query(
      `UPDATE appointments
       SET appointment_date = $1,
           appointment_time = $2,
           status = 'Scheduled',
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $3
       RETURNING *`,
      [appointment_date, appointment_time, id]
    );

    // Also update invoice due date
    await client.query(
      `UPDATE bills 
       SET bill_date = $1, due_date = ($1::date + INTERVAL '7 days')::date, updated_at = CURRENT_TIMESTAMP 
       WHERE appointment_id = $2`,
      [appointment_date, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      appointment: updateRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
};
