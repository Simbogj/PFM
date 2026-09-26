import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { goalsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import GoalForm from './GoalForm';

const GoalsPage = () => {
  const { data: goals, loading, error, refetch } = useApi(() => goalsAPI.getAll());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Work towards your financial milestones</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setModal('create'); }}>New Goal</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(goals || []).map(g => (
            <div key={g.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5"
              style={{ borderTopColor: g.color || '#6366F1', borderTopWidth: 4 }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{g.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{g.goal_type?.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={g.status} />
              </div>

              {g.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{g.description}</p>}

              <ProgressBar value={parseFloat(g.current_amount)} max={parseFloat(g.target_amount)} height="h-3" />

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold" style={{ color: g.color }}>{g.progress_percent || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current</span>
                  <span className="font-medium text-green-600">{formatCurrency(g.current_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Target</span>
                  <span className="font-medium">{formatCurrency(g.target_amount)}</span>
                </div>
                {g.required_monthly && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly needed</span>
                    <span className="font-medium text-blue-600">{formatCurrency(g.required_monthly)}</span>
                  </div>
                )}
              </div>

              {g.target_date && (
                <p className="text-xs text-gray-400 mt-2">Target date: {formatDate(g.target_date)}</p>
              )}

              <div className="flex gap-2 mt-3">
                <Button size="xs" variant="outline" onClick={() => { setSelected(g); setModal('edit'); }} className="flex-1">Edit</Button>
              </div>
            </div>
          ))}
          {(!goals || goals.length === 0) && (
            <div className="col-span-3 text-center py-16">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No goals yet</p>
              <p className="text-sm text-gray-400 mb-4">Define your financial goals and track progress</p>
              <Button icon={Plus} size="sm" onClick={() => setModal('create')}>Create Goal</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="New Financial Goal">
        <GoalForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title="Edit Goal">
        <GoalForm goal={selected} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default GoalsPage;
