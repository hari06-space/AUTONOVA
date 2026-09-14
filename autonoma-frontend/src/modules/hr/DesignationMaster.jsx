import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconBriefcase, IconFileDownload, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddDesignationDialog from './AddDesignationDialog';
import { format } from 'date-fns';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
  { id: 'index', label: 'No', minWidth: 60 },
  { id: 'designationCode', label: 'Designation Code', minWidth: 160, bold: true, required: true },
  { id: 'designationName', label: 'Designation Name', minWidth: 250, required: true },
  { id: 'subCategoryLevel', label: 'Level', minWidth: 160 },
  { id: 'experience', label: 'Experience', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 130 },
  { id: 'createdDate', label: 'Created Date', minWidth: 160 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 130 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 160 }
];

export default function DesignationMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.EMP_DESIGNATION);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── RESOLVED ROWS (SOP #16 Standard) ──
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => ({
      ...row,
      status: row.status || 'Active'
    }));
  }, [rows]);

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/hr/designations');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch designations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  useEffect(() => {
    const levels = Array.from(new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', ...rows.map(r => r.subCategoryLevel).filter(Boolean)]));
    const experiences = Array.from(new Set(rows.map(r => r.experience).filter(Boolean)));
    const qualifications = Array.from(new Set(rows.map(r => r.qualification).filter(Boolean)));

    const config = [
      {
        id: 'subCategoryLevel',
        label: 'Level',
        type: 'select',
        options: [{ value: 'All', label: 'All' }, ...levels.map(l => ({ value: l, label: l }))],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'appearInCompetency',
        label: 'Competency Tracking',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'YES', label: 'YES' },
          { value: 'NO', label: 'NO' }
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
          { value: 'In Active', label: 'In Active' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'experience',
        label: 'Experience',
        type: experiences.length > 0 ? 'select' : 'text',
        ...(experiences.length > 0 ? { options: [{ value: 'All', label: 'All' }, ...experiences.map(e => ({ value: e, label: e }))], defaultValue: 'All' } : { placeholder: 'Search by Experience...' })
      },
      {
        id: 'qualification',
        label: 'Min Qualification',
        type: qualifications.length > 0 ? 'select' : 'text',
        ...(qualifications.length > 0 ? { options: [{ value: 'All', label: 'All' }, ...qualifications.map(q => ({ value: q, label: q }))], defaultValue: 'All' } : { placeholder: 'Search by Qualification...' })
      },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, rows]);

  const handleOpenAdd = () => { setSelectedRow(null); setDialogOpen(true); };
  const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    try {
      await axios.delete(`/api/master/hr/designations/${selectedRow.id}`);
      dispatch(openSnackbar({ open: true, message: 'Designation deleted successfully', severity: 'success', variant: 'alert' }));
      fetchDesignations();
      setDeleteDialogOpen(false);
    } catch (err) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', severity: 'error', variant: 'alert' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd,
    'escape': () => setDialogOpen(false)
  });

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconBriefcase}
      title={"Designation Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchDesignations}
          onNew={handleOpenAdd}
          newTooltip={shortcutTooltip('Create New Designation', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          
          exportFilename="Designation_Master"
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
        onDeleteRow={(row) => { setSelectedRow(row); setDeleteDialogOpen(true); }}
      />

      <AddDesignationDialog
        open={dialogOpen}
        handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchDesignations(); }}
        initialData={selectedRow}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Designation"
        message="Are you sure you want to delete this designation?"
        itemName={selectedRow?.designationName}
      />
    </MainCard>
  );
}
