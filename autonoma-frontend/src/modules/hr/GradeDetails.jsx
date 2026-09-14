import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFileDownload, IconRefresh, IconAward } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig, setFilters } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import AddGradeDialog from './AddGradeDialog';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, matchCommonDateFilters } from 'ui-component/bos';;
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| GRADE MASTER ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'gradeCode', label: 'Grade Code', minWidth: 150, bold: true, required: true },
  { id: 'sequenceNo', label: 'Sequence', minWidth: 100 },
  { id: 'gradeName', label: 'Grade Name', minWidth: 200, required: true },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function GradeDetails() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.EMP_GRADE);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // ── RESOLVED ROWS (SOP #16 Standard) ──
  const globalFilters = useSelector((state) => state.search?.filters || {});

  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    const statusFilter = globalFilters.status || 'All';

    return rows
      .filter((row) => {
        const rowStatus = row.status || 'Active';
        if (statusFilter !== 'All' && rowStatus !== statusFilter) return false;
        return true;
      })
      .map((row, idx) => ({
        ...row,
        index: idx + 1,
        createdDate: row.createdDate || null,
        updatedDate: row.updatedDate || null,
        status: row.status || 'Active'
      }));
  }, [rows, globalFilters]);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/hr/grades');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Active', label: 'Active' },
          { value: 'In Active', label: 'In Active' }
        ],
        defaultValue: 'Active',
        isStarred: true
      },
      {
        id: 'sequenceNo',
        label: 'Sequence',
        type: 'text',
        isStarred: true
      },
      {
        id: 'createdDate',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({ status: 'Active' }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchGrades(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.gradeName || `Grade ${row.gradeCode}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/hr/grades/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Grade deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchGrades();
    } catch (error) {
      console.error('Failed to delete grade:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete grade.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconAward}
      title={"Grade Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchGrades}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Grade', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          
          exportFilename="Grade_Details"
          hasExportPermission={perms.export}
         columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <AddGradeDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Grade"
        message="Are you sure you want to delete this grade? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
