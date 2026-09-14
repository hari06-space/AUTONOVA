import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from './useAuth';
import axios from 'utils/axios';

const useNavigationTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const prevPathRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const recordEntry = async (pathname) => {
      try {
        // Determine page name from pathname
        const pageName =
          pathname === '/'
            ? 'Dashboard'
            : pathname
                .split('/')
                .filter(Boolean)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' > ');

        await axios.post('/api/analytics/sessions/record-entry', {
          userId: user.id || user.userId,
          pageName,
          pageUrl: pathname
        });
      } catch (error) {
        console.error('Failed to record navigation entry:', error);
      }
    };

    const recordExit = async () => {
      try {
        await axios.post('/api/analytics/sessions/record-exit', {
          userId: user.id || user.userId
        });
      } catch (error) {
        console.error('Failed to record navigation exit:', error);
      }
    };

    if (prevPathRef.current !== location.pathname) {
      recordEntry(location.pathname);
      prevPathRef.current = location.pathname;
    }

    // Cleanup function for when user leaves or logs out
    return () => {
      // This is tricky with React lifecycle, usually exit is recorded by the NEXT entry
      // but we can try to send an exit on unmount
    };
  }, [location.pathname, user]);

  // Handle session end (tab close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        const data = JSON.stringify({ userId: user.id || user.userId });
        navigator.sendBeacon(`${import.meta.env.VITE_APP_API_URL || window.location.origin}/api/analytics/sessions/record-exit`, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);
};

export default useNavigationTracker;
