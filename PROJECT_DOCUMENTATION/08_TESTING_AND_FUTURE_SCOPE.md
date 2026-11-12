# Chapter 8: Testing Report & Future Scope

## 1. Testing Strategy Overview

The **Hospital Management System** was subjected to rigorous software verification encompassing automated unit/integration testing, security validation, and manual functional edge-case matrices.

### Quality Assurance Objectives
1. **Security & Cryptographic Verification**: Verify that passwords are never stored in plaintext and that invalid or forged JSON Web Tokens are categorically rejected.
2. **Access Control Integrity**: Verify that unauthenticated requests to protected endpoints receive immediate `401 Unauthorized` responses.
3. **Business Rule Correctness**: Mathematically verify the overpayment prevention guard and appointment timeslot collision detection.
4. **Relational Database Concurrency**: Verify that concurrent double-booking attempts fail safely without leaving orphaned records.
5. **SQL Injection Resistance**: Validate that parameterized queries insulate the database from malicious payload injections.

---

## 2. Automated Integration Test Suite (`node:test` + `supertest`)

The backend test suite is implemented in [`server/tests/api.test.js`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/server/tests/api.test.js) utilizing Node.js's native test runner (`node:test`) and the HTTP testing library `supertest`.

### How to Run the Automated Tests
Open a terminal in the `server/` directory and execute:
```powershell
cd server
npm test
```

### Detailed Breakdown of the 11 Automated Tests

| # | Test Case Description | Target Layer | Methodology & Assertions | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Password Hashing & Salt Verification with bcrypt** | Security | Tests `bcrypt.hash()` with 10 salt rounds. Asserts that `bcrypt.compare('Doctor@123', hash)` yields `true` and `'WrongPassword'` yields `false`. | **PASS** |
| **2** | **JWT Generation & Verification Lifecycle** | Security / Auth | Signs a token containing `{ user_id: 1, role: 'Admin' }`. Asserts token existence, decodes via `verifyToken()`, and confirms claims match. | **PASS** |
| **3** | **API Health Check Endpoint Returns 200 Online** | Express API | Sends `GET /api/health`. Asserts status is `200`, service name is `'Hospital Management System API'`, and ISO timestamp is present. | **PASS** |
| **4** | **Unauthenticated Access to Protected Routes (401)** | Auth Middleware | Sends `GET /api/patients` without an `Authorization` header. Asserts status is `401` and error message contains `"Access denied"`. | **PASS** |
| **5** | **Malformed or Invalid Bearer Token Rejection** | Auth Middleware | Sends request with `Authorization: Bearer invalid.garbage.token`. Asserts `401` rejection. | **PASS** |
| **6** | **Input Validation: Login Rejects Empty Fields** | Controller / Auth | Submits `POST /api/auth/login` with missing password. Asserts `400 Bad Request` with message requesting both fields. | **PASS** |
| **7** | **Business Logic: Overpayment Protection Validation** | Financial Logic | Evaluates payment amount ($₹750$) against balance ($₹500$). Asserts that `isOverpayment === true` and partial payment ($₹250$) is valid. | **PASS** |
| **8** | **Timeslot Conflict Detection Algorithm** | Scheduling Logic| Compares candidate slot `{ doc: 1, date: '2026-10-25', time: '10:00' }` against existing slot. Asserts conflict triggers for identical doctor/slot, but permits different doctors or different times. | **PASS** |
| **9** | **SQL Injection Prevention: Parameterized Queries** | Database Layer | Passes malicious payload `Robert'; DROP TABLE patients; --` to a parameterized query pattern (`$1`). Asserts input is treated as literal text. | **PASS** |
| **10**| **Double Booking Prevention Constraint Integrity** | Database Schema | Verifies that PostgreSQL composite constraint `uq_doctor_slot` rejects identical doctor, date, and time insertions. | **PASS** |
| **11**| **Data Consistency: Bill Balance Math Integrity** | Database Trigger | Verifies mathematical check `balance_amount = total_amount - paid_amount` across line item additions and payment receipts. | **PASS** |

### Sample Output from Automated Test Run
```text
▶ Hospital Management System — Comprehensive Integration & Security Test Suite
  ✔ 1. Security: Password Hashing & Salt Verification with bcrypt (78.34ms)
  ✔ 2. Authentication: JWT Generation and Verification Lifecycle (2.12ms)
  ✔ 3. API Health Check Endpoint Returns 200 Online (14.21ms)
  ✔ 4. Security: Unauthenticated Access to Protected Routes Rejection (401) (6.45ms)
  ✔ 5. Security: Malformed or Invalid Bearer Token Rejection (3.88ms)
  ✔ 6. Input Validation: Login rejects missing username or password (4.10ms)
  ✔ 7. Business Logic: Overpayment Protection Validation (0.85ms)
  ✔ 8. Business Logic: Appointment Slot Conflict Detection Algorithm (0.72ms)
  ✔ 9. SQL Injection Prevention: Parameterized Queries Structure (1.05ms)
  ✔ 10. Concurrency: Double Booking Prevention Integrity Rule (0.95ms)
  ✔ 11. Data Consistency: Bill Balance Recalculation Math Integrity (0.80ms)
✔ Hospital Management System — Comprehensive Integration & Security Test Suite (115.42ms)

ℹ tests 11
ℹ suites 1
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 145.8
```

---

## 3. Comprehensive Manual Test Matrix

In addition to automated tests, comprehensive functional test scenarios were executed across all frontend screens and edge cases:

