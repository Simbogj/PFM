import { useState } from 'react';
import { Plus, Wallet, Building2, PiggyBank, Smartphone, TrendingUp, CreditCard, MoreVertical, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { accountsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import StatCard from '../../components/ui/StatCard';
import AccountForm from './AccountForm';
import ReconcileForm from './ReconcileForm';

const TYPE_ICONS = {
  BANK: Building2, SAVINGS: PiggyBank, CASH: Wallet,
  MOBILE_MONEY: Smartphone, INVESTMENT: TrendingUp, CREDIT_CARD: CreditCard, OTHER: Wallet,
};

const AccountCard = ({ account, onEdit, onReconcile, onDelete }) => {
  const [menu, setMenu] = useState(false);
  const Icon = TYPE_ICONS[account.account_type_code] || Wallet;
  const bal = parseFloat(account.current_balance);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-2" style={{ backgroundColor: account.color || '#3B82F6' }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (account.color || '#3B82F6') + '20' }}>
              <Icon className="w-5 h-5" style={{ color: account.color || '#3B82F6' }} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{account.account_name}</p>
              <p className="text-xs text-gray-400">{account.type_name || account.account_type_code}</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
                <button onClick={() => { onEdit(account); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 w-full">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { onReconcile(account); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 w-full">
                  <RefreshCw className="w-3.5 h-3.5" /> Reconcile
                </button>
                <button onClick={() => { onDelete(account.id); setMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">
                  <Trash2 className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            )}
          </div>
        </div>

        {account.bank_name && <p className="text-xs text-gray-400 mb-1">{account.bank_name}</p>}
        {account.account_number_last4 && <p className="text-xs text-gray-400 mb-3">•••• {account.account_number_last4}</p>}

        <div className="border-t border-gray-50 dark:border-gray-700 pt-3 mt-3">
          <p className="text-xs text-gray-400 mb-1">Current Balance</p>
          <p className={`text-xl font-bold ${bal < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {formatCurrency(bal, account.currency)}
          </p>
        </div>
      </div>
    </div>
  );
};

const AccountsPage = () => {
  const { accounts, summary, loading, error, refetch } = useAccounts();
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'reconcile'
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState('');

  const openCreate = () => { setSelected(null); setModal('create'); };
  const openEdit = (a) => { setSelected(a); setModal('edit'); };
  const openReconcile = (a) => { setSelected(a); setModal('reconcile'); };

  const handleDelete = async (id) => {
    if (!window.confirm('Close this account? It will be marked as closed.')) return;
    try {
      await accountsAPI.delete(id);
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to close account');
    }
  };

  const closeModal = () => { setModal(null); setSelected(null); refetch(); };

  if (loading) return <LoadingSpinner />;

  const currency = 'ETB';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all your financial accounts</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Account</Button>
      </div>

      {actionError && <Alert type="error" message={actionError} dismissible onDismiss={() => setActionError('')} />}
      {error && <Alert type="error" message={error} />}

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Balance" value={formatCurrency(summary.total_assets, currency)} icon={Wallet} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
          <StatCard title="Bank" value={formatCurrency(summary.bank_balance, currency)} icon={Building2} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600" />
          <StatCard title="Cash" value={formatCurrency(summary.cash_balance, currency)} icon={Wallet} iconBg="bg-yellow-100 dark:bg-yellow-900/30" iconColor="text-yellow-600" />
          <StatCard title="Savings" value={formatCurrency(summary.savings_balance, currency)} icon={PiggyBank} iconBg="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
          <StatCard title="Mobile Money" value={formatCurrency(summary.mobile_balance, currency)} icon={Smartphone} iconBg="bg-cyan-100 dark:bg-cyan-900/30" iconColor="text-cyan-600" />
          <StatCard title="Net Worth" value={formatCurrency(summary.net_worth, currency)} icon={TrendingUp} iconBg="bg-purple-100 dark:bg-purple-900/30" iconColor="text-purple-600" />
        </div>
      )}

      {/* Account Cards */}
      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} onEdit={openEdit} onReconcile={openReconcile} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No accounts yet</p>
              <p className="text-sm text-gray-400 mb-4">Add your first financial account to get started</p>
              <Button icon={Plus} onClick={openCreate} size="sm">Add Account</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={modal === 'create'} onClose={closeModal} title="Add New Account">
        <AccountForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'edit'} onClose={closeModal} title="Edit Account">
        <AccountForm account={selected} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'reconcile'} onClose={closeModal} title="Reconcile Account">
        <ReconcileForm account={selected} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default AccountsPage;
