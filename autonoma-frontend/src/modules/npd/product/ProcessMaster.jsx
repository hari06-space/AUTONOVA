import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, Drawer, Box, Autocomplete, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, Divider } from '@mui/material';
import { IconRefresh, IconSitemap, IconLink, IconTrash, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddProcessDialog from './AddProcessDialog';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PROCESS MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 60, align: 'center' },
  { id: 'processCd', label: 'Process Code', minWidth: 150, bold: true, align: 'center' },
  { id: 'processName', label: 'Process Name', minWidth: 180, bold: true, align: 'center' },
  {
    id: 'description',
    label: 'Description',
    minWidth: 220,
    align: 'center',
    render: (row) => row.description ? row.description.replace(/<[^>]*>/g, '').trim() : ''
  },
  { id: 'status', label: 'Status', minWidth: 100, status: true, align: 'center' },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150, align: 'center' },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 140, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150, align: 'center' }
];

export default function ProcessMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_PROCESS);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Set starred filters for Status
  useEffect(() => {
    const config = [{
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAtStart: '',
      createdAtEnd: '',
      createdAtConsider: 'No',
      updatedAtStart: '',
      updatedAtEnd: '',
      updatedAtConsider: 'No'
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.PROCESS);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch processes:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchProcesses(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.processName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.PROCESS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Process deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchProcesses();
    } catch (error) {
      console.error('Failed to delete process:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete process.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        status: row.status === true || row.status === 1 || row.status === 'ACTIVE' || row.status === 'Active',
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
      const statusFilter = globalFilters.status || 'ALL';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === true;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Search query
      const matchesSearch = !globalQuery ||
        (row.processName && row.processName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.processCd && row.processCd.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.description && row.description.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard
      fullWidth
      icon={IconSitemap}
      title={"Process Master"}
      secondary={
        <BOSTableToolbar
          id="npd-process-toolbar"
          onRefresh={fetchProcesses}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Process', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Process_Master"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        id="npd-process-table"
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

      <AddProcessDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Process"
        message="Are you sure you want to delete this process? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}