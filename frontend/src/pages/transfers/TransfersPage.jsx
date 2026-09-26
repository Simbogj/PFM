import { useState, useEffect, useCallback } from 'react';
import { Plus, Send, Trash2, ArrowRight } from 'lucide-react';
import { transfersAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import AddTransferForm from './AddTransferForm';

const TransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transfersAPI.getAll({ limit: 50 });
      setTransfers(res.data.data);
    } catch { setError('Failed to load transfers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer? Account balances will be reversed.')) return;
    try { await transfersAPI.delete(id); load(); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); }
  };

  const closeModal = () => { setModal(false); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transfers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Move money between your accounts</p>
        </div>
        <Button icon={Plus} onClick={() => setModal(true)}>New Transfer</Button>
      </div>

      {error && <Alert type="error" message={error} dismissible onDismiss={() => setError('')} />}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> Transfers between your own accounts do not count as income or expenses. They simply move money from one account to another and your total net worth stays the same.
      </div>

      <Card>
        <CardHeader><h2 className="section-title">Transfer History</h2></CardHeader>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {['Date', 'From', '', 'To', 'Amount', 'Fee', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 group">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.transfer_date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium">
                        {t.from_account_name}
                      </span>
                    </td>
                    <td className="px-2 py-3"><ArrowRight className="w-4 h-4 text-gray-400" /></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
                        {t.to_account_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(t.amount, t.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {parseFloat(t.fee_amount) > 0 ? formatCurrency(t.fee_amount, t.currency) : '—'}
                    </td>
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
            {transfers.length === 0 && <div className="text-center py-12 text-gray-400">No transfers yet</div>}
          </div>
        )}
      </Card>

      <Modal isOpen={modal} onClose={closeModal} title="New Transfer">
        <AddTransferForm onSuccess={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default TransfersPage;
