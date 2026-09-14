import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Box, Typography } from '@mui/material';
import { IconSitemap } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField, BOSToggleSwitch, errorStyle} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| PROCESS MASTER - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'processName', label: 'Process Name', required: true, maxLength: 150 },
  { field: 'processCd', label: 'Process Code', required: true, maxLength: 25 }
];

const INITIAL_STATE = {
  processName: '',
  processCd: '',
  description: '',
  processProcedureRequired: false,
  status: true
};

const AddProcessDialog = ({ open, handleClose, initialData, readOnly = false }) => {
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
        processName: initialData.processName || '',
        processCd: initialData.processCd || '',
        description: initialData.description || '',
        processProcedureRequired: initialData.processProcedureRequired !== undefined ? initialData.processProcedureRequired : false,
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
        id: formData.id,
        processName: formData.processName,
        processCd: formData.processCd,
        description: formData.description,
        processProcedureRequired: formData.processProcedureRequired,
        status: formData.status,
        createdBy: formData.id ? formData.createdBy : (user?.name || 'Admin'),
        updatedBy: user?.name || 'Admin'
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.NPD.PROCESS}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Process updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.PROCESS, payload);
        dispatch(openSnackbar({ open: true, message: 'Process created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save process:', error);
      const errorMsg = error.message || 'Failed to save process.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.PROCESS}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Process deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete process:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete process.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? (isViewOnly ? 'View Process' : 'Edit Process') : 'New Process'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection title="Process Details" icon={<IconSitemap size={20} color={theme.palette.primary.main} />}>
          <BOSTextField
            name="processName"
            label="Process Name"
            value={formData.processName}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={150}
            error={!!errors.processName}
            helperText={errors.processName}
            sx={errorStyle(!!errors.processName)}
          />

          <BOSTextField
            name="processCd"
            label="Process Code"
            value={formData.processCd}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={25}
            error={!!errors.processCd}
            helperText={errors.processCd}
            sx={errorStyle(!!errors.processCd)}
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

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 2, alignItems: 'center' }}>
            <BOSToggleSwitch
              name="processProcedureRequired"
              value={!!formData.processProcedureRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, processProcedureRequired: e.target.value }))}
              checkedValue={true}
              uncheckedValue={false}
              checkedLabel="Yes"
              uncheckedLabel="No"
              disabled={isViewOnly}
              label="Process Procedure Required"
            />
            <BOSStatusField
              isCreate={!initialData}
              type="boolean"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleChange}
              disabled={isViewOnly || !initialData}
              sx={{ mt: 0 }}
            />
          </Box>
        </BOSFormSection>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Process"
        message="Are you sure you want to delete this process? This action cannot be undone."
        itemName={formData.processName}
      />
    </>
  );
};

AddProcessDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddProcessDialog;
