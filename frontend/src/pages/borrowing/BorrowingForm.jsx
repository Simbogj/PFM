import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { borrowingAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const BorrowingForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { interest_rate: 0, repayment_frequency: 'monthly' }
  });
  const [principal, rate] = useWatch({ control, name: ['principal_amount', 'interest_rate'] });
  const interest = (parseFloat(principal) || 0) * ((parseFloat(rate) || 0) / 100);
  const total = (parseFloat(principal) || 0) + interest;

  const onSubmit = async (data) => {
    try {
      setError('');
      await borrowingAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm text-cyan-700 dark:text-cyan-300">
        Borrowing money increases your account balance but creates a liability. It is <strong>not</strong> recorded as income.
      </div>

      <div>
        <label className="label">Receive Into Account *</label>
        <AccountSelect {...register('to_account_id', { required: 'Required' })} label="" error={errors.to_account_id?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Lender Name *</label>
          <input className={`input ${errors.lender_name ? 'border-red-400' : ''}`} placeholder="e.g. Friend, Bank"
            {...register('lender_name', { required: 'Required' })} />
          {errors.lender_name && <p className="text-xs text-red-500 mt-1">{errors.lender_name.message}</p>}
        </div>
        <div>
          <label className="label">Lender Phone</label>
          <input className="input" placeholder="+251..." {...register('lender_phone')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="1" className="input" placeholder="0.00"
            {...register('principal_amount', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Interest Rate (%)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0"
            {...register('interest_rate')} />
        </div>
      </div>

      {total > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Interest:</span><span>{formatCurrency(interest)}</span></div>
          <div className="flex justify-between font-semibold mt-1"><span>Total Payable:</span><span className="text-red-500">{formatCurrency(total)}</span></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" {...register('due_date')} />
        </div>
        <div>
          <label className="label">Repayment Frequency</label>
          <select className="input" {...register('repayment_frequency')}>
            <option value="one_time">One Time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Monthly Payment Amount</label>
        <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...register('monthly_payment')} />
      </div>

      <div>
        <label className="label">Purpose</label>
        <input className="input" placeholder="e.g. Home renovation" {...register('purpose')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Record Borrowing</Button>
      </div>
    </form>
  );
};

export default BorrowingForm;
