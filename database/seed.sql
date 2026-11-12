-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM — SEED DATA SCRIPT (PostgreSQL)
-- Realistic Synthetic Dataset for Academic Demonstration and Testing
-- ============================================================================

-- Clean up any existing data in reverse order
TRUNCATE TABLE audit_logs, payments, bill_items, bills, prescriptions, 
               medical_records, appointments, patients, doctors, users, departments RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 1. DEPARTMENTS (6 Departments)
-- ----------------------------------------------------------------------------
INSERT INTO departments (department_name, description, head_of_department, location) VALUES
('Cardiology', 'Heart health, cardiac diagnostics, angiography and vascular care', 'Dr. Sarah Jenkins, MD, DM', 'Block A, 3rd Floor'),
('Neurology', 'Disorders of the nervous system, brain imaging, and stroke treatment', 'Dr. Robert Chen, MD, DM', 'Block B, 2nd Floor'),
('Orthopedics', 'Musculoskeletal system, joint replacements, trauma and spine care', 'Dr. Marcus Vance, MS (Ortho)', 'Block C, Ground Floor'),
('Pediatrics', 'Comprehensive neonatal, infant, and child healthcare services', 'Dr. Priya Sharma, MD (Pediatrics)', 'Block A, 1st Floor'),
('General Medicine', 'Primary adult healthcare, preventive wellness, and infectious diseases', 'Dr. David Wilson, MD (Internal Med)', 'Block B, Ground Floor'),
('Dermatology', 'Skin, hair, nail disorders, and aesthetic clinical treatments', 'Dr. Elena Rostova, MD (Dermatology)', 'Block C, 1st Floor');

-- ----------------------------------------------------------------------------
-- 2. USERS (Demo Admin, Doctors, Receptionist)
-- Passwords:
-- admin: Admin@123
-- dr.sarah, dr.robert: Doctor@123
-- receptionist: Staff@123
-- ----------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@hospital.local', '$2b$10$QLcQ0khumLl42S9xDcngJ.bipUu9/d7oeI6RMjObErhxIlFAGbGNm', 'System Administrator', 'Admin', TRUE),
('dr.sarah', 'sarah.jenkins@hospital.local', '$2b$10$F.aaf6VLv/rnYA9.nTwhwugcpak8wxELZ91GRCPrqaJX0MRiihvbS', 'Dr. Sarah Jenkins', 'Doctor', TRUE),
('dr.robert', 'robert.chen@hospital.local', '$2b$10$F.aaf6VLv/rnYA9.nTwhwugcpak8wxELZ91GRCPrqaJX0MRiihvbS', 'Dr. Robert Chen', 'Doctor', TRUE),
('receptionist', 'frontdesk@hospital.local', '$2b$10$UVqbzecH20dFYe1Ul4RFt.IpgnUnHrALhau/kZ9Uz5aS5N0rHSuYW', 'Emily Davis', 'Receptionist', TRUE);

-- ----------------------------------------------------------------------------
-- 3. DOCTORS (6 Doctors)
-- ----------------------------------------------------------------------------
INSERT INTO doctors (user_id, department_id, full_name, specialization, qualification, phone, email, consultation_fee, available_days, available_time_start, available_time_end) VALUES
(2, 1, 'Dr. Sarah Jenkins', 'Interventional Cardiology', 'MBBS, MD, DM (Cardiology)', '+91-9876543201', 'sarah.jenkins@hospital.local', 800.00, 'Mon,Tue,Wed,Thu,Fri', '09:00:00', '16:00:00'),
(3, 2, 'Dr. Robert Chen', 'Neurovascular Specialist', 'MBBS, MD (Med), DM (Neurology)', '+91-9876543202', 'robert.chen@hospital.local', 900.00, 'Mon,Wed,Fri', '10:00:00', '17:00:00'),
(NULL, 3, 'Dr. Marcus Vance', 'Joint Replacement & Arthroscopy', 'MBBS, MS (Ortho), M.Ch', '+91-9876543203', 'marcus.vance@hospital.local', 750.00, 'Tue,Thu,Sat', '09:30:00', '15:30:00'),
(NULL, 4, 'Dr. Priya Sharma', 'Pediatric Intensive Care', 'MBBS, MD (Pediatrics), DCH', '+91-9876543204', 'priya.sharma@hospital.local', 600.00, 'Mon,Tue,Wed,Thu,Fri', '10:00:00', '18:00:00'),
(NULL, 5, 'Dr. David Wilson', 'Internal Medicine & Diabetology', 'MBBS, MD (Internal Medicine)', '+91-9876543205', 'david.wilson@hospital.local', 500.00, 'Mon,Tue,Wed,Thu,Fri,Sat', '08:30:00', '14:30:00'),
(NULL, 6, 'Dr. Elena Rostova', 'Clinical & Aesthetic Dermatology', 'MBBS, DVD, MD (Dermatology)', '+91-9876543206', 'elena.rostova@hospital.local', 700.00, 'Mon,Wed,Fri,Sat', '11:00:00', '17:00:00');

-- ----------------------------------------------------------------------------
-- 4. PATIENTS (10 Patients)
-- ----------------------------------------------------------------------------
INSERT INTO patients (patient_code, full_name, date_of_birth, gender, blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone) VALUES
('PAT-1001', 'Aarav Patel', '1988-04-15', 'Male', 'O+', '+91-9820123456', 'aarav.patel@example.com', '42 MG Road, Indiranagar, Bengaluru', 'Meera Patel (Spouse)', '+91-9820123457'),
('PAT-1002', 'Ananya Iyer', '1995-09-22', 'Female', 'B+', '+91-9830234567', 'ananya.iyer@example.com', '12 Lake View Road, Koramangala, Bengaluru', 'Suresh Iyer (Father)', '+91-9830234568'),
('PAT-1003', 'Rohan Verma', '1976-11-05', 'Male', 'A+', '+91-9840345678', 'rohan.verma@example.com', '88 Brigade Meadows, Kanakapura Road, Bengaluru', 'Pooja Verma (Wife)', '+91-9840345679'),
('PAT-1004', 'Deepika Nair', '2001-02-18', 'Female', 'AB+', '+91-9850456789', 'deepika.nair@example.com', '15 Palm Grove, Whitefield, Bengaluru', 'Ramesh Nair (Father)', '+91-9850456780'),
('PAT-1005', 'Vikram Malhotra', '1965-07-30', 'Male', 'O-', '+91-9860567890', 'vikram.m@example.com', '104 Richmond Towers, Richmond Town, Bengaluru', 'Sunita Malhotra (Wife)', '+91-9860567891'),
('PAT-1006', 'Kavita Deshmukh', '1992-12-10', 'Female', 'A-', '+91-9870678901', 'kavita.d@example.com', '23 HSR Layout, Sector 2, Bengaluru', 'Ajay Deshmukh (Brother)', '+91-9870678902'),
('PAT-1007', 'Mohammed Zaid', '1984-03-25', 'Male', 'B-', '+91-9880789012', 'zaid.m@example.com', '56 Frazer Town, Mosque Road, Bengaluru', 'Fatima Zaid (Sister)', '+91-9880789013'),
('PAT-1008', 'Sneha Kulkarni', '2016-08-14', 'Female', 'O+', '+91-9890890123', 'kulkarni.family@example.com', '77 Jayanagar 4th Block, Bengaluru', 'Nitin Kulkarni (Father)', '+91-9890890124'),
('PAT-1009', 'Rajesh Gupta', '1958-05-19', 'Male', 'AB-', '+91-9900901234', 'rajesh.gupta@example.com', '301 Malleshwaram 15th Cross, Bengaluru', 'Shanti Gupta (Wife)', '+91-9900901235'),
('PAT-1010', 'Pooja Hegde', '1998-10-08', 'Female', 'A+', '+91-9911012345', 'pooja.hegde@example.com', '64 Basavanagudi Bull Temple Road, Bengaluru', 'Vinay Hegde (Brother)', '+91-9911012346');

