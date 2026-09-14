/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  Avatar,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { setFilterConfig, resetFilters, setFilters } from 'store/slices/search';
import { styled, alpha, keyframes } from '@mui/system';
import ReactApexChart from 'react-apexcharts';
import axios from 'utils/axios';

/**
 * Calculates Delay Hours for a task based on its history of status changes.
 * 
 * Rules:
 * 1. Starts when current date/time exceeds Target Date.
 * 2. Stops when status goes to "To Be Tested".
 * 3. Starts again if reopened, from the Reopen Date/Time.
 * 4. Stops again when status goes back to "To Be Tested".
 * 5. Cycles accumulate.
 * 6. Sundays and Holidays are excluded from the delay hours calculation.
 * 
 * NOTE: This function requires an audit history array of the task.
 * Currently, it serves as the planned logic since the backend API does not return history.
 */
// eslint-disable-next-line no-unused-vars
export const calculateDelayHours = (targetDateStr, statusHistory, holidays = []) => {
  if (!targetDateStr || !statusHistory || statusHistory.length === 0) return 0;

  let totalDelayMs = 0;
  const targetDate = new Date(targetDateStr);
  const now = new Date();

  if (now <= targetDate) return 0; // No delay yet

  // Sort history chronologically
  const history = [...statusHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

  let currentDelayStart = targetDate;
  let isDelaying = true; // Initially delaying if past target date

  for (const log of history) {
    const logDate = new Date(log.date);
    if (logDate < targetDate) continue; // Ignore logs before target date

    const status = String(log.status).toLowerCase();

    if (['to be tested', 'to be verified', 'completed', 'closed'].includes(status)) {
      if (isDelaying) {
        // Stop delay clock
        totalDelayMs += calculateWorkingMs(currentDelayStart, logDate, holidays);
        isDelaying = false;
      }
    } else if (['open', 'in progress', 'reopened', 're-opened', 'rework'].includes(status)) {
      if (!isDelaying) {
        // Start delay clock again
        currentDelayStart = logDate;
        isDelaying = true;
      }
    }
  }

  // If currently still delaying (e.g. not moved to To Be Tested again)
  if (isDelaying) {
    totalDelayMs += calculateWorkingMs(currentDelayStart, now, holidays);
  }

  // Convert to hours
  return Math.round(totalDelayMs / (1000 * 60 * 60));
};

/** Helper to calculate ms between two dates excluding Sundays and Holidays */
const calculateWorkingMs = (start, end, holidays = []) => {
  if (start >= end) return 0;

  const holidaySet = new Set(holidays.map((h) => h.dateStr));
  let totalMs = 0;
  let current = new Date(start);

  while (current < end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isSunday = current.getDay() === 0;
    const isHoliday = holidaySet.has(dateStr);

    // 9 AM to 6 PM mapping
    const workStart = new Date(current);
    workStart.setHours(9, 0, 0, 0);

    const workEnd = new Date(current);
    workEnd.setHours(18, 0, 0, 0);

    if (!isSunday && !isHoliday) {
      const overlapStart = new Date(Math.max(current.getTime(), workStart.getTime()));
      const intervalEnd = new Date(Math.min(end.getTime(), workEnd.getTime()));

      if (overlapStart < intervalEnd) {
        totalMs += (intervalEnd.getTime() - overlapStart.getTime());
      }
    }

    // Move to next day 00:00:00
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return totalMs;
};

export const calculateWorkingDays = (start, end, holidays = []) => {
  if (!start || !end) return 0;

  const holidaySet = new Set(holidays.map((h) => h.dateStr));
  let days = 0;

  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const endLimit = new Date(end);
  endLimit.setHours(23, 59, 59, 999);

  while (current <= endLimit) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const isSunday = current.getDay() === 0;
    const isHoliday = holidaySet.has(dateStr);

    if (!isSunday && !isHoliday) {
      days++;
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return days;
};
import useAuth from 'hooks/useAuth';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import SentimentVerySatisfiedRoundedIcon from '@mui/icons-material/SentimentVerySatisfiedRounded';
import SentimentVeryDissatisfiedRoundedIcon from '@mui/icons-material/SentimentVeryDissatisfiedRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import ReopenDashboard from './ReopenDashboard';
import ToBeTestedDashboard from './ToBeTestedDashboard';
import DueTodayDashboard from './DueTodayDashboard';
import OverdueDashboard from './OverdueDashboard';
import CompletedDashboard from './CompletedDashboard';
import InProgressDashboard from './InProgressDashboard';
import OpenDashboard from './OpenDashboard';
import BOSExportButton from 'ui-component/bos/BOSExportButton';

const pulseRed = keyframes`0%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}`;
const pulseBlue = keyframes`0%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}70%{box-shadow:0 0 0 10px rgba(59,130,246,0)}100%{box-shadow:0 0 0 0 rgba(59,130,246,0)}`;
const pulseGreen = keyframes`0%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)}70%{box-shadow:0 0 0 10px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}`;
const floatAnim = keyframes`0%{transform:translateY(0px)}50%{transform:translateY(-10px)}100%{transform:translateY(0px)}`;

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.mode === 'dark' ? '#0F172A' : '#F0F4F8',
  padding: theme.spacing(2, 1.5),
  fontFamily: "'Inter','Roboto',sans-serif",
  width: '100%',
  maxWidth: '100%'
}));

const Card = styled(Paper)(({ theme }) => ({
  borderRadius: 14,
  background: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  overflow: 'hidden'
}));

const TopStatCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'transform 0.18s, box-shadow 0.18s',
  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
}));

const IconBox = styled(Box)(({ color, bg, size = 48 }) => ({
  width: size,
  height: size,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color,
  background: bg
}));

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899', '#14B8A6'];
const genTrend = (base) => Array.from({ length: 7 }, () => Math.max(80, Math.min(120, Math.round(base + (Math.random() - 0.5) * 10))));

// ── SVG Mascots & Icons ───────────────────────────────────────────────────────
const NotoEmoji = ({ hex, size = 44, style = {} }) => {
  return (
    <img
      src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${hex}/512.gif`}
      width={size}
      height={size}
      alt="emoji"
      style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))', ...style }}
    />
  );
};

const StaticEmoji = ({ url, size = 44, style = {} }) => {
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt="emoji"
      style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))', ...style }}
    />
  );
};

const GreenHappySVG = () => <NotoEmoji hex="1f929" size={72} />;
const BlueBullseyeSVG = () => <NotoEmoji hex="1f3af" size={72} />;
const RedSadSVG = () => <NotoEmoji hex="1f621" size={72} />;

const ClipboardSVG = () => <NotoEmoji hex="1f4bb" />;
const GreenTargetSVG = () => <NotoEmoji hex="1f3af" />;
const HourglassSVG = () => <NotoEmoji hex="231b" />;
const PeopleSVG = () => <NotoEmoji hex="1f91d" />;
const BarChartSVG = () => <NotoEmoji hex="1f4c8" />;
const TrophySVG = () => <NotoEmoji hex="1f3c6" />;

// ── Dialog Transition ──────────────────────────────────────────────────────────
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const glowPulse = keyframes`0%{opacity:0.5}50%{opacity:1}100%{opacity:0.5}`;

const NeonMetricCard = styled(Paper)(({ theme, basecolor }) => ({
  borderRadius: '24px',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(180deg, ${alpha(basecolor, 0.15)} 0%, ${alpha('#060B14', 0.95)} 100%)`,
  backgroundColor: '#060B14',
  WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
  border: `1px solid ${alpha(basecolor, 0.2)}`,
  boxShadow: `0 8px 32px 0 rgba(0,0,0,0.5), inset 0 1px 2px 0 ${alpha(basecolor, 0.3)}`,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  height: '138px',
  width: '100%',
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%', left: '-50%', width: '200%', height: '200%',
    background: `radial-gradient(circle at 50% 50%, ${alpha(basecolor, 0.15)} 0%, transparent 60%)`,
    transition: 'all 0.5s ease',
    pointerEvents: 'none',
    zIndex: 0
  },
  '& .rotating-border': {
    position: 'absolute', inset: 0, borderRadius: '24px', padding: '2px',
    background: `conic-gradient(from 0deg, transparent 70%, ${basecolor} 100%)`,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0, zIndex: 1, pointerEvents: 'none',
    transition: 'opacity 0.5s',
  },
  '& .shimmer': {
    position: 'absolute', top: 0, left: '-150%', width: '100%', height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.15)}, transparent)`,
    transform: 'skewX(-20deg)', transition: 'none', zIndex: 3, pointerEvents: 'none'
  },
  '& .hover-emoji': {
    position: 'absolute', right: 24, top: 24, fontSize: '2rem',
    opacity: 0, transform: 'translateY(15px) scale(0.8)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 4, pointerEvents: 'none',
    filter: `drop-shadow(0px 0px 15px ${basecolor})`
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.03)',
    boxShadow: `0 25px 50px -12px ${alpha(basecolor, 0.7)}, inset 0 1px 3px 0 ${alpha(basecolor, 0.9)}`,
    border: `1px solid transparent`,
    '&::before': {
      background: `radial-gradient(circle at 50% 50%, ${alpha(basecolor, 0.35)} 0%, transparent 70%)`,
    },
    '& .rotating-border': {
      opacity: 1,
      animation: 'spin-border 3s linear infinite',
    },
    '& .shimmer': {
      animation: 'sweep 2s ease-in-out',
    },
    '& .hover-emoji': {
      opacity: 1, transform: 'translateY(-5px) scale(1.2)',
      animation: 'float 3s ease-in-out infinite'
    },
    '& .hud-corner': {
      borderColor: basecolor,
      width: '18px', height: '18px',
      filter: `drop-shadow(0 0 8px ${basecolor})`
    },
    '& .metric-icon-box': {
      transform: 'scale(1.1)',
      boxShadow: `0 0 25px ${alpha(basecolor, 0.6)}`
    }
  },
  '& .particles': {
    position: 'absolute', inset: 0, zIndex: 0, opacity: 0.15, pointerEvents: 'none',
    backgroundImage: `radial-gradient(${alpha(basecolor, 0.4)} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  },
  '& .hud-corner': {
    position: 'absolute',
    width: '12px', height: '12px',
    borderColor: alpha(basecolor, 0.4),
    borderStyle: 'solid',
    borderWidth: 0,
    zIndex: 1,
    transition: 'all 0.4s ease',
  },
  '& .hud-tl': { top: '12px', left: '12px', borderTopWidth: '2px', borderLeftWidth: '2px' },
  '& .hud-tr': { top: '12px', right: '12px', borderTopWidth: '2px', borderRightWidth: '2px' },
  '& .hud-bl': { bottom: '12px', left: '12px', borderBottomWidth: '2px', borderLeftWidth: '2px' },
  '& .hud-br': { bottom: '12px', right: '12px', borderBottomWidth: '2px', borderRightWidth: '2px' },
  '& .metric-icon-box': {
    transition: 'all 0.3s ease',
  }
}));

const GlowingIcon = styled(Box)(({ color }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `radial-gradient(circle, ${alpha(color, 0.4)} 0%, ${alpha(color, 0.05)} 70%)`,
  boxShadow: `0 0 25px ${alpha(color, 0.6)}, inset 0 0 15px ${alpha(color, 0.5)}`,
  border: `1px solid ${alpha(color, 0.6)}`,
  color: '#fff',
  WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
  zIndex: 1,
  position: 'relative',
  marginBottom: '8px'
}));

const VerticalSummaryCard = styled(Paper)(({ theme, basecolor }) => ({
  borderRadius: '24px',
  background: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px 10px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${alpha(basecolor, 0.8)} 0%, ${alpha(basecolor, 0.1)} 100%)`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0, left: 0, width: '40%', height: '40%',
    background: `radial-gradient(circle at top left, ${alpha(basecolor, 0.12)} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  '&:hover': {
    transform: 'translateY(-12px)',
    boxShadow: `0 24px 48px ${alpha(basecolor, 0.18)}`,
    '& .icon-box': {
      animation: `${floatAnim} 2s ease-in-out infinite`
    }
  }
}));

