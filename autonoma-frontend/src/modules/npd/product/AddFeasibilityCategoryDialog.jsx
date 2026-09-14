import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Box, Typography } from '@mui/material';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| NPD FEASIBILITY CATEGORY - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'type', label: 'Type', required: true },
  { field: 'category', label: 'Category', required: true, maxLength: 100 }
];

const INITIAL_STATE = { type: 'FEASIBILITY', category: '', seqNo: '', description: '', status: true };

const AddFeasibilityCategoryDialog = ({ open, handleClose, initialData, readOnly = false }) => {
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
        type: initialData.type || 'FEASIBILITY',
        category: initialData.category || '',
        seqNo: initialData.seqNo !== null && initialData.seqNo !== undefined ? initialData.seqNo : '',
        description: initialData.description || '',
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
        seqNo: formData.seqNo === '' ? null : parseInt(formData.seqNo, 10),
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin'
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.NPD.FEASIBILITY_CATEGORY}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Feasibility Category updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.FEASIBILITY_CATEGORY, payload);
        dispatch(openSnackbar({ open: true, message: 'Feasibility Category created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save feasibility category:', error);
      const errorMsg = error.message || 'Failed to save feasibility category.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.FEASIBILITY_CATEGORY}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Feasibility Category deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete feasibility category:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete feasibility category.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Feasibility Category' : 'New Feasibility Category'}
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
            select
            name="type"
            label="Type"
            value={formData.type}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            error={!!errors.type}
            helperText={errors.type}
            sx={errorStyle(!!errors.type)}
          >
            <MenuItem value="FEASIBILITY">FEASIBILITY</MenuItem>
            <MenuItem value="PRODUCT REVIEW">PRODUCT REVIEW</MenuItem>
          </BOSTextField>

          <BOSTextField
            name="category"
            label="Category"
            value={formData.category}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.category}
            helperText={errors.category}
            sx={errorStyle(!!errors.category)}
          />

          <BOSTextField
            type="number"
            name="seqNo"
            label="Sequence No"
            value={formData.seqNo}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={10}
            error={!!errors.seqNo}
            helperText={errors.seqNo}
            sx={errorStyle(!!errors.seqNo)}
          />

          <BOSTextField
            name="description"
            label="Description/SOP"
            multiline
            minRows={3}
            value={formData.description}
            onChange={handleChange}
            disabled={isViewOnly}
            required
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
        title="Delete Feasibility Category"
        message="Are you sure you want to delete this feasibility category? This action cannot be undone."
        itemName={formData.category}
      />
    </>
  );
};

AddFeasibilityCategoryDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddFeasibilityCategoryDialog;
