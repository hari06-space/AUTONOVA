import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTool } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddEbPowerConsumptionDialog from './AddEbPowerConsumptionDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// Columns including all the required fields and audit fields
const columns = [
  { id: 'index', label: '#', minWidth: 50, align: 'center' },
  { id: 'meterNo', label: 'Meter No', minWidth: 100, align: 'left', bold: true },
  { id: 'consumerName', label: 'Consumer Name', minWidth: 130, align: 'left' },
  { id: 'shift', label: 'Shift', minWidth: 90, align: 'center' },
  { id: 'readingDate', label: 'Date', minWidth: 130, align: 'center' },
  { id: 'startUnitKwh', label: 'Start(kWh)', minWidth: 110, align: 'right' },
  { id: 'endUnitKwh', label: 'End(kWh)', minWidth: 110, align: 'right' },
  { id: 'consumptionUnitKwh', label: 'Cons(kWh)', minWidth: 110, align: 'right' },
  { id: 'multiplicationFactor', label: 'MF', minWidth: 80, align: 'right' },
  { id: 'actualConsumptionUnit', label: 'Actual Cons', minWidth: 110, align: 'right' },
  { id: 'unitPrice', label: 'Unit Price', minWidth: 100, align: 'right' },
  { id: 'cost', label: 'Cost', minWidth: 90, align: 'right' },
  { id: 'startUnitKvah', label: 'Start(kVAh)', minWidth: 110, align: 'right' },
  { id: 'endUnitKvah', label: 'End(kVAh)', minWidth: 110, align: 'right' },
  { id: 'consumptionUnitKvah', label: 'Cons(kVAh)', minWidth: 110, align: 'right' },
  { id: 'powerFactor', label: 'PF', minWidth: 80, align: 'right' },
  { id: 'createdUser', label: 'CREATED BY', minWidth: 130, align: 'left' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150, align: 'center' },
  { id: 'updatedUser', label: 'UPDATED BY', minWidth: 130, align: 'left' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150, align: 'center' }
];

