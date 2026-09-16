<div align="center">
  <img src="https://img.icons8.com/color/96/000000/blood-drop.png" alt="LifeFlow Logo"/>
  <h1>LifeFlow — Blood Bank Management System</h1>
  <p>A comprehensive, full-stack digital solution for modern blood bank operations, built with React, Node.js, and MySQL.</p>
  
  <p>
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#architecture"><strong>Architecture</strong></a> ·
    <a href="#database-design"><strong>Database Design</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a>
  </p>
</div>

<br/>

## 🩸 Overview

**LifeFlow** is a next-generation **Blood Bank Management System** developed as a capstone Database Management System (DBMS) project. 

It tackles the critical challenge of manual, siloed blood inventory tracking by providing a unified platform where **Donors, Patients, Hospitals, and Blood Banks** can seamlessly coordinate. The system ensures that live-saving blood supplies are accurately tracked, safely stored, and rapidly deployed when emergencies strike.

---

## ✨ Key Features

LifeFlow goes beyond a standard CRUD application by implementing sophisticated, real-world operational logic:

### 📱 Responsive & Adaptive UI
- **Cross-Platform Experience**: Intelligently scales from a powerful desktop web application to a touch-friendly mobile interface.
- **Card-List Views**: Complex data tables morph into readable card stacks on mobile devices.
- **Dynamic Navigation**: Responsive side-drawers and collapsible headers for uninterrupted workflows.

### 🔐 Enterprise-Grade Security
- **Stateless JWT Authentication**: Secure, scalable token-based login.
- **Role-Based Access Control (RBAC)**: Distinct permission sets across the platform.
  - 🛡️ **Admin**: Full system control and database administration.
  - 🩺 **Doctor**: Manages patients and approves urgent blood requests.
  - 👩‍⚕️ **Nurse**: Oversees donor registrations and donation drives.
  - 🔬 **Technician**: Records blood tests and manages cold-storage inventory.

### 📊 Real-Time Operations Dashboard
- **Live Inventory Tracking**: Instant visual breakdown of available blood units by blood group.
- **Urgent Request Monitoring**: Critical alerts for high-priority transfusion needs.
- **Activity Streams**: Live feed of recent donations and system events.

### 🗄️ Advanced Database Management
- **SQL Admin Console**: Direct, secure SQL execution interface for database administrators.
- **Automated Integrity Checks**: Built-in verification tools to ensure referential integrity and data sanity in production.

---

## 🏗️ Architecture

LifeFlow is built on a scalable **3-Tier Client-Server Architecture**:

1. **Presentation Tier (React SPA)**: A high-performance frontend built with React 19 and Vite. Utilizes Tailwind CSS for a fluid, component-driven design system.
2. **Logic Tier (Node.js/Express REST API)**: The core engine handling business rules, RBAC middleware, JWT validation, and secure query formatting.
3. **Data Tier (MySQL Cloud)**: A fully normalized relational database hosted on Aiven Cloud, accessed via efficient connection pooling.

---

## 🗃️ Database Design (ER Schema)

The database is heavily normalized to **3NF** to prevent data anomalies. It features **8 interconnected entities**:

- `blood_bank`: Central hubs for operations.
- `donor`: Registered individuals who supply blood.
- `donation_event`: The physical act of donating, linked to a donor and bank.
- `blood_unit`: The physical blood bags (inventory), tracked from collection to expiry.
- `blood_test`: Laboratory screening results for individual units.
- `receiver`: Patients or hospitals requesting blood.
- `blood_request`: Transfusion orders with urgency levels.
- `staff`: System users (Admins, Doctors, Nurses, Technicians).

*(Constraints like `ON DELETE CASCADE` ensure that deleting a donor automatically cleans up their associated donation events, maintaining perfect referential integrity).*

---

## 🛠️ Tech Stack

### Frontend
- **React (v19)** — UI Component Architecture
- **Vite (v8)** — Next-generation frontend tooling
- **Tailwind CSS (v4)** — Utility-first, highly responsive styling
- **React Router (v7)** — Client-side routing
- **Lucide React** — Crisp SVG iconography
- **Axios** — Promise-based HTTP client

### Backend & Database
- **Node.js & Express.js** — Fast, asynchronous server framework
- **MySQL 8.x** — Robust relational database (Hosted on Aiven Cloud)
- **mysql2/promise** — High-performance MySQL driver with connection pooling
- **JSON Web Tokens (JWT)** — Secure authentication
- **bcrypt** — Cryptographic password hashing

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18+)
- MySQL Server (if running locally) or Aiven Cloud credentials.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/LifeFlow.git
   cd LifeFlow
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `/backend` directory and add your MySQL credentials and JWT Secret:*
   ```env
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=bloodbank_db
   DB_PORT=your-database-port
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   ```
   *Run the server:*
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:5173`.
   *(Live deployment available at: https://blood-bank-phi-five.vercel.app/)*

---

<div align="center">
  <i>Developed with ❤️ for Database Management Systems Coursework</i>
</div>
