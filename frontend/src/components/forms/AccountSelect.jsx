import { useAccounts } from '../../hooks/useAccounts';
import { forwardRef } from 'react';

const AccountSelect = forwardRef(({ label = 'Account', error, exclude, ...props }, ref) => {
  const { accounts } = useAccounts();
  const filtered = exclude ? accounts.filter((a) => a.id !== exclude) : accounts;

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={`input ${error ? 'border-red-400' : ''}`} {...props}>
        <option value="">Select account...</option>
        {filtered.map((a) => (
          <option key={a.id} value={a.id}>
            {a.account_name} ({parseFloat(a.current_balance).toLocaleString()} {a.currency})
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
AccountSelect.displayName = 'AccountSelect';
export default AccountSelect;
