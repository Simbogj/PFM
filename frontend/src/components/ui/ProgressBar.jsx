const ProgressBar = ({ value, max, color = 'bg-primary-500', height = 'h-2', showLabel = false, label }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  let barColor = color;
  if (pct >= 100) barColor = 'bg-red-500';
  else if (pct >= 90) barColor = 'bg-orange-500';
  else if (pct >= 80) barColor = 'bg-yellow-500';

  return (
    <div>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 dark:bg-gray-700 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${barColor} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
