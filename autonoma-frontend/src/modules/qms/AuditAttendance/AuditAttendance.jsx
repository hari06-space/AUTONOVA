import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Button, MenuItem, Box, Chip, Divider, Paper, Grid, Avatar } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconUsers, IconClock, IconUserCheck, IconUserX, IconCalendar, IconLogout, IconCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusChip, BOSTableToolbar, errorStyle, getCommonDateFilters, matchCommonDateFilters, BOSTimePicker } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import useBOSValidation from 'hooks/useBOSValidation';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import useBOSFilters from 'hooks/useBOSFilters';
import { formatDate, formatTime, formatDateTime } from 'utils/BOSTimeUtils';

const columns = [
  { id: 'index', label: 'NO', minWidth: 45, width: 45, align: 'center' },
  { id: 'scheduleInfo', label: 'Schedule & Date', minWidth: 160, align: 'left', bold: true },
  { id: 'participantInfo', label: 'Auditee / Auditor', minWidth: 145, align: 'left' },
  { id: 'attendanceLogs', label: 'In / Out Time', minWidth: 140, align: 'center' },
  { id: 'attendanceStatus', label: 'Attendance', minWidth: 105, align: 'center' },
  { id: 'auditScheduleStatus', label: 'Audit Status', minWidth: 95, align: 'center' }
];

const VALIDATION_RULES = [
  { field: 'auditScheduleNo', label: 'Schedule No', required: true },
  { field: 'name', label: 'Name', required: true },
  { field: 'attendanceStatus', label: 'Attendance Status', required: true }
];

