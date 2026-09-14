import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBook2 } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { Box, Stack } from '@mui/material';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSTextField, BOSStatusField, getCommonDateFilters, errorStyle, BOSTableToolbar, BOSFormDialog, BOSFormSection, BOSAutocomplete, BOSStatusChip } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import usePagePermissions from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'ledgerName', label: 'Ledger Name', minWidth: 200, bold: true, align: 'left' },
  { id: 'shortName', label: 'Short Name', minWidth: 150 },
  { id: 'printName', label: 'Print Name', minWidth: 200 },
  { id: 'category', label: 'Ledger Category', minWidth: 150 },
  { id: 'taxType', label: 'Tax Type', minWidth: 150 },
  { id: 'taxPercentage', label: 'Tax %', minWidth: 120 },
  { id: 'groupName', label: 'Group Name', minWidth: 150 },
  {
    id: 'isActive',
    label: 'Status',
    minWidth: 100,
    renderCell: (val) => <BOSStatusChip status={val ? 'Active' : 'Inactive'} showIcon={true} />
  },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function TaxLedgerMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });

  const [rows, setRows] = useState([]);
  const [ledgerGroups, setLedgerGroups] = useState([]);
  const perms = usePagePermissions('M9130');

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ledgerName: '',
    shortName: '',
    printName: '',
    category: 'gst',
    taxType: 'gst',
    taxPercentage: '',
    groupId: '',
    isActive: true
  });

  const fetchRows = async () => {
    try {
      const [ledgerRes, groupRes] = await Promise.all([
        axios.get('/api/master/finance/tax-ledger'),
        axios.get('/api/master/finance/ledger-group')
      ]);
      const groups = groupRes.data.map(item => ({ label: item.groupName, value: item.id }));
      setLedgerGroups(groups);

      const rowsWithGroupName = ledgerRes.data.map(row => {
        const matchedGroup = groupRes.data.find(g => g.id === row.groupId);
        return {
          ...row,
          groupName: matchedGroup ? matchedGroup.groupName : row.groupId
        };
      });
      setRows(rowsWithGroupName);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row = null) => {
    setErrors({});
    if (row) {
      setEditId(row.id);
      setFormData({
        ledgerName: row.ledgerName || '',
        shortName: row.shortName || '',
        printName: row.printName || '',
        category: row.category || 'gst',
        taxType: row.taxType || 'gst',
        taxPercentage: row.taxPercentage || '',
        groupId: row.groupId || '',
        isActive: row.isActive
      });
    } else {
      setEditId(null);
      setFormData({
        ledgerName: '',
        shortName: '',
        printName: '',
        category: 'gst',
        taxType: 'gst',
        taxPercentage: '',
        groupId: '',
        isActive: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});
    let currentErrors = {};
    if (!formData.ledgerName?.trim()) currentErrors.ledgerName = 'Ledger Name is required.';
    if (!formData.shortName?.trim()) currentErrors.shortName = 'Short Name is required.';
    if (!formData.category) currentErrors.category = 'Ledger Category is required.';
    if (!formData.groupId) currentErrors.groupId = 'Group is required.';

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill the mandatory fields',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/master/finance/tax-ledger/${editId}`, formData);
      } else {
        await axios.post('/api/master/finance/tax-ledger', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'An error occurred while saving.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.ledgerName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/master/finance/tax-ledger/${deleteId}`);
      setDeleteOpen(false);
      if (editId === deleteId) {
        handleClose();
      }
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClear = () => {
    if (editId) {
      const row = rows.find(r => r.id === editId);
      if (row) handleOpen(row);
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    const config = [
      { id: 'ledgerName', label: 'Ledger Name', type: 'text', isStarred: true },
      { id: 'shortName', label: 'Short Name', type: 'text' },
      { id: 'category', label: 'Ledger Category', type: 'text' },
      { id: 'taxType', label: 'Tax Type', type: 'text' },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.ledgerName && row.ledgerName.toString().toLowerCase().includes(q)) ||
      (row.shortName && row.shortName.toString().toLowerCase().includes(q)) ||
      (row.category && row.category.toString().toLowerCase().includes(q)) ||
      (row.taxType && row.taxType.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  const ledgerTypeOptions = [
    { label: 'GST', value: 'GST' },
    { label: 'TDS', value: 'TDS' },
    { label: 'TCS', value: 'TCS' }
  ];

  const taxTypeOptions = [
    { label: 'CGST', value: 'CGST' },
    { label: 'IGST', value: 'IGST' },
    { label: 'SGST', value: 'SGST' },
    { label: 'TDS', value: 'TDS' },
    { label: 'TCS', value: 'TCS' }
  ];

  return (
    <MainCard fullWidth
      icon={IconBook2}
      title={"Tax Ledger Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New Tax Ledger', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Tax_Ledger"
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
        onPageChange={(newPage) => setPage(newPage)}
        onSizeChange={(newSize) => { setSize(newSize); setPage(0); }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? "Edit Tax Ledger" : "New Tax Ledger"}
        icon={<IconBook2 size={24} />}
        onSave={handleSubmit}
        onClear={handleClear}
        hasId={!!editId}
        onDelete={perms.delete && editId ? () => handleDeleteClick({ id: editId, ledgerName: formData.ledgerName }) : undefined}
        isEdit={!!editId}
        maxWidth="md"
      >
        <BOSFormSection title="General Details">
          <Stack spacing={2} sx={{ mt: 1 }}>
            <BOSTextField
              label="Ledger Name"
              required
              value={formData.ledgerName}
              onChange={(e) => setFormData({ ...formData, ledgerName: e.target.value })}
              error={!!errors.ledgerName}
              helperText={errors.ledgerName}
              inputProps={{ sx: errorStyle(!!errors.ledgerName) }}
            />
            <BOSTextField
              label="Short Name"
              required
              value={formData.shortName}
              onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              error={!!errors.shortName}
              helperText={errors.shortName}
              inputProps={{ sx: errorStyle(!!errors.shortName) }}
            />
            <BOSTextField
              label="Print Name"
              value={formData.printName}
              onChange={(e) => setFormData({ ...formData, printName: e.target.value })}
            />
            <BOSAutocomplete
              label="Ledger Category"
              required
              options={ledgerTypeOptions}
              value={ledgerTypeOptions.find(opt => opt.value === formData.category) || null}
              onChange={(newVal) => setFormData({ ...formData, category: newVal ? newVal.value : '' })}
              error={!!errors.category}
              helperText={errors.category}
            />
            <BOSAutocomplete
              label="Ledger Group"
              required
              options={ledgerGroups}
              value={ledgerGroups.find(opt => opt.value === formData.groupId) || null}
              onChange={(newVal) => setFormData({ ...formData, groupId: newVal ? newVal.value : '' })}
              error={!!errors.groupId}
              helperText={errors.groupId}
            />
            <BOSAutocomplete
              label="Tax Type"
              options={taxTypeOptions}
              value={taxTypeOptions.find(opt => opt.value === formData.taxType) || null}
              onChange={(newVal) => setFormData({ ...formData, taxType: newVal ? newVal.value : '' })}
            />
            <BOSTextField
              label="Tax Percentage"
              type="number"
              value={formData.taxPercentage}
              onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
            />
            <BOSStatusField
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </Stack>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Tax Ledger"
        name={deleteName}
      />
    </MainCard>
  );
}
