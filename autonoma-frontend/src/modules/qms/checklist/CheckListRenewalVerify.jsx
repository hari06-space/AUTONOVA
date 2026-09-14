import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, IconButton } from '@mui/material';
import { IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { useLocation, useNavigate } from 'react-router-dom';

const stripHtml = (html) => {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);
  if (html.includes('<')) {
    try {
      let processed = html
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<li[^>]*>/gi, '• ');
      const doc = new DOMParser().parseFromString(processed, 'text/html');
      return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
    } catch {
      return html.replace(/<[^>]+>/g, '').trim();
    }
  }
  return html.trim();
};

import MainCard from 'ui-component/cards/MainCard';
import { useSelector, useDispatch } from 'react-redux';
import { setFilterConfig, setTableConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ExecutionVerifyDialog from './ExecutionVerifyDialog';
import useAuth from 'hooks/useAuth';
import useLookups from 'hooks/useLookups';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip } from 'ui-component/bos';
import { getCommonDateFilters, matchCommonDateFilters, matchDateRange } from 'ui-component/bos/BOSUtils';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

const STATUS_OPTIONS = ['Pending for Verify', 'Pending for Accepted', 'Verified', 'Rejected'];

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d;
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [yyyy, mm, dd] = dateVal.split('-');
        d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      } else {
        d = new Date(dateVal);
      }
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return '-';
    const date = formatDate(dt);
    let hours = dt.getHours();
    const mins = String(dt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${date} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
};

const getEmployeeName = (idOrCodeOrName, employeesList = []) => {
  if (!idOrCodeOrName || idOrCodeOrName === '-') return '-';
  const parts = String(idOrCodeOrName).split(',').map(p => p.trim());
  const resolvedParts = parts.map(part => {
    const emp = employeesList.find(
      (e) =>
        String(e.id) === String(part) ||
        String(e.empCode) === String(part) ||
        String(e.employeeCode) === String(part) ||
        String(e.employeeName).toLowerCase() === String(part).toLowerCase()
    );
    return emp ? emp.employeeName : part;
  });
  return resolvedParts.join(', ');
};

const mapRenewalStatus = (statusVal, category, masterVerifyStatus) => {
  const isRenewal = String(category || '').toUpperCase().trim() === 'RENEWAL';
  const targetVal = statusVal || (isRenewal ? masterVerifyStatus : null);
  if (!targetVal) return 'Open';

  const val = typeof targetVal === 'object' ? (targetVal.name || '') : String(targetVal);
  const valUpper = val.toUpperCase().trim();

  if (valUpper === 'PENDING FOR VERIFY' || valUpper === 'PENDING FOR VERIFIED' || valUpper === 'PENDING_FOR_VERIFIED') {
    return 'Pending for Verify';
  }
  if (valUpper === 'PENDING FOR ACCEPT' || valUpper === 'PENDING FOR ACCEPTED' || valUpper === 'PENDING_FOR_ACCEPT' || valUpper === 'PENDING_FOR_ACCEPTED') {
    return 'Pending for Accepted';
  }

  if (valUpper === 'VERIFIED' || valUpper === 'ACCEPTED' || valUpper === 'RENEWAL VERIFIED' || valUpper === 'RENEWAL_VERIFIED') {
    return 'Verified';
  }

  if (valUpper === 'CLOSED' || valUpper === 'COMPLETED') {
    return isRenewal ? 'Not Applicable' : 'Closed';
  }

  if (valUpper === 'RENEWAL PENDING' || valUpper === 'RENEWAL_PENDING') {
    return 'Renewal Pending';
  }

  return typeof targetVal === 'object' ? targetVal.name : targetVal;
};

const StatusChip = BOSStatusChip;

