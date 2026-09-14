import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFileDownload, IconRefresh, IconBuilding } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import AddDepartmentDialog from './AddDepartmentDialog';
import { exportToExcel } from 'utils/excelExport';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| DEPARTMENT MASTER (BOS SOP COMPLIANT) ||============================== //

export const DEPARTMENT_CATEGORIES = {
  1: 'QMS',
  2: 'Human Resource',
  3: 'Management'
};

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'departmentNo', label: 'Dept No.', minWidth: 120, bold: true, required: true },
  { id: 'departmentName', label: 'Department Name', minWidth: 180, required: true },
  { id: 'categoryName', label: 'Category', minWidth: 150 },
  { id: 'departmentMailId', label: 'Department Mail Id', minWidth: 180, required: true },
  { id: 'ndaCertificate', label: 'NDA', minWidth: 80 },
  { id: 'sequenceNo', label: 'Seq No.', minWidth: 100 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function DepartmentDetails() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.EMP_DEPARTMENT);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // ── RESOLVED ROWS (SOP #16 Standard) ──
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => ({
      ...row,
      status: row.status || 'Active',
      categoryName: DEPARTMENT_CATEGORIES[row.categoryId] || '-'
    }));
  }, [rows]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/hr/departments');
      setRows(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const mailIdOptions = useMemo(() => {
    if (!Array.isArray(rows)) return [{ value: 'All', label: 'All' }];
    const uniqueMails = Array.from(
      new Set(
        rows
          .map((r) => r.departmentMailId)
          .filter((mail) => mail && mail.trim() !== '')
      )
    ).sort();
    return [
      { value: 'All', label: 'All' },
      ...uniqueMails.map((mail) => ({ value: mail, label: mail }))
    ];
  }, [rows]);

  useEffect(() => {
    const config = [
      {
        id: 'departmentMailId',
        label: 'Department Mail Id',
        type: 'select',
        options: mailIdOptions,
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'ndaCertificate',
        label: 'NDA Required',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Yes', label: 'Yes' },
          { value: 'No', label: 'No' }
        ],
        defaultValue: 'All'
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Active', label: 'Active' },
          { value: 'In Active', label: 'In Active' },
          { value: 'Suspended', label: 'Suspended' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      { id: 'sequenceNo', label: 'Org Sequence', type: 'text', placeholder: 'Sequence No...' },
      { id: 'createdDate', label: 'Created Date', type: 'date' },
      { id: 'updatedDate', label: 'Updated Date', type: 'date' },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, mailIdOptions]);

  const handleOpenAdd = () => { setSelectedRow(null); setIsReadOnly(false); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setIsReadOnly(false); setDialogOpen(true); };
  const handleCloseDialog = (refresh) => { setDialogOpen(false); if (refresh === true) fetchDepartments(); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.departmentName || `Department #${row.departmentNo}`);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`/api/master/hr/departments/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Department deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchDepartments();
    } catch (error) {
      console.error('Failed to delete department:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete department.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => { if (dialogOpen) handleCloseDialog(); }
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconBuilding}
      title={"Department Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchDepartments}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Department', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          
          exportFilename="Department_Details"
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

      <AddDepartmentDialog open={dialogOpen} handleClose={handleCloseDialog} initialData={selectedRow} readOnly={isReadOnly} />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
