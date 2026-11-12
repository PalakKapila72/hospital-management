const db = require('../config/db');

// @desc    Record a new payment with ACID transaction and overpayment protection
// @route   POST /api/payments
const recordPayment = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { bill_id, amount, payment_method, transaction_reference, notes } = req.body;

    if (!bill_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Bill ID, payment amount, and payment method are required.',
      });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a valid positive number.',
      });
    }

    const validMethods = ['Cash', 'Card', 'UPI', 'Online'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Allowed: ${validMethods.join(', ')}`,
      });
    }

    await client.query('BEGIN');

    // 1. Pessimistic row locking on target bill (FOR UPDATE)
    const billRes = await client.query(
      `SELECT bill_id, bill_number, total_amount, paid_amount, balance_amount, payment_status, patient_id
       FROM bills
       WHERE bill_id = $1
       FOR UPDATE`,
      [bill_id]
    );

    if (billRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const bill = billRes.rows[0];
    const currentBalance = parseFloat(bill.balance_amount);

    if (currentBalance <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This invoice has already been fully paid. Outstanding balance is ₹0.00.',
      });
    }

    // 2. Strict Overpayment Validation
    if (payAmount > currentBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Payment amount of ₹${payAmount.toFixed(2)} exceeds current outstanding balance of ₹${currentBalance.toFixed(2)}. Overpayment is strictly prohibited.`,
        outstanding_balance: currentBalance,
      });
    }

    // 3. Generate unique payment receipt reference
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const payment_reference = `PAY-${todayStr}-${randCode}`;

    // 4. Insert payment record into ledger
    const paymentInsertQuery = `
      INSERT INTO payments (
        payment_reference, bill_id, amount, payment_method,
        transaction_reference, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const paymentRes = await client.query(paymentInsertQuery, [
      payment_reference,
      bill_id,
      payAmount,
      payment_method,
      transaction_reference ? transaction_reference.trim() : null,
      notes ? notes.trim() : null,
      req.user ? req.user.user_id : null,
    ]);

    // 5. Update bill paid amount, balance, and status atomically
    const newPaidAmount = parseFloat(bill.paid_amount) + payAmount;
    const newBalance = currentBalance - payAmount;
    const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

    await client.query(
      `UPDATE bills
       SET paid_amount = $1,
           balance_amount = $2,
           payment_status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE bill_id = $4`,
      [newPaidAmount, newBalance, newStatus, bill_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toFixed(2)} recorded successfully via ${payment_method}.`,
      payment: paymentRes.rows[0],
      updated_bill: {
        bill_id: bill.bill_id,
        bill_number: bill.bill_number,
        total_amount: bill.total_amount,
        paid_amount: newPaidAmount,
        balance_amount: newBalance,
        payment_status: newStatus,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// @desc    Get payments ledger with filters
// @route   GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { payment_method, bill_id, search, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (payment_method) {
      conditions.push(`p.payment_method = $${paramIndex}`);
      params.push(payment_method);
      paramIndex++;
    }

    if (bill_id) {
      conditions.push(`p.bill_id = $${paramIndex}`);
      params.push(bill_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        p.payment_reference ILIKE $${paramIndex} OR 
        p.transaction_reference ILIKE $${paramIndex} OR 
        b.bill_number ILIKE $${paramIndex} OR 
        pt.full_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*) 
       FROM payments p
       JOIN bills b ON p.bill_id = b.bill_id
       JOIN patients pt ON b.patient_id = pt.patient_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const query = `
      SELECT 
        p.*,
        b.bill_number,
        b.total_amount AS invoice_total,
        b.balance_amount AS invoice_balance,
        pt.patient_id,
        pt.patient_code,
        pt.full_name AS patient_name,
        pt.phone AS patient_phone,
        u.full_name AS cashier_name
      FROM payments p
      JOIN bills b ON p.bill_id = b.bill_id
      JOIN patients pt ON b.patient_id = pt.patient_id
      LEFT JOIN users u ON p.recorded_by = u.user_id
      ${whereClause}
      ORDER BY p.payment_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit, 10), offset);

    const result = await db.query(query, params);

    // Method breakdown summary
    const summaryRes = await db.query(`
      SELECT 
        payment_method, 
        COUNT(*) as count, 
        SUM(amount) as total
      FROM payments
      GROUP BY payment_method
    `);

    res.json({
      success: true,
      data: result.rows,
      methodBreakdown: summaryRes.rows,
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

module.exports = {
  recordPayment,
  getPayments,
};
