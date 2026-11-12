# Hospital Management System (Full-Stack DBMS Project)

A complete, production-grade Hospital Management System designed for a **3rd-year Bachelor of Engineering (B.E.) Computer Science DBMS academic project**.

Built with **PostgreSQL**, **Node.js/Express.js**, and **React.js (Vite)**. Features a normalized relational schema in **Third Normal Form (3NF)**, analytical SQL views, stored procedures, triggers, audit logging, role-based access control, and a modern medical administration user interface.

---

## 1. Project Architecture & Directory Structure

```text
hospital-management/
├── client/                     # React.js (Vite) Frontend Application
│   ├── src/
│   │   ├── components/         # Modals, Sidebar, Header, ConfirmDialogs, Tables
│   │   ├── context/            # AuthContext (JWT session & role guards)
│   │   ├── pages/              # 14 functional screens (Dashboard, Patients, etc.)
│   │   ├── services/           # Fetch API client with Bearer token interceptor
│   │   ├── utils/              # Currency, date, and badge formatting
│   │   ├── App.jsx             # Main navigation & state coordinator
│   │   ├── index.css           # Custom medical design system (Navy & Teal)
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/                     # Node.js & Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # PostgreSQL connection pool (pg) & JWT
│   │   ├── controllers/        # Auth, Patients, Doctors, Billing, Reports, etc.
│   │   ├── middleware/         # Auth verify, Role authorize, Error handling
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── scripts/            # initDb.js & initDemoAdmin.js
│   │   ├── app.js              # Express app pipeline
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Automated integration tests (node:test + supertest)
│   ├── .env.example            # Environment configuration template
│   └── package.json
├── database/                   # PostgreSQL DDL & DML Scripts (pgAdmin compatible)
│   ├── schema.sql              # 10 normalized tables in 3NF + audit_logs
│   ├── seed.sql                # Synthetic realistic hospital dataset
│   ├── views.sql               # 5 analytical views (dashboard, doctor metrics, etc.)
│   ├── functions.sql           # Stored procedures & PostgreSQL functions
│   ├── triggers.sql            # Audit log trigger & bill recalculation trigger
│   └── reports.sql             # SQL query collection for college viva demonstration
├── docs/                       # Academic Submission Documentation
│   ├── ER_DIAGRAM.md           # Mermaid ER diagram & cardinality table
│   ├── DATABASE_DESIGN.md      # Full data dictionary & relational schemas
│   ├── NORMALIZATION.md        # Detailed 1NF, 2NF, and 3NF normalization proofs
│   ├── API_DOCUMENTATION.md    # REST endpoints, payloads, and status codes
│   ├── TESTING_REPORT.md       # Test matrix, edge cases, and automated test runs
│   └── PROJECT_REPORT.md       # Full college project report & Viva Q&A
├── README.md
└── .gitignore
```

---

## 2. Local Environment & Prerequisites

Your system was inspected during initialization and verified to have:
- **Node.js**: `v24.12.0`
- **npm**: `11.6.2`
- **Git**: `2.47.1`
- **PostgreSQL**: `PostgreSQL 18.4` (Windows Service `postgresql-x64-18` is **RUNNING**)
  - **Port**: `2007` (Your local PostgreSQL 18 instance is listening on port **2007**)

---

## 3. Database Setup (Choose Option A or Option B)

### Option A: Setup using pgAdmin 4 (GUI Method)

1. Open **pgAdmin 4** on your Windows computer.
2. In the left browser tree, expand **Servers** and double-click your PostgreSQL 18 server. Enter your master `postgres` password when prompted.
3. Right-click on **Databases** &rarr; **Create** &rarr; **Database...**
   - **Database Name**: `hospital_management`
   - Click **Save**.
