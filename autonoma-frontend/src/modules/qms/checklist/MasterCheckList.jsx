import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Typography, Stack, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Badge } from '@mui/material';
import { IconClipboardList, IconFileDots, IconUserPlus, IconPaperclip, IconX, IconToggleRight, IconToggleLeft } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters, selectDateRangeParams } from 'store/slices/search';
import useBOSFilters from 'hooks/useBOSFilters';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import AddCheckListDialog from './AddCheckListDialog';
import ChecklistAssignDialog from './ChecklistAssignDialog';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip, BOSRowActions, getCommonDateFilters, BOSFileGallery, parseBOSFiles } from 'ui-component/bos';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import useLookups from 'hooks/useLookups';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

import { FILTER_TYPES, COMMON_FILTER_IDS } from 'utils/constants';

const getEmployeeName = (idOrCodeOrName, employeesList = []) => {
  if (!idOrCodeOrName || idOrCodeOrName === '-') return '-';
  const parts = String(idOrCodeOrName).split(',').map(p => p.trim());
  const resolvedParts = parts.map(part => {
    let rawPart = part;
    let suffix = '';
    const match = part.match(/^(.*?)\s*(\([PST]\))$/i);
    if (match) {
      rawPart = match[1].trim();
      suffix = ' ' + match[2];
    }
    const emp = employeesList.find(
      (e) =>
        String(e.id) === String(rawPart) ||
        String(e.empCode) === String(rawPart) ||
        String(e.employeeCode) === String(rawPart) ||
        String(e.employeeName).toLowerCase() === String(rawPart).toLowerCase()
    );
    if (emp) {
      if (emp.isActive === false || String(emp.status || '').toUpperCase() === 'INACTIVE') {
        return null;
      }
      return emp.employeeName + suffix;
    }
    return part;
  }).filter(Boolean);

  return resolvedParts.length > 0 ? resolvedParts.join(', ') : '-';
};

// ── Date formatter ──────────────────────────────────────────────────────────────
const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [yyyy, mm, dd] = dateVal.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      if (dateVal.includes('T')) {
        const [yyyy, mm, dd] = dateVal.split('T')[0].split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '-';
  }
};

// ── DateTime formatter (Date + Time, 12-hour AM/PM) ─────────────────────────────
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

const formatTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '-';
  }
};

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

// ── Column definitions ──────────────────────────────────────────────────────────
const columns = [
  {
    id: 'attachment',
    label: 'Attachment',
    minWidth: 120,
    align: 'center',
  },
  { id: 'index', label: 'No', minWidth: 55, frozen: true },
  { id: 'seqNo', label: 'Seq No', minWidth: 90, bold: true },
  { id: 'category', label: 'Category', minWidth: 120 },
  { id: 'checkingPoint', label: 'Checking Point', minWidth: 200 },
  { id: 'description', label: 'Descriptions/SOP', minWidth: 200 },
  { id: 'department', label: 'Department', minWidth: 160 },
  { id: 'effectiveFrom', label: 'Effective From', minWidth: 120 },
  { id: 'frequency', label: 'Frequency', minWidth: 120 },
  {
    id: 'expiryDate',
    label: 'Expiry Date',
    minWidth: 120,
    render: (row) => {
      const val = row.expiryDate;
      if (!val || val === '-') return <span>-</span>;
      const isExpired = row._expiryExpired;
      // Expired dates use the unified "danger" tone (no flat browser red).
      return (
        <Box
          component="span"
          sx={{
            fontWeight: isExpired ? 700 : 400,
            color: isExpired ? (t) => (t.palette.mode === 'dark' ? 'hsl(4, 84%, 78%)' : 'hsl(4, 66%, 44%)') : 'text.primary',
            bgcolor: isExpired ? (t) => (t.palette.mode === 'dark' ? 'hsla(4, 74%, 56%, 0.17)' : 'hsl(4, 78%, 96%)') : 'transparent',
            border: isExpired ? (t) => `1px solid ${t.palette.mode === 'dark' ? 'hsla(4, 75%, 60%, 0.32)' : 'hsla(4, 70%, 55%, 0.22)'}` : 'none',
            px: isExpired ? 1 : 0,
            py: isExpired ? 0.4 : 0,
            borderRadius: isExpired ? '8px' : 0,
            display: 'inline-block',
            fontSize: '0.82rem',
          }}
        >
          {val}
        </Box>
      );
    }
  },
  { id: 'reminderDate', label: 'Reminder Date', minWidth: 120 },
  { id: 'reminderDays', label: 'Reminder Days', minWidth: 120 },
  { id: 'stockLink', label: 'Stock Link', minWidth: 100 },
  { id: 'photoRequired', label: 'Photo Required', minWidth: 120 },
  { id: 'dualCheck', label: 'Dual Check', minWidth: 110, render: (row) => { const dc = row.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },

  { id: 'assignTo', label: 'Assign To (Type)', minWidth: 150 },
  {
    id: 'status',
    label: 'Checklist Status',
    minWidth: 120,
    render: (row) => {
      const status = row.status || 'Active';
      const displayStatus = status === 'In Active' ? 'Inactive' : status;
      const isDanger = ['pending', 'not assigned', 'rejected'].includes(status.toLowerCase());
      return <BOSStatusChip status={displayStatus} toneOverride={isDanger ? 'danger' : undefined} width={140} />;
    }
  },
  {
    id: 'verifyStatus',
    label: 'Verify Status',
    minWidth: 150,
    render: (row) => {
      const status = row.verifyStatus || 'To Be Verified';
      let color = 'warning';
      if (status === 'Verified') color = 'success';
      if (status === 'Rejected') color = 'error';
      return <BOSStatusChip status={status} color={color} showIcon={true} width={150} />;
    }
  },
  {
    id: 'taskStatus',
    label: 'Assigned Status',
    minWidth: 120,
    render: (row) => {
      const status = row._displayTaskStatus || 'UN ASSIGNED';
      const isDanger = ['un assigned', 'unassigned', 'not assigned'].includes(status.toLowerCase());
      return <BOSStatusChip status={status} toneOverride={isDanger ? 'danger' : undefined} width={140} />;
    }
  },
  { id: 'verifiedBy', label: 'Verified By', minWidth: 120 },
  { id: 'verifiedDate', label: 'Verified Date & Time', minWidth: 160, render: (row) => row.verifiedDate },
  { id: 'createdUser', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date & Time', minWidth: 160, render: (row) => row.createdDate },
  { id: 'updatedUser', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Update Date & Time', minWidth: 160, render: (row) => row.updatedDate },
];

const exportColumns = [
  {
    header: 'Attachment Count',
    key: (r) => {
      const uploadedParts = r.uploadedFiles && r.uploadedFiles !== '-' ? parseBOSFiles(r.uploadedFiles) : [];
      const scannedParts = r.scannedFiles && r.scannedFiles !== '-' ? parseBOSFiles(r.scannedFiles) : [];
      const count = uploadedParts.length + scannedParts.length;
      return count > 0 ? String(count) : '0';
    }
  },
  { header: 'Seq No', key: 'seqNo' },
  { header: 'Category', key: 'category' },
  { header: 'Checking Point', key: 'checkingPoint' },
  { header: 'Descriptions/SOP', key: 'description' },
  { header: 'Department', key: (r) => (r.departments || []).map(d => d.departmentName).join(', ') },
  { header: 'Effective From', key: (r) => formatDate(r.effectiveFrom) },
  { header: 'Frequency', key: 'frequency' },
  { header: 'Expiry Date', key: (r) => formatDate(r.expiryDate) },
  { header: 'Reminder Date', key: (r) => formatDate(r.reminderDate) },
  { header: 'Reminder Days', key: 'reminderDays' },
  { header: 'Stock Link', key: 'stockLink' },
  { header: 'Photo Required', key: 'photoRequired' },
  { header: 'Dual Check', key: (r) => { const dc = r.dualCheck?.toString().toUpperCase(); return (dc === 'YES' || dc === '1') ? 'Yes' : 'No'; } },

  { header: 'Carry Forward', key: 'carryForward' },
  { header: 'Assign To (Type)', key: 'assignTo' },
  { header: 'Status', key: 'status' },
  { header: 'Assigned', key: 'taskStatus' },
  { header: 'Verify Status', key: 'verifyStatus' },
  { header: 'Verified By', key: 'verifiedBy' },
  { header: 'Verified Date & Time', key: 'verifiedDate' },
  { header: 'Created By', key: 'createdUser' },
  { header: 'Created Date & Time', key: 'createdDate' },
  { header: 'Updated By', key: 'updatedUser' },
  { header: 'Update Date & Time', key: 'updatedDate' },
];

// ── Static filter options (department options are loaded dynamically) ────────────
const STATIC_FILTER_OPTIONS = {
  category: [{ value: 'All', label: 'All' }, { value: 'RENEWAL', label: 'RENEWAL' }, { value: 'CHECK LIST', label: 'CHECK LIST' }],
  verifyStatus: [{ value: 'All', label: 'All' }, { value: 'To Be Verified', label: 'To Be Verified' }, { value: 'Verified', label: 'Verified' }, { value: 'Rejected', label: 'Rejected' }],
  recordStatus: [
    { value: 'All', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'In Active', label: 'Inactive' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Not Assigned', label: 'Not Assigned' },
    { value: 'Rejected', label: 'Rejected' }
  ],
  taskStatus: [{ value: 'All', label: 'All' }, { value: 'Assigned', label: 'Assigned' }, { value: 'Unassigned', label: 'Unassigned' }],
  frequency: [{ value: 'All', label: 'All' }, { value: 'DAILY', label: 'DAILY' }, { value: 'WEEKLY', label: 'WEEKLY' }, { value: 'FORTNIGHTLY', label: 'FORTNIGHTLY' }, { value: 'MONTHLY', label: 'MONTHLY' }, { value: 'QUARTERLY', label: 'QUARTERLY' }, { value: 'HALF YEARLY', label: 'HALF YEARLY' }, { value: 'YEARLY', label: 'YEARLY' }],
  stockLink: [{ value: 'All', label: 'All' }, { value: 'YES', label: 'YES' }, { value: 'NO', label: 'NO' }],
  photoRequired: [{ value: 'All', label: 'All' }, { value: 'YES', label: 'YES' }, { value: 'NO', label: 'NO' }],
};

const DEFAULT_FILTERS = {
  category: 'All', checkingPoint: '',
  createdDateStart: '', createdDateEnd: '',
  status: 'Active', taskType: 'All'
};

/**
 * Builds the filter configuration array for the SearchSection filter panel.
 * Uses JSDoc annotations to document shape and prevent type errors/drift.
 *
 * @param {Object} bosFilters - Filters retrieved from useBOSFilters
 * @param {URLSearchParams} urlParams - Query parameters from current window URL
 * @returns {import('ui-component/bos/BOSUtils').FilterConfig[]}
 */
const buildFilterConfig = (bosFilters, urlParams, departmentOptions = []) => {
  const urlStatus = urlParams ? urlParams.get('status') : null;
  const urlTaskStatus = urlParams ? urlParams.get('taskStatus') : null;
  const urlVerifyStatus = urlParams ? urlParams.get('verifyStatus') : null;
  const urlCategory = urlParams ? urlParams.get('category') : null;
  const urlDepartment = urlParams ? urlParams.get('department') : null;

  return [
    { id: 'category', label: 'Category', type: FILTER_TYPES.SELECT, isStarred: true, defaultValue: urlCategory || 'All', options: STATIC_FILTER_OPTIONS.category },
    {
      id: 'checkingPoint',
      label: 'Checking Point',
      type: FILTER_TYPES.TEXT,
      placeholder: 'Search checking point...',
      isStarred: true
    },
    {
      id: 'department',
      label: 'Department',
      type: FILTER_TYPES.SELECT,
      isStarred: true,
      defaultValue: urlDepartment || 'All',
      options: [{ value: 'All', label: 'All' }, ...departmentOptions]
    },
    { id: COMMON_FILTER_IDS.CREATED_DATE, label: 'Considered Date', type: FILTER_TYPES.DATE_RANGE, isStarred: true, hideConsiderInput: true },
    { id: COMMON_FILTER_IDS.UPDATED_DATE, label: 'Updated Date', type: FILTER_TYPES.DATE_RANGE, isStarred: false },
    {
      id: 'status', label: 'Status', type: FILTER_TYPES.SELECT, isStarred: true, defaultValue: urlStatus || 'Active', options: [
        { value: 'All', label: 'All' },
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    { id: 'taskStatus', label: 'Assigned Status', type: FILTER_TYPES.SELECT, isStarred: true, defaultValue: urlTaskStatus || 'All', options: STATIC_FILTER_OPTIONS.taskStatus },
    { id: 'verifyStatus', label: 'Verify Status', type: FILTER_TYPES.SELECT, isStarred: false, defaultValue: urlVerifyStatus || 'All', options: STATIC_FILTER_OPTIONS.verifyStatus },
    { id: 'frequency', label: 'Frequency', type: FILTER_TYPES.SELECT, isStarred: false, defaultValue: 'All', options: STATIC_FILTER_OPTIONS.frequency },
    { id: 'stockLink', label: 'Stock Link', type: FILTER_TYPES.SELECT, isStarred: false, defaultValue: 'All', options: STATIC_FILTER_OPTIONS.stockLink },
    { id: 'photoRequired', label: 'Photo Required', type: FILTER_TYPES.SELECT, isStarred: false, defaultValue: 'All', options: STATIC_FILTER_OPTIONS.photoRequired }
  ];
};


// ==============================|| MASTER CHECKLIST (BOS SOP COMPLIANT) ||============================== //

export default function MasterCheckList() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST);
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const createdDateParams = useSelector(selectDateRangeParams(COMMON_FILTER_IDS.CREATED_DATE));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isAmendment, setIsAmendment] = useState(false);
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [attachmentsList, setAttachmentsList] = useState([]);
  const [descriptionViewOpen, setDescriptionViewOpen] = useState(false);
  const [descriptionViewContent, setDescriptionViewContent] = useState('');
  const [descriptionViewTitle, setDescriptionViewTitle] = useState('');

  const handleViewAttachments = useCallback((row) => {
    const list = [];
    if (row.uploadedFiles) {
      parseBOSFiles(row.uploadedFiles).forEach(fileName => {
        list.push({
          name: fileName,
          serverFileName: fileName,
          isServer: true,
          docDetails: 'Uploaded Document'
        });
      });
    }
    if (row.scannedFiles) {
      parseBOSFiles(row.scannedFiles).forEach(fileName => {
        list.push({
          name: fileName,
          serverFileName: fileName,
          isServer: true,
          docDetails: 'Scanned Document'
        });
      });
    }
    setAttachmentsList(list);
    setAttachmentsDialogOpen(true);
  }, []);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Column picker state
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => columns.map(c => c.id));

  // Fetch active departments for the filter dropdown
  useEffect(() => {
    axios.get('/api/master/hr/departments/active')
      .then((res) => {
        const opts = (Array.isArray(res.data) ? res.data : (res.data?.content || []))
          .map((d) => ({ value: d.departmentName, label: d.departmentName }))
          .sort((a, b) => a.label.localeCompare(b.label));
        setDepartmentOptions(opts);
      })
      .catch(() => setDepartmentOptions([]));
  }, []);

  const bosFilters = useBOSFilters(perms);

  const filtersReady = useRef(false);

  // Initialize default filters on mount, clean up on unmount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTaskStatus = urlParams.get('taskStatus');
    const urlVerifyStatus = urlParams.get('verifyStatus');
    const urlStatus = urlParams.get('status');
    const urlCategory = urlParams.get('category');
    const urlDepartment = urlParams.get('department');

    dispatch(setFilters({
      ...globalFilters,
      category: urlCategory || globalFilters.category || 'All',
      checkingPoint: '',
      status: urlStatus || globalFilters.status || 'Active',
      taskStatus: urlTaskStatus || (urlParams.has('taskStatus') ? urlTaskStatus : (globalFilters.taskStatus || 'All')),
      verifyStatus: urlVerifyStatus || (urlParams.has('verifyStatus') ? urlVerifyStatus : (globalFilters.verifyStatus || 'All')),
      department: urlDepartment || globalFilters.department || 'All',
      taskType: 'All',
      taskScope: 'All'
    }));
    filtersReady.current = true;
    return () => {
      filtersReady.current = false;
    };
  }, [dispatch]);

  // Register global filter bar config
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const urlParams = new URLSearchParams(window.location.search);
    dispatch(setFilterConfig({ config: buildFilterConfig(bosFilters, urlParams, departmentOptions), path: '/master/qms/checklist/master' }));
    return () => dispatch(setFilterConfig({ config: null, path: '/master/qms/checklist/master' }));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, departmentOptions]);

  // Reset page when global search filters change — only if not already on page 0
  useEffect(() => {
    setPage(prev => (prev !== 0 ? 0 : prev));
  }, [globalFilters]);

  const lastFetchedRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchChecklists = useCallback(async (forceFetch = false, isSilent = false) => {
    const targetPage = (lastFetchedRef.current && JSON.stringify(lastFetchedRef.current.filters) !== JSON.stringify(globalFilters)) ? 0 : page;
    const params = {
      page: targetPage,
      size,
      searchValue: searchQuery || undefined,
      category: (globalFilters.category && globalFilters.category !== 'All') ? globalFilters.category : undefined,
      checkingPoint: globalFilters.checkingPoint || undefined,
      status: (globalFilters.status && globalFilters.status !== 'All') ? globalFilters.status : undefined,
      taskStatus: (globalFilters.taskStatus && globalFilters.taskStatus !== 'All') ? globalFilters.taskStatus : undefined,
      verifyStatus: (globalFilters.verifyStatus && globalFilters.verifyStatus !== 'All') ? globalFilters.verifyStatus : undefined,
      department: (globalFilters.department && globalFilters.department !== 'All') ? globalFilters.department : undefined,
      dualCheck: (globalFilters.dualCheck && globalFilters.dualCheck !== 'All') ? globalFilters.dualCheck : undefined,
      seqNo: globalFilters.seqNo || undefined,
      frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
      description: globalFilters.description || undefined,
      stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
      photoRequired: (globalFilters.photoRequired && globalFilters.photoRequired !== 'All') ? globalFilters.photoRequired : undefined,
      carryForward: (globalFilters.carryForward && globalFilters.carryForward !== 'All') ? globalFilters.carryForward : undefined,
      fromDate: createdDateParams.fromDate || undefined,
      toDate: createdDateParams.toDate || undefined,
      considerDate: createdDateParams.considerDate,
      considerDateValue: (createdDateParams.considerDate === 'Yes' && globalFilters.createdDateConsiderValue) ? globalFilters.createdDateConsiderValue : undefined,
      taskType: 'All',
      currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
      assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignTo || globalFilters.assignedTo || undefined),
      _t: Date.now() // Bypass browser GET cache
    };

    const paramsKey = JSON.stringify({ ...params, _t: null }); // Ignore _t for our internal cache check
    if (!forceFetch && lastFetchedRef.current && lastFetchedRef.current.key === paramsKey) {
      return;
    }
    lastFetchedRef.current = { key: paramsKey, filters: globalFilters };

    if (!isSilent) {
      setLoading(true);
    }
    try {

      const res = await axios.get('/api/qms/checklist', { params });
      setRows(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
    } finally {
      setLoading(false);
    }
  }, [page, size, globalFilters, searchQuery, user, createdDateParams]);

  const fetchAllForExport = useCallback(async () => {
    const params = {
      page: 0,
      size: 100000, // Large number to fetch all records matching filters
      searchValue: searchQuery || undefined,
      category: (globalFilters.category && globalFilters.category !== 'All') ? globalFilters.category : undefined,
      checkingPoint: globalFilters.checkingPoint || undefined,
      status: (globalFilters.status && globalFilters.status !== 'All') ? globalFilters.status : undefined,
      taskStatus: (globalFilters.taskStatus && globalFilters.taskStatus !== 'All') ? globalFilters.taskStatus : undefined,
      verifyStatus: (globalFilters.verifyStatus && globalFilters.verifyStatus !== 'All') ? globalFilters.verifyStatus : undefined,
      department: (globalFilters.department && globalFilters.department !== 'All') ? globalFilters.department : undefined,
      dualCheck: (globalFilters.dualCheck && globalFilters.dualCheck !== 'All') ? globalFilters.dualCheck : undefined,
      seqNo: globalFilters.seqNo || undefined,
      frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
      description: globalFilters.description || undefined,
      stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
      photoRequired: (globalFilters.photoRequired && globalFilters.photoRequired !== 'All') ? globalFilters.photoRequired : undefined,
      carryForward: (globalFilters.carryForward && globalFilters.carryForward !== 'All') ? globalFilters.carryForward : undefined,
      fromDate: createdDateParams.fromDate || undefined,
      toDate: createdDateParams.toDate || undefined,
      considerDate: createdDateParams.considerDate,
      considerDateValue: (createdDateParams.considerDate === 'Yes' && globalFilters.createdDateConsiderValue) ? globalFilters.createdDateConsiderValue : undefined,
      taskType: 'All',
      currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
      assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignTo || globalFilters.assignedTo || undefined),
      _t: Date.now()
    };

    try {
      const res = await axios.get('/api/qms/checklist', { params });
      return res.data.content || [];
    } catch (err) {
      console.error('Failed to fetch full data for export:', err);
      return [];
    }
  }, [globalFilters, searchQuery, user, createdDateParams]);

  useEffect(() => {
    // Skip the transitional empty state that occurs before mount setFilters applies defaults
    if (!filtersReady.current && Object.keys(globalFilters).length === 0) return;
    fetchChecklists();
  }, [fetchChecklists]);

  useRealtimeRefresh((force, detail, isSilent) => fetchChecklists(true, isSilent));

  // ── Resolved rows — flatten computed display fields ───────────────────────────
  const resolvedRows = useMemo(() => rows.map((row) => {
    // Check expiry
    let expiryExpired = false;
    if (row.expiryDate) {
      const exp = new Date(row.expiryDate);
      if (!isNaN(exp.getTime())) {
        exp.setHours(23, 59, 59, 999);
        expiryExpired = exp < new Date();
      }
    }

    // Read the task status populated dynamically by the backend
    const displayTaskStatus = row.taskStatus || 'Unassigned';

    let isUpdated = false;
    if (row.updatedAt && row.updatedUser && row.updatedUser !== '-') {
      if (row.createdAt) {
        const msDiff = Math.abs(new Date(row.updatedAt) - new Date(row.createdAt));
        if (msDiff > 5000) {
          isUpdated = true;
        }
      } else {
        isUpdated = true;
      }
    }

    let upUser = isUpdated ? (row.updatedUser || row.updatedBy || '-') : '-';
    if (upUser === 'Admin istrator' || upUser === 'Administrator') {
      upUser = 'Admin';
    }
    if (String(upUser).toLowerCase().includes('system')) {
      upUser = '-';
      isUpdated = false;
    }

    let upDate = isUpdated ? formatDateTime(row.updatedAt) : '-';

    let vBy = row.verifiedBy || '-';
    if (vBy === 'Admin istrator' || vBy === 'Administrator' || vBy.toLowerCase() === 'admin') {
      vBy = 'Admin';
    } else if (vBy.toUpperCase() === 'SUPER BOSS' || vBy.toLowerCase() === 'superboss') {
      vBy = 'Super Boss';
    }

    return {
      ...row,
      department: (row.departments || []).map(d => d.departmentName).join(', '),
      effectiveFrom: formatDate(row.effectiveFrom),
      expiryDate: formatDate(row.expiryDate),
      _expiryExpired: expiryExpired,
      _displayTaskStatus: displayTaskStatus,
      reminderDate: formatDate(row.reminderDate),
      _verifiedDateRaw: row.verifiedDate,
      verifiedDate: formatDateTime(row.verifiedDate),
      createdUser: row.createdUser || row.createdBy || '-',
      createdDate: formatDateTime(row.createdAt || row.createdDate),
      updatedUser: upUser,
      updatedDate: upDate,
      verifiedBy: vBy,
      status: row.status || 'Active',
    };
  }).sort((a, b) => {
    const aNum = parseInt(String(a.seqNo || '').replace(/\D/g, ''), 10);
    const bNum = parseInt(String(b.seqNo || '').replace(/\D/g, ''), 10);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return bNum - aNum;
    }
    return String(b.seqNo || '').localeCompare(String(a.seqNo || ''));
  }), [rows]);

  // ── Save / Edit ───────────────────────────────────────────────────────────────
  const handleSave = async (data) => {
    try {
      const { department, ...rawBody } = data;
      const departments = department || [];
      // Keep all fields including null — null values explicitly clear fields on the server
      const body = Object.fromEntries(
        Object.entries(rawBody).filter(([, v]) => v !== undefined && v === v)
      );
      delete body.createdUser;
      delete body.updatedUser;
      const qs = new URLSearchParams();
      departments.forEach((d) => qs.append('departments', d));
      await axios.post(`/api/qms/checklist/verify-master?${qs.toString()}`, body);
      dispatch(openSnackbar({ open: true, message: 'Checklist saved successfully!', variant: 'alert', severity: 'success' }));
      // Clear caching ref to force grid refresh
      lastFetchedRef.current = null;

      fetchChecklists(true);
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save checklist:', err);
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || err?.message || 'Failed to save checklist.', variant: 'alert', severity: 'error' }));
    }
  };

  // ── Action handlers ───────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setSelectedRow(null);
    setIsAmendment(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    // Find original (non-flattened) row
    const original = rows.find((r) => r.id === row.id) || row;
    setSelectedRow(original);
    setIsAmendment(false);
    setDialogOpen(true);
  };

  const handleAmendment = (row) => {
    if (row?.verifyStatus && String(row.verifyStatus).toUpperCase() !== 'VERIFIED') {
      dispatch(openSnackbar({ open: true, message: 'Only verified checklists can be amended!', variant: 'alert', severity: 'warning' }));
      return;
    }
    const original = rows.find((r) => r.id === row.id) || row;
    setSelectedRow(original);
    setIsAmendment(true);
    setDialogOpen(true);
  };

  const handleAssign = (row) => {
    if (row?.verifyStatus && String(row.verifyStatus).toUpperCase() !== 'VERIFIED') {
      dispatch(openSnackbar({ open: true, message: 'Only verified checklists can be assigned!', variant: 'alert', severity: 'warning' }));
      return;
    }
    const original = rows.find((r) => r.id === row.id) || row;
    setSelectedRow(original);
    setAssignDialogOpen(true);
  };

  const handleToggleStatus = async (row) => {
    const original = rows.find((r) => r.id === row.id) || row;
    const currentStatus = original.status || 'Active';
    const isCurrentlyActive = currentStatus.toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    try {
      await axios.put(`/api/qms/checklist/${original.id}/status?status=${newStatus}`);
      dispatch(openSnackbar({
        open: true,
        message: `Checklist marked as ${newStatus} successfully!`,
        variant: 'alert',
        severity: 'success'
      }));
      lastFetchedRef.current = null;
      fetchChecklists(true);
    } catch (err) {
      console.error('Failed to change status:', err);
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to update status.',
        variant: 'alert',
        severity: 'error'
      }));
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  // ── Make Checking Point a clickable blue link that opens the edit dialog ─────
  const tableColumns = useMemo(() => columns

    .map((col) => {
      if (col.id === 'checkingPoint') {
        return {
          ...col,
          exportValue: (row) => row.checkingPoint || '-',
          render: (row) => {
            const text = row.checkingPoint;
            if (!text) return '-';
            return (
              <Box
                component="span"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { color: 'primary.dark' }
                }}
              >
                {text}
              </Box>
            );
          }
        };
      }
      if (col.id === 'description') {
        return {
          ...col,
          exportValue: (row) => {
            const rawText = row.description || '';
            return stripHtml(rawText) || '-';
          },
          render: (row) => {
            const rawText = row.description || '';
            const plainText = stripHtml(rawText);
            if (!plainText) return '-';
            const isTruncated = plainText.length > 50;
            const displayText = isTruncated ? `${plainText.substring(0, 50)}...` : plainText;
            return (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  setDescriptionViewTitle(`Description/SOP - ${row.seqNo || ''}`);
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
        };
      }
      if (col.id === 'attachment') {
        return {
          ...col,
          render: (row) => {
            const uploadedParts = row.uploadedFiles && row.uploadedFiles !== '-' ? parseBOSFiles(row.uploadedFiles) : [];
            const scannedParts = row.scannedFiles && row.scannedFiles !== '-' ? parseBOSFiles(row.scannedFiles) : [];
            const count = uploadedParts.length + scannedParts.length;

            const badgeLabel = count > 99 ? '99+' : String(count);

            return (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box
                  onClick={(e) => { e.stopPropagation(); handleViewAttachments(row); }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    p: 0.5,
                    m: 0.5, // Add margin around the box to ensure badge space
                    borderRadius: '8px',
                    transition: 'background 0.18s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Badge
                    badgeContent={count > 0 ? badgeLabel : null}
                    color="primary"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    sx={{
                      '& .MuiBadge-badge': {
                        transform: 'scale(1) translate(-25%, -25%)', // Pull the badge slightly inward to prevent clipping
                        fontSize: count > 99 ? '0.55rem' : '0.65rem',
                        fontWeight: 800,
                        minWidth: count > 9 ? '20px' : '17px',
                        height: count > 9 ? '20px' : '17px',
                        boxShadow: (theme) => `0 2px 6px 0 ${theme.palette.primary.main}80`,
                      }
                    }}
                  >
                    <IconPaperclip
                      size={20}
                      style={{
                        display: 'block',
                        color: count > 0 ? 'inherit' : '#9e9e9e',
                      }}
                    />
                  </Badge>
                </Box>
              </Box>
            );
          }
        };
      }
      if (col.id === 'assignTo') {
        return {
          ...col,
          render: (row) => row.assignTo || '-'
        };
      }
      return col;
    }), [visibleColumnIds, rows, handleViewAttachments]);

  // ── Unified action column (Status + Amendment + Assign) via BOSRowActions ─────
  const actionColumn = {
    label: 'Actions',
    minWidth: 140,
    render: (row) => {
      const isVerified = row?.verifyStatus && String(row.verifyStatus).toUpperCase() === 'VERIFIED';
      const isActive = (row?.status || 'Active').toLowerCase() === 'active';
      return (
        <BOSRowActions
          maxInline={3}
          actions={[
            {
              key: 'toggle-status',
              icon: isActive ? <IconToggleRight size={20} /> : <IconToggleLeft size={20} />,
              label: isActive ? 'Make Inactive' : 'Make Active',
              color: isActive ? 'error' : 'success',
              disabled: !perms.write,
              tooltip: isActive ? 'Active (Click to Inactivate)' : 'Inactive (Click to Activate)',
              disabledTooltip: 'You do not have permission to change status',
              onClick: () => handleToggleStatus(row)
            },
            {
              key: 'amend',
              icon: <IconFileDots />,
              label: 'Amendment',
              color: 'primary',
              disabled: !isVerified || !perms.additional1,
              tooltip: 'Amendment',
              disabledTooltip: !perms.additional1 ? 'You do not have permission for Amendment' : 'Checklist must be verified first',
              onClick: () => handleAmendment(row)
            },
            isVerified && {
              key: 'assign',
              icon: <IconUserPlus />,
              label: 'Assign To',
              color: 'primary',
              disabled: !perms.additional2,
              tooltip: 'Assign To',
              disabledTooltip: 'You do not have permission to Assign',
              onClick: () => handleAssign(row)
            }
          ].filter(Boolean)}
        />
      );
    }
  };

  return (
    <MainCard
      contentSX={{ p: 0 }}

      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconClipboardList size={24} />
          <Box
            component="a"
            href="/master/qms/checklist/master"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline'
              }
            }}
          >
            <Typography variant="h3" component="span">Master Check List</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="qms-master-checklist-table"
          onRefresh={() => fetchChecklists(true)}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Add New Checklist', 'Ctrl + N')}
          hasWritePermission={perms.write}
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onColumnVisibilityChange={setVisibleColumnIds}
          requiredColumnIds={['index', 'seqNo', 'checkingPoint']}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFetchData={fetchAllForExport}
          exportFilename="Master_Check_List"
          hasExportPermission={perms.export}
          ignoreGlobalFilters={true}
          onAmendment={selectedRow ? () => handleAmendment(selectedRow) : () => { }}
          amendmentDisabled={!perms.additional1 || !selectedRow || (selectedRow.verifyStatus && String(selectedRow.verifyStatus).toUpperCase() !== 'VERIFIED')}
          amendmentTooltip={
            !perms.additional1
              ? 'You do not have permission for Amendment'
              : !selectedRow
                ? 'Select a row first'
                : (selectedRow.verifyStatus && String(selectedRow.verifyStatus).toUpperCase() !== 'VERIFIED')
                  ? 'Checklist must be verified before amendment'
                  : `Amendment: ${selectedRow.seqNo || selectedRow.id}`
          }
          onAssign={selectedRow && String(selectedRow.verifyStatus).toUpperCase() === 'VERIFIED' ? () => handleAssign(selectedRow) : undefined}
          assignDisabled={!perms.additional2 || !selectedRow}
          assignTooltip={
            !perms.additional2
              ? 'You do not have permission to Assign'
              : !selectedRow
                ? 'Select a row first'
                : `Assign: ${selectedRow.seqNo || selectedRow.id}`
          }
        />
      }
    >
      <BOSDataTable
        id="qms-master-checklist-table"
        columns={tableColumns}
        rows={resolvedRows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onRefresh={() => fetchChecklists(true)}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onClickRow={(row) => {
          const original = rows.find((r) => r.id === row.id) || row;
          setSelectedRow((prev) => prev?.id === original.id ? null : original);
        }}
        selectedRowId={selectedRow?.id}
        actionColumn={actionColumn}
        disableSearchFilter={true}
        renderCell={(col, row) => {
          if (col.id === 'assignTo') return row.assignTo || '-';
          return null;
        }}
      />

      <AddCheckListDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={selectedRow}
        isAmendment={isAmendment}
      />

      <ChecklistAssignDialog
        open={assignDialogOpen}
        onClose={() => { setAssignDialogOpen(false); fetchChecklists(true); }}
        checklistId={selectedRow?.id}
        initialData={selectedRow}
      />

      <Dialog open={attachmentsDialogOpen} onClose={() => setAttachmentsDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, bgcolor: 'secondary.lighter', borderRadius: 1.5, display: 'flex', color: 'secondary.main' }}>
              <IconPaperclip size={28} />
            </Box>
            <Typography variant="h4" fontWeight={800}>Attachments ({attachmentsList.length})</Typography>
          </Stack>
          <IconButton onClick={() => setAttachmentsDialogOpen(false)} sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: '24px !important' }}>
          <BOSFileGallery files={attachmentsList} isEditing={false} maxHeight={400} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
              p: 1,
              minHeight: '150px',
              maxHeight: '60vh',
              overflowY: 'auto',
              fontFamily: 'inherit',
              '& p': { margin: '0 0 16px 0' },
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
