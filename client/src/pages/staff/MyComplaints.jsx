import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  MessageSquareWarning,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';

export default function MyComplaints() {
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [type, setType] = useState('Workplace');
  const [description, setDescription] = useState('');

  const complaintTypes = [
    'Workplace',
    'Facilities',
    'Equipment & IT',
    'Payroll Inquiry',
    'Interpersonal',
    'Health & Safety',
    'Other'
  ];

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getStaffComplaints();
      setComplaints(data);
    } catch (err) {
      addToast(err.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast('Please describe your grievance or issue', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitStaffComplaint({
        type,
        description: description.trim()
      });

      addToast('Grievance logged confidentially with HR');
      setDescription('');
      fetchComplaints();
    } catch (err) {
      addToast(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confidential Grievance Portal</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          File workplace issues, facility requests, or safety concerns directly with HR
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              File New Grievance
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Category *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {complaintTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                Description of Concern *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, location, or requested assistance..."
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
                <Send className="w-4 h-4" />
              )}
              <span>Submit to HR</span>
            </button>
          </form>
        </div>

        {/* Complaints History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            My Filed Grievances
          </h3>

          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={MessageSquareWarning}
              title="No grievances recorded"
              description="You have not filed any complaints or issues."
            />
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {c.type}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                    {c.description}
                  </p>

                  {c.admin_response && (
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                        HR Management Response:
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">
                        {c.admin_response}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    Filed on {formatDate(c.created_at)}
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
