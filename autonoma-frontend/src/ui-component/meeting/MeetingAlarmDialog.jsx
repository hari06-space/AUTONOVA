import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Tooltip,
  Paper,
  keyframes
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconBellRinging,
  IconVolume,
  IconVolumeOff,
  IconX,
  IconCheck,
  IconClock,
  IconUser,
  IconFileDescription,
  IconFlame,
  IconArrowRight,
  IconUsers,
  IconCrown
} from '@tabler/icons-react';
import useMeetingAlarmWatcher from 'hooks/useMeetingAlarmWatcher';

// ─── Keyframe Animations ───────────────────────────────────────────────────────
const alarmBellRing = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  5% { transform: rotate(22deg) scale(1.15); }
  10% { transform: rotate(-22deg) scale(1.15); }
  15% { transform: rotate(18deg) scale(1.1); }
  20% { transform: rotate(-18deg) scale(1.1); }
  25% { transform: rotate(12deg) scale(1.05); }
  30% { transform: rotate(-12deg) scale(1.05); }
  35% { transform: rotate(6deg); }
  40% { transform: rotate(-6deg); }
  45% { transform: rotate(0deg); }
  100% { transform: rotate(0deg) scale(1); }
`;

const rippleRing1 = keyframes`
  0% { transform: scale(0.85); opacity: 0.85; }
  50% { opacity: 0.4; }
  100% { transform: scale(2.3); opacity: 0; }
`;

const rippleRing2 = keyframes`
  0% { transform: scale(0.85); opacity: 0.75; }
  50% { opacity: 0.3; }
  100% { transform: scale(3.0); opacity: 0; }
`;

const borderGlowRotate = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const shimmerSweep = keyframes`
  0% { transform: translateX(-150%) skewX(-25deg); }
  40%, 100% { transform: translateX(250%) skewX(-25deg); }
`;

const eqBar1 = keyframes`
  0%, 100% { height: 4px; }
  50% { height: 14px; }
`;

const eqBar2 = keyframes`
  0%, 100% { height: 12px; }
  50% { height: 5px; }
`;

const eqBar3 = keyframes`
  0%, 100% { height: 5px; }
  50% { height: 15px; }
`;

const floatingAura = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
  50% { transform: translate(-10px, 12px) scale(1.2); opacity: 0.75; }
`;

const pulseBadge = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 3px 14px rgba(249, 115, 22, 0.3); }
  50% { transform: scale(1.02); box-shadow: 0 5px 20px rgba(239, 68, 68, 0.45); }
