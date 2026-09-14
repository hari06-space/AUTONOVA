import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconSettings, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddModelDialog from './AddModelDialog';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PRODUCT MODEL MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70, align: 'center' },
  { id: 'oem.oemShortName', label: 'OEM Short Name', minWidth: 180, bold: true, align: 'center' },
  { id: 'modelNo', label: 'Model No', minWidth: 150, bold: true, align: 'center' },
  { id: 'rotorDiameter', label: 'Rotor Diameter (in Meter)', minWidth: 200, align: 'center' },
  { id: 'status', label: 'Model Status', minWidth: 130, status: true, align: 'center' },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160, align: 'center' },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 140, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160, align: 'center' }
];

export default function ModelMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_MODEL);

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

  // Dispatch starred filter configuration matching Status, Date range, and Model No
  useEffect(() => {
    const config = [{
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        isStarred: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: true, label: 'Active' },
          { value: false, label: 'Inactive' }
        ],
        defaultValue: true
      },
      { id: 'modelNo', label: 'Model No', type: 'text', placeholder: 'Search model no...', isStarred: true },
      ...getCommonDateFilters('createdAt', 'updatedAt'),
      { id: 'createdBy', label: 'CREATED BY', type: 'text', isStarred: false },
      { id: 'updatedBy', label: 'UPDATED BY', type: 'text', isStarred: false }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: true,
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

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.ITEM_MODEL);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch Models:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchModels(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.modelNo);
    setDeleteTargetName(row.modelNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_MODEL}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Model deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete model.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
      const statusFilter = globalFilters.status !== undefined ? globalFilters.status : true;
      if (statusFilter !== 'ALL') {
        const isRowActive = row.status === true || row.status === 1 || String(row.status).toUpperCase() === 'ACTIVE' || String(row.status) === '1';
        const wantActive = statusFilter === true || statusFilter === 1 || String(statusFilter).toUpperCase() === 'ACTIVE' || String(statusFilter) === '1';
        if (isRowActive !== wantActive) return false;
      }

      // 2. Primary Field (Model No)
      const modelNoFilter = globalFilters.modelNo || '';
      if (modelNoFilter && !(row.modelNo || '').toLowerCase().includes(modelNoFilter.toLowerCase())) return false;

      // 3. Created By Filter
      const createdByFilter = globalFilters.createdBy || '';
      if (createdByFilter && !(row.createdBy || '').toLowerCase().includes(createdByFilter.toLowerCase())) return false;

      // 4. Updated By Filter
      const updatedByFilter = globalFilters.updatedBy || '';
      if (updatedByFilter && !(row.updatedBy || '').toLowerCase().includes(updatedByFilter.toLowerCase())) return false;

      // 5. Wildcard search query — searches modelNo and OEM short name
      const matchesSearch = !globalQuery ||
        (row.modelNo && row.modelNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.oem && row.oem.oemShortName && row.oem.oemShortName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => ({
      ...r,
      index: i + 1
    }));
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconSettings}
      title={"Product Model Master"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchModels}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Model', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          
          exportFilename="Product_Model_Master"
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

      <AddModelDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Model details"
        message="Are you sure you want to delete this Model? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}