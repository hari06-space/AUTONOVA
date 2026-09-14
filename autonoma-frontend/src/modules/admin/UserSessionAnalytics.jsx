import TextField from 'ui-component/CustomTextField';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Grid, Typography, Stack, Avatar, Paper, useTheme, LinearProgress, Chip, IconButton, Tooltip, Autocomplete, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// third-party
import Chart from 'react-apexcharts';
import {
  IconActivity, IconClock, IconBrowser, IconUser,
  IconRefresh, IconSearch, IconPower, IconTerminal2,
  IconCpu, IconBolt, IconArrowUpRight, IconTarget,
  IconCircleCheck, IconTrendingUp
} from '@tabler/icons-react';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSDataTable, BOSExportButton } from 'ui-component/bos';

const API_BASE = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '');

// ==============================|| PREMIUM STAT CARD ||============================== //

const PremiumStatCard = ({ title, value, icon, color, trend, subtitle }) => {
  const theme = useTheme();
  return (
    <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 400 }}>
      <Paper sx={{
        p: 3,
        borderRadius: '24px',
        bgcolor: 'background.paper',
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.5),
        position: 'relative',
        overflow: 'hidden',
        height: '100%'
      }}>
        <Box sx={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, transparent 100%)`
        }} />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{
            p: 1.5, borderRadius: '16px',
            background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
            color: '#fff',
            boxShadow: `0 8px 20px ${alpha(color, 0.3)}`
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary' }}>{value}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{subtitle}</Typography>
          {trend && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconTrendingUp size={14} color={color} />
              <Typography variant="caption" sx={{ color: color, fontWeight: 900 }}>{trend}</Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    </motion.div>
  );
};

// ==============================|| USER SESSION ANALYTICS PAGE ||============================== //

const UserSessionAnalytics = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.AD_SESSION_ANALYTICS);
  const isSuperUser = user?.userLevel === 5;

  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [stats, setStats] = useState({
    avgDuration: '0s',
    totalUsers: 0,
    mostVisited: 'N/A',
    totalSessions: 0,
    totalUsageTime: '0h',
    idleTime: '0m',
    efficiency: 0
  });

  const [activeSessions, setActiveSessions] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const selectedUserImg = useMemo(() => {
    if (!selectedUser || allUsers.length === 0) return null;
    const found = allUsers.find(u => u.userId?.toString().toLowerCase() === selectedUser.toString().toLowerCase());
    return found?.imgName || null;
  }, [selectedUser, allUsers]);

  const loadData = useCallback(async () => {
    try {
      const [navResponse, sessionsResponse, usersRes] = await Promise.all([
        axios.get('/api/analytics/sessions/navigation'),
        axios.get('/api/audit/sessions'),
        axios.get('/api/users/all')
      ]);

      const rawData = navResponse.data;
      const sessions = sessionsResponse.data;
      const usersData = usersRes.data;

      setAllUsers(usersData);

      // Extract user IDs for super user selection
      const uniqueUsers = [...new Set(rawData.map((log) => log.userId))].sort();
      setUserList(uniqueUsers);

      setRawData(rawData);
      setActiveSessions(sessions.filter((s) => s.status === 'ACTIVE'));

      const filtered = selectedUser ? rawData.filter(l => l.userId === selectedUser) : rawData;
      const sorted = [...filtered].sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));
      setFilteredData(sorted);
      calculateStats(sorted);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadData();
    // Reduced from 10 s → 60 s. Paused when tab is hidden to avoid
    // allocating new rawData arrays in the background unnecessarily.
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') loadData();
    }, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  const applyFilter = () => {
    const filtered = selectedUser ? rawData.filter(l => l.userId === selectedUser) : rawData;
    setFilteredData(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (logs) => {
    if (!logs.length) {
      setStats({ avgDuration: '0s', totalUsers: 0, mostVisited: 'N/A', totalSessions: 0, totalUsageTime: '0h', idleTime: '0m', efficiency: 0 });
      return;
    }

    const totalDurationMs = logs.reduce((acc, log) => acc + (log.durationMs || 0), 0);
    const idleDurationMs = logs.filter(l => l.isIdle).reduce((acc, log) => acc + (log.durationMs || 0), 0);
    const activeDurationMs = totalDurationMs - idleDurationMs;

    const activeHours = (activeDurationMs / 3600000).toFixed(1);
    const idleMinutes = Math.floor(idleDurationMs / 60000);

    const efficiency = totalDurationMs > 0 ? Math.round((activeDurationMs / totalDurationMs) * 100) : 0;

    const avgDurationMs = activeDurationMs / logs.filter(l => !l.isIdle).length || 0;
    const avgMinutes = Math.floor(avgDurationMs / 60000);
    const avgSeconds = Math.floor((avgDurationMs % 60000) / 1000);

    const users = new Set(logs.map(l => l.userId));
    const pageCounts = logs.filter(l => !l.isIdle).reduce((acc, log) => { acc[log.pageName] = (acc[log.pageName] || 0) + 1; return acc; }, {});
    const mostVisited = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    setStats({
      avgDuration: `${avgMinutes}m ${avgSeconds}s`,
      totalUsers: users.size,
      mostVisited: mostVisited,
      totalSessions: logs.filter(l => !l.isIdle).length,
      totalUsageTime: `${activeHours}h`,
      idleTime: `${idleMinutes}m`,
      efficiency: efficiency
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '---';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
  };

  const columns = useMemo(() => [
    { id: 'userId', label: 'USER', bold: true },
    { id: 'pageName', label: 'TARGET MODULE' },
    { id: 'entryTime', label: 'In TIME' },
    { id: 'exitTime', label: 'EXIT TIME' },
    { id: 'durationMs', label: 'ENGAGEMENT TIME' },
    { id: 'status', label: 'FLOW STATUS' }
  ], []);

  const handleRenderCell = (col, log, idx) => {
    if (col.id === 'userId') {
      return (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={log.userImage ? `${API_BASE}/api/users/image/${log.userImage}` : ''}
            sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6', fontWeight: 800 }}
          >
            {log.userId?.charAt(0)}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{log.userId}</Typography>
        </Stack>
      );
    }
    if (col.id === 'pageName') {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.pageName}</Typography>
          <Typography variant="caption" color="textSecondary">{log.pageUrl}</Typography>
        </Box>
      );
    }
    if (col.id === 'entryTime') {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(log.entryTime).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="textSecondary">{new Date(log.entryTime).toLocaleTimeString()}</Typography>
        </Box>
      );
    }
    if (col.id === 'exitTime') {
      return log.exitTime ? (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(log.exitTime).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="textSecondary">{new Date(log.exitTime).toLocaleTimeString()}</Typography>
        </Box>
      ) : (
        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>Ongoing...</Typography>
      );
    }
    if (col.id === 'durationMs') {
      return (
        <Typography variant="subtitle2" sx={{ color: '#6366f1', fontWeight: 800 }}>{formatDuration(log.durationMs)}</Typography>
      );
    }
    if (col.id === 'status') {
      return (
        <Chip
          label={log.isIdle ? 'IDLE LOG' : (log.exitTime ? 'ARCHIVED' : 'ACTIVE')}
          size="small"
          sx={{
            fontWeight: 900, fontSize: '0.65rem', height: 22,
            bgcolor: log.isIdle ? alpha('#ec4899', 0.1) : (log.exitTime ? alpha('#94a3b8', 0.1) : alpha('#10b981', 0.1)),
            color: log.isIdle ? '#ec4899' : (log.exitTime ? '#64748b' : '#10b981')
          }}
        />
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Grid container spacing={4}>
        {/* ==============================|| HEADER ||============================== // */}
        <Grid item xs={12}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Box>
              <Typography variant="h1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1.4rem', letterSpacing: '-0.04em' }}>BOS Usage Analytics</Typography>
              <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>Real-time user behavior tracking and efficiency analytics.</Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {selectedUser && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Avatar
                    src={selectedUserImg ? `${API_BASE}/api/users/image/${selectedUserImg}` : ''}
                    sx={{ width: 44, height: 44, border: '2px solid #e2e8f0', bgcolor: '#6366f1' }}
                  >
                    {selectedUser.charAt(0)}
                  </Avatar>
                </motion.div>
              )}
              {isSuperUser && (
                <Autocomplete
                  size="small"
                  options={userList}
                  value={selectedUser}
                  onChange={(event, newValue) => setSelectedUser(newValue)}
                  sx={{
                    width: 320,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: 'background.default',
                      '& fieldset': { borderColor: '#e2e8f0' }
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Targeted User" variant="outlined" />}
                />
              )}
              <Button
                variant="contained"
                startIcon={<IconRefresh size={18} />}
                onClick={loadData}
                sx={{
                  borderRadius: '12px', px: 3, py: 1,
                  bgcolor: '#6366f1',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  '&:hover': { bgcolor: '#4f46e5' }
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </Grid>

        {/* ==============================|| KPI GRID ||============================== // */}
        <Grid item xs={12}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2.5 }}>
            <PremiumStatCard title="ACTIVE USERS" value={activeSessions.length} icon={<IconActivity size={24} />} color="#6366f1" subtitle="Live stream count" trend="+3 New" />
            <PremiumStatCard title="INACTIVE USERS" value={Math.max(0, allUsers.length - activeSessions.length)} icon={<IconPower size={24} />} color="#94a3b8" subtitle="Off-grid users" trend="Idle" />
            <PremiumStatCard title="UNIQUE USERS" value={stats.totalUsers} icon={<IconUser size={24} />} color="#06b6d4" subtitle="System identities" trend="Growing" />
            <PremiumStatCard title="ACTIVE ENGINE TIME" value={stats.totalUsageTime} icon={<IconClock size={24} />} color="#8b5cf6" subtitle="Net usage duration" trend="Stable" />
            <PremiumStatCard title="IDLE TIME" value={stats.idleTime} icon={<IconCpu size={24} />} color="#ec4899" subtitle="Total idle buffer" trend="-15% Idle" />
          </Box>
        </Grid>

        {/* ==============================|| ANALYTICS DASHBOARD ROW ||============================== // */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: '32px', bgcolor: 'background.paper', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography variant="h3" fontWeight={900}>Traffic Intensity Flow</Typography>
              <Chip label="LIVE STREAM" size="small" sx={{ fontWeight: 800, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }} />
            </Stack>
            <Chart
              options={{
                chart: { type: 'area', toolbar: { show: false } },
                stroke: { curve: 'smooth', width: 3 },
                colors: ['#6366f1'],
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0 } },
                xaxis: {
                  categories: ['0:00', '4:00', '8:00', '12:00', '16:00', '20:00', '22:00'],
                  axisBorder: { show: false }, axisTicks: { show: false }
                },
                grid: { borderColor: '#f1f5f9' },
                dataLabels: { enabled: false }
              }}
              series={[{ name: 'Engagement', data: [30, 40, 25, 55, 30, 60, 40, 45, 15, 30] }]}
              type="area" height={260}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: '32px', bgcolor: 'background.paper', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', height: '100%', textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>System Efficiency</Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Chart
                options={{
                  chart: { type: 'radialBar', sparkline: { enabled: true } },
                  plotOptions: {
                    radialBar: {
                      hollow: { size: '70%' },
                      dataLabels: {
                        name: { show: false },
                        value: { offsetY: 12, color: '#1e293b', fontSize: '38px', fontWeight: 900 }
                      }
                    }
                  },
                  colors: ['#6366f1'],
                  stroke: { lineCap: 'round' }
                }}
                series={[stats.efficiency]}
                type="radialBar" height={260}
              />
              <Box sx={{ position: 'absolute', bottom: 15, width: '100%', textAlign: 'center' }}>
                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                  <IconCircleCheck size={16} color="#6366f1" />
                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ELITE PERFORMANCE
                  </Typography>
                </Stack>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 3, px: 2, fontWeight: 500 }}>
              Productivity rating based on interaction density.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 4, borderRadius: '32px', bgcolor: 'background.paper', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', height: '100%' }}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 3 }}>Time Investment</Typography>
            <Chart
              options={{
                chart: { type: 'bar', toolbar: { show: false } },
                plotOptions: {
                  bar: {
                    borderRadius: 6,
                    horizontal: true,
                    barHeight: '60%',
                    distributed: true
                  }
                },
                colors: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'],
                xaxis: {
                  categories: Object.entries(filteredData.reduce((acc, l) => {
                    acc[l.pageName] = (acc[l.pageName] || 0) + (l.durationMs || 0);
                    return acc;
                  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]),
                  labels: { show: false },
                  axisBorder: { show: false }
                },
                grid: { show: false },
                dataLabels: {
                  enabled: true,
                  formatter: (val) => `${Math.floor(val / 60000)}m`,
                  style: { fontWeight: 900, colors: ['#fff'] }
                },
                legend: { show: false }
              }}
              series={[{
                name: 'Time Spent',
                data: Object.entries(filteredData.reduce((acc, l) => {
                  acc[l.pageName] = (acc[l.pageName] || 0) + (l.durationMs || 0);
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[1])
              }]}
              type="bar" height={260}
            />
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>Total duration per module (Minutes)</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* ==============================|| DATA TERMINAL ||============================== // */}
        <Grid item xs={12} sx={{ mx: -4, width: 'calc(100% + 64px) !important' }}>
          <Paper sx={{
            borderRadius: 0, bgcolor: 'background.paper',
            boxShadow: 'none',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 3, px: 4, borderBottom: '1px solid', borderColor: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h3" fontWeight={900}>Comprehensive Audit Trail</Typography>
              {perms.export && (
                <BOSExportButton
                  data={filteredData}
                  filename="User_Session_Analytics"
                  pageCode={PAGE_CODES.AD_SESSION_ANALYTICS}
                  pageName="User Session Analytics"
                  columns={[
                    { header: 'User', key: 'userId' },
                    { header: 'Target Module', key: 'pageName' },
                    { header: 'Page URL', key: 'pageUrl' },
                    { header: 'In Time', key: 'entryTime' },
                    { header: 'Exit Time', key: 'exitTime' },
                    { header: 'Duration (ms)', key: 'durationMs' }
                  ]}
                  size="small"
                  sx={{ py: 0.5 }}
                />
              )}
            </Box>
            <BOSDataTable
              columns={columns}
              data={filteredData}
              loading={loading}
              showActions={false}
              totalCount={filteredData.length}
              page={page}
              size={rowsPerPage}
              onPageChange={setPage}
              onSizeChange={setRowsPerPage}
              renderCell={handleRenderCell}
              sx={{ border: 'none' }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserSessionAnalytics;
