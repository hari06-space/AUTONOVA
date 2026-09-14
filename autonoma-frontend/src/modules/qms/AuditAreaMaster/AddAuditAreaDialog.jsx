import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, InputAdornment, IconButton, Box, Typography } from '@mui/material';

import { IconSettings, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import useMasterDataStore from 'store/useMasterDataStore';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';

// ==============================|| AUDIT AREA - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'description', label: 'Description/SOP', required: true },
  { field: 'type', label: 'Type', required: true }
];

const INITIAL_STATE = { type: 'AREA', description: '', isActive: true };

const AddAuditAreaDialog = ({ open, handleClose, initialData, readOnly = false, existingAreas = [] }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        type: initialData.type || 'AREA',
        description: initialData.description || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
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
    if (errors[name]) {
      clearErrors(name);
    }
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    const isDuplicate = existingAreas.some(
      (area) =>
        area.description?.trim().toLowerCase() === formData.description?.trim().toLowerCase() &&
        (area.type || '').trim().toLowerCase() === (formData.type || '').trim().toLowerCase() &&
        area.id !== formData.id
    );

    if (isDuplicate) {
      setErrors({ description: 'Description already exists.' });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Audit Area description already exists.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      return;
    }

    try {
      const payload = {
        ...formData
      };
      delete payload.createdUser;
      delete payload.updatedUser;

      if (formData.id) {
        await axios.put(`${API_PATHS.QMS.AUDIT_AREA}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Audit Area updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.QMS.AUDIT_AREA, payload);
        dispatch(openSnackbar({ open: true, message: 'Audit Area created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      useMasterDataStore.getState().invalidate(['AUDIT_AREA']);
      handleClose(true);
    } catch (error) {
      console.error('Failed to save audit area:', error);
      let errMsg = 'Failed to save audit area.';
      if (typeof error === 'string') {
        errMsg = error;
      } else if (error.response && error.response.data) {
        errMsg = typeof error.response.data === 'string' ? error.response.data : (error.response.data.message || errMsg);
      } else if (error.message) {
        errMsg = error.message;
      }
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
        setErrors({ description: 'Duplicate value! Please check.' });
      }
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_AREA}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Audit Area deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      useMasterDataStore.getState().invalidate(['AUDIT_AREA']);
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete audit area:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Audit Area' : 'Audit Area'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Area Details">
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
           sx={errorStyle(!!errors.type)} >
            <MenuItem value="AREA">AREA</MenuItem>
            <MenuItem value="ZONE">ZONE</MenuItem>
          </BOSTextField>

          <BOSTextField
            name="description"
            label="Description/SOP"
            multiline
            minRows={3}
            value={isListening && interimText ? (formData.description || '') + ' ' + interimText : formData.description || ''}
            onChange={handleChange}
            placeholder="Standard Operating Procedure... (or use mic 🎤)"
            InputLabelProps={{ shrink: true }}
            disabled={isViewOnly}
            disableRichText={true}
            error={!!errors.description}
            helperText={errors.description}
            sx={{ position: 'relative', ...errorStyle(!!errors.description) }}
            InputProps={{
              endAdornment: !isViewOnly && (
                <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isListening && <VoiceWaveform />}
                    <IconButton
                      color={isListening ? 'error' : 'primary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleListening();
                      }}
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                      sx={{
                        animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                        '@keyframes micPulse': {
                          '0%': { transform: 'scale(1)', opacity: 1 },
                          '50%': { transform: 'scale(1.2)', opacity: 0.55 },
                          '100%': { transform: 'scale(1)', opacity: 1 },
                        }
                      }}
                    >
                      {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                    </IconButton>
                  </Box>
                </InputAdornment>
              )
            }}
          />
          {isListening && (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <IconMicrophone size={12} /> Listening… speak now
            </Typography>
          )}

          <BOSStatusField
            isCreate={!formData.id}
            type="boolean"
            name="isActive"
            label="Status"
            value={formData.isActive}
            onChange={handleChange}
            disabled={isViewOnly}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Audit Area"
        message="Are you sure you want to delete this audit area? This action cannot be undone."
        itemName={formData.description}
      />
    </>
  );
};

AddAuditAreaDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool,
  existingAreas: PropTypes.array
};

export default AddAuditAreaDialog;
