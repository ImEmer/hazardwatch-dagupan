    import React, { useEffect, useState } from 'react';
    import {
      Area,
      AreaChart,
      Bar,
      BarChart,
      CartesianGrid,
      Cell,
      Legend,
      Line,
      Pie,
      PieChart,
      ResponsiveContainer,
      Tooltip,
      XAxis,
      YAxis,
    } from 'recharts';
    import { useReports } from '../../context/ReportContext';
    import useAuth from '../../hooks/useAuth';
    import useTheme from '../../hooks/useTheme';
    import api from '../../services/api';
    import { REPORT_STATUSES, STATUS_CHART_COLORS } from '../../services/reportOptions';
    import { SkeletonDashboard } from '../../components/common/Skeleton';
    import CountUp from '../../components/common/CountUp';

    const AdminDashboard = ({ headingLabel = 'Admin Dashboard' }) => {
      const { reports, reportsLoading, reportsError } = useReports();
      const { token } = useAuth();
      const { theme } = useTheme();
      const isDark = theme === 'dark';
      const currentDate = new Date();
      const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
      const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
      const [overview, setOverview] = useState(null);
      const [timeline, setTimeline] = useState([]);
      const [barangays, setBarangays] = useState([]);
      const [showAllBarangays, setShowAllBarangays] = useState(false);
      const [statisticsLoading, setStatisticsLoading] = useState(true);
      const [statisticsError, setStatisticsError] = useState('');
      const [priorityAnimated, setPriorityAnimated] = useState(false);
      const isLoading = reportsLoading || statisticsLoading;

      useEffect(() => {
        if (isLoading) {
          setPriorityAnimated(false);
          return undefined;
        }
        const timer = window.setTimeout(() => setPriorityAnimated(true), 100);
        return () => window.clearTimeout(timer);
      }, [isLoading, theme]);

      useEffect(() => {
        let cancelled = false;
        setStatisticsLoading(true);
        setStatisticsError('');
        Promise.all([
          api.get('/statistics/overview', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/statistics/timeline', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/statistics/barangay', { headers: { Authorization: `Bearer ${token}` } }),
        ]).then(([overviewResponse, timelineResponse, barangayResponse]) => {
          if (cancelled) return;
          setOverview(overviewResponse.data || null);
          setTimeline(timelineResponse.data?.data || []);
          setBarangays(barangayResponse.data?.data || []);
        }).catch((error) => {
          if (!cancelled) setStatisticsError(error.response?.data?.message || 'Unable to load dashboard statistics.');
        }).finally(() => {
          if (!cancelled) setStatisticsLoading(false);
        });
        return () => { cancelled = true; };
      }, [token]);

      const statusCounts = Object.fromEntries((overview?.status || []).map((item) => [item._id, item.count]));
      const priorityCounts = Object.fromEntries((overview?.priority || []).map((item) => [item._id, item.count]));
      const totalReports = overview?.total ?? reports.length;
      const pending = statusCounts.Pending || 0;
      const inProgress = statusCounts['In Progress'] || 0;
      const resolved = statusCounts.Resolved || 0;
      const statusData = REPORT_STATUSES.map((status) => ({
        name: status,
        value: statusCounts[status] || 0,
      }));
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const timelineData = Array.from({ length: daysInMonth }, (_, index) => {
        const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
        return {
          date: new Date(selectedYear, selectedMonth, index + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reports: timeline.find((item) => item._id === dateKey)?.count || 0,
        };
      });
      const barangayData = barangays.filter((item) => item._id).map((item) => ({ name: item._id, count: item.count }));
      const visibleBarangayData = showAllBarangays ? barangayData : barangayData.slice(0, 10);
      const chartText = isDark ? '#d1d5db' : '#475569';
      const chartGrid = isDark ? '#2e303a' : '#e2e8f0';
      const tooltipStyle = {
        backgroundColor: isDark ? '#14151d' : '#ffffff',
        border: `1px solid ${isDark ? '#2e303a' : '#e2e8f0'}`,
        color: isDark ? '#ffffff' : '#1e293b',
      };
      const monthOptions = Array.from({ length: 12 }, (_, month) => ({
        month,
        label: new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'long' }),
      }));
      const priorityLevels = [
        { name: 'Urgent', color: '#ef4444' },
        { name: 'High', color: '#f97316' },
        { name: 'Medium', color: '#f59e0b' },
        { name: 'Low', color: '#64748b' },
      ].map((level) => ({
        ...level,
        count: priorityCounts[level.name] || 0,
      }));
      const maxPriorityCount = Math.max(...priorityLevels.map((level) => level.count), 1);

      if (isLoading) {
        return <SkeletonDashboard />;
      }

      if (reportsError || statisticsError) {
        return <div className={`rounded-2xl border p-6 ${isDark ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>{reportsError || statisticsError}</div>;
      }

      return (
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Overview</p>
              <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{headingLabel}</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={`rounded-2xl border-l-4 border-blue-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Total reports</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}><CountUp key={theme} end={totalReports} /></p>
            </div>
            <div className={`rounded-2xl border-l-4 border-amber-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Pending</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}><CountUp key={theme} end={pending} /></p>
            </div>
            <div className={`rounded-2xl border-l-4 border-violet-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>In progress</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}><CountUp key={theme} end={inProgress} /></p>
            </div>
            <div className={`rounded-2xl border-l-4 border-emerald-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Resolved</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}><CountUp key={theme} end={resolved} /></p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <h3 className={`mb-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports by status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart key={theme}>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value" isAnimationActive animationBegin={0} animationDuration={800} animationEasing="ease-out">
                    {statusData.map((entry) => <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: chartText }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Priority queue</h3>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Reports needing attention first</p>
                </div>
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500">{priorityLevels[0].count} urgent</span>
              </div>
              <div className="mt-5 space-y-4">
                {priorityLevels.map((level) => (
                  <div key={level.name}>
                    <div className={`mb-1.5 flex items-center justify-between text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: level.color }} />{level.name}</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{level.count}</span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-100'}`}>
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: priorityAnimated ? `${Math.max((level.count / maxPriorityCount) * 100, level.count ? 8 : 0)}%` : '0%', backgroundColor: level.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-xl xl:col-span-2 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports over time</h3>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Daily submissions for the selected month</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {monthOptions.map((option) => (
                    <button type="button" key={option.month} onClick={() => setSelectedMonth(option.month)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${selectedMonth === option.month ? 'bg-[#3b82f6] text-white' : isDark ? 'bg-[#0a0b0f] text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}>{option.label.slice(0, 3)}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart key={theme} data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs><linearGradient id="reportsTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="date" stroke={chartText} tick={{ fontSize: 11 }} interval={Math.max(1, Math.floor(daysInMonth / 7))} />
                  <YAxis allowDecimals={false} stroke={chartText} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="reports" name="Reports" stroke="#3b82f6" fill="url(#reportsTrend)" strokeWidth={2} isAnimationActive animationBegin={0} animationDuration={800} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="reports" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive animationBegin={0} animationDuration={800} animationEasing="ease-out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-2xl border p-5 shadow-xl xl:col-span-2 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <div className="mb-4 flex items-center justify-between gap-3"><h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports by barangay</h3>{barangayData.length > 10 && <button type="button" onClick={() => setShowAllBarangays((current) => !current)} className="text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa]">{showAllBarangays ? 'Show Top 10' : 'View All'}</button>}</div>
              {visibleBarangayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={showAllBarangays ? Math.min(520, Math.max(320, visibleBarangayData.length * 28)) : 320}>
                  <BarChart key={theme} data={visibleBarangayData} layout="vertical" margin={{ top: 8, right: 8, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis type="number" allowDecimals={false} stroke={chartText} />
                    <YAxis dataKey="name" type="category" width={100} stroke={chartText} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Reports" fill="#8b5cf6" radius={[0, 4, 4, 0]} activeBar={false} isAnimationActive animationBegin={0} animationDuration={800} animationEasing="ease-out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={`py-16 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No barangay assignments available yet.</p>
              )}
            </div>
          </div>

        </div>
      );
    };

    export default AdminDashboard;