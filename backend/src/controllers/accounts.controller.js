const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/accounts
const getAccounts = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, at.name as type_name, at.is_asset, at.is_liability
       FROM accounts a
       JOIN account_types at ON at.code = a.account_type_code
       WHERE a.user_id = $1 AND a.status != 'closed'
       ORDER BY a.is_default DESC, a.account_name ASC`,
      [req.user.id]
    );

    // Summary totals
    const summary = result.rows.reduce((acc, a) => {
      if (!a.include_in_total) return acc;
      if (a.is_asset) {
        acc.total_assets += parseFloat(a.current_balance);
        if (a.account_type_code === 'BANK') acc.bank_balance += parseFloat(a.current_balance);
        else if (a.account_type_code === 'CASH') acc.cash_balance += parseFloat(a.current_balance);
        else if (a.account_type_code === 'SAVINGS') acc.savings_balance += parseFloat(a.current_balance);
        else if (a.account_type_code === 'INVESTMENT') acc.investment_balance += parseFloat(a.current_balance);
        else if (a.account_type_code === 'MOBILE_MONEY') acc.mobile_balance += parseFloat(a.current_balance);
      } else {
        acc.total_liabilities += parseFloat(a.current_balance);
      }
      return acc;
    }, { total_assets: 0, bank_balance: 0, cash_balance: 0, savings_balance: 0, investment_balance: 0, mobile_balance: 0, total_liabilities: 0 });

    summary.net_worth = summary.total_assets - summary.total_liabilities;

    return success(res, { accounts: result.rows, summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/accounts/:id
const getAccount = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, at.name as type_name, at.is_asset, at.is_liability
       FROM accounts a
       JOIN account_types at ON at.code = a.account_type_code
       WHERE a.id = $1 AND a.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (!result.rows.length) return error(res, 'Account not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/accounts
const createAccount = async (req, res, next) => {
  try {
    const {
      account_name, account_type_code, bank_name, account_number_last4,
      currency = 'ETB', opening_balance = 0, color, icon, notes, is_default = false,
    } = req.body;

    if (!account_name || !account_type_code) {
      return error(res, 'Account name and type are required', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // If this is default, unset others
      if (is_default) {
        await client.query(
          'UPDATE accounts SET is_default = FALSE WHERE user_id = $1',
          [req.user.id]
        );
      }

      const result = await client.query(
        `INSERT INTO accounts (user_id, account_type_code, account_name, bank_name,
           account_number_last4, currency, opening_balance, current_balance, color, icon, notes, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          req.user.id, account_type_code, account_name, bank_name,
          account_number_last4, currency, opening_balance,
          color || '#3B82F6', icon || 'building-2', notes, is_default,
        ]
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

// PUT /api/accounts/:id
const updateAccount = async (req, res, next) => {
  try {
    const {
      account_name, bank_name, account_number_last4,
      color, icon, notes, status, is_default, include_in_total,
    } = req.body;

    const existing = await query(
      'SELECT id FROM accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return error(res, 'Account not found', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      if (is_default) {
        await client.query('UPDATE accounts SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
      }
      const result = await client.query(
        `UPDATE accounts SET
           account_name = COALESCE($1, account_name),
           bank_name = COALESCE($2, bank_name),
           account_number_last4 = COALESCE($3, account_number_last4),
           color = COALESCE($4, color),
           icon = COALESCE($5, icon),
           notes = COALESCE($6, notes),
           status = COALESCE($7, status),
           is_default = COALESCE($8, is_default),
           include_in_total = COALESCE($9, include_in_total)
         WHERE id = $10 AND user_id = $11
         RETURNING *`,
        [
          account_name, bank_name, account_number_last4,
          color, icon, notes, status, is_default, include_in_total,
          req.params.id, req.user.id,
        ]
      );
      await client.query('COMMIT');
      return success(res, result.rows[0]);
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

// DELETE /api/accounts/:id  (soft delete - set to closed)
const deleteAccount = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE accounts SET status = 'closed' WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Account not found', 404);
    return success(res, null, 'Account closed successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/accounts/:id/transactions
const getAccountTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const countResult = await query(
      `SELECT COUNT(*) FROM transactions WHERE account_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    const result = await query(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.account_id = $1 AND t.user_id = $2
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.params.id, req.user.id, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return paginated(res, result.rows, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// POST /api/accounts/:id/reconcile
const reconcileAccount = async (req, res, next) => {
  try {
    const { actual_balance, reason } = req.body;
    if (actual_balance === undefined) return error(res, 'Actual balance is required', 400);

    const accountResult = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!accountResult.rows.length) return error(res, 'Account not found', 404);

    const account = accountResult.rows[0];
    const difference = parseFloat(actual_balance) - parseFloat(account.current_balance);

    if (difference === 0) {
      return success(res, { difference: 0 }, 'Account is already balanced');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create adjustment transaction
      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, status)
         VALUES ($1, 'adjustment', $2, $3, $4, CURRENT_DATE, $5, 'completed')
         RETURNING id`,
        [
          req.user.id,
          req.params.id,
          Math.abs(difference),
          account.currency,
          reason || `Balance reconciliation adjustment`,
        ]
      );

      // Update balance
      await client.query(
        'UPDATE accounts SET current_balance = $1 WHERE id = $2',
        [actual_balance, req.params.id]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
         VALUES ($1, 'reconcile', 'accounts', $2, $3, $4)`,
        [
          req.user.id,
          req.params.id,
          JSON.stringify({ current_balance: account.current_balance }),
          JSON.stringify({ current_balance: actual_balance, difference, reason }),
        ]
      );

      await client.query('COMMIT');

      return success(res, {
        system_balance: parseFloat(account.current_balance),
        actual_balance: parseFloat(actual_balance),
        difference,
        adjustment_transaction_id: txResult.rows[0].id,
      }, 'Account reconciled successfully');
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

module.exports = { getAccounts, getAccount, createAccount, updateAccount, deleteAccount, getAccountTransactions, reconcileAccount };
