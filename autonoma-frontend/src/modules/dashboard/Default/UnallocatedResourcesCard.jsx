import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import axios from 'utils/axios';
import { Player } from '@lottiefiles/react-lottie-player';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import { Box, Paper, Stack, Typography } from '@mui/material';
import GroupOffIcon from '@mui/icons-material/GroupOff';

// project imports
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';
import UnallocatedResourcesModal from './UnallocatedResourcesModal';
import lottieAnimation from 'assets/Gif/Assistant.json';

export default function UnallocatedResourcesCard({ isLoading, onCountLoaded }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      axios.get('/api/qms/meeting-schedules/unallocated-resources')
        .then(response => {
          const val = response.data?.length || 0;
          setCount(val);
          if (onCountLoaded) onCountLoaded(val);
        })
        .catch(err => console.error('Error fetching unallocated resources', err));
    }
  }, [isLoading, onCountLoaded]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Styling config to match other module cards
  const mc = { color: '#25293A', grad: 'linear-gradient(135deg, #0F172A, #1E293B, #475569)' };

  return (
    <>
      {isLoading ? (
        <SkeletonEarningCard />
      ) : (
        <Paper
          elevation={0}
          sx={{
            height: 140, display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: '20px',
            background: theme.palette.mode === 'dark' ? `linear-gradient(135deg, ${alpha(mc.color, 0.2)} 0%, rgba(0,0,0,0) 100%)` : `linear-gradient(135deg, ${alpha(mc.color, 0.1)} 0%, #ffffff 100%)`,
            border: `1px solid ${alpha(mc.color, 0.2)}`,
            boxShadow: `0 8px 32px ${alpha(mc.color, 0.1)}`,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: `0 12px 40px ${alpha(mc.color, 0.2)}`,
              border: `1px solid ${alpha(mc.color, 0.4)}`,
            }
          }}
          onClick={handleOpen}
        >
          {/* Abstract Decor Circles */}
          <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(mc.color, 0.2)} 0%, transparent 70%)`, zIndex: 0 }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(mc.color, 0.15)} 0%, transparent 70%)`, zIndex: 0 }} />

          {/* Lottie Container */}
          <Box sx={{
            position: 'absolute', top: '50%', right: -15, transform: 'translateY(-50%)',
            width: 140, height: 140,
            zIndex: 1, pointerEvents: 'none',
            opacity: 0.95, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '.MuiPaper-root:hover &': { transform: 'translateY(-50%) scale(1.15) rotate(-3deg)' }
          }}>
            <Player autoplay loop src={lottieAnimation} style={{ width: '100%', height: '100%' }} background="transparent" />
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, zIndex: 2, position: 'relative' }}>
            {/* Content Container */}
            <Stack direction="row" alignItems="center" spacing={2.5} sx={{ height: '100%', mt: 0.5 }}>
              {/* Icon Box */}
              <Box sx={{
                width: 60, height: 60, borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: mc.grad, color: '#fff',
                boxShadow: `0 6px 16px ${alpha(mc.color, 0.4)}`,
                transition: 'transform 0.3s',
                flexShrink: 0,
                '.MuiPaper-root:hover &': { transform: 'scale(1.05) rotate(5deg)' }
              }}>
                <GroupOffIcon sx={{ fontSize: 32 }} />
              </Box>

              {/* Title and Number Column */}
              <Stack direction="column" spacing={0.3} sx={{ maxWidth: '60%' }}>
                <Typography sx={{
                  fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase',
                  color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                  lineHeight: 1.2, letterSpacing: '0.03em', wordBreak: 'break-word',
                  textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}>
                  UNALLOCATED RESOURCES
                </Typography>
                <Typography sx={{
                  fontWeight: 900, fontSize: '1.5rem', lineHeight: 1,
                  background: mc.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: `drop-shadow(0 2px 4px ${alpha(mc.color, 0.3)})`
                }}>
                  {count}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px', mt: 0.5, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: theme.palette.mode === 'dark' ? '#94A3B8' : '#64748B' }}>
                    Available Employees
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      )}

      {open && <UnallocatedResourcesModal open={open} handleClose={handleClose} />}
    </>
  );
}

UnallocatedResourcesCard.propTypes = {
  isLoading: PropTypes.bool
};
