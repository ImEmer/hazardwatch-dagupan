import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useTheme from '../../../hooks/useTheme';

const report = {
  id: 'HR-2134',
  title: 'Blocked drainage channel near Lucao Road',
  status: 'Monitoring',
  priority: 'High',
  barangay: 'Lucao',
  summary: 'Stormwater drainage is obstructed near the road shoulder, causing local pooling and possible traffic interruption.',
  details: [
    'Drainage blockage was reported near the public lane access point.',
    'Local crews are checking the canal to clear debris and debris accumulation.',
    'Surface runoff is being monitored to prevent additional flooding.'
  ],
};

const LucaoReportDetail = () => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-xs uppercase tracking-[0.22em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Lucao / Report</p>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/barangay/lucao/reports" className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium ${isDark ? 'border-[#2e303a] text-gray-200' : 'border-slate-200 text-slate-700'}`}>
            Back to reports
          </Link>
          <button type="button" onClick={() => navigate('/barangay/lucao/dashboard')} className="inline-flex items-center rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb]">
            Dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-xs font-medium text-sky-300">{report.id}</span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">{report.status}</span>
            <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-300">{report.priority} Priority</span>
          </div>

          <p className={`text-base leading-7 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{report.summary}</p>

          <div className="mt-5">
            <h2 className={`mb-3 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Field notes</h2>
            <ul className="space-y-3">
              {report.details.map((detail) => (
                <li key={detail} className={`rounded-xl border p-3 text-sm ${isDark ? 'border-[#2e303a] bg-[#0a0b0f] text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className={`rounded-2xl border p-5 ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Incident summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className={isDark ? 'text-gray-400' : 'text-slate-500'}>Barangay</dt>
              <dd className={isDark ? 'text-gray-200' : 'text-slate-800'}>{report.barangay}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className={isDark ? 'text-gray-400' : 'text-slate-500'}>Report ID</dt>
              <dd className={isDark ? 'text-gray-200' : 'text-slate-800'}>{id || report.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className={isDark ? 'text-gray-400' : 'text-slate-500'}>Priority</dt>
              <dd className="text-rose-400">{report.priority}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
};

export default LucaoReportDetail;
