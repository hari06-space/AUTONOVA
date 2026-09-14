import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTags } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddMaterialGradeDialog from './AddMaterialGradeDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| MATERIAL GRADE MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'code', label: 'Code', minWidth: 150, bold: true },
  { id: 'gradeName', label: 'Grade Name', minWidth: 250 },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'density', label: 'Density', minWidth: 100 },
  { id: 'materialType', label: 'Material Type', minWidth: 150, format: (val) => val?.typeName || val?.code || '' },
  { id: 'status', label: 'Status', minWidth: 100, status: true },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160 }
];

export default function MaterialGradeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_MATERIAL_GRADE);

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

  const API_URL = '/api/npd/material-grades';

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
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'date_range',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      status: 'ACTIVE',
      createdAt: ''
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchMaterialGrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch Material Grades:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchMaterialGrades();
  }, [fetchMaterialGrades]);

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

  const handleCloseDialog = (refresh) => {
    setDialogOpen(false);
    if (refresh === true) fetchMaterialGrades();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.code);
    setDeleteTargetName(row.code);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_URL}/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Material Grade deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchMaterialGrades();
    } catch (error) {
      console.error('Failed to delete Material Grade:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete Material Grade.',
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
    return rows.filter((row) => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt')) return false;

      const statusFilter = globalFilters.status || 'ACTIVE';
      if (statusFilter !== 'ALL') {
        const isActive = row.status === 1 || row.status === 'ACTIVE' || row.status === true;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;
      }

      const codeFilter = globalFilters.code || '';
      if (codeFilter && !(row.code || '').toLowerCase().includes(codeFilter.toLowerCase())) return false;

      const matchesSearch = !globalQuery ||
        (row.code && row.code.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.gradeName && row.gradeName.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    }).map((r, i) => {
      const isUpdated = r.updatedAt && r.createdAt && Math.abs(new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) > 1000;
      return {
        ...r,
        index: i + 1,
        updatedBy: isUpdated ? (r.updatedBy || '-') : '-',
        updatedAt: isUpdated ? r.updatedAt : null,
        updatedDate: isUpdated ? r.updatedDate : null,
        updated_at: isUpdated ? r.updated_at : null,
        updated_date: isUpdated ? r.updated_date : null
      };
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconTags}
      title={"Material Grade Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchMaterialGrades}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Material Grade', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="Material_Grade_Master"
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
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddMaterialGradeDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Material Grade"
        message="Are you sure you want to delete this Material Grade? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
