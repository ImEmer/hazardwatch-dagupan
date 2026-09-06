import React, { useState } from 'react';

const AdminSettingsPage = () => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklySummary: true,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Profile</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Account settings</h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-gray-300">Full name</span>
            <input id="profileName" name="profileName" autoComplete="name" defaultValue="Marian Dela Cruz" className="w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-gray-300">Email</span>
            <input id="profileEmail" name="profileEmail" autoComplete="email" type="email" defaultValue="marian@hazardwatch.gov" className="w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-gray-300">Password</span>
            <input id="profilePassword" name="profilePassword" autoComplete="new-password" type="password" defaultValue="password123" className="w-full rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-2.5 text-white focus:border-[#3b82f6] focus:outline-none" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#2e303a] bg-[#14151d] p-5 shadow-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Preferences</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Notifications</h2>

        <div className="mt-5 space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-[#2e303a] bg-[#0a0b0f] px-3 py-3">
              <div>
                <p className="font-medium text-white">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}</p>
                <p className="text-xs text-gray-400">Receive platform updates and alerts</p>
              </div>
              <button
                onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-[#3b82f6]' : 'bg-[#2e303a]'}`}
                aria-label={key}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
