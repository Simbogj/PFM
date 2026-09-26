const { query } = require('../config/database');
const { success, created, error } = require('../utils/response');

// GET /api/goals
const getGoals = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT *,
              CASE WHEN target_amount > 0
                   THEN ROUND((current_amount / target_amount * 100)::numeric, 2)
                   ELSE 0 END as progress_percent,
              CASE WHEN target_date IS NOT NULL AND target_date > CURRENT_DATE AND target_amount > current_amount
                   THEN CEIL((target_amount - current_amount) /
                        GREATEST(
                          EXTRACT(YEAR FROM AGE(target_date, CURRENT_DATE)) * 12 +
                          EXTRACT(MONTH FROM AGE(target_date, CURRENT_DATE)),
                          1
                        ))
                   ELSE NULL END as required_monthly
       FROM financial_goals
       WHERE user_id = $1
       ORDER BY priority DESC, target_date ASC NULLS LAST`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id
const getGoal = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT *,
              CASE WHEN target_amount > 0
                   THEN ROUND((current_amount / target_amount * 100)::numeric, 2)
                   ELSE 0 END as progress_percent
       FROM financial_goals WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Goal not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const {
      name, description, goal_type = 'savings', target_amount, current_amount = 0,
      currency = 'ETB', target_date, monthly_contribution, priority = 'medium', icon, color,
    } = req.body;

    if (!name || !target_amount) return error(res, 'Name and target amount are required', 400);

    const result = await query(
      `INSERT INTO financial_goals (user_id, name, description, goal_type, target_amount, current_amount, currency, target_date, monthly_contribution, priority, icon, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.id, name, description, goal_type, target_amount, current_amount, currency, target_date, monthly_contribution, priority, icon || 'target', color || '#6366F1']
    );
    return created(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const { name, description, target_amount, current_amount, target_date, monthly_contribution, priority, status, icon, color } = req.body;
    const result = await query(
      `UPDATE financial_goals SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         target_amount = COALESCE($3, target_amount),
         current_amount = COALESCE($4, current_amount),
         target_date = COALESCE($5, target_date),
         monthly_contribution = COALESCE($6, monthly_contribution),
         priority = COALESCE($7, priority),
         status = COALESCE($8, status),
         icon = COALESCE($9, icon),
         color = COALESCE($10, color)
       WHERE id = $11 AND user_id = $12 RETURNING *`,
      [name, description, target_amount, current_amount, target_date, monthly_contribution, priority, status, icon, color, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Goal not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE financial_goals SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Goal not found', 404);
    return success(res, null, 'Goal cancelled');
  } catch (err) {
    next(err);
  }
};

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal };
