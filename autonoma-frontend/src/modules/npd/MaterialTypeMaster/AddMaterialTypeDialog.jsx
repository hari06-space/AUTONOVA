import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import { MenuItem, useTheme, Box, Typography, Grid } from '@mui/material';


// ==============================|| MATERIAL TYPE - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'code', label: 'Code', required: true, maxLength: 10 },
  { field: 'typeName', label: 'Type Name', maxLength: 50 },
  { field: 'density', label: 'Density', type: 'number', min: 0 }
];

const INITIAL_STATE = {
  code: '',
  typeName: '',
  description: '',
  density: '',
  status: true
};

const AddMaterialTypeDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);



  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const API_URL = '/api/npd/material-types';

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        typeName: initialData.typeName || '',
        description: initialData.description || '',
        density: initialData.density ?? '',
        status: initialData.status !== undefined ? (initialData.status === 1 || initialData.status === true || String(initialData.status).toUpperCase() === 'ACTIVE' || String(initialData.status) === '1') : true,
        createdBy: initialData.createdBy,
        createdAt: initialData.createdAt
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        code: formData.code,
        typeName: formData.typeName,
        description: formData.description,
        density: formData.density !== '' ? Number(formData.density) : null,
        status: formData.status,
        createdBy: initialData ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: initialData ? (user?.id || 'Admin') : null,
        createdAt: formData.createdAt
      };

      if (initialData) {
        await axios.put(`${API_URL}/${formData.code}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Material Type updated successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post(API_URL, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Material Type created successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save Material Type:', error);
      const errorMsg = error.message || 'Failed to save Material Type.';
      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_URL}/${formData.code}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Material Type deleted!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete Material Type:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete Material Type.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
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
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Material Type' : 'New Material Type'}
        isViewOnly={isViewOnly}
        hasId={!!initialData}
        maxWidth="sm"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="code"
            label="Code"
            value={formData.code}
            onChange={handleChange}
            disabled={isViewOnly || !!initialData}
            required
            maxLength={10}
            error={!!errors.code}
            helperText={errors.code || (!!initialData && 'Code cannot be changed')}
            sx={errorStyle(!!errors.code)}
          />

          <BOSTextField
            name="typeName"
            label="Type Name"
            value={formData.typeName}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={50}
            error={!!errors.typeName}
            helperText={errors.typeName}
            sx={errorStyle(!!errors.typeName)}
          />

          <BOSTextField
            name="description"
            label="Description/SOP"
            multiline
            minRows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Standard Operating Procedure... (or use mic 🎤)"
            InputLabelProps={{ shrink: true }}
            disabled={isViewOnly}
          />

          <BOSTextField
            name="density"
            label="Density"
            type="number"
            value={formData.density}
            onChange={handleChange}
            disabled={isViewOnly}
            error={!!errors.density}
            helperText={errors.density}
            sx={errorStyle(!!errors.density)}
          />

          <BOSStatusField
            isCreate={!initialData}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            disabled={isViewOnly || !initialData}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Material Type"
        message="Are you sure you want to delete this Material Type? This action cannot be undone."
        itemName={formData.code}
      />
    </>
  );
};

AddMaterialTypeDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddMaterialTypeDialog;
