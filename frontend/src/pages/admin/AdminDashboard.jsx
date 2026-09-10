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
    import useTheme from '../../hooks/useTheme';
    import useAuth from '../../hooks/useAuth';
    import api from '../../services/api';
    import { REPORT_STATUSES, STATUS_CHART_COLORS } from '../../services/reportOptions';
    import { SkeletonCard, SkeletonChart, SkeletonTable } from '../../components/common/Skeleton';

    const AdminDashboard = () => {
      const { reports } = useReports();
      const { theme } = useTheme();
      const { token } = useAuth();
      const isDark = theme === 'dark';
      const currentDate = new Date();
      const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
      const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
      const [activities, setActivities] = useState([]);
      const isLoading = reports.length === 0;

      const totalReports = reports.length;
      const pending = reports.filter((report) => report.status === 'Pending').length;
      const inProgress = reports.filter((report) => report.status === 'In Progress').length;
      const resolved = reports.filter((report) => report.status === 'Resolved').length;
      const statusData = REPORT_STATUSES.map((status) => ({
        name: status,
        value: reports.filter((report) => report.status === status).length,
      }));
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const timelineData = Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(selectedYear, selectedMonth, index + 1);
        const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reports: reports.filter((report) => new Date(report.createdAt).toISOString().slice(0, 10) === dateKey).length,
        };
      });
      const barangayData = [...new Set(reports.map((report) => report.assignedBarangay || report.barangay).filter(Boolean))]
        .map((barangay) => ({ name: barangay, count: reports.filter((report) => (report.assignedBarangay || report.barangay) === barangay).length }))
        .sort((a, b) => b.count - a.count);
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
        count: reports.filter((report) => (report.priority || 'Medium') === level.name).length,
      }));
      const maxPriorityCount = Math.max(...priorityLevels.map((level) => level.count), 1);

      useEffect(() => {
        const fetchActivities = async () => {
          if (!token) return;
          try {
            const response = await api.get('/activity', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const body = response.data || { activities: [] };
            setActivities(body.activities || []);
          } catch (error) {
            setActivities([]);
          }
        };

        fetchActivities();
      }, [token]);

      if (isLoading) {
        return (
          <div className="space-y-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded-md bg-[#1a1a1f]" />
                <div className="h-8 w-44 animate-pulse rounded-md bg-[#1a1a1f]" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} className="h-28 w-full" />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <SkeletonChart className="h-[280px] w-full" />
              <div className="space-y-3 rounded-2xl border border-[#2e303a] bg-[#14151d] p-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded-md bg-[#1a1a1f]" />
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-[#1a1a1f]" />
                  </div>
                ))}
              </div>
              <div className="xl:col-span-2">
                <SkeletonChart className="h-[280px] w-full" />
              </div>
            </div>

            <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5">
              <div className="mb-4 h-5 w-32 animate-pulse rounded-md bg-[#1a1a1f]" />
              <SkeletonTable rows={5} cols={6} />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className={`text-xs uppercase tracking-[0.25em] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Overview</p>
              <h2 className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Dashboard</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={`rounded-2xl border-l-4 border-blue-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Total reports</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalReports}</p>
            </div>
            <div className={`rounded-2xl border-l-4 border-amber-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Pending</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pending}</p>
            </div>
            <div className={`rounded-2xl border-l-4 border-violet-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>In progress</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{inProgress}</p>
            </div>
            <div className={`rounded-2xl border-l-4 border-emerald-500 border-y border-r p-4 shadow-xl ${isDark ? 'border-y-[#2e303a] border-r-[#2e303a] bg-[#14151d]' : 'border-y-slate-200 border-r-slate-200 bg-white'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Resolved</p>
              <p className={`mt-3 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{resolved}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <h3 className={`mb-4 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports by status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
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
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max((level.count / maxPriorityCount) * 100, level.count ? 8 : 0)}%`, backgroundColor: level.color }} />
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
                <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <defs><linearGradient id="reportsTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="date" stroke={chartText} tick={{ fontSize: 11 }} interval={Math.max(1, Math.floor(daysInMonth / 7))} />
                  <YAxis allowDecimals={false} stroke={chartText} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="reports" name="Reports" stroke="#3b82f6" fill="url(#reportsTrend)" strokeWidth={2} />
                  <Line type="monotone" dataKey="reports" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-2xl border p-5 shadow-xl xl:col-span-2 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Reports by barangay</h3>
              {barangayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(220, barangayData.length * 42)}>
                  <BarChart data={barangayData} layout="vertical" margin={{ top: 8, right: 8, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis type="number" allowDecimals={false} stroke={chartText} />
                    <YAxis dataKey="name" type="category" width={100} stroke={chartText} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Reports" fill="#8b5cf6" radius={[0, 4, 4, 0]} activeBar={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className={`py-16 text-center ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No barangay assignments available yet.</p>
              )}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 shadow-xl ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>User activity</h3>
            <div className="mt-4 space-y-3">
              {activities.length === 0 ? (
                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>No recent user activity.</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity._id || activity.id} className={`rounded-xl border p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{activity.message}</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {activity.role} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    };

    export default AdminDashboard;