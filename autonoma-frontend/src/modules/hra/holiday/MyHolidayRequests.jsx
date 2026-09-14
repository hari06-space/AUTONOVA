import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import AddHolidayRequestDialog from './AddHolidayRequestDialog';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar,
  BOSStatusChip} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| MY LEAVE REQUESTS ||============================== //

const STATUS_COLOR = {
  DRAFT: 'default',
  PENDING: 'info',
  SUBMITTED: 'info',
  APPROVED: 'success',
  MANAGER_APPROVED: 'primary',
  HR_APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'warning'
};

const renderStatus = (row) => {
  const value = row?.status;
  return <BOSStatusChip status={value || 'DRAFT'} showIcon />;
};

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'requestNo', label: 'Request No', minWidth: 140, bold: true },
  { id: 'leaveTypeName', label: 'Leave Type', minWidth: 150 },
  { id: 'startDateDisplay', label: 'From Date', minWidth: 120 },
  { id: 'endDateDisplay', label: 'To Date', minWidth: 120 },
  { id: 'numberOfDays', label: 'Days', minWidth: 90 },
  { id: 'status', label: 'Status', minWidth: 140, render: renderStatus },
  { id: 'managerName', label: 'Manager / Vertical Head', minWidth: 180 },
  { id: 'requestDateDisplay', label: 'Requested On', minWidth: 150 },
  { id: 'reason', label: 'Reason', minWidth: 220 }
];

export default function MyHolidayRequests() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_MY_HOLIDAY_REQUESTS);

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

  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      ...row,
      id: row.leaveRequestId,
      startDateDisplay: row.startDate ? format(new Date(row.startDate), 'dd/MM/yyyy') : '-',
      endDateDisplay: row.endDate ? format(new Date(row.endDate), 'dd/MM/yyyy') : '-',
      requestDateDisplay: row.requestDate ? format(new Date(row.requestDate), 'dd/MM/yyyy HH:mm') : '-'
    }));
  }, [rows]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_PATHS.HRM.LEAVE_REQUESTS}/me`);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => {
    const editable = row.status === 'DRAFT' || row.status === 'PENDING' || row.status === 'SUBMITTED';
    setSelectedRow(row);
    setIsReadOnly(!editable);
    setDialogOpen(true);
  };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchRequests(); };

  const handleDeleteClick = (row) => {
    if (row.status !== 'DRAFT') {
      dispatch(openSnackbar({ open: true, message: 'Only DRAFT requests can be deleted.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setDeleteTargetId(row.leaveRequestId);
    setDeleteTargetName(row.requestNo || 'Leave Request');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.HRM.LEAVE_REQUESTS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Leave request deleted.', variant: 'alert', severity: 'success' }));
      fetchRequests();
    } catch (error) {
      const msg = error?.response?.data || 'Failed to delete request.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Failed to delete.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconCalendarEvent}
      title={"My Leave Requests"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRequests}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('New Leave Request', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="My_Leave_Requests"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddHolidayRequestDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave Request"
        message="Are you sure you want to delete this draft request?"
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
