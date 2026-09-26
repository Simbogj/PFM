import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { accountsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const ReconcileForm = ({ account, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      const res = await accountsAPI.reconcile(account.id, {
        actual_balance: parseFloat(data.actual_balance),
        reason: data.reason,
      });
      setResult(res.data.data);
      if (res.data.data.difference === 0) onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Reconciliation failed');
    }
  };

  if (result && result.difference !== 0) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-xl ${result.difference > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Reconciliation Complete</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">System Balance:</span><span>{formatCurrency(result.system_balance, account.currency)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Actual Balance:</span><span>{formatCurrency(result.actual_balance, account.currency)}</span></div>
            <div className={`flex justify-between font-semibold ${result.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Difference:</span><span>{result.difference > 0 ? '+' : ''}{formatCurrency(result.difference, account.currency)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500">An adjustment transaction has been recorded to reflect the actual balance.</p>
        <Button onClick={onSuccess} className="w-full justify-center">Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <p className="text-sm text-gray-500 mb-1">Account</p>
        <p className="font-semibold text-gray-900 dark:text-white">{account?.account_name}</p>
        <p className="text-sm text-gray-500 mt-2">System Balance</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(account?.current_balance, account?.currency)}</p>
      </div>

      <div>
        <label className="label">Actual Bank Balance *</label>
        <input type="number" step="0.01" className="input"
          placeholder="Enter your actual balance from the bank"
          {...register('actual_balance', { required: 'Actual balance is required' })} />
      </div>

      <div>
        <label className="label">Reason for Adjustment</label>
        <input className="input" placeholder="e.g. Bank fees, rounding difference..."
          {...register('reason')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Reconcile</Button>
      </div>
    </form>
  );
};

export default ReconcileForm;
