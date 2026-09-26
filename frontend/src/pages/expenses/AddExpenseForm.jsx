import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { expensesAPI } from '../../services/api';
import { today } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import CategorySelect from '../../components/forms/CategorySelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const PAYMENT_METHODS = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

const AddExpenseForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { date: today(), currency: 'ETB', payment_method: 'bank' }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await expensesAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Account *</label>
        <AccountSelect {...register('account_id', { required: 'Account is required' })}
          error={errors.account_id?.message} />
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
          <label className="label">Date *</label>
          <input type="date" className="input" {...register('date', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Category</label>
        <CategorySelect {...register('category_id')} type="expense" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Merchant / Payee</label>
          <input className="input" placeholder="e.g. Supermarket" {...register('payee_payer')} />
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" {...register('payment_method')}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="e.g. Weekly groceries" {...register('description')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Add Expense</Button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
