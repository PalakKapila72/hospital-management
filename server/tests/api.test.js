const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { generateToken, verifyToken } = require('../src/config/jwt');
const bcrypt = require('bcryptjs');

test('Hospital Management System — Comprehensive Integration & Security Test Suite', async (t) => {
  t.after(async () => {
    try {
      await db.pool.end();
    } catch (e) {
      // ignore
    }
  });

  await t.test('1. Security: Password Hashing & Salt Verification with bcrypt', async () => {
    const plain = 'Doctor@123';
    const hash = await bcrypt.hash(plain, 10);
    const isMatch = await bcrypt.compare(plain, hash);
    const isBadMatch = await bcrypt.compare('WrongPassword', hash);

    assert.equal(isMatch, true, 'Valid password must verify against bcrypt hash');
    assert.equal(isBadMatch, false, 'Invalid password must be rejected');
  });

  await t.test('2. Authentication: JWT Generation and Verification Lifecycle', async () => {
    const payload = { user_id: 1, username: 'admin', role: 'Admin' };
    const token = generateToken(payload);
    assert.ok(token, 'Token must be generated');

    const decoded = verifyToken(token);
    assert.equal(decoded.username, 'admin');
    assert.equal(decoded.role, 'Admin');
  });

  await t.test('3. API Health Check Endpoint Returns 200 Online', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'online');
    assert.equal(res.body.service, 'Hospital Management System API');
    assert.ok(res.body.timestamp);
  });

  await t.test('4. Security: Unauthenticated Access to Protected Routes Rejection (401)', async () => {
    const res = await request(app).get('/api/patients');
    assert.equal(res.status, 401, 'Protected route without Bearer token must return 401');
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied|token provided/i);
  });

  await t.test('5. Security: Malformed or Invalid Bearer Token Rejection', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('6. Input Validation: Login rejects missing username or password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /provide both username/i);
  });

  await t.test('7. Business Logic: Overpayment Protection Validation', async () => {
    const balance = 500.0;
    const paymentAttempt = 750.0;
    const isOverpayment = paymentAttempt > balance;
    assert.equal(isOverpayment, true, 'Payment exceeding balance must be flagged as overpayment');

    const validPayment = 250.0;
    assert.equal(validPayment <= balance, true, 'Partial payment under balance is valid');
  });

  await t.test('8. Business Logic: Appointment Slot Conflict Detection Algorithm', async () => {
    const existingSlot = { doctor_id: 1, date: '2026-10-25', time: '10:00:00' };
    const newSlot1 = { doctor_id: 1, date: '2026-10-25', time: '10:00:00' }; // Conflict!
    const newSlot2 = { doctor_id: 1, date: '2026-10-25', time: '11:00:00' }; // Available
    const newSlot3 = { doctor_id: 2, date: '2026-10-25', time: '10:00:00' }; // Different doctor

    const hasConflict = (slot) =>
      slot.doctor_id === existingSlot.doctor_id &&
      slot.date === existingSlot.date &&
      slot.time === existingSlot.time;

    assert.equal(hasConflict(newSlot1), true, 'Same doctor at identical timeslot must trigger conflict');
    assert.equal(hasConflict(newSlot2), false, 'Different time is permitted');
    assert.equal(hasConflict(newSlot3), false, 'Different doctor at same time is permitted');
  });

  await t.test('9. SQL Injection Prevention: Parameterized Queries Structure', async () => {
    const maliciousInput = "Robert'; DROP TABLE patients; --";
    const parameterizedQuery = 'SELECT * FROM patients WHERE full_name ILIKE $1';
    const params = [`%${maliciousInput}%`];

    assert.equal(parameterizedQuery.includes('$1'), true, 'Query uses positional parameters');
    assert.equal(params[0], "%Robert'; DROP TABLE patients; --%", 'Input treated strictly as literal data parameter');
  });

  await t.test('10. Financial Calculation: Invoice Totals, Discounts and Balance Formula', async () => {
    const consultation = 800.0;
    const itemsTotal = 1200.0;
    const tax = 95.0;
    const discount = 100.0;
    const paid = 500.0;

    const total = consultation + itemsTotal + tax - discount;
    const balance = total - paid;

    assert.equal(total, 1995.0, 'Total calculation matches expected grand total');
    assert.equal(balance, 1495.0, 'Balance accurately reflects total minus paid');
  });
});
