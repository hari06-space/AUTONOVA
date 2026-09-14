/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { styled, alpha } from '@mui/system';
import ReactApexChart from 'react-apexcharts';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px 0 rgba(0,0,0,0.4)' : '0 4px 20px 0 rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9'}`,
  background: theme.palette.mode === 'dark' ? '#1E293B' : '#FFFFFF',
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}));

import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

const NeonCard = styled(Paper)(({ theme, statcolor }) => ({
  borderRadius: '24px',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(180deg, ${alpha(statcolor, 0.15)} 0%, ${alpha('#060B14', 0.95)} 100%)`,
  backgroundColor: '#060B14',
  WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
  border: `1px solid ${alpha(statcolor, 0.2)}`,
  boxShadow: `0 8px 32px 0 rgba(0,0,0,0.5), inset 0 1px 2px 0 ${alpha(statcolor, 0.3)}`,
  height: '138px',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%', left: '-50%', width: '200%', height: '200%',
    background: `radial-gradient(circle at 50% 50%, ${alpha(statcolor, 0.15)} 0%, transparent 60%)`,
    transition: 'all 0.5s ease',
    zIndex: 0,
    pointerEvents: 'none'
  },

  '& .hud-corner': {
    position: 'absolute',
    width: '12px', height: '12px',
    borderColor: alpha(statcolor, 0.4),
    borderStyle: 'solid',
    borderWidth: 0,
    zIndex: 1,
    transition: 'all 0.4s ease',
  },
  '& .hud-tl': { top: '12px', left: '12px', borderTopWidth: '2px', borderLeftWidth: '2px' },
  '& .hud-tr': { top: '12px', right: '12px', borderTopWidth: '2px', borderRightWidth: '2px' },
  '& .hud-bl': { bottom: '12px', left: '12px', borderBottomWidth: '2px', borderLeftWidth: '2px' },
  '& .hud-br': { bottom: '12px', right: '12px', borderBottomWidth: '2px', borderRightWidth: '2px' },

  '& .rotating-border': {
    position: 'absolute', inset: 0, borderRadius: '24px', padding: '2px',
    background: `conic-gradient(from 0deg, transparent 70%, ${statcolor} 100%)`,
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
    filter: `drop-shadow(0px 0px 15px ${statcolor})`
  },

  '& .particles': {
    position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none',
    backgroundImage: `radial-gradient(${alpha(statcolor, 0.4)} 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
  },

  '&:hover': {
    transform: 'translateY(-8px) scale(1.03)',
    boxShadow: `0 25px 50px -12px ${alpha(statcolor, 0.7)}, inset 0 1px 3px 0 ${alpha(statcolor, 0.9)}`,
    border: `1px solid transparent`,

    '&::before': {
      background: `radial-gradient(circle at 50% 50%, ${alpha(statcolor, 0.35)} 0%, transparent 70%)`,
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
      borderColor: statcolor,
      width: '18px', height: '18px',
      filter: `drop-shadow(0 0 8px ${statcolor})`
    },
  },
}));

const IconBox = styled(Box)(({ color, bg, size = 36 }) => ({
  width: size,
  height: size,
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color,
  background: bg
}));

