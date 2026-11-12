const db = require('../config/db');

// @desc    Get all medical records with optional patient/doctor filters
// @route   GET /api/medical-records
const getMedicalRecords = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (patient_id) {
      conditions.push(`mr.patient_id = $${paramIndex}`);
      params.push(patient_id);
      paramIndex++;
    }

    if (doctor_id) {
      conditions.push(`mr.doctor_id = $${paramIndex}`);
      params.push(doctor_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        p.full_name ILIKE $${paramIndex} OR 
        p.patient_code ILIKE $${paramIndex} OR 
        mr.diagnosis ILIKE $${paramIndex} OR 
        mr.record_code ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM medical_records mr JOIN patients p ON mr.patient_id = p.patient_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        mr.record_id,
        mr.record_code,
        mr.appointment_id,
        mr.diagnosis,
        mr.symptoms,
        mr.treatment_plan,
        mr.clinical_notes,
        mr.vital_signs,
        mr.follow_up_date,
        mr.created_at,
        p.patient_id,
        p.patient_code,
        p.full_name AS patient_name,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) AS patient_age,
        d.doctor_id,
        d.full_name AS doctor_name,
        d.specialization,
        dept.department_name,
        COUNT(pr.prescription_id) AS prescription_count
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.patient_id
      JOIN doctors d ON mr.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN prescriptions pr ON mr.record_id = pr.record_id
      ${whereClause}
      GROUP BY mr.record_id, p.patient_id, d.doctor_id, dept.department_name
      ORDER BY mr.created_at DESC
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

// @desc    Get single medical record with associated prescriptions
// @route   GET /api/medical-records/:id
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recordQuery = `
      SELECT 
        mr.*,
        p.patient_code,
        p.full_name AS patient_name,
        p.gender AS patient_gender,
        p.date_of_birth,
        p.blood_group,
        p.phone AS patient_phone,
        p.address AS patient_address,
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) AS patient_age,
        d.full_name AS doctor_name,
        d.specialization,
        d.qualification,
        dept.department_name,
        a.appointment_code,
        a.appointment_date,
        a.reason_for_visit
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.patient_id
      JOIN doctors d ON mr.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      JOIN appointments a ON mr.appointment_id = a.appointment_id
      WHERE mr.record_id = $1
    `;
    const recordRes = await db.query(recordQuery, [id]);

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medical record not found.' });
    }

    const prescriptionsQuery = `
      SELECT * FROM prescriptions WHERE record_id = $1 ORDER BY prescription_id ASC
    `;
    const rxRes = await db.query(prescriptionsQuery, [id]);

    res.json({
      success: true,
      record: recordRes.rows[0],
      prescriptions: rxRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a medical record linked to an appointment
// @route   POST /api/medical-records
const createMedicalRecord = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const {
      appointment_id,
      diagnosis,
      symptoms,
      treatment_plan,
      clinical_notes,
      vital_signs,
      follow_up_date,
      prescriptions = [],
    } = req.body;

    if (!appointment_id || !diagnosis || !treatment_plan) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID, diagnosis, and treatment plan are mandatory.',
      });
    }

    await client.query('BEGIN');

    // 1. Fetch appointment details
    const apptRes = await client.query(
      'SELECT appointment_id, patient_id, doctor_id, status FROM appointments WHERE appointment_id = $1 FOR UPDATE',
      [appointment_id]
    );

    if (apptRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const appt = apptRes.rows[0];

    // 2. Check if a medical record already exists for this appointment
    const existingRec = await client.query(
      'SELECT record_id FROM medical_records WHERE appointment_id = $1',
      [appointment_id]
    );

    if (existingRec.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'A medical record already exists for this consultation.',
        record_id: existingRec.rows[0].record_id,
      });
    }

    // 3. Generate unique record code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const record_code = `REC-${dateStr}-${randSuffix}`;

    // 4. Insert medical record
    const insertQuery = `
      INSERT INTO medical_records (
        record_code, appointment_id, patient_id, doctor_id,
        diagnosis, symptoms, treatment_plan, clinical_notes,
        vital_signs, follow_up_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const recordRes = await client.query(insertQuery, [
      record_code,
      appointment_id,
      appt.patient_id,
      appt.doctor_id,
      diagnosis.trim(),
      symptoms ? symptoms.trim() : null,
      treatment_plan.trim(),
      clinical_notes ? clinical_notes.trim() : null,
      vital_signs || JSON.stringify({ bp: '120/80', pulse: 72, temperature: '98.6 F', weight_kg: 65 }),
      follow_up_date || null,
    ]);

    const record = recordRes.rows[0];

    // 5. Automatically mark appointment as Completed
    await client.query(
      "UPDATE appointments SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $1",
      [appointment_id]
    );

    // 6. Insert attached prescriptions if provided
    const insertedPrescriptions = [];
    if (Array.isArray(prescriptions) && prescriptions.length > 0) {
      for (const rx of prescriptions) {
        if (rx.medicine_name && rx.dosage) {
          const rxRes = await client.query(
            `INSERT INTO prescriptions (
              record_id, medicine_name, dosage, frequency, duration, instructions
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
              record.record_id,
              rx.medicine_name.trim(),
              rx.dosage.trim(),
              rx.frequency ? rx.frequency.trim() : 'Once daily',
              rx.duration ? rx.duration.trim() : '5 days',
              rx.instructions ? rx.instructions.trim() : null,
            ]
          );
          insertedPrescriptions.push(rxRes.rows[0]);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Medical record and prescription created successfully.',
      record,
      prescriptions: insertedPrescriptions,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
};
