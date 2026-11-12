# Database Normalization Analysis (1NF, 2NF, 3NF)

## 1. Introduction to Normalization
Database normalization is a systematic technique of organizing relational database schemas to reduce data redundancy, eliminate update anomalies (insertion, deletion, modification anomalies), and preserve data integrity through functional dependencies.

In this project, the **Hospital Management System** schema is designed to achieve **Third Normal Form (3NF)**.

---

## 2. First Normal Form (1NF)

### Definition
A relation $R$ is in First Normal Form (1NF) if and only if:
1. Every attribute value is **atomic** (indivisible).
2. There are no repeating groups or arrays stored as comma-separated values.
3. Each row is uniquely identifiable by a Primary Key.

### Application in Our Schema
- **Anti-pattern Avoided (Unnormalized Form)**: Storing multiple prescribed medicines as a comma-separated string in a single consultation table (`medicines: "Aspirin 75mg, Metformin 500mg, Paracetamol 650mg"`).
- **1NF Resolution**: Prescriptions are separated into an independent entity table (`prescriptions`) where each row represents a single atomic prescription with atomic columns (`medicine_name`, `dosage`, `frequency`, `duration`, `instructions`).
- **Bill Items Decomposition**: Rather than storing multiple hospital services in an invoice string, each bill charge is broken down atomically into the `bill_items` table with individual `unit_price`, `quantity`, and `total_price`.

---

## 3. Second Normal Form (2NF)

### Definition
A relation $R$ is in Second Normal Form (2NF) if and only if:
1. It is already in **1NF**.
2. There is **no partial functional dependency** on any candidate key; that is, every non-prime attribute is fully functionally dependent on the whole candidate key (not on a proper subset of a composite candidate key).

### Application in Our Schema
Consider the composite appointment-timeslot constraint:
- Composite candidate key in `appointments`: `(doctor_id, appointment_date, appointment_time)`.
- If we stored doctor details (such as `doctor_name`, `specialization`, `consultation_fee`, `department_name`) inside the `appointments` table:
  $$\text{doctor\_id} \rightarrow \text{doctor\_name}, \text{specialization}$$
  This would be a **partial dependency** because `doctor_name` depends only on `doctor_id`, not on `(doctor_id, appointment_date, appointment_time)`.
- **2NF Resolution**:
  Doctor attributes are extracted into the distinct relation `doctors(doctor_id, full_name, specialization, consultation_fee, ...)`. The `appointments` table only stores the foreign key `doctor_id`.
  $$\text{appointments}(\underline{\text{appointment\_id}}, \text{patient\_id}, \text{doctor\_id}, \text{appointment\_date}, \text{appointment\_time}, \dots)$$
  All appointment attributes (`status`, `reason_for_visit`) depend strictly on the complete primary key `appointment_id`.

---

## 4. Third Normal Form (3NF)

### Definition
A relation $R$ is in Third Normal Form (3NF) if and only if:
1. It is in **2NF**.
2. There is **no transitive dependency** for non-prime attributes; that is, for every non-trivial functional dependency $X \rightarrow Y$:
   - Either $X$ is a superkey, or
   - $Y$ is a prime attribute (part of a candidate key).
In simple terms: *Every non-key attribute must depend on the key, the whole key, and nothing but the key.*

### Application in Our Schema
#### Example 1: Doctor and Department Transitive Dependency
- Suppose `doctors` table had:
  $$\text{doctor\_id} \rightarrow \text{department\_id} \rightarrow \text{department\_name}, \text{head\_of\_department}, \text{location}$$
  Here, `head_of_department` depends on `department_id`, which in turn depends on `doctor_id`.
  This is a **transitive dependency**:
  $$\text{doctor\_id} \rightarrow \text{head\_of\_department}$$
  *Anomaly if unnormalized*: If all doctors in Cardiology are deleted, information regarding Cardiology's location and Head of Department would be lost (Deletion Anomaly). To change a department's location, multiple doctor records would have to be modified (Update Anomaly).
- **3NF Resolution**:
  Created a separate `departments` table with primary key `department_id`:
  $$\text{departments}(\underline{\text{department\_id}}, \text{department\_name}, \text{head\_of\_department}, \text{location})$$
  $$\text{doctors}(\underline{\text{doctor\_id}}, \text{department\_id}, \text{full\_name}, \text{specialization}, \dots)$$

#### Example 2: Invoice Totals and Payment Settlement
- In `bills` and `payments`, individual payment transactions are decoupled into `payments(payment_id, bill_id, amount, payment_method, ...)`.
- Rather than duplicating patient addresses or doctor fee schedules inside `bills`, `bills` references `appointment_id` and `patient_id`.
- Consistency constraints (`balance_amount = total_amount - paid_amount`) are guaranteed through relational checks and stored database functions/triggers, preventing transient calculation mismatches.

---

## 5. Summary Table of Normal Forms

| Table | 1NF Check | 2NF Check | 3NF Check |
| :--- | :--- | :--- | :--- |
| `departments` | Atomic attributes (strings, booleans) | Single attribute PK `department_id` | No transitive dependencies |
| `users` | Single credentials per row | Single attribute PK `user_id` | Role and hash depend only on `user_id` |
| `doctors` | Atomic schedules, phone, fee | Single attribute PK `doctor_id` | Department attributes moved to `departments` |
| `patients` | Atomic names, contact, DOB | Single attribute PK `patient_id` | Emergency contacts depend solely on patient |
| `appointments` | Single timeslot per record | Single attribute PK `appointment_id` | Doctor/patient details referenced via FK |
| `medical_records` | Atomic diagnosis, structured JSONB vitals | Single attribute PK `record_id` | Prescriptions extracted to separate table |
| `prescriptions` | One medication line item per row | Single attribute PK `prescription_id` | Medication dosage depends on `prescription_id` |
| `bills` | Atomic consultation, charges, balance | Single attribute PK `bill_id` | Items extracted to `bill_items` |
| `bill_items` | Atomic charge and unit price | Single attribute PK `item_id` | Service description depends on `item_id` |
| `payments` | Atomic financial transaction | Single attribute PK `payment_id` | Invoice details referenced via `bill_id` |
