    import React, { createContext, useContext, useState, useEffect } from 'react';

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

    const addReport = (newReport) => {
        const report = {
        id: generateId(),
        ...newReport,
        status: newReport.status || 'Pending',
        createdAt: new Date().toISOString()
        };
        setReports(prev => [report, ...prev]);
        return report;
    };

    const updateReportStatus = (id, newStatus) => {
        setReports(prev => 
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
        );
    };

    const deleteReport = (id) => {
        setReports(prev => prev.filter(r => r.id !== id));
    };

    return (
        <ReportContext.Provider value={{ reports, addReport, updateReportStatus, deleteReport }}>
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