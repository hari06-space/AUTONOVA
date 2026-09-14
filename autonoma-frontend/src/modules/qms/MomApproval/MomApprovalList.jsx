import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Stack, Tooltip, Chip, Box } from '@mui/material';
import { IconShieldCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';
import useConfig from 'hooks/useConfig';
import { formatDate, formatTime, formatDateTime } from 'utils/BOSTimeUtils';
import MomApprovalDialog from './MomApprovalDialog';
import { isMobile } from 'react-device-detect';

// ── Parse rejection history from cancelRemarks (JSON array or legacy string) ──
const parseRejectionHistory = (cancelRemarks, row = null) => {
  if (!cancelRemarks || !String(cancelRemarks).trim()) return [];

  const formatHelper = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours() % 12;
    if (hours === 0) hours = 12;
    const hoursStr = String(hours).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${mins}`;
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal || dateVal === '-') return '-';
    let norm = String(dateVal).trim().replace(' ', 'T');
    norm = norm.replace(/(T\d{2}:\d{2}:\d{2})(\.\d{1,3})\d*/, '$1$2');
    const d = new Date(norm);
    return isNaN(d.getTime()) ? '-' : formatHelper(d);
  };

  try {
    const parsed = JSON.parse(cancelRemarks);
    const rawList = Array.isArray(parsed) ? parsed : [parsed];
    const byRevNo = new Map();
    for (const entry of rawList) {
      const rev = Number(entry.revNo);
      if (!rev || rev <= 0) continue;
      if (!entry.remarks || !String(entry.remarks).trim()) continue;
      const existing = byRevNo.get(rev);
      const isBetter = !existing ||
        (entry.rejectedByName && !existing.rejectedByName) ||
        (entry.rejectedAt && !existing.rejectedAt);
      if (isBetter) byRevNo.set(rev, entry);
    }
    return Array.from(byRevNo.values())
      .sort((a, b) => Number(a.revNo) - Number(b.revNo))
      .map(e => ({ ...e, rejectedAt: formatDateStr(e.rejectedAt) }));
  } catch {
    const text = String(cancelRemarks || '').trim();
    if (!text || !row?.revNo || Number(row.revNo) <= 0) return [];
    const rejectedBy = row?.assignedBy?.employeeName || row?.assignedBy || '-';
    let rejectedAt = '-';
    const rawDate = row?._updatedAt || row?.updatedAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) rejectedAt = formatHelper(d);
    }
    return [{ revNo: Number(row.revNo) || 1, remarks: text, rejectedBy, rejectedByName: rejectedBy, rejectedAt }];
  }
};

// ── Was this record EVER rejected? ─────────────────────────────────────────
const wasEverRejected = (row) => {
  if (row.status?.toUpperCase() === 'REJECTED') return true;
  if (row.revNo > 0) return true;
  return parseRejectionHistory(row.cancelRemarks, row).length > 0;
};

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: '_momNo', label: 'Meeting No', minWidth: 150, bold: true },
  { id: 'discussedPoint', label: 'Discussed Point', minWidth: 300 },
  { id: 'actionTaken', label: 'Action Taken', minWidth: 200 },
  { id: 'actionObservation', label: 'Action Observation', minWidth: 200 },
  { id: 'targetDate', label: 'Target Date', minWidth: 120 },
  { id: 'assignedTo', label: 'Assigned To', minWidth: 130 },
  { id: 'assignedBy', label: 'Assigned By', minWidth: 130 },
  { id: 'createdUser', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 140 },
  { id: 'updatedUser', label: 'UPDATED BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 140 },
  { id: 'status', label: 'Status', minWidth: 180 }
];

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim();
};

const formatDateDisplay = (dateVal, withTime = false, timeFormat = 'H12', dateFormat = 'DD/MM/YYYY') => {
  if (!dateVal) return '-';
  let d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.split('T')[0].split('-');
      if (parts.length === 3) {
        d = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
  }
  if (isNaN(d.getTime())) return '-';
  
  const dateStr = formatDate(d, dateFormat);

  if (!withTime) return dateStr;

  const timeStr = formatDateTime(d, timeFormat, dateFormat, { includeDate: false, includeTime: true });

  return (
    <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', textAlign: 'center' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {dateStr}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {timeStr}
      </Typography>
    </Stack>
  );
};

export default function MomApprovalList() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_MOM_APPROVAL);
  const { user } = useAuth();
  const { timeFormat, dateFormat } = useConfig();
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── GLOBAL FILTER CONFIG ──────────────────────────────────────────────────
  useEffect(() => {
    if (perms.loading) return;
    dispatch(setFilterConfig([
      {
        id: 'type', label: 'Scope', type: 'select', isStarred: true,
        options: [
          { value: 'Mine', label: 'Mine' },
          { value: 'Team', label: 'Team' },
          { value: 'Company', label: 'Company' }
        ],
        defaultValue: 'Mine'
      },
      {
        id: 'status', label: 'Verify Status', type: 'select', isStarred: true,
        options: [
          { value: 'Pending for Verified', label: 'PENDING FOR VERIFY' },
          { value: 'Accepted', label: 'VERIFIED' },
          { value: 'Rejected', label: 'REJECTED' },
          { value: 'All', label: 'ALL' }
        ],
        defaultValue: 'Pending for Verified'
      },
      {
        id: 'searchBy', label: 'Search By', type: 'select',
        options: [
          { value: 'discussedPoint', label: 'Discussed Point' }
        ],
        defaultValue: 'discussedPoint'
      },
      { id: 'searchText', label: 'Search', type: 'text', placeholder: 'Search...' },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ]));
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
      const urlParams = new URLSearchParams(window.location.search);
      const activeDashboardFilter = urlParams.get('dashboardFilter') || dashboardFilter || '';
      const urlScope = urlParams.get('taskScope') || urlParams.get('taskType') || urlParams.get('scope') || '';

      const statusVal = Array.isArray(globalFilters.status)
        ? globalFilters.status.join(',')
        : (globalFilters.status || (activeDashboardFilter === 'closed' ? 'Accepted,Verified' : 'Pending for Verified'));

      const params = {
        page,
        size,
        scope: globalFilters.type || globalFilters.taskScope || globalFilters.taskType || urlScope || 'Mine',
        memberId: globalFilters.memberId || '',
        status: statusVal,
        searchBy: globalFilters.searchBy || 'discussedPoint',
        searchText: globalFilters.searchText || globalQuery || '',
        startDate: globalFilters.meetingDateStart || globalFilters.createdAtStart || globalFilters.fromDate || '',
        endDate: globalFilters.meetingDateEnd || globalFilters.createdAtEnd || globalFilters.toDate || '',
        considerDate: globalFilters.considerDate || '',
        dashboardFilter: activeDashboardFilter,
        currentUser: (typeof globalFilters !== 'undefined' ? globalFilters?.currentUser : null) || user?.userId || user?.id || user?.userName || '',
        pageCode: 'QM1350'
      };

      const response = await axios.get(API_PATHS.QMS.MOM_ACTIONS_PAGED, { params });
      const data = response.data;
      const content = Array.isArray(data.content) ? data.content : [];
      setTotalCount(data.totalElements || 0);

      // Map statuses for display
      const flat = content.map(row => {
        const rawStatus = (row.status || '').toLowerCase().replace(/_/g, ' ').trim();
        let disp;
        if (rawStatus === 'pending for approval' || rawStatus === 'pending for verified' || rawStatus === 'pending for verify' || rawStatus === 'pending_for_verify' || rawStatus === 'pending_for_verified') {
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
      console.error('Failed to fetch MOM Verify actions:', error);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, globalFilters, globalQuery, dashboardFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenVerify = useCallback((item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  }, []);

  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    const viewId = searchParams.get('viewId');
    if (viewId && rows.length > 0 && !hasAutoOpened) {
      const item = rows.find(r => String(r.id) === String(viewId));
      if (item) {
        handleOpenVerify(item);
        setHasAutoOpened(true);
      }
    }
  }, [rows, searchParams, hasAutoOpened, handleOpenVerify]);

  // ── KEYBOARD SHORTCUTS (Issue 23) ──────────────────────────────────────────
  useKeyboardShortcuts({
    'alt+v': () => { if (rows.length > 0 && !dialogOpen) handleOpenVerify(rows[0]); },
    'escape': () => { if (dialogOpen) setDialogOpen(false); }
  });

  // ── RENDER CELL ───────────────────────────────────────────────────────────
  const renderCell = (col, row, idx) => {
    let val;
    if (col.id === 'index') val = (page * size) + rows.indexOf(row) + 1;
    else if (col.id === '_momNo') val = row.minNo || row.meetNo || row.momNo || '-';
    else if (col.id === 'discussedPoint') val = stripHtml(row.discussedPoint) || '-';
    else if (col.id === 'actionTaken') val = stripHtml(row.actionTaken) || '-';
    else if (col.id === 'actionObservation') val = stripHtml(row.actionObservation) || '-';
    else if (col.id === 'targetDate') val = formatDateDisplay(row.targetDate, false, timeFormat, dateFormat);
    else if (col.id === 'assignedTo') val = typeof row.assignedTo === 'string' ? (row.assignedTo || '-') : (row.assignedTo?.employeeName || '-');
    else if (col.id === 'assignedBy') val = typeof row.assignedBy === 'string' ? (row.assignedBy || '-') : (row.assignedBy?.employeeName || '-');
    else if (col.id === 'createdUser') val = row.createdUser || '-';
    else if (col.id === 'createdAt') val = formatDateDisplay(row._createdAt, true, timeFormat, dateFormat);
    else if (col.id === 'updatedUser') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      val = isUpdated ? (row.updatedUser || '-') : '-';
    }
    else if (col.id === 'updatedAt') {
      const isUpdated = row.updatedAt && row.createdAt && (new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 1000);
      val = isUpdated ? formatDateDisplay(row._updatedAt, true, timeFormat, dateFormat) : '-';
    }
    else if (col.id === 'status') {
      const displaySt = row.displayStatus || 'PENDING FOR VERIFY';
      const rejCount = Number(row.rejectedCount) || parseRejectionHistory(row.cancelRemarks, row).length;
      const isApprovedAfterRejection = displaySt === 'VERIFIED' && wasEverRejected(row);

      val = (
        <Stack direction="row" spacing={0.8} alignItems="center">
          <BOSStatusChip status={displaySt} showIcon={true} width={140} />
          {isApprovedAfterRejection && (
            <Chip
              label={`⚠ R-${rejCount}`}
              size="small"
              title={`This record was rejected ${rejCount} time(s) before being approved`}
              sx={{
                bgcolor: '#e65100', color: 'white', fontWeight: 700,
                fontSize: '0.6rem', height: 16, borderRadius: '3px',
                '& .MuiChip-label': { px: 0.6 }
              }}
            />
          )}
        </Stack>
      );
    } else {
      val = row[col.id] || '-';
    }

    if (col.id === 'discussedPoint') {
      return (
        <Tooltip title={stripHtml(row.discussedPoint) || '-'} placement="top" enterDelay={200}>
          <div style={{
            width: '100%',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}>
            {val}
          </div>
        </Tooltip>
      );
    }
    return (
      <div style={{ width: '100%' }}>
        {val}
      </div>
    );
  };

  return (
    <MainCard
      fullWidth
      icon={IconShieldCheck}
      title={"MOM Verify"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={rows}
          exportFilename="MOM_Verify"
          hasExportPermission={perms.export}
          columns={columns}
        />
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
        onDoubleClickRow={handleOpenVerify}
        renderCell={renderCell}
        showActions={true}
        id="mom-verify-table"
        dense={true}
      />

      <MomApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={selectedItem}
        onAction={() => { setDialogOpen(false); fetchData(); }}
      />
    </MainCard>
  );
}
