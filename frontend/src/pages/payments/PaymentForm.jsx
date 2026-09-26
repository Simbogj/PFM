import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { paymentsAPI } from '../../services/api';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const PAYMENT_TYPES = [
  { value: 'rent', label: 'Rent' }, { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' }, { value: 'internet', label: 'Internet' },
  { value: 'phone', label: 'Phone' }, { value: 'loan_repayment', label: 'Loan Repayment' },
  { value: 'subscription', label: 'Subscription' }, { value: 'school_fees', label: 'School Fees' },
  { value: 'insurance', label: 'Insurance' }, { value: 'credit_card', label: 'Credit Card' },
  { value: 'bill', label: 'Other Bill' }, { value: 'other', label: 'Other' },
];

const PaymentForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { currency: 'ETB', reminder_days: 3, is_recurring: false }
  });
  const isRecurring = watch('is_recurring');

  const onSubmit = async (data) => {
    try {
      setError('');
      data.is_recurring = data.is_recurring === true || data.is_recurring === 'true';
      await paymentsAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Payment Name *</label>
          <input className={`input ${errors.payment_name ? 'border-red-400' : ''}`} placeholder="e.g. Monthly Rent"
            {...register('payment_name', { required: 'Required' })} />
          {errors.payment_name && <p className="text-xs text-red-500 mt-1">{errors.payment_name.message}</p>}
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" {...register('payment_type')}>
            {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
            {...register('amount', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" className="input" {...register('due_date')} />
        </div>
      </div>

      <AccountSelect {...register('account_id')} label="Pay From Account" />

      <div>
        <label className="label">Payee</label>
        <input className="input" placeholder="e.g. Landlord, EEPCO" {...register('payee')} />
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="recurring" {...register('is_recurring')} className="w-4 h-4 rounded text-primary-600" />
        <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">Recurring payment</label>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Frequency</label>
            <select className="input" {...register('frequency')}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Reminder (days before)</label>
            <input type="number" min="0" max="30" className="input" {...register('reminder_days')} />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Add Payment</Button>
      </div>
    </form>
  );
};

export default PaymentForm;
