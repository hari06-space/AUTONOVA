import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Stack, Tooltip, Box } from '@mui/material';
import { IconCircleCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import useLookups from 'hooks/useLookups';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import CloseMomDialog from './CloseMomDialog';
import { isMobile } from 'react-device-detect';

import { formatDate, formatDateTime } from 'utils/BOSTimeUtils';

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
};

const renderFormattedDateTime = (dateVal) => {
  if (!dateVal || dateVal === '-') return '-';
  const formatted = formatDateTime(dateVal);
  if (!formatted || formatted === '-') return '-';
  const parts = formatted.split(' ');
  const dateStr = parts[0] || formatted;
  const timeStr = parts.slice(1).join(' ') || '';
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', textAlign: 'center' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {dateStr}
      </Typography>
      {timeStr && (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {timeStr}
        </Typography>
      )}
    </Stack>
  );
};

const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'momNo', label: 'Meeting No', minWidth: 150, align: 'center' },
  { id: 'momDate', label: 'MOM Date', minWidth: 120, align: 'center' },
  { id: 'scheduleNo', label: 'Meeting Sch No', minWidth: 180, align: 'center' },
  { id: 'discussedPoint', label: 'Discussed Point', minWidth: 300 },
  { id: 'pointType', label: 'Type', minWidth: 80, align: 'center' },
  { id: 'materialList', label: 'Material List', minWidth: 120 },
  { id: 'processType', label: 'Process', minWidth: 100, align: 'center' },
  { id: 'targetDate', label: 'Target Date', minWidth: 120, align: 'center' },
  { id: 'assignedTo', label: 'Assigned To', minWidth: 130, align: 'center' },
  { id: 'assignedBy', label: 'Assigned By', minWidth: 130, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 140, align: 'center' },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 120, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 140, align: 'center' },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 140, align: 'center' },
  { id: 'attachmentRequired', label: 'Attachment Req', minWidth: 110, align: 'center' }
];

