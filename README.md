# Modern HR Management System (HRMS)

A fast, lightweight, and visually polished HR Management System built as a local web application with **React + Vite + Tailwind CSS** on the frontend and **Node.js + Express + SQLite** on the backend.

Runs with a single command (`npm run dev`) and requires zero external services or cloud dependencies.

---

## ⚡ Quick Start

### 1. Requirements
- Node.js (v18+ recommended)
- npm

### 2. Start Application
From the project root:
```bash
npm run dev
```
This runs both the backend Express server on `http://localhost:5000` and the Vite React frontend on `http://localhost:5173` concurrently.

Visit **[http://localhost:5173](http://localhost:5173)** in your browser!

### 3. Re-seed Database (Optional)
If you ever want to reset all data back to the demo state:
```bash
npm run seed
```

---

## 🔑 Demo Login Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| **ADMIN (HR)** | `admin` | `admin123` | Full access to all HR management modules, settings, and analytics. |
| **STAFF (Engineering)** | `sarah` | `staff123` | Senior Engineer, has active approved loan deduction on payslip. |
| **STAFF (HR)** | `david` | `staff123` | HR Coordinator, has resolved coffee machine complaint. |
| **STAFF (Design)** | `priya` | `staff123` | Lead UI/UX Designer. |
| **STAFF (Sales)** | `michael` | `staff123` | Account Executive, has pending advance salary request. |
| **STAFF (Finance)** | `elena` | `staff123` | Senior Financial Analyst, open AC temperature complaint. |
| **STAFF (Operations)** | `james` | `staff123` | DevOps Engineer. |
| **STAFF (Marketing)** | `aisha` | `staff123` | Growth Specialist, has rejected request on file. |
| **STAFF (Support)** | `robert` | `staff123` | Customer Success Specialist, headset complaint in review. |
---

## 🌟 Key Features

### 🛡️ Authentication & RBAC
- JWT token auth with bcrypt password hashing.
- Strict role-based isolation: staff accounts are blocked from admin routes and can only see their own attendance, salary, requests, and complaints.
- Password change self-service for staff; administrative password reset for any account.
- Passwords and sensitive hashes are never returned in API payloads.

### 🏢 Administrator (HR) Features
1. **Visual Dashboard**:
   - 4 Live Metric Cards (Total Staff, Salaries Paid vs Remaining, Today's Expenses, This Month's Expenses).
   - Recharts Daily Expenses Bar Chart for the current month.
   - Recharts Monthly Expenses Bar Chart across the past 12 months.
   - Recharts Donut Chart of Paid vs Remaining salaries with center metric.
2. **Staff Directory**:
   - Add, edit, and delete staff accounts (linked to system user logins).
   - Search by name, username, email, phone, or title.
   - Filter by department and active/inactive status.
   - Admin password reset tool.
3. **Attendance Management**:
   - Daily logs with Present, Late, Absent, Leave statuses and custom notes.
   - **"Mark All Present"** 1-click shortcut.
   - Monthly calendar heat-grid matrix tracking all days in the month.
4. **Salary & Payroll**:
   - Monthly payroll sheet calculating base salary, approved loan/advance deductions, and net pay.
   - **Payday Status Logic**: Unpaid staff show *Upcoming* before payday and *Pending/Overdue* on or after payday. Paid staff show *Paid*.
   - Mark as Paid modal capturing date, method (Bank Transfer, Cash, Cheque), and notes.
   - Full historical payslip audit per employee.
5. **Loan & Advance Requests**:
   - Review applications with amount, duration (months), and employee reasons.
   - 1-click Approve or Reject with optional feedback note.
   - Approved loans automatically schedule installment deductions on payroll!
6. **Complaints & Grievances**:
   - Triage complaints into Open, In Review, and Resolved.
   - Submit management responses visible to the employee.
7. **Office Expenses**:
   - Log categorized expenses (Utility Bills, Office Supplies, Rent, Software, etc.) with optional description.
   - Search and filter by category or date range.
   - Live filtered sum totals and edit/delete actions.
8. **Organization Settings**:
   - Configure salary payday day of the month (1-31).
   - Configure max advance/loan repayment limit (2 or 3 months).
   - Configure currency symbol (`$`, `€`, `£`, etc.).
   - Configure company branding.

### 👤 Staff Self-Service Portal
1. **My Salary & Payslips**:
   - Current pay cycle status breakdown (Base, Loan Deductions, Net Pay).
   - Full payslip history with a formatted, printable voucher modal.
2. **Advance & Loan Applications**:
   - Real-time monthly installment calculator.
   - Enforces the HR-configured maximum duration.
   - View review status and HR decision notes.
3. **Grievance Portal**:
   - File confidential workplace issues and track HR response.
4. **My Attendance**:
   - Monthly attendance statistics and daily arrival logs.
5. **My Profile**:
   - View employment contract details.
   - Securely change password with verification.

### 🎨 UI & UX
- Modern, clean layout with responsive collapsible sidebar.
- Seamless **Light / Dark Mode** switch (persisted in local storage).
- Toast notification alerts for actions.
- Modal confirm dialogs for destructive actions.
- Loading skeletons and friendly empty states.

---

## 📁 Project Structure

```
hr-management-system/
├── package.json               # Root scripts (dev, seed, install:all)
├── README.md
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── config/db.js       # SQLite database initialization & migrations
│   │   ├── middleware/        # JWT auth & RBAC middleware
│   │   ├── routes/            # REST API endpoints
│   │   │   ├── auth.js
│   │   │   ├── settings.js
│   │   │   ├── admin/         # staff, attendance, payroll, requests, complaints, expenses, dashboard
│   │   │   └── staff/         # portal endpoints scoped to req.user.staffId
│   │   ├── utils/             # Password hashing, JWT utils
│   │   ├── seed.js            # Admin + 8 staff + logs seed script
│   │   └── server.js          # Express app entrypoint
│   └── data/hrms.db           # Local SQLite database file
└── client/
    ├── package.json
    ├── vite.config.js         # Port 5173 + API proxy to 5000
    ├── tailwind.config.js     # Dark mode & color configuration
    └── src/
        ├── api/client.js      # REST API client
        ├── context/           # AuthContext, ThemeContext, ToastContext
        ├── components/        # Layout, Sidebar, Navbar, StatCard, ConfirmModal, etc.
        ├── pages/
        │   ├── Login.jsx
        │   ├── admin/         # Dashboard, Staff, Attendance, Payroll, etc.
        │   └── staff/         # StaffDashboard, MySalary, MyRequests, etc.
        └── utils/formatters.js
```
