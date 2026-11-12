# Apex Hospital Management System — Comprehensive Technical & DBMS Documentation

> **Academic Project Reference**: Bachelor of Engineering (B.E.) in Computer Science & Engineering  
> **Course**: Database Management Systems (DBMS) Laboratory & Course Project  
> **Technology Stack**: React.js 19 (Vite), Node.js (v24), Express.js (4.21), PostgreSQL (14+ / 18.4)  
> **Architecture**: Three-Tier, Model-View-Controller (MVC) Pattern, Third Normal Form (3NF)  

---

## Welcome to the Project Documentation Suite

This documentation repository serves as the definitive reference manual for the **Hospital Management System**. It has been compiled specifically from the active source code to provide an end-to-end conceptual, architectural, and practical understanding of the software.

Whether you are a student preparing for your university viva voce examination, a team member studying the codebase, or an academic evaluator inspecting the relational database schema, this documentation set covers every dimension of the project without omitting technical details.

---

## Documentation Structure & Navigation Map

The documentation is organized into 10 structured, modular Markdown handbooks. Click on any link below to explore the respective chapter:

| File | Document Title | Primary Focus & Coverage |
| :--- | :--- | :--- |
| [**`01_PROJECT_OVERVIEW.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/01_PROJECT_OVERVIEW.md) | **Project Overview & Tech Stack** | Introduction, Problem Statement, Academic Objectives, Core Functional Modules (Admin, Doctor, Receptionist), and Detailed Technology Stack. |
| [**`02_SYSTEM_ARCHITECTURE.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/02_SYSTEM_ARCHITECTURE.md) | **System Architecture & Data Flow** | Three-tier architecture, Mermaid system diagrams, client-server communication lifecycle, security boundaries, and concurrency architecture. |
| [**`03_DATABASE_SCHEMA_DICTIONARY.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/03_DATABASE_SCHEMA_DICTIONARY.md) | **Database Schema & Data Dictionary** | Comprehensive breakdown of all 11 relational tables, column data types, constraints, default values, primary keys, and foreign key actions. |
| [**`04_ER_DIAGRAM_AND_NORMALIZATION.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/04_ER_DIAGRAM_AND_NORMALIZATION.md) | **ER Diagram & Normalization (1NF–3NF)** | Mermaid Entity-Relationship (ER) diagram, cardinality mappings, functional dependencies, and step-by-step proofs of 1NF, 2NF, and 3NF. |
| [**`05_SQL_QUERIES_VIEWS_PROCEDURES_TRIGGERS.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/05_SQL_QUERIES_VIEWS_PROCEDURES_TRIGGERS.md) | **SQL Queries, Views, Procedures & Triggers** | DDL/DML queries, multi-table joins, aggregates, subqueries, 5 analytical SQL views, stored procedures (`sp_book_appointment`, `sp_process_payment`), and triggers. |
| [**`06_FRONTEND_BACKEND_API_WORKFLOW.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/06_FRONTEND_BACKEND_API_WORKFLOW.md) | **Frontend, Backend & API Workflow** | React component tree, Context API, Express middleware pipeline, centralized error handling, JWT auth flow, and complete REST API catalog. |
| [**`07_INSTALLATION_AND_EXECUTION_GUIDE.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/07_INSTALLATION_AND_EXECUTION_GUIDE.md) | **Installation & Execution Guide** | Step-by-step setup for Windows, macOS, and Linux: PostgreSQL initialization (pgAdmin GUI & CLI `npm run seed`), `.env` setup, server/client launch, and demo logins. |
| [**`08_TESTING_AND_FUTURE_SCOPE.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/08_TESTING_AND_FUTURE_SCOPE.md) | **Testing Report & Future Scope** | Automated integration tests (`node:test` + `supertest`), security test matrix, edge cases, input validation checks, limitations, and future roadmap. |
| [**`09_DBMS_AND_PROJECT_VIVA_QUESTIONS.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/09_DBMS_AND_PROJECT_VIVA_QUESTIONS.md) | **DBMS & Project Viva Preparation** | 45+ categorized viva questions and answers covering Core DBMS theory, PostgreSQL specifics, project architecture, and examiner trap questions. |
| [**`10_PROJECT_DEMONSTRATION_SCRIPT.md`**](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/10_PROJECT_DEMONSTRATION_SCRIPT.md) | **Live Project Demonstration Script** | 10-step guided live demo workflow for the college presentation, complete with presentation talk tracks, click-by-click cues, and examiner interaction tips. |

---

## Quick Reference Summary

### Core Metrics of the Project
- **Database Engine**: PostgreSQL 14+ (Verified on PostgreSQL 18.4, default listening port `2007` / `5432`)
- **Normalized Relational Tables**: 11 (`departments`, `users`, `doctors`, `patients`, `appointments`, `medical_records`, `prescriptions`, `bills`, `bill_items`, `payments`, `audit_logs`)
- **Analytical Views**: 5 (`v_dashboard_stats`, `v_appointment_details`, `v_doctor_appointments`, `v_patient_billing_summary`, `v_daily_revenue_report`)
- **Database Functions & Procedures**: 3 (`fn_sync_bill_totals`, `sp_process_payment`, `sp_book_appointment`)
- **Automated Triggers**: 4 trigger suites (Timestamp updates, appointment state audit, bill item total synchronization, payment audit)
- **Security**: Salted bcrypt password hashing (10 rounds) + Stateless JSON Web Tokens (24-hour expiration) + Role-Based Access Control (Admin, Doctor, Receptionist)
- **Frontend User Interface**: 14 functional screens built with React 19, Vite 8, and custom responsive CSS.

### Demo Credentials for Evaluation

| Role | Username | Password | Permitted Operations |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` | Full administrative control, staff account creation, doctor management, system configuration |
| **Consulting Doctor** | `dr.sarah` | `Doctor@123` | Appointment consultations, medical records authoring, diagnostic treatment plans, prescription writing |
| **Consulting Doctor** | `dr.robert` | `Doctor@123` | Neurology consultations, medical records documentation, prescriptions |
| **Front Desk Receptionist** | `receptionist` | `Staff@123` | Patient registration, appointment scheduling, billing, payments recording, invoice printing |

---

## How Team Members Should Use This Documentation

1. **For Code Review**: Start with [`01_PROJECT_OVERVIEW.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/01_PROJECT_OVERVIEW.md) and [`02_SYSTEM_ARCHITECTURE.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/02_SYSTEM_ARCHITECTURE.md) to grasp the big-picture design before diving into the code.
2. **For Database Lab Work & Schema Understanding**: Study [`03_DATABASE_SCHEMA_DICTIONARY.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/03_DATABASE_SCHEMA_DICTIONARY.md), [`04_ER_DIAGRAM_AND_NORMALIZATION.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/04_ER_DIAGRAM_AND_NORMALIZATION.md), and [`05_SQL_QUERIES_VIEWS_PROCEDURES_TRIGGERS.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/05_SQL_QUERIES_VIEWS_PROCEDURES_TRIGGERS.md).
3. **For Backend and API Understanding**: Read [`06_FRONTEND_BACKEND_API_WORKFLOW.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/06_FRONTEND_BACKEND_API_WORKFLOW.md).
4. **For Running the Project**: Follow [`07_INSTALLATION_AND_EXECUTION_GUIDE.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/07_INSTALLATION_AND_EXECUTION_GUIDE.md).
5. **For Viva Preparation & Defense**: Thoroughly memorize the concepts and answers in [`09_DBMS_AND_PROJECT_VIVA_QUESTIONS.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/09_DBMS_AND_PROJECT_VIVA_QUESTIONS.md) and rehearse the demonstration in [`10_PROJECT_DEMONSTRATION_SCRIPT.md`](file:///c:/Users/vrind/OneDrive/Desktop/Projects/hospital-management/PROJECT_DOCUMENTATION/10_PROJECT_DEMONSTRATION_SCRIPT.md).

