import { useState, useEffect, useCallback } from 'react';
import { Typography, Stack, MenuItem, useTheme, Button, Grid, Autocomplete, TextField as MuiTextField } from '@mui/material';
import { IconChartPie, IconDeviceFloppy, IconPlus, IconX } from '@tabler/icons-react';
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
  { id: 'segmentName', label: 'Segment Name', minWidth: 150 },
  { id: 'subSegmentCode', label: 'Sub Segment Code', minWidth: 120, bold: true },
  { id: 'subSegmentName', label: 'Sub Segment Name', minWidth: 200 },
  { id: 'subSegmentDescription', label: 'Sub Segment Description', minWidth: 250 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const INITIAL = { segmentName: '', subSegmentCode: '', subSegmentName: '', subSegmentDescription: '', status: 'Active' };

export default function SubSegmentMaster() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.MASTER_SUB_SEGMENT);

  useKeyboardShortcuts({
    'ctrl+n': () => { setForm(INITIAL); setSelectedId(null); setShowForm(true); },
    'escape': () => setShowForm(false)
  });

  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);
  const [segments, setSegments] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const fetchSegments = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/sm/segments');
      setSegments(data.filter(s => s.status === 'Active'));
    } catch (e) { console.error(e); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/sm/sub-segments');
      setRows(data.map((r, i) => ({ ...r, index: i + 1 })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); fetchSegments(); }, [fetchData, fetchSegments]);

  const h = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.subSegmentCode || !form.subSegmentName) {
      dispatch(openSnackbar({ open: true, message: 'Please fill required fields.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      return;
    }
    try {
      if (selectedId) await axios.put(`/api/sm/sub-segments/${selectedId}`, form);
      else await axios.post('/api/sm/sub-segments', form);
      
      dispatch(openSnackbar({ open: true, message: `Sub Segment ${selectedId ? 'updated' : 'created'}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
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
    setDeleteName(row.subSegmentName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/sm/sub-segments/${deleteId}`);
      dispatch(openSnackbar({ open: true, message: 'Sub Segment deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  
  useEffect(() => {
    const config = [{ id: 'subSegmentCode', label: 'Sub Segment Code', type: 'text', isStarred: true },
      { id: 'subSegmentName', label: 'Sub Segment Name', type: 'text', isStarred: true },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

return (
    <MainCard fullWidth
      icon={IconChartPie}
      title={"Sub Segment Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={() => { setForm(INITIAL); setSelectedId(null); setShowForm(true); }}
          newTooltip={shortcutTooltip('Create New Sub Segment', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Sub_Segment_Master"
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
        title={selectedId ? 'Edit Sub Segment' : 'Add New Sub Segment'}
        onSave={handleSave}
        saveLabel={selectedId ? 'Update' : 'Save'}
        hideCollapse
      >
        <BOSFormSection>
          <Autocomplete
            fullWidth
            options={segments.map(s => s.segmentName)}
            value={form.segmentName || null}
            onChange={(e, v) => setForm(p => ({ ...p, segmentName: v || '' }))}
            renderInput={(params) => <BOSTextField {...params} label="Segment Name" required fullWidth />}
          />
          <BOSTextField name="subSegmentCode" label="Sub Segment Code" value={form.subSegmentCode} onChange={h} required fullWidth />
          <BOSTextField name="subSegmentName" label="Sub Segment Name" value={form.subSegmentName} onChange={h} required fullWidth />
          <BOSStatusField
            isCreate={!selectedId}
            name="status"
            label="Status"
            value={form.status}
            onChange={h}
            fullWidth
          />
          <BOSTextField name="subSegmentDescription" label="Sub Segment Description" value={form.subSegmentDescription} onChange={h} multiline rows={3} fullWidth />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sub Segment"
        message="Are you sure you want to delete this sub-segment?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
