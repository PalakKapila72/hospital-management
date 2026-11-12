const express = require('express');
const router = express.Router();
const {
  getMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
} = require('../controllers/medicalRecordController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getMedicalRecords);
router.get('/:id', getMedicalRecordById);
// Only doctors and admins can write diagnostic records
router.post('/', authorizeRoles('Admin', 'Doctor'), createMedicalRecord);

module.exports = router;
