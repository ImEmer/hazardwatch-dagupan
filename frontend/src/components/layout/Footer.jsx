import React from 'react';
import { Link } from 'react-router-dom';
import useTheme from '../../hooks/useTheme';

const Footer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const muted = isDark ? 'text-gray-400' : 'text-slate-600';
  return <footer className={`border-t px-8 pb-8 pt-12 md:px-12 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]' : 'border-slate-200 bg-white'}`}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <h3 className={`mb-3 text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>HazardWatch</h3>
          <p className={`text-sm ${muted}`}>Community-based hazard reporting and monitoring platform for Dagupan City.</p>
        </div>
        <div>
          <h4 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className={`${muted} transition hover:text-[#3b82f6]`}>Home</Link></li>
            <li><Link to="/submit" className={`${muted} transition hover:text-[#3b82f6]`}>Submit Report</Link></li>
            <li><Link to="/map" className={`${muted} transition hover:text-[#3b82f6]`}>Hazard Map</Link></li>
            <li><Link to="/my-reports" className={`${muted} transition hover:text-[#3b82f6]`}>My Reports</Link></li>
            <li><Link to="/about" className={`${muted} transition hover:text-[#3b82f6]`}>About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className={`${muted} transition hover:text-[#3b82f6]`}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={`${muted} transition hover:text-[#3b82f6]`}>Terms of Use</Link></li>
            <li><Link to="/contact" className={`${muted} transition hover:text-[#3b82f6]`}>Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className={`mb-3 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Connect</h4>
          <ul className="space-y-3 text-sm">
            <li className={muted}>hazardwatch@dagupan.gov.ph</li>
            <li className={muted}>+63 (75) 123-4567</li>
            <li className={muted}>Dagupan City, Pangasinan</li>
            <li className={muted}>Philippines</li>
          </ul>
        </div>
      </div>
      <div className={`border-t pt-6 text-center ${isDark ? 'border-[#2e303a]' : 'border-slate-200'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>&copy; 2026 HazardWatch. All rights reserved.</p>
      </div>
    </div>
  </footer>;
};

export default Footer;