export default function CloseMomList() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_CLOSE_MOM);
  const bosFilters = useBOSFilters(perms);
  const globalMaxResult = useSelector((state) => state.search?.maxResult);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(() => {
    const stored = globalMaxResult || sessionStorage.getItem('maxResult') || localStorage.getItem('defaultMaxRecords');
    return stored ? parseInt(stored, 10) : 50;
  });

  useEffect(() => {
    if (globalMaxResult) {
      const parsed = parseInt(globalMaxResult, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSize(parsed);
      }
    }
  }, [globalMaxResult]);

  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── GLOBAL FILTER CONFIG ──
  useEffect(() => {
    if (perms.loading) return;
    dispatch(setFilterConfig([{
      id: 'type', label: 'Scope', type: 'select', isStarred: true,
      options: [
        { value: 'Mine', label: 'Mine' },
        { value: 'Team', label: 'Team' },
        { value: 'Company', label: 'Company' }
      ],
      defaultValue: 'Mine'
    },
    {
      id: 'status', label: 'Status', type: 'autocomplete', multiple: true, isStarred: true,
      options: [
        { value: 'OPEN', label: 'OPEN' },
        { value: 'UNRESOLVED', label: 'UNRESOLVED' },
        { value: 'Pending for Verified', label: 'PENDING FOR VERIFY' },
        { value: 'Verified', label: 'VERIFIED' },
        { value: 'Rejected', label: 'REJECTED' }
      ],
      defaultValue: ['OPEN', 'UNRESOLVED']
    },
    {
      id: 'searchBy', label: 'Search By', type: 'select',
      options: [
        { value: 'discussedPoint', label: 'Discussed Point' }
      ],
      defaultValue: 'discussedPoint'
    },
    { id: 'searchText', label: 'Search', type: 'text', placeholder: 'Search...' },
    ...getCommonDateFilters('createdAt', 'updatedAt')]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, perms.additional1]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [globalFilters, globalQuery, dashboardFilter]);

  // ── FETCH — Server-Side Paginated ACTION items ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let statusVal = '';
      if (globalFilters.status !== undefined && globalFilters.status !== null) {
        statusVal = Array.isArray(globalFilters.status)
          ? globalFilters.status.join(',')
          : (globalFilters.status || '');
      } else {
        statusVal = 'OPEN,UNRESOLVED';
      }

      const urlParams = new URLSearchParams(window.location.search);
      const activeDashboardFilter = urlParams.get('dashboardFilter') || '';

      const params = {
        page,
        size,
        scope: globalFilters.type || 'Mine',
        memberId: globalFilters.memberId || '',
        status: statusVal,
        searchBy: globalFilters.searchBy || 'discussedPoint',
        searchText: globalFilters.searchText || globalQuery || '',
        startDate: globalFilters.meetingDateStart || globalFilters.createdAtStart || globalFilters.fromDate || '',
        endDate: globalFilters.meetingDateEnd || globalFilters.createdAtEnd || globalFilters.toDate || '',
        considerDate: globalFilters.considerDate || '',
        dashboardFilter: activeDashboardFilter,
        currentUser: urlParams.get('currentUser') || '',
        pageCode: 'QM1340'
      };

      const response = await axios.get(API_PATHS.QMS.MOM_ACTIONS_PAGED, { params });
      const data = response.data;
      const content = Array.isArray(data.content) ? data.content : [];
      setTotalCount(data.totalElements || 0);

      const momTrackers = {};
      const flat = content.map((row) => {
        const rawStatus = (row.status || '').toLowerCase().replace(/_/g, ' ').trim();
        let disp;
        if (rawStatus === 'pending for verified' || rawStatus === 'pending for verify' || rawStatus === 'pending_for_verify' || rawStatus === 'pending_for_verified') {
          disp = 'PENDING FOR VERIFY';
        } else if (rawStatus === 'accepted' || rawStatus === 'verified' || rawStatus === 'approved') {
          disp = 'VERIFIED';
        } else if (rawStatus === 'rejected') {
          disp = 'REJECTED';
        } else if (rawStatus === 'open' || rawStatus === '' || rawStatus === 'created') {
          disp = 'OPEN';
        } else if (rawStatus === 'unresolved') {
          disp = 'UNRESOLVED';
        } else if (rawStatus === 'closed') {
          disp = 'CLOSED';
        } else {
          disp = (row.status || 'OPEN').toUpperCase();
        }

        const parentMomNo = row.momNo || '';
        let detailMeetNo = row.minNo || row.meetNo || parentMomNo || '-';

        return {
          ...row,
          displayStatus: disp,
          _momId: row.momId,
          _rawStatus: row.status,
          _momNo: detailMeetNo,
          _parentMomNo: parentMomNo,
          _momDate: row.momDate,
          _scheduleNo: row.scheduleNo,
          _createdAt: row.createdAt,
          _updatedAt: row.updatedAt || row.createdAt,
          createdUser: row.createdBy || '-',
          updatedUser: row.updatedBy || '-'
        };
      });

      setRows(flat);
    } catch (error) {
      console.error('Failed to fetch Close MOM actions:', error);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, globalFilters, globalQuery, dashboardFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenClose = useCallback((item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  }, []);

  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    const viewId = searchParams.get('viewId');
    if (viewId && rows.length > 0 && !hasAutoOpened) {
      const item = rows.find(r => String(r.id) === String(viewId));
      if (item) {
        handleOpenClose(item);
        setHasAutoOpened(true);
      }
    }
  }, [rows, searchParams, hasAutoOpened, handleOpenClose]);

  // ── KEYBOARD SHORTCUTS (Issue 23) ──────────────────────────────────────────
  useKeyboardShortcuts({
    'alt+c': () => { if (rows.length > 0 && !dialogOpen) handleOpenClose(rows[0]); },
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  const renderCell = (col, row, idx) => {
    let val = '-';
    if (!col || !row) return '-';
    const rowIndex = idx !== undefined && idx !== null ? idx : rows.indexOf(row);
    if (col.id === 'index') val = (page * size) + rowIndex + 1;
    else if (col.id === 'momNo') val = row.minNo || row.meetNo || row.momNo || '-';
    else if (col.id === 'momDate') val = formatDate(row.momDate || row._momDate);
    else if (col.id === 'scheduleNo') val = row.scheduleNo || row._scheduleNo || '-';
    else if (col.id === 'discussedPoint') val = stripHtml(row.discussedPoint) || '-';
    else if (col.id === 'pointType') val = row.pointType || '-';
    else if (col.id === 'materialList') val = row.materialList || '-';
    else if (col.id === 'processType') val = row.processType || '-';
    else if (col.id === 'assignedTo') val = typeof row.assignedTo === 'string' ? (row.assignedTo || '-') : (row.assignedTo?.employeeName || '-');
    else if (col.id === 'assignedBy') val = typeof row.assignedBy === 'string' ? (row.assignedBy || '-') : (row.assignedBy?.employeeName || '-');
    else if (col.id === 'targetDate') val = formatDate(row.targetDate);
    else if (col.id === 'createdUser') val = row.createdUser || row.createdBy || '-';
    else if (col.id === 'updatedUser') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      val = isUpdated ? (row.updatedUser || row.updatedBy || '-') : '-';
    }
    else if (col.id === 'createdAt') {
      val = renderFormattedDateTime(row.createdAt || row._createdAt);
    }
    else if (col.id === 'updatedAt') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      val = isUpdated ? renderFormattedDateTime(row.updatedAt || row._updatedAt) : '-';
    }
    else if (col.id === 'status') {
      const s = row.displayStatus || row.status || 'OPEN';
      val = <BOSStatusChip status={s} showIcon={true} width={150} />;
    }
    else if (col.id === 'attachmentRequired') {
      val = (row.attachmentRequired === 'YES' || row.attachmentRequired === true || row.isAttachmentRequired) ? 'YES' : 'NO';
    }
    else {
      val = row[col.id] !== undefined && row[col.id] !== null && row[col.id] !== '' ? row[col.id] : '-';
    }
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
        {val}
      </div>
    );
  };

  return (
    <MainCard fullWidth
      icon={IconCircleCheck}
      title={"Close MOM"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={rows}
          exportFilename="Close_MOM"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={rows}
        page={page}
        size={size}
        totalCount={totalCount}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenClose}
        onEditRow={handleOpenClose}
        renderCell={renderCell}
        showActions={true}
        id="close-mom-table"
      />

      <CloseMomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={selectedItem}
        onSave={() => fetchData()}
      />
    </MainCard>
  );
}
