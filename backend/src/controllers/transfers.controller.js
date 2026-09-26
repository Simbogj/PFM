const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/transfers
const getTransfers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { start_date, end_date } = req.query;

    let where = 'WHERE t.user_id = $1';
    const params = [req.user.id];
    let idx = 2;
    if (start_date) { where += ` AND t.transfer_date >= $${idx++}`; params.push(start_date); }
    if (end_date) { where += ` AND t.transfer_date <= $${idx++}`; params.push(end_date); }

    const countResult = await query(`SELECT COUNT(*) FROM transfers t ${where}`, params);

    const result = await query(
      `SELECT t.*,
              fa.account_name as from_account_name, fa.account_type_code as from_account_type,
              ta.account_name as to_account_name, ta.account_type_code as to_account_type
       FROM transfers t
       JOIN accounts fa ON fa.id = t.from_account_id
       JOIN accounts ta ON ta.id = t.to_account_id
       ${where}
       ORDER BY t.transfer_date DESC, t.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].count);
    return paginated(res, result.rows, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// POST /api/transfers
const createTransfer = async (req, res, next) => {
  try {
    const {
      from_account_id, to_account_id, amount, fee_amount = 0,
      currency = 'ETB', transfer_date, reference, description,
    } = req.body;

    if (!from_account_id || !to_account_id || !amount || !transfer_date) {
      return error(res, 'from_account_id, to_account_id, amount, and transfer_date are required', 400);
    }

    if (from_account_id === to_account_id) {
      return error(res, 'Cannot transfer to the same account', 400);
    }

    const amt = parseFloat(amount);
    if (amt <= 0) return error(res, 'Transfer amount must be positive', 400);

    // Verify both accounts belong to user and have sufficient balance
    const accountsResult = await query(
      `SELECT id, account_name, current_balance, currency
       FROM accounts WHERE id = ANY($1) AND user_id = $2 AND status = 'active'`,
      [[from_account_id, to_account_id], req.user.id]
    );

    if (accountsResult.rows.length !== 2) {
      return error(res, 'One or both accounts not found or inactive', 404);
    }

    const fromAccount = accountsResult.rows.find((a) => a.id === from_account_id);
    if (parseFloat(fromAccount.current_balance) < amt + parseFloat(fee_amount)) {
      return error(res, 'Insufficient balance in source account', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Debit from account
      const fromTx = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, destination_account_id, amount, currency, date, description, reference, status)
         VALUES ($1, 'transfer', $2, $3, $4, $5, $6, $7, $8, 'completed') RETURNING id`,
        [req.user.id, from_account_id, to_account_id, amt, currency, transfer_date, description || 'Transfer', reference]
      );

      // Credit to account
      const toTx = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, destination_account_id, amount, currency, date, description, reference, status)
         VALUES ($1, 'deposit', $2, $3, $4, $5, $6, $7, $8, 'completed') RETURNING id`,
        [req.user.id, to_account_id, from_account_id, amt, currency, transfer_date, description || 'Transfer received', reference]
      );

      // Update balances
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amt, from_account_id]
      );
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amt, to_account_id]
      );

      // Handle fee
      let feeTxId = null;
      if (parseFloat(fee_amount) > 0) {
        const feeTx = await client.query(
          `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, status)
           VALUES ($1, 'expense', $2, $3, $4, $5, 'Transfer fee', 'completed') RETURNING id`,
          [req.user.id, from_account_id, fee_amount, currency, transfer_date]
        );
        feeTxId = feeTx.rows[0].id;
        await client.query(
          'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
          [fee_amount, from_account_id]
        );
      }

      // Create transfer record
      const transferResult = await client.query(
        `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, fee_amount, currency,
           transfer_date, reference, description, status, from_transaction_id, to_transaction_id, fee_transaction_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed',$10,$11,$12) RETURNING *`,
        [
          req.user.id, from_account_id, to_account_id, amt, fee_amount, currency,
          transfer_date, reference, description,
          fromTx.rows[0].id, toTx.rows[0].id, feeTxId,
        ]
      );

      await client.query('COMMIT');
      return created(res, transferResult.rows[0]);
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

// DELETE /api/transfers/:id
const deleteTransfer = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM transfers WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Transfer not found', 404);
    const transfer = result.rows[0];

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Reverse balances
      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [transfer.amount, transfer.from_account_id]
      );
      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [transfer.amount, transfer.to_account_id]
      );

      if (transfer.fee_amount > 0 && transfer.fee_transaction_id) {
        await client.query(
          'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
          [transfer.fee_amount, transfer.from_account_id]
        );
      }

      // Delete related transactions
      if (transfer.from_transaction_id) await client.query('DELETE FROM transactions WHERE id = $1', [transfer.from_transaction_id]);
      if (transfer.to_transaction_id) await client.query('DELETE FROM transactions WHERE id = $1', [transfer.to_transaction_id]);
      if (transfer.fee_transaction_id) await client.query('DELETE FROM transactions WHERE id = $1', [transfer.fee_transaction_id]);

      await client.query('DELETE FROM transfers WHERE id = $1', [req.params.id]);

      await client.query('COMMIT');
      return success(res, null, 'Transfer deleted');
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

module.exports = { getTransfers, createTransfer, deleteTransfer };
