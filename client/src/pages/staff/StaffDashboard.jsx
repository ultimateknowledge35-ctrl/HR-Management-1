import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  CreditCard,
  CalendarCheck,
  FileText,
  MessageSquareWarning,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingDown
} from 'lucide-react';

export default function StaffDashboard({ setActiveTab }) {
  const { user, settings } = useAuth();
  const currencySymbol = settings?.currency_symbol || '$';

  const [salaryInfo, setSalaryInfo] = useState(null);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sal, reqs, comps, att] = await Promise.all([
          api.getStaffSalary().catch(() => null),
          api.getStaffRequests().catch(() => []),
          api.getStaffComplaints().catch(() => []),
          api.getStaffAttendance().catch(() => null),
        ]);
        setSalaryInfo(sal);
        setRequests(reqs || []);
        setComplaints(comps || []);
        setAttendance(att);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
      </div>
    );
  }

  const currentMonth = salaryInfo?.currentMonth;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const openComplaints = complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_REVIEW').length;
  const attendanceRate = attendance?.counts?.TOTAL
    ? Math.round(((attendance.counts.PRESENT + (attendance.counts.LATE * 0.5)) / attendance.counts.TOTAL) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
            Employee Workspace
          </span>
          <h2 className="text-2xl font-black mt-1">
            Hello, {user?.name || user?.username}!
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 leading-relaxed">
            Welcome to your self-service portal. Manage your payslips, request advance salary, file concerns, and check your attendance logs.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Salary Status (This Month)"
          value={currentMonth?.status || 'Pending'}
          subtitle={`Net: ${formatCurrency(currentMonth?.net_pay || 0, currencySymbol)}`}
          icon={CreditCard}
          color={currentMonth?.status === 'Paid' ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Attendance Score"
          value={`${attendanceRate}%`}
          subtitle={`${attendance?.counts?.PRESENT || 0} days present this month`}
          icon={CalendarCheck}
          color="indigo"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          subtitle="Awaiting HR review"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Active Complaints"
          value={openComplaints}
          subtitle="In review by management"
          icon={MessageSquareWarning}
          color="rose"
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Salary Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Current Salary Summary
              </h3>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(currentMonth?.status)}`}>
                {currentMonth?.status}
              </span>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Salary:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(currentMonth?.base_salary, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Loan/Advance Deductions:</span>
                <span className="font-semibold text-rose-500">
                  -{formatCurrency(currentMonth?.deductions, currencySymbol)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Estimated Net Pay:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentMonth?.net_pay, currencySymbol)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Payday is on the <strong>{currentMonth?.paydayDay}th</strong> of every month.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveTab('my-salary')}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View Payslip History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Requests Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Loan / Advance Requests
              </h3>
              <button
                onClick={() => setActiveTab('my-requests')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                New Request
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                You have not submitted any advance or loan requests.
              </p>
            ) : (
              <div className="space-y-2.5">
                {requests.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.type === 'LOAN' ? 'Staff Loan' : 'Advance Salary'}: {formatCurrency(r.amount, currencySymbol)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.months} months duration
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveTab('my-requests')}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>View All Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
