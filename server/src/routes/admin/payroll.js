const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const { getAllSettings } = require('../settings');

router.use(requireAuth, requireAdmin);

// Helper function to calculate status for an unpaid staff
function computeUnpaidStatus(paydayDay, year, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // If viewing a past month that wasn't paid, it's overdue
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Pending/Overdue';
  }

  // If viewing a future month
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    return 'Upcoming';
  }

  // Current month
  if (currentDay < paydayDay) {
    return 'Upcoming';
  } else {
    return 'Pending/Overdue';
  }
}

// GET /api/admin/payroll?year=YYYY&month=MM
router.get('/', (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

  const settings = getAllSettings();
  const paydayDay = settings.payday_day || 28;

  // Active staff list
  const staffList = db.prepare(`
    SELECT id, name, department, job_title, monthly_salary, status 
    FROM staff 
    WHERE status = 'ACTIVE'
    ORDER BY name ASC
  `).all();

  // Get existing payments for this year/month
  const payments = db.prepare(`
    SELECT * FROM salary_payments WHERE year = ? AND month = ?
  `).all(year, month);

  const paymentMap = {};
  payments.forEach(p => {
    paymentMap[p.staff_id] = p;
  });

  // Get active approved loans/advances for deductions
  const activeLoans = db.prepare(`
    SELECT staff_id, SUM(monthly_installment) AS total_installment
    FROM advance_requests
    WHERE status = 'APPROVED'
    GROUP BY staff_id
  `).all();

  const loanMap = {};
  activeLoans.forEach(l => {
    loanMap[l.staff_id] = l.total_installment;
  });

  const payrollList = staffList.map(st => {
    const payment = paymentMap[st.id];
    const defaultDeductions = loanMap[st.id] || 0;
    const baseSalary = st.monthly_salary;

    if (payment) {
      return {
        staff_id: st.id,
        name: st.name,
        department: st.department,
        job_title: st.job_title,
        base_salary: payment.base_salary,
        deductions: payment.deductions,
        net_pay: payment.net_pay,
        status: 'Paid',
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        note: payment.note,
        payment_id: payment.id,
        year,
        month
      };
    } else {
      const calculatedStatus = computeUnpaidStatus(paydayDay, year, month);
      const deductions = Math.min(defaultDeductions, baseSalary);
      const netPay = Math.max(0, baseSalary - deductions);

      return {
        staff_id: st.id,
        name: st.name,
        department: st.department,
        job_title: st.job_title,
        base_salary: baseSalary,
        deductions: deductions,
        net_pay: netPay,
        status: calculatedStatus, // 'Upcoming' or 'Pending/Overdue'
        payment_date: null,
        payment_method: null,
        note: null,
        payment_id: null,
        year,
        month
      };
    }
  });

  const totalBase = payrollList.reduce((acc, item) => acc + item.base_salary, 0);
  const totalNet = payrollList.reduce((acc, item) => acc + item.net_pay, 0);
  const totalPaid = payrollList.filter(item => item.status === 'Paid').reduce((acc, item) => acc + item.net_pay, 0);
  const totalRemaining = totalNet - totalPaid;

  res.json({
    year,
    month,
    paydayDay,
    summary: {
      totalStaff: payrollList.length,
      paidCount: payrollList.filter(item => item.status === 'Paid').length,
      pendingCount: payrollList.filter(item => item.status !== 'Paid').length,
      totalPayroll: totalNet,
      totalPaid,
      totalRemaining
    },
    payroll: payrollList
  });
});

// POST /api/admin/payroll/pay (Record payment)
router.post('/pay', (req, res) => {
  const {
    staff_id,
    year,
    month,
    base_salary,
    deductions = 0,
    payment_method = 'Bank Transfer',
    payment_date,
    note
  } = req.body;

  if (!staff_id || !year || !month) {
    return res.status(400).json({ error: 'staff_id, year, and month are required' });
  }

  const staff = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(staff_id);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const base = parseFloat(base_salary) || staff.monthly_salary;
  const ded = parseFloat(deductions) || 0;
  const net = Math.max(0, base - ded);
  const date = payment_date || new Date().toISOString().split('T')[0];

  const upsert = db.prepare(`
    INSERT INTO salary_payments (
      staff_id, year, month, base_salary, deductions, net_pay, status,
      payment_date, payment_method, note
    ) VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?, ?, ?)
    ON CONFLICT(staff_id, year, month) DO UPDATE SET
      base_salary = excluded.base_salary,
      deductions = excluded.deductions,
      net_pay = excluded.net_pay,
      status = 'PAID',
      payment_date = excluded.payment_date,
      payment_method = excluded.payment_method,
      note = excluded.note
  `);

  upsert.run(
    staff_id,
    parseInt(year, 10),
    parseInt(month, 10),
    base,
    ded,
    net,
    date,
    payment_method,
    note || null
  );

  const updated = db.prepare(`
    SELECT * FROM salary_payments WHERE staff_id = ? AND year = ? AND month = ?
  `).get(staff_id, year, month);

  res.json({
    message: 'Payment recorded successfully',
    payment: updated
  });
});

// GET /api/admin/payroll/history/:staffId (Payment history per staff member)
router.get('/history/:staffId', (req, res) => {
  const staff = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(req.params.staffId);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const history = db.prepare(`
    SELECT * FROM salary_payments 
    WHERE staff_id = ? 
    ORDER BY year DESC, month DESC
  `).all(req.params.staffId);

  res.json({
    staff,
    history
  });
});

module.exports = router;
