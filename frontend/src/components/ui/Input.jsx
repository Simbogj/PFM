import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, prefix, suffix, className = '', ...props }, ref) => (
  <div>
    {label && <label className="label">{label}</label>}
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-500 text-sm pointer-events-none">{prefix}</span>
      )}
      <input
        ref={ref}
        className={`input ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''} ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-500 text-sm pointer-events-none">{suffix}</span>
      )}
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