export default function InProgressDashboard({ isDark, realTasks = [], activeTab }) {
  const textColor = isDark ? '#F8FAFC' : '#1E293B';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const navigate = useNavigate();
  const globalFilters = useSelector((state) => state.search.filters);

  const [activeView, setActiveView] = useState('main');
  const [trendPeriod, setTrendPeriod] = useState('weekly');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeView !== 'main') setActiveView('main');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  // --- DERIVE REAL DATA ---
  // Rework and In Progress mean the same thing
  const inProgressTasks = useMemo(() => {
    return realTasks.filter((t) => {
      const st = String(t._status || '')
        .toLowerCase()
        .trim();
      return ['in progress', 'inprogress', 'rework'].includes(st);
    });
  }, [realTasks]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Helper to parse dates
  const parseDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getStartDate = (t) => {
    const d = parseDate(t.startedAt || t.updatedAt || t._rawDate);
    return d || new Date(); // Fallback so graphs don't break
  };

  const isToday = (d) => {
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const isThisWeek = (d) => {
    if (!d) return false;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return d >= weekStart && d <= weekEnd;
  };

  const isThisMonth = (d) => {
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  let startedToday = 0;
  let inProgressThisWeek = 0;
  let inProgressThisMonth = 0;

  // Per-user map
  const userMap = {};
  inProgressTasks.forEach((t) => {
    const u = t._user || 'Unknown';
    if (!userMap[u]) userMap[u] = { name: u, total: 0, today: 0, inProgress: 0, blocked: 0 };
    userMap[u].total++;
    userMap[u].inProgress++; // They are all in progress

    const d = getStartDate(t);
    if (isToday(d)) {
      startedToday++;
      userMap[u].today++;
    }
    if (isThisWeek(d)) {
      inProgressThisWeek++;
    }
    if (isThisMonth(d)) {
      inProgressThisMonth++;
    }
  });

  const fullDeveloperData = Object.values(userMap).sort((a, b) => b.total - a.total);
  const developerTableData = fullDeveloperData.slice(0, 5);
  const developersWorkingCount = fullDeveloperData.length;

  let totalInProgressDays = 0;
  inProgressTasks.forEach((t) => {
    const start = getStartDate(t);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalInProgressDays += diffDays;
  });
  const avgInProgressDays = inProgressTasks.length > 0 ? (totalInProgressDays / inProgressTasks.length).toFixed(1) : 0;
  const avgInProgressText = `${avgInProgressDays} Days`;

  // Priority counts
  const getPriorityInfo = (t) => {
    const p = String(t._priority || 'Medium').toLowerCase();
    if (p.includes('critical')) return { label: 'Critical', color: '#991B1B' };
    if (p.includes('high')) return { label: 'High', color: '#EF4444' };
    if (p.includes('low')) return { label: 'Low', color: '#3B82F6' };
    return { label: 'Medium', color: '#F59E0B' };
  };

  let critCount = 0,
    highCount = 0,
    medCount = 0,
    lowCount = 0;
  inProgressTasks.forEach((t) => {
    const l = getPriorityInfo(t).label;
    if (l === 'Critical') critCount++;
    else if (l === 'High') highCount++;
    else if (l === 'Medium') medCount++;
    else lowCount++;
  });

    const pagesData = useMemo(() => {
      const counts = {};
      inProgressTasks.forEach((t) => {
        const name = t._pageName || 'Other';
        if (!counts[name]) counts[name] = { name, color: '#3B82F6', total: 0, inProgress: 0, blocked: 0, totalOverall: 0 };
        counts[name].total++;
        counts[name].inProgress++;
      });
      // Find overall total per page for in progress rate
      realTasks.forEach((t) => {
        const name = t._pageName || 'Other';
        if (counts[name]) counts[name].totalOverall++;
      });
  
      const entries = Object.values(counts).sort((a, b) => b.total - a.total);
      return entries.map((e) => ({ ...e, rate: Math.round((e.total / (e.totalOverall || 1)) * 100) }));
    }, [inProgressTasks, realTasks]);

  // Overall Status Pie (In Progress, On Hold)
  // Re-evaluating just these for the status overview
  const overviewCounts = { 'In Progress': inProgressTasks.length, 'On Hold': 0 };
  realTasks.forEach((t) => {
    const st = String(t._status || '')
      .toLowerCase()
      .trim();
    if (['on hold', 'hold'].includes(st)) overviewCounts['On Hold']++;
  });
  const overviewTotal = overviewCounts['In Progress'] + overviewCounts['On Hold'] || 1;

  const topStats = [
    {
      title: 'Total In Progress Tasks',
      value: inProgressTasks.length,
      subtitle: 'All in progress tasks',
      icon: <TimelineRoundedIcon fontSize="small" />,
      color: '#FFB020',
      grad: ['#1F1200', '#3A2200', '#FFB020'],
      hoverEmoji: '📈'
    },
    {
      title: 'Started Today',
      value: startedToday,
      subtitle: 'Tasks started on ' + now.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      icon: <PlayCircleOutlineRoundedIcon fontSize="small" />,
      color: '#00D4FF',
      grad: ['#001B2E', '#003B5C', '#00D4FF'],
      hoverEmoji: '▶️'
    },
    {
      title: 'In Progress This Week',
      value: inProgressThisWeek,
      subtitle: 'Current week',
      icon: <HourglassEmptyRoundedIcon fontSize="small" />,
      color: '#A855F7',
      grad: ['#12001F', '#25003D', '#A855F7'],
      hoverEmoji: '⏳'
    },
    {
      title: 'In Progress This Month',
      value: inProgressThisMonth,
      subtitle: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
      color: '#00E676',
      grad: ['#001F18', '#003D2E', '#00E676'],
      hoverEmoji: '📅'
    },
    {
      title: 'Avg. In Progress Time',
      value: avgInProgressText,
      subtitle: 'Across all tasks',
      icon: <TodayRoundedIcon fontSize="small" />,
      color: '#00CFFD',
      grad: ['#001B2A', '#00384D', '#00CFFD'],
      hoverEmoji: '⏱️'
    },
    {
      title: 'Developers Working',
      value: developersWorkingCount,
      subtitle: 'Actively working on tasks',
      icon: <GroupRoundedIcon fontSize="small" />,
      color: '#00D4FF',
      grad: ['#001B2E', '#003B5C', '#00D4FF'],
      hoverEmoji: '👨‍💻'
    }
  ];

  // Trend Data (Weekly, Monthly, Yearly)
  const trendPeriodConfig = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Weekly: last 7 days (Mon, Tue...)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekLabels = [],
      weekCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      weekLabels.push(dayNames[d.getDay()]);
      weekCounts.push(
        inProgressTasks.filter((t) => {
          const td = getStartDate(t);
          return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
        }).length
      );
    }

    // Monthly: last 12 months
    const monthLabels = [],
      monthCounts = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(monthNames[d.getMonth()]);
      const yr = d.getFullYear(),
        mo = d.getMonth();
      monthCounts.push(
        inProgressTasks.filter((t) => {
          const td = getStartDate(t);
          return td.getFullYear() === yr && td.getMonth() === mo;
        }).length
      );
    }

    // Yearly: last 6 years
    const yearLabels = [],
      yearCounts = [];
    for (let i = 5; i >= 0; i--) {
      const yr = now.getFullYear() - i;
      yearLabels.push(String(yr));
      yearCounts.push(
        inProgressTasks.filter((t) => {
          const td = getStartDate(t);
          return td.getFullYear() === yr;
        }).length
      );
    }

    return {
      weekly: { label: 'In Progress Trend (Weekly)', categories: weekLabels, data: weekCounts },
      monthly: { label: 'In Progress Trend (Monthly)', categories: monthLabels, data: monthCounts },
      yearly: { label: 'In Progress Trend (Yearly)', categories: yearLabels, data: yearCounts }
    };
  }, [inProgressTasks]);

  const activeTrend = trendPeriodConfig[trendPeriod];

  const trendOptions = {
    chart: { type: 'area', fontFamily: "'Inter', sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#F59E0B'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] } },
    dataLabels: {
      enabled: true,
      offsetY: -5,
      style: { fontSize: '12px', fontWeight: 700, colors: [textColor] },
      background: { enabled: false }
    },
    stroke: { curve: 'straight', width: 2 },
    xaxis: {
      categories: activeTrend.categories,
      labels: { style: { colors: textMuted, fontSize: '10px', fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false, min: 0 },
    grid: { show: false },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };

  // Priority Pie
  const allPriorities = [
    { label: 'Critical', count: critCount, color: '#991B1B' },
    { label: 'High', count: highCount, color: '#EF4444' },
    { label: 'Medium', count: medCount, color: '#F59E0B' },
    { label: 'Low', count: lowCount, color: '#10B981' } // Changed low color to green to match standard
  ];

  const priorityPieSeries = allPriorities.map((p) => p.count);
  const priorityPieLabels = allPriorities.map((p) => p.label);
  const priorityPieColors = allPriorities.map((p) => p.color);

  const priorityPieOptions = {
    chart: { type: 'donut', fontFamily: "'Inter', sans-serif" },
    labels: priorityPieLabels,
    colors: priorityPieColors,
    stroke: { width: 3, colors: [isDark ? '#1E293B' : '#FFFFFF'] },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, color: textMuted },
            value: { show: true, fontSize: '22px', fontWeight: 800, color: textColor },
            total: {
              show: true,
              label: 'Total',
              formatter: () => inProgressTasks.length.toString(),
              color: textMuted,
              fontSize: '11px',
              fontWeight: 600
            }
          }
        }
      }
    },
    dataLabels: { enabled: true, formatter: (val) => val.toFixed(1) + '%', style: { fontSize: '11px', fontWeight: 700 } },
    legend: { show: false }
  };

  // Overview Pie
  const overviewPieSeries = [overviewCounts['In Progress'], overviewCounts['On Hold']];
  const overviewPieLabels = ['In Progress', 'On Hold'];
  const overviewPieColors = ['#F59E0B', '#3B82F6'];

  const overviewPieOptions = {
    chart: { type: 'donut', fontFamily: "'Inter', sans-serif" },
    labels: overviewPieLabels,
    colors: overviewPieColors,
    stroke: { width: 4, colors: [isDark ? '#1E293B' : '#FFFFFF'] },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, color: textMuted },
            value: { show: true, fontSize: '24px', fontWeight: 800, color: textColor },
            total: {
              show: true,
              label: 'Total',
              formatter: () => overviewTotal.toString(),
              color: textMuted,
              fontSize: '12px',
              fontWeight: 600
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  // ============================
  // FULL-SCREEN SUB VIEWS
  // ============================
  if (activeView !== 'main') {
    return (
      <Box
        sx={{
          animation: 'fadeIn 0.3s ease-in-out',
          '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } }
        }}
      >
        <Stack direction="row" alignItems="center" gap={2} mb={3}>
          <IconButton
            onClick={() => setActiveView('main')}
            sx={{
              bgcolor: isDark ? alpha('#F59E0B', 0.1) : '#FFFBEB',
              color: '#F59E0B',
              '&:hover': { bgcolor: isDark ? alpha('#F59E0B', 0.2) : '#FEF3C7' }
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color={textColor}>
            {activeView === 'health' && 'In Progress by Developer (Full List)'}
            {activeView === 'pages' && 'In Progress by Pages (Full List)'}
            {activeView === 'tasks' && 'In Progress Tasks'}
          </Typography>
          <Chip
            label="Press Esc to go back"
            size="small"
            sx={{ ml: 'auto', bgcolor: isDark ? '#334155' : '#F1F5F9', color: textMuted, fontWeight: 700, borderRadius: 2 }}
          />
        </Stack>

        <StyledCard sx={{ p: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeView === 'employee' && (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell>Developer</TableCell>
                    <TableCell align="center">Total Tasks</TableCell>
                    <TableCell align="center">Started Today</TableCell>
                    <TableCell align="center">In Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fullDeveloperData.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#3B82F6', fontSize: '12px', fontWeight: 800 }}>
                            {row.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={700}>
                            {row.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={800}>
                          {row.total}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color={row.today > 0 ? '#F59E0B' : textMuted}>
                          {row.today}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color={row.inProgress > 0 ? '#F59E0B' : textMuted}>
                          {row.inProgress}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeView === 'pages' && (
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell>Pages</TableCell>
                      <TableCell align="center">Total Tasks</TableCell>
                    <TableCell align="center">In Progress</TableCell>
                    <TableCell align="center">In Progress %</TableCell>
                  </TableRow>
                </TableHead>
                  <TableBody>
                    {pagesData.map((row, idx) => (
                      <TableRow key={idx} hover>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={800}>
                          {row.total}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color={row.inProgress > 0 ? '#F59E0B' : textMuted}>
                          {row.inProgress}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
                          <Typography variant="body2" fontWeight={700} color="#3B82F6" sx={{ minWidth: 30 }}>
                            {row.rate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={row.rate}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha('#3B82F6', 0.15),
                              '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6', borderRadius: 3 }
                            }}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeView === 'tasks' && (
            <TableContainer sx={{ flex: 1, maxHeight: '70vh' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC', borderBottom: 'none' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Task No</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Created On</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inProgressTasks.map((t, idx) => {
                    const pInfo = getPriorityInfo(t);
                    return (
                      <TableRow
                        key={idx}
                        hover
                        onClick={() => {
                          const ticketId = t._ticketId || t._id;
                          if (ticketId) {
                            const filterRequestManagement = globalFilters?.requestManagement || 'Request For Me';
                            const routePath = filterRequestManagement === 'My Request' ? '/support/ticket-by-me' : '/support/raised-for-me';
                            navigate(`${routePath}?openTicketId=${ticketId}`);
                          }
                        }}
                        sx={{
                          cursor: 'pointer'
                        }}
                      >
                        <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                          <Typography variant="body2" fontWeight={900} color="#F59E0B">
                            {t._ticketId || t._id || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={textColor}>
                            {t._title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#F59E0B', fontSize: '12px', fontWeight: 800 }}>
                              {(t._user || 'U').charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} color={textColor}>
                              {t._user || 'Unknown'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={pInfo.label}
                            sx={{ bgcolor: alpha(pInfo.color, 0.15), color: pInfo.color, fontWeight: 800, fontSize: '0.75rem', height: 24 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={textColor}>
                            {t._createdDate
                              ? new Date(t._createdDate).toLocaleDateString()
                              : t._rawDate
                                ? new Date(t._rawDate).toLocaleDateString()
                                : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={textColor}>
                            {t._dueDate ? new Date(t._dueDate).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={textColor}>
                            {t._createdBy || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </StyledCard>
      </Box>
    );
  }

  // ============================
  // MAIN DASHBOARD
  // ============================
  return (
    <Box
      sx={{
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        '@keyframes sweep': { '0%': { left: '-100%' }, '100%': { left: '200%' } },
        '@keyframes spin-border': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        '@keyframes floatIcon': {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      }}
    >
      {/* ROW 1: STAT CARDS */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(6,1fr)' }, gap: 1.5, mb: 1.5 }}
      >
        {topStats.map((stat, idx) => (
          <NeonCard 
            key={idx} 
            statcolor={stat.color} 
            grad={stat.grad}
            onClick={() => {
              if (stat.title === 'Total In Progress Tasks' || stat.title === 'Started Today' || stat.title === 'In Progress This Week' || stat.title === 'In Progress This Month') {
                const initialFilters = { 
                  ticketStatus: 'In Progress',
                  taskScope: globalFilters?.performanceScope || 'Mine'
                };
                
                const now = new Date();
                
                if (stat.title === 'Started Today') {
                  initialFilters.startDate = now.toISOString().split('T')[0];
                  initialFilters.endDate = now.toISOString().split('T')[0];
                } else if (stat.title === 'In Progress This Week') {
                  const weekStart = new Date(now);
                  weekStart.setDate(now.getDate() - now.getDay()); // Sunday as start of week
                  initialFilters.startDate = weekStart.toISOString().split('T')[0];
                  initialFilters.endDate = now.toISOString().split('T')[0];
                } else if (stat.title === 'In Progress This Month') {
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  initialFilters.startDate = monthStart.toISOString().split('T')[0];
                  
                  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  initialFilters.endDate = monthEnd.toISOString().split('T')[0];
                }

                const filterRequestManagement = globalFilters?.requestManagement || 'Request For Me';
                const routePath = filterRequestManagement === 'My Request' ? '/support/ticket-by-me' : '/support/raised-for-me';

                navigate(routePath, { 
                  state: { 
                    fromDashboard: true, 
                    fromTab: activeTab,
                    dashboardFilters: globalFilters,
                    initialFilters 
                  } 
                });
              }
            }}
            sx={{ cursor: (stat.title === 'Total In Progress Tasks' || stat.title === 'Started Today' || stat.title === 'In Progress This Week' || stat.title === 'In Progress This Month') ? 'pointer' : 'default' }}
          >
            {/* Absolute Backdrops */}
            <Box className="rotating-border" />
            <Box className="shimmer" />
            <Box className="hud-corner hud-tl" />
            <Box className="hud-corner hud-tr" />
            <Box className="hud-corner hud-bl" />
            <Box className="hud-corner hud-br" />
            <Box className="particles" />

            <Box className="hover-emoji">{stat.hoverEmoji}</Box>

            {/* HUD Corners */}

            <IconButton
              size="small"
              sx={{ position: 'absolute', top: 12, right: 12, color: alpha('#fff', 0.4), '&:hover': { color: '#fff' } }}
            >
              <MoreVertRoundedIcon fontSize="small" />
            </IconButton>

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
              {/* Icon */}
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `radial-gradient(circle, ${alpha(stat.color, 0.4)} 0%, ${alpha(stat.color, 0.05)} 70%)`,
                  boxShadow: `0 0 20px ${alpha(stat.color, 0.6)}, inset 0 0 15px ${alpha(stat.color, 0.5)}`,
                  border: `1px solid ${alpha(stat.color, 0.6)}`,
                  color: '#fff',
                  WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
                  animation: 'floatIcon 4s ease-in-out infinite'
                }}
              >
                {React.cloneElement(stat.icon, { sx: { fontSize: '1.5rem' } })}
              </Box>

              {/* Title */}
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{ fontSize: '0.8rem', color: '#E2E8F0', mb: 0.5, letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.2 }}
              >
                {stat.title}
              </Typography>

              {/* Value */}
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  color: '#FFFFFF',
                  mb: 0.25,
                  textShadow: `0 0 20px ${alpha(stat.color, 0.8)}`,
                  fontSize: '2rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  lineHeight: 1.1
                }}
              >
                {stat.value}
              </Typography>

              {/* Subtitle */}
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ fontSize: '0.65rem', color: alpha('#fff', 0.6), textAlign: 'center', lineHeight: 1.1 }}
              >
                {stat.subtitle}
              </Typography>
            </Box>
          </NeonCard>
        ))}
      </Box>

      {/* ROW 2: Developer | Priority | Module */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 1.5, mb: 1.5, alignItems: 'stretch' }}>
        {/* In Progress by Developer */}
        <StyledCard sx={{ p: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
            <GroupRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              In Progress by Developer
            </Typography>
          </Stack>
          <Box flex={1}>
            <TableContainer sx={{ '& .MuiTableCell-root': { py: 1.2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Developer</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>
                      Started Today
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>In Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {developerTableData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 20, height: 20, bgcolor: '#3B82F6', fontSize: '9px', fontWeight: 800 }}>
                            {row.name.charAt(0)}
                          </Avatar>
                          <Typography fontSize="0.7rem" fontWeight={700} noWrap sx={{ maxWidth: 60 }}>
                            {row.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={800} fontSize="0.75rem" color={textColor}>
                          {row.total}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.today > 0 ? '#F59E0B' : textMuted}>
                          {row.today}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.inProgress > 0 ? '#F59E0B' : textMuted}>
                          {row.inProgress}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {developerTableData.length > 0 && (
                    <TableRow sx={{ bgcolor: isDark ? alpha('#F59E0B', 0.1) : '#FFFBEB' }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#F59E0B' }}>Total</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#F59E0B' }}>
                        {inProgressTasks.length}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#F59E0B' }}>
                        {startedToday}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#F59E0B' }}>
                        {inProgressTasks.length}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box
            onClick={() => setActiveView('employee')}
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              color: '#F59E0B',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Typography variant="body2" fontWeight={700} color="#F59E0B">
              View all
            </Typography>
            <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
          </Box>
        </StyledCard>

        {/* In Progress by Priority */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
            <DashboardRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              In Progress by Priority
            </Typography>
          </Stack>
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={priorityPieOptions} series={priorityPieSeries} type="donut" height={140} />
            </Box>
            <Box width="45%" pl={2}>
              <Stack spacing={2}>
                {priorityPieLabels.map((l, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityPieColors[i] }} />
                      <Typography variant="caption" fontWeight={700} color={textColor}>
                        {l}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={800} color={textColor}>
                      {priorityPieSeries[i]}{' '}
                      <span style={{ color: textMuted, fontSize: '9px' }}>
                        ({inProgressTasks.length > 0 ? Math.round((priorityPieSeries[i] / inProgressTasks.length) * 100) : 0}%)
                      </span>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </StyledCard>

        {/* In Progress by Pages */}
        <StyledCard sx={{ p: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
            <AssignmentRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                In Progress by Pages
              </Typography>
          </Stack>
          <Box flex={1}>
            <TableContainer sx={{ '& .MuiTableCell-root': { py: 1.2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}>
              <Table size="small">
                <TableHead>
                    <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Pages</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total Tasks</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>In Progress</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>In Progress %</TableCell>
                  </TableRow>
                </TableHead>
                  <TableBody>
                    {pagesData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Typography fontSize="0.7rem" fontWeight={700} noWrap sx={{ maxWidth: 70 }}>
                          {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={800} fontSize="0.75rem" color={textColor}>
                          {row.total}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.inProgress > 0 ? '#F59E0B' : textMuted}>
                          {row.inProgress}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography fontWeight={700} fontSize="0.75rem" color="#3B82F6" sx={{ minWidth: 26 }}>
                            {row.rate}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={row.rate}
                            sx={{
                              flex: 1,
                              height: 4,
                              borderRadius: 2,
                              bgcolor: alpha('#3B82F6', 0.15),
                              '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6', borderRadius: 2 }
                            }}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box
            onClick={() => setActiveView('pages')}
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Typography variant="body2" fontWeight={700} color="#F59E0B">
              View all
            </Typography>
            <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
          </Box>
        </StyledCard>
      </Box>

      {/* ROW 3: Trend | Active Tasks | Overview Pie */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 1.5, alignItems: 'stretch' }}>
        {/* Trend */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <ShowChartRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
              <Typography variant="subtitle2" fontWeight={800}>
                {activeTrend.label}
              </Typography>
            </Stack>
            <Stack direction="row" bgcolor={isDark ? '#334155' : '#F1F5F9'} borderRadius={2} p={0.5}>
              {['weekly', 'monthly', 'yearly'].map((period) => (
                <Box
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: trendPeriod === period ? '#F59E0B' : 'transparent',
                    color: trendPeriod === period ? '#FFF' : textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: trendPeriod !== period && (isDark ? alpha('#F59E0B', 0.1) : alpha('#F59E0B', 0.05)) }
                  }}
                >
                  {period}
                </Box>
              ))}
            </Stack>
          </Stack>
          <Box sx={{ ml: -2, mt: 1 }}>
            <ReactApexChart
              options={trendOptions}
              series={[{ name: 'In Progress Tasks', data: activeTrend.data }]}
              type="area"
              height={140}
            />
          </Box>
          <Box
            sx={{
              mt: 1,
              bgcolor: isDark ? alpha('#F59E0B', 0.1) : '#FFFBEB',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <PlayCircleOutlineRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
            <Typography variant="body2" fontWeight={700} color="#F59E0B">
              {startedToday} tasks started today
            </Typography>
          </Box>
        </StyledCard>

        {/* Active In Progress Tasks */}
        <StyledCard sx={{ p: 1.5, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
            <FormatListBulletedRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            <Typography variant="subtitle2" fontWeight={800}>
              In Progress
            </Typography>
          </Stack>
          <Box flex={1}>
            <TableContainer sx={{ '& .MuiTableCell-root': { py: 1.2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Task No</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Created On</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inProgressTasks.slice(0, 5).map((t, idx) => {
                    const pInfo = getPriorityInfo(t);
                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                          <Typography fontWeight={800} fontSize="0.7rem" color="#F59E0B">
                            {t._ticketId || t._id || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} fontSize="0.72rem" color={textColor} noWrap sx={{ maxWidth: 90 }}>
                            {t._title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} fontSize="0.72rem" color={textColor}>
                            {t._user || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={pInfo.label}
                            sx={{ bgcolor: alpha(pInfo.color, 0.1), color: pInfo.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} fontSize="0.7rem" color={textMuted}>
                            {t._createdDate
                              ? new Date(t._createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : t._rawDate
                                ? new Date(t._rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} fontSize="0.7rem" color={textMuted}>
                            {t._dueDate
                              ? new Date(t._dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={700} fontSize="0.7rem" color={textMuted}>
                            {t._createdBy || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box
            onClick={() => setActiveView('tasks')}
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <Typography variant="body2" fontWeight={700} color="#F59E0B">
              View all
            </Typography>
            <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
          </Box>
        </StyledCard>

        {/* Task Status Overview */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
            <DashboardRoundedIcon fontSize="small" sx={{ color: '#F59E0B' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Task Status Overview
            </Typography>
          </Stack>
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={overviewPieOptions} series={overviewPieSeries} type="donut" height={140} />
            </Box>
            <Box width="45%" pl={1}>
              <Stack spacing={2}>
                {overviewPieLabels.map((l, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: overviewPieColors[i] }} />
                      <Typography variant="caption" fontWeight={700} color={textColor} noWrap sx={{ maxWidth: 90 }}>
                        {l}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={800} color={textColor}>
                      {overviewPieSeries[i]}{' '}
                      <span style={{ color: textMuted, fontSize: '9px' }}>
                        ({overviewTotal > 0 ? Math.round((overviewPieSeries[i] / overviewTotal) * 100) : 0}%)
                      </span>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </StyledCard>
      </Box>
    </Box>
  );
}
