import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Fade,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconSquare,
  IconRotateClockwise,
  IconCheck,
  IconHeart
} from '@tabler/icons-react';
import soundHelper from './soundHelper';

const TOTAL_SESSION_SECONDS = 60;
// Phase durations in seconds: 4s Breathe In, 4s Hold, 4s Breathe Out, 2s Rest (Total = 14s)
const CYCLE_DURATION = 14;

const getPhaseInfo = (cycleSecond) => {
  if (cycleSecond < 4) {
    return {
      phase: 'in',
      label: 'Breathe In...',
      subtext: 'Inhale slowly through your nose',
      color: '#00bcd4',
      scale: 1.55,
      transitionDuration: '4s'
    };
  } else if (cycleSecond < 8) {
    return {
      phase: 'hold',
      label: 'Hold...',
      subtext: 'Gently hold your breath',
      color: '#7e57c2',
      scale: 1.55,
      transitionDuration: '0.2s'
    };
  } else if (cycleSecond < 12) {
    return {
      phase: 'out',
      label: 'Breathe Out...',
      subtext: 'Exhale slowly through your mouth',
      color: '#ffa726',
      scale: 1.0,
      transitionDuration: '4s'
    };
  } else {
    return {
      phase: 'rest',
      label: 'Rest...',
      subtext: 'Relax before the next cycle',
      color: '#26a69a',
      scale: 1.0,
      transitionDuration: '0.2s'
    };
  }
};

export default function BreathingExercise({ isMuted, onClose }) {
  const theme = useTheme();

  // States: 'idle' | 'running' | 'paused' | 'completed'
  const [status, setStatus] = useState('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SESSION_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, []);

  const startSession = () => {
    clearTimerInterval();
    const duration = remainingSeconds > 0 ? remainingSeconds : TOTAL_SESSION_SECONDS;
    endTimeRef.current = Date.now() + duration * 1000;
    setStatus('running');

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemainingSeconds(secondsLeft);
      const elapsed = TOTAL_SESSION_SECONDS - secondsLeft;
      setElapsedSeconds(elapsed);

      if (secondsLeft <= 0) {
        clearTimerInterval();
        setStatus('completed');
        soundHelper.playCompletionChime(isMuted);
      }
    }, 250);
  };

  const pauseSession = () => {
    clearTimerInterval();
    if (endTimeRef.current) {
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      setElapsedSeconds(TOTAL_SESSION_SECONDS - secondsLeft);
    }
    setStatus('paused');
  };

  const resumeSession = () => {
    startSession();
  };

  const resetSession = () => {
    clearTimerInterval();
    setRemainingSeconds(TOTAL_SESSION_SECONDS);
    setElapsedSeconds(0);
    setStatus('idle');
  };

  const endSession = () => {
    clearTimerInterval();
    resetSession();
  };

  const cycleSecond = elapsedSeconds % CYCLE_DURATION;
  const currentCycle = Math.min(Math.floor(elapsedSeconds / CYCLE_DURATION) + 1, 4);
  const phaseInfo = getPhaseInfo(cycleSecond);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
      {/* Completion View */}
      {status === 'completed' ? (
        <Fade in={status === 'completed'}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                bgcolor: 'rgba(38, 166, 154, 0.15)',
                color: '#26a69a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                boxShadow: '0 8px 24px rgba(38, 166, 154, 0.3)'
              }}
            >
              <IconHeart size={48} stroke={2} />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              Session Complete!
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontWeight: 600 }}>
              Feel refreshed, calm and centered. 🌿
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={onClose}
                sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
              >
                Return to ERP
              </Button>
              <Button
                variant="outlined"
                onClick={resetSession}
                sx={{ borderRadius: '10px', px: 2, py: 1, fontWeight: 600, textTransform: 'none' }}
              >
                Repeat Session
              </Button>
            </Stack>
          </Box>
        </Fade>
      ) : (
        /* Active or Idle Breathing Visual */
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Phase Badge & Cycle counter */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, height: 28 }}>
            {status !== 'idle' ? (
              <>
                <Chip
                  label={phaseInfo.label}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    bgcolor: `${phaseInfo.color}20`,
                    color: phaseInfo.color,
                    border: `1px solid ${phaseInfo.color}50`
                  }}
                />
                <Chip
                  label={`Cycle ${currentCycle} of 4`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              </>
            ) : (
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                4s Inhale • 4s Hold • 4s Exhale • 2s Rest
              </Typography>
            )}
          </Stack>

          {/* Calming Animated Visual Circle */}
          <Box
            sx={{
              position: 'relative',
              width: 210,
              height: 210,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5
            }}
          >
            {/* Outer soft glow ring */}
            <Box
              sx={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: '50%',
                border: '2px dashed',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                pointerEvents: 'none'
              }}
            />

            {/* Pulsing Breathing Circle */}
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  status === 'idle'
                    ? `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
                    : `linear-gradient(135deg, ${phaseInfo.color}, ${phaseInfo.color}CC)`,
                boxShadow:
                  status === 'running'
                    ? `0 0 30px ${phaseInfo.color}60`
                    : `0 8px 24px ${theme.palette.primary.main}30`,
                transform: status === 'running' ? `scale(${phaseInfo.scale})` : 'scale(1)',
                transition: status === 'running' ? `transform ${phaseInfo.transitionDuration} ease-in-out, background 0.6s ease, box-shadow 0.6s ease` : 'all 0.3s ease',
                zIndex: 1
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                {status === 'idle' ? 'Relax' : phaseInfo.phase}
              </Typography>
            </Box>
          </Box>

          {/* Subtext and Countdown */}
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, height: 20 }}>
            {status !== 'idle' ? phaseInfo.subtext : 'Take a minute to reset your breathing'}
          </Typography>

          <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary', mb: 3 }}>
            {formatTime(remainingSeconds)}
          </Typography>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {status === 'idle' && (
              <Button
                variant="contained"
                size="large"
                startIcon={<IconPlayerPlay size={20} />}
                onClick={startSession}
                sx={{
                  borderRadius: '12px',
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  bgcolor: '#00897b',
                  '&:hover': { bgcolor: '#00796b' },
                  boxShadow: '0 4px 16px rgba(0, 137, 123, 0.4)'
                }}
              >
                Start 60s Session
              </Button>
            )}

            {status === 'running' && (
              <>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<IconPlayerPause size={20} />}
                  onClick={pauseSession}
                  sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconSquare size={18} />}
                  onClick={endSession}
                  sx={{ borderRadius: '10px', px: 2.5, py: 1, fontWeight: 600, textTransform: 'none' }}
                >
                  End Session
                </Button>
              </>
            )}

            {status === 'paused' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlayerPlay size={20} />}
                  onClick={resumeSession}
                  sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                  Resume
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<IconRotateClockwise size={18} />}
                  onClick={resetSession}
                  sx={{ borderRadius: '10px', px: 2, py: 1, fontWeight: 600, textTransform: 'none' }}
                >
                  Reset
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={endSession}
                  sx={{ borderRadius: '10px', px: 2, py: 1, fontWeight: 600, textTransform: 'none' }}
                >
                  End
                </Button>
              </>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
