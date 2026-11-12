const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  getDoctorSchedule,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
} = require('../controllers/doctorController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/schedule', getDoctorSchedule);
router.post('/', authorizeRoles('Admin'), createDoctor);
router.put('/:id', authorizeRoles('Admin'), updateDoctor);
router.patch('/:id/toggle-status', authorizeRoles('Admin'), toggleDoctorStatus);

module.exports = router;
