import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { paymentsAPI } from '../../services/api';
import { today, formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const PaymentPayForm = ({ payment, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { paid_date: today(), paid_amount: payment?.amount, account_id: payment?.account_id }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await paymentsAPI.pay(payment.id, data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{payment.payment_name}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(payment.amount)}</p>
      </div>

      <AccountSelect {...register('account_id')} label="Pay From Account" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount Paid</label>
          <input type="number" step="0.01" min="0.01" className="input" {...register('paid_amount')} />
        </div>
        <div>
          <label className="label">Paid Date</label>
          <input type="date" className="input" {...register('paid_date')} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} variant="success" className="flex-1">Confirm Payment</Button>
      </div>
    </form>
  );
};

export default PaymentPayForm;
