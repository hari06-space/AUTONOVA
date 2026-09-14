import { useState, useEffect, useMemo } from 'react';
import { Box, Chip, Autocomplete, TextField } from '@mui/material';
import { IconCreditCard, IconPlus } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import {
  BOSDataTable,
  BOSTextField,
  BOSStatusField,
  getCommonDateFilters,
  errorStyle,
  BOSTableToolbar,
  BOSFormDialog,
  BOSFormSection
} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'type', label: 'Type', minWidth: 140, bold: true },
  { id: 'code', label: 'Code', minWidth: 140 },
  { id: 'description', label: 'Description', minWidth: 320, bold: true },
  { id: 'status', label: 'Status', minWidth: 120 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function PaymentTerms() {
  const dispatch = useDispatch();
  const globalQuery = useSelector((state) => state.search.query);

  useKeyboardShortcuts({
    'ctrl+n': () => handleOpen(),
    escape: () => handleClose()
  });

  const [rows, setRows] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const perms = usePagePermissions(PAGE_CODES.MASTER_PAYMENT_TERMS);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    type: 'PAYMENT',
    description: '',
    status: true
  });

  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/terms-master/types');
      if (Array.isArray(res.data)) {
        setTypeOptions(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch types:', err);
    }
  };

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/terms-master');
      setRows(res.data || []);
      fetchTypes();
    } catch (err) {
      console.error('Failed to fetch terms:', err);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchTypes();
  }, []);

  const availableTypes = useMemo(() => {
    const set = new Set(typeOptions);
    (rows || []).forEach((r) => {
      if (r.type && r.type.trim()) set.add(r.type.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [typeOptions, rows]);

  const handleOpen = (row = null) => {
    setErrors({});
    if (row) {
      setEditId(row.id);
      setFormData({
        code: row.code || row.termCode || '',
        type: row.type || 'PAYMENT',
        description: row.description || row.termName || '',
        status: row.status !== false && row.status !== 0 && row.status !== 'Inactive'
      });
    } else {
      setEditId(null);
      setFormData({
        code: '',
        type: 'PAYMENT',
        description: '',
        status: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is mandatory.';
    }
    if (!formData.type?.trim()) {
      newErrors.type = 'Type is mandatory.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please fill the mandatory fields',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      return;
    }

    try {
      const payload = {
        code: formData.code?.trim() || null,
        type: formData.type?.trim().toUpperCase(),
        description: formData.description?.trim(),
        status: Boolean(formData.status)
      };

      if (editId) {
        await axios.put(`/api/terms-master/${editId}`, payload);
      } else {
        await axios.post('/api/terms-master', payload);
      }

      dispatch(
        openSnackbar({
          open: true,
          message: editId ? 'Terms updated successfully' : 'Terms created successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );

      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'An error occurred while saving.';
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('already exists'))) {
        setErrors({ description: 'Duplicate description for this Type! Please verify.' });
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: String(errorMsg),
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'error',
            close: false
          })
        );
      }
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.description || row.code || 'Term');
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/terms-master/${deleteId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Terms deleted successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: err.response?.data?.message || 'Failed to delete term',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  useEffect(() => {
    const config = [
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        options: availableTypes.map((t) => ({ value: t, label: t })),
        isStarred: true
      },
      { id: 'code', label: 'Code', type: 'text', isStarred: true },
      { id: 'description', label: 'Description', type: 'text', isStarred: true },
      ...getCommonDateFilters('createdDate', 'updatedDate')
    ];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch, availableTypes]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    const formatted = sourceRows.map((row, index) => {
      const isActive = row.status === true || row.status === 1 || row.status === 'Active' || row.status === 'ACTIVE';
      return {
        ...row,
        index: index + 1,
        code: row.code || row.termCode || '-',
        type: row.type || 'PAYMENT',
        description: row.description || row.termName || '-',
        status: isActive ? 'Active' : 'Inactive'
      };
    });

    if (!q) return formatted;
    return formatted.filter(
      (row) =>
        (row.code && row.code.toString().toLowerCase().includes(q)) ||
        (row.type && row.type.toString().toLowerCase().includes(q)) ||
        (row.description && row.description.toString().toLowerCase().includes(q))
    );
  }, [rows, globalQuery]);

  return (
    <MainCard
      fullWidth
      pageCode="M5210"
      icon={IconCreditCard}
      title="Terms Master"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={() => handleOpen()}
          newTooltip={shortcutTooltip('Create New Terms', 'Ctrl + N')}
          hasWritePermission={perms.write}
          exportData={rows}
          exportFilename="Terms_Master"
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
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title={editId ? 'Edit Terms' : 'New Terms'}
        onSave={handleSubmit}
        isViewOnly={!perms.write}
        hideCollapse
      >
        <BOSFormSection>
          <Autocomplete
            freeSolo
            disabled={!perms.write}
            options={availableTypes}
            value={formData.type || ''}
            onChange={(event, newValue) => {
              setFormData((prev) => ({ ...prev, type: (newValue || '').toUpperCase() }));
              if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
            }}
            onInputChange={(event, newInputValue) => {
              setFormData((prev) => ({ ...prev, type: (newInputValue || '').toUpperCase() }));
              if (errors.type) setErrors((prev) => ({ ...prev, type: '' }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Type *"
                fullWidth
                size="small"
                error={!!errors.type}
                helperText={errors.type}
                sx={errorStyle(!!errors.type)}
              />
            )}
          />

          <BOSTextField
            disabled={!perms.write}
            label="Term Code"
            fullWidth
            value={formData.code}
            onChange={(e) => {
              setFormData({ ...formData, code: e.target.value });
              if (errors.code) setErrors((prev) => ({ ...prev, code: '' }));
            }}
            error={!!errors.code}
            helperText={errors.code}
            sx={errorStyle(!!errors.code)}
          />

          <BOSTextField
            disabled={!perms.write}
            label="Description *"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
            }}
            error={!!errors.description}
            helperText={errors.description}
            sx={errorStyle(!!errors.description)}
          />

          <BOSStatusField
            isCreate={!editId}
            type="boolean"
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
        title="Delete Terms"
        message="Are you sure you want to delete this term entry?"
        itemName={deleteName}
      />
    </MainCard>
  );
}