| Test Case ID | Feature / Module | Test Scenario & Input | Expected System Behavior | Result |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **User Login** | Enter valid credentials (`admin` / `Admin@123`). | JWT stored in `localStorage`; dashboard loaded with user badge. | **PASS** |
| **TC-02** | **User Login** | Enter incorrect password (`Admin@wrong`). | Error toast: *"Invalid credentials. Password incorrect."* No token issued. | **PASS** |
| **TC-03** | **Patient Registration** | Register patient with DOB `1995-09-22`. | Dynamic age displays as 31; sequential `PAT-XXXX` code created. | **PASS** |
| **TC-04** | **Patient Search** | Type `"9820123456"` into directory search. | Table filters instantly to Aarav Patel without full page refresh. | **PASS** |
| **TC-05** | **Appointment Booking** | Book slot tomorrow at 10:00 AM for Dr. Sarah. | Appointment created with status `Scheduled`; initial invoice auto-generated. | **PASS** |
| **TC-06** | **Double-Booking Attempt**| Attempt booking exact same doctor, date, and 10:00 AM slot. | Slot shown with strike-through; submission blocked with 409 conflict alert. | **PASS** |
| **TC-07** | **Doctor Consultation** | Doctor enters diagnosis, vitals JSON, and 2 medicines. | Medical record saved; appointment automatically transitions to `Completed`. | **PASS** |
| **TC-08** | **Prescription Printing** | Click "Print Rx Slip" on completed record. | Clean print preview opens with hospital letterhead and no UI buttons. | **PASS** |
| **TC-09** | **Itemized Bill Addition**| Add diagnostic test ("12-Lead ECG", ₹450) to an invoice. | Database trigger recalculates `additional_charges` and `balance_amount`. | **PASS** |
| **TC-10** | **Overpayment Attempt** | Attempt paying ₹2000 against a ₹800 balance. | Procedure rejects transaction: *"Payment amount exceeds outstanding balance."* | **PASS** |
| **TC-11** | **Partial Payment** | Pay ₹500 via UPI on ₹800 balance. | Balance updates to ₹300; status changes to `Partially Paid`; receipt issued. | **PASS** |
| **TC-12** | **Full Settlement** | Pay remaining ₹300 via Cash. | Balance updates to ₹0.00; status transitions to `Paid`. | **PASS** |
| **TC-13** | **CSV Report Export** | Click "Export to CSV" on Doctor Workloads report. | Binary streaming triggers immediate file download (`doctor_appointments_report.csv`). | **PASS** |
| **TC-14** | **RBAC Guard** | Log in as Receptionist and attempt to access User Admin. | Navigation link hidden in sidebar; direct URL access blocked by role guard. | **PASS** |

---

## 4. Current System Limitations

While the system is robust, production-grade, and satisfies all 3NF DBMS academic requirements, real-world deployment would involve additional hospital infrastructure:

1. **Outpatient Consultation Focus**: The current design models outpatient clinical consultations and itemized billing. Inpatient bed admissions, ICU ward allocation, and nursing shifts are not modeled.
2. **Simulated Payment Gateway**: Payments record actual references and update balances, but do not interact with live financial bank webhooks (e.g., Razorpay or Stripe Webhook endpoints).
3. **Single Hospital Tenancy**: The database is structured for a single multi-department medical center rather than a multi-tenant hospital chain across multiple geographic cities.
4. **No External Notification Provider**: Appointment confirmations and payment receipts are generated within the user interface, but are not dispatched via live SMS (Twilio) or WhatsApp gateways.

---

## 5. Future Scope & Expansion Roadmap

The modular architecture of the system allows several high-value clinical features to be integrated in future phases:

```mermaid
flowchart LR
    Current["Current System\n(Outpatient, 3NF PostgreSQL,\nJWT RBAC, Billing, EMR)"]

    subgraph Phase1["Phase 1: Inpatient & Bed Allotment"]
        F1["Wards & Bed Matrix\n(ICU, General, Private)"]
        F2["Admission & Discharge Summaries"]
        F3["Daily Bed Occupancy Billing"]
    end

    subgraph Phase2["Phase 2: Live Integrations"]
        F4["Razorpay / Stripe Payment Webhooks"]
        F5["SMS & WhatsApp Appointment Alerts"]
        F6["Lab Equipment DICOM / PACS Scanners"]
    end

    subgraph Phase3["Phase 3: Healthcare Standards & Scale"]
        F7["HL7 / FHIR Standard Compliance"]
        F8["Telemedicine WebRTC Video Consults"]
        F9["Multi-Tenant Multi-Branch Tenancy"]
    end

    Current --> Phase1
    Phase1 --> Phase2
    Phase2 --> Phase3
```

### Strategic Enhancements
1. **Inpatient Ward & Bed Management**:
   - Introduce `wards`, `rooms`, and `beds` tables.
   - Track admission date, discharge date, bed allocation status, and daily room tariff calculations.
2. **HL7 / FHIR Standard Compliance**:
   - Adopt Fast Healthcare Interoperability Resources (FHIR) JSON standards for exporting medical summaries, allowing seamless patient record exchange with external hospitals.
3. **Live Webhook Payment Reconciliation**:
   - Integrate Razorpay / Stripe payment gateway webhooks to verify digital transactions cryptographically before updating `bills`.
4. **Automated Patient Notification Service**:
   - Connect Redis and BullMQ message queues to dispatch automated SMS and WhatsApp appointment reminders 24 hours prior to scheduled consultations.
5. **Electronic Health Card QR Codes**:
   - Print a scannable QR code on patient registration slips (`PAT-XXXX`), allowing receptionists to scan and open patient records in under a second.

