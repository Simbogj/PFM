import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrencyCompact } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {parseFloat(p.value).toLocaleString()} {currency}
        </p>
      ))}
    </div>
  );
};

const IncomeExpenseChart = ({ data = [], currency = 'ETB' }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
      <YAxis tickFormatter={(v) => formatCurrencyCompact(v, '')} tick={{ fontSize: 11 }} />
      <Tooltip content={<CustomTooltip currency={currency} />} />
      <Legend wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
      <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default IncomeExpenseChart;
