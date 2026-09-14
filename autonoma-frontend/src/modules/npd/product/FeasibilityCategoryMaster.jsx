import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconCategory } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddFeasibilityCategoryDialog from './AddFeasibilityCategoryDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| NPD FEASIBILITY CATEGORY MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'id', label: 'ID', minWidth: 80 },
  { id: 'type', label: 'Type', minWidth: 150 },
  { id: 'category', label: 'Category', minWidth: 200, bold: true },
  { id: 'seqNo', label: 'Sequence No', minWidth: 120 },
  { 
    id: 'description', 
    label: 'Description', 
    minWidth: 250,
    render: (row) => row.description ? row.description.replace(/<[^>]*>/g, '').trim() : ''
  },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 150 },
  { id: 'updatedBy', label: 'UPDATED_BY', minWidth: 120 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100, status: true }
];

export default function FeasibilityCategoryMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_FEASIBILITY_CATEGORY);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetRow, setDeleteTargetRow] = useState(null);

  useEffect(() => {
    const config = [
      {
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
      ...getCommonDateFilters('createdAt', 'updatedAt')
     ];
     dispatch(setFilterConfig(config));
     dispatch(setFilters({
       status: 'ACTIVE',
       createdAtStart: '',
       createdAtEnd: '',
       createdAtConsider: 'No',
       updatedAtStart: '',
       updatedAtEnd: '',
       updatedAtConsider: 'No'
     }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.NPD.FEASIBILITY_CATEGORY);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch feasibility categories:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setSelectedRow(null);
    setIsReadOnly(false);
    setDialogOpen(true);
  };
  const handleOpenEdit = (row) => {
    setSelectedRow(row);
    setIsReadOnly(false);
    setDialogOpen(true);
  };
  const handleOpenView = (row) => {
    setSelectedRow(row);
    setIsReadOnly(true);
    setDialogOpen(true);
  };
  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    setSelectedRow(null);
    if (refresh === true) fetchData();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetRow(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.FEASIBILITY_CATEGORY}/${deleteTargetRow.id}`);
      dispatch(openSnackbar({ open: true, message: 'Feasibility Category deleted successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      fetchData();
    } catch (error) {
      console.error('Failed to delete feasibility category:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete feasibility category.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
      const statusFilter = globalFilters.status || 'ALL';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === true || row.status === 'ACTIVE' || row.status === 1 || row.status === 'Active';
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      // 2. Primary Field (Category)
      const catFilter = globalFilters.category || '';
      if (catFilter && !(row.category || '').toLowerCase().includes(catFilter.toLowerCase())) return false;

      // 3. Wildcard Query Search
      const matchesSearch = !globalQuery ||
        (row.category && row.category.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.type && row.type.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.description && row.description.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => ({
      ...r,
      index: i + 1
    }));
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
      icon={IconCategory}
      title={"Feasibility Category Master"}
      secondary={
        <BOSTableToolbar
          id="npd-feasibility-category-toolbar"
          onRefresh={fetchData}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Feasibility Category', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Feasibility_Category_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="npd-feasibility-category-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddFeasibilityCategoryDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Feasibility Category"
        message="Are you sure you want to delete this feasibility category? This action cannot be undone."
        itemName={deleteTargetRow?.category}
      />
    </MainCard>
  );
}
