import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconTags } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import AddHsnCodeMasterDialog from './AddHsnCodeMasterDialog';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| HSN CODE MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 70 },
  { id: 'hsnCode', label: 'HSN Code', minWidth: 150, bold: true },
  { id: 'description', label: 'Description', minWidth: 250 },
  { id: 'cgstPer', label: 'CGST %', minWidth: 100 },
  { id: 'sgstPer', label: 'SGST %', minWidth: 100 },
  { id: 'igstPer', label: 'IGST %', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100, format: (val) => (val === 1 ? 'Active' : 'Inactive') },
  { id: 'createdBy', label: 'CREATED BY', minWidth: 140 },
  { id: 'createdAt', label: 'CREATED DATE', minWidth: 160 },
  { id: 'updatedBy', label: 'UPDATED BY', minWidth: 140 },
  { id: 'updatedAt', label: 'UPDATED DATE', minWidth: 160 }
];

export default function HsnCodeMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.NPD_HSN_CODE);

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

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpenAdd(),
    'escape': () => handleCloseDialog()
  });

  const API_URL = '/api/admin/hsn-codes';

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const config = [
      { id: 'hsnCode', label: 'HSN Code', type: 'text', placeholder: 'Search HSN Code...', isStarred: true },
      ...getCommonDateFilters('createdAt', 'updatedAt')
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      createdAtStart: today,
      createdAtEnd: today
    }));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const fetchHsnCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch HSN Codes:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchHsnCodes();
  }, [fetchHsnCodes]);

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
    if (refresh === true) fetchHsnCodes();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.hsnCode);
    setDeleteTargetName(row.hsnCode);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_URL}/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'HSN Code deleted successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      fetchHsnCodes();
    } catch (error) {
      console.error('Failed to delete HSN Code:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete HSN Code.',
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
      if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

      const codeFilter = globalFilters.hsnCode || '';
      if (codeFilter && !(row.hsnCode || '').toLowerCase().includes(codeFilter.toLowerCase())) return false;

      const matchesSearch = !globalQuery ||
        (row.hsnCode && row.hsnCode.toLowerCase().includes(globalQuery.toLowerCase())) ||
        (row.description && row.description.toLowerCase().includes(globalQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [rows, globalQuery, globalFilters]);

  const paginatedRows = useMemo(() => filteredRows.slice(page * size, page * size + size), [filteredRows, page, size]);

  return (
    <MainCard fullWidth
      icon={IconTags}
      title={"HSN Code Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchHsnCodes}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New HSN Code', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={filteredRows}
          exportFilename="HSN_Code_Master"
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

      <AddHsnCodeMasterDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete HSN Code"
        message="Are you sure you want to delete this HSN Code? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
