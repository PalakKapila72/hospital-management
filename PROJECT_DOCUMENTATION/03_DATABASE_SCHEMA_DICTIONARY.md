# Chapter 3: Database Schema & Data Dictionary

## 1. Database Overview & Specification

The persistent data storage of the **Hospital Management System** is managed by a relational schema implemented in **PostgreSQL 14+** (and fully verified on **PostgreSQL 18.4**).

### Technical Specifications
- **Database Engine**: PostgreSQL 18.4 (Object-Relational DBMS)
- **Database Name**: `hospital_management`
- **Default Listening Port**: `2007` (Local instance) / `5432` (Standard default)
- **Character Set / Encoding**: UTF-8
- **Normalization Level**: Third Normal Form (3NF)
- **Total Relational Tables**: 11 tables
- **Total Performance Indexes**: 16 explicit B-Tree indexes + 11 implicit Primary Key indexes
- **Transaction Safety**: ACID compliant with multi-version concurrency control (MVCC) and explicit row locks (`SELECT FOR UPDATE`).

---

## 2. Master Table Catalog

The schema comprises 11 tables organized into clinical, administrative, and financial domains:

| # | Table Name | System Domain | Description & Academic Purpose |
| :-: | :--- | :--- | :--- |
| **1** | [`departments`](#table-1-departments) | Administrative | Hospital clinical divisions (Cardiology, Neurology, etc.), ward location, and Head of Department. |
| **2** | [`users`](#table-2-users) | Security & Auth | Hospital staff login credentials, bcrypt password hashes, and user roles (`Admin`, `Doctor`, `Receptionist`). |
| **3** | [`doctors`](#table-3-doctors) | Clinical Staff | Doctor professional profiles, medical specialization, consultation fees, and weekly schedule shifts. |
| **4** | [`patients`](#table-4-patients) | Patient Care | Registered patient demographics, emergency kin contact details, blood groups, and unique medical codes. |
| **5** | [`appointments`](#table-5-appointments) | Scheduling Queue | Outpatient consultation bookings, appointment timeslots, reason for visit, and double-booking guard constraint. |
| **6** | [`medical_records`](#table-6-medical_records) | Clinical Records | Clinical consultation summaries, diagnoses, symptoms, treatment plans, and structured JSONB patient vitals. |
| **7** | [`prescriptions`](#table-7-prescriptions) | Pharmacy | Individual medication line items prescribed to a patient during a consultation. |
| **8** | [`bills`](#table-8-bills) | Financial Ledger | Master consultation and diagnostic invoices linked to appointments with balance calculation checks. |
| **9** | [`bill_items`](#table-9-bill_items) | Billing Items | Itemized hospital diagnostic services (e.g., ECG, X-Ray, Blood panel) attached to an invoice. |
| **10**| [`payments`](#table-10-payments) | Cashier Ledger | Individual transaction records against invoices supporting Cash, Card, UPI, and Online NetBanking. |
| **11**| [`audit_logs`](#table-11-audit_logs) | Clinical Governance| Immutable historical audit log tracking updates and sensitive events across core entities. |

---

## 3. Comprehensive Data Dictionary (Table by Table)

---

### Table 1: `departments`
**Purpose**: Stores clinical and administrative departments in the hospital. Serves as a parent entity to group doctors and clinical workloads.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `department_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for each department. |
| `department_name` | `VARCHAR(100)` | No | *None* | **UNIQUE**, `NOT NULL` | Official name of the department (e.g., `Cardiology`, `Neurology`). |
| `description` | `TEXT` | Yes | `NULL` | *None* | Clinical scope, specialty description, and services provided. |
| `head_of_department` | `VARCHAR(100)` | Yes | `NULL` | *None* | Name and medical degrees of the senior doctor heading the department. |
| `location` | `VARCHAR(100)` | Yes | `'Main Building'` | *None* | Physical ward or building block (e.g., `Block A, 3rd Floor`). |
| `is_active` | `BOOLEAN` | No | `TRUE` | `NOT NULL` | Soft-deletion flag (`TRUE` = active, `FALSE` = archived). |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when the department was created. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when the department was last updated (managed by trigger). |

---

### Table 2: `users`
**Purpose**: Stores authentication credentials, identity information, and access control roles for hospital staff (Administrators, Doctors, Receptionists).

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `user_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the user account. |
| `username` | `VARCHAR(50)` | No | *None* | **UNIQUE**, `NOT NULL` | Unique staff login handle (e.g., `admin`, `dr.sarah`, `receptionist`). |
| `email` | `VARCHAR(100)` | No | *None* | **UNIQUE**, `NOT NULL` | Official hospital email address used for login and notifications. |
| `password_hash` | `VARCHAR(255)` | No | *None* | `NOT NULL` | 60-character salted bcrypt hash generated with 10 salt rounds. |
| `full_name` | `VARCHAR(100)` | No | *None* | `NOT NULL` | Legal full name of the staff member. |
| `role` | `VARCHAR(20)` | No | *None* | `NOT NULL`, **CHECK** (`role IN ('Admin', 'Doctor', 'Receptionist')`) | Access authorization role dictating UI views and API permissions. |
| `is_active` | `BOOLEAN` | No | `TRUE` | `NOT NULL` | Active status toggle; deactivated accounts cannot obtain JWTs. |
| `last_login` | `TIMESTAMPTZ` | Yes | `NULL` | *None* | Timestamp recorded when the user successfully authenticates. |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when account was provisioned. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when profile or password was modified (managed by trigger). |

---

### Table 3: `doctors`
**Purpose**: Stores doctor clinical profiles, medical specializations, consultation fees, and available clinic hours. Linked to `departments` and optionally to `users`.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `doctor_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the doctor. |
| `user_id` | `INT` | Yes | `NULL` | **FOREIGN KEY** &rarr; `users(user_id)` **ON DELETE SET NULL**, **UNIQUE** | Links doctor to their staff login account. Unique constraint enforces 1:1 mapping. |
| `department_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `departments(department_id)` **ON DELETE RESTRICT**, `NOT NULL` | Department to which the doctor belongs. RESTRICT prevents deleting active departments. |
| `full_name` | `VARCHAR(100)` | No | *None* | `NOT NULL` | Doctor's professional title and name (e.g., `Dr. Sarah Jenkins`). |
| `specialization` | `VARCHAR(100)` | No | *None* | `NOT NULL` | Medical sub-specialty (e.g., `Interventional Cardiology`). |
| `qualification` | `VARCHAR(100)` | No | `'MBBS'` | `NOT NULL` | Medical degrees and fellowships (e.g., `MBBS, MD, DM`). |
| `phone` | `VARCHAR(20)` | No | *None* | `NOT NULL` | Official direct clinical contact phone number. |
| `email` | `VARCHAR(100)` | No | *None* | **UNIQUE**, `NOT NULL` | Professional email address. |
| `consultation_fee` | `NUMERIC(10, 2)` | No | `500.00` | `NOT NULL`, **CHECK** (`consultation_fee >= 0`) | Base fee charged per consultation visit in Indian Rupees (₹). |
| `available_days` | `VARCHAR(100)` | No | `'Mon,Tue,Wed,Thu,Fri'`| `NOT NULL` | Comma-separated list of working days of the week. |
| `available_time_start`| `TIME` | No | `'09:00:00'` | `NOT NULL` | Clinic shift start time. |
| `available_time_end` | `TIME` | No | `'17:00:00'` | `NOT NULL` | Clinic shift end time. |
| `is_active` | `BOOLEAN` | No | `TRUE` | `NOT NULL` | Clinical practice status (`TRUE` = practicing, `FALSE` = on leave/resigned). |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when doctor record was added. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp of last profile update (managed by trigger). |

---

### Table 4: `patients`
**Purpose**: Stores patient demographic profiles, date of birth for age derivation, blood groups, residential address, and emergency contact details.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `patient_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique internal surrogate identifier for the patient. |
| `patient_code` | `VARCHAR(20)` | No | *None* | **UNIQUE**, `NOT NULL` | Human-readable identifier assigned on registration (e.g., `PAT-1001`). |
| `full_name` | `VARCHAR(100)` | No | *None* | `NOT NULL` | Complete legal name of the patient. |
| `date_of_birth` | `DATE` | No | *None* | `NOT NULL` | Patient birth date (used dynamically in UI to calculate current age). |
| `gender` | `VARCHAR(10)` | No | *None* | `NOT NULL`, **CHECK** (`gender IN ('Male', 'Female', 'Other')`) | Biological and demographic gender. |
| `blood_group` | `VARCHAR(5)` | Yes | `NULL` | **CHECK** (`blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`) | Standard ABO and Rh factor blood classification. |
| `phone` | `VARCHAR(20)` | No | *None* | `NOT NULL` | Primary mobile contact phone number for appointment SMS and receipts. |
| `email` | `VARCHAR(100)` | Yes | `NULL` | *None* | Email address for electronic invoice delivery. |
| `address` | `TEXT` | No | *None* | `NOT NULL` | Permanent or current residential address. |
| `emergency_contact_name`| `VARCHAR(100)`| Yes | `NULL` | *None* | Primary next of kin or guardian name (e.g., `Meera Patel (Spouse)`). |
| `emergency_contact_phone`| `VARCHAR(20)` | Yes | `NULL` | *None* | Contact phone number of next of kin. |
| `is_active` | `BOOLEAN` | No | `TRUE` | `NOT NULL` | Soft-archive flag (`TRUE` = active patient, `FALSE` = deceased/archived). |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Registration timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Profile update timestamp (managed by trigger). |

---

### Table 5: `appointments`
**Purpose**: Manages outpatient consultation scheduling between patients and doctors. Enforces double-booking prevention through a composite unique constraint.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `appointment_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the appointment booking. |
| `appointment_code` | `VARCHAR(25)` | No | *None* | **UNIQUE**, `NOT NULL` | Unique booking reference code (e.g., `APT-20261015-001`). |
| `patient_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `patients(patient_id)` **ON DELETE RESTRICT**, `NOT NULL` | The patient receiving consultation. |
| `doctor_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `doctors(doctor_id)` **ON DELETE RESTRICT**, `NOT NULL` | The assigned doctor. RESTRICT prevents deleting doctors with appointment history. |
| `appointment_date`| `DATE` | No | *None* | `NOT NULL` | Scheduled date of consultation. |
| `appointment_time`| `TIME` | No | *None* | `NOT NULL` | Scheduled timeslot (e.g., `09:30:00`, `11:00:00`). |
| `reason_for_visit`| `TEXT` | No | *None* | `NOT NULL` | Patient's primary chief complaint or reason for booking. |
| `status` | `VARCHAR(20)` | No | `'Scheduled'` | `NOT NULL`, **CHECK** (`status IN ('Scheduled', 'Completed', 'Cancelled', 'No-Show')`) | Current lifecycle state of the consultation. |
| `cancellation_reason`| `TEXT` | Yes | `NULL` | *None* | Mandatory notes explaining why an appointment was cancelled. |
| `created_by` | `INT` | Yes | `NULL` | **FOREIGN KEY** &rarr; `users(user_id)` **ON DELETE SET NULL** | Staff user who booked the appointment. |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Booking timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp of status transition or rescheduling (trigger managed). |
| **Composite Constraint** | — | — | — | **UNIQUE (`doctor_id`, `appointment_date`, `appointment_time`)** | **`uq_doctor_slot`**: Physically prevents duplicate bookings for the same doctor at the same slot! |

---

### Table 6: `medical_records`
**Purpose**: Stores clinical consultation outcomes written by doctors, including diagnoses, symptoms, treatment plans, clinical notes, and structured JSONB patient vital signs.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `record_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the clinical record. |
| `record_code` | `VARCHAR(25)` | No | *None* | **UNIQUE**, `NOT NULL` | Unique clinical record reference (e.g., `REC-20261015-001`). |
| `appointment_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `appointments(appointment_id)` **ON DELETE RESTRICT**, **UNIQUE**, `NOT NULL` | Link to the appointment. 1:1 relationship enforced by UNIQUE constraint. |
| `patient_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `patients(patient_id)` **ON DELETE RESTRICT**, `NOT NULL` | Patient receiving the consultation. |
| `doctor_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `doctors(doctor_id)` **ON DELETE RESTRICT**, `NOT NULL` | Consulting physician who authored the notes. |
| `diagnosis` | `TEXT` | No | *None* | `NOT NULL` | Formal clinical diagnostic assessment (e.g., `Essential Hypertension`). |
| `symptoms` | `TEXT` | Yes | `NULL` | *None* | Presenting symptoms observed during examination. |
| `treatment_plan` | `TEXT` | No | *None* | `NOT NULL` | Prescribed therapeutic regimen, lifestyle changes, and dietary advice. |
| `clinical_notes` | `TEXT` | Yes | `NULL` | *None* | Detailed doctor observations, lab readings, and radiology notes. |
| `vital_signs` | `JSONB` | Yes | `'{"bp": "120/80", "pulse": 72, "temperature": "98.6 F", "weight_kg": 65}'::jsonb` | *None* | Semi-structured JSONB holding patient physiological measurements. |
| `follow_up_date` | `DATE` | Yes | `NULL` | *None* | Recommended date for the patient's next clinical visit. |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp of clinical amendments (trigger managed). |

---

### Table 7: `prescriptions`
**Purpose**: Stores individual medication items prescribed by doctors during a consultation. Normalized as child entities under `medical_records`.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `prescription_id`| `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique identifier for each medication line item. |
| `record_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `medical_records(record_id)` **ON DELETE CASCADE**, `NOT NULL` | Parent medical record. CASCADE deletes prescriptions if record is removed. |
| `medicine_name` | `VARCHAR(150)` | No | *None* | `NOT NULL` | Generic/brand pharmacological drug name (e.g., `Atenolol Tablets IP`). |
| `dosage` | `VARCHAR(50)` | No | *None* | `NOT NULL` | Strength or dosage per intake (e.g., `50 mg`, `500 mg`, `2 puffs`). |
| `frequency` | `VARCHAR(50)` | No | *None* | `NOT NULL` | Intake frequency (e.g., `Once daily in morning`, `Twice daily after meals`). |
| `duration` | `VARCHAR(50)` | No | *None* | `NOT NULL` | Duration of therapy (e.g., `5 days`, `30 days`, `As needed`). |
| `instructions` | `TEXT` | Yes | `NULL` | *None* | Specific intake guidance (e.g., `Take before breakfast with water`). |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when prescription line item was issued. |

---

### Table 8: `bills`
**Purpose**: Master financial invoice generated for every consultation. Tracks consultation fees, itemized diagnostic charges, taxes, discounts, amounts paid, and remaining balance.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `bill_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the invoice. |
| `bill_number` | `VARCHAR(30)` | No | *None* | **UNIQUE**, `NOT NULL` | Formal invoice numbering code (e.g., `INV-20261015-0001`). |
| `appointment_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `appointments(appointment_id)` **ON DELETE RESTRICT**, **UNIQUE**, `NOT NULL` | Unique 1:1 link to the appointment that triggered the bill. |
| `patient_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `patients(patient_id)` **ON DELETE RESTRICT**, `NOT NULL` | Patient responsible for payment. |
| `consultation_fee`| `NUMERIC(10, 2)` | No | `0.00` | `NOT NULL`, **CHECK** (`consultation_fee >= 0`) | Doctor's fee copied at time of booking. |
| `additional_charges`| `NUMERIC(10, 2)`| No | `0.00` | `NOT NULL`, **CHECK** (`additional_charges >= 0`) | Sum of line items from `bill_items` (auto-synced via trigger). |
| `discount_amount`| `NUMERIC(10, 2)` | No | `0.00` | `NOT NULL`, **CHECK** (`discount_amount >= 0`) | Concessions or insurance discounts applied to bill. |
| `tax_amount` | `NUMERIC(10, 2)` | No | `0.00` | `NOT NULL`, **CHECK** (`tax_amount >= 0`) | Applicable GST or healthcare service taxes. |
| `total_amount` | `NUMERIC(10, 2)` | No | *None* | `NOT NULL`, **CHECK** (`total_amount >= 0`) | Computed grand total: `(consultation_fee + additional_charges + tax - discount)`. |
| `paid_amount` | `NUMERIC(10, 2)` | No | `0.00` | `NOT NULL`, **CHECK** (`paid_amount >= 0`) | Cumulative sum of all approved payments from `payments` table. |
| `balance_amount` | `NUMERIC(10, 2)` | No | *None* | `NOT NULL`, **CHECK** (`balance_amount >= 0`) | Remaining outstanding dues. |
| `payment_status` | `VARCHAR(20)` | No | `'Unpaid'` | `NOT NULL`, **CHECK** (`payment_status IN ('Unpaid', 'Partially Paid', 'Paid')`) | Current settlement status. |
| `bill_date` | `DATE` | No | `CURRENT_DATE` | `NOT NULL` | Date when the invoice was generated. |
| `due_date` | `DATE` | Yes | `NULL` | *None* | Payment due date (default: bill date + 7 days). |
| `notes` | `TEXT` | Yes | `NULL` | *None* | Financial cashier remarks or insurance policy references. |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Creation timestamp. |
| `updated_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Recalculation timestamp (managed by trigger). |
| **Mathematical Check**| — | — | — | **CHECK (`balance_amount = (total_amount - paid_amount)`)** | **`chk_balance_valid`**: Guarantees invoice balance mathematically equals total minus paid! |

---

### Table 9: `bill_items`
**Purpose**: Stores itemized hospital services, diagnostic tests, and procedure charges added to an invoice. Recalculates master bill totals automatically via a database trigger.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `item_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique identifier for each line item. |
| `bill_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `bills(bill_id)` **ON DELETE CASCADE**, `NOT NULL` | Parent invoice. CASCADE deletes items if the invoice is dropped. |
| `description` | `VARCHAR(200)` | No | *None* | `NOT NULL` | Item or service description (e.g., `12-Lead Electrocardiogram (ECG)`). |
| `unit_price` | `NUMERIC(10, 2)` | No | *None* | `NOT NULL`, **CHECK** (`unit_price >= 0`) | Unit cost of the service. |
| `quantity` | `INT` | No | `1` | `NOT NULL`, **CHECK** (`quantity > 0`) | Number of units performed (must be $\ge 1$). |
| `total_price` | `NUMERIC(10, 2)` | No | *None* | `NOT NULL`, **CHECK** (`total_price >= 0`) | Line total calculated as `unit_price * quantity`. |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Timestamp when the test charge was added. |

---

### Table 10: `payments`
**Purpose**: Ledger of actual monetary transactions received against invoices. Managed through a concurrency-safe stored procedure (`sp_process_payment`) with pessimistic locking.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `payment_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate identifier for the payment receipt. |
| `payment_reference`| `VARCHAR(50)` | No | *None* | **UNIQUE**, `NOT NULL` | Human-readable transaction voucher (e.g., `PAY-20261015-1001`). |
| `bill_id` | `INT` | No | *None* | **FOREIGN KEY** &rarr; `bills(bill_id)` **ON DELETE RESTRICT**, `NOT NULL` | Target invoice being settled. RESTRICT prevents deleting paid invoices. |
| `amount` | `NUMERIC(10, 2)` | No | *None* | `NOT NULL`, **CHECK** (`amount > 0`) | Monetary amount tendered (must be strictly $> 0$). |
| `payment_method` | `VARCHAR(20)` | No | *None* | `NOT NULL`, **CHECK** (`payment_method IN ('Cash', 'Card', 'UPI', 'Online')`) | Payment gateway mode or tender channel. |
| `transaction_reference`| `VARCHAR(100)`| Yes | `NULL` | *None* | External gateway reference (e.g., POS slip #, UPI transaction ID). |
| `payment_date` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Exact timestamp when payment was cleared. |
| `notes` | `TEXT` | Yes | `NULL` | *None* | Cashier counter remarks. |
| `recorded_by` | `INT` | Yes | `NULL` | **FOREIGN KEY** &rarr; `users(user_id)` **ON DELETE SET NULL** | Staff user ID of cashier who processed transaction. |

---

### Table 11: `audit_logs`
**Purpose**: Immutable security and governance ledger recording state transitions, cancellations, and financial actions across the application.

| Column Name | PostgreSQL Data Type | Nullable? | Default Value | Constraints & Keys | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `log_id` | `SERIAL` | No | Auto-increment (`nextval`) | **PRIMARY KEY** | Unique surrogate audit log entry identifier. |
| `table_name` | `VARCHAR(50)` | No | *None* | `NOT NULL` | Database table where modification occurred (e.g., `appointments`, `payments`). |
| `action_type` | `VARCHAR(10)` | No | *None* | `NOT NULL`, **CHECK** (`action_type IN ('INSERT', 'UPDATE', 'DELETE')`) | DML operation type that fired the audit trigger. |
| `record_id` | `INT` | Yes | `NULL` | *None* | Primary key identifier of the modified record. |
| `changed_by` | `VARCHAR(50)` | Yes | `NULL` | *None* | Username or system process responsible for the modification. |
| `old_data` | `JSONB` | Yes | `NULL` | *None* | JSON snapshot of data *before* modification (for `UPDATE`/`DELETE`). |
| `new_data` | `JSONB` | Yes | `NULL` | *None* | JSON snapshot of data *after* modification (for `INSERT`/`UPDATE`). |
| `ip_address` | `VARCHAR(45)` | Yes | `NULL` | *None* | Client IPv4 or IPv6 network address. |
| `changed_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | `NOT NULL` | Exact timestamp when audit event was recorded. |

---

## 4. Master Referential Integrity & Foreign Key Table

The following table summarizes all 14 foreign key relationships across the schema, detailing the parent entity, child entity, cardinality, and referential integrity rule:

| # | Child Table | Foreign Key Column | Parent Table | Referenced Column | Cardinality | On Delete Action | Rationale & Integrity Rule |
| :-: | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **1** | `doctors` | `department_id` | `departments` | `department_id` | N : 1 | `RESTRICT` | A department with active doctors cannot be dropped, preventing orphaned clinical staff. |
| **2** | `doctors` | `user_id` | `users` | `user_id` | 1 : 1 (Unique) | `SET NULL` | If a staff login account is removed, the doctor clinical profile is retained for medical history. |
| **3** | `appointments` | `patient_id` | `patients` | `patient_id` | N : 1 | `RESTRICT` | A registered patient with booked or past appointments cannot be deleted from the database. |
| **4** | `appointments` | `doctor_id` | `doctors` | `doctor_id` | N : 1 | `RESTRICT` | A doctor with consultation appointments cannot be purged; doctor must be deactivated instead. |
| **5** | `appointments` | `created_by` | `users` | `user_id` | N : 1 | `SET NULL` | Preserves appointment records even if the receptionist who booked it leaves the organization. |
| **6** | `medical_records` | `appointment_id` | `appointments` | `appointment_id` | 1 : 1 (Unique) | `RESTRICT` | Medical records are strictly tied to a unique appointment; consultation records cannot be orphaned. |
| **7** | `medical_records` | `patient_id` | `patients` | `patient_id` | N : 1 | `RESTRICT` | Prevents deleting patient history containing legal clinical diagnoses. |
| **8** | `medical_records` | `doctor_id` | `doctors` | `doctor_id` | N : 1 | `RESTRICT` | Physician who authored the clinical diagnosis remains referenced for accountability. |
| **9** | `prescriptions` | `record_id` | `medical_records` | `record_id` | N : 1 | `CASCADE` | Prescriptions exist only as part of a consultation; deleting the record deletes its medicine lines. |
| **10**| `bills` | `appointment_id` | `appointments` | `appointment_id` | 1 : 1 (Unique) | `RESTRICT` | Every appointment has exactly one billing invoice; prevents orphan invoices or duplicate billing. |
| **11**| `bills` | `patient_id` | `patients` | `patient_id` | N : 1 | `RESTRICT` | Prevents deleting patients with open billing balances or financial history. |
| **12**| `bill_items` | `bill_id` | `bills` | `bill_id` | N : 1 | `CASCADE` | Diagnostic line items belong to a specific bill; removing the bill cascades to its item lines. |
| **13**| `payments` | `bill_id` | `bills` | `bill_id` | N : 1 | `RESTRICT` | Invoices with recorded financial payments cannot be deleted, preserving audit and tax compliance. |
| **14**| `payments` | `recorded_by` | `users` | `user_id` | N : 1 | `SET NULL` | Preserves the payment ledger record even if the cashier's user account is deactivated. |

---

## 5. Performance B-Tree Indexes Catalog

To guarantee sub-50ms query latency during peak clinical hours, 16 explicit B-Tree indexes were created on foreign keys and high-frequency search columns:

```sql
-- Fast patient lookups by medical code, telephone, and legal name
CREATE INDEX idx_patients_code ON patients(patient_code);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(full_name);

-- Fast doctor lookups by department and active clinical status
CREATE INDEX idx_doctors_dept ON doctors(department_id);
CREATE INDEX idx_doctors_active ON doctors(is_active);

-- High-speed appointment queue indexing for daily schedules and status filtering
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Clinical history indexes
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX idx_prescriptions_record ON prescriptions(record_id);

-- Invoicing & cashier ledger indexes
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_appointment ON bills(appointment_id);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_payments_bill ON payments(bill_id);

-- Governance composite index for fast audit trail filtering
CREATE INDEX idx_audit_table ON audit_logs(table_name, action_type);
```

