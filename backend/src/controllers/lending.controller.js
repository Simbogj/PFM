const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/lendings
const getLendings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE l.user_id = $1';
    const params = [req.user.id];
    if (status) { where += ' AND l.status = $2'; params.push(status); }

    const result = await query(
      `SELECT l.*, a.account_name as from_account_name
       FROM lendings l
       LEFT JOIN accounts a ON a.id = l.from_account_id
       ${where}
       ORDER BY l.lend_date DESC`,
      params
    );

    const summary = result.rows.reduce((acc, l) => {
      acc.total_lent += parseFloat(l.principal_amount);
      acc.total_remaining += parseFloat(l.remaining_balance);
      acc.total_received += parseFloat(l.amount_paid);
      return acc;
    }, { total_lent: 0, total_remaining: 0, total_received: 0 });

    return success(res, { lendings: result.rows, summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/lendings/:id
const getLending = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT l.*, a.account_name
       FROM lendings l
       LEFT JOIN accounts a ON a.id = l.from_account_id
       WHERE l.id = $1 AND l.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Lending record not found', 404);

    const payments = await query(
      `SELECT lp.*, a.account_name
       FROM lending_payments lp
       LEFT JOIN accounts a ON a.id = lp.to_account_id
       WHERE lp.lending_id = $1
       ORDER BY lp.payment_date DESC`,
      [req.params.id]
    );

    return success(res, { ...result.rows[0], payments: payments.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/lendings
const createLending = async (req, res, next) => {
  try {
    const {
      from_account_id, borrower_name, borrower_phone, borrower_email,
      principal_amount, interest_rate = 0, due_date, purpose, notes,
    } = req.body;

    if (!from_account_id || !borrower_name || !principal_amount) {
      return error(res, 'from_account_id, borrower_name, and principal_amount are required', 400);
    }

    const accountResult = await query(
      "SELECT id, current_balance, currency FROM accounts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [from_account_id, req.user.id]
    );
    if (!accountResult.rows.length) return error(res, 'Account not found', 404);

    if (parseFloat(accountResult.rows[0].current_balance) < parseFloat(principal_amount)) {
      return error(res, 'Insufficient balance to lend', 400);
    }

    const interest_amount = parseFloat(principal_amount) * (parseFloat(interest_rate) / 100);
    const total_expected = parseFloat(principal_amount) + interest_amount;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Record as lending transaction (money leaves account but creates receivable)
      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
         VALUES ($1, 'lending', $2, $3, $4, CURRENT_DATE, $5, $6, 'completed') RETURNING id`,
        [req.user.id, from_account_id, principal_amount, accountResult.rows[0].currency,
          `Lent to ${borrower_name}`, borrower_name]
      );

      const lendingResult = await client.query(
        `INSERT INTO lendings (user_id, from_account_id, borrower_name, borrower_phone, borrower_email,
           principal_amount, interest_rate, interest_amount, total_expected, amount_paid,
           remaining_balance, currency, lend_date, due_date, purpose, status, transaction_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,CURRENT_DATE,$12,$13,'active',$14,$15)
         RETURNING *`,
        [
          req.user.id, from_account_id, borrower_name, borrower_phone, borrower_email,
          principal_amount, interest_rate, interest_amount, total_expected,
          total_expected, accountResult.rows[0].currency, due_date, purpose,
          txResult.rows[0].id, notes,
        ]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [principal_amount, from_account_id]
      );

      await client.query('COMMIT');
      return created(res, lendingResult.rows[0]);
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

// POST /api/lendings/:id/payment
const recordLendingPayment = async (req, res, next) => {
  try {
    const { amount, to_account_id, payment_date, notes } = req.body;
    if (!amount || !to_account_id || !payment_date) {
      return error(res, 'amount, to_account_id, and payment_date are required', 400);
    }

    const lendingResult = await query(
      'SELECT * FROM lendings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!lendingResult.rows.length) return error(res, 'Lending not found', 404);
    const lending = lendingResult.rows[0];

    if (parseFloat(amount) > parseFloat(lending.remaining_balance)) {
      return error(res, 'Payment exceeds remaining balance', 400);
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
         VALUES ($1, 'lending_repayment', $2, $3, $4, $5, $6, $7, 'completed') RETURNING id`,
        [req.user.id, to_account_id, amount, lending.currency, payment_date,
          `Repayment from ${lending.borrower_name}`, lending.borrower_name]
      );

      await client.query(
        'INSERT INTO lending_payments (lending_id, user_id, to_account_id, amount, payment_date, notes, transaction_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [lending.id, req.user.id, to_account_id, amount, payment_date, notes, txResult.rows[0].id]
      );

      const newAmountPaid = parseFloat(lending.amount_paid) + parseFloat(amount);
      const newRemaining = parseFloat(lending.total_expected) - newAmountPaid;
      const newStatus = newRemaining <= 0 ? 'fully_paid' : 'partially_paid';

      await client.query(
        'UPDATE lendings SET amount_paid = $1, remaining_balance = $2, status = $3 WHERE id = $4',
        [newAmountPaid, Math.max(0, newRemaining), newStatus, lending.id]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [amount, to_account_id]
      );

      await client.query('COMMIT');
      return success(res, null, 'Payment recorded successfully');
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

// PUT /api/lendings/:id
const updateLending = async (req, res, next) => {
  try {
    const { due_date, notes, status } = req.body;
    const result = await query(
      'UPDATE lendings SET due_date = COALESCE($1,due_date), notes = COALESCE($2,notes), status = COALESCE($3,status) WHERE id = $4 AND user_id = $5 RETURNING *',
      [due_date, notes, status, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Lending not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLendings, getLending, createLending, recordLendingPayment, updateLending };