export default function EbPowerConsumption() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.QMS_EB_POWER_CONSUMPTION);
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
  const [shifts, setShifts] = useState([]);

  // Fetch active shifts from Shift Master
  const fetchShifts = useCallback(async () => {
    try {
      const response = await axios.get('/api/hr/shift-master/active');
      setShifts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch shifts from shift master:', error);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Configure starred filters
  useEffect(() => {
    const shiftOptions = [
      { value: 'All', label: 'ALL' },
      ...shifts.map((s) => ({ value: s.shiftCode, label: s.shiftName || s.shiftCode }))
    ];

    const config = [
      {
        id: 'meterNo',
        label: 'METER NO',
        type: 'text',
        defaultValue: '',
        isStarred: true
      },
      {
        id: 'shift',
        label: 'SHIFT',
        type: 'select',
        options: shiftOptions,
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'createdUser',
        label: 'CREATED BY',
        type: 'text',
        defaultValue: '',
        isStarred: false
      },
      {
        id: 'updatedUser',
        label: 'UPDATED BY',
        type: 'text',
        defaultValue: '',
        isStarred: false
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, shifts]);

  useEffect(() => {
    dispatch(setFilters({ meterNo: '', shift: 'All', createdUser: '', updatedUser: '' }));
  }, [dispatch]);

  const fetchConsumptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/qms/eb-power-consumption');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch Power Consumption:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsumptions();
  }, [fetchConsumptions]);

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
    if (refresh === true) fetchConsumptions();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(`Reading on ${row.readingDate}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/qms/eb-power-consumption/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Reading deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchConsumptions();
    } catch (error) {
      console.error('Failed to delete reading:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete reading.',
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

        // 1. Meter No Filter
        const meterNoFilter = globalFilters.meterNo || '';
        const matchesMeterNo =
          !meterNoFilter ||
          (row.meter?.meterNo && row.meter.meterNo.toLowerCase().includes(meterNoFilter.toLowerCase()));

        // 2. Shift Filter
        const shiftFilter = globalFilters.shift || 'All';
        const matchesShift = shiftFilter === 'All' || row.shift === shiftFilter;

        // 3. Created By Filter
        const createdUserFilter = globalFilters.createdUser || '';
        const matchesCreatedUser =
          !createdUserFilter ||
          (row.createdUser && row.createdUser.toLowerCase().includes(createdUserFilter.toLowerCase().trim())) ||
          (row.createdBy && row.createdBy.toLowerCase().includes(createdUserFilter.toLowerCase().trim()));

        // 4. Updated By Filter
        const updatedUserFilter = globalFilters.updatedUser || '';
        const matchesUpdatedUser =
          !updatedUserFilter ||
          (row.updatedUser && row.updatedUser.toLowerCase().includes(updatedUserFilter.toLowerCase().trim())) ||
          (row.updatedBy && row.updatedBy.toLowerCase().includes(updatedUserFilter.toLowerCase().trim()));

        // 5. Search query matches meter No, consumer Name, shift, readingDate, remarks, createdUser, updatedUser
        const queryLower = (globalQuery || '').toLowerCase();
        const matchesSearch =
          !queryLower ||
          (row.meter?.meterNo && row.meter.meterNo.toLowerCase().includes(queryLower)) ||
          (row.meter?.consumerName && row.meter.consumerName.toLowerCase().includes(queryLower)) ||
          (row.shift && row.shift.toLowerCase().includes(queryLower)) ||
          (row.readingDate && row.readingDate.toLowerCase().includes(queryLower)) ||
          (row.remarks && row.remarks.toLowerCase().includes(queryLower)) ||
          (row.createdUser && row.createdUser.toLowerCase().includes(queryLower)) ||
          (row.createdBy && row.createdBy.toLowerCase().includes(queryLower)) ||
          (row.updatedUser && row.updatedUser.toLowerCase().includes(queryLower)) ||
          (row.updatedBy && row.updatedBy.toLowerCase().includes(queryLower));

        return matchesMeterNo && matchesShift && matchesCreatedUser && matchesUpdatedUser && matchesSearch;
      });

    return [...filtered]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .map((r) => ({
        ...r,
        meterNo: r.meter?.meterNo || '-',
        consumerName: r.meter?.consumerName || '-',
        shift: r.shift || '-',
        readingDate: (() => {
          if (!r.readingDate) return '-';
          try {
            return format(new Date(r.readingDate), 'dd/MM/yyyy');
          } catch {
            return r.readingDate;
          }
        })(),
        startUnitKwh: r.startUnitKwh !== null && r.startUnitKwh !== undefined ? Number(r.startUnitKwh).toFixed(4) : '0.0000',
        endUnitKwh: r.endUnitKwh !== null && r.endUnitKwh !== undefined ? Number(r.endUnitKwh).toFixed(4) : '0.0000',
        consumptionUnitKwh: r.consumptionUnitKwh !== null && r.consumptionUnitKwh !== undefined ? Number(r.consumptionUnitKwh).toFixed(4) : '0.0000',
        multiplicationFactor: r.meter?.multiplicationFactor !== null && r.meter?.multiplicationFactor !== undefined ? Number(r.meter.multiplicationFactor).toFixed(2) : '0.00',
        actualConsumptionUnit: r.actualConsumptionUnit !== null && r.actualConsumptionUnit !== undefined ? Number(r.actualConsumptionUnit).toFixed(4) : '0.0000',
        unitPrice: r.meter?.unitPrice !== null && r.meter?.unitPrice !== undefined ? Number(r.meter.unitPrice).toFixed(2) : '0.00',
        cost: r.cost !== null && r.cost !== undefined ? Number(r.cost).toFixed(2) : '0.00',
        startUnitKvah: r.startUnitKvah !== null && r.startUnitKvah !== undefined ? Number(r.startUnitKvah).toFixed(4) : '0.0000',
        endUnitKvah: r.endUnitKvah !== null && r.endUnitKvah !== undefined ? Number(r.endUnitKvah).toFixed(4) : '0.0000',
        consumptionUnitKvah: r.consumptionUnitKvah !== null && r.consumptionUnitKvah !== undefined ? Number(r.consumptionUnitKvah).toFixed(4) : '0.0000',
        powerFactor: r.powerFactor !== null && r.powerFactor !== undefined ? Number(r.powerFactor).toFixed(4) : '0.0000',
        createdUser: r.createdUser || r.createdBy || '-',
        updatedUser: r.updatedAt && (r.updatedUser || r.updatedBy) ? (r.updatedUser || r.updatedBy) : '-',
        createdAt: (() => {
          if (!r.createdAt) return '-';
          try {
            return format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm');
          } catch {
            return r.createdAt;
          }
        })(),
        updatedAt: (() => {
          if (!r.updatedAt) return '-';
          try {
            return format(new Date(r.updatedAt), 'dd/MM/yyyy HH:mm');
          } catch {
            return r.updatedAt;
          }
        })()
      }));
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
    return (typeof val === 'string' ? val.trim() : val) ?? '-';
  }, [page, size]);

  return (
    <MainCard
      fullWidth
      icon={IconTool}
      title={"EB Power Consumption Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchConsumptions}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Reading', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="EB_Power_Consumption_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="eb-power-consumption-table"
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
        onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
        renderCell={renderCell}
      />

      <AddEbPowerConsumptionDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete EB Power Consumption Details"
        message="Are you sure you want to delete this Power Consumption reading? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
