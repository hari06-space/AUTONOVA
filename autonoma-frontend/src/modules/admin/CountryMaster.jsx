import { useState, useEffect, useMemo } from 'react';
import { 
  Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box
} from '@mui/material';
import { IconWorld, IconPlus } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSToggleSwitch, BOSStatusField, BOSTableToolbar, BOSFormDialog, BOSFormSection, errorStyle, matchCommonDateFilters } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { invalidateMasterDataCache } from 'utils/masterDataCache';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import useBOSValidation from 'hooks/useBOSValidation';

const VALIDATION_RULES = [
  { field: 'countryName', label: 'Country Name', required: true, maxLength: 100 },
  { field: 'countryCode', label: 'Country Code', required: true, maxLength: 50 },
  { field: 'phoneMinLength', label: 'Phone Min Length', required: true, type: 'number' },
  { field: 'phoneMaxLength', label: 'Phone Max Length', required: true, type: 'number' },
  { field: 'isd', label: 'ISD', required: true, maxLength: 50 }
];

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'countryName', label: 'Country Name', minWidth: 200, bold: true },
  { id: 'countryCode', label: 'Country Code', minWidth: 120 },
  { id: 'phoneMinLength', label: 'Phone Min Length', minWidth: 150 },
  { id: 'phoneMaxLength', label: 'Phone Max Length', minWidth: 150 },
  { id: 'isd', label: 'ISD', minWidth: 120 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function CountryMaster() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const [rows, setRows] = useState([]);
  const perms = usePagePermissions(PAGE_CODES.LOG_COUNTRY);
  const { errors, validate, clearErrors } = useBOSValidation();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [formData, setFormData] = useState({
    countryName: '',
    countryCode: '',
    phoneMinLength: '',
    phoneMaxLength: '',
    isd: '',
    status: 'Active'
  });

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/admin/countries');
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row = null) => {
    if (row) {
      setEditId(row.id);
      setFormData({
        countryName: row.countryName || '',
        countryCode: row.countryCode || '',
        phoneMinLength: row.phoneMinLength || '',
        phoneMaxLength: row.phoneMaxLength || '',
        isd: row.isd || '',
        status: row.status
      });
    } else {
      setEditId(null);
      setFormData({
        countryName: '',
        countryCode: '',
        phoneMinLength: '',
        phoneMaxLength: '',
        isd: '',
        status: 'Active'
      });
    }
    clearErrors();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    clearErrors();
  };

  const handleSubmit = async () => {
    const trimmedName = formData.countryName?.trim();
    const normalizedCode = formData.countryCode?.trim()?.toUpperCase();
    const normalizedIsd = formData.isd?.trim();

    const updatedFormData = {
      ...formData,
      countryName: trimmedName,
      countryCode: normalizedCode,
      isd: normalizedIsd
    };

    if (!validate(updatedFormData, VALIDATION_RULES)) return;

    // Custom Validation
    const customErrors = {};
    const minVal = Number(updatedFormData.phoneMinLength);
    const maxVal = Number(updatedFormData.phoneMaxLength);

    if (isNaN(minVal) || minVal <= 0 || !Number.isInteger(minVal)) {
      customErrors.phoneMinLength = "Phone Min Length must be a positive integer *";
    }
    if (isNaN(maxVal) || maxVal <= 0 || !Number.isInteger(maxVal)) {
      customErrors.phoneMaxLength = "Phone Max Length must be a positive integer *";
    }
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
      customErrors.phoneMinLength = "Phone Min Length cannot be greater than Phone Max Length *";
    }

    if (!/^\+\d+$/.test(normalizedIsd)) {
      customErrors.isd = "ISD must follow telephone dial-code format (e.g. +91) *";
    }

    if (Object.keys(customErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...customErrors }));
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/admin/countries/${editId}`, updatedFormData);
      } else {
        await axios.post('/api/admin/countries', updatedFormData);
      }
      invalidateMasterDataCache('/api/admin/countries');
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.countryName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/admin/countries/${deleteId}`);
      invalidateMasterDataCache('/api/admin/countries');
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    'escape': () => handleClose()
  });

  useEffect(() => {
    const config = [
      { id: 'countryName', label: 'Country Name', type: 'text', isStarred: true },
      { id: 'countryIso', label: 'ISD', type: 'text' },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL' },
          { value: 'Active', label: 'ACTIVE' },
          { value: 'Inactive', label: 'INACTIVE' }
        ],
        defaultValue: 'Active',
        isStarred: true
      },
      { id: 'createdDate', label: 'CREATED DATE', type: 'date-range', isStarred: true }
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    
    return sourceRows
      .filter((row) => {
        // 1. Text Search (globalQuery) - matches Country Name, Code, or ISD
        const matchesSearch = !q || 
          (row.countryName && row.countryName.toLowerCase().includes(q)) ||
          (row.countryCode && row.countryCode.toLowerCase().includes(q)) ||
          (row.countryIso && row.countryIso.toLowerCase().includes(q));

        // 2. Country Name filter
        const nameFilter = globalFilters.countryName || '';
        const matchesName = !nameFilter || 
          (row.countryName && row.countryName.toLowerCase().includes(nameFilter.toLowerCase()));

        // 3. ISD (Country ISO) filter
        const isoFilter = globalFilters.countryIso || '';
        const matchesIso = !isoFilter || 
          (row.countryIso && row.countryIso.toLowerCase().includes(isoFilter.toLowerCase()));

        // 4. Status filter
        const statusFilter = globalFilters.status || 'Active'; // Default to Active
        const matchesStatus = statusFilter === 'All' || 
          (statusFilter === 'Active' && row.status === 'Active') ||
          (statusFilter === 'Inactive' && (row.status === 'Inactive' || row.status === 'InActive'));

        // 5. Created Date range filter
        const matchesDate = matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate');

        return matchesSearch && matchesName && matchesIso && matchesStatus && matchesDate;
      })
      .map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery, globalFilters]);

  return (
    <MainCard fullWidth
      icon={IconWorld}
      title={"Country Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New Country', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Country_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        alignAll="center"
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? 'Edit Country' : 'New Country'}
        onSave={handleSubmit}
        isViewOnly={!perms.write}
        hideCollapse
      >
        <BOSFormSection>
          {/* Row 1: Country Name & Country Code */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <BOSTextField
              disabled={!perms.write}
              label="Country Name"
              name="countryName"
              required
              fullWidth
              value={formData.countryName}
              onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
              error={!!errors.countryName}
              helperText={errors.countryName}
              sx={errorStyle(!!errors.countryName)}
            />
            <BOSTextField
              disabled={!perms.write}
              label="Country Code"
              name="countryCode"
              required
              fullWidth
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              error={!!errors.countryCode}
              helperText={errors.countryCode}
              sx={errorStyle(!!errors.countryCode)}
            />
          </Box>

          {/* Row 2: Phone Min Length & Phone Max Length */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <BOSTextField
              disabled={!perms.write}
              label="Phone Min Length"
              name="phoneMinLength"
              type="number"
              required
              fullWidth
              value={formData.phoneMinLength}
              onChange={(e) => setFormData({ ...formData, phoneMinLength: e.target.value })}
              error={!!errors.phoneMinLength}
              helperText={errors.phoneMinLength}
              sx={errorStyle(!!errors.phoneMinLength)}
            />
            <BOSTextField
              disabled={!perms.write}
              label="Phone Max Length"
              name="phoneMaxLength"
              type="number"
              required
              fullWidth
              value={formData.phoneMaxLength}
              onChange={(e) => setFormData({ ...formData, phoneMaxLength: e.target.value })}
              error={!!errors.phoneMaxLength}
              helperText={errors.phoneMaxLength}
              sx={errorStyle(!!errors.phoneMaxLength)}
            />
          </Box>

          {/* Row 3: Country ISO & Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <BOSTextField
              disabled={!perms.write}
              label="ISD"
              name="isd"
              required
              fullWidth
              value={formData.isd}
              onChange={(e) => setFormData({ ...formData, isd: e.target.value })}
              error={!!errors.isd}
              helperText={errors.isd}
              sx={errorStyle(!!errors.isd)}
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
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog 
        open={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Country" 
        message="Are you sure you want to delete this country?" 
        itemName={deleteName} 
      />
    </MainCard>
  );
}
