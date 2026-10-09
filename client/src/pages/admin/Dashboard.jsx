import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import {
  Users,
  CreditCard,
  Receipt,
  TrendingDown,
  AlertCircle,
  FileText,
  CalendarCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl animate-pulse p-6" />
          <div className="h-80 bg-white dark:bg-slate-900 rounded-2xl animate-pulse p-6" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-semibold">{error || 'Could not load data'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, charts, settings } = data;
  const currencySymbol = settings?.currency_symbol || '$';

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Active Staff"
          value={metrics.totalStaff}
          subtitle="Full-time employees"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Salaries This Month"
          value={formatCurrency(metrics.totalPaidSalary, currencySymbol)}
          subtitle={`${metrics.paidCount} Paid • ${formatCurrency(metrics.totalRemainingSalary, currencySymbol)} Remaining`}
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Today's Expenses"
          value={formatCurrency(metrics.todayExpenses, currencySymbol)}
          subtitle="Logged today"
          icon={Receipt}
          color="amber"
        />
        <StatCard
          title="This Month's Expenses"
          value={formatCurrency(metrics.thisMonthExpenses, currencySymbol)}
          subtitle="Monthly operating total"
          icon={TrendingDown}
          color="purple"
        />
      </div>

      {/* Action Notification Badges if pending items */}
      {(metrics.pendingRequestsCount > 0 || metrics.openComplaintsCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {metrics.pendingRequestsCount > 0 && (
            <button
              onClick={() => setActiveTab('requests')}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{metrics.pendingRequestsCount} Pending Loan/Advance Request(s) awaiting review</span>
            </button>
          )}

          {metrics.openComplaintsCount > 0 && (
            <button
              onClick={() => setActiveTab('complaints')}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{metrics.openComplaintsCount} Open Staff Complaint(s) need attention</span>
            </button>
          )}
        </div>
      )}

      {/* Row 1 Charts: Daily Expenses (Bar) & Salary Status (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Expenses for Current Month */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Expenses (Current Month)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expense tracking across every day of this month
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800">
              {formatCurrency(metrics.thisMonthExpenses, currencySymbol)} Total
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyExpenses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.split('-')[2]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip
                  formatter={(val) => [formatCurrency(val, currencySymbol), 'Amount']}
                  labelFormatter={(val) => `Date: ${val}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Paid vs Remaining Donut Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Salaries Paid vs Remaining
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly payroll clearance progress
            </p>
          </div>

          <div className="h-56 sm:h-60 w-full relative my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.salaryDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.salaryDonut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(val, currencySymbol), 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-slate-400">Total</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {formatCurrency(metrics.totalPaidSalary + metrics.totalRemainingSalary, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Legend and summary */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Paid ({metrics.paidCount})</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(metrics.totalPaidSalary, currencySymbol)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Remaining ({metrics.remainingCount})</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(metrics.totalRemainingSalary, currencySymbol)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Chart: Monthly Expenses for the Last 12 Months */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Office Expenses (Last 12 Months Trend)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical monthly operational expenditures
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.monthlyExpenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${currencySymbol}${val}`}
              />
              <Tooltip
                formatter={(val) => [formatCurrency(val, currencySymbol), 'Expenses']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
