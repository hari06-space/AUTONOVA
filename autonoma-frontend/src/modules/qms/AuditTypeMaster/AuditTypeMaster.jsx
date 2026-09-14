import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, Checkbox, IconButton, Chip, Box } from '@mui/material';
import { IconFileDownload, IconListCheck, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import MainCard from 'ui-component/cards/MainCard';
import AddAuditTypeDialog from './AddAuditTypeDialog';
import useMasterDataStore from 'store/useMasterDataStore';
import { exportToExcel } from 'utils/excelExport';
import { formatDateTime } from 'utils/BOSTimeUtils';
import useConfig from 'hooks/useConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import {
  BOSDataTable, btnExport, btnNew, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters,
  BOSStatusChip
} from 'ui-component/bos';;
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| AUDIT TYPE MASTER (BOS SOP COMPLIANT) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'auditType', label: 'Audit Type', minWidth: 150, bold: true, align: 'center' },
  { id: 'standard', label: 'Standard', minWidth: 120, align: 'center' },
  { id: 'description', label: 'Description', minWidth: 200, maxWidth: 250, align: 'center' },
  { id: 'criteriaMinCount', label: 'Min Count', minWidth: 100, align: 'center' },
  { id: 'customerAuditArea', label: 'External Audit', minWidth: 120, align: 'center' },
  { id: 'auditArea', label: 'Audit Area', minWidth: 150, align: 'center' },
  { id: 'isActive', label: 'Status', minWidth: 100, align: 'center' },
  { id: 'createdUser', label: 'CREATED USER', minWidth: 120, align: 'center' },
  { id: 'createdDate', label: 'CREATED DATE', minWidth: 150, align: 'center' },
  { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120, align: 'center' },
  { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150, align: 'center' }
];

