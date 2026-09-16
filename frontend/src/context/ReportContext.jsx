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
        const [publicReports, setPublicReports] = useState(INITIAL_REPORTS);
        const [reportsLoading, setReportsLoading] = useState(true);
        const [reportsError, setReportsError] = useState('');

        useEffect(() => {
            localStorage.removeItem('hazardwatch_reports');
            setReports([]);
        }, []);

        useEffect(() => {
            localStorage.setItem('hazardwatch_reports', JSON.stringify(reports));
        }, [reports]);

        const fetchPublicReports = useCallback(async () => {
            try {
                const response = await api.get('/reports/public', {
                    params: { page: 1, limit: 100 },
                });
                const nextReports = response.data?.reports || [];
                setPublicReports(nextReports);
                if (!canAccessStaffReports) {
                    setReports(nextReports);
                }
                return nextReports;
            } catch (error) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    setPublicReports([]);
                    if (!canAccessStaffReports) {
                        setReports([]);
                    }
                    return [];
                }

                throw new Error(error.response?.data?.message || 'Unable to load public reports.');
            }
        }, [canAccessStaffReports]);

        const fetchReports = useCallback(async () => {
            setReportsLoading(true);
            setReportsError('');
            try {
                if (canAccessStaffReports) {
                    const response = await api.get('/reports', {
                        params: { page: 1, limit: 100, includeResolved: true },
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const nextReports = response.data?.reports || [];
                    setReports(nextReports);
                    return nextReports;
                }

                if (!token && !isTokenValid) {
                    return fetchPublicReports();
                }

                if (token && !isTokenValid) {
                    setReports([]);
                    setPublicReports([]);
                    return [];
                }

                return fetchPublicReports();
            } catch (error) {
                const status = error.response?.status;
                if (status === 401 || status === 403) {
                    setReports([]);
                    return [];
                }
                const message = error.response?.data?.message || error.message || 'Unable to load reports.';
                setReportsError(message);
                throw new Error(message);
            } finally {
                setReportsLoading(false);
            }
        }, [canAccessStaffReports, fetchPublicReports, isTokenValid, token]);

        useEffect(() => {
            const handleReportsUpdated = () => {
                fetchReports().catch(() => {});
            };

            window.addEventListener('hw:reports-updated', handleReportsUpdated);
            return () => {
                window.removeEventListener('hw:reports-updated', handleReportsUpdated);
            };
        }, [fetchReports]);

        useEffect(() => {
            if (canAccessStaffReports) {
                fetchReports().catch(() => {});
                return undefined;
            }

            fetchPublicReports().catch(() => {});

            if (!token || !user) {
                return undefined;
            }

            const interval = window.setInterval(() => {
                if (isTokenValid && token && user) fetchReports().catch(() => {});
            }, 30000);
            const handleFocus = () => fetchReports().catch(() => {});
            window.addEventListener('focus', handleFocus);
            return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            };
        }, [canAccessStaffReports, fetchPublicReports, fetchReports, isTokenValid, token, user?._id, user?.role]);

        const addReport = async (newReport, token) => {
            const selectedFiles = Array.from(newReport?.photos || (newReport?.photoFile ? [newReport.photoFile] : []));
            if (!selectedFiles.length) {
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

            const latitude = Number(normalizedLocation.coordinates[1]);
            const longitude = Number(normalizedLocation.coordinates[0]);
            if (latitude < 16.02 || latitude > 16.10 || longitude < 120.30 || longitude > 120.40) {
            throw new Error('Reports must be submitted within Dagupan City limits.');
            }

            const payload = new FormData();
            payload.append('category', String(newReport.category));
            payload.append('customCategory', String(newReport.customCategory || ''));
            payload.append('description', String(newReport.description).trim());
            payload.append('address', String(newReport.address || ''));
            payload.append('location', JSON.stringify(normalizedLocation));
            payload.append('barangay', String(newReport.barangay || ''));
            selectedFiles.forEach((file, index) => {
            payload.append(index === 0 ? 'photo' : 'images', file, file.name || `photo-${index + 1}.jpg`);
            });

            try {
            const response = await api.post('/reports', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const report = response.data?.report;
            setReports(prev => [report, ...prev]);
            setPublicReports(prev => [report, ...prev]);
            window.dispatchEvent(new Event('hw:reports-updated'));
            fetchPublicReports().catch(() => {});
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
            <ReportContext.Provider value={{ reports, publicReports, reportsLoading, reportsError, addReport, updateReportStatus, updateReportPriority, deleteReport, fetchReports, fetchPublicReports }}>
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