import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconSettings, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddCapacityDialog from './AddCapacityDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PRODUCT CAPACITY MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70, align: 'center' },
  { id: 'uom', label: 'UOM', minWidth: 120, bold: true, align: 'center' },
  { id: 'capacityVal', label: 'Capacity', minWidth: 150, bold: true, align: 'center' },
  { id: 'model.modelNo', label: 'Model Name', minWidth: 180, align: 'center' },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160, align: 'center' },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 140, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160, align: 'center' }
];

export default function CapacityMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_CAPACITY);

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

  // Dispatch starred filter configuration matching CREATED DATE and UOM
  useEffect(() => {
    const config = [
      { id: 'uom', label: 'UOM', type: 'text', placeholder: 'Search UOM...', isStarred: false },
      ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      createdAt: '',
      updatedAt: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchCapacities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.ITEM_CAPACITY);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch Capacities:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCapacities(); }, [fetchCapacities]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchCapacities(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.model?.modelNo + '/' + row.uom + '/' + row.capacityVal);
    setDeleteTargetName(row.capacityVal ? `${row.capacityVal} ${row.uom}` : 'Capacity');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_CAPACITY}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Capacity deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchCapacities();
    } catch (error) {
      console.error('Failed to delete capacity:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete capacity.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;



      // 2. Primary Field Filter (UOM)
      const uomFilter = globalFilters.uom || '';
      if (uomFilter && !(row.uom || '').toLowerCase().includes(uomFilter.toLowerCase())) return false;

      // 3. Search query
      const matchesSearch = !globalQuery ||
        (row.capacityVal && String(row.capacityVal).includes(globalQuery)) ||
        (row.uom && row.uom.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.model && row.model.modelNo && row.model.modelNo.toLowerCase().includes(globalQuery.toLowerCase()));

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
      icon={IconSettings}
      title={"Product Capacity Master"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchCapacities}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Capacity', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          
          exportFilename="Product_Capacity_Master"
          hasExportPermission={perms.export}
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
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddCapacityDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Capacity details"
        message="Are you sure you want to delete this Capacity? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}