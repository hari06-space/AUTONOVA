// material-ui
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

// ==============================|| LOADER ||============================== //

export default function Loader({ showSkeleton = true }) {
  return (
    <>
      <Box sx={{ position: 'fixed', top: 0, left: 0, zIndex: 2000, width: '100%' }}>
        <LinearProgress color="primary" sx={{ height: 3 }} />
      </Box>
      {showSkeleton && (
        <Box sx={{ p: 3, pt: 5, width: '100%', display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.7 }}>
          <Skeleton variant="rounded" height={48} width="40%" />
          <Skeleton variant="rounded" height={220} width="100%" />
          <Skeleton variant="rounded" height={150} width="100%" />
        </Box>
      )}
    </>
  );
}

