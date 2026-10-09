import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { getStatusBadgeClass } from '../../utils/formatters';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import {
  CalendarCheck,
  CheckCheck,
  Calendar as CalendarIcon,
  Clock,
  UserX,
  FileCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Grid
} from 'lucide-react';

export default function Attendance() {
  const { addToast } = useToast();

  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Month navigation for monthly view
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);

  const fetchDaily = async () => {
    try {
      setLoading(true);
      const res = await api.getDailyAttendance(selectedDate);
      setDailyRecords(res.records || []);
    } catch (err) {
      addToast(err.message || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    try {
      setLoading(true);
      const res = await api.getMonthlyAttendanceSummary(currentYear, currentMonth);
      setMonthlySummary(res);
    } catch (err) {
      addToast(err.message || 'Failed to load monthly summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDaily();
    } else {
      fetchMonthly();
    }
  }, [viewMode, selectedDate, currentYear, currentMonth]);

  const handleUpdateStatus = async (staffId, status, note = '') => {
    try {
      await api.markAttendance({
        staff_id: staffId,
        date: selectedDate,
        status,
        note
      });
      // Optimistic update local state
      setDailyRecords(prev =>
        prev.map(r => r.staff_id === staffId ? { ...r, status, note: note || r.note } : r)
      );
      addToast(`Attendance updated to ${status}`);
    } catch (err) {
      addToast(err.message || 'Failed to update attendance', 'error');
    }
  };

  const handleMarkAllPresent = async () => {
    try {
      setActionLoading(true);
      const res = await api.markAllPresent(selectedDate);
      addToast(res.message);
      fetchDaily();
    } catch (err) {
      addToast(err.message || 'Failed to mark all present', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Daily stats breakdown
  const presentCount = dailyRecords.filter(r => r.status === 'PRESENT').length;
  const lateCount = dailyRecords.filter(r => r.status === 'LATE').length;
  const absentCount = dailyRecords.filter(r => r.status === 'ABSENT').length;
  const leaveCount = dailyRecords.filter(r => r.status === 'LEAVE').length;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Tracker</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor daily logs, mark status, and review monthly staff attendance
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Daily Log</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Monthly Grid</span>
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        /* DAILY LOG VIEW */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Date Picker */}
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {presentCount} Present
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                {lateCount} Late
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                {absentCount} Absent
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                {leaveCount} Leave
              </span>
            </div>

            {/* Mark All Present Shortcut */}
            <button
              onClick={handleMarkAllPresent}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-70"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>
          </div>

          {/* Daily Table */}
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : dailyRecords.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No active staff found"
              description="Make sure you have active staff registered in the system."
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4">Quick Toggle</th>
                      <th className="py-3.5 px-4">Note / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {dailyRecords.map((r) => (
                      <tr key={r.staff_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.job_title}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {r.department}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(r.status)}`}>
                            {r.status}
                          </span>
                        </td>

                        {/* Quick Toggle Buttons */}
                        <td className="py-3 px-4">
                          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                            {['PRESENT', 'LATE', 'ABSENT', 'LEAVE'].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(r.staff_id, st, r.note)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  r.status === st
                                    ? st === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st === 'LATE'
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : st === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {st === 'PRESENT' ? 'P' : st === 'LATE' ? 'L' : st === 'ABSENT' ? 'A' : 'Lv'}
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* Note Input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            defaultValue={r.note || ''}
                            placeholder="Add optional note..."
                            onBlur={(e) => {
                              if (e.target.value !== (r.note || '')) {
                                handleUpdateStatus(r.staff_id, r.status === 'UNMARKED' ? 'PRESENT' : r.status, e.target.value);
                              }
                            }}
                            className="w-full max-w-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MONTHLY SUMMARY / CALENDAR GRID VIEW */
        <div className="space-y-4">
          {/* Month Selector Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {monthNames[currentMonth - 1]} {currentYear} Attendance Matrix
            </h3>

            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading || !monthlySummary ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Staff</th>
                      <th className="py-3 px-2 text-center">Present</th>
                      <th className="py-3 px-2 text-center">Late</th>
                      <th className="py-3 px-2 text-center">Absent</th>
                      <th className="py-3 px-2 text-center">Leave</th>
                      {Array.from({ length: monthlySummary.daysInMonth }).map((_, d) => (
                        <th key={d + 1} className="py-3 px-1 text-center min-w-[24px]">
                          {d + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {monthlySummary.summary.map((item) => (
                      <tr key={item.staff.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white z-10 whitespace-nowrap">
                          {item.staff.name}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                          {item.counts.PRESENT}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-amber-600">
                          {item.counts.LATE}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-rose-600">
                          {item.counts.ABSENT}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-blue-600">
                          {item.counts.LEAVE}
                        </td>

                        {Array.from({ length: monthlySummary.daysInMonth }).map((_, d) => {
                          const dayNum = d + 1;
                          const st = item.days[dayNum];
                          let cellColor = 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600';
                          let label = '-';

                          if (st === 'PRESENT') {
                            cellColor = 'bg-emerald-500 text-white';
                            label = 'P';
                          } else if (st === 'LATE') {
                            cellColor = 'bg-amber-500 text-white';
                            label = 'L';
                          } else if (st === 'ABSENT') {
                            cellColor = 'bg-rose-500 text-white';
                            label = 'A';
                          } else if (st === 'LEAVE') {
                            cellColor = 'bg-blue-500 text-white';
                            label = 'Lv';
                          }

                          return (
                            <td key={dayNum} className="py-2.5 px-1 text-center">
                              <span
                                title={`Day ${dayNum}: ${st || 'Unmarked'}`}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${cellColor}`}
                              >
                                {label}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
