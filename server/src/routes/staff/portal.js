const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireStaff } = require('../../middleware/auth');
const { getAllSettings } = require('../settings');

router.use(requireAuth, requireStaff);

// Middleware to ensure user is linked to a staff record
function ensureStaffProfile(req, res, next) {
  if (!req.user.staffId) {
    return res.status(404).json({ error: 'No staff record linked to this user' });
  }
  next();
}

router.use(ensureStaffProfile);

// GET /api/staff/profile
router.get('/profile', (req, res) => {
  const staff = db.prepare(`
    SELECT s.*, u.username 
    FROM staff s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.id = ?
  `).get(req.user.staffId);

  res.json(staff);
});

// GET /api/staff/salary (Current month salary status + payment history)
router.get('/salary', (req, res) => {
  const staffId = req.user.staffId;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const settings = getAllSettings();
  const paydayDay = settings.payday_day || 28;

  const staff = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(staffId);

  // Check current month payment
  const currentPayment = db.prepare(`
    SELECT * FROM salary_payments 
    WHERE staff_id = ? AND year = ? AND month = ?
  `).get(staffId, currentYear, currentMonth);

  // Active loan deduction
  const activeLoan = db.prepare(`
    SELECT SUM(monthly_installment) AS deduction 
    FROM advance_requests 
    WHERE staff_id = ? AND status = 'APPROVED'
  `).get(staffId);

  const deductions = activeLoan ? (activeLoan.deduction || 0) : 0;
  const estimatedNet = Math.max(0, staff.monthly_salary - deductions);

  let currentStatus = 'Paid';
  if (!currentPayment) {
    if (currentDay < paydayDay) {
      currentStatus = 'Upcoming';
    } else {
      currentStatus = 'Pending/Overdue';
    }
  }

  // Full history
  const history = db.prepare(`
    SELECT * FROM salary_payments 
    WHERE staff_id = ? 
    ORDER BY year DESC, month DESC
  `).all(staffId);

  res.json({
    currentMonth: {
      year: currentYear,
      month: currentMonth,
      base_salary: staff.monthly_salary,
      deductions: currentPayment ? currentPayment.deductions : deductions,
      net_pay: currentPayment ? currentPayment.net_pay : estimatedNet,
      status: currentPayment ? 'Paid' : currentStatus,
      payment_date: currentPayment ? currentPayment.payment_date : null,
      payment_method: currentPayment ? currentPayment.payment_method : null,
      note: currentPayment ? currentPayment.note : null,
      paydayDay
    },
    history,
    currencySymbol: settings.currency_symbol || '$'
  });
});

// GET /api/staff/requests (My loan/advance requests)
router.get('/requests', (req, res) => {
  const requests = db.prepare(`
    SELECT * FROM advance_requests 
    WHERE staff_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.staffId);

  res.json(requests);
});

// POST /api/staff/requests (Submit new loan/advance request)
router.post('/requests', (req, res) => {
  const { type = 'ADVANCE', amount, months, reason } = req.body;

  if (!amount || !months || !reason) {
    return res.status(400).json({ error: 'Amount, repayment months, and reason are required' });
  }

  const settings = getAllSettings();
  const maxMonths = settings.max_advance_months || 3;
  const numMonths = parseInt(months, 10);

  if (numMonths < 1 || numMonths > maxMonths) {
    return res.status(400).json({
      error: `Repayment duration cannot exceed ${maxMonths} months (configured by HR)`
    });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  const monthlyInstallment = parseFloat((amt / numMonths).toFixed(2));

  const result = db.prepare(`
    INSERT INTO advance_requests (
      staff_id, type, amount, months, monthly_installment, reason, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(req.user.staffId, type, amt, numMonths, monthlyInstallment, reason.trim());

  const newRequest = db.prepare(`SELECT * FROM advance_requests WHERE id = ?`).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Request submitted successfully to HR',
    request: newRequest
  });
});

// GET /api/staff/complaints (My complaints)
router.get('/complaints', (req, res) => {
  const complaints = db.prepare(`
    SELECT * FROM complaints 
    WHERE staff_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.staffId);

  res.json(complaints);
});

// POST /api/staff/complaints (File new complaint)
router.post('/complaints', (req, res) => {
  const { type, description } = req.body;

  if (!type || !description) {
    return res.status(400).json({ error: 'Complaint type and description are required' });
  }

  const result = db.prepare(`
    INSERT INTO complaints (staff_id, type, description, status)
    VALUES (?, ?, ?, 'OPEN')
  `).run(req.user.staffId, type.trim(), description.trim());

  const newComplaint = db.prepare(`SELECT * FROM complaints WHERE id = ?`).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Complaint submitted to HR management',
    complaint: newComplaint
  });
});

// GET /api/staff/attendance (My attendance summary + records)
router.get('/attendance', (req, res) => {
  const staffId = req.user.staffId;
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  const records = db.prepare(`
    SELECT * FROM attendance 
    WHERE staff_id = ? AND date >= ? AND date <= ? 
    ORDER BY date DESC
  `).all(staffId, startDate, endDate);

  const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0, TOTAL: 0 };
  records.forEach(r => {
    if (counts[r.status] !== undefined) {
      counts[r.status]++;
      counts.TOTAL++;
    }
  });

  res.json({
    year,
    month,
    daysInMonth,
    counts,
    records
  });
});

module.exports = router;
