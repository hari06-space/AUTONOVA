import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// routes
import AuthenticationRoutes from './AuthenticationRoutes';
import LoginRoutes from './LoginRoutes';
import MainRoutes from './MainRoutes';

import ErrorBoundary from './ErrorBoundary';
import CandidateRoutes from './CandidateRoutes';

// project imports
import Loadable from 'ui-component/Loadable';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter(
  [
    { path: '/', element: <Navigate to="/login" />, errorElement: <ErrorBoundary /> },
    MainRoutes,
    LoginRoutes,
    AuthenticationRoutes,
    CandidateRoutes
  ],
  {
    basename: import.meta.env.VITE_APP_BASE_NAME
  }
);

export default router;
