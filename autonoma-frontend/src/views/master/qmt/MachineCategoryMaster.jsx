import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions from 'hooks/usePagePermissions';
import useBOSValidation from 'hooks/useBOSValidation';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  errorStyle,
  BOSTableToolbar,
  getCommonDateFilters,
  matchCommonDateFilters,
  BOSStatusChip,
  BOSRowActions,
  BOSFormSection,
  BOSToggleSwitch,
  BOSStatusField
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  MenuItem,
  TextField,
  Divider
} from '@mui/material';
import { IconEye, IconHistory, IconEdit, IconTrash } from '@tabler/icons-react';

const INITIAL_STATE = {
  id: '',
  category_name: '',
  category_prefix: '',
  seq_no: '',
  oee_required: 'No',
  status: 'Active'
};

const getValidationRules = (rows, isEditing, currentId) => [
  {
    field: 'id',
    label: 'Category ID',
    required: true,
    type: 'number',
    validate: (val) => {
      if (isEditing) return null;
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        return 'Category ID must be a positive integer.';
      }
      if (rows.some(r => Number(r.id) === num)) {
        return 'Category ID already exists.';
      }
      return null;
    }
  },
  {
    field: 'category_name',
    label: 'Category Name',
    required: true,
    minLength: 3,
    validate: (val) => {
      const parsedId = currentId ? Number(currentId) : null;
      if (rows.some(r => r.category_name?.toLowerCase() === val.trim().toLowerCase() && r.id !== parsedId)) {
        return 'Category Name already exists.';
      }
      return null;
    }
  },
  {
    field: 'category_prefix',
    label: 'Category Prefix',
    required: true,
    maxLength: 5,
    validate: (val) => {
      const parsedId = currentId ? Number(currentId) : null;
      const prefix = val.trim().toUpperCase();
      if (rows.some(r => r.category_prefix?.toUpperCase() === prefix && r.id !== parsedId)) {
        return 'Category Prefix already exists.';
      }
      return null;
    }
  },
  {
    field: 'seq_no',
    label: 'Sequence Number',
    required: true,
    type: 'number',
    validate: (val) => {
      const parsedId = currentId ? Number(currentId) : null;
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        return 'Sequence Number must be a positive integer.';
      }
      if (rows.some(r => Number(r.seq_no) === num && r.id !== parsedId)) {
        return 'Sequence Number already exists.';
      }
      return null;
    }
  },
  {
    field: 'oee_required',
    label: 'OEE Req',
    required: true
  },
  {
    field: 'status',
    label: 'Status',
    required: true
  }
];

