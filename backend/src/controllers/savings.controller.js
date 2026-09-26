const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/savings
const getSavingsGoals = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT sg.*, a.account_name,
              CASE WHEN sg.target_amount > 0
                   THEN ROUND((sg.current_amount / sg.target_amount * 100)::numeric, 2)
                   ELSE 0 END as progress_percent
       FROM savings_goals sg
       LEFT JOIN accounts a ON a.id = sg.account_id
       WHERE sg.user_id = $1
       ORDER BY sg.priority DESC, sg.created_at DESC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/savings/:id
const getSavingsGoal = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT sg.*, a.account_name,
              CASE WHEN sg.target_amount > 0
                   THEN ROUND((sg.current_amount / sg.target_amount * 100)::numeric, 2)
                   ELSE 0 END as progress_percent
       FROM savings_goals sg
       LEFT JOIN accounts a ON a.id = sg.account_id
       WHERE sg.id = $1 AND sg.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Savings goal not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/savings
const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, description, target_amount, account_id, currency = 'ETB', target_date, priority = 'medium', icon, color } = req.body;
    if (!name || !target_amount) return error(res, 'Name and target amount are required', 400);

    const result = await query(
      `INSERT INTO savings_goals (user_id, account_id, name, description, target_amount, current_amount, currency, target_date, priority, icon, color)
       VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.id, account_id, name, description, target_amount, currency, target_date, priority, icon || 'piggy-bank', color || '#10B981']
    );
    return created(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/savings/:id
const updateSavingsGoal = async (req, res, next) => {
  try {
    const { name, description, target_amount, target_date, priority, status, icon, color } = req.body;
    const result = await query(
      `UPDATE savings_goals SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         target_amount = COALESCE($3, target_amount),
         target_date = COALESCE($4, target_date),
         priority = COALESCE($5, priority),
         status = COALESCE($6, status),
         icon = COALESCE($7, icon),
         color = COALESCE($8, color)
       WHERE id = $9 AND user_id = $10 RETURNING *`,
      [name, description, target_amount, target_date, priority, status, icon, color, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Savings goal not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/savings/:id
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE savings_goals SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Savings goal not found', 404);
    return success(res, null, 'Savings goal cancelled');
  } catch (err) {
    next(err);
  }
};

// POST /api/savings/:id/deposit
const depositToGoal = async (req, res, next) => {
  try {
    const { amount, from_account_id, date, notes } = req.body;
    if (!amount || !from_account_id || !date) {
      return error(res, 'amount, from_account_id, and date are required', 400);
    }

    const goalResult = await query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!goalResult.rows.length) return error(res, 'Savings goal not found', 404);
    const goal = goalResult.rows[0];

    const accountResult = await query(
      "SELECT id, current_balance FROM accounts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [from_account_id, req.user.id]
    );
    if (!accountResult.rows.length) return error(res, 'Account not found', 404);
    if (parseFloat(accountResult.rows[0].current_balance) < parseFloat(amount)) {
      return error(res, 'Insufficient balance', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, destination_account_id, amount, currency, date, description, status)
         VALUES ($1, 'savings_deposit', $2, $3, $4, $5, $6, $7, 'completed') RETURNING id`,
        [req.user.id, from_account_id, goal.account_id, amount, goal.currency, date, `Savings deposit: ${goal.name}`]
      );

      await client.query(
        'INSERT INTO savings_transactions (savings_goal_id, user_id, transaction_id, type, amount, date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [goal.id, req.user.id, txResult.rows[0].id, 'deposit', amount, date, notes]
      );

      await client.query(
        'UPDATE savings_goals SET current_amount = current_amount + $1 WHERE id = $2',
        [amount, goal.id]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amount, from_account_id]
      );

      if (goal.account_id) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
          [amount, goal.account_id]
        );
      }

      // Check if goal completed
      const updatedGoal = await client.query('SELECT current_amount, target_amount FROM savings_goals WHERE id = $1', [goal.id]);
      if (parseFloat(updatedGoal.rows[0].current_amount) >= parseFloat(updatedGoal.rows[0].target_amount)) {
        await client.query("UPDATE savings_goals SET status = 'completed' WHERE id = $1", [goal.id]);
      }

      await client.query('COMMIT');
      return success(res, null, 'Savings deposit recorded');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/savings/:id/withdraw
const withdrawFromGoal = async (req, res, next) => {
  try {
    const { amount, to_account_id, date, notes } = req.body;
    if (!amount || !to_account_id || !date) {
      return error(res, 'amount, to_account_id, and date are required', 400);
    }

    const goalResult = await query(
      'SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!goalResult.rows.length) return error(res, 'Savings goal not found', 404);
    const goal = goalResult.rows[0];

    if (parseFloat(goal.current_amount) < parseFloat(amount)) {
      return error(res, 'Insufficient savings balance', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, destination_account_id, amount, currency, date, description, status)
         VALUES ($1, 'savings_withdrawal', $2, $3, $4, $5, $6, $7, 'completed') RETURNING id`,
        [req.user.id, goal.account_id || to_account_id, to_account_id, amount, goal.currency, date, `Savings withdrawal: ${goal.name}`]
      );

      await client.query(
        'INSERT INTO savings_transactions (savings_goal_id, user_id, transaction_id, type, amount, date, notes) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [goal.id, req.user.id, txResult.rows[0].id, 'withdrawal', amount, date, notes]
      );

      await client.query(
        'UPDATE savings_goals SET current_amount = current_amount - $1 WHERE id = $2',
        [amount, goal.id]
      );

      if (goal.account_id) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
          [amount, goal.account_id]
        );
      }

      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amount, to_account_id]
      );

      await client.query('COMMIT');
      return success(res, null, 'Savings withdrawal recorded');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/savings/:id/transactions
const getSavingsTransactions = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT st.*, a.account_name
       FROM savings_transactions st
       LEFT JOIN transactions t ON t.id = st.transaction_id
       LEFT JOIN accounts a ON a.id = t.account_id
       WHERE st.savings_goal_id = $1 AND st.user_id = $2
       ORDER BY st.date DESC`,
      [req.params.id, req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSavingsGoals, getSavingsGoal, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, depositToGoal, withdrawFromGoal, getSavingsTransactions };
