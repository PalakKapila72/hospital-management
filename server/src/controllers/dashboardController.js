const db = require('../config/db');

// @desc    Get live database-driven dashboard statistics
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Fetch core KPI summary counts from our database view
    const statsQuery = `SELECT * FROM v_dashboard_stats`;
    const statsRes = await db.query(statsQuery);

    // 2. Fetch recent 6 appointments with joined patient & doctor info
    const recentAppointmentsQuery = `
      SELECT 
        a.appointment_id,
        a.appointment_code,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        p.patient_id,
        p.patient_code,
        p.full_name AS patient_name,
        d.doctor_id,
        d.full_name AS doctor_name,
        dept.department_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 6
    `;
    const appointmentsRes = await db.query(recentAppointmentsQuery);

    // 3. Department distribution of doctors and appointments
    const departmentDistributionQuery = `
      SELECT 
        dept.department_id,
        dept.department_name,
        COUNT(DISTINCT d.doctor_id) AS doctor_count,
        COUNT(a.appointment_id) AS appointment_count
      FROM departments dept
      LEFT JOIN doctors d ON dept.department_id = d.department_id AND d.is_active = TRUE
      LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
      GROUP BY dept.department_id, dept.department_name
      ORDER BY appointment_count DESC
    `;
    const deptRes = await db.query(departmentDistributionQuery);

    // 4. Recent payments ledger
    const recentPaymentsQuery = `
      SELECT 
        p.payment_id,
        p.payment_reference,
        p.amount,
        p.payment_method,
        p.payment_date,
        b.bill_number,
        pt.full_name AS patient_name
      FROM payments p
      JOIN bills b ON p.bill_id = b.bill_id
      JOIN patients pt ON b.patient_id = pt.patient_id
      ORDER BY p.payment_date DESC
      LIMIT 5
    `;
    const paymentsRes = await db.query(recentPaymentsQuery);

    // 5. Appointment status breakdown
    const statusBreakdownQuery = `
      SELECT 
        status, 
        COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `;
    const statusRes = await db.query(statusBreakdownQuery);

    res.json({
      success: true,
      stats: statsRes.rows[0] || {
        total_patients: 0,
        total_doctors: 0,
        total_departments: 0,
        today_appointments: 0,
        completed_appointments: 0,
        cancelled_appointments: 0,
        total_revenue: 0,
        pending_balance: 0,
      },
      recentAppointments: appointmentsRes.rows,
      departmentStats: deptRes.rows,
      recentPayments: paymentsRes.rows,
      statusBreakdown: statusRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
