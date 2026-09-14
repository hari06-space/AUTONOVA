import { lazy } from 'react';

// project imports
import MinimalLayout from 'layout/MinimalLayout';
import NavMotion from 'layout/NavMotion';
import Loadable from 'ui-component/Loadable';
import ErrorBoundary from './ErrorBoundary';

const CandidateAssessment = Loadable(lazy(() => import('modules/candidate/Assessment')));
const CandidateOnboarding = Loadable(lazy(() => import('modules/candidate/Onboarding')));
const DocumentReupload = Loadable(lazy(() => import('modules/candidate/DocumentReupload')));
const InductionFeedbackPortal = Loadable(lazy(() => import('modules/hr/ats/InductionFeedbackPortal')));
const CandidateVerificationPortal = Loadable(lazy(() => import('modules/candidate/CandidateVerificationPortal')));
const ExternalAuditAttendance = Loadable(lazy(() => import('modules/qms/AuditSchedule/ExternalAuditAttendance')));

const CandidateRoutes = {
  path: '/',
  element: (
    <NavMotion>
      <MinimalLayout />
    </NavMotion>
  ),
  errorElement: <ErrorBoundary />,
  children: [
    {
      path: '/candidate/assessment',
      element: <CandidateAssessment />
    },
    {
      path: '/candidate/onboarding',
      element: <CandidateOnboarding />
    },
    {
      path: '/candidate/document-reupload',
      element: <DocumentReupload />
    },
    {
      path: '/public/induction-feedback',
      element: <InductionFeedbackPortal />
    },
    {
      path: '/public/candidate-verification',
      element: <CandidateVerificationPortal />
    },
    {
      path: '/qms/audit/external-attendance',
      element: <ExternalAuditAttendance />
    },
    {
      path: '/public/external-audit-attendance',
      element: <ExternalAuditAttendance />
    }
  ]
};

export default CandidateRoutes;
