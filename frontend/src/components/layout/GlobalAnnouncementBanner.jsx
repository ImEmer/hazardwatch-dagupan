import React from 'react';

const GlobalAnnouncementBanner = ({ announcement }) => {
  if (!announcement) return null;

  return (
    <div role="status" className="sticky top-0 z-[60] flex min-h-12 items-center justify-center bg-yellow-300 px-4 py-3 text-center text-sm font-semibold text-black">
      {announcement}
    </div>
  );
};

export default GlobalAnnouncementBanner;
