import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import IncomeExpenseChart from '../../components/charts/IncomeExpenseChart';
import NetWorthChart from '../../components/charts/NetWorthChart';
import ExpensePieChart from '../../components/charts/ExpensePieChart';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const now = new Date();

const ReportsPage = () => {
  const [cashFlowParams, setCashFlowParams] = useState({
    start_date: format(startOfMonth(now), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(now), 'yyyy-MM-dd'),
  });

  const { data: cashFlow, loading: cfLoading, error: cfError, refetch: refetchCF } = useApi(
    () => reportsAPI.getCashFlow(cashFlowParams), [cashFlowParams]
  );
  const { data: netWorth, loading: nwLoading } = useApi(() => reportsAPI.getNetWorth());
  const { data: monthlySummary, loading: msLoading } = useApi(() => reportsAPI.getMonthlySummary({ months: 6 }));

  const handleCashFlowFilter = () => refetchCF();

  const exportCSV = (data, filename) => {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    const keys = Object.keys(rows[0] || {});
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Financial analysis and insights</p>
        </div>
      </div>

      {/* Cash Flow Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="section-title">Cash Flow Report</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">From:</label>
                <input type="date" className="input w-36 text-sm" value={cashFlowParams.start_date}
                  onChange={e => setCashFlowParams(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">To:</label>
                <input type="date" className="input w-36 text-sm" value={cashFlowParams.end_date}
                  onChange={e => setCashFlowParams(p => ({ ...p, end_date: e.target.value }))} />
              </div>
              <Button size="sm" onClick={handleCashFlowFilter}>Apply</Button>
              {cashFlow && <Button size="sm" variant="outline" icon={Download} onClick={() => exportCSV([cashFlow], 'cash-flow.csv')}>Export</Button>}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {cfLoading ? <LoadingSpinner /> : cfError ? <Alert type="error" message={cfError} /> : cashFlow ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Opening Balance', value: cashFlow.opening_balance, color: 'text-blue-600' },
                { label: 'Total Inflow', value: cashFlow.inflow?.total, color: 'text-green-600' },
                { label: 'Total Outflow', value: cashFlow.outflow?.total, color: 'text-red-500' },
                { label: 'Closing Balance', value: cashFlow.closing_balance, color: cashFlow.closing_balance >= 0 ? 'text-green-600' : 'text-red-500' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value || 0)}</p>
                </div>
              ))}
            </div>
          ) : null}

          {cashFlow && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cash Inflow Breakdown</h3>
                <div className="space-y-2">
                  {cashFlow.inflow?.breakdown?.map(b => (
                    <div key={b.category} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{b.category || 'Uncategorized'}</span>
                      <span className="font-medium text-green-600">{formatCurrency(b.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-semibold">Total Income</span>
                    <span className="font-bold text-green-600">{formatCurrency(cashFlow.inflow?.income || 0)}</span>
                  </div>
                  {(cashFlow.inflow?.borrowed || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">+ Borrowed</span>
                      <span>{formatCurrency(cashFlow.inflow?.borrowed || 0)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Cash Outflow Breakdown</h3>
                <div className="space-y-2">
                  {cashFlow.outflow?.breakdown?.map(b => (
                    <div key={b.category} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{b.category || 'Uncategorized'}</span>
                      <span className="font-medium text-red-500">{formatCurrency(b.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-semibold">Total Expenses</span>
                    <span className="font-bold text-red-500">{formatCurrency(cashFlow.outflow?.expenses || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Net Worth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="section-title">Net Worth</h2></CardHeader>
          <CardBody>
            {nwLoading ? <LoadingSpinner size="sm" /> : netWorth ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-gray-500">Total Assets</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(netWorth.total_assets)}</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-xs text-gray-500">Total Liabilities</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(netWorth.total_liabilities)}</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Net Worth</p>
                  <p className={`text-3xl font-bold ${netWorth.net_worth >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {formatCurrency(netWorth.net_worth)}
                  </p>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="section-title">Net Worth Trend</h2></CardHeader>
          <CardBody>
            {nwLoading ? <LoadingSpinner size="sm" /> : <NetWorthChart data={netWorth?.trend || []} />}
          </CardBody>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader><h2 className="section-title">6-Month Summary</h2></CardHeader>
        <CardBody>
          {msLoading ? <LoadingSpinner size="sm" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    {['Month', 'Income', 'Expenses', 'Net', 'Savings', 'Debt Paid'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {(monthlySummary || []).map(row => {
                    const net = parseFloat(row.income) - parseFloat(row.expenses);
                    return (
                      <tr key={row.month_key} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{row.month_label}</td>
                        <td className="px-3 py-2 text-green-600 font-medium">{formatCurrency(row.income)}</td>
                        <td className="px-3 py-2 text-red-500 font-medium">{formatCurrency(row.expenses)}</td>
                        <td className={`px-3 py-2 font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(net)}</td>
                        <td className="px-3 py-2 text-blue-600">{formatCurrency(row.savings)}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatCurrency(row.debt_paid)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ReportsPage;
