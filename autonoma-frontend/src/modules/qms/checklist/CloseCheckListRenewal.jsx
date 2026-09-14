import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import axios from 'utils/axios';

import MainCard from 'ui-component/cards/MainCard';
import { useSelector, useDispatch } from 'react-redux';
import { setFilterConfig, setTableConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ExecutionVerifyDialog from './ExecutionVerifyDialog';
import useAuth from 'hooks/useAuth';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip, BOSFileGallery } from 'ui-component/bos';
import { IconPaperclip, IconX } from '@tabler/icons-react';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

const STATUS_OPTIONS = [
  'Pending', 'Started', 'Unresolved', 'Missed', 'Completed', 'Not Completed',
  '25%', '50%', '75%', 'Pending for Verified', 'Verified',
  'Pending for Accepted', 'Accepted', 'Closed'
];

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
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
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

const StatusChip = BOSStatusChip;

const EMPTY_ARRAY = [];

export default function CloseCheckListRenewal() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const filtersReady = useRef(false);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Attachments State
  const [attachmentCounts, setAttachmentCounts] = useState({});
  const [attachmentsMap, setAttachmentsMap] = useState({});
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentsList, setAttachmentsList] = useState([]);

  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const maxResult = useSelector((state) => state.search?.maxResult);
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST_CLOSE);
  const bosFilters = useBOSFilters(perms);
  const employees = bosFilters.employees || EMPTY_ARRAY;

  const tableCols = [
    { id: 'index', label: '#', minWidth: 55 },
    { id: 'seqNo', label: 'Seq.No', minWidth: 90, bold: true, render: (row) => row.checklist?.seqNo || '-' },
    {
      id: 'attachment',
      label: 'Attachment',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const count = attachmentCounts[row.id] || 0;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) {
                  const list = attachmentsMap[row.id] || [];
                  setAttachmentsList(list.map(file => ({
                    name: file.fileName || file.name,
                    serverFileName: file.path || file.serverFileName || file.fileName,
                    isServer: true,
                    docDetails: file.docType || 'Execution Proof'
                  })));
                  setAttachmentsDialogOpen(true);
                }
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: count > 0 ? 'pointer' : 'default',
                p: 0.5,
                borderRadius: '8px',
                opacity: count > 0 ? 1 : 0.4,
                '&:hover': count > 0 ? { backgroundColor: 'action.hover' } : {}
              }}
            >
              <Badge badgeContent={count > 0 ? count : null} color="primary">
                <IconPaperclip size={20} />
              </Badge>
            </Box>
          </Box>
        );
      }
    },
    {
      id: 'checkingPoint', label: 'Checking Point', minWidth: 200, render: (row) => row.checklist?.checkingPoint ? (
        <Box
          component="span"
          onClick={(e) => { e.stopPropagation(); setSelectedRowId(row.id); setActiveRow(row); setDialogOpen(true); }}
          sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.dark' } }}
        >
          {row.checklist.checkingPoint}
        </Box>
      ) : '-'
    },
    { id: 'frequency', label: 'Frequency', minWidth: 120, render: (row) => row.checklist?.frequency || '-' },
    { id: 'category', label: 'Category', minWidth: 120, render: (row) => row.checklist?.category || '-' },
    {
      id: 'groupName',
      label: 'Group Name',
      minWidth: 130,
      render: (row) => {
        const grp = row.groupName || row.checklist?.groupName;
        if (!grp || grp === '-' || grp.trim() === '') return '-';
        return (
          <Chip
            label={grp}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              bgcolor: 'primary.lighter',
              color: 'primary.dark',
              border: '1px solid',
              borderColor: 'primary.light'
            }}
          />
        );
      }
    },
    {
      id: 'assignType', label: 'Assign Type', minWidth: 120, render: (row) => {
        if (!row.assignType) return '-';
        const t = row.assignType;
        return t.replace('_', '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
      }
    },
    { id: 'photoRequired', label: 'Photo Required', minWidth: 120, render: (row) => row.checklist?.photoRequired || '-' },
    { id: 'verificationRequired', label: 'Verification Required', minWidth: 160, render: (row) => { const dc = row.checklist?.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },
    { id: 'checklistDate', label: 'Checklist Date', minWidth: 120, render: (row) => formatDate(row.checklistDate) },
    {
      id: 'nextDueDate', label: 'Next Renewal Date', minWidth: 140, render: (row) => {
        const rawDate = row.checklist?.nextDueDate || row.checklist?.expiryDate;
        if (!rawDate) return '-';
        const val = formatDate(rawDate);
        if (val === '-') return '-';
        const exp = new Date(rawDate);
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
    { id: 'assignedTo', label: 'Assign To', minWidth: 120, render: (row) => row.assignedToName || getEmployeeName(row.assignedTo, employees) },
    { id: 'status', label: 'Checklist Status', minWidth: 160, render: (row) => <StatusChip status={row.status} /> },
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

  // Configure dynamic global search bar filters based on hierarchy and permissions
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    const baseConfig = [
      {
        id: 'taskType',
        label: 'Scope',
        type: 'select',
        isStarred: true,
        defaultValue: 'Mine',
        options: bosFilters.getFilterOptions()
      },
      {
        id: 'category',
        label: 'Category',
        type: 'select',
        isStarred: true,
        defaultValue: 'All',
        options: [
          { value: 'All', label: 'All' },
          { value: 'CHECK LIST', label: 'Check List' },
          { value: 'RENEWAL', label: 'Renewal' }
        ]
      },
      {
        id: 'status',
        label: 'Status',
        type: 'autocomplete',
        multiple: true,
        isStarred: true,
        defaultValue: ['Pending'],
        options: STATUS_OPTIONS.map((status) => ({ value: status, label: status }))
      },
      { id: 'checklistDate', label: 'Checklist Date', type: 'dateRange', isStarred: true }
    ];

    dispatch(setFilterConfig({ config: baseConfig, path: '/qms/checklist/close-renewal' }));
    dispatch(setTableConfig(tableCols));
  }, [dispatch, bosFilters.isVerticalHead, bosFilters.myTeamEmployees, bosFilters.myTeamLoaded, perms.additional1, perms.loading, employees]);

  // Set initial filter config cleanup on mount/unmount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const defaultTaskType = 'Mine';
    const urlParams = new URLSearchParams(window.location.search);
    const dashboardFilter = urlParams.get('dashboardFilter');
    const urlTaskType = urlParams.get('taskType') || urlParams.get('taskScope') || urlParams.get('scope') || location?.state?.taskScope || location?.state?.taskType;
    let urlStatuses = urlParams.get('status') || urlParams.get('statuses') ? (urlParams.get('status') || urlParams.get('statuses')).split(',') : ['Pending'];

    const urlMemberId = urlParams.get('memberId') || urlParams.get('assignedTo') || location?.state?.memberId;
    let initialFilters = { category: 'All', verifyStatus: 'Verified', checklistDateConsider: 'No', ...globalFilters, taskType: defaultTaskType, taskScope: defaultTaskType, status: urlStatuses };
    if (urlMemberId) {
      initialFilters.memberId = urlMemberId;
      initialFilters.assignedTo = urlMemberId;
    }

    if (dashboardFilter) {
      const today = new Date();
      const scopeFromDash = urlTaskType || globalFilters.taskType || globalFilters.taskScope || defaultTaskType;
      if (dashboardFilter === 'today') {
        initialFilters = {
          ...initialFilters,
          taskType: scopeFromDash,
          taskScope: scopeFromDash,
          checklistDateConsider: 'Yes',
          checklistDateStart: today,
          checklistDateEnd: today,
          status: ['Pending', 'Started', 'Unresolved', 'Missed', 'Completed', 'Not Completed',
            '25%', '50%', '75%', 'Pending for Verified', 'Verified',
            'Pending for Accepted', 'Accepted', 'Attended', 'Closed']
        };
      } else if (dashboardFilter === 'todayPending') {
        initialFilters = {
          ...initialFilters,
          taskType: scopeFromDash,
          taskScope: scopeFromDash,
          checklistDateConsider: 'Yes',
          checklistDateStart: today,
          checklistDateEnd: today,
          status: ['Pending']
        };
      } else if (dashboardFilter === 'overdue') {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1500);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - 1);
        initialFilters = {
          ...initialFilters,
          taskType: scopeFromDash,
          taskScope: scopeFromDash,
          checklistDateConsider: 'Yes',
          checklistDateStart: startDate,
          checklistDateEnd: endDate,
          status: ['Pending']
        };
      }
      if (urlMemberId) {
        initialFilters.memberId = urlMemberId;
        initialFilters.assignedTo = urlMemberId;
      }
    }

    dispatch(setFilters(initialFilters));
    filtersReady.current = true;
    return () => {
      dispatch(setFilterConfig({ config: null, path: '/qms/checklist/close-renewal' }));
      dispatch(setTableConfig(null));
      filtersReady.current = false;
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, perms.additional1, perms.manager, bosFilters.isVerticalHead]);

  // Reset page when global search filters change — only if not already on page 0
  useEffect(() => {
    setPage(prev => (prev !== 0 ? 0 : prev));
  }, [globalFilters]);

  const lastFetchedRef = useRef(null);

  const fetchAssignments = useCallback(async (force = false, detail = null, isSilent = false) => {
    // Guard: don't fetch until user identity is ready
    const currentUserId = user?.userId || user?.id || user?.name;
    if (!currentUserId) return;
    const targetPage = (lastFetchedRef.current && JSON.stringify(lastFetchedRef.current.filters) !== JSON.stringify(globalFilters)) ? 0 : page;
    const considerToggle = globalFilters.checklistDateConsider === 'Yes' || globalFilters.checklistDateConsider === true;
    const startDateVal = globalFilters.checklistDateStart || globalFilters.checklistDateFrom || globalFilters.fromDate;
    const endDateVal = globalFilters.checklistDateEnd || globalFilters.checklistDateTo || globalFilters.toDate;

    const extractStringArray = (val) => {
      if (!val) return [];
      const arr = Array.isArray(val) ? val : [val];
      return arr.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.value || item.label || item.name || String(item);
        }
        return String(item);
      }).filter(Boolean);
    };

    const statusList = extractStringArray(globalFilters.status || globalFilters.statuses);

    const formatDateToISO = (dateVal) => {
      if (!dateVal) return undefined;
      if (typeof dateVal === 'string') {
        const match = dateVal.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
      }
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return undefined;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return undefined;
      }
    };

    const params = {
      page: targetPage,
      size,
      status: statusList.length > 0 ? statusList.join(',') : undefined,
      fromDate: considerToggle ? formatDateToISO(startDateVal) : undefined,
      toDate: considerToggle ? formatDateToISO(endDateVal) : undefined,
      considerDate: considerToggle ? 'Yes' : 'No',
      searchValue: searchQuery || undefined,

      // Task Filtering
      taskType: (globalFilters.taskType || globalFilters.taskScope || 'Mine') !== 'All' ? (globalFilters.taskType || globalFilters.taskScope || 'Mine') : undefined,
      currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
      pageCode: 'QM1120',
      excludeCompleted: statusList.length > 0 ? false : true,
      excludePending: false,

      // Additional / Add Filter fields mapping
      category: (globalFilters.category && globalFilters.category !== 'All') ? globalFilters.category : undefined,
      seqNo: globalFilters.seqNo || undefined,
      frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
      stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
      department: globalFilters.department || undefined,
      assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignedTo || undefined),
      dualCheck: (globalFilters.dualCheck && globalFilters.dualCheck !== 'All') ? globalFilters.dualCheck : undefined,
      checkingPoint: globalFilters.checkingPoint || undefined,
      masterVerifyStatus: (globalFilters.verifyStatus && globalFilters.verifyStatus !== 'All') ? globalFilters.verifyStatus : 'Verified'
    };

    const paramsKey = JSON.stringify(params);
    if (!force && lastFetchedRef.current && lastFetchedRef.current.key === paramsKey) {
      return;
    }
    lastFetchedRef.current = { key: paramsKey, filters: globalFilters };

    if (!isSilent) {
      setLoading(true);
    }
    try {


      const response = await axios.get('/api/qms/checklist/closed-direct', { params });
      setAttachmentCounts({});
      setAttachmentsMap({});
      setRows(response.data.content || []);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [page, size, maxResult, searchQuery, user, globalFilters]);

  // Real-time automatic data synchronization across all connected users
  useRealtimeRefresh((force, detail, isSilent) => fetchAssignments(true, detail, true));

  const isRowLocked = useCallback((row) => {
    if (!row) return false;
    const statusText = typeof row.status === 'object' ? row.status?.name : row.status;
    const st = statusText ? statusText.toUpperCase() : '';
    return ['COMPLETED', 'CLOSED', 'VERIFIED', 'ACCEPTED', 'PENDING FOR VERIFIED', 'PENDING FOR ACCEPTED'].includes(st);
  }, []);

  useEffect(() => {
    if (!rows || rows.length === 0) return;

    const newRowIds = rows
      .filter((row) => row.id && attachmentCounts[row.id] === undefined)
      .map((row) => row.id);

    if (newRowIds.length === 0) return;

    // Batch fetch all attachments in one request
    const fetchBatch = async () => {
      try {
        const res = await axios.get(`/api/master/qms/attachment/QM1120/batch`, {
          params: { refIds: newRowIds.join(',') }
        });
        const batchMap = res.data || {};

        const newCounts = {};
        const newAttachments = {};

        rows.forEach((row) => {
          if (!row.id || attachmentCounts[row.id] !== undefined) return;

          const filesList = batchMap[row.id] || [];
          const uniqueFiles = [];
          const seen = new Set();

          if (row.actualFiles && Array.isArray(row.actualFiles)) {
            row.actualFiles.forEach((fPath) => {
              const fn = String(fPath).split(/[/\\]/).pop();
              if (fn && !seen.has(fn)) {
                seen.add(fn);
                uniqueFiles.push({ fileName: fn, path: fPath, serverFileName: fPath });
              }
            });
          }

          filesList.forEach((file) => {
            const fileName = file.fileName || file.name;
            if (fileName && !seen.has(fileName)) {
              seen.add(fileName);
              uniqueFiles.push(file);
            }
          });

          newCounts[row.id] = uniqueFiles.length;
          newAttachments[row.id] = uniqueFiles;
        });

        setAttachmentCounts((prev) => ({ ...prev, ...newCounts }));
        setAttachmentsMap((prev) => ({ ...prev, ...newAttachments }));
      } catch (e) {
        console.error('Failed to batch-fetch attachments:', e);
      }
    };

    fetchBatch();
  }, [rows]);

  useEffect(() => {
    // Only fetch once both filters and user identity are ready
    const currentUserId = user?.userId || user?.id || user?.name;
    if (!filtersReady || !currentUserId) return;
    fetchAssignments();
  }, [fetchAssignments, filtersReady, globalFilters, maxResult, user]);

  // Handle URL query parameters for notifications (e.g. ?viewId=123)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewId = params.get('viewId');
    if (viewId && rows && !dialogOpen) {
      const match = rows.find(r => String(r.id) === String(viewId));
      if (match) {
        setSelectedRowId(match.id);
        setActiveRow(match);
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

  const handleUpdateStatus = async (status) => {
    if (selectedRowId === null || selectedRowId === undefined) return;
    try {
      const targetId = selectedRowId >= 10000000 ? selectedRowId : selectedRowId + 10000000;
      await axios.post('/api/qms/checklist/verify', {
        assignmentId: targetId,
        status: status,
        verifiedBy: user?.name || user?.id || 'Admin',
        remarks: `Status updated to ${status}`
      });
      fetchAssignments();
    } catch (error) {
      console.error('Failed to update assignment status:', error);
    }
  };

  const handleSaveExecution = async (formData) => {
    if (selectedRowId === null || selectedRowId === undefined) return;
    try {
      const uploadedFileNames = [];
      for (const f of formData.actualFiles) {
        if (f.isServer) {
          uploadedFileNames.push(f.serverFileName || f.name);
        } else if (f.file) {
          const upFormData = new FormData();
          upFormData.append('file', f.file);
          const res = await axios.post('/api/files/upload', upFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedFileNames.push(res.data);
        }
      }

      const targetId = selectedRowId >= 10000000 ? selectedRowId : selectedRowId + 10000000;
      await axios.post('/api/qms/checklist/execution-update', {
        assignmentId: targetId,
        status: formData.status,
        verifiedBy: user?.name || user?.id || 'Executor',
        remarks: formData.remarks || '',
        nextRenewalDate: formData.nextRenewalDate || null,
        actualFiles: uploadedFileNames.length > 0 ? uploadedFileNames : null
      });

      setDialogOpen(false);
      fetchAssignments(true);
    } catch (error) {
      console.error('Failed to save execution:', error);
    }
  };

  const handleCloseChecklist = async () => {
    if (!activeRow?.checklist?.id) return;
    try {
      const checklistId = activeRow.checklist.id;
      await axios.post(`/api/qms/checklist/${checklistId}/close`);
      dispatch(openSnackbar({ open: true, message: 'Checklist closed successfully!', variant: 'alert', severity: 'success' }));
      setCloseConfirmOpen(false);
      fetchAssignments(true);
    } catch (error) {
      console.error('Failed to close checklist:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to close checklist.', variant: 'alert', severity: 'error' }));
    }
  };

  const handleRenewalChecklist = async () => {
    if (!activeRow?.checklist?.id) return;
    try {
      const checklistId = activeRow.checklist.id;
      await axios.post('/api/qms/checklist/verify-master', {
        checklistId: checklistId,
        status: 'Renewal Pending',
        verifiedBy: user?.employeeName || user?.userName || user?.name || user?.id || 'Admin',
        remarks: 'Checklist selected for renewal cycle'
      });
      dispatch(openSnackbar({ open: true, message: 'Checklist marked for renewal successfully!', variant: 'alert', severity: 'success' }));
      fetchAssignments();
    } catch (error) {
      console.error('Failed to mark checklist for renewal:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to mark checklist for renewal.', variant: 'alert', severity: 'error' }));
    }
  };

  const canEditSelected = perms.write || (activeRow && activeRow.assignedTo && (
    activeRow.assignedTo.toLowerCase() === String(user?.id || '').toLowerCase() ||
    activeRow.assignedTo.toLowerCase() === String(user?.name || '').toLowerCase() ||
    (activeRow.assignedToName || getEmployeeName(activeRow.assignedTo, employees)).toLowerCase() === String(user?.name || '').toLowerCase() ||
    String(activeRow.assignedTo) === String(user?.empId || user?.employeeId || '')
  ));

  // const actionColumn = {
  //   label: 'Actions',
  //   minWidth: 120,
  //   render: (row) => {
  //     const isMasterClosed = row.checklist?.status === 'Closed';
  //     return (
  //       <BOSRowActions
  //         maxInline={2}
  //         actions={[
  //           {
  //             key: 'close',
  //             icon: <IconCircleX />,
  //             label: 'Close Checklist',
  //             color: 'error',
  //             disabled: isMasterClosed || !perms.write,
  //             tooltip: 'Close Checklist indefinitely',
  //             onClick: () => {
  //               const original = rows.find(r => r.id === row.id) || row;
  //               setSelectedRowId(original.id);
  //               setActiveRow(original);
  //               setCloseConfirmOpen(true);
  //             }
  //           },
  //           {
  //             key: 'renewal',
  //             icon: <IconRefresh />,
  //             label: 'Select Renewal',
  //             color: 'primary',
  //             disabled: isMasterClosed || !perms.write,
  //             tooltip: 'Select Renewal cycle',
  //             onClick: () => {
  //               const original = rows.find(r => r.id === row.id) || row;
  //               setSelectedRowId(original.id);
  //               setActiveRow(original);
  //               handleRenewalChecklist(original);
  //             }
  //           }
  //         ]}
  //       />
  //     );
  //   }
  // };

  return (
    <MainCard
      content={false}
      title="Close Check List / Renewal"
      secondary={
        <BOSTableToolbar
          id="qms-close-checklist-renewal-table"
          onRefresh={fetchAssignments}
          hasWritePermission={perms.write}
          columns={tableCols}
          exportData={rows}
          exportFilename="Close_Checklist"
          hasExportPermission={perms.export}
        />
      }
    >

      <BOSDataTable
        id="qms-close-checklist-renewal-table"
        columns={tableCols}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={(row) => {
          const original = rows.find(r => r.id === row.id) || row;
          const canEdit = perms.write || (original && original.assignedTo && (
            original.assignedTo.toLowerCase() === String(user?.id || '').toLowerCase() ||
            original.assignedTo.toLowerCase() === String(user?.name || '').toLowerCase() ||
            (original.assignedToName || getEmployeeName(original.assignedTo, employees)).toLowerCase() === String(user?.name || '').toLowerCase() ||
            String(original.assignedTo) === String(user?.empId || user?.employeeId || '')
          ));
          if (canEdit) {
            setSelectedRowId(original.id);
            setActiveRow(original);
            setDialogOpen(true);
          }
        }}
        onClickRow={(row) => { setSelectedRowId(row.id); setActiveRow(row); }}
        selectedRowId={selectedRowId}
        //actionColumn={actionColumn}
        disableSearchFilter={false}
      />

      <ExecutionVerifyDialog
        open={dialogOpen}
        handleClose={handleDialogClose}
        data={activeRow}
        isExecution={activeRow ? !isRowLocked(activeRow) : true}
        onSave={handleSaveExecution}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Attachments Dialog */}
      <Dialog open={attachmentsDialogOpen} onClose={() => setAttachmentsDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider', position: 'relative' }}>
          <Typography variant="h4" fontWeight={800}>Attachments ({attachmentsList.length})</Typography>
          <IconButton onClick={() => setAttachmentsDialogOpen(false)} sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: '16px !important' }}>
          <BOSFileGallery files={attachmentsList} isEditing={false} maxHeight={400} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Close Checklist */}
      <Dialog
        open={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        aria-labelledby="close-checklist-dialog-title"
        aria-describedby="close-checklist-dialog-description"
      >
        <DialogTitle id="close-checklist-dialog-title">
          {"Confirm Checklist Closure"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="close-checklist-dialog-description">
            Are you sure you want to close the checklist <strong>{activeRow?.checklist?.seqNo || ''}</strong> (Checking Point: <em>{activeRow?.checklist?.checkingPoint || ''}</em>) indefinitely?
            <br />
            Once closed, no further checklist instances will be generated automatically.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCloseChecklist} color="error" autoFocus variant="contained">
            Close Checklist
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}

