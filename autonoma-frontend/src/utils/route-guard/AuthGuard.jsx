import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// project imports
import useAuth from 'hooks/useAuth';
import { useEffect } from 'react';

// ==============================|| AUTH GUARD ||============================== //

/**
 * Authentication guard for routes
 * @param {PropTypes.node} children children element/node
 */
export default function AuthGuard({ children }) {
  const { isLoggedIn, isInitialized } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const isPublicInduction = window.location.pathname.replace(/\/$/, '') === '/hra/ats/induction-trainee' && token;

  useEffect(() => {
    if (isInitialized && !isLoggedIn && !isPublicInduction) {
      navigate(`/login`, { replace: true });
    }
  }, [isLoggedIn, isInitialized, navigate, isPublicInduction]);

  if (!isInitialized || (!isLoggedIn && !isPublicInduction)) {
    return null;
  }

  return children;
}

AuthGuard.propTypes = { children: PropTypes.any };
