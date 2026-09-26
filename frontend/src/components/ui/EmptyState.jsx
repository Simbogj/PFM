import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ icon: Icon = Inbox, title = 'No data', description, action, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{description}</p>}
    {action && <Button onClick={action} size="sm">{actionLabel || 'Add New'}</Button>}
  </div>
);

export default EmptyState;
