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
import { styled, alpha } from '@mui/system';
import ReactApexChart from 'react-apexcharts';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';

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

const LabCard = styled(Paper)(({ theme, statcolor }) => ({
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

// --- Determine Test Status bucket from raw _status ---
function getTestStatus(rawStatus) {
  const st = String(rawStatus || '')
    .toLowerCase()
    .trim();
  if (['to be tested', 'testing', 'ready for testing', 'waiting for tester', 'ready for qa', 'ready to test'].includes(st))
    return 'Waiting';
  if (['in testing', 'currently testing', 'testing in progress', 'qa in progress'].includes(st)) return 'In Testing';
  if (['test completed', 'tested', 'qa verified', 'qa completed', 'qa passed'].includes(st)) return 'Completed';
  return null;
}

export default function ToBeTestedDashboard({ isDark, realTasks = [], activeTab }) {
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
  const testTasks = useMemo(() => {
    return realTasks.map((t) => ({ ...t, _testStatus: getTestStatus(t._status) })).filter((t) => t._testStatus !== null);
  }, [realTasks]);

  const stWaiting = testTasks.filter((t) => t._testStatus === 'Waiting').length;
  const stInTesting = testTasks.filter((t) => t._testStatus === 'In Testing').length;
  const stCompleted = testTasks.filter((t) => t._testStatus === 'Completed').length;

  // Per-user map
  const userMap = {};
  testTasks.forEach((t) => {
    const u = t._user || 'Unknown';
    if (!userMap[u]) userMap[u] = { name: u, total: 0, waiting: 0, inTesting: 0, completed: 0 };
    userMap[u].total++;
    if (t._testStatus === 'Waiting') userMap[u].waiting++;
    if (t._testStatus === 'In Testing') userMap[u].inTesting++;
    if (t._testStatus === 'Completed') userMap[u].completed++;
  });
  const fullTesterData = Object.values(userMap).sort((a, b) => b.total - a.total);
  const testerTableData = fullTesterData.slice(0, 5);
  const totalTesters = fullTesterData.length;

  // Priority counts
  const getPriorityInfo = (t) => {
    const p = String(t._priority || 'Medium').toLowerCase();
    if (p.includes('critical')) return { label: 'Critical', color: '#991B1B' };
    if (p.includes('high')) return { label: 'High', color: '#EF4444' };
    if (p.includes('low')) return { label: 'Low', color: '#10B981' };
    return { label: 'Medium', color: '#3B82F6' };
  };

  let critCount = 0,
    highCount = 0,
    medCount = 0,
    lowCount = 0;
  testTasks.forEach((t) => {
    const l = getPriorityInfo(t).label;
    if (l === 'Critical') critCount++;
    else if (l === 'High') highCount++;
    else if (l === 'Medium') medCount++;
    else lowCount++;
  });

  const getTicketId = (t) => t._ticketId || t._id || 'TCK-???';

  // Pages data (derived from _pageName)
  const pagesData = useMemo(() => {
    const counts = {};
    testTasks.forEach((t) => {
      const name = t._pageName || 'Other';
      if (!counts[name]) counts[name] = { name, color: '#8B5CF6', total: 0, waiting: 0, inTesting: 0, completed: 0 };
      counts[name].total++;
      if (t._testStatus === 'Waiting') counts[name].waiting++;
      if (t._testStatus === 'In Testing') counts[name].inTesting++;
      if (t._testStatus === 'Completed') counts[name].completed++;
    });
    const entries = Object.values(counts).sort((a, b) => b.total - a.total);
    const total = entries.reduce((s, e) => s + e.total, 0) || 1;
    return entries.map((e) => ({ ...e, percent: Math.round((e.total / total) * 100) }));
  }, [testTasks]);

  // Trend: use _dueDate first, fallback _rawDate — same pattern as ReopenDashboard
  const trendPeriodConfig = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Helper: pick best available date, fallback to now if invalid/missing
    const getDate = (t) => {
      const d = t._reopenDate || t._reopenedDate || t.reopenDate || t.reopenedDate || t._rawDate || t._dueDate || t.updatedAt || t.createdAt;
      let parsed = d ? new Date(d) : new Date();
      if (isNaN(parsed.getTime())) parsed = new Date();
      if (parsed > now) {
        parsed = now;
      }
      return parsed;
    };

    // Weekly: last 7 days (e.g. Mon, Tue, Wed...)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekLabels = [],
      weekCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      weekLabels.push(dayNames[d.getDay()]);
      weekCounts.push(
        testTasks.filter((t) => {
          const td = getDate(t);
          return td && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate();
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
        testTasks.filter((t) => {
          const td = getDate(t);
          return td && td.getFullYear() === yr && td.getMonth() === mo;
        }).length
      );
    }

    // Yearly: last 5 + current
    const yearLabels = [],
      yearCounts = [];
    for (let i = 5; i >= 0; i--) {
      const yr = now.getFullYear() - i;
      yearLabels.push(String(yr));
      yearCounts.push(
        testTasks.filter((t) => {
          const td = getDate(t);
          return td && td.getFullYear() === yr;
        }).length
      );
    }

    return {
      weekly: { label: 'To Be Tested Trend (Weekly)', categories: weekLabels, data: weekCounts },
      monthly: { label: 'To Be Tested Trend (Monthly)', categories: monthLabels, data: monthCounts },
      yearly: { label: 'To Be Tested Trend (Yearly)', categories: yearLabels, data: yearCounts }
    };
  }, [testTasks]);

  const activeTrend = trendPeriodConfig[trendPeriod];

  // Chart options
  const trendOptions = {
    chart: {
      type: 'area',
      fontFamily: "'Inter', sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 }
    },
    colors: ['#8B5CF6'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] } },
    dataLabels: {
      enabled: true,
      offsetY: -5,
      style: { fontSize: '10px', fontWeight: 700, colors: [textColor] },
      background: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: activeTrend.categories,
      labels: { style: { colors: textMuted, fontSize: '10px', fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { min: 0, tickAmount: 4, labels: { style: { colors: textMuted, fontSize: '10px', fontWeight: 600 } } },
    grid: {
      borderColor: isDark ? '#334155' : '#F1F5F9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } }
    },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };
  const trendSeries = [{ name: 'Tasks', data: activeTrend.data }];

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
          size: '75%',
          labels: {
            show: true,
            name: { show: true, color: textMuted },
            value: { show: true, fontSize: '22px', fontWeight: 800, color: textColor },
            total: {
              show: true,
              label: 'Total Tasks',
              formatter: () => testTasks.length.toString(),
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

  // Status pie (no Blocked)
  const statusPieSeries = [stWaiting, stInTesting, stCompleted];
  const statusPieLabels = ['Waiting for Tester', 'In Testing', 'Test Completed'];
  const statusPieColors = ['#3B82F6', '#F59E0B', '#10B981'];
  const statusPieOptions = {
    chart: { type: 'donut', fontFamily: "'Inter', sans-serif" },
    labels: statusPieLabels,
    colors: statusPieColors,
    stroke: { width: 3, colors: [isDark ? '#1E293B' : '#FFFFFF'] },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: true, color: textMuted },
            value: { show: true, fontSize: '22px', fontWeight: 800, color: textColor },
            total: {
              show: true,
              label: 'Total Tasks',
              formatter: () => testTasks.length.toString(),
              color: textMuted,
              fontSize: '11px',
              fontWeight: 600
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const topStats = [
    {
      title: 'Total To Be Tested',
      value: testTasks.length,
      subtitle: 'Developer completed',
      icon: <FactCheckRoundedIcon fontSize="small" />,
      color: '#A855F7',
      grad: ['#12001F', '#25003D', '#A855F7'],
      emoji: '📋 ✨'
    },
    {
      title: 'Waiting for Tester',
      value: stWaiting,
      subtitle: 'Ready & waiting',
      icon: <HourglassEmptyRoundedIcon fontSize="small" />,
      color: '#00D4FF',
      grad: ['#001B2E', '#003B5C', '#00D4FF'],
      emoji: '⏳ ⚡'
    },
    {
      title: 'In Testing',
      value: stInTesting,
      subtitle: 'Currently being tested',
      icon: <ScienceRoundedIcon fontSize="small" />,
      color: '#FFB020',
      grad: ['#1F1200', '#3A2200', '#FFB020'],
      emoji: '🧪 🔬'
    },
    {
      title: 'Test Completed',
      value: stCompleted,
      subtitle: 'Testing completed',
      icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
      color: '#00E676',
      grad: ['#001F18', '#003D2E', '#00E676'],
      emoji: '✅ 🎉'
    },
    {
      title: 'Assigned Testers',
      value: totalTesters,
      subtitle: 'Have tasks to test',
      icon: <GroupRoundedIcon fontSize="small" />,
      color: '#00CFFD',
      grad: ['#001B2A', '#00384D', '#00CFFD'],
      emoji: '👨‍💻 👩‍💻'
    }
  ];

  const statusColor = (st) => (st === 'Waiting' ? '#3B82F6' : st === 'In Testing' ? '#F59E0B' : st === 'Completed' ? '#10B981' : '#EF4444');

  // ============================
  // FULL-SCREEN SUB VIEWS
  // ============================
  if (activeView !== 'main') {
    return (
      <Box
        sx={{
          animation: 'fadeIn 0.3s ease-in-out',
          '@keyframes spin-border': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
          '@keyframes sweep': { '0%': { left: '-100%' }, '100%': { left: '200%' } },
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-5px)' },
            '100%': { transform: 'translateY(0px)' }
          },
          '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
          '@keyframes scanline': { '0%': { top: '-10%' }, '100%': { top: '110%' } },
          '@keyframes floatUp': {
            '0%': { transform: 'translateY(0) scale(0.5)', opacity: 0 },
            '20%': { opacity: 0.8 },
            '80%': { opacity: 0.8 },
            '100%': { transform: 'translateY(-160px) scale(1.5)', opacity: 0 }
          },
          '@keyframes rotateLight': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          },
          '@keyframes gradientFlow': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          },
          '@keyframes lightSweep': {
            '0%': { left: '-100%' },
            '100%': { left: '200%' }
          },
          '@keyframes energyPulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' },
            '70%': { boxShadow: '0 0 0 15px rgba(255,255,255,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' }
          },
          '@keyframes rotateHalo': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          },
          '@keyframes numberGlow': {
            '0%': { filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' },
            '50%': { filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))' },
            '100%': { filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))' }
          }
        }}
      >
        <Stack direction="row" alignItems="center" gap={2} mb={3}>
          <IconButton
            onClick={() => setActiveView('main')}
            sx={{
              bgcolor: isDark ? alpha('#8B5CF6', 0.1) : '#F5F3FF',
              color: '#8B5CF6',
              '&:hover': { bgcolor: isDark ? alpha('#8B5CF6', 0.2) : '#EDE9FE' }
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color={textColor}>
            {activeView === 'tester' && 'To Be Tested by Tester (Full List)'}
            {activeView === 'pages' && 'To Be Tested by Pages (Full Report)'}
            {activeView === 'tasks' && 'To Be Tested'}
          </Typography>
          <Chip
            label="Press Esc to go back"
            size="small"
            sx={{ ml: 'auto', bgcolor: isDark ? '#334155' : '#F1F5F9', color: textMuted, fontWeight: 700, borderRadius: 2 }}
          />
        </Stack>

        <StyledCard sx={{ p: 0, overflow: 'hidden' }}>
          {/* FULL LIST: TESTER */}
          {activeView === 'tester' && (
            <TableContainer
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 2 }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 1 }}>Tester</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Waiting</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>In Testing</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center', pr: 3 }}>
                      Completed
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fullTesterData.length > 0 ? (
                    fullTesterData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#8B5CF6', fontSize: '14px', fontWeight: 800 }}>
                              {row.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700} fontSize="0.9rem" color={textColor}>
                              {row.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={900} color="#8B5CF6" fontSize="0.9rem">
                            {row.total}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color={row.waiting > 0 ? textColor : textMuted}>
                            {row.waiting}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color={row.inTesting > 0 ? '#F59E0B' : textMuted}>
                            {row.inTesting}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color={row.completed > 0 ? '#10B981' : textMuted}>
                            {row.completed}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" fontWeight={600}>
                          No data found
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
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
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
                  {testTasks.length > 0 ? (
                    testTasks.map((t, idx) => {
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
                            cursor: 'pointer'
                          }}
                        >
                          <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                            <Typography fontWeight={900} fontSize="0.9rem" color="#8B5CF6">
                              {getTicketId(t)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={700} fontSize="0.9rem" color={textColor}>
                              {t._title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#8B5CF6', fontSize: '12px', fontWeight: 800 }}>
                                {(t._user || 'U').charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={700} color={textColor}>
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
                            <Typography fontWeight={700} fontSize="0.85rem" color={textMuted}>
                              {t._reopenDate || t._reopenedDate || t.reopenDate || t.reopenedDate
                                ? new Date(t._reopenDate || t._reopenedDate || t.reopenDate || t.reopenedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : t._createdDate
                                ? new Date(t._createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : t._rawDate
                                  ? new Date(t._rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography fontWeight={700} fontSize="0.85rem" color={textMuted}>
                              {t._dueDate
                                ? new Date(t._dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                            <Typography fontWeight={700} fontSize="0.85rem" color={textMuted}>
                              {t._createdBy || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" fontWeight={600}>
                          No tasks found
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
            <TableContainer
              sx={{ maxHeight: '70vh', '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 2 }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, pl: 1 }}>Pages</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Total Tasks</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Waiting</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>In Testing</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center' }}>Completed</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: textMuted, textAlign: 'center', pr: 3 }}>
                      Progress
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagesData.length > 0 ? (
                    pagesData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ pl: 2 }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ pl: 1 }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
                            <Typography fontWeight={700} fontSize="0.9rem" color={textColor}>
                              {row.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={900} color="#8B5CF6" fontSize="0.9rem">
                            {row.total}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color={textColor}>
                            {row.waiting}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color={textColor}>
                            {row.inTesting}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Typography fontWeight={700} fontSize="0.9rem" color="#10B981">
                            {row.completed}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', pr: 3 }}>
                          <Stack direction="row" alignItems="center" gap={1}>
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
                            <Typography fontWeight={700} fontSize="0.75rem" color={textMuted} sx={{ minWidth: 36 }}>
                              {row.percent}%
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" fontWeight={600}>
                          No data found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
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
        '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } }
      }}
    >
      {/* ROW 1: STAT CARDS */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(3,1fr)', lg: 'repeat(5,1fr)' }, gap: 1.5, mb: 1.5 }}
      >
        {topStats.map((stat, idx) => (
          <LabCard 
            key={idx} 
            statcolor={stat.color}
            onClick={() => {
              let statusFilter = '';
              if (stat.title === 'Total To Be Tested' || stat.title === 'Waiting for Tester' || stat.title === 'In Testing') {
                statusFilter = 'To Be Tested'; // Currently TicketManagement only supports exact 'To Be Tested' status.
              } else if (stat.title === 'Test Completed') {
                statusFilter = 'To Be Tested'; // Or we route to To Be Tested and let the user see it
              }

              if (statusFilter && stat.title !== 'Assigned Testers') {
                const initialFilters = {
                  ticketStatus: statusFilter,
                  taskScope: globalFilters?.performanceScope || 'Mine'
                };
                
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
            sx={{ cursor: stat.title !== 'Assigned Testers' ? 'pointer' : 'default' }}
          >
            <Box className="rotating-border" />
            <Box className="shimmer" />
            <Box className="hud-corner hud-tl" />
            <Box className="hud-corner hud-tr" />
            <Box className="hud-corner hud-bl" />
            <Box className="hud-corner hud-br" />
            <Box className="particles" />

            <Box className="hover-emoji">{stat.emoji}</Box>

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
              {React.cloneElement(stat.icon, {
                sx: { fontSize: '2rem', color: stat.color, filter: `drop-shadow(0 0 8px ${stat.color})`, mb: 1 }
              })}

              <Typography
                variant="body2"
                fontWeight={800}
                sx={{
                  fontSize: '0.75rem',
                  color: '#CBD5E1',
                  mb: 0.5,
                  letterSpacing: '1px',
                  textAlign: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {stat.title}
              </Typography>

              <Typography
                className="kpi-number"
                variant="h3"
                fontWeight={900}
                sx={{ color: '#FFFFFF', mb: 0.25, fontSize: '2.2rem', fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.1 }}
              >
                {stat.value}
              </Typography>

              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ fontSize: '0.65rem', color: alpha(stat.color, 0.8), textAlign: 'center', lineHeight: 1.1 }}
              >
                {stat.subtitle}
              </Typography>
            </Box>
          </LabCard>
        ))}
      </Box>

      {/* ROW 2: Tester table | Priority pie | Pages table */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 1.5, mb: 1.5, alignItems: 'stretch' }}>
        {/* To Be Tested by Tester */}
        <StyledCard sx={{ p: 1.5, position: 'relative' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <GroupRoundedIcon fontSize="small" sx={{ color: '#8B5CF6' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              To Be Tested by Tester
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, mb: 4, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Tester</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Waiting</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>In Testing</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testerTableData.length > 0 ? (
                  testerTableData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 20, height: 20, bgcolor: '#8B5CF6', fontSize: '9px', fontWeight: 800 }}>
                            {row.name.charAt(0)}
                          </Avatar>
                          <Typography fontSize="0.7rem" fontWeight={700} noWrap sx={{ maxWidth: 60 }}>
                            {row.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={800} fontSize="0.75rem" color="#8B5CF6">
                          {row.total}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.waiting > 0 ? textColor : textMuted}>
                          {row.waiting}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.inTesting > 0 ? '#F59E0B' : textMuted}>
                          {row.inTesting}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography fontWeight={700} fontSize="0.75rem" color={row.completed > 0 ? '#10B981' : textMuted}>
                          {row.completed}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        No data
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {testerTableData.length > 0 && (
                  <TableRow sx={{ bgcolor: isDark ? alpha('#8B5CF6', 0.1) : '#F5F3FF' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>Total</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>
                      {testTasks.length}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>{stWaiting}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>
                      {stInTesting}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#8B5CF6' }}>
                      {stCompleted}
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
              setActiveView('tester');
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
              color: '#8B5CF6'
            }}
          >
            View all <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          </Link>
        </StyledCard>

        {/* To Be Tested by Priority */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <ShowChartRoundedIcon fontSize="small" sx={{ color: '#3B82F6' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              To Be Tested by Priority
            </Typography>
          </Stack>

          <Box className="particle p1" />
          <Box className="particle p2" />
          <Box className="particle p3" />
          <Box className="particle p4" />
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={priorityPieOptions} series={priorityPieSeries} type="donut" height={230} />
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
                        ({testTasks.length > 0 ? Math.round((priorityPieSeries[i] / testTasks.length) * 100) : 0}%)
                      </span>
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </StyledCard>

        {/* To Be Tested by Pages */}
        <StyledCard sx={{ p: 1.5, position: 'relative' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <DashboardRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              To Be Tested by Pages
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, mb: 4, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: 'none', bgcolor: isDark ? alpha('#334155', 0.5) : '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }} width={50}>S.No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted }}>Pages</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Waiting</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>In Testing</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.65rem', color: textMuted, textAlign: 'center' }}>Done</TableCell>
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
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: row.color }} />
                        <Typography fontSize="0.7rem" fontWeight={700} noWrap sx={{ maxWidth: 80 }}>
                          {row.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={800} fontSize="0.75rem" color="#8B5CF6">
                        {row.total}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.waiting > 0 ? textColor : textMuted}>
                        {row.waiting}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.inTesting > 0 ? '#F59E0B' : textMuted}>
                        {row.inTesting}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color={row.completed > 0 ? '#10B981' : textMuted}>
                        {row.completed}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {pagesData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        No data
                      </Typography>
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
              color: '#8B5CF6'
            }}
          >
            View all <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          </Link>
        </StyledCard>
      </Box>

      {/* ROW 3: Trend | Latest Tasks | Testing Status Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' }, gap: 2, alignItems: 'stretch' }}>
        {/* Trend Chart */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <IconBox color="#8B5CF6" bg={isDark ? alpha('#8B5CF6', 0.2) : '#F5F3FF'} size={32}>
              <ShowChartRoundedIcon fontSize="small" />
            </IconBox>
            <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>
              {activeTrend.label}
            </Typography>
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
                    bgcolor: trendPeriod === p ? '#8B5CF6' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: trendPeriod === p ? '#8B5CF6' : alpha('#8B5CF6', 0.1) }
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Box>
              ))}
            </Stack>
          </Stack>
          <Box sx={{ ml: -2, mt: 1 }}>
            <ReactApexChart key={trendPeriod} options={trendOptions} series={trendSeries} type="area" height={220} />
          </Box>
          {testTasks.length > 0 && (
            <Box
              sx={{
                mt: 1,
                bgcolor: isDark ? alpha('#8B5CF6', 0.1) : '#F5F3FF',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <HourglassEmptyRoundedIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />
              <Typography variant="body2" fontWeight={700} color="#8B5CF6">
                {stWaiting} tasks are waiting to be tested
              </Typography>
            </Box>
          )}
        </StyledCard>

        {/* Latest Tasks Table */}
        <StyledCard sx={{ p: 1.5, position: 'relative' }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <FormatListBulletedRoundedIcon fontSize="small" sx={{ color: '#8B5CF6' }} />
            <Typography variant="subtitle2" fontWeight={800}>
              To Be Tested
            </Typography>
          </Stack>
          <TableContainer
            sx={{ flex: 1, mb: 4, '& .MuiTableCell-root': { py: 0.5, borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` } }}
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
                {testTasks.slice(0, 5).map((t, idx) => {
                  const pInfo = getPriorityInfo(t);
                  return (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: textMuted }}>
                                <Typography variant="body2" fontWeight={800} fontSize="0.8rem" color={textMuted}>
                                  {idx + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                        <Typography fontWeight={800} fontSize="0.72rem" color="#8B5CF6">
                          {getTicketId(t)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} fontSize="0.72rem" color={textColor} noWrap sx={{ maxWidth: 80 }}>
                          {t._title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.72rem" color={textMuted} noWrap sx={{ maxWidth: 60 }}>
                          {t._user || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={pInfo.label}
                          size="small"
                          sx={{ height: 20, bgcolor: alpha(pInfo.color, 0.15), color: pInfo.color, fontWeight: 800, fontSize: '0.6rem' }}
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
                {testTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        No testing tasks
                      </Typography>
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
              color: '#8B5CF6'
            }}
          >
            View all tasks <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
          </Link>
        </StyledCard>

        {/* Testing Status Overview */}
        <StyledCard sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
            <CheckCircleOutlineRoundedIcon fontSize="small" sx={{ color: '#10B981' }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
              Testing Status Overview
            </Typography>
          </Stack>

          <Box className="particle p1" />
          <Box className="particle p2" />
          <Box className="particle p3" />
          <Box className="particle p4" />
          <Box display="flex" alignItems="center" width="100%">
            <Box width="55%">
              <ReactApexChart options={statusPieOptions} series={statusPieSeries} type="donut" height={230} />
            </Box>
            <Box width="45%" pl={1}>
              <Stack spacing={2}>
                {statusPieLabels.map((l, i) => (
                  <Stack key={i} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusPieColors[i] }} />
                      <Typography variant="caption" fontWeight={700} color={textColor} noWrap sx={{ maxWidth: 90 }}>
                        {l}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={800} color={textColor}>
                      {statusPieSeries[i]}{' '}
                      <span style={{ color: textMuted, fontSize: '9px' }}>
                        ({testTasks.length > 0 ? Math.round((statusPieSeries[i] / testTasks.length) * 100) : 0}%)
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
