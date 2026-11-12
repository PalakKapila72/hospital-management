# Hospital Management System — Database Design & Data Dictionary

## 1. Relational Database Overview
- **Database Engine**: PostgreSQL 14+ (Verified on PostgreSQL 18.4)
- **Database Name**: `hospital_management`
- **Default Port**: `2007` (detected local port) / `5432` (standard port)
- **Collation**: UTF-8 / C
- **Architecture**: Normalized Relational (3NF), ACID Compliant, Concurrency Safe

---

## 2. Data Dictionary

### Table 1: `departments`
Stores clinical and administrative departments in the hospital.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `department_id` | SERIAL | PRIMARY KEY | Unique auto-incrementing department identifier |
| `department_name` | VARCHAR(100) | NOT NULL, UNIQUE | Official department title (e.g., Cardiology) |
| `description` | TEXT | NULLABLE | Clinical scope and specialty overview |
| `head_of_department`| VARCHAR(100) | NULLABLE | Senior doctor / professor heading division |
| `location` | VARCHAR(100) | DEFAULT 'Main Building' | Physical ward/block location in hospital |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Status toggle |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Automatic update timestamp |

---

### Table 2: `users`
System user accounts for staff authentication and role-based access control.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Staff login handle |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Official hospital staff email |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted bcrypt encrypted password hash |
| `full_name` | VARCHAR(100) | NOT NULL | Complete legal name |
| `role` | VARCHAR(20) | CHECK (role IN ('Admin', 'Doctor', 'Receptionist')) | Role for authorization |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account state |
| `last_login` | TIMESTAMPTZ | NULLABLE | Timestamp of most recent authentication |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Profile update timestamp |

---

### Table 3: `doctors`
Medical specialists, qualifications, consultation fees, and working hours.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `doctor_id` | SERIAL | PRIMARY KEY | Unique doctor identifier |
| `user_id` | INT | UNIQUE, FK &rarr; `users(user_id)` ON DELETE SET NULL | Optional link to staff login account |
| `department_id` | INT | NOT NULL, FK &rarr; `departments(department_id)` ON DELETE RESTRICT | Department reference |
| `full_name` | VARCHAR(100) | NOT NULL | Doctor's professional name |
| `specialization` | VARCHAR(100) | NOT NULL | Medical specialty (e.g. Neurovascular) |
| `qualification` | VARCHAR(100) | NOT NULL, DEFAULT 'MBBS' | Degrees and fellowships |
| `phone` | VARCHAR(20) | NOT NULL | Contact number |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Doctor's email address |
| `consultation_fee`| NUMERIC(10,2)| NOT NULL, CHECK (consultation_fee >= 0) | Base fee per appointment visit |
| `available_days` | VARCHAR(100) | NOT NULL, DEFAULT 'Mon,Tue,Wed,Thu,Fri' | Available working weekdays |
| `available_time_start`| TIME | NOT NULL, DEFAULT '09:00:00' | Shift start time |
| `available_time_end` | TIME | NOT NULL, DEFAULT '17:00:00' | Shift end time |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Clinical practicing status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### Table 4: `patients`
Registered patient demographic and emergency contact details.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `patient_id` | SERIAL | PRIMARY KEY | Unique internal patient surrogate key |
| `patient_code` | VARCHAR(20) | NOT NULL, UNIQUE | Human-readable patient ID (e.g. `PAT-1001`) |
| `full_name` | VARCHAR(100) | NOT NULL | Full patient name |
| `date_of_birth` | DATE | NOT NULL | Date of birth for age calculation |
| `gender` | VARCHAR(10) | NOT NULL, CHECK (gender IN ('Male', 'Female', 'Other')) | Biological/demographic gender |
| `blood_group` | VARCHAR(5) | CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')) | Blood classification |
| `phone` | VARCHAR(20) | NOT NULL | Primary contact phone number |
| `email` | VARCHAR(100) | NULLABLE | Email address |
| `address` | TEXT | NOT NULL | Complete residential address |
| `emergency_contact_name`| VARCHAR(100)| NULLABLE | Primary kin or guardian |
| `emergency_contact_phone`| VARCHAR(20)| NULLABLE | Guardian phone number |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft archive indicator |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### Table 5: `appointments`
Outpatient bookings and consultation scheduling queue.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `appointment_id` | SERIAL | PRIMARY KEY | Unique appointment ID |
| `appointment_code` | VARCHAR(25) | NOT NULL, UNIQUE | Code (e.g. `APT-20261021-001`) |
| `patient_id` | INT | NOT NULL, FK &rarr; `patients(patient_id)` ON DELETE RESTRICT | Patient receiving consultation |
| `doctor_id` | INT | NOT NULL, FK &rarr; `doctors(doctor_id)` ON DELETE RESTRICT | Attending physician |
| `appointment_date`| DATE | NOT NULL | Date of consultation |
| `appointment_time`| TIME | NOT NULL | Timeslot time |
| `reason_for_visit` | TEXT | NOT NULL | Primary symptoms or chief complaint |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'Scheduled', CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')) | Workflow status |
| `cancellation_reason` | TEXT | NULLABLE | Explanation if cancelled |
| `created_by` | INT | FK &rarr; `users(user_id)` ON DELETE SET NULL | Staff member who scheduled booking |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Booking timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| *Composite Constraint* | — | `UNIQUE(doctor_id, appointment_date, appointment_time)` | Double-booking prevention rule |

