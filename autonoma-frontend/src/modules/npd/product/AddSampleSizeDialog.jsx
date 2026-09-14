import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| NPD SAMPLE SIZE - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'size', label: 'Sample Size', required: true, maxLength: 100 }
];

const INITIAL_STATE = { size: '', status: true };

const AddSampleSizeDialog = ({ open, handleClose, initialData, readOnly = false }) => {

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
        size: initialData.size || '',
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
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin'
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.NPD.SAMPLE_SIZE}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Sample Size updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.SAMPLE_SIZE, payload);
        dispatch(openSnackbar({ open: true, message: 'Sample Size created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save sample size:', error);
      const errorMsg = error.message || 'Failed to save sample size.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.SAMPLE_SIZE}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Sample Size deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete sample size:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete sample size.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Sample Size' : 'New Sample Size'}
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
            name="size"
            label="Sample Size"
            value={formData.size}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.size}
            helperText={errors.size}
            sx={errorStyle(!!errors.size)}
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
        title="Delete Sample Size"
        message="Are you sure you want to delete this sample size? This action cannot be undone."
        itemName={formData.size}
      />
    </>
  );
};

AddSampleSizeDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddSampleSizeDialog;
