import useTheme from '../../hooks/useTheme';

const Skeleton = ({ className = '', style }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return <div style={style} className={`animate-pulse rounded-md ${isDark ? 'bg-[#1a1a1f]' : 'bg-gray-200'} ${className}`} />;
};

export const SkeletonCard = ({ className = '' }) => (
  <Skeleton className={`rounded-xl ${className}`} />
);

export const SkeletonChart = ({ className = '' }) => (
  <Skeleton className={`rounded-2xl ${className}`} />
);

export const SkeletonTable = ({ rows = 5, cols = 6, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-3 md:grid-cols-6">
        {Array.from({ length: cols }).map((_, colIndex) => {
          const widthMap = [
            'w-full',
            'w-2/3',
            'w-full',
            'w-1/2',
            'w-2/3',
            'w-16 ml-auto',
          ];

          return (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              className={`h-6 ${widthMap[colIndex] || 'w-full'}`}
            />
          );
        })}
      </div>
    ))}
  </div>
);

export const SkeletonReportCard = ({ className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'} ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="w-full space-y-2 md:max-w-xs">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
