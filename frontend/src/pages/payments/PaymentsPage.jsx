import { useState } from 'react';
import { Plus, CalendarClock, CheckCircle } from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import PaymentForm from './PaymentForm';
import PaymentPayForm from './PaymentPayForm';

const STATUS_ORDER = { overdue: 0, due_today: 1, upcoming: 2, paid: 3, cancelled: 4 };

const PaymentsPage = () => {
  const { data, loading, error, refetch } = useApi(() => paymentsAPI.getAll());
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState('');

  const payments = (data?.payments || []).sort((a, b) => (STATUS_ORDER[a.status] || 9) - (STATUS_ORDER[b.status] || 9));
  const summary = data?.summary || {};

  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this payment?')) return;
    try { await paymentsAPI.delete(id); refetch(); }
    catch (err) { setActionError(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Payments & Bills</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track recurring bills and due payments</p>
        </div>
        <Button icon={Plus} onClick={() => { setSelected(null); setModal('create'); }}>Add Payment</Button>
      </div>

      {(error || actionError) && <Alert type="error" message={error || actionError} dismissible onDismiss={() => setActionError('')} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Upcoming" value={formatCurrency(summary.total_upcoming || 0)} icon={CalendarClock}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
        <StatCard title="Due Today" value={summary.due_today || 0} subtitle="payments" icon={CalendarClock}
          iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-500" />
        <StatCard title="Overdue" value={formatCurrency(summary.total_overdue || 0)} icon={CalendarClock}
          iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(p => {
            const isActionable = ['upcoming', 'due_today', 'overdue'].includes(p.status);
            const borderColor = p.status === 'overdue' ? 'border-red-300 dark:border-red-700'
              : p.status === 'due_today' ? 'border-orange-300 dark:border-orange-700'
              : 'border-gray-100 dark:border-gray-700';

            return (
              <div key={p.id} className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${borderColor} p-5 shadow-sm`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.payment_name}</h3>
                    {p.payee && <p className="text-xs text-gray-400">{p.payee}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(p.amount)}</p>
                {p.due_date && <p className="text-sm text-gray-500 mt-1">Due: {formatDate(p.due_date)}</p>}
                {p.account_name && <p className="text-xs text-gray-400">{p.account_name}</p>}
                {p.is_recurring && <p className="text-xs text-blue-500 mt-1 capitalize">↻ {p.frequency}</p>}

                <div className="flex gap-2 mt-3">
                  {isActionable && (
                    <Button size="xs" variant="success" icon={CheckCircle}
                      onClick={() => { setSelected(p); setModal('pay'); }} className="flex-1">
                      Mark Paid
                    </Button>
                  )}
                  <Button size="xs" variant="ghost" onClick={() => handleDelete(p.id)}>Cancel</Button>
                </div>
              </div>
            );
          })}
          {payments.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payments yet</p>
              <p className="text-sm text-gray-400 mb-4">Track your recurring bills and due payments</p>
              <Button icon={Plus} size="sm" onClick={() => setModal('create')}>Add Payment</Button>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Add Payment">
        <PaymentForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'pay'} onClose={closeModal} title="Mark as Paid">
        {selected && <PaymentPayForm payment={selected} onSuccess={closeModal} onCancel={closeModal} />}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
