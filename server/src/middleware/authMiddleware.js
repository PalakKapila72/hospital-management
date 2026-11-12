const { verifyToken } = require('../config/jwt');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token. Please log in again.',
      });
    }

    // Verify user still exists in database and is active
    const userResult = await db.query(
      'SELECT user_id, username, email, full_name, role, is_active FROM users WHERE user_id = $1',
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.',
      });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateToken;
