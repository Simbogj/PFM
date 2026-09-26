import { useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { budgetsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import StatCard from '../../components/ui/StatCard';
import BudgetForm from './BudgetForm';

const now = new Date();
const MONTH = now.getMonth() + 1;
const YEAR = now.getFullYear();

const BudgetsPage = () => {
  const { data, loading, error, refetch } = useApi(() => budgetsAPI.getAll({ month: MONTH, year: YEAR }));
  const [modal, setModal] = useState(false);

  const budgets = data?.budgets || [];
  const summary = data?.summary || {};

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this budget?')) return;
    try { await budgetsAPI.delete(id); refetch(); } catch {}
  };

  const closeModal = () => { setModal(false); refetch(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(YEAR, MONTH - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModal(true)}>New Budget</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Budgeted" value={formatCurrency(summary.total_budgeted || 0)} icon={CreditCard}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
        <StatCard title="Total Spent" value={formatCurrency(summary.total_spent || 0)} icon={CreditCard}
          iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500" />
        <StatCard title="Remaining" value={formatCurrency((summary.total_budgeted || 0) - (summary.total_spent || 0))} icon={CreditCard}
          iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const isOver = b.spent_amount > parseFloat(b.amount);
            return (
              <div key={b.id} className={`bg-white dark:bg-gray-800 rounded-xl border ${isOver ? 'border-red-200 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'} shadow-sm p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3>
                    {b.category_name && <p className="text-xs text-gray-400">{b.category_name}</p>}
                  </div>
                  {isOver && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-medium rounded-full">Over Budget</span>
                  )}
                </div>

                <ProgressBar value={b.spent_amount} max={parseFloat(b.amount)} height="h-3" showLabel
                  label={`${formatCurrency(b.spent_amount)} / ${formatCurrency(b.amount)}`} />

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium">{formatCurrency(b.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Spent</span>
                    <span className={`font-medium ${isOver ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{formatCurrency(b.spent_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{isOver ? 'Over by' : 'Remaining'}</span>
                    <span className={isOver ? 'text-red-500' : 'text-green-600'}>{formatCurrency(Math.abs(b.remaining))}</span>
                  </div>
                </div>

                <button onClick={() => handleDelete(b.id)} className="text-xs text-gray-400 hover:text-red-500 mt-2 w-full text-center">Remove</button>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No budgets set</p>
              <p className="text-sm text-gray-400 mb-4">Set spending limits by category</p>
              <Button icon={Plus} size="sm" onClick={() => setModal(true)}>Create Budget</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal} onClose={closeModal} title="New Budget">
        <BudgetForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default BudgetsPage;