const getSystemTime12h = () => {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${strMinutes} ${ampm}`;
};

const stripEmpCode = (name) => {
  if (!name) return '';
  return name.replace(/\s*\(\s*EMP-\d+\s*\)/gi, '').replace(/\s+-\s+EMP-\d+/gi, '').replace(/\s*EMP-\d+/gi, '').trim();
};

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

const getAuditDateStr = (auditDate) => {
  if (!auditDate) return '';
  if (typeof auditDate === 'string') {
    return auditDate.split('T')[0];
  }
  try {
    const d = new Date(auditDate);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const parseScheduleDateTime = (s, isEnd = false) => {
  if (!s || !s.auditDate) return null;
  const timeStr = isEnd ? s.endTime : s.startTime;
  if (!timeStr) return null;
  const dStr = getAuditDateStr(s.auditDate);
  if (!dStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier) {
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
  }

  return new Date(`${dStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
};

const getNearestScheduleNo = (availableSchedules) => {
  if (!availableSchedules || availableSchedules.length === 0) return '';
  const now = new Date();
  let nearestSch = null;
  let minDiff = Infinity;

  availableSchedules.forEach(s => {
    const schTime = parseScheduleDateTime(s, false);
    if (schTime) {
      const diff = Math.abs(schTime.getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        nearestSch = s;
      }
    }
  });

  return nearestSch ? nearestSch.scheduleNo : '';
};

export default function AuditAttendance() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { dateFormat, timeFormat } = useConfig();
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_ATTENDANCE);
  const bosFilters = useBOSFilters(perms);
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const defaultFromDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const defaultToDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { validate, clearErrors, errors } = useBOSValidation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, auditScheduleNo: '', name: '', employeeCode: '', inTime: '', outTime: '', attendanceStatus: 'PRESENT' });
  const [participants, setParticipants] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUserEmp, setCurrentUserEmp] = useState(null);
  const [checkingInMap, setCheckingInMap] = useState({});
  const [todaysAudits, setTodaysAudits] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [scheduleAttendances, setScheduleAttendances] = useState([]);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(
      setFilterConfig([
        {
          id: 'taskScope',
          label: 'Scope',
          type: 'select',
          isStarred: true,
          defaultValue: 'Mine',
          options: [
            { value: 'Mine', label: 'Mine' },
            { value: 'Team', label: 'Team' },
            { value: 'Company', label: 'Company' }
          ]
        },
        {
          id: 'attendanceStatus',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'All', label: 'ALL' },
            { value: 'PRESENT', label: 'PRESENT' },
            { value: 'ABSENT', label: 'ABSENT' }
          ],
          defaultValue: 'All',
          isStarred: true
        },
        { id: 'auditScheduleNo', label: 'Schedule No', type: 'text', placeholder: 'Filter by No...', isStarred: true },
        { id: 'employeeCode', label: 'Employee Code', type: 'text', placeholder: 'Filter by Code...', isStarred: true },
        { id: 'name', label: 'Name', type: 'text', placeholder: 'Filter by Name...', isStarred: true },
        { id: 'createdUser', label: 'CREATED USER', type: 'text' },
        { id: 'updatedUser', label: 'UPDATED USER', type: 'text' }
      ])
    );

    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager]);

  useEffect(() => {
    const fetchUserEmp = async () => {
      if (user?.empId) {
        try {
          const res = await axios.get(`/api/master/hr/employees/${user.empId}`);
          if (res.data) {
            setCurrentUserEmp(res.data);
          }
        } catch (err) {
          console.error('[AuditAttendance] Failed to fetch logged-in user employee details:', err);
        }
      }
    };
    fetchUserEmp();
  }, [user?.empId]);

  const fetchData = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    console.log('[AuditAttendance] Starting data fetch...');
    try {
      const scopeFilter = globalFilters.taskScope || 'Mine';
      const currentUserVal = user?.id || '';

      const [attRes, todaySchRes, eligibleSchRes] = await Promise.allSettled([
        axios.get('/api/qms/audit/attendance', {
          params: {
            taskScope: scopeFilter,
            currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
            memberId: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : undefined
          }
        }),
        axios.get('/api/qms/audit/attendance/today-schedules', {
          params: { currentUser: currentUserVal }
        }),
        axios.get('/api/qms/audit/attendance/eligible-schedules', {
          params: { currentUser: currentUserVal }
        })
      ]);

      if (attRes.status === 'fulfilled') {
        const data = attRes.value.data || [];
        console.log('[AuditAttendance] Attendance records loaded:', data.length);
        setRows(data);
      } else {
        console.error('[AuditAttendance] Failed to load attendance records:', attRes.reason);
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to load attendance records',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      }

      if (todaySchRes.status === 'fulfilled') {
        const todayData = todaySchRes.value.data || [];
        console.log("[AuditAttendance] Today's schedules loaded:", todayData.length);
        setTodaysAudits(todayData);
      } else {
        console.error("[AuditAttendance] Failed to load today's schedules:", todaySchRes.reason);
      }

      if (eligibleSchRes.status === 'fulfilled') {
        const eligibleData = eligibleSchRes.value.data || [];
        console.log('[AuditAttendance] Eligible schedules loaded:', eligibleData.length);
        setFilteredSchedules(eligibleData);
      } else {
        console.error('[AuditAttendance] Failed to load eligible schedules:', eligibleSchRes.reason);
      }
    } catch (error) {
      console.error('[AuditAttendance] Unexpected error in fetchData:', error);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [dispatch, globalFilters.taskScope, globalFilters.memberId, globalFilters.auditDateStart, globalFilters.auditDateEnd, globalFilters.auditDateConsider, user?.id, user?.userId, user?.name, perms.additional1, perms.manager, defaultFromDate, defaultToDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayFilteredSchedules = useMemo(() => {
    const list = [...filteredSchedules];
    if (formData.auditScheduleNo && !list.some(s => s.scheduleNo === formData.auditScheduleNo)) {
      list.push({
        id: 'selected-' + formData.auditScheduleNo,
        scheduleNo: formData.auditScheduleNo,
        startTime: ''
      });
    }
    return list;
  }, [filteredSchedules, formData.auditScheduleNo]);

  const isCheckedIn = useCallback((scheduleNo) => {
    const code = (currentUserEmp?.empCode || user?.employeeCode || '').trim().toLowerCase();
    const oldCode = (currentUserEmp?.oldEmpCode || '').trim().toLowerCase();
    const empId = currentUserEmp?.id || user?.empId;
    const userName = (currentUserEmp?.employeeName || user?.name || '').trim().toLowerCase();

    return rows.some(r => {
      if (r.auditScheduleNo !== scheduleNo) return false;
      if (r.attendanceStatus === 'PENDING') return false;

      const rCode = (r.employeeCode || '').trim().toLowerCase();
      const rOldCode = (r.employee?.oldEmpCode || '').trim().toLowerCase();
      const rEmpId = r.employeeId || r.employee?.id;
      const rName = stripEmpCode(r.name || '').trim().toLowerCase();

      if (code && (rCode === code || rOldCode === code)) return true;
      if (oldCode && (rCode === oldCode || rOldCode === oldCode)) return true;
      if (empId && rEmpId && Number(rEmpId) === Number(empId)) return true;
      if (userName && rName && (rName.includes(userName) || userName.includes(rName))) return true;

      if (!code && !empId && !userName) return true;

      return false;
    });
  }, [rows, currentUserEmp, user]);

  const pendingAudits = useMemo(() => {
    return todaysAudits.filter(audit => {
      if (isCheckedIn(audit.scheduleNo)) return false;
      if (audit.status === 'CLOSED' || audit.status === 'CANCELLED') return false;
      const enddt = parseScheduleDateTime(audit, true);
      if (enddt && new Date() > enddt) return false;
      return true;
    });
  }, [todaysAudits, isCheckedIn]);

  const availableParticipants = useMemo(() => {
    if (!formData.auditScheduleNo) return [];

    const markedCodes = new Set(
      scheduleAttendances
        .filter(r => r.auditScheduleNo === formData.auditScheduleNo)
        .map(r => (r.employeeCode || '').trim().toLowerCase())
    );

    const markedNames = new Set(
      scheduleAttendances
        .filter(r => r.auditScheduleNo === formData.auditScheduleNo)
        .map(r => stripEmpCode(r.name).trim().toLowerCase())
    );

    return participants.filter(p => {
      const pCode = (p.code || '').trim().toLowerCase();
      const pName = stripEmpCode(p.name).trim().toLowerCase();

      if (pCode && pCode !== '-') {
        return !markedCodes.has(pCode);
      }
      return !markedNames.has(pName);
    });
  }, [participants, scheduleAttendances, formData.auditScheduleNo]);

  const handleCheckIn = async (scheduleNo) => {
    if (!user) {
      dispatch(openSnackbar({ open: true, message: 'User profile not found. Cannot check in.', variant: 'alert', severity: 'error' }));
      return;
    }
    const defaultName = currentUserEmp?.employeeName || user?.name || '';
    const defaultCode = currentUserEmp?.empCode || user?.employeeCode || '';

    setCheckingInMap(prev => ({ ...prev, [scheduleNo]: true }));
    try {
      await axios.post('/api/qms/audit/attendance', {
        auditScheduleNo: scheduleNo,
        name: stripEmpCode(defaultName),
        employeeCode: defaultCode,
        inTime: getSystemTime12h(),
        attendanceStatus: 'PRESENT'
      }, { skipGlobalAlert: true });
      dispatch(openSnackbar({ open: true, message: 'Successfully checked in!', variant: 'alert', severity: 'success' }));
      window.dispatchEvent(new CustomEvent('audit-checked-in', { detail: { scheduleNo } }));
      fetchData();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to check in', variant: 'alert', severity: 'error' }));
    } finally {
      setCheckingInMap(prev => ({ ...prev, [scheduleNo]: false }));
    }
  };

  const getAttendanceRecord = useCallback((scheduleNo) => {
    const code = currentUserEmp?.empCode || user?.employeeCode || '';
    if (!code) return null;
    return rows.find(r => r.auditScheduleNo === scheduleNo && (r.employeeCode || '').trim().toLowerCase() === code.trim().toLowerCase());
  }, [rows, currentUserEmp, user]);

  const handleCheckOut = async (scheduleNo) => {
    if (!user) {
      dispatch(openSnackbar({ open: true, message: 'User profile not found. Cannot check out.', variant: 'alert', severity: 'error' }));
      return;
    }
    const defaultCode = currentUserEmp?.empCode || user?.employeeCode || '';
    const existingRecord = rows.find(r => r.auditScheduleNo === scheduleNo && (r.employeeCode || '').trim().toLowerCase() === defaultCode.trim().toLowerCase());
    if (!existingRecord) {
      dispatch(openSnackbar({ open: true, message: 'Attendance record not found for check out.', variant: 'alert', severity: 'error' }));
      return;
    }

    setCheckingInMap(prev => ({ ...prev, [scheduleNo]: true }));
    try {
      await axios.put(`/api/qms/audit/attendance/${existingRecord.id}`, {
        ...existingRecord,
        outTime: getSystemTime12h()
      }, { skipGlobalAlert: true });
      dispatch(openSnackbar({ open: true, message: 'Successfully checked out!', variant: 'alert', severity: 'success' }));
      fetchData();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to check out', variant: 'alert', severity: 'error' }));
    } finally {
      setCheckingInMap(prev => ({ ...prev, [scheduleNo]: false }));
    }
  };

  const handleOpenAdd = () => {
    const defaultName = currentUserEmp?.employeeName || user?.name || '';
    const defaultCode = currentUserEmp?.empCode || user?.employeeCode || '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Prioritize auto-selecting today's active/current audits (starting 10 minutes before start time onwards)
    const todayActiveSchedules = filteredSchedules.filter(s => {
      const schStartTime = parseScheduleDateTime(s, false);
      if (!schStartTime) return false;
      const schDateStr = getAuditDateStr(s.auditDate);
      if (schDateStr !== todayStr) return false;

      const tenMinsBefore = new Date(schStartTime.getTime() - 10 * 60 * 1000);
      return now >= tenMinsBefore;
    });

    const nearestScheduleNo = getNearestScheduleNo(todayActiveSchedules.length > 0 ? todayActiveSchedules : filteredSchedules);
    const existingRec = rows.find(r => r.auditScheduleNo === nearestScheduleNo && (r.employeeCode || '').trim().toLowerCase() === defaultCode.trim().toLowerCase());

    setFormData({
      id: existingRec ? existingRec.id : null,
      auditScheduleNo: nearestScheduleNo,
      name: stripEmpCode(defaultName),
      employeeCode: defaultCode,
      inTime: existingRec ? (existingRec.inTime || getSystemTime12h()) : getSystemTime12h(),
      outTime: existingRec ? (existingRec.outTime || '') : '',
      attendanceStatus: existingRec ? (existingRec.attendanceStatus || 'PRESENT') : 'PRESENT'
    });
    clearErrors();
    setDialogOpen(true);
  };



  useEffect(() => {
    const fetchParticipantsAndAttendances = async () => {
      if (formData.auditScheduleNo && !formData.id) {
        console.log(`[AuditAttendance] Fetching participants and attendances for schedule: ${formData.auditScheduleNo}`);
        try {
          const [partRes, attRes] = await Promise.all([
            axios.get(`/api/qms/audit/attendance/participants/${formData.auditScheduleNo}`),
            axios.get(`/api/qms/audit/attendance/by-schedule/${formData.auditScheduleNo}`)
          ]);
          setParticipants(partRes.data || []);
          setScheduleAttendances(attRes.data || []);
        } catch (err) {
          console.error(`[AuditAttendance] Error fetching details for ${formData.auditScheduleNo}:`, err);
          setParticipants([]);
          setScheduleAttendances([]);
        }
      } else {
        setParticipants([]);
        setScheduleAttendances([]);
      }
    };
    fetchParticipantsAndAttendances();
  }, [formData.auditScheduleNo, formData.id]);

  const handleOpenEdit = (row) => {
    setFormData({
      ...row,
      inTime: row.attendanceStatus === 'PRESENT' && !row.inTime ? getSystemTime12h() : (row.inTime || ''),
      outTime: row.outTime || ''
    });
    clearErrors();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const finalData = {
      ...formData,
      inTime: formData.attendanceStatus === 'PRESENT' && !formData.inTime ? getSystemTime12h() : (formData.attendanceStatus === 'ABSENT' ? '' : formData.inTime),
      outTime: formData.attendanceStatus === 'ABSENT' ? '' : formData.outTime
    };

    if (finalData.attendanceStatus === 'PRESENT' && finalData.inTime && finalData.outTime) {
      const convertToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return 0;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const modifier = match[3] ? match[3].toUpperCase() : null;
        if (modifier) {
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
        }
        return hours * 60 + minutes;
      };
      const inMins = convertToMinutes(finalData.inTime);
      const outMins = convertToMinutes(finalData.outTime);
      if (outMins < inMins) {
        dispatch(openSnackbar({ open: true, message: 'Out Time cannot be earlier than In Time.', severity: 'error', variant: 'alert' }));
        return;
      }
    }

    if (!validate(finalData, VALIDATION_RULES)) return;
    console.log('[AuditAttendance] Attempting to save attendance record:', finalData);
    try {
      let recordIdToUse = finalData.id;
      if (!recordIdToUse || recordIdToUse <= 0) {
        const existingRow = rows.find(r =>
          r.auditScheduleNo === finalData.auditScheduleNo &&
          (r.employeeCode || '').trim().toLowerCase() === (finalData.employeeCode || '').trim().toLowerCase()
        );
        if (existingRow && existingRow.id) {
          recordIdToUse = existingRow.id;
        }
      }

      if (recordIdToUse && recordIdToUse > 0) {
        await axios.put(`/api/qms/audit/attendance/${recordIdToUse}`, { ...finalData, id: recordIdToUse }, { skipGlobalAlert: true });
      } else {
        const createPayload = { ...finalData, id: null };
        await axios.post('/api/qms/audit/attendance', createPayload, { skipGlobalAlert: true });
      }
      console.log('[AuditAttendance] Save successful');
      dispatch(openSnackbar({
        open: true,
        message: 'Attendance saved successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      window.dispatchEvent(new CustomEvent('audit-checked-in', { detail: { scheduleNo: finalData.auditScheduleNo } }));
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('[AuditAttendance] RAW ERROR RECEIVED:', error);

      // Axios interceptor returns raw data object on failure
      const errorData = error.response?.data || error;
      let msg = errorData.details || errorData.message || error.message || 'Failed to save attendance';

      // Very aggressive duplicate detection on both the message and the raw error object
      const lowerMsg = String(msg).toLowerCase();
      const rawDataStr = JSON.stringify(errorData).toLowerCase();

      if (lowerMsg.includes('duplicate') || lowerMsg.includes('unique') || rawDataStr.includes('uc_audit') || rawDataStr.includes('duplicate')) {
        msg = 'Duplicate Entry: This person is already marked for this audit.';
      }

      setDialogOpen(false);
      fetchData();

      setTimeout(() => {
        dispatch(openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      }, 100);
    }
  };

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {

      const statusFilter = globalFilters.attendanceStatus || 'All';
      const matchesStatus = statusFilter === 'All' || row.attendanceStatus === statusFilter;

      const scheduleNoFilter = globalFilters.auditScheduleNo || '';
      const matchesScheduleNo = !scheduleNoFilter || (row.auditScheduleNo && row.auditScheduleNo.toLowerCase().includes(scheduleNoFilter.toLowerCase()));

      const employeeCodeFilter = globalFilters.employeeCode || '';
      const empCodeOfRow = (row.employeeCode || '').trim();
      const code = (!empCodeOfRow || empCodeOfRow === '-') && row.name && row.name.includes(' - ')
        ? row.name.split(' - ')[1].trim()
        : empCodeOfRow;
      const matchesEmployeeCode = !employeeCodeFilter || (code && code.toLowerCase().includes(employeeCodeFilter.toLowerCase()));

      const nameFilter = globalFilters.name || '';
      const name = stripEmpCode(row.name);
      const matchesName = !nameFilter || (name && name.toLowerCase().includes(nameFilter.toLowerCase()));

      const createdUserFilter = globalFilters.createdUser || '';
      const rowCreatedUser = (row.createdUser || row.createdBy || '').trim().toLowerCase();
      const matchesCreatedUser = !createdUserFilter || rowCreatedUser.includes(createdUserFilter.toLowerCase());

      const updatedUserFilter = globalFilters.updatedUser || '';
      const rowUpdatedUser = (row.updatedUser || row.updatedBy || '').trim().toLowerCase();
      const matchesUpdatedUser = !updatedUserFilter || rowUpdatedUser.includes(updatedUserFilter.toLowerCase());

      const matchesSearch = !globalQuery ||
        (row.auditScheduleNo && row.auditScheduleNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (code && code.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (name && name.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesStatus && matchesScheduleNo && matchesEmployeeCode && matchesName && matchesCreatedUser && matchesUpdatedUser && matchesSearch;
    });
    // Sort descending by id and createdDate so latest added attendance records appear at the top
    return [...filtered].sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      if (idA !== idB) return idB - idA;

      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [rows, globalQuery, globalFilters, defaultFromDate, defaultToDate]);

  const renderCell = useCallback((col, row, idx) => {
    if (col.id === 'index') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>
          {idx + 1 + page * size}
        </Typography>
      );
    }
    if (col.id === 'scheduleInfo' || col.id === 'auditScheduleNo') {
      const schDateRaw = row.auditSchedule?.auditDate || row.auditSchedule?.scheduleDate || row.auditDate || row.scheduleDate;
      const dateFormatted = formatDate(getAuditDateStr(schDateRaw), dateFormat || 'DD/MM/YYYY');
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.82rem', lineHeight: 1.2 }}>
            {row.auditScheduleNo || row.auditSchedule?.scheduleNo || '-'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem' }}>
            {dateFormatted || '-'}
          </Typography>
        </Box>
      );
    }
    if (col.id === 'participantInfo' || col.id === 'name') {
      const name = row.externalName || stripEmpCode(row.name);
      let empCode = '';
      if (row.employeeCode && row.employeeCode.startsWith('EXT:')) {
        empCode = 'EXT';
      } else {
        const oldCode = row.employee?.oldEmpCode || row.employeeCode;
        if (oldCode && oldCode !== '-' && oldCode !== 'null') {
          empCode = oldCode;
        } else {
          const nameStr = String(row.name || '');
          empCode = nameStr.includes(' - ') ? nameStr.split(' - ')[1] : (row.employeeCode || '');
        }
      }
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem', lineHeight: 1.2 }}>
            {name || '-'}
          </Typography>
          {empCode && (
            <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600, fontSize: '0.72rem' }}>
              {empCode}
            </Typography>
          )}
        </Box>
      );
    }
    if (col.id === 'attendanceLogs' || col.id === 'inTime' || col.id === 'outTime') {
      const inTimeStr = row.inTime && row.inTime !== '-' ? formatTime(row.inTime, timeFormat) : '';
      const outTimeStr = row.outTime && row.outTime !== '-' ? formatTime(row.outTime, timeFormat) : '';
      if (!inTimeStr && !outTimeStr) {
        return '-';
      }
      return (
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
          {outTimeStr ? (
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
          ) : null}
        </Box>
      );
    }
    if (col.id === 'attendanceStatus') {
      const st = String(row.attendanceStatus || row.status || 'PENDING');
      return <BOSStatusChip status={st} showIcon={true} width={100} />;
    }
    if (col.id === 'auditScheduleStatus') {
      const ms = String(row.auditSchedule?.status || 'OPEN');
      return <BOSStatusChip status={ms} showIcon={true} width={95} />;
    }
    return row[col.id] || '-';
  }, [page, size, dateFormat, timeFormat]);

  const exportRows = useMemo(() => {
    return filteredRows.map((r, i) => {
      const empCodeOfRow = (r.employeeCode || '').trim();
      const code = (!empCodeOfRow || empCodeOfRow === '-') && r.name && r.name.includes(' - ')
        ? r.name.split(' - ')[1].trim()
        : empCodeOfRow;
      const schDateRaw = r.auditSchedule?.auditDate || r.auditSchedule?.scheduleDate || r.auditDate || r.scheduleDate;
      return {
        ...r,
        auditDate: formatDate(getAuditDateStr(schDateRaw), dateFormat || 'DD/MM/YYYY'),
        employeeCode: code || '-',
        createdUser: r.createdUser || r.createdBy || '-',
        createdDate: formatDateTime(r.createdDate),
        updatedUser: r.updatedUser || r.updatedBy || '-',
        updatedDate: formatDateTime(r.updatedDate)
      };
    });
  }, [filteredRows]);

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * size, page * size + size);
  }, [filteredRows, page, size]);

  // Summary Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todays = rows.filter(r => r.createdDate && r.createdDate.split('T')[0] === todayStr);
    const present = todays.filter(r => r.attendanceStatus === 'PRESENT').length;
    const absent = todays.filter(r => r.attendanceStatus === 'ABSENT').length;
    const checkedOut = todays.filter(r => r.outTime && r.outTime.trim().length > 0).length;
    return {
      totalToday: todaysAudits.length,
      presentToday: present,
      absentToday: absent,
      checkedOutToday: checkedOut
    };
  }, [rows, todaysAudits]);

  return (
    <MainCard fullWidth
      icon={IconUsers}
      title={"Audit Attendance"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          hasWritePermission={perms.write}
          exportData={exportRows}
          exportFilename="Audit_Attendance"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
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
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Today's Audits</Typography>
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
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem', lineHeight: 1.2 }}>Absent Today</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.1, color: 'text.primary', lineHeight: 1.2 }}>{stats.absentToday}</Typography>
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
            onDoubleClickRow={handleOpenEdit}
            onEditRow={perms.write ? handleOpenEdit : undefined}
            onDeleteRow={perms.delete ? (row) => {
              if (row.id > 0) {
                setDeleteTarget(row);
                setDeleteDialogOpen(true);
              }
            } : undefined}
            onRefresh={fetchData}
            disableSearchFilter={true}
            sx={{ height: 'calc(100vh - 335px)' }}
          />
        </Box>

        {/* RIGHT PANEL: Today's Scheduled Audits */}
        <Box sx={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          order: { xs: 1, lg: 2 },
          borderLeft: { lg: '1px solid' },
          borderColor: 'divider',
          pl: { lg: 3 },
          pb: { xs: 2, lg: 0 },
          pt: { xs: 1, lg: 0 }
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1.2, color: 'text.primary', lineHeight: 1.2 }}>
            <IconClock size={20} color="#1e88e5" />
            Today's Scheduled Audits
          </Typography>

          <Stack spacing={2} sx={{ overflowY: 'auto', pr: 1, maxHeight: 'calc(100vh - 335px)' }}>
            {loading && rows.length === 0 ? (
              <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">Loading audits...</Typography>
              </Box>
            ) : pendingAudits.length === 0 ? (
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
                    No Pending Audits
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', maxWidth: 220, mx: 'auto', lineHeight: 1.45 }}>
                    There are no pending scheduled audits listed for you today.
                  </Typography>
                </Box>
              </Box>
            ) : (
              pendingAudits.map((audit) => {
                const attRec = getAttendanceRecord(audit.scheduleNo);
                const hasIn = Boolean(attRec && attRec.inTime && attRec.inTime !== '-' && attRec.inTime.trim() !== '' && attRec.attendanceStatus !== 'PENDING');
                const hasOut = Boolean(attRec && attRec.outTime && attRec.outTime !== '-' && attRec.outTime.trim() !== '');
                const isCheckingIn = checkingInMap[audit.scheduleNo];

                // Left bar indicator color
                let indicatorColor = '#1e88e5'; // Blue by default
                if (hasOut) indicatorColor = '#9e9e9e'; // Grey checked out
                else if (hasIn) indicatorColor = '#43a047'; // Green present

                return (
                  <Paper
                    key={audit.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      flexShrink: 0,
                      border: '1.5px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.8,
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
                        bgcolor: indicatorColor,
                        transition: 'background-color 0.3s ease'
                      },
                      '&:hover': {
                        borderColor: hasOut ? 'divider' : '#1e88e5',
                        boxShadow: isDark ? '0 10px 30px rgba(30,136,229,0.18)' : '0 10px 30px rgba(30,136,229,0.09)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, pl: 0.8 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.4, fontSize: '0.95rem' }}>
                          {audit.auditType || 'Unnamed Audit'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.6, fontWeight: 600 }}>
                          Sch No: {audit.scheduleNo}{getAuditDateStr(audit.auditDate) ? ` | Date: ${formatDate(getAuditDateStr(audit.auditDate), dateFormat || 'DD/MM/YYYY')}` : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={hasOut ? "Completed" : hasIn ? "In Progress" : "Scheduled"}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          borderRadius: '8px',
                          height: 24,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          bgcolor: hasOut ? 'action.selected' : hasIn ? 'success.light' : 'primary.light',
                          color: hasOut ? 'text.secondary' : hasIn ? 'success.dark' : 'primary.dark',
                          border: '1px solid',
                          borderColor: hasOut ? 'divider' : hasIn ? 'success.main' : 'primary.main',
                          px: 0.8
                        }}
                      />
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed', my: 0.2 }} />

                    <Stack spacing={1.8} sx={{ pl: 0.8 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconClock size={18} style={{ color: '#1e88e5', opacity: 0.9 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, fontSize: '0.85rem' }}>
                          {audit.startTime || ''} - {audit.endTime || ''}
                        </Typography>
                      </Stack>

                      {audit.auditor && (
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Chip
                            size="small"
                            label="Auditor"
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: isDark ? 'rgba(142,36,170,0.15)' : '#f3e5f5', color: '#8e24aa' }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {stripEmpCode(audit.auditor)}
                          </Typography>
                        </Stack>
                      )}

                      {audit.auditee && (
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Chip
                            size="small"
                            label="Auditee"
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: isDark ? 'rgba(30,136,229,0.15)' : '#e3f2fd', color: '#1e88e5' }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {stripEmpCode(audit.auditee)}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    <Box sx={{ mt: 1, display: 'flex', gap: 1.5, pl: 0.8 }}>
                      {hasOut ? (
                        <Chip
                          icon={<IconCheck size={14} />}
                          label={`Checked Out: ${attRec.outTime}`}
                          size="small"
                          sx={{ fontWeight: 800, borderRadius: '10px', px: 1, py: 2, width: '100%', justifyContent: 'center', height: 34 }}
                        />
                      ) : hasIn ? (
                        <>
                          <Chip
                            icon={<IconCheck size={14} />}
                            label={`In: ${attRec.inTime}`}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: '10px', px: 1, py: 2, flex: 1.2, justifyContent: 'center', height: 34 }}
                          />
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleCheckOut(audit.scheduleNo)}
                            disabled={isCheckingIn}
                            startIcon={<IconLogout size={16} />}
                            sx={{
                              fontWeight: 700,
                              borderRadius: '10px',
                              flex: 0.8,
                              height: 34,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'error.lighter',
                                borderColor: 'error.main'
                              }
                            }}
                          >
                            Out
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleCheckIn(audit.scheduleNo)}
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
                      )}
                    </Box>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>
      </Box>

      <BOSFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} title={(formData.id && formData.id > 0) ? 'View/Update Attendance' : 'Mark Attendance'} isViewOnly={((formData.id && formData.id > 0 && !!formData.outTime) || !perms.write)}>
        <BOSFormSection>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
            <BOSTextField
              select
              required
              label="Schedule No"
              value={formData.auditScheduleNo}
              onChange={(e) => setFormData({ ...formData, auditScheduleNo: e.target.value })}
              error={!!errors.auditScheduleNo}
              helperText={errors.auditScheduleNo}
              disabled={!!formData.id}
              sx={errorStyle(!!errors.auditScheduleNo)} >
              {displayFilteredSchedules.length > 0 ? (
                displayFilteredSchedules.map(s => <MenuItem key={s.id} value={s.scheduleNo}>{s.scheduleNo} {s.startTime ? `(${s.startTime})` : ''}</MenuItem>)
              ) : (
                <MenuItem disabled value="">No Audit Schedule available for attendance.</MenuItem>
              )}
            </BOSTextField>

            {(currentUserEmp?.employeeName && currentUserEmp?.empCode) || (user?.name && user?.employeeCode) ? (
              <BOSTextField
                required
                disabled
                label="Name"
                value={stripEmpCode(formData.name || currentUserEmp?.employeeName || user?.name || '')}
                InputProps={{ readOnly: true }}
                error={!!errors.name}
                helperText={errors.name}
                sx={errorStyle(!!errors.name)} />
            ) : (
              <BOSTextField
                select
                required
                label="Name"
                value={formData.name && formData.employeeCode ? formData.name + '|' + formData.employeeCode : ''}
                onChange={(e) => {
                  const [n, c] = e.target.value.split('|');
                  setFormData({ ...formData, name: stripEmpCode(n), employeeCode: c });
                }}
                error={!!errors.name}
                helperText={errors.name}
                disabled={!!formData.id}
                SelectProps={{
                  renderValue: (val) => val ? stripEmpCode(val.split('|')[0]) : ''
                }}
                sx={errorStyle(!!errors.name)} >
                {availableParticipants.length > 0 ? (
                  availableParticipants.map(p => <MenuItem key={p.code + p.name} value={p.name + '|' + p.code}>{stripEmpCode(p.name)}</MenuItem>)
                ) : (
                  formData.name ? (
                    <MenuItem value={formData.name + '|' + formData.employeeCode}>{stripEmpCode(formData.name)}</MenuItem>
                  ) : (
                    <MenuItem disabled value="">No Participants Found</MenuItem>
                  )
                )}
              </BOSTextField>
            )}

            <BOSTextField
              select
              required
              label="Attendance Status"
              value={formData.attendanceStatus}
              onChange={(e) => {
                const status = e.target.value;
                setFormData({
                  ...formData,
                  attendanceStatus: status,
                  inTime: status === 'ABSENT' ? '' : (formData.inTime || getSystemTime12h()),
                  outTime: status === 'ABSENT' ? '' : formData.outTime
                });
              }}
              error={!!errors.attendanceStatus}
              helperText={errors.attendanceStatus}
              disabled={!!formData.id}
              sx={errorStyle(!!errors.attendanceStatus)}
            >
              <MenuItem value="PRESENT">PRESENT</MenuItem>
              <MenuItem value="ABSENT">ABSENT</MenuItem>
            </BOSTextField>

            <BOSTimePicker
              label="In Time"
              name="inTime"
              value={formData.inTime}
              onChange={(e) => setFormData({ ...formData, inTime: e.target.value })}
              disabled={formData.attendanceStatus === 'ABSENT' || !!formData.id}
              error={!!errors.inTime}
              helperText={errors.inTime}
              sx={errorStyle(!!errors.inTime)}
            />

            {!!formData.id && !!formData.outTime && (
              <BOSTimePicker
                label="Out Time (Set by Host upon Observation)"
                name="outTime"
                value={formData.outTime}
                disabled
                error={!!errors.outTime}
                helperText="Out Time is automatically set by the Auditor/Host upon completing Audit Observations."
                sx={errorStyle(!!errors.outTime)}
              />
            )}
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await axios.delete(`/api/qms/audit/attendance/${deleteTarget.id}`);
            dispatch(openSnackbar({ open: true, message: 'Deleted!', severity: 'success' }));
            setDeleteDialogOpen(false);
            fetchData();
          } catch (error) {
            console.error('Failed to delete attendance:', error);
            let errorMsg = 'Failed';
            if (typeof error === 'string') {
              errorMsg = error;
            } else if (error.response?.data) {
              errorMsg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : errorMsg);
            } else if (error.message) {
              errorMsg = error.message;
            }
            dispatch(openSnackbar({ open: true, message: errorMsg, severity: 'error' }));
          }
        }}
        itemName={deleteTarget?.name}
      />
    </MainCard>
  );
}
