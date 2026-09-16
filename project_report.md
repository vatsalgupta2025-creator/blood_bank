# LifeFlow — Blood Bank Management System
## DBMS Project Report

---

**Project Title:** LifeFlow — Blood Bank Management System
**Technology Stack:** React · Node.js · MySQL · Express.js · JWT
**Database:** MySQL (hosted on Aiven Cloud)
**Project Type:** Full-Stack Web Application (DBMS Project)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Database Design](#6-database-design)
   - [Entity-Relationship (ER) Overview](#entity-relationship-er-overview)
   - [Entities & Attributes](#entities--attributes)
   - [Relationships & Constraints](#relationships--constraints)
7. [API Design & Backend Structure](#7-api-design--backend-structure)
8. [Frontend Modules & Features](#8-frontend-modules--features)
9. [Authentication & Security (RBAC)](#9-authentication--security-rbac)
10. [Responsive Design](#10-responsive-design)
11. [SQL Queries & Key Operations](#11-sql-queries--key-operations)
12. [Conclusion](#12-conclusion)

---

## 1. Introduction

Blood is a critical and irreplaceable medical resource. The management of blood banks — from donor registration to inventory tracking and emergency request fulfillment — is a complex, multi-stakeholder process that traditionally relied on paper records and siloed systems.

**LifeFlow** is a comprehensive, web-based Blood Bank Management System that digitizes and centralizes all blood bank operations. It connects donors, patients (receivers), blood bank staff, doctors, and administrators on a single, secure, and intelligent platform.

The system provides real-time visibility into blood inventory levels (broken down by blood group), manages the full lifecycle of blood donation events and transfusion requests, and supports multiple user roles with granular access control.

---

## 2. Problem Statement

Manual blood bank management suffers from:

- **Inventory inefficiencies:** Difficulty tracking available blood units, expiry dates, and blood group availability across multiple centers.
- **Poor request handling:** Lack of a centralized system to prioritize and manage urgent transfusion requests.
- **Donor information silos:** No unified database to track donor eligibility, medical history, and donation frequency.
- **Slow emergency response:** Communication delays between hospitals and blood banks during critical situations.
- **Limited reporting:** No data-driven insights into inventory trends, donation patterns, or center performance.

---

## 3. Objectives

1. Design and implement a normalized relational MySQL database for blood bank operations.
2. Build a secure Node.js/Express REST API with JWT authentication and role-based access control (RBAC).
3. Develop an intuitive React frontend with full CRUD capabilities for all entities.
4. Implement a real-time dashboard with inventory status, urgent request tracking, and activity feeds.
5. Ensure the system is fully responsive across Desktop, Tablet, and Mobile devices.
6. Provide an Admin SQL Console and Database Verification panel for advanced oversight.

---

## 4. System Architecture

The project follows a **3-Tier Client-Server Architecture**:

```
┌─────────────────────────────────────────────────────┐
│              CLIENT (Presentation Tier)              │
│  React 19 · Vite · Tailwind CSS · Axios             │
│  Responsive SPA — Desktop / Tablet / Mobile         │
└────────────────────┬────────────────────────────────┘
                     │  HTTPS (REST API / JSON)
┌────────────────────▼────────────────────────────────┐
│            APPLICATION SERVER (Logic Tier)           │
│  Node.js · Express.js · JWT Auth · RBAC Middleware  │
│  REST API at /api/*                                 │
└────────────────────┬────────────────────────────────┘
                     │  MySQL Protocol (SSL/TLS)
┌────────────────────▼────────────────────────────────┐
│                DATABASE (Data Tier)                  │
│  MySQL 8.x · Aiven Cloud · Connection Pool          │
│  Normalized Relational Schema · ACID Compliant      │
└─────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

### Frontend
| Technology      | Purpose                                        |
|-----------------|------------------------------------------------|
| React 19        | UI component library, SPA routing              |
| Vite 8          | Build tool, development server, HMR            |
| Tailwind CSS v4 | Utility-first CSS framework                    |
| Lucide React    | Icon library                                   |
| Axios           | HTTP client for REST API communication         |
| React Router v7 | Client-side routing and navigation             |

### Backend
| Technology    | Purpose                                          |
|---------------|--------------------------------------------------|
| Node.js       | JavaScript runtime environment                   |
| Express.js    | Web framework for routing and middleware         |
| MySQL2        | Database driver with promise support             |
| JSON Web Token| Stateless authentication tokens                  |
| bcrypt        | Password hashing and verification               |
| dotenv        | Environment variable management                  |
| CORS          | Cross-Origin Resource Sharing configuration      |

### Database & Infrastructure
| Component     | Detail                                           |
|---------------|--------------------------------------------------|
| MySQL 8.x     | Primary relational database                      |
| Aiven Cloud   | Managed MySQL hosting (SSL/TLS secured)         |
| Connection Pool| `mysql2/promise` connection pooling             |

---

## 6. Database Design

### Entity-Relationship (ER) Overview

The database comprises **8 primary tables** with well-defined relationships, primary keys, foreign keys, and integrity constraints.

```
         blood_bank
         (bank_id, name, city, state, capacity, phone, email)
              │
              ├──────────────────────┬───────────────────────┐
              │                      │                       │
           donor                 blood_unit            staff
   (donor_id, first_name,     (unit_id, blood_group, (staff_id, name,
    blood_group, is_eligible)   status, bank_id)      role, bank_id)
              │
              │
       donation_event ─── blood_bank
   (event_id, donor_id, bank_id, event_date)
              │
           blood_unit
       (blood_test → unit_id)

        receiver ──────── blood_request ──── blood_bank
   (receiver_id, name,  (request_id, blood_group,
    blood_group)         status, urgency, bank_id)
```

### Entities & Attributes

#### 1. `blood_bank`
| Column       | Type         | Constraint          |
|--------------|--------------|---------------------|
| `bank_id`    | INT          | PRIMARY KEY, AUTO_INCREMENT |
| `name`       | VARCHAR(200) | NOT NULL            |
| `city`       | VARCHAR(100) | NOT NULL            |
| `state`      | VARCHAR(100) | NOT NULL            |
| `capacity`   | INT          | NOT NULL            |
| `phone`      | VARCHAR(15)  | —                   |
| `email`      | VARCHAR(100) | —                   |

#### 2. `donor`
| Column            | Type         | Constraint                  |
|-------------------|--------------|-----------------------------|
| `donor_id`        | INT          | PRIMARY KEY, AUTO_INCREMENT |
| `first_name`      | VARCHAR(100) | NOT NULL                    |
| `last_name`       | VARCHAR(100) | —                           |
| `dob`             | DATE         | —                           |
| `gender`          | ENUM         | 'Male','Female','Other'     |
| `blood_group`     | ENUM         | 'A+','A-','B+','B-','AB+','AB-','O+','O-' |
| `phone`           | VARCHAR(15)  | NOT NULL                    |
| `email`           | VARCHAR(100) | —                           |
| `is_eligible`     | TINYINT(1)   | DEFAULT 1                   |
| `total_donations` | INT          | COMPUTED / tracked          |

#### 3. `receiver`
| Column           | Type         | Constraint                  |
|------------------|--------------|-----------------------------|
| `receiver_id`    | INT          | PRIMARY KEY, AUTO_INCREMENT |
| `first_name`     | VARCHAR(100) | NOT NULL                    |
| `blood_group`    | ENUM         | NOT NULL                    |
| `hospital_name`  | VARCHAR(200) | —                           |
| `hospital_city`  | VARCHAR(100) | —                           |
| `urgency`        | ENUM         | 'Normal','Urgent','Critical'|

#### 4. `blood_unit`
| Column            | Type         | Constraint                           |
|-------------------|--------------|--------------------------------------|
| `unit_id`         | INT          | PRIMARY KEY, AUTO_INCREMENT          |
| `blood_group`     | ENUM         | NOT NULL                             |
| `collection_date` | DATE         | NOT NULL                             |
| `expiry_date`     | DATE         | NOT NULL                             |
| `status`          | ENUM         | 'Available','Used','Expired','Tested'|
| `bank_id`         | INT          | FOREIGN KEY → blood_bank(bank_id)    |

#### 5. `blood_request`
| Column        | Type         | Constraint                                        |
|---------------|--------------|---------------------------------------------------|
| `request_id`  | INT          | PRIMARY KEY, AUTO_INCREMENT                       |
| `receiver_id` | INT          | FOREIGN KEY → receiver(receiver_id)               |
| `bank_id`     | INT          | FOREIGN KEY → blood_bank(bank_id)                 |
| `blood_group` | ENUM         | NOT NULL                                          |
| `quantity`    | INT          | NOT NULL                                          |
| `required_by` | DATE         | —                                                 |
| `status`      | ENUM         | 'Pending','Approved','Fulfilled','Rejected'       |
| `urgency`     | ENUM         | 'Normal','Urgent','Critical'                      |

#### 6. `donation_event`
| Column       | Type         | Constraint                        |
|--------------|--------------|-----------------------------------|
| `event_id`   | INT          | PRIMARY KEY, AUTO_INCREMENT       |
| `donor_id`   | INT          | FOREIGN KEY → donor(donor_id)     |
| `bank_id`    | INT          | FOREIGN KEY → blood_bank(bank_id) |
| `event_date` | DATE         | NOT NULL                          |
| `blood_group`| ENUM         | —                                 |

#### 7. `blood_test`
| Column      | Type         | Constraint                          |
|-------------|--------------|-------------------------------------|
| `test_id`   | INT          | PRIMARY KEY, AUTO_INCREMENT         |
| `unit_id`   | INT          | FOREIGN KEY → blood_unit(unit_id)   |
| `test_type` | VARCHAR(100) | NOT NULL                            |
| `result`    | ENUM         | 'Passed','Failed','Pending'         |
| `tested_by` | VARCHAR(100) | —                                   |
| `test_date` | DATE         | NOT NULL                            |

#### 8. `staff` (Users)
| Column      | Type         | Constraint                          |
|-------------|--------------|-------------------------------------|
| `staff_id`  | INT          | PRIMARY KEY, AUTO_INCREMENT         |
| `name`      | VARCHAR(150) | NOT NULL                            |
| `email`     | VARCHAR(100) | UNIQUE, NOT NULL                    |
| `password`  | VARCHAR(255) | NOT NULL (bcrypt hashed)            |
| `role`      | ENUM         | 'Admin','Doctor','Nurse','Technician'|
| `bank_id`   | INT          | FOREIGN KEY → blood_bank(bank_id)   |

### Relationships & Constraints

| Relationship                         | Type        | Constraint                      |
|--------------------------------------|-------------|---------------------------------|
| `donor` → `donation_event`           | One-to-Many | FK `donor_id`; ON DELETE CASCADE|
| `blood_bank` → `donation_event`      | One-to-Many | FK `bank_id`                    |
| `blood_bank` → `blood_unit`          | One-to-Many | FK `bank_id`                    |
| `blood_unit` → `blood_test`          | One-to-One  | FK `unit_id`                    |
| `receiver` → `blood_request`         | One-to-Many | FK `receiver_id`                |
| `blood_bank` → `blood_request`       | One-to-Many | FK `bank_id`                    |
| `blood_bank` → `staff`               | One-to-Many | FK `bank_id`                    |

---

## 7. API Design & Backend Structure

The Express server exposes a clean RESTful API under the `/api` prefix. All protected routes require a valid JWT Bearer token.

### API Endpoints

| Module             | Base Route             | Operations                               |
|--------------------|------------------------|------------------------------------------|
| Auth               | `/api/auth`            | `POST /login`                            |
| Dashboard          | `/api/dashboard`       | `GET /` (summary stats + inventory)      |
| Blood Banks        | `/api/blood-banks`     | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Donors             | `/api/donors`          | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Receivers          | `/api/receivers`       | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Blood Units        | `/api/blood-units`     | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Blood Requests     | `/api/blood-requests`  | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Donation Events    | `/api/donation-events` | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Blood Tests        | `/api/blood-tests`     | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| Staff              | `/api/staff`           | `GET`, `POST`, `PUT /:id`, `DELETE /:id` |
| SQL Console        | `/api/sql`             | `POST /query` (Admin only)               |
| DB Verification    | `/api/db-verification` | `GET /` (Admin only)                     |

### Backend Folder Structure

```
backend/
├── config/
│   └── db.js               — MySQL connection pool (mysql2/promise)
├── controllers/
│   ├── authController.js   — Login + JWT issuance
│   ├── dashboardController.js
│   ├── donorController.js
│   ├── receiverController.js
│   ├── bloodBankController.js
│   ├── bloodUnitController.js
│   ├── bloodRequestController.js
│   ├── donationEventController.js
│   ├── bloodTestController.js
│   ├── staffController.js
│   └── sqlController.js    — Raw SELECT query execution
├── middleware/
│   ├── authMiddleware.js   — JWT verification
│   └── errorHandler.js     — Global error handling
├── routes/
│   └── *.js                — One route file per resource
└── server.js               — Express app entry point
```

---

## 8. Frontend Modules & Features

### Dashboard
The dashboard provides a real-time operational overview including:
- **Stat Strip:** Available blood units, total eligible donors, connected banks, and pending requests.
- **Blood Group Inventory:** Visual grid showing units per blood group (A+, A−, B+, B−, AB+, AB−, O+, O−) with low-stock alerts.
- **Urgent Requests Panel:** Top 5 active critical/urgent blood requests with receiver name, blood group, and required-by date.
- **Recent Activity Feed:** Latest donation events with donor name, blood group, bank, and date.
- **Connected Banks Overview:** Quick snapshot of the first 4 blood bank centers with capacity info.
- **System Modules Grid:** Quick-access navigation cards for all 8 operational modules.

### CRUD Pages (All Modules)
Each data module page (`DonorsPage`, `BloodUnitsPage`, etc.) follows a consistent pattern:
- **Filter Bar:** Search input, dropdown filters (blood group, role, status), and a Column Selector to show/hide table columns.
- **DataTable:** Sortable, paginated table with per-row Edit and Delete actions.
- **Mobile Card View:** On small screens, the table is replaced by stacked card items showing the same data.
- **Add/Edit Modal:** Form dialog with validation, required field highlighting, and async submission.
- **Confirm Delete Dialog:** Secondary confirmation modal before any destructive action.

### Admin-Only Panels
- **SQL Console (`/sql-console`):** A terminal-style interface where administrators can type and execute arbitrary `SELECT` queries against the live MySQL database. Results are displayed in a formatted table.
- **DB Verification (`/db-verification`):** A panel that runs a series of pre-configured CRUD verification checks against the live database and reports the pass/fail status of each operation, confirming data integrity.

---

## 9. Authentication & Security (RBAC)

### JWT Authentication Flow

```
 Client          →  POST /api/auth/login  →  Server
                    { email, password }

 Server validates credentials, generates JWT:
 { staff_id, name, role, bank_id } + SECRET + expiry

 Client stores JWT in localStorage (key: 'bb_user')
 All subsequent requests send: Authorization: Bearer <token>

 Middleware (authMiddleware.js) verifies token on protected routes
```

### Role-Based Access Control

| Role          | Permissions                                                         |
|---------------|---------------------------------------------------------------------|
| **Admin**     | Full CRUD on all modules + SQL Console + DB Verification access     |
| **Doctor**    | Read/Write on Blood Requests, Receivers; Read on Inventory          |
| **Nurse**     | Read/Write on Donors, Donation Events; Read on Blood Units          |
| **Technician**| Read/Write on Blood Tests and Blood Units; Read only on rest        |

Navigation items (`SQL Console`, `DB Verification`) are conditionally rendered based on the logged-in user's role stored in the JWT payload.

---

## 10. Responsive Design

The application implements a **progressive responsive design** using CSS Grid, Flexbox, and media query breakpoints:

| Breakpoint   | Behavior                                                            |
|--------------|---------------------------------------------------------------------|
| **> 1024px** (Desktop) | Full navigation bar, multi-column layouts, complete data tables |
| **641–1024px** (Tablet)  | Collapsed navigation (hamburger drawer), 2-column grids, single-column forms |
| **< 640px** (Mobile)   | Vertical stacked layout, card-based data view (no horizontal scroll), touch-friendly buttons (min 44px) |

### Key Responsive Adaptations
- **TopHeader:** Desktop shows full nav links. Mobile/Tablet shows a hamburger `☰` button that opens a full-screen side drawer. The drawer auto-closes on route change.
- **DataTable:** On mobile, the standard HTML `<table>` is hidden. Instead, each row is re-rendered as a stacked `.mobile-card-item` with label-value pairs, ensuring no horizontal scrolling.
- **Dashboard Grids:** The hero section, stats strip, and system module grids all use `display: grid` with responsive column counts (4 → 2 → 1).
- **Filter Bars:** Inline filters reflow into a 2-column grid on tablet and a single column on mobile.

---

## 11. SQL Queries & Key Operations

### Dashboard Summary
```sql
-- Available blood units by blood group
SELECT blood_group, COUNT(*) AS count
FROM blood_unit
WHERE status = 'Available'
GROUP BY blood_group
ORDER BY blood_group;

-- Donations per month (last 6 months)
SELECT DATE_FORMAT(event_date, '%b %Y') AS month, COUNT(*) AS count
FROM donation_event
WHERE event_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(event_date, '%Y-%m')
ORDER BY DATE_FORMAT(event_date, '%Y-%m') ASC;

-- Critical/urgent pending requests count
SELECT COUNT(*) AS count
FROM blood_request
WHERE urgency = 'Critical' AND status IN ('Pending', 'Approved');
```

### Donor Search (Filtered)
```sql
-- Search by name and city, filtered by blood group
SELECT d.*, COUNT(e.event_id) AS total_donations, MAX(e.event_date) AS last_donation
FROM donor d
LEFT JOIN donation_event e ON d.donor_id = e.donor_id
WHERE d.first_name LIKE '%search%'
  AND d.city = 'Mumbai'
  AND d.blood_group = 'O+'
GROUP BY d.donor_id
ORDER BY d.first_name ASC;
```

### Blood Inventory Low Stock Alert
```sql
-- Blood groups with fewer than 20 units available
SELECT blood_group, COUNT(*) AS count
FROM blood_unit
WHERE status = 'Available'
GROUP BY blood_group
HAVING count < 20
ORDER BY count ASC;
```

### Cascade Delete (Donor & Events)
```sql
-- When a donor is deleted, their donation events are auto-deleted
-- via ON DELETE CASCADE on donation_event.donor_id FK
DELETE FROM donor WHERE donor_id = 42;
-- → donation_event rows with donor_id=42 are automatically removed
```

---

## 12. Conclusion

The **LifeFlow Blood Bank Management System** successfully demonstrates the end-to-end application of Database Management System principles in a real-world healthcare domain. The project achieves:

- **Robust Data Modeling:** A fully normalized (3NF) MySQL relational schema with 8 entities, foreign key constraints, and cascade rules that ensure data integrity across all operations.
- **Full-Stack Integration:** A clean separation of concerns between the React SPA frontend, the Node.js/Express REST API, and the MySQL database.
- **Security:** JWT-based stateless authentication with RBAC enforced at both the API middleware level and the UI navigation level.
- **Usability:** A fully responsive interface that adapts its layout and data presentation paradigm across Desktop, Tablet, and Mobile, meeting modern accessibility and UX standards.
- **Operational Power:** Admin-only SQL Console and DB Verification panels provide transparency and control over live data, useful for rapid debugging and auditing during a project demonstration.

The system demonstrates that a well-designed relational database, combined with a modern web stack, can significantly improve the efficiency, accuracy, and responsiveness of critical healthcare logistics like blood bank management.

---

*Report generated for DBMS Project — LifeFlow Blood Bank Management System*
