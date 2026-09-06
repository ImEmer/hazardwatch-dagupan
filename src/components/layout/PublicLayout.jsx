import React from 'react';
import Navbar from './Navbar';

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default PublicLayout;
