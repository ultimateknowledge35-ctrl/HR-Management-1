import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Calculator
} from 'lucide-react';

export default function MyRequests() {
  const { settings } = useAuth();
  const { addToast } = useToast();
  const currencySymbol = settings?.currency_symbol || '$';
  const maxMonths = settings?.max_advance_months || 3;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState('ADVANCE');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(1);
  const [reason, setReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getStaffRequests();
      setRequests(data);
    } catch (err) {
      addToast(err.message || 'Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const parsedAmount = parseFloat(amount) || 0;
  const calculatedInstallment = parsedAmount > 0 && months > 0
    ? (parsedAmount / months).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parsedAmount <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason for the request', 'error');
      return;
    }
    if (months > maxMonths) {
      addToast(`Repayment duration cannot exceed ${maxMonths} months`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitStaffRequest({
        type,
        amount: parsedAmount,
        months,
        reason: reason.trim()
      });

      addToast('Request submitted successfully for HR management review');
      setAmount('');
      setReason('');
      setMonths(1);
      fetchRequests();
    } catch (err) {
      addToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Loan & Advance Requests</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Request early salary advances or personal equipment loans with installment repayment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              New Application
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                Request Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('ADVANCE')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    type === 'ADVANCE'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Advance Salary
                </button>
                <button
                  type="button"
                  onClick={() => setType('LOAN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    type === 'LOAN'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Staff Loan
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Requested Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Repayment Months (Max: {maxMonths} mo) *
              </label>
              <select
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                {Array.from({ length: maxMonths }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} Month{i > 0 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Live installment calculation */}
            {parsedAmount > 0 && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-500" />
                  Monthly Installment:
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatCurrency(calculatedInstallment, currencySymbol)}/mo
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Detailed Reason *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the purpose of this request..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Submit Application</span>
            </button>
          </form>
        </div>

        {/* Previous Applications List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Application History
          </h3>

          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No applications submitted"
              description="Fill out the form on the left to submit a new advance or loan request."
            />
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                        {r.type}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-base">
                          {formatCurrency(r.amount, currencySymbol)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.months} months duration • {formatCurrency(r.monthly_installment, currencySymbol)}/mo
                        </div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    "{r.reason}"
                  </p>

                  {r.admin_note && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                        HR Management Note:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {r.admin_note}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Submitted on {formatDate(r.created_at)}</span>
                    {r.reviewed_at && <span>Reviewed on {formatDate(r.reviewed_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
