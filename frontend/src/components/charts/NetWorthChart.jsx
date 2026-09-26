import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyCompact } from '../../utils/formatters';

const NetWorthChart = ({ data = [], currency = 'ETB' }) => {
  // Build cumulative net worth from monthly changes
  let running = 0;
  const chartData = data.map((d) => {
    running += parseFloat(d.net_change || 0);
    return { month: d.month, net_worth: running };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => formatCurrencyCompact(v, '')} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${parseFloat(v).toLocaleString()} ${currency}`, 'Net Worth']} />
        <Area type="monotone" dataKey="net_worth" stroke="#3B82F6" strokeWidth={2} fill="url(#netWorthGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default NetWorthChart;
