import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Alert } from '@mui/material';

// project imports
import MaintenanceError from 'modules/pages/maintenance/Error';
import MaintenanceUnderConstruction from 'modules/pages/maintenance/UnderConstruction';
import MaintenanceError500 from 'modules/pages/maintenance/Error500';

// ==============================|| ELEMENT ERROR - COMMON ||============================== //

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error('ErrorBoundary caught an error:', error);

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <MaintenanceError />;
    }

    if (error.status === 401) {
      return <MaintenanceError500 />;
    }

    if (error.status === 503) {
      return <MaintenanceError500 />;
    }

    if (error.status === 418) {
      return <MaintenanceError500 />;
    }
  }

  // If there's an actual exception/error object (not undefined), it is a system crash (Error 500)
  if (error) {
    return (
      <Alert severity="error">
        <div>Under Maintenance</div>
        <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          {error.message || String(error)}
          {error.stack && `\n\nStack Trace:\n${error.stack}`}
        </pre>
      </Alert>
    );
  }

  // Otherwise, it was rendered directly as the wildcard path element (unimplemented route)
  return <MaintenanceUnderConstruction />;
}
