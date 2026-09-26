import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { lendingAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const LendingForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { interest_rate: 0 }
  });
  const [principal, rate] = useWatch({ control, name: ['principal_amount', 'interest_rate'] });
  const interest = (parseFloat(principal) || 0) * ((parseFloat(rate) || 0) / 100);
  const total = (parseFloat(principal) || 0) + interest;

  const onSubmit = async (data) => {
    try {
      setError('');
      await lendingAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record lending');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-700 dark:text-purple-300">
        Lending money reduces your account balance and creates a receivable. It is <strong>not</strong> recorded as an expense.
      </div>

      <div>
        <label className="label">From Account *</label>
        <AccountSelect {...register('from_account_id', { required: 'Account required' })} label="" error={errors.from_account_id?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Borrower Name *</label>
          <input className={`input ${errors.borrower_name ? 'border-red-400' : ''}`} placeholder="e.g. Abebe Girma"
            {...register('borrower_name', { required: 'Required' })} />
          {errors.borrower_name && <p className="text-xs text-red-500 mt-1">{errors.borrower_name.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="+251..." {...register('borrower_phone')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="1" className={`input ${errors.principal_amount ? 'border-red-400' : ''}`}
            placeholder="0.00" {...register('principal_amount', { required: 'Required' })} />
          {errors.principal_amount && <p className="text-xs text-red-500 mt-1">{errors.principal_amount.message}</p>}
        </div>
        <div>
          <label className="label">Interest Rate (%)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0" {...register('interest_rate')} />
        </div>
      </div>

      {total > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Interest:</span><span>{formatCurrency(interest)}</span></div>
          <div className="flex justify-between font-semibold mt-1"><span>Total Expected:</span><span>{formatCurrency(total)}</span></div>
        </div>
      )}

      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" {...register('due_date')} />
      </div>

      <div>
        <label className="label">Purpose</label>
        <input className="input" placeholder="e.g. Business start, personal need" {...register('purpose')} />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Lend Money</Button>
      </div>
    </form>
  );
};

export default LendingForm;
