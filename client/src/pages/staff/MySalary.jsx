import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileCheck,
  Building2,
  Printer
} from 'lucide-react';

export default function MySalary() {
  const { user, settings } = useAuth();
  const currencySymbol = settings?.currency_symbol || '$';

  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fetchSalary = async () => {
    try {
      setLoading(true);
      const res = await api.getStaffSalary();
      setSalaryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 bg-white dark:bg-slate-900 rounded-2xl animate-pulse" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  const current = salaryData?.currentMonth;
  const history = salaryData?.history || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Salary & Payment Records</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Review your current compensation status, deduction details, and historical payslips
        </p>
      </div>

      {/* Current Month Active Card */}
      {current && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Pay Cycle ({monthNames[current.month - 1]} {current.year})
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(current.net_pay, currencySymbol)} Net Pay
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(current.status)}`}>
                {current.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs text-slate-400 font-medium">Base Contract Salary</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(current.base_salary, currencySymbol)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs text-slate-400 font-medium">Advance / Loan Deductions</span>
              <div className="text-base font-bold text-rose-500 mt-0.5">
                {current.deductions > 0 ? `-${formatCurrency(current.deductions, currencySymbol)}` : `${currencySymbol}0.00`}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-xs text-slate-400 font-medium">Payment Schedule / Date</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {current.status === 'Paid' ? formatDate(current.payment_date) : `Payday: Day ${current.paydayDay}`}
              </div>
            </div>
          </div>

          {current.note && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300">
              <strong>HR Note:</strong> {current.note}
            </div>
          )}
        </div>
      )}

      {/* Payslip History Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Salary History & Payslips
        </h3>

        {history.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No past payments recorded yet"
            description="Your salary disbursement records will show up here once processed by HR."
          />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Pay Period</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Base Salary</th>
                    <th className="py-3.5 px-4">Deductions</th>
                    <th className="py-3.5 px-4">Net Paid</th>
                    <th className="py-3.5 px-4 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {monthNames[h.month - 1]} {h.year}
                      </td>

                      <td className="py-3.5 px-4">
                        {formatDate(h.payment_date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                          {h.payment_method}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {formatCurrency(h.base_salary, currencySymbol)}
                      </td>

                      <td className="py-3.5 px-4">
                        {h.deductions > 0 ? (
                          <span className="text-rose-500 font-semibold">
                            -{formatCurrency(h.deductions, currencySymbol)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(h.net_pay, currencySymbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayslip(h)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payslip Modal View */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {settings?.company_name || 'Apex HR'}
                  </h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Official Payslip Voucher</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                PAID
              </span>
            </div>

            <div className="my-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Employee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pay Period:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {monthNames[selectedPayslip.month - 1]} {selectedPayslip.year}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Department:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{user?.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Date:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatDate(selectedPayslip.payment_date)}</span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Basic Monthly Earnings:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(selectedPayslip.base_salary, currencySymbol)}
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Advance/Loan Deduction:</span>
                  <span className="font-bold text-rose-500">
                    -{formatCurrency(selectedPayslip.deductions, currencySymbol)}
                  </span>
                </div>
                <div className="p-3 flex justify-between bg-slate-50 dark:bg-slate-800/80 text-sm font-bold">
                  <span className="text-slate-900 dark:text-white">Net Disbursed Amount:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedPayslip.net_pay, currencySymbol)}
                  </span>
                </div>
              </div>

              {selectedPayslip.note && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500">
                  <strong>Note:</strong> {selectedPayslip.note}
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
