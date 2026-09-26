import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { savingsAPI } from '../../services/api';
import { today, formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const SavingsDepositForm = ({ goal, type, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const isDeposit = type === 'deposit';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { date: today() }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      if (isDeposit) await savingsAPI.deposit(goal.id, { ...data, from_account_id: data.account_id });
      else await savingsAPI.withdraw(goal.id, { ...data, to_account_id: data.account_id });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{goal.name}</p>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Current</span>
          <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Target</span>
          <span className="font-medium">{formatCurrency(goal.target_amount)}</span>
        </div>
      </div>

      <div>
        <label className="label">{isDeposit ? 'From Account *' : 'To Account *'}</label>
        <AccountSelect {...register('account_id', { required: 'Account required' })}
          label="" error={errors.account_id?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Positive' } })} />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input" {...register('date', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <input className="input" placeholder="Optional" {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} variant={isDeposit ? 'success' : 'primary'} className="flex-1">
          {isDeposit ? 'Deposit' : 'Withdraw'}
        </Button>
      </div>
    </form>
  );
};

export default SavingsDepositForm;
