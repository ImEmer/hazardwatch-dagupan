import { useEffect, useState } from 'react';
import { systemSettingsApi } from '../services/api';

const useGlobalAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let active = true;
    systemSettingsApi.getPublic()
      .then(({ data }) => {
        if (active) setAnnouncement(data?.settings?.globalAnnouncement || '');
      })
      .catch((error) => {
        console.error('Unable to load the global announcement.', error);
      });

    return () => { active = false; };
  }, []);

  return announcement;
};

export default useGlobalAnnouncement;
