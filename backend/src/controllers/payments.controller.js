const { query, getClient } = require('../config/database');
const { success, created, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE p.user_id = $1';
    const params = [req.user.id];
    if (status) { where += ' AND p.status = $2'; params.push(status); }

    // Auto-update overdue status
    await query(
      `UPDATE payments SET status = 'overdue'
       WHERE user_id = $1 AND status = 'upcoming' AND due_date < CURRENT_DATE`,
      [req.user.id]
    );
    await query(
      `UPDATE payments SET status = 'due_today'
       WHERE user_id = $1 AND status = 'upcoming' AND due_date = CURRENT_DATE`,
      [req.user.id]
    );

    const result = await query(
      `SELECT p.*, a.account_name, c.name as category_name
       FROM payments p
       LEFT JOIN accounts a ON a.id = p.account_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY
         CASE p.status WHEN 'overdue' THEN 0 WHEN 'due_today' THEN 1 WHEN 'upcoming' THEN 2 ELSE 3 END,
         p.due_date ASC`,
      params
    );

    const summary = {
      total_upcoming: result.rows.filter(p => p.status === 'upcoming').reduce((s, p) => s + parseFloat(p.amount), 0),
      total_overdue: result.rows.filter(p => p.status === 'overdue').reduce((s, p) => s + parseFloat(p.amount), 0),
      due_today: result.rows.filter(p => p.status === 'due_today').length,
    };

    return success(res, { payments: result.rows, summary });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments
const createPayment = async (req, res, next) => {
  try {
    const {
      payment_name, payment_type = 'bill', amount, currency = 'ETB',
      account_id, due_date, is_recurring = false, frequency,
      reminder_days = 3, payee, category_id, notes,
    } = req.body;

    if (!payment_name || !amount) {
      return error(res, 'Payment name and amount are required', 400);
    }

    const result = await query(
      `INSERT INTO payments (user_id, payment_name, payment_type, amount, currency, account_id, due_date, is_recurring, frequency, next_due_date, reminder_days, payee, category_id, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$7,$10,$11,$12,$13,'upcoming') RETURNING *`,
      [req.user.id, payment_name, payment_type, amount, currency, account_id, due_date, is_recurring, frequency, reminder_days, payee, category_id, notes]
    );

    return created(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/payments/:id
const updatePayment = async (req, res, next) => {
  try {
    const { payment_name, amount, due_date, account_id, notes, frequency, reminder_days } = req.body;
    const result = await query(
      `UPDATE payments SET
         payment_name = COALESCE($1, payment_name),
         amount = COALESCE($2, amount),
         due_date = COALESCE($3, due_date),
         account_id = COALESCE($4, account_id),
         notes = COALESCE($5, notes),
         frequency = COALESCE($6, frequency),
         reminder_days = COALESCE($7, reminder_days)
       WHERE id = $8 AND user_id = $9 RETURNING *`,
      [payment_name, amount, due_date, account_id, notes, frequency, reminder_days, req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Payment not found', 404);
    return success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/:id/pay
const markAsPaid = async (req, res, next) => {
  try {
    const { paid_amount, paid_date, account_id } = req.body;

    const paymentResult = await query(
      'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!paymentResult.rows.length) return error(res, 'Payment not found', 404);
    const payment = paymentResult.rows[0];

    const useAccountId = account_id || payment.account_id;
    const useAmount = paid_amount || payment.amount;
    const useDate = paid_date || new Date().toISOString().split('T')[0];

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Create expense transaction
      let txId = null;
      if (useAccountId) {
        const txResult = await client.query(
          `INSERT INTO transactions (user_id, transaction_type, account_id, amount, currency, date, description, payee_payer, status)
           VALUES ($1, 'payment', $2, $3, $4, $5, $6, $7, 'completed') RETURNING id`,
          [req.user.id, useAccountId, useAmount, payment.currency, useDate, payment.payment_name, payment.payee]
        );
        txId = txResult.rows[0].id;

        await client.query(
          'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2 AND user_id = $3',
          [useAmount, useAccountId, req.user.id]
        );
      }

      // Calculate next due date for recurring payments
      let nextDueDate = null;
      if (payment.is_recurring && payment.frequency) {
        const currentDue = new Date(payment.due_date);
        switch (payment.frequency) {
          case 'weekly': currentDue.setDate(currentDue.getDate() + 7); break;
          case 'monthly': currentDue.setMonth(currentDue.getMonth() + 1); break;
          case 'quarterly': currentDue.setMonth(currentDue.getMonth() + 3); break;
          case 'yearly': currentDue.setFullYear(currentDue.getFullYear() + 1); break;
        }
        nextDueDate = currentDue.toISOString().split('T')[0];
      }

      if (payment.is_recurring && nextDueDate) {
        // Update current to paid, create next occurrence
        await client.query(
          "UPDATE payments SET status = 'paid', paid_date = $1, paid_amount = $2, transaction_id = $3 WHERE id = $4",
          [useDate, useAmount, txId, payment.id]
        );
        await client.query(
          `INSERT INTO payments (user_id, payment_name, payment_type, amount, currency, account_id, due_date, next_due_date, is_recurring, frequency, reminder_days, payee, category_id, notes, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10,$11,$12,$13,'upcoming')`,
          [req.user.id, payment.payment_name, payment.payment_type, payment.amount, payment.currency,
            payment.account_id, nextDueDate, payment.is_recurring, payment.frequency,
            payment.reminder_days, payment.payee, payment.category_id, payment.notes]
        );
      } else {
        await client.query(
          "UPDATE payments SET status = 'paid', paid_date = $1, paid_amount = $2, transaction_id = $3 WHERE id = $4",
          [useDate, useAmount, txId, payment.id]
        );
      }

      await client.query('COMMIT');
      return success(res, null, 'Payment marked as paid');
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

// DELETE /api/payments/:id
const deletePayment = async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE payments SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return error(res, 'Payment not found', 404);
    return success(res, null, 'Payment cancelled');
  } catch (err) {
    next(err);
  }
};

module.exports = { getPayments, createPayment, updatePayment, markAsPaid, deletePayment };
