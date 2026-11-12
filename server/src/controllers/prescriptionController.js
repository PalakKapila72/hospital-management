const db = require('../config/db');

// @desc    Get all prescriptions with joined patient and doctor details
// @route   GET /api/prescriptions
const getPrescriptions = async (req, res, next) => {
  try {
    const { record_id, patient_id, search, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (record_id) {
      conditions.push(`pr.record_id = $${paramIndex}`);
      params.push(record_id);
      paramIndex++;
    }

    if (patient_id) {
      conditions.push(`mr.patient_id = $${paramIndex}`);
      params.push(patient_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        pr.medicine_name ILIKE $${paramIndex} OR 
        p.full_name ILIKE $${paramIndex} OR 
        p.patient_code ILIKE $${paramIndex} OR 
        d.full_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM prescriptions pr
      JOIN medical_records mr ON pr.record_id = mr.record_id
      JOIN patients p ON mr.patient_id = p.patient_id
      JOIN doctors d ON mr.doctor_id = d.doctor_id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        pr.*,
        mr.record_code,
        mr.diagnosis,
        mr.created_at AS consultation_date,
        p.patient_id,
        p.patient_code,
        p.full_name AS patient_name,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        d.doctor_id,
        d.full_name AS doctor_name,
        d.specialization,
        dept.department_name
      FROM prescriptions pr
      JOIN medical_records mr ON pr.record_id = mr.record_id
      JOIN patients p ON mr.patient_id = p.patient_id
      JOIN doctors d ON mr.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      ${whereClause}
      ORDER BY pr.created_at DESC
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

// @desc    Get complete printable prescription sheet by Medical Record ID
// @route   GET /api/prescriptions/print/:recordId
const getPrintablePrescription = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const recordQuery = `
      SELECT 
        mr.record_id,
        mr.record_code,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.clinical_notes,
        mr.vital_signs,
        mr.follow_up_date,
        mr.created_at AS date_issued,
        p.patient_id,
        p.patient_code,
        p.full_name AS patient_name,
        p.gender AS patient_gender,
        p.date_of_birth,
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) AS patient_age,
        p.blood_group,
        p.phone AS patient_phone,
        p.address AS patient_address,
        d.full_name AS doctor_name,
        d.specialization,
        d.qualification,
        d.email AS doctor_email,
        d.phone AS doctor_phone,
        dept.department_name,
        dept.location AS department_location
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.patient_id
      JOIN doctors d ON mr.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      WHERE mr.record_id = $1
    `;
    const recordRes = await db.query(recordQuery, [recordId]);

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    const itemsQuery = `
      SELECT * FROM prescriptions WHERE record_id = $1 ORDER BY prescription_id ASC
    `;
    const itemsRes = await db.query(itemsQuery, [recordId]);

    res.json({
      success: true,
      record: recordRes.rows[0],
      medicines: itemsRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add individual prescription line item to a record
// @route   POST /api/prescriptions
const addPrescription = async (req, res, next) => {
  try {
    const { record_id, medicine_name, dosage, frequency, duration, instructions } = req.body;

    if (!record_id || !medicine_name || !dosage) {
      return res.status(400).json({
        success: false,
        message: 'Record ID, medicine name, and dosage are required.',
      });
    }

    const result = await db.query(
      `INSERT INTO prescriptions (
        record_id, medicine_name, dosage, frequency, duration, instructions
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        record_id,
        medicine_name.trim(),
        dosage.trim(),
        frequency ? frequency.trim() : 'Once daily',
        duration ? duration.trim() : '5 days',
        instructions ? instructions.trim() : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Prescription added successfully.',
      prescription: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrescriptions,
  getPrintablePrescription,
  addPrescription,
};
