    import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
    import useAuth from '../hooks/useAuth';

    const ReportContext = createContext();
    const INITIAL_REPORTS = [];

    export const ReportProvider = ({ children }) => {
    const { token, user } = useAuth();
    const canFetchReports = Boolean(token && ['superadmin', 'admin', 'staff'].includes(user?.role));
    const [reports, setReports] = useState(INITIAL_REPORTS);

    useEffect(() => {
        localStorage.removeItem('hazardwatch_reports');
        setReports([]);
    }, []);

    useEffect(() => {
        localStorage.setItem('hazardwatch_reports', JSON.stringify(reports));
    }, [reports]);

    const fetchReports = useCallback(async () => {
        if (!canFetchReports) return;

        const allReports = [];
        let page = 1;
        let pages = 1;
        do {

        const response = await fetch(`/reports?page=${page}&limit=100`, {
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


        const response = await fetch('/reports', {
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

        const response = await fetch(`/reports/${reportId}/status`, {
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

        const response = await fetch(`/reports/${reportId}/priority`, {
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

        const response = await fetch(`/reports/${reportId}`, {
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

    export const useReports = () => {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportProvider');
    }
    return context;
    };