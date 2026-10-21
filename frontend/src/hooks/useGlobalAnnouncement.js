import { useSocket } from '../context/SocketContext';

const useGlobalAnnouncement = () => {
  const { announcement } = useSocket();
  return announcement;
};

export default useGlobalAnnouncement;