export default function CheckListRenewalVerify() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { employees = [] } = useLookups(['EMPLOYEES']);
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const filtersReady = useRef(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [descriptionViewOpen, setDescriptionViewOpen] = useState(false);
  const [descriptionViewContent, setDescriptionViewContent] = useState('');
  const [descriptionViewTitle, setDescriptionViewTitle] = useState('');

  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    if (selectedRowId) {
      const match = rows.find((r) => r.id === selectedRowId);
      if (match) {
        setActiveRow(match);
      }
    } else {
      setActiveRow(null);
    }
  }, [selectedRowId, rows]);
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST_RENEWAL_VERIFY);
  const bosFilters = useBOSFilters(perms);

  const tableCols = [
    { id: 'index', label: '#', minWidth: 55 },
    { id: 'taskType', label: 'Task Type', minWidth: 100, render: (row) => row.assignType || 'Mine' },
    { id: 'seqNo', label: 'Seq No', minWidth: 90, bold: true, render: (row) => row.checklist?.seqNo },
    {
      id: 'checkingPoint', label: 'Checking Point', minWidth: 200,
      exportValue: (row) => row.checklist?.checkingPoint || '-',
      render: (row) => row.checklist?.checkingPoint ? (
        <Box
          component="span"
          onClick={(e) => { e.stopPropagation(); setSelectedRowId(row.id); setDialogOpen(true); }}
          sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.dark' } }}
        >
          {row.checklist.checkingPoint}
        </Box>
      ) : '-'
    },
    {
      id: 'description', label: 'Descriptions', minWidth: 200,
      exportValue: (row) => {
        const rawText = row.checklist?.description || '';
        return stripHtml(rawText) || '-';
      },
      render: (row) => {
        const rawText = row.checklist?.description || '';
        const plainText = stripHtml(rawText);
        if (!plainText) return '-';
        const isTruncated = plainText.length > 50;
        const displayText = isTruncated ? `${plainText.substring(0, 50)}...` : plainText;
        return (
          <Box
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              setDescriptionViewTitle(`Description/SOP - ${row.checklist?.seqNo || ''}`);
              setDescriptionViewContent(rawText);
              setDescriptionViewOpen(true);
            }}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
                color: 'primary.main'
              }
            }}
          >
            {displayText}
          </Box>
        );
      }
    },
    { id: 'category', label: 'Category', minWidth: 120, render: (row) => row.checklist?.category || '-' },
    { id: 'frequency', label: 'Frequency', minWidth: 120, render: (row) => row.checklist?.frequency || '-' },
    {
      id: 'department', label: 'Dept', minWidth: 160,
      exportValue: (row) => (row.checklist?.departments || []).map(d => d.departmentName).filter(Boolean).join(', ') || '-',
      render: (row) => (row.checklist?.departments || []).map(d => d.departmentName).join(', ')
    },
    { id: 'assignedDate', label: 'Date', minWidth: 120, render: (row) => formatDate(row.checklistDate || row.assignedDate) },
    { id: 'checklistDate', label: 'Checklist Date', minWidth: 120, render: (row) => formatDate(row.checklistDate) },
    { id: 'status', label: 'Task Status', minWidth: 160, render: (row) => <StatusChip status={mapRenewalStatus(row.status, row.checklist?.category, row.checklist?.verifyStatus)} /> },
    { id: 'verifyStatus', label: 'Verification Status', minWidth: 160, render: (row) => <StatusChip status={mapRenewalStatus(row.verifyStatus, row.checklist?.category, row.checklist?.verifyStatus)} /> },
    {
      id: 'nextDueDate', label: 'Next Due Date', minWidth: 140, render: (row) => {
        const val = formatDate(row.checklist?.nextDueDate);
        if (!row.checklist?.nextDueDate || val === '-') return '-';
        const exp = new Date(row.checklist.nextDueDate);
        let isExpired = false;
        if (!isNaN(exp.getTime())) {
          exp.setHours(23, 59, 59, 999);
          isExpired = exp < new Date();
        }
        return (
          <Box
            component="span"
            sx={{
              fontWeight: isExpired ? 700 : 400,
              color: isExpired ? '#C62828' : 'text.primary',
              bgcolor: isExpired ? '#FFEBEE' : 'transparent',
              px: isExpired ? 1 : 0,
              py: isExpired ? 0.4 : 0,
              borderRadius: isExpired ? '4px' : 0,
              display: 'inline-block',
              fontSize: '0.82rem',
            }}
          >
            {val}
          </Box>
        );
      }
    },
    { id: 'assignedTo', label: 'Assigned To', minWidth: 120, render: (row) => row.assignedToName || getEmployeeName(row.assignedTo, employees) },
    { id: 'dualCheck', label: 'Dual Check', minWidth: 100, render: (row) => { const dc = row.checklist?.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },
    { id: 'verificationRequired', label: 'Verification Required', minWidth: 160, render: (row) => { const dc = row.checklist?.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },
    { id: 'photoRequired', label: 'Photo Required', minWidth: 120, render: (row) => row.checklist?.photoRequired || '-' },
    { id: 'createdUser', label: 'Created By', minWidth: 120, render: (row) => row.checklist?.createdUser || row.checklist?.createdBy || '-' },
    { id: 'createdDate', label: 'Created Date', minWidth: 120, render: (row) => formatDate(row.createdAt || row.createdDate || row.checklist?.createdAt || row.checklist?.createdDate) },
    {
      id: 'updatedUser', label: 'Updated By', minWidth: 120, render: (row) => {
        const upAt = row.updatedAt || row.checklist?.updatedAt;
        const crAt = row.createdAt || row.checklist?.createdAt;
        if (!upAt || !crAt) return '-';
        const msDiff = Math.abs(new Date(upAt) - new Date(crAt));
        if (msDiff <= 60000) return '-';
        let upUser = row.updatedUser || row.updatedBy || row.checklist?.updatedUser || row.checklist?.updatedBy || '-';
        if (upUser === 'Admin istrator' || upUser === 'Administrator') upUser = 'Admin';
        if (String(upUser).toLowerCase().includes('system')) return '-';
        return upUser;
      }
    },
    {
      id: 'updatedDate', label: 'Update Date & Time', minWidth: 160, render: (row) => {
        const upAt = row.updatedAt || row.checklist?.updatedAt;
        const crAt = row.createdAt || row.checklist?.createdAt;
        if (!upAt || !crAt) return '-';
        const msDiff = Math.abs(new Date(upAt) - new Date(crAt));
        if (msDiff <= 60000) return '-';
        return formatDateTime(upAt);
      }
    }
  ];

  const lastFetchedRef = useRef(null);

  // Initialize default filters on mount, clean up on unmount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const defaultTaskType = 'Mine';
    const urlParams = new URLSearchParams(window.location.search);
    const dashboardFilter = urlParams.get('dashboardFilter');
    const urlTaskType = urlParams.get('taskType') || urlParams.get('taskScope') || urlParams.get('scope') || location?.state?.taskScope || location?.state?.taskType;
    const urlMemberId = urlParams.get('memberId') || urlParams.get('assignedTo') || location?.state?.memberId;
    let urlStatuses = (urlParams.get('statuses') || urlParams.get('status'))
      ? (urlParams.get('statuses') || urlParams.get('status')).split(',')
      : ['Pending for Verify'];

    const effectiveTaskType = urlTaskType || globalFilters.taskType || globalFilters.taskScope || defaultTaskType;

    let initialFilters = {
      category: 'All',
      verifyStatus: 'All',
      createdDateConsider: 'No',
      ...globalFilters,
      taskType: effectiveTaskType,
      taskScope: effectiveTaskType,
      statuses: urlStatuses
    };

    if (urlMemberId) {
      initialFilters.memberId = urlMemberId;
      initialFilters.assignedTo = urlMemberId;
    }

    if (dashboardFilter === 'overdueVerify') {
      const today = new Date();
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      initialFilters = {
        ...initialFilters,
        taskType: effectiveTaskType,
        taskScope: effectiveTaskType,
        createdDateConsider: 'Yes',
        createdDateStart: null,
        createdDateEnd: twoDaysAgo,
        statuses: ['Pending for Verify']
      };
    } else if (dashboardFilter === 'recentVerifyPending') {
      const today = new Date();
      const oneDayAgo = new Date(today);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      initialFilters = {
        ...initialFilters,
        taskType: effectiveTaskType,
        taskScope: effectiveTaskType,
        createdDateConsider: 'Yes',
        createdDateStart: oneDayAgo,
        createdDateEnd: today,
        statuses: ['Pending for Verify']
      };
    } else if (dashboardFilter === 'totalVerify') {
      initialFilters = {
        ...initialFilters,
        taskType: effectiveTaskType,
        taskScope: effectiveTaskType,
        createdDateConsider: 'No',
        statuses: ['Pending for Verify', 'Rejected']
      };
    }

    dispatch(setFilters(initialFilters));
    return () => {};
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager, bosFilters.isVerticalHead, location.search, location.state]);

  // Configure global search bar filters on mount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const defaultTaskType = 'Mine';

    dispatch(setFilterConfig({
      path: '/qms/checklist/renewal-verify',
      config: [
        {
          id: 'taskType', label: 'Scope', type: 'select', isStarred: true, defaultValue: defaultTaskType,
          options: bosFilters.getFilterOptions()
        },
        { id: 'statuses', label: 'Status', type: 'autocomplete', multiple: true, isStarred: true, defaultValue: ['Pending for Verify'], options: STATUS_OPTIONS.map(s => ({ value: s, label: s })) },
        { id: 'createdDate', label: 'Created Date', type: 'dateRange', isStarred: true, hideConsiderInput: true }
      ]
    }));
    dispatch(setTableConfig(tableCols));
    return () => {
      dispatch(setFilterConfig({ config: null, path: '/qms/checklist/renewal-verify' }));
      dispatch(setTableConfig(null));
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1, perms.manager]);


  // Automatically select default statuses when Scope changes to Team or Company
  const prevTaskTypeRef = useRef(globalFilters.taskType || 'Mine');
  useEffect(() => {
    const currentTaskType = globalFilters.taskType || 'Mine';
    if (currentTaskType !== prevTaskTypeRef.current) {
      prevTaskTypeRef.current = currentTaskType;
      if (currentTaskType === 'Team' || currentTaskType === 'Company') {
        dispatch(setFilters({
          ...globalFilters,
          statuses: ['Pending for Verify']
        }));
      }
    }
  }, [globalFilters.taskType, dispatch, globalFilters]);

  const fetchAssignments = useCallback(async (force = false, detail = null, isSilent = false) => {
    const considerToggle = globalFilters.createdDateConsider === 'Yes' || globalFilters.createdDateConsider === true;
    const masterVerifyStatus = globalFilters.verifyStatus || 'All';

    const formatDateToYYYYMMDD = (dateVal) => {
      if (!dateVal) return undefined;
      let d = dateVal instanceof Date ? dateVal : (dateVal.$d ? dateVal.$d : new Date(dateVal));
      if (isNaN(d)) return undefined;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const effectiveStatus = (globalFilters.statuses && globalFilters.statuses.length > 0)
      ? globalFilters.statuses.join(',')
      : (globalFilters.status
        ? (Array.isArray(globalFilters.status) ? globalFilters.status.join(',') : globalFilters.status)
        : undefined);

    const params = {
      page,
      size,
      status: effectiveStatus,
      fromDate: considerToggle ? formatDateToYYYYMMDD(globalFilters.createdDateStart) : undefined,
      toDate: considerToggle ? formatDateToYYYYMMDD(globalFilters.createdDateEnd) : undefined,
      considerDate: considerToggle ? 'Yes' : undefined,
      searchValue: searchQuery || undefined,

      // Task Filtering
      taskType: globalFilters.taskType || globalFilters.taskScope || 'Mine',
      currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
      pageCode: 'QM1130',
      excludePending: false,
      dualCheck: 'YES',

      // Additional / Add Filter fields mapping
      category: (globalFilters.category && globalFilters.category !== 'All') ? globalFilters.category : undefined,
      seqNo: globalFilters.seqNo || undefined,
      frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
      stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
      department: globalFilters.department || undefined,
      assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignedTo || undefined),
      checkingPoint: globalFilters.checkingPoint || undefined,
      masterVerifyStatus: masterVerifyStatus !== 'All' ? masterVerifyStatus : undefined
    };

    const paramsKey = JSON.stringify(params);
    if (!force && lastFetchedRef.current && lastFetchedRef.current.key === paramsKey) {
      return;
    }
    lastFetchedRef.current = { key: paramsKey, filters: globalFilters };

    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('/api/qms/checklist/assignments', { params: { ...params, _t: Date.now() } });
      const rawRows = response.data.content || [];
      const uniqueRows = [];
      const seenKeys = new Set();
      for (const r of rawRows) {
        const checklistId = r.checklist?.id || r.checklistId || r.checklist?.seqNo || r.seqNo;
        const cDate = r.checklistDate || r.assignedDate;
        const key = checklistId ? `${checklistId}_${cDate}` : String(r.id);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueRows.push(r);
        }
      }
      setRows(uniqueRows);
      setTotalElements(response.data.totalElements ?? uniqueRows.length);
    } catch (error) {
      console.error('Failed to fetch assignments for verification:', error);
    } finally {
      setLoading(false);
    }
  }, [page, size, searchQuery, user, globalFilters]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, globalFilters, searchQuery, page, size]);

  // Real-time synchronization: automatically re-fetch assignments when real-time updates arrive
  useRealtimeRefresh((force, detail, isSilent) => fetchAssignments(true, detail, true));

  const handleVerify = async (status, remarks) => {
    if (selectedRowId === null || selectedRowId === undefined) return;
    if (!activeRow) return;

    // ── Mapped Vertical Head Validation ──
    const assigneeName = activeRow.assignedTo;
    if (assigneeName) {
      let assigneeId = null;
      if (!isNaN(assigneeName) && String(assigneeName).trim() !== '') {
        assigneeId = assigneeName;
      } else {
        const assignee = (employees || []).find((emp) => {
          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase().trim();
          const empName = (emp.employeeName || '').toLowerCase().trim();
          const code = (emp.empCode || '').toLowerCase().trim();
          const idStr = String(emp.id).toLowerCase().trim();
          const target = String(assigneeName).toLowerCase().trim();
          return fullName === target || empName === target || code === target || idStr === target;
        });
        if (assignee) {
          assigneeId = assignee.id;
        }
      }

      const isAdmin = user?.userLevel === 5 || user?.id?.toLowerCase() === 'admin';

      if (!assigneeId) {
        if (!isAdmin) {
          dispatch(openSnackbar({
            open: true,
            message: `Assignee '${assigneeName}' not found in Employee Master. Only an administrator can verify.`,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'error',
            close: false
          }));
          return;
        }
      } else {
        try {
          const mappingRes = await axios.get(`/api/master/hr/employees/manager-mapping/${assigneeId}`);
          const mapping = mappingRes.data;

          const isVerticalHead = mapping && mapping.verticalHeadId && (
            String(user?.empId) === String(mapping.verticalHeadId) ||
            (employees || []).find(emp => String(emp.id) === String(mapping.verticalHeadId))?.employeeName?.toLowerCase().includes(user?.name?.toLowerCase()) ||
            (employees || []).find(emp => String(emp.id) === String(mapping.verticalHeadId))?.firstName?.toLowerCase() === user?.name?.split(' ')[0]?.toLowerCase()
          );

        } catch (err) {
          console.error('Failed to verify manager mapping:', err);
          if (!isAdmin) {
            dispatch(openSnackbar({
              open: true,
              message: 'Failed to validate manager permissions. Only administrators can bypass.',
              variant: 'alert',
              alert: { variant: 'filled' },
              severity: 'error',
              close: false
            }));
            return;
          }
        }
      }
    }

    const isRenewal = activeRow.checklist?.category?.trim().toUpperCase() === 'RENEWAL';
    const finalStatus = (status === 'Renewal Verified' || status === 'Accepted') ? 'Verified' : status;

    try {
      await axios.post('/api/qms/checklist/verify', {
        assignmentId: activeRow.id,
        status: finalStatus,
        verifiedBy: user?.employeeName || user?.userName || user?.name || user?.id || 'Admin',
        remarks: remarks || `Verification action: ${status}`
      });
      dispatch(openSnackbar({
        open: true,
        message: finalStatus === 'Rejected'
          ? 'Checklist Rejected Successfully. Sent back to Unresolved for Rework.'
          : 'Checklist Verified Successfully.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      setDialogOpen(false);
      setRows((prev) => prev.filter((r) => r.id !== activeRow.id));
      fetchAssignments();
    } catch (error) {
      console.error('Verification failed:', error);
      dispatch(openSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Verification action failed.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    }
  };

  // Handle URL query parameters for notifications (e.g. ?viewId=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewId = params.get('viewId');
    if (viewId && !dialogOpen) {
      const match = rows.find(r => String(r.id) === String(viewId));
      if (match) {
        setSelectedRowId(match.id);
        setDialogOpen(true);
      } else {
        // Not in current page, fetch it directly
        if (!loading) {
          axios.get(`/api/qms/checklist/assignments/${viewId}`).then(res => {
            if (res.data) {
              setRows(prev => {
                if (prev.find(r => String(r.id) === String(viewId))) return prev;
                return [res.data, ...prev];
              });
              setSelectedRowId(res.data.id);
              setActiveRow(res.data);
              setDialogOpen(true);
            }
          }).catch(e => console.error('Failed to fetch specific assignment for viewId', e));
        }
      }
    }
  }, [location.search, rows, dialogOpen, loading]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.get('viewId')) {
      navigate(-1);
    }
  };

  const canVerifySelected = perms.approval || perms.write;

  return (
    <MainCard
      fullWidth
      title="Check List / Renewal Verify"
      secondary={
        <BOSTableToolbar
          id="qms-checklist-renewal-verify-table"
          onRefresh={fetchAssignments}
          hasWritePermission={perms.write}
          columns={tableCols}
          exportData={rows}
          exportFilename="Checklist_Renewal_Verify"
          hasExportPermission={perms.export}
          ignoreGlobalFilters={true}
        />
      }
    >
      <BOSDataTable
        id="qms-checklist-renewal-verify-table"
        columns={tableCols}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={canVerifySelected ? (row) => { setSelectedRowId(row.id); setDialogOpen(true); } : null}
        onClickRow={(row) => setSelectedRowId(row.id)}
        selectedRowId={selectedRowId}
        disableSearchFilter={true}
      />

      <ExecutionVerifyDialog
        open={dialogOpen}
        handleClose={handleDialogClose}
        data={activeRow}
        onVerify={(remarks) => handleVerify('Renewal Verified', remarks)}
        onReject={(remarks) => handleVerify('Rejected', remarks)}
        onNotAccept={(remarks) => handleVerify('Rejected', remarks)}
        isExecution={false}
      />

      <Dialog
        open={descriptionViewOpen}
        onClose={() => setDescriptionViewOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="description-view-dialog-title"
      >
        <DialogTitle id="description-view-dialog-title" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="span">{descriptionViewTitle}</Typography>
          <IconButton aria-label="close" onClick={() => setDescriptionViewOpen(false)} sx={{ color: 'grey.500' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            className="sop-detail-view"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(descriptionViewContent) }}
            sx={{
              p: 1.5,
              minHeight: '150px',
              maxHeight: '60vh',
              overflowY: 'auto',
              fontFamily: 'inherit',
              whiteSpace: 'pre-line',
              '& p': { margin: '0 0 12px 0', lineHeight: 1.6 },
              '& div': { margin: '0 0 8px 0' },
              '& table': { borderCollapse: 'collapse', width: '100%', mb: 2 },
              '& th, & td': { border: '1px solid #ddd', p: 1 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDescriptionViewOpen(false)} variant="contained" color="primary" sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
