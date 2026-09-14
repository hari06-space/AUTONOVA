import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, MenuItem } from '@mui/material';
import { IconTags, IconRefresh, IconPlus } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, errorStyle, BOSStatusField, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, btnCancel } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ==============================|| EMPLOYEE TYPE MASTER ||============================== //

const INITIAL_STATE = {
  id: null,
  typeName: '',
  description: '',
  status: 'ACTIVE'
};

const VALIDATION_RULES = [
  { field: 'typeName', label: 'Employee Type', required: true },
  { field: 'description', label: 'Employee Type description', required: true },
  { field: 'status', label: 'Status', required: true }
];

export default function EmployeeType() {
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const perms = usePagePermissions(PAGE_CODES.EMP_TYPE);

  const columns = useMemo(() => [
    { id: 'index', label: 'S.No', minWidth: 60 },
    { id: 'typeName', label: 'Employee Type', bold: true, color: 'primary.main', minWidth: 150 },
    { id: 'description', label: 'Employee Type description', bold: true, minWidth: 250 },
    { id: 'createdBy', label: 'Created User', minWidth: 120 },
    { id: 'createdAt', label: 'Created Date', minWidth: 150 },
    { id: 'updatedBy', label: 'Updated User', minWidth: 120 },
    { id: 'updatedAt', label: 'Updated Date', minWidth: 150 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      render: (row) => (row.status === 'ACTIVE' ? 'Active' : 'Inactive')
    }
  ], []);

  // Dispatch starred filter configuration matching Status
  useEffect(() => {
    const config = [{
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/master/hr/employee-types');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch employee types:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      ...row
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        ...formData
      };

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.index;

      if (formData.id) {
        await axios.put(`/api/master/hr/employee-types/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Employee Type Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/master/hr/employee-types', payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Employee Type Saved Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save employee type';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/master/hr/employee-types/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Employee Type Inactivated Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'
    }));
  }, [rows]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      
      icon={IconTags}
      title={"Employee Type"}
            secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New"
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="Employee_Type"
          hasExportPermission={perms.export}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={handleDelete}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Employee Type"
        fullWidth
        maxWidth="sm"
        onSave={handleSave}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setErrors({});
        }}
        secondaryActions={
          <Button
            variant="contained"
            onClick={() => setDialogOpen(false)}
            sx={btnCancel}
          >
            Cancel
          </Button>
        }
        hasId={!!formData.id}
        onDelete={() => {
          setDeleteTarget(formData);
          setDeleteDialogOpen(true);
        }}
      >
        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <BOSTextField
            name="typeName"
            label="EMPLOYEE TYPE"
            placeholder="Enter employee type"
            value={formData.typeName}
            onChange={handleInputChange}
            required
            fullWidth
            error={!!errors.typeName}
            helperText={errors.typeName}
            sx={errorStyle(!!errors.typeName)}
          />

          <BOSTextField
            name="description"
            label="EMPLOYEE TYPE DESCRIPTION"
            placeholder="Enter description..."
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
            required
            fullWidth
            error={!!errors.description}
            helperText={errors.description}
            sx={errorStyle(!!errors.description)}
          />

          <BOSStatusField
            isCreate={!formData.id}
            type="string-upper"
            name="status"
            label="STATUS"
            value={formData.status}
            onChange={handleInputChange}
            required
            error={!!errors.status}
            helperText={errors.status}
            sx={errorStyle(!!errors.status)}
          />
        </Stack>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Inactivate Employee Type"
        message="Are you sure you want to inactivate this employee type?"
        itemName={deleteTarget?.typeName}
      />
    </MainCard>
  );
}
