import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Tooltip, Chip, Avatar } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconAlertTriangle, IconRefresh, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip, getPhotoUrl } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import { isMobile } from 'react-device-detect';
import PenaltyDialog from './PenaltyDialog';
import ShortCloseDialog from './ShortCloseDialog';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const columns = [
  { id: 'index', label: 'S.No', minWidth: 60, align: 'center' },
  { id: 'employeeName', label: 'Employee Name', minWidth: 180, bold: true, align: 'center' },
  { id: 'empCode', label: 'Employee Code', minWidth: 130, align: 'center' },
  { id: 'month', label: 'Month', minWidth: 100, align: 'center' },
  { id: 'year', label: 'Year', minWidth: 80, align: 'center' },
  { id: 'penaltyReason', label: 'Penalty Reason', minWidth: 250, align: 'center' },
  { id: 'penaltyAmount', label: 'Penalty Amount', minWidth: 130, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 130, align: 'center' },
  { id: 'createdUser', label: 'CREATED BY', minWidth: 130, align: 'center' },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 140, align: 'center' },
  { id: 'updatedUser', label: 'UPDATED_BY', minWidth: 150, align: 'center' },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 140, align: 'center' }
];

const formatDateTime = (dateVal) => {
  if (!dateVal || dateVal === '-') return '-';
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return '-';
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    const d = `${day}/${month}/${year}`;
    const t = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: '100%', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{d}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{t}</Typography>
      </Stack>
    );
  } catch (e) {
    return '-';
  }
};

