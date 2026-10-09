import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Settings as SettingsIcon,
  Save,
  Building,
  DollarSign,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function Settings() {
  const { settings, updateGlobalSettings } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    company_name: settings?.company_name || 'Apex HR Systems',
    currency_symbol: settings?.currency_symbol || '$',
    payday_day: settings?.payday_day || 28,
    max_advance_months: settings?.max_advance_months || 3
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || 'Apex HR Systems',
        currency_symbol: settings.currency_symbol || '$',
        payday_day: settings.payday_day || 28,
        max_advance_months: settings.max_advance_months || 3
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.updateSettings(formData);
      updateGlobalSettings(res.settings);
      addToast('System settings updated successfully');
    } catch (err) {
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure company branding, salary paydays, and advance limit policies
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <span>Company / Organization Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g. Acme Corporation"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Appears on the login portal, sidebar navigation, and payslip headers.
            </p>
          </div>

          {/* Currency Symbol */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Currency Symbol</span>
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={formData.currency_symbol}
              onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
              placeholder="$, €, £, ₹, etc."
              className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Used across all payroll calculation tables, expense ledgers, and dashboard charts.
            </p>
          </div>

          {/* Payday Date */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Salary Payday (Day of Month: 1 - 31)</span>
            </label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={formData.payday_day}
              onChange={(e) => setFormData({ ...formData, payday_day: parseInt(e.target.value, 10) || '' })}
              className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Unpaid salaries prior to this day show status as <strong>"Upcoming"</strong>. On or after this day, unpaid salaries automatically transition to <strong>"Pending/Overdue"</strong>.
            </p>
          </div>

          {/* Max Loan / Advance Repayment Months */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Maximum Advance / Loan Repayment Duration</span>
            </label>
            <div className="flex gap-4">
              {[2, 3].map((num) => (
                <label
                  key={num}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    formData.max_advance_months === num
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="max_advance_months"
                    checked={formData.max_advance_months === num}
                    onChange={() => setFormData({ ...formData, max_advance_months: num })}
                    className="accent-indigo-600"
                  />
                  <span>{num} Months Maximum</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Restricts staff submission inputs so they cannot request installments exceeding this limit.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
