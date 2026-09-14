import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Stack, Box, Typography, Button, Tooltip, Avatar, Divider,
  MenuItem, TextField, InputAdornment, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, useTheme
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import {
  BOSFormDialog, BOSTextField, BOSFormSection, BOSAutocomplete,
  getPhotoUrl, BOSStatusField, errorStyle
} from 'ui-component/bos';
import { btnSave, btnDelete, btnCancel, getDialogStyles } from 'ui-component/bos/BOSStyles';
import {
  IconCurrencyRupee, IconUser,
  IconCalendar, IconCheck, IconX
} from '@tabler/icons-react';
// unused imports removed
import useBOSValidation from 'hooks/useBOSValidation';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const formatDateTime = (dateVal) => {
  if (!dateVal || dateVal === '-') return '-';
  try {
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return '-';
    const day   = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year  = dt.getFullYear();
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

const currentYear = new Date().getFullYear();

const parseRejectionHistory = (remarksStr, currentItem) => {
  if (!remarksStr) return [];
  try {
    const parsed = JSON.parse(remarksStr);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.revNo - a.revNo);
    }
  } catch {
    // Legacy or plain text remarks
    return [{
      revNo: 1,
      remarks: remarksStr,
      rejectedBy: currentItem?.updatedBy || 'SYSTEM',
      rejectedAt: currentItem?.updatedDate || ''
    }];
  }
  return [];
};

const INITIAL_FORM = {
  employee:        null,
  encashmentYear:  currentYear,

  // Leave balances
  currentEl:       '',
  currentCl:       '',
  prevYrsEl:       '',
  prevYrsCl:       '',
  // Encashment days
  elEncashment:    '',
  clEncashment:    '',
  // Financials
  basicSalary:     '',
  perDaySalary:    '',
  encashmentAmount:'',
  // Workflow
  remarks:         ''
};

