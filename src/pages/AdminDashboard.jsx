    import React, { useState } from 'react';
    import { useReports } from '../context/ReportContext';
    import InteractiveMap from '../components/InteractiveMap';

    const AdminDashboard = () => {
    const { reports, updateReportStatus, deleteReport } = useReports();
    const [filter, setFilter] = useState('all');

    const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

    const getStatusColor = (status) => {
        const map = {
        'Pending': 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
        'In Progress': 'bg-blue-900/50 text-blue-300 border-blue-700',
        'Resolved': 'bg-green-900/50 text-green-300 border-green-700',
        'Closed': 'bg-gray-800/50 text-gray-300 border-gray-700'
        };
        return map[status] || 'bg-gray-800/50';
    };

    return (
        <div className="min-h-screen bg-[#0a0b0f] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex flex-wrap gap-2 bg-[#14151d] rounded-lg shadow p-1 border border-[#2e303a]">
                {['all', 'Pending', 'In Progress', 'Resolved'].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-md text-sm font-medium transition capitalize ${filter === s ? 'bg-[#3b82f6] text-white' : 'text-gray-400 hover:text-white hover:bg-[#252632]'}`}>
                    {s === 'all' ? 'All' : s}
                </button>
                ))}
            </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#14151d] border border-[#2e303a] rounded-xl shadow p-4 border-l-4 border-[#3b82f6]">
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
            </div>
            <div className="bg-[#14151d] border border-[#2e303a] rounded-xl shadow p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'Pending').length}</p>
            </div>
            <div className="bg-[#14151d] border border-[#2e303a] rounded-xl shadow p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'Resolved').length}</p>
            </div>
            <div className="bg-[#14151d] border border-[#2e303a] rounded-xl shadow p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'In Progress').length}</p>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><InteractiveMap reports={filteredReports} height="550px" /></div>
            <div className="bg-[#14151d] border border-[#2e303a] rounded-xl shadow-md p-4 max-h-[550px] overflow-y-auto">
                <h2 className="font-semibold text-white mb-3 flex justify-between"><span>Reports</span><span className="text-sm text-gray-400">{filteredReports.length}</span></h2>
                <div className="space-y-3">
                {filteredReports.length === 0 ? <p className="text-gray-400 text-center py-10">No reports found.</p> : 
                    filteredReports.map((r) => (
                    <div key={r.id} className="bg-[#0a0b0f] border border-[#2e303a] rounded-lg p-3 hover:shadow-sm hover:border-[#3b82f6]/30 transition group">
                        <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{r.title}</h4>
                            <p className="text-xs text-gray-400">{r.category}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border inline-block mt-1 ${getStatusColor(r.status)}`}>
                            {r.status}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                            <select value={r.status} onChange={(e) => updateReportStatus(r.id, e.target.value)} className="text-xs bg-[#14151d] border border-[#2e303a] rounded px-1 py-0.5 text-white">
                            <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option>
                            </select>
                            <button onClick={() => { if (confirm('Delete this report?')) deleteReport(r.id); }} className="text-xs text-red-400 hover:text-red-300 text-left opacity-0 group-hover:opacity-100 transition">Delete</button>
                        </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    ))
                }
                </div>
            </div>
            </div>
        </div>
        </div>
    );
    };

    export default AdminDashboard;