import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Tooltip, Chip, Checkbox, IconButton, Avatar } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconCoins, IconEdit, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, matchCommonDateFilters, BOSStatusChip, getPhotoUrl } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import LeaveEncashmentEntryDialog from './LeaveEncashmentEntryDialog';

const columns = [
  { id: 'sno',             label: 'S.No',              minWidth: 60,  align: 'center' },
  { id: 'empName',         label: 'Emp Name',          minWidth: 160, bold: true, align: 'left' },
  { id: 'currentEl',       label: 'EL',                minWidth: 60,  align: 'center' },
  { id: 'currentCl',       label: 'CL',                minWidth: 60,  align: 'center' },
  { id: 'sl',              label: 'SL',                minWidth: 60,  align: 'center' },
  { id: 'al',              label: 'AL',                minWidth: 60,  align: 'center' },
  { id: 'pl',              label: 'PL',                minWidth: 60,  align: 'center' },
  { id: 'totAvailable',    label: 'Tot.Avail.Leave',   minWidth: 110, align: 'center' },
  { id: 'elEncashment',    label: 'Encash.Days.Taken', minWidth: 120, align: 'center' },
  { id: 'status',          label: 'Status',            minWidth: 100, align: 'center' },
  { id: 'createdUser',     label: 'Created By',        minWidth: 120, align: 'center' },
  { id: 'createdAt',       label: 'Created Date',      minWidth: 110, align: 'center' },
];

