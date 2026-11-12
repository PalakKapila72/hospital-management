# Hospital Management System — RESTful API Documentation

## 1. Overview
The Hospital Management System backend exposes RESTful API endpoints organized into logical resource groups. All endpoints consume and produce `application/json` (except report CSV downloads which return `text/csv`).

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT_TOKEN>`)
- **Default Format**: Standardized JSON responses:
  ```json
  {
    "success": true,
    "message": "Descriptive status message",
    "data": []
  }
  ```

---

## 2. API Endpoints Catalog

### Authentication & Staff Management (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates staff credentials (Admin, Doctor, Receptionist) and returns JWT |
| `GET` | `/auth/me` | Authenticated | Fetches profile of currently logged-in user |
| `PUT` | `/auth/profile` | Authenticated | Updates legal name and email address |
| `PUT` | `/auth/change-password` | Authenticated | Modifies account password with old password verification |
| `GET` | `/auth/users` | Admin Only | Lists all registered staff accounts |
| `POST` | `/auth/users` | Admin Only | Provisions a new staff account |

#### Sample Request: `POST /api/auth/login`
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
#### Sample Response: `200 OK`
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "username": "admin",
    "email": "admin@hospital.local",
    "full_name": "System Administrator",
    "role": "Admin",
    "doctor_id": null
  }
}
```

---

### Dashboard Metrics (`/api/dashboard`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/stats` | Authenticated | Live metrics from `v_dashboard_stats`, recent appointments, department workloads |

#### Sample Response: `200 OK`
```json
{
  "success": true,
  "stats": {
    "total_patients": "10",
    "total_doctors": "6",
    "total_departments": "6",
    "today_appointments": "2",
    "completed_appointments": "6",
    "cancelled_appointments": "1",
    "total_revenue": "6915.00",
    "pending_balance": "4727.50"
  },
  "recentAppointments": [],
  "departmentStats": []
}
```

---

### Patient Management (`/api/patients`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/patients` | Authenticated | Query patient directory with search, gender, blood group, & pagination |
| `GET` | `/patients/:id` | Authenticated | Single patient profile, consultation history, & billing balance |
| `POST` | `/patients` | Admin, Receptionist | Registers a new patient with auto-generated `PAT-XXXX` code |
| `PUT` | `/patients/:id` | Admin, Receptionist | Updates patient demographic and emergency contact info |
| `DELETE` | `/patients/:id` | Admin Only | Safely deactivates patient record |

#### Sample Request: `POST /api/patients`
```json
{
  "full_name": "Suresh Raina",
  "date_of_birth": "1986-11-27",
  "gender": "Male",
  "blood_group": "O+",
  "phone": "+91-9876541234",
  "email": "suresh.raina@example.com",
  "address": "45 Cricket Colony, Bengaluru",
  "emergency_contact_name": "Priyanka Raina",
  "emergency_contact_phone": "+91-9876541235"
}
```

---

### Doctors & Departments (`/api/doctors`, `/api/departments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/doctors` | Authenticated | List all active doctors with department info & search |
| `GET` | `/doctors/:id` | Authenticated | Detailed doctor profile & upcoming consultations |
| `GET` | `/doctors/:id/schedule?date=YYYY-MM-DD` | Authenticated | Live booked slots on a specific date |
| `POST` | `/doctors` | Admin Only | Adds a new specialist to clinical staff |
| `PUT` | `/doctors/:id` | Admin Only | Updates doctor fee, working days, & schedule |
| `PATCH`| `/doctors/:id/toggle-status` | Admin Only | Toggles doctor active/inactive status |
| `GET` | `/departments` | Authenticated | Lists clinical divisions and doctor counts |
| `POST` | `/departments` | Admin Only | Creates a new hospital department |

---

### Appointments (`/api/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/appointments` | Authenticated | Filter appointments by doctor, patient, date, & status |
| `GET` | `/appointments/:id` | Authenticated | Detailed appointment with patient & doctor info |
| `POST` | `/appointments` | Admin, Receptionist, Doctor | Books appointment, enforces conflict check, generates draft bill |
| `PATCH`| `/appointments/:id/status` | Authenticated | Updates status (`Scheduled`, `Completed`, `Cancelled`, `No-Show`) |
| `PATCH`| `/appointments/:id/reschedule` | Admin, Receptionist | Reschedules appointment with timeslot conflict check |

#### Conflict Error Response: `409 Conflict`
```json
{
  "success": false,
  "message": "Conflict: Dr. Sarah Jenkins is already booked at 10:00:00 on 2026-10-25. Please pick an available time.",
  "error_code": "APPOINTMENT_CONFLICT"
}
```

---

### Medical Records & Prescriptions (`/api/medical-records`, `/api/prescriptions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/medical-records` | Authenticated | Lists clinical consultation records with pagination |
| `GET` | `/medical-records/:id`| Authenticated | Retrieves complete diagnosis, notes, vitals JSON, and prescriptions |
| `POST` | `/medical-records` | Admin, Doctor | Creates clinical diagnosis, auto-marks appointment Completed, saves Rx items |
| `GET` | `/prescriptions` | Authenticated | Lists pharmacy prescriptions with search |
| `GET` | `/prescriptions/print/:recordId` | Authenticated | Returns hospital prescription letterhead payload for printing |

---

### Billing & Payments (`/api/bills`, `/api/payments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/bills` | Authenticated | Lists invoices with status filters (`Unpaid`, `Partially Paid`, `Paid`) |
| `GET` | `/bills/:id` | Authenticated | Detailed bill with line items and payment transactions |
| `POST` | `/bills/:id/items` | Admin, Receptionist | Adds itemized service charge; auto-syncs bill total |
| `DELETE`| `/bills/:id/items/:itemId` | Admin Only | Deletes item; recalculates totals |
| `GET` | `/payments` | Authenticated | Transaction ledger with payment method breakdown |
| `POST` | `/payments` | Admin, Receptionist | Concurrency-safe payment processing (`SELECT ... FOR UPDATE`, checks overpayment) |

#### Sample Request: `POST /api/payments`
```json
{
  "bill_id": 3,
  "amount": 627.50,
  "payment_method": "UPI",
  "transaction_reference": "UPI-GPAY-983210459",
  "notes": "Full balance clearance"
}
```

---

### Reports & CSV Export (`/api/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/patient-registrations` | Authenticated | Patient registrations report (supports `?format=csv` & date filter) |
| `GET` | `/reports/doctor-appointments` | Authenticated | Doctor workloads report (supports `?format=csv`) |
| `GET` | `/reports/department-summary` | Authenticated | Department doctor counts and revenue report (supports `?format=csv`) |
| `GET` | `/reports/revenue` | Authenticated | Revenue collections report (supports `?format=csv` & date filter) |
| `GET` | `/reports/outstanding-bills` | Authenticated | Outstanding bills report (supports `?format=csv`) |
| `GET` | `/reports/appointment-status` | Authenticated | Status percentage breakdown |
