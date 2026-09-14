import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPackage } from '@tabler/icons-react';
import { Stack, Typography } from '@mui/material';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| PACKING PROCEDURE LIST ||============================== //

const columns = [
  { id: 'index', label: 'Row Id', minWidth: 70 },
  { id: 'docNo', label: 'Doc No', minWidth: 120, bold: true },
  { id: 'processName', label: 'Process Type', minWidth: 180 },
  { id: 'partNo', label: 'Part No', minWidth: 150, bold: true },
  { id: 'partName', label: 'Part Name', minWidth: 200 },
  { id: 'revNo', label: 'Rev No', minWidth: 90 },
  { id: 'revDateText', label: 'Rev Date', minWidth: 130 },
  { id: 'approvalStatus', label: 'Approval Status', minWidth: 130 },
  { id: 'statusText', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 130 },
  { id: 'createdAtText', label: 'CREATED DATE', minWidth: 130 }
];

export default function PackingProcedureList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_PACKING_PROCEDURE);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Set filters
  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        isRequired: true,
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAt: '',
      updatedAt: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchProcedures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/dd/packing-procedures');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch packing procedures:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const handleOpenAdd = () => {
    navigate('/dd/packing-procedure/add');
  };

  const handleOpenEdit = (row) => {
    navigate(`/dd/packing-procedure/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.docNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/dd/packing-procedures/${deleteTargetId}`);
      dispatch(openSnackbar({
        open: true,
        message: 'Packing Procedure deleted successfully!',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success'
      }));
      fetchProcedures();
    } catch (error) {
      console.error('Failed to delete packing procedure:', error);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete packing procedure.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  const processedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      statusText: row.isActive ? 'Active' : 'Inactive',
      revDateText: row.revDate ? new Date(row.revDate).toLocaleDateString() : '',
      createdAtText: row.createdDate ? new Date(row.createdDate).toLocaleDateString() : ''
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return processedRows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

      // 1. Status Filter
      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.isActive === true || row.isActive === 'ACTIVE';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Search Query
      const matchesSearch =
        !globalQuery ||
        (row.docNo && row.docNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.partNo && row.partNo.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.partName && row.partName.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.processName && row.processName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [processedRows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0
      }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconPackage size={24} />
          <Typography variant="h3">Packing Procedure Creation</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchProcedures}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Packing Procedure', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Packing_Procedure_List"
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
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Packing Procedure"
        message="Are you sure you want to delete this procedure? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
