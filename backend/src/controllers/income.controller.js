const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/income
const getIncome = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { start_date, end_date, account_id } = req.query;

    let where = `WHERE t.user_id = $1 AND t.transaction_type = 'income'`;
    const params = [req.user.id];
    let idx = 2;
    if (account_id) { where += ` AND t.account_id = $${idx++}`; params.push(account_id); }
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

// POST /api/income
const createIncome = async (req, res, next) => {
  try {
    const {
      account_id, amount, currency = 'ETB', category_id,
      date, description, payee_payer, reference, notes,
    } = req.body;

    if (!account_id || !amount || !date) {
      return error(res, 'account_id, amount, and date are required', 400);
    }

    const accountCheck = await query(
      "SELECT id FROM accounts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [account_id, req.user.id]
    );
    if (!accountCheck.rows.length) return error(res, 'Account not found', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, category_id, date, description, payee_payer, reference, notes, status)
         VALUES ($1, 'income', $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed') RETURNING *`,
        [req.user.id, account_id, amount, currency, category_id, date, description, payee_payer, reference, notes]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
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

// POST /api/income/salary
const createSalary = async (req, res, next) => {
  try {
    const {
      account_id, employer, salary_month,
      gross_salary, income_tax = 0, pension_deduction = 0, other_deductions = 0,
      payment_date, notes,
    } = req.body;

    if (!account_id || !employer || !salary_month || !gross_salary) {
      return error(res, 'account_id, employer, salary_month, gross_salary are required', 400);
    }

    const net_salary = parseFloat(gross_salary) - parseFloat(income_tax) - parseFloat(pension_deduction) - parseFloat(other_deductions);
    if (net_salary <= 0) return error(res, 'Net salary must be positive', 400);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get salary category
      const catResult = await client.query(
        "SELECT id FROM categories WHERE name = 'Salary' AND is_system = TRUE LIMIT 1"
      );
      const categoryId = catResult.rows[0]?.id;

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, category_id, date, description, payee_payer, notes, status)
         VALUES ($1, 'income', $2, $3, 'ETB', $4, $5, $6, $7, $8, 'completed') RETURNING id`,
        [req.user.id, account_id, net_salary, categoryId, payment_date || salary_month,
          `Salary - ${employer}`, employer, notes]
      );

      const salaryResult = await client.query(
        `INSERT INTO salary_records (user_id, transaction_id, employer, salary_month, gross_salary, income_tax, pension_deduction, other_deductions, net_salary, payment_account_id, payment_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [req.user.id, txResult.rows[0].id, employer, salary_month, gross_salary, income_tax, pension_deduction, other_deductions, net_salary, account_id, payment_date, notes]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [net_salary, account_id]
      );

      await client.query('COMMIT');
      return created(res, salaryResult.rows[0], 'Salary recorded successfully');
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

// GET /api/income/salary
const getSalaryRecords = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const countResult = await query(
      'SELECT COUNT(*) FROM salary_records WHERE user_id = $1',
      [req.user.id]
    );
    const result = await query(
      `SELECT s.*, a.account_name
       FROM salary_records s
       LEFT JOIN accounts a ON a.id = s.payment_account_id
       WHERE s.user_id = $1
       ORDER BY s.salary_month DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    const total = parseInt(countResult.rows[0].count);
    return paginated(res, result.rows, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

module.exports = { getIncome, createIncome, createSalary, getSalaryRecords };
