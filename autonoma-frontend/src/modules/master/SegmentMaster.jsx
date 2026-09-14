import { useState, useEffect, useCallback } from 'react';
import { Typography, Stack, MenuItem, useTheme, Button, Grid } from '@mui/material';
import { IconChartBar, IconDeviceFloppy, IconPlus, IconX } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSFormDialog, btnSave, btnDelete, btnCancel, BOSStatusField, getCommonDateFilters, matchCommonDateFilters, BOSTableToolbar, BOSFormSection } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'segmentCode', label: 'Segment Code', minWidth: 120, bold: true },
  { id: 'segmentName', label: 'Segment Name', minWidth: 200 },
  { id: 'segmentDescription', label: 'Segment Description', minWidth: 250 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const INITIAL = { segmentCode: '', segmentName: '', segmentDescription: '', status: 'Active' };

export default function SegmentMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.MASTER_SEGMENT);

  useKeyboardShortcuts({
    'ctrl+n': () => { setForm(INITIAL); setSelectedId(null); setShowForm(true); },
    'escape': () => setShowForm(false)
  });

  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/sm/segments');
      setRows(data.map((r, i) => ({ ...r, index: i + 1 })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const h = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.segmentCode || !form.segmentName) {
      dispatch(openSnackbar({ open: true, message: 'Please fill required fields.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      return;
    }
    try {
      if (selectedId) await axios.put(`/api/sm/segments/${selectedId}`, form);
      else await axios.post('/api/sm/segments', form);
      
      dispatch(openSnackbar({ open: true, message: `Segment ${selectedId ? 'updated' : 'created'}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setShowForm(false);
      setForm(INITIAL);
      setSelectedId(null);
      fetchData();
    } catch (e) { 
      console.error(e); 
      const errorMsg = e.response?.data?.message || e.response?.data || 'An error occurred while saving.';
      dispatch(openSnackbar({ open: true, message: typeof errorMsg === 'string' ? errorMsg : 'Duplicate value or error occurred.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.segmentName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/sm/segments/${deleteId}`);
      dispatch(openSnackbar({ open: true, message: 'Segment deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  
  useEffect(() => {
    const config = [{ id: 'segmentCode', label: 'Segment Code', type: 'text', isStarred: true },
      { id: 'segmentName', label: 'Segment Name', type: 'text', isStarred: true },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

return (
    <MainCard fullWidth
      icon={IconChartBar}
      title={"Segment Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={() => { setForm(INITIAL); setSelectedId(null); setShowForm(true); }}
          newTooltip={shortcutTooltip('Create New Segment', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Segment_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={rows}
        alignAll="center"
        onEditRow={(row) => { setForm(row); setSelectedId(row.id); setShowForm(true); }}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setForm(INITIAL); setSelectedId(null); }}
        title={selectedId ? 'Edit Segment' : 'Add New Segment'}
        onSave={handleSave}
        saveLabel={selectedId ? 'Update' : 'Save'}
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField name="segmentCode" label="Segment Code" value={form.segmentCode} onChange={h} required fullWidth />
          <BOSTextField name="segmentName" label="Segment Name" value={form.segmentName} onChange={h} required fullWidth />
          <BOSTextField name="segmentDescription" label="Segment Description" value={form.segmentDescription} onChange={h} multiline rows={3} fullWidth />
          <BOSStatusField
            isCreate={!selectedId}
            name="status"
            label="Status"
            value={form.status}
            onChange={h}
            fullWidth
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Segment"
        message="Are you sure you want to delete this segment?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
