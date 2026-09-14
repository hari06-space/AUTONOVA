import { useState, useEffect, useMemo } from 'react';
import {
  Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { IconBuilding, IconPlus } from '@tabler/icons-react';
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
  { id: 'code', label: 'City Code', minWidth: 120, bold: true },
  { id: 'cityName', label: 'City Name', minWidth: 200 },
  { id: 'stateName', label: 'State Name', minWidth: 200 },
  { id: 'status', label: 'Status', minWidth: 100, format: (val) => val ? 'Active' : 'Inactive' },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function CityMaster() {
  const [rows, setRows] = useState([]);
  const perms = usePagePermissions(PAGE_CODES.AD_CITY);
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });
  const [states, setStates] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editCode, setEditCode] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    cityName: '',
    stateName: '',
    status: true
  });

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/admin/city');
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await axios.get('/api/admin/states');
      setStates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchStates();
  }, []);

  const handleOpen = (row = null) => {
    if (row) {
      setEditCode(row.code);
      setFormData({
        code: row.code || '',
        cityName: row.cityName || '',
        stateName: row.stateName || '',
        status: row.status
      });
    } else {
      setEditCode(null);
      setFormData({
        code: '',
        cityName: '',
        stateName: '',
        status: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editCode) {
        await axios.put(`/api/admin/city/${editCode}`, formData);
      } else {
        await axios.post('/api/admin/city', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteCode(row.code);
    setDeleteName(row.cityName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/city/${deleteCode}`);
      setDeleteOpen(false);
      setDeleteCode(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const config = [{ id: 'code', label: 'City Code', type: 'text' },
    { id: 'cityName', label: 'City Name', type: 'text', isStarred: true },
    { id: 'stateName', label: 'State Name', type: 'text', isStarred: true },
    ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.cityName && row.cityName.toString().toLowerCase().includes(q)) ||
      (row.code && row.code.toString().toLowerCase().includes(q)) ||
      (row.stateName && row.stateName.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  return (
    <MainCard fullWidth
      icon={IconBuilding}
      title={"City Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New City', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="City_Master"
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
        title={editCode ? 'Edit City' : 'New City'}
        onSave={handleSubmit}
        isViewOnly={!perms.write}
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            disabled={!perms.write || !!editCode}
            label="City Code"
            fullWidth
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <BOSTextField
            disabled={!perms.write}
            label="City Name"
            fullWidth
            value={formData.cityName}
            onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
          />
          <BOSTextField
            select
            disabled={!perms.write}
            label="State Name"
            fullWidth
            value={formData.stateName}
            onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
          >

            {states
              .filter(s => s.status === 'Active')
              .map(s => (
                <MenuItem key={s.id} value={s.stateName}>{s.stateName}</MenuItem>
              ))
            }
          </BOSTextField>
          <BOSStatusField
            isCreate={!editCode}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
            disabled={!perms.write}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete City"
        message="Are you sure you want to delete this city?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
