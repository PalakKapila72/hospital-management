const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, changePassword, getUsers, createUser } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Administrative user management
router.get('/users', authenticateToken, authorizeRoles('Admin'), getUsers);
router.post('/users', authenticateToken, authorizeRoles('Admin'), createUser);

module.exports = router;
