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

// ==============================|| NPD SAMPLE FREQUENCY - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'frequency', label: 'Sample Frequency', required: true, maxLength: 100 }
];

const INITIAL_STATE = { frequency: '', status: true };

const AddSampleFrequencyDialog = ({ open, handleClose, initialData, readOnly = false }) => {

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
        frequency: initialData.frequency || '',
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
        await axios.put(`${API_PATHS.NPD.SAMPLE_FREQUENCY}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Sample Frequency updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.SAMPLE_FREQUENCY, payload);
        dispatch(openSnackbar({ open: true, message: 'Sample Frequency created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save sample frequency:', error);
      const errorMsg = error.message || 'Failed to save sample frequency.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.SAMPLE_FREQUENCY}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Sample Frequency deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete sample frequency:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete sample frequency.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Sample Frequency' : 'New Sample Frequency'}
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
            name="frequency"
            label="Sample Frequency"
            value={formData.frequency}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.frequency}
            helperText={errors.frequency}
            sx={errorStyle(!!errors.frequency)}
          />

          <BOSStatusField
            isCreate={!initialData}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            disabled={isViewOnly || !initialData}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sample Frequency"
        message="Are you sure you want to delete this sample frequency? This action cannot be undone."
        itemName={formData.frequency}
      />
    </>
  );
};

AddSampleFrequencyDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddSampleFrequencyDialog;
