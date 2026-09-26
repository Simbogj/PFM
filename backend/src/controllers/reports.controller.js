const { query } = require('../config/database');
const { success, error } = require('../utils/response');

// GET /api/reports/cash-flow
const getCashFlow = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) return error(res, 'start_date and end_date are required', 400);

    const userId = req.user.id;

    // Opening balance: sum of all account balances before start_date
    const openingResult = await query(
      `SELECT COALESCE(SUM(
         CASE
           WHEN t.transaction_type IN ('income','loan_received','lending_repayment','deposit','refund') THEN t.amount
           WHEN t.transaction_type IN ('expense','payment','lending','loan_repayment','savings_deposit','investment') THEN -t.amount
           ELSE 0
         END), 0) as opening_balance_change
       FROM transactions t
       WHERE t.user_id = $1 AND t.date < $2 AND t.status = 'completed'`,
      [userId, start_date]
    );

    const baseBalanceResult = await query(
      'SELECT COALESCE(SUM(opening_balance),0) as total_opening FROM accounts WHERE user_id = $1 AND include_in_total = TRUE',
      [userId]
    );

    const openingBalance = parseFloat(baseBalanceResult.rows[0].total_opening) +
                           parseFloat(openingResult.rows[0].opening_balance_change);

    // Income breakdown
    const incomeResult = await query(
      `SELECT c.name as category, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.transaction_type = 'income'
         AND t.date BETWEEN $2 AND $3 AND t.status = 'completed'
       GROUP BY c.name ORDER BY total DESC`,
      [userId, start_date, end_date]
    );

    // Expense breakdown
    const expenseResult = await query(
      `SELECT c.name as category, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.transaction_type = 'expense'
         AND t.date BETWEEN $2 AND $3 AND t.status = 'completed'
       GROUP BY c.name ORDER BY total DESC`,
      [userId, start_date, end_date]
    );

    // Totals
    const totalsResult = await query(
      `SELECT
         SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
         SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments,
         SUM(CASE WHEN transaction_type = 'loan_received' THEN amount ELSE 0 END) as total_borrowed,
         SUM(CASE WHEN transaction_type = 'loan_repayment' THEN amount ELSE 0 END) as total_loan_repaid,
         SUM(CASE WHEN transaction_type = 'lending' THEN amount ELSE 0 END) as total_lent,
         SUM(CASE WHEN transaction_type = 'lending_repayment' THEN amount ELSE 0 END) as total_lending_received,
         SUM(CASE WHEN transaction_type = 'savings_deposit' THEN amount ELSE 0 END) as total_savings_in,
         SUM(CASE WHEN transaction_type = 'savings_withdrawal' THEN amount ELSE 0 END) as total_savings_out,
         SUM(CASE WHEN transaction_type = 'investment' THEN amount ELSE 0 END) as total_invested
       FROM transactions
       WHERE user_id = $1 AND date BETWEEN $2 AND $3 AND status = 'completed'`,
      [userId, start_date, end_date]
    );

    const t = totalsResult.rows[0];
    const totalInflow = (parseFloat(t.total_income) || 0) +
                        (parseFloat(t.total_borrowed) || 0) +
                        (parseFloat(t.total_lending_received) || 0);
    const totalOutflow = (parseFloat(t.total_expenses) || 0) +
                         (parseFloat(t.total_payments) || 0) +
                         (parseFloat(t.total_loan_repaid) || 0) +
                         (parseFloat(t.total_lent) || 0) +
                         (parseFloat(t.total_invested) || 0);

    const closingBalance = openingBalance + totalInflow - totalOutflow;

    return success(res, {
      period: { start_date, end_date },
      opening_balance: openingBalance,
      inflow: {
        income: parseFloat(t.total_income) || 0,
        borrowed: parseFloat(t.total_borrowed) || 0,
        lending_received: parseFloat(t.total_lending_received) || 0,
        total: totalInflow,
        breakdown: incomeResult.rows,
      },
      outflow: {
        expenses: parseFloat(t.total_expenses) || 0,
        payments: parseFloat(t.total_payments) || 0,
        loan_repaid: parseFloat(t.total_loan_repaid) || 0,
        lent: parseFloat(t.total_lent) || 0,
        invested: parseFloat(t.total_invested) || 0,
        total: totalOutflow,
        breakdown: expenseResult.rows,
      },
      internal_movement: {
        savings_in: parseFloat(t.total_savings_in) || 0,
        savings_out: parseFloat(t.total_savings_out) || 0,
      },
      net_cash_flow: totalInflow - totalOutflow,
      closing_balance: closingBalance,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/net-worth
const getNetWorth = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Current account balances
    const accountsResult = await query(
      `SELECT a.account_name, a.account_type_code, a.current_balance, a.currency,
              at.is_asset, at.is_liability, at.name as type_name
       FROM accounts a
       JOIN account_types at ON at.code = a.account_type_code
       WHERE a.user_id = $1 AND a.status = 'active' AND a.include_in_total = TRUE`,
      [userId]
    );

    // Active lendings (receivables)
    const lendingsResult = await query(
      "SELECT borrower_name, remaining_balance, currency FROM lendings WHERE user_id = $1 AND status NOT IN ('fully_paid','cancelled')",
      [userId]
    );

    // Active borrowings (liabilities)
    const borrowingsResult = await query(
      "SELECT lender_name, remaining_balance, currency FROM borrowings WHERE user_id = $1 AND status NOT IN ('fully_repaid','cancelled')",
      [userId]
    );

    const assets = {
      bank: accountsResult.rows.filter(a => a.account_type_code === 'BANK' && a.is_asset),
      savings: accountsResult.rows.filter(a => a.account_type_code === 'SAVINGS' && a.is_asset),
      cash: accountsResult.rows.filter(a => a.account_type_code === 'CASH' && a.is_asset),
      investment: accountsResult.rows.filter(a => a.account_type_code === 'INVESTMENT' && a.is_asset),
      mobile: accountsResult.rows.filter(a => a.account_type_code === 'MOBILE_MONEY' && a.is_asset),
      receivables: lendingsResult.rows,
    };

    const liabilities = {
      credit_cards: accountsResult.rows.filter(a => a.is_liability),
      loans: borrowingsResult.rows,
    };

    const totalAssets = [
      ...Object.values(assets).flat(),
    ].reduce((sum, a) => sum + parseFloat(a.current_balance || a.remaining_balance || 0), 0);

    const totalLiabilities = [
      ...liabilities.credit_cards,
      ...liabilities.loans,
    ].reduce((sum, l) => sum + parseFloat(l.current_balance || l.remaining_balance || 0), 0);

    // Net worth trend (monthly for last 12 months)
    const trendResult = await query(
      `SELECT
         TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month,
         date_trunc('month', date) as month_date,
         SUM(CASE
           WHEN transaction_type IN ('income','loan_received','lending_repayment','deposit','refund') THEN amount
           WHEN transaction_type IN ('expense','payment','lending','loan_repayment','savings_deposit','investment') THEN -amount
           ELSE 0
         END) as net_change
       FROM transactions
       WHERE user_id = $1
         AND date >= date_trunc('month', NOW() - INTERVAL '11 months')
         AND status = 'completed'
       GROUP BY date_trunc('month', date)
       ORDER BY month_date ASC`,
      [userId]
    );

    return success(res, {
      assets,
      liabilities,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: totalAssets - totalLiabilities,
      trend: trendResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/monthly-summary
const getMonthlySummary = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const result = await query(
      `SELECT
         TO_CHAR(date_trunc('month', date), 'YYYY-MM') as month_key,
         TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month_label,
         SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses,
         SUM(CASE WHEN transaction_type = 'savings_deposit' THEN amount ELSE 0 END) as savings,
         SUM(CASE WHEN transaction_type = 'loan_repayment' THEN amount ELSE 0 END) as debt_paid,
         COUNT(*) FILTER (WHERE transaction_type = 'expense') as expense_count
       FROM transactions
       WHERE user_id = $1
         AND date >= date_trunc('month', NOW() - INTERVAL '${parseInt(months) - 1} months')
         AND status = 'completed'
         AND transaction_type IN ('income','expense','savings_deposit','loan_repayment')
       GROUP BY date_trunc('month', date)
       ORDER BY month_key ASC`,
      [req.user.id]
    );
    return success(res, result.rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/account-statement
const getAccountStatement = async (req, res, next) => {
  try {
    const { account_id, start_date, end_date } = req.query;
    if (!account_id || !start_date || !end_date) {
      return error(res, 'account_id, start_date, and end_date are required', 400);
    }

    const accountResult = await query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [account_id, req.user.id]
    );
    if (!accountResult.rows.length) return error(res, 'Account not found', 404);

    const txResult = await query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.account_id = $1 AND t.user_id = $2
         AND t.date BETWEEN $3 AND $4
         AND t.status = 'completed'
       ORDER BY t.date ASC, t.created_at ASC`,
      [account_id, req.user.id, start_date, end_date]
    );

    return success(res, {
      account: accountResult.rows[0],
      transactions: txResult.rows,
      period: { start_date, end_date },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/calendar-events
const getCalendarEvents = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetYear = parseInt(year) || now.getFullYear();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

    const userId = req.user.id;

    // Payments due in month
    const paymentsResult = await query(
      `SELECT id, payment_name as title, due_date as date, amount, status, 'payment' as event_type
       FROM payments WHERE user_id = $1 AND due_date BETWEEN $2 AND $3`,
      [userId, startDate, endDate]
    );

    // Transactions in month
    const txResult = await query(
      `SELECT t.id, COALESCE(t.description, c.name) as title, t.date, t.amount,
              t.transaction_type as event_type, t.status
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.date BETWEEN $2 AND $3
         AND t.transaction_type IN ('income','expense')
       ORDER BY t.date ASC`,
      [userId, startDate, endDate]
    );

    // Lending due dates
    const lendingResult = await query(
      `SELECT id, borrower_name as title, due_date as date, remaining_balance as amount,
              status, 'lending_due' as event_type
       FROM lendings
       WHERE user_id = $1 AND due_date BETWEEN $2 AND $3
         AND status NOT IN ('fully_paid','cancelled')`,
      [userId, startDate, endDate]
    );

    // Borrowing due dates
    const borrowingResult = await query(
      `SELECT id, lender_name as title, due_date as date, remaining_balance as amount,
              status, 'borrowing_due' as event_type
       FROM borrowings
       WHERE user_id = $1 AND due_date BETWEEN $2 AND $3
         AND status NOT IN ('fully_repaid','cancelled')`,
      [userId, startDate, endDate]
    );

    return success(res, {
      payments: paymentsResult.rows,
      transactions: txResult.rows,
      lending_due: lendingResult.rows,
      borrowing_due: borrowingResult.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCashFlow, getNetWorth, getMonthlySummary, getAccountStatement, getCalendarEvents };
