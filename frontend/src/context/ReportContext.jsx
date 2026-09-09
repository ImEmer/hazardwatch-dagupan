    import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
    import useAuth from '../hooks/useAuth';

    const ReportContext = createContext();
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // MGA SAMPLE REPORTS - NASA DAGUPAN CITY TALAGA!
    const INITIAL_REPORTS = [
    {
        id: generateId(),
        title: 'Malalim na lubak sa Perez Blvd.',
        category: 'Pothole',
        description: 'Malaking lubak malapit sa Dagupan City Plaza. Delikado sa mga motorista.',
        location: { type: 'Point', coordinates: [120.3340, 16.0420] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
        id: generateId(),
        title: 'Sira na poste ng ilaw sa Bonuan Gueset',
        category: 'Streetlight',
        description: 'Madilim ang kalsada malapit sa Bonuan Gueset Elementary School.',
        location: { type: 'Point', coordinates: [120.3220, 16.0610] },
        status: 'In Progress',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
        id: generateId(),
        title: 'Baradong kanal sa Lucao District',
        category: 'Drainage',
        description: 'Umaapaw tuwing umuulan. Umaabot sa tuhod ang baha.',
        location: { type: 'Point', coordinates: [120.3400, 16.0380] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
        id: generateId(),
        title: 'Tambak na basura sa De Venecia Highway',
        category: 'Waste Disposal',
        description: 'Ilegal na tambakan ng basura. Mabaho at maraming langaw.',
        location: { type: 'Point', coordinates: [120.3500, 16.0500] },
        status: 'Resolved',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
    },
    {
        id: generateId(),
        title: 'Sirang covered court sa Tapuac',
        category: 'Public Facility',
        description: 'Sirang backboard at kalawanging ring sa covered court.',
        location: { type: 'Point', coordinates: [120.3280, 16.0330] },
        status: 'Pending',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    }
    ];

    export const ReportProvider = ({ children }) => {
    const { token, user } = useAuth();
    const canFetchReports = Boolean(token && ['superadmin', 'admin', 'staff'].includes(user?.role));
    const [reports, setReports] = useState(() => {
        const saved = localStorage.getItem('hazardwatch_reports');
        if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return INITIAL_REPORTS;
        }
        }
        return INITIAL_REPORTS;
    });

    useEffect(() => {
        localStorage.setItem('hazardwatch_reports', JSON.stringify(reports));
    }, [reports]);

    const fetchReports = useCallback(async () => {
        if (!canFetchReports) return;

        const allReports = [];
        let page = 1;
        let pages = 1;
        do {
        const response = await fetch(`/api/reports?page=${page}&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Unable to load reports.');
        allReports.push(...(body.reports || []));
        pages = body.pagination?.pages || 1;
        page += 1;
        } while (page <= pages);
        setReports(allReports);
    }, [canFetchReports, token]);

    useEffect(() => {
        if (!canFetchReports) return undefined;

        fetchReports().catch(() => {});
        const interval = window.setInterval(() => fetchReports().catch(() => {}), 30000);
        const handleFocus = () => fetchReports().catch(() => {});
        window.addEventListener('focus', handleFocus);
        return () => {
        window.clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
        };
    }, [canFetchReports, fetchReports]);

    const addReport = async (newReport, token) => {
        const payload = new FormData();
        payload.append('category', newReport.category);
        payload.append('description', newReport.description);
        payload.append('address', newReport.address || '');
        payload.append('location', JSON.stringify(newReport.location));
        payload.append('photo', newReport.photoFile);
        payload.append('barangay', newReport.barangay || '');

        const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Unable to save the report.');

        const report = body.report;
        setReports(prev => [report, ...prev]);
        fetchReports().catch(() => {});
        return report;
    };

    const updateReportStatus = async (id, newStatus) => {
        const reportId = String(id);
        if (/^[a-f\d]{24}$/i.test(reportId) && token) {
        const response = await fetch(`/api/reports/${reportId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Unable to update report status.');
        }
        setReports((prev) => prev.map((report) => String(report.id || report._id) === reportId ? { ...report, status: newStatus } : report));
        fetchReports().catch(() => {});
    };

    const updateReportPriority = async (id, newPriority) => {
        const reportId = String(id);
        if (/^[a-f\d]{24}$/i.test(reportId) && token) {
        const response = await fetch(`/api/reports/${reportId}/priority`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ priority: newPriority }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || 'Unable to update report priority.');
        }
        setReports((prev) => prev.map((report) => String(report.id || report._id) === reportId ? { ...report, priority: newPriority } : report));
        fetchReports().catch(() => {});
    };

    const deleteReport = async (id, token) => {
        const reportId = String(id);
        if (/^[a-f\d]{24}$/i.test(reportId) && token) {
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || 'Unable to delete the report.');
        }
        }
        setReports((prev) => prev.filter((report) => String(report.id || report._id) !== reportId));
        fetchReports().catch(() => {});
    };

    return (
        <ReportContext.Provider value={{ reports, addReport, updateReportStatus, updateReportPriority, deleteReport, fetchReports }}>
        {children}
        </ReportContext.Provider>
    );
    };

    // ITO ANG IMPORTANTE - SIGURADONG NASA LABAS ITO NG COMPONENT!
    export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportProvider');
    }
    return context;
    };