const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { start_date, end_date, account_id, category_id } = req.query;

    let where = `WHERE t.user_id = $1 AND t.transaction_type = 'expense'`;
    const params = [req.user.id];
    let idx = 2;
    if (account_id) { where += ` AND t.account_id = $${idx++}`; params.push(account_id); }
    if (category_id) { where += ` AND t.category_id = $${idx++}`; params.push(category_id); }
    if (start_date) { where += ` AND t.date >= $${idx++}`; params.push(start_date); }
    if (end_date) { where += ` AND t.date <= $${idx++}`; params.push(end_date); }

    const countResult = await query(`SELECT COUNT(*) FROM transactions t ${where}`, params);
    const result = await query(
      `SELECT t.*, a.account_name, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN categories c ON c.id = t.category_id
       ${where}
       ORDER BY t.date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return paginated(res, result.rows, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/expenses/by-category
const getExpensesByCategory = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    let where = `WHERE t.user_id = $1 AND t.transaction_type = 'expense'`;
    const params = [req.user.id];
    let idx = 2;
    if (start_date) { where += ` AND t.date >= $${idx++}`; params.push(start_date); }
    if (end_date) { where += ` AND t.date <= $${idx++}`; params.push(end_date); }

    const result = await query(
      `SELECT c.id, c.name, c.icon, c.color,
              COUNT(t.id) as transaction_count,
              SUM(t.amount) as total_amount
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       ${where}
       GROUP BY c.id, c.name, c.icon, c.color
       ORDER BY total_amount DESC`,
      params
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const {
      account_id, amount, currency = 'ETB', category_id,
      date, description, payee_payer, payment_method = 'bank',
      reference, notes, tags,
    } = req.body;

    if (!account_id || !amount || !date) {
      return error(res, 'account_id, amount, and date are required', 400);
    }
    if (parseFloat(amount) <= 0) return error(res, 'Amount must be positive', 400);

    const accountCheck = await query(
      "SELECT id, current_balance FROM accounts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [account_id, req.user.id]
    );
    if (!accountCheck.rows.length) return error(res, 'Account not found', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, category_id, date, description, payee_payer, payment_method, reference, notes, tags, status)
         VALUES ($1, 'expense', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed') RETURNING *`,
        [req.user.id, account_id, amount, currency, category_id, date, description, payee_payer, payment_method, reference, notes, tags]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amount, account_id]
      );

      await client.query('COMMIT');
      return created(res, result.rows[0]);
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

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const existing = await query(
      "SELECT * FROM transactions WHERE id = $1 AND user_id = $2 AND transaction_type = 'expense'",
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return error(res, 'Expense not found', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [existing.rows[0].amount, existing.rows[0].account_id]
      );
      await client.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
      await client.query('COMMIT');
      return success(res, null, 'Expense deleted');
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

module.exports = { getExpenses, getExpensesByCategory, createExpense, deleteExpense };
