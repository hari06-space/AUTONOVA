import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Stack, Box, Typography, Button, Tooltip, Avatar, Divider, MenuItem, TextField, Chip } from '@mui/material';
import { BOSFormDialog, BOSTextField, BOSFormSection, BOSAutocomplete, BOSEmployeeAutocomplete, getPhotoUrl, BOSStatusField , errorStyle} from 'ui-component/bos';
import { IconUser, IconCash, IconEraser, IconDeviceFloppy, IconLock } from '@tabler/icons-react';
import { btnSave, btnClear, btnWarning } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const INITIAL_FORM = {
  employee: null,
  year: currentYear,
  month: currentMonth,
  penaltyReason: '',
  penaltyAmount: ''
};

const PenaltyDialog = ({ open, item, onClose, onSave, onShortClose }) => {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_PAYROLL_PENALTY);
  const { errors, validate, clearErrors } = useBOSValidation();
  const lookups = useLookups(['EMPLOYEES']);
  const employees = lookups.employees || [];

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  // Fetch full employee profile when selected
  useEffect(() => {
    if (form.employee?.id) {
      axios.get(`${API_PATHS.HRM.EMPLOYEES}/${form.employee.id}`)
        .then(res => {
          setEmployeeProfile(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch employee profile:', err);
          setEmployeeProfile(null);
        });
    } else {
      setEmployeeProfile(null);
    }
  }, [form.employee?.id]);

  const isEdit = !!item;
  const isClosed = item?.status === 'CLOSED';
  const isShortClosed = item?.status === 'SHORT_CLOSED';
  const isReadonly = isClosed || isShortClosed || !perms.write;

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          employee: item.employee || null,
          year: item.year || currentYear,
          month: item.month || currentMonth,
          penaltyReason: item.penaltyReason || '',
          penaltyAmount: item.penaltyAmount != null ? String(item.penaltyAmount) : ''
        });
      } else {
        setForm(INITIAL_FORM);
      }
      clearErrors();
    }
  }, [open, item, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'penaltyReason' ? value.toUpperCase() : value }));
  };

  const handleClear = () => {
    setForm({
      ...INITIAL_FORM,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    });
    setEmployeeProfile(null);
    clearErrors();
  };

  const handleSave = async () => {
    const rules = [
      { field: 'employee', label: 'Employee Name', required: true },
      { field: 'year', label: 'Year', required: true },
      { field: 'month', label: 'Month', required: true },
      { field: 'penaltyReason', label: 'Penalty Reason', required: true, minLength: 20 },
      { field: 'penaltyAmount', label: 'Penalty Amount', required: true }
    ];
    if (!validate(form, rules)) return;

    setLoading(true);
    try {
      const payload = {
        employee: { id: form.employee.id },
        year: Number(form.year),
        month: Number(form.month),
        penaltyReason: form.penaltyReason,
        penaltyAmount: Number(form.penaltyAmount)
      };

      if (isEdit) {
        await axios.put(`${API_PATHS.HRA.PENALTIES}/${item.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Penalty updated successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.HRA.PENALTIES, payload);
        dispatch(openSnackbar({ open: true, message: 'Penalty created successfully!', variant: 'alert', severity: 'success' }));
      }
      onSave();
    } catch (error) {
      console.error('Failed to save penalty:', error);
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save penalty', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // Build month and year dropdown options
  const monthOptions = MONTH_NAMES.slice(1).map((name, idx) => ({ value: idx + 1, label: name }));
  const yearOptions = useMemo(() => {
    const opts = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
      opts.push({ value: y, label: String(y) });
    }
    return opts;
  }, []);

  // Selected employee photo URL
  const rawPhotoPath = employeeProfile?.employeePhotoUpload || form.employee?.employeePhotoUpload;
  const photoUrl = rawPhotoPath ? getPhotoUrl(rawPhotoPath) : null;

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={isReadonly ? undefined : handleSave}
      onClear={isReadonly ? undefined : handleClear}
      isViewOnly={isReadonly}
      title={isEdit ? (isReadonly ? 'View Penalty' : 'Edit Penalty') : 'Create New Penalty'}
      maxWidth="md"
      secondaryActions={
        isEdit && item?.status === 'OPEN' && perms.write ? (
          <Tooltip title="Short close this penalty">
            <Button
              variant="contained"
              onClick={() => onShortClose(item)}
              sx={btnWarning}
            >
              Short Close
            </Button>
          </Tooltip>
        ) : null
      }
    >
      <Stack spacing={2.5}>
        {/* ── TOP: Compact Employee Profile Header ── */}
        {(employeeProfile || form.employee) && (() => {
          const activeName = employeeProfile?.employeeName || form.employee?.employeeName || 'Employee';
          const activeCode = employeeProfile?.empCode || form.employee?.empCode || '';
          const dept = employeeProfile?.department?.departmentName || employeeProfile?.departmentName || form.employee?.department?.departmentName || form.employee?.departmentName || '—';
          const desig = employeeProfile?.designation?.designationName || employeeProfile?.designationName || form.employee?.designation?.designationName || form.employee?.designationName || '—';
          const rawPhoto = employeeProfile?.employeePhotoUpload || employeeProfile?.photoUpload || employeeProfile?.photo || employeeProfile?.employeePhoto ||
                           form.employee?.employeePhotoUpload || form.employee?.photoUpload || form.employee?.photo || form.employee?.photoPath;
          const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : null;

          return (
            <Box sx={{
              bgcolor: 'grey.100',
              borderRadius: '14px',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={photoUrl}
                  alt={activeName}
                  sx={{
                    width: 52, height: 52,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    bgcolor: 'primary.lighter',
                    color: 'primary.dark'
                  }}
                >
                  {!photoUrl && (activeName?.charAt(0)?.toUpperCase() || <IconUser size={26} />)}
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {activeName}
                    </Typography>
                    {activeCode && (
                      <Chip
                        label={`ID: ${activeCode}`}
                        size="small"
                        sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {[dept !== '—' && dept, desig !== '—' && desig].filter(Boolean).join(' • ') || 'Employee Profile'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })()}

        {/* ── Form Inputs Grid ── */}
        <Stack spacing={2}>
          {/* Employee Name */}
          <BOSEmployeeAutocomplete
            label="Employee Name"
            required
            options={employees}
            value={form.employee}
            onChange={(val) => setForm(prev => ({ ...prev, employee: val }))}
            disabled={isReadonly}
            placeholder="Select Employee"
            error={!!errors.employee}
            helperText={errors.employee}
            size="small"
          />

          {/* Year & Month row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              select
              label="Year"
              required
              name="year"
              value={form.year}
              onChange={handleChange}
              fullWidth
              disabled={isReadonly}
              size="small"
              InputLabelProps={{ shrink: true }}
            >
              {yearOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Month"
              required
              name="month"
              value={form.month}
              onChange={handleChange}
              fullWidth
              disabled={isReadonly}
              size="small"
              InputLabelProps={{ shrink: true }}
            >
              {monthOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Penalty Amount */}
          <BOSTextField
            label="Penalty Amount"
            required
            name="penaltyAmount"
            value={form.penaltyAmount}
            onChange={handleChange}
            type="number"
            disabled={isReadonly}
            placeholder="Enter The Amount"
            error={!!errors.penaltyAmount}
            helperText={errors.penaltyAmount}
            InputProps={{ startAdornment: <Typography sx={[ { mr: 1, fontWeight: 700, color: 'text.secondary' }, errorStyle(!!errors.penaltyAmount) ]}>₹</Typography> }}
          />

          {/* Penalty Reason */}
          <BOSTextField
            label="Penalty Reason"
            required
            name="penaltyReason"
            value={form.penaltyReason}
            onChange={handleChange}
            multiline
            rows={2}
            disabled={isReadonly}
            placeholder="Enter The Reason"
            error={!!errors.penaltyReason}
            helperText={
              isReadonly ? null : (
                <Stack direction="row" justifyContent="space-between" sx={[ { mt: 0.5 }, errorStyle(!!errors.penaltyReason) ]}>
                  <Typography
                    variant="caption"
                    color={
                      (form.penaltyReason || '').length < 20
                        ? 'error.main'
                        : 'success.main'
                    }
                    sx={{ fontWeight: 'bold' }}
                  >
                    {(form.penaltyReason || '').length < 20
                      ? `⚠️ Minimum characters required (${(form.penaltyReason || '').length} / 20)`
                      : `✅ Valid length (${(form.penaltyReason || '').length} characters)`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Length: {(form.penaltyReason || '').length} characters
                  </Typography>
                </Stack>
              )
            }
          />

          {isEdit && (
            <BOSStatusField
              isCreate={false}
              name="status"
              label="Status"
              value={item.status || 'OPEN'}
              disabled={true}
              fullWidth
            >
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
              <MenuItem value="SHORT_CLOSED">Short Closed</MenuItem>
            </BOSStatusField>
          )}

          {isReadonly && item?.shortCloseRemarks && (
            <BOSTextField
              label="Short Close Remarks"
              value={item.shortCloseRemarks}
              InputProps={{ readOnly: true }}
              multiline
              rows={2}
              sx={{ bgcolor: 'warning.lighter', '& .MuiInputBase-input': { fontWeight: 700, color: 'warning.dark' } }}
            />
          )}
        </Stack>
      </Stack>
    </BOSFormDialog>
  );
};

PenaltyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onShortClose: PropTypes.func
};

export default PenaltyDialog;
