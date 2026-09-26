import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { transactionsAPI } from '../../services/api';
import { formatCurrency, formatDate, getTransactionColor, getTransactionSign, getTxTypeLabel } from '../../utils/formatters';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import AddExpenseForm from '../expenses/AddExpenseForm';
import AddIncomeForm from '../income/AddIncomeForm';
import { StatusBadge } from '../../components/ui/Badge';

const TX_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'lending', label: 'Lending' },
  { value: 'loan_received', label: 'Loan Received' },
  { value: 'loan_repayment', label: 'Loan Repayment' },
  { value: 'lending_repayment', label: 'Repayment Received' },
  { value: 'savings_deposit', label: 'Savings Deposit' },
  { value: 'payment', label: 'Payment' },
];

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({
    page: 1, limit: 25, search: '', transaction_type: '',
    start_date: '', end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const res = await transactionsAPI.getAll(params);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This will reverse the balance change.')) return;
    try {
      await transactionsAPI.delete(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Filter} size="sm" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          <Button icon={Plus} size="sm" onClick={() => setModal('expense')}>Add Expense</Button>
          <Button icon={Plus} size="sm" variant="success" onClick={() => setModal('income')}>Add Income</Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}

      {/* Search & Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input pl-9" placeholder="Search description, payee, reference..."
                value={filters.search} onChange={e => setFilter('search', e.target.value)} />
            </div>
            <select className="input w-44" value={filters.transaction_type}
              onChange={e => setFilter('transaction_type', e.target.value)}>
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {showFilters && (
            <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">From:</label>
                <input type="date" className="input w-36 text-sm" value={filters.start_date}
                  onChange={e => setFilter('start_date', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">To:</label>
                <input type="date" className="input w-36 text-sm" value={filters.end_date}
                  onChange={e => setFilter('end_date', e.target.value)} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFilters({ page: 1, limit: 25, search: '', transaction_type: '', start_date: '', end_date: '' })}>
                Clear
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {transactions.map(tx => {
                  const sign = getTransactionSign(tx.transaction_type);
                  const color = getTransactionColor(tx.transaction_type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 group">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                          {tx.description || tx.payee_payer || getTxTypeLabel(tx.transaction_type)}
                        </p>
                        {tx.payee_payer && tx.description && <p className="text-xs text-gray-400">{tx.payee_payer}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.category_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{tx.account_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {getTxTypeLabel(tx.transaction_type)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${color}`}>
                        {sign}{formatCurrency(tx.amount, 'ETB')}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-16 text-gray-400">No transactions found</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={ChevronLeft} disabled={pagination.page <= 1}
                onClick={() => setFilter('page', filters.page - 1)} />
              <Button variant="outline" size="sm" icon={ChevronRight} disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilter('page', filters.page + 1)} />
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={modal === 'expense'} onClose={() => { setModal(null); load(); }} title="Add Expense">
        <AddExpenseForm onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal === 'income'} onClose={() => { setModal(null); load(); }} title="Add Income">
        <AddIncomeForm onSuccess={() => { setModal(null); load(); }} onCancel={() => setModal(null)} />
      </Modal>
    </div>
  );
};

export default TransactionsPage;
