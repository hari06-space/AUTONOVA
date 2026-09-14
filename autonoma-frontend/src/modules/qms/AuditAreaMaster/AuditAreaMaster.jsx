import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Box } from '@mui/material';
import { IconMapPin } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import MainCard from 'ui-component/cards/MainCard';
import AddAuditAreaDialog from './AddAuditAreaDialog';
import useMasterDataStore from 'store/useMasterDataStore';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { exportToExcel } from 'utils/excelExport';
import { formatDateTime } from 'utils/BOSTimeUtils';
import useConfig from 'hooks/useConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| AUDIT AREA MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'type', label: 'Type', minWidth: 100, bold: true },
  { id: 'description', label: 'Description', minWidth: 300 },
  { id: 'isActive', label: 'Status', minWidth: 100 },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
  { id: 'createdDate', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120 },
  { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150 }
];

export default function AuditAreaMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_AREA);
  const { timeFormat, dateFormat } = useConfig();

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
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => columns.map(c => c.id));

  const tableColumns = useMemo(() => columns.filter(col => visibleColumnIds.includes(col.id)), [visibleColumnIds]);

  useEffect(() => {
    const uniqueDescriptions = [...new Set((rows || []).map(r => r.description).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(desc => ({ value: desc, label: desc }));

    const config = [{
        id: 'isActive', label: 'Status', type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'type', label: 'Type', type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'AREA', label: 'AREA' },
          { value: 'ZONE', label: 'ZONE' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'description',
        label: 'Description',
        type: 'autocomplete',
        freeSolo: true,
        options: uniqueDescriptions,
        placeholder: 'Select or type Description...',
        isStarred: true
      },
      { id: 'createdDate', label: 'CREATED DATE', type: 'date', isStarred: true, defaultValueConsider: 'No' },
      { id: 'updatedDate', label: 'UPDATED DATE', type: 'date', defaultValueConsider: 'No' }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, rows]);

  const fetchAuditAreas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.AUDIT_AREA);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch audit areas:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuditAreas(); }, [fetchAuditAreas]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchAuditAreas(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.description || `Area ${row.type}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_AREA}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Audit Area deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      useMasterDataStore.getState().invalidate(['AUDIT_AREA']);
      fetchAuditAreas();
    } catch (error) {
      console.error('Failed to delete audit area:', error);
      let errorMsg = 'Failed to delete audit area.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const handleExport = () => {
    const exportData = filteredRows.map((r, i) => ({
      '#': i + 1,
      Type: r.type,
      Description: r.description,
      'CREATED USER': r.createdUser || r.createdBy,
      'CREATED DATE': r.createdDate ? formatDateTime(r.createdDate, timeFormat, dateFormat) : '',
      'UPDATED USER': r.updatedUser || r.updatedBy,
      'UPDATED DATE': r.updatedDate ? formatDateTime(r.updatedDate, timeFormat, dateFormat) : '',
      Status: r.isActive ? 'ACTIVE' : 'INACTIVE'
    }));
    exportToExcel(exportData, 'Audit_Area_Details');
  };

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const statusFilter = globalFilters?.isActive || 'ACTIVE';
      const isRowActive = row.isActive === true || row.isActive === 'true' || row.isActive === 1 || String(row.status || '').trim().toUpperCase() === 'ACTIVE';
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'ACTIVE' ? isRowActive : !isRowActive);
      const typeFilter = globalFilters?.type || 'All';
      const matchesType = typeFilter === 'All' || row.type === typeFilter;
      const descriptionFilter = globalFilters?.description || '';
      const matchesDescription = !descriptionFilter || (row.description && row.description.toLowerCase().includes(descriptionFilter.toLowerCase()));
      const matchesSearch = !globalQuery ||
        (row.description && row.description.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.type && row.type.toLowerCase().includes(globalQuery.toLowerCase()));
      return matchesStatus && matchesType && matchesDescription && matchesSearch;
    });
    // Sort descending by id so latest added audit areas appear at the top
    return [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const isHtml = (str) => typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str);

  const renderCell = useCallback((col, row, idx) => {
    const val = row[col.id];
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'createdUser' || col.id === 'createdBy') {
      const userVal = row.createdUser || row.createdBy || val;
      return (userVal ? userVal.trim() : '') || '-';
    }
    if (col.id === 'updatedUser' || col.id === 'updatedBy') {
      const userVal = row.updatedUser || row.updatedBy || val;
      return (userVal ? userVal.trim() : '') || '-';
    }
    if (col.id.toLowerCase().includes('date')) {
      return formatDateTime(val, timeFormat, dateFormat);
    }
    if (col.id === 'isActive') {
      const statusLabel = val ? 'ACTIVE' : 'INACTIVE';
      return <BOSStatusChip status={statusLabel} showIcon />;
    }
    if (col.id === 'description') {
      if (!val) return '-';
      if (isHtml(val)) {
        return <Box sx={{ '& p': { margin: 0 }, '& ul,& ol': { pl: 2, my: 0 }, fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(val) }} />;
      }
      return typeof val === 'string' ? val.trim() : val;
    }
    return (typeof val === 'string' ? val.trim() : val) ?? '-';
  }, [page, size]);

  if (!perms.read) {
    return null;
  }

  return (
    <MainCard fullWidth
      icon={IconMapPin}
      title={"Audit Area Master"}
      secondary={
        <BOSTableToolbar
          id="qms-audit-area-toolbar"
          onRefresh={fetchAuditAreas}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Audit Area', 'Ctrl + N')}
          hasWritePermission={perms.write}
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onColumnVisibilityChange={setVisibleColumnIds}
          requiredColumnIds={['index', 'type']}
          exportData={filteredRows}
          exportFilename="Audit_Area_Details"
          hasExportPermission={perms.export}
        />
      }
    >
      <BOSDataTable
        columns={tableColumns}
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
        renderCell={renderCell}
      />

      <AddAuditAreaDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} existingAreas={rows} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit Area"
        message="Are you sure you want to delete this audit area? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
