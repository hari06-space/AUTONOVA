import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTool } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddEbMeterDialog from './AddEbMeterDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// Columns including the required audit fields
const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'consumerName', label: 'Consumer Name', minWidth: 120, bold: true },
  { id: 'consumerNo', label: 'Consumer No', minWidth: 100 },
  { id: 'meterType', label: 'Meter Type', minWidth: 90 },
  { id: 'meterNo', label: 'Meter No', minWidth: 90 },
  { id: 'purchaseDate', label: 'Purchase Date', minWidth: 100 },
  { id: 'startUnitKwh', label: 'Start(kWh)', minWidth: 90, align: 'right' },
  { id: 'startUnitKvah', label: 'Start(kVAh)', minWidth: 90, align: 'right' },
  { id: 'maximumDemand', label: 'Max Demand', minWidth: 100, align: 'right' },
  { id: 'multiplicationFactor', label: 'MF', minWidth: 70, align: 'right' },
  { id: 'sanctionedLoad', label: 'Sanct. Load', minWidth: 100, align: 'right' },
  { id: 'unitPrice', label: 'Unit Price', minWidth: 90, align: 'right' },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'isActive', label: 'Status', minWidth: 100 }
];

export default function EbMeter() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.QMS_EB_METER);
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
  const [visibleColumnIds, setVisibleColumnIds] = useState(columns.map(c => c.id));

  const visibleColumns = useMemo(() => {
    return columns.filter(col => visibleColumnIds.includes(col.id));
  }, [visibleColumnIds]);

  // Configure starred filters with required default settings
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'STATUS',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'meterType',
        label: 'METER TYPE',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'EB', label: 'EB' },
          { value: 'SOLAR', label: 'SOLAR' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'meterNo',
        label: 'METER NO',
        type: 'text',
        defaultValue: '',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({ status: 'ACTIVE', meterType: 'All', meterNo: '' }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchMeters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/qms/eb-meter');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch EB meters:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeters();
  }, [fetchMeters]);

  const handleOpenAdd = () => {
    setSelectedRow(null);
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setSelectedRow(row);
    setIsReadOnly(!perms.write);
    setDialogOpen(true);
  };

  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    if (refresh === true) fetchMeters();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.meterNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/qms/eb-meter/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'EB Meter deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchMeters();
    } catch (error) {
      console.error('Failed to delete EB Meter:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete EB Meter.',
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
    const filtered = rows
      .filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

        // 1. Status Filter
        const statusFilter = globalFilters.status || 'All';
        const isRowActive = row.isActive === true || row.isActive === 'true' || row.isActive === 1 || String(row.status || '').trim().toUpperCase() === 'ACTIVE';
        const matchesStatus = statusFilter === 'All' || statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? isRowActive : !isRowActive);

        // 2. Meter Type Filter
        const meterTypeFilter = globalFilters.meterType || 'All';
        const matchesMeterType = meterTypeFilter === 'All' || meterTypeFilter === 'ALL' || String(row.meterType || '').toLowerCase() === meterTypeFilter.toLowerCase();

        // 3. Meter No Filter
        const meterNoFilter = globalFilters.meterNo || '';
        const matchesMeterNo =
          !meterNoFilter || String(row.meterNo ?? '').toLowerCase().includes(String(meterNoFilter).toLowerCase().trim());

        // 4. Search query
        const queryLower = (globalQuery || '').toLowerCase().trim();
        const matchesSearch =
          !queryLower ||
          String(row.consumerName || '').toLowerCase().includes(queryLower) ||
          String(row.consumerNo ?? '').toLowerCase().includes(queryLower) ||
          String(row.meterNo ?? '').toLowerCase().includes(queryLower) ||
          String(row.meterType || '').toLowerCase().includes(queryLower) ||
          String(row.status || '').toLowerCase().includes(queryLower) ||
          String(row.createdUser || row.createdBy || '').toLowerCase().includes(queryLower) ||
          String(row.updatedUser || row.updatedBy || '').toLowerCase().includes(queryLower);

        return matchesStatus && matchesMeterType && matchesMeterNo && matchesSearch;
      });

    return [...filtered]
      .sort((a, b) => {
        const aActive = a.isActive === true || a.isActive === 'true' || a.isActive === 1 || String(a.status || '').trim().toUpperCase() === 'ACTIVE' ? 1 : 0;
        const bActive = b.isActive === true || b.isActive === 'true' || b.isActive === 1 || String(b.status || '').trim().toUpperCase() === 'ACTIVE' ? 1 : 0;
        if (aActive !== bActive) {
          return bActive - aActive;
        }
        return (b.id || 0) - (a.id || 0);
      })
      .map((r) => {
        let isFormattedCreatedAt = '-';
        if (r.createdAt) {
          try {
            isFormattedCreatedAt = format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm');
          } catch {
            isFormattedCreatedAt = r.createdAt;
          }
        }
        let isFormattedUpdatedAt = '-';
        if (r.updatedAt) {
          try {
            isFormattedUpdatedAt = format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm');
          } catch {
            isFormattedUpdatedAt = r.updatedAt;
          }
        }
        return {
          ...r,
          startUnitKwh: r.startUnitKwh !== null && r.startUnitKwh !== undefined ? Number(r.startUnitKwh).toFixed(4) : '0.0000',
          startUnitKvah: r.startUnitKvah !== null && r.startUnitKvah !== undefined ? Number(r.startUnitKvah).toFixed(4) : '0.0000',
          maximumDemand: r.maximumDemand !== null && r.maximumDemand !== undefined ? Number(r.maximumDemand).toFixed(2) : '0.00',
          multiplicationFactor: r.multiplicationFactor !== null && r.multiplicationFactor !== undefined ? Number(r.multiplicationFactor).toFixed(2) : '0.00',
          sanctionedLoad: r.sanctionedLoad !== null && r.sanctionedLoad !== undefined ? Number(r.sanctionedLoad).toFixed(2) : '0.00',
          unitPrice: r.unitPrice !== null && r.unitPrice !== undefined ? Number(r.unitPrice).toFixed(2) : '0.00',
          createdBy: r.createdUser || r.createdBy || '-',
          updatedBy: r.updatedAt && (r.updatedUser || r.updatedBy) ? (r.updatedUser || r.updatedBy) : '-',
          createdAt: isFormattedCreatedAt,
          updatedAt: isFormattedUpdatedAt,
          isActive: r.isActive === true || r.isActive === 'true' || r.isActive === 1 || String(r.status || '').trim().toUpperCase() === 'ACTIVE'
        };
      });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

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
    if (col.id === 'createdAt' || col.id === 'updatedAt') {
      return val || '-';
    }
    if (col.id === 'isActive') {
      const statusLabel = val ? 'ACTIVE' : 'INACTIVE';
      return <BOSStatusChip status={statusLabel} />;
    }
    return (typeof val === 'string' ? val.trim() : val) ?? '-';
  }, [page, size]);

  return (
    <MainCard
      fullWidth
      icon={IconTool}
      title={"EB Meter Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchMeters}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New EB Meter', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="EB_Meter_Master"
          hasExportPermission={perms.export}
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          onColumnVisibilityChange={setVisibleColumnIds}
        />
      }
    >
      <BOSDataTable
        id="eb-meter-table"
        columns={visibleColumns}
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
        onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={renderCell}
      />

      <AddEbMeterDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete EB Meter Details"
        message="Are you sure you want to delete this EB Meter? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
