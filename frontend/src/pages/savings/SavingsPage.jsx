import { useState } from 'react';
import { Plus, PiggyBank, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { savingsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import SavingsGoalForm from './SavingsGoalForm';
import SavingsDepositForm from './SavingsDepositForm';

const SavingsPage = () => {
  const { data, loading, error, refetch } = useApi(() => savingsAPI.getAll());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const goals = data || [];
  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount), 0);

  const openDeposit = (g) => { setSelected({ goal: g, type: 'deposit' }); setModal('transaction'); };
  const openWithdraw = (g) => { setSelected({ goal: g, type: 'withdraw' }); setModal('transaction'); };
  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this savings goal?')) return;
    try { await savingsAPI.delete(id); refetch(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track progress towards your financial goals</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setModal('create'); }}>New Goal</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: formatCurrency(totalSaved), color: 'text-green-600' },
          { label: 'Total Target', value: formatCurrency(totalTarget), color: 'text-blue-600' },
          { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                  {goal.target_date && <p className="text-xs text-gray-400 mt-0.5">Target: {formatDate(goal.target_date)}</p>}
                </div>
                <StatusBadge status={goal.status} />
              </div>

              {goal.description && <p className="text-xs text-gray-500 mb-3">{goal.description}</p>}

              <ProgressBar value={parseFloat(goal.current_amount)} max={parseFloat(goal.target_amount)}
                showLabel label={`${goal.progress_percent || 0}%`} height="h-3" />

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saved</span>
                  <span className="font-semibold text-green-600">{formatCurrency(goal.current_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Target</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(Math.max(0, parseFloat(goal.target_amount) - parseFloat(goal.current_amount)))}
                  </span>
                </div>
              </div>

              {goal.status === 'active' && (
                <div className="flex gap-2 mt-4">
                  <Button size="xs" icon={ArrowDownToLine} variant="success" onClick={() => openDeposit(goal)} className="flex-1">Deposit</Button>
                  <Button size="xs" icon={ArrowUpFromLine} variant="outline" onClick={() => openWithdraw(goal)} className="flex-1">Withdraw</Button>
                </div>
              )}
              <button onClick={() => handleDelete(goal.id)} className="text-xs text-gray-400 hover:text-red-500 mt-2 w-full text-center transition-colors">Cancel Goal</button>
            </div>
          ))}

          {goals.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No savings goals yet</p>
              <p className="text-sm text-gray-400 mb-4">Create your first goal to start saving</p>
              <Button icon={Plus} size="sm" onClick={() => setModal('create')}>Create Goal</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="New Savings Goal">
        <SavingsGoalForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'transaction'} onClose={closeModal}
        title={selected?.type === 'deposit' ? 'Deposit to Savings' : 'Withdraw from Savings'}>
        {selected && <SavingsDepositForm goal={selected.goal} type={selected.type} onSuccess={closeModal} onCancel={closeModal} />}
      </Modal>
    </div>
  );
};

export default SavingsPage;
