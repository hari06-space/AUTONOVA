import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme, FormControlLabel, Switch } from '@mui/material';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| NPD SEVERITY FMEA - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'severityEffect', label: 'Severity Effect', required: true, maxLength: 100 },
  { field: 'customerEffect', label: 'Customer Effect', required: true, maxLength: 200 },
  { field: 'manufacturingEffect', label: 'Manufacturing Effect', required: true, maxLength: 200 },
  { field: 'rank', label: 'Rank', required: true }
];

const INITIAL_STATE = { severityEffect: '', customerEffect: '', manufacturingEffect: '', rank: '', status: true };

const AddSeverityFmeaDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        severityEffect: initialData.severityEffect || '',
        customerEffect: initialData.customerEffect || '',
        manufacturingEffect: initialData.manufacturingEffect || '',
        rank: initialData.rank !== null && initialData.rank !== undefined ? initialData.rank : '',
        status: initialData.status !== undefined ? initialData.status : true,
        createdBy: initialData.createdBy
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' ? checked : value
    }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        ...formData,
        rank: formData.rank === '' ? null : parseInt(formData.rank, 10),
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin'
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.NPD.SEVERITY_FMEA}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Severity FMEA updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.SEVERITY_FMEA, payload);
        dispatch(openSnackbar({ open: true, message: 'Severity FMEA created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save severity FMEA:', error);
      const errorMsg = error.message || 'Failed to save severity FMEA.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.SEVERITY_FMEA}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Severity FMEA deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete severity FMEA:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete severity FMEA.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Severity FMEA' : 'New Severity FMEA'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="id"
            label="ID"
            value={formData.id || 'Auto Generated'}
            disabled
            InputProps={{ readOnly: true }}
          />

          <BOSTextField
            name="severityEffect"
            label="Severity Effect"
            value={formData.severityEffect}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.severityEffect}
            helperText={errors.severityEffect}
            sx={errorStyle(!!errors.severityEffect)}
          />

          <BOSTextField
            name="customerEffect"
            label="Customer Effect"
            value={formData.customerEffect}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={200}
            error={!!errors.customerEffect}
            helperText={errors.customerEffect}
            sx={errorStyle(!!errors.customerEffect)}
          />

          <BOSTextField
            name="manufacturingEffect"
            label="Manufacturing Effect"
            value={formData.manufacturingEffect}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={200}
            error={!!errors.manufacturingEffect}
            helperText={errors.manufacturingEffect}
            sx={errorStyle(!!errors.manufacturingEffect)}
          />

          <BOSTextField
            name="rank"
            label="Rank"
            type="number"
            value={formData.rank}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            error={!!errors.rank}
            helperText={errors.rank}
            sx={errorStyle(!!errors.rank)}
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
        title="Delete Severity FMEA"
        message="Are you sure you want to delete this Severity FMEA? This action cannot be undone."
        itemName={formData.severityEffect}
      />
    </>
  );
};

AddSeverityFmeaDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddSeverityFmeaDialog;
