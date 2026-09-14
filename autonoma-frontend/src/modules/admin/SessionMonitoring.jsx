import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Avatar,
  Fade,
  LinearProgress,
  Card,
  useMediaQuery,
  Paper
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconHistory,
  IconRefresh,
  IconDeviceDesktop,
  IconClock,
  IconUserCheck,
  IconUsers,
  IconActivity,
  IconLockOpen,
  IconLock,
  IconHourglassLow,
  IconDeviceMobile,
  IconWorld,
  IconCalendarEvent
} from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { format, isToday, differenceInMinutes } from 'date-fns';
import { setFilterConfig, resetFilters } from 'store/slices/search';
import { getUserImageUrl, getCompanyImageUrl } from 'utils/upload-helper';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { BOSDataTable } from 'ui-component/bos';

// Search Configuration
const sessionSearchConfig = [
  { id: 'userId', label: 'User ID', type: 'text', placeholder: 'Search User...', isStarred: true },
  { id: 'ipAddress', label: 'IP Address', type: 'text', placeholder: 'Search IP...' },
  {
    id: 'status', label: 'Status', type: 'select', isStarred: true, options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'TIMEOUT', label: 'Timeout' }
    ]
  }
];

// ==============================|| SESSION MONITORING - PREMIUM STAT CARD ||============================== //

