const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/borrowings
const getBorrowings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE b.user_id = $1';
    const params = [req.user.id];
    if (status) { where += ' AND b.status = $2'; params.push(status); }

    const result = await query(
      `SELECT b.*, a.account_name as to_account_name
       FROM borrowings b
       LEFT JOIN accounts a ON a.id = b.to_account_id
       ${where}
       ORDER BY b.borrow_date DESC`,
      params
    );

    const summary = result.rows.reduce((acc, b) => {
      acc.total_borrowed += parseFloat(b.principal_amount);
      acc.total_remaining += parseFloat(b.remaining_balance);
      acc.total_repaid += parseFloat(b.amount_repaid);
      return acc;
    }, { total_borrowed: 0, total_remaining: 0, total_repaid: 0 });

    return success(res, { borrowings: result.rows, summary });
  } catch (err) {
    next(err);
  }
};

// GET /api/borrowings/:id
const getBorrowing = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, a.account_name
       FROM borrowings b
       LEFT JOIN accounts a ON a.id = b.to_account_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Borrowing record not found', 404);

    const payments = await query(
      `SELECT bp.*, a.account_name
       FROM borrowing_payments bp
       LEFT JOIN accounts a ON a.id = bp.from_account_id
       WHERE bp.borrowing_id = $1
       ORDER BY bp.payment_date DESC`,
      [req.params.id]
    );

    return success(res, { ...result.rows[0], payments: payments.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/borrowings
const createBorrowing = async (req, res, next) => {
  try {
    const {
      to_account_id, lender_name, lender_phone, lender_email,
      principal_amount, interest_rate = 0, due_date, purpose,
      repayment_frequency, monthly_payment, notes,
    } = req.body;

    if (!to_account_id || !lender_name || !principal_amount) {
      return error(res, 'to_account_id, lender_name, and principal_amount are required', 400);
    }

    const accountResult = await query(
      "SELECT id, currency FROM accounts WHERE id = $1 AND user_id = $2 AND status = 'active'",
      [to_account_id, req.user.id]
    );
    if (!accountResult.rows.length) return error(res, 'Account not found', 404);

    const interest_amount = parseFloat(principal_amount) * (parseFloat(interest_rate) / 100);
    const total_payable = parseFloat(principal_amount) + interest_amount;

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Record as loan_received - money enters account but creates liability
      const txResult = await client.query(
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
         VALUES ($1, 'loan_received', $2, $3, $4, CURRENT_DATE, $5, $6, 'completed') RETURNING id`,
        [req.user.id, to_account_id, principal_amount, accountResult.rows[0].currency,
          `Borrowed from ${lender_name}`, lender_name]
      );

      const borrowingResult = await client.query(
        `INSERT INTO borrowings (user_id, to_account_id, lender_name, lender_phone, lender_email,
           principal_amount, interest_rate, interest_amount, total_payable, amount_repaid,
           remaining_balance, currency, borrow_date, due_date, purpose, repayment_frequency,
           monthly_payment, status, transaction_id, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,CURRENT_DATE,$12,$13,$14,$15,'active',$16,$17)
         RETURNING *`,
        [
          req.user.id, to_account_id, lender_name, lender_phone, lender_email,
          principal_amount, interest_rate, interest_amount, total_payable,
          total_payable, accountResult.rows[0].currency, due_date, purpose,
          repayment_frequency, monthly_payment, txResult.rows[0].id, notes,
        ]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [principal_amount, to_account_id]
      );

      await client.query('COMMIT');
      return created(res, borrowingResult.rows[0]);
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

// POST /api/borrowings/:id/repay
const recordRepayment = async (req, res, next) => {
  try {
    const { amount, from_account_id, payment_date, principal_portion, interest_portion, notes } = req.body;
    if (!amount || !from_account_id || !payment_date) {
      return error(res, 'amount, from_account_id, and payment_date are required', 400);
    }

    const borrowingResult = await query(
      'SELECT * FROM borrowings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!borrowingResult.rows.length) return error(res, 'Borrowing not found', 404);
    const borrowing = borrowingResult.rows[0];

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
        `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
         VALUES ($1, 'loan_repayment', $2, $3, $4, $5, $6, $7, 'completed') RETURNING id`,
        [req.user.id, from_account_id, amount, borrowing.currency, payment_date,
          `Repayment to ${borrowing.lender_name}`, borrowing.lender_name]
      );

      await client.query(
        `INSERT INTO borrowing_payments (borrowing_id, user_id, from_account_id, amount, principal_portion, interest_portion, payment_date, notes, transaction_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [borrowing.id, req.user.id, from_account_id, amount, principal_portion || amount, interest_portion || 0, payment_date, notes, txResult.rows[0].id]
      );

      const newAmountRepaid = parseFloat(borrowing.amount_repaid) + parseFloat(amount);
      const newRemaining = parseFloat(borrowing.total_payable) - newAmountRepaid;
      const newStatus = newRemaining <= 0 ? 'fully_repaid' : 'partially_repaid';

      await client.query(
        'UPDATE borrowings SET amount_repaid = $1, remaining_balance = $2, status = $3 WHERE id = $4',
        [newAmountRepaid, Math.max(0, newRemaining), newStatus, borrowing.id]
      );

      await client.query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amount, from_account_id]
      );

      await client.query('COMMIT');
      return success(res, null, 'Repayment recorded successfully');
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

// PUT /api/borrowings/:id
const updateBorrowing = async (req, res, next) => {
  try {
    const { due_date, notes, status } = req.body;
    const result = await query(
      'UPDATE borrowings SET due_date = COALESCE($1,due_date), notes = COALESCE($2,notes), status = COALESCE($3,status) WHERE id = $4 AND user_id = $5 RETURNING *',
      [due_date, notes, status, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Borrowing not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBorrowings, getBorrowing, createBorrowing, recordRepayment, updateBorrowing };
