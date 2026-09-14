import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconSettings, IconRefresh, IconCloudUpload } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddOemMappingDialog from './AddOemMappingDialog';
import BulkUploadDialog from './BulkUploadDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters, setQuery } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PRODUCT OEM MAPPING MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'partNo', label: 'Part No', minWidth: 150, bold: true },
  { id: 'oemPartNo', label: 'OEM Part No', minWidth: 180, bold: true, align: 'center' },
  { id: 'oemDescription', label: 'OEM Description', minWidth: 240, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 110, status: true },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160 }
];

export default function OemMappingMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_OEM_MAPPING);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Dispatch starred filter configuration matching Status, Date range, and Part No
  useEffect(() => {
    const config = [{
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
      { id: 'partNo', label: 'Part No', type: 'text', placeholder: 'Search part no...', isStarred: false },
      ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.ITEM_OEM_MAPPING);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch OEM mappings:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchMappings(); };
  const handleCloseBulkDialog = (refresh) => {
    setBulkDialogOpen(false);
    if (refresh === true) {
      dispatch(setQuery(''));
      dispatch(setFilters({
        status: 'ACTIVE',
        createdAt: '',
        updatedAt: ''
      }));
      setPage(0);
      fetchMappings();
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.partNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_OEM_MAPPING}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'OEM Mapping deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete mapping.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
      if (statusFilter !== 'ALL') {
        const isRowActive = row.status === true || row.status === 1 || row.status === 'ACTIVE' || row.status === 'Active';
        if (statusFilter === 'ACTIVE' && !isRowActive) return false;
        if (statusFilter === 'INACTIVE' && isRowActive) return false;
      }

      // 3. Primary Field (Part No)
      const partNoFilter = globalFilters.partNo || '';
      if (partNoFilter && !(row.partNo || '').toLowerCase().includes(partNoFilter.toLowerCase())) return false;

      // 4. Wildcard Query Filter
      let matchesSearch = true;
      if (globalQuery) {
        const query = globalQuery.toLowerCase();
        matchesSearch = (row.partNo && row.partNo.toLowerCase().includes(query)) ||
          (row.oemPartNo && row.oemPartNo.toLowerCase().includes(query)) ||
          (row.oemDescription && row.oemDescription.toLowerCase().includes(query));
      }

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
      title={"Product OEM Mapping"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchMappings}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Mapping', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          
          exportFilename="Product_OEM_Mapping"
          hasExportPermission={perms.export}
         columns={columns}>
          <Tooltip title="Bulk OEM Upload">
            <Button
              variant="outlined"
              color="secondary"
              size="medium"
              startIcon={<IconCloudUpload size={18} />}
              onClick={() => setBulkDialogOpen(true)}
              sx={{ textTransform: 'none', borderRadius: '8px', border: '1.5px solid', fontWeight: 600, ...btnNew }}
            >
              Bulk Upload
            </Button>
          </Tooltip>
        </BOSTableToolbar>
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

      <AddOemMappingDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <BulkUploadDialog open={bulkDialogOpen} handleClose={handleCloseBulkDialog} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete OEM Mapping"
        message="Are you sure you want to delete this mapping? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}