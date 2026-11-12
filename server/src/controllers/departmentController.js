const db = require('../config/db');

// @desc    Get all departments with doctor counts
// @route   GET /api/departments
const getDepartments = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        dept.department_id,
        dept.department_name,
        dept.description,
        dept.head_of_department,
        dept.location,
        dept.is_active,
        dept.created_at,
        COUNT(d.doctor_id) AS total_doctors,
        COUNT(CASE WHEN d.is_active = TRUE THEN 1 END) AS active_doctors
      FROM departments dept
      LEFT JOIN doctors d ON dept.department_id = d.department_id
      GROUP BY dept.department_id
      ORDER BY dept.department_name ASC
    `;
    const result = await db.query(query);
    res.json({ success: true, count: result.rows.length, departments: result.rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department with its doctors
// @route   GET /api/departments/:id
const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deptRes = await db.query('SELECT * FROM departments WHERE department_id = $1', [id]);

    if (deptRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const doctorsRes = await db.query(
      'SELECT * FROM doctors WHERE department_id = $1 ORDER BY full_name ASC',
      [id]
    );

    res.json({
      success: true,
      department: deptRes.rows[0],
      doctors: doctorsRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department (Admin only)
// @route   POST /api/departments
const createDepartment = async (req, res, next) => {
  try {
    const { department_name, description, head_of_department, location } = req.body;

    if (!department_name) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    const result = await db.query(
      `INSERT INTO departments (department_name, description, head_of_department, location)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [department_name.trim(), description || null, head_of_department || null, location || 'Main Building']
    );

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department (Admin only)
// @route   PUT /api/departments/:id
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department_name, description, head_of_department, location, is_active } = req.body;

    const result = await db.query(
      `UPDATE departments
       SET department_name = COALESCE($1, department_name),
           description = COALESCE($2, description),
           head_of_department = COALESCE($3, head_of_department),
           location = COALESCE($4, location),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE department_id = $6
       RETURNING *`,
      [
        department_name ? department_name.trim() : null,
        description !== undefined ? description : null,
        head_of_department !== undefined ? head_of_department : null,
        location !== undefined ? location : null,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    res.json({
      success: true,
      message: 'Department updated successfully.',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
};
