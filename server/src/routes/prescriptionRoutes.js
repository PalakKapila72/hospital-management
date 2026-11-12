const express = require('express');
const router = express.Router();
const {
  getPrescriptions,
  getPrintablePrescription,
  addPrescription,
} = require('../controllers/prescriptionController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getPrescriptions);
router.get('/print/:recordId', getPrintablePrescription);
router.post('/', authorizeRoles('Admin', 'Doctor'), addPrescription);

module.exports = router;
