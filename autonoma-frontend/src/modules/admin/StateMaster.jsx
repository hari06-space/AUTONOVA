import { useState, useEffect, useMemo } from 'react';
import {
  Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { IconMapPin, IconPlus } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSStatusField, getCommonDateFilters, BOSTableToolbar, BOSFormDialog, BOSFormSection } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'countryName', label: 'Country Name', minWidth: 200, bold: true },
  { id: 'stateName', label: 'State Name', minWidth: 200 },
  { id: 'stateCode', label: 'State Code', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function StateMaster() {
  const [rows, setRows] = useState([]);
  const perms = usePagePermissions(PAGE_CODES.LOG_STATE);
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });
  const [countries, setCountries] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [formData, setFormData] = useState({
    countryName: '',
    stateName: '',
    stateCode: '',
    status: 'Active'
  });

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/admin/states');
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await axios.get('/api/admin/countries');
      setCountries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchCountries();
  }, []);

  const handleOpen = (row = null) => {
    if (row) {
      setEditId(row.id);
      setFormData({
        countryName: row.countryName || '',
        stateName: row.stateName || '',
        stateCode: row.stateCode || '',
        status: row.status
      });
    } else {
      setEditId(null);
      setFormData({
        countryName: '',
        stateName: '',
        stateCode: '',
        status: 'Active'
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editId) {
        await axios.put(`/api/admin/states/${editId}`, formData);
      } else {
        await axios.post('/api/admin/states', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.stateName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/states/${deleteId}`);
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const config = [{ id: 'stateName', label: 'State Name', type: 'text', isStarred: true },
    { id: 'stateCode', label: 'State Code', type: 'text' },
    { id: 'countryName', label: 'Country Name', type: 'text', isStarred: true },
    ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.stateName && row.stateName.toString().toLowerCase().includes(q)) ||
      (row.stateCode && row.stateCode.toString().toLowerCase().includes(q)) ||
      (row.countryName && row.countryName.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  return (
    <MainCard fullWidth
      icon={IconMapPin}
      title={"State Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New State', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="State_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={rows.length}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? 'Edit State' : 'New State'}
        onSave={handleSubmit}
        isViewOnly={!perms.write}
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            select
            disabled={!perms.write}
            label="Country Name"
            fullWidth
            value={formData.countryName}
            onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
          >

            {countries
              .filter(c => c.status === 'Active')
              .map(c => (
                <MenuItem key={c.id} value={c.country}>{c.country}</MenuItem>
              ))
            }
          </BOSTextField>
          <BOSTextField
            disabled={!perms.write}
            label="State Name"
            fullWidth
            value={formData.stateName}
            onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
          />
          <BOSTextField
            disabled={!perms.write}
            label="State Code"
            fullWidth
            value={formData.stateCode}
            onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
          />
          <BOSStatusField
            isCreate={!editId}
            type="string-in-active-no-space"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={!perms.write}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete State"
        message="Are you sure you want to delete this state?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
