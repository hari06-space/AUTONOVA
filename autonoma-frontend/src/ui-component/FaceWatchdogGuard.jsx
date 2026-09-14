/**
 * FaceWatchdogGuard.jsx
 *
 * Renders a full-screen countdown overlay when "face watchdog" is active and
 * the user's face is not detected. Auto-logout fires after 30 s of absence.
 *
 * Also exports FaceWatchdogContext so the Settings page toggle can call
 * setEnabled() without prop-drilling.
 */

import { createContext, useContext } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import useFaceWatchdog from 'hooks/useFaceWatchdog';

// ── Context ──────────────────────────────────────────────────────────────────
export const FaceWatchdogContext = createContext(null);

export function useFaceWatchdogContext() {
  return useContext(FaceWatchdogContext);
}

// ── Constants ─────────────────────────────────────────────────────────────────
// Will be loaded dynamically from localStorage inside the component

// ── Component ─────────────────────────────────────────────────────────────────
export default function FaceWatchdogGuard({ children }) {
  const watchdog = useFaceWatchdog();
  const { enabled, countdown, facePresent } = watchdog;

  const ABSENCE_TIMEOUT_S = parseInt(localStorage.getItem('autoLogoutSeconds') || '30', 10);

  // Show warning overlay only when counting down (face absent)
  const showWarning = enabled && countdown !== null && countdown >= 0;
  const progress = showWarning ? (countdown / ABSENCE_TIMEOUT_S) * 100 : 100;
  const isUrgent = countdown !== null && countdown <= Math.min(10, ABSENCE_TIMEOUT_S);

  return (
    <FaceWatchdogContext value={watchdog}>
      {children}

      {/* ── Countdown Overlay ───────────────────────────────────────────── */}
      {showWarning && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 7000,
            minWidth: 340,
            maxWidth: 420,
            borderRadius: '20px',
            overflow: 'hidden',
            background: isUrgent
              ? 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)'
              : 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            boxShadow: isUrgent
              ? '0 20px 60px rgba(244,67,54,0.5), 0 0 0 1px rgba(244,67,54,0.3)'
              : '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
            WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
            animation: 'watchdogSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '@keyframes watchdogSlideUp': {
              from: { opacity: 0, transform: 'translateX(-50%) translateY(20px) scale(0.95)' },
              to: { opacity: 1, transform: 'translateX(-50%) translateY(0)   scale(1)' },
            },
          }}
        >
          {/* Animated border glow */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '20px',
              background: isUrgent
                ? 'linear-gradient(135deg, rgba(244,67,54,0.15), transparent 60%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          <Box sx={{ p: 2.5, position: 'relative' }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              {/* Pulsing icon */}
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: isUrgent ? 'rgba(244,67,54,0.2)' : 'rgba(255,152,0,0.15)',
                  color: isUrgent ? '#f44336' : '#ff9800',
                  animation: isUrgent ? 'pulse 0.8s ease-in-out infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.12)', opacity: 0.8 },
                  },
                  flexShrink: 0,
                }}
              >
                <IconEyeOff size={24} stroke={2} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Face Not Detected
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Auto-logout in progress
                </Typography>
              </Box>

              {/* Countdown pill */}
              <Box
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: '50px',
                  bgcolor: isUrgent ? 'rgba(244,67,54,0.2)' : 'rgba(255,152,0,0.12)',
                  border: `1.5px solid ${isUrgent ? 'rgba(244,67,54,0.5)' : 'rgba(255,152,0,0.3)'}`,
                  minWidth: 56,
                  textAlign: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: isUrgent ? '#f44336' : '#ff9800',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {countdown}s
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: isUrgent
                    ? 'linear-gradient(90deg, #f44336, #ff1744)'
                    : 'linear-gradient(90deg, #ff9800, #ffb74d)',
                  transition: 'transform 0.5s linear',
                },
              }}
            />

            {/* Tip text */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
              <IconEye size={14} color="rgba(255,255,255,0.35)" />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                Look at the camera to cancel auto-logout
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </FaceWatchdogContext>
  );
}
