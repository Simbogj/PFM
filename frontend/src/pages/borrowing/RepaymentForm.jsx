import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { borrowingAPI } from '../../services/api';
import { today, formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const RepaymentForm = ({ borrowing, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { payment_date: today(), amount: borrowing?.monthly_payment || borrowing?.remaining_balance }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await borrowingAPI.repay(borrowing.id, { ...data, from_account_id: data.account_id });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{borrowing.lender_name}</p>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Remaining Debt</span>
          <span className="font-semibold text-red-500">{formatCurrency(borrowing.remaining_balance)}</span>
        </div>
        {borrowing.monthly_payment && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Scheduled Monthly</span>
            <span className="font-medium">{formatCurrency(borrowing.monthly_payment)}</span>
          </div>
        )}
      </div>

      <div>
        <label className="label">Pay From Account *</label>
        <AccountSelect {...register('account_id', { required: 'Required' })} label="" error={errors.account_id?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Repayment Amount *</label>
          <input type="number" step="0.01" min="0.01" className="input"
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Positive' } })} />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input" {...register('payment_date', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <input className="input" placeholder="Optional" {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} variant="danger" className="flex-1">Make Repayment</Button>
      </div>
    </form>
  );
};

export default RepaymentForm;
