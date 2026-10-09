const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { getAllSettings } = require('../settings');

router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard
router.get('/', (req, res) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = String(currentMonth).padStart(2, '0');
  const startOfMonth = `${currentYear}-${monthStr}-01`;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const endOfMonth = `${currentYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const settings = getAllSettings();

  // 1. Total staff
  const staffCountRow = db.prepare(`SELECT COUNT(*) as count FROM staff WHERE status = 'ACTIVE'`).get();
  const totalStaff = staffCountRow ? staffCountRow.count : 0;

  // 2. Today's expenses
  const todayExpRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total 
    FROM expenses 
    WHERE expense_date = ?
  `).get(todayStr);
  const todayExpenses = todayExpRow ? todayExpRow.total : 0;

  // 3. This month's expenses
  const monthExpRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total 
    FROM expenses 
    WHERE expense_date >= ? AND expense_date <= ?
  `).get(startOfMonth, endOfMonth);
  const thisMonthExpenses = monthExpRow ? monthExpRow.total : 0;

  // 4. Salaries paid vs remaining this month
  const activeStaff = db.prepare(`
    SELECT id, monthly_salary FROM staff WHERE status = 'ACTIVE'
  `).all();

  const paidRows = db.prepare(`
    SELECT staff_id, net_pay FROM salary_payments WHERE year = ? AND month = ?
  `).all(currentYear, currentMonth);

  const paidMap = {};
  paidRows.forEach(p => {
    paidMap[p.staff_id] = p.net_pay;
  });

  // Calculate deductions from approved loans
  const loans = db.prepare(`
    SELECT staff_id, SUM(monthly_installment) AS total_installment 
    FROM advance_requests 
    WHERE status = 'APPROVED' 
    GROUP BY staff_id
  `).all();

  const loanMap = {};
  loans.forEach(l => {
    loanMap[l.staff_id] = l.total_installment;
  });

  let totalPaidSalary = 0;
  let totalRemainingSalary = 0;
  let paidCount = 0;
  let remainingCount = 0;

  activeStaff.forEach(st => {
    if (paidMap[st.id] !== undefined) {
      totalPaidSalary += paidMap[st.id];
      paidCount++;
    } else {
      const deduction = loanMap[st.id] || 0;
      const net = Math.max(0, st.monthly_salary - deduction);
      totalRemainingSalary += net;
      remainingCount++;
    }
  });

  // 5. Daily expenses for current month (Recharts Bar chart)
  const dailyExpensesRaw = db.prepare(`
    SELECT expense_date, SUM(amount) AS total 
    FROM expenses 
    WHERE expense_date >= ? AND expense_date <= ? 
    GROUP BY expense_date
  `).all(startOfMonth, endOfMonth);

  const dailyMap = {};
  dailyExpensesRaw.forEach(d => {
    dailyMap[d.expense_date] = d.total;
  });

  const dailyExpensesChart = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayPadded = String(day).padStart(2, '0');
    const fullDate = `${currentYear}-${monthStr}-${dayPadded}`;
    dailyExpensesChart.push({
      day: `Day ${day}`,
      date: fullDate,
      amount: dailyMap[fullDate] || 0
    });
  }

  // 6. Monthly expenses for the last 12 months (Recharts Bar/Line chart)
  const monthlyExpensesChart = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
    const targetY = targetDate.getFullYear();
    const targetM = targetDate.getMonth() + 1;
    const targetMStr = String(targetM).padStart(2, '0');
    const targetDays = new Date(targetY, targetM, 0).getDate();
    const mStart = `${targetY}-${targetMStr}-01`;
    const mEnd = `${targetY}-${targetMStr}-${String(targetDays).padStart(2, '0')}`;

    const mTotalRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total 
      FROM expenses 
      WHERE expense_date >= ? AND expense_date <= ?
    `).get(mStart, mEnd);

    monthlyExpensesChart.push({
      label: `${monthNames[targetM - 1]} ${String(targetY).slice(2)}`,
      month: monthNames[targetM - 1],
      year: targetY,
      amount: mTotalRow ? mTotalRow.total : 0
    });
  }

  // 7. Donut Chart Data (Paid vs Remaining)
  const salaryDonutChart = [
    { name: 'Paid', value: totalPaidSalary, count: paidCount, color: '#10b981' },
    { name: 'Remaining', value: totalRemainingSalary, count: remainingCount, color: '#6366f1' }
  ];

  // 8. Recent activity: pending requests and open complaints count
  const pendingRequestsCount = db.prepare(`SELECT COUNT(*) AS c FROM advance_requests WHERE status = 'PENDING'`).get().c;
  const openComplaintsCount = db.prepare(`SELECT COUNT(*) AS c FROM complaints WHERE status = 'OPEN'`).get().c;

  res.json({
    metrics: {
      totalStaff,
      todayExpenses,
      thisMonthExpenses,
      totalPaidSalary,
      totalRemainingSalary,
      paidCount,
      remainingCount,
      pendingRequestsCount,
      openComplaintsCount
    },
    charts: {
      dailyExpenses: dailyExpensesChart,
      monthlyExpenses: monthlyExpensesChart,
      salaryDonut: salaryDonutChart
    },
    settings
  });
});

module.exports = router;
