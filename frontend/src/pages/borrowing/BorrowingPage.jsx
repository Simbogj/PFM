import { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { borrowingAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import ProgressBar from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import BorrowingForm from './BorrowingForm';
import RepaymentForm from './RepaymentForm';

const BorrowingPage = () => {
  const { data, loading, error, refetch } = useApi(() => borrowingAPI.getAll());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const borrowings = data?.borrowings || [];
  const summary = data?.summary || {};
  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Borrowing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Money you have borrowed from others</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setModal('create'); }}>Record Borrowing</Button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Borrowed" value={formatCurrency(summary.total_borrowed || 0)} icon={DollarSign}
          iconBg="bg-cyan-100 dark:bg-cyan-900/30" iconColor="text-cyan-600" />
        <StatCard title="Outstanding Debt" value={formatCurrency(summary.total_remaining || 0)} icon={DollarSign}
          iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500" />
        <StatCard title="Total Repaid" value={formatCurrency(summary.total_repaid || 0)} icon={DollarSign}
          iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {borrowings.map(b => (
            <div key={b.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{b.lender_name}</h3>
                  {b.lender_phone && <p className="text-xs text-gray-400">{b.lender_phone}</p>}
                </div>
                <StatusBadge status={b.status} />
              </div>

              <ProgressBar value={parseFloat(b.amount_repaid)} max={parseFloat(b.total_payable)} height="h-2"
                color="bg-red-500" />

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Borrowed</span>
                  <span className="font-medium">{formatCurrency(b.principal_amount)}</span>
                </div>
                {parseFloat(b.interest_amount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Interest ({b.interest_rate}%)</span>
                    <span className="font-medium">{formatCurrency(b.interest_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Repaid</span>
                  <span className="font-medium text-green-600">{formatCurrency(b.amount_repaid)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Remaining</span>
                  <span className="text-red-500">{formatCurrency(b.remaining_balance)}</span>
                </div>
              </div>

              {b.monthly_payment && (
                <p className="text-xs text-gray-400 mt-2">Monthly: {formatCurrency(b.monthly_payment)}</p>
              )}
              {b.due_date && <p className="text-xs text-gray-400">Due: {formatDate(b.due_date)}</p>}

              {b.status !== 'fully_repaid' && b.status !== 'cancelled' && (
                <Button size="xs" variant="danger" onClick={() => { setSelected(b); setModal('repay'); }} className="w-full mt-3">
                  Make Repayment
                </Button>
              )}
            </div>
          ))}
          {borrowings.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No borrowing records</p>
              <p className="text-sm text-gray-400 mb-4">Track loans you have taken from others</p>
              <Button icon={Plus} size="sm" onClick={() => setModal('create')}>Record Borrowing</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Record Borrowing">
        <BorrowingForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'repay'} onClose={closeModal} title="Make Repayment">
        {selected && <RepaymentForm borrowing={selected} onSuccess={closeModal} onCancel={closeModal} />}
      </Modal>
    </div>
  );
};

export default BorrowingPage;
