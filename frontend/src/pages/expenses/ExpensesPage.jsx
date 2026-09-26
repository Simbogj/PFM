import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingDown, Trash2 } from 'lucide-react';
import { expensesAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import StatCard from '../../components/ui/StatCard';
import ExpensePieChart from '../../components/charts/ExpensePieChart';
import AddExpenseForm from './AddExpenseForm';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        expensesAPI.getAll({ limit: 50 }),
        expensesAPI.getByCategory({ start_date: monthStart, end_date: monthEnd }),
      ]);
      setExpenses(expRes.data.data);
      setByCategory(catRes.data.data);
    } catch { setError('Failed to load expenses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await expensesAPI.delete(id); load(); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); }
  };

  const thisMonthExpenses = expenses.filter(t => t.date >= monthStart && t.date <= monthEnd);
  const totalThisMonth = thisMonthExpenses.reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalAll = expenses.reduce((s, t) => s + parseFloat(t.amount), 0);
  const avgPerTransaction = expenses.length ? totalAll / expenses.length : 0;

  const closeModal = () => { setModal(false); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track where your money goes</p>
        </div>
        <Button icon={Plus} onClick={() => setModal(true)}>Add Expense</Button>
      </div>

      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="This Month" value={formatCurrency(totalThisMonth)} icon={TrendingDown}
          iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500" />
        <StatCard title="Average per Transaction" value={formatCurrency(avgPerTransaction)} icon={TrendingDown}
          iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-500" />
        <StatCard title="Total Records" value={expenses.length} icon={TrendingDown}
          iconBg="bg-gray-100 dark:bg-gray-700" iconColor="text-gray-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><h2 className="section-title">Expense History</h2></CardHeader>
          {loading ? <LoadingSpinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    {['Date', 'Description', 'Category', 'Account', 'Amount', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {expenses.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 group">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.description || t.payee_payer || '—'}</p>
                        {t.payee_payer && t.description && <p className="text-xs text-gray-400">{t.payee_payer}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.category_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.account_name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-500 text-right whitespace-nowrap">-{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expenses.length === 0 && <div className="text-center py-12 text-gray-400">No expenses yet</div>}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader><h2 className="section-title">By Category (This Month)</h2></CardHeader>
          <CardBody>
            {byCategory.length > 0 ? <ExpensePieChart data={byCategory} /> : <p className="text-sm text-gray-400 text-center py-8">No data this month</p>}
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={modal} onClose={closeModal} title="Add Expense">
        <AddExpenseForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default ExpensesPage;
