import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Button, Grid, Paper, Avatar, Divider, Chip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconClock, IconCheck, IconCalendar, IconUserCheck, IconUserX, IconLogout } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, matchCommonDateFilters } from 'ui-component/bos';
import { matchDateRange } from 'ui-component/bos/BOSUtils';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import AttendanceEntryDialog from './AttendanceEntryDialog';

const columns = [
  { id: 'index', label: 'NO', minWidth: 45, width: 45, align: 'center' },
  { id: 'scheduleInfo', label: 'Meeting & Schedule', minWidth: 155, align: 'left', bold: true },
  { id: 'participantName', label: 'Participant', minWidth: 125, align: 'left' },
  { id: 'meetingDateTime', label: 'Meeting Timing', minWidth: 165, align: 'left' },
  { id: 'attendanceLogs', label: 'In / Out Time', minWidth: 140, align: 'center' },
  { id: 'status', label: 'Attendance', minWidth: 105, align: 'center' },
  { id: 'meetingStatus', label: 'Meeting Status', minWidth: 95, align: 'center' }
];

const getHoursMinutes = (timeVal) => {
  if (!timeVal) return [0, 0];
  if (Array.isArray(timeVal)) {
    return [parseInt(timeVal[0], 10), parseInt(timeVal[1], 10)];
  }
  const parts = String(timeVal).split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0];
};

import { useLocation } from 'react-router-dom';

const formatDateToISO = (dateStr) => {
  if (!dateStr) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
};

