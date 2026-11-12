# Hospital Management System — BE Computer Science DBMS Project Report

**Academic Year**: 2026  
**Degree**: Bachelor of Engineering (B.E.) in Computer Science & Engineering  
**Subject**: Database Management Systems (DBMS) Laboratory & Course Project  

---

## 1. Project Abstract
Modern healthcare institutions require dependable, concurrent, and secure information systems to manage patient registrations, doctor consultation queues, itemized diagnostic billing, and medication issuance. The **Hospital Management System** is a full-stack, enterprise-grade relational database project developed using **PostgreSQL**, **Node.js/Express.js**, and **React.js**. 

The system implements a strictly normalized relational database in **Third Normal Form (3NF)** comprising 10 primary relational entities, 5 analytical reporting views, stored procedures, audit logging triggers, and transactional concurrency controls (`SELECT ... FOR UPDATE`). Staff members authenticate using bcrypt password hashing and JSON Web Tokens (JWT), with role-based access control (Admin, Doctor, Receptionist). Live data is rendered through a modern medical user interface featuring search, multi-criteria filtering, timeslot booking conflict resolution, and printable prescription and invoice documents.

---

## 2. Problem Statement
Traditional paper-based hospital registers and ad-hoc spreadsheet systems suffer from severe operational limitations:
1. **Data Redundancy & Anomaly Vulnerabilities**: Repeated patient demographic details across multiple registers cause update and deletion anomalies.
2. **Double-Booking Conflicts**: Without atomic concurrency locks, multiple reception desks inadvertently book appointments for the same doctor at identical timeslots.
3. **Financial Discrepancies**: Inability to mathematically synchronize itemized diagnostic charges with consultation balances results in overpayments and untracked outstanding dues.
4. **Lack of Audit Governance**: Absence of immutable audit trails makes it impossible to verify when consultation records were updated or payments were collected.

---

## 3. Objectives and Scope

### Objectives
- Architect a robust, relational schema adhering to 3NF standards with primary keys, foreign keys, and integrity constraints.
- Prevent double-booking race conditions through composite unique constraints and pessimistic row-level locking.
- Automate invoice recalculation using PostgreSQL stored procedures and triggers.
- Provide role-differentiated access protecting patient clinical diagnosis from unauthorized staff.
- Generate aggregate operational reports (doctor workloads, department performance, revenue collections) with CSV export capability.

### Scope
- **Outpatient Clinical Management**: Registration, appointment scheduling, and electronic health documentation.
- **Diagnostic & Pharmacy Orders**: Service charges and prescription issuance.
- **Billing Ledger**: Itemized invoices, partial/full settlements, and balance tracking.
- **Academic Demonstration**: Explicit coverage of DDL, DML, Joins, Aggregates, Subqueries, Views, Functions, Triggers, and Transactions.

---

## 4. Existing System vs. Proposed System

| Dimension | Existing / Legacy System | Proposed Hospital Management System |
| :--- | :--- | :--- |
| **Data Storage** | Paper logs, disparate spreadsheets | Centralized PostgreSQL relational database |
| **Data Redundancy** | High; duplicated patient info across files | Zero redundancy; normalized to 3NF |
| **Concurrency** | Frequent double-booking collisions | Concurrency-safe transactions (`FOR UPDATE`) |
| **Billing Integrity**| Manual calculations prone to errors | Automated database procedures & triggers |
| **Security** | Unencrypted, shared access | bcrypt salted password hashing & JWT RBAC |
| **Analytics** | Tedious manual tallying | Real-time SQL views and instant CSV exports |

---

## 5. System Requirements

