const { verifyToken } = require('../utils/auth');
const db = require('../config/db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    // Fetch user and linked staff info if any
    const user = db.prepare(`SELECT id, username, role FROM users WHERE id = ?`).get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired' });
    }

    req.user = user;
    if (user.role === 'STAFF') {
      const staff = db.prepare(`SELECT * FROM staff WHERE user_id = ?`).get(user.id);
      if (staff) {
        req.user.staffId = staff.id;
        req.user.staff = staff;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.user || req.user.role !== 'STAFF') {
    return res.status(403).json({ error: 'Forbidden: Staff access required' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireStaff,
};
