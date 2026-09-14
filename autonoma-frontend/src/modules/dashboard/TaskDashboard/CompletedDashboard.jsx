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
  Link,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, resetFilters } from 'store/slices/search';
import { styled, alpha } from '@mui/system';
import ReactApexChart from 'react-apexcharts';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

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

export default function CompletedDashboard({ isDark, realTasks = [], activeTab }) {
  const textColor = isDark ? '#F8FAFC' : '#1E293B';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const navigate = useNavigate();
  const dispatch = useDispatch();
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
  const completedTasks = useMemo(() => {
    return realTasks.filter((t) => ['completed', 'done', 'tested'].includes(String(t._status).toLowerCase().trim()));
  }, [realTasks]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Helper to parse dates
  const parseDate = (dStr) => {
    if (!dStr) return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getCompletedDate = (t) => {
    // Assuming t.updatedAt or t._rawDate is the completion date
    const d = parseDate(t.updatedAt || t._rawDate);
    // If no valid date, fallback to a mock date close to now so it doesn't break
    return d || new Date();
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

  let completedToday = 0;
  let completedThisWeek = 0;
  let completedThisMonth = 0;

  // Per-user map
  const userMap = {};
  completedTasks.forEach((t) => {
    const u = t._user || 'Unknown';
    if (!userMap[u]) userMap[u] = { name: u, total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
    userMap[u].total++;

    const d = getCompletedDate(t);
    if (isToday(d)) {
      completedToday++;
      userMap[u].today++;
    }
    if (isThisWeek(d)) {
      completedThisWeek++;
      userMap[u].thisWeek++;
    }
    if (isThisMonth(d)) {
      completedThisMonth++;
      userMap[u].thisMonth++;
    }
  });

  const fullEmployeeData = Object.values(userMap).sort((a, b) => b.total - a.total);
  const employeeTableData = fullEmployeeData.slice(0, 5);
  const employeesCompletedCount = fullEmployeeData.length;

  const totalTasksCount = realTasks.length || 1;
  const completionRate = Math.round((completedTasks.length / totalTasksCount) * 100);

  // Priority counts
  const getPriorityInfo = (t) => {
    const p = String(t._priority || 'Medium').toLowerCase();
    if (p.includes('critical')) return { label: 'Critical', color: '#EF4444' };
    if (p.includes('high')) return { label: 'High', color: '#F97316' };
    if (p.includes('low')) return { label: 'Low', color: '#10B981' };
    return { label: 'Medium', color: '#3B82F6' };
  };

  let critCount = 0,
    highCount = 0,
    medCount = 0,
    lowCount = 0;
  completedTasks.forEach((t) => {
    const l = getPriorityInfo(t).label;
    if (l === 'Critical') critCount++;
    else if (l === 'High') highCount++;
    else if (l === 'Medium') medCount++;
    else lowCount++;
  });

  // Pages Data (grouped by _pageName)
  const pagesData = useMemo(() => {
    const counts = {};
    completedTasks.forEach((t) => {
      const name = t._pageName || 'Other';
      if (!counts[name]) counts[name] = { name, color: '#10B981', total: 0, thisWeek: 0, thisMonth: 0, totalOverall: 0 };
      counts[name].total++;
      const d = getCompletedDate(t);
      if (isThisWeek(d)) counts[name].thisWeek++;
      if (isThisMonth(d)) counts[name].thisMonth++;
    });
    // Find overall total per page for completion rate
    realTasks.forEach((t) => {
      const name = t._pageName || 'Other';
      if (counts[name]) counts[name].totalOverall++;
    });

    const entries = Object.values(counts).sort((a, b) => b.total - a.total);
    return entries.map((e) => ({ ...e, rate: Math.round((e.total / (e.totalOverall || 1)) * 100) }));
  }, [completedTasks, realTasks]);

  // Overall Status Pie (Completed, To Be Tested, In Progress, Blocked)
  const getOverviewStatus = (st) => {
    const s = String(st || '')
      .toLowerCase()
      .trim();
    if (['completed', 'done', 'tested'].includes(s)) return 'Completed';
    if (['to be tested', 'testing'].includes(s)) return 'To Be Tested';
    if (['blocked', 'on hold'].includes(s)) return 'Blocked';
    return 'In Progress';
  };

  const statusOverviewCounts = { Completed: 0, 'To Be Tested': 0, 'In Progress': 0, Blocked: 0 };
  realTasks.forEach((t) => {
    statusOverviewCounts[getOverviewStatus(t._status)]++;
  });

  const topStats = [
    {
      title: 'Total Completed Tasks',
      hoverEmoji: '✅',
      value: completedTasks.length,
      subtitle: 'All time',
      icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
      color: '#10B981',
      bg: '#F0FDF4',
      sparkData: [12, 14, 22, 47, 42, 15, 47, 75, 65, 19, 14]
    },
    {
      title: 'Completed Today',
      hoverEmoji: '📋',
      value: completedToday,
      subtitle: 'Completed on ' + now.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      icon: <AssignmentRoundedIcon fontSize="small" />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      sparkData: [47, 45, 54, 38, 56, 24, 65, 31, 37, 39, 62]
    },
    {
      title: 'Completed This Week',
      hoverEmoji: '📅',
      value: completedThisWeek,
      subtitle: 'Current week',
      icon: <TodayRoundedIcon fontSize="small" />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      sparkData: [15, 75, 47, 65, 14, 2, 41, 54, 18, 27, 42]
    },
    {
      title: 'Completed This Month',
      hoverEmoji: '📅',
      value: completedThisMonth,
      subtitle: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
      color: '#F97316',
      bg: '#FFFBEB',
      sparkData: [2, 14, 12, 47, 42, 15, 47, 75, 65, 19, 14]
    },
    {
      title: 'Employees Completed',
      hoverEmoji: '👥',
      value: employeesCompletedCount,
      subtitle: 'Have completed tasks',
      icon: <GroupRoundedIcon fontSize="small" />,
      color: '#0EA5E9',
      bg: '#F0F9FF',
      sparkData: [32, 22, 14, 56, 45, 34, 76, 54, 23, 43, 21]
    },
    {
      title: 'Completion Rate',
      hoverEmoji: '🏆',
      value: completionRate + '%',
      subtitle: '(Completed / Total Tasks)',
      icon: <EmojiEventsRoundedIcon fontSize="small" />,
      color: '#E11D48',
      bg: '#FFF1F2',
      sparkData: [65, 45, 23, 76, 56, 34, 21, 45, 67, 89, 54]
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
        completedTasks.filter((t) => {
          const td = getCompletedDate(t);
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
        completedTasks.filter((t) => {
          const td = getCompletedDate(t);
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
        completedTasks.filter((t) => {
          const td = getCompletedDate(t);
          return td.getFullYear() === yr;
        }).length
      );
    }

    return {
      weekly: { label: 'Completion Trend (Weekly)', categories: weekLabels, data: weekCounts },
      monthly: { label: 'Completion Trend (Monthly)', categories: monthLabels, data: monthCounts },
      yearly: { label: 'Completion Trend (Yearly)', categories: yearLabels, data: yearCounts }
    };
  }, [completedTasks]);

  const activeTrend = trendPeriodConfig[trendPeriod];

  const trendOptions = {
    chart: { type: 'area', fontFamily: "'Inter', sans-serif", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#10B981'],
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

  // Priority Pie - same colors across all dashboards
  const allPriorities = [
    { label: 'Critical', count: critCount, color: '#991B1B' },
    { label: 'High', count: highCount, color: '#EF4444' },
    { label: 'Medium', count: medCount, color: '#3B82F6' },
    { label: 'Low', count: lowCount, color: '#10B981' }
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
              formatter: () => completedTasks.length.toString(),
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
  const overviewPieSeries = [
    statusOverviewCounts['Completed'],
    statusOverviewCounts['To Be Tested'],
    statusOverviewCounts['In Progress'],
    statusOverviewCounts['Blocked']
  ];
  const overviewPieLabels = ['Completed', 'To Be Tested', 'In Progress', 'Blocked'];
  const overviewPieColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

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
              formatter: () => realTasks.length.toString(),
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
  // FULL-SCREEN SUB VIEWS (Reused from previous pattern)
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
              bgcolor: isDark ? alpha('#10B981', 0.1) : '#F0FDF4',
              color: '#10B981',
              '&:hover': { bgcolor: isDark ? alpha('#10B981', 0.2) : '#DCFCE7' }
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color={textColor}>
            {activeView === 'employee' && 'Completed by Employee (Full List)'}
            {activeView === 'module' && 'Completed by Pages (Full Report)'}
            {activeView === 'tasks' && 'Completed'}
          </Typography>
          <Chip
            label="Press Esc to go back"
            size="small"
            sx={{ ml: 'auto', bgcolor: isDark ? '#334155' : '#F1F5F9', color: textMuted, fontWeight: 700, borderRadius: 2 }}
          />
        </Stack>

        <StyledCard sx={{ p: 0, overflow: 'hidden' }}>
          {activeView === 'employee' && (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">Detailed view shown here.</Typography>
            </Box>
          )}
          {activeView === 'module' && (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">Detailed view shown here.</Typography>
            </Box>
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
                  {completedTasks.map((t, idx) => {
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
                          <Typography variant="body2" fontWeight={900} color="#10B981">
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
                            <Avatar sx={{ width: 28, height: 28, bgcolor: '#10B981', fontSize: '12px', fontWeight: 800 }}>
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
            onClick={() => {
              if (stat.title === 'Total Completed Tasks' || stat.title === 'Completed Today' || stat.title === 'Completed This Week' || stat.title === 'Completed This Month') {
                const initialFilters = { 
                  ticketStatus: 'Completed',
                  taskScope: globalFilters?.performanceScope || 'Mine'
                };
                
                const now = new Date();
                
                if (stat.title === 'Completed Today') {
                  initialFilters.startDate = now.toISOString().split('T')[0];
                  initialFilters.endDate = now.toISOString().split('T')[0];
                } else if (stat.title === 'Completed This Week') {
                  const weekStart = new Date(now);
                  weekStart.setDate(now.getDate() - now.getDay()); // Sunday as start of week
                  initialFilters.startDate = weekStart.toISOString().split('T')[0];
                  initialFilters.endDate = now.toISOString().split('T')[0];
                } else if (stat.title === 'Completed This Month') {
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
          >
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

      {/* ROW 2: Employee | Priority | Module */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 1.5, mb: 1.5, alignItems: 'stretch' }}>
        {/* Completed by Employee */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
            <GroupRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Completed by Employee
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>
                    Total Completed
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Today</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>This Week</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>This Month</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeTableData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: '#10B981', fontSize: '9px', fontWeight: 800 }}>
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
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.today > 0 ? '#10B981' : textMuted}>
                        {row.today}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.thisWeek > 0 ? '#10B981' : textMuted}>
                        {row.thisWeek}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.thisMonth > 0 ? '#10B981' : textMuted}>
                        {row.thisMonth}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {employeeTableData.length > 0 && (
                  <TableRow sx={{ bgcolor: isDark ? alpha('#10B981', 0.1) : '#F0FDF4' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#10B981' }}>Total</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#10B981' }}>
                      {completedTasks.length}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#10B981' }}>
                      {completedToday}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#10B981' }}>
                      {completedThisWeek}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#10B981' }}>
                      {completedThisMonth}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </StyledCard>

        {/* Completed by Priority */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
            <DashboardRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Completed by Priority
            </Typography>
          </Stack>
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={priorityPieOptions} series={priorityPieSeries} type="donut" height={130} />
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
                        ({completedTasks.length > 0 ? Math.round((priorityPieSeries[i] / completedTasks.length) * 100) : 0}%)
                      </span>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </StyledCard>

        {/* Completed by Pages */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
            <AssignmentRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Completed by Pages
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Pages</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>This Week</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>This Month</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Rate</TableCell>
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
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.thisWeek > 0 ? '#10B981' : textMuted}>
                        {row.thisWeek}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.thisMonth > 0 ? '#10B981' : textMuted}>
                        {row.thisMonth}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography fontWeight={700} fontSize="0.75rem" color="#10B981" sx={{ minWidth: 26 }}>
                          {row.rate}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={row.rate}
                          sx={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            bgcolor: alpha('#10B981', 0.15),
                            '& .MuiLinearProgress-bar': { bgcolor: '#10B981', borderRadius: 2 }
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </StyledCard>
      </Box>

      {/* ROW 3: Trend | Recently Completed | Overview Pie */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 2, alignItems: 'stretch' }}>
        {/* Trend */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <ShowChartRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
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
                    bgcolor: trendPeriod === period ? '#10B981' : 'transparent',
                    color: trendPeriod === period ? '#FFF' : textMuted,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: trendPeriod !== period && (isDark ? alpha('#10B981', 0.1) : alpha('#10B981', 0.05)) }
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
              series={[{ name: 'Completed Tasks', data: activeTrend.data }]}
              type="area"
              height={130}
            />
          </Box>
          <Box
            sx={{
              mt: 1,
              bgcolor: isDark ? alpha('#10B981', 0.1) : '#F0FDF4',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} />
            <Typography variant="body2" fontWeight={700} color="#10B981">
              {completedTasks.length} tasks completed overall
            </Typography>
          </Box>
        </StyledCard>

        {/* Recently Completed */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
            <FormatListBulletedRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800}>
              Completed
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
          >
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
                {completedTasks.slice(0, 5).map((t, idx) => {
                  const pInfo = getPriorityInfo(t);
                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Typography fontWeight={800} fontSize="0.7rem" color="#10B981">
                          {t._ticketId || t._id || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} fontSize="0.72rem" color={textColor} noWrap sx={{ maxWidth: 80 }}>
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
            <Typography variant="body2" fontWeight={700} color="#10B981">
              View all
            </Typography>
            <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} />
          </Box>
        </StyledCard>

        {/* Completion Status Overview */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
            <CheckCircleOutlineRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Completion Status Overview
            </Typography>
          </Stack>
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={overviewPieOptions} series={overviewPieSeries} type="donut" height={130} />
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
                        ({realTasks.length > 0 ? Math.round((overviewPieSeries[i] / realTasks.length) * 100) : 0}%)
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