---

### Table 6: `medical_records`
Doctor clinical diagnostic notes, symptoms, treatment plans, and vital signs.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `record_id` | SERIAL | PRIMARY KEY | Unique record ID |
| `record_code` | VARCHAR(25) | NOT NULL, UNIQUE | Code (e.g. `REC-20261021-001`) |
| `appointment_id` | INT | NOT NULL, UNIQUE, FK &rarr; `appointments` | Linked consultation |
| `patient_id` | INT | NOT NULL, FK &rarr; `patients` | Patient reference |
| `doctor_id` | INT | NOT NULL, FK &rarr; `doctors` | Attending physician |
| `diagnosis` | TEXT | NOT NULL | Formal clinical disease/condition diagnosis |
| `symptoms` | TEXT | NULLABLE | Subjective patient symptoms |
| `treatment_plan` | TEXT | NOT NULL | Clinical therapy, dietary & lifestyle advice |
| `clinical_notes` | TEXT | NULLABLE | Diagnostic findings (ECG, X-Ray observations) |
| `vital_signs` | JSONB | DEFAULT '{"bp":"120/80","pulse":72,"temp":"98.6 F","weight_kg":65}' | Blood pressure, pulse, temperature, weight |
| `follow_up_date` | DATE | NULLABLE | Suggested next consultation review date |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Consultation completion timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

---

### Table 7: `prescriptions`
Individual medication line items linked to a medical consultation.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `prescription_id` | SERIAL | PRIMARY KEY | Unique prescription line item ID |
| `record_id` | INT | NOT NULL, FK &rarr; `medical_records(record_id)` ON DELETE CASCADE | Associated clinical record |
| `medicine_name` | VARCHAR(150) | NOT NULL | Drug name & strength (e.g. Atenolol 50mg) |
| `dosage` | VARCHAR(50) | NOT NULL | Single administration quantity (e.g. 1 tab) |
| `frequency` | VARCHAR(50) | NOT NULL | Schedule (e.g. Twice daily after meals) |
| `duration` | VARCHAR(50) | NOT NULL | Period (e.g. 15 days) |
| `instructions` | TEXT | NULLABLE | Special instructions (e.g. with warm water) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Issuance timestamp |

---

