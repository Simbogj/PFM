import { useState } from 'react';
import { Plus, Coins } from 'lucide-react';
import { lendingAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import LendingForm from './LendingForm';
import LendingPaymentForm from './LendingPaymentForm';
import StatCard from '../../components/ui/StatCard';

const LendingPage = () => {
  const { data, loading, error, refetch } = useApi(() => lendingAPI.getAll());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const lendings = data?.lendings || [];
  const summary = data?.summary || {};

  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Lending</h1>
          <p className="text-sm text-gray-500 mt-0.5">Money you have lent to others</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setModal('create'); }}>Lend Money</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Lent" value={formatCurrency(summary.total_lent || 0)} icon={Coins}
          iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600" />
        <StatCard title="Outstanding" value={formatCurrency(summary.total_remaining || 0)} icon={Coins}
          iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600" />
        <StatCard title="Received Back" value={formatCurrency(summary.total_received || 0)} icon={Coins}
          iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lendings.map(l => (
            <div key={l.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{l.borrower_name}</h3>
                  {l.borrower_phone && <p className="text-xs text-gray-400">{l.borrower_phone}</p>}
                </div>
                <StatusBadge status={l.status} />
              </div>

              <ProgressBar value={parseFloat(l.amount_paid)} max={parseFloat(l.total_expected)} height="h-2" />

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lent</span>
                  <span className="font-medium">{formatCurrency(l.principal_amount)}</span>
                </div>
                {parseFloat(l.interest_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Interest ({l.interest_rate}%)</span>
                    <span className="font-medium">{formatCurrency(l.interest_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Received</span>
                  <span className="font-medium text-green-600">{formatCurrency(l.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Remaining</span>
                  <span className="text-orange-600">{formatCurrency(l.remaining_balance)}</span>
                </div>
              </div>

              {l.due_date && (
                <p className="text-xs text-gray-400 mt-2">Due: {formatDate(l.due_date)}</p>
              )}

              {l.purpose && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{l.purpose}</p>}

              {l.status !== 'fully_paid' && l.status !== 'cancelled' && (
                <Button size="xs" variant="outline" onClick={() => { setSelected(l); setModal('payment'); }} className="w-full mt-3">
                  Record Payment Received
                </Button>
              )}
            </div>
          ))}
          {lendings.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No lending records</p>
              <p className="text-sm text-gray-400 mb-4">Track money you lend to friends and family</p>
              <Button icon={Plus} size="sm" onClick={() => setModal('create')}>Lend Money</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Lend Money">
        <LendingForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'payment'} onClose={closeModal} title="Record Payment Received">
        {selected && <LendingPaymentForm lending={selected} onSuccess={closeModal} onCancel={closeModal} />}
      </Modal>
    </div>
  );
};

export default LendingPage;