export default function AuditTypeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_TYPE);
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

  useEffect(() => {
    const uniqueAuditTypes = [...new Set((rows || []).map(r => r.auditType).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(t => ({ value: t, label: t }));

    const uniqueStandards = [...new Set((rows || []).map(r => r.standard).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(s => ({ value: s, label: s }));

    const uniqueDescriptions = [...new Set((rows || []).map(r => r.description).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(d => ({ value: d, label: d }));

    const uniqueAuditAreas = [...new Set((rows || []).map(r => r.auditArea).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map(a => ({ value: a, label: a }));

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
      id: 'auditType',
      label: 'Audit Type',
      type: 'autocomplete',
      freeSolo: true,
      options: uniqueAuditTypes,
      placeholder: 'Select or type Type...',
      isStarred: true
    },
    {
      id: 'standard',
      label: 'Standard',
      type: 'autocomplete',
      freeSolo: true,
      options: uniqueStandards,
      placeholder: 'Select or type Standard...',
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
    {
      id: 'auditArea',
      label: 'Audit Area',
      type: 'autocomplete',
      freeSolo: true,
      options: uniqueAuditAreas,
      placeholder: 'Select or type Area...'
    },
    {
      id: 'criteriaType', label: 'Criteria Type', type: 'select',
      options: [{ value: 'All', label: 'ALL' }, { value: 'Fixed', label: 'Fixed' }, { value: 'Variable', label: 'Variable' }]
    },
    { id: 'createdUser', label: 'CREATED USER', type: 'text' },
    { id: 'updatedUser', label: 'UPDATED USER', type: 'text' },
    ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, rows]);

  const fetchAuditTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.QMS.AUDIT_TYPE);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch audit types:', error);
      setRows([
        { id: 1, auditType: 'Internal Audit', standard: 'ISO 9001', description: 'Internal quality assessment', createdUser: 'Admin', createdDate: new Date(), updatedUser: 'Admin', updatedDate: new Date(), status: 'ACTIVE' },
        { id: 2, auditType: 'External Audit', standard: 'AS9100', description: 'Third party certification', createdUser: 'System', createdDate: new Date(), updatedUser: 'Admin', updatedDate: new Date(), status: 'ACTIVE' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuditTypes(); }, [fetchAuditTypes]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchAuditTypes(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.auditType || `Type #${row.id}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_TYPE}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Audit Type deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      useMasterDataStore.getState().invalidate(['AUDIT_TYPE']);
      fetchAuditTypes();
    } catch (error) {
      console.error('Failed to delete audit type:', error);
      let errorMsg = 'Failed to delete audit type.';
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
      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  const handleExport = () => {
    const exportData = filteredRows.map((r, i) => ({
      '#': i + 1,
      'Audit Type': r.auditType,
      Standard: r.standard,
      Description: r.description,
      'CREATED USER': r.createdUser || r.createdBy,
      'CREATED DATE': r.createdDate ? formatDateTime(r.createdDate, timeFormat, dateFormat) : '',
      'UPDATED USER': r.updatedUser || r.updatedBy,
      'UPDATED DATE': r.updatedDate ? formatDateTime(r.updatedDate, timeFormat, dateFormat) : '',
      Status: r.isActive ? 'ACTIVE' : 'INACTIVE'
    }));
    exportToExcel(exportData, 'Audit_Type_Details');
  };

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      const statusFilter = globalFilters?.isActive || 'ACTIVE';
      const isRowActive = row.isActive === true || row.isActive === 'true' || row.isActive === 1;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'ACTIVE' ? isRowActive : !isRowActive);

      const auditTypeFilter = globalFilters?.auditType || '';
      const rowAuditTypeTrimmed = row.auditType ? row.auditType.trim() : '';
      const matchesAuditType = !auditTypeFilter || rowAuditTypeTrimmed.toLowerCase().includes(auditTypeFilter.toLowerCase());

      const standardFilter = globalFilters?.standard || '';
      const rowStandardTrimmed = row.standard ? row.standard.trim() : '';
      const matchesStandard = !standardFilter || rowStandardTrimmed.toLowerCase().includes(standardFilter.toLowerCase());

      const descriptionFilter = globalFilters?.description || '';
      const rowDescriptionTrimmed = row.description ? row.description.trim() : '';
      const matchesDescription = !descriptionFilter || rowDescriptionTrimmed.toLowerCase().includes(descriptionFilter.toLowerCase());

      const auditAreaFilter = globalFilters?.auditArea || '';
      const rowAuditAreaTrimmed = row.auditArea ? row.auditArea.trim() : '';
      const matchesAuditArea = !auditAreaFilter || rowAuditAreaTrimmed.toLowerCase().includes(auditAreaFilter.toLowerCase());

      const criteriaTypeFilter = globalFilters?.criteriaType || 'All';
      const rowCriteriaTypeTrimmed = row.criteriaType ? row.criteriaType.trim() : '';
      const matchesCriteriaType = criteriaTypeFilter === 'All' || rowCriteriaTypeTrimmed === criteriaTypeFilter;

      const createdUserFilter = globalFilters?.createdUser || '';
      const rowCreatedUserTrimmed = (row.createdUser || row.createdBy || '').trim();
      const matchesCreatedUser = !createdUserFilter || rowCreatedUserTrimmed.toLowerCase().includes(createdUserFilter.toLowerCase());

      const updatedUserFilter = globalFilters?.updatedUser || '';
      const rowUpdatedUserTrimmed = (row.updatedUser || row.updatedBy || '').trim();
      const matchesUpdatedUser = !updatedUserFilter || rowUpdatedUserTrimmed.toLowerCase().includes(updatedUserFilter.toLowerCase());

      const matchesSearch = !globalQuery ||
        rowAuditTypeTrimmed.toLowerCase().includes(globalQuery.toLowerCase()) ||
        rowStandardTrimmed.toLowerCase().includes(globalQuery.toLowerCase());

      return matchesStatus && matchesAuditType && matchesStandard && matchesDescription && matchesAuditArea && matchesCriteriaType && matchesCreatedUser && matchesUpdatedUser && matchesSearch;
    });
    // Sort descending by id so latest added audit types appear at the top
    return [...filtered].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * size, page * size + size);
  }, [filteredRows, page, size]);

  if (!perms.read) {
    return null;
  }

  return (
    <MainCard fullWidth
      icon={IconListCheck}
      title={"Audit Type Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchAuditTypes}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Audit Type', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}

          exportFilename="Audit_Type_Details"
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
        renderCell={(col, row, idx) => {
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
          const isHtml = (str) => typeof str === 'string' && /<[a-z][\s\S]*>/i.test(str);
          if (col.id === 'description') {
            if (!val) return '-';
            if (isHtml(val)) {
              return <Box sx={{ '& p': { margin: 0 }, '& ul,& ol': { pl: 2, my: 0 }, fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(val) }} />;
            }
            return typeof val === 'string' ? val.trim() : val;
          }
          return (typeof val === 'string' ? val.trim() : val) ?? '-';
        }}
      />

      <AddAuditTypeDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit Type"
        message="Are you sure you want to delete this audit type? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