const StatCard = ({ title, count, icon: Icon, color, subtitle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{
      p: 1.5,
      height: '100%',
      borderRadius: '16px',
      border: '1px solid',
      borderColor: isDark ? alpha(color, 0.2) : alpha(color, 0.1),
      bgcolor: isDark ? 'background.paper' : alpha(color, 0.03),
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.1)}`
      }
    }}>
      <Avatar sx={{
        bgcolor: alpha(color, 0.1),
        color: color,
        width: 40,
        height: 40,
        borderRadius: '10px'
      }}>
        <Icon size={20} stroke={2} />
      </Avatar>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
          {count}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
          {title}
        </Typography>
      </Box>
    </Card>
  );
};

// ==============================|| SESSION MONITORING PAGE ||============================== //

const SessionMonitoring = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.AD_SESSION_MONITORING);
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyLogo, setCompanyLogo] = useState('');
  const [loading, setLoading] = useState(false);

  const searchQuery = useSelector((state) => state.search.query);
  const searchFilters = useSelector((state) => state.search.filters);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [terminatingSession, setTerminatingSession] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCompanyLogo(res.data[0].logoFileName || '');
      }
    } catch (err) {
      console.error('Failed to fetch company profile', err);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/audit/sessions');
      const sortedData = res.data.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
      setSessions(sortedData);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanyProfile();
    fetchSessions();
    dispatch(setFilterConfig(sessionSearchConfig));
    dispatch(resetFilters());
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch]);

  const userImageMap = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.userId] = u.imgName; });
    return map;
  }, [users]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter(s => s.status === 'ACTIVE').length;
    const today = sessions.filter(s => s.loginTime && isToday(new Date(s.loginTime))).length;
    const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
    return { total, active, today, uniqueUsers };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const query = (searchQuery || '').toLowerCase();
      const matchesKeyword = (
        s.userId?.toLowerCase().includes(query) ||
        s.ipAddress?.toLowerCase().includes(query) ||
        s.status?.toLowerCase().includes(query) ||
        s.userAgent?.toLowerCase().includes(query)
      );
      const userIdFilter = searchFilters.userId?.toLowerCase() || '';
      const ipFilter = searchFilters.ipAddress?.toLowerCase() || '';
      const statusFilter = searchFilters.status || '';
      const matchesUserId = !userIdFilter || s.userId?.toLowerCase().includes(userIdFilter);
      const matchesIp = !ipFilter || s.ipAddress?.toLowerCase().includes(ipFilter);
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesKeyword && matchesUserId && matchesIp && matchesStatus;
    });
  }, [sessions, searchQuery, searchFilters]);

  useEffect(() => { setPage(0); }, [searchQuery, searchFilters]);

  const paginatedSessions = useMemo(() => {
    return filteredSessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSessions, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getDuration = (session) => {
    if (!session.loginTime) return '0 min';
    const start = new Date(session.loginTime);
    const end = session.logoutTime ? new Date(session.logoutTime) : new Date();
    const mins = differenceInMinutes(end, start);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const getDeviceIcon = (ua) => {
    if (!ua) return <IconWorld size={16} />;
    const userAgent = ua.toLowerCase();
    if (userAgent.includes('mobi') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return <IconDeviceMobile size={16} />;
    }
    return <IconDeviceDesktop size={16} />;
  };

  const getStatusChip = (status) => {
    const styles = {
      ACTIVE: { color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.08), pulse: true },
      COMPLETED: { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.08), pulse: false },
      TIMEOUT: { color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.08), pulse: false }
    };
    const style = styles[status] || { color: theme.palette.grey[500], bg: alpha(theme.palette.grey[500], 0.08), pulse: false };

    return (
      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {style.pulse && (
          <Box className="pulse-dot" sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: style.color, mr: 1,
            boxShadow: `0 0 6px ${style.color}`
          }} />
        )}
        <Chip
          label={status}
          size="small"
          sx={{
            fontWeight: 700, borderRadius: '4px', color: style.color, bgcolor: style.bg,
            fontSize: '0.65rem', height: 18, border: 'none'
          }}
        />
      </Box>
    );
  };

  const columns = useMemo(() => [
    { id: 'id', label: 'LOG ID' },
    { id: 'userId', label: 'USER NAME', bold: true },
    { id: 'ipAddress', label: 'ENDPOINT' },
    { id: 'userAgent', label: 'CLIENT ENVIRONMENT' },
    { id: 'loginTime', label: 'ACTIVITY' },
    { id: 'logoutTime', label: 'ENGAGEMENT' },
    { id: 'status', label: 'STATUS' },
    { id: 'actions', label: 'ACTION' }
  ], []);

  const handleRenderCell = (col, session, idx) => {
    if (col.id === 'id') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          #{session.id?.toString().padStart(5, '0')}
        </Typography>
      );
    }
    if (col.id === 'userId') {
      const userImg = userImageMap[session.userId];
      const displayImg = userImg ? getUserImageUrl(userImg) : (companyLogo ? getCompanyImageUrl(companyLogo) : '');
      const isCompanyFallback = !userImg && companyLogo;
      return (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip
            title={
              displayImg ? (
                <Paper elevation={12} sx={{ p: 0.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <img
                    src={displayImg}
                    alt="Profile"
                    style={{ maxWidth: 150, maxHeight: 150, borderRadius: 4, display: 'block' }}
                  />
                  {isCompanyFallback && <Typography variant="caption" align="center" display="block" sx={{ mt: 0.5, fontWeight: 700, color: 'primary.main' }}>No Image</Typography>}
                </Paper>
              ) : "No Identity Image"
            }
            arrow
            placement="right"
          >
            <Avatar
              src={displayImg}
              sx={{
                width: 32, height: 32, border: `1px solid ${theme.palette.divider}`
              }}
            >
              {session.userId?.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary', fontSize: '0.75rem' }}>{session.userId}</Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#e91e63', fontWeight: 700 }}>VERIFIED SESSION</Typography>
          </Box>
        </Stack>
      );
    }
    if (col.id === 'ipAddress') {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ p: 0.5, borderRadius: '4px', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
            <IconWorld size={12} />
          </Box>
          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary' }}>
            {session.ipAddress || '127.0.0.1'}
          </Typography>
        </Stack>
      );
    }
    if (col.id === 'userAgent') {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          {getDeviceIcon(session.userAgent)}
          <Typography variant="body2" sx={{
            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontSize: '0.7rem', color: 'text.secondary'
          }}>
            {session.userAgent || 'Legacy Client'}
          </Typography>
        </Stack>
      );
    }
    if (col.id === 'loginTime') {
      return (
        <Stack direction="column" spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.primary' }}>
              {session.loginTime ? format(new Date(session.loginTime), 'MMM dd, HH:mm:ss') : 'N/A'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: session.status === 'ACTIVE' ? 'primary.main' : 'error.main' }} />
            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
              {session.logoutTime ? format(new Date(session.logoutTime), 'MMM dd, HH:mm:ss') : (session.status === 'ACTIVE' ? 'Live Connection' : 'Unknown')}
            </Typography>
          </Stack>
        </Stack>
      );
    }
    if (col.id === 'logoutTime') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconHourglassLow size={14} color={theme.palette.text.secondary} />
          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
            {getDuration(session)}
          </Typography>
        </Stack>
      );
    }
    if (col.id === 'status') {
      return getStatusChip(session.status);
    }
    if (col.id === 'actions') {
      if (session.status === 'ACTIVE') {
        return (
          <Tooltip title="Force Terminate Session" arrow>
            <IconButton
              size="small"
              onClick={() => setTerminatingSession(session)}
              sx={{
                color: theme.palette.error.main,
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
              }}
            >
              <IconLogout size={16} />
            </IconButton>
          </Tooltip>
        );
      }
      return (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>-</Typography>
      );
    }
    return null;
  };

  const handleConfirmForceLogout = async () => {
    if (!terminatingSession) return;
    setIsTerminating(true);
    try {
      await axios.post(`/api/audit/sessions/${terminatingSession.id}/force-logout`);
      setTerminatingSession(null);
      fetchSessions();
    } catch (err) {
      console.error('Failed to terminate session:', err);
    } finally {
      setIsTerminating(false);
    }
  };

  // Helper for consistent dark mode backgrounds
  const paperBg = isDark ? '#1a223f' : '#ffffff';
  const headerBg = isDark ? '#111936' : '#ffffff';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: 1.5 }}>

      {/* Top Header Section */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
          <Avatar sx={{ bgcolor: '#e91e63', width: 42, height: 42, borderRadius: '8px' }}>
            <IconHistory color="white" size={24} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2 }}>Session Audit Control</Typography>
            <Typography variant="caption" sx={{ color: '#e91e63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SYSTEM INTEGRITY & ACCESS MONITORING
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <StatCard title="Audit History" count={stats.total} icon={IconHistory} color={theme.palette.primary.main} />
          <StatCard title="Live Sessions" count={stats.active} icon={IconActivity} color={theme.palette.success.main} />
          <StatCard title="Daily Traffic" count={stats.today} icon={IconCalendarEvent} color={theme.palette.warning.main} />
          <StatCard title="Users" count={stats.uniqueUsers} icon={IconUsers} color={theme.palette.secondary.main} />

          <Tooltip title="Refresh Data">
            <IconButton
              onClick={fetchSessions}
              sx={{
                bgcolor: paperBg,
                border: '1px solid',
                borderColor: 'divider',
                width: 40,
                height: 40,
                borderRadius: '8px',
                '&:hover': { bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : 'grey.50' }
              }}
            >
              <IconRefresh size={18} className={loading ? 'animate-spin' : ''} color={theme.palette.secondary.main} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Main Table Container */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: paperBg
      }}>
        <BOSDataTable
          columns={columns}
          data={filteredSessions}
          loading={loading}
          showActions={false}
          totalCount={filteredSessions.length}
          page={page}
          size={rowsPerPage}
          onPageChange={setPage}
          onSizeChange={setRowsPerPage}
          renderCell={handleRenderCell}
          sx={{ border: 'none' }}
        />
      </Box>

      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.7; } }
          .animate-spin { animation: spin 1s linear infinite; }
          .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        `}
      </style>
      <Dialog
        open={Boolean(terminatingSession)}
        onClose={() => !isTerminating && setTerminatingSession(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? '#1a223f' : '#ffffff',
            border: '1px solid',
            borderColor: 'divider',
            p: 1
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.error.main, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'error.main'
              }}
            >
              <IconAlertTriangle size={22} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Force Logout Session?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User: {terminatingSession?.userId}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will immediately terminate the active session and disconnect the user from the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setTerminatingSession(null)}
            disabled={isTerminating}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmForceLogout}
            disabled={isTerminating}
            variant="contained"
            color="error"
            startIcon={isTerminating ? <CircularProgress size={16} color="inherit" /> : <IconLogout size={16} />}
          >
            {isTerminating ? 'Terminating...' : 'Force Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionMonitoring;
