import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { goalsAPI } from '../../services/api';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const GOAL_TYPES = [
  { value: 'savings', label: 'Savings' }, { value: 'debt_payoff', label: 'Debt Payoff' },
  { value: 'investment', label: 'Investment' }, { value: 'purchase', label: 'Purchase' },
  { value: 'emergency_fund', label: 'Emergency Fund' }, { value: 'other', label: 'Other' },
];

const COLORS = ['#6366F1','#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

const GoalForm = ({ goal, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const isEdit = !!goal;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: goal || { goal_type: 'savings', priority: 'medium', currency: 'ETB', color: '#6366F1' }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      if (isEdit) await goalsAPI.update(goal.id, data);
      else await goalsAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Goal Name *</label>
        <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Buy a Car"
          {...register('name', { required: 'Required' })} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Goal Type</label>
          <select className="input" {...register('goal_type')}>
            {GOAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" {...register('priority')}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target Amount *</label>
          <input type="number" step="0.01" min="1" className="input" placeholder="0.00"
            {...register('target_amount', { required: 'Required' })} />
        </div>
        {isEdit && (
          <div>
            <label className="label">Current Amount</label>
            <input type="number" step="0.01" min="0" className="input" {...register('current_amount')} />
          </div>
        )}
        {!isEdit && (
          <div>
            <label className="label">Monthly Contribution</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
              {...register('monthly_contribution')} />
          </div>
        )}
      </div>

      <div>
        <label className="label">Target Date</label>
        <input type="date" className="input" {...register('target_date')} />
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {COLORS.map(c => (
            <label key={c} className="cursor-pointer">
              <input type="radio" value={c} {...register('color')} className="sr-only" />
              <div className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${watch('color') === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} {...register('description')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">{isEdit ? 'Save Changes' : 'Create Goal'}</Button>
      </div>
    </form>
  );
};

export default GoalForm;
