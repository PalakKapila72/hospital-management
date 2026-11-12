const errorHandler = (err, req, res, next) => {
  // Do not log sensitive credentials
  console.error('[SERVER ERROR]', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    code: err.code,
  });

  // Handle PostgreSQL specific error codes
  if (err.code === '23505') {
    // Unique violation
    let message = 'A record with this unique value already exists.';
    if (err.detail) {
      message = err.detail;
    }
    return res.status(409).json({
      success: false,
      message,
      error_code: 'UNIQUE_VIOLATION',
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist or record is referenced by other items.',
      detail: err.detail,
      error_code: 'FOREIGN_KEY_VIOLATION',
    });
  }

  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({
      success: false,
      message: 'Database check constraint failed. Invalid input values.',
      detail: err.detail,
      error_code: 'CHECK_VIOLATION',
    });
  }

  if (err.code === 'P0001') {
    // User-raised exception in PL/pgSQL
    return res.status(400).json({
      success: false,
      message: err.message,
      error_code: 'PLPGSQL_EXCEPTION',
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    error_code: err.code || 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;