const toNum = (v) => (v !== '' && v != null ? Number(v) : 0);
const fmt2  = (v) => (v != null ? Number(v).toFixed(2) : '0.00');
const fmtCurrency = (v) =>
  v != null && Number(v) > 0
    ? `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : '-';

const LeaveEncashmentVerifiedDialog = ({ open, item, onClose, onSave }) => {
  const dispatch = useDispatch();
  const perms    = usePagePermissions(PAGE_CODES.HRA_LEAVE_ENCASHMENT_VERIFIED);
  const { errors, validate, clearErrors } = useBOSValidation();
  const lookups  = useLookups(['EMPLOYEES']);
  const employees = lookups.employees || [];

  const filterOptions = createFilterOptions({
    limit: 50,
  });

  const [form,            setForm]            = useState(INITIAL_FORM);
  const [,                setLoading]         = useState(false);
  const [actionLoading,   setActionLoading]   = useState(false);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const ds = getDialogStyles(theme, isDark);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComments,   setRejectComments]   = useState('');

  const isEdit     = !!item;
  const isApproved = item?.status === 'APPROVED';
  const isReadonly = true;

  // ── Fetch employee profile when selected ─────────────────────
  useEffect(() => {
    if (form.employee?.id && !isNaN(Number(form.employee.id))) {
      axios.get(`${API_PATHS.HRM.EMPLOYEES}/${form.employee.id}`)
        .then((res) => setEmployeeProfile(res.data))
        .catch(() => setEmployeeProfile(null));
    } else {
      setEmployeeProfile(null);
    }
  }, [form.employee?.id]);

  // ── Auto-compute derived fields ───────────────────────────────
  const computedTotEl       = useMemo(() => toNum(form.currentEl) + toNum(form.prevYrsEl), [form.currentEl, form.prevYrsEl]);
  const computedTotCl       = useMemo(() => toNum(form.currentCl) + toNum(form.prevYrsCl), [form.currentCl, form.prevYrsCl]);
  const computedTotEnc      = useMemo(() => toNum(form.elEncashment) + toNum(form.clEncashment), [form.elEncashment, form.clEncashment]);
  const computedPerDay      = useMemo(() => {
    const basic = toNum(form.basicSalary);
    return basic > 0 ? (basic / 26).toFixed(2) : '';
  }, [form.basicSalary]);
  const computedEncAmount   = useMemo(() => {
    const perDay = toNum(form.perDaySalary) || toNum(computedPerDay);
    return (perDay * computedTotEnc).toFixed(2);
  }, [form.perDaySalary, computedPerDay, computedTotEnc]);

  // ── Populate form on open ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          employee:         item.employee || null,
          encashmentYear:   item.encashmentYear || currentYear,

          currentEl:        item.currentEl != null ? String(item.currentEl) : '',
          currentCl:        item.currentCl != null ? String(item.currentCl) : '',
          prevYrsEl:        item.prevYrsEl != null ? String(item.prevYrsEl) : '',
          prevYrsCl:        item.prevYrsCl != null ? String(item.prevYrsCl) : '',
          elEncashment:     item.elEncashment != null ? String(item.elEncashment) : '',
          clEncashment:     item.clEncashment != null ? String(item.clEncashment) : '',
          basicSalary:      item.basicSalary != null ? String(item.basicSalary) : '',
          perDaySalary:     item.perDaySalary != null ? String(item.perDaySalary) : '',
          encashmentAmount: item.encashmentAmount != null ? String(item.encashmentAmount) : '',
          remarks:          (item.remarks && !item.remarks.includes('"revNo"')) ? item.remarks : ''
        });
      } else {
        setForm(INITIAL_FORM);
      }
      clearErrors();
    }
  }, [open, item, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setForm({ ...INITIAL_FORM, encashmentYear: currentYear });
    setEmployeeProfile(null);
    clearErrors();
  };

  // ── Year options ─────────────────────────────────────────────
  const yearOptions = useMemo(() => {
    const opts = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y++) {
      opts.push({ value: y, label: String(y) });
    }
    return opts;
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const rules = [
      { field: 'employee',        label: 'Employee',             required: true },
      { field: 'encashmentYear',  label: 'Encashment Year',      required: true },
      { field: 'currentEl',       label: 'Current Year EL',      required: true },
      { field: 'currentCl',       label: 'Current Year CL',      required: true },
      { field: 'elEncashment',    label: 'EL Encashment Days',   required: true },
      { field: 'clEncashment',    label: 'CL Encashment Days',   required: true },
      { field: 'basicSalary',     label: 'Basic Salary',         required: true }
    ];
    if (!validate(form, rules)) return;

    setLoading(true);
    try {
      const perDay    = toNum(form.perDaySalary) || toNum(computedPerDay);
      const encAmount = toNum(form.encashmentAmount) || toNum(computedEncAmount);

      const payload = {
        employee:         { id: form.employee.id },
        encashmentYear:   Number(form.encashmentYear),

        currentEl:        toNum(form.currentEl),
        currentCl:        toNum(form.currentCl),
        prevYrsEl:        toNum(form.prevYrsEl),
        prevYrsCl:        toNum(form.prevYrsCl),
        elEncashment:     toNum(form.elEncashment),
        clEncashment:     toNum(form.clEncashment),
        basicSalary:      toNum(form.basicSalary),
        perDaySalary:     perDay,
        encashmentAmount: encAmount,
        remarks:          form.remarks || null
      };

      if (isEdit) {
        await axios.put(`${API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED}/${item.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Record updated successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED, payload);
        dispatch(openSnackbar({ open: true, message: 'Record created successfully!', variant: 'alert', severity: 'success' }));
      }
      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save record', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // ── Workflow actions ──────────────────────────────────────────
  const handleWorkflowAction = async (action, successMsg, customRemarks = null) => {
    if (!item?.id) return;
    setActionLoading(true);
    try {
      const payload = {};
      if (customRemarks) payload.remarks = customRemarks;
      else if (form.remarks) payload.remarks = form.remarks;

      await axios.put(`${API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED}/${item.id}/${action}`, payload);
      dispatch(openSnackbar({ open: true, message: successMsg, variant: 'alert', severity: 'success' }));
      onSave();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || `Failed to ${action}`, variant: 'alert', severity: 'error' }));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Employee profile details ──────────────────────────────────
  const rawPhotoPath = employeeProfile?.employeePhotoUpload || form.employee?.employeePhotoUpload;
  const photoUrl = rawPhotoPath ? getPhotoUrl(rawPhotoPath) : null;

  const handleReject = () => {
    if (!rejectComments.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Rejection comments are mandatory.', variant: 'alert', severity: 'warning' }));
      return;
    }
    handleWorkflowAction('reject', 'Record rejected.', rejectComments.toUpperCase());
    setRejectDialogOpen(false);
  };

  const secondaryActions = isEdit && perms.approval && (item?.status === 'PENDING' || item?.status === 'VERIFIED') ? (
    <Stack direction="row" spacing={1}>
      {item?.status === 'PENDING' && (
        <Tooltip title="Verify this record">
          <Button
            variant="contained"
            sx={btnSave}
            onClick={() => handleWorkflowAction('verify', 'Record verified successfully!')}
            disabled={actionLoading}
            startIcon={<IconCheck size={20} />}
          >
            Verify
          </Button>
        </Tooltip>
      )}
      {item?.status === 'VERIFIED' && (
        <Tooltip title="Approve this record">
          <Button
            variant="contained"
            sx={btnSave}
            onClick={() => handleWorkflowAction('approve', 'Record approved successfully!')}
            disabled={actionLoading}
            startIcon={<IconCheck size={20} />}
          >
            Approve
          </Button>
        </Tooltip>
      )}
      <Tooltip title="Reject this record">
        <Button
          variant="contained"
          sx={btnDelete}
          onClick={() => setRejectDialogOpen(true)}
          disabled={actionLoading}
          startIcon={<IconX size={20} />}
        >
          Reject
        </Button>
      </Tooltip>
    </Stack>
  ) : null;

  return (
    <>
    <BOSFormDialog
      open={open}
      onClose={onClose}
      isViewOnly={true}
      title={isEdit ? 'View Encashment Record' : 'New Leave Encashment Entry'}
      maxWidth="lg"
      secondaryActions={secondaryActions}
    >
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'stretch' }}>

        {/* ── LEFT: Input Form ── */}
        <Box sx={{ flex: 1.4, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* ── Section 1: Basic Info ── */}
          <BOSFormSection title="Encashment Details" icon={<IconCalendar size={20} />}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <BOSAutocomplete
                  label="Employee *"
                  options={employees}
                  getOptionLabel={(opt) => opt?.employeeName || ''}
                  value={form.employee}
                  filterOptions={filterOptions}
                  onChange={(val) => setForm((prev) => ({ ...prev, employee: val }))}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  disabled={isReadonly}
                  placeholder="Select Employee"
                  error={!!errors.employee}
                  helperText={errors.employee}
                  sx={errorStyle(!!errors.employee)}
                />

                <TextField
                  select label="Year *" name="encashmentYear"
                  value={form.encashmentYear} onChange={handleChange}
                  fullWidth disabled={isReadonly} size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 160 }}
                  error={!!errors.encashmentYear} helperText={errors.encashmentYear}
                >
                  {yearOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </BOSFormSection>

          {/* ── Section 2: Leave Balances ── */}
          <BOSFormSection title="Leave Balances" icon={<IconCalendar size={20} />}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {/* Headers */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>Current EL *</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>Current CL *</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>Prev. Years EL</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>Prev. Years CL</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1.5 }}>
                {[
                  { name: 'currentEl', label: 'Current EL *', err: errors.currentEl },
                  { name: 'currentCl', label: 'Current CL *', err: errors.currentCl },
                  { name: 'prevYrsEl', label: 'Prev. EL' },
                  { name: 'prevYrsCl', label: 'Prev. CL' }
                ].map(({ name, err }) => (
                  <BOSTextField key={name}
                    name={name} value={form[name]} onChange={handleChange}
                    type="number" disabled={isReadonly} placeholder="0.00"
                    error={!!err} helperText={err} inputProps={{ step: '0.5', min: 0 }}
                  />
                ))}
              </Box>

              {/* Computed totals */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, bgcolor: 'info.lighter', p: 1.5, borderRadius: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Total EL (computed)</Typography>
                  <Typography variant="h5" color="info.dark" fontWeight={800}>{fmt2(computedTotEl)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>Total CL (computed)</Typography>
                  <Typography variant="h5" color="info.dark" fontWeight={800}>{fmt2(computedTotCl)}</Typography>
                </Box>
              </Box>
            </Stack>
          </BOSFormSection>

          {/* ── Section 3: Encashment & Financials ── */}
          <BOSFormSection title="Encashment & Financial" icon={<IconCurrencyRupee size={20} />}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <BOSTextField
                  label="EL Encashment Days *" name="elEncashment"
                  value={form.elEncashment} onChange={handleChange}
                  type="number" disabled={isReadonly} placeholder="0.00"
                  error={!!errors.elEncashment} helperText={errors.elEncashment}
                  inputProps={{ step: '0.5', min: 0 }}
                />
                <BOSTextField
                  label="CL Encashment Days *" name="clEncashment"
                  value={form.clEncashment} onChange={handleChange}
                  type="number" disabled={isReadonly} placeholder="0.00"
                  error={!!errors.clEncashment} helperText={errors.clEncashment}
                  inputProps={{ step: '0.5', min: 0 }}
                />
              </Stack>

              {/* Total encashment days computed */}
              <Box sx={{ bgcolor: 'warning.lighter', p: 1.2, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Total Encashment Days (computed)</Typography>
                <Typography variant="h5" color="warning.dark" fontWeight={800}>{fmt2(computedTotEnc)}</Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <BOSTextField
                  label="Basic Salary (₹) *" name="basicSalary"
                  value={form.basicSalary} onChange={handleChange}
                  type="number" disabled={isReadonly} placeholder="0.00"
                  error={!!errors.basicSalary} helperText={errors.basicSalary}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
                <BOSTextField
                  label="Per Day Salary (₹)" name="perDaySalary"
                  value={form.perDaySalary || computedPerDay}
                  onChange={handleChange}
                  type="number" disabled={isReadonly || !form.basicSalary}
                  placeholder={computedPerDay || '0.00'}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Stack>

              {/* Computed encashment amount */}
              <Box sx={{ bgcolor: 'success.lighter', p: 1.5, borderRadius: 2, border: '1.5px solid', borderColor: 'success.light' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Encashment Amount (computed)</Typography>
                <Typography variant="h4" color="success.dark" fontWeight={900} sx={{ mt: 0.5 }}>
                  {fmtCurrency(toNum(form.encashmentAmount) || computedEncAmount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  = {fmt2(computedTotEnc)} days × ₹{form.perDaySalary || computedPerDay || 0} per day
                </Typography>
              </Box>

                <BOSTextField
                  label="Remarks" name="remarks"
                  value={form.remarks} onChange={handleChange}
                  multiline rows={2} disabled={true}
                  placeholder={'Remarks from Entry Page'}
                />

              {isEdit && (
                <BOSStatusField
                  isCreate={false} name="status" label="Status"
                  value={item?.status || 'PENDING'} disabled={true} fullWidth
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </BOSStatusField>
              )}

              {/* Alert removed as history is shown on the right */}
            </Stack>
          </BOSFormSection>
        </Box>

        {/* ── RIGHT: Employee Profile Preview ── */}
        <Box sx={{ flex: 0.6, minWidth: 220, display: 'flex', flexDirection: 'column' }}>
          <BOSFormSection title="Employee Profile" icon={<IconUser size={20} />} sx={{ flex: 1 }}>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.2, py: 1.5 }}>
              {employeeProfile || form.employee ? (
                <>
                  {photoUrl ? (
                    <Box
                      component="img"
                      src={photoUrl}
                      alt={employeeProfile?.employeeName || form.employee?.employeeName}
                      sx={{
                        width: 110, height: 140, borderRadius: '12px',
                        border: '3px solid', borderColor: 'primary.light',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)', objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 110, height: 140, borderRadius: '12px',
                        border: '3px solid', borderColor: 'primary.light',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                        fontSize: '3rem', fontWeight: 800,
                        bgcolor: 'primary.lighter', color: 'primary.main'
                      }}
                    >
                      {(employeeProfile?.employeeName || form.employee?.employeeName || '').charAt(0)}
                    </Avatar>
                  )}

                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                    {employeeProfile?.employeeName || form.employee?.employeeName || '-'}
                  </Typography>

                  <Divider sx={{ width: '85%', borderStyle: 'dashed' }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'max-content auto 1fr', rowGap: 1.5, columnGap: 1.2, width: '100%', px: 1, mt: 1 }}>
                    {[
                      { label: 'Emp Code', value: employeeProfile?.oldEmpCode || form.employee?.oldEmpCode || employeeProfile?.empCode || form.employee?.empCode },
                      { label: 'Department', value: employeeProfile?.department?.departmentName || form.employee?.department?.departmentName },
                      { label: 'Designation', value: employeeProfile?.designation?.designationName || form.employee?.designation?.designationName }
                    ].map(({ label, value }) => (
                      <React.Fragment key={label}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'left' }}>{label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary', textAlign: 'left' }}>{value || '-'}</Typography>
                      </React.Fragment>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ py: 4, opacity: 0.5 }}>
                  <IconUser size={50} stroke={1} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>
                    Select an employee to view profile
                  </Typography>
                </Box>
              )}
            </Box>
          </BOSFormSection>



          {/* Rejection History Timeline */}
          {(() => {
            const historyStr = item?.rejectionComment || item?.remarks;
            const hasBeenRejected = historyStr && historyStr.includes('"revNo"');
            if (!hasBeenRejected) return null;
            const history = parseRejectionHistory(historyStr, item);
            if (!history.length) return null;
            return (
              <BOSFormSection
                title={`Rejection History (${history.length} record${history.length > 1 ? 's' : ''})`}
                sx={{ mt: 2 }}
              >
                <Stack spacing={0} sx={{ mt: 1, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', left: 18, top: 8, bottom: 8, width: 2, bgcolor: 'error.light', borderRadius: 1, opacity: 0.4, zIndex: 0 }} />
                  {history.map((entry) => (
                    <Box key={entry.revNo} sx={{
                      display: 'flex', gap: 2, py: 1.5, px: 0.5, position: 'relative', zIndex: 1,
                      '&:not(:last-child)': { borderBottom: '1px dashed', borderColor: 'divider' }
                    }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(244,67,54,0.35)', zIndex: 2, position: 'relative' }}>
                        <Typography sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 800, lineHeight: 1 }}>R-{entry.revNo}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 0.5 }}>
                          <Chip label={`R-${entry.revNo}`} size="small" sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 18, borderRadius: '4px' }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            By: {entry.rejectedByName || entry.rejectedBy || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">{entry.rejectedAt || '-'}</Typography>
                        </Stack>
                        <Box sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light', borderRadius: 1.5, px: 1.5, py: 1 }}>
                          <Stack direction="row" spacing={0.8} alignItems="flex-start">
                            <Typography variant="body2" color="error.dark" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{entry.remarks || '-'}</Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </BOSFormSection>
            );
          })()}
        </Box>
      </Box>
    </BOSFormDialog>

    <Dialog 
      open={rejectDialogOpen} 
      onClose={() => setRejectDialogOpen(false)} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: ds.paper }}
      BackdropProps={{ sx: ds.backdrop }}
    >
      <DialogTitle sx={{ ...ds.titleBar, color: 'error.main' }}>
        Reject Record
      </DialogTitle>
      <DialogContent sx={{ ...ds.content, p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please provide mandatory comments for rejecting this record.
        </Typography>
        <BOSTextField
          fullWidth
          multiline
          rows={4}
          label="Rejection Comments *"
          value={rejectComments}
          onChange={(e) => setRejectComments(e.target.value)}
        />
      </DialogContent>
      <Box sx={ds.footer}>
        <Button onClick={() => setRejectDialogOpen(false)} variant="contained" sx={btnCancel} disabled={actionLoading}>Cancel</Button>
        <Button onClick={handleReject} variant="contained" sx={btnDelete} disabled={actionLoading || !rejectComments.trim()}>
          Submit Rejection
        </Button>
      </Box>
    </Dialog>
  </>);
};

LeaveEncashmentVerifiedDialog.propTypes = {
  open:    PropTypes.bool.isRequired,
  item:    PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave:  PropTypes.func.isRequired
};

export default LeaveEncashmentVerifiedDialog;
