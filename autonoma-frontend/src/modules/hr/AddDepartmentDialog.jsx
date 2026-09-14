import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Box, useTheme, InputAdornment, IconButton } from '@mui/material';
import { IconSettings, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSForm from 'hooks/useBOSForm';
import useMasterDataStore from 'store/useMasterDataStore';
import { DEPARTMENT_CATEGORIES } from './DepartmentDetails';

// ==============================|| DEPARTMENT - PROFESSIONAL TEMPLATE ||============================== //

const AddDepartmentDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mailOptions, setMailOptions] = useState([]);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    departmentName: '',
    departmentNo: '',
    ndaCertificate: 'No',
    sequenceNo: 0,
    status: 'Active',
    departmentMailId: '',
    categoryId: '',
    prPrefix: ''
  });

  useEffect(() => {
    if (open) {
      Promise.all([
        axios.get('/api/master/hr/departments').catch(() => ({ data: [] })),
        axios.get('/api/master/hr/employees').catch(() => ({ data: [] }))
      ]).then(([deptRes, empRes]) => {
        const deptMails = Array.isArray(deptRes.data) ? deptRes.data.map(d => d.departmentMailId) : [];
        const empMails = Array.isArray(empRes.data) ? empRes.data.map(e => e.officeMail || e.officeEmail || e.officialEmail || e.email) : [];
        const allMails = Array.from(new Set([...deptMails, ...empMails].filter(m => m && typeof m === 'string' && m.trim()))).sort();
        setMailOptions(allMails);
      });

      if (initialData) {
        setFormData({
          id: initialData.id,
          departmentName: initialData.departmentName || '',
          departmentNo: initialData.departmentNo || '',
          ndaCertificate: initialData.ndaCertificate || 'No',
          sequenceNo: initialData.sequenceNo || 0,
          status: initialData.status || 'Active',
          departmentMailId: initialData.departmentMailId || '',
          categoryId: initialData.categoryId || '',
          prPrefix: initialData.prPrefix || ''
        });
      } else {
        resetForm();
        fetchNextCode();
      }
      setIsEditing(!readOnly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, readOnly]);

  const fetchNextCode = async () => {
    try {
      const [codeRes, seqRes] = await Promise.all([
        axios.get('/api/master/hr/departments/next-code'),
        axios.get('/api/master/hr/departments/next-seq')
      ]);
      setFormData(prev => ({
        ...prev,
        departmentNo: codeRes.data,
        sequenceNo: seqRes.data
      }));
    } catch {
      setFormData(prev => ({ ...prev, departmentNo: 'AUTO', sequenceNo: 0 }));
    }
  };

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'departmentName', label: 'Department Name' },
      { field: 'departmentNo', label: 'Department Number' },
      { field: 'departmentMailId', label: 'Department Mail Id' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    try {
      if (formData.id) {
        await axios.put(`/api/master/hr/departments/${formData.id}`, formData);
        dispatch(openSnackbar({ open: true, message: 'Department updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        await axios.post('/api/master/hr/departments', formData);
        dispatch(openSnackbar({ open: true, message: 'Department created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      }
      useMasterDataStore.getState().invalidate(['DEPARTMENTS']);
      handleClose(true);
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error?.message || 'Failed to save department.');
      dispatch(openSnackbar({ 
        open: true, 
        message: typeof msg === 'string' ? msg : 'Failed to save department.', 
        variant: 'alert', 
        alert: { variant: 'filled' }, 
        severity: 'error' 
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`/api/master/hr/departments/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Department deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      useMasterDataStore.getState().invalidate(['DEPARTMENTS']);
      handleClose(true);
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error?.message || 'Failed to delete.');
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={isEditing ? resetForm : null}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Department' : 'New Department'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconSettings size={22} color={theme.palette.primary.main} />} title="Core Configuration">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTextField
              name="departmentName"
              label="Department Name"
              value={formData.departmentName}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.departmentName}
              sx={errorStyle(errors.departmentName)}
            />
            <BOSTextField
              name="departmentNo"
              label="Department Number"
              value={formData.departmentNo}
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: 'grey.50' }}
              required
              error={errors.departmentNo}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSAutocomplete
              freeSolo
              name="departmentMailId"
              label="Department Mail Id *"
              value={formData.departmentMailId || ''}
              options={mailOptions}
              onChange={(val) => {
                const mailStr = typeof val === 'string' ? val : (val?.label || val?.value || '');
                setFormData(prev => ({ ...prev, departmentMailId: mailStr }));
              }}
              onInputChange={(e, val) => {
                if (e && e.type === 'change') {
                  setFormData(prev => ({ ...prev, departmentMailId: val || '' }));
                }
              }}
              disabled={isViewOnly}
              required
              error={!!errors.departmentMailId}
              helperText={errors.departmentMailId}
              placeholder="Enter new email or select from Job Details"
              sx={errorStyle(!!errors.departmentMailId)}
            />
            <BOSTextField
              select
              name="categoryId"
              label="Department Category"
              value={formData.categoryId || ''}
              onChange={(e) => {
                handleFormChange({
                  target: {
                    name: 'categoryId',
                    value: e.target.value ? parseInt(e.target.value, 10) : ''
                  }
                });
              }}
              disabled={isViewOnly}
              error={errors.categoryId}
              sx={errorStyle(errors.categoryId)}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return "";
                  return DEPARTMENT_CATEGORIES[selected] || selected;
                }
              }}
              InputProps={{
                endAdornment: formData.categoryId ? (
                  <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFormChange({ target: { name: 'categoryId', value: '' } });
                      }}
                      sx={{ color: 'text.secondary', p: 0.25 }}
                    >
                      <IconX size={16} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            >
              {Object.entries(DEPARTMENT_CATEGORIES).map(([idStr, label]) => (
                <MenuItem key={idStr} value={parseInt(idStr, 10)}>
                  {label}
                </MenuItem>
              ))}
            </BOSTextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="prPrefix"
              label="PR Prefix"
              value={formData.prPrefix}
              onChange={handleFormChange}
              disabled={isViewOnly}
              error={errors.prPrefix}
              sx={errorStyle(errors.prPrefix)}
              placeholder="e.g. HRA/"
            />
            <BOSTextField
              select
              name="ndaCertificate"
              label="NDA Required"
              value={formData.ndaCertificate}
              onChange={handleFormChange}
              disabled={isViewOnly}
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </BOSTextField>
            <BOSTextField
              name="sequenceNo"
              label="Org Sequence"
              type="number"
              value={formData.sequenceNo}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
            <BOSStatusField
              isCreate={!initialData}
              type="string-in-active"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
          </Box>
        </BOSFormSection>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
        itemName={formData.departmentName}
      />
    </>
  );
};

AddDepartmentDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddDepartmentDialog;
