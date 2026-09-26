const { query } = require('../config/database');
const { success } = require('../utils/response');

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

    // ── Account balances ──────────────────────────────────────
    const accountsResult = await query(
      `SELECT a.*, at.is_asset, at.is_liability
       FROM accounts a
       JOIN account_types at ON at.code = a.account_type_code
       WHERE a.user_id = $1 AND a.status = 'active' AND a.include_in_total = TRUE`,
      [userId]
    );

    const balanceSummary = accountsResult.rows.reduce((acc, a) => {
      const bal = parseFloat(a.current_balance);
      if (a.is_asset) {
        acc.total_assets += bal;
        if (a.account_type_code === 'BANK') acc.bank_balance += bal;
        else if (a.account_type_code === 'CASH') acc.cash_balance += bal;
        else if (a.account_type_code === 'SAVINGS') acc.savings_balance += bal;
        else if (a.account_type_code === 'INVESTMENT') acc.investment_balance += bal;
        else if (a.account_type_code === 'MOBILE_MONEY') acc.mobile_balance += bal;
      } else {
        acc.total_liabilities += bal;
      }
      return acc;
    }, { total_assets: 0, bank_balance: 0, cash_balance: 0, savings_balance: 0, investment_balance: 0, mobile_balance: 0, total_liabilities: 0 });

    // ── Monthly income & expenses ─────────────────────────────
    const monthlyResult = await query(
      `SELECT
         SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as monthly_income,
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
         SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as monthly_payments
       FROM transactions
       WHERE user_id = $1 AND date BETWEEN $2 AND $3 AND status = 'completed'`,
      [userId, monthStart, monthEnd]
    );

    // ── Lending & Borrowing totals ────────────────────────────
    const lendingResult = await query(
      "SELECT COALESCE(SUM(remaining_balance),0) as total_owed_to_me FROM lendings WHERE user_id = $1 AND status NOT IN ('fully_paid','cancelled')",
      [userId]
    );
    const borrowingResult = await query(
      "SELECT COALESCE(SUM(remaining_balance),0) as total_i_owe FROM borrowings WHERE user_id = $1 AND status NOT IN ('fully_repaid','cancelled')",
      [userId]
    );

    // ── Net worth ─────────────────────────────────────────────
    const netWorth = balanceSummary.total_assets
      + parseFloat(lendingResult.rows[0].total_owed_to_me)
      - balanceSummary.total_liabilities
      - parseFloat(borrowingResult.rows[0].total_i_owe);

    // ── Recent transactions ───────────────────────────────────
    const recentTx = await query(
      `SELECT t.*, a.account_name, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // ── Expense by category (this month) ─────────────────────
    const expenseByCategory = await query(
      `SELECT c.name, c.icon, c.color, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.transaction_type = 'expense'
         AND t.date BETWEEN $2 AND $3 AND t.status = 'completed'
       GROUP BY c.name, c.icon, c.color
       ORDER BY total DESC LIMIT 6`,
      [userId, monthStart, monthEnd]
    );

    // ── Monthly trend (last 6 months) ─────────────────────────
    const monthlyTrend = await query(
      `SELECT
         TO_CHAR(date_trunc('month', date), 'Mon YYYY') as month,
         date_trunc('month', date) as month_date,
         SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE user_id = $1
         AND date >= date_trunc('month', NOW() - INTERVAL '5 months')
         AND status = 'completed'
         AND transaction_type IN ('income','expense')
       GROUP BY date_trunc('month', date)
       ORDER BY month_date ASC`,
      [userId]
    );

    // ── Upcoming payments (next 7 days) ───────────────────────
    const upcomingPayments = await query(
      `SELECT p.*, a.account_name
       FROM payments p
       LEFT JOIN accounts a ON a.id = p.account_id
       WHERE p.user_id = $1
         AND p.status IN ('upcoming','due_today','overdue')
         AND (p.due_date <= CURRENT_DATE + INTERVAL '7 days' OR p.status = 'overdue')
       ORDER BY p.due_date ASC
       LIMIT 5`,
      [userId]
    );

    // ── Savings goals summary ─────────────────────────────────
    const savingsSummary = await query(
      `SELECT COALESCE(SUM(current_amount),0) as total_saved,
              COALESCE(SUM(target_amount),0) as total_target
       FROM savings_goals WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    // ── Active lendings count & overdue ──────────────────────
    const lendingStats = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') as active_count,
         COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
       FROM lendings WHERE user_id = $1`,
      [userId]
    );

    return success(res, {
      balance_summary: {
        ...balanceSummary,
        total_owed_to_me: parseFloat(lendingResult.rows[0].total_owed_to_me),
        total_i_owe: parseFloat(borrowingResult.rows[0].total_i_owe),
        net_worth: netWorth,
      },
      monthly: {
        income: parseFloat(monthlyResult.rows[0].monthly_income) || 0,
        expenses: parseFloat(monthlyResult.rows[0].monthly_expenses) || 0,
        payments: parseFloat(monthlyResult.rows[0].monthly_payments) || 0,
        net: (parseFloat(monthlyResult.rows[0].monthly_income) || 0) -
             (parseFloat(monthlyResult.rows[0].monthly_expenses) || 0) -
             (parseFloat(monthlyResult.rows[0].monthly_payments) || 0),
        period: { start: monthStart, end: monthEnd },
      },
      recent_transactions: recentTx.rows,
      expense_by_category: expenseByCategory.rows,
      monthly_trend: monthlyTrend.rows,
      upcoming_payments: upcomingPayments.rows,
      savings: {
        total_saved: parseFloat(savingsSummary.rows[0].total_saved),
        total_target: parseFloat(savingsSummary.rows[0].total_target),
      },
      lending_stats: lendingStats.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
