const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { comparePassword, hashPassword, generateToken } = require('../utils/auth');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = comparePassword(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let staffProfile = null;
  if (user.role === 'STAFF') {
    staffProfile = db.prepare(`SELECT * FROM staff WHERE user_id = ?`).get(user.id);
  }

  const token = generateToken({ id: user.id, username: user.username, role: user.role });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      staffId: staffProfile ? staffProfile.id : null,
      name: staffProfile ? staffProfile.name : 'Administrator',
      email: staffProfile ? staffProfile.email : null,
      department: staffProfile ? staffProfile.department : null,
      jobTitle: staffProfile ? staffProfile.job_title : null,
    }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  let staffProfile = null;
  if (req.user.role === 'STAFF') {
    staffProfile = db.prepare(`SELECT * FROM staff WHERE user_id = ?`).get(req.user.id);
  }

  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      staffId: staffProfile ? staffProfile.id : null,
      name: staffProfile ? staffProfile.name : 'Administrator',
      email: staffProfile ? staffProfile.email : null,
      department: staffProfile ? staffProfile.department : null,
      jobTitle: staffProfile ? staffProfile.job_title : null,
    }
  });
});

// PUT /api/auth/change-password (User changes own password)
router.put('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (!comparePassword(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Incorrect current password' });
  }

  const newHash = hashPassword(newPassword);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(newHash, req.user.id);

  res.json({ message: 'Password updated successfully' });
});

// POST /api/auth/reset-password (Admin resets any user password)
router.post('/reset-password', requireAuth, requireAdmin, (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'User ID and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  const newHash = hashPassword(newPassword);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(newHash, userId);

  res.json({ message: `Password for ${targetUser.username} has been reset successfully` });
});

module.exports = router;
