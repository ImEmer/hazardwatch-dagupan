import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ReportProvider } from './context/ReportContext';
import HomePage from './pages/HomePage';
import SubmitReport from './pages/SubmitReport';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ReportProvider>
      <Router>
        {/*  */}
        <nav 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
            isScrolled 
              ? 'bg-[#1a1b24]/95 backdrop-blur-md border-b border-[#2e303a]' 
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto px-8 md:px-12 py-4 flex justify-between items-center">
            <div className="flex items-center gap-10">
              <Link to="/" className="text-xl font-bold text-white hover:text-[#3b82f6] transition tracking-tight">
                HazardWatch
              </Link>
              <div className="hidden md:flex gap-6">
                <Link to="/about" className="text-white hover:text-[#3b82f6] transition text-sm font-medium">
                  About
                </Link>
                <Link to="/features" className="text-white hover:text-[#3b82f6] transition text-sm font-medium">
                  Features
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                to="/submit" 
                className="px-5 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded-lg transition shadow-lg shadow-[#3b82f6]/25 hover:shadow-[#3b82f6]/40 text-sm"
              >
                Submit a Report
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submit" element={<SubmitReport />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ReportProvider>
  );
}

export default App;