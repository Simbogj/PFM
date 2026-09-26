import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { budgetsAPI } from '../../services/api';
import CategorySelect from '../../components/forms/CategorySelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const BudgetForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const now = new Date();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      budget_type: 'monthly',
      currency: 'ETB',
      period_start: format(startOfMonth(now), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(now), 'yyyy-MM-dd'),
      alert_at_80: true, alert_at_90: true, alert_at_100: true,
    }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await budgetsAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Budget Name *</label>
        <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Food Budget"
          {...register('name', { required: 'Required' })} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <CategorySelect {...register('category_id')} type="expense" label="Expense Category" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount *</label>
          <input type="number" step="0.01" min="1" className="input" placeholder="0.00"
            {...register('amount', { required: 'Required' })} />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" {...register('budget_type')}>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Period Start *</label>
          <input type="date" className="input" {...register('period_start', { required: true })} />
        </div>
        <div>
          <label className="label">Period End *</label>
          <input type="date" className="input" {...register('period_end', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Alerts</label>
        <div className="flex gap-4">
          {[{ key: 'alert_at_80', label: '80%' }, { key: 'alert_at_90', label: '90%' }, { key: 'alert_at_100', label: '100%' }].map(a => (
            <label key={a.key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" {...register(a.key)} className="w-4 h-4 rounded text-primary-600" />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Create Budget</Button>
      </div>
    </form>
  );
};

export default BudgetForm;
