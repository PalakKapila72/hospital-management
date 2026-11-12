# Chapter 9: Comprehensive DBMS & Project Viva Voce Preparation Guide

## Master Index of Viva Voce Sections
This chapter contains 45+ questions and answers designed specifically for university oral examinations and project viva defenses. They are organized into four strategic sections:

1. [**Section A: Fundamental DBMS Concepts**](#section-a-fundamental-dbms-concepts) *(ACID, Normalization, Keys, Joins, Indexes, Locks)*
2. [**Section B: PostgreSQL & PL/pgSQL Specifics**](#section-b-postgresql--plpgsql-specifics) *(Procedures vs Functions, Triggers, JSONB, MVCC)*
3. [**Section C: Project-Specific Architecture & Implementation**](#section-c-project-specific-architecture--implementation) *(Double-booking guard, Overpayment guard, RBAC, Parameterization)*
4. [**Section D: Examiner Trap Questions & Advanced Defense**](#section-d-examiner-trap-questions--advanced-defense) *(Why SQL over NoSQL? Millennium race conditions, BCNF)*

---

## Section A: Fundamental DBMS Concepts

### Q1: What is a DBMS, and how does an RDBMS differ from a traditional file system?
**Answer**:
- A **Database Management System (DBMS)** is software that manages, stores, retrieves, and updates data systematically while providing security and concurrent access.
- A **Relational DBMS (RDBMS)** organizes data into structured two-dimensional tables (relations) comprising rows (tuples) and columns (attributes), connected via mathematical relations and integrity constraints.
- **Why RDBMS is superior to file systems**:
  1. **Elimination of Data Redundancy**: File systems duplicate data across files; RDBMS normalizes data to store each fact once.
  2. **Data Consistency**: Changes in an RDBMS are enforced via constraints (`FOREIGN KEY`, `CHECK`, `UNIQUE`).
  3. **Concurrency Control**: Multiple users can access and modify records simultaneously without overwriting each other.
  4. **Atomicity & Recovery**: In case of a system crash, an RDBMS guarantees recovery via Write-Ahead Logging (WAL), whereas file systems often corrupt open files.

---

### Q2: What are the ACID properties? Explain each with an example from this hospital project.
**Answer**:
ACID is the foundation of reliable database transactions:

1. **Atomicity ("All or Nothing")**:
   - *Concept*: Every step in a transaction must succeed; if any step fails, the entire transaction rolls back to its initial state.
   - *Hospital Example*: When booking an appointment (`sp_book_appointment`), the system creates an appointment record **and** generates an initial consultation invoice in `bills`. If creating the invoice fails, the appointment creation is rolled back, preventing orphaned appointments without invoices.
2. **Consistency ("Preserving Invariants")**:
   - *Concept*: A transaction can only transition the database from one valid state to another, strictly satisfying all schema rules and constraints.
   - *Hospital Example*: The check constraint `CHECK (balance_amount = total_amount - paid_amount)` guarantees that the balance can never disagree mathematically with the invoice totals.
3. **Isolation ("Independent Execution")**:
   - *Concept*: Concurrent transactions execute as if they were running serially without interfering with each other's uncommitted intermediate data.
   - *Hospital Example*: When a payment is recorded against an invoice, we execute `SELECT ... FOR UPDATE`. This locks the target bill row, preventing another cashier from modifying the balance simultaneously until the first transaction completes.
4. **Durability ("Permanent Survival")**:
   - *Concept*: Once a transaction commits, its changes are permanently written to persistent storage and survive power outages or server crashes.
   - *Hospital Example*: Once `COMMIT` executes for a payment, PostgreSQL's Write-Ahead Log (WAL) ensures the payment record will not be lost even if the physical server loses power immediately afterward.

---

### Q3: What is Database Normalization and why is it necessary?
**Answer**:
Database normalization is a formal mathematical process of decomposing tables with redundancy into smaller, well-structured tables linked by foreign keys.

**Why it is necessary**:
- It eliminates the three classic database anomalies:
  1. **Insertion Anomaly**: Inability to insert information without adding unrelated dummy data.
  2. **Deletion Anomaly**: Unintentional loss of valuable information when deleting an unrelated record.
  3. **Update Anomaly**: Having to update multiple rows to modify a single fact, risking partial and inconsistent updates.

---

### Q4: Explain First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF) in simple terms.
**Answer**:
- **First Normal Form (1NF)**:
  - *Rule*: Every cell must contain a single, **atomic** value. No arrays, lists, or repeating groups. Every table must have a Primary Key.
  - *In our project*: Rather than storing prescribed medicines as a comma-separated string in one column, we created a separate `prescriptions` table where each prescribed medicine is an individual atomic row.
- **Second Normal Form (2NF)**:
  - *Rule*: Must be in 1NF **and** have **no partial dependencies** (every non-key attribute must depend on the *entire* candidate key, not just part of a composite key).
  - *In our project*: Doctor details were moved out of `appointments` into their own table `doctors`, ensuring doctor names depend solely on `doctor_id`.
- **Third Normal Form (3NF)**:
  - *Rule*: Must be in 2NF **and** have **no transitive dependencies** (a non-key attribute must not depend on another non-key attribute: "Every attribute must depend on the key, the whole key, and nothing but the key").
  - *In our project*: In `doctors`, department location depends on `department_id`, which in turn depends on `doctor_id`. We extracted `departments` into an independent table with primary key `department_id`.

---

### Q5: What are the different types of keys in relational database design?
**Answer**:
- **Super Key**: Any set of attributes that uniquely identifies a row in a table.
- **Candidate Key**: A minimal super key (a super key with no redundant attributes).
- **Primary Key (PK)**: The specific candidate key chosen by the database designer to uniquely identify tuples in a table (e.g., `patient_id`). Cannot contain `NULL`.
- **Foreign Key (FK)**: A column or set of columns in one table that references the primary key of another table, enforcing referential integrity (e.g., `doctor_id` in `appointments`).
- **Composite Key**: A key made up of two or more columns combined together to ensure uniqueness (e.g., `(doctor_id, appointment_date, appointment_time)` in `appointments`).
- **Surrogate Key**: An artificial, system-generated identifier with no business meaning (e.g., auto-incrementing `SERIAL` integer IDs like `patient_id`).
- **Natural Key**: An attribute that exists in the real world and uniquely identifies a record (e.g., Email address, PAN number, or Patient National ID).

---

### Q6: What is the difference between an INNER JOIN and a LEFT OUTER JOIN?
**Answer**:
- **`INNER JOIN`**: Returns only the rows that have matching values in **both** tables. If a row in Table A does not match any row in Table B, it is omitted.
  - *Example*: `SELECT * FROM doctors INNER JOIN departments ON doctors.department_id = departments.department_id;` returns only doctors who are assigned to a valid department.
- **`LEFT OUTER JOIN` (LEFT JOIN)**: Returns **all** rows from the left table, plus the matched rows from the right table. If there is no match on the right side, the columns from the right table return as `NULL`.
  - *Example*: `SELECT * FROM patients LEFT JOIN appointments ON patients.patient_id = appointments.patient_id WHERE appointments.appointment_id IS NULL;` finds patients who have registered but have **never** booked an appointment.

---

### Q7: What is an Index, how does a B-Tree index work, and what is the trade-off?
**Answer**:
- **What it is**: An auxiliary data structure that allows the database engine to find specific rows in logarithmic time ($O(\log N)$) instead of scanning the entire physical table sequentially ($O(N)$ full table scan).
- **How B-Tree Works**: A self-balancing search tree where nodes contain ordered keys and pointers to child nodes or physical disk page blocks. Searching navigates from the root down to leaf nodes with very few disk I/O operations.
- **The Trade-off**:
  - *Advantage*: Dramatically faster `SELECT`, `WHERE`, `JOIN`, and `ORDER BY` operations.
  - *Disadvantage*: Consumes additional disk space and slightly slows down `INSERT`, `UPDATE`, and `DELETE` operations, because every time a row is added or modified, the B-Tree index must also be re-balanced.

---

### Q8: What is a Database View, and how does it differ from a Materialized View?
**Answer**:
- **Database View (Virtual Table)**: A saved SQL query. It does not store physical data on disk. Every time you query the view, PostgreSQL executes the underlying `SELECT` statement in real time against the base tables.
  - *Project Example*: `v_dashboard_stats` always returns live, up-to-the-second hospital metrics.
- **Materialized View**: Physically executes the query and writes the resulting data to disk like a regular table. Subsequent reads are instantaneous, but the data becomes stale until you explicitly execute `REFRESH MATERIALIZED VIEW`.

---

### Q9: What is the difference between Pessimistic Locking and Optimistic Locking?
**Answer**:
- **Pessimistic Locking**: Assumes that conflicts *will* happen. It explicitly locks the affected row at the beginning of the transaction (`SELECT ... FOR UPDATE`), forcing any other transaction attempting to read or modify that row to wait until the first transaction commits or rolls back.
  - *Project Example*: Used in `sp_process_payment` to prevent two cashiers from concurrently deducting from the same invoice balance.
- **Optimistic Locking**: Assumes that conflicts are *rare*. It does not place physical database locks. Instead, it tracks a version number or timestamp column. During update, it checks whether the version has changed since it was read. If it changed, the update is rejected and the user is told to retry.

---

## Section B: PostgreSQL & PL/pgSQL Specifics

### Q10: What is PL/pgSQL?
**Answer**:
**PL/pgSQL** (Procedural Language / PostgreSQL) is PostgreSQL's built-in procedural programming language. It extends standard declarative SQL by adding control structures like loops (`LOOP`, `WHILE`), conditional branching (`IF ... THEN ... ELSE`), variable declarations, structured exception handling (`RAISE EXCEPTION`), and cursor operations.

---

### Q11: What is the difference between a Stored Procedure and a Stored Function in PostgreSQL?
**Answer**:

| Dimension | Stored Function (`CREATE FUNCTION`) | Stored Procedure (`CREATE PROCEDURE`) |
| :--- | :--- | :--- |
| **Invocation** | Called within SQL queries: `SELECT fn_sync_bill_totals(1);` | Called using the `CALL` statement: `CALL sp_process_payment(...);` |
| **Return Value** | **Must** return a value or `VOID`. | Does not return a direct value; returns results via `INOUT` parameters. |
| **Transaction Control**| **Cannot** manage transactions (cannot execute `COMMIT` or `ROLLBACK` inside). Runs within the caller's transaction. | **Can** initiate, commit, and roll back autonomous transactions inside its body (`COMMIT; ROLLBACK;`). |
| **Project Example** | `fn_sync_bill_totals(p_bill_id)` | `sp_process_payment(...)` |

---

### Q12: What is a Database Trigger? What is the difference between `BEFORE` and `AFTER` triggers?
**Answer**:
A **Trigger** is a specialized procedural function that automatically executes in response to specific Data Manipulation Language (DML) events (`INSERT`, `UPDATE`, `DELETE`) on a specified table.

- **`BEFORE` Trigger**: Fires *before* the operation is written to the table. Used to validate or alter input data (e.g., modifying `NEW.updated_at = CURRENT_TIMESTAMP` before saving).
- **`AFTER` Trigger**: Fires *after* the change has succeeded and constraints have been verified. Used for audit logging or updating related summary tables (e.g., `trg_appointments_audit` writing changes to `audit_logs`).

---

### Q13: What is the difference between a Row-Level and a Statement-Level Trigger?
**Answer**:
- **Row-Level (`FOR EACH ROW`)**: Executes once for *every individual row* modified by the SQL statement. If an `UPDATE` query modifies 100 rows, a row-level trigger executes 100 times. Accesses `OLD` and `NEW` row variables.
- **Statement-Level (`FOR EACH STATEMENT`)**: Executes exactly *once* per SQL command, regardless of whether 0, 1, or 10,000 rows were affected. Ideal for high-level batch auditing.

---

### Q14: Why did you use `JSONB` for patient vital signs instead of individual columns or plain `JSON`?
**Answer**:
1. **Clinical Flexibility**: Vital signs vary across specialties (e.g., cardiology records `{"bp": "120/80", "pulse": 72}`, while pediatrics might record `{"weight_kg": 14, "head_circumference_cm": 48}`). A structured JSONB column allows flexible key-value attributes without repeatedly altering the table schema (`ALTER TABLE`).
2. **`JSONB` vs `JSON`**:
   - `JSON` stores data as an exact text representation; it must be re-parsed on every read.
   - `JSONB` (Binary JSON) decomposes the JSON into decomposed binary format at write time. Reads are significantly faster, whitespace is stripped, object keys are deduplicated, and JSONB supports **GIN indexing** for sub-millisecond key lookups.

---

### Q15: What is `SELECT ... FOR UPDATE` and why is it used?
**Answer**:
`SELECT ... FOR UPDATE` acquires an exclusive row-level lock on the selected rows until the current transaction finishes (`COMMIT` or `ROLLBACK`). Other transactions attempting to modify or acquire locks on those rows are blocked until the lock is released.

In our project, when paying a bill, we run:
```sql
SELECT balance_amount FROM bills WHERE bill_id = $1 FOR UPDATE;
```
This guarantees that two cashiers cannot simultaneously read an outstanding balance of ₹500 and each deduct ₹500, which would result in an erroneous negative balance.

---

## Section C: Project-Specific Architecture & Implementation

### Q16: How does the system prevent double-booking of doctor appointments?
**Answer**:
Double-booking is prevented using a **two-layered defense architecture**:
1. **Database Constraint Layer**:
   ```sql
   CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
   ```
   PostgreSQL physically enforces that no two rows can have the same doctor, date, and time.
2. **Application Transaction Layer**:
   Inside the `bookAppointment` controller and `sp_book_appointment` procedure, we query with a lock:
   ```sql
   SELECT appointment_id FROM appointments 
   WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status <> 'Cancelled'
   FOR UPDATE;
   ```
   If a matching active appointment exists, the system gracefully aborts the transaction (`ROLLBACK`) and returns a clear `409 Conflict` error to the frontend.

---

### Q17: How does your overpayment prevention mechanism work?
**Answer**:
Overpayment protection is enforced inside `sp_process_payment` and `paymentController.js`:
1. The invoice row is locked via `FOR UPDATE` and the current `balance_amount` is fetched.
2. The system checks: `IF p_amount > v_bill.balance_amount THEN RAISE EXCEPTION 'Payment exceeds outstanding balance...';`
3. If the payment exceeds the balance, PostgreSQL raises SQLSTATE `P0001`, which Express catches and returns as a `400 Bad Request` with details of the exact outstanding balance.

---

### Q18: Why did you use triggers for bill recalculation instead of calculating it in React or Express?
**Answer**:
1. **Single Source of Truth**: If calculations happen in React, a user could manipulate browser JavaScript variables to send fraudulent totals. If calculations happen in Node.js, direct SQL queries executed in pgAdmin would leave totals uncalculated.
2. **Automatic Synchronization**: The trigger `trg_bill_items_sync` fires automatically whenever a line item is inserted, updated, or deleted, guaranteeing that `additional_charges` and `balance_amount` always reflect the exact line-item sum without needing manual code in multiple controllers.

---

### Q19: How do you prevent SQL injection attacks in your application?
**Answer**:
We use **parameterized queries** exclusively via the `pg` client library. We never concatenate strings into SQL queries.
- *Example*:
  ```javascript
  const query = 'SELECT * FROM patients WHERE full_name ILIKE $1';
  await db.query(query, [`%${search}%`]);
  ```
- *Why this is 100% immune*: The PostgreSQL engine compiles the SQL query structure first using parameter placeholders (`$1`). The user input is transmitted separately across the wire and bound strictly as data literals. Even if the user submits `' OR '1'='1' --`, PostgreSQL treats the entire string as a literal patient name, completely eliminating SQL injection risks.

---

### Q20: How does authentication and Role-Based Access Control (RBAC) work in this project?
**Answer**:
1. **Authentication**: The user submits credentials. The backend queries `users` and uses `bcrypt.compare()` to verify the password against the stored Blowfish salt hash. If valid, the server signs a stateless JWT containing `{ user_id, username, role }`.
2. **Transmission**: The frontend stores the JWT in `localStorage` and sends it in the `Authorization: Bearer <token>` header with every API request.
3. **Verification**: `authMiddleware.js` cryptographically verifies the token using `JWT_SECRET` and confirms the user account is active in PostgreSQL.
4. **Role Guard**: `roleMiddleware.js` (`authorizeRoles('Admin', ...)`) verifies whether the user's role is permitted to execute that endpoint, returning `403 Forbidden` if unauthorized.

---

### Q21: What happens if a doctor or patient is deleted from the database?
**Answer**:
Referential integrity constraints prevent unintentional data loss:
- Both `appointments` and `bills` have foreign keys configured with **`ON DELETE RESTRICT`** referencing `patients` and `doctors`.
- If an administrator attempts to run `DELETE FROM doctors WHERE doctor_id = 1;`, PostgreSQL aborts the command with error `23503 (Foreign Key Violation)` because active appointment and billing records depend on that doctor.
- Instead of deleting, our system uses **soft deletion** (`is_active = FALSE`).

---

## Section D: Examiner Trap Questions & Advanced Defense

### Q22: "Why did you use PostgreSQL/SQL instead of MongoDB or a NoSQL database for this project?"
**Answer (Confident Academic Defense)**:
"Hospital management systems deal with clinical governance, legal medical records, and financial accounting. These domains demand strict **ACID transactional guarantees** and **referential integrity**. 
In MongoDB, relations between appointments, bills, and patients are unconstrained references; if a patient is deleted, orphaned billing records can easily occur. MongoDB does not provide relational multi-table `CHECK` constraints (like ensuring invoice balances equal totals minus payments). PostgreSQL gives us relational integrity, complex multi-table joins, atomic stored procedures, and triggers, while still providing `JSONB` support for semi-structured data like patient vital signs."

---

### Q23: "What happens if two receptionists click 'Confirm Booking' at the exact same millisecond?"
**Answer**:
"PostgreSQL resolves this through concurrency serialization:
1. The first transaction to reach the database acquires an exclusive lock on the appointment index slot.
2. The second transaction attempting to write the identical `(doctor_id, appointment_date, appointment_time)` tuple is forced to wait for the first transaction to complete.
3. Once the first transaction commits, the second transaction is immediately rejected by PostgreSQL with error code `23505 (Unique Violation)` due to constraint `uq_doctor_slot`.
4. Our backend catches `23505` and returns a clean `409 Conflict` status with the message that the slot has just been taken."

---

### Q24: "Is your database schema in Boyce-Codd Normal Form (BCNF)?"
**Answer**:
"Yes. A relation is in BCNF if for every non-trivial functional dependency $X \rightarrow Y$, $X$ is a **superkey**. 
In our normalized tables (`departments`, `users`, `doctors`, `patients`, `appointments`, `bills`, etc.), every determinant is an explicit candidate key or primary key (e.g., `doctor_id`, `patient_id`, `bill_number`). There are no non-trivial functional dependencies where the determinant is a non-superkey."

---

### Q25: "Can a single appointment have multiple bills in your system?"
**Answer**:
"No. The relationship between `appointments` and `bills` is strictly **1 : 1**.
In the `bills` table, the column `appointment_id` is defined as:
```sql
appointment_id INT NOT NULL UNIQUE REFERENCES appointments(appointment_id)
```
The `UNIQUE` constraint guarantees that PostgreSQL will reject any attempt to insert a second bill for the same appointment."

---

### Q26: "What happens if PostgreSQL loses power while a payment is being processed?"
**Answer**:
"PostgreSQL guarantees **Durability and Atomicity** using its **Write-Ahead Logging (WAL)** engine. 
- If power is lost *before* the `COMMIT` statement is written to the WAL, PostgreSQL's crash recovery process automatically rolls back any changes made during that unfinished transaction upon restart.
- If power is lost *after* the `COMMIT` record is flushed to the WAL disk page, PostgreSQL reapplies (redos) the changes during crash recovery, ensuring the payment is completely recorded."