-- ----------------------------------------------------------------------------
-- 5. APPOINTMENTS (12 Appointments)
-- ----------------------------------------------------------------------------
INSERT INTO appointments (appointment_code, patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status, created_by) VALUES
('APT-20261015-001', 1, 1, '2026-10-15', '09:30:00', 'Chest discomfort and shortness of breath during exertion', 'Completed', 4),
('APT-20261016-002', 2, 2, '2026-10-16', '10:30:00', 'Recurrent migraine headaches with visual aura', 'Completed', 4),
('APT-20261017-003', 3, 3, '2026-10-17', '11:00:00', 'Chronic right knee pain and stiffness when climbing stairs', 'Completed', 4),
('APT-20261018-004', 8, 4, '2026-10-18', '11:30:00', 'Persistent dry cough, mild fever, and poor appetite', 'Completed', 4),
('APT-20261019-005', 5, 5, '2026-10-19', '09:00:00', 'Routine diabetic checkup and HbA1c review', 'Completed', 4),
('APT-20261020-006', 6, 6, '2026-10-20', '11:30:00', 'Severe eczema flare-up on forearms and hands', 'Completed', 4),
('APT-20261021-007', 7, 1, CURRENT_DATE, '10:00:00', 'Hypertension follow-up and blood pressure management', 'Scheduled', 4),
('APT-20261021-008', 4, 5, CURRENT_DATE, '11:00:00', 'Seasonal viral fever, body aches, and fatigue', 'Scheduled', 4),
('APT-20261022-009', 9, 2, CURRENT_DATE + 1, '14:00:00', 'Tingling sensation in fingertips and mild dizziness', 'Scheduled', 4),
('APT-20261022-010', 10, 3, CURRENT_DATE + 1, '14:30:00', 'Lower back strain following gym workout', 'Scheduled', 4),
('APT-20261014-011', 3, 5, '2026-10-14', '12:00:00', 'General wellness screening', 'Cancelled', 4),
('APT-20261013-012', 4, 6, '2026-10-13', '15:00:00', 'Skin allergy consultation', 'No-Show', 4);

-- ----------------------------------------------------------------------------
-- 6. MEDICAL RECORDS (6 Records linked to Completed Appointments)
-- ----------------------------------------------------------------------------
INSERT INTO medical_records (record_code, appointment_id, patient_id, doctor_id, diagnosis, symptoms, treatment_plan, clinical_notes, vital_signs, follow_up_date) VALUES
('REC-20261015-001', 1, 1, 1, 'Mild Angina Pectoris / Essential Hypertension', 'Chest tightness, elevated BP', 'Prescribed Beta-blockers, Low-sodium diet, 30 min daily walking', 'ECG showed slight ST changes. Echo recommended next month.', '{"bp": "142/92", "pulse": 82, "temperature": "98.4 F", "weight_kg": 78}'::jsonb, '2026-11-15'),
('REC-20261016-002', 2, 2, 2, 'Migraine without Aura, Tension-Type Component', 'Throbbing unilateral headache, photophobia', 'Acute triptan therapy, lifestyle stress reduction, sleep hygiene', 'Neurological examination normal. MRI brain unremarkable.', '{"bp": "118/76", "pulse": 68, "temperature": "98.6 F", "weight_kg": 54}'::jsonb, '2026-11-20'),
('REC-20261017-003', 3, 3, 3, 'Grade II Osteoarthritis Right Knee Joint', 'Joint tenderness, crepitus on flexion', 'Topical analgesics, Glucosamine supplement, physical therapy', 'X-ray reveals mild joint space narrowing. Avoid squatting.', '{"bp": "126/82", "pulse": 74, "temperature": "98.2 F", "weight_kg": 84}'::jsonb, '2026-12-01'),
('REC-20261018-004', 4, 8, 4, 'Acute Bronchitis (Pediatric)', 'Wheezing, nocturnal cough, low fever', 'Bronchodilator inhaler, hydration, warm saline gargles', 'Chest auscultation reveals bilateral rhonchi. No respiratory distress.', '{"bp": "100/65", "pulse": 96, "temperature": "100.2 F", "weight_kg": 22}'::jsonb, '2026-10-28'),
('REC-20261019-005', 5, 5, 5, 'Type 2 Diabetes Mellitus — Fair Control', 'Polyuria, mild lethargy, fasting glucose 148', 'Continue Metformin, add DPP4 inhibitor, diet counseling', 'HbA1c is 7.4%. Renal panel is within acceptable limits.', '{"bp": "130/84", "pulse": 72, "temperature": "98.4 F", "weight_kg": 72}'::jsonb, '2026-11-19'),
('REC-20261020-006', 6, 6, 6, 'Atopic Dermatitis (Subacute Exacerbation)', 'Pruritic erythematous plaques on bilateral flexural areas', 'Topical corticosteroid ointment, gentle emollients, antihistamines', 'Advised to avoid perfumed soaps and synthetic fabrics.', '{"bp": "120/80", "pulse": 70, "temperature": "98.6 F", "weight_kg": 58}'::jsonb, '2026-11-05');

