import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTags } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddInventoryTypeDialog from './AddInventoryTypeDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| INVENTORY TYPE MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'code', label: 'Code', minWidth: 150, bold: true },
  { id: 'typeName', label: 'Type Name', minWidth: 200 },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'status', label: 'Status', minWidth: 100, format: (val) => (val === 1 ? 'Active' : 'Inactive') },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160 }
];

export default function InventoryTypeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_INVENTORY_TYPE);

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

  const API_URL = '/api/npd/inventory-types';

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
      { id: 'code', label: 'Code', type: 'text', placeholder: 'Search code...', isStarred: true },
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

  const fetchInventoryTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch Inventory Types:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => { fetchInventoryTypes(); }, [fetchInventoryTypes]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    if (refresh === true) fetchInventoryTypes();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.code);
    setDeleteTargetName(row.typeName || row.code);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_URL}/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Inventory Type deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchInventoryTypes();
    } catch (error) {
      console.error('Failed to delete Inventory Type:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete Inventory Type.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    escape: () => {
      if (dialogOpen) handleCloseDialog();
    }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
            if (!matchCommonDateFilters(row, globalFilters, 'createdAt')) return false;

      // Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isRowActive = row.status === 1 || row.status === true || row.status === 'ACTIVE';
        if (statusFilter === 'ACTIVE' && !isRowActive) return false;
        if (statusFilter === 'INACTIVE' && isRowActive) return false;
      }


      const codeFilter = globalFilters.code || '';
      if (codeFilter && !(row.code || '').toLowerCase().includes(codeFilter.toLowerCase())) return false;

      const matchesSearch = !globalQuery ||
        (row.code && row.code.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.typeName && row.typeName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconTags}
      title={"Inventory Type Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchInventoryTypes}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Inventory Type', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Inventory_Type_Master"
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
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddInventoryTypeDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inventory Type"
        message="Are you sure you want to delete this Inventory Type? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
