import React, { useState } from 'react';
import { AuthCard } from './RegisterPage';

const TrackReportPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  const submit = (event) => {
    event.preventDefault();
    setSubmittedId(trackingId.trim());
  };

  return (
    <AuthCard title="Track a Report" description="Enter your report ID to check its current status.">
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="trackingId" className="block text-sm text-gray-300">
          Report ID
          <input
            type="text"
            id="trackingId"
            name="trackingId"
            value={trackingId}
            onChange={(event) => setTrackingId(event.target.value)}
            placeholder="Enter report ID"
            className="auth-input mt-2"
          />
        </label>
        <button type="submit" className="auth-button">Track Report</button>
        {submittedId && <p className="rounded-lg bg-[#3b82f6]/10 p-3 text-sm text-[#93c5fd]">Tracking report: {submittedId}</p>}
      </form>
    </AuthCard>
  );
};

export default TrackReportPage;