-- ----------------------------------------------------------------------------
-- 7. PRESCRIPTIONS (14 Prescriptions)
-- ----------------------------------------------------------------------------
INSERT INTO prescriptions (record_id, medicine_name, dosage, frequency, duration, instructions) VALUES
(1, 'Atenolol Tablets IP', '50 mg', 'Once daily in the morning', '30 days', 'Take before breakfast with water'),
(1, 'Aspirin Gastro-resistant', '75 mg', 'Once daily after dinner', '30 days', 'Do not crush or chew tablets'),
(1, 'Atorvastatin Calcium', '20 mg', 'Once daily at bedtime', '30 days', 'Helps regulate cholesterol levels'),
(2, 'Sumatriptan Succinate', '50 mg', 'At onset of acute headache', 'As needed', 'Maximum 2 tablets in 24 hours'),
(2, 'Propranolol Hydrochloride', '40 mg', 'Twice daily', '30 days', 'Preventive migraine prophylaxis'),
(3, 'Paracetamol Extended Release', '650 mg', 'Twice daily after meals', '10 days', 'Take only when experiencing pain'),
(3, 'Glucosamine Sulfate', '500 mg', 'Once daily', '60 days', 'Joint cartilage nourishment'),
(4, 'Amoxicillin + Clavulanate Syrup', '228 mg/5ml', '5 ml twice daily', '5 days', 'Shake bottle well before administering'),
(4, 'Levosalbutamol Inhaler', '50 mcg', '2 puffs as needed', '7 days', 'Use with pediatric spacer mask'),
(5, 'Metformin Hydrochloride (SR)', '1000 mg', 'Twice daily after meals', '60 days', 'Take with breakfast and dinner'),
(5, 'Vildagliptin Tablets', '50 mg', 'Once daily with breakfast', '60 days', 'Blood glucose monitoring required'),
(6, 'Mometasone Furoate 0.1% Cream', 'Thin layer', 'Twice daily topically', '14 days', 'Apply to affected skin areas only'),
(6, 'Cetirizine Hydrochloride', '10 mg', 'Once daily at bedtime', '10 days', 'Relieves itching and allergic response'),
(6, 'Liquid Paraffin + White Soft Paraffin', 'Generous application', 'Thrice daily', '30 days', 'Skin barrier hydration');

-- ----------------------------------------------------------------------------
-- 8. BILLS (Invoices for Appointments)
-- ----------------------------------------------------------------------------
INSERT INTO bills (bill_number, appointment_id, patient_id, consultation_fee, additional_charges, discount_amount, tax_amount, total_amount, paid_amount, balance_amount, payment_status, bill_date, due_date, notes) VALUES
('INV-20261015-0001', 1, 1, 800.00, 1200.00, 100.00, 95.00, 1995.00, 1995.00, 0.00, 'Paid', '2026-10-15', '2026-10-22', 'Full payment settled via Card'),
('INV-20261016-0002', 2, 2, 900.00, 0.00, 0.00, 0.00, 900.00, 900.00, 0.00, 'Paid', '2026-10-16', '2026-10-23', 'Settled via UPI'),
('INV-20261017-0003', 3, 3, 750.00, 850.00, 50.00, 77.50, 1627.50, 1000.00, 627.50, 'Partially Paid', '2026-10-17', '2026-10-24', 'Partial cash paid; balance due next visit'),
('INV-20261018-0004', 4, 8, 600.00, 400.00, 0.00, 50.00, 1050.00, 1050.00, 0.00, 'Paid', '2026-10-18', '2026-10-25', 'Full settlement via Cash'),
('INV-20261019-0005', 5, 5, 500.00, 950.00, 50.00, 70.00, 1470.00, 1470.00, 0.00, 'Paid', '2026-10-19', '2026-10-26', 'Full payment settled via Online NetBanking'),
('INV-20261020-0006', 6, 6, 700.00, 300.00, 0.00, 50.00, 1050.00, 500.00, 550.00, 'Partially Paid', '2026-10-20', '2026-10-27', 'Advance paid via UPI'),
('INV-20261021-0007', 7, 7, 800.00, 0.00, 0.00, 0.00, 800.00, 0.00, 800.00, 'Unpaid', CURRENT_DATE, CURRENT_DATE + 7, 'Scheduled appointment consultation fee'),
('INV-20261021-0008', 8, 4, 500.00, 0.00, 0.00, 0.00, 500.00, 0.00, 500.00, 'Unpaid', CURRENT_DATE, CURRENT_DATE + 7, 'Scheduled appointment consultation fee'),
('INV-20261022-0009', 9, 9, 900.00, 0.00, 0.00, 0.00, 900.00, 0.00, 900.00, 'Unpaid', CURRENT_DATE + 1, CURRENT_DATE + 8, 'Upcoming consultation fee'),
('INV-20261022-0010', 10, 10, 750.00, 0.00, 0.00, 0.00, 750.00, 0.00, 750.00, 'Unpaid', CURRENT_DATE + 1, CURRENT_DATE + 8, 'Upcoming consultation fee');

