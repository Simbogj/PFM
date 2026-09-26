const { query, getClient } = require('../config/database');
const { success, created, error } = require('../utils/response');

// GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const periodStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const periodEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

    const result = await query(
      `SELECT b.*,
              c.name as category_name, c.icon as category_icon, c.color as category_color,
              COALESCE(
                (SELECT SUM(t.amount)
                 FROM transactions t
                 WHERE t.user_id = b.user_id
                   AND t.category_id = b.category_id
                   AND t.transaction_type = 'expense'
                   AND t.date BETWEEN b.period_start AND b.period_end
                   AND t.status = 'completed'),
                0
              ) as spent_amount
       FROM budgets b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.user_id = $1
         AND b.period_start <= $3
         AND b.period_end >= $2
         AND b.is_active = TRUE
       ORDER BY b.amount DESC`,
      [req.user.id, periodStart, periodEnd]
    );

    const budgetsWithCalc = result.rows.map((b) => ({
      ...b,
      spent_amount: parseFloat(b.spent_amount),
      remaining: parseFloat(b.amount) - parseFloat(b.spent_amount),
      percent_used: b.amount > 0
        ? Math.round((parseFloat(b.spent_amount) / parseFloat(b.amount)) * 100)
        : 0,
    }));

    const summary = {
      total_budgeted: budgetsWithCalc.reduce((s, b) => s + parseFloat(b.amount), 0),
      total_spent: budgetsWithCalc.reduce((s, b) => s + b.spent_amount, 0),
      over_budget_count: budgetsWithCalc.filter((b) => b.spent_amount > parseFloat(b.amount)).length,
    };

    return success(res, { budgets: budgetsWithCalc, summary });
  } catch (err) {
    next(err);
  }
};

// POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const {
      category_id, name, budget_type = 'monthly', amount,
      currency = 'ETB', period_start, period_end,
      alert_at_80 = true, alert_at_90 = true, alert_at_100 = true, notes,
    } = req.body;

    if (!name || !amount || !period_start || !period_end) {
      return error(res, 'name, amount, period_start, and period_end are required', 400);
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, name, budget_type, amount, currency, period_start, period_end, alert_at_80, alert_at_90, alert_at_100, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.id, category_id, name, budget_type, amount, currency, period_start, period_end, alert_at_80, alert_at_90, alert_at_100, notes]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const { name, amount, period_start, period_end, alert_at_80, alert_at_90, alert_at_100, is_active, notes } = req.body;
    const result = await query(
      `UPDATE budgets SET
         name = COALESCE($1, name),
         amount = COALESCE($2, amount),
         period_start = COALESCE($3, period_start),
         period_end = COALESCE($4, period_end),
         alert_at_80 = COALESCE($5, alert_at_80),
         alert_at_90 = COALESCE($6, alert_at_90),
         alert_at_100 = COALESCE($7, alert_at_100),
         is_active = COALESCE($8, is_active),
         notes = COALESCE($9, notes)
       WHERE id = $10 AND user_id = $11 RETURNING *`,
      [name, amount, period_start, period_end, alert_at_80, alert_at_90, alert_at_100, is_active, notes, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Budget not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE budgets SET is_active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Budget not found', 404);
    return success(res, null, 'Budget deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