export default function PenaltyList() {
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.HRA_PAYROLL_PENALTY);
  const { user } = useAuth();
  const bosFilters = useBOSFilters(perms);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [shortCloseOpen, setShortCloseOpen] = useState(false);
  const [shortCloseTarget, setShortCloseTarget] = useState(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Reset page to 0 on filter change
  useEffect(() => {
    setPage(0);
  }, [globalQuery, globalFilters]);

  // ── GLOBAL FILTER CONFIG ──
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    const monthOptions = MONTH_NAMES.slice(1).map((name, idx) => ({ value: String(idx + 1), label: name }));
    const yearOptions = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
      yearOptions.push({ value: String(y), label: String(y) });
    }

    dispatch(setFilterConfig([
      {
        id: 'taskType', label: 'Scope', type: 'select', isStarred: true,
        options: bosFilters.getFilterOptions(),
        defaultValue: 'Mine'
      },
      {
        id: 'month', label: 'Month', type: 'select', isStarred: true,
        options: [{ value: 'All', label: 'All' }, ...monthOptions],
        defaultValue: String(currentMonth)
      },
      {
        id: 'year', label: 'Year', type: 'select', isStarred: true,
        options: [{ value: 'All', label: 'All' }, ...yearOptions],
        defaultValue: String(currentYear)
      },
      { id: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Search by name...', isStarred: true },
      { id: 'employeeCode', label: 'Employee Code', type: 'text', placeholder: 'Search by code...', isStarred: true },
      {
        id: 'status', label: 'Status', type: 'select', isStarred: true,
        options: [
          { value: 'All', label: 'All' },
          { value: 'OPEN', label: 'Open' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'SHORT_CLOSED', label: 'Short Closed' }
        ],
        defaultValue: 'All'
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    ]));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, currentMonth, currentYear, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  // ── FETCH ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRA.PENALTIES);
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Failed to fetch penalties:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── RESOLVED ROWS ──
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => ({
      ...row,
      employeeName: row.employee?.employeeName || '-',
      empCode: row.employee?.empCode || '-',
      createdUser: row.createdUser || row.createdBy || '-',
      updatedUser: row.updatedUser || row.updatedBy || '-',
      createdAtRaw: row.createdAt || row.createdDate || null,
      updatedAtRaw: row.updatedAt || row.updatedDate || null,
      status: row.status || 'OPEN'
    }));
  }, [rows]);

  // ── FILTER LOGIC ──
  const filteredRows = useMemo(() => {
    return resolvedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', null)) return false;

      // Task Type / Scope Filter: Mine / Team / Company
      const scopeFilter = globalFilters?.taskType || 'Mine';
      if (!bosFilters.matchScope(scopeFilter, row.employee?.id, row.employeeName)) {
        return false;
      }

      // Month filter
      const monthFilter = globalFilters?.month || String(currentMonth);
      if (monthFilter !== 'All' && String(row.month) !== monthFilter) return false;

      // Year filter
      const yearFilter = globalFilters?.year || String(currentYear);
      if (yearFilter !== 'All' && String(row.year) !== yearFilter) return false;

      // Status filter
      const statusFilter = globalFilters?.status || 'All';
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;

      // Employee name filter
      const empNameFilter = globalFilters?.employeeName || '';
      if (empNameFilter) {
        const q = empNameFilter.toLowerCase();
        if (!(row.employeeName || '').toLowerCase().includes(q)) return false;
      }

      // Employee code filter
      const empCodeFilter = globalFilters?.employeeCode || '';
      if (empCodeFilter) {
        const q = empCodeFilter.toLowerCase();
        if (!(row.empCode || '').toLowerCase().includes(q)) return false;
      }

      // Global quick search
      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (row.employeeName || '').toLowerCase().includes(q) ||
               (row.empCode || '').toLowerCase().includes(q) ||
               (row.penaltyReason || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [resolvedRows, globalQuery, globalFilters, user?.empId, currentMonth, currentYear]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  // ── HANDLERS ──
  const handleAdd = () => {
    if (!perms.write) return;
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleShortClose = (item) => {
    setShortCloseTarget(item);
    setShortCloseOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const handleDialogSave = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    fetchData();
  };

  const handleShortCloseConfirm = async (remarks) => {
    try {
      await axios.put(`${API_PATHS.HRA.PENALTIES}/${shortCloseTarget.id}/short-close`, { remarks });
      dispatch(openSnackbar({ open: true, message: 'Penalty short closed successfully!', variant: 'alert', severity: 'success' }));
      setShortCloseOpen(false);
      setShortCloseTarget(null);
      setDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to short close', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({ 'ctrl+n': handleAdd });

  // ── RENDER CELL ──
  const renderCell = (col, row, idx) => {
    let val;

    if (col.id === 'index') {
      val = (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 600 }}>
          {idx + 1 + page * size}
        </Typography>
      );
    } else if (col.id === 'employeeName') {
      const photoPath = row.employeePhotoUpload || row.photoUpload || row.photo || row.employeePhoto || row.photoPath || row.employee?.employeePhotoUpload;
      const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;
      val = (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={photoUrl}
            alt={row.employeeName}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid',
              borderColor: 'primary.light'
            }}
          >
            {!photoUrl && (row.employeeName ? row.employeeName.charAt(0).toUpperCase() : <IconUser size={18} />)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.3px' }}>
            {row.employeeName || '-'}
          </Typography>
        </Stack>
      );
    } else if (col.id === 'empCode') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.empCode || '-'}
        </Typography>
      );
    } else if (col.id === 'month') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {MONTH_NAMES[row.month] || row.month || '-'}
        </Typography>
      );
    } else if (col.id === 'year') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row.year || '-'}
        </Typography>
      );
    } else if (col.id === 'penaltyReason') {
      const reason = row.penaltyReason || '-';
      const truncated = reason.length > 40 ? `${reason.substring(0, 40)}...` : reason;
      val = (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {truncated}
        </Typography>
      );
    } else if (col.id === 'penaltyAmount') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>
          {row.penaltyAmount != null ? `₹ ${Number(row.penaltyAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
        </Typography>
      );
    } else if (col.id === 'status') {
      const s = row.status || 'OPEN';
      val = (
        <BOSStatusChip status={s.replace('_', ' ')} width={110} />
      );
    } else if (col.id === 'createdAt' || col.id === 'updatedAt') {
      const rawDateVal = col.id === 'createdAt' ? row.createdAtRaw : row.updatedAtRaw;
      val = formatDateTime(rawDateVal);
    } else if (col.id === 'createdUser' || col.id === 'updatedUser') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {row[col.id] || '-'}
        </Typography>
      );
    } else {
      val = row[col.id] || '-';
    }

    const tooltipHint = isMobile ? 'Double-tap' : 'Double-click';
    let finalTooltip = tooltipHint;
    if (col.id === 'penaltyReason' && row.penaltyReason && row.penaltyReason.length > 40) {
      finalTooltip = `${row.penaltyReason} | ${tooltipHint}`;
    }

    return (
      <Tooltip title={finalTooltip} placement="top" followCursor enterDelay={200}>
        <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
          {val}
        </div>
      </Tooltip>
    );
  };

  return (
    <MainCard fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
            <IconAlertTriangle size={22} color={isDark ? '#fff' : '#1e88e5'} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Penalty</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('Create New Penalty', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Penalty_List"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >

      <BOSDataTable
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleEdit}
        onEditRow={perms.write ? handleEdit : undefined}
        showActions={true}
        renderCell={renderCell}
        id="penalty-list-table"
      />

      <PenaltyDialog
        open={dialogOpen}
        item={selectedItem}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        onShortClose={handleShortClose}
      />

      <ShortCloseDialog
        open={shortCloseOpen}
        onClose={() => { setShortCloseOpen(false); setShortCloseTarget(null); }}
        onConfirm={handleShortCloseConfirm}
        itemName={shortCloseTarget?.employee?.employeeName}
      />
    </MainCard>
  );
}
