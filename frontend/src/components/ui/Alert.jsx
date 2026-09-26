import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { useState } from 'react';

const variants = {
  error: { icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' },
  success: { icon: CheckCircle, cls: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' },
  info: { icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' },
  warning: { icon: AlertCircle, cls: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300' },
};

const Alert = ({ type = 'error', message, dismissible = false, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  if (!message || !visible) return null;
  const { icon: Icon, cls } = variants[type] || variants.error;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${cls}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {(dismissible || onDismiss) && (
        <button onClick={() => { setVisible(false); onDismiss?.(); }} className="ml-auto opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
