import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Stack, Box, Typography, Paper, useTheme } from '@mui/material';
import { IconSettings, IconInfoCircle, IconAlertCircle, IconClock } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField, BOSTimePicker, BOSToggleSwitch } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSForm from 'hooks/useBOSForm';

// ==============================|| SHIFT MASTER - PROFESSONAL DIALOG ||============================== //

const AddShiftMasterDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    shiftCode: '',
    shiftName: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    standardHours: 8.00,
    isNightShift: false,
    isActive: true
  });

  // Dynamic calculation for Night Shift & Standard Hours based on startTime, endTime, breakMinutes
  useEffect(() => {
    if (!formData.startTime || !formData.endTime) return;

    const parseMinutes = (timeStr) => {
      if (!timeStr) return null;
      const clean = String(timeStr).replace('.', ':');
      const parts = clean.split(':');
      if (parts.length < 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const startMins = parseMinutes(formData.startTime);
    const endMins = parseMinutes(formData.endTime);

    if (startMins === null || endMins === null) return;

    // Night Shift rule: Start time >= 22:00 (10 PM, i.e. 1320 mins) OR crosses midnight (endMins < startMins)
    const isNight = startMins >= 1320 || endMins < startMins;

    // Gross working minutes
    let grossMins = 0;
    if (endMins >= startMins) {
      grossMins = endMins - startMins;
    } else {
      // Crosses midnight (e.g. 22:00 to 06:00)
      grossMins = (24 * 60 - startMins) + endMins;
    }

    const breakMins = Number(formData.breakMinutes || 0);
    const netMins = Math.max(0, grossMins - (isNaN(breakMins) ? 0 : breakMins));
    const calculatedHours = Math.round((netMins / 60) * 100) / 100;

    setFormData(prev => {
      if (prev.isNightShift === isNight && prev.standardHours === calculatedHours) {
        return prev;
      }
      return {
        ...prev,
        isNightShift: isNight,
        standardHours: calculatedHours
      };
    });
  }, [formData.startTime, formData.endTime, formData.breakMinutes, setFormData]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          shiftCode: initialData.shiftCode || '',
          shiftName: initialData.shiftName || '',
          startTime: (initialData.startTime || '').replace('.', ':'),
          endTime: (initialData.endTime || '').replace('.', ':'),
          breakMinutes: initialData.breakMinutes !== undefined ? initialData.breakMinutes : 0,
          standardHours: initialData.standardHours !== undefined ? initialData.standardHours : 8.00,
          isNightShift: !!initialData.isNightShift,
          isActive: initialData.isActive !== undefined ? !!initialData.isActive : true
        });
        setIsEditing(false);
      } else {
        resetForm();
        setIsEditing(!readOnly);
      }
    }
  }, [initialData, open, readOnly, setFormData, resetForm]);

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'shiftCode', label: 'Shift Code' },
      { field: 'shiftName', label: 'Shift Name' },
      { field: 'startTime', label: 'Start Time' },
      { field: 'endTime', label: 'End Time' }
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
        await axios.post('/api/hr/shift-master', formData);
        dispatch(openSnackbar({ open: true, message: 'Shift updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      } else {
        await axios.post('/api/hr/shift-master', formData);
        dispatch(openSnackbar({ open: true, message: 'Shift created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      }
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to save shift config.';
      dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`/api/hr/shift-master/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Shift configuration deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete shift config.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
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
        onClear={isEditing && !formData.id ? resetForm : null}
        onEditClick={() => setIsEditing(true)}
        title={formData.id ? 'Edit Shift Config' : 'New Shift Config'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconSettings size={22} color={theme.palette.primary.main} />} title="Shift Identification">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTextField
              name="shiftCode"
              label="Shift Code"
              value={formData.shiftCode}
              onChange={handleFormChange}
              disabled={isViewOnly || !!formData.id}
              required
              error={errors.shiftCode}
              sx={errorStyle(errors.shiftCode)}
              placeholder="e.g. SHIFT1"
            />
            <BOSTextField
              name="shiftName"
              label="Shift Name"
              value={formData.shiftName}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.shiftName}
              sx={errorStyle(errors.shiftName)}
              placeholder="e.g. General Shift"
            />
          </Box>
        </BOSFormSection>

        <BOSFormSection icon={<IconClock size={22} color={theme.palette.primary.main} />} title="Timings & Rules">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTimePicker
              name="startTime"
              label="Start Time"
              value={formData.startTime}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={!!errors.startTime}
              helperText={errors.startTime || 'Shift start time (e.g. 09:00)'}
              format24h={true}
            />
            <BOSTimePicker
              name="endTime"
              label="End Time"
              value={formData.endTime}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={!!errors.endTime}
              helperText={errors.endTime || 'Shift end time (e.g. 18:00)'}
              format24h={true}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="breakMinutes"
              label="Break Duration (Mins)"
              type="number"
              value={formData.breakMinutes}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
            <BOSTextField
              name="standardHours"
              label="Standard Hours"
              type="number"
              value={formData.standardHours}
              onChange={handleFormChange}
              disabled={isViewOnly}
              inputProps={{ step: 0.1 }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3, alignItems: 'center' }}>
            <BOSToggleSwitch
              name="isNightShift"
              value={!!formData.isNightShift}
              onChange={(e) => setFormData(prev => ({ ...prev, isNightShift: e.target.value }))}
              checkedValue={true}
              uncheckedValue={false}
              checkedLabel="Yes"
              uncheckedLabel="No"
              disabled={isViewOnly}
              label="Is Night Shift (Crosses Midnight)"
            />
            <BOSStatusField
              isCreate={!formData.id}
              type="boolean"
              name="isActive"
              label="Status"
              value={formData.isActive}
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
        title="Delete Shift Configuration"
        message="Are you sure you want to delete this shift? This action cannot be undone."
        itemName={`${formData.shiftName} (${formData.shiftCode})`}
      />
    </>
  );
};

AddShiftMasterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddShiftMasterDialog;
