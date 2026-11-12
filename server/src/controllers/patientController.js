const db = require('../config/db');

// @desc    Get all patients with search, filters, and pagination
// @route   GET /api/patients
const getPatients = async (req, res, next) => {
  try {
    const { search, gender, blood_group, is_active, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        p.full_name ILIKE $${paramIndex} OR 
        p.patient_code ILIKE $${paramIndex} OR 
        p.phone ILIKE $${paramIndex} OR 
        p.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (gender) {
      conditions.push(`p.gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    if (blood_group) {
      conditions.push(`p.blood_group = $${paramIndex}`);
      params.push(blood_group);
      paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`p.is_active = $${paramIndex}`);
      params.push(is_active === 'true');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countQuery = `SELECT COUNT(*) FROM patients p ${whereClause}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Patients listing with age calculation
    const listQuery = `
      SELECT 
        p.patient_id,
        p.patient_code,
        p.full_name,
        p.date_of_birth,
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) AS age,
        p.gender,
        p.blood_group,
        p.phone,
        p.email,
        p.address,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.is_active,
        p.created_at,
        COUNT(DISTINCT a.appointment_id) AS total_visits
      FROM patients p
      LEFT JOIN appointments a ON p.patient_id = a.patient_id
      ${whereClause}
      GROUP BY p.patient_id
      ORDER BY p.patient_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const listRes = await db.query(listQuery, params);

    res.json({
      success: true,
      data: listRes.rows,
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

// @desc    Get single patient details by ID with consultation history
// @route   GET /api/patients/:id
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patientQuery = `
      SELECT 
        p.*,
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) AS age
      FROM patients p
      WHERE p.patient_id = $1
    `;
    const patientRes = await db.query(patientQuery, [id]);

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Appointment history
    const appointmentsQuery = `
      SELECT 
        a.appointment_id,
        a.appointment_code,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        d.full_name AS doctor_name,
        dept.department_name,
        mr.record_id,
        b.bill_id,
        b.total_amount,
        b.payment_status
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN medical_records mr ON a.appointment_id = mr.appointment_id
      LEFT JOIN bills b ON a.appointment_id = b.appointment_id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const appointmentsRes = await db.query(appointmentsQuery, [id]);

    // Financial balance summary
    const billingSummaryQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0.00) AS total_billed,
        COALESCE(SUM(paid_amount), 0.00) AS total_paid,
        COALESCE(SUM(balance_amount), 0.00) AS outstanding_balance
      FROM bills
      WHERE patient_id = $1
    `;
    const billingRes = await db.query(billingSummaryQuery, [id]);

    res.json({
      success: true,
      patient: patientRes.rows[0],
      appointments: appointmentsRes.rows,
      billingSummary: billingRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new patient
// @route   POST /api/patients
const createPatient = async (req, res, next) => {
  try {
    const {
      full_name,
      date_of_birth,
      gender,
      blood_group,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    if (!full_name || !date_of_birth || !gender || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, date of birth, gender, phone, and address are mandatory fields.',
      });
    }

    // Generate unique sequential or random patient code
    const codeQuery = `SELECT COALESCE(MAX(patient_id), 0) + 1 AS next_id FROM patients`;
    const codeRes = await db.query(codeQuery);
    const nextNum = codeRes.rows[0].next_id;
    const patient_code = `PAT-${1000 + parseInt(nextNum, 10)}`;

    const insertQuery = `
      INSERT INTO patients (
        patient_code, full_name, date_of_birth, gender, blood_group,
        phone, email, address, emergency_contact_name, emergency_contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      patient_code,
      full_name.trim(),
      date_of_birth,
      gender,
      blood_group || null,
      phone.trim(),
      email ? email.trim() : null,
      address.trim(),
      emergency_contact_name ? emergency_contact_name.trim() : null,
      emergency_contact_phone ? emergency_contact_phone.trim() : null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      patient: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient details
// @route   PUT /api/patients/:id
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      date_of_birth,
      gender,
      blood_group,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      is_active,
    } = req.body;

    const updateQuery = `
      UPDATE patients
      SET full_name = COALESCE($1, full_name),
          date_of_birth = COALESCE($2, date_of_birth),
          gender = COALESCE($3, gender),
          blood_group = COALESCE($4, blood_group),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email),
          address = COALESCE($7, address),
          emergency_contact_name = COALESCE($8, emergency_contact_name),
          emergency_contact_phone = COALESCE($9, emergency_contact_phone),
          is_active = COALESCE($10, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = $11
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      full_name ? full_name.trim() : null,
      date_of_birth || null,
      gender || null,
      blood_group || null,
      phone ? phone.trim() : null,
      email !== undefined ? (email ? email.trim() : null) : null,
      address ? address.trim() : null,
      emergency_contact_name ? emergency_contact_name.trim() : null,
      emergency_contact_phone ? emergency_contact_phone.trim() : null,
      is_active !== undefined ? is_active : null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    res.json({
      success: true,
      message: 'Patient record updated successfully.',
      patient: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or safely archive patient record
// @route   DELETE /api/patients/:id
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Check if patient has any active scheduled appointments
    const activeAppts = await db.query(
      "SELECT COUNT(*) FROM appointments WHERE patient_id = $1 AND status = 'Scheduled'",
      [id]
    );

    if (parseInt(activeAppts.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot archive or delete patient with active Scheduled appointments. Cancel or complete them first.',
      });
    }

    if (permanent === 'true') {
      // Check if related records exist
      const checkRecords = await db.query(
        'SELECT COUNT(*) FROM appointments WHERE patient_id = $1',
        [id]
      );
      if (parseInt(checkRecords.rows[0].count, 10) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot permanently delete patient because medical consultation or appointment history exists. Soft archive applied instead.',
        });
      }

      await db.query('DELETE FROM patients WHERE patient_id = $1', [id]);
      return res.json({ success: true, message: 'Patient record permanently deleted.' });
    }

    // Safe soft archive
    const result = await db.query(
      'UPDATE patients SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE patient_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    res.json({
      success: true,
      message: 'Patient safely archived (deactivated).',
      patient: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