// ── Workload View ─────────────────────────────────────────────────────────────
const WorkloadView = ({ realWorkload, isDark, navigate, filterRequestManagement, isCurrentUser, activeTab, globalFilters }) => {
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const criticalCount = realWorkload.filter((w) => w.status === 'Critical').length;
  const normalCount = realWorkload.filter((w) => w.status === 'Normal').length;
  const healthyCount = realWorkload.filter((w) => w.status === 'Healthy').length;

  const avgWorkload = Math.round(realWorkload.reduce((sum, w) => sum + w.percent, 0) / (realWorkload.length || 1));
  const avgActiveTasks = Math.round(realWorkload.reduce((sum, w) => sum + w.tasks, 0) / (realWorkload.length || 1));
  const overallProductivity = avgWorkload > 80 ? 'Critical' : avgWorkload > 50 ? 'Average' : 'Good';
  const healthyEmployees = realWorkload.filter((w) => w.status === 'Healthy').length;

  const sparklineOptions = (color) => ({
    chart: {
      type: 'line',
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      dropShadow: { enabled: true, top: 3, left: 0, blur: 4, opacity: 0.5, color: color }
    },
    stroke: { curve: 'smooth', width: 3 },
    colors: [color],
    markers: { size: 0, hover: { size: 5 } },
    tooltip: { theme: 'dark', fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
  });

  const areaSparklineOptions = (color) => ({
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] }
    },
    colors: [color],
    markers: {
      size: 0,
      discrete: [{
        seriesIndex: 0,
        dataPointIndex: 5,
        fillColor: color,
        strokeColor: '#fff',
        size: 4,
        shape: "circle"
      }]
    },
    tooltip: { theme: isDark ? 'dark' : 'light', fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
  });

  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0';

  const DataTable = ({ rows }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

    const handleSort = (key) => {
      let direction = 'desc';
      if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
      }
      setSortConfig({ key, direction });
    };

    const sortedRows = useMemo(() => {
      let sortableItems = [...rows];
      if (sortConfig.key) {
        sortableItems.sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];

          if (sortConfig.key === 'status') {
            const statusWeight = { 'Critical': 1, 'Normal': 2, 'Healthy': 3 };
            aValue = statusWeight[aValue] || 4;
            bValue = statusWeight[bValue] || 4;
          } else if (sortConfig.key === 'user') {
            aValue = aValue ? aValue.toLowerCase() : '';
            bValue = bValue ? bValue.toLowerCase() : '';
          } else if (sortConfig.key === 'percent' || sortConfig.key === 'tasks' || sortConfig.key === 'days') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
          }
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return sortableItems;
    }, [rows, sortConfig]);

    const getSortIcon = (key) => {
      if (sortConfig.key === key) {
        return sortConfig.direction === 'desc' ? <KeyboardArrowUpIcon fontSize="small" sx={{ ml: 0.5, color: '#6366F1' }} /> : <KeyboardArrowDownIcon fontSize="small" sx={{ ml: 0.5, color: '#6366F1' }} />;
      }
      return <KeyboardArrowDownIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary', opacity: 0.3 }} />;
    };

    return (
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }}>
            <TableRow>
              <TableCell sx={{ py: 1.5, borderBottom: `1px solid ${borderColor}`, width: '60px' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  S.No
                </Typography>
              </TableCell>
              {[
                { key: 'user', label: 'Employee', icon: <PersonOutlineRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} /> },
                { key: 'percent', label: 'Workload', icon: <Box sx={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AssignmentRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} /></Box>, width: '35%' },
                { key: 'tasks', label: 'Active Task', icon: <FolderOpenRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} /> },
                { key: 'days', label: 'Total Days', icon: <CalendarTodayRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} /> },
                { key: 'status', label: 'Status', icon: <BookmarkBorderRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} /> },
              ].map((col) => (
                <TableCell
                  key={col.key}
                  sx={{ py: 1.5, borderBottom: `1px solid ${borderColor}`, width: col.width || 'auto', cursor: 'pointer', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' } }}
                  onClick={() => handleSort(col.key)}
                >
                  <Stack direction="row" alignItems="center" gap={1}>
                    {col.icon}
                    <Typography variant="subtitle2" fontWeight={800} color={sortConfig.key === col.key ? '#6366F1' : 'text.primary'}>
                      {col.label}
                    </Typography>
                    {getSortIcon(col.key)}
                  </Stack>
                </TableCell>
              ))}
              <TableCell align="right" sx={{ py: 1.5, borderBottom: `1px solid ${borderColor}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <MoreVertRoundedIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ bgcolor: isDark ? '#1E293B' : '#FFFFFF' }}>
            {sortedRows.map((row, idx) => (
              <TableRow
                key={idx}
                hover
                sx={{
                  cursor: 'pointer',
                  '& td': { borderBottom: idx === sortedRows.length - 1 ? 'none' : `1px solid ${borderColor}` }
                }}
                onDoubleClick={() => {
                  if (filterRequestManagement === 'My Request' && !isCurrentUser(row.user)) {
                    navigate('/support/ticket-by-me', {
                      state: {
                        openNewTask: true,
                        assignTo: row.user,
                        fromDashboard: true,
                        fromTab: activeTab,
                        dashboardFilters: globalFilters
                      }
                    });
                  } else if (filterRequestManagement === 'Request For Me' && row.tasks > 0) {
                    navigate('/support/raised-for-me', {
                      state: {
                        fromDashboard: true,
                        initialFilters: { assignedTo: row.user, ticketStatus: 'Active', taskScope: globalFilters?.performanceScope || 'Mine' },
                        fromTab: activeTab,
                        dashboardFilters: globalFilters
                      }
                    });
                  }
                }}
              >
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                    {idx + 1}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: row.color, fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      {row.user.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                        {row.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.65rem' }}>
                        {row.user.toLowerCase().includes('admin') ? 'Administrator' : 'Developer'}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Box sx={{ pr: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 120 }}>
                      <Typography variant="subtitle2" fontWeight={900} color="text.primary" mb={0.2}>
                        {row.percent}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ fontSize: '0.65rem' }}>
                        {row.percent} / 100% Completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={row.percent}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: alpha(row.color, 0.15),
                        '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 3 }
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Chip
                    icon={<AssignmentRoundedIcon sx={{ fontSize: '14px !important' }} />}
                    label={row.tasks}
                    size="small"
                    sx={{
                      bgcolor: alpha(row.color, 0.1),
                      color: row.color,
                      fontWeight: 800,
                      borderRadius: 2,
                      px: 0.5,
                      height: 24,
                      '& .MuiChip-icon': { color: row.color }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Chip
                    icon={<CalendarTodayRoundedIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${row.days} Days`}
                    size="small"
                    sx={{
                      bgcolor: alpha(row.color, 0.1),
                      color: row.color,
                      fontWeight: 800,
                      borderRadius: 2,
                      px: 0.5,
                      height: 24,
                      '& .MuiChip-icon': { color: row.color }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Chip
                    icon={
                      row.status === 'Critical' ? (
                        <ErrorRoundedIcon sx={{ fontSize: '16px !important' }} />
                      ) : (
                        <CheckCircleRoundedIcon sx={{ fontSize: '16px !important' }} />
                      )
                    }
                    label={row.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(row.color, 0.1),
                      color: row.color,
                      fontWeight: 800,
                      borderRadius: 6,
                      px: 1,
                      height: 24,
                      '& .MuiChip-icon': { color: row.color }
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ py: 1.5 }}>
                  <IconButton size="small" sx={{ color: '#94A3B8' }}>
                    <MoreVertRoundedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 2.5
        }}
      >
        {[
          {
            c: '#8B5CF6',
            label: 'All Employees',
            n: realWorkload.length,
            icon: <AssignmentRoundedIcon fontSize="small" />,
            data: [40, 60, 45, 80, 50, 90],
            trend: '+5%',
            hoverEmoji: '📋'
          },
          {
            c: '#EF4444',
            label: 'Critical',
            n: criticalCount,
            icon: <NotificationsActiveRoundedIcon fontSize="small" />,
            data: [10, 25, 15, 40, 20, 50],
            trend: '+25%',
            hoverEmoji: '🚨'
          },
          {
            c: '#3B82F6',
            label: 'Normal',
            n: normalCount,
            icon: <ThumbUpAltRoundedIcon fontSize="small" />,
            data: [20, 10, 30, 15, 40, 25],
            trend: '+12%',
            hoverEmoji: '👍'
          },
          {
            c: '#10B981',
            label: 'Healthy',
            n: healthyCount,
            icon: <MonitorHeartRoundedIcon fontSize="small" />,
            data: [30, 40, 20, 50, 30, 60],
            trend: '+40%',
            hoverEmoji: '📈'
          }
        ].map((s, i) => (
          <NeonMetricCard key={i} basecolor={s.c}>
            <Box className="hud-corner hud-tl" />
            <Box className="hud-corner hud-tr" />
            <Box className="hud-corner hud-bl" />
            <Box className="hud-corner hud-br" />
            <Box className="particles" />
            <Box className="rotating-border" />
            <Box className="shimmer" />

            <Typography className="hover-emoji">{s.hoverEmoji}</Typography>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              flex={1}
              zIndex={2}
              position="relative"
              sx={{ textAlign: 'center' }}
            >
              <Box
                className="metric-icon-box"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `radial-gradient(circle, ${alpha(s.c, 0.4)} 0%, ${alpha(s.c, 0.05)} 70%)`,
                  boxShadow: `0 0 20px ${alpha(s.c, 0.6)}, inset 0 0 15px ${alpha(s.c, 0.5)}`,
                  border: `1px solid ${alpha(s.c, 0.6)}`,
                  color: '#fff',
                  WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
                  animation: 'floatIcon 4s ease-in-out infinite',
                }}
              >
                {s.icon}
              </Box>
              <Typography variant="subtitle2" color="#fff" fontWeight={800} sx={{ lineHeight: 1, fontSize: '0.85rem', mb: 1, letterSpacing: '0.5px' }}>
                {s.label}
              </Typography>
              <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1, color: '#fff', textShadow: `0 0 20px ${alpha(s.c, 0.9)}, 0 0 10px ${s.c}`, mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
                {s.n}
              </Typography>
              <Typography variant="caption" sx={{ color: s.c, fontWeight: 800, fontSize: '0.7rem', opacity: 0.9 }}>
                {s.trend} <span style={{ color: alpha('#fff', 0.5), fontWeight: 500 }}>vs last 7 days</span>
              </Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 35, zIndex: 1, opacity: 0.3, pointerEvents: 'none' }}>
              <ReactApexChart options={sparklineOptions(s.c)} series={[{ data: s.data }]} type="line" height="100%" width="100%" />
            </Box>
          </NeonMetricCard>
        ))}
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="h6" fontWeight={900} color="text.primary">
          Employee Workload
        </Typography>
        <Button
          variant="contained"
          onClick={() => setViewAllOpen(true)}
          endIcon={<TrendingUpRoundedIcon />}
          sx={{
            bgcolor: '#6366F1',
            '&:hover': { bgcolor: '#4F46E5' },
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 700,
            px: 2,
            py: 0.8,
            fontSize: '0.75rem'
          }}
        >
          View All
        </Button>
      </Box>
      <Card sx={{ p: 0, borderRadius: 3, border: `1px solid ${borderColor}`, boxShadow: 'none', mb: 2.5 }}>
        <DataTable rows={realWorkload.slice(0, 5)} />
      </Card>

      <Dialog
        fullScreen
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        TransitionComponent={Transition}
        PaperProps={{ sx: { bgcolor: isDark ? '#0F172A' : '#F8FAFC' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
            borderBottom: `1px solid ${borderColor}`,
            bgcolor: isDark ? '#1E293B' : '#FFFFFF'
          }}
        >
          <Typography variant="h5" fontWeight={900} color="text.primary">
            All Employees Workload List
          </Typography>
          <IconButton onClick={() => setViewAllOpen(false)} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Card sx={{ p: 0, borderRadius: 3, border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
            <DataTable rows={realWorkload} />
          </Card>
        </DialogContent>
      </Dialog>

      {/* Footer Area */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5
        }}
      >
        <Card
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100px',
            minHeight: '100px',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(15px)' }} />
          <Box sx={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />

          <Box display="flex" alignItems="center" gap={1.5} zIndex={2}>
            <Box sx={{ filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))' }}>
              <NotoEmoji hex="1f3c6" size={40} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} color="#FDE047" sx={{ lineHeight: 1 }}>
                2 Employees
              </Typography>
              <Typography variant="caption" fontWeight={600} color="rgba(255,255,255,0.9)" sx={{ lineHeight: 1.2, mt: 0.5, display: 'block' }}>
                Great job team! 🎊 Let's keep the momentum going!
              </Typography>
            </Box>
          </Box>
        </Card>

        {[
          {
            title: 'Average Workload',
            val: `${avgWorkload}%`,
            trend: '↑ 12%',
            trendColor: '#8B5CF6',
            icon: <TrendingUpRoundedIcon fontSize="small" />,
            data: [20, 40, 30, 50, 40, 60]
          },
          {
            title: 'Average Active Tasks',
            val: avgActiveTasks,
            trend: '↓ 8%',
            trendColor: '#3B82F6',
            icon: <AccessTimeRoundedIcon fontSize="small" />,
            data: [10, 25, 20, 40, 30, 50]
          },
          {
            title: 'Overall Productivity',
            val: overallProductivity,
            trend: '↑ 14%',
            trendColor: '#10B981',
            icon: <TrackChangesRoundedIcon fontSize="small" />,
            data: [30, 50, 40, 60, 50, 70]
          }
        ].map((s, i) => (
          <Card
            key={i}
            sx={{
              p: 1.5,
              bgcolor: isDark ? '#1E293B' : '#FFFFFF',
              border: `1px solid ${borderColor}`,
              height: '100px',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: isDark ? 'none' : '0 4px 15px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" zIndex={2} mb={0.5}>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 26, height: 26, borderRadius: '8px', bgcolor: alpha(s.trendColor, 0.15), color: s.trendColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(s.icon, { sx: { fontSize: 14 } })}
                </Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={800} sx={{ fontSize: '0.75rem' }}>
                  {s.title}
                </Typography>
              </Stack>
              <IconButton size="small" sx={{ color: '#94A3B8', p: 0 }}>
                <MoreVertRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="h4" fontWeight={900} color={s.trendColor} sx={{ lineHeight: 1, zIndex: 2, mb: 0.5 }}>
              {s.val}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} zIndex={2}>
              <Chip label={s.trend} size="small" sx={{ bgcolor: alpha(s.trendColor, 0.1), color: s.trendColor, fontWeight: 800, fontSize: '0.6rem', height: 18 }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>vs last 7 days</Typography>
            </Stack>

            <Box sx={{ position: 'absolute', bottom: -15, left: 0, right: 0, height: 40, zIndex: 1, pointerEvents: 'none' }}>
              <ReactApexChart options={areaSparklineOptions(s.trendColor)} series={[{ data: s.data }]} type="area" height="100%" width="100%" />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

// Helper to format decimal hours into HH:mm format
const formatHHMM = (hours = 0) => {
  const isNegative = hours < 0;
  const absHours = Math.abs(hours);
  const h = Math.floor(absHours);
  const m = Math.round((absHours - h) * 60);
  let mm = m;
  let hh = h;
  if (mm === 60) { hh += 1; mm = 0; }
  const sign = isNegative ? '-' : '';
  return `${sign}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const parseDurationToMinutes = (str) => {
  if (!str) return 0;
  const clean = String(str).toLowerCase().replace(/\s+/g, '');
  if (clean.includes(':')) {
    const parts = clean.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }
  const dayMatch = clean.match(/([\d.]+)\s*d/);
  const hrMatch = clean.match(/([\d.]+)\s*h/);
  const minMatch = clean.match(/([\d.]+)\s*m/);
  let totalMins = 0;
  if (dayMatch) totalMins += parseFloat(dayMatch[1]) * 24 * 60;
  if (hrMatch) totalMins += parseFloat(hrMatch[1]) * 60;
  if (minMatch) totalMins += parseFloat(minMatch[1]);
  if (!dayMatch && !hrMatch && !minMatch) {
    const num = parseFloat(clean);
    if (!isNaN(num)) totalMins += num * 60;
  }
  return totalMins;
};

// ── Performance Overview ──────────────────────────────────────────────────────
const PerformanceOverview = ({ devStats, realTasks = [], holidayList = [], isDark, textColor, textMuted }) => {
  const [devSortCol, setDevSortCol] = useState('workEfficiency');
  const [devSortDir, setDevSortDir] = useState('desc');
  const [showDevViewAll, setShowDevViewAll] = useState(false);
  const [viewAllFilterType, setViewAllFilterType] = useState('All');
  const [viewAllFromDate, setViewAllFromDate] = useState('');
  const [viewAllToDate, setViewAllToDate] = useState('');
  const [selectedDevTasksModal, setSelectedDevTasksModal] = useState(null);
  const filteredModalDevStats = useMemo(() => {
    if (viewAllFilterType === 'All' && devStats.length > 0) return devStats;
    if (realTasks.length === 0) return [];

    let filteredTasks = [...realTasks];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getTaskDate = (t) => {
      return new Date(t._createdDate || t.createdDate || t._rawDate || new Date());
    };

    let startPeriod = null;
    let endPeriod = null;

    if (viewAllFilterType === 'Daily') {
      startPeriod = new Date(today);
      endPeriod = new Date(today);
      endPeriod.setHours(23, 59, 59, 999);
      filteredTasks = filteredTasks.filter(t => {
        const d = getTaskDate(t);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (viewAllFilterType === 'Weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      startPeriod = monday;
      endPeriod = sunday;
      filteredTasks = filteredTasks.filter(t => {
        const d = getTaskDate(t);
        return d >= monday && d <= sunday;
      });
    } else if (viewAllFilterType === 'Monthly') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      startPeriod = startOfMonth;
      endPeriod = endOfMonth;
      filteredTasks = filteredTasks.filter(t => {
        const d = getTaskDate(t);
        return d >= startOfMonth && d <= endOfMonth;
      });
    } else if (viewAllFilterType === 'Custom' && (viewAllFromDate || viewAllToDate)) {
      const start = viewAllFromDate ? new Date(viewAllFromDate) : new Date(0);
      if (viewAllFromDate) start.setHours(0, 0, 0, 0);
      const end = viewAllToDate ? new Date(viewAllToDate) : new Date();
      end.setHours(23, 59, 59, 999);
      startPeriod = start;
      endPeriod = end;
      filteredTasks = filteredTasks.filter(t => {
        const d = getTaskDate(t);
        return d >= start && d <= end;
      });
    }

    if (filteredTasks.length === realTasks.length && devStats.length > 0) return devStats;

    let tempMap = {};
    devStats.forEach(d => {
      tempMap[d.user] = { user: d.user, assignedHrs: 0, completedHrs: 0, takenHrs: 0, reworkHrs: 0, delayHrs: 0, firstDate: null, taskCount: 0 };
    });

    const now = new Date();

    filteredTasks.forEach(t => {
      const st = String(t._status).toLowerCase();
      const isDone = ['completed', 'verified', 'approved', 'closed', 'resolved'].includes(st);
      const isToBeVerified = ['to be verified'].includes(st);
      const isDevDone = isDone || isToBeVerified || ['to be tested'].includes(st);
      const uName = t._user || 'Unknown';
      const hrs = t._hrs ? (parseDurationToMinutes(t._hrs) / 60) || 8 : 8;

      if (!tempMap[uName]) {
        tempMap[uName] = { user: uName, assignedHrs: 0, completedHrs: 0, takenHrs: 0, reworkHrs: 0, delayHrs: 0, firstDate: null, taskCount: 0 };
      }
      const taskDate = getTaskDate(t);
      if (!tempMap[uName].firstDate || taskDate < tempMap[uName].firstDate) tempMap[uName].firstDate = taskDate;

      tempMap[uName].assignedHrs += hrs;
      tempMap[uName].taskCount += 1;
      if (isDevDone) tempMap[uName].completedHrs += hrs;

      const actHrs = t._actualHrs ? parseDurationToMinutes(t._actualHrs) / 60 : 0;
      tempMap[uName].takenHrs += actHrs;

      if (isDone && (t._updatedDate || t._createdDate) && t._dueDate) {
        const dueDate = new Date(t._dueDate);
        const cd = new Date(t._updatedDate || t._createdDate);
        if (cd > dueDate) {
          const delayMs = calculateWorkingMs(dueDate, cd, holidayList);
          if (delayMs > 0) tempMap[uName].delayHrs += (delayMs / (1000 * 60 * 60));
        }
      } else if (!isDone && t._dueDate) {
        const dueDate = new Date(t._dueDate);
        if (now > dueDate) {
          const delayMs = calculateWorkingMs(dueDate, now, holidayList);
          if (delayMs > 0) tempMap[uName].delayHrs += (delayMs / (1000 * 60 * 60));
        }
      }

      const tickets = t._tickets || [];
      tickets.forEach(tk => {
        const isRework = tk.issueType?.toLowerCase()?.includes('rework') || tk.ticketType?.toLowerCase()?.includes('rework') || tk.title?.toLowerCase()?.includes('rework');
        if (isRework) {
          const tkHrs = tk.actualHrs ? parseDurationToMinutes(tk.actualHrs) / 60 : 0;
          tempMap[uName].reworkHrs += tkHrs;
        }
      });
    });

    return Object.values(tempMap).map(d => {
      let totalDays = 0;
      if (startPeriod && endPeriod) {
        totalDays = calculateWorkingDays(startPeriod, endPeriod, holidayList);
      } else if (d.firstDate) {
        const startDate = new Date(d.firstDate);
        startDate.setHours(0, 0, 0, 0);
        totalDays = calculateWorkingDays(startDate, now, holidayList);
      }
      if (totalDays < 1) totalDays = 1;
      const totalHrs = totalDays * 6;

      const assignedHrs = d.assignedHrs;
      const workingHrs = d.takenHrs + d.reworkHrs + d.delayHrs;

      const loadPercentage = totalHrs > 0 ? (assignedHrs / totalHrs) * 100 : 0;
      const actualEfficiency = totalHrs > 0 ? (workingHrs / totalHrs) * 100 : 0;
      const workEfficiency = workingHrs > 0 ? (assignedHrs / workingHrs) * 100 : 0;

      let perfStatus = 'Outstanding';
      if (workEfficiency >= 90) perfStatus = 'Outstanding';
      else if (workEfficiency >= 75) perfStatus = 'Good';
      else if (workEfficiency >= 50) perfStatus = 'Average';
      else perfStatus = 'Needs Improvement';

      return {
        ...d,
        totalHrs,
        workingHrs,
        loadPercentage,
        actualEfficiency,
        workEfficiency,
        actualPerformance: workEfficiency,
        assignedPerformance: loadPercentage,
        taskCount: d.taskCount,
        perfStatus,
        trend: genTrend(workEfficiency)
      };
    });
  }, [viewAllFilterType, viewAllFromDate, viewAllToDate, realTasks, holidayList, devStats]);

  const totalAssigned = devStats.reduce((s, d) => s + d.assignedHrs, 0);
  const totalCompleted = devStats.reduce((s, d) => s + d.completedHrs, 0);
  const totalTaken = devStats.reduce((s, d) => s + (d.takenHrs || 0), 0);
  const totalRework = devStats.reduce((s, d) => s + (d.reworkHrs || 0), 0);
  const totalDelay = devStats.reduce((s, d) => s + (d.delayHrs || 0), 0);
  const pendingHrs = Math.max(0, totalAssigned - totalCompleted);
  const activeDev = devStats.length;
  const avgPerf = devStats.length > 0 ? (devStats.reduce((s, d) => s + d.actualPerformance, 0) / devStats.length).toFixed(2) : '0.00';
  const outstandingDevs = devStats.filter((d) => d.perfStatus === 'Outstanding');
  const perfectDevs = devStats.filter((d) => d.perfStatus === 'Perfect');
  const lowDevs = devStats.filter((d) => d.perfStatus === 'Low');

  const getPerfColor = (s) => (s === 'Outstanding' ? '#10B981' : s === 'Perfect' ? '#3B82F6' : '#F59E0B');
  const getPerfBg = (s) => (s === 'Outstanding' ? '#F0FDF4' : s === 'Perfect' ? '#EFF6FF' : '#FFFBEB');
  const getPerfBorder = (s) => (s === 'Outstanding' ? '#BBF7D0' : s === 'Perfect' ? '#BFDBFE' : '#FDE68A');
  const getPerfIcon = (s) =>
    s === 'Outstanding' ? (
      <NotoEmoji hex="1f929" size={20} style={{ filter: 'none' }} />
    ) : s === 'Perfect' ? (
      <NotoEmoji hex="1f3af" size={20} style={{ filter: 'none' }} />
    ) : (
      <NotoEmoji hex="1f621" size={20} style={{ filter: 'none' }} />
    );

  // Summary area chart options
  const summaryAreaOptions = (color) => ({
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.0, stops: [0, 100] }
    },
    colors: [color],
    tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
  });

  // Summary cards config
  const summaryCards = [
    { label: 'Total Assigned Hours', value: `${totalAssigned.toFixed(2)}`, sub: 'All Developers', svgIcon: <NotoEmoji hex="1f4da" size={36} />, color: '#8B5CF6', chartData: [10, 25, 15, 30, 20, 35, 25] },
    {
      label: 'Total Completed Hours',
      value: `${totalCompleted.toFixed(2)}`,
      sub: 'All Developers',
      svgIcon: <NotoEmoji hex="1f525" size={36} />,
      color: '#10B981', chartData: [5, 15, 10, 25, 20, 30, 25]
    },
    { label: 'Pending Hours', value: `${pendingHrs.toFixed(2)}`, sub: 'Remaining Work', svgIcon: <NotoEmoji hex="23f3" size={36} />, color: '#F59E0B', chartData: [35, 30, 32, 25, 28, 20, 18] },
    { label: 'Total Developers', value: `${activeDev}`, sub: 'Active Developers', svgIcon: <NotoEmoji hex="1f4bb" size={36} />, color: '#8B5CF6', chartData: [5, 5, 5, 5, 5, 5, 5] },
    { label: 'Avg Performance', value: `${avgPerf}%`, sub: 'Across all developers', svgIcon: <NotoEmoji hex="1f4c8" size={36} />, color: '#3B82F6', chartData: [60, 65, 62, 70, 68, 75, 78] },
    {
      label: 'Outstanding Performers',
      value: `${outstandingDevs.length}`,
      sub: 'Completed less than assigned',
      svgIcon: <NotoEmoji hex="1f3c6" size={36} />,
      color: '#EF4444', chartData: [1, 2, 1, 3, 2, 3, 3]
    }
  ];

  // Donut chart
  const perfDistOptions = {
    chart: { type: 'donut', fontFamily: "'Inter',sans-serif" },
    labels: ['Outstanding', 'Perfect', 'Low'],
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    stroke: { width: 3, colors: [isDark ? '#1E293B' : '#FFFFFF'] },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            value: { fontSize: '26px', fontWeight: 800, color: textColor, offsetY: 10 },
            total: { show: true, label: 'Developers', formatter: () => String(activeDev), color: textMuted, fontSize: '13px' }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false }
  };
  const perfDistSeries = [outstandingDevs.length, perfectDevs.length, lowDevs.length];

  // Trend line chart
  const days = ['29 Apr', '30 Apr', '01 May', '02 May', '03 May', '04 May', '05 May'];
  const trendOptions = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: "'Inter',sans-serif" },
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    stroke: { curve: 'smooth', width: 2.5 },
    markers: { size: 4, hover: { size: 6 } },
    xaxis: {
      categories: days,
      labels: { style: { colors: textMuted, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { labels: { style: { colors: textMuted }, formatter: (v) => `${v}%` }, min: 80, max: 120, tickAmount: 5 },
    grid: { borderColor: isDark ? '#334155' : '#F1F5F9', strokeDashArray: 4 },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: textColor },
      markers: { radius: 12 },
      itemMargin: { horizontal: 10 }
    },
    tooltip: { y: { formatter: (v) => `${v}%` } }
  };
  const outAvg = outstandingDevs.length > 0 ? (outstandingDevs.reduce((s, d) => s + d.actualPerformance, 0) / outstandingDevs.length) : null;
  const perfAvg = perfectDevs.length > 0 ? (perfectDevs.reduce((s, d) => s + d.actualPerformance, 0) / perfectDevs.length) : null;
  const lowAvg = lowDevs.length > 0 ? (lowDevs.reduce((s, d) => s + d.actualPerformance, 0) / lowDevs.length) : null;

  const trendSeries = [];
  const trendColors = [];
  if (outAvg !== null) {
    trendSeries.push({ name: 'Outstanding', data: genTrend(outAvg) });
    trendColors.push('#10B981');
  }
  if (perfAvg !== null) {
    trendSeries.push({ name: 'Perfect', data: genTrend(perfAvg) });
    trendColors.push('#3B82F6');
  }
  if (lowAvg !== null) {
    trendSeries.push({ name: 'Low', data: genTrend(lowAvg) });
    trendColors.push('#F59E0B');
  }

  // Time of day bar chart
  const todOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: "'Inter',sans-serif" },
    colors: ['#93C5FD', '#6EE7B7', '#FCD34D', '#FCA5A5', '#C4B5FD'],
    plotOptions: { bar: { borderRadius: 6, distributed: true, dataLabels: { position: 'top' } } },
    dataLabels: {
      enabled: true,
      style: { colors: [isDark ? '#94A3B8' : '#374151'], fontWeight: 700, fontSize: '13px' },
      offsetY: -20,
      formatter: (v) => `${v}`
    },
    xaxis: {
      categories: ['9 AM - 11 AM', '11 AM - 1 PM', '1 PM - 3 PM', '3 PM - 5 PM', '5 PM - 7 PM'],
      labels: { style: { colors: textMuted, fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { title: { text: 'Hours', style: { color: textMuted, fontSize: '12px' } }, labels: { style: { colors: textMuted } } },
    grid: { borderColor: isDark ? '#334155' : '#F1F5F9', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { y: { formatter: (v) => `${v} Hrs` } }
  };
  const todSeries = [{ data: [20, 35, 40, 28, 14] }];

  // Top performers sorted by efficiency desc
  const topPerformers = [...devStats].sort((a, b) => b.actualPerformance - a.actualPerformance).slice(0, 5);

  // Insights
  const insights = [
    {
      v: outstandingDevs.length,
      label: 'Developers',
      desc: 'Completed less than assigned.\nGreat job! Keep it up! 👏',
      color: '#10B981',
      bg: '#F0FDF4',
      border: '#BBF7D0',
      emoji: <NotoEmoji hex="1f4c8" size={36} />
    },
    {
      v: perfectDevs.length,
      label: 'Developers',
      desc: 'Completed exactly as assigned.\nPerfectly on track! 🎯',
      color: '#3B82F6',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      emoji: <NotoEmoji hex="1f3af" size={36} />
    },
    {
      v: lowDevs.length,
      label: 'Developers',
      desc: 'Completed more than assigned.\nTake care of your workload! ⚠️',
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
      emoji: <NotoEmoji hex="1f680" size={36} />
    },
    {
      v: `${pendingHrs} Hrs`,
      label: 'Total pending hours',
      desc: 'Across the team.\nPlan your time effectively ⏰',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      emoji: <NotoEmoji hex="23f0" size={36} />
    },
    {
      v: `${avgPerf}%`,
      label: 'Average performance',
      desc: 'Across the team.\nExcellent overall performance! 🏆',
      color: '#0EA5E9',
      bg: '#F0F9FF',
      border: '#BAE6FD',
      emoji: <NotoEmoji hex="23f1" size={36} />
    }
  ];

  const getDateRangeText = () => {
    if (viewAllFilterType === 'All') return 'All Time Report';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    if (viewAllFilterType === 'Daily') {
      return `${formatDate(today)} Report`;
    }
    if (viewAllFilterType === 'Weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${formatDate(monday)} - ${formatDate(sunday)} Report`;
    }
    if (viewAllFilterType === 'Monthly') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return `${formatDate(start)} - ${formatDate(end)} Report`;
    }
    if (viewAllFilterType === 'Custom' && (viewAllFromDate || viewAllToDate)) {
      const fromStr = viewAllFromDate ? formatDate(new Date(viewAllFromDate)) : 'Beginning';
      const toStr = viewAllToDate ? formatDate(new Date(viewAllToDate)) : 'Today';
      return `${fromStr} - ${toStr} Report`;
    }
    return '';
  };

  return (
    <PageContainer>
      {/* Background Blobs for Premium Feel */}
      <Box sx={{ position: 'fixed', top: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.03) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* ── TOP 6 SUMMARY CARDS ── */}
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1,1fr)', sm: 'repeat(3,1fr)', lg: 'repeat(6,1fr)' }, gap: 3, mb: 3 }}
        >
          {summaryCards.map((c, i) => (
            <VerticalSummaryCard key={i} basecolor={c.color}>
              <Box className="icon-box" sx={{ mb: 0.5, zIndex: 2, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}>
                {c.svgIcon}
              </Box>
              <Typography variant="subtitle2" color="text.primary" fontWeight={800} align="center" mb={0.25} sx={{ zIndex: 2, fontSize: '0.8rem' }}>
                {c.label}
              </Typography>
              <Box display="flex" alignItems="baseline" gap={0.5} zIndex={2} mb={0}>
                <Typography variant="h4" fontWeight={900} color={c.color} sx={{ lineHeight: 1 }}>
                  {c.value.split(' ')[0]}
                </Typography>
                {c.value.split(' ')[1] && (
                  <Typography variant="subtitle2" fontWeight={800} color={c.color}>
                    {c.value.split(' ')[1]}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} align="center" sx={{ zIndex: 2, minHeight: 'auto', mb: 1, fontSize: '0.65rem' }}>
                {c.sub}
              </Typography>

              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, zIndex: 1, opacity: 0.8, pointerEvents: 'none' }}>
                <ReactApexChart options={summaryAreaOptions(c.color)} series={[{ data: c.chartData }]} type="area" height="100%" width="100%" />
              </Box>
            </VerticalSummaryCard>
          ))}
        </Box>

        {/* ── MIDDLE ROW: TABLE + STATUS CARDS ── */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, mb: 2.5, alignItems: 'stretch' }}>
          {/* Performance by Developer Table */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  px: 2.5,
                  pt: 2,
                  pb: 1.5,
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: isDark ? '#1E293B' : '#F8FAFF',
                }}
              >
                <Box sx={{ position: 'absolute', right: 50, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
                <Box sx={{ position: 'absolute', right: 150, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' }} />
                <Stack direction="row" alignItems="center" gap={2} zIndex={1}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(99,102,241,0.25)'
                    }}
                  >
                    <TrendingUpRoundedIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="text.primary" mb={0.5}>
                      Performance by Developer
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Track and monitor developer productivity and performance
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setViewAllFilterType('All');
                    setViewAllFromDate('');
                    setViewAllToDate('');
                    setShowDevViewAll(true);
                  }}
                  endIcon={<TrendingUpRoundedIcon />}
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                    color: textColor,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    zIndex: 2,
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }
                  }}
                >
                  View all
                </Button>
                <Box sx={{ position: 'relative', width: 120, height: 60, zIndex: 1, display: { xs: 'none', sm: 'block' } }}>
                  <Box sx={{ position: 'absolute', bottom: 0, left: 10, width: 14, height: 25, borderRadius: '4px 4px 0 0', bgcolor: '#A78BFA' }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 30, width: 14, height: 40, borderRadius: '4px 4px 0 0', bgcolor: '#8B5CF6' }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 50, width: 14, height: 55, borderRadius: '4px 4px 0 0', bgcolor: '#6D28D9' }} />
                  <Box sx={{ position: 'absolute', bottom: 10, left: 75 }}>
                    <NotoEmoji hex="1f3c6" size={28} />
                  </Box>
                  <TrendingUpRoundedIcon sx={{ position: 'absolute', top: 0, left: 40, color: '#6366F1', fontSize: 30, opacity: 0.8 }} />
                </Box>
              </Box>
              <TableContainer sx={{ flexGrow: 1, maxHeight: 500, overflow: 'auto' }}>
                <Table stickyHeader size="small" sx={{ height: '100%' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }}>
                      {[
                        { key: null, label: '#' },
                        { key: 'user', label: 'DEVELOPER' },
                        { key: 'totalHrs', label: 'TOTAL HRS' },
                        { key: 'assignedHrs', label: 'ASSIGNED HRS' },
                        { key: 'workingHrs', label: 'WORKED HRS' },
                        { key: 'workEfficiency', label: 'WORK EFFICIENCY %' },
                        { key: 'perfStatus', label: 'STATUS' },
                        { key: null, label: 'TREND' },
                        { key: 'loadPercentage', label: 'LOAD EFFICIENCY %' },
                        { key: 'taskCount', label: 'TASK COUNT' },
                        { key: 'takenHrs', label: 'TAKEN HRS' },
                        { key: 'reworkHrs', label: 'REWORK HRS' },
                        { key: 'delayHrs', label: 'DELAY HRS' },
                        { key: 'actualEfficiency', label: 'ACTUAL EFFICIENCY' }
                      ].map(
                        (h) => (
                          <TableCell
                            key={h.label}
                            onClick={() => {
                              if (!h.key) return;
                              if (devSortCol === h.key) setDevSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                              else {
                                setDevSortCol(h.key);
                                setDevSortDir('asc');
                              }
                            }}
                            sx={{
                              position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                              fontWeight: 700, py: 0.5, fontSize: '11px',
                              textAlign: h.label === 'Developer' ? 'left' : 'center',
                              cursor: h.key ? 'pointer' : 'default',
                              WebkitUserSelect: 'none', userSelect: 'none',
                              '&:hover': h.key ? { color: '#6366F1' } : {}
                            }}
                          >
                            {h.label}
                            {h.key && (
                              <Box component="span" sx={{ fontSize: '10px', ml: 0.3, color: devSortCol === h.key ? '#6366F1' : 'inherit' }}>
                                {devSortCol === h.key ? (devSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                              </Box>
                            )}
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} sx={{ textAlign: 'center', py: 4, color: textMuted }}>
                          No data available.
                        </TableCell>
                      </TableRow>
                    )}
                    {([...devStats].sort((a, b) => {
                      const col = devSortCol;
                      const aVal = typeof a[col] === 'string' ? a[col].toLowerCase() : (a[col] || 0);
                      const bVal = typeof b[col] === 'string' ? b[col].toLowerCase() : (b[col] || 0);
                      if (aVal < bVal) return devSortDir === 'asc' ? -1 : 1;
                      if (aVal > bVal) return devSortDir === 'asc' ? 1 : -1;
                      return 0;
                    })).slice(0, 10).map((dev, idx) => {
                      const sparkOpts = {
                        chart: { type: 'line', sparkline: { enabled: true } },
                        stroke: { curve: 'smooth', width: 2 },
                        colors: [getPerfColor(dev.perfStatus)],
                        tooltip: { fixed: { enabled: false } }
                      };
                      return (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textMuted, textAlign: 'center' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ py: 0.5 }}>
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Avatar
                                sx={{
                                  width: 30,
                                  height: 30,
                                  bgcolor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}
                              >
                                {dev.user.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>
                                {dev.user}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textMuted, textAlign: 'center' }}>
                            {formatHHMM(dev.totalHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textMuted, textAlign: 'center' }}>
                            {formatHHMM(dev.assignedHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textColor, textAlign: 'center' }}>
                            {formatHHMM(dev.workingHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 800, color: getPerfColor(dev.perfStatus), textAlign: 'center' }}>
                            {(dev.workEfficiency || 0).toFixed(2)}%
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', py: 0.5 }}>
                            <Chip
                              size="small"
                              label={dev.perfStatus}
                              icon={getPerfIcon(dev.perfStatus)}
                              sx={{
                                bgcolor: getPerfBg(dev.perfStatus),
                                color: getPerfColor(dev.perfStatus),
                                fontWeight: 700,
                                fontSize: '11px',
                                border: `1px solid ${getPerfBorder(dev.perfStatus)}`,
                                '& .MuiChip-icon': { fontSize: 14 }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', py: 0.5, width: 80 }}>
                            <ReactApexChart options={sparkOpts} series={[{ data: dev.trend }]} type="line" height={25} width={70} />
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 800, color: '#3B82F6', textAlign: 'center' }}>
                            {(dev.loadPercentage || 0).toFixed(2)}%
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textMuted, textAlign: 'center' }}>
                            {dev.taskCount || 0}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: textMuted, textAlign: 'center' }}>
                            {formatHHMM(dev.takenHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: dev.reworkHrs > 0 ? '#EF4444' : textMuted, textAlign: 'center' }}>
                            {formatHHMM(dev.reworkHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 700, color: dev.delayHrs > 0 ? '#F59E0B' : '#10B981', textAlign: 'center' }}>
                            {formatHHMM(dev.delayHrs)}
                          </TableCell>
                          <TableCell sx={{ py: 0.5, fontWeight: 800, color: '#8B5CF6', textAlign: 'center' }}>
                            {(dev.actualEfficiency || 0).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Spacer row to push total to bottom */}
                    {devStats.length > 0 && (
                      <TableRow sx={{ height: '100%', border: 0 }}>
                        <TableCell colSpan={14} sx={{ border: 0, p: 0 }} />
                      </TableRow>
                    )}
                    {/* Total Row */}
                    {devStats.length > 0 && (
                      <TableRow sx={{ bgcolor: isDark ? 'rgba(59,130,246,0.08)' : '#EFF6FF' }}>
                        <TableCell sx={{ border: 0 }} />
                        <TableCell sx={{ py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">Total</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(devStats.reduce((s, d) => s + (d.totalHrs || 0), 0))}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(totalAssigned)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(devStats.reduce((s, d) => s + (d.workingHrs || 0), 0))}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{devStats.reduce((s, d) => s + (d.taskCount || 0), 0)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(totalTaken)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(totalRework)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6">{formatHHMM(totalDelay)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', py: 1, border: 0 }}><Typography variant="body2" color="text.secondary">-</Typography></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>

          {/* Status Summary Cards with 3D mascots */}
          <Box sx={{ flexShrink: 0, width: { xs: '100%', lg: 280 } }}>
            <Stack spacing={1.5} sx={{ height: '100%', justifyContent: 'space-between' }}>
              {[
                { status: 'Outstanding', devs: outstandingDevs, desc: 'Completed less than assigned', SVG: GreenHappySVG, grad: isDark ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #cffafe 100%)' },
                { status: 'Perfect', devs: perfectDevs, desc: 'Completed exactly as assigned', SVG: BlueBullseyeSVG, grad: isDark ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)' },
                { status: 'Low', devs: lowDevs, desc: 'Completed more than assigned', SVG: RedSadSVG, grad: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(239,68,68,0.2) 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%)' }
              ].map((grp, i) => (
                <Card
                  key={i}
                  sx={{
                    p: 1.5,
                    background: grp.grad,
                    border: `1px solid ${getPerfBorder(grp.status)}`,
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    flex: 1,
                    maxHeight: 180,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Dotted pattern top right */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12, opacity: 0.4 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="2" cy="2" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="10" cy="2" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="18" cy="2" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="2" cy="10" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="10" cy="10" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="18" cy="10" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="2" cy="18" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="10" cy="18" r="1.5" fill={getPerfColor(grp.status)} />
                      <circle cx="18" cy="18" r="1.5" fill={getPerfColor(grp.status)} />
                    </svg>
                  </Box>

                  {/* Wave bottom right */}
                  <Box sx={{ position: 'absolute', bottom: -5, right: -5, opacity: 0.15, width: '65%' }}>
                    <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                      <path fill={getPerfColor(grp.status)} d="M0,100 C50,100 80,40 200,60 L200,100 Z" />
                      <path fill={getPerfColor(grp.status)} opacity="0.5" d="M0,100 C60,80 120,30 200,50 L200,100 Z" />
                    </svg>
                  </Box>

                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                      <Box sx={{ flexShrink: 0, p: 0.5, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.6)', boxShadow: `0 8px 16px ${alpha(getPerfColor(grp.status), 0.15)}` }}>
                        <grp.SVG />
                      </Box>
                      <Box>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 1,
                            py: 0.2,
                            borderRadius: 20,
                            bgcolor: getPerfColor(grp.status),
                            mb: 0.5
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} color="white" sx={{ fontSize: '0.65rem' }}>
                            {grp.status}
                          </Typography>
                          {grp.status === 'Outstanding' && <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>✨</Typography>}
                        </Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ lineHeight: 1.1, display: 'block', fontSize: '0.65rem' }}>
                          {grp.desc}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ display: 'flex', borderTop: `1px dashed ${alpha(getPerfColor(grp.status), 0.3)}`, pt: 1, mt: 0.5 }}>
                      <Box flex={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0} sx={{ fontSize: '0.6rem' }}>
                          Total Developers
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={900} color={getPerfColor(grp.status)}>
                          {grp.devs.length} <Typography component="span" variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.6rem' }}>({activeDev > 0 ? Math.round((grp.devs.length / activeDev) * 100) : 0}%)</Typography>
                        </Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0} sx={{ fontSize: '0.6rem' }}>
                          Total Consumed
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={900} color={getPerfColor(grp.status)}>
                          {formatHHMM(grp.devs.reduce((s, d) => s + d.completedHrs, 0))}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* ── PREMIUM LIGHT DASHBOARD BOTTOM 4-BOX LAYOUT ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
          width: '100%',
          '@keyframes floatObj': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
          '@keyframes driveFast': { '0%': { transform: 'translateX(10px) skewX(10deg)' }, '50%': { transform: 'translateX(-15px) skewX(15deg) translateY(-2px)' }, '100%': { transform: 'translateX(10px) skewX(10deg)' } },
          '@keyframes driveMedium': { '0%, 100%': { transform: 'translateX(4px)' }, '50%': { transform: 'translateX(-8px) translateY(-1px)' } },
          '@keyframes breakdown': { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-5deg) translateY(2px)' }, '50%': { transform: 'rotate(5deg) translateY(-2px)' }, '75%': { transform: 'rotate(-5deg) translateY(2px)' } }
        }}>

          {/* 1. Team Performance Trend (Top Left) */}
          <Box>
            <Card sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
              color: '#0F172A',
              height: '290px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 1,
              '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }
            }}>
              {/* Header badge style */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }}>
                  <Typography sx={{ fontSize: '1rem' }}>💠</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#1E293B" sx={{ letterSpacing: 0.5 }}>PERFORMANCE</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', pl: 0.5 }}>Trend across all developers</Typography>

              <Box mt={0} sx={{ position: 'relative', zIndex: 2, mx: -1, '& .apexcharts-series path': { filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.1))' } }}>
                <ReactApexChart
                  options={{
                    ...trendOptions,
                    chart: { type: 'line', toolbar: { show: false }, foreColor: '#64748B', fontFamily: "'Inter',sans-serif", background: 'transparent' },
                    grid: { borderColor: '#F8FAFC', strokeDashArray: 0, position: 'back', xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: -10, bottom: -10, left: 10, right: 10 } },
                    tooltip: { theme: 'light' },
                    colors: trendColors.length > 0 ? trendColors : ['#10B981'],
                    stroke: { curve: 'smooth', width: 3 },
                    markers: { size: 4, colors: ['#fff'], strokeColors: trendColors.length > 0 ? trendColors : ['#10B981'], strokeWidth: 2, hover: { size: 6 } },
                    legend: { show: false },
                    xaxis: { ...trendOptions.xaxis, labels: { style: { colors: '#94A3B8', fontSize: '9px', fontWeight: 600 } } },
                    yaxis: { ...trendOptions.yaxis, labels: { show: false } }
                  }}
                  series={trendSeries}
                  type="line"
                  height={120}
                />
              </Box>

              <Stack direction="row" justifyContent="space-between" gap={1} sx={{ position: 'relative', zIndex: 2 }}>
                <Box flex={1} sx={{ bgcolor: 'rgba(16,185,129,0.05)', p: 1, borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#10B981', fontSize: '0.6rem', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Outstanding</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#0F172A" sx={{ lineHeight: 1, mt: 0.2 }}>{outstandingDevs.length > 0 ? (outstandingDevs.reduce((s, d) => s + d.actualPerformance, 0) / outstandingDevs.length).toFixed(2) : '0.00'}%</Typography>
                </Box>
                <Box flex={1} sx={{ bgcolor: 'rgba(59,130,246,0.05)', p: 1, borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B82F6', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#3B82F6', fontSize: '0.6rem', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Perfect</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#0F172A" sx={{ lineHeight: 1, mt: 0.2 }}>{perfectDevs.length > 0 ? (perfectDevs.reduce((s, d) => s + d.actualPerformance, 0) / perfectDevs.length).toFixed(2) : '0.00'}%</Typography>
                </Box>
                <Box flex={1} sx={{ bgcolor: 'rgba(245,158,11,0.05)', p: 1, borderRadius: '12px', border: '1px solid rgba(245,158,11,0.1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.6rem', display: 'block', fontWeight: 800, textTransform: 'uppercase' }}>Low</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#0F172A" sx={{ lineHeight: 1, mt: 0.2 }}>{lowDevs.length > 0 ? (lowDevs.reduce((s, d) => s + d.actualPerformance, 0) / lowDevs.length).toFixed(2) : '0.00'}%</Typography>
                </Box>
              </Stack>
            </Card>
          </Box>

          {/* 2. Top Performer Spotlight (Top Right) */}
          <Box>
            <Card sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
              color: '#0F172A',
              height: '290px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 1,
              '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }
            }}>
              {/* Crown badge header */}
              <Stack direction="row" alignItems="center" justifyContent="center" mb={0}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px', background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', color: '#fff' }}>
                  <Typography sx={{ fontSize: '1rem' }}>👑</Typography>
                  <Typography variant="subtitle2" fontWeight={900} sx={{ letterSpacing: 1, color: '#fff' }}>TOP PERFORMER</Typography>
                </Box>
              </Stack>

              <Stack direction="column" alignItems="center" mt={0} gap={0.5} textAlign="center" sx={{ position: 'relative' }}>
                <Box sx={{ flexShrink: 0, width: '100%', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', mb: 0, zIndex: 2 }}>
                  <Box sx={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 }} />
                  <Typography sx={{ fontSize: '8rem', animation: 'floatObj 4s ease-in-out infinite', filter: 'drop-shadow(0 15px 20px rgba(245,158,11,0.4))', position: 'relative', zIndex: 2 }}>🏆</Typography>
                  <Typography sx={{ position: 'absolute', top: 5, left: '25%', fontSize: '1.5rem', opacity: 0.8, animation: 'floatObj 3s ease-in-out infinite', filter: 'drop-shadow(0 5px 10px rgba(245,158,11,0.3))' }}>✨</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '100%' }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="h5" fontWeight={900} fontStyle="italic" color="#0F172A" sx={{ letterSpacing: 1 }}>{topPerformers.length > 0 ? topPerformers[0].user : 'None'}</Typography>
                    <Chip label="#1" sx={{ background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', color: '#fff', fontWeight: 900, height: 20, fontSize: '0.65rem', borderRadius: 1, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }} />
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, color: '#F59E0B', textShadow: '0 2px 8px rgba(245,158,11,0.2)' }}>{topPerformers.length > 0 ? topPerformers[0].actualPerformance.toFixed(2) : '0.00'}%</Typography>
                    <Chip icon={<Typography sx={{ fontSize: '10px', color: '#fff' }}>★</Typography>} label="OUTSTANDING" sx={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', color: '#fff', fontWeight: 800, height: 22, fontSize: '0.6rem', borderRadius: 1, boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }} />
                  </Stack>

                  <Stack direction="row" gap={1.5} justifyContent="space-between" width="100%">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, p: 1, borderRadius: '12px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 4px rgba(139,92,246,0.3)' }}><EventAvailableRoundedIcon sx={{ fontSize: 14 }} /></Box>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.55rem', display: 'block', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase' }}>Assigned</Typography>
                        <Typography variant="subtitle2" fontWeight={900} color="#0F172A" sx={{ lineHeight: 1.2 }}>{topPerformers.length > 0 ? formatHHMM(topPerformers[0].assignedHrs) : '00:00'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, p: 1, borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}><CheckCircleRoundedIcon sx={{ fontSize: 14 }} /></Box>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.55rem', display: 'block', lineHeight: 1, fontWeight: 700, textTransform: 'uppercase' }}>Completed</Typography>
                        <Typography variant="subtitle2" fontWeight={900} color="#0F172A" sx={{ lineHeight: 1.2 }}>{topPerformers.length > 0 ? formatHHMM(topPerformers[0].completedHrs) : '00:00'}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Stack>

            </Card>
          </Box>

          {/* 3. Time Efficiency Analysis (Bottom Left) */}
          <Box>
            <Card sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
              color: '#0F172A',
              height: '290px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 1,
              '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }
            }}>
              {/* Efficiency badge header */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 2px 8px rgba(16,185,129,0.08)' }}>
                  <Typography sx={{ fontSize: '1rem' }}>⚡</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#1E293B" sx={{ letterSpacing: 0.5 }}>PERFORMANCE</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', pl: 0.5 }}>Assigned vs Completed</Typography>

              <Stack direction="row" justifyContent="space-between" mt={1} gap={1} px={0} sx={{ flex: 1, pt: 1 }}>
                {/* Less - Green */}
                <Box flex={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', position: 'relative' }}>
                  <Typography variant="h4" fontWeight={900} color="#10B981" sx={{ lineHeight: 1, mb: 1 }}>{outstandingDevs.length}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <Box sx={{ width: '100%', borderBottom: '3px dashed #CBD5E1', position: 'absolute', top: '70%', zIndex: 0 }} />
                    <Typography sx={{ fontSize: '4.5rem', filter: 'drop-shadow(0 15px 15px rgba(16,185,129,0.4)) hue-rotate(-50deg)', animation: 'driveFast 0.8s ease-in-out infinite', zIndex: 1 }}>🏎️</Typography>
                  </Box>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Chip label="LESS TIME" sx={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', color: '#fff', height: 22, fontSize: '0.6rem', fontWeight: 900, borderRadius: 1.5, width: '90%', mb: 0.5, boxShadow: '0 2px 5px rgba(16,185,129,0.3)' }} />
                    <Typography variant="caption" fontWeight={700} color="#64748B" display="block" sx={{ fontSize: '0.6rem' }}>{activeDev > 0 ? Math.round((outstandingDevs.length / activeDev) * 100) : 0}% of Team</Typography>
                  </Box>
                </Box>

                {/* Equal - Blue */}
                <Box flex={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', position: 'relative' }}>
                  <Typography variant="h4" fontWeight={900} color="#3B82F6" sx={{ lineHeight: 1, mb: 1 }}>{perfectDevs.length}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <Box sx={{ width: '100%', borderBottom: '3px dashed #CBD5E1', position: 'absolute', top: '70%', zIndex: 0 }} />
                    <Typography sx={{ fontSize: '4.5rem', filter: 'drop-shadow(0 15px 15px rgba(59,130,246,0.4)) hue-rotate(180deg)', animation: 'driveMedium 1.2s ease-in-out infinite', zIndex: 1 }}>🏎️</Typography>
                  </Box>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Chip label="ON TIME" sx={{ background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)', color: '#fff', height: 22, fontSize: '0.6rem', fontWeight: 900, borderRadius: 1.5, width: '90%', mb: 0.5, boxShadow: '0 2px 5px rgba(59,130,246,0.3)' }} />
                    <Typography variant="caption" fontWeight={700} color="#64748B" display="block" sx={{ fontSize: '0.6rem' }}>{activeDev > 0 ? Math.round((perfectDevs.length / activeDev) * 100) : 0}% of Team</Typography>
                  </Box>
                </Box>

                {/* More - Red */}
                <Box flex={1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', position: 'relative' }}>
                  <Typography variant="h4" fontWeight={900} color="#EF4444" sx={{ lineHeight: 1, mb: 1 }}>{lowDevs.length}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', width: '100%' }}>
                    <Box sx={{ width: '100%', borderBottom: '3px dashed #CBD5E1', position: 'absolute', top: '70%', zIndex: 0 }} />
                    <Typography sx={{ fontSize: '4.5rem', filter: 'drop-shadow(0 15px 15px rgba(239,68,68,0.4))', animation: 'breakdown 0.6s ease-in-out infinite', zIndex: 1 }}>🏎️</Typography>
                  </Box>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Chip label="MORE TIME" sx={{ background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)', color: '#fff', height: 22, fontSize: '0.6rem', fontWeight: 900, borderRadius: 1.5, width: '90%', mb: 0.5, boxShadow: '0 2px 5px rgba(239,68,68,0.3)' }} />
                    <Typography variant="caption" fontWeight={700} color="#64748B" display="block" sx={{ fontSize: '0.6rem' }}>{activeDev > 0 ? Math.round((lowDevs.length / activeDev) * 100) : 0}% of Team</Typography>
                  </Box>
                </Box>
              </Stack>
            </Card>
          </Box>

          {/* 4. Team Quality Score (Bottom Right) */}
          <Box>
            <Card sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
              color: '#0F172A',
              height: '290px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '24px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 1,
              '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }
            }}>
              {/* Quality badge header */}
              <Stack direction="row" alignItems="flex-start" mb={0}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 2px 8px rgba(139,92,246,0.08)' }}>
                  <Typography sx={{ fontSize: '1rem' }}>🎯</Typography>
                  <Typography variant="subtitle2" fontWeight={900} color="#1E293B" sx={{ letterSpacing: 0.5 }}>QUALITY</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', pl: 0.5 }}>Team performance score</Typography>

              <Stack direction="column" alignItems="center" mt={0} gap={1} sx={{ flex: 1, justifyContent: 'center' }}>
                {/* Radial Gauge */}
                <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', mt: -1 }}>
                  <Box sx={{ position: 'absolute', top: '10%', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(255,255,255,0) 65%)', zIndex: 0 }} />
                  <Typography sx={{ position: 'absolute', top: '20%', left: '15%', fontSize: '1.5rem', opacity: 0.9, animation: 'floatObj 4s ease-in-out infinite', filter: 'drop-shadow(0 5px 10px rgba(245,158,11,0.3))' }}>⭐</Typography>
                  <Typography sx={{ position: 'absolute', top: '35%', right: '10%', fontSize: '2rem', opacity: 1, animation: 'floatObj 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 15px rgba(245,158,11,0.4))' }}>🎖️</Typography>
                  <Box sx={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 10px 15px rgba(139,92,246,0.3))' }}>
                    <ReactApexChart
                      options={{
                        chart: { type: 'radialBar', fontFamily: "'Inter',sans-serif", background: 'transparent' },
                        plotOptions: {
                          radialBar: {
                            hollow: { size: '60%' },
                            track: { background: 'rgba(241,245,249,0.5)', strokeWidth: '100%', margin: 5 },
                            dataLabels: {
                              name: { show: true, color: '#64748B', fontSize: '10px', fontWeight: 800, offsetY: 20 },
                              value: { show: true, color: '#0F172A', fontSize: '32px', fontWeight: 900, offsetY: -5, formatter: function (v) { return v + '%' } }
                            }
                          }
                        },
                        fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', gradientToColors: ['#A855F7'], stops: [0, 100] } },
                        colors: ['#6366F1'],
                        stroke: { lineCap: 'round', curve: 'smooth' },
                        labels: ['SCORE']
                      }}
                      series={[Number(avgPerf) || 0]}
                      type="radialBar"
                      height={200}
                    />
                  </Box>
                </Box>


              </Stack>
            </Card>
          </Box>

        </Box>

      </Box>

      {/* ── View All Developer Performance - Full Page Screen ── */}
      <Dialog fullScreen open={showDevViewAll} onClose={() => setShowDevViewAll(false)} PaperProps={{ sx: { bgcolor: isDark ? '#0F172A' : '#F8FAFF' } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Box sx={{
            px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            bgcolor: isDark ? '#0F172A' : '#fff', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <Stack direction="row" alignItems="center" gap={2}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpRoundedIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: '1.1rem' }}>
                  All Developer Performance
                </Typography>
                <Typography variant="caption" color="text.secondary">Comprehensive developer productivity report</Typography>
              </Box>
            </Stack>

            <Typography variant="subtitle1" fontWeight={700} color={textMuted} sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', opacity: 0.8 }}>
              {getDateRangeText()}
            </Typography>

            <Stack direction="row" alignItems="center" gap={2}>
              <Select
                size="small"
                value={viewAllFilterType}
                onChange={(e) => {
                  setViewAllFilterType(e.target.value);
                }}
                sx={{ minWidth: 120, bgcolor: isDark ? '#1E293B' : '#fff' }}
              >
                <MenuItem value="All">All Time</MenuItem>
                <MenuItem value="Daily">Day</MenuItem>
                <MenuItem value="Weekly">Week</MenuItem>
                <MenuItem value="Monthly">Month</MenuItem>
                <MenuItem value="Custom">Custom</MenuItem>
              </Select>

              {viewAllFilterType === 'Custom' && (
                <Stack direction="row" alignItems="center" gap={1}>
                  <TextField size="small" type="date" value={viewAllFromDate} onChange={e => setViewAllFromDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} sx={{ bgcolor: isDark ? '#1E293B' : '#fff' }} />
                  <TextField size="small" type="date" value={viewAllToDate} onChange={e => setViewAllToDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} sx={{ bgcolor: isDark ? '#1E293B' : '#fff' }} />
                </Stack>
              )}

              {(() => {
                const getExportTitle = () => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const fmt = (d) => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '';
                  
                  if (viewAllFilterType === 'Daily') return `DAILY REPORT DATE ${fmt(today)}`;
                  if (viewAllFilterType === 'Weekly') {
                    const day = today.getDay();
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(today.setDate(diff));
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    return `WEEKLY REPORT DATE ${fmt(monday)} - ${fmt(sunday)}`;
                  }
                  if (viewAllFilterType === 'Monthly') {
                    const start = new Date(today.getFullYear(), today.getMonth(), 1);
                    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    return `MONTHLY REPORT DATE ${fmt(start)} - ${fmt(end)}`;
                  }
                  if (viewAllFilterType === 'Custom') {
                    return `PERFORMANCE REPORT FROM ${viewAllFromDate ? fmt(new Date(viewAllFromDate)) : 'BEGINNING'} TO ${viewAllToDate ? fmt(new Date(viewAllToDate)) : 'TODAY'}`;
                  }
                  return 'ALL TIME PERFORMANCE REPORT';
                };

                return (
                  <BOSExportButton
                    ignoreGlobalFilters={true}
                    data={filteredModalDevStats.map((d, index) => ({
                      ...d,
                      slNo: index + 1,
                      assignedHrs: typeof d.assignedHrs === 'number' ? Number(d.assignedHrs.toFixed(2)) : d.assignedHrs,
                      workingHrs: typeof d.workingHrs === 'number' ? Number(d.workingHrs.toFixed(2)) : d.workingHrs,
                      workEfficiency: typeof d.workEfficiency === 'number' ? Number(d.workEfficiency.toFixed(2)) : d.workEfficiency,
                      loadPercentage: typeof d.loadPercentage === 'number' ? Number(d.loadPercentage.toFixed(2)) : d.loadPercentage,
                      actualEfficiency: typeof d.actualEfficiency === 'number' ? Number(d.actualEfficiency.toFixed(2)) : d.actualEfficiency,
                      takenHrs: typeof d.takenHrs === 'number' ? Number(d.takenHrs.toFixed(2)) : d.takenHrs,
                      reworkHrs: typeof d.reworkHrs === 'number' ? Number(d.reworkHrs.toFixed(2)) : d.reworkHrs,
                      delayHrs: typeof d.delayHrs === 'number' ? Number(d.delayHrs.toFixed(2)) : d.delayHrs,
                      totalHrs: typeof d.totalHrs === 'number' ? Number(d.totalHrs.toFixed(2)) : d.totalHrs
                    }))}
                    filename={`Performance_Report_FROM_${viewAllFromDate ? new Date(viewAllFromDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Beginning'}_TO_${viewAllToDate ? new Date(viewAllToDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'Today'}`}
                    reportTitle={getExportTitle()}
                    screenColumns={[
                  { key: 'slNo', label: 'SL No' },
                  { key: 'user', label: 'Developer' },
                  { key: 'totalHrs', label: 'Total Hrs' },
                  { key: 'assignedHrs', label: 'Assigned Hrs' },
                  { key: 'workingHrs', label: 'Worked Hrs' },
                  { key: 'workEfficiency', label: 'Work Efficiency %' },
                  { key: 'perfStatus', label: 'Status' },
                  { key: 'loadPercentage', label: 'Load Efficiency %' },
                  { key: 'taskCount', label: 'Task Count' },
                  { key: 'takenHrs', label: 'Taken Hrs' },
                  { key: 'reworkHrs', label: 'Rework Hrs' },
                  { key: 'delayHrs', label: 'Delay Hrs' },
                  { key: 'actualEfficiency', label: 'Actual Efficiency' }
                ]}
              />
              );
              })()}

              <IconButton onClick={() => setShowDevViewAll(false)} sx={{ color: textMuted, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`, borderRadius: 2, p: 0.7, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' } }}>
                <Typography fontWeight={700} fontSize="1.2rem" lineHeight={1}>✕</Typography>
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'transparent'}`, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flexGrow: 1, maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDark ? '#1E293B' : '#F8FAFC' }}>
                      {[
                        { key: null, label: '#', icon: '#' },
                        { key: 'user', label: 'DEVELOPER', icon: '👤' },
                        { key: 'totalHrs', label: 'TOTAL HRS', icon: '🗓' },
                        { key: 'assignedHrs', label: 'ASSIGNED HRS', icon: '📋' },
                        { key: 'workingHrs', label: 'WORKED HRS', icon: '✅' },
                        { key: 'workEfficiency', label: 'WORK EFFICIENCY %', icon: '📈' },
                        { key: 'perfStatus', label: 'STATUS', icon: '🏷' },
                        { key: null, label: 'TREND', icon: '' },
                        { key: 'loadPercentage', label: 'LOAD EFFICIENCY %', icon: '📊' },
                        { key: 'taskCount', label: 'TASK COUNT', icon: '📝' },
                        { key: 'takenHrs', label: 'TAKEN HRS', icon: '⏱' },
                        { key: 'reworkHrs', label: 'REWORK HRS', icon: '🔄' },
                        { key: 'delayHrs', label: 'DELAY HRS', icon: '⚠' },
                        { key: 'actualEfficiency', label: 'ACTUAL EFFICIENCY', icon: '⚡' }
                      ].map(({ key, label, icon }) => (
                        <TableCell
                          key={label}
                          onClick={() => {
                            if (!key) return;
                            if (devSortCol === key) setDevSortDir(d => d === 'asc' ? 'desc' : 'asc');
                            else { setDevSortCol(key); setDevSortDir('asc'); }
                          }}
                          sx={{
                            position: 'sticky', top: 0, zIndex: 2, backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                            fontWeight: 700, fontSize: '13px',
                            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B',
                            textAlign: label === 'Developer' ? 'left' : 'center',
                            cursor: key ? 'pointer' : 'default',
                            WebkitUserSelect: 'none', userSelect: 'none', whiteSpace: 'nowrap',
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                            py: 2,
                            '&:hover': key ? { color: '#6366F1' } : {}
                          }}
                        >
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            {icon && <Box component="span" sx={{ mr: 0.3, opacity: 0.7 }}>{icon}</Box>}
                            {label}
                            {key && (
                              <Box component="span" sx={{ fontSize: '10px', ml: 0.3, color: devSortCol === key ? '#6366F1' : 'inherit' }}>
                                {devSortCol === key ? (devSortDir === 'asc' ? '▲' : '▼') : '⇅'}
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...filteredModalDevStats].sort((a, b) => {
                      const col = devSortCol;
                      const aVal = typeof a[col] === 'string' ? a[col].toLowerCase() : (a[col] || 0);
                      const bVal = typeof b[col] === 'string' ? b[col].toLowerCase() : (b[col] || 0);
                      if (aVal < bVal) return devSortDir === 'asc' ? -1 : 1;
                      if (aVal > bVal) return devSortDir === 'asc' ? 1 : -1;
                      return 0;
                    }).map((dev, idx) => {
                      const sparkOpts = {
                        chart: { type: 'line', sparkline: { enabled: true } },
                        stroke: { curve: 'smooth', width: 2.5 },
                        colors: [getPerfColor(dev.perfStatus)],
                        tooltip: { fixed: { enabled: false } }
                      };
                      return (
                        <TableRow key={idx} hover onDoubleClick={() => setSelectedDevTasksModal(dev)} sx={{
                          cursor: 'pointer',
                          '&:last-child td': { border: 0 },
                          '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.04)' : '#F8FAFF' },
                          transition: 'background 0.15s'
                        }}>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell sx={{ py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}` }}>
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: AVATAR_COLORS[idx % AVATAR_COLORS.length], fontSize: '15px', fontWeight: 700, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                {dev.user.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontSize: '14px' }}>{dev.user}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>Developer</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(dev.totalHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(dev.assignedHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px', color: isDark ? '#fff' : '#1E293B' }}>{formatHHMM(dev.workingHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: getPerfColor(dev.perfStatus), py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{(dev.workEfficiency || 0).toFixed(2)}%</TableCell>
                          <TableCell sx={{ textAlign: 'center', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}` }}>
                            <Chip size="small" label={dev.perfStatus} icon={getPerfIcon(dev.perfStatus)}
                              sx={{ bgcolor: getPerfBg(dev.perfStatus), color: getPerfColor(dev.perfStatus), fontWeight: 800, fontSize: '12px', border: `1px solid ${getPerfBorder(dev.perfStatus)}`, '& .MuiChip-icon': { fontSize: 16 } }} />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', width: 100, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}` }}>
                            <ReactApexChart options={sparkOpts} series={[{ data: dev.trend }]} type="line" height={32} width={85} />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#3B82F6', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{(dev.loadPercentage || 0).toFixed(2)}%</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{dev.taskCount || 0}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(dev.takenHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: dev.reworkHrs > 0 ? '#EF4444' : textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(dev.reworkHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700, color: dev.delayHrs > 0 ? '#F59E0B' : '#10B981', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(dev.delayHrs)}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 800, color: '#8B5CF6', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{(dev.actualEfficiency || 0).toFixed(2)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Box>
      </Dialog>

      {/* ── Developer Tasks Modal ── */}
      <Dialog open={!!selectedDevTasksModal} onClose={() => setSelectedDevTasksModal(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: isDark ? '#0F172A' : '#F8FAFF', borderRadius: 3, overflow: 'hidden' } }}>
        {selectedDevTasksModal && (() => {
          const devTasks = realTasks.filter(t => (t._user || 'Unknown').toLowerCase() === selectedDevTasksModal.user.toLowerCase());
          
          let modalTotalAssigned = 0;
          let modalTotalTaken = 0;
          let modalTotalRework = 0;
          let modalTotalDelay = 0;

          const processedTasks = devTasks.map((t) => {
            const t_hrs = t._hrs ? (parseDurationToMinutes(t._hrs) / 60) || 8 : 8;
            const t_takenHrs = t._takenHrs || 0;
            const t_reworkHrs = t._reworkHrs || 0;
            
            let t_delayHrs = 0;
            const stUpper = String(t._status || '').toUpperCase();
            const isDevDone = ['COMPLETED', 'VERIFIED', 'APPROVED', 'CLOSED', 'RESOLVED', 'TO BE VERIFIED', 'TO BE TESTED'].some(s => stUpper.includes(s));
            const isOpenOrInProgressOrReopen = ['OPEN', 'IN PROGRESS', 'REOPENED', 'RE-OPENED', 'NEW', 'PENDING', 'WIP', 'ASSIGNED', 'REWORK'].some(s => stUpper.includes(s));

            if (t._dueDate) {
              const dueDate = new Date(t._dueDate);
              dueDate.setHours(18, 0, 0, 0); 
              if (isOpenOrInProgressOrReopen) {
                const now = new Date();
                if (now > dueDate) {
                  const delayMs = calculateWorkingMs(dueDate, now, holidayList);
                  t_delayHrs = delayMs / (1000 * 60 * 60);
                }
              } else if (isDevDone && (t._updatedDate || t._createdDate)) {
                const cd = new Date(t._updatedDate || t._createdDate);
                if (cd > dueDate) {
                  const delayMs = calculateWorkingMs(dueDate, cd, holidayList);
                  t_delayHrs = delayMs / (1000 * 60 * 60);
                }
              }
            }

            modalTotalAssigned += t_hrs;
            modalTotalTaken += t_takenHrs;
            modalTotalRework += t_reworkHrs;
            modalTotalDelay += t_delayHrs;

            return { ...t, t_hrs, t_takenHrs, t_reworkHrs, t_delayHrs, stUpper };
          });

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
              <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`, bgcolor: isDark ? '#0F172A' : '#fff', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Stack direction="row" alignItems="center" gap={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#fff', fontSize: 20 }}>📋</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ fontSize: '1.1rem' }}>
                      {selectedDevTasksModal.user}'s Tasks
                    </Typography>
                    <Typography variant="caption" color="text.secondary">List of tasks assigned to this developer</Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => setSelectedDevTasksModal(null)} sx={{ color: textMuted, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`, borderRadius: 2, p: 0.7, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' } }}>
                  <Typography fontWeight={700} fontSize="1.2rem" lineHeight={1}>✕</Typography>
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 3, overflow: 'auto', bgcolor: isDark ? '#0F172A' : '#F8FAFF' }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'transparent'}`, flexGrow: 1, height: '100%' }}>
                  <TableContainer sx={{ flexGrow: 1, height: '100%', overflow: 'auto' }}>
                    <Table stickyHeader size="medium" sx={{ minHeight: '100%' }}>
                      <TableHead>
                        <TableRow>
                          {['SL No', 'Task No', 'Title', 'Status', 'Target Date', 'Assigned Hrs', 'Taken Hrs', 'Rework Hrs', 'Delay Hrs'].map((label) => (
                            <TableCell key={label} sx={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: isDark ? '#1E293B' : '#F8FAFC', fontWeight: 700, fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.7)' : '#64748B', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`, py: 2 }}>
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedTasks.map((t, i) => {
                          const getTaskColor = (status) => {
                            const s = String(status || '').toUpperCase();
                            if (s.includes('COMPLETED') || s.includes('CLOSED') || s.includes('APPROVED')) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' };
                            if (s.includes('OPEN') || s.includes('NEW') || s.includes('ASSIGNED')) return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' };
                            if (s.includes('PROGRESS') || s.includes('PENDING') || s.includes('WIP')) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' };
                            return { bg: '#FCE8E8', text: '#EF4444' }; // default red/pink
                          };
                          const colorObj = getTaskColor(t._status);

                          return (
                          <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.04)' : '#F8FAFF' }, transition: 'background 0.15s' }}>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#3B82F6', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{t._id}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: isDark ? '#fff' : '#1E293B', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '14px' }}>{t._title}</TableCell>
                            <TableCell sx={{ py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}` }}>
                              <Chip size="small" label={t._status || 'OPEN'} sx={{ fontSize: '0.7rem', fontWeight: 800, borderRadius: 1, bgcolor: colorObj.bg, color: colorObj.text, border: `1px solid ${colorObj.text}40` }} />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{t._dueDate ? new Date(t._dueDate).toLocaleDateString('en-GB') : '-'}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(t.t_hrs)}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(t.t_takenHrs)}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(t.t_reworkHrs)}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}`, fontSize: '13px' }}>{formatHHMM(t.t_delayHrs)}</TableCell>
                          </TableRow>
                          );
                        })}
                        {devTasks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: textMuted, fontWeight: 600 }}>No tasks found for this developer.</TableCell>
                          </TableRow>
                        )}
                        {/* Filler row to push footer to bottom */}
                        {devTasks.length > 0 && (
                          <TableRow sx={{ height: '100%' }}>
                            <TableCell colSpan={9} sx={{ border: 0, p: 0 }} />
                          </TableRow>
                        )}
                      </TableBody>
                      {devTasks.length > 0 && (
                        <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: isDark ? '#1E293B' : '#F8FAFC', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }}>
                          <TableRow>
                            <TableCell colSpan={5} sx={{ fontWeight: 800, color: isDark ? '#fff' : '#1E293B', py: 2, borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderBottom: 0, textAlign: 'right', fontSize: '14px' }}>
                              TOTAL
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderBottom: 0, fontSize: '14px' }}>
                              {formatHHMM(modalTotalAssigned)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderBottom: 0, fontSize: '14px' }}>
                              {formatHHMM(modalTotalTaken)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderBottom: 0, fontSize: '14px' }}>
                              {formatHHMM(modalTotalRework)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: textMuted, py: 2, borderTop: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, borderBottom: 0, fontSize: '14px' }}>
                              {formatHHMM(modalTotalDelay)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </Box>
          );
        })()}
      </Dialog>
    </PageContainer>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#F8FAFC' : '#1E293B';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const { user } = useAuth();
  const activeUserId = user?.id || user?.userId || user?.email || user?.empCode || '';

  const dispatch = useDispatch();
  const [criticalCount, setCriticalCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [healthyCount, setHealthyCount] = useState(0);
  const [devStats, setDevStats] = useState([]);
  const [realTasks, setRealTasks] = useState([]);
  const [holidayList, setHolidayList] = useState([]);
  const globalFilters = useSelector((state) => state.search?.filters || {});
  const filterScope = globalFilters?.performanceScope || 'Mine';
  const filterRequestManagement = globalFilters?.requestManagement || 'Request For Me';
  const filterStatus = globalFilters?.status || 'Active';
  const filterEmpCategory = globalFilters?.empCategory || 'All';

  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.fromTab || 'dashboard');
  const [loading, setLoading] = useState(true);
  const [realData, setRealData] = useState({
    total: 0,
    completed: 0,
    open: 0,
    inProgress: 0,
    toBeTested: 0,
    overdue: 0,
    dueToday: 0,
    reopened: 0
  });
  const [realOverdueTasks, setRealOverdueTasks] = useState([]);
  const [realWorkload, setRealWorkload] = useState([]);

  useEffect(() => {
    const performanceScopeOptions = [
      { value: 'Mine', label: 'Mine' },
      { value: 'Team', label: 'Team' },
      { value: 'Company', label: 'Company' }
    ];

    const requestManagementOptions = [
      { value: 'My Request', label: 'My Request' },
      { value: 'Request For Me', label: 'Request For Me' }
    ];

    const config = [
      {
        id: 'requestManagement',
        label: 'Request Management',
        type: 'select',
        options: requestManagementOptions,
        defaultValue: 'Request For Me',
        isStarred: true
      },
      {
        id: 'performanceScope',
        label: 'Performance Scope',
        type: 'select',
        options: performanceScopeOptions,
        defaultValue: 'Mine',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'In Active', label: 'In Active' }
        ],
        defaultValue: 'Active',
        isStarred: true
      },
      {
        id: 'empCategory',
        label: 'Emp Category',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Consultant', label: 'Consultant' },
          { value: 'Employee', label: 'Employee' },
          { value: 'Contractor', label: 'Contractor' }
        ],
        defaultValue: 'All',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));

    if (location.state?.dashboardFilters) {
      dispatch(setFilters(location.state.dashboardFilters));
    }

    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!activeUserId) return;
    const fetchData = async () => {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const [r3, r5, r6, r7, r8] = await Promise.allSettled([
            axios.get('/api/tickets'),
            axios.get('/api/master/hr/employees'),
            axios.get('/api/bos-pages'),
            axios.get('/api/users/all'),
            axios.get('/api/master/hr/holidays')
          ]);
          const cl = [];
          const mom = [];
          const tk = r3.status === 'fulfilled' ? r3.value.data || [] : [];
          const audit = [];
        const employees = r5.status === 'fulfilled' ? r5.value.data || [] : [];
        const bosPages = r6.status === 'fulfilled' ? r6.value.data || [] : [];
        const usersList = r7.status === 'fulfilled' ? r7.value.data || [] : [];
        const holidaysRaw = r8.status === 'fulfilled' ? (r8.value.data?.content || r8.value.data || []) : [];

        const holidayArray = [];
        holidaysRaw.forEach(h => {
          const d = h.fromDate || h.holidayDate;
          if (d) {
            const dt = new Date(d);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            holidayArray.push({ dateStr: `${yyyy}-${mm}-${dd}` });
          }
        });
        setHolidayList(holidayArray);

        // Build pageId -> pageName lookup
        const pageIdMap = {};
        bosPages.forEach(p => {
          if (p.pageId) pageIdMap[p.pageId] = p.pageName || 'Ticket';
        });

        let empLookup = {};

        employees.forEach((emp) => {
          const fullName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.empCode || 'Unknown';
          if (emp.empCode) empLookup[emp.empCode] = fullName;
          if (emp.userId) empLookup[emp.userId] = fullName;
          if (emp.email) empLookup[emp.email] = fullName;
          if (fullName !== 'Unknown') empLookup[fullName] = fullName;
        });

        const getName = (u) => {
          if (!u) return 'Unknown';
          if (typeof u === 'object') {
            const n = u.employeeName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.empCode;
            return (n && empLookup[n] ? empLookup[n] : n) || 'Unknown';
          }
          return empLookup[u] || u;
        };


        let tasksList = [];
        cl.forEach((a) => {
          const name = getName(a.assignedToObj || a.employee || a.assignedTo);
          tasksList.push({
            _status: a.status?.name || a.status?.statusName || 'Pending',
            _priority: a.priorityLevel || a.priority || 'Medium',
            _dueDate: a.checklistDate || a.assignedDate,
            _title: a.checklist?.checkingPoint || `Checklist #${a.id}`,
            _id: a.checklistNo || `CL-${a.id}`,
            _user: name,
            _rawDate: a.createdAt || a.createdDate || a.assignedDate || a.checklistDate,
            _hrs: a.estimatedHours || a.plannedHours || 8,
            _pageName: a.pageName || a.moduleName || 'Checklist',
            _takenHrs: parseDurationToMinutes(a.takenTime || a.actualHours || '') / 60,
            _reworkHrs: parseDurationToMinutes(a.reworkTime || '') / 60,
            _updatedDate: a.updatedAt || a.updatedDate || a.closedDate || a.completionDate || a.actualDate || a.verifiedDate,
            _createdBy: a.createdBy || 'System'
          });
        });
        mom.forEach((a) => {
          const name = getName(a.assignedTo);
          tasksList.push({
            _status: a.status || 'Open',
            _priority: a.priorityLevel || a.priority || 'Medium',
            _dueDate: a.targetDate,
            _title: a.discussedPoint || `MOM #${a.id}`,
            _id: a.momNo || a.actionId || `MOM-${a.id}`,
            _user: name,
            _rawDate: a.createdAt || a.createdDate || a.targetDate,
            _hrs: a.estimatedHours || 8,
            _pageName: a.pageName || a.moduleName || 'MOM Actions',
            _takenHrs: parseDurationToMinutes(a.takenTime || a.actualHours || '') / 60,
            _reworkHrs: parseDurationToMinutes(a.reworkTime || '') / 60,
            _reopenCount: a.reopenedCount || 0,
            _updatedDate: a.updatedAt || a.updatedDate || a.closedDate || a.completionDate || a.actualDate || a.verifiedDate,
            _createdBy: a.createdBy || 'System'
          });
        });
        tk.forEach((t) => {
          const name = getName(t.assignedTo);
          tasksList.push({
            _status: t.ticketStatus || 'Open',
            _priority: t.priorityLevel || t.priority || 'Medium',
            _dueDate: t.dueDate || t.targetDate,
            _title: t.title || `Ticket ${t.ticketId || t.rowId}`,
            _id: t.ticketId || `TK-${t.rowId}`,
            _user: name,
            _rawDate: t.createdAt || t.createdDate || t.targetDate,
            _hrs: t.estimatedHours || t.assignedHours || 8,
            _pageName: t.pageName || t.moduleName || (t.pageId ? (pageIdMap[t.pageId] || 'Ticket') : null) || t.ticketType || 'Ticket',
            _takenHrs: parseDurationToMinutes(t.takenTime || '') / 60,
            _reworkHrs: parseDurationToMinutes(t.reworkTime || '') / 60,
            _reopenCount: t.reopenCount || 0,
            _createdBy: t.createdBy || 'System'
          });
        });
        audit.forEach((a) => {
          const name = getName(a.auditee || a.auditor);
          tasksList.push({
            _status: a.status || 'Pending',
            _priority: a.priorityLevel || a.priority || 'Medium',
            _dueDate: a.auditDate || a.scheduleDate,
            _title: `Audit ${a.scheduleNo || ''}`,
            _id: a.scheduleNo || `AUDIT-${a.id}`,
            _user: name,
            _rawDate: a.createdAt || a.createdDate || a.auditDate || a.scheduleDate,
            _hrs: a.estimatedHours || 8,
            _pageName: a.pageName || a.moduleName || 'Audit Schedule',
            _takenHrs: parseDurationToMinutes(a.takenTime || a.actualHours || '') / 60,
            _reworkHrs: parseDurationToMinutes(a.reworkTime || '') / 60,
            _createdBy: a.createdBy || 'System'
          });
        });

        // Build Team User IDs & Names based on: Vertical Head -> EMP_ID
        const myName = (user?.name || '').trim().toLowerCase();
        const currentUserId = (user?.username || user?.userId || user?.id || '').trim().toLowerCase();
        const currentUserName = (user?.name || '').trim().toLowerCase();
        let myEmpName = '';
        if (user?.empId && employees) {
          const emp = employees.find(e => e.id == user.empId || e.empCode == user.empId || e.employeeCode == user.empId);
          if (emp && emp.employeeName) myEmpName = emp.employeeName.trim().toLowerCase();
        }

        const teamIdentifiers = [];
        employees.forEach(b => {
          const vHead = (b.verticalHead || '').trim().toLowerCase();
          if (vHead && (vHead === currentUserId || vHead === currentUserName || (myEmpName && vHead === myEmpName) || (myEmpName && vHead.includes(myEmpName)))) {
            if (b.employeeName) teamIdentifiers.push(b.employeeName.trim().toLowerCase());
            if (b.officeMail) {
              const mail = b.officeMail.trim().toLowerCase();
              teamIdentifiers.push(mail);
              if (mail.includes('@')) teamIdentifiers.push(mail.split('@')[0]);
            }
            const c = usersList.find(u => u.empId == b.id);
            if (c && c.userId) {
              teamIdentifiers.push(c.userId.trim().toLowerCase());
            }
          }
        });
        const matchTeam = (field) => {
          if (!field) return false;
          const f = field.toLowerCase();
          if (f === currentUserId || f === currentUserName || (myEmpName && f === myEmpName)) return true;
          return teamIdentifiers.includes(f);
        };

        let workloadMap = {};
        let devHoursMap = {};

        const activeEmpNames = new Set();
        const inactiveEmpNames = new Set();
        const consultantEmpNames = new Set();
        const employeeEmpNames = new Set();
        const contractorEmpNames = new Set();

        employees.forEach(e => {
            const fullName = e.employeeName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.empCode || 'Unknown';
            const lowerName = fullName.toLowerCase();
            
            if (String(e.status).toLowerCase() === 'active') {
                activeEmpNames.add(lowerName);
            } else {
                inactiveEmpNames.add(lowerName);
            }

            if (e.categoryId === 1) employeeEmpNames.add(lowerName);
            else if (e.categoryId === 2) contractorEmpNames.add(lowerName);
            else if (e.categoryId === 3) consultantEmpNames.add(lowerName);
        });

        const filterUserScope = (uName) => {
          const lowerName = uName.toLowerCase();
          
          if (filterStatus === 'Active' && inactiveEmpNames.has(lowerName)) return false;
          if (filterStatus === 'In Active' && activeEmpNames.has(lowerName)) return false;

          if (filterEmpCategory === 'Consultant' && !consultantEmpNames.has(lowerName)) return false;
          if (filterEmpCategory === 'Employee' && !employeeEmpNames.has(lowerName)) return false;
          if (filterEmpCategory === 'Contractor' && !contractorEmpNames.has(lowerName)) return false;

          if (filterScope === 'Company') return true;
          if (filterRequestManagement === 'My Request') return true;
          const targetField = lowerName;
          if (filterScope === 'Team') {
            return matchTeam(targetField);
          } else {
            return targetField === currentUserId || targetField === currentUserName || targetField === myEmpName || (myEmpName && targetField.includes(myEmpName));
          }
        };

        Object.values(empLookup).forEach((name) => {
          if (filterUserScope(name)) {
            if (!workloadMap[name]) workloadMap[name] = { user: name, hours: 0, tasks: 0 };
            if (!devHoursMap[name]) devHoursMap[name] = { user: name, assignedHrs: 0, completedHrs: 0, takenHrs: 0, reworkHrs: 0, delayHrs: 0, taskCount: 0 };
          }
        });

        const filterTask = (t) => {
            const createdBy = (t._createdBy || '').toLowerCase();
            const assignedTo = (t._user || '').toLowerCase();
  
            if (filterStatus === 'Active' && inactiveEmpNames.has(assignedTo)) return false;
            if (filterStatus === 'In Active' && activeEmpNames.has(assignedTo)) return false;

            if (filterEmpCategory === 'Consultant' && !consultantEmpNames.has(assignedTo)) return false;
            if (filterEmpCategory === 'Employee' && !employeeEmpNames.has(assignedTo)) return false;
            if (filterEmpCategory === 'Contractor' && !contractorEmpNames.has(assignedTo)) return false;

            if (filterScope === 'Company') return true;

          if (filterRequestManagement === 'Request For Me') {
            if (filterScope === 'Team') {
              return matchTeam(assignedTo);
            } else {
              return assignedTo === currentUserId || assignedTo === currentUserName || assignedTo === myEmpName || (myEmpName && assignedTo.includes(myEmpName));
            }
          } else { // My Request
            if (filterScope === 'Team') {
              return matchTeam(createdBy);
            } else {
              return createdBy === currentUserId || createdBy === currentUserName || createdBy === myEmpName || (myEmpName && createdBy.includes(myEmpName));
            }
          }
        };

        tasksList = tasksList.filter(filterTask);

        let stats = { total: tasksList.length, completed: 0, open: 0, inProgress: 0, toBeTested: 0, overdue: 0, dueToday: 0, reopened: 0 };
        today.setHours(0, 0, 0, 0);
        let overdueList = [];


        tasksList.forEach((t) => {
          const st = String(t._status).toLowerCase();
          const isDone = ['completed', 'verified', 'approved', 'closed', 'resolved'].includes(st);
          const isToBeVerified = ['to be verified'].includes(st);
          const isDevDone = isDone || isToBeVerified || ['to be tested'].includes(st);
          let isPastDue = false;
          if (t._dueDate) {
            const d = new Date(t._dueDate);
            d.setHours(0, 0, 0, 0);
            if (today > d) isPastDue = true;
          }
          const hrs = t._hrs ? (parseDurationToMinutes(t._hrs) / 60) || 8 : 8;
          const uName = t._user || 'Unknown';

          if (filterUserScope(uName)) {
            if (!devHoursMap[uName]) devHoursMap[uName] = { user: uName, assignedHrs: 0, completedHrs: 0, takenHrs: 0, reworkHrs: 0, delayHrs: 0, firstDate: null, taskCount: 0 };

            const taskDate = t._rawDate ? new Date(t._rawDate) : (t._dueDate ? new Date(t._dueDate) : new Date());
            if (!devHoursMap[uName].firstDate || taskDate < devHoursMap[uName].firstDate) {
              devHoursMap[uName].firstDate = taskDate;
            }

            let t_takenHrs = t._takenHrs || 0;
            let t_reworkHrs = t._reworkHrs || 0;
            let t_delayHrs = 0;

            const stUpper = st.toUpperCase();
            const isOpenOrInProgressOrReopen = ['OPEN', 'IN PROGRESS', 'REOPENED', 'RE-OPENED', 'NEW', 'PENDING', 'WIP', 'ASSIGNED', 'REWORK'].some(s => stUpper.includes(s));

            if (t._dueDate) {
              const dueDate = new Date(t._dueDate);
              dueDate.setHours(18, 0, 0, 0); // Assuming EOD is 6 PM
              
              if (isOpenOrInProgressOrReopen) {
                const now = new Date();
                if (now > dueDate) {
                  const delayMs = calculateWorkingMs(dueDate, now, holidayArray);
                  t_delayHrs = delayMs / (1000 * 60 * 60);
                }
              } else if (isDevDone && (t._updatedDate || t._createdDate)) {
                const cd = new Date(t._updatedDate || t._createdDate);
                if (cd > dueDate) {
                  const delayMs = calculateWorkingMs(dueDate, cd, holidayArray);
                  t_delayHrs = delayMs / (1000 * 60 * 60);
                }
              }
            }

            devHoursMap[uName].takenHrs += t_takenHrs;
            devHoursMap[uName].reworkHrs += t_reworkHrs;
            devHoursMap[uName].delayHrs += (t_delayHrs || 0);
            devHoursMap[uName].taskCount += 1;

            devHoursMap[uName].assignedHrs += hrs;

            const t_completedHrs = t_takenHrs + t_reworkHrs + t_delayHrs;
            devHoursMap[uName].completedHrs += t_completedHrs;

            if (!isDevDone) {
              if (!workloadMap[uName]) workloadMap[uName] = { user: uName, hours: 0, tasks: 0 };
              workloadMap[uName].tasks += 1;
              workloadMap[uName].hours += hrs;
            }
          }
          if (isDone) stats.completed++;
          if (['open', 'new', 'pending'].includes(st)) stats.open++;
          else if (['in progress', 'wip', 'assigned', 'rework'].includes(st)) stats.inProgress++;
          else if (isToBeVerified) stats.toBeTested++;
          else if (['reopened', 're-opened'].includes(st)) stats.reopened++;
          else if (!isDone) stats.open++;
          if (t._dueDate) {
            const d = new Date(t._dueDate);
            d.setHours(0, 0, 0, 0);
            if (d < today && !isDevDone) {
              stats.overdue++;
              const diff = Math.ceil(Math.abs(today - d) / 864e5);
              overdueList.push({ id: t._id, title: t._title, user: t._user, days: `${diff} Days` });
            } else if (d.getTime() === today.getTime() && !isDevDone) stats.dueToday++;
          }
        });

        const workloadArr = Object.values(workloadMap)
          .map((w) => {
            const days = Math.round(w.hours / 8);
            let percent = Math.min(100, Math.round((w.hours / 40) * 100));
            if (w.hours === 0) percent = 0;
            else if (percent === 0) percent = 1;
            let color = '#10B981', status = 'Healthy';
            if (days < 5) {
              color = '#EF4444';
              status = 'Critical';
            } else if (days === 5) {
              color = '#3B82F6';
              status = 'Normal';
            } else {
              color = '#10B981';
              status = 'Healthy';
            }
            return { ...w, days, percent, color, status };
          })
          .sort((a, b) => a.days - b.days);

        const devStatsArr = Object.values(devHoursMap)
          .filter((d) => d.assignedHrs > 0)
          .map((d) => {
            let assignedHrs = d.assignedHrs || 0;
            let takenHrs = d.takenHrs || 0;
            let reworkHrs = d.reworkHrs || 0;
            let delayHrs = d.delayHrs || 0;

            const workingHrs = d.completedHrs || 0;

            let totalDays = 0;
            if (d.firstDate) {
              const startDate = new Date(d.firstDate);
              startDate.setHours(0, 0, 0, 0);
              const now = new Date();
              now.setHours(23, 59, 59, 999);
              const ms = calculateWorkingMs(startDate, now, holidayArray);
              // calculateWorkingMs assumes 9 hours per day (9 AM to 6 PM)
              // The required formula uses 6 hours per working day.
              const workingDays = Math.ceil(ms / (1000 * 60 * 60 * 9));
              totalDays = workingDays;
            }
            const totalHrs = totalDays * 6;

            const loadPercentage = totalHrs > 0 ? (assignedHrs / totalHrs) * 100 : 0;
            const actualEfficiency = totalHrs > 0 ? (workingHrs / totalHrs) * 100 : 0;
            const workEfficiency = workingHrs > 0 ? (assignedHrs / workingHrs) * 100 : 0;

            let perfStatus = 'Outstanding';
            if (workEfficiency === 100) perfStatus = 'Perfect';
            else if (workEfficiency < 100) perfStatus = 'Low';

            const trend = genTrend(workEfficiency);

            return {
              user: d.user,
              totalHrs,
              assignedHrs,
              takenHrs,
              reworkHrs,
              delayHrs,
              workingHrs,
              completedHrs: d.completedHrs,
              loadPercentage,
              actualEfficiency,
              workEfficiency,
              actualPerformance: workEfficiency,
              perfStatus,
              trend,
              taskCount: d.taskCount
            };
          });

        const statusWeight = { 'Outstanding': 1, 'Perfect': 2, 'Low': 3 };
        devStatsArr.sort((a, b) => {
          if (statusWeight[a.perfStatus] !== statusWeight[b.perfStatus]) {
            return statusWeight[a.perfStatus] - statusWeight[b.perfStatus];
          }
          return a.actualPerformance - b.actualPerformance;
        });

        setRealData(stats);
        setRealOverdueTasks(overdueList.slice(0, 5));
        setRealWorkload(workloadArr);
        setRealTasks(tasksList);
        setDevStats(devStatsArr);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [activeUserId, filterScope, filterRequestManagement, filterStatus, filterEmpCategory]);

  // Workload Logic Based on Total Days
  const isRed = realWorkload.some((w) => w.days < 5);
  const isBlue = realWorkload.some((w) => w.days === 5);

  let workloadAnim = 'none';
  let workloadColor = '#10B981'; // Green (3rd priority)
  let workloadBg = '#F0FDF4';
  let workloadHex = '1f4c8'; // Chart Increasing (Green)

  if (isRed) {
    workloadAnim = pulseRed;
    workloadColor = '#EF4444';
    workloadBg = '#FEF2F2';
    workloadHex = '1f6a8'; // Siren (Red)
  } else if (isBlue) {
    workloadAnim = pulseBlue;
    workloadColor = '#3B82F6';
    workloadBg = '#EFF6FF';
    workloadHex = '1f30a'; // Wave (Blue)
    workloadHex = '1f300'; // Wave (Blue)
  }

  const isCurrentUser = (name) => {
    const currentUserName = (user?.name || '').trim().toLowerCase();
    const currentUsername = (user?.username || user?.userId || user?.id || '').trim().toLowerCase();
    const n = (name || '').trim().toLowerCase();
    return n === currentUserName || n === currentUsername;
  };

  const topStats = [
    { id: 'dashboard', title: 'Overview', value: realData.total, iconHex: '1f4ca', color: '#3B82F6', bg: '#EFF6FF' },
    { id: 'workload', title: 'Work Load', value: realData.total, iconHex: workloadHex, color: workloadColor, bg: workloadBg },
    { id: 'overdue', title: 'Over Due', value: realData.overdue, iconHex: '26a0', color: '#EF4444', bg: '#FEF2F2' },
    { id: 'dueToday', title: 'Due Today', value: realData.dueToday, iconHex: '23f0', color: '#0EA5E9', bg: '#F0F9FF' },
    { id: 'open', title: 'Open', value: realData.open, iconHex: '1f3af', color: '#64748B', bg: '#F1F5F9' },
    { id: 'reopen', title: 'Re Open', value: realData.reopened, iconHex: '1f300', color: '#EAB308', bg: '#FEF9C3' },
    { id: 'inProgress', title: 'In Progress', value: realData.inProgress, iconHex: '2699', color: '#F59E0B', bg: '#FFFBEB' },
    { id: 'toBeTested', title: 'To Be Tested', value: realData.toBeTested, iconHex: '1f4a1', color: '#8B5CF6', bg: '#F5F3FF' },
    { id: 'completed', title: 'Completed', value: realData.completed, iconHex: '1f389', color: '#10B981', bg: '#F0FDF4' }
  ];

  const renderActiveDashboard = () => {
    switch (activeTab) {
      case 'workload':
        return <WorkloadView
          realWorkload={realWorkload}
          isDark={isDark}
          navigate={navigate}
          filterRequestManagement={filterRequestManagement}
          isCurrentUser={isCurrentUser}
          activeTab={activeTab}
          globalFilters={globalFilters}
        />;
      case 'dueToday':
        return <DueTodayDashboard realTasks={realTasks} isDark={isDark} activeTab={activeTab} />;
      case 'reopen':
        return <ReopenDashboard realData={realData} realTasks={realTasks} isDark={isDark} activeTab={activeTab} />;
      case 'Team Productivity':
        return <PerformanceOverview devStats={devStats} realTasks={realTasks} holidayList={holidayList} isDark={isDark} textColor={textColor} textMuted={textMuted} />;
      case 'toBeTested':
        return <ToBeTestedDashboard realTasks={realTasks} isDark={isDark} activeTab={activeTab} />;
      case 'completed':
        return <CompletedDashboard isDark={isDark} realTasks={realTasks} activeTab={activeTab} />;
      case 'inProgress':
        return <InProgressDashboard isDark={isDark} realTasks={realTasks} activeTab={activeTab} />;
      case 'overdue':
        return <OverdueDashboard realTasks={realTasks} isDark={isDark} activeTab={activeTab} />;
      case 'open':
        return <OpenDashboard realTasks={realTasks} isDark={isDark} activeTab={activeTab} />;
      case 'dashboard':
      default:
        return <PerformanceOverview devStats={devStats} realTasks={realTasks} holidayList={holidayList} isDark={isDark} textColor={textColor} textMuted={textMuted} />;
    }
  };

  return (
    <PageContainer
      sx={{
        '@keyframes spin-border': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        '@keyframes sweep': { '0%': { left: '-150%' }, '50%': { left: '150%' }, '100%': { left: '-150%' } },
        '@keyframes float': { '0%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' }, '100%': { transform: 'translateY(0px)' } },
        '@keyframes floatIcon': { '0%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-5px)' }, '100%': { transform: 'translateY(0px)' } },
      }}
    >
      {/* ── TOP STAT PILLS ── */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(4,1fr)', lg: 'repeat(9,1fr)' }, gap: 1.5, mb: 2.5 }}
      >
        {topStats.map((stat, idx) => {
          const isActive = activeTab === stat.id;
          return (
            <TopStatCard
              key={idx}
              onClick={() => setActiveTab(stat.id)}
              sx={{
                border: 'none',
                borderBottom: `4px solid ${stat.color}`,
                bgcolor: isDark ? '#1E293B' : '#FFFFFF',
                transform: isActive ? 'translateY(-4px)' : 'none',
                boxShadow: isActive ? `0 12px 24px ${alpha(stat.color, 0.2)}` : '0 4px 12px rgba(0,0,0,0.05)',
                position: 'relative',
                pt: 1.5,
                pb: 1.5,
                px: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <Box mb={1} sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotoEmoji hex={stat.iconHex} size={48} />
              </Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color={stat.color}
                mb={0.5}
                sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
              >
                {stat.title}
              </Typography>
              <Typography variant="h4" fontWeight={900} color={stat.color} sx={{ lineHeight: 1 }}>
                {stat.value}
              </Typography>
            </TopStatCard>
          );
        })}
      </Box>

      {renderActiveDashboard()}
    </PageContainer>
  );
}