export default function AttendanceList() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const defaultFromDate = useMemo(() => new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], []);
  const defaultToDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_ATTENDANCE);
  const { user } = useAuth();
  const bosFilters = useBOSFilters(perms);

  const location = useLocation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusFilter = searchParams.get('status');
  const dashboardFilter = searchParams.get('dashboardFilter');
  const scheduleIdParam = searchParams.get('scheduleId');

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // Today's agenda states
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [todaysLoading, setTodaysLoading] = useState(false);
  const [checkingInMap, setCheckingInMap] = useState({});

  // Dynamic stats calculator for meetings
  const stats = useMemo(() => {
    const totalToday = todaysMeetings.length;
    let presentToday = 0;
    let checkedOutToday = 0;

    todaysMeetings.forEach(meeting => {
      const att = rows.find(row => row.schedule?.id === meeting.id && row.employee?.id === user?.empId);
      if (att) {
        if (att.outTime) {
          checkedOutToday++;
        } else if (att.inTime) {
          presentToday++;
        }
      }
    });

    const pendingToday = totalToday - presentToday - checkedOutToday;

    return { totalToday, presentToday, checkedOutToday, pendingToday };
  }, [todaysMeetings, rows, user?.empId]);

  // ── GLOBAL FILTER CONFIG ──
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    dispatch(setFilterConfig([
      {
        id: 'taskScope', label: 'Scope', type: 'select', isStarred: true,
        options: bosFilters.getFilterOptions(),
        defaultValue: 'Mine'
      },
      {
        id: 'auditDate',
        label: 'Meeting Date',
        type: 'dateRange',
        isStarred: true
      },
      {
        id: 'searchBy', label: 'Search By', type: 'select',
        options: [
          { value: 'scheduleNo', label: 'Schedule No' },
          { value: 'participant', label: 'Participant' }
        ],
        defaultValue: 'scheduleNo'
      },
      { id: 'searchText', label: 'Search', type: 'text', placeholder: 'Search...' }]));

    dispatch(setFilters({
      auditDateStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      auditDateEnd: new Date().toISOString().split('T')[0],
      auditDateConsider: 'Yes'
    }));

    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  // ── FETCH HISTORICAL ATTENDANCE ──
  const fetchData = useCallback(async () => {
    if (globalFilters?.auditDateStart === undefined) return;
    setLoading(true);
    try {
      const params = {
        taskScope: globalFilters?.taskScope || 'Mine',
        currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
        memberId: (globalFilters?.memberId && globalFilters?.memberId !== 'All') ? globalFilters?.memberId : undefined,
        fromDate: formatDateToISO(globalFilters?.auditDateStart || defaultFromDate),
        toDate: formatDateToISO(globalFilters?.auditDateEnd || defaultToDate),
        considerDate: globalFilters?.auditDateConsider || 'Yes'
      };
      const response = await axios.get(API_PATHS.QMS.MEETING_ATTENDANCE, { params });
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [globalFilters?.taskScope, globalFilters?.memberId, globalFilters?.auditDateStart, globalFilters?.auditDateEnd, globalFilters?.auditDateConsider, user?.userId, user?.id, defaultFromDate, defaultToDate]);

  // ── FETCH TODAY'S MEETINGS ──
  const fetchTodaysMeetings = useCallback(async (showLoader = false) => {
    if (showLoader) setTodaysLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.MEETINGS_TODAY);
      setTodaysMeetings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch today\'s meetings:', error);
    } finally {
      if (showLoader) setTodaysLoading(false);
    }
  }, []);

  // ── HISTORICAL ATTENDANCE FETCH ──
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── TODAY'S MEETINGS (INITIAL LOAD + SILENT BACKGROUND SYNC) ──
  useEffect(() => {
    fetchTodaysMeetings(true);
    const interval = setInterval(() => {
      fetchTodaysMeetings(false); // 100% silent background update without unmounting DOM
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTodaysMeetings]);

  useEffect(() => {
    if (scheduleIdParam && todaysMeetings.length > 0) {
      const match = todaysMeetings.find((m) => String(m.id) === String(scheduleIdParam));
      if (match) {
        setSelectedRow({ schedule: match, employee: { id: user?.empId } });
        setDialogOpen(true);
      }
    }
  }, [scheduleIdParam, todaysMeetings, user?.empId]);

  const refreshAllData = useCallback(() => {
    fetchData();
    fetchTodaysMeetings(false);
  }, [fetchData, fetchTodaysMeetings]);

  const refreshAfterCheckIn = useCallback(() => {
    fetchTodaysMeetings(false);
    fetchData();
  }, [fetchTodaysMeetings, fetchData]);

  // ── DERIVED CHECK-IN STATUS ──
  const isCheckedIn = useCallback((meetingId) => {
    return rows.some(row => row.schedule?.id === meetingId && row.employee?.id === user?.empId && row.status !== 'PENDING');
  }, [rows, user?.empId]);

  // ── CHECK-IN HANDLER ──
  const handleCheckIn = async (meetingId) => {
    if (!user?.empId) {
      dispatch(openSnackbar({ open: true, message: 'User profile not found. Cannot check in.', variant: 'alert', severity: 'error' }));
      return;
    }
    const meeting = todaysMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    setCheckingInMap(prev => ({ ...prev, [meetingId]: true }));
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Determine check-in status
    let checkInStatus = 'PRESENT';
    if (meeting.startTime) {
      const [h, m] = getHoursMinutes(meeting.startTime);
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (now > startTime) {
        checkInStatus = 'LATE';
      }
    }

    try {
      await axios.post(API_PATHS.QMS.MEETING_ATTENDANCE, {
        scheduleId: meetingId,
        employeeId: user.empId,
        inTime: timeStr,
        status: checkInStatus
      });
      dispatch(openSnackbar({ open: true, message: 'Successfully checked in!', variant: 'alert', severity: 'success' }));
      refreshAfterCheckIn();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to check in', variant: 'alert', severity: 'error' }));
    } finally {
      setCheckingInMap(prev => ({ ...prev, [meetingId]: false }));
    }
  };

  // ── FILTERING ──
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Apply drill-down status filter from URL if present
      if (statusFilter) {
        const s = row.status || 'PENDING';
        if (s.toUpperCase() !== statusFilter.toUpperCase()) return false;
      }

      if (dashboardFilter) {
        const todayStr = new Date().toLocaleDateString('en-CA'); // gets YYYY-MM-DD in local time
        let meetingDate = row.schedule?.meetingDate;
        if (Array.isArray(meetingDate)) {
           meetingDate = `${meetingDate[0]}-${String(meetingDate[1]).padStart(2, '0')}-${String(meetingDate[2]).padStart(2, '0')}`;
        } else if (typeof meetingDate === 'string') {
           meetingDate = meetingDate.substring(0, 10);
        }
        
        let scheduleStatus = row.schedule?.status || 'OPEN';
        if (typeof scheduleStatus === 'object' && scheduleStatus !== null) scheduleStatus = scheduleStatus.name || 'OPEN';

        if (dashboardFilter === 'today') {
          if (meetingDate !== todayStr) return false;
        } else if (dashboardFilter === 'absent') {
          if (meetingDate !== todayStr) return false;
          const s = row.status || 'PENDING';
          if (s.toUpperCase() !== 'ABSENT') return false;
        } else if (dashboardFilter === 'upcoming') {
           if (meetingDate !== todayStr) return false;
           if (scheduleStatus.toUpperCase() !== 'OPEN') return false;
           const attStatus = row.status || 'PENDING';
           if (attStatus.toUpperCase() !== 'PENDING' && attStatus.toUpperCase() !== 'OPEN') return false;
           if (row.schedule?.startTime) {
              const now = new Date();
              const [h, m] = getHoursMinutes(row.schedule.startTime);
              const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
              const limitTime = new Date(startTime.getTime() - 10 * 60000);
              if (now >= limitTime) return false;
           } else {
              return false; // missing start time goes to pending
           }
        } else if (dashboardFilter === 'pending') {
           if (meetingDate !== todayStr) return false;
           if (scheduleStatus.toUpperCase() !== 'OPEN') return false;
           const attStatus = row.status || 'PENDING';
           if (attStatus.toUpperCase() !== 'PENDING' && attStatus.toUpperCase() !== 'OPEN') return false;
           if (row.schedule?.startTime) {
              const now = new Date();
              const [h, m] = getHoursMinutes(row.schedule.startTime);
              const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
              const limitTime = new Date(startTime.getTime() - 10 * 60000);
              if (now < limitTime) return false;
           }
        }
      }

      if (!matchDateRange(row, globalFilters, 'auditDate', 'schedule.meetingDate')) return false;

      const searchText = globalFilters.searchText || '';
      if (searchText) {
        const q = searchText.toLowerCase();
        const field = globalFilters.searchBy || 'scheduleNo';
        if (field === 'scheduleNo' && !(row.schedule?.scheduleNo || '').toLowerCase().includes(q)) return false;
        if (field === 'participant' && !(row.employee?.employeeName || '').toLowerCase().includes(q)) return false;
      }
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (row.schedule?.scheduleNo || '').toLowerCase().includes(q) ||
          (row.employee?.employeeName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, globalQuery, globalFilters, statusFilter, dashboardFilter]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const pendingMeetings = useMemo(() => {
    return todaysMeetings.filter(meeting => !isCheckedIn(meeting.id));
  }, [todaysMeetings, isCheckedIn]);

  const handleAdd = () => {
    if (!perms.write) return;
    setSelectedRow(null);
    setDialogOpen(true);
  };
  useKeyboardShortcuts({ 'ctrl+n': handleAdd });

  // Time formatting helper supporting strings and array formats
  const formatTimeSlot = (start, end) => {
    const formatTime = (timeVal) => {
      if (!timeVal) return '';
      let h24 = 0;
      let m24 = 0;
      if (Array.isArray(timeVal)) {
        h24 = parseInt(timeVal[0], 10);
        m24 = parseInt(timeVal[1], 10);
      } else {
        const parts = timeVal.split(':');
        h24 = parseInt(parts[0], 10);
        m24 = parseInt(parts[1] || '00', 10);
      }
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      return `${String(h12).padStart(2, '0')}:${String(m24).padStart(2, '0')} ${ampm}`;
    };
    if (!start) return '';
    if (!end) return formatTime(start);
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // ── RENDER CELL ──
  const renderCell = (col, row, idx) => {
    let val;
    if (col.id === 'index') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>
          {idx + 1 + page * size}
        </Typography>
      );
    } else if (col.id === 'scheduleInfo' || col.id === 'scheduleNo') {
      val = (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.82rem', lineHeight: 1.2 }}>
            {row.schedule?.scheduleNo || '-'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
            {row.schedule?.meetingType?.meetingName || '-'}
          </Typography>
        </Box>
      );
    } else if (col.id === 'participantName') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem' }}>
          {row.employee?.employeeName || '-'}
        </Typography>
      );
    } else if (col.id === 'meetingDateTime' || col.id === 'meetingDate') {
      const dateVal = row.schedule?.meetingDate || '-';
      const timeVal = formatTimeSlot(row.schedule?.startTime, row.schedule?.endTime);
      val = (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem', lineHeight: 1.2 }}>
            {dateVal}
          </Typography>
          {timeVal && (
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.72rem' }}>
              {timeVal}
            </Typography>
          )}
        </Box>
      );
    } else if (col.id === 'attendanceLogs' || col.id === 'inTime' || col.id === 'outTime') {
      const inTimeStr = formatTimeSlot(row.inTime);
      const outTimeStr = formatTimeSlot(row.outTime);
      if (!inTimeStr && !outTimeStr) {
        val = '-';
      } else {
        val = (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6, flexWrap: 'wrap' }}>
            {inTimeStr && (
              <Chip
                label={`In: ${inTimeStr}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: 1
                }}
              />
            )}
            {outTimeStr && (
              <Chip
                label={`Out: ${outTimeStr}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: '#f5f3ff',
                  color: '#7c3aed',
                  border: '1px solid #ddd6fe',
                  borderRadius: 1
                }}
              />
            )}
          </Box>
        );
      }
    } else if (col.id === 'status') {
      const s = row.status || 'PENDING';
      val = <BOSStatusChip status={s} showIcon={true} width={100} />;
    } else if (col.id === 'meetingStatus') {
      const ms = row.schedule?.status || '-';
      val = <BOSStatusChip status={ms} showIcon={true} width={95} />;
    } else {
      val = row[col.id] || '-';
    }

    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
        {val}
      </div>
    );
  };

  const handleEdit = (row) => {
    setDialogOpen(true);
    setSelectedRow(row);
  };

  return (
    <MainCard fullWidth
      icon={IconClock}
      title={"Meeting User Attendance"}
      secondary={
        <BOSTableToolbar
          onRefresh={refreshAllData}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('Mark Attendance', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Meeting_User_Attendance"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      {/* Two-column layout: table fills full height on left, sidebar floats on right */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1.15fr' }, gap: 3, alignItems: 'stretch', pt: 0.5, px: 0.2 }}>

        {/* LEFT PANEL: Stats Dashboard + Historical Attendance List */}
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', order: { xs: 2, lg: 1 } }}>

          {/* Professional Compact Stats Dashboard */}
          <Grid container spacing={1.5} sx={{ mb: 2, pt: 0.2, px: 0.2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: 1.4,
                borderRadius: '10px',
                background: isDark ? 'rgba(30, 136, 229, 0.05)' : '#f8fafd',
                border: '1px solid',
                borderColor: isDark ? 'rgba(30, 136, 229, 0.12)' : '#e3effb',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.01)',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#1e88e5'
                }
              }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(30, 136, 229, 0.12)' : '#e3f2fd', color: '#1e88e5', width: 32, height: 32 }}>
                  <IconCalendar size={16} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Today's Meetings</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.1, color: 'text.primary', lineHeight: 1.2 }}>{stats.totalToday}</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: 1.4,
                borderRadius: '10px',
                background: isDark ? 'rgba(67, 160, 71, 0.05)' : '#f8faf8',
                border: '1px solid',
                borderColor: isDark ? 'rgba(67, 160, 71, 0.12)' : '#e8f5e9',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.01)',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#43a047'
                }
              }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(67, 160, 71, 0.12)' : '#e8f5e9', color: '#43a047', width: 32, height: 32 }}>
                  <IconUserCheck size={16} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Checked In</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.1, color: 'text.primary', lineHeight: 1.2 }}>{stats.presentToday}</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: 1.4,
                borderRadius: '10px',
                background: isDark ? 'rgba(229, 115, 115, 0.05)' : '#fff8f8',
                border: '1px solid',
                borderColor: isDark ? 'rgba(229, 115, 115, 0.12)' : '#ffebee',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.01)',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#e53935'
                }
              }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(229, 115, 115, 0.12)' : '#ffebee', color: '#e53935', width: 32, height: 32 }}>
                  <IconUserX size={16} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Pending</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.1, color: 'text.primary', lineHeight: 1.2 }}>{stats.pendingToday}</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{
                p: 1.4,
                borderRadius: '10px',
                background: isDark ? 'rgba(142, 36, 170, 0.05)' : '#faf8fc',
                border: '1px solid',
                borderColor: isDark ? 'rgba(142, 36, 170, 0.12)' : '#f3e5f5',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.01)',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#8e24aa'
                }
              }}>
                <Avatar sx={{ bgcolor: isDark ? 'rgba(142, 36, 170, 0.12)' : '#f3e5f5', color: '#8e24aa', width: 32, height: 32 }}>
                  <IconLogout size={16} />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Checked Out</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.1, color: 'text.primary', lineHeight: 1.2 }}>{stats.checkedOutToday}</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <BOSDataTable
            columns={columns}
            rows={paginatedRows}
            page={page}
            size={size}
            totalCount={filteredRows.length}
            loading={loading}
            onPageChange={setPage}
            onSizeChange={(s) => { setSize(s); setPage(0); }}
            renderCell={renderCell}
            showActions={false}
            onDoubleClickRow={handleEdit}
            id="meeting-attendance-table"
            disableSearchFilter={true}
            sx={{ height: 'calc(100vh - 335px)' }}
          />
        </Box>

        {/* RIGHT PANEL: Today's Scheduled Meetings — fixed width, independent scroll */}
        <Box sx={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          order: { xs: 1, lg: 2 },
          borderLeft: { lg: '1px solid' },
          borderColor: { lg: 'divider' },
          pl: { lg: 3 },
          pb: { xs: 2, lg: 0 },
          pt: { xs: 1, lg: 0 }
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1.2, color: 'text.primary', lineHeight: 1.2 }}>
            <IconClock size={20} color="#1e88e5" />
            Scheduled Meetings
          </Typography>

          <Stack spacing={2} sx={{ overflowY: 'auto', pr: 1, maxHeight: 'calc(100vh - 335px)' }}>
            {todaysLoading && todaysMeetings.length === 0 ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Loading meetings...</Typography>
              </Box>
            ) : pendingMeetings.length === 0 ? (
              <Box sx={{
                py: 6,
                px: 3,
                textAlign: 'center',
                background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)' : 'linear-gradient(135deg, rgba(30,136,229,0.02) 0%, rgba(255,255,255,0.85) 100%)',
                borderRadius: '24px',
                border: '1.5px dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(30,136,229,0.22)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                boxShadow: isDark ? 'none' : 'inset 0 0 16px rgba(30,136,229,0.02)'
              }}>
                <Avatar sx={{
                  bgcolor: isDark ? 'rgba(30,136,229,0.15)' : '#e3f2fd',
                  color: '#1e88e5',
                  width: 56,
                  height: 56,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(30,136,229,0.25)' : 'rgba(30,136,229,0.15)'
                }}>
                  <IconCalendar size={28} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.6 }}>
                    No Pending Meetings
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', maxWidth: 220, mx: 'auto', lineHeight: 1.45 }}>
                    There are no pending scheduled meetings listed for today.
                  </Typography>
                </Box>
              </Box>
            ) : (
              pendingMeetings.map((meeting) => {
                const isCheckingIn = checkingInMap[meeting.id];
                return (
                  <Box
                    key={meeting.id}
                    sx={{
                      p: 2.5,
                      border: '1.5px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.2,
                      bgcolor: isDark ? 'background.default' : '#fafafa',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '6px',
                        height: '100%',
                        bgcolor: '#1e88e5'
                      },
                      '&:hover': {
                        borderColor: '#1e88e5',
                        boxShadow: isDark ? '0 10px 30px rgba(30,136,229,0.18)' : '0 10px 30px rgba(30,136,229,0.09)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, pl: 0.8 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.4, fontSize: '0.95rem' }}>
                          {meeting.meetingName || meeting.meetingType?.meetingName || 'Unnamed Meeting'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.6, fontWeight: 600 }}>
                          Sch No: {meeting.scheduleNo}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed', my: 0.2 }} />

                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pl: 0.8 }}>
                      <IconClock size={18} style={{ color: '#1e88e5', opacity: 0.9 }} />
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.85rem' }}>
                        {formatTimeSlot(meeting.startTime, meeting.endTime)}
                      </Typography>
                    </Stack>

                    <Box sx={{ mt: 1, pl: 0.8 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleCheckIn(meeting.id)}
                        disabled={isCheckingIn}
                        startIcon={<IconCheck size={16} />}
                        sx={{
                          fontWeight: 800,
                          borderRadius: '10px',
                          width: '100%',
                          height: 36,
                          boxShadow: isDark ? '0 4px 15px rgba(30,136,229,0.35)' : '0 4px 12px rgba(30,136,229,0.22)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: isDark ? '0 6px 20px rgba(30,136,229,0.45)' : '0 6px 16px rgba(30,136,229,0.3)',
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        {isCheckingIn ? 'Checking In...' : 'Check In'}
                      </Button>
                    </Box>
                  </Box>
                );
              })
            )}
          </Stack>
        </Box>
      </Box>

      <AttendanceEntryDialog
        open={dialogOpen}
        item={selectedRow}
        onClose={() => { setDialogOpen(false); setSelectedRow(null); }}
        onSave={() => { setDialogOpen(false); setSelectedRow(null); refreshAllData(); }}
      />
    </MainCard>
  );
}

