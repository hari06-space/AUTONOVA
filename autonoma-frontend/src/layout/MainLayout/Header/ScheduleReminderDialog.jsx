import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  keyframes
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconCalendarEvent,
  IconClock,
  IconUser,
  IconBellRinging,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconBriefcase,
  IconSparkles,
  IconFlame,
  IconCalendarTime,
  IconX,
  IconFileText,
  IconNotes,
  IconHourglass,
  IconAlertCircle
} from '@tabler/icons-react';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

// Keyframe Animations
const ringBellAnimation = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(18deg) scale(1.1); }
  20% { transform: rotate(-16deg) scale(1.1); }
  30% { transform: rotate(14deg) scale(1.05); }
  40% { transform: rotate(-12deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(-6deg); }
  70% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
`;

const pulseLiveDotAnimation = keyframes`
  0% { transform: scale(0.85); opacity: 0.6; }
  50% { transform: scale(1.35); opacity: 1; }
  100% { transform: scale(0.85); opacity: 0.6; }
`;

const alarmShakeAnimation = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  2% { transform: rotate(14deg) scale(1.06); }
  4% { transform: rotate(-14deg) scale(1.06); }
  6% { transform: rotate(12deg) scale(1.05); }
  8% { transform: rotate(-12deg) scale(1.05); }
  10% { transform: rotate(10deg) scale(1.04); }
  12% { transform: rotate(-10deg) scale(1.04); }
  14% { transform: rotate(6deg) scale(1.02); }
  16% { transform: rotate(-6deg) scale(1.02); }
  18% { transform: rotate(2deg) scale(1); }
  20% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(0deg) scale(1); }
`;

const cardGlowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 6px 22px -4px rgba(59, 130, 246, 0.2), 0 0 16px rgba(59, 130, 246, 0.15), inset 0 0 0 1px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 10px 32px -2px rgba(37, 99, 235, 0.32), 0 0 26px rgba(59, 130, 246, 0.28), inset 0 0 0 1px rgba(59, 130, 246, 0.45);
    border-color: rgba(59, 130, 246, 0.6);
  }
`;

const cardGlowPulseDark = keyframes`
  0%, 100% {
    box-shadow: 0 8px 28px -4px rgba(56, 189, 248, 0.25), 0 0 18px rgba(59, 130, 246, 0.18), inset 0 0 0 1px rgba(56, 189, 248, 0.25);
    border-color: rgba(56, 189, 248, 0.4);
  }
  50% {
    box-shadow: 0 14px 38px -2px rgba(56, 189, 248, 0.45), 0 0 30px rgba(59, 130, 246, 0.35), inset 0 0 0 1px rgba(56, 189, 248, 0.55);
    border-color: rgba(56, 189, 248, 0.7);
  }
`;

const fadeInUpAnimation = keyframes`
  0% { opacity: 0; transform: translateY(16px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const cardSmoothDismissAnimation = keyframes`
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate3d(30px, 0, 0) scale(0.97);
  }
`;

const spaceSmoothCollapseAnimation = keyframes`
  0% {
    max-height: 320px;
    margin-bottom: 12px;
    opacity: 0;
  }
  100% {
    max-height: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
    opacity: 0;
  }
`;

const clockColonBlink = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
`;

const calculateTimeRemaining = (meetingDateStr, startTimeStr, endTimeStr) => {
  if (!meetingDateStr) return null;

  let year, month, day;
  const trimmedDate = String(meetingDateStr).trim();

  if (trimmedDate.includes('-')) {
    const parts = trimmedDate.split('-');
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    }
  } else if (trimmedDate.includes('/')) {
    const parts = trimmedDate.split('/');
    if (parts[2].length === 4) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    } else if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  }

  if (year === undefined || isNaN(year) || month === undefined || isNaN(month) || day === undefined || isNaN(day)) {
    const d = new Date(meetingDateStr);
    if (isNaN(d.getTime())) return null;
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
  }

  let startH = 9;
  let startM = 0;
  let startS = 0;
  if (startTimeStr && typeof startTimeStr === 'string') {
    const tParts = startTimeStr.trim().split(':');
    if (tParts.length >= 2) {
      startH = parseInt(tParts[0], 10) || 0;
      startM = parseInt(tParts[1], 10) || 0;
      startS = parseInt(tParts[2], 10) || 0;
    }
  }

  let endH = startH + 1;
  let endM = startM;
  let endS = startS;
  if (endTimeStr && typeof endTimeStr === 'string') {
    const eParts = endTimeStr.trim().split(':');
    if (eParts.length >= 2) {
      endH = parseInt(eParts[0], 10) || startH + 1;
      endM = parseInt(eParts[1], 10) || startM;
      endS = parseInt(eParts[2], 10) || startS;
    }
  }

  const now = new Date();
  const startDateTime = new Date(year, month, day, startH, startM, startS, 0);
  const endDateTime = new Date(year, month, day, endH, endM, endS, 0);

  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const targetMidnight = new Date(year, month, day, 0, 0, 0, 0);
  const calDaysDiff = Math.round((targetMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

  const diffMs = startDateTime.getTime() - now.getTime();
  const endDiffMs = endDateTime.getTime() - now.getTime();

  // If meeting is currently ongoing
  if (diffMs <= 0 && endDiffMs > 0) {
    const remSec = Math.floor(endDiffMs / 1000);
    const h = Math.floor(remSec / 3600);
    const m = Math.floor((remSec % 3600) / 60);
    const s = remSec % 60;
    return {
      status: 'live',
      days: 0,
      hours: h,
      minutes: m,
      seconds: s,
      text: 'Live Now'
    };
  }

  // If meeting already ended
  if (endDiffMs <= 0) {
    const overdueDays = Math.max(1, Math.abs(calDaysDiff));
    return {
      status: 'overdue',
      days: overdueDays,
      hours: 0,
      minutes: 0,
      seconds: 0,
      text: overdueDays === 1 ? 'Overdue (1 day ago)' : `Overdue (${overdueDays} days ago)`
    };
  }

  // Future meeting
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (calDaysDiff >= 2) {
    return {
      status: 'upcoming',
      days: calDaysDiff,
      displayDays: days,
      hours,
      minutes,
      seconds,
      text: `${calDaysDiff} Days More`
    };
  } else if (calDaysDiff === 1) {
    return {
      status: 'tomorrow',
      days: 1,
      displayDays: 0,
      hours: hours + days * 24,
      minutes,
      seconds,
      text: 'Tomorrow (1 Day More)'
    };
  } else {
    // Today
    return {
      status: 'today',
      days: 0,
      displayDays: 0,
      hours,
      minutes,
      seconds,
      text: "Today's Meeting!"
    };
  }
};

const formatDateNice = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).trim().split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    }
  } catch (e) { }
  return dateStr;
};

const formatTimeNice = (timeStr) => {
  if (!timeStr) return '';
  try {
    const parts = String(timeStr).trim().split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }
  } catch (e) { }
  return timeStr;
};

const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  try {
    const sParts = startTime.split(':');
    const eParts = endTime.split(':');
    const sMin = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
    const eMin = parseInt(eParts[0], 10) * 60 + parseInt(eParts[1], 10);
    const diff = eMin - sMin;
    if (diff > 0) {
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    }
  } catch (e) { }
  return null;
};

const formatMeetingTitle = (schedule) => {
  if (!schedule) return 'Meeting Schedule';
  const name = (schedule.meetingName || '').trim();
  const prefix = (schedule.meetingPrefix || '').trim();
  const subject = (schedule.subject || '').trim();

  // If both name and prefix exist and are distinct (e.g. "Management Review Meeting" and "MRM")
  if (name && prefix && name.toLowerCase() !== prefix.toLowerCase()) {
    return `${name} (${prefix})`;
  }

  // If only name exists or name equals prefix (e.g. "MRM")
  if (name) return name;
  if (prefix) return prefix;
  if (subject) return subject;
  return 'Meeting Schedule';
};

// Modern 3D Claymorphic Alarm Clock (Ultra-Clean 2026 Minimalist 3D Aesthetic with Real-Time Hands)
const AlarmClock3D = ({ size = 62, ringing = false }) => {
  const [timeAngles, setTimeAngles] = useState({ hour: 0, minute: 0, second: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      setTimeAngles({
        hour: h * 30,
        minute: m * 6,
        second: s * 6
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: 'drop-shadow(0 10px 20px rgba(245, 158, 11, 0.35))',
        animation: ringing
          ? `${alarmShakeAnimation} 1.2s infinite ease-in-out`
          : `${alarmShakeAnimation} 2.8s infinite ease-in-out`,
        transformOrigin: '50% 90%',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': { transform: 'scale(1.15) rotate(-5deg)' }
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Main 3D Matte Body Radial Gradient */}
          <radialGradient id="modernClockBody" cx="48" cy="42" r="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7D1" />
            <stop offset="25%" stopColor="#FFDE59" />
            <stop offset="65%" stopColor="#FFBA19" />
            <stop offset="90%" stopColor="#E69100" />
            <stop offset="100%" stopColor="#B36B00" />
          </radialGradient>

          {/* Chubby 3D Twin Bells */}
          <radialGradient id="modernLeftBell" cx="28" cy="22" r="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF8D6" />
            <stop offset="35%" stopColor="#FFDE59" />
            <stop offset="80%" stopColor="#E69100" />
            <stop offset="100%" stopColor="#995200" />
          </radialGradient>

          <radialGradient id="modernRightBell" cx="86" cy="22" r="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF8D6" />
            <stop offset="35%" stopColor="#FFDE59" />
            <stop offset="80%" stopColor="#E69100" />
            <stop offset="100%" stopColor="#995200" />
          </radialGradient>

          {/* Smooth Legs Gradient */}
          <linearGradient id="modernLegGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFBA19" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Clean Porcelain Dial Face */}
          <radialGradient id="modernDialFace" cx="60" cy="62" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="65%" stopColor="#FFFFFF" />
            <stop offset="92%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </radialGradient>

          {/* Ambient Floor Shadow */}
          <radialGradient id="modernFloorShadow" cx="60" cy="112" r="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.28)" />
            <stop offset="65%" stopColor="rgba(15, 23, 42, 0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* 1. Ambient Floor Shadow */}
        <ellipse cx="60" cy="112" rx="36" ry="6" fill="url(#modernFloorShadow)" />

        {/* 2. Chubby Stand Legs */}
        <rect x="25" y="88" width="11" height="22" rx="5.5" fill="url(#modernLegGrad)" transform="rotate(28 30.5 99)" />
        <rect x="84" y="88" width="11" height="22" rx="5.5" fill="url(#modernLegGrad)" transform="rotate(-28 89.5 99)" />

        {/* 3. Top Hammer / Ring Mount */}
        <rect x="55.5" y="15" width="9" height="13" rx="4.5" fill="url(#modernLegGrad)" />
        <ellipse cx="60" cy="14" rx="7" ry="4.5" fill="#FFF4B8" />

        {/* 4. Left Bell (3D Chubby Curved Dome) */}
        <g transform="rotate(-24 32 30)">
          <ellipse cx="32" cy="30" rx="16" ry="13" fill="url(#modernLeftBell)" />
          {/* Specular Highlight Arc */}
          <path d="M 23 23 C 27 18, 37 18, 41 23" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* 5. Right Bell (3D Chubby Curved Dome) */}
        <g transform="rotate(24 88 30)">
          <ellipse cx="88" cy="30" rx="16" ry="13" fill="url(#modernRightBell)" />
          {/* Specular Highlight Arc */}
          <path d="M 79 23 C 83 18, 93 18, 97 23" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* 6. Main Clock Volumetric 3D Round Body */}
        <circle cx="60" cy="64" r="39" fill="url(#modernClockBody)" />
        {/* Soft Bevel Rim Highlights */}
        <circle cx="60" cy="64" r="37.5" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" fill="none" />
        <path d="M 31 43 A 37.5 37.5 0 0 1 89 43" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* 7. Inner Sunken Dial Ring */}
        <circle cx="60" cy="64" r="31" fill="#E69100" />
        {/* Porcelain Dial Face */}
        <circle cx="60" cy="64" r="29" fill="url(#modernDialFace)" />

        {/* 8. Sleek Modern Hour Marks (Minimalist Notch Pills & Dots) */}
        <rect x="58.5" y="39" width="3" height="6" rx="1.5" fill="#0F172A" />
        <circle cx="77.5" cy="46.5" r="1.8" fill="#64748B" />
        <rect x="83" y="62.5" width="6" height="3" rx="1.5" fill="#0F172A" />
        <circle cx="77.5" cy="81.5" r="1.8" fill="#64748B" />
        <rect x="58.5" y="83" width="3" height="6" rx="1.5" fill="#0F172A" />
        <circle cx="42.5" cy="81.5" r="1.8" fill="#64748B" />
        <rect x="31" y="62.5" width="6" height="3" rx="1.5" fill="#0F172A" />
        <circle cx="42.5" cy="46.5" r="1.8" fill="#64748B" />

        {/* 9. Modern Chubby Clock Hands with Real-Time Rotation */}
        {/* Hour Hand: Obsidian Dark Navy Pill */}
        <g transform={`rotate(${timeAngles.hour} 60 64)`}>
          <line x1="60" y1="64" x2="60" y2="48" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" />
        </g>

        {/* Minute Hand: Hot Coral Pink Pill */}
        <g transform={`rotate(${timeAngles.minute} 60 64)`}>
          <line x1="60" y1="64" x2="60" y2="41" stroke="#FF3B5C" strokeWidth="3.8" strokeLinecap="round" />
        </g>

        {/* Live Rotating Smooth Second Hand */}
        <g transform={`rotate(${timeAngles.second} 60 64)`}>
          <line x1="60" y1="72" x2="60" y2="39" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="60" cy="39" r="2.5" fill="#EF4444" />
        </g>

        {/* 10. Center Cap Sphere */}
        <circle cx="60" cy="64" r="4.5" fill="#FF3B5C" />
        <circle cx="58.6" cy="62.6" r="1.6" fill="#FFFFFF" />
      </svg>
    </Box>
  );
};

const ClockDigitTile = ({ value, label, isDark, colorTheme }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: { xs: 36, sm: 46 },
      px: { xs: 0.6, sm: 0.8 },
      py: { xs: 0.35, sm: 0.5 },
      borderRadius: '8px',
      background: isDark
        ? 'linear-gradient(180deg, #090d16 0%, #1e293b 100%)'
        : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      border: `1px solid ${colorTheme.tileBorder}`,
      boxShadow: isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 8px rgba(0,0,0,0.45)'
        : 'inset 0 1px 0 #ffffff, 0 2px 6px rgba(15,23,42,0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    {/* Split-line center groove */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '1px',
        background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)',
        zIndex: 1
      }}
    />
    <Typography
      sx={{
        fontFamily: '"JetBrains Mono", "SF Mono", Consolas, "Roboto Mono", monospace',
        fontWeight: 900,
        fontSize: { xs: '0.92rem', sm: '1.05rem' },
        lineHeight: 1.1,
        color: colorTheme.digitColor,
        letterSpacing: '0.02em',
        zIndex: 2,
        textShadow: colorTheme.glow ? `0 0 10px ${colorTheme.glow}` : 'none'
      }}
    >
      {String(value).padStart(2, '0')}
    </Typography>
    <Typography
      sx={{
        fontSize: { xs: '0.5rem', sm: '0.56rem' },
        fontWeight: 800,
        color: colorTheme.labelColor,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        lineHeight: 1,
        mt: 0.3,
        zIndex: 2
      }}
    >
      {label}
    </Typography>
  </Box>
);

const ClockSeparator = ({ color, isDark }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4px',
      px: 0.2,
      animation: `${clockColonBlink} 1s infinite ease-in-out`
    }}
  >
    <Box sx={{ width: 3.5, height: 3.5, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
    <Box sx={{ width: 3.5, height: 3.5, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
  </Box>
);

// Modern Alarm Clock Countdown Banner Widget
const ScheduleAlarmClockBanner = ({ meetingDate, startTime, endTime, isDark }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(meetingDate, startTime, endTime));

  useEffect(() => {
    setTimeLeft(calculateTimeRemaining(meetingDate, startTime, endTime));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(meetingDate, startTime, endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingDate, startTime, endTime]);

  if (!timeLeft) return null;

  const { status, days, displayDays, hours, minutes, seconds, text } = timeLeft;

  // Theme styling based on urgency
  let theme = {
    bg: isDark
      ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
    border: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.22)',
    boxShadow: isDark
      ? '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 4px 16px rgba(2, 132, 199, 0.08), inset 0 1px 0 #ffffff',
    titleColor: isDark ? '#38bdf8' : '#0284c7',
    badgeBg: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
    badgeColor: isDark ? '#38bdf8' : '#0284c7',
    subColor: isDark ? '#94a3b8' : '#64748b',
    tileBorder: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.2)',
    digitColor: isDark ? '#38bdf8' : '#0284c7',
    labelColor: isDark ? '#94a3b8' : '#64748b',
    glow: isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.18)',
    ringing: false,
    badgeText: 'SCHEDULED REMINDER'
  };

  if (status === 'overdue') {
    theme = {
      ...theme,
      bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
      border: isDark ? 'rgba(239, 68, 68, 0.45)' : 'rgba(220, 38, 38, 0.25)',
      titleColor: isDark ? '#f87171' : '#dc2626',
      badgeBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
      badgeColor: isDark ? '#f87171' : '#dc2626',
      tileBorder: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(220, 38, 38, 0.2)',
      digitColor: isDark ? '#f87171' : '#dc2626',
      badgeText: 'OVERDUE'
    };
  } else if (status === 'live') {
    theme = {
      ...theme,
      bg: isDark ? 'rgba(6, 78, 59, 0.35)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: isDark ? 'rgba(52, 211, 153, 0.5)' : 'rgba(5, 150, 105, 0.35)',
      titleColor: isDark ? '#34d399' : '#059669',
      badgeBg: isDark ? 'rgba(52, 211, 153, 0.25)' : '#d1fae5',
      badgeColor: isDark ? '#34d399' : '#059669',
      tileBorder: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(5, 150, 105, 0.25)',
      digitColor: isDark ? '#34d399' : '#059669',
      ringing: true,
      badgeText: 'LIVE IN PROGRESS'
    };
  } else if (status === 'today') {
    theme = {
      ...theme,
      bg: isDark ? 'rgba(136, 19, 55, 0.35)' : 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      border: isDark ? 'rgba(251, 113, 133, 0.5)' : 'rgba(225, 29, 72, 0.35)',
      titleColor: isDark ? '#fb7185' : '#e11d48',
      badgeBg: isDark ? 'rgba(251, 113, 133, 0.25)' : '#ffe4e6',
      badgeColor: isDark ? '#fb7185' : '#e11d48',
      tileBorder: isDark ? 'rgba(251, 113, 133, 0.4)' : 'rgba(225, 29, 72, 0.25)',
      digitColor: isDark ? '#fb7185' : '#e11d48',
      ringing: true,
      badgeText: "TODAY'S MEETING"
    };
  } else if (status === 'tomorrow') {
    theme = {
      ...theme,
      bg: isDark ? 'rgba(120, 53, 15, 0.35)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.35)',
      titleColor: isDark ? '#fbbf24' : '#d97706',
      badgeBg: isDark ? 'rgba(245, 158, 11, 0.22)' : '#fef3c7',
      badgeColor: isDark ? '#fbbf24' : '#d97706',
      tileBorder: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.25)',
      digitColor: isDark ? '#fbbf24' : '#d97706',
      ringing: false,
      badgeText: 'TOMORROW'
    };
  }

  const formattedDate = formatDateNice(meetingDate);
  const formattedTime = formatTimeNice(startTime);

  return (
    <Box
      sx={{
        p: { xs: 1.4, sm: 1.8 },
        borderRadius: 2.6,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.boxShadow,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.8,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Ambient background glow orb */}
      <Box
        sx={{
          position: 'absolute',
          left: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(20px)'
        }}
      />

      {/* Left: Modern 3D Yellow Claymorphic Alarm Clock + Rich Typography */}
      <Stack direction="row" alignItems="center" spacing={1.8} sx={{ position: 'relative', zIndex: 2 }}>
        <AlarmClock3D size={60} ringing={theme.ringing} />
        <Box>
          <Chip
            size="small"
            label={theme.badgeText}
            sx={{
              height: 20,
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: 0.6,
              bgcolor: theme.badgeBg,
              color: theme.badgeColor,
              borderRadius: '6px',
              px: 0.2,
              mb: 0.4
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: theme.titleColor,
              fontSize: { xs: '1.02rem', sm: '1.18rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.01em'
            }}
          >
            {text}
          </Typography>
          {formattedDate && (
            <Typography
              variant="caption"
              sx={{
                color: theme.subColor,
                fontWeight: 600,
                fontSize: '0.76rem',
                display: 'block',
                mt: 0.3
              }}
            >
              Starts {formattedDate} {formattedTime ? `at ${formattedTime}` : ''}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Right: Modern Segmented LED Clock Countdown Tiles */}
      {status !== 'overdue' && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.4}
          sx={{
            position: 'relative',
            zIndex: 2,
            alignSelf: { xs: 'flex-end', sm: 'center' },
            bgcolor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.6)',
            p: 0.6,
            borderRadius: '10px',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)'
          }}
        >
          {days > 0 && (
            <>
              <ClockDigitTile value={displayDays !== undefined ? displayDays : days} label="DAYS" isDark={isDark} colorTheme={theme} />
              <ClockSeparator color={theme.digitColor} isDark={isDark} />
            </>
          )}
          <ClockDigitTile value={hours} label="HRS" isDark={isDark} colorTheme={theme} />
          <ClockSeparator color={theme.digitColor} isDark={isDark} />
          <ClockDigitTile value={minutes} label="MIN" isDark={isDark} colorTheme={theme} />
          <ClockSeparator color={theme.digitColor} isDark={isDark} />
          <ClockDigitTile value={seconds} label="SEC" isDark={isDark} colorTheme={theme} />
        </Stack>
      )}
    </Box>
  );
};

const ScheduleReminderDialog = () => {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const { isLoggedIn } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [exitingKeys, setExitingKeys] = useState(new Set());
  const [collapsingKeys, setCollapsingKeys] = useState(new Set());
  const [loadingAll, setLoadingAll] = useState(false);
  const [open, setOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const acknowledgedIdsRef = useRef(new Set());

  const fetchReminders = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const response = await axios.get('/api/qms/meeting-schedules/pending-reminders');
      if (Array.isArray(response.data)) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const meetingData = response.data
          .filter((item) => !item.meetingDate || item.meetingDate >= todayStr)
          .map((m) => ({ ...m, categoryType: 'MEETING' }));

        const unacknowledged = meetingData.filter(
          (item) => !acknowledgedIdsRef.current.has(`${item.categoryType}_${item.scheduleId}`)
        );

        if (unacknowledged.length > 0) {
          setReminders(unacknowledged);
          setOpen(true);
        } else if (exitingKeys.size === 0 && collapsingKeys.size === 0) {
          setReminders([]);
          setOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch meeting reminders:', err);
    }
  }, [isLoggedIn, exitingKeys.size, collapsingKeys.size]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchReminders();
    }
  }, [isLoggedIn, fetchReminders]);

  useRealtimeRefresh(fetchReminders, 'QmsMeetingSchedule');

  // Group pending reminders by Meeting / Audit Type
  const groupedReminders = useMemo(() => {
    if (!Array.isArray(reminders) || reminders.length === 0) return [];
    const groups = {};
    reminders.forEach((r) => {
      const key = `${r.categoryType}_${r.meetingTypeId || r.meetingName || 'GENERAL'}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          categoryType: r.categoryType,
          meetingTypeId: r.meetingTypeId,
          meetingName: r.meetingName,
          meetingPrefix: r.meetingPrefix,
          meetingDescription: r.meetingDescription,
          meetingAgenda: r.meetingAgenda,
          reminderDays: r.reminderDays,
          schedules: []
        };
      }
      groups[key].schedules.push(r);
    });
    return Object.values(groups);
  }, [reminders]);

  const handleGroupChange = (newIndex) => {
    setAnimationKey((prev) => prev + 1);
    setCurrentGroupIndex(newIndex);
  };

  const handleAcknowledgeSingle = async (scheduleItem) => {
    const { scheduleId, categoryType } = scheduleItem;
    const itemKey = `${categoryType}_${scheduleId}`;

    acknowledgedIdsRef.current.add(itemKey);

    // STAGE 1: Smooth 220ms slide + fade exit
    setExitingKeys((prev) => new Set([...prev, itemKey]));

    const endpoint =
      categoryType === 'AUDIT'
        ? `/api/qms/audit-schedules/${scheduleId}/acknowledge-reminder`
        : `/api/qms/meeting-schedules/${scheduleId}/acknowledge-reminder`;

    const apiPromise = axios.post(endpoint).catch((err) => console.error('Ack API error:', err));

    await new Promise((r) => setTimeout(r, 220));

    // STAGE 2: Smooth height collapse (200ms)
    setCollapsingKeys((prev) => new Set([...prev, itemKey]));
    await new Promise((r) => setTimeout(r, 200));

    await apiPromise;

    const updated = reminders.filter(
      (r) => !(r.scheduleId === scheduleId && r.categoryType === categoryType)
    );
    setReminders(updated);
    setExitingKeys((prev) => {
      const next = new Set(prev);
      next.delete(itemKey);
      return next;
    });
    setCollapsingKeys((prev) => {
      const next = new Set(prev);
      next.delete(itemKey);
      return next;
    });
    acknowledgedIdsRef.current.delete(itemKey);

    if (updated.length === 0) {
      setOpen(false);
    }
  };

  const handleAcknowledgeAllInGroup = async (groupSchedules) => {
    if (!groupSchedules || groupSchedules.length === 0) return;
    setLoadingAll(true);
    try {
      const allItemKeys = groupSchedules.map((s) => `${s.categoryType}_${s.scheduleId}`);
      allItemKeys.forEach((k) => acknowledgedIdsRef.current.add(k));

      const apiPromise = Promise.all(
        groupSchedules.map((s) => {
          const endpoint = `/api/qms/meeting-schedules/${s.scheduleId}/acknowledge-reminder`;
          return axios.post(endpoint);
        })
      );

      // Smooth exit
      setExitingKeys(new Set(allItemKeys));
      await new Promise((r) => setTimeout(r, 240));

      setCollapsingKeys(new Set(allItemKeys));
      await new Promise((r) => setTimeout(r, 200));

      await apiPromise;

      const ackKeysSet = new Set(allItemKeys);
      const updated = reminders.filter((r) => !ackKeysSet.has(`${r.categoryType}_${r.scheduleId}`));
      setReminders(updated);
      setExitingKeys(new Set());
      setCollapsingKeys(new Set());
      allItemKeys.forEach((k) => acknowledgedIdsRef.current.delete(k));

      if (updated.length === 0) {
        setOpen(false);
      } else if (currentGroupIndex >= groupedReminders.length - 1) {
        setCurrentGroupIndex(0);
        setAnimationKey((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to acknowledge all reminders in group:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  if (!open || groupedReminders.length === 0) return null;

  const currentGroup = groupedReminders[currentGroupIndex] || groupedReminders[0];
  if (!currentGroup) return null;

  // Premium Unified Color Tokens with Ultra-Smooth Borders
  const themeColors = {
    dialogBg: isDark ? '#0f172a' : '#ffffff',
    dialogBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
    dialogShadow: isDark
      ? '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)'
      : '0 30px 70px -15px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.05)',
    headerBg: isDark
      ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e293b 100%)'
      : 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
    contentBg: isDark ? '#090d16' : '#f8fafc',
    heroCardBg: isDark
      ? 'rgba(30, 41, 59, 0.5)'
      : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    heroCardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
    cardBg: isDark
      ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
    cardBorder: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(59, 130, 246, 0.28)',
    cardHoverBorder: isDark ? '#38bdf8' : '#2563eb',
    cardShadow: isDark
      ? '0 8px 28px -4px rgba(56, 189, 248, 0.25), 0 0 16px rgba(59, 130, 246, 0.18)'
      : '0 8px 26px -4px rgba(59, 130, 246, 0.2), 0 0 16px rgba(59, 130, 246, 0.14)',
    cardHoverShadow: isDark
      ? '0 14px 40px -2px rgba(56, 189, 248, 0.45), 0 0 32px rgba(59, 130, 246, 0.35)'
      : '0 14px 36px -4px rgba(37, 99, 235, 0.32), 0 0 26px rgba(59, 130, 246, 0.25)',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    dateBadgeBg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    dateBadgeColor: isDark ? '#93c5fd' : '#2563eb',
    dateBadgeBorder: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.15)',
    timeBadgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
    timeBadgeColor: isDark ? '#6ee7b7' : '#16a34a',
    timeBadgeBorder: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(22, 163, 74, 0.15)',
    hostBadgeBg: isDark ? 'rgba(241, 245, 249, 0.06)' : '#f8fafc',
    hostBadgeBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    footerBg: isDark ? '#0f172a' : '#ffffff',
    footerBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'AUDITOR':
        return {
          bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#ffffff',
          dot: '#ddd6fe',
          label: 'Auditor'
        };
      case 'AUDITEE':
        return {
          bg: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          color: '#ffffff',
          dot: '#a5f3fc',
          label: 'Auditee'
        };
      case 'HOST':
        return {
          bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#ffffff',
          dot: '#a7f3d0',
          label: 'Host'
        };
      case 'CHAIRED':
        return {
          bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          dot: '#bfdbfe',
          label: 'Chaired'
        };
      default:
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
          color: isDark ? '#e2e8f0' : '#334155',
          dot: isDark ? '#94a3b8' : '#64748b',
          label: 'Participant'
        };
    }
  };

  const totalPendingCount = reminders.length;

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
          maxHeight: '90vh',
          boxShadow: themeColors.dialogShadow,
          background: themeColors.dialogBg,
          border: `1px solid ${themeColors.dialogBorder}`,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }}
    >
      {/* Modern Executive Header */}
      <DialogTitle
        sx={{
          p: { xs: 2.2, sm: 2.8 },
          background: themeColors.headerBg,
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Subtle decorative glow overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: 40,
            width: 220,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)'
          }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.8}>
            {/* Animated Glowing Bell */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${ringBellAnimation} 3.5s infinite ease-in-out`,
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.5)',
                flexShrink: 0
              }}
            >
              <IconBellRinging size={24} />
            </Box>

            <Box>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#ffffff', fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  Meeting Reminders
                </Typography>
                <Chip
                  icon={<IconFlame size={13} color="#fbbf24" />}
                  label={`${totalPendingCount} Pending`}
                  size="small"
                  sx={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    height: 24,
                    px: 0.4
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </Stack>

        {/* Modern Segmented Category Pills */}
        {groupedReminders.length > 1 && (
          <Box
            sx={{
              mt: 2,
              pt: 1.6,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
              pb: 0.2,
              '&::-webkit-scrollbar': { height: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 2 }
            }}
          >
            {groupedReminders.map((grp, idx) => {
              const isActive = idx === currentGroupIndex;
              return (
                <Button
                  key={grp.key}
                  onClick={() => handleGroupChange(idx)}
                  size="small"
                  sx={{
                    borderRadius: '10px',
                    px: 2,
                    py: 0.5,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isActive
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    border: isActive
                      ? '1px solid rgba(255, 255, 255, 0.35)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.4)' : 'none',
                    '&:hover': {
                      background: isActive
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : 'rgba(255, 255, 255, 0.16)',
                      color: '#ffffff'
                    }
                  }}
                >
                  {grp.meetingName && grp.meetingPrefix && grp.meetingName.toLowerCase() !== grp.meetingPrefix.toLowerCase()
                    ? `${grp.meetingName} (${grp.meetingPrefix})`
                    : grp.meetingName || grp.meetingPrefix || 'Meeting'} ({grp.schedules.length})
                </Button>
              );
            })}
          </Box>
        )}
      </DialogTitle>

      {/* Main Content Feed */}
      <DialogContent
        sx={{
          pt: { xs: 3, sm: 3.6 },
          pb: { xs: 2.4, sm: 3 },
          px: { xs: 2.2, sm: 2.8 },
          bgcolor: themeColors.contentBg,
          overflow: 'hidden'
        }}
      >
        {/* Scrollable Schedules Feed */}
        <Box
          sx={{
            maxHeight: '360px',
            overflowY: 'auto',
            overflowX: 'hidden',
            pt: 0.8,
            pb: 0.8,
            pr: 0.5,
            position: 'relative',
            '&::-webkit-scrollbar': { width: 5 },
            '&::-webkit-scrollbar-track': { bg: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1', borderRadius: 3 }
          }}
        >
          <Stack spacing={2} key={`feed-${animationKey}`}>
            {currentGroup.schedules.map((schedule, idx) => {
              const roleBadge = getRoleBadge(schedule.userRole);
              const scheduleItemKey = `${schedule.categoryType}_${schedule.scheduleId}`;
              const isExiting = exitingKeys.has(scheduleItemKey);
              const isCollapsing = collapsingKeys.has(scheduleItemKey);

              return (
                <Paper
                  key={scheduleItemKey}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.4 },
                    borderRadius: 3,
                    background: themeColors.cardBg,
                    border: `1.5px solid ${themeColors.cardBorder}`,
                    boxShadow: themeColors.cardShadow,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: isExiting
                      ? `${cardSmoothDismissAnimation} 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                      : isCollapsing
                        ? `${spaceSmoothCollapseAnimation} 0.2s ease-out forwards`
                        : isDark
                          ? `${cardGlowPulseDark} 3.5s infinite ease-in-out, ${fadeInUpAnimation} 0.3s ease-out forwards`
                          : `${cardGlowPulse} 3.5s infinite ease-in-out, ${fadeInUpAnimation} 0.3s ease-out forwards`,
                    animationDelay: isExiting || isCollapsing ? '0s' : `${idx * 0.04}s`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: themeColors.cardHoverBorder,
                      boxShadow: themeColors.cardHoverShadow,
                      transform: isExiting || isCollapsing ? 'none' : 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Subtle ambient glowing corner flare */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      background: isDark
                        ? 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                      pointerEvents: 'none',
                      filter: 'blur(22px)'
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ mb: 1.2 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            color: themeColors.textPrimary,
                            fontSize: { xs: '1.05rem', sm: '1.2rem' },
                            letterSpacing: '-0.01em',
                            lineHeight: 1.25
                          }}
                        >
                          {formatMeetingTitle(schedule)}
                        </Typography>

                        <Chip
                          icon={
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: roleBadge.dot,
                                ml: 0.8,
                                animation: `${pulseLiveDotAnimation} 1.8s infinite ease-in-out`
                              }}
                            />
                          }
                          label={roleBadge.label}
                          size="small"
                          sx={{
                            background: roleBadge.bg,
                            color: roleBadge.color,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            height: 22,
                            px: 0.4,
                            flexShrink: 0
                          }}
                        />
                      </Stack>

                      {/* Single Action Button on Card - Show only if more than 1 schedule in group */}
                      {currentGroup.schedules.length > 1 && (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={isExiting || isCollapsing || loadingAll}
                          onClick={() => handleAcknowledgeSingle(schedule)}
                          startIcon={<IconCheck size={16} />}
                          sx={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            borderRadius: 2,
                            fontWeight: 800,
                            px: 2.2,
                            py: 0.65,
                            fontSize: '0.8rem',
                            textTransform: 'none',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)',
                              transform: 'translateY(-1px)'
                            }
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </Stack>

                    {/* Subject if present and different from meetingName and meetingPrefix */}
                    {schedule.subject &&
                      schedule.subject.trim().toLowerCase() !== (schedule.meetingName || '').trim().toLowerCase() &&
                      schedule.subject.trim().toLowerCase() !== (schedule.meetingPrefix || '').trim().toLowerCase() && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: themeColors.textSecondary,
                            fontSize: '0.86rem',
                            mb: 1.2
                          }}
                        >
                          {schedule.subject}
                        </Typography>
                      )}

                    {/* 3D Yellow Alarm Clock & Live Segmented Countdown Banner */}
                    <ScheduleAlarmClockBanner
                      meetingDate={schedule.meetingDate}
                      startTime={schedule.startTime}
                      endTime={schedule.endTime}
                      isDark={isDark}
                    />

                    {/* Metadata Badges (Schedule No, Date, Time, Duration, Host) */}
                    <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mt: 1.4 }}>
                      {/* Schedule Number Pill (MRM No moved here) */}
                      {schedule.scheduleNo && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.1,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                            color: isDark ? '#a5b4fc' : '#4f46e5',
                            border: isDark ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid #c7d2fe'
                          }}
                        >
                          <IconFileText size={14} />
                          <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {schedule.scheduleNo}
                          </Typography>
                        </Box>
                      )}

                      {/* Date Pill */}
                      {schedule.meetingDate && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.1,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: themeColors.dateBadgeBg,
                            color: themeColors.dateBadgeColor,
                            border: `1px solid ${themeColors.dateBadgeBorder}`
                          }}
                        >
                          <IconCalendarEvent size={14} />
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {formatDateNice(schedule.meetingDate)}
                          </Typography>
                        </Box>
                      )}

                      {/* Time Pill */}
                      {schedule.startTime && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.1,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: themeColors.timeBadgeBg,
                            color: themeColors.timeBadgeColor,
                            border: `1px solid ${themeColors.timeBadgeBorder}`
                          }}
                        >
                          <Box sx={{ display: 'inline-flex', animation: `${alarmShakeAnimation} 2.8s infinite ease-in-out` }}>
                            <IconClock size={14} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {formatTimeNice(schedule.startTime)} {schedule.endTime ? `- ${formatTimeNice(schedule.endTime)}` : ''}
                          </Typography>
                        </Box>
                      )}

                      {/* Duration Pill */}
                      {schedule.startTime && schedule.endTime && formatDuration(schedule.startTime, schedule.endTime) && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.1,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff',
                            color: isDark ? '#c084fc' : '#9333ea',
                            border: isDark ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid #e9d5ff'
                          }}
                        >
                          <IconCalendarTime size={14} />
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {formatDuration(schedule.startTime, schedule.endTime)}
                          </Typography>
                        </Box>
                      )}

                      {/* Host Pill */}
                      {schedule.hostName && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.1,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: themeColors.hostBadgeBg,
                            border: `1px solid ${themeColors.hostBadgeBorder}`
                          }}
                        >
                          <IconUser size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                          <Typography variant="caption" sx={{ color: themeColors.textMuted, fontSize: '0.78rem' }}>
                            {schedule.categoryType === 'AUDIT' ? 'Auditor: ' : 'Host: '}
                            <strong style={{ color: themeColors.textPrimary, fontWeight: 700 }}>
                              {schedule.hostName}
                            </strong>
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      </DialogContent>

      {/* Sleek Action Footer */}
      <DialogActions
        sx={{
          py: 1.8,
          px: { xs: 2, sm: 2.8 },
          bgcolor: themeColors.footerBg,
          borderTop: `1px solid ${themeColors.footerBorder}`,
          justifyContent: groupedReminders.length > 1 ? 'space-between' : 'flex-end',
          alignItems: 'center'
        }}
      >
        {/* Pagination Navigation */}
        <Box>
          {groupedReminders.length > 1 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                disabled={currentGroupIndex === 0}
                onClick={() => handleGroupChange(currentGroupIndex - 1)}
                startIcon={<IconChevronLeft size={16} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  color: themeColors.textSecondary,
                  px: 1.4,
                  py: 0.5,
                  border: `1px solid ${themeColors.footerBorder}`,
                  '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }
                }}
              >
                Prev
              </Button>
              <Chip
                label={`${currentGroupIndex + 1} / ${groupedReminders.length}`}
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                  color: themeColors.textPrimary,
                  fontWeight: 800,
                  px: 0.4,
                  height: 26,
                  fontSize: '0.75rem'
                }}
              />
              <Button
                size="small"
                disabled={currentGroupIndex >= groupedReminders.length - 1}
                onClick={() => handleGroupChange(currentGroupIndex + 1)}
                endIcon={<IconChevronRight size={16} />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  color: themeColors.textSecondary,
                  px: 1.4,
                  py: 0.5,
                  border: `1px solid ${themeColors.footerBorder}`,
                  '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }
                }}
              >
                Next
              </Button>
            </Stack>
          )}
        </Box>

        {/* Primary Action Button:
            - If only 1 schedule in group: Show green "Acknowledge" button in footer
            - If more than 1 schedule in group: Show blue "Acknowledge All (N)" button in footer
        */}
        {currentGroup.schedules.length === 1 && currentGroup.schedules[0] ? (
          <Button
            variant="contained"
            disabled={
              exitingKeys.has(`${currentGroup.schedules[0].categoryType}_${currentGroup.schedules[0].scheduleId}`) ||
              collapsingKeys.has(`${currentGroup.schedules[0].categoryType}_${currentGroup.schedules[0].scheduleId}`) ||
              loadingAll
            }
            onClick={() => handleAcknowledgeSingle(currentGroup.schedules[0])}
            startIcon={<IconCheck size={18} />}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderRadius: 2.2,
              px: 3.2,
              py: 0.9,
              fontWeight: 800,
              fontSize: '0.86rem',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Acknowledge
          </Button>
        ) : currentGroup.schedules.length > 1 ? (
          <Button
            variant="contained"
            disabled={loadingAll}
            startIcon={
              loadingAll ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <IconCheck size={18} />
              )
            }
            onClick={() => handleAcknowledgeAllInGroup(currentGroup.schedules)}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              borderRadius: 2.2,
              px: 3.2,
              py: 1,
              fontWeight: 800,
              fontSize: '0.86rem',
              textTransform: 'none',
              boxShadow: '0 6px 20px -2px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                boxShadow: '0 10px 25px -2px rgba(37, 99, 235, 0.6)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {loadingAll ? 'Acknowledging...' : `Acknowledge All (${currentGroup.schedules.length})`}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleReminderDialog;

