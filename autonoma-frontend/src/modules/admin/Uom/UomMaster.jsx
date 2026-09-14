import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconListCheck, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddUomDialog from './AddUomDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';

// ==============================|| UOM MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: 'NO', minWidth: 70 },
  { id: 'uomCode', label: 'UOM NAME', minWidth: 180, bold: true },
  { id: 'uomDescription', label: 'UOM DESCRIPTION', minWidth: 220 },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160 },
  { id: 'status', label: 'STATUS', minWidth: 120, status: true }
];

export default function UomMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

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

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpenAdd(),
    'escape': () => handleCloseDialog()
  });

  // Dispatch starred filter configuration matching Status, Date range, and UOM NAME
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const config = [{
        id: 'status',
        label: 'Status',
        type: 'select',
        isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE'
      },
      { id: 'uomCode', label: 'UOM NAME', type: 'text', placeholder: 'Search UOM Name...', isStarred: true },
      ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAtStart: today,
      createdAtEnd: today
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchUoms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.ADMIN.UOM);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch UOMs:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUoms(); }, [fetchUoms]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchUoms(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.uomCode);
    setDeleteTargetName(row.uomCode);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.ADMIN.UOM}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'UOM deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchUoms();
    } catch (error) {
      console.error('Failed to delete UOM:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete UOM.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;

      // 2. Created Date Range Filter
      const today = format(new Date(), 'yyyy-MM-dd');
      const startDate = globalFilters.createdAtStart || today;
      const endDate = globalFilters.createdAtEnd || today;
      const rowDate = row.createdAt ? format(new Date(row.createdAt), 'yyyy-MM-dd') : '';
      if (rowDate && (rowDate < startDate || rowDate > endDate)) return false;

      // 3. Primary Field (UOM NAME / uomCode)
      const uomCodeFilter = globalFilters.uomCode || '';
      if (uomCodeFilter && !(row.uomCode || '').toLowerCase().includes(uomCodeFilter.toLowerCase())) return false;

      // 4. Search query
      const matchesSearch = !globalQuery ||
        (row.uomCode && row.uomCode.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.uomDescription && row.uomDescription.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r) => ({
      ...r,
      createdUser: r.createdUser || r.createdBy || '-',
      updatedUser: r.updatedUser || r.updatedBy || '-',
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-GB') : '-',
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-GB') : '-'
    }));
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconListCheck}
      title={"UOM Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchUoms}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New UOM', 'Ctrl + N')}
          hasWritePermission={true}
          exportData={filteredRows}
          
          exportFilename="UOM_Master"
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
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={handleOpenEdit}
        onDeleteRow={handleDeleteClick}
      />

      <AddUomDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete UOM details"
        message="Are you sure you want to delete this UOM? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}