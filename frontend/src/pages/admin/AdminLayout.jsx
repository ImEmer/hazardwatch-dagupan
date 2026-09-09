import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/admin/reports', label: 'Reports', icon: '◫' },
  { to: '/admin/users', label: 'Users', icon: '◍' },
  { to: '/admin/map', label: 'Map', icon: '◌' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙' },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white pt-20">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-10 md:px-6 xl:flex-row">
        <aside className="w-full rounded-2xl border border-[#2e303a] bg-[#14151d] p-4 shadow-xl xl:w-72">
          <div className="mb-6 flex items-center justify-between border-b border-[#2e303a] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#3b82f6]">HazardWatch</p>
              <h1 className="mt-2 text-xl font-bold text-white">Admin Console</h1>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Live
            </span>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/20'
                      : 'text-gray-300 hover:bg-[#1d1f2a] hover:text-white'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-[#2e303a] bg-[#0a0b0f] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Quick status</p>
            <div className="mt-3 space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Alerts</span>
                <span className="text-[#fbbf24]">21</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Resolved</span>
                <span className="text-emerald-400">118</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Response time</span>
                <span className="text-[#3b82f6]">6.2h</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2e303a] bg-[#14151d] px-5 py-4 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Operating overview</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Dagupan City Hazard Response</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-[#2e303a] bg-[#0a0b0f] px-3 py-2 text-sm text-gray-200 hover:border-[#3b82f6] hover:text-white">
                Export report
              </button>
              <button className="rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#3b82f6]/25 transition hover:bg-[#2563eb]">
                + New incident
              </button>
            </div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
