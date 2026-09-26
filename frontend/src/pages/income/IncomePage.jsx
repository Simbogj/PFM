import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, Briefcase } from 'lucide-react';
import { incomeAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import StatCard from '../../components/ui/StatCard';
import AddIncomeForm from './AddIncomeForm';
import SalaryForm from './SalaryForm';

const IncomePage = () => {
  const [income, setIncome] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incomeAPI.getAll({ limit: 50 });
      setIncome(res.data.data);
      setPagination(res.data.pagination);
    } catch { setError('Failed to load income'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const thisMonthIncome = income.filter(t => t.date >= monthStart && t.date <= monthEnd);
  const totalThisMonth = thisMonthIncome.reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalAll = income.reduce((s, t) => s + parseFloat(t.amount), 0);

  const closeModal = () => { setModal(null); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all money you receive</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Briefcase} size="sm" onClick={() => setModal('salary')}>Add Salary</Button>
          <Button icon={Plus} size="sm" onClick={() => setModal('income')}>Add Income</Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="This Month" value={formatCurrency(totalThisMonth)} icon={TrendingUp}
          iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
        <StatCard title="Total Records" value={pagination.total || income.length} icon={TrendingUp}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
        <StatCard title="All Time" value={formatCurrency(totalAll)} icon={TrendingUp}
          iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600" />
      </div>

      <Card>
        <CardHeader><h2 className="section-title">Income History</h2></CardHeader>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Date', 'Description', 'Source', 'Category', 'Account', 'Amount'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {income.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{t.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.payee_payer || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.category_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.account_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">+{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {income.length === 0 && <div className="text-center py-12 text-gray-400">No income records yet</div>}
          </div>
        )}
      </Card>

      <Modal isOpen={modal === 'income'} onClose={closeModal} title="Add Income"><AddIncomeForm onSuccess={closeModal} onCancel={closeModal} /></Modal>
      <Modal isOpen={modal === 'salary'} onClose={closeModal} title="Record Salary"><SalaryForm onSuccess={closeModal} onCancel={closeModal} /></Modal>
    </div>
  );
};

export default IncomePage;
