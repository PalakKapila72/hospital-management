const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', authorizeRoles('Admin', 'Receptionist'), createPatient);
router.put('/:id', authorizeRoles('Admin', 'Receptionist'), updatePatient);
router.delete('/:id', authorizeRoles('Admin'), deletePatient);

module.exports = router;
