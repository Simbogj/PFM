import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { savingsAPI } from '../../services/api';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const SavingsGoalForm = ({ goal, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const isEdit = !!goal;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: goal || { priority: 'medium', currency: 'ETB' }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      if (isEdit) await savingsAPI.update(goal.id, data);
      else await savingsAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save goal');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Goal Name *</label>
        <input className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Emergency Fund"
          {...register('name', { required: 'Name required' })} />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target Amount *</label>
          <input type="number" step="0.01" min="1" className={`input ${errors.target_amount ? 'border-red-400' : ''}`}
            placeholder="100,000.00" {...register('target_amount', { required: 'Required' })} />
          {errors.target_amount && <p className="text-xs text-red-500 mt-1">{errors.target_amount.message}</p>}
        </div>
        <div>
          <label className="label">Target Date</label>
          <input type="date" className="input" {...register('target_date')} />
        </div>
      </div>

      <div>
        <label className="label">Linked Savings Account</label>
        <AccountSelect {...register('account_id')} label="" />
        <p className="text-xs text-gray-400 mt-1">Optional: link to a dedicated savings account</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Priority</label>
          <select className="input" {...register('priority')}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" {...register('currency')} />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={2} placeholder="What are you saving for?"
          {...register('description')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">{isEdit ? 'Save Changes' : 'Create Goal'}</Button>
      </div>
    </form>
  );
};

export default SavingsGoalForm;
