const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} = require('../controllers/departmentController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorizeRoles('Admin'), createDepartment);
router.put('/:id', authorizeRoles('Admin'), updateDepartment);

module.exports = router;
