# LifeFlow - Blood Bank Management System

LifeFlow is a comprehensive Blood Bank Management System designed to connect donors, blood banks, healthcare teams, and patients through one intelligent platform.

## Features

- **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile views.
- **Authentication & Authorization**: Secure login with JWT authentication.
- **Role-Based Access Control (RBAC)**: Distinct access levels for Admin, Doctor, Nurse, and Technician roles.
- **Dashboard**: Real-time overview of blood inventory, urgent requests, recent activities, and connected banks.
- **Donor Management**: Register and track blood donors, their eligibility, and donation history.
- **Receiver Management**: Manage patients and their blood transfusion needs.
- **Blood Inventory (Units)**: Track and manage blood units categorized by blood groups.
- **Blood Banks (Centers)**: Directory and management of connected blood bank facilities.
- **Blood Requests**: Handle urgent and routine blood transfusion requests from hospitals and patients.
- **Donation Events**: Record and track blood donation camps and individual donation events.
- **Blood Tests**: Maintain records of blood screening and test results.
- **Staff Management**: Manage blood bank personnel and their roles.

## Tech Stack

### Frontend
- **React** (v19)
- **Vite** (v8)
- **Tailwind CSS** (v4) / Custom Responsive CSS
- **Lucide React** (Icons)
- **Axios** (API requests)

### Backend
- **Node.js**
- **Express.js**
- **MySQL** (Relational Database)
- **JSON Web Tokens (JWT)** (Authentication)

## Getting Started

### Prerequisites
- Node.js installed
- MySQL Server running

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd <repository-directory>
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Configure your environment variables (.env file) with your MySQL credentials and JWT Secret
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:5173`.