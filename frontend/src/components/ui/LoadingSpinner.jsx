import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className={`${s[size]} animate-spin text-primary-500`} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
};

export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

export default LoadingSpinner;
