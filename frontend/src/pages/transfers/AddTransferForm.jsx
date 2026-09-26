import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { transfersAPI } from '../../services/api';
import { today } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const AddTransferForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { transfer_date: today(), fee_amount: 0, currency: 'ETB' }
  });
  const fromAccount = watch('from_account_id');

  const onSubmit = async (data) => {
    try {
      setError('');
      if (data.from_account_id === data.to_account_id) {
        return setError('Cannot transfer to the same account');
      }
      await transfersAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        Transfers move money between your own accounts. They don&apos;t count as income or expenses.
      </div>

      <div>
        <label className="label">From Account *</label>
        <AccountSelect {...register('from_account_id', { required: 'Required' })}
          error={errors.from_account_id?.message} />
      </div>

      <div>
        <label className="label">To Account *</label>
        <AccountSelect {...register('to_account_id', { required: 'Required' })}
          exclude={fromAccount}
          error={errors.to_account_id?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="0.01" className={`input ${errors.amount ? 'border-red-400' : ''}`}
            placeholder="0.00"
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Positive' } })} />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Transfer Date *</label>
          <input type="date" className="input" {...register('transfer_date', { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Transfer Fee</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...register('fee_amount')} />
        </div>
        <div>
          <label className="label">Reference</label>
          <input className="input" placeholder="Optional" {...register('reference')} />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="e.g. Savings deposit" {...register('description')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Transfer</Button>
      </div>
    </form>
  );
};

export default AddTransferForm;