### Functional Requirements
- **FR1: Authentication**: Staff login with JWT credentials; role-based permission verification.
- **FR2: Patient Management**: Patient CRUD operations, age calculation from DOB, search by code/phone.
- **FR3: Doctor & Department Management**: Department allocation, consultation fee configuration, and schedule tracking.
- **FR4: Appointment Queue**: Real-time slot availability, conflict prevention, status transitions.
- **FR5: Medical Records & Rx**: Diagnostic logging, clinical notes, JSON vitals, and attached medication orders.
- **FR6: Financial Settlements**: Auto-generated consultation bills, line item additions, and partial payment ledger.
- **FR7: Reports & Analytics**: Department-wise, doctor-wise, and daily revenue reports with CSV downloads.

### Non-Functional Requirements
- **NFR1: Concurrency Safety**: ACID transaction isolation during appointment booking and payment processing.
- **NFR2: Performance**: B-Tree indexes on foreign keys and search columns to ensure sub-50ms query latency.
- **NFR3: Security**: Parameterized queries preventing SQL injection; role validation on all protected endpoints.
- **NFR4: Usability**: Responsive medical UI with accessible contrast, clear status badges, and print-ready CSS.

---

## 6. System Architecture

```text
+-------------------------------------------------------------------------+
|                          CLIENT PRESENTATION TIER                       |
|               React 18 + Vite + Vanilla CSS Medical Design System       |
|  - Dashboard      - Patients Directory      - Appointment Booking Queue |
|  - Medical Records- Pharmacy Prescriptions  - Billing & Payments Ledger |
|  - DBMS Reports   - Staff User Management   - Printable Templates       |
+------------------------------------+------------------------------------+
                                     |  HTTP REST / JSON (JWT Header)
                                     v
+-------------------------------------------------------------------------+
|                          APPLICATION BACKEND TIER                       |
|                       Node.js + Express.js REST API                     |
|  - Router Pipeline & Centralized Error Handler (PostgreSQL error codes) |
|  - JWT Authentication Middleware & Role Authorization Guard             |
|  - Controllers: Auth, Patients, Doctors, Appointments, Billing, Reports |
|  - Parameterized Query Builder (pg Pool connection manager)             |
+------------------------------------+------------------------------------+
                                     |  PostgreSQL TCP (Port 2007/5432)
                                     v
+-------------------------------------------------------------------------+
|                          DATABASE STORAGE TIER                          |
|                       PostgreSQL 14+ Relational DBMS                    |
|  - 10 Relational Tables in 3NF (PK, FK, CHECK, UNIQUE, NOT NULL)       |
|  - Performance B-Tree Indexes on foreign keys and search columns        |
|  - Analytical Views: v_dashboard_stats, v_doctor_appointments, etc.     |
|  - Stored Procedures: sp_book_appointment, sp_process_payment           |
|  - Triggers: trg_bill_items_sync, trg_appointments_audit, etc.          |
|  - Concurrency Locks: Pessimistic Row Locking with SELECT FOR UPDATE    |
+-------------------------------------------------------------------------+
```

---

## 7. Database Design Summary
*(See detailed specifications in [ER_DIAGRAM.md](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/ER_DIAGRAM.md) and [DATABASE_DESIGN.md](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/DATABASE_DESIGN.md))*

- **Tables**: `departments`, `users`, `doctors`, `patients`, `appointments`, `medical_records`, `prescriptions`, `bills`, `bill_items`, `payments`, `audit_logs`
- **Views**: `v_dashboard_stats`, `v_appointment_details`, `v_doctor_appointments`, `v_patient_billing_summary`, `v_daily_revenue_report`
- **Functions & Procedures**: `fn_sync_bill_totals`, `sp_process_payment`, `sp_book_appointment`
- **Triggers**: `trg_departments_timestamp`, `trg_appointments_audit`, `trg_bill_items_sync`, `trg_payments_audit`

---

## 8. College DBMS Viva Questions & Answers

