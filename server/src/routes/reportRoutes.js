const express = require('express');
const router = express.Router();
const {
  getPatientRegistrationReport,
  getDoctorAppointmentsReport,
  getDepartmentSummaryReport,
  getRevenueReport,
  getOutstandingBillsReport,
  getAppointmentStatusReport,
} = require('../controllers/reportController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/patient-registrations', getPatientRegistrationReport);
router.get('/doctor-appointments', getDoctorAppointmentsReport);
router.get('/department-summary', getDepartmentSummaryReport);
router.get('/revenue', getRevenueReport);
router.get('/outstanding-bills', getOutstandingBillsReport);
router.get('/appointment-status', getAppointmentStatusReport);

module.exports = router;
