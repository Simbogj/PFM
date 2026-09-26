/**
 * Format a numeric amount for display.
 * All internal calculations use NUMERIC(15,2) from PostgreSQL — never floats.
 */

const formatAmount = (amount, currency = 'ETB') => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Parse a string/number to a safe decimal string for DB insertion.
 * Returns null if not a valid positive number.
 */
const parseAmount = (value) => {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) return null;
  return num.toFixed(2);
};

module.exports = { formatAmount, parseAmount };
