export function formatCurrency(amount, symbol = '$') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${symbol}0.00`;
  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'PAID':
    case 'Paid':
    case 'PRESENT':
    case 'RESOLVED':
    case 'APPROVED':
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'PENDING':
    case 'Pending':
    case 'Pending/Overdue':
    case 'ABSENT':
    case 'REJECTED':
    case 'INACTIVE':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    case 'LATE':
    case 'IN_REVIEW':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case 'Upcoming':
    case 'OPEN':
    case 'LEAVE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  }
}
