import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconList } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddSeverityFmeaDialog from './AddSeverityFmeaDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| NPD SEVERITY FMEA MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'severityEffect', label: 'Severity Effect', minWidth: 200, bold: true },
  { id: 'customerEffect', label: 'Customer Effect', minWidth: 200 },
  { id: 'manufacturingEffect', label: 'Manufacturing Effect', minWidth: 200 },
  { id: 'rank', label: 'Rank', minWidth: 80 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true }
];

export default function SeverityFmeaMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_SEVERITY_FMEA);

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
      ...getCommonDateFilters('createdAt', 'updatedAt'),
      {
        id: 'createdBy',
        label: 'CREATED BY',
        type: 'text',
        isStarred: false
      },
      {
        id: 'updatedBy',
        label: 'UPDATED BY',
        type: 'text',
        isStarred: false
      }
     ];
     dispatch(setFilterConfig(config));
     dispatch(setFilters({
       status: 'ACTIVE',
       createdAtStart: '',
       createdAtEnd: '',
       createdAtConsider: 'No',
       updatedAtStart: '',
       updatedAtEnd: '',
       updatedAtConsider: 'No',
       createdBy: '',
       updatedBy: ''
     }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.SEVERITY_FMEA);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch severity FMEA records:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setSelectedRow(null);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setSelectedRow(row);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handleOpenView = (row) => {
    setSelectedRow(row);
    setIsReadOnly(true);
    setDialogOpen(true);
  };

  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    setSelectedRow(null);
    if (refresh) fetchData();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetRow(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.SEVERITY_FMEA}/${deleteTargetRow.id}`);
      dispatch(openSnackbar({ open: true, message: 'Severity FMEA deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchData();
    } catch (error) {
      console.error('Failed to delete severity FMEA record:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete severity FMEA record.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const processedRows = useMemo(() => {
    return rows.map((row) => {
      const isUpdated = row.updatedAt && row.createdAt && Math.abs(new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime()) > 1000;
      return {
        ...row,
        updatedBy: isUpdated ? (row.updatedBy || '-') : '-',
        updatedAt: isUpdated ? row.updatedAt : null,
        updatedDate: isUpdated ? row.updatedDate : null,
        updated_at: isUpdated ? row.updated_at : null,
        updated_date: isUpdated ? row.updated_date : null
      };
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === true || row.status === 'ACTIVE' || row.status === 1 || row.status === 'Active';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Primary Field (Severity Effect)
      const effectFilter = globalFilters.severityEffect || '';
      if (effectFilter && !(row.severityEffect || '').toLowerCase().includes(effectFilter.toLowerCase())) return false;

      // 3. Created By Filter
      const createdByFilter = globalFilters.createdBy || '';
      if (createdByFilter && !(row.createdBy || '').toLowerCase().includes(createdByFilter.toLowerCase())) return false;

      // 4. Updated By Filter
      const updatedByFilter = globalFilters.updatedBy || '';
      if (updatedByFilter && !(row.updatedBy || '').toLowerCase().includes(updatedByFilter.toLowerCase())) return false;

      // 5. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.severityEffect && row.severityEffect.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.customerEffect && row.customerEffect.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.manufacturingEffect && row.manufacturingEffect.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => ({
      ...r,
      index: i + 1
    }));
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconList}
      title={"Severity FMEA Master"}
      secondary={
        <BOSTableToolbar
          id="npd-severity-fmea-toolbar"
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Severity FMEA', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Severity_FMEA_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="npd-severity-fmea-table"
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

      <AddSeverityFmeaDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Severity FMEA"
        message="Are you sure you want to delete this Severity FMEA? This action cannot be undone."
        itemName={deleteTargetRow?.severityEffect}
      />
    </MainCard>
  );
}
