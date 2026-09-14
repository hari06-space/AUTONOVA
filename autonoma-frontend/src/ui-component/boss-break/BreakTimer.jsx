import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Paper,
  Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRotateClockwise,
  IconSquare,
  IconCheck,
  IconSparkles
} from '@tabler/icons-react';
import soundHelper from './soundHelper';

export default function BreakTimer({ isMuted, onClose }) {
  const theme = useTheme();

  // Presets in minutes
  const [selectedDuration, setSelectedDuration] = useState(5); // 5, 10, or 'custom'
  const [customMinutes, setCustomMinutes] = useState(15);
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(5 * 60);

  // Timer states: 'idle' | 'running' | 'paused' | 'completed'
  const [status, setStatus] = useState('idle');

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Helper to clear interval safely
  const clearTimerInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimerInterval();
    };
  }, []);

  // Update total seconds when preset changes (only if idle)
  const handleDurationPresetChange = (event, newDuration) => {
    if (newDuration !== null && status === 'idle') {
      setSelectedDuration(newDuration);
      const minutes = newDuration === 'custom' ? customMinutes : newDuration;
      const seconds = minutes * 60;
      setTotalSeconds(seconds);
      setRemainingSeconds(seconds);
    }
  };

  const handleCustomMinutesChange = (e) => {
    const val = parseInt(e.target.value, 10);
    const clamped = isNaN(val) ? 1 : Math.max(1, Math.min(60, val));
    setCustomMinutes(clamped);
    if (selectedDuration === 'custom' && status === 'idle') {
      setTotalSeconds(clamped * 60);
      setRemainingSeconds(clamped * 60);
    }
  };

  const startTimer = () => {
    clearTimerInterval();
    const duration = remainingSeconds > 0 ? remainingSeconds : totalSeconds;
    endTimeRef.current = Date.now() + duration * 1000;
    setStatus('running');

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearTimerInterval();
        setStatus('completed');
        soundHelper.playCompletionChime(isMuted);
      }
    }, 250);
  };

  const pauseTimer = () => {
    clearTimerInterval();
    // Calculate exact remaining seconds at pause time
    if (endTimeRef.current) {
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
    }
    setStatus('paused');
  };

  const resumeTimer = () => {
    startTimer();
  };

  const resetTimer = () => {
    clearTimerInterval();
    const minutes = selectedDuration === 'custom' ? customMinutes : selectedDuration;
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setStatus('idle');
  };

  const endBreak = () => {
    clearTimerInterval();
    resetTimer();
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Calculate percentage elapsed
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
      {/* Duration Selector (Visible when idle) */}
      {status === 'idle' && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={selectedDuration}
            exclusive
            onChange={handleDurationPresetChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.7,
                fontSize: '0.825rem',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px'
              }
            }}
          >
            <ToggleButton value={5}>5 Min</ToggleButton>
            <ToggleButton value={10}>10 Min</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>

          {selectedDuration === 'custom' && (
            <TextField
              size="small"
              type="number"
              value={customMinutes}
              onChange={handleCustomMinutesChange}
              slotProps={{
                input: {
                  min: 1,
                  max: 60,
                  sx: { width: 80, borderRadius: '10px', fontWeight: 700 }
                }
              }}
              helperText="1–60 mins"
            />
          )}
        </Stack>
      )}

      {/* Completion View */}
      {status === 'completed' ? (
        <Fade in={status === 'completed'}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                bgcolor: 'rgba(46, 125, 50, 0.12)',
                color: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
                boxShadow: `0 8px 24px ${theme.palette.success.main}30`
              }}
            >
              <IconCheck size={48} stroke={2.5} />
            </Box>

            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              Break Complete!
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, fontWeight: 600 }}>
              Welcome back! You're ready to achieve great things. 🚀
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                onClick={onClose}
                sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
              >
                Return to Bos(s)
              </Button>
              <Button
                variant="outlined"
                onClick={resetTimer}
                sx={{ borderRadius: '10px', px: 2, py: 1, fontWeight: 600, textTransform: 'none' }}
              >
                Take Another Break
              </Button>
            </Stack>
          </Box>
        </Fade>
      ) : (
        /* Active / Idle Timer Display with Circular Ring */
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', width: 220, height: 220, mb: 3 }}>
            <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke={
                  status === 'paused'
                    ? theme.palette.warning.main
                    : theme.palette.primary.main
                }
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
              />
            </svg>

            {/* Inner text content */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', mb: 0.5 }}>
                {status === 'running' ? 'Take a moment' : status === 'paused' ? 'Paused' : 'Ready'}
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  letterSpacing: '-1px',
                  color: status === 'paused' ? theme.palette.warning.main : 'text.primary'
                }}
              >
                {formatTime(remainingSeconds)}
              </Typography>
            </Box>
          </Box>

          {/* Action Controls */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {status === 'idle' && (
              <Button
                variant="contained"
                size="large"
                startIcon={<IconPlayerPlay size={20} />}
                onClick={startTimer}
                sx={{
                  borderRadius: '12px',
                  px: 4,
                  py: 1.2,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  boxShadow: `0 4px 16px ${theme.palette.primary.main}40`
                }}
              >
                Start Break
              </Button>
            )}

            {status === 'running' && (
              <>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<IconPlayerPause size={20} />}
                  onClick={pauseTimer}
                  sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<IconSquare size={18} />}
                  onClick={endBreak}
                  sx={{ borderRadius: '10px', px: 2.5, py: 1, fontWeight: 600, textTransform: 'none' }}
                >
                  End Break
                </Button>
              </>
            )}

            {status === 'paused' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconPlayerPlay size={20} />}
                  onClick={resumeTimer}
                  sx={{ borderRadius: '10px', px: 3, py: 1, fontWeight: 700, textTransform: 'none' }}
                >
                  Resume
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<IconRotateClockwise size={18} />}
                  onClick={resetTimer}
                  sx={{ borderRadius: '10px', px: 2, py: 1, fontWeight: 600, textTransform: 'none' }}
                >
                  Reset
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={endBreak}
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
