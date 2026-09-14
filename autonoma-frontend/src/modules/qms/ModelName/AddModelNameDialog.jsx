import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Box, Typography, InputAdornment, IconButton } from '@mui/material';
import { IconClipboardCheck, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField , errorStyle} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

// ==============================|| MODEL NAME - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'modelName', label: 'Model Name', required: true, maxLength: 100 },
  { field: 'status', label: 'Status', required: true }
];

const INITIAL_STATE = {
  modelName: '',
  description: '',
  status: 'ACTIVE'
};

const AddModelNameDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        modelName: initialData.modelName || '',
        description: initialData.description || '',
        status: initialData.status || 'ACTIVE',
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
        id: formData.id,
        modelName: formData.modelName,
        description: formData.description,
        status: formData.status,
        createdAt: formData.createdAt
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.QMS.MODEL_NAME}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Model Name updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.QMS.MODEL_NAME, payload);
        dispatch(openSnackbar({ open: true, message: 'Model Name created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save Model Name:', error);
      const errorMsg = error.response?.data || 'Failed to save Model Name.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.QMS.MODEL_NAME}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Model Name deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete Model Name:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete Model Name.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Model Name details' : 'New Model Name details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconClipboardCheck size={20} color={theme.palette.primary.main} />} title="Model Name Details">
          <BOSTextField
            name="modelName"
            label="Model Name"
            value={formData.modelName}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.modelName}
            helperText={errors.modelName}
           sx={errorStyle(!!errors.modelName)} />

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
            sx={{ position: 'relative' }}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: (formData.description || '').length < 500 ? 'error.main' : 'success.main',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {!isViewOnly ? (
                (formData.description || '').length < 500 ? (
                  <>
                    <IconAlertCircle size={14} /> Min. 500 characters required (Currently {(formData.description || '').length}/500)
                  </>
                ) : (
                  <>
                    <IconInfoCircle size={14} style={{ color: theme.palette.success.main }} /> Met minimum length requirements ({(formData.description || '').length} characters)
                  </>
                )
              ) : (
                <>
                  <IconInfoCircle size={14} style={{ color: theme.palette.info.main }} /> Description length: {(formData.description || '').length} characters
                </>
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {(isListening && interimText ? (formData.description || '') + ' ' + interimText : (formData.description || '')).trim().split(/\s+/).filter(Boolean).length} words | {(isListening && interimText ? (formData.description || '') + ' ' + interimText : (formData.description || '')).length} characters
            </Typography>
          </Box>

          <BOSStatusField
            isCreate={!initialData}
            type="string-upper"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            disabled={isViewOnly}
            required
          />
        </BOSFormSection>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Model Name details"
        message="Are you sure you want to delete this Model Name? This action cannot be undone."
        itemName={formData.modelName}
      />
    </>
  );
};

AddModelNameDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddModelNameDialog;
