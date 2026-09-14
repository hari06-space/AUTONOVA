import { useState, useEffect, useCallback } from 'react';
import { openSnackbar } from 'store/slices/snackbar';
import { Typography, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Button, Tooltip } from '@mui/material';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';

import MainCard from 'ui-component/cards/MainCard';
import { useSelector, useDispatch } from 'react-redux';
import { setFilterConfig, setTableConfig, setFilters } from 'store/slices/search';
import useBOSFilters from 'hooks/useBOSFilters';
import ExecutionVerifyDialog from './ExecutionVerifyDialog';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import useAuth from 'hooks/useAuth';

import { IconCheck, IconBan, IconX } from '@tabler/icons-react';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

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

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d;
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [yyyy, mm, dd] = dateVal.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      if (dateVal.includes('T')) {
        const datePart = dateVal.split('T')[0];
        const [yyyy, mm, dd] = datePart.split('-');
        return `${dd}/${mm}/${yyyy}`;
      }
      const cleanVal = dateVal.replace(' ', 'T');
      d = new Date(cleanVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch (e) {
    return '';
  }
};

const formatTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d;
    if (typeof dateVal === 'string') {
      const cleanVal = dateVal.replace(' ', 'T');
      d = new Date(cleanVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d;
    if (typeof dateVal === 'string') {
      const cleanVal = dateVal.replace(' ', 'T');
      d = new Date(cleanVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${date} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '';
  }
};

const StatusChip = BOSStatusChip;

const getFilterConfig = (departments, bosFilters) => [

  {
    id: 'status', label: 'Status', type: 'select', isStarred: true, defaultValue: 'To Be Verified', options: [
      { value: 'All', label: 'All' },
      { value: 'To Be Verified', label: 'To Be Verified' },
      { value: 'Verified', label: 'Verified' },
      { value: 'Rejected', label: 'Rejected' }
    ]
  },
  {
    id: 'category', label: 'Category', type: 'select', isStarred: true, defaultValue: 'All', options: [
      { value: 'All', label: 'All' },
      { value: 'RENEWAL', label: 'RENEWAL' },
      { value: 'CHECK LIST', label: 'CHECK LIST' }
    ]
  },
  { id: 'departments', label: 'Department', type: 'autocomplete', multiple: true, isStarred: true, options: departments.map(d => ({ value: d, label: d })) },
  { id: 'seqNo', label: 'Sequence No', type: 'text', isStarred: false },
  {
    id: 'frequency', label: 'Frequency', type: 'select', isStarred: false, defaultValue: 'All', options: [
      { value: 'All', label: 'All' },
      { value: 'DAILY', label: 'DAILY' },
      { value: 'WEEKLY', label: 'WEEKLY' },
      { value: 'FORTNIGHTLY', label: 'FORTNIGHTLY' },
      { value: 'MONTHLY', label: 'MONTHLY' },
      { value: 'QUARTERLY', label: 'QUARTERLY' },
      { value: 'HALF YEARLY', label: 'HALF YEARLY' },
      { value: 'YEARLY', label: 'YEARLY' }
    ]
  },
  {
    id: 'stockLink', label: 'Stock Link', type: 'select', isStarred: false, defaultValue: 'All', options: [
      { value: 'All', label: 'All' },
      { value: 'YES', label: 'YES' },
      { value: 'NO', label: 'NO' }
    ]
  },
  { id: 'createdDate', label: 'Considered Date', type: 'dateRange', isStarred: true }
];

export default function CheckListVerify() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const activeRow = rows.find((r) => r.id === selectedRowId) || null;
  const searchQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST_VERIFY);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [descriptionViewOpen, setDescriptionViewOpen] = useState(false);
  const [descriptionViewTitle, setDescriptionViewTitle] = useState('');
  const [descriptionViewContent, setDescriptionViewContent] = useState('');

  // Keyboard shortcut listener: Enter on row opens dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
      if (e.key === 'Enter') {
        if (!dialogOpen && selectedRowId && !isInput) {
          e.preventDefault();
          setDialogOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, selectedRowId]);

  const tableCols = [
    { id: 'index', label: 'No', minWidth: 55 },
    { id: 'seqNo', label: 'Seq No', minWidth: 90, bold: true, render: (row) => row.seqNo || '-' },
    {
      id: 'checkingPoint', label: 'Checking Point', minWidth: 200,
      exportValue: (row) => row.checkingPoint || '-',
      render: (row) => row.checkingPoint ? (
        <Box
          component="span"
          onClick={(e) => { e.stopPropagation(); setSelectedRowId(row.id); setDialogOpen(true); }}
          sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.dark' } }}
        >
          {row.checkingPoint}
        </Box>
      ) : '-'
    },
    {
      id: 'description', label: 'Descriptions/SOP', minWidth: 200,
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
    },
    { id: 'category', label: 'Category', minWidth: 120, render: (row) => row.category || '-' },
    { id: 'frequency', label: 'Frequency', minWidth: 120, render: (row) => row.frequency || '-' },
    {
      id: 'department', label: 'Department', minWidth: 160,
      exportValue: (row) => {
        const depts = (row.departments || []).map(d => d.departmentName).filter(Boolean).join(', ');
        return depts || '-';
      },
      render: (row) => {
        const depts = (row.departments || []).map(d => d.departmentName).filter(Boolean).join(', ');
        return depts || '-';
      }
    },
    { id: 'effectiveFrom', label: 'Effective From', minWidth: 120, render: (row) => formatDate(row.effectiveFrom) },
    { id: 'days', label: 'Days', minWidth: 80, render: (row) => row.reminderDays || '-' },
    {
      id: 'expiryDate', label: 'Expire Date', minWidth: 120, render: (row) => {
        const val = formatDate(row.expiryDate);
        if (!row.expiryDate || val === '-') return '-';
        const exp = new Date(row.expiryDate);
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
    { id: 'stockLink', label: 'Stock Link', minWidth: 100, render: (row) => row.stockLink || '-' },
    { id: 'createdUser', label: 'Created By', minWidth: 120, render: (row) => row.createdUser || row.createdBy || '-' },
    { id: 'createdDate', label: 'Created Date & Time', minWidth: 160, render: (row) => formatDateTime(row.createdAt || row.createdDate) },
    {
      id: 'updatedUser', label: 'Updated By', minWidth: 120, render: (row) => {
        if (!row.updatedAt || !row.createdAt) return '-';
        const msDiff = Math.abs(new Date(row.updatedAt) - new Date(row.createdAt));
        if (msDiff <= 60000) return '-';
        let upUser = row.updatedUser || row.updatedBy || '-';
        if (upUser === 'Admin istrator' || upUser === 'Administrator') upUser = 'Admin';
        if (String(upUser).toLowerCase().includes('system')) return '-';
        return upUser;
      }
    },
    {
      id: 'updatedDate', label: 'Update Date & Time', minWidth: 160, render: (row) => {
        if (!row.updatedAt || !row.createdAt) return '-';
        const msDiff = Math.abs(new Date(row.updatedAt) - new Date(row.createdAt));
        if (msDiff <= 60000) return '-';
        return formatDateTime(row.updatedAt || row.updatedDate);
      }
    },
    { id: 'verifyStatus', label: 'Verify Status', minWidth: 160, render: (row) => <StatusChip status={row.verifyStatus} /> },
    {
      id: 'verifiedBy', label: 'Verified By', minWidth: 120, render: (row) => {
        const v = row.verifiedBy;
        if (!v) return '-';
        if (v === 'Admin istrator' || v === 'Administrator' || v === 'admin') return 'Admin';
        if (v === 'SUPER BOSS' || v === 'superboss') return 'Super Boss';
        return v;
      }
    },
    { id: 'verifiedDate', label: 'Verified Date & Time', minWidth: 160, render: (row) => formatDateTime(row.verifiedDate) }
  ];

  useEffect(() => {
    axios.get('/api/master/hr/departments')
      .then(res => {
        const list = (res.data || [])
          .filter(d => d.status?.toLowerCase() === 'active' || d.status === null)
          .map(d => d.departmentName);
        setDepartmentsList(list);
      })
      .catch(err => {
        console.error("Failed to load departments from master", err);
      });
  }, []);

  const bosFilters = useBOSFilters(perms);
  const isSuperBoss = user?.userId?.toUpperCase() === 'SUPER BOSS' || user?.id?.toUpperCase() === 'SUPER BOSS' || user?.userName?.toUpperCase() === 'SUPER BOSS';
  const isAdmin = user?.userId?.toUpperCase() === 'ADMIN' || user?.id?.toUpperCase() === 'ADMIN';
  const userDept = user?.departmentName;

  // Initialize default filters on mount, clean up on unmount
  useEffect(() => {
    const defaultDepts = [];
    const urlParams = new URLSearchParams(window.location.search);
    const urlStatus = urlParams.get('status');
    dispatch(setFilters({ status: urlStatus || 'To Be Verified', category: 'All', taskType: 'All', departments: defaultDepts, ...globalFilters }));
    return () => {};
  }, [dispatch]);

  // Configure global search bar filters on mount
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const finalDepts = (!isSuperBoss && !isAdmin && userDept) ? [userDept] : departmentsList;
    dispatch(setFilterConfig({ config: getFilterConfig(finalDepts, bosFilters), path: '/qms/checklist/verify' }));
    dispatch(setTableConfig(tableCols));
    return () => {
      dispatch(setFilterConfig({ config: null, path: '/qms/checklist/verify' }));
      dispatch(setTableConfig(null));
    };
  }, [dispatch, departmentsList, perms.loading, bosFilters.myTeamLoaded, isSuperBoss, isAdmin, userDept]);

  const fetchChecklists = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const status = globalFilters.status || 'To Be Verified';
      const category = globalFilters.category || 'All';
      const depts = globalFilters.departments || [];
      const considerDate = globalFilters.createdDateConsider !== undefined ? globalFilters.createdDateConsider : (globalFilters.considerDate !== undefined ? globalFilters.considerDate : 'Yes');

      const params = {
        page,
        size,
        verifyStatus: status !== 'All' ? status : undefined,
        category: category !== 'All' ? category : undefined,
        department: depts.length > 0 ? depts[0] : undefined,
        searchValue: searchQuery || undefined,
        fromDate: globalFilters.createdDateStart || globalFilters.fromDate || undefined,
        toDate: globalFilters.createdDateEnd || globalFilters.toDate || undefined,
        considerDate: considerDate !== 'All' ? considerDate : undefined,
        considerDateValue: (String(considerDate).trim().toUpperCase() === 'YES' && (globalFilters.createdDateConsiderValue || globalFilters.considerDateValue)) ? (globalFilters.createdDateConsiderValue || globalFilters.considerDateValue) : undefined,
        seqNo: globalFilters.seqNo || undefined,
        frequency: (globalFilters.frequency && globalFilters.frequency !== 'All') ? globalFilters.frequency : undefined,
        stockLink: (globalFilters.stockLink && globalFilters.stockLink !== 'All') ? globalFilters.stockLink : undefined,
        checkingPoint: globalFilters.checkingPoint || undefined,
        description: globalFilters.description || undefined,
        dualCheck: (globalFilters.dualCheck && globalFilters.dualCheck !== 'All') ? globalFilters.dualCheck : undefined,
        photoRequired: (globalFilters.photoRequired && globalFilters.photoRequired !== 'All') ? globalFilters.photoRequired : undefined,
        carryForward: (globalFilters.carryForward && globalFilters.carryForward !== 'All') ? globalFilters.carryForward : undefined,
        status: (globalFilters.recordStatus && globalFilters.recordStatus !== 'All') ? globalFilters.recordStatus : 'Active',
        taskType: globalFilters.taskType || 'All',
        currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.name || undefined,
        assignedTo: (globalFilters.memberId && globalFilters.memberId !== 'All') ? globalFilters.memberId : (globalFilters.assignedTo || undefined)
      };

      // Validation: If Consider Date is Yes and outside From/To range, return no records
      const checkConsiderVal = globalFilters.createdDateConsiderValue || globalFilters.considerDateValue;
      if (String(considerDate).trim().toUpperCase() === 'YES' && checkConsiderVal) {
        const considerVal = new Date(checkConsiderVal);
        const fromVal = params.fromDate ? new Date(params.fromDate) : null;
        const toVal = params.toDate ? new Date(params.toDate) : null;
        let isInvalid = false;
        if (fromVal && considerVal < fromVal) isInvalid = true;
        if (toVal && considerVal > toVal) isInvalid = true;
        if (isInvalid) {
          setRows([]);
          setTotalElements(0);
          setLoading(false);
          return;
        }
      }

      const response = await axios.get('/api/qms/checklist', { params });
      const rawRows = response.data.content || [];
      const uniqueRows = [];
      const seenKeys = new Set();
      for (const r of rawRows) {
        const key = r.id ? String(r.id) : `${r.seqNo}_${r.checkingPoint}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueRows.push(r);
        }
      }
      setRows(uniqueRows);
      setTotalElements(uniqueRows.length);
    } catch (error) {
      console.error('Failed to fetch checklists for verification:', error);
    } finally {
      setLoading(false);
    }
  }, [page, size, globalFilters, searchQuery, user]);

  useEffect(() => {
    if (globalFilters.status === undefined) return;
    fetchChecklists();
  }, [fetchChecklists, globalFilters.status]);

  useRealtimeRefresh((force, detail, isSilent) => fetchChecklists(true, detail, true));

  const handleVerify = async (status, remarks = '') => {
    if (selectedRowId === null || selectedRowId === undefined) return;
    setVerifyLoading(true);
    try {
      await axios.post('/api/qms/checklist/verify-master', {
        checklistId: selectedRowId,
        status: status,
        verifiedBy: user?.employeeName || user?.userName || user?.name || user?.id || 'Admin',
        remarks: remarks || (status === 'Rejected' ? 'Rejected by verifier' : 'Verified')
      });
      dispatch(openSnackbar({
        open: true,
        message: status === 'Rejected' ? 'Checklist rejected successfully.' : 'Checklist verified successfully!',
        variant: 'alert',
        alert: { color: status === 'Rejected' ? 'error' : 'success' },
        close: true
      }));
      fetchChecklists();
      setDialogOpen(false);
    } catch (error) {
      console.error('Verification failed:', error);
      dispatch(openSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Verification failed. Please try again.',
        variant: 'alert',
        alert: { color: 'error' },
        close: true
      }));
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <MainCard
      fullWidth
      title="Check List Verify"
      secondary={
        <BOSTableToolbar
          id="qms-checklist-verify-table"
          onRefresh={fetchChecklists}
          hasWritePermission={perms.write}
          columns={tableCols}
          exportData={rows}
          exportFilename="Checklist_Verify"
          hasExportPermission={perms.export}
          ignoreGlobalFilters={true}
        />
      }
    >
      <BOSDataTable
        id="qms-checklist-verify-table"
        columns={tableCols}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalElements}
        loading={loading}
        onRefresh={fetchChecklists}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.approval || perms.write ? (row) => { setSelectedRowId(row.id); setDialogOpen(true); } : null}
        onClickRow={(row) => setSelectedRowId(row.id)}
        selectedRowId={selectedRowId}
        disableSearchFilter={true}
      />

      <ExecutionVerifyDialog
        open={dialogOpen}
        handleClose={() => setDialogOpen(false)}
        data={activeRow}
        onVerify={(remarks) => handleVerify('Verified', remarks)}
        onReject={(remarks) => handleVerify('Rejected', remarks)}
        isExecution={false}
        verifyLoading={verifyLoading}
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