`;

const formatTo12h = (timeVal) => {
  if (!timeVal) return '-';
  if (Array.isArray(timeVal)) {
    const [h, m] = timeVal;
    timeVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const parts = String(timeVal).split(':');
  const hNum = parseInt(parts[0], 10);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  let h = hNum % 12;
  if (h === 0) h = 12;
  const m = String(parts[1] || '00').substring(0, 2).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

export default function MeetingAlarmDialog() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const {
    activeAlarm,
    secondsRemaining,
    meetingCountdownSeconds,
    isAudioMuted,
    toggleMute,
    handleClose,
    handleMarkAttendance
  } = useMeetingAlarmWatcher();

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 30) * 100));

  // Split countdown into minutes and seconds
  const countM = Math.floor(meetingCountdownSeconds / 60);
  const countS = meetingCountdownSeconds % 60;
  const countMStr = String(countM).padStart(2, '0');
  const countSStr = String(countS).padStart(2, '0');

  if (!activeAlarm) return null;

  const isHost = activeAlarm.userRole === 'HOST';

  return (
    <Dialog
      open={Boolean(activeAlarm)}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          width: { xs: '96%', sm: '92%', md: '520px' },
          maxWidth: '520px',
          maxHeight: 'calc(100dvh - 24px)',
          m: { xs: 1, sm: 2 },
          borderRadius: { xs: '20px', sm: '26px' },
          overflow: 'hidden',
          p: '2px', // Gradient animated border
          background: 'linear-gradient(135deg, #ff4500, #ff8c00, #ff007f, #7928ca, #ff4500)',
          backgroundSize: '350% 350%',
          animation: `${borderGlowRotate} 8s ease infinite`,
          boxShadow: isDark
            ? '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(249, 115, 22, 0.35)'
            : '0 20px 70px rgba(234, 88, 12, 0.3), 0 0 40px rgba(249, 115, 22, 0.22)',
          position: 'relative'
        }
      }}
    >
      <Box
        sx={{
          borderRadius: { xs: '18px', sm: '24px' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 28px)',
          background: isDark
            ? 'radial-gradient(ellipse at top, #1c120e 0%, #0d0907 60%, #050302 100%)'
            : 'radial-gradient(ellipse at top, #ffffff 0%, #fffaf6 50%, #fff2e8 100%)',
          position: 'relative',
          width: '100%',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Ambient Glowing Aura Spots in Background */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.28) 0%, rgba(239, 68, 68, 0.12) 50%, transparent 70%)',
            animation: `${floatingAura} 6s infinite ease-in-out`,
            pointerEvents: 'none',
            filter: 'blur(10px)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.22) 0%, rgba(249, 115, 22, 0.08) 50%, transparent 70%)',
            animation: `${floatingAura} 7s infinite ease-in-out reverse`,
            pointerEvents: 'none',
            filter: 'blur(10px)'
          }}
        />

        {/* Top 30-Second Auto-dismiss Progress Bar with Fluid Gradient */}
        <Box sx={{ width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 4.5,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ff8c00 0%, #ff007f 50%, #7928ca 100%)',
                transition: 'transform 0.9s linear'
              }
            }}
          />
        </Box>

        <DialogContent
          sx={{
            p: { xs: 2, sm: 2.8 },
            pt: { xs: 2.2, sm: 3 },
            overflowY: 'auto',
            maxHeight: '100%',
            '&::-webkit-scrollbar': {
              width: 5
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              borderRadius: 3
            }
          }}
        >
          {/* Top Bar: Equalizer Sound Wave + Auto Dismiss Circular Pill */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 1.2, sm: 1.6 } }}>
            {/* Left: Sound button + Animated Equalizer Bars */}
            <Tooltip title={isAudioMuted ? 'Click to Unmute Alarm' : 'Click to Mute Alarm'} arrow>
              <Paper
                elevation={0}
                onClick={toggleMute}
                sx={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.9,
                  px: { xs: 1.2, sm: 1.4 },
                  py: { xs: 0.45, sm: 0.55 },
                  borderRadius: '14px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(249, 115, 22, 0.08)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(249, 115, 22, 0.25)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px) scale(1.02)',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(249, 115, 22, 0.15)',
                    borderColor: '#f97316'
                  }
                }}
              >
                <IconButton size="small" sx={{ p: 0, color: isAudioMuted ? 'text.secondary' : '#f97316' }}>
                  {isAudioMuted ? <IconVolumeOff size={16} /> : <IconVolume size={16} />}
                </IconButton>

                {/* Animated Live Audio Equalizer Bars */}
                {!isAudioMuted && (
                  <Stack direction="row" alignItems="center" spacing={0.35} sx={{ height: 14 }}>
                    <Box sx={{ width: 2.5, bgcolor: '#f97316', borderRadius: 1, animation: `${eqBar1} 0.6s infinite ease-in-out` }} />
                    <Box sx={{ width: 2.5, bgcolor: '#ef4444', borderRadius: 1, animation: `${eqBar2} 0.5s infinite ease-in-out 0.1s` }} />
                    <Box sx={{ width: 2.5, bgcolor: '#f59e0b', borderRadius: 1, animation: `${eqBar3} 0.7s infinite ease-in-out 0.2s` }} />
                    <Box sx={{ width: 2.5, bgcolor: '#ec4899', borderRadius: 1, animation: `${eqBar1} 0.55s infinite ease-in-out 0.15s` }} />
                  </Stack>
                )}

                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.7rem', sm: '0.74rem' }, color: isAudioMuted ? 'text.secondary' : '#ea580c' }}>
                  {isAudioMuted ? 'Muted' : 'Alarm Ringing'}
                </Typography>
              </Paper>
            </Tooltip>

            {/* Right: 30s Auto-Dismiss Pill with Circular Progress */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
              sx={{
                px: { xs: 1.1, sm: 1.3 },
                py: { xs: 0.45, sm: 0.55 },
                borderRadius: '14px',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.12)'
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={progressPercent}
                  size={14}
                  thickness={6}
                  sx={{ color: '#ef4444' }}
                />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.72rem' }, color: '#dc2626' }}>
                Auto-close in {secondsRemaining}s
              </Typography>
            </Stack>
          </Stack>

          {/* Center Stage: Animated Sonar Radar Wave + Ringing Bell Icon */}
          <Stack alignItems="center" sx={{ my: { xs: 1, sm: 1.4 }, position: 'relative' }}>
            <Box
              sx={{
                position: 'relative',
                width: { xs: 76, sm: 84 },
                height: { xs: 76, sm: 84 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Outer Sonar Ripple 1 */}
              <Box
                sx={{
                  position: 'absolute',
                  width: { xs: 68, sm: 76 },
                  height: { xs: 68, sm: 76 },
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(249, 115, 22, 0.45) 0%, rgba(239, 68, 68, 0.2) 60%, transparent 100%)',
                  animation: `${rippleRing1} 2.4s infinite ease-out`
                }}
              />

              {/* Outer Sonar Ripple 2 (Delayed) */}
              <Box
                sx={{
                  position: 'absolute',
                  width: { xs: 68, sm: 76 },
                  height: { xs: 68, sm: 76 },
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(249, 115, 22, 0.15) 60%, transparent 100%)',
                  animation: `${rippleRing2} 2.4s infinite ease-out 0.8s`
                }}
              />

              {/* Central Luxury Glowing Alarm Bell Orb */}
              <Box
                sx={{
                  width: { xs: 68, sm: 76 },
                  height: { xs: 68, sm: 76 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ff7a18 0%, #ef4444 45%, #be123c 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(234, 88, 12, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -2px 6px rgba(0, 0, 0, 0.3)',
                  zIndex: 2,
                  position: 'relative'
                }}
              >
                <IconBellRinging
                  size={36}
                  style={{
                    animation: `${alarmBellRing} 1.6s infinite ease-in-out`,
                    filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35))'
                  }}
                />
              </Box>
            </Box>

            {/* Title with Gradient Typography */}
            <Typography
              variant="h3"
              sx={{
                mt: { xs: 1, sm: 1.2 },
                fontWeight: 900,
                fontSize: { xs: '1.25rem', sm: '1.45rem' },
                background: isDark
                  ? 'linear-gradient(135deg, #ffffff 0%, #fed7aa 60%, #fdba74 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              Upcoming Meeting Alarm
            </Typography>

            {/* Futuristic Digital HUD Live Countdown Block */}
            <Paper
              elevation={0}
              sx={{
                mt: { xs: 1, sm: 1.2 },
                px: { xs: 1.8, sm: 2.2 },
                py: { xs: 0.6, sm: 0.8 },
                borderRadius: '16px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(220, 38, 38, 0.28) 100%)'
                  : 'linear-gradient(135deg, #fff7ed 0%, #fee2e2 100%)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid',
                borderColor: isDark ? 'rgba(249, 115, 22, 0.55)' : 'rgba(249, 115, 22, 0.65)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                animation: `${pulseBadge} 2.2s infinite ease-in-out`
              }}
            >
              <IconFlame size={22} color="#ea580c" style={{ filter: 'drop-shadow(0 0 6px rgba(234, 88, 12, 0.85))' }} />

              <Stack direction="row" alignItems="center" spacing={0.6}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7, mr: 0.4, fontSize: { xs: '0.72rem', sm: '0.78rem' } }}>
                  Starts in:
                </Typography>

                {/* Digital Minute Pill */}
                <Box
                  sx={{
                    px: { xs: 1, sm: 1.2 },
                    py: 0.25,
                    borderRadius: '8px',
                    bgcolor: isDark ? '#27170e' : '#ffffff',
                    border: '1px solid rgba(249, 115, 22, 0.45)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'monospace, Consolas, sans-serif',
                      fontWeight: 900,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      color: '#ea580c',
                      lineHeight: 1.1,
                      letterSpacing: 0.5
                    }}
                  >
                    {countMStr}
                  </Typography>
                </Box>

                <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: '#ea580c' }}>:</Typography>

                {/* Digital Second Pill */}
                <Box
                  sx={{
                    px: { xs: 1, sm: 1.2 },
                    py: 0.25,
                    borderRadius: '8px',
                    bgcolor: isDark ? '#27170e' : '#ffffff',
                    border: '1px solid rgba(249, 115, 22, 0.45)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'monospace, Consolas, sans-serif',
                      fontWeight: 900,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      color: '#ef4444',
                      lineHeight: 1.1,
                      letterSpacing: 0.5
                    }}
                  >
                    {countSStr}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* Meeting Information High-Tech Frosted Card */}
          <Paper
            elevation={0}
            sx={{
              mt: { xs: 1.4, sm: 1.8 },
              p: { xs: 1.6, sm: 2 },
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(249, 115, 22, 0.22)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0,0,0,0.4)'
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 24px rgba(249, 115, 22, 0.08)'
            }}
          >
            <Stack spacing={1.2}>
              {/* Meeting Title & Role Chip with Live Pulse Dot */}
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.3, fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
                  {activeAlarm.meetingName || 'Scheduled Meeting'}
                </Typography>

                <Chip
                  icon={
                    isHost ? (
                      <IconCrown size={14} color="#ffffff" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }} />
                    ) : (
                      <IconUsers size={14} color="#ffffff" style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }} />
                    )
                  }
                  label={isHost ? 'Host / Organizer' : 'Participant'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.68rem', sm: '0.72rem' },
                    height: 24,
                    px: 0.6,
                    borderRadius: '10px',
                    background: isHost
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    color: '#ffffff',
                    boxShadow: isHost ? '0 3px 10px rgba(37, 99, 235, 0.35)' : '0 3px 10px rgba(16, 185, 129, 0.35)'
                  }}
                />
              </Stack>

              {/* Schedule No & Timing Badges */}
              <Stack direction="row" flexWrap="wrap" gap={0.9}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.1,
                    py: 0.4,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(59, 130, 246, 0.14)' : '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid rgba(59, 130, 246, 0.28)'
                  }}
                >
                  <IconFileDescription size={14} />
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.72rem', sm: '0.76rem' } }}>
                    {activeAlarm.scheduleNo}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.1,
                    py: 0.4,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(249, 115, 22, 0.14)' : '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid rgba(249, 115, 22, 0.28)'
                  }}
                >
                  <IconClock size={14} />
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.72rem', sm: '0.76rem' } }}>
                    {formatTo12h(activeAlarm.startTime)} {activeAlarm.endTime ? ` - ${formatTo12h(activeAlarm.endTime)}` : ''}
                  </Typography>
                </Box>

                {activeAlarm.hostName && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.1,
                      py: 0.4,
                      borderRadius: '10px',
                      bgcolor: isDark ? 'rgba(168, 85, 247, 0.14)' : '#faf5ff',
                      color: '#9333ea',
                      border: '1px solid rgba(168, 85, 247, 0.28)'
                    }}
                  >
                    <IconUser size={14} />
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: '0.72rem', sm: '0.76rem' } }}>
                      Host: {activeAlarm.hostName}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Subject / Agenda Text Block */}
              {(activeAlarm.subject || activeAlarm.meetingDescription) && (
                <Box
                  sx={{
                    mt: 0.3,
                    p: { xs: 1, sm: 1.2 },
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(249, 115, 22, 0.04)',
                    borderLeft: '3.5px solid #f97316',
                    border: '1px solid',
                    borderLeftWidth: 3.5,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(249, 115, 22, 0.15)'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? '#e2e8f0' : '#475569',
                      fontWeight: 500,
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                      fontSize: { xs: '0.8rem', sm: '0.85rem' }
                    }}
                  >
                    "{activeAlarm.subject || activeAlarm.meetingDescription}"
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Action Buttons: Close / Dismiss vs Luxury Shimmering Mark Attendance */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: { xs: 2, sm: 2.6 } }}
          >
            {/* Left Button: Close / Dismiss */}
            <Button
              variant="outlined"
              onClick={handleClose}
              startIcon={<IconX size={17} />}
              sx={{
                flex: 1,
                py: { xs: 1, sm: 1.2 },
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: { xs: '0.86rem', sm: '0.92rem' },
                color: isDark ? '#cbd5e1' : '#475569',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.18)',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)'
                }
              }}
            >
              Close / Dismiss
            </Button>

            {/* Right Button: Mark Attendance with Luxury Shimmer Streak Animation */}
            <Button
              variant="contained"
              onClick={() => handleMarkAttendance(navigate)}
              startIcon={<IconCheck size={19} />}
              endIcon={<IconArrowRight size={17} />}
              sx={{
                flex: 1.35,
                py: { xs: 1, sm: 1.2 },
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: { xs: '0.88rem', sm: '0.94rem' },
                letterSpacing: 0.3,
                background: 'linear-gradient(135deg, #ff7a18 0%, #ef4444 50%, #dc2626 100%)',
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '60%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: `${shimmerSweep} 2.6s infinite linear`
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%)',
                  boxShadow: '0 10px 28px rgba(234, 88, 12, 0.7)',
                  transform: 'translateY(-1px) scale(1.01)'
                }
              }}
            >
              Mark Attendance
            </Button>
          </Stack>
        </DialogContent>
      </Box>
    </Dialog>
  );
}

MeetingAlarmDialog.propTypes = {};
