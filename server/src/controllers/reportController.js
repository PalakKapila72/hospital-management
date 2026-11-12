const db = require('../config/db');

// Helper to convert array of JSON objects to CSV string
const convertToCSV = (rows) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'string') {
        // Escape quotes
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      }
      if (val instanceof Date) {
        return `"${val.toISOString()}"`;
      }
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\r\n');
};

// @desc    Patient Registration Report with date range filter
// @route   GET /api/reports/patient-registrations
const getPatientRegistrationReport = async (req, res, next) => {
  try {
    const { start_date, end_date, format } = req.query;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (start_date) {
      conditions.push(`DATE(created_at) >= $${pIdx}`);
      params.push(start_date);
      pIdx++;
    }

    if (end_date) {
      conditions.push(`DATE(created_at) <= $${pIdx}`);
      params.push(end_date);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        patient_id,
        patient_code,
        full_name,
        date_of_birth,
        gender,
        blood_group,
        phone,
        email,
        DATE(created_at) AS registration_date
      FROM patients
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, params);

    if (format === 'csv') {
      const csvData = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="patient_registrations_report.csv"');
      return res.send(csvData);
    }

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor-wise appointments and performance report
// @route   GET /api/reports/doctor-appointments
const getDoctorAppointmentsReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const query = `SELECT * FROM v_doctor_appointments ORDER BY total_appointments DESC`;
    const result = await db.query(query);

    if (format === 'csv') {
      const csvData = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="doctor_appointments_report.csv"');
      return res.send(csvData);
    }

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Department doctor and appointment metrics
// @route   GET /api/reports/department-summary
const getDepartmentSummaryReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const query = `
      SELECT 
        dept.department_id,
        dept.department_name,
        dept.head_of_department,
        dept.location,
        COUNT(DISTINCT d.doctor_id) AS total_doctors,
        COUNT(a.appointment_id) AS total_appointments,
        COALESCE(SUM(b.total_amount), 0.00) AS total_department_revenue
      FROM departments dept
      LEFT JOIN doctors d ON dept.department_id = d.department_id AND d.is_active = TRUE
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
      LEFT JOIN bills b ON a.appointment_id = b.appointment_id
      GROUP BY dept.department_id
      ORDER BY total_doctors DESC, total_appointments DESC
    `;
    const result = await db.query(query);

    if (format === 'csv') {
      const csvData = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="department_summary_report.csv"');
      return res.send(csvData);
    }

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Revenue & Payments Report with date filters
// @route   GET /api/reports/revenue
const getRevenueReport = async (req, res, next) => {
  try {
    const { start_date, end_date, format } = req.query;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (start_date) {
      conditions.push(`DATE(payment_date) >= $${pIdx}`);
      params.push(start_date);
      pIdx++;
    }

    if (end_date) {
      conditions.push(`DATE(payment_date) <= $${pIdx}`);
      params.push(end_date);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        DATE(p.payment_date) AS payment_date,
        p.payment_method,
        COUNT(p.payment_id) AS transactions_count,
        SUM(p.amount) AS total_collected
      FROM payments p
      ${whereClause}
      GROUP BY DATE(p.payment_date), p.payment_method
      ORDER BY payment_date DESC, total_collected DESC
    `;

    const result = await db.query(query, params);

    // Totals
    const totalQuery = `
      SELECT 
        COALESCE(SUM(amount), 0.00) as total_revenue,
        COUNT(*) as total_transactions
      FROM payments p
      ${whereClause}
    `;
    const totalRes = await db.query(totalQuery, params);

    if (format === 'csv') {
      const csvData = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="revenue_report.csv"');
      return res.send(csvData);
    }

    res.json({
      success: true,
      summary: totalRes.rows[0],
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Outstanding bills report
// @route   GET /api/reports/outstanding-bills
const getOutstandingBillsReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const query = `
      SELECT 
        b.bill_id,
        b.bill_number,
        b.bill_date,
        b.due_date,
        b.total_amount,
        b.paid_amount,
        b.balance_amount,
        b.payment_status,
        p.patient_code,
        p.full_name AS patient_name,
        p.phone AS patient_phone,
        d.full_name AS doctor_name,
        dept.department_name
      FROM bills b
      JOIN patients p ON b.patient_id = p.patient_id
      JOIN appointments a ON b.appointment_id = a.appointment_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      WHERE b.payment_status <> 'Paid'
      ORDER BY b.balance_amount DESC, b.due_date ASC
    `;
    const result = await db.query(query);

    if (format === 'csv') {
      const csvData = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="outstanding_bills_report.csv"');
      return res.send(csvData);
    }

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Appointment status distribution report
// @route   GET /api/reports/appointment-status
const getAppointmentStatusReport = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) AS total_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM appointments)), 1) AS percentage
      FROM appointments
      GROUP BY status
      ORDER BY total_count DESC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatientRegistrationReport,
  getDoctorAppointmentsReport,
  getDepartmentSummaryReport,
  getRevenueReport,
  getOutstandingBillsReport,
  getAppointmentStatusReport,
};
