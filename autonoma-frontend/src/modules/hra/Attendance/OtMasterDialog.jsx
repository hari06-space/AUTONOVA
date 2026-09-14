import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
  Alert,
  Chip
} from '@mui/material';
import { IconX, IconClock, IconCalendar, IconUser, IconNotes } from '@tabler/icons-react';
import BOSEmployeeAutocomplete from '../../../ui-component/bos/BOSEmployeeAutocomplete';
import axios from 'axios';

const OtMasterDialog = ({ open, onClose, onSaveSuccess, initialData = null }) => {
  const [formData, setFormData] = useState({
    employeeId: null,
    employeeName: '',
    employeeCode: '',
    otDate: new Date().toISOString().split('T')[0],
    hours: 0,
    minutes: 0,
    remarks: ''
  });

  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [shakeFields, setShakeFields] = useState({});

  useEffect(() => {
    if (open) {
      fetchEligibleEmployees();
      if (initialData) {
        const totalMins = initialData.durationMinutes || 0;
        setFormData({
          id: initialData.id,
          employeeId: initialData.employeeId,
          employeeName: initialData.employeeName || '',
          employeeCode: initialData.employeeCode || '',
          otDate: initialData.otDate ? initialData.otDate.split('T')[0] : new Date().toISOString().split('T')[0],
          hours: Math.floor(totalMins / 60),
          minutes: totalMins % 60,
          remarks: initialData.remarks || ''
        });
      } else {
        setFormData({
          employeeId: null,
          employeeName: '',
          employeeCode: '',
          otDate: new Date().toISOString().split('T')[0],
          hours: 1,
          minutes: 0,
          remarks: ''
        });
      }
      setErrorMsg('');
      setValidationErrors({});
      setShakeFields({});
    }
  }, [open, initialData]);

  const fetchEligibleEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await axios.get('/api/hra/ot-master/eligible-employees');
      if (Array.isArray(res.data)) {
        setEligibleEmployees(res.data);
      }
    } catch (err) {
      console.error('Error fetching OT eligible employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const triggerShake = (fieldName) => {
    setShakeFields((prev) => ({ ...prev, [fieldName]: true }));
    setTimeout(() => {
      setShakeFields((prev) => ({ ...prev, [fieldName]: false }));
    }, 500);
  };

  const handleValidate = () => {
    const errors = {};
    if (!formData.employeeId) {
      errors.employeeId = 'Employee selection is required.';
      triggerShake('employeeId');
    }
    if (!formData.otDate) {
      errors.otDate = 'OT Date is required.';
      triggerShake('otDate');
    }
    const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
    if (totalMinutes <= 0) {
      errors.duration = 'Duration must be greater than 0 minutes.';
      triggerShake('duration');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!handleValidate()) return;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const totalMinutes = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
      const payload = {
        id: formData.id || null,
        employeeId: formData.employeeId,
        otDate: formData.otDate,
        durationMinutes: totalMinutes,
        remarks: formData.remarks
      };

      const res = await axios.post('/api/hra/ot-master/save', payload);
      if (res.status === 200 || res.status === 201) {
        if (onSaveSuccess) onSaveSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Error saving OT record:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save OT entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMinutesCalc = (parseInt(formData.hours) || 0) * 60 + (parseInt(formData.minutes) || 0);
  const formattedDurationText = `${String(formData.hours || 0).padStart(2, '0')}h ${String(formData.minutes || 0).padStart(2, '0')}m`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 12 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconClock size={20} color="#2196f3" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {formData.id ? 'Edit Overtime (OT) Record' : 'Create Overtime (OT) Entry'}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <IconX size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* Employee Selection */}
          <Grid item xs={12}>
            <Box
              sx={{
                animation: shakeFields.employeeId ? 'shake 0.4s ease-in-out' : 'none',
                '@keyframes shake': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '20%, 60%': { transform: 'translateX(-6px)' },
                  '40%, 80%': { transform: 'translateX(6px)' }
                }
              }}
            >
              <BOSEmployeeAutocomplete
                label="Select OT-Eligible Employee *"
                value={formData.employeeId}
                onChange={(emp) => {
                  setFormData((p) => ({
                    ...p,
                    employeeId: emp ? emp.id || emp.employeeId : null,
                    employeeName: emp ? emp.employeeName : '',
                    employeeCode: emp ? emp.empCode || emp.oldEmpCode : ''
                  }));
                  setValidationErrors((p) => ({ ...p, employeeId: null }));
                }}
                error={!!validationErrors.employeeId}
                helperText={validationErrors.employeeId || 'Strictly lists employees marked OT Eligible'}
              />
            </Box>
          </Grid>

          {/* OT Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Overtime Date *"
              value={formData.otDate}
              onChange={(e) => {
                setFormData((p) => ({ ...p, otDate: e.target.value }));
                setValidationErrors((p) => ({ ...p, otDate: null }));
              }}
              InputLabelProps={{ shrink: true }}
              error={!!validationErrors.otDate}
              helperText={validationErrors.otDate}
              sx={{
                animation: shakeFields.otDate ? 'shake 0.4s ease-in-out' : 'none'
              }}
            />
          </Grid>

          {/* Time Duration */}
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Hours"
                type="number"
                inputProps={{ min: 0, max: 24 }}
                value={formData.hours}
                onChange={(e) => setFormData((p) => ({ ...p, hours: Math.max(0, parseInt(e.target.value) || 0) }))}
                sx={{ flex: 1 }}
              />
              <Typography sx={{ fontWeight: 700 }}>:</Typography>
              <TextField
                label="Mins"
                type="number"
                inputProps={{ min: 0, max: 59 }}
                value={formData.minutes}
                onChange={(e) => setFormData((p) => ({ ...p, minutes: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) }))}
                sx={{ flex: 1 }}
              />
            </Stack>
            {validationErrors.duration && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {validationErrors.duration}
              </Typography>
            )}
          </Grid>

          {/* Duration Summary Badge */}
          <Grid item xs={12}>
            <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Total Overtime Duration:
              </Typography>
              <Chip
                label={`${formattedDurationText} (${totalMinutesCalc} Minutes)`}
                color={totalMinutesCalc > 0 ? 'primary' : 'default'}
                variant="filled"
                sx={{ fontWeight: 700, fontSize: '13px' }}
              />
            </Box>
          </Grid>

          {/* Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks / Work Reason"
              placeholder="Provide brief details on work performed during overtime..."
              value={formData.remarks}
              onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
          {submitting ? 'Saving...' : formData.id ? 'Update OT Record' : 'Save OT Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtMasterDialog;
