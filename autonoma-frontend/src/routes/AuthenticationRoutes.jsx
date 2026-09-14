import { lazy } from 'react';

// project imports
import Loadable from 'ui-component/Loadable';
import ErrorBoundary from './ErrorBoundary';
import MinimalLayout from 'layout/MinimalLayout';

// login option 3 routing
const AuthLogin3 = Loadable(lazy(() => import('modules/pages/authentication/Login')));
const AuthRegister3 = Loadable(lazy(() => import('modules/pages/authentication/Register')));
const AuthForgotPassword3 = Loadable(lazy(() => import('modules/pages/authentication/ForgotPassword')));
const AuthCheckMail3 = Loadable(lazy(() => import('modules/pages/authentication/CheckMail')));
const AuthResetPassword3 = Loadable(lazy(() => import('modules/pages/authentication/ResetPassword')));
const AuthCodeVerification3 = Loadable(lazy(() => import('modules/pages/authentication/CodeVerification')));

// maintenance routing
const MaintenanceError = Loadable(lazy(() => import('modules/pages/maintenance/Error')));
const MaintenanceError500 = Loadable(lazy(() => import('modules/pages/maintenance/Error500')));
const MaintenanceUnderConstruction = Loadable(lazy(() => import('modules/pages/maintenance/UnderConstruction')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const AuthenticationRoutes = {
  path: '/',
  element: <MinimalLayout />,
  errorElement: <ErrorBoundary />,
  children: [
    {
      path: '/pages/login/login3',
      element: <AuthLogin3 />
    },
    {
      path: '/pages/register/register3',
      element: <AuthRegister3 />
    },
    {
      path: '/pages/forgot-password/forgot-password3',
      element: <AuthForgotPassword3 />
    },
    {
      path: '/pages/check-mail/check-mail3',
      element: <AuthCheckMail3 />
    },
    {
      path: '/pages/reset-password/reset-password3',
      element: <AuthResetPassword3 />
    },
    {
      path: '/pages/code-verification/code-verification3',
      element: <AuthCodeVerification3 />
    },
    {
      path: '/pages/error',
      element: <MaintenanceError />
    },
    {
      path: '/pages/500',
      element: <MaintenanceError500 />
    },
    {
      path: '/pages/under-construction',
      element: <MaintenanceUnderConstruction />
    }
  ]
};

export default AuthenticationRoutes;
