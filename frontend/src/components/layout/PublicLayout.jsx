import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CursorGlow from '../common/CursorGlow';
import GlobalAnnouncementBanner from './GlobalAnnouncementBanner';
import useGlobalAnnouncement from '../../hooks/useGlobalAnnouncement';

const PublicLayout = ({ children }) => {
  const announcement = useGlobalAnnouncement();

  return (
    <div className="public-shell">
      <GlobalAnnouncementBanner announcement={announcement} />
      <CursorGlow />
      <Navbar announcementVisible={Boolean(announcement)} />
      {children}
      <Footer />
    </div>
  );
};

export default PublicLayout;