### Q1: What is Third Normal Form (3NF) and how is it demonstrated in this project?
**Answer**: A relation is in 3NF if it is in 2NF and has no transitive dependencies (where a non-key attribute depends on another non-key attribute). In our schema:
- If doctor attributes like `department_name` and `head_of_department` were stored directly in `doctors`, there would be a transitive dependency: $\text{doctor\_id} \rightarrow \text{department\_id} \rightarrow \text{department\_name}$.
- We decomposed this into two separate relations: `departments` (with primary key `department_id`) and `doctors` (referencing `department_id` as a foreign key).
- Similarly, itemized bill charges are extracted to `bill_items` and prescriptions to `prescriptions`, ensuring 1NF atomicity and 3NF independence.

### Q2: How does the system prevent double-booking of doctor appointments?
**Answer**: Double booking is guarded at both the database level and application level:
1. **Database Constraint**: `CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)` ensures that PostgreSQL physically rejects duplicate bookings.
2. **Pessimistic Concurrency Check**: Inside `sp_book_appointment` and backend transaction, an explicit `SELECT appointment_id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status <> 'Cancelled' FOR UPDATE` acquires an exclusive lock, preventing race conditions when two receptionists book concurrently.

### Q3: What is the purpose of database triggers in this project?
**Answer**:
1. `trg_bill_items_sync`: Triggers after `INSERT`, `UPDATE`, or `DELETE` on `bill_items` to invoke `fn_sync_bill_totals`, ensuring the invoice `total_amount` and `balance_amount` automatically match line items without manual frontend calculations.
2. `trg_appointments_audit`: Triggers when an appointment's status transitions (e.g., `Scheduled` $\rightarrow$ `Cancelled`), recording old and new states with timestamps in `audit_logs`.
3. `trg_departments_timestamp`: Automatically synchronizes `updated_at = CURRENT_TIMESTAMP`.

### Q4: How is ACID transaction consistency maintained during payment processing?
**Answer**:
When `sp_process_payment` executes:
- **Atomicity**: The payment insertion and invoice balance deduction are wrapped in a single `BEGIN ... COMMIT` block. If any step fails, the entire transaction rolls back (`ROLLBACK`).
- **Consistency**: A check constraint `CHECK (balance_amount = total_amount - paid_amount)` verifies mathematical correctness.
- **Isolation**: The target bill is locked with `SELECT ... FOR UPDATE` to prevent concurrent modification by another transaction.
- **Durability**: Once committed, write-ahead logs (WAL) ensure payment records persist across server restarts.

### Q5: How do you prevent SQL injection attacks in the application?
**Answer**: We use parameterized queries exclusively through the `pg` client library. User inputs are never concatenated directly into SQL strings. For example:
```javascript
const query = 'SELECT * FROM patients WHERE full_name ILIKE $1';
await db.query(query, [`%${search}%`]);
```
PostgreSQL compiles the SQL query plan before binding the parameter `$1`, treating any malicious SQL syntax (such as `' OR '1'='1`) strictly as literal string values.

### Q6: What performance optimization techniques are used?
**Answer**:
1. **Indexes**: Created B-Tree indexes on high-frequency search fields (`idx_patients_phone`, `idx_patients_code`, `idx_appointments_date`, `idx_bills_status`).
2. **Database Views**: Pre-composed joins (`v_dashboard_stats`, `v_doctor_appointments`) reduce repetitive multi-table join overhead.
3. **Connection Pooling**: `pg.Pool` maintains reusable database connections, minimizing connection setup and teardown latency.

---

## 9. Limitations & Future Scope

### Current Limitations
- Simulated payment processing rather than live UPI gateway webhooks.
- Inpatient bed allotment and operation theater scheduling are not implemented in the current outpatient-focused scope.

### Future Scope
- Integration with external HL7/FHIR healthcare standards.
- Inpatient ward and bed management subsystem.
- SMS/Email appointment notification gateway.

---

## 10. Conclusion
The Hospital Management System demonstrates the rigorous application of database theory, normalization, concurrency control, and full-stack software architecture. By enforcing 3NF schema design, transactional integrity, and database-level triggers, the project delivers a reliable, audit-compliant academic solution ready for DBMS laboratory submission and viva defense.
