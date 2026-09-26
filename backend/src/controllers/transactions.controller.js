const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const {
      account_id, category_id, transaction_type, start_date, end_date,
      min_amount, max_amount, search, status, payment_method,
    } = req.query;

    let whereClause = 'WHERE t.user_id = $1';
    const params = [req.user.id];
    let paramIdx = 2;

    if (account_id) { whereClause += ` AND t.account_id = $${paramIdx++}`; params.push(account_id); }
    if (category_id) { whereClause += ` AND t.category_id = $${paramIdx++}`; params.push(category_id); }
    if (transaction_type) { whereClause += ` AND t.transaction_type = $${paramIdx++}`; params.push(transaction_type); }
    if (start_date) { whereClause += ` AND t.date >= $${paramIdx++}`; params.push(start_date); }
    if (end_date) { whereClause += ` AND t.date <= $${paramIdx++}`; params.push(end_date); }
    if (min_amount) { whereClause += ` AND t.amount >= $${paramIdx++}`; params.push(min_amount); }
    if (max_amount) { whereClause += ` AND t.amount <= $${paramIdx++}`; params.push(max_amount); }
    if (status) { whereClause += ` AND t.status = $${paramIdx++}`; params.push(status); }
    if (payment_method) { whereClause += ` AND t.payment_method = $${paramIdx++}`; params.push(payment_method); }
    if (search) {
      whereClause += ` AND (t.description ILIKE $${paramIdx} OR t.payee_payer ILIKE $${paramIdx} OR t.reference ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM transactions t ${whereClause}`,
      params
    );

    const result = await query(
      `SELECT t.*,
              a.account_name, a.account_type_code,
              da.account_name as destination_account_name,
              c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN accounts da ON da.id = t.destination_account_id
       LEFT JOIN categories c ON c.id = t.category_id
       ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return paginated(res, result.rows, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
const getTransaction = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*,
              a.account_name, a.account_type_code,
              da.account_name as destination_account_name,
              c.name as category_name, c.icon as category_icon
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN accounts da ON da.id = t.destination_account_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Transaction not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const {
      transaction_type, account_id, destination_account_id,
      amount, currency = 'ETB', category_id, date, description,
      reference, payee_payer, payment_method = 'bank', notes, tags,
    } = req.body;

    if (!transaction_type || !account_id || !amount || !date) {
      return error(res, 'transaction_type, account_id, amount, and date are required', 400);
    }
    if (parseFloat(amount) <= 0) return error(res, 'Amount must be positive', 400);

    // Verify account belongs to user
    const accountCheck = await query(
      'SELECT id, current_balance FROM accounts WHERE id = $1 AND user_id = $2 AND status = $3',
      [account_id, req.user.id, 'active']
    );
    if (!accountCheck.rows.length) return error(res, 'Source account not found or inactive', 404);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, destination_account_id,
           amount, currency, category_id, date, description, reference, payee_payer,
           payment_method, notes, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          req.user.id, transaction_type, account_id, destination_account_id,
          amount, currency, category_id, date, description, reference,
          payee_payer, payment_method, notes, tags,
        ]
      );

      // Update account balance
      await _applyBalanceChange(client, transaction_type, account_id, destination_account_id, amount, req.user.id);

      await client.query('COMMIT');
      return created(res, txResult.rows[0]);
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

// PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const existing = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return error(res, 'Transaction not found', 404);

    const tx = existing.rows[0];
    const { category_id, description, reference, payee_payer, notes, tags, date } = req.body;

    const result = await query(
      `UPDATE transactions SET
         category_id = COALESCE($1, category_id),
         description = COALESCE($2, description),
         reference = COALESCE($3, reference),
         payee_payer = COALESCE($4, payee_payer),
         notes = COALESCE($5, notes),
         tags = COALESCE($6, tags),
         date = COALESCE($7, date)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [category_id, description, reference, payee_payer, notes, tags, date, req.params.id, req.user.id]
    );

    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const existing = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) return error(res, 'Transaction not found', 404);

    const tx = existing.rows[0];
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Reverse the balance change
      await _reverseBalanceChange(client, tx.transaction_type, tx.account_id, tx.destination_account_id, tx.amount, req.user.id);

      await client.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);

      await client.query('COMMIT');
      return success(res, null, 'Transaction deleted');
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

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM categories
       WHERE (user_id = $1 OR user_id IS NULL) AND is_active = TRUE
       ORDER BY is_system DESC, name ASC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color, parent_id } = req.body;
    if (!name || !type) return error(res, 'Name and type are required', 400);

    const result = await query(
      `INSERT INTO categories (user_id, name, type, icon, color, parent_id, is_system)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *`,
      [req.user.id, name, type, icon, color, parent_id]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// -------------------------------------------------------
// Internal helpers for balance management
// -------------------------------------------------------

async function _applyBalanceChange(client, txType, accountId, destAccountId, amount, userId) {
  const amt = parseFloat(amount);

  switch (txType) {
    // Money IN to account
    case 'income':
    case 'loan_received':
    case 'refund':
    case 'deposit':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    // Money OUT from account
    case 'expense':
    case 'payment':
    case 'lending':
    case 'savings_deposit':
    case 'investment':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    // Withdrawal: bank OUT, cash IN (handled via transfer)
    case 'withdrawal':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      if (destAccountId) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
          [amt, destAccountId, userId]
        );
      }
      break;

    // Transfer: from account OUT, to account IN
    case 'transfer':
    case 'savings_withdrawal':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      if (destAccountId) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
          [amt, destAccountId, userId]
        );
      }
      break;

    // Loan repayment: account OUT (paying back debt)
    case 'loan_repayment':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    // Lending repayment received: account IN
    case 'lending_repayment':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    case 'adjustment':
      // Handled separately in reconcile
      break;
  }
}

async function _reverseBalanceChange(client, txType, accountId, destAccountId, amount, userId) {
  const amt = parseFloat(amount);

  switch (txType) {
    case 'income':
    case 'loan_received':
    case 'refund':
    case 'deposit':
    case 'lending_repayment':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    case 'expense':
    case 'payment':
    case 'lending':
    case 'savings_deposit':
    case 'investment':
    case 'loan_repayment':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      break;

    case 'withdrawal':
    case 'transfer':
    case 'savings_withdrawal':
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2 AND user_id = $3',
        [amt, accountId, userId]
      );
      if (destAccountId) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
          [amt, destAccountId, userId]
        );
      }
      break;
  }
}

module.exports = {
  getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction,
  getCategories, createCategory,
  _applyBalanceChange, _reverseBalanceChange,
};
