import { formatDate, formatCurrency, getTransactionColor, getTransactionSign, getTxTypeLabel } from '../../utils/formatters';

const TransactionRow = ({ tx, currency = 'ETB' }) => {
  const sign = getTransactionSign(tx.transaction_type);
  const colorClass = getTransactionColor(tx.transaction_type);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatDate(tx.date)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {tx.category_icon && (
            <span className="text-base">{tx.category_icon}</span>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
              {tx.description || tx.payee_payer || getTxTypeLabel(tx.transaction_type)}
            </p>
            {tx.payee_payer && tx.description && (
              <p className="text-xs text-gray-400">{tx.payee_payer}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
        {tx.category_name || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
        {tx.account_name || '—'}
      </td>
      <td className="px-4 py-3 text-sm hidden md:table-cell">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {getTxTypeLabel(tx.transaction_type)}
        </span>
      </td>
      <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${colorClass}`}>
        {sign}{formatCurrency(tx.amount, currency)}
      </td>
    </tr>
  );
};

export default TransactionRow;
