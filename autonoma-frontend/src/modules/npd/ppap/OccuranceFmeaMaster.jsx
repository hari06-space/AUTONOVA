import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconList } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddOccuranceFmeaDialog from './AddOccuranceFmeaDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| NPD OCCURANCE FMEA MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'probablityOfFailure', label: 'Probability of Failure', minWidth: 200, bold: true },
  { id: 'likelyFailureRates', label: 'Likely Failure Rates', minWidth: 200 },
  { id: 'rank', label: 'Rank', minWidth: 80 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true }
];

export default function OccuranceFmeaMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_OCCURANCE_FMEA);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);

  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE'
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'date_range',
        isStarred: true
      }
     ];
     dispatch(setFilterConfig(config));
     dispatch(setFilters({
       status: 'ACTIVE',
       createdAt: ''
     }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.OCCURANCE_FMEA);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch occurance FMEA records:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchData(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetRow(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.OCCURANCE_FMEA}/${deleteTargetRow.id}`);
      dispatch(openSnackbar({ open: true, message: 'Occurance FMEA deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchData();
    } catch (error) {
      console.error('Failed to delete occurance FMEA record:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete occurance FMEA record.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === true || row.status === 'ACTIVE';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Primary Field (Probability of Failure)
      const probFilter = globalFilters.probablityOfFailure || '';
      if (probFilter && !(row.probablityOfFailure || '').toLowerCase().includes(probFilter.toLowerCase())) return false;

      // 3. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.probablityOfFailure && row.probablityOfFailure.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.likelyFailureRates && row.likelyFailureRates.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => {
      const isUpdated = r.updatedAt && r.createdAt && Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) > 1000;
      return {
        ...r,
        index: i + 1,
        updatedBy: isUpdated ? (r.updatedBy || '-') : '-',
        updatedAt: isUpdated ? r.updatedAt : null,
        updatedDate: isUpdated ? r.updatedDate : null,
        updated_at: isUpdated ? r.updated_at : null,
        updated_date: isUpdated ? r.updated_date : null
      };
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconList}
      title={"Occurance FMEA Master"}
      secondary={
        <BOSTableToolbar
          id="npd-occurance-fmea-toolbar"
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Occurance FMEA', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Occurance_FMEA_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="npd-occurance-fmea-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddOccuranceFmeaDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Occurance FMEA"
        message="Are you sure you want to delete this Occurance FMEA? This action cannot be undone."
        itemName={deleteTargetRow?.probablityOfFailure}
      />
    </MainCard>
  );
}
