import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import AddHolidayDialog from './AddHolidayDialog';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| HOLIDAY MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'holidayName', label: 'Holiday Name', minWidth: 200, required: true },
  { id: 'fromDateDisplay', label: 'Holiday Date', minWidth: 120 },
  {
    id: 'holidayType',
    label: 'Type',
    minWidth: 130,
    options: [
      { value: 'NATIONAL', label: 'National' },
      { value: 'FESTIVAL', label: 'Festival' },
      { value: 'STATE', label: 'State' },
      { value: 'COMPANY', label: 'Company' },
      { value: 'OPTIONAL', label: 'Optional' },
      { value: 'WEEKLY_OFF', label: 'Weekly Off' },
      { value: 'OTHER', label: 'Other' }
    ]
  },

  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function HolidayMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.PAY_HOLIDAY);

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
      id: row.holidayId,
      fromDateDisplay: row.fromDate || row.holidayDate || null,
      toDateDisplay: row.toDate || row.holidayDate || null,
      createdDate: row.createdDate || null,
      updatedDate: row.updatedDate || null
    }));
  }, [rows]);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.HRM.HOLIDAYS);
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchHolidays(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.holidayId);
    setDeleteTargetName(row.holidayName || `Holiday ID ${row.holidayId}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.HRM.HOLIDAYS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Holiday deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchHolidays();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete holiday.', variant: 'alert', severity: 'error' }));
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
      title={"Company Holiday"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchHolidays}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Holiday', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="Holiday_Master"
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
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddHolidayDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
