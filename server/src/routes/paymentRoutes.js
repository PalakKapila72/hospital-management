const express = require('express');
const router = express.Router();
const { recordPayment, getPayments } = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getPayments);
router.post('/', authorizeRoles('Admin', 'Receptionist'), recordPayment);

module.exports = router;
