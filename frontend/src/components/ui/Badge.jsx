import { getStatusBadgeClass } from '../../utils/formatters';

export const Badge = ({ children, status, className = '' }) => {
  const cls = status ? getStatusBadgeClass(status) : '';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const labels = {
    active: 'Active', completed: 'Completed', fully_paid: 'Fully Paid',
    fully_repaid: 'Fully Repaid', partially_paid: 'Partially Paid',
    partially_repaid: 'Partially Repaid', overdue: 'Overdue',
    cancelled: 'Cancelled', pending: 'Pending', paid: 'Paid',
    upcoming: 'Upcoming', due_today: 'Due Today', paused: 'Paused',
  };
  return <Badge status={status}>{labels[status] || status}</Badge>;
};

export default Badge;
