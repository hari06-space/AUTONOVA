import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Typography, Stack, Box, Button, Tooltip, IconButton 
} from '@mui/material';
import { 
  IconListCheck, IconRefresh, IconSettings, IconDeviceFloppy, IconCheck
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSStatusChip, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import MomActionClosureDialog from './MomActionClosureDialog';



const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'momDate', label: 'MOM Date', minWidth: 100 },
  { id: 'scheduleNo', label: 'Meeting Sch No', minWidth: 150 },
  { id: 'discussedPoint', label: 'Discussed Point', minWidth: 300, wrap: true },
  { id: 'pointType', label: 'Type', minWidth: 80 },
  { id: 'materialList', label: 'Material List', minWidth: 150 },
  { id: 'processType', label: 'Process', minWidth: 100 },
  { id: 'targetDate', label: 'Target Date', minWidth: 110 },
  { id: 'assignedBy', label: 'Assigned By', minWidth: 130 },
  { id: 'assignedTo', label: 'Assigned To', minWidth: 130 },
  { id: 'status', label: 'Status', minWidth: 140, align: 'center' },
  { id: 'createdAt', label: 'Created Date', minWidth: 140 },
  { id: 'attachmentRequired', label: 'Attachment Req', minWidth: 120, align: 'center' }
];

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateStr = `${day}/${month}/${year}`;
  let hours = d.getHours() % 12;
  if (hours === 0) hours = 12;
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hoursStr}:${minutesStr}`;
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

export default function MomActionReviewList() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_CLOSE_MOM);
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    dispatch(setFilterConfig([{
        id: 'type', label: 'Scope', type: 'select', isStarred: true,
        options: bosFilters.getFilterOptions(),
        defaultValue: 'Mine'
      },
      {
        id: 'dateType', label: 'Date Type', type: 'select', isStarred: true,
        options: [
          { value: 'targetDate', label: 'Target Date' },
          { value: 'createdAt', label: 'Create Date' },
          { value: 'momDate', label: 'MOM Date' }
        ],
        defaultValue: 'targetDate'
      },
      { id: 'fromDate', label: 'From Date', type: 'date', isStarred: true },
      { id: 'toDate', label: 'To Date', type: 'date', isStarred: true },
      {
        id: 'status', label: 'Status Filter', type: 'select', isStarred: true,
        options: [
          { value: 'PENDING', label: 'Pending' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'All', label: 'All' }
        ],
        defaultValue: 'PENDING'
      },
      {
        id: 'searchBy', label: 'Search By', type: 'select', isStarred: true,
        options: [
          { value: 'momNo', label: 'MOM Number' },
          { value: 'scheduleNo', label: 'Schedule Number' },
          { value: 'assignedTo', label: 'Assigned Employee' }
        ],
        defaultValue: 'momNo'
      },
      { id: 'searchText', label: 'Search Here', type: 'text', placeholder: 'Min 3 chars...', isStarred: true },
      ...getCommonDateFilters('createdAt', 'updatedAt')]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_PATHS.QMS.MOMS}/actions`);
      let data = Array.isArray(response.data) ? response.data : [];
      data.sort((a, b) => b.id - a.id);
      
      const today = new Date().toISOString().split('T')[0];
      data = data.map(row => {
        const rawStatusNorm = (row.status || '').toLowerCase().replace(/_/g, ' ').trim();
        // Overdue: past target date and not yet closed/accepted/pending for verified
        const isTerminal = ['pending for verified', 'accepted', 'closed'].includes(rawStatusNorm);
        if (row.targetDate && row.targetDate < today && !isTerminal) {
          return { ...row, displayStatus: 'OVERDUE' };
        }
        // Map to display labels
        let disp;
        if (rawStatusNorm === 'pending for verified') disp = 'PENDING FOR VERIFIED';
        else if (rawStatusNorm === 'accepted') disp = 'ACCEPTED';
        else if (rawStatusNorm === 'rejected') disp = 'REJECTED';
        else if (rawStatusNorm === 'closed') disp = 'CLOSED';
        else disp = (row.status || 'OPEN').toUpperCase();
        return { ...row, displayStatus: disp };
      });
      
      setRows(data);
    } catch (error) {
      console.error('Failed to fetch MOM actions:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load MOM actions', variant: 'alert', severity: 'error' }));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // Status Filter
      const statusFilter = globalFilters.status || 'PENDING';
      if (statusFilter === 'PENDING') {
        if ((row.displayStatus || 'OPEN') === 'CLOSED' || (row.displayStatus || 'OPEN') === 'ACCEPTED') return false;
      } else if (statusFilter === 'CLOSED') {
        if ((row.displayStatus || 'OPEN') !== 'CLOSED' && (row.displayStatus || 'OPEN') !== 'ACCEPTED') return false;
      } else if (statusFilter !== 'All') {
        if (row.displayStatus !== statusFilter) return false;
      }

      // Mine / Team / Company access filter
      const activeType = globalFilters.type || 'Mine';
      const matchScopeLocal = () => {
        // Assigned to
        if (bosFilters.matchScope(activeType, row.assignedToId, row.assignedTo)) return true;
        // Assigned by
        if (bosFilters.matchScope(activeType, row.assignedById, row.assignedBy)) return true;
        return false;
      };

      if (!matchScopeLocal()) return false;

      // Search Text Filter
      const searchText = globalFilters.searchText || '';
      if (searchText && searchText.length >= 3) {
        const q = searchText.toLowerCase();
        const searchField = globalFilters.searchBy || 'momNo';
        if (searchField === 'momNo' && !(row.momNo || '').toLowerCase().includes(q)) return false;
        if (searchField === 'scheduleNo' && !(row.scheduleNo || '').toLowerCase().includes(q)) return false;
        if (searchField === 'assignedTo' && !(row.assignedTo || '').toLowerCase().includes(q)) return false;
      }

      // Date Filtering
      if (globalFilters.fromDate && globalFilters.toDate) {
        const dateType = globalFilters.dateType || 'targetDate';
        let dateVal = null;
        if (dateType === 'targetDate') dateVal = row.targetDate;
        if (dateType === 'createdAt') dateVal = row.createdAt ? row.createdAt.split('T')[0] : null;
        if (dateType === 'momDate') dateVal = row.momDate;
        
        if (dateVal && (dateVal < globalFilters.fromDate || dateVal > globalFilters.toDate)) return false;
      }

      // Global Quick Search
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (row.momNo || '').toLowerCase().includes(q) ||
               (row.discussedPoint || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const handleEdit = (item) => {
    setSelectedAction(item);
    setDialogOpen(true);
  };

  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'discussedPoint') {
      const text = row.discussedPoint || '-';
      return (
        <Tooltip title={text} placement="top" arrow enterDelay={200} leaveDelay={100}>
          <div style={{
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}>
            {text}
          </div>
        </Tooltip>
      );
    }
    if (col.id === 'status') {
      return <BOSStatusChip status={row.displayStatus || 'OPEN'} showIcon={true} width={150} />;
    }
    if (col.id === 'momDate' || col.id === 'targetDate') {
      return row[col.id] ? row[col.id].split('-').reverse().join('/') : '-';
    }
    if (col.id === 'createdAt') {
      return formatDateTime(row.createdAt);
    }
    return row[col.id] || '-';
  };

  return (
    <MainCard fullWidth
      icon={IconListCheck}
      title={"MOM Action Review"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          
          exportFilename="MOM_Actions_Summary"
          hasExportPermission={true}
         columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleEdit}
        onEditRow={handleEdit}
        renderCell={renderCell}
        disableSearchFilter={true}
        id="mom-action-review-table"
        dense={true}
      />

      <MomActionClosureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={selectedAction}
        onSave={() => { setDialogOpen(false); fetchData(); }}
      />
    </MainCard>
  );
}
