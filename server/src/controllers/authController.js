const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../config/jwt');

// @desc    Staff Login (Admin, Doctor, Receptionist)
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username (or email) and password.',
      });
    }

    // Query user by username or email
    const query = `
      SELECT u.user_id, u.username, u.email, u.password_hash, u.full_name, u.role, u.is_active,
             d.doctor_id
      FROM users u
      LEFT JOIN doctors d ON u.user_id = d.user_id
      WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1)
    `;
    const result = await db.query(query, [username.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User does not exist.',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact hospital administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    // Update last_login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        doctor_id: user.doctor_id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const query = `
      SELECT u.user_id, u.username, u.email, u.full_name, u.role, u.last_login, u.created_at,
             d.doctor_id, d.specialization, dept.department_name
      FROM users u
      LEFT JOIN doctors d ON u.user_id = d.user_id
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      WHERE u.user_id = $1
    `;
    const result = await db.query(query, [req.user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    const result = await db.query(
      `UPDATE users 
       SET full_name = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $3 
       RETURNING user_id, username, email, full_name, role`,
      [full_name.trim(), email.trim(), req.user.user_id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const userResult = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [
      newHash,
      req.user.user_id,
    ]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT user_id, username, email, full_name, role, is_active, last_login, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/auth/users
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, full_name, role, is_active, created_at`,
      [username.trim(), email.trim(), password_hash, full_name.trim(), role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  getUsers,
  createUser,
};
