import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CursorGlow from '../common/CursorGlow';

const PublicLayout = ({ children }) => (
  <div className="public-shell">
    <CursorGlow />
    <Navbar />
    {children}
    <Footer />
  </div>
);

export default PublicLayout;
