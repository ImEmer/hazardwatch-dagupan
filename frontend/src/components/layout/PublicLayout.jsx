import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => (
  <div className="public-shell">
    <Navbar />
    {children}
    <Footer />
  </div>
);

export default PublicLayout;
