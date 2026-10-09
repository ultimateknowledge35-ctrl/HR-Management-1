const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/requests (List all advance & loan requests)
router.get('/', (req, res) => {
  const { status, type } = req.query;

  let query = `
    SELECT 
      r.*,
      s.name AS staff_name,
      s.department,
      s.job_title,
      s.monthly_salary
    FROM advance_requests r
    JOIN staff s ON r.staff_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND r.status = ?`;
    params.push(status);
  }

  if (type && type !== 'ALL') {
    query += ` AND r.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY CASE r.status WHEN 'PENDING' THEN 1 WHEN 'APPROVED' THEN 2 ELSE 3 END, r.created_at DESC`;

  const requests = db.prepare(query).all(...params);
  res.json(requests);
});

// PUT /api/admin/requests/:id (Approve or Reject with optional note)
router.put('/:id', (req, res) => {
  const { status, admin_note } = req.body;
  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
  }

  const existing = db.prepare(`SELECT * FROM advance_requests WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Request not found' });
  }

  db.prepare(`
    UPDATE advance_requests SET
      status = ?,
      admin_note = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, admin_note || null, req.params.id);

  const updated = db.prepare(`
    SELECT 
      r.*,
      s.name AS staff_name,
      s.department
    FROM advance_requests r
    JOIN staff s ON r.staff_id = s.id
    WHERE r.id = ?
  `).get(req.params.id);

  res.json({
    message: `Request ${status.toLowerCase()} successfully`,
    request: updated
  });
});

module.exports = router;
