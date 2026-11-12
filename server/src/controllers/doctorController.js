const db = require('../config/db');

// @desc    Get all doctors with department information and filters
// @route   GET /api/doctors
const getDoctors = async (req, res, next) => {
  try {
    const { department_id, search, is_active } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (department_id) {
      conditions.push(`d.department_id = $${paramIndex}`);
      params.push(department_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        d.full_name ILIKE $${paramIndex} OR 
        d.specialization ILIKE $${paramIndex} OR 
        d.qualification ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`d.is_active = $${paramIndex}`);
      params.push(is_active === 'true');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        d.doctor_id,
        d.user_id,
        d.department_id,
        d.full_name,
        d.specialization,
        d.qualification,
        d.phone,
        d.email,
        d.consultation_fee,
        d.available_days,
        d.available_time_start,
        d.available_time_end,
        d.is_active,
        d.created_at,
        dept.department_name,
        dept.location AS department_location,
        COUNT(a.appointment_id) AS total_appointments
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
      ${whereClause}
      GROUP BY d.doctor_id, dept.department_name, dept.location
      ORDER BY dept.department_name ASC, d.full_name ASC
    `;

    const result = await db.query(query, params);
    res.json({ success: true, count: result.rows.length, doctors: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor details
// @route   GET /api/doctors/:id
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        d.*,
        dept.department_name,
        dept.head_of_department,
        dept.location AS department_location
      FROM doctors d
      JOIN departments dept ON d.department_id = dept.department_id
      WHERE d.doctor_id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Recent doctor appointments
    const apptQuery = `
      SELECT a.*, p.patient_code, p.full_name AS patient_name, p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 10
    `;
    const apptRes = await db.query(apptQuery, [id]);

    res.json({
      success: true,
      doctor: result.rows[0],
      recentAppointments: apptRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check doctor booked timeslots for a given date
// @route   GET /api/doctors/:id/schedule
const getDoctorSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
    }

    const doctorQuery = `SELECT * FROM doctors WHERE doctor_id = $1`;
    const docRes = await db.query(doctorQuery, [id]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const bookedSlotsQuery = `
      SELECT appointment_time, status, appointment_code
      FROM appointments
      WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND status <> 'Cancelled'
      ORDER BY appointment_time ASC
    `;
    const slotsRes = await db.query(bookedSlotsQuery, [id, date]);

    res.json({
      success: true,
      doctor: docRes.rows[0],
      date,
      bookedSlots: slotsRes.rows.map((row) => row.appointment_time.slice(0, 5)),
      appointments: slotsRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new doctor (Admin only)
// @route   POST /api/doctors
const createDoctor = async (req, res, next) => {
  try {
    const {
      department_id,
      full_name,
      specialization,
      qualification,
      phone,
      email,
      consultation_fee,
      available_days,
      available_time_start,
      available_time_end,
      user_id,
    } = req.body;

    if (!department_id || !full_name || !specialization || !phone || !email || consultation_fee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Department, full name, specialization, phone, email, and consultation fee are required.',
      });
    }

    const insertQuery = `
      INSERT INTO doctors (
        user_id, department_id, full_name, specialization, qualification,
        phone, email, consultation_fee, available_days,
        available_time_start, available_time_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      user_id || null,
      department_id,
      full_name.trim(),
      specialization.trim(),
      qualification ? qualification.trim() : 'MBBS',
      phone.trim(),
      email.trim(),
      parseFloat(consultation_fee),
      available_days || 'Mon,Tue,Wed,Thu,Fri',
      available_time_start || '09:00:00',
      available_time_end || '17:00:00',
    ]);

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully.',
      doctor: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile (Admin only)
// @route   PUT /api/doctors/:id
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      department_id,
      full_name,
      specialization,
      qualification,
      phone,
      email,
      consultation_fee,
      available_days,
      available_time_start,
      available_time_end,
      is_active,
    } = req.body;

    const updateQuery = `
      UPDATE doctors
      SET department_id = COALESCE($1, department_id),
          full_name = COALESCE($2, full_name),
          specialization = COALESCE($3, specialization),
          qualification = COALESCE($4, qualification),
          phone = COALESCE($5, phone),
          email = COALESCE($6, email),
          consultation_fee = COALESCE($7, consultation_fee),
          available_days = COALESCE($8, available_days),
          available_time_start = COALESCE($9, available_time_start),
          available_time_end = COALESCE($10, available_time_end),
          is_active = COALESCE($11, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = $12
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      department_id || null,
      full_name ? full_name.trim() : null,
      specialization ? specialization.trim() : null,
      qualification ? qualification.trim() : null,
      phone ? phone.trim() : null,
      email ? email.trim() : null,
      consultation_fee !== undefined ? parseFloat(consultation_fee) : null,
      available_days || null,
      available_time_start || null,
      available_time_end || null,
      is_active !== undefined ? is_active : null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle doctor active/inactive status
// @route   PATCH /api/doctors/:id/toggle-status
const toggleDoctorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE doctors 
       SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
       WHERE doctor_id = $1 
       RETURNING doctor_id, full_name, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.json({
      success: true,
      message: `Doctor status updated to ${result.rows[0].is_active ? 'Active' : 'Inactive'}.`,
      doctor: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  getDoctorSchedule,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
};
