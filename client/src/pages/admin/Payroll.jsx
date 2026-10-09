import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';

export default function Payroll() {
  const { settings } = useAuth();
  const { addToast } = useToast();
  const currencySymbol = settings?.currency_symbol || '$';

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [payingStaff, setPayingStaff] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'Bank Transfer',
    payment_date: today.toISOString().split('T')[0],
    note: ''
  });
  const [payLoading, setPayLoading] = useState(false);

  // History Modal
  const [historyStaff, setHistoryStaff] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.getPayroll(selectedYear, selectedMonth);
      setPayrollData(res);
    } catch (err) {
      addToast(err.message || 'Failed to load payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedYear, selectedMonth]);

  const handleOpenPay = (item) => {
    setPayingStaff(item);
    setPaymentForm({
      payment_method: 'Bank Transfer',
      payment_date: today.toISOString().split('T')[0],
      note: `Monthly payroll payment for ${selectedMonth}/${selectedYear}`
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payingStaff) return;
    setPayLoading(true);

    try {
      await api.recordPayment({
        staff_id: payingStaff.staff_id,
        year: selectedYear,
        month: selectedMonth,
        base_salary: payingStaff.base_salary,
        deductions: payingStaff.deductions,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        note: paymentForm.note
      });

      addToast(`Payment recorded for ${payingStaff.name}`);
      setPayingStaff(null);
      fetchPayroll();
    } catch (err) {
      addToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const handleOpenHistory = async (staffId) => {
    setHistoryStaff(staffId);
    setHistoryLoading(true);
    try {
      const res = await api.getPaymentHistory(staffId);
      setHistoryData(res);
    } catch (err) {
      addToast(err.message || 'Failed to load payment history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Payroll & Salaries</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Process payments, manage loan deductions, and track salary statuses
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payday Banner / Rule Info */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            Configured Salary Payday: <strong>Day {payrollData?.paydayDay || settings?.payday_day || 28} of the month</strong>.
            Unpaid staff show <em>Upcoming</em> before payday, and <em>Pending/Overdue</em> on or after payday.
          </span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {payrollData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Net Payroll</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(payrollData.summary.totalPayroll, currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Across {payrollData.summary.totalStaff} active staff
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              Total Salaries Paid
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(payrollData.summary.totalPaid, currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {payrollData.summary.paidCount} staff paid
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              Salaries Remaining
            </span>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(payrollData.summary.totalRemaining, currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {payrollData.summary.pendingCount} staff remaining
            </div>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : !payrollData || payrollData.payroll.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No staff to process"
          description="There are currently no active staff in the system."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Base Salary</th>
                  <th className="py-3.5 px-4">Loan Deductions</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment Details</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {payrollData.payroll.map((p) => (
                  <tr key={p.staff_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">
                        {p.department} • {p.job_title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.base_salary, currencySymbol)}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.deductions > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          -{formatCurrency(p.deductions, currencySymbol)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.net_pay, currencySymbol)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {p.status === 'Paid' ? (
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {p.payment_method} • {formatDate(p.payment_date)}
                          </div>
                          {p.note && (
                            <div className="text-slate-400 truncate max-w-xs text-[11px]">
                              {p.note}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unpaid</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'Paid' ? (
                          <button
                            onClick={() => handleOpenPay(p)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPay(p)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
                          >
                            Edit Payment
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenHistory(p.staff_id)}
                          title="View Payment History"
                          className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record / Edit Payment Modal */}
      {payingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Record Payment for {payingStaff.name}
              </h3>
              <button
                onClick={() => setPayingStaff(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pay breakdown card */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Monthly Salary:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(payingStaff.base_salary, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Advance/Loan Deductions:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(payingStaff.deductions, currencySymbol)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Net Pay Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(payingStaff.net_pay, currencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  placeholder="e.g. Reference #TX-9842"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingStaff(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-70 flex items-center gap-2"
                >
                  {payLoading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Payment History: {historyData?.staff?.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {historyData?.staff?.department} • {historyData?.staff?.job_title}
                </p>
              </div>
              <button
                onClick={() => { setHistoryStaff(null); setHistoryData(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              {historyLoading || !historyData ? (
                <div className="p-8 text-center text-slate-400">Loading history...</div>
              ) : historyData.history.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No payment history on record.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyData.history.map((h) => (
                    <div key={h.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {monthNames[h.month - 1]} {h.year}
                        </div>
                        <div className="text-xs text-slate-400">
                          {h.payment_method} on {formatDate(h.payment_date)} {h.note ? `• ${h.note}` : ''}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(h.net_pay, currencySymbol)}
                        </div>
                        {h.deductions > 0 && (
                          <div className="text-[11px] text-rose-500">
                            Deducted: -{formatCurrency(h.deductions, currencySymbol)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
