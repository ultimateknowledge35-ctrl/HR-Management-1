const express = require('express');
const router = express.Router();
const db = require('../../config/db');
const { requireAuth, requireAdmin } = require('../../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/expenses (Search, category filter, date range filter)
router.get('/', (req, res) => {
  const { q, category, startDate, endDate } = req.query;

  let query = `SELECT * FROM expenses WHERE 1=1`;
  const params = [];

  if (category && category !== 'ALL') {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (startDate) {
    query += ` AND expense_date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND expense_date <= ?`;
    params.push(endDate);
  }

  if (q && q.trim()) {
    query += ` AND (category LIKE ? OR description LIKE ?)`;
    const wildcard = `%${q.trim()}%`;
    params.push(wildcard, wildcard);
  }

  query += ` ORDER BY expense_date DESC, created_at DESC`;

  const expenses = db.prepare(query).all(...params);

  // Calculate totals for quick UI summary
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  res.json({
    totalAmount,
    expenses
  });
});

// POST /api/admin/expenses (Log new expense)
router.post('/', (req, res) => {
  const { category, amount, expense_date, description } = req.body;

  if (!category || !amount || !expense_date) {
    return res.status(400).json({ error: 'Category, amount, and expense date are required' });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const result = db.prepare(`
    INSERT INTO expenses (category, amount, expense_date, description)
    VALUES (?, ?, ?, ?)
  `).run(
    category.trim(),
    amt,
    expense_date,
    description ? description.trim() : null
  );

  const newExpense = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Expense logged successfully',
    expense: newExpense
  });
});

// PUT /api/admin/expenses/:id (Edit expense)
router.put('/:id', (req, res) => {
  const { category, amount, expense_date, description } = req.body;

  const existing = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const amt = amount !== undefined ? parseFloat(amount) : existing.amount;
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  db.prepare(`
    UPDATE expenses SET
      category = ?,
      amount = ?,
      expense_date = ?,
      description = ?
    WHERE id = ?
  `).run(
    category !== undefined ? category.trim() : existing.category,
    amt,
    expense_date || existing.expense_date,
    description !== undefined ? (description ? description.trim() : null) : existing.description,
    req.params.id
  );

  const updated = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(req.params.id);

  res.json({
    message: 'Expense updated successfully',
    expense: updated
  });
});

// DELETE /api/admin/expenses/:id (Delete expense)
router.delete('/:id', (req, res) => {
  const existing = db.prepare(`SELECT id FROM expenses WHERE id = ?`).get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  db.prepare(`DELETE FROM expenses WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Expense deleted successfully' });
});

module.exports = router;
