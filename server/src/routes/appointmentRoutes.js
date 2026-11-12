const express = require('express');
const router = express.Router();
const {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', authorizeRoles('Admin', 'Receptionist', 'Doctor'), bookAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.patch('/:id/reschedule', authorizeRoles('Admin', 'Receptionist'), rescheduleAppointment);

module.exports = router;
