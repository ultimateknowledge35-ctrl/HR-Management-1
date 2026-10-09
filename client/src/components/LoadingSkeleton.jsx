import React from 'react';

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 animate-pulse">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
        </div>
      ))}
    </div>
  );
}
