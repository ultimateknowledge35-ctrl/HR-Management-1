const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure DB initialization and auto-seed if empty
const db = require('./config/db');
const { seedDatabase } = require('./seed');

try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userCount || userCount.count === 0) {
    console.log('Database is empty. Auto-seeding initial admin and demo data...');
    seedDatabase();
  }
} catch (err) {
  console.error('Auto-seed check error:', err.message);
}

const authRoutes = require('./routes/auth');
const { router: settingsRoutes } = require('./routes/settings');
const adminStaffRoutes = require('./routes/admin/staff');
const adminAttendanceRoutes = require('./routes/admin/attendance');
const adminPayrollRoutes = require('./routes/admin/payroll');
const adminRequestsRoutes = require('./routes/admin/requests');
const adminComplaintsRoutes = require('./routes/admin/complaints');
const adminExpensesRoutes = require('./routes/admin/expenses');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const staffPortalRoutes = require('./routes/staff/portal');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/payroll', adminPayrollRoutes);
app.use('/api/admin/requests', adminRequestsRoutes);
app.use('/api/admin/complaints', adminComplaintsRoutes);
app.use('/api/admin/expenses', adminExpensesRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/staff', staffPortalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Frontend Production Build if available
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HRMS Backend Server running on port ${PORT}`);
});
