import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Stack, Box, Typography, Paper, Button, useTheme } from '@mui/material';
import { IconCalendarEvent, IconInfoCircle, IconAlertCircle, IconSend } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, errorStyle, useBOSForm } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| LEAVE REQUEST - FORM DIALOG ||============================== //

const todayISO = () => new Date().toISOString().slice(0, 10);

const calcDays = (start, end) => {
  if (!start || !end) return 1.0;
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1.0;
    const diffTime = e - s;
    if (diffTime < 0) return 0.0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  } catch {
    return 1.0;
  }
};

const AddHolidayRequestDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    leaveTypeId: '',
    startDate: todayISO(),
    endDate: todayISO(),
    numberOfDays: 1.0,
    reason: ''
  });

  useEffect(() => {
    if (!open) return;
    // Fetch active leave types from Leave Master
    axios.get('/api/master/hr/leaves/active')
      .then((r) => setLeaveTypes(r.data || []))
      .catch(() => setLeaveTypes([]));

    if (initialData) {
      setFormData({
        leaveRequestId: initialData.leaveRequestId,
        requestNo: initialData.requestNo,
        status: initialData.status,
        leaveTypeId: initialData.leaveTypeId || '',
        startDate: initialData.startDate ? String(initialData.startDate).slice(0, 10) : todayISO(),
        endDate: initialData.endDate ? String(initialData.endDate).slice(0, 10) : todayISO(),
        numberOfDays: initialData.numberOfDays || 1.0,
        reason: initialData.reason || ''
      });
      setIsEditing(!readOnly && (initialData.status === 'DRAFT' || initialData.status === 'PENDING' || initialData.status === 'SUBMITTED'));
    } else {
      resetForm();
      setFormData((prev) => ({
        ...prev,
        startDate: todayISO(),
        endDate: todayISO(),
        numberOfDays: 1.0,
        leaveTypeId: ''
      }));
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, setFormData, resetForm]);

  // Recalculate number of days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = calcDays(formData.startDate, formData.endDate);
      setFormData((prev) => {
        if (prev.numberOfDays !== days) {
          return { ...prev, numberOfDays: days };
        }
        return prev;
      });
    }
  }, [formData.startDate, formData.endDate, setFormData]);

  const buildPayload = () => ({
    leaveTypeId: formData.leaveTypeId || null,
    startDate: formData.startDate,
    endDate: formData.endDate,
    numberOfDays: formData.numberOfDays,
    reason: formData.reason || null
  });

  const handleSave = async () => {
    const validations = [
      { field: 'leaveTypeId', label: 'Leave Type' },
      { field: 'startDate', label: 'From Date' },
      { field: 'endDate', label: 'To Date' },
      { field: 'reason', label: 'Reason' }
    ];

    const { isValid, firstMissing } = validate(validations);
    if (!isValid) {
      dispatch(openSnackbar({ open: true, message: `Field ${firstMissing} is mandatory.`, variant: 'alert', severity: 'error', alert: { variant: 'filled' } }));
      return;
    }

    if (formData.numberOfDays <= 0) {
      dispatch(openSnackbar({ open: true, message: 'To Date cannot be before From Date.', variant: 'alert', severity: 'error' }));
      return;
    }

    try {
      let saved;
      if (formData.leaveRequestId) {
        saved = await axios.put(`${API_PATHS.HRM.LEAVE_REQUESTS}/${formData.leaveRequestId}`, buildPayload());
      } else {
        saved = await axios.post(API_PATHS.HRM.LEAVE_REQUESTS, buildPayload());
      }
      dispatch(openSnackbar({ open: true, message: 'Leave request saved.', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data || 'Failed to save request.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Failed to save.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const handleSubmitRequest = async () => {
    if (!formData.leaveRequestId) {
      dispatch(openSnackbar({ open: true, message: 'Save the request before submitting.', variant: 'alert', severity: 'warning' }));
      return;
    }
    try {
      await axios.patch(`${API_PATHS.HRM.LEAVE_REQUESTS}/${formData.leaveRequestId}/submit`);
      dispatch(openSnackbar({ open: true, message: 'Request submitted for approval.', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data || 'Failed to submit.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Failed to submit.', variant: 'alert', severity: 'error' }));
    }
  };

  const handleCancelRequest = async () => {
    if (!formData.leaveRequestId) return;
    try {
      await axios.patch(`${API_PATHS.HRM.LEAVE_REQUESTS}/${formData.leaveRequestId}/cancel`);
      dispatch(openSnackbar({ open: true, message: 'Request cancelled.', variant: 'alert', severity: 'success' }));
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data || 'Failed to cancel.';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : 'Failed to cancel.', variant: 'alert', severity: 'error' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;
  const canSubmit = !!formData.leaveRequestId && formData.status === 'DRAFT';
  const canCancel = !!formData.leaveRequestId && (formData.status === 'DRAFT' || formData.status === 'PENDING' || formData.status === 'SUBMITTED');

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose()}
      onSave={isViewOnly ? null : handleSave}
      onClear={isEditing && !formData.leaveRequestId ? () => { resetForm(); setFormData((p) => ({ ...p, startDate: todayISO(), endDate: todayISO() })); } : null}
      onEditClick={() => setIsEditing(true)}
      title={initialData ? `Leave Request ${formData.requestNo || ''}` : 'New Leave Request'}
      isViewOnly={isViewOnly}
      hasId={!!formData.leaveRequestId}
      maxWidth="md"
      secondaryActions={
        <>
          {canCancel && (
            <Button variant="outlined" color="warning" onClick={handleCancelRequest}>
              Cancel Request
            </Button>
          )}
          {canSubmit && (
            <Button variant="contained" color="primary" startIcon={<IconSend size={16} />} onClick={handleSubmitRequest}>
              Submit for Approval
            </Button>
          )}
        </>
      }

    >
      {formData.status === 'REJECTED' && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light', borderRadius: '8px' }}>
          <Typography variant="subtitle2" color="error.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <IconAlertCircle size={20} /> Request Rejected
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Rejected By: {initialData?.rejectedBy || initialData?.managerName || 'Vertical Head'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: 'error.dark' }}>
            Reason for Rejection: {initialData?.rejectionReason || initialData?.approvalRemarks || 'No remarks provided.'}
          </Typography>
        </Paper>
      )}

      {formData.status === 'APPROVED' && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light', borderRadius: '8px' }}>
          <Typography variant="subtitle2" color="success.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <IconInfoCircle size={20} /> Request Approved
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Approved By: {initialData?.approvedBy || initialData?.managerName || 'Vertical Head'}
          </Typography>
          {(initialData?.approvalRemarks || initialData?.managerRemarks) && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: 'success.dark' }}>
              Comments: {initialData?.approvalRemarks || initialData?.managerRemarks}
            </Typography>
          )}
        </Paper>
      )}

      <BOSFormSection icon={<IconCalendarEvent size={22} color={theme.palette.primary.main} />} title="Leave Request Form">
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <BOSTextField
            name="leaveTypeId"
            label="Leave Type"
            value={formData.leaveTypeId}
            onChange={handleFormChange}
            disabled={isViewOnly}
            select
            required
            error={errors.leaveTypeId}
          >
            {leaveTypes.map((t) => <MenuItem key={t.leaveTypeId} value={t.leaveTypeId}>{t.leaveName} ({t.leaveCode})</MenuItem>)}
            {leaveTypes.length === 0 && <MenuItem value="" disabled>No active leave types configured</MenuItem>}
          </BOSTextField>
          <BOSTextField
            name="numberOfDays"
            label="Number of Days"
            value={formData.numberOfDays}
            disabled
            type="number"
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
          <BOSDatePicker
            name="startDate"
            label="From Date"
            value={formData.startDate}
            onChange={(e) => {
              const newStart = e.target.value;
              handleFormChange(e);
              if (newStart && (!formData.endDate || formData.endDate < newStart)) {
                setFormData((prev) => ({ ...prev, endDate: newStart }));
              }
            }}
            disabled={isViewOnly}
            minDate={(() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              return d;
            })()}
            required
            error={!!errors.startDate}
          />
          <BOSDatePicker
            name="endDate"
            label="To Date"
            value={formData.endDate}
            onChange={handleFormChange}
            disabled={isViewOnly}
            minDate={formData.startDate ? new Date(formData.startDate) : (() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              return d;
            })()}
            required
            error={!!errors.endDate}
          />
        </Box>
        <Box sx={{ mt: 3 }}>
          <BOSTextField
            name="reason"
            label="Reason"
            value={formData.reason}
            onChange={handleFormChange}
            disabled={isViewOnly}
            multiline
            minRows={3}
            required
            error={errors.reason}
            sx={errorStyle(errors.reason)}
          />
        </Box>
      </BOSFormSection>
    </BOSFormDialog>
  );
};

AddHolidayRequestDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddHolidayRequestDialog;
