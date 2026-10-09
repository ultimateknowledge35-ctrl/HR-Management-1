const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/attendance/daily?date=YYYY-MM-DD
router.get('/daily', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT 
      s.id AS staff_id,
      s.name,
      s.department,
      s.job_title,
      s.status AS staff_status,
      a.id AS attendance_id,
      a.date,
      COALESCE(a.status, 'UNMARKED') AS status,
      a.note,
      a.updated_at
    FROM staff s
    LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = ?
    WHERE s.status = 'ACTIVE'
    ORDER BY s.name ASC
  `).all(date);

  res.json({
    date,
    records: rows
  });
});

// POST /api/admin/attendance (Record or update single staff attendance)
router.post('/', (req, res) => {
  const { staff_id, date, status, note } = req.body;
  if (!staff_id || !date || !status) {
    return res.status(400).json({ error: 'staff_id, date, and status are required' });
  }

  const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid attendance status' });
  }

  db.prepare(`
    INSERT INTO attendance (staff_id, date, status, note, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(staff_id, date) DO UPDATE SET
      status = excluded.status,
      note = excluded.note,
      updated_at = CURRENT_TIMESTAMP
  `).run(staff_id, date, status, note || null);

  const updatedRecord = db.prepare(`
    SELECT a.*, s.name, s.department 
    FROM attendance a 
    JOIN staff s ON a.staff_id = s.id 
    WHERE a.staff_id = ? AND a.date = ?
  `).get(staff_id, date);

  res.json({
    message: 'Attendance recorded successfully',
    record: updatedRecord
  });
});

// POST /api/admin/attendance/mark-all-present
router.post('/mark-all-present', (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];

  const activeStaff = db.prepare(`SELECT id FROM staff WHERE status = 'ACTIVE'`).all();
  if (activeStaff.length === 0) {
    return res.json({ message: 'No active staff found', markedCount: 0 });
  }

  const upsert = db.prepare(`
    INSERT INTO attendance (staff_id, date, status, note, updated_at)
    VALUES (?, ?, 'PRESENT', 'Auto marked present', CURRENT_TIMESTAMP)
    ON CONFLICT(staff_id, date) DO UPDATE SET
      status = 'PRESENT',
      note = 'Auto marked present',
      updated_at = CURRENT_TIMESTAMP
  `);

  const markAllTx = db.transaction(() => {
    for (const staff of activeStaff) {
      upsert.run(staff.id, date);
    }
  });

  markAllTx();

  res.json({
    message: `Marked all ${activeStaff.length} active staff as Present for ${date}`,
    markedCount: activeStaff.length
  });
});

// GET /api/admin/attendance/monthly?year=YYYY&month=MM
router.get('/monthly', (req, res) => {
  const today = new Date();
  const year = parseInt(req.query.year, 10) || today.getFullYear();
  const month = parseInt(req.query.month, 10) || (today.getMonth() + 1);

  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const staffList = db.prepare(`
    SELECT id, name, department, job_title 
    FROM staff 
    WHERE status = 'ACTIVE'
    ORDER BY name ASC
  `).all();

  const attendanceRecords = db.prepare(`
    SELECT staff_id, date, status, note 
    FROM attendance 
    WHERE date >= ? AND date <= ?
  `).all(startDate, endDate);

  // Group records by staff
  const staffMap = {};
  staffList.forEach(s => {
    staffMap[s.id] = {
      staff: s,
      counts: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0, TOTAL: 0 },
      days: {}
    };
  });

  attendanceRecords.forEach(rec => {
    if (staffMap[rec.staff_id]) {
      const dayNum = parseInt(rec.date.split('-')[2], 10);
      staffMap[rec.staff_id].days[dayNum] = rec.status;
      if (staffMap[rec.staff_id].counts[rec.status] !== undefined) {
        staffMap[rec.staff_id].counts[rec.status]++;
        staffMap[rec.staff_id].counts.TOTAL++;
      }
    }
  });

  res.json({
    year,
    month,
    daysInMonth: lastDay,
    summary: Object.values(staffMap)
  });
});

module.exports = router;
