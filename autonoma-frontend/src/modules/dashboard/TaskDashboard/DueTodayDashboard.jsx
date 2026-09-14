/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  IconButton,
  useTheme
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/system';
import ReactApexChart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';

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

export default function DueTodayDashboard({ isDark, realTasks = [], activeTab }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const globalFilters = useSelector((state) => state.search?.filters || {});
  const textColor = isDark ? '#F8FAFC' : '#1E293B';
  const textMuted = isDark ? '#94A3B8' : '#64748B';

  const [activeView, setActiveView] = useState('main'); // 'main', 'employee', 'overdue', 'pages', 'tasks'
  const [trendPeriod, setTrendPeriod] = useState('weekly');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeView !== 'main') {
        setActiveView('main');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView]);

  // --- DERIVE REAL DATA ---
  const { dueTodayTasks, overdueTasks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueToday = [];
    const overdue = [];

    const getWorkingDays = (start, end) => {
      let days = 0;
      let cur = new Date(start);
      cur.setHours(0, 0, 0, 0);
      const e = new Date(end);
      e.setHours(0, 0, 0, 0);
      while (cur < e) {
        if (cur.getDay() !== 0) { // skip Sunday
          days++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    };

    realTasks.forEach((t) => {
      const st = String(t._status).toLowerCase();
      const isDone = ['completed', 'verified', 'approved', 'closed', 'resolved'].includes(st);
      if (isDone || !t._dueDate) return;

      const dDate = new Date(t._dueDate);
      dDate.setHours(0, 0, 0, 0);

      if (dDate.getTime() === today.getTime()) {
        dueToday.push(t);
      } else if (dDate.getTime() < today.getTime()) {
        const diffDays = getWorkingDays(dDate, today);
        if (diffDays > 0) {
          overdue.push({ ...t, diffDays });
        }
      }
    });

    return { dueTodayTasks: dueToday, overdueTasks: overdue };
  }, [realTasks]);

  const getPriorityInfo = (t) => {
    const p = String(t._priority || 'Medium').toLowerCase();
    if (p.includes('critical')) return { label: 'Critical', color: '#991B1B' };
    if (p.includes('high')) return { label: 'High', color: '#EF4444' };
    if (p.includes('low')) return { label: 'Low', color: '#10B981' };
    return { label: 'Medium', color: '#3B82F6' };
  };

  const getTicketId = (t) => {
    return t._ticketId || t._id || `TCK-???`;
  };

  let critCount = 0;
  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;
  const userMap = {};

  dueTodayTasks.forEach((t) => {
    const pInfo = getPriorityInfo(t);
    if (pInfo.label === 'Critical') critCount++;
    else if (pInfo.label === 'High') highCount++;
    else if (pInfo.label === 'Medium') medCount++;
    else lowCount++;

    const u = t._user || 'Unknown';
    if (!userMap[u]) userMap[u] = { name: u, total: 0, overdue: 0, crit: 0, high: 0, med: 0, low: 0 };
    userMap[u].total++;
    if (pInfo.label === 'Critical') userMap[u].crit++;
    else if (pInfo.label === 'High') userMap[u].high++;
    else if (pInfo.label === 'Medium') userMap[u].med++;
    else userMap[u].low++;
  });

  overdueTasks.forEach((t) => {
    const u = t._user || 'Unknown';
    if (userMap[u]) {
      userMap[u].overdue++;
    } else {
      userMap[u] = { name: u, total: 0, overdue: 1, crit: 0, high: 0, med: 0, low: 0 };
    }
  });

  const fullEmpTableData = Object.values(userMap).sort((a, b) => b.total - a.total);
  const empTableData = fullEmpTableData.slice(0, 5);
  const totalEmployees = Object.keys(userMap).filter((k) => userMap[k].total > 0).length;

  const topStats = [
    {
      title: 'Total Due Today',
      value: dueTodayTasks.length,
      subtitle: 'All tasks due today',
      icon: <AssignmentRoundedIcon fontSize="small" />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      line: '#3B82F6',
      hoverEmoji: '📅'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      subtitle: 'Past due date',
      icon: <ErrorOutlineRoundedIcon fontSize="small" />,
      color: '#EF4444',
      bg: '#FEF2F2',
      line: '#EF4444',
      hoverEmoji: '⚠️'
    },
    {
      title: 'Critical',
      value: critCount,
      subtitle: 'Due today',
      icon: <ReportProblemRoundedIcon fontSize="small" />,
      color: '#991B1B',
      bg: '#FEF2F2',
      line: '#991B1B',
      hoverEmoji: '🚨'
    },
    {
      title: 'High',
      value: highCount,
      subtitle: 'Due today',
      icon: <WarningRoundedIcon fontSize="small" />,
      color: '#EF4444',
      bg: '#FEF2F2',
      line: '#EF4444',
      hoverEmoji: '⚡'
    },
    {
      title: 'Medium',
      value: medCount,
      subtitle: 'Due today',
      icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
      color: '#3B82F6',
      bg: '#EFF6FF',
      line: '#3B82F6',
      hoverEmoji: '📊'
    },
    {
      title: 'Low',
      value: lowCount,
      subtitle: 'Due today',
      icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
      color: '#10B981',
      bg: '#F0FDF4',
      line: '#10B981',
      hoverEmoji: '✅'
    },
    {
      title: 'Assigned Employees',
      value: totalEmployees,
      subtitle: 'Have tasks due today',
      icon: <GroupRoundedIcon fontSize="small" />,
      color: '#8B5CF6',
      bg: '#F5F3FF',
      line: '#8B5CF6',
      hoverEmoji: '👨‍💻'
    }
  ];

  // Pie chart data
  const pieSeries = [critCount, highCount, medCount, lowCount];
  const pieLabels = ['Critical', 'High', 'Medium', 'Low'];
  const pieColors = ['#991B1B', '#EF4444', '#3B82F6', '#10B981'];

  const pieOptions = {
    chart: { type: 'donut', fontFamily: "'Inter', sans-serif" },
    labels: pieLabels,
    colors: pieColors,
    stroke: { width: 3, colors: [isDark ? '#1E293B' : '#FFFFFF'] },
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
              label: 'Total Tasks',
              formatter: () => dueTodayTasks.length.toString(),
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

  // Pages Progress Data
  const pagesData = useMemo(() => {
    const counts = {};
    dueTodayTasks.forEach((t) => {
      const name = t._pageName || 'Other';
      if (!counts[name]) counts[name] = 0;
      counts[name]++;
    });

    const colors = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'];
    const total = dueTodayTasks.length || 1;

    return Object.keys(counts)
      .map((k, i) => ({
        name: k,
        count: counts[k],
        percent: Math.round((counts[k] / total) * 100),
        color: colors[i % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [dueTodayTasks]);

  // Trend Chart Data (Weekly, Monthly, Yearly)
  const trendPeriodConfig = useMemo(() => {
    const now = new Date();

    // Valid open/closed tasks logic for trends
    const validTasks = realTasks.filter((t) => t._dueDate && !['completed', 'closed'].includes(String(t._status).toLowerCase()));

    // Weekly: last 7 days
    const weekLabels = [];
    const weekCounts = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      weekLabels.push(dayNames[d.getDay()]);
      weekCounts.push(
        validTasks.filter((t) => {
          const td = new Date(t._dueDate);
          td.setHours(0, 0, 0, 0);
          const dd = new Date(d);
          dd.setHours(0, 0, 0, 0);
          return td.getTime() === dd.getTime();
        }).length
      );
    }

    // Monthly: last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = [];
    const monthCounts = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(monthNames[d.getMonth()]);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      monthCounts.push(
        validTasks.filter((t) => {
          const td = new Date(t._dueDate);
          return td.getFullYear() === yr && td.getMonth() === mo;
        }).length
      );
    }

    // Yearly: last 5 years + current
    const yearLabels = [];
    const yearCounts = [];
    for (let i = 5; i >= 0; i--) {
      const yr = now.getFullYear() - i;
      yearLabels.push(String(yr));
      yearCounts.push(
        validTasks.filter((t) => {
          const td = new Date(t._dueDate);
          return td.getFullYear() === yr;
        }).length
      );
    }

    return {
      weekly: { label: 'Due Today Trend (This Week)', categories: weekLabels, data: weekCounts },
      monthly: { label: 'Due Trend (Monthly)', categories: monthLabels, data: monthCounts },
      yearly: { label: 'Due Trend (Yearly)', categories: yearLabels, data: yearCounts }
    };
  }, [realTasks]);

  const activeTrend = trendPeriodConfig[trendPeriod];

  const trendOptions = {
    chart: { type: 'line', fontFamily: "'Inter', sans-serif", toolbar: { show: false }, animations: { enabled: true, speed: 400 } },
    colors: ['#3B82F6'],
    stroke: { curve: 'straight', width: 3 },
    markers: { size: 5, colors: ['#fff'], strokeColors: '#3B82F6', strokeWidth: 2, hover: { size: 7 } },
    xaxis: {
      categories: activeTrend.categories,
      labels: { style: { colors: textMuted, fontSize: '11px', fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { min: 0, tickAmount: 4, labels: { style: { colors: textMuted, fontSize: '11px', fontWeight: 600 } } },
    grid: {
      borderColor: isDark ? '#334155' : '#F1F5F9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };
  const trendSeries = [{ name: 'Tasks Due', data: activeTrend.data }];

  // --- FULL SCREENS ---
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
              bgcolor: isDark ? alpha('#3B82F6', 0.1) : '#EFF6FF',
              color: '#3B82F6',
              '&:hover': { bgcolor: isDark ? alpha('#3B82F6', 0.2) : '#DBEAFE' }
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color={textColor}>
            {activeView === 'employee' && 'Due Today by Employee (Full List)'}
            {activeView === 'overdue' && 'Overdue Tasks (Full List)'}
            {activeView === 'pages' && 'Due Today by Pages (Full Report)'}
            {activeView === 'tasks' && 'Due Today'}
          </Typography>
          <Chip
            label="Press Esc to go back"
            size="small"
            sx={{ ml: 'auto', bgcolor: isDark ? '#334155' : '#F1F5F9', color: textMuted, fontWeight: 700, borderRadius: 2 }}
          />
        </Stack>

        <StyledCard sx={{ p: 0, borderRadius: '16px', overflow: 'hidden' }}>
          {/* FULL LIST: EMPLOYEE */}
          {activeView === 'employee' && (
            <TableContainer
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 2 }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 1 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Total Tasks</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Overdue</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Critical</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>High</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Medium</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center', pr: 3 }}>Low</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fullEmpTableData.length > 0 ? (
                    fullEmpTableData.map((row, idx) => (
                      <TableRow key={idx} hover sx={{ '& td': { borderBottom: idx === fullEmpTableData.length - 1 ? 'none' : undefined } }}>
                        <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#3B82F6', fontSize: '14px', fontWeight: 800 }}>
                              {row.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={textColor}>
                              {row.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={900} color="#3B82F6" fontSize="0.9rem">
                            {row.total}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={row.overdue > 0 ? '#EF4444' : textColor}>
                            {row.overdue}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={row.crit > 0 ? '#991B1B' : textColor}>
                            {row.crit}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={row.high > 0 ? '#EF4444' : textColor}>
                            {row.high}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={row.med > 0 ? '#3B82F6' : textColor}>
                            {row.med}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={row.low > 0 ? '#10B981' : textColor}>
                            {row.low}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary" fontWeight={600}>
                          No data found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* FULL LIST: OVERDUE */}
          {activeView === 'overdue' && (
            <TableContainer
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 2 }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 1 }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center', pr: 3 }}>
                      Days Overdue
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueTasks.length > 0 ? (
                    overdueTasks.map((t, idx) => (
                      <TableRow key={idx} hover sx={{ '& td': { borderBottom: idx === overdueTasks.length - 1 ? 'none' : undefined } }}>
                        <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                          <Typography variant="body2" fontWeight={800} fontSize="0.9rem" color={textColor}>
                            {t._title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={textColor}>
                            {t._user || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={textColor}>
                            {new Date(t._dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                          <Chip
                            label={`${t.diffDays} Day${t.diffDays > 1 ? 's' : ''}`}
                            size="small"
                            sx={{ height: 26, bgcolor: alpha('#EF4444', 0.15), color: '#EF4444', fontWeight: 900, fontSize: '0.8rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary" fontWeight={600}>
                          No overdue tasks found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* FULL LIST: TASKS */}
          {activeView === 'tasks' && (
            <TableContainer
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 2, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 2 }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 1 }}>Task No</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Created On</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center', pr: 3 }}>
                      Created By
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueTodayTasks.length > 0 ? (
                    dueTodayTasks.map((t, idx) => {
                      const pInfo = getPriorityInfo(t);
                      return (
                        <TableRow
                          key={idx}
                          hover
                          onClick={() => {
                            const ticketId = getTicketId(t);
                            if (ticketId && ticketId !== 'TCK-???') {
                              const filterRequestManagement = globalFilters?.requestManagement || 'Request For Me';
                              const routePath = filterRequestManagement === 'My Request' ? '/support/ticket-by-me' : '/support/raised-for-me';
                              navigate(`${routePath}?openTicketId=${ticketId}`);
                            }
                          }}
                          sx={{
                            cursor: 'pointer',
                            '& td': { borderBottom: idx === dueTodayTasks.length - 1 ? 'none' : undefined }
                          }}
                        >
                          <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                            <Typography variant="body2" fontWeight={800} fontSize="0.9rem" color="#0EA5E9">
                              {getTicketId(t)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} fontSize="0.9rem" color={textColor}>
                              {t._title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#0EA5E9', fontSize: '12px', fontWeight: 800 }}>
                                {(t._user || 'U').charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={textColor}>
                                {t._user || 'Unknown'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={pInfo.label}
                              size="small"
                              sx={{
                                height: 26,
                                bgcolor: alpha(pInfo.color, 0.15),
                                color: pInfo.color,
                                fontWeight: 800,
                                fontSize: '0.75rem'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight={700} fontSize="0.85rem" color={textMuted}>
                              {t._createdDate
                                ? new Date(t._createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : t._rawDate
                                  ? new Date(t._rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight={800} fontSize="0.9rem" color={textColor}>
                              {new Date(t._dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                            <Typography variant="body2" fontWeight={700} fontSize="0.85rem" color={textMuted}>
                              {t._createdBy || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary" fontWeight={600}>
                          No due tasks today
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* FULL LIST: PAGES */}
          {activeView === 'pages' && (
            <Box sx={{ p: 4 }}>
              <Stack spacing={4}>
                {pagesData.map((row, idx) => (
                  <Stack key={idx} direction="row" alignItems="center" gap={3}>
                    <Typography variant="body1" fontWeight={800} color={textColor} sx={{ width: 180 }}>
                      {row.name}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <LinearProgress
                        variant="determinate"
                        value={row.percent}
                        sx={{
                          width: '100%',
                          height: 10,
                          borderRadius: 5,
                          bgcolor: alpha(row.color, 0.1),
                          '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 5 }
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={900} color={textColor} textAlign="right" sx={{ width: 80 }}>
                      {row.count} <span style={{ fontSize: '0.85rem', color: textMuted, fontWeight: 700 }}>({row.percent}%)</span>
                    </Typography>
                  </Stack>
                ))}
                {pagesData.length === 0 && (
                  <Typography variant="body1" color="text.secondary" fontWeight={600} textAlign="center" py={4}>
                    No data available
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </StyledCard>
      </Box>
    );
  }

  // --- MAIN DASHBOARD SCREEN ---
  return (
    <Box
      sx={{
        animation: 'fadeIn 0.3s ease-in-out',
        '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } }
      }}
    >
      {/* ROW 1: STAT CARDS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' },
          gap: 2,
          mb: 2.5
        }}
      >
        {topStats.map((stat, idx) => (
          <NeonCard 
            key={idx} 
            statcolor={stat.color}
            onClick={() => {
              const filterRequestManagement = globalFilters?.requestManagement || 'Request For Me';
              const routePath = filterRequestManagement === 'My Request' ? '/support/ticket-by-me' : '/support/raised-for-me';
              
              const initialFilters = {
                taskScope: globalFilters?.performanceScope || 'Mine',
                // Since this is due today, we could potentially just show Open/In Progress tasks.
                // We'll leave ticketStatus empty so it shows all tasks but we'll navigate them to the page
              };
              
              navigate(routePath, { 
                state: { 
                  fromDashboard: true, 
                  fromTab: activeTab,
                  dashboardFilters: globalFilters,
                  initialFilters 
                } 
              });
            }}
            sx={{ cursor: 'pointer' }}
          >
            <Box className="hud-corner hud-tl" />
            <Box className="hud-corner hud-tr" />
            <Box className="hud-corner hud-bl" />
            <Box className="hud-corner hud-br" />
            <Box className="particles" />
            <Box className="rotating-border" />
            <Box className="shimmer" />

            <Typography className="hover-emoji">{stat.hoverEmoji}</Typography>

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
                  animation: 'floatIcon 4s ease-in-out infinite',
                  '@keyframes floatIcon': {
                    '0%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-5px)' },
                    '100%': { transform: 'translateY(0px)' }
                  }
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

      {/* ROW 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2.5,
          alignItems: 'stretch'
        }}
      >
        {/* Due Today by Employee */}
        <Box sx={{ gridColumn: { lg: 'span 1' } }}>
          <StyledCard sx={{ p: 2, position: 'relative' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
              <GroupRoundedIcon fontSize="small" sx={{ color: '#3B82F6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Due Today by Employee
              </Typography>
            </Stack>
            <TableContainer
              sx={{ flex: 1, mb: 2, '& .MuiTableCell-root': { py: 1.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Overdue</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Crit</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>High</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Med</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Low</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empTableData.length > 0 ? (
                    empTableData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ px: 0.5 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ px: 0.5 }}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 20, height: 20, bgcolor: '#3B82F6', fontSize: '9px', fontWeight: 800 }}>
                              {row.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} fontSize="0.7rem" noWrap sx={{ maxWidth: 60 }}>
                              {row.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={800} color="#3B82F6" fontSize="0.75rem">
                            {row.total}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={row.overdue > 0 ? '#EF4444' : textColor}>
                            {row.overdue}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={row.crit > 0 ? '#991B1B' : textColor}>
                            {row.crit}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={row.high > 0 ? '#EF4444' : textColor}>
                            {row.high}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={row.med > 0 ? '#3B82F6' : textColor}>
                            {row.med}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={row.low > 0 ? '#10B981' : textColor}>
                            {row.low}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="caption">No data</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Totals Row */}
                  {empTableData.length > 0 && (
                    <TableRow sx={{ bgcolor: isDark ? alpha('#3B82F6', 0.1) : '#EFF6FF' }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>Total</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>
                        {dueTodayTasks.length}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>
                        {overdueTasks.length}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>
                        {critCount}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>
                        {highCount}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>{medCount}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#3B82F6' }}>{lowCount}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('employee');
              }}
              underline="hover"
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#3B82F6'
              }}
            >
              View all <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </StyledCard>
        </Box>

        {/* Due Today by Priority */}
        <Box sx={{ gridColumn: { lg: 'span 1' } }}>
          <StyledCard sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
              <ShowChartRoundedIcon fontSize="small" sx={{ color: '#8B5CF6' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Due Today by Priority
              </Typography>
            </Stack>
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Box width="100%" display="flex" alignItems="center">
                <Box width="60%">
                  <ReactApexChart options={pieOptions} series={pieSeries} type="donut" height={160} />
                </Box>
                <Box width="40%" pl={2}>
                  <Stack spacing={2}>
                    {pieLabels.map((l, i) => (
                      <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: pieColors[i] }} />
                          <Typography variant="caption" fontWeight={700} color={textColor}>
                            {l}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={800} color={textColor}>
                          {pieSeries[i]}{' '}
                          <span style={{ color: textMuted, fontSize: '10px' }}>
                            ({dueTodayTasks.length > 0 ? Math.round((pieSeries[i] / dueTodayTasks.length) * 100) : 0}%)
                          </span>
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </StyledCard>
        </Box>

        {/* Overdue Tasks */}
        <Box sx={{ gridColumn: { lg: 'span 1' } }}>
          <StyledCard sx={{ p: 2, position: 'relative' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={1}>
              <AccessTimeRoundedIcon fontSize="small" sx={{ color: '#EF4444' }} />
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Overdue Tasks
              </Typography>
            </Stack>
            <TableContainer
              sx={{ flex: 1, mb: 2, '& .MuiTableCell-root': { py: 1.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted, textAlign: 'center' }}>Days Overdue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueTasks.slice(0, 3).map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Typography variant="body2" fontWeight={700} fontSize="0.75rem" noWrap sx={{ maxWidth: 100 }}>
                          {t._title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontSize="0.75rem">
                          {t._user || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontSize="0.75rem">
                          {new Date(t._dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" fontWeight={800} fontSize="0.75rem" color="#EF4444">
                          {t.diffDays} Day{t.diffDays > 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {overdueTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="caption">No overdue tasks</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('overdue');
              }}
              underline="hover"
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#3B82F6'
              }}
            >
              View all <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </StyledCard>
        </Box>
      </Box>

      {/* ROW 3 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2.5,
          alignItems: 'stretch'
        }}
      >
        {/* Due Today Trend */}
        <Box>
          <StyledCard sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
              <IconBox color="#3B82F6" bg={isDark ? alpha('#3B82F6', 0.2) : '#EFF6FF'} size={32}>
                <ShowChartRoundedIcon fontSize="small" />
              </IconBox>
              <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>
                {activeTrend.label}
              </Typography>
              {/* Period Toggle */}
              <Stack direction="row" sx={{ bgcolor: isDark ? '#0F172A' : '#F1F5F9', borderRadius: '8px', p: 0.4, gap: 0.4 }}>
                {['weekly', 'monthly', 'yearly'].map((p) => (
                  <Box
                    key={p}
                    onClick={() => setTrendPeriod(p)}
                    sx={{
                      px: 1.5,
                      py: 0.4,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'capitalize',
                      color: trendPeriod === p ? '#fff' : textMuted,
                      bgcolor: trendPeriod === p ? '#3B82F6' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: trendPeriod === p ? '#3B82F6' : alpha('#3B82F6', 0.1) }
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Box>
                ))}
              </Stack>
            </Stack>
            <Box flex={1} sx={{ ml: -2, mt: 1 }}>
              <ReactApexChart key={trendPeriod} options={trendOptions} series={trendSeries} type="line" height={220} />
            </Box>
            <Box
              sx={{
                mt: 1,
                bgcolor: isDark ? alpha('#3B82F6', 0.1) : '#EFF6FF',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
              <Typography variant="body2" fontWeight={700} color="#3B82F6">
                {dueTodayTasks.length} tasks are due today
              </Typography>
            </Box>
          </StyledCard>
        </Box>

        {/* Due Today Tasks List */}
        <Box>
          <StyledCard sx={{ p: 2, position: 'relative' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
              <FormatListBulletedRoundedIcon fontSize="small" sx={{ color: '#8B5CF6' }} />
              <Typography variant="subtitle2" fontWeight={800}>
                Due Today
              </Typography>
            </Stack>
            <TableContainer
              sx={{ flex: 1, mb: 4, '& .MuiTableCell-root': { py: 1.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Task No</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Task Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Created On</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: textMuted }}>Created By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dueTodayTasks.slice(0, 5).map((t, idx) => {
                    const pInfo = getPriorityInfo(t);
                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                          <Typography variant="body2" fontWeight={800} fontSize="0.75rem" color="#3B82F6">
                            {getTicketId(t)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} fontSize="0.75rem" color={textColor} noWrap sx={{ maxWidth: 80 }}>
                            {t._title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontSize="0.75rem" color={textMuted}>
                            {t._user || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={pInfo.label}
                            size="small"
                            sx={{ height: 22, bgcolor: alpha(pInfo.color, 0.15), color: pInfo.color, fontWeight: 800, fontSize: '0.65rem' }}
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
                  {dueTodayTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="caption">No due tasks today</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('tasks');
              }}
              underline="hover"
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#3B82F6'
              }}
            >
              View all tasks <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </StyledCard>
        </Box>

        {/* Due Today by Pages */}
        <Box>
          <StyledCard sx={{ p: 2, position: 'relative' }}>
            <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
              <DashboardRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
              <Typography variant="subtitle2" fontWeight={800}>
                Due Today by Pages
              </Typography>
            </Stack>
            {pagesData.length > 0 ? (
              <Stack spacing={3} flex={1} mb={4}>
                {pagesData.slice(0, 5).map((row, idx) => (
                  <Stack key={idx} direction="row" alignItems="center" gap={1.5}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontSize="0.75rem"
                      sx={{ flex: 1, minWidth: 100, color: textColor }}
                      noWrap
                    >
                      {row.name}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <LinearProgress
                        variant="determinate"
                        value={row.percent}
                        sx={{
                          width: '100%',
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(row.color, 0.1),
                          '& .MuiLinearProgress-bar': { bgcolor: row.color, borderRadius: 3 }
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      fontSize="0.75rem"
                      textAlign="right"
                      sx={{ minWidth: 50, color: textColor }}
                    >
                      {row.count} <span style={{ fontSize: '0.65rem', color: textMuted }}>({row.percent}%)</span>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              </Box>
            )}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('pages');
              }}
              underline="hover"
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#3B82F6'
              }}
            >
              View full report <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </StyledCard>
        </Box>
      </Box>
    </Box>
  );
}
