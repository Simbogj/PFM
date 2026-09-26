import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = {
  income: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  lending_due: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  borrowing_due: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const CalendarPage = () => {
  const [current, setCurrent] = useState(new Date());
  const month = current.getMonth() + 1;
  const year = current.getFullYear();

  const { data: events, loading } = useApi(
    () => reportsAPI.getCalendarEvents({ month, year }),
    [month, year]
  );

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build a map of date → events
  const eventMap = {};
  const addEvent = (dateStr, event) => {
    if (!dateStr) return;
    const key = dateStr.substring(0, 10);
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(event);
  };

  if (events) {
    events.payments?.forEach(e => addEvent(e.date, { ...e, type: 'payment' }));
    events.transactions?.forEach(e => addEvent(e.date, e));
    events.lending_due?.forEach(e => addEvent(e.date, { ...e, type: 'lending_due' }));
    events.borrowing_due?.forEach(e => addEvent(e.date, { ...e, type: 'borrowing_due' }));
  }

  const today = new Date().toISOString().split('T')[0];
  const monthName = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financial Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upcoming payments, income and due dates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200 min-w-40 text-center">{monthName}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { type: 'income', label: 'Income' }, { type: 'expense', label: 'Expense' },
          { type: 'payment', label: 'Bill Due' }, { type: 'lending_due', label: 'Lending Due' },
          { type: 'borrowing_due', label: 'Borrowing Due' },
        ].map(l => (
          <span key={l.type} className={`text-xs px-2 py-1 rounded-full font-medium ${EVENT_COLORS[l.type]}`}>{l.label}</span>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
          {DAYS.map(d => (
            <div key={d} className="text-center py-3 text-xs font-semibold text-gray-500 uppercase">{d}</div>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="min-h-24 border-b border-r border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventMap[dateKey] || [];
              const isToday = dateKey === today;

              return (
                <div key={day} className={`min-h-24 border-b border-r border-gray-50 dark:border-gray-700/50 p-1.5 ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'}`}>
                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full mb-1 ${isToday ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div key={idx} className={`text-xs px-1.5 py-0.5 rounded truncate ${EVENT_COLORS[ev.event_type || ev.type] || 'bg-gray-100 text-gray-600'}`}>
                        {ev.title || ev.payment_name || ev.description || ev.type}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
