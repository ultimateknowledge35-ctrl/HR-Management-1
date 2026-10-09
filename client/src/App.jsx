import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StaffManagement from './pages/admin/StaffManagement';
import Attendance from './pages/admin/Attendance';
import Payroll from './pages/admin/Payroll';
import Requests from './pages/admin/Requests';
import Complaints from './pages/admin/Complaints';
import Expenses from './pages/admin/Expenses';
import Settings from './pages/admin/Settings';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import MySalary from './pages/staff/MySalary';
import MyRequests from './pages/staff/MyRequests';
import MyComplaints from './pages/staff/MyComplaints';
import MyAttendance from './pages/staff/MyAttendance';
import MyProfile from './pages/staff/MyProfile';

function AppContent() {
  const { isAuthenticated, isAdmin, isStaff, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Set default active tab when role changes
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('dashboard');
    } else if (isStaff) {
      setActiveTab('overview');
    }
  }, [isAdmin, isStaff]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Loading System...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Admin Route Tabs */}
      {isAdmin && (
        <>
          {activeTab === 'dashboard' && <AdminDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'attendance' && <Attendance />}
          {activeTab === 'payroll' && <Payroll />}
          {activeTab === 'requests' && <Requests />}
          {activeTab === 'complaints' && <Complaints />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'settings' && <Settings />}
        </>
      )}

      {/* Staff Route Tabs */}
      {isStaff && (
        <>
          {activeTab === 'overview' && <StaffDashboard setActiveTab={setActiveTab} />}
          {activeTab === 'my-salary' && <MySalary />}
          {activeTab === 'my-requests' && <MyRequests />}
          {activeTab === 'my-complaints' && <MyComplaints />}
          {activeTab === 'my-attendance' && <MyAttendance />}
          {activeTab === 'my-profile' && <MyProfile />}
        </>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
