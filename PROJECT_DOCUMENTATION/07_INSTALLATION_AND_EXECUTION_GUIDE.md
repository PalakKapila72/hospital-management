# Chapter 7: Installation & Execution Guide

## 1. System Prerequisites & Environment Verification

Before installing and launching the **Hospital Management System**, verify that your host computer meets the following prerequisites:

| Software Component | Minimum Version | Verified Local Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `v24.12.0` | JavaScript runtime executing Express backend and Vite build tooling. |
| **npm** | `>= 9.0.0` | `11.6.2` | Node package manager for installing project dependencies. |
| **PostgreSQL** | `>= 14.0` | `PostgreSQL 18.4` | Relational database server storing tables, triggers, and views. |
| **pgAdmin 4** | Optional GUI | Recommended | Graphical database query and administration interface. |
| **Git** | `>= 2.30.0` | `2.47.1` | Source code version control. |

> [!IMPORTANT]
> **Windows PostgreSQL Port Note**: In many local Windows installations (including this project's verified environment), PostgreSQL 18 is configured to listen on **Port `2007`** (Service `postgresql-x64-18`). If your local PostgreSQL instance uses the default port **`5432`**, adjust the `DB_PORT` setting in `server/.env` accordingly.

---

## 2. Directory Structure Setup

Ensure your local repository contains the root directory with `client`, `server`, and `database` subfolders:

```text
hospital-management/
├── client/                 # React 19 Frontend
├── server/                 # Express.js REST API Backend
├── database/               # PostgreSQL DDL & DML Scripts
├── docs/                   # Academic Reports
└── PROJECT_DOCUMENTATION/  # Complete 10-Chapter Documentation Suite
```

---

## 3. Environment Configuration (`.env`)

### Step 1: Configure Backend Environment
Navigate to the `server/` directory and create the `.env` file from the example template:

#### On Windows (PowerShell):
```powershell
cd server
Copy-Item .env.example .env
```

#### On Linux / macOS (Bash):
```bash
cd server
cp .env.example .env
```

### Step 2: Edit `server/.env`
Open `server/.env` in your text editor (VS Code, Notepad, etc.) and configure your local PostgreSQL credentials:

```env
# Server Port
PORT=5000
NODE_ENV=development

# Database Connection (PostgreSQL)
DB_HOST=localhost
DB_PORT=2007
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_POSTGRES_PASSWORD
DB_NAME=hospital_management

# JWT Authentication Configuration
JWT_SECRET=hospital_mgmt_jwt_secret_academic_key_2026_secure
JWT_EXPIRES_IN=24h

# Allowed Frontend Client Origin
CLIENT_URL=http://localhost:5173
```

> [!WARNING]
> Replace `YOUR_ACTUAL_POSTGRES_PASSWORD` with the master password you chose when installing PostgreSQL on your system. If `DB_PASSWORD` is empty, PostgreSQL will reject client authentication!

---

## 4. Database Setup & Initialization

You can set up the PostgreSQL database using either **Method A (Automated Node.js CLI Script)** or **Method B (pgAdmin 4 GUI)**.

---

### Method A: Automated CLI Initializer (Recommended — Fastest)

The backend provides an automated initialization script (`server/src/scripts/initDb.js`) that automatically connects to PostgreSQL, creates the database `hospital_management` if it does not exist, and executes the schema, views, functions, triggers, and seed data in the exact required dependency order.

1. Open a terminal in `server/`:
   ```powershell
   cd server
   npm install
   ```
2. Run the automated seed command:
   ```powershell
   npm run seed
   ```
3. **Expected Output**:
   ```text
   [INIT DB] Connecting to PostgreSQL on localhost:2007 as user postgres...
   [INIT DB] Database 'hospital_management' verified/created.
   [INIT DB] Executing schema.sql... SUCCESS (11 tables & indexes created).
   [INIT DB] Executing views.sql... SUCCESS (5 analytical views created).
   [INIT DB] Executing functions.sql... SUCCESS (3 stored procedures/functions created).
   [INIT DB] Executing triggers.sql... SUCCESS (4 trigger suites created).
   [INIT DB] Executing seed.sql... SUCCESS (Realistic synthetic hospital dataset loaded).
   [INIT DB] Database initialization completed successfully!
   ```

4. Verify database connectivity:
   ```powershell
   npm run test-db
   ```
   *Will report connection status, current database name, and timestamp.*

---

### Method B: Manual Setup via pgAdmin 4 (GUI Method)

If your college examiner asks you to show manual script execution in **pgAdmin 4**:

1. Open **pgAdmin 4** on your computer.
2. In the left browser tree, expand **Servers** and double-click your PostgreSQL server. Enter your master `postgres` password.
3. Right-click on **Databases** &rarr; select **Create** &rarr; **Database...**
   - **Database Name**: `hospital_management`
   - Click **Save**.
4. Right-click on `hospital_management` &rarr; select **Query Tool**.
5. Execute the database scripts in this **strict dependency order**:
   - **Step 1**: Open [`database/schema.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/schema.sql) in Query Tool and click **Execute (F5)**.
     *(Creates tables `departments`, `users`, `doctors`, `patients`, `appointments`, `medical_records`, `prescriptions`, `bills`, `bill_items`, `payments`, `audit_logs` and indexes).*
   - **Step 2**: Open [`database/views.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/views.sql) and click **Execute (F5)**.
     *(Creates 5 analytical views).*
   - **Step 3**: Open [`database/functions.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/functions.sql) and click **Execute (F5)**.
     *(Creates stored procedures `sp_book_appointment`, `sp_process_payment`, `fn_sync_bill_totals`).*
   - **Step 4**: Open [`database/triggers.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/triggers.sql) and click **Execute (F5)**.
     *(Creates automated triggers).*
   - **Step 5**: Open [`database/seed.sql`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/database/seed.sql) and click **Execute (F5)**.
     *(Loads sample doctors, departments, patients, appointments, and bills).*

---

## 5. Starting the Application

The system requires two active terminal windows: one for the backend server and one for the frontend client.

### Terminal 1: Launch Backend API Server
```powershell
cd server
npm start
```
- The backend will start on: **`http://localhost:5000`**
- Test the health check endpoint in your browser:
  **`http://localhost:5000/api/health`**
- Expected response:
  ```json
  {
    "status": "online",
    "timestamp": "2026-11-11T15:30:00.000Z",
    "service": "Hospital Management System API"
  }
  ```

*(Optional: Use `npm run dev` to run with Node's native file watcher for live reloading during development).*

---

### Terminal 2: Launch Frontend React Client
Open a second terminal window:
```powershell
cd client
npm install
npm run dev
```
- The frontend client will launch at: **`http://localhost:5173`**
- Open `http://localhost:5173` in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 6. Demo Academic Login Accounts

The system comes pre-loaded with realistic staff credentials for academic demonstration:

| User Role | Username | Password | Access Scope & Demonstration Focus |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` | Full administrative control, executive KPI dashboard, staff provisioning, doctor fees. |
| **Cardiologist (Doctor)** | `dr.sarah` | `Doctor@123` | Clinical consultations, authoring medical notes, vitals logging, issuing prescriptions. |
| **Neurologist (Doctor)** | `dr.robert`| `Doctor@123` | Neurology consultations, medical records documentation, prescriptions. |
| **Front Desk (Receptionist)**| `receptionist`| `Staff@123` | Patient registration, appointment scheduling, conflict demonstration, bill item additions, payments. |

> [!TIP]
> **One-Click Quick Login**: On the login screen (`http://localhost:5173`), click any of the **Demo Academic Credentials** buttons (`Admin`, `Dr. Sarah`, `Receptionist`) to auto-fill the credentials instantly without typing!

---

## 7. Troubleshooting & FAQ

### Issue 1: `DB_PASSWORD is not set or is empty in server/.env`
- **Cause**: The `server/.env` file was not created or the `DB_PASSWORD` variable was left blank.
- **Fix**: Open `server/.env` and ensure `DB_PASSWORD` contains your actual PostgreSQL master password. Save the file and restart the backend.

### Issue 2: `connect ECONNREFUSED 127.0.0.1:2007` or `5432`
- **Cause**: The PostgreSQL database service is stopped or is listening on a different port.
- **Fix on Windows**:
  1. Press `Win + R`, type `services.msc`, and press **Enter**.
  2. Locate `postgresql-x64-18` (or your version).
  3. Ensure the service status is **Running**. If stopped, right-click and click **Start**.
  4. In `server/.env`, verify whether your port is `2007` or `5432`.

### Issue 3: `password authentication failed for user "postgres"`
- **Cause**: The password entered in `server/.env` does not match the password stored in PostgreSQL.
- **Fix**: Open pgAdmin 4. If you cannot connect with your password, reset the PostgreSQL password via the `psql` command line tool or reinstall the service with a known password.

### Issue 4: `Port 5000 is already in use`
- **Cause**: Another node process or application is occupying port 5000.
- **Fix on Windows PowerShell**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  ```
- Alternatively, modify `PORT=5001` in `server/.env` and update `VITE_API_URL` in `client/` accordingly.

### Issue 5: CORS Error (`Cross-Origin Request Blocked`)
- **Cause**: The client is attempting to access the backend from an origin not listed in `CLIENT_URL`.
- **Fix**: Ensure `CLIENT_URL=http://localhost:5173` is present in `server/.env`.

