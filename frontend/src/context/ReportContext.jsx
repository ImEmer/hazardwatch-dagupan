        import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
        import useAuth from '../hooks/useAuth';
        import api from '../services/api';

        const ReportContext = createContext();
        const INITIAL_REPORTS = [];

        const decodeJwtPayload = (jwt) => {
            if (!jwt || typeof jwt !== 'string') return null;

            try {
                const payload = jwt.split('.')[1];
                if (!payload) return null;
                const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
                const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
                return JSON.parse(atob(padded));
            } catch (error) {
                return null;
            }
        };

        const hasValidToken = (jwt) => {
            if (!jwt) return false;
            const decoded = decodeJwtPayload(jwt);
            if (!decoded || !decoded.exp) return true;
            return Number(decoded.exp) * 1000 > Date.now();
        };

        export const ReportProvider = ({ children }) => {
        const { token, user } = useAuth();
        const isTokenValid = hasValidToken(token);
        const canAccessStaffReports = Boolean(token && ['superadmin', 'admin', 'staff'].includes(user?.role));
        const [reports, setReports] = useState(INITIAL_REPORTS);

        useEffect(() => {
            localStorage.removeItem('hazardwatch_reports');
            setReports([]);
        }, []);

        useEffect(() => {
            localStorage.setItem('hazardwatch_reports', JSON.stringify(reports));
        }, [reports]);

        const fetchReports = useCallback(async () => {
            if (!isTokenValid) {
                setReports([]);
                return [];
            }

            try {
                const endpoint = canAccessStaffReports ? '/reports' : '/reports/public';
                const config = canAccessStaffReports
                    ? {
                        params: { page: 1, limit: 100 },
                        headers: { Authorization: `Bearer ${token}` },
                    }
                    : {
                        params: { page: 1, limit: 100 },
                    };

                const response = await api.get(endpoint, config);
                const body = response.data || {};
                const nextReports = body.reports || [];
                setReports(nextReports);
                return nextReports;
            } catch (error) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    setReports([]);
                    return [];
                }

                throw new Error(error.response?.data?.message || 'Unable to load reports.');
            }
        }, [canAccessStaffReports, isTokenValid, token]);

        useEffect(() => {
            if (!isTokenValid) {
                setReports([]);
                return undefined;
            }

            fetchReports().catch(() => {});
            const interval = window.setInterval(() => {
                if (isTokenValid) fetchReports().catch(() => {});
            }, 30000);
            const handleFocus = () => fetchReports().catch(() => {});
            window.addEventListener('focus', handleFocus);
            return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            };
        }, [fetchReports, isTokenValid, user?.role, token]);

        const addReport = async (newReport, token) => {
            const photoFile = newReport?.photoFile || newReport?.photo;
            if (!photoFile) {
            throw new Error('Photo evidence is required.');
            }

            const normalizedLocation = newReport.location && Array.isArray(newReport.location.coordinates)
            ? {
                type: 'Point',
                coordinates: [
                Number(newReport.location.coordinates[0]),
                Number(newReport.location.coordinates[1]),
                ],
            }
            : null;

            if (!normalizedLocation || normalizedLocation.coordinates.some((coord) => Number.isNaN(coord))) {
            throw new Error('Please select a valid location on the map.');
            }

            const payload = new FormData();
            payload.append('category', String(newReport.category));
            payload.append('description', String(newReport.description).trim());
            payload.append('address', String(newReport.address || ''));
            payload.append('location', JSON.stringify(normalizedLocation));
            payload.append('barangay', String(newReport.barangay || ''));
            payload.append('photo', photoFile, photoFile.name || 'photo.jpg');

            try {
            const response = await api.post('/reports', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const report = response.data?.report;
            setReports(prev => [report, ...prev]);
            fetchReports().catch(() => {});
            return report;
            } catch (error) {
            throw new Error(error.response?.data?.message || 'Unable to save the report.');
            }
        };

        const updateReportStatus = async (id, newStatus) => {
            const reportId = String(id);
            if (/^[a-f\d]{24}$/i.test(reportId) && token) {
            try {
                await api.patch(`/reports/${reportId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Unable to update report status.');
            }
            }
            setReports((prev) => prev.map((report) => String(report.id || report._id) === reportId ? { ...report, status: newStatus } : report));
            fetchReports().catch(() => {});
        };

        const updateReportPriority = async (id, newPriority) => {
            const reportId = String(id);
            if (/^[a-f\d]{24}$/i.test(reportId) && token) {
            try {
                await api.patch(`/reports/${reportId}/priority`, { priority: newPriority }, {
                headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Unable to update report priority.');
            }
            }
            setReports((prev) => prev.map((report) => String(report.id || report._id) === reportId ? { ...report, priority: newPriority } : report));
            fetchReports().catch(() => {});
        };

        const deleteReport = async (id, token) => {
            const reportId = String(id);
            if (/^[a-f\d]{24}$/i.test(reportId) && token) {
            try {
                await api.delete(`/reports/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                throw new Error(error.response?.data?.message || 'Unable to delete the report.');
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