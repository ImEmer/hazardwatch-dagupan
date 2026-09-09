import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-[#2e303a] bg-[#0a0b0f] px-8 pb-8 pt-12 md:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
        <div>
          <h3 className="mb-3 text-xl font-bold text-white">HazardWatch</h3>
          <p className="text-sm text-gray-400">Community-based hazard reporting and monitoring platform for Dagupan City.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="text-gray-400 transition hover:text-white">Home</Link></li>
            <li><Link to="/submit" className="text-gray-400 transition hover:text-white">Submit Report</Link></li>
            <li><Link to="/map" className="text-gray-400 transition hover:text-white">Hazard Map</Link></li>
            <li><Link to="/my-reports" className="text-gray-400 transition hover:text-white">My Reports</Link></li>
            <li><Link to="/about" className="text-gray-400 transition hover:text-white">About</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="text-gray-400 transition hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-400 transition hover:text-white">Terms of Use</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Connect</h4>
          <ul className="space-y-3 text-sm">
            <li className="text-gray-400">hazardwatch@dagupan.gov.ph</li>
            <li className="text-gray-400">+63 (75) 123-4567</li>
            <li className="text-gray-400">Dagupan City, Pangasinan</li>
            <li className="text-gray-400">Philippines</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#2e303a] pt-6 text-center">
        <p className="text-sm text-gray-500">&copy; 2026 HazardWatch. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
