import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { incomeAPI } from '../../services/api';
import { today, formatCurrency } from '../../utils/formatters';
import AccountSelect from '../../components/forms/AccountSelect';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const SalaryForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { salary_month: today().substring(0, 7), payment_date: today(), income_tax: 0, pension_deduction: 0, other_deductions: 0 }
  });
  const [gross, tax, pension, other] = useWatch({ control, name: ['gross_salary', 'income_tax', 'pension_deduction', 'other_deductions'] });
  const net = (parseFloat(gross) || 0) - (parseFloat(tax) || 0) - (parseFloat(pension) || 0) - (parseFloat(other) || 0);

  const onSubmit = async (data) => {
    try {
      setError('');
      data.salary_month = data.salary_month + '-01';
      await incomeAPI.createSalary(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record salary');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Employer *</label>
          <input className={`input ${errors.employer ? 'border-red-400' : ''}`} placeholder="e.g. ABC Company"
            {...register('employer', { required: 'Employer required' })} />
          {errors.employer && <p className="text-xs text-red-500 mt-1">{errors.employer.message}</p>}
        </div>
        <div>
          <label className="label">Salary Month *</label>
          <input type="month" className="input" {...register('salary_month', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Gross Salary *</label>
        <input type="number" step="0.01" className={`input ${errors.gross_salary ? 'border-red-400' : ''}`}
          placeholder="0.00" {...register('gross_salary', { required: 'Required', min: { value: 0.01, message: 'Must be positive' } })} />
        {errors.gross_salary && <p className="text-xs text-red-500 mt-1">{errors.gross_salary.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Income Tax</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...register('income_tax')} />
        </div>
        <div>
          <label className="label">Pension</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...register('pension_deduction')} />
        </div>
        <div>
          <label className="label">Other Deductions</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" {...register('other_deductions')} />
        </div>
      </div>

      <div className={`p-3 rounded-xl ${net > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Net Salary</span>
          <span className={`font-bold text-lg ${net > 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(net)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Payment Account *</label>
          <AccountSelect {...register('account_id', { required: 'Account required' })} error={errors.account_id?.message} />
        </div>
        <div>
          <label className="label">Payment Date</label>
          <input type="date" className="input" {...register('payment_date')} />
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <input className="input" placeholder="Optional notes" {...register('notes')} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Record Salary</Button>
      </div>
    </form>
  );
};

export default SalaryForm;