4. Right-click on your newly created `hospital_management` database &rarr; select **Query Tool**.
5. Execute the database scripts in this order:
   - **Step 1**: Open [`database/schema.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/schema.sql) in Query Tool and click **Execute (F5)**.
   - **Step 2**: Open [`database/views.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/views.sql) and click **Execute (F5)**.
   - **Step 3**: Open [`database/functions.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/functions.sql) and click **Execute (F5)**.
   - **Step 4**: Open [`database/triggers.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/triggers.sql) and click **Execute (F5)**.
   - **Step 5**: Open [`database/seed.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/seed.sql) and click **Execute (F5)**.

---

### Option B: Automated Setup via Node.js Script (Fastest Method)

1. Create your `server/.env` file:
   Copy [`server/.env.example`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/server/.env.example) to `server/.env`:
   ```powershell
   cd server
   copy .env.example .env
   ```
2. Open `server/.env` in your editor and enter your local PostgreSQL password:
   ```env
   DB_HOST=localhost
   DB_PORT=2007
   DB_USER=postgres
   DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
   DB_NAME=hospital_management
   ```
3. Run the automated database initializer:
   ```powershell
   npm run seed
   ```
   *This automatically connects to PostgreSQL, creates `hospital_management` if it does not exist, and executes the schema, views, functions, triggers, and seed data.*

---

## 4. How to Start the System

### 1. Start the Backend API Server
Open a terminal in `server/`:
```powershell
cd server
npm start
```
*Backend will start on `http://localhost:5000`.*  
Health check endpoint: `http://localhost:5000/api/health`

### 2. Start the Frontend React Client
Open a second terminal in `client/`:
```powershell
cd client
npm run dev
```
*Frontend will launch at `http://localhost:5173`.*

---

## 5. Demo Login Accounts (For Examiner & Faculty)

Pre-hashed demo accounts are ready for testing in `seed.sql`:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Full system access, staff account creation, doctor management |
| **Doctor** | `dr.sarah` | `Doctor@123` | View appointments, write medical records & diagnostic plans, prescribe medicines |
| **Doctor** | `dr.robert` | `Doctor@123` | Neurology consultations, clinical documentation |
| **Receptionist** | `receptionist`| `Staff@123` | Patient registration, appointment booking, rescheduling, cashier billing & payments |

> **Pro Tip**: On the Login screen, click any of the **Demo Academic Credentials** buttons to instantly fill the credentials!

---

## 6. Demonstration Flow for College Presentation

When presenting to your DBMS project external examiner, follow this guided flow:

1. **Dashboard Overview**:
   - Log in as `admin`.
   - Show that all KPI stat cards (Patients, Doctors, Revenue, Balance) are populated from the real-time PostgreSQL view `v_dashboard_stats`.
2. **Register a Patient**:
   - Navigate to **Patients** &rarr; click **Register New Patient**.
   - Fill in patient details (Name, DOB, Blood Group, Phone, Address).
   - Show how the database generates a unique sequential patient code (`PAT-1011`).
3. **Book an Appointment with Timeslot Conflict Check**:
   - Go to **Book Appointment**.
   - Select a patient and department (e.g. Cardiology &rarr; Dr. Sarah Jenkins).
   - Select tomorrow's date.
   - Point out that booked slots are displayed with a strike-through.
   - Pick an open slot (e.g. `11:00 AM`).
   - Click **Confirm & Book Appointment**. Show that:
     - An appointment record is created in `appointments`.
     - An initial consultation invoice is automatically generated in `bills`!
4. **Demonstrate Double-Booking Prevention**:
   - Try booking the exact same doctor at the same time slot on that date.
   - Show that PostgreSQL rejects the insertion due to `CONSTRAINT uq_doctor_slot UNIQUE` and displays a clear conflict alert!
5. **Record Clinical Consultation & Prescriptions**:
   - Log in as `dr.sarah`.
   - Go to **Medical Records** &rarr; click **New Medical Record**.
   - Select the appointment, enter clinical diagnosis (e.g. "Essential Hypertension"), vital signs, and add 2 prescription medicines.
   - Submit. Show that the appointment status automatically transitions to **Completed**.
   - Click **Print Rx Slip** to show the hospital letterhead prescription.
6. **Billing & Overpayment Guardrail**:
   - Navigate to **Billing & Invoices**.
   - Open the invoice for the consultation.
   - Click **Items** &rarr; add an itemized test charge (e.g. "12-Lead ECG", ₹450).
   - Show that the database trigger automatically recalculates `total_amount` and `balance_amount`.
   - Click **Pay** to record a partial settlement.
   - Show that typing an amount greater than the balance is blocked by the overpayment rule.
   - Submit a valid partial payment via UPI.
   - Print the official hospital tax invoice receipt.
7. **SQL Analytics & CSV Reports**:
   - Go to **DBMS Reports**.
   - Demonstrate the different SQL analytical queries (Doctor Workloads, Department Revenue, Outstanding Balances).
   - Click **Export to CSV** to demonstrate real file download.

---

## 7. Running Automated Tests

To run the automated integration test suite:
```powershell
cd server
npm test
```
All 11 automated test cases (security, tokens, conflict algorithms, input validations, SQL injection resistance) will execute and output a 100% pass report.

---

## 8. Academic Project Documentation Links

- [Entity Relationship (ER) Diagram](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/ER_DIAGRAM.md)
- [Database Design & Data Dictionary](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/DATABASE_DESIGN.md)
- [Normalization Walkthrough (1NF, 2NF, 3NF)](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/NORMALIZATION.md)
- [REST API Documentation](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/API_DOCUMENTATION.md)
- [Testing & Quality Assurance Report](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/TESTING_REPORT.md)
- [Comprehensive College Project Report & Viva Q&A](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/docs/PROJECT_REPORT.md)
