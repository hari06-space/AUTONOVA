import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconClock, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import AddShiftMasterDialog from './AddShiftMasterDialog';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| SHIFT MASTER SCREEN ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'shiftCode', label: 'Shift Code', minWidth: 120, bold: true },
  { id: 'shiftName', label: 'Shift Name', minWidth: 180 },
  { id: 'startTime', label: 'Start Time', minWidth: 110 },
  { id: 'endTime', label: 'End Time', minWidth: 110 },
  { id: 'breakMinutes', label: 'Break (Mins)', minWidth: 110 },
  { id: 'standardHours', label: 'Std Hours', minWidth: 100 },
  { id: 'isNightShiftDisplay', label: 'Night Shift', minWidth: 110 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function ShiftMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.PAY_SHIFT);

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

  // ── RESOLVED ROWS (Formatting database outputs safely) ──
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      ...row,
      isNightShiftDisplay: row.isNightShift ? 'Yes' : 'No',
      status: row.isActive ? 'Active' : 'Inactive',
      createdDate: row.createdDate || null,
      updatedDate: row.updatedDate || null
    }));
  }, [rows]);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/shift-master');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to retrieve shifts.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

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
    if (refresh === true) fetchShifts();
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(`${row.shiftName} (${row.shiftCode})`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/hr/shift-master/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Shift configuration deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchShifts();
    } catch (error) {
      console.error('Failed to delete shift:', error);
      let errorMsg = 'Failed to delete shift configuration.';
      if (error.response?.status === 409) {
        errorMsg = 'Cannot delete shift because it is currently assigned to one or more employees or records.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => {
      if (dialogOpen) handleCloseDialog();
    }
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconClock}
      title={"Shift Master"}
      secondary={
        <BOSTableToolbar
          id="shift-master"
          onRefresh={fetchShifts}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Shift', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="Shift_Master_Details"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="shift-master"
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
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

      <AddShiftMasterDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shift Configuration"
        message="Are you sure you want to delete this shift? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
