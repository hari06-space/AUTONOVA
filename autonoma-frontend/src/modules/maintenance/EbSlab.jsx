import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTool } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddEbSlabDialog from './AddEbSlabDialog';
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
  { 
    id: 'effectFrom', 
    label: 'Effect From', 
    minWidth: 120, 
    bold: true,
    render: (row) => (
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
        {row.effectFrom}
      </Typography>
    )
  },
  {
    id: 'slabRange',
    label: 'Slab Range',
    minWidth: 150,
    render: (row) => (
      <Stack spacing={0.5} sx={{ py: 1 }}>
        {row.details && row.details.length > 0 ? (
          row.details.map((d) => (
            <Typography key={d.id || d.seqNo} variant="body2" sx={{ display: 'block' }}>
              {d.fromUnit} - {d.toUnit}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </Stack>
    )
  },
  {
    id: 'price',
    label: 'Price',
    minWidth: 100,
    render: (row) => (
      <Stack spacing={0.5} sx={{ py: 1 }}>
        {row.details && row.details.length > 0 ? (
          row.details.map((d) => (
            <Typography key={d.id || d.seqNo} variant="body2" sx={{ display: 'block', fontWeight: 600 }}>
              ₹{Number(d.price).toFixed(2)}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )}
      </Stack>
    )
  },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'isActive', label: 'Status', minWidth: 100 }
];

export default function EbSlab() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.QMS_EB_SLAB);
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

  // Configure search filters
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
    dispatch(setFilters({ status: 'ACTIVE', createdUser: '', updatedUser: '' }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchSlabs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/qms/eb-slab');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch slabs:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlabs();
  }, [fetchSlabs]);

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
    if (refresh === true) fetchSlabs();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(`Slab from ${row.effectFrom}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/qms/eb-slab/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Slab configuration deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchSlabs();
    } catch (error) {
      console.error('Failed to delete slab:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete slab configuration.',
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
    const mapped = rows
      .filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

        // 1. Status Filter
        const statusFilter = globalFilters.status || 'All';
        const isRowActive = row.isActive === true || row.isActive === 'true' || row.isActive === 1 || String(row.status || '').trim().toUpperCase() === 'ACTIVE';
        const matchesStatus = statusFilter === 'All' || (statusFilter === 'ACTIVE' ? isRowActive : !isRowActive);

        // 2. Created By Filter
        const createdUserFilter = globalFilters.createdUser || '';
        const matchesCreatedUser =
          !createdUserFilter ||
          (row.createdUser && row.createdUser.toLowerCase().includes(createdUserFilter.toLowerCase().trim())) ||
          (row.createdBy && row.createdBy.toLowerCase().includes(createdUserFilter.toLowerCase().trim()));

        // 3. Updated By Filter
        const updatedUserFilter = globalFilters.updatedUser || '';
        const matchesUpdatedUser =
          !updatedUserFilter ||
          (row.updatedUser && row.updatedUser.toLowerCase().includes(updatedUserFilter.toLowerCase().trim())) ||
          (row.updatedBy && row.updatedBy.toLowerCase().includes(updatedUserFilter.toLowerCase().trim()));

        // 4. Search query matches effectFrom, status, createdUser, updatedUser
        const queryLower = (globalQuery || '').toLowerCase();
        const matchesSearch =
          !queryLower ||
          (row.effectFrom && row.effectFrom.toLowerCase().includes(queryLower)) ||
          (row.status && row.status.toLowerCase().includes(queryLower)) ||
          (row.createdUser && row.createdUser.toLowerCase().includes(queryLower)) ||
          (row.createdBy && row.createdBy.toLowerCase().includes(queryLower)) ||
          (row.updatedUser && row.updatedUser.toLowerCase().includes(queryLower)) ||
          (row.updatedBy && row.updatedBy.toLowerCase().includes(queryLower));

        return matchesStatus && matchesCreatedUser && matchesUpdatedUser && matchesSearch;
      })
      .map((r) => {
        const rawCreatedAt = r.createdAt || r.createdDate;
        let isFormattedCreatedAt = '-';
        if (rawCreatedAt) {
          try {
            isFormattedCreatedAt = format(new Date(rawCreatedAt), 'dd/MM/yyyy HH:mm');
          } catch {
            isFormattedCreatedAt = rawCreatedAt;
          }
        }
        const rawUpdatedAt = r.updatedAt || r.updatedDate;
        const hasBeenUpdated = Boolean(
          rawUpdatedAt && 
          rawCreatedAt && 
          new Date(rawUpdatedAt).getTime() !== new Date(rawCreatedAt).getTime() && 
          Math.abs(new Date(rawUpdatedAt).getTime() - new Date(rawCreatedAt).getTime()) > 5000
        );

        let isFormattedUpdatedAt = '-';
        if (hasBeenUpdated && rawUpdatedAt) {
          try {
            isFormattedUpdatedAt = format(new Date(rawUpdatedAt), 'dd/MM/yyyy HH:mm');
          } catch {
            isFormattedUpdatedAt = rawUpdatedAt;
          }
        }

        const validUpdatedUser = hasBeenUpdated ? (r.updatedUser || r.updatedBy || '-') : '-';

        return {
          ...r,
          slabRange: r.details && r.details.length > 0 
            ? r.details.map(d => `${d.fromUnit} - ${d.toUnit}`).join(', ') 
            : '-',
          price: r.details && r.details.length > 0 
            ? r.details.map(d => Number(d.price).toFixed(2)).join(', ') 
            : '-',
          createdBy: r.createdUser || r.createdBy || '-',
          updatedBy: validUpdatedUser,
          updatedUser: validUpdatedUser,
          createdAt: isFormattedCreatedAt,
          updatedAt: isFormattedUpdatedAt,
          isActive: r.isActive === true || r.isActive === 'true' || r.isActive === 1 || String(r.status || '').trim().toUpperCase() === 'ACTIVE'
        };
      });

    return [...mapped].sort((a, b) => {
      const aActive = a.isActive === true || String(a.status || '').trim().toUpperCase() === 'ACTIVE' ? 1 : 0;
      const bActive = b.isActive === true || String(b.status || '').trim().toUpperCase() === 'ACTIVE' ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive; // Active first
      }
      const aDate = a.effectFrom ? new Date(a.effectFrom).getTime() : 0;
      const bDate = b.effectFrom ? new Date(b.effectFrom).getTime() : 0;
      return bDate - aDate; // Newer date first
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  const renderCell = useCallback((col, row, idx) => {
    const val = row[col.id];
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'slabRange' || col.id === 'price') return null;
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
      title={"EB Slab Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchSlabs}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Slab Config', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="EB_Slab_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="eb-slab-table"
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

      <AddEbSlabDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete EB Slab Details"
        message="Are you sure you want to delete this Slab configuration? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
