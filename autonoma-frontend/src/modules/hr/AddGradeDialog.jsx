import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Box, useTheme } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSForm from 'hooks/useBOSForm';
import useMasterDataStore from 'store/useMasterDataStore';

// ==============================|| GRADE - PROFESSIONAL TEMPLATE ||============================== //

const AddGradeDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    gradeCode: '',
    gradeName: '',
    sequenceNo: 0,
    status: 'Active'
  });

  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const { data } = await axios.get('/api/master/hr/grades/next-no');
        setFormData(prev => ({ ...prev, gradeCode: data }));
      } catch (e) {
        setFormData(prev => ({ ...prev, gradeCode: 'GRD-001' }));
      }
    };

    if (open) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          gradeCode: initialData.gradeCode || '',
          gradeName: initialData.gradeName || '',
          sequenceNo: initialData.sequenceNo || 0,
          status: initialData.status || 'Active'
        });
        setIsEditing(false);
      } else {
        resetForm();
        fetchNextCode();
        setIsEditing(!readOnly);
      }
    }
  }, [initialData, open, readOnly, setFormData, resetForm]);

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'gradeCode', label: 'Grade Code' },
      { field: 'gradeName', label: 'Grade Name' }
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
        await axios.put(`/api/master/hr/grades/${formData.id}`, formData);
        dispatch(openSnackbar({ open: true, message: 'Grade updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        await axios.post('/api/master/hr/grades', formData);
        dispatch(openSnackbar({ open: true, message: 'Grade created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      }
      useMasterDataStore.getState().invalidate(['GRADES']);
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save grade.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };
 
  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`/api/master/hr/grades/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Grade deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      useMasterDataStore.getState().invalidate(['GRADES']);
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  const handleClear = async () => {
    resetForm();
    try {
      const { data } = await axios.get('/api/master/hr/grades/next-no');
      setFormData(prev => ({ ...prev, gradeCode: data }));
    } catch (e) {
      setFormData(prev => ({ ...prev, gradeCode: 'GRD-001' }));
    }
  };

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={isEditing ? handleClear : null}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Grade' : 'New Grade'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconSettings size={22} color={theme.palette.primary.main} />} title="Grade Configuration">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTextField
              name="gradeCode"
              label="Grade Code"
              value={formData.gradeCode}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.gradeCode}
              sx={errorStyle(errors.gradeCode)}
            />
            <BOSTextField
              name="gradeName"
              label="Grade Name"
              value={formData.gradeName}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.gradeName}
              sx={errorStyle(errors.gradeName)}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="sequenceNo"
              label="Sequence"
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
        title="Delete Grade"
        message="Are you sure you want to delete this grade? This action cannot be undone."
        itemName={formData.gradeName}
      />
    </>
  );
};

AddGradeDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddGradeDialog;
