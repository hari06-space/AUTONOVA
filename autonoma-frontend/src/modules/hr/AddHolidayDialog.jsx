import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Stack, Box, Typography, Paper, useTheme, InputAdornment, IconButton } from '@mui/material';
import { IconCalendarEvent, IconInfoCircle, IconAlertCircle, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, errorStyle, useBOSForm } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { API_PATHS } from 'utils/api-constants';
import { parseISO } from 'date-fns';

// ==============================|| HOLIDAY MASTER - FORM DIALOG ||============================== //

const HOLIDAY_TYPES = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'STATE', label: 'State' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'OPTIONAL', label: 'Optional' },
  { value: 'WEEKLY_OFF', label: 'Weekly Off' },
  { value: 'OTHER', label: 'Other' }
];



const todayISO = () => new Date().toISOString().slice(0, 10);

const AddHolidayDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    holidayName: '',
    fromDate: todayISO(),
    holidayType: 'NATIONAL',
    description: ''
  });

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setFormData({
        holidayId: initialData.holidayId,
        holidayName: initialData.holidayName || '',
        fromDate: initialData.fromDate ? String(initialData.fromDate).slice(0, 10) : (initialData.holidayDate ? String(initialData.holidayDate).slice(0, 10) : todayISO()),
        holidayType: initialData.holidayType || 'NATIONAL',
        description: initialData.description || ''
      });
      setIsEditing(false);
    } else {
      resetForm();
      setFormData((prev) => ({ ...prev, fromDate: todayISO() }));
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, setFormData, resetForm]);

  const handleSave = async () => {
    if (saving) return;
    const { isValid, firstMissing } = validate([
      { field: 'holidayName', label: 'Holiday Name' },
      { field: 'fromDate', label: 'Holiday Date' },
      { field: 'holidayType', label: 'Holiday Type' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert', severity: 'error', alert: { variant: 'filled' }
      }));
      return;
    }

    const payload = {
      holidayName: formData.holidayName,
      fromDate: formData.fromDate,
      holidayType: formData.holidayType,
      description: formData.description || null
    };

    setSaving(true);
    try {
      if (formData.holidayId) {
        await axios.put(`${API_PATHS.HRM.HOLIDAYS}/${formData.holidayId}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Holiday updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        await axios.post(API_PATHS.HRM.HOLIDAYS, payload);
        dispatch(openSnackbar({ open: true, message: 'Holiday created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      }
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data || error?.message || 'Failed to save holiday.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Failed to save holiday.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.HRM.HOLIDAYS}/${formData.holidayId}`);
      dispatch(openSnackbar({ open: true, message: 'Holiday deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  const handleClear = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, fromDate: todayISO() }));
  };

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={formData.holidayId ? () => setDeleteOpen(true) : null}
        onClear={isEditing ? handleClear : null}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Holiday' : 'New Holiday'}
        isViewOnly={isViewOnly}
        hasId={!!formData.holidayId}
        maxWidth="md"
        saveButtonDisabled={saving}
      >
        <BOSFormSection icon={<IconCalendarEvent size={22} color={theme.palette.primary.main} />} title="Holiday Details">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTextField
              name="holidayName"
              label="Holiday Name"
              value={formData.holidayName}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.holidayName}
              sx={errorStyle(errors.holidayName)}
            />
            <BOSTextField
              name="holidayType"
              label="Holiday Type"
              value={formData.holidayType}
              onChange={handleFormChange}
              disabled={isViewOnly}
              select
              required
              error={errors.holidayType}
            >
              {HOLIDAY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </BOSTextField>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSDatePicker
              name="fromDate"
              label="Holiday Date"
              value={formData.fromDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={!!errors.fromDate}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="description"
              label="Description/SOP"
              multiline
              minRows={3}
              value={isListening && interimText ? (formData.description || '') + ' ' + interimText : formData.description || ''}
              onChange={handleFormChange}
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
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Holiday"
        message="Are you sure you want to delete this holiday? This action cannot be undone."
        itemName={formData.holidayName}
      />
    </>
  );
};

AddHolidayDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddHolidayDialog;
