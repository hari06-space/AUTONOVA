import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconRocket, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddWindFarmDialog from './AddWindFarmDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| WIND FARM MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70, align: 'center' },
  { id: 'windFarmName', label: 'Wind Farm Name', minWidth: 180, bold: true, align: 'left' },
  { id: 'city', label: 'City', minWidth: 140, align: 'left' },
  { id: 'state', label: 'State', minWidth: 140, align: 'left' },
  { id: 'country', label: 'Country', minWidth: 140, align: 'left' },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160, align: 'center' },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 140, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160, align: 'center' }
];

export default function WindFarmMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_WIND_FARM);

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

  // Dispatch starred filter configuration matching CREATED DATE and Wind Farm Name
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
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
      { id: 'windFarmName', label: 'Wind Farm Name', type: 'text', placeholder: 'Search wind farm name...', isStarred: true },
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

  const fetchWindFarms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.WIND_FARMS);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch Wind Farms:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWindFarms(); }, [fetchWindFarms]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchWindFarms(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.windFarmName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.WIND_FARMS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Wind Farm deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchWindFarms();
    } catch (error) {
      console.error('Failed to delete Wind Farm:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete Wind Farm.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
            if (!matchCommonDateFilters(row, globalFilters, 'createdAt')) return false;

      // Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isRowActive = row.isActive === 1 || row.isActive === true || row.isActive === 'ACTIVE';
        if (statusFilter === 'ACTIVE' && !isRowActive) return false;
        if (statusFilter === 'INACTIVE' && isRowActive) return false;
      }




      // 2. Primary Field Filter (Wind Farm Name)
      const windFarmNameFilter = globalFilters.windFarmName || '';
      if (windFarmNameFilter && !(row.windFarmName || '').toLowerCase().includes(windFarmNameFilter.toLowerCase())) return false;

      // 3. Search query
      const matchesSearch = !globalQuery ||
        (row.windFarmName && row.windFarmName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.city && row.city.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.state && row.state.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.country && row.country.toLowerCase().includes(globalQuery.toLowerCase()));

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
      icon={IconRocket}
      title={"Wind Farm Master"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchWindFarms}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Wind Farm', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          
          exportFilename="Wind_Farm_Master"
          hasExportPermission={perms.export}
         columns={columns} />
      }
    >
      <BOSDataTable
        id="npd-wind-farm-table"
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

      <AddWindFarmDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Wind Farm details"
        message="Are you sure you want to delete this Wind Farm? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}