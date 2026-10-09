import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ activeTab, setActiveTab, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAuth();

  const titleMap = {
    // Admin
    dashboard: 'HR Overview & Analytics',
    staff: 'Staff Directory & Management',
    attendance: 'Attendance & Time Logs',
    payroll: 'Monthly Salary & Payroll',
    requests: 'Loan & Advance Salary Requests',
    complaints: 'Employee Grievances & Complaints',
    expenses: 'Operational Office Expenses',
    settings: 'Organization Settings',

    // Staff
    overview: 'Employee Workspace Overview',
    'my-salary': 'My Salary & Payslip Ledger',
    'my-requests': 'Advance & Loan Applications',
    'my-complaints': 'File Workplace Grievance',
    'my-attendance': 'Personal Attendance Log',
    'my-profile': 'Profile & Security',
  };

  const currentTitle = titleMap[activeTab] || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          activeTitle={currentTitle}
          setMobileOpen={setMobileOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
