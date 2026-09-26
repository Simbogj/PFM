import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount, currency = 'ETB') => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' ' + currency;
};

export const formatCurrencyCompact = (amount, currency = 'ETB') => {
  const num = parseFloat(amount) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ${currency}`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K ${currency}`;
  return `${num.toFixed(2)} ${currency}`;
};

export const formatDate = (dateStr, fmt = 'dd MMM yyyy') => {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, fmt) : '—';
  } catch { return '—'; }
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
  } catch { return ''; }
};

export const formatPercent = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${Math.min(100, Math.round((value / total) * 100))}%`;
};

export const getTransactionColor = (type) => {
  const colors = {
    income: 'text-green-600',
    expense: 'text-red-500',
    transfer: 'text-blue-500',
    withdrawal: 'text-orange-500',
    deposit: 'text-emerald-500',
    payment: 'text-red-500',
    lending: 'text-purple-500',
    loan_received: 'text-cyan-500',
    loan_repayment: 'text-rose-500',
    lending_repayment: 'text-teal-500',
    savings_deposit: 'text-emerald-600',
    savings_withdrawal: 'text-amber-500',
    investment: 'text-indigo-500',
    refund: 'text-green-500',
    adjustment: 'text-gray-500',
  };
  return colors[type] || 'text-gray-600';
};

export const getTransactionSign = (type) => {
  const positive = ['income', 'loan_received', 'lending_repayment', 'deposit', 'refund'];
  return positive.includes(type) ? '+' : '-';
};

export const getStatusBadgeClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    fully_paid: 'bg-blue-100 text-blue-700',
    fully_repaid: 'bg-blue-100 text-blue-700',
    partially_paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    partially_repaid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500',
    pending: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    upcoming: 'bg-blue-100 text-blue-700',
    due_today: 'bg-orange-100 text-orange-700',
  };
  return classes[status] || 'bg-gray-100 text-gray-600';
};

export const getTxTypeLabel = (type) => {
  const labels = {
    income: 'Income', expense: 'Expense', transfer: 'Transfer',
    withdrawal: 'Withdrawal', deposit: 'Deposit', payment: 'Payment',
    lending: 'Lent', loan_received: 'Borrowed', loan_repayment: 'Loan Repayment',
    lending_repayment: 'Repayment Received', savings_deposit: 'Savings',
    savings_withdrawal: 'Savings Withdrawal', investment: 'Investment',
    refund: 'Refund', adjustment: 'Adjustment',
  };
  return labels[type] || type;
};

export const today = () => format(new Date(), 'yyyy-MM-dd');
