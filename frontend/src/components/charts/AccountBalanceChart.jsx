import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrencyCompact } from '../../utils/formatters';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4'];

const AccountBalanceChart = ({ accounts = [], currency = 'ETB' }) => {
  const data = accounts
    .filter((a) => a.include_in_total)
    .map((a) => ({ name: a.account_name, balance: parseFloat(a.current_balance), color: a.color }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCurrencyCompact(v, '')} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${parseFloat(v).toLocaleString()} ${currency}`, 'Balance']} />
        <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color || COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AccountBalanceChart;
