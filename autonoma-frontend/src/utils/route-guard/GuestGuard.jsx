import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// project imports
import useAuth from 'hooks/useAuth';
import { DASHBOARD_PATH } from 'config';
import { useEffect } from 'react';

// ==============================|| GUEST GUARD ||============================== //

/**
 * Guest guard for routes having no auth required
 * @param {PropTypes.node} children children element/node
 */

export default function GuestGuard({ children }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (user?.userLevel === 0 || user?.userLevel === 1 || user?.userLevel >= 5) {
        navigate(DASHBOARD_PATH, { replace: true });
      } else {
        navigate('/access-denied', { replace: true });
      }
    }
  }, [isLoggedIn, navigate, user]);

  return children;
}

GuestGuard.propTypes = { children: PropTypes.any };
