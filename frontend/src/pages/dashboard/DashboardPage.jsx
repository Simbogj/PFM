import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Coins,
  CreditCard, DollarSign, Plus, Send, ArrowDownToLine, ArrowUpFromLine,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { formatCurrency, formatDate, getTransactionColor, getTransactionSign, getTxTypeLabel } from '../../utils/formatters';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart';
import ExpensePieChart from '../../components/charts/ExpensePieChart';
import NetWorthChart from '../../components/charts/NetWorthChart';
import { StatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AddExpenseForm from '../expenses/AddExpenseForm';
import AddIncomeForm from '../income/AddIncomeForm';
import AddTransferForm from '../transfers/AddTransferForm';

const QuickActionBtn = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-0.5 group`}
  >
    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
  </button>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'income' | 'expense' | 'transfer'

  const load = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeModal = () => { setModal(null); load(); };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return null;

  const { balance_summary: bs, monthly: m, recent_transactions, expense_by_category, monthly_trend, upcoming_payments, savings } = data;
  const currency = 'ETB';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your financial overview</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody className="py-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
            <QuickActionBtn icon={Plus} label="Income" color="bg-emerald-500" onClick={() => setModal('income')} />
            <QuickActionBtn icon={TrendingDown} label="Expense" color="bg-red-500" onClick={() => setModal('expense')} />
            <QuickActionBtn icon={Send} label="Transfer" color="bg-blue-500" onClick={() => setModal('transfer')} />
            <QuickActionBtn icon={ArrowDownToLine} label="Withdraw" color="bg-orange-500" onClick={() => navigate('/transfers')} />
            <QuickActionBtn icon={ArrowUpFromLine} label="Deposit" color="bg-teal-500" onClick={() => navigate('/transfers')} />
            <QuickActionBtn icon={Coins} label="Lend" color="bg-purple-500" onClick={() => navigate('/lending')} />
            <QuickActionBtn icon={DollarSign} label="Borrow" color="bg-cyan-500" onClick={() => navigate('/borrowing')} />
            <QuickActionBtn icon={CreditCard} label="Repay" color="bg-rose-500" onClick={() => navigate('/borrowing')} />
            <QuickActionBtn icon={PiggyBank} label="Save" color="bg-green-600" onClick={() => navigate('/savings')} />
            <QuickActionBtn icon={AlertCircle} label="Bill" color="bg-gray-500" onClick={() => navigate('/payments')} />
          </div>
        </CardBody>
      </Card>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(bs.total_assets, currency)}
          icon={Wallet}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(m.income, currency)}
          icon={TrendingUp}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(m.expenses, currency)}
          icon={TrendingDown}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-500"
        />
        <StatCard
          title="Net This Month"
          value={formatCurrency(m.net, currency)}
          icon={m.net >= 0 ? TrendingUp : TrendingDown}
          iconBg={m.net >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}
          iconColor={m.net >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
        <StatCard
          title="Savings"
          value={formatCurrency(savings.total_saved, currency)}
          subtitle={`of ${formatCurrency(savings.total_target, currency)}`}
          icon={PiggyBank}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Owed to Me"
          value={formatCurrency(bs.total_owed_to_me, currency)}
          icon={Coins}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Net Worth"
          value={formatCurrency(bs.net_worth, currency)}
          icon={DollarSign}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="section-title">Income vs Expenses</h2>
          </CardHeader>
          <CardBody>
            <IncomeExpenseChart data={monthly_trend} currency={currency} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="section-title">Expenses by Category</h2>
          </CardHeader>
          <CardBody>
            {expense_by_category?.length > 0
              ? <ExpensePieChart data={expense_by_category} currency={currency} />
              : <p className="text-sm text-gray-400 text-center py-16">No expense data this month</p>}
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="section-title">Net Worth Trend</h2>
          </CardHeader>
          <CardBody>
            <NetWorthChart data={monthly_trend} currency={currency} />
          </CardBody>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="section-title">Upcoming Payments</h2>
            <button onClick={() => navigate('/payments')} className="text-xs text-primary-600 hover:underline">View all</button>
          </CardHeader>
          <CardBody className="p-0">
            {upcoming_payments?.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {upcoming_payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.payment_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(p.amount, currency)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No upcoming payments</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="section-title">Recent Transactions</h2>
          <button onClick={() => navigate('/transactions')} className="text-xs text-primary-600 hover:underline">View all</button>
        </CardHeader>
        <div className="overflow-x-auto">
          {recent_transactions?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Account</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {recent_transactions.map((tx) => {
                  const sign = getTransactionSign(tx.transaction_type);
                  const color = getTransactionColor(tx.transaction_type);
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                          {tx.description || tx.payee_payer || getTxTypeLabel(tx.transaction_type)}
                        </p>
                        {tx.payee_payer && <p className="text-xs text-gray-400">{tx.payee_payer}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{tx.category_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{tx.account_name || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {getTxTypeLabel(tx.transaction_type)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right whitespace-nowrap ${color}`}>
                        {sign}{formatCurrency(tx.amount, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400 text-center py-10">No recent transactions</p>
          )}
        </div>
      </Card>

      {/* Modals */}
      <Modal isOpen={modal === 'income'} onClose={closeModal} title="Add Income">
        <AddIncomeForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'expense'} onClose={closeModal} title="Add Expense">
        <AddExpenseForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
      <Modal isOpen={modal === 'transfer'} onClose={closeModal} title="New Transfer">
        <AddTransferForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default DashboardPage;
