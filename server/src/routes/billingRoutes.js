const express = require('express');
const router = express.Router();
const {
  getBills,
  getBillById,
  addBillItem,
  deleteBillItem,
  updateBill,
} = require('../controllers/billingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/:id/items', authorizeRoles('Admin', 'Receptionist'), addBillItem);
router.delete('/:id/items/:itemId', authorizeRoles('Admin'), deleteBillItem);
router.put('/:id', authorizeRoles('Admin', 'Receptionist'), updateBill);

module.exports = router;
