const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { hashPassword } = require('../../utils/auth');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/staff (Searchable, filterable)
router.get('/', (req, res) => {
  const { q, department, status } = req.query;

  let query = `
    SELECT 
      s.id, s.user_id, s.name, s.email, s.phone, s.address, 
      s.department, s.job_title, s.join_date, s.monthly_salary, 
      s.status, s.created_at,
      u.username
    FROM staff s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (department && department !== 'ALL') {
    query += ` AND s.department = ?`;
    params.push(department);
  }

  if (status && status !== 'ALL') {
    query += ` AND s.status = ?`;
    params.push(status);
  }

  if (q && q.trim()) {
    query += ` AND (
      s.name LIKE ? OR 
      s.email LIKE ? OR 
      s.phone LIKE ? OR 
      s.job_title LIKE ? OR 
      u.username LIKE ?
    )`;
    const wildcard = `%${q.trim()}%`;
    params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
  }

  query += ` ORDER BY s.status ASC, s.name ASC`;

  const staffList = db.prepare(query).all(...params);
  res.json(staffList);
});

// GET /api/admin/staff/departments (List distinct departments)
router.get('/departments', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT department FROM staff ORDER BY department ASC`).all();
  res.json(rows.map(r => r.department));
});

// GET /api/admin/staff/:id
router.get('/:id', (req, res) => {
  const staff = db.prepare(`
    SELECT s.*, u.username 
    FROM staff s 
    LEFT JOIN users u ON s.user_id = u.id 
    WHERE s.id = ?
  `).get(req.params.id);

  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  res.json(staff);
});

// POST /api/admin/staff (Create staff + user)
router.post('/', (req, res) => {
  const {
    name, email, phone, address, department, job_title,
    join_date, monthly_salary, username, password, status
  } = req.body;

  if (!name || !department || !job_title || !monthly_salary || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if username exists
  const existingUser = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username.trim());
  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  // Check email uniqueness if provided
  if (email && email.trim()) {
    const existingEmail = db.prepare(`SELECT id FROM staff WHERE email = ?`).get(email.trim());
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already assigned to another staff member' });
    }
  }

  const createTx = db.transaction(() => {
    const password_hash = hashPassword(password);
    const userResult = db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, 'STAFF')
    `).run(username.trim(), password_hash);

    const staffResult = db.prepare(`
      INSERT INTO staff (
        user_id, name, email, phone, address, department, 
        job_title, join_date, monthly_salary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userResult.lastInsertRowid,
      name.trim(),
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      department.trim(),
      job_title.trim(),
      join_date || new Date().toISOString().split('T')[0],
      parseFloat(monthly_salary) || 0,
      status || 'ACTIVE'
    );

    return {
      staffId: staffResult.lastInsertRowid,
      userId: userResult.lastInsertRowid
    };
  });

  try {
    const result = createTx();
    const createdStaff = db.prepare(`
      SELECT s.*, u.username 
      FROM staff s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `).get(result.staffId);

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: createdStaff
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create staff member' });
  }
});

// PUT /api/admin/staff/:id
router.put('/:id', (req, res) => {
  const staffId = req.params.id;
  const {
    name, email, phone, address, department, job_title,
    join_date, monthly_salary, username, status
  } = req.body;

  const current = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(staffId);
  if (!current) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  // Check username uniqueness if changed
  if (username && username.trim()) {
    const userWithSameName = db.prepare(`SELECT id FROM users WHERE username = ? AND id != ?`).get(
      username.trim(),
      current.user_id
    );
    if (userWithSameName) {
      return res.status(400).json({ error: 'Username is already in use' });
    }
  }

  // Check email uniqueness if changed
  if (email && email.trim()) {
    const emailConflict = db.prepare(`SELECT id FROM staff WHERE email = ? AND id != ?`).get(
      email.trim(),
      staffId
    );
    if (emailConflict) {
      return res.status(400).json({ error: 'Email is already in use by another staff member' });
    }
  }

  const updateTx = db.transaction(() => {
    if (username && username.trim() && current.user_id) {
      db.prepare(`UPDATE users SET username = ? WHERE id = ?`).run(username.trim(), current.user_id);
    }

    db.prepare(`
      UPDATE staff SET 
        name = ?,
        email = ?,
        phone = ?,
        address = ?,
        department = ?,
        job_title = ?,
        join_date = ?,
        monthly_salary = ?,
        status = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : current.name,
      email !== undefined ? (email ? email.trim() : null) : current.email,
      phone !== undefined ? (phone ? phone.trim() : null) : current.phone,
      address !== undefined ? (address ? address.trim() : null) : current.address,
      department !== undefined ? department.trim() : current.department,
      job_title !== undefined ? job_title.trim() : current.job_title,
      join_date !== undefined ? join_date : current.join_date,
      monthly_salary !== undefined ? parseFloat(monthly_salary) : current.monthly_salary,
      status !== undefined ? status : current.status,
      staffId
    );
  });

  try {
    updateTx();
    const updatedStaff = db.prepare(`
      SELECT s.*, u.username 
      FROM staff s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.id = ?
    `).get(staffId);

    res.json({
      message: 'Staff updated successfully',
      staff: updatedStaff
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update staff' });
  }
});

// DELETE /api/admin/staff/:id
router.delete('/:id', (req, res) => {
  const staffId = req.params.id;
  const current = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(staffId);
  if (!current) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const deleteTx = db.transaction(() => {
    // Delete staff record
    db.prepare(`DELETE FROM staff WHERE id = ?`).run(staffId);
    // Delete linked user if any
    if (current.user_id) {
      db.prepare(`DELETE FROM users WHERE id = ?`).run(current.user_id);
    }
  });

  try {
    deleteTx();
    res.json({ message: 'Staff member and associated user account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete staff member' });
  }
});

module.exports = router;
