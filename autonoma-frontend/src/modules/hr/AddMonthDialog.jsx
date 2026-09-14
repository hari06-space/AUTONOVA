import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Box, useTheme } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, errorStyle, useBOSForm } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { API_PATHS } from 'utils/api-constants';

// ==============================|| MONTH MASTER - FORM DIALOG ||============================== //

const MONTHS = [
  { value: 'JANUARY', label: 'January' },
  { value: 'FEBRUARY', label: 'February' },
  { value: 'MARCH', label: 'March' },
  { value: 'APRIL', label: 'April' },
  { value: 'MAY', label: 'May' },
  { value: 'JUNE', label: 'June' },
  { value: 'JULY', label: 'July' },
  { value: 'AUGUST', label: 'August' },
  { value: 'SEPTEMBER', label: 'September' },
  { value: 'OCTOBER', label: 'October' },
  { value: 'NOVEMBER', label: 'November' },
  { value: 'DECEMBER', label: 'December' }
];

const CYCLE_TYPES = [
  { value: 'STANDARD', label: 'Standard (1st to Month End)' },
  { value: 'CUSTOM', label: 'Custom Cycle' }
];

const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'ATTENDANCE_LOCKED', label: 'Attendance Locked' },
  { value: 'FROZEN', label: 'Frozen' },
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'LOCKED', label: 'Locked' }
];

const todayISO = () => new Date().toISOString().slice(0, 10);

const AddMonthDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    financialYear: '',
    payrollMonth: 'JUNE',
    payrollYear: new Date().getFullYear(),
    startDate: todayISO(),
    endDate: todayISO(),
    attendanceLockDate: '',
    salaryFreezeDate: '',
    payrollLockDate: '',
    payslipPublishDate: '',
    includeSundays: true,
    cycleType: 'STANDARD',
    cycleStartDay: 1,
    cycleEndDay: 30,
    status: 'OPEN'
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setFormData({
        rowId: initialData.rowId,
        financialYear: initialData.financialYear || '',
        payrollMonth: initialData.payrollMonth || 'JUNE',
        payrollYear: initialData.payrollYear || new Date().getFullYear(),
        startDate: initialData.startDate ? String(initialData.startDate).slice(0, 10) : todayISO(),
        endDate: initialData.endDate ? String(initialData.endDate).slice(0, 10) : todayISO(),
        attendanceLockDate: initialData.attendanceLockDate ? String(initialData.attendanceLockDate).slice(0, 10) : '',
        salaryFreezeDate: initialData.salaryFreezeDate ? String(initialData.salaryFreezeDate).slice(0, 10) : '',
        payrollLockDate: initialData.payrollLockDate ? String(initialData.payrollLockDate).slice(0, 10) : '',
        payslipPublishDate: initialData.payslipPublishDate ? String(initialData.payslipPublishDate).slice(0, 10) : '',
        includeSundays: initialData.includeSundays !== undefined ? initialData.includeSundays : true,
        cycleType: initialData.cycleType || 'STANDARD',
        cycleStartDay: initialData.cycleStartDay !== undefined ? initialData.cycleStartDay : 1,
        cycleEndDay: initialData.cycleEndDay !== undefined ? initialData.cycleEndDay : 30,
        status: initialData.status || 'OPEN'
      });
      setIsEditing(false);
    } else {
      resetForm();
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, setFormData, resetForm]);

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'financialYear', label: 'Financial Year' },
      { field: 'payrollMonth', label: 'Payroll Month' },
      { field: 'payrollYear', label: 'Payroll Year' },
      { field: 'startDate', label: 'Start Date' },
      { field: 'endDate', label: 'End Date' },
      { field: 'status', label: 'Status' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert', severity: 'error', alert: { variant: 'filled' }
      }));
      return;
    }

    if (formData.endDate < formData.startDate) {
      dispatch(openSnackbar({
        open: true,
        message: 'End Date must be on or after the Start Date.',
        variant: 'alert', severity: 'error', alert: { variant: 'filled' }
      }));
      return;
    }

    if (formData.cycleType === 'CUSTOM') {
      const startDay = parseInt(formData.cycleStartDay);
      const endDay = parseInt(formData.cycleEndDay);
      if (isNaN(startDay) || startDay < 1 || startDay > 31 || isNaN(endDay) || endDay < 1 || endDay > 31) {
        dispatch(openSnackbar({
          open: true,
          message: 'Cycle days must be between 1 and 31.',
          variant: 'alert', severity: 'error', alert: { variant: 'filled' }
        }));
        return;
      }
    }

    const payload = {
      rowId: formData.rowId || null,
      financialYear: formData.financialYear,
      payrollMonth: formData.payrollMonth,
      payrollYear: parseInt(formData.payrollYear),
      startDate: formData.startDate,
      endDate: formData.endDate,
      attendanceLockDate: formData.attendanceLockDate || null,
      salaryFreezeDate: formData.salaryFreezeDate || null,
      payrollLockDate: formData.payrollLockDate || null,
      payslipPublishDate: formData.payslipPublishDate || null,
      includeSundays: formData.includeSundays === 'true' || formData.includeSundays === true,
      cycleType: formData.cycleType,
      cycleStartDay: formData.cycleType === 'CUSTOM' ? parseInt(formData.cycleStartDay) : 1,
      cycleEndDay: formData.cycleType === 'CUSTOM' ? parseInt(formData.cycleEndDay) : 30,
      status: formData.status
    };

    try {
      await axios.post(API_PATHS.HRM.PROCESS_CONFIGS, payload);
      dispatch(openSnackbar({
        open: true,
        message: formData.rowId ? 'Payroll month updated successfully!' : 'Payroll month created successfully!',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'success'
      }));
      handleClose(true);
    } catch (error) {
      const msg = error?.response?.data || 'Failed to save payroll month.';
      dispatch(openSnackbar({
        open: true,
        message: typeof msg === 'string' ? msg : 'Failed to save payroll month.',
        variant: 'alert', alert: { variant: 'filled' }, severity: 'error'
      }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.HRM.PROCESS_CONFIGS}/${formData.rowId}`);
      dispatch(openSnackbar({ open: true, message: 'Payroll month deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete payroll month.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  const handleClear = () => {
    resetForm();
  };

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={formData.rowId ? () => setDeleteOpen(true) : null}
        onClear={isEditing ? handleClear : null}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Month Master' : 'New Month Master'}
        isViewOnly={isViewOnly}
        hasId={!!formData.rowId}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconCalendarEvent size={22} color={theme.palette.primary.main} />} title="Period & Cycle Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSTextField
              name="financialYear"
              label="Financial Year"
              value={formData.financialYear}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              placeholder="e.g. 2026-2027"
              error={errors.financialYear}
              sx={errorStyle(errors.financialYear)}
            />
            <BOSTextField
              name="payrollMonth"
              label="Payroll Month"
              value={formData.payrollMonth}
              onChange={handleFormChange}
              disabled={isViewOnly}
              select
              required
              error={errors.payrollMonth}
            >
              {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </BOSTextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="payrollYear"
              label="Calendar Year"
              type="number"
              value={formData.payrollYear}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={errors.payrollYear}
              sx={errorStyle(errors.payrollYear)}
            />
            <BOSTextField
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleFormChange}
              disabled={isViewOnly}
              select
              required
              error={errors.status}
            >
              {STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </BOSTextField>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="cycleType"
              label="Cycle Type"
              value={formData.cycleType}
              onChange={handleFormChange}
              disabled={isViewOnly}
              select
              required
            >
              {CYCLE_TYPES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </BOSTextField>
            <BOSTextField
              name="includeSundays"
              label="Include Sundays"
              value={String(formData.includeSundays)}
              onChange={(e) => handleFormChange({ target: { name: 'includeSundays', value: e.target.value === 'true' } })}
              disabled={isViewOnly}
              select
              required
            >
              <MenuItem value="true">Yes</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </BOSTextField>
          </Box>

          {formData.cycleType === 'CUSTOM' && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
              <BOSTextField
                name="cycleStartDay"
                label="Cycle Start Day"
                type="number"
                value={formData.cycleStartDay}
                onChange={handleFormChange}
                disabled={isViewOnly}
                inputProps={{ min: 1, max: 31 }}
              />
              <BOSTextField
                name="cycleEndDay"
                label="Cycle End Day"
                type="number"
                value={formData.cycleEndDay}
                onChange={handleFormChange}
                disabled={isViewOnly}
                inputProps={{ min: 1, max: 31 }}
              />
            </Box>
          )}
        </BOSFormSection>

        <BOSFormSection icon={<IconCalendarEvent size={22} color={theme.palette.primary.main} />} title="Important Schedule Dates">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSDatePicker
              name="startDate"
              label="Start Date"
              value={formData.startDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={!!errors.startDate}
            />
            <BOSDatePicker
              name="endDate"
              label="End Date"
              value={formData.endDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
              required
              error={!!errors.endDate}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSDatePicker
              name="attendanceLockDate"
              label="Attendance Lock Date"
              value={formData.attendanceLockDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
            <BOSDatePicker
              name="salaryFreezeDate"
              label="Salary Freeze Date"
              value={formData.salaryFreezeDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 3 }}>
            <BOSDatePicker
              name="payrollLockDate"
              label="Payroll Lock Date"
              value={formData.payrollLockDate}
              onChange={handleFormChange}
              disabled={isViewOnly}
            />
            <BOSDatePicker
              name="payslipPublishDate"
              label="Payslip Publish Date"
              value={formData.payslipPublishDate}
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
        title="Delete Payroll Month"
        message="Are you sure you want to delete this payroll month configuration? This action cannot be undone."
        itemName={`${formData.payrollMonth} ${formData.payrollYear}`}
      />
    </>
  );
};

AddMonthDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddMonthDialog;
