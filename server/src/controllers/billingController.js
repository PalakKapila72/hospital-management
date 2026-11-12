const db = require('../config/db');

// @desc    Get all bills with status filters and search
// @route   GET /api/bills
const getBills = async (req, res, next) => {
  try {
    const { status, patient_id, search, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`b.payment_status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (patient_id) {
      conditions.push(`b.patient_id = $${paramIndex}`);
      params.push(patient_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        b.bill_number ILIKE $${paramIndex} OR 
        p.full_name ILIKE $${paramIndex} OR 
        p.patient_code ILIKE $${paramIndex} OR 
        p.phone ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) FROM bills b JOIN patients p ON b.patient_id = p.patient_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        b.*,
        p.patient_code,
        p.full_name AS patient_name,
        p.phone AS patient_phone,
        a.appointment_code,
        a.appointment_date,
        d.full_name AS doctor_name,
        dept.department_name,
        COUNT(DISTINCT bi.item_id) AS items_count,
        COUNT(DISTINCT py.payment_id) AS payments_count
      FROM bills b
      JOIN patients p ON b.patient_id = p.patient_id
      JOIN appointments a ON b.appointment_id = a.appointment_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN bill_items bi ON b.bill_id = bi.bill_id
      LEFT JOIN payments py ON b.bill_id = py.bill_id
      ${whereClause}
      GROUP BY b.bill_id, p.patient_id, a.appointment_id, d.doctor_id, dept.department_id
      ORDER BY b.bill_date DESC, b.bill_id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const result = await db.query(query, params);

    // Summary aggregates
    const summaryRes = await db.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0.00) AS grand_total_invoiced,
        COALESCE(SUM(paid_amount), 0.00) AS grand_total_collected,
        COALESCE(SUM(balance_amount), 0.00) AS grand_total_outstanding
      FROM bills
    `);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryRes.rows[0],
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bill details with itemized services and payment history
// @route   GET /api/bills/:id
const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const billQuery = `
      SELECT 
        b.*,
        p.patient_code,
        p.full_name AS patient_name,
        p.gender AS patient_gender,
        p.phone AS patient_phone,
        p.email AS patient_email,
        p.address AS patient_address,
        a.appointment_code,
        a.appointment_date,
        a.appointment_time,
        d.full_name AS doctor_name,
        d.specialization,
        dept.department_name
      FROM bills b
      JOIN patients p ON b.patient_id = p.patient_id
      JOIN appointments a ON b.appointment_id = a.appointment_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.department_id = dept.department_id
      WHERE b.bill_id = $1
    `;
    const billRes = await db.query(billQuery, [id]);

    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Line items
    const itemsRes = await db.query(
      'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY item_id ASC',
      [id]
    );

    // Payment history
    const paymentsRes = await db.query(
      `SELECT py.*, u.full_name AS cashier_name
       FROM payments py
       LEFT JOIN users u ON py.recorded_by = u.user_id
       WHERE py.bill_id = $1
       ORDER BY py.payment_date DESC`,
      [id]
    );

    res.json({
      success: true,
      bill: billRes.rows[0],
      items: itemsRes.rows,
      payments: paymentsRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add itemized service charge to a bill (auto syncs total via trigger or function)
// @route   POST /api/bills/:id/items
const addBillItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, unit_price, quantity = 1 } = req.body;

    if (!description || unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Item description and unit price are required.',
      });
    }

    const price = parseFloat(unit_price);
    const qty = parseInt(quantity, 10);
    const total_price = price * qty;

    const itemRes = await db.query(
      `INSERT INTO bill_items (bill_id, description, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, description.trim(), price, qty, total_price]
    );

    // Explicitly call sync function to ensure balance and total stay accurate
    await db.query('SELECT fn_sync_bill_totals($1)', [id]);

    // Fetch updated bill
    const updatedBill = await db.query('SELECT * FROM bills WHERE bill_id = $1', [id]);

    res.status(201).json({
      success: true,
      message: 'Service item added to invoice successfully.',
      item: itemRes.rows[0],
      bill: updatedBill.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete itemized charge from a bill
// @route   DELETE /api/bills/:id/items/:itemId
const deleteBillItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;

    await db.query('DELETE FROM bill_items WHERE item_id = $1 AND bill_id = $2', [itemId, id]);

    // Re-sync bill totals
    await db.query('SELECT fn_sync_bill_totals($1)', [id]);

    const updatedBill = await db.query('SELECT * FROM bills WHERE bill_id = $1', [id]);

    res.json({
      success: true,
      message: 'Item removed from invoice.',
      bill: updatedBill.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice discount, tax, or notes
// @route   PUT /api/bills/:id
const updateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discount_amount, tax_amount, notes } = req.body;

    await db.query(
      `UPDATE bills
       SET discount_amount = COALESCE($1, discount_amount),
           tax_amount = COALESCE($2, tax_amount),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE bill_id = $4`,
      [
        discount_amount !== undefined ? parseFloat(discount_amount) : null,
        tax_amount !== undefined ? parseFloat(tax_amount) : null,
        notes !== undefined ? notes : null,
        id,
      ]
    );

    // Re-sync
    await db.query('SELECT fn_sync_bill_totals($1)', [id]);

    const updatedBill = await db.query('SELECT * FROM bills WHERE bill_id = $1', [id]);

    res.json({
      success: true,
      message: 'Invoice updated successfully.',
      bill: updatedBill.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBills,
  getBillById,
  addBillItem,
  deleteBillItem,
  updateBill,
};
