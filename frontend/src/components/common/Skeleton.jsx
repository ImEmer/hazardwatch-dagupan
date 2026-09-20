import useTheme from '../../hooks/useTheme';

const Skeleton = ({ className = '', style }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return <div style={style} className={`animate-pulse rounded-md ${isDark ? 'bg-slate-700' : 'bg-gray-200'} ${className}`} />;
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

export const SkeletonDashboard = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const panel = isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-6 w-48 rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`rounded-2xl border p-4 ${panel}`}>
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="mt-4 h-8 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${panel}`}><Skeleton className="h-5 w-40 rounded" /><Skeleton className="mt-5 h-52 w-full rounded-xl" /></div>
        <div className={`rounded-2xl border p-5 ${panel}`}>
          <Skeleton className="h-5 w-36 rounded" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-full rounded" /><Skeleton className="h-2.5 w-full rounded-full" /></div>)}
          </div>
        </div>
        <div className={`rounded-2xl border p-5 xl:col-span-2 ${panel}`}><Skeleton className="h-5 w-40 rounded" /><Skeleton className="mt-5 h-52 w-full rounded-xl" /></div>
      </div>
    </div>
  );
};

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
