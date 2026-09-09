import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

export default PublicLayout;