### Table 8: `bills`
Master invoice ledger connected to each patient appointment.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `bill_id` | SERIAL | PRIMARY KEY | Unique invoice ID |
| `bill_number` | VARCHAR(30) | NOT NULL, UNIQUE | Official receipt number (e.g. `INV-20261021-0001`) |
| `appointment_id` | INT | NOT NULL, UNIQUE, FK &rarr; `appointments` | Linked consultation |
| `patient_id` | INT | NOT NULL, FK &rarr; `patients` | Billed patient |
| `consultation_fee`| NUMERIC(10,2)| NOT NULL, DEFAULT 0.00, CHECK (consultation_fee >= 0) | Doctor's base consultation fee |
| `additional_charges`| NUMERIC(10,2)| NOT NULL, DEFAULT 0.00, CHECK (additional_charges >= 0) | Sum of itemized services (`bill_items`) |
| `discount_amount` | NUMERIC(10,2)| NOT NULL, DEFAULT 0.00, CHECK (discount_amount >= 0) | Concession or discount granted |
| `tax_amount` | NUMERIC(10,2)| NOT NULL, DEFAULT 0.00, CHECK (tax_amount >= 0) | Applicable GST/tax |
| `total_amount` | NUMERIC(10,2)| NOT NULL, CHECK (total_amount >= 0) | Net payable invoice amount |
| `paid_amount` | NUMERIC(10,2)| NOT NULL, DEFAULT 0.00, CHECK (paid_amount >= 0) | Cumulative amount settled by payments |
| `balance_amount` | NUMERIC(10,2)| NOT NULL, CHECK (balance_amount >= 0) | Outstanding balance remaining |
| `payment_status` | VARCHAR(20) | NOT NULL, DEFAULT 'Unpaid', CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid')) | Invoice payment state |
| `bill_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Invoice issue date |
| `due_date` | DATE | NULLABLE | Payment due date |
| `notes` | TEXT | NULLABLE | Payment or billing remarks |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Invoice creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |
| *Check Rule* | — | `CHECK (balance_amount = total_amount - paid_amount)` | Mathematical integrity constraint |

---

### Table 9: `bill_items`
Itemized hospital diagnostic and procedural services attached to a bill.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `item_id` | SERIAL | PRIMARY KEY | Unique line item ID |
| `bill_id` | INT | NOT NULL, FK &rarr; `bills(bill_id)` ON DELETE CASCADE | Associated invoice |
| `description` | VARCHAR(200) | NOT NULL | Service name (e.g. Digital X-Ray Chest) |
| `unit_price` | NUMERIC(10,2)| NOT NULL, CHECK (unit_price >= 0) | Standard tariff price |
| `quantity` | INT | NOT NULL, DEFAULT 1, CHECK (quantity > 0) | Units performed |
| `total_price` | NUMERIC(10,2)| NOT NULL, CHECK (total_price >= 0) | Subtotal (`unit_price * quantity`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Item creation timestamp |

---

### Table 10: `payments`
Immutable financial transaction ledger.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `payment_id` | SERIAL | PRIMARY KEY | Unique transaction ID |
| `payment_reference` | VARCHAR(50) | NOT NULL, UNIQUE | Receipt reference (e.g. `PAY-20261021-1001`) |
| `bill_id` | INT | NOT NULL, FK &rarr; `bills(bill_id)` ON DELETE RESTRICT | Target invoice |
| `amount` | NUMERIC(10,2)| NOT NULL, CHECK (amount > 0) | Settled amount |
| `payment_method` | VARCHAR(20) | NOT NULL, CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Online')) | Settlement channel |
| `transaction_reference` | VARCHAR(100)| NULLABLE | POS Slip No / Bank UPI Txn ID |
| `payment_date` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Settlement timestamp |
| `notes` | TEXT | NULLABLE | Remarks |
| `recorded_by` | INT | FK &rarr; `users(user_id)` ON DELETE SET NULL | Cashier/staff account who processed payment |

---

### Table 11: `audit_logs`
System governance and compliance audit trail.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | SERIAL | PRIMARY KEY | Unique log entry ID |
| `table_name` | VARCHAR(50) | NOT NULL | Affected database table |
| `action_type` | VARCHAR(10) | NOT NULL, CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')) | DML action |
| `record_id` | INT | NULLABLE | Affected entity Primary Key |
| `changed_by` | VARCHAR(50) | NULLABLE | User identity responsible |
| `old_data` | JSONB | NULLABLE | Snapshot prior to modification |
| `new_data` | JSONB | NULLABLE | Snapshot after modification |
| `changed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event timestamp |