-- ----------------------------------------------------------------------------
-- 9. BILL ITEMS (Itemized Charges)
-- ----------------------------------------------------------------------------
INSERT INTO bill_items (bill_id, description, unit_price, quantity, total_price) VALUES
(1, '12-Lead Electrocardiogram (ECG)', 450.00, 1, 450.00),
(1, 'Lipid Profile & Serum Electrolytes', 750.00, 1, 750.00),
(3, 'Digital X-Ray Right Knee AP & Lateral', 850.00, 1, 850.00),
(4, 'Pediatric Nebulization Session', 400.00, 1, 400.00),
(5, 'Glycated Hemoglobin (HbA1c) Test', 550.00, 1, 550.00),
(5, 'Comprehensive Renal Function Panel', 400.00, 1, 400.00),
(6, 'Skin Patch Allergy Sensitivity Screen', 300.00, 1, 300.00);

-- ----------------------------------------------------------------------------
-- 10. PAYMENTS (Transactions Ledger)
-- ----------------------------------------------------------------------------
INSERT INTO payments (payment_reference, bill_id, amount, payment_method, transaction_reference, payment_date, notes, recorded_by) VALUES
('PAY-20261015-1001', 1, 1995.00, 'Card', 'TXN-HDFC-993812', '2026-10-15 10:15:00', 'POS Terminal Slip #4412', 4),
('PAY-20261016-1002', 2, 900.00, 'UPI', 'UPI-GPAY-983210459', '2026-10-16 11:20:00', 'UPI Ref: 42918821034', 4),
('PAY-20261017-1003', 3, 1000.00, 'Cash', 'RCPT-CSH-0081', '2026-10-17 11:45:00', 'Cash counter advance', 4),
('PAY-20261018-1004', 4, 1050.00, 'Cash', 'RCPT-CSH-0094', '2026-10-18 12:10:00', 'Exact cash payment received', 4),
('PAY-20261019-1005', 5, 1470.00, 'Online', 'NETB-SBIN-8823190', '2026-10-19 10:00:00', 'NetBanking portal payment', 4),
('PAY-20261020-1006', 6, 500.00, 'UPI', 'UPI-PAYTM-77123984', '2026-10-20 12:30:00', 'Part payment via Paytm UPI', 4);

-- ----------------------------------------------------------------------------
-- 11. AUDIT LOGS (Initial System State)
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (table_name, action_type, record_id, changed_by, new_data) VALUES
('system', 'INSERT', 1, 'admin', '{"event": "System initialized and synthetic seed data imported successfully"}'::jsonb),
('appointments', 'UPDATE', 1, 'receptionist', '{"status": "Completed", "note": "Consultation successfully completed with Dr. Sarah Jenkins"}'::jsonb),
('payments', 'INSERT', 1, 'receptionist', '{"amount": 1995.00, "payment_method": "Card", "payment_reference": "PAY-20261015-1001"}'::jsonb);