const formatDateTime = (dateVal) => {
  if (!dateVal || dateVal === '-') return '-';
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return '-';
    const day   = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year  = dt.getFullYear();
    const t = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}/${month}/${year} ${t}`;
  } catch {
    return '-';
  }
};

const fmt2 = (v) => (v != null && !isNaN(v) ? Number(v).toFixed(2) : '-');

export default function LeaveEncashmentEntryList() {
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const globalQuery   = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms    = usePagePermissions(PAGE_CODES.HRA_LEAVE_ENCASHMENT_ENTRY);
  const bosFilters = useBOSFilters(perms);

  const [rows,         setRows]         = useState([]);
  const [page,         setPage]         = useState(0);
  const [size,         setSize]         = useState(10);
  const [loading,      setLoading]      = useState(false);
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ── Reset page on filter change ──
  useEffect(() => { setPage(0); }, [globalQuery, globalFilters]);

  // ── Global filter config ─────────────────────────────────────
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;

    dispatch(setFilterConfig([
      {
        id: 'taskType', label: 'Scope', type: 'select', isStarred: true,
        options: bosFilters.getFilterOptions(),
        defaultValue: 'All'
      },
      { id: 'employeeName', label: 'Employee Name', type: 'text', placeholder: 'Search by name...', isStarred: true },
      { id: 'employeeCode', label: 'Employee Code', type: 'text', placeholder: 'Search by code...', isStarred: true },
      {
        id: 'status', label: 'Status', type: 'select', isStarred: true,
        options: [
          { value: 'All',      label: 'All' },
          { value: 'PENDING',  label: 'Pending' },
          { value: 'VERIFIED', label: 'Verified' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' }
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
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded]);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED);
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Failed to fetch leave encashment records:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Resolved rows ────────────────────────────────────────────
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => {
      const el = Number(row.currentEl ?? row.el ?? 0);
      const cl = Number(row.currentCl ?? row.cl ?? 0);
      const sl = Number(row.sl ?? 0);
      const al = Number(row.al ?? 0);
      const pl = Number(row.pl ?? 0);
      const totAvail = el + cl + sl + al + pl;

      return {
        ...row,
        empName:      row.empName     || row.employee?.employeeName || '-',
        empId:        row.employee?.oldEmpCode || row.empId || row.employee?.empCode || '-',
        currentEl:    el,
        currentCl:    cl,
        sl:           sl,
        al:           al,
        pl:           pl,
        totAvailable: totAvail,
        elEncashment: row.elEncashment ?? row.totEncashment ?? 0,
        createdUser:  row.createdUser || row.createdBy              || '-',
        updatedUser:  row.updatedUser || row.updatedBy              || '-',
        createdAtRaw: row.createdAt  || row.createdDate            || null,
        updatedAtRaw: row.updatedAt  || row.updatedDate            || null,
        status:       row.status || 'PENDING'
      };
    });
  }, [rows]);

  // ── Filter logic ─────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    return resolvedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', null)) return false;

      const scopeFilter = globalFilters?.taskType || 'All';
      if (!bosFilters.matchScope(scopeFilter, row.employee?.id, row.empName)) return false;

      const statusFilter = globalFilters?.status || 'All';
      if (statusFilter !== 'All' && row.status !== statusFilter) return false;

      const empNameFilter = globalFilters?.employeeName || '';
      if (empNameFilter && !(row.empName || '').toLowerCase().includes(empNameFilter.toLowerCase())) return false;

      const empCodeFilter = globalFilters?.employeeCode || '';
      if (empCodeFilter && !(row.empId || '').toLowerCase().includes(empCodeFilter.toLowerCase())) return false;

      if (globalQuery) {
        const q = globalQuery.toLowerCase();
        return (
          (row.empName  || '').toLowerCase().includes(q) ||
          (row.empId    || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resolvedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(
    () => filteredRows.slice(page * size, page * size + size),
    [filteredRows, page, size]
  );

  // ── Handlers ─────────────────────────────────────────────────
  const handleAdd = () => {
    if (!perms.write) return;
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
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

  useKeyboardShortcuts({ 'ctrl+n': handleAdd });

  // ── Render cell ───────────────────────────────────────────────
  const renderCell = (col, row, idx) => {
    let val;

    if (col.id === 'selection') {
      val = <Checkbox size="small" sx={{ p: 0 }} />;
    } else if (col.id === 'editAction') {
      val = (
        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); if (perms.write) handleEdit(row); }}>
          <IconEdit size={16} />
        </IconButton>
      );
    } else if (col.id === 'sno') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          {page * size + idx + 1}
        </Typography>
      );
    } else if (col.id === 'empName') {
      const photoPath = row.employeePhotoUpload || row.photoUpload || row.photo || row.employeePhoto || row.photoPath || row.employee?.employeePhotoUpload;
      const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;
      val = (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={photoUrl}
            alt={row.empName}
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
            {!photoUrl && (row.empName ? row.empName.charAt(0).toUpperCase() : <IconUser size={18} />)}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.3px' }}>
            {row.empName || '-'}
          </Typography>
        </Stack>
      );
    } else if (['currentEl', 'currentCl', 'sl', 'al', 'pl'].includes(col.id)) {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'info.dark' }}>
          {fmt2(row[col.id])}
        </Typography>
      );
    } else if (col.id === 'totAvailable') {
      val = (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.dark' }}>
          {fmt2(row.totAvailable)}
        </Typography>
      );
    } else if (col.id === 'elEncashment') {
      val = (
        <Chip
          label={`${fmt2(row.elEncashment)} Days`}
          size="small"
          sx={{ fontWeight: 800, bgcolor: 'warning.lighter', color: 'warning.dark' }}
        />
      );
    } else if (col.id === 'status') {
      val = <BOSStatusChip status={row.status || 'PENDING'} width={100} />;
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
      val = row[col.id] ?? '-';
    }

    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
        {val}
      </div>
    );
  };

  return (
    <MainCard
      fullWidth
      title={
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
          <Box sx={{ p: 1, bgcolor: 'success.lighter', borderRadius: 2, display: 'flex' }}>
            <IconCoins size={22} color={isDark ? '#fff' : '#2e7d32'} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Leave Encashment Entry</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={handleAdd}
          newTooltip={shortcutTooltip('Create New Encashment Record', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Leave_Encashment_Entry"
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
        onEditRow={undefined}
        showActions={false}
        renderCell={renderCell}
        id="leave-encashment-verified-table"
      />

      {dialogOpen && (
        <LeaveEncashmentEntryDialog
          open={dialogOpen}
          item={selectedItem}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
        />
      )}
    </MainCard>
  );
}
