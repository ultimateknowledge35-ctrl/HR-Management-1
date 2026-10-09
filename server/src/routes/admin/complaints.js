const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/complaints
router.get('/', (req, res) => {
  const { status, type } = req.query;

  let query = `
    SELECT 
      c.*,
      s.name AS staff_name,
      s.department,
      s.job_title
    FROM complaints c
    JOIN staff s ON c.staff_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (type && type !== 'ALL') {
    query += ` AND c.type = ?`;
    params.push(type);
  }

  query += ` ORDER BY CASE c.status WHEN 'OPEN' THEN 1 WHEN 'IN_REVIEW' THEN 2 ELSE 3 END, c.created_at DESC`;

  const complaints = db.prepare(query).all(...params);
  res.json(complaints);
});

// PUT /api/admin/complaints/:id (Update status and admin response)
router.put('/:id', (req, res) => {
  const { status, admin_response } = req.body;
  const validStatuses = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid complaint status' });
  }

  const existing = db.prepare(`SELECT * FROM complaints WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  db.prepare(`
    UPDATE complaints SET
      status = COALESCE(?, status),
      admin_response = COALESCE(?, admin_response),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status || null, admin_response !== undefined ? admin_response : null, req.params.id);

  const updated = db.prepare(`
    SELECT 
      c.*,
      s.name AS staff_name,
      s.department
    FROM complaints c
    JOIN staff s ON c.staff_id = s.id
    WHERE c.id = ?
  `).get(req.params.id);

  res.json({
    message: 'Complaint updated successfully',
    complaint: updated
  });
});

module.exports = router;