export default function MachineCategoryMaster() {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const [readOnly, setReadOnly] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const perms = usePagePermissions('M3510');

  // Redux search & filters state
  const globalFilters = useSelector((state) => state.search?.filters) || {};
  const searchQuery = useSelector((state) => state.search?.rawQuery || '');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qmt/machine-categories');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch machine categories:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (perms.read) {
      fetchRows();
    }
  }, [fetchRows, perms.read]);

  useEffect(() => {
    const config = [
      {
        id: 'status',
        label: 'STATUS',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Active', label: 'ACTIVE' },
          { value: 'Inactive', label: 'INACTIVE' }
        ],
        defaultValue: 'Active',
        isStarred: true
      },
      {
        id: 'created_by',
        label: 'CREATED BY',
        type: 'text'
      },
      {
        id: 'updated_by',
        label: 'UPDATED BY',
        type: 'text'
      },
      ...getCommonDateFilters('created_date', 'updated_date')
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({ status: 'Active', created_by: '', updated_by: '' }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setIsEditing(false);
    setReadOnly(false);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      id: String(row.id),
      category_name: row.category_name || '',
      category_prefix: row.category_prefix || '',
      seq_no: String(row.seq_no || ''),
      oee_required: row.oee_required || 'No',
      status: row.status || 'Active'
    });
    setIsEditing(true);
    setReadOnly(false);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenView = (row) => {
    setSelectedRow(row);
    setFormData({
      id: String(row.id),
      category_name: row.category_name || '',
      category_prefix: row.category_prefix || '',
      seq_no: String(row.seq_no || ''),
      oee_required: row.oee_required || 'No',
      status: row.status || 'Active'
    });
    setIsEditing(false);
    setReadOnly(true);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenHistory = (row) => {
    setSelectedRow(row);
    setHistoryOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setReadOnly(false);
  };

  const handleChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearErrors(field);
  };

  const handleSave = async () => {
    if (!validate(formData, getValidationRules(rows, isEditing, formData.id))) return;

    const payload = {
      ...formData,
      id: Number(formData.id),
      category_prefix: formData.category_prefix.trim().toUpperCase()
    };

    try {
      if (isEditing) {
        await axios.put(`/api/qmt/machine-categories/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Updated successfully', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post('/api/qmt/machine-categories', payload);
        dispatch(openSnackbar({ open: true, message: 'Created successfully', variant: 'alert', severity: 'success' }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Save failed:', error);
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        const msg = typeof errorData === 'object' && errorData.message
          ? errorData.message
          : (typeof errorData === 'string' ? errorData : 'Validation failed');
        dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
      } else {
        dispatch(openSnackbar({ open: true, message: 'Failed to save record', variant: 'alert', severity: 'error' }));
      }
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/qmt/machine-categories/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Deleted successfully', variant: 'alert', severity: 'success' }));
      fetchRows();
    } catch (error) {
      console.error('Delete failed:', error);
      const msg = error.response?.data || 'Failed to delete. It might be in use.';
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', severity: 'error' }));
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const onFilter = useCallback((rowsToFilter, filters) => {
    return rowsToFilter.filter((row) => {
      if (filters.status && filters.status !== 'ALL') {
        if (row.status !== filters.status) return false;
      }
      if (!matchCommonDateFilters(row, filters, 'created_date', 'updated_date')) return false;
      if (filters.created_by && filters.created_by.trim() !== '') {
        const val = row.created_by || '';
        if (!val.toLowerCase().includes(filters.created_by.toLowerCase().trim())) return false;
      }
      if (filters.updated_by && filters.updated_by.trim() !== '') {
        const val = row.updated_by || '';
        if (!val.toLowerCase().includes(filters.updated_by.toLowerCase().trim())) return false;
      }
      return true;
    });
  }, []);

  const actionColumn = {
    label: 'Actions',
    align: 'center',
    minWidth: 120,
    render: (row) => {
      const actions = [
        {
          key: 'view',
          icon: <IconEye size={16} />,
          label: 'View Details',
          color: 'info',
          onClick: () => handleOpenView(row)
        },
        {
          key: 'edit',
          icon: <IconEdit size={16} />,
          label: 'Edit',
          color: 'primary',
          disabled: !perms.write,
          onClick: () => handleOpenEdit(row)
        },
        {
          key: 'delete',
          icon: <IconTrash size={16} />,
          label: 'Delete',
          color: 'error',
          disabled: !perms.delete,
          onClick: () => handleDeleteClick(row)
        },
        {
          key: 'history',
          icon: <IconHistory size={16} />,
          label: 'Audit History',
          color: 'secondary',
          onClick: () => handleOpenHistory(row)
        }
      ];
      return <BOSRowActions actions={actions} maxInline={2} />;
    }
  };

  const columns = useMemo(() => [
    { id: 'index', label: 'S.NO', minWidth: 60 },
    { id: 'id', label: 'ID', minWidth: 80, bold: true, color: 'primary.main' },
    { id: 'category_name', label: 'CATEGORY NAME', minWidth: 180 },
    { id: 'oee_required', label: 'OEE REQ', minWidth: 100 },
    { id: 'seq_no', label: 'SEQ NO', minWidth: 90 },
    { id: 'category_prefix', label: 'CATEGORY PREFIX', minWidth: 140 },
    {
      id: 'status',
      label: 'STATUS',
      minWidth: 100,
      render: (row) => <BOSStatusChip status={row.status} />
    },
    { id: 'created_by', label: 'CREATED BY', minWidth: 120 },
    {
      id: 'created_date',
      label: 'CREATED DATE',
      minWidth: 150,
      render: (row) => row.created_date ? new Date(row.created_date).toLocaleString('en-GB') : '-'
    },
    { id: 'updated_by', label: 'UPDATED BY', minWidth: 120 },
    {
      id: 'updated_date',
      label: 'UPDATED DATE',
      minWidth: 150,
      render: (row) => row.updated_date ? new Date(row.updated_date).toLocaleString('en-GB') : '-'
    }
  ], []);

  if (!perms.read) {
    return null;
  }

  return (
    <MainCard content={false} title="Machine Category Master" secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={perms.write ? handleOpenAdd : undefined}
          newLabel="+ New"
          exportData={rows}
          exportFilename="Machine_Category_Master"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="machine-category-master-table"
        columns={columns}
        data={rows}
        loading={loading}
        onFilter={onFilter}
        actionColumn={actionColumn}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        title={readOnly ? 'Category Details' : (isEditing ? 'Edit Machine Category' : 'Add Machine Category')}
        isViewOnly={readOnly}
        onEditClick={perms.write ? () => { setReadOnly(false); setIsEditing(true); } : undefined}
        maxWidth="sm"
      >
        <BOSFormSection title="Category Parameters">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2.5, mt: 1 }}>
            <BOSTextField
              label="Category ID"
              value={formData.id}
              onChange={handleChange('id')}
              error={!!errors.id}
              helperText={errors.id || " "}
              required
              fullWidth
              disabled={isEditing || readOnly}
              sx={errorStyle(!!errors.id)}
              placeholder="e.g. 101"
            />

            <BOSTextField
              label="Category Prefix"
              value={formData.category_prefix}
              onChange={handleChange('category_prefix')}
              error={!!errors.category_prefix}
              helperText={errors.category_prefix || " "}
              required
              fullWidth
              disabled={readOnly}
              sx={errorStyle(!!errors.category_prefix)}
              placeholder="e.g. CNC"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />

            <BOSTextField
              label="Category Name"
              value={formData.category_name}
              onChange={handleChange('category_name')}
              error={!!errors.category_name}
              helperText={errors.category_name || "Category Name must be at least 3 characters"}
              required
              fullWidth
              disabled={readOnly}
              sx={{ gridColumn: 'span 2', ...errorStyle(!!errors.category_name) }}
              placeholder="e.g. CNC Machines"
            />

            <BOSTextField
              label="Sequence Number"
              value={formData.seq_no}
              onChange={handleChange('seq_no')}
              error={!!errors.seq_no}
              helperText={errors.seq_no || " "}
              required
              fullWidth
              disabled={readOnly}
              sx={{ gridColumn: 'span 2', ...errorStyle(!!errors.seq_no) }}
              placeholder="e.g. 1"
            />

            <BOSToggleSwitch
              name="oee_required"
              label="OEE Required"
              value={formData.oee_required}
              onChange={handleChange('oee_required')}
              checkedValue="Yes"
              uncheckedValue="No"
              checkedLabel="Yes"
              uncheckedLabel="No"
              disabled={readOnly}
              sx={{ mt: 1 }}
            />

            <BOSToggleSwitch
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange('status')}
              checkedValue="Active"
              uncheckedValue="Inactive"
              checkedLabel="Active"
              uncheckedLabel="Inactive"
              disabled={readOnly}
              sx={{ mt: 1 }}
            />
          </Box>
        </BOSFormSection>

        {readOnly && selectedRow && (
          <Box sx={{ mt: 2.5, px: 0.5 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Created By</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedRow.created_by || 'Admin'}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {selectedRow.created_date ? new Date(selectedRow.created_date).toLocaleString('en-GB') : '-'}
                </Typography>
              </Box>
              {selectedRow.updated_date && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Last Updated By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedRow.updated_by || 'Admin'}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedRow.updated_date ? new Date(selectedRow.updated_date).toLocaleString('en-GB') : '-'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        content={`Are you sure you want to delete category "${deleteTarget?.category_prefix} - ${deleteTarget?.category_name}"?`}
      />

      {/* ── AUDIT HISTORY TIMELINE DIALOG ── */}
      <BOSFormDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Audit History Timeline"
        isViewOnly={true}
        maxWidth="xs"
      >
        {selectedRow && (
          <Box sx={{ p: 1.5 }}>
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
                  {selectedRow.updated_date && (
                    <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', minHeight: 40 }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>Record Created</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Created by: <strong>{selectedRow.created_by || 'Admin'}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                    {selectedRow.created_date ? new Date(selectedRow.created_date).toLocaleString('en-GB') : '-'}
                  </Typography>
                </Box>
              </Box>

              {selectedRow.updated_date && (
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'secondary.main', mt: 0.5 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>Record Last Updated</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Updated by: <strong>{selectedRow.updated_by || 'Admin'}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {selectedRow.updated_date ? new Date(selectedRow.updated_date).toLocaleString('en-GB') : '-'}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </BOSFormDialog>
    </MainCard>
  );
}
