import { useEffect, useState, forwardRef } from 'react';
import { transactionsAPI } from '../../services/api';

const CategorySelect = forwardRef(({ label = 'Category', error, type, ...props }, ref) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    transactionsAPI.getCategories().then((res) => {
      let cats = res.data.data;
      if (type) cats = cats.filter((c) => c.type === type);
      setCategories(cats);
    }).catch(() => {});
  }, [type]);

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={`input ${error ? 'border-red-400' : ''}`} {...props}>
        <option value="">Select category...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});
CategorySelect.displayName = 'CategorySelect';
export default CategorySelect;
