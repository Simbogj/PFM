import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { accountsAPI } from '../../services/api';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const ACCOUNT_TYPES = [
  { value: 'BANK', label: 'Bank Account' },
  { value: 'SAVINGS', label: 'Savings Account' },
  { value: 'CASH', label: 'Cash Wallet' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'INVESTMENT', label: 'Investment Account' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
];

const COLORS = ['#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#EC4899','#0F766E','#1D4ED8','#D97706'];

const AccountForm = ({ account, onSuccess, onCancel }) => {
  const [error, setError] = useState('');
  const isEdit = !!account;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: account || { currency: 'ETB', opening_balance: 0, color: '#3B82F6', status: 'active' },
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      if (isEdit) await accountsAPI.update(account.id, data);
      else await accountsAPI.create(data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save account');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Account Name *</label>
        <input className={`input ${errors.account_name ? 'border-red-400' : ''}`}
          placeholder="e.g. CBE Checking"
          {...register('account_name', { required: 'Account name is required' })} />
        {errors.account_name && <p className="text-xs text-red-500 mt-1">{errors.account_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Account Type *</label>
          <select className={`input ${errors.account_type_code ? 'border-red-400' : ''}`}
            {...register('account_type_code', { required: 'Type is required' })}>
            <option value="">Select type...</option>
            {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.account_type_code && <p className="text-xs text-red-500 mt-1">{errors.account_type_code.message}</p>}
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" defaultValue="ETB" {...register('currency')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Bank Name</label>
          <input className="input" placeholder="e.g. Commercial Bank of Ethiopia" {...register('bank_name')} />
        </div>
        <div>
          <label className="label">Last 4 Digits</label>
          <input className="input" placeholder="4521" maxLength={4} {...register('account_number_last4')} />
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className="label">Opening Balance</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
            {...register('opening_balance')} />
        </div>
      )}

      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {COLORS.map(c => (
            <label key={c} className="cursor-pointer">
              <input type="radio" value={c} {...register('color')} className="sr-only" />
              <div
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${watch('color') === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Optional notes..." {...register('notes')} />
      </div>

      {isEdit && (
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">
          {isEdit ? 'Save Changes' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};

export default AccountForm;
