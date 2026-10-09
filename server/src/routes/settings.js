const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function getAllSettings() {
  const rows = db.prepare(`SELECT key, value FROM settings`).all();
  const settings = {
    company_name: 'Apex HR Systems',
    currency_symbol: '$',
    payday_day: 28,
    max_advance_months: 3
  };
  rows.forEach(r => {
    if (r.key === 'payday_day' || r.key === 'max_advance_months') {
      settings[r.key] = parseInt(r.value, 10) || settings[r.key];
    } else {
      settings[r.key] = r.value;
    }
  });
  return settings;
}

// GET /api/settings (Accessible to all authenticated users)
router.get('/', requireAuth, (req, res) => {
  res.json(getAllSettings());
});

// GET /api/settings/public (Accessible without auth for login page company name & currency)
router.get('/public', (req, res) => {
  res.json(getAllSettings());
});

// PUT /api/settings (ADMIN only)
router.put('/', requireAuth, requireAdmin, (req, res) => {
  const { company_name, currency_symbol, payday_day, max_advance_months } = req.body;

  const upsert = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);

  const updateTx = db.transaction(() => {
    if (company_name !== undefined) upsert.run('company_name', String(company_name).trim());
    if (currency_symbol !== undefined) upsert.run('currency_symbol', String(currency_symbol).trim());
    if (payday_day !== undefined) {
      const day = parseInt(payday_day, 10);
      if (day >= 1 && day <= 31) {
        upsert.run('payday_day', String(day));
      }
    }
    if (max_advance_months !== undefined) {
      const m = parseInt(max_advance_months, 10);
      if (m === 2 || m === 3) {
        upsert.run('max_advance_months', String(m));
      }
    }
  });

  updateTx();

  res.json({
    message: 'Settings updated successfully',
    settings: getAllSettings()
  });
});

module.exports = {
  router,
  getAllSettings
};
