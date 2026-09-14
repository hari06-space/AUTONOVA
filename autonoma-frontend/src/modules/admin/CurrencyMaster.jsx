import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, MenuItem, useTheme, Button, Tooltip, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { IconCoins, IconDeviceFloppy, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSAutocomplete, btnSave, btnDelete, btnCancel, BOSStatusField, getCommonDateFilters, matchCommonDateFilters, BOSTableToolbar, BOSFormDialog, BOSFormSection } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'currencyCode', label: 'Currency Code', minWidth: 120, bold: true },
  { id: 'currencyName', label: 'Currency Name', minWidth: 150 },
  { id: 'symbol', label: 'Symbol', minWidth: 80 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

const INITIAL = { currencyCode: '', currencyName: '', symbol: '', status: 'Active' };

export default function CurrencyMaster() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.LOG_CURRENCY);
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => setShowForm(true),
    'escape': () => { setShowForm(false); setForm(INITIAL); setSelectedId(null); }
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/admin/currency');
      setRows(data.map((r, i) => ({ ...r, index: i + 1 })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const h = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.currencyCode || !form.currencyName) {
      dispatch(openSnackbar({ open: true, message: 'Please fill required fields.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      return;
    }
    try {
      if (selectedId) await axios.put(`/api/admin/currency/${selectedId}`, form);
      else await axios.post('/api/admin/currency', form);
      
      dispatch(openSnackbar({ open: true, message: `Currency ${selectedId ? 'updated' : 'created'}!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
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
    setDeleteName(row.currencyName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/currency/${deleteId}`);
      dispatch(openSnackbar({ open: true, message: 'Currency deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const config = [{ id: 'currencyCode', label: 'Currency Code', type: 'text', isStarred: true },
      { id: 'currencyName', label: 'Currency Name', type: 'text', isStarred: true },
      { id: 'symbol', label: 'Symbol', type: 'text' },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = typeof resolvedRows !== 'undefined' ? resolvedRows : rows; // handle if resolvedRows exists (like SupplierList)
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.currencyCode && row.currencyCode.toString().toLowerCase().includes(q)) ||
      (row.currencyName && row.currencyName.toString().toLowerCase().includes(q)) ||
      (row.symbol && row.symbol.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);
return (
    <MainCard fullWidth
      icon={IconCoins}
      title={"Currency Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          onNew={() => setShowForm(true)}
          newTooltip={shortcutTooltip('Create New Currency', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Currency_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={rows.length}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => { setForm(row); setSelectedId(row.id); setShowForm(true); }}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setForm(INITIAL); setSelectedId(null); }}
        title={selectedId ? 'Edit Currency' : 'New Currency'}
        onSave={handleSave}
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField name="currencyCode" label="Currency Code" value={form.currencyCode} onChange={h} required placeholder="e.g. USD" />
          <BOSTextField name="currencyName" label="Currency Name" value={form.currencyName} onChange={h} required placeholder="e.g. US Dollar" />
          <BOSTextField name="symbol" label="Symbol" value={form.symbol} onChange={h} placeholder="e.g. $" />
          <BOSStatusField
            isCreate={!selectedId}
            name="status"
            label="Status"
            value={form.status}
            onChange={h}
          />
        </BOSFormSection>
      </BOSFormDialog>
      
      <ConfirmDeleteDialog 
        open={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Currency" 
        message="Are you sure you want to delete this currency?" 
        itemName={deleteName} 
      />
    </MainCard>
  );
}
