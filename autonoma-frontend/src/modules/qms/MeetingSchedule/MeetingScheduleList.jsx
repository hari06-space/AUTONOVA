import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Stack, Button, Tooltip, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconPlus, IconCalendarEvent, IconRefresh, IconGitBranch, IconAlertTriangle, IconX, IconPlayerPlay, IconCalendarOff, IconCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSFormDialog, btnNew, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, matchDateRange } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import { isMobile } from 'react-device-detect';
import AddMeetingSchedule from './AddMeetingSchedule';

const formatTime12h = (time24) => {
  if (!time24) return '-';
  const [hours, minutes] = time24.split(':');
  const hNum = parseInt(hours, 10);
  const ampm = hNum >= 12 ? 'PM' : 'AM';
  let h = hNum % 12;
  if (h === 0) h = 12;
  const m = String(minutes || '00').substring(0, 2).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const formatTime12hNoAmPm = (time24) => {
  if (!time24) return '-';
  const [hours, minutes] = String(time24).split(':');
  const hNum = parseInt(hours, 10);
  let h = hNum % 12;
  if (h === 0) h = 12;
  const m = String(minutes || '00').substring(0, 2).padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}`;
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
};

const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'scheduleNo', label: 'Schedule No', minWidth: 150, bold: true },
  { id: 'revSourceScheduleNo', label: 'Amd Sch No', minWidth: 180, align: 'center' },
  { id: 'scheduleDate', label: 'Schedule Date', minWidth: 110, align: 'center' },
  { id: 'meetingTime', label: 'Meeting Time', minWidth: 110, align: 'center' },
  { id: 'frequency', label: 'Frequency', minWidth: 120, align: 'center' },
  { id: 'comments', label: 'Meeting Description', minWidth: 180 },
  { id: 'departmentNames', label: 'Department', minWidth: 160 },
  { id: 'meetingTypeName', label: 'Meeting Type', minWidth: 140, align: 'center' },
  { id: 'chairedByName', label: 'Chaired By', minWidth: 130, align: 'center' },
  { id: 'hostByName', label: 'Host By', minWidth: 130, align: 'center' },
  { id: 'participantsBy', label: 'Participants', minWidth: 200 },
  { id: 'status', label: 'Status', minWidth: 100, align: 'center' }
];

export default function MeetingScheduleList() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlStatus = searchParams.get('status');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const globalMaxResult = useSelector((state) => state.search?.maxResult || '');
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_SCHEDULE);
  const { user } = useAuth();
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [meetingTypes, setMeetingTypes] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [amendDialogOpen, setAmendDialogOpen] = useState(false);
  const [selectedForAmend, setSelectedForAmend] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const isManager = Boolean(perms.manager || user?.userLevel >= 5 || user?.userLevel === 1);

  const selectedStatusUpper = selectedRow ? String(typeof selectedRow.status === 'object' ? selectedRow.status?.name : selectedRow.status || selectedRow.statusObj?.name || '').toUpperCase().trim() : '';
  const canBeCancelled = ['OPEN', 'AMENDED', 'RESCHEDULE'].includes(selectedStatusUpper);
  const isCancelDisabled = !selectedRow || !canBeCancelled;
  const cancelTooltipMsg = !selectedRow
    ? "Select a schedule to cancel"
    : (!canBeCancelled ? `Schedule status '${selectedStatusUpper}' cannot be cancelled` : "Cancel selected schedule");

  const handleCancelClick = () => {
    if (!selectedRow || !canBeCancelled) return;
    setCancelReasonInput('');
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReasonInput.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter a cancellation reason', variant: 'alert', severity: 'warning' }));
      return;
    }
    try {
      setCancelling(true);
      await axios.put(`${API_PATHS.QMS.MEETING_SCHEDULES}/${selectedRow.id}/cancel`, {
        reason: cancelReasonInput.trim()
      });
      dispatch(openSnackbar({ open: true, message: `Schedule ${selectedRow.scheduleNo} cancelled successfully!`, variant: 'alert', severity: 'success' }));
      setCancelDialogOpen(false);
      setCancelReasonInput('');
      setSelectedRow(null);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel schedule:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to cancel schedule: ' + (error.response?.data?.message || error.message), variant: 'alert', severity: 'error' }));
    } finally {
      setCancelling(false);
    }
  };

  useKeyboardShortcuts(
    {
      'space+s': () => {
        if (cancelDialogOpen && !cancelling && cancelReasonInput.trim()) {
          handleCancelConfirm();
        }
      },
      'escape': () => {
        if (cancelDialogOpen && !cancelling) {
          setCancelDialogOpen(false);
        }
      }
    },
    cancelDialogOpen
  );

  useEffect(() => {
    const fetchMeetingTypes = async () => {
      try {
        const response = await axios.get('/api/lookups/bulk?types=MEETINGS');
        if (response.data && response.data.MEETINGS) {
          setMeetingTypes(response.data.MEETINGS);
        }
      } catch (error) {
        console.error('Failed to fetch meeting types lookup:', error);
      }
    };
    fetchMeetingTypes();
  }, []);

  // Sync URL parameter status filter with Redux store to update dropdown value automatically
  useEffect(() => {
    if (urlStatus) {
      dispatch(setFilters({ status: urlStatus.toUpperCase() }));
    }
  }, [dispatch, urlStatus]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = (globalQuery || '').trim();
      setDebouncedSearchQuery(q);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalQuery]);

  // Helper to check if an employee object matches a target (ID, code, or name)
  const checkEmpMatch = useCallback((empObj, targetEmpId, targetUserObj) => {
    if (!empObj) return false;

    // Check by targetEmpId if specified
    if (targetEmpId !== undefined && targetEmpId !== null && targetEmpId !== '' && String(targetEmpId) !== 'All') {
      const empIdStr = String(empObj.id || empObj.empId || '').trim();
      if (empIdStr && empIdStr === String(targetEmpId)) return true;
    }

    // Check against targetUserObj
    if (targetUserObj) {
      const empIdStr = String(empObj.id || empObj.empId || '').trim();
      const targetEmpIdStr = String(targetUserObj.empId || targetUserObj.id || '').trim();
      if (empIdStr && targetEmpIdStr && empIdStr === targetEmpIdStr) return true;

      const targetEmpCode = String(targetUserObj.empCode || targetUserObj.employeeCode || targetUserObj.oldEmpCode || '').toLowerCase().trim();
      const empCode = String(empObj.empCode || empObj.oldEmpCode || '').toLowerCase().trim();
      if (targetEmpCode && empCode && targetEmpCode === empCode) return true;

      const targetName = String(targetUserObj.employeeName || targetUserObj.name || '').toLowerCase().trim();
      const empName = String(empObj.employeeName || empObj.name || '').toLowerCase().trim();
      if (targetName && empName && (targetName === empName || empName.includes(targetName) || targetName.includes(empName))) return true;

      const targetUsername = String(targetUserObj.userId || targetUserObj.id || '').toLowerCase().trim();
      if (targetUsername && empCode && empCode === targetUsername) return true;
    }

    return false;
  }, []);

  const isUserInSchedule = useCallback((row, targetEmpId, targetUserObj) => {
    if (!row) return false;
    if (row.chairedBy && checkEmpMatch(row.chairedBy, targetEmpId, targetUserObj)) return true;
    if (row.hostBy && checkEmpMatch(row.hostBy, targetEmpId, targetUserObj)) return true;
    if (row.secondaryHost && checkEmpMatch(row.secondaryHost, targetEmpId, targetUserObj)) return true;
    if (row.tertiaryHost && checkEmpMatch(row.tertiaryHost, targetEmpId, targetUserObj)) return true;
    if (Array.isArray(row.participants)) {
      if (row.participants.some(p => checkEmpMatch(p.employee || p, targetEmpId, targetUserObj))) return true;
    }
    if (targetUserObj) {
      const myUsername = String(targetUserObj.userId || targetUserObj.id || '').toLowerCase().trim();
      const myName = String(targetUserObj.name || '').toLowerCase().trim();
      const myEmpCode = String(targetUserObj.empCode || targetUserObj.employeeCode || '').toLowerCase().trim();
      const creator = String(row.createdUser || row.createdBy || '').toLowerCase().trim();
      if (creator && (creator === myUsername || creator === myName || creator === myEmpCode)) return true;
    }
    return false;
  }, [checkEmpMatch]);

  // ── RESOLVED ROWS (SOP #16 Standard & Client-side search) ──
  const processedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    const mapped = rows.map(row => {
      const d = row.meetingDate || '';
      const t = row.startTime || '';
      const formattedDate = d ? d.split('-').reverse().join('/') : '-';

      return {
        ...row,
        scheduleDate: d ? formattedDate : '-',
        meetingTime: t ? formatTime12h(t) : '-',
        frequency: row.frequency || row.meetingFrequency || row.meetingType?.frequency || row.meetingType?.meetingFrequency || '-',
        comments: row.comments || '-',
        meetingTypeName: row.meetingType?.meetingName || '-',
        meetingDateTime: d ? `${formattedDate} ${formatTime12h(t)}` : '-',
        departmentNames: (row.departments || []).map(d => d.department?.departmentName).filter(Boolean).join(','),
        chairedByName: row.chairedBy?.employeeName || '-',
        hostByName: row.hostBy?.employeeName || '-',
        participantsBy: (row.participants || []).map(pr => {
          const e = pr.employee;
          return e ? e.employeeName : '';
        }).filter(Boolean).join(', '),
        createdUser: row.createdUser || row.createdBy || '-',
        updatedUser: (() => {
          const createdRaw = row.createdAt || row.createdDate || null;
          const updatedRaw = row.updatedAt || row.updatedDate || null;
          const isUpdated = createdRaw && updatedRaw && (new Date(updatedRaw).getTime() - new Date(createdRaw).getTime() > 1000);
          return isUpdated ? (row.updatedUser || row.updatedBy || '-') : '-';
        })(),
        createdAtRaw: row.createdAt || row.createdDate || null,
        updatedAtRaw: row.updatedAt || row.updatedDate || null,
        status: row.status || 'OPEN'
      };
    });

    const statusFilter = globalFilters?.status || 'OPEN';
    const scopeFilter = globalFilters?.taskScope || 'Mine';
    const selectedMemberId = globalFilters?.memberId;

    return mapped.filter(row => {
      // 0. Scope and Member Filter (Mine / Team / Company + Member)
      if (selectedMemberId && String(selectedMemberId) !== 'All') {
        const selectedEmp = (bosFilters.employees || []).find(e => String(e.id) === String(selectedMemberId) || String(e.userId) === String(selectedMemberId) || String(e.empId) === String(selectedMemberId));
        if (!isUserInSchedule(row, selectedMemberId, selectedEmp)) return false;
      } else if (scopeFilter) {
        const scopeLower = String(scopeFilter).toLowerCase().trim();

        if (scopeLower === 'mine') {
          if (!isUserInSchedule(row, user?.empId, user)) return false;
        } else if (scopeLower === 'team') {
          const isMine = isUserInSchedule(row, user?.empId, user);
          const isTeamMember = (bosFilters.myTeamEmployees || []).some(teamEmp => isUserInSchedule(row, teamEmp.id, teamEmp));
          if (!isMine && !isTeamMember) return false;
        } else if (scopeLower === 'company') {
          // company scope without specific member shows all
        }
      }

      // Date Filters
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;
      if (!matchDateRange(row, globalFilters, 'meetingDate')) return false;

      // 1. Status Filter (Only Open and Amended visible in default list view)
      if (statusFilter && String(statusFilter).toUpperCase() !== 'ALL') {
        const rowStatus = String(row.status || '').toUpperCase().trim();
        if (String(statusFilter).toUpperCase() === 'OPEN') {
          const allowedStatuses = ['OPEN', 'AMENDED'];
          if (!allowedStatuses.includes(rowStatus)) return false;
        } else if (String(statusFilter).toUpperCase() === 'RESCHEDULE') {
          const rescheduleStatuses = ['RESCHEDULE', 'RE-SCHEDULED', 'RESCHEDULED'];
          if (!rescheduleStatuses.includes(rowStatus)) return false;
        } else {
          const queryStatus = String(statusFilter).toUpperCase().trim();
          if (rowStatus !== queryStatus) return false;
        }
      }

      // Filter by Schedule Number from Global Filters
      if (globalFilters?.scheduleNo) {
        const schQ = String(globalFilters.scheduleNo).toLowerCase().trim();
        if (schQ && !String(row.scheduleNo || '').toLowerCase().includes(schQ)) return false;
      }

      // Filter by Frequency from Global Filters
      if (globalFilters?.frequency && String(globalFilters.frequency).toUpperCase() !== 'ALL') {
        const freqQ = String(globalFilters.frequency).toLowerCase().trim();
        if (freqQ && !String(row.frequency || '').toLowerCase().includes(freqQ)) return false;
      }

      // 2. Extensible Future Filters structure
      if (globalFilters?.departmentId && String(globalFilters.departmentId).toUpperCase() !== 'ALL') {
        const targetVal = String(globalFilters.departmentId).toLowerCase().trim();
        const hasDept = (row.departments || []).some(d => {
          const deptId = String(d.department?.id || '').toLowerCase();
          const deptName = String(d.department?.departmentName || '').toLowerCase();
          return deptId === targetVal || deptName.includes(targetVal);
        });
        if (!hasDept) return false;
      }

      if (globalFilters?.meetingTypeId && String(globalFilters.meetingTypeId).toUpperCase() !== 'ALL') {
        const targetVal = String(globalFilters.meetingTypeId).toLowerCase().trim();
        const mId = String(row.meetingType?.id || '').toLowerCase();
        const mName = String(row.meetingType?.meetingName || '').toLowerCase();
        const mPrefix = String(row.meetingType?.meetingPrefix || '').toLowerCase();
        if (mId !== targetVal && mName !== targetVal && mPrefix !== targetVal) return false;
      }

      if (globalFilters?.chairedById && String(globalFilters.chairedById).toUpperCase() !== 'ALL') {
        const targetVal = String(globalFilters.chairedById).toLowerCase().trim();
        const cId = String(row.chairedBy?.id || '').toLowerCase();
        const cName = String(row.chairedByName || '').toLowerCase();
        if (cId !== targetVal && !cName.includes(targetVal)) return false;
      }

      if (globalFilters?.hostById && String(globalFilters.hostById).toUpperCase() !== 'ALL') {
        const targetVal = String(globalFilters.hostById).toLowerCase().trim();
        const hId = String(row.hostBy?.id || '').toLowerCase();
        const hName = String(row.hostByName || '').toLowerCase();
        if (hId !== targetVal && !hName.includes(targetVal)) return false;
      }

      // 3. Global Search query matching all visible text fields
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        const matchesScheduleNo = String(row.scheduleNo || '').toLowerCase().includes(q);
        const matchesRevSourceNo = String(row.revSourceScheduleNo || '').toLowerCase().includes(q);
        const matchesScheduleDate = String(row.scheduleDate || '').toLowerCase().includes(q);
        const matchesMeetingTime = String(row.meetingTime || '').toLowerCase().includes(q);
        const matchesFrequency = String(row.frequency || '').toLowerCase().includes(q);
        const matchesDescription = String(row.comments || '').toLowerCase().includes(q);
        const matchesDepartments = String(row.departmentNames || '').toLowerCase().includes(q);
        const matchesMeetingType = String(row.meetingTypeName || '').toLowerCase().includes(q);
        const matchesChaired = String(row.chairedByName || '').toLowerCase().includes(q);
        const matchesHost = String(row.hostByName || '').toLowerCase().includes(q);
        const matchesParticipants = String(row.participantsBy || '').toLowerCase().includes(q);
        const matchesStatus = String(row.status || '').toLowerCase().includes(q);

        return matchesScheduleNo || matchesRevSourceNo || matchesScheduleDate || matchesMeetingTime || matchesFrequency || matchesDescription || matchesDepartments || matchesMeetingType || matchesChaired || matchesHost || matchesParticipants || matchesStatus;
      }

      return true;
    });
  }, [
    rows,
    globalFilters?.taskScope,
    globalFilters?.memberId,
    globalFilters?.status,
    globalFilters?.scheduleNo,
    globalFilters?.frequency,
    globalFilters?.departmentId,
    globalFilters?.meetingTypeId,
    globalFilters?.chairedById,
    globalFilters?.hostById,
    debouncedSearchQuery,
    globalFilters,
    perms?.additional1,
    user,
    bosFilters.employees,
    bosFilters.myTeamEmployees,
    isUserInSchedule
  ]);

  const filteredRows = useMemo(() => {
    return processedRows.slice(page * size, (page + 1) * size);
  }, [processedRows, page, size]);

  const totalCount = processedRows.length;

  // ── GLOBAL FILTER CONFIG ──
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(setFilterConfig([
      {
        id: 'taskScope',
        label: 'Scope',
        type: 'select',
        isStarred: true,
        options: bosFilters.getFilterOptions(),
        defaultValue: 'Mine'
      },
      {
        id: 'status', label: 'Status', type: 'select', isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'OPEN', label: 'Open' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'AMENDED', label: 'Amended' },
          { value: 'RESCHEDULE', label: 'Reschedule' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'AUTO CLOSED', label: 'Auto Closed' },
          { value: 'CANCELLED', label: 'Cancelled' }
        ],
        defaultValue: 'OPEN'
      },
      { id: 'scheduleNo', label: 'Schedule No', type: 'text', placeholder: 'Search schedule number...', isRequired: true, isStarred: true },
      {
        id: 'meetingTypeId', label: 'Meeting Type', type: 'select', isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          ...meetingTypes.map(m => ({ value: String(m.id || m.meetingName), label: m.meetingName }))
        ],
        defaultValue: 'ALL'
      },
      {
        id: 'frequency', label: 'Frequency', type: 'select', isStarred: false,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'NONE', label: 'NONE' },
          { value: 'DAILY', label: 'DAILY' },
          { value: 'WEEKLY', label: 'WEEKLY' },
          { value: 'MONTHLY', label: 'MONTHLY' },
          { value: 'QUARTERLY', label: 'QUARTERLY' },
          { value: 'HALF-YEARLY', label: 'HALF-YEARLY' },
          { value: 'YEARLY', label: 'YEARLY' }
        ],
        defaultValue: 'ALL'
      },
      { id: 'meetingDate', label: 'SCHEDULE DATE', type: 'dateRange', isStarred: true, defaultValueConsider: 'No' },
      ...getCommonDateFilters('createdAt', 'updatedAt').map(f => {
        if (f.id === 'createdAt') {
          return { ...f, type: 'dateRange', isStarred: false };
        }
        return f.id === 'updatedAt' ? { ...f, isStarred: false } : f;
      })
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms?.additional1, perms?.manager, bosFilters.isVerticalHead, meetingTypes]);

  useEffect(() => {
    setPage(0);
  }, [
    debouncedSearchQuery,
    globalFilters?.taskScope,
    globalFilters?.memberId,
    globalFilters?.status,
    globalFilters?.scheduleNo,
    globalFilters?.meetingTypeId,
    globalFilters?.frequency,
    globalFilters?.createdAtStart,
    globalFilters?.createdAtEnd,
    globalFilters?.createdAtConsider,
    globalFilters?.meetingDateStart,
    globalFilters?.meetingDateEnd,
    globalFilters?.meetingDateConsider,
    urlStatus
  ]);

  // ── FETCH ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let rawStatus = String(globalFilters?.status || 'OPEN').toUpperCase().trim();
      let statusParam = undefined;
      if (rawStatus === 'OPEN') {
        statusParam = 'OPEN,AMENDED';
      } else if (rawStatus === 'RESCHEDULE') {
        statusParam = 'RESCHEDULE,RE-SCHEDULED,RESCHEDULED';
      } else if (rawStatus !== 'ALL') {
        statusParam = globalFilters?.status;
      }

      const formatApiDate = (dateStr) => {
        if (!dateStr) return undefined;
        const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
          const d = match[1].padStart(2, '0');
          const m = match[2].padStart(2, '0');
          const y = match[3];
          return `${y}-${m}-${d}`;
        }
        return dateStr;
      };

      const params = {
        taskScope: globalFilters?.taskScope || undefined,
        currentUser: user?.userId || user?.id || undefined,
        memberId: (globalFilters?.memberId && globalFilters?.memberId !== 'All') ? globalFilters?.memberId : undefined,
        status: statusParam,
        includeDraft: rawStatus === 'DRAFT' || rawStatus === 'ALL' ? true : undefined,
        searchValue: debouncedSearchQuery || undefined,
        scheduleNo: globalFilters?.scheduleNo || undefined,
        meetingTypeId: (globalFilters?.meetingTypeId && String(globalFilters?.meetingTypeId).toUpperCase() !== 'ALL') ? globalFilters?.meetingTypeId : undefined,
        createdAtFrom: globalFilters?.createdAtConsider === 'Yes' ? formatApiDate(globalFilters?.createdAtStart) : undefined,
        createdAtTo: globalFilters?.createdAtConsider === 'Yes' ? formatApiDate(globalFilters?.createdAtEnd) : undefined,
        considerDate: globalFilters?.createdAtConsider || 'No',
        meetingDateFrom: globalFilters?.meetingDateConsider === 'Yes' ? formatApiDate(globalFilters?.meetingDateStart) : undefined,
        meetingDateTo: globalFilters?.meetingDateConsider === 'Yes' ? formatApiDate(globalFilters?.meetingDateEnd) : undefined,
        meetingDateConsider: globalFilters?.meetingDateConsider || 'No',
        maxResult: globalMaxResult || 500
      };
      const response = await axios.get(API_PATHS.QMS.MEETING_SCHEDULES, { params });
      const allData = Array.isArray(response.data) ? response.data
        : (response.data && Array.isArray(response.data.content) ? response.data.content : []);
      setRows(allData);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    globalFilters?.taskScope,
    globalFilters?.memberId,
    globalFilters?.status,
    globalFilters?.scheduleNo,
    globalFilters?.meetingTypeId,
    globalFilters?.createdAtStart,
    globalFilters?.createdAtEnd,
    globalFilters?.createdAtConsider,
    globalFilters?.meetingDateStart,
    globalFilters?.meetingDateEnd,
    globalFilters?.meetingDateConsider,
    debouncedSearchQuery,
    user?.userId,
    user?.id,
    urlStatus
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    if (!perms.write) return;
    navigate('/qms/meeting-schedule/create');
  };
  const handleEdit = (item) => {
    navigate(`/qms/meeting-schedule/edit/${item.id}`);
  };
  const handleDeleteClick = (row) => { setDeleteTarget(row); setDeleteDialogOpen(true); };

  const handleAmendmentClick = (row) => {
    const statusStr = typeof row?.status === 'object' ? row?.status?.name : row?.status;
    const statusUpper = String(statusStr || row?.statusObj?.name || '').toUpperCase().trim();
    if (statusUpper === 'CLOSED') {
      dispatch(openSnackbar({
        open: true,
        message: 'Manually closed meeting schedules cannot be amended.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    setSelectedForAmend(row);
    setAmendDialogOpen(true);
  };

  const handleCreateAmendmentClick = () => {
    if (!selectedRow) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a meeting schedule from the list to create an amendment.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }
    const originalRow = rows.find(r => r.id === selectedRow.id);
    if (originalRow) {
      handleAmendmentClick(originalRow);
    }
  };

  const handleAmendConfirm = () => {
    if (selectedForAmend) {
      const statusStr = typeof selectedForAmend?.status === 'object' ? selectedForAmend?.status?.name : selectedForAmend?.status;
      const statusUpper = String(statusStr || selectedForAmend?.statusObj?.name || '').toUpperCase().trim();
      if (statusUpper === 'CLOSED') {
        dispatch(openSnackbar({
          open: true,
          message: 'Manually closed meeting schedules cannot be amended.',
          variant: 'alert',
          severity: 'warning'
        }));
        setAmendDialogOpen(false);
        return;
      }
    }
    setAmendDialogOpen(false);
    if (selectedForAmend) {
      navigate(`/qms/meeting-schedule/create?amendId=${selectedForAmend.id}`);
    }
  };



  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.MEETING_SCHEDULES}/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Schedule deleted!', variant: 'alert', severity: 'success' }));
      fetchData();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete schedule', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({ 'ctrl+n': handleAdd });


  // ── RENDER CELL ──
  const renderCell = (col, row, idx) => {
    let val;
    if (col.id === 'status') {
      const s = row.status || 'OPEN';
      val = <BOSStatusChip status={s} showIcon={true} width={130} />;
    } else if (col.id === 'createdAt' || col.id === 'updatedAt') {
      const rawDateVal = col.id === 'createdAt' ? row.createdAtRaw : row.updatedAtRaw;
      if (!rawDateVal) {
        val = <Typography variant="body2" color="text.secondary">-</Typography>;
      } else {
        const dt = new Date(rawDateVal);
        if (isNaN(dt.getTime())) {
          val = <Typography variant="body2" color="text.secondary">-</Typography>;
        } else {
          const day = String(dt.getDate()).padStart(2, '0');
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const year = dt.getFullYear();
          const d = `${day}/${month}/${year}`;
          let h = dt.getHours() % 12;
          if (h === 0) h = 12;
          const hoursStr = String(h).padStart(2, '0');
          const minutesStr = String(dt.getMinutes()).padStart(2, '0');
          const t = `${hoursStr}:${minutesStr}`;
          val = (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {d}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1 }}>
                {t}
              </Typography>
            </Box>
          );
        }
      }
    } else if (col.id === 'index') {
      val = (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 600 }}>
          {idx + 1 + page * size}
        </Typography>
      );
    } else if (col.id === 'scheduleNo') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.3px' }}>
          {row.scheduleNo || '-'}
        </Typography>
      );
    } else if (col.id === 'revSourceScheduleNo') {
      val = row.revSourceScheduleNo ? (
        <Chip
          label={row.revSourceScheduleNo}
          size="small"
          variant="outlined"
          color="warning"
          sx={{ borderRadius: '6px', fontWeight: 700, height: '22px' }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      );
    } else if (col.id === 'scheduleDate') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {row.scheduleDate || '-'}
        </Typography>
      );
    } else if (col.id === 'meetingTypeName') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {row.meetingTypeName || '-'}
        </Typography>
      );
    } else if (col.id === 'meetingDateTime') {
      if (row.meetingDate) {
        const d = row.meetingDate.split('-').reverse().join('/');
        const t = formatTime12hNoAmPm(row.startTime);
        val = (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {d}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1 }}>
              {t}
            </Typography>
          </Box>
        );
      } else {
        val = <Typography variant="body2" color="text.secondary">-</Typography>;
      }
    } else if (col.id === 'departmentNames') {
      const fullDepts = row.departmentNames || '-';
      const truncated = fullDepts.length > 30 ? `${fullDepts.substring(0, 30)}...` : fullDepts;
      val = (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {truncated}
        </Typography>
      );
    } else if (col.id === 'chairedByName' || col.id === 'hostByName') {
      const name = col.id === 'chairedByName' ? row.chairedByName : row.hostByName;
      val = (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {name}
        </Typography>
      );
    } else if (col.id === 'participantsBy') {
      const fullParts = row.participantsBy || '-';
      const truncated = fullParts.length > 35 ? `${fullParts.substring(0, 35)}...` : fullParts;
      val = (
        <Typography variant="body2" color="text.secondary">
          {truncated}
        </Typography>
      );
    } else if (col.id === 'review') {
      const r = row.review || 'NO';
      val = (
        <Chip
          label={r}
          size="small"
          variant="outlined"
          sx={{
            borderRadius: '6px',
            height: '22px',
            fontWeight: 700,
            color: r === 'YES' ? 'primary.main' : 'text.secondary',
            borderColor: r === 'YES' ? 'primary.light' : 'divider',
            bgcolor: r === 'YES' ? 'primary.lighter' : 'transparent'
          }}
        />
      );
    } else if (col.id === 'createdUser') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {(row.createdUser || row.createdBy) || '-'}
        </Typography>
      );
    } else if (col.id === 'updatedUser') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {(row.updatedUser || row.updatedBy) || '-'}
        </Typography>
      );
    } else if (col.id === 'comments') {
      const cleanComments = stripHtml(row.comments);
      const displayVal = (cleanComments && cleanComments.trim() !== '' && cleanComments !== '-') ? cleanComments : '--';
      val = (
        <Typography variant="body2" color={displayVal === '--' ? 'text.secondary' : 'text.primary'}>
          {displayVal}
        </Typography>
      );
    } else {
      let rawVal = row[col.id];
      if (rawVal === undefined || rawVal === null) {
        const snakeCaseId = col.id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        rawVal = row[snakeCaseId];
      }
      if (typeof rawVal === 'boolean') {
        val = rawVal ? 'Yes' : 'No';
      } else if (typeof rawVal === 'object' && rawVal !== null) {
        val = rawVal.name || rawVal.label || rawVal.id || '-';
      } else {
        val = (rawVal !== null && rawVal !== undefined && rawVal !== '') ? String(rawVal) : '-';
      }
    }

    let finalTooltip = null;
    if (col.id === 'departmentNames' && row.departmentNames && row.departmentNames.length > 30) {
      finalTooltip = row.departmentNames;
    } else if (col.id === 'participantsBy' && row.participantsBy && row.participantsBy.length > 35) {
      finalTooltip = row.participantsBy;
    }

    if (finalTooltip) {
      return (
        <Tooltip title={finalTooltip} placement="top" enterDelay={200}>
          <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
            {val}
          </div>
        </Tooltip>
      );
    }
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
        {val}
      </div>
    );
  };

  const handleEnterMeeting = async (row) => {
    try {
      await axios.post(`${API_PATHS.QMS.MEETING_SCHEDULES}/enter-meeting`, null, {
        params: { scheduleNo: row.scheduleNo }
      });
      dispatch(openSnackbar({
        open: true,
        message: `Schedule ${row.scheduleNo} entered! Status automatically changed to CLOSED.`,
        variant: 'alert',
        severity: 'success'
      }));
      fetchData();
    } catch (error) {
      console.error('Failed to enter meeting schedule:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to enter meeting schedule: ' + (error.response?.data?.message || error.message),
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  // ── ROW EXTRA ACTIONS: Enter Meeting & Amendment button per-row ──
  const renderRowActions = perms.write ? (row) => {
    const statusStr = typeof row?.status === 'object' ? row?.status?.name : row?.status;
    const statusUpper = String(statusStr || row?.statusObj?.name || '').toUpperCase().trim();
    const isManuallyClosed = statusUpper === 'CLOSED';

    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Call Schedule & Enter Meeting (Auto-Close)" placement="top">
          <Box
            component="span"
            onClick={(e) => { e.stopPropagation(); handleEnterMeeting(row); }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'success.main',
              bgcolor: 'success.lighter',
              transition: 'all 0.18s',
              '&:hover': { bgcolor: 'success.main', color: '#fff' }
            }}
          >
            <IconPlayerPlay size={15} />
          </Box>
        </Tooltip>
        {!isManuallyClosed && (
          <Tooltip title="Amendment" placement="top">
            <Box
              component="span"
              onClick={(e) => { e.stopPropagation(); handleAmendmentClick(row); }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'warning.main',
                bgcolor: 'warning.lighter',
                transition: 'all 0.18s',
                '&:hover': { bgcolor: 'warning.main', color: '#fff' }
              }}
            >
              <IconGitBranch size={15} />
            </Box>
          </Tooltip>
        )}
      </Stack>
    );
  } : undefined;

  const isSelectedClosed = selectedRow ? String(typeof selectedRow.status === 'object' ? selectedRow.status?.name : selectedRow.status || selectedRow.statusObj?.name || '').toUpperCase().trim() === 'CLOSED' : false;

  return (
    <MainCard fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
            <IconCalendarEvent size={22} color={isDark ? '#fff' : '#1e88e5'} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Meeting Schedule</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('Create New Schedule', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Meeting_Schedule"
          hasExportPermission={perms.export}
          onCancel={isManager ? handleCancelClick : undefined}
          cancelDisabled={isCancelDisabled}
          cancelTooltip={cancelTooltipMsg}
          cancelLabel="Cancel"
          cancelIcon={<IconCalendarOff size={18} />}
          columns={columns}
          onAmendment={perms.write ? handleCreateAmendmentClick : undefined}
          amendmentDisabled={isSelectedClosed}
          amendmentLabel="Amendment"
          amendmentTooltip={isSelectedClosed ? "Manually closed schedules cannot be amended" : "Amendment for the selected schedule"}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={totalCount}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleEdit}
        onEditRow={handleEdit}
        allowEditCancelled={true}
        onDeleteRow={undefined}
        renderCell={renderCell}
        extraRowActions={renderRowActions}
        disableSearchFilter={false}
        noRecordsMessage="No Meeting Schedules Found"
        id="meeting-schedule-table"
        onClickRow={(row) => setSelectedRow(prev => prev?.id === row.id ? null : row)}
        selectedRowId={selectedRow?.id}
      />

      {/* Cancel Confirmation & Reason Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => !cancelling && setCancelDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#161b22' : '#fff',
            border: isDark ? '1px solid #30363d' : 'none',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isDark ? 'rgba(211, 47, 47, 0.12)' : '#ffebee',
            borderBottom: '1px solid',
            borderColor: isDark ? '#30363d' : '#ffcdd2',
            py: 2,
            px: 3
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(211,47,47,0.25)' : '#ffcdd2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconAlertTriangle size={22} color={isDark ? '#ef5350' : '#d32f2f'} />
          </Box>
          <Typography variant="h5" fontWeight={600} color={isDark ? '#ef5350' : '#d32f2f'}>
            Cancel Schedule Confirmation
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to cancel this meeting schedule?
          </Typography>
          {selectedRow && (
            <Box
              sx={{
                mt: 1.5,
                mb: 2,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(211,47,47,0.08)' : '#ffebee',
                border: '1px solid',
                borderColor: isDark ? '#30363d' : '#ffcdd2'
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} color={isDark ? '#ef5350' : '#d32f2f'}>
                Schedule No: {selectedRow.scheduleNo}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason *"
            placeholder="Enter reason for cancelling this meeting schedule..."
            value={cancelReasonInput}
            onChange={(e) => setCancelReasonInput(e.target.value)}
            disabled={cancelling}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setCancelDialogOpen(false);
              } else if ((e.key === 's' || e.key === 'S') && (e.altKey || e.ctrlKey)) {
                e.preventDefault();
                if (cancelReasonInput.trim() && !cancelling) handleCancelConfirm();
              }
            }}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px'
              }
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            py: 1.5,
            px: 3,
            borderTop: '1px solid',
            borderColor: isDark ? '#30363d' : 'divider',
            bgcolor: isDark ? '#161b22' : '#fafafa',
            gap: 1
          }}
        >
          <Tooltip title={shortcutTooltip('Close', 'Esc')} placement="top">
            <Button
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
              variant="outlined"
              color="secondary"
              startIcon={<IconX size={18} />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              Close
            </Button>
          </Tooltip>
          <Tooltip title={shortcutTooltip('Confirm', 'Space + S')} placement="top">
            <Button
              variant="contained"
              color="error"
              onClick={handleCancelConfirm}
              disabled={cancelling || !cancelReasonInput.trim()}
              startIcon={<IconCheck size={18} />}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
            >
              {cancelling ? 'Confirming...' : 'Confirm'}
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>



      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Meeting Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        itemName={deleteTarget?.scheduleNo}
      />

      {/* Amendment Confirmation Dialog */}
      <Dialog
        open={amendDialogOpen}
        onClose={() => setAmendDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            bgcolor: isDark ? '#161b22' : '#fff',
            border: isDark ? '1px solid #30363d' : 'none',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isDark ? '#1c2128' : '#fff4e5',
            borderBottom: '1px solid',
            borderColor: isDark ? '#30363d' : '#ffe8cc',
            py: 2,
            px: 3
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255,152,0,0.15)' : '#ffe8cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconAlertTriangle size={22} color={isDark ? '#ffa726' : '#f57c00'} />
          </Box>
          <Typography variant="h5" fontWeight={600} color={isDark ? '#ffa726' : '#f57c00'}>
            Amendment Confirmation
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to amend this record?
          </Typography>
          {selectedForAmend && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255,152,0,0.08)' : '#fff4e5',
                border: '1px solid',
                borderColor: isDark ? '#30363d' : '#ffe8cc'
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} color={isDark ? '#ffa726' : '#f57c00'}>
                Schedule: {selectedForAmend.scheduleNo}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setAmendDialogOpen(false)}
            startIcon={<IconX size={18} />}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          >
            No
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleAmendConfirm}
            startIcon={<IconGitBranch size={18} />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: isDark ? '#f57c00' : '#ffa726',
              '&:hover': {
                bgcolor: isDark ? '#e65100' : '#fb8c00'
              }
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

    </MainCard>
  );
}
