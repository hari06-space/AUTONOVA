import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Stack, Box, Typography, Avatar, MenuItem, Chip
} from '@mui/material';
import {
  BOSFormDialog, BOSTextField, BOSFormSection, BOSEmployeeAutocomplete,
  getPhotoUrl, BOSStatusField
} from 'ui-component/bos';
import {
  IconUser, IconCalendar, IconCoins, IconAlertCircle
} from '@tabler/icons-react';
import useBOSValidation from 'hooks/useBOSValidation';
import useLookups from 'hooks/useLookups';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';

const currentYear = new Date().getFullYear();

const parseRejectionHistory = (remarksStr, currentItem) => {
  if (!remarksStr) return [];
  try {
    const parsed = JSON.parse(remarksStr);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.revNo - a.revNo);
    }
  } catch {
    return [{
      revNo: 1,
      remarks: remarksStr,
      rejectedBy: currentItem?.rejectedBy || currentItem?.updatedBy || 'SYSTEM',
      rejectedAt: currentItem?.rejectedDate || currentItem?.updatedDate || ''
    }];
  }
  return [];
};

const INITIAL_FORM = {
  employee:                null,

  // Available Leave Balances (fetched from Leave Master)
  el:                      0,
  cl:                      0,
  sl:                      0,
  al:                      0,
  pl:                      0,

  // Encashment Days requested by user
  requestedEncashmentDays: '',

  // Workflow
  remarks:                 ''
};

const toNum = (v) => (v !== '' && v != null ? Number(v) : 0);
const fmt2  = (v) => (v != null && !isNaN(v) ? Number(v).toFixed(2) : '0.00');

const LeaveEncashmentEntryDialog = ({ open, item, onClose, onSave }) => {
  const { user }  = useAuth();
  const dispatch = useDispatch();
  const perms    = usePagePermissions(PAGE_CODES.HRA_LEAVE_ENCASHMENT_ENTRY);
  const { errors, setErrors, validate, clearErrors } = useBOSValidation();
  const lookups  = useLookups(['EMPLOYEES']);
  const employees = lookups.employees || [];

  const [form,            setForm]            = useState(INITIAL_FORM);
  const [,                setLoading]         = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [fetchingLeaves,  setFetchingLeaves]  = useState(false);

  const isEdit     = !!item;
  // Enforce read-only if it is already submitted AND not rejected, or if user lacks write perms
  const isReadonly = (isEdit && item?.status !== 'REJECTED') || !perms.write;

  const isSelfCare = useMemo(() => {
    return window.location.pathname.includes('self-care') || window.location.pathname.includes('employee-self-care');
  }, []);

  const loggedInEmp = useMemo(() => {
    if (!user) return null;

    if (user.employee && typeof user.employee === 'object') {
      return user.employee;
    }

    const rawEmpId = user.empId || user.employeeId || user.userCredential?.employee?.id || (user.id && !isNaN(Number(user.id)) ? user.id : null);
    const numericEmpId = (rawEmpId && !isNaN(Number(rawEmpId))) ? Number(rawEmpId) : null;
    const oldCode = user.oldEmpCode || user.employee?.oldEmpCode || user.username || '';
    const code = user.empCode || user.employee?.empCode || user.username || '';
    const userName = user.employeeName || user.name || user.username || '';

    if (employees && employees.length > 0) {
      const match = employees.find((e) =>
        (numericEmpId && Number(e.id) === numericEmpId) ||
        (oldCode && (String(e.oldEmpCode) === String(oldCode) || String(e.empCode) === String(oldCode))) ||
        (code && (String(e.empCode) === String(code) || String(e.oldEmpCode) === String(code))) ||
        (userName && String(e.employeeName).toLowerCase() === String(userName).toLowerCase())
      );
      if (match) return match;
    }

    return {
      id: numericEmpId,
      employeeName: userName,
      oldEmpCode: oldCode,
      empCode: code,
      departmentName: user.departmentName || user.department?.departmentName || '',
      designationName: user.designationName || user.designation?.designationName || ''
    };
  }, [employees, user]);

  // ── Fetch Employee Profile & Leave Master Balances when Employee is selected ──
  const fetchEmployeeData = useCallback(async (empId) => {
    if (!empId || isNaN(Number(empId))) {
      setEmployeeProfile(null);
      return;
    }

    // 1. Fetch Profile
    axios.get(`${API_PATHS.HRM.EMPLOYEES}/${empId}`)
      .then((res) => setEmployeeProfile(res.data))
      .catch(() => setEmployeeProfile(null));

    // 2. Fetch Leave Master Balances
    setFetchingLeaves(true);
    try {
      const res = await axios.get('/api/hr/leave-masters');
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      const empMaster = list.find((lm) => String(lm.employeeId || lm.employee?.id) === String(empId));

      if (empMaster) {
        setForm((prev) => ({
          ...prev,
          el: empMaster.el ?? empMaster.currentEl ?? 0,
          cl: empMaster.cl ?? empMaster.currentCl ?? 0,
          sl: empMaster.sl ?? 0,
          al: empMaster.al ?? 0,
          pl: empMaster.pl ?? 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch leave master balance:', err);
    } finally {
      setFetchingLeaves(false);
    }
  }, []);

  useEffect(() => {
    if (form.employee?.id && !isEdit) {
      fetchEmployeeData(form.employee.id);
    }
  }, [form.employee?.id, isEdit, fetchEmployeeData]);

  // ── Computed Total Available Encashment (Sum of all 5 available leave types) ──
  const totalAvailableEncashment = useMemo(() => {
    return toNum(form.el) + toNum(form.cl) + toNum(form.sl) + toNum(form.al) + toNum(form.pl);
  }, [form.el, form.cl, form.sl, form.al, form.pl]);

  // ── Populate form on open ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      if (item) {
        const elVal = item.currentEl ?? item.el ?? 0;
        const clVal = item.currentCl ?? item.cl ?? 0;
        const slVal = item.sl ?? 0;
        const alVal = item.al ?? 0;
        const plVal = item.pl ?? 0;
        const encashVal = item.elEncashment ?? item.totEncashment ?? item.encashmentDays ?? '';

        setForm({
          employee:                item.employee || null,
          el:                      elVal,
          cl:                      clVal,
          sl:                      slVal,
          al:                      alVal,
          pl:                      plVal,
          requestedEncashmentDays: encashVal != null ? String(encashVal) : '',
          remarks:                 (item.remarks && !item.remarks.includes('"revNo"')) ? item.remarks : ''
        });

        if (item.employee?.id) {
          fetchEmployeeData(item.employee.id);
        }
      } else {
        const defaultEmp = (isSelfCare && loggedInEmp) ? loggedInEmp : null;
        setForm({
          ...INITIAL_FORM,
          employee: defaultEmp
        });
        if (defaultEmp?.id) {
          fetchEmployeeData(defaultEmp.id);
        }
      }
      clearErrors();
    }
  }, [open, item, isSelfCare, loggedInEmp, clearErrors, fetchEmployeeData]);

  // Auto-sync logged-in employee when lookups finish loading in Self-Care
  useEffect(() => {
    if (open && !isEdit && isSelfCare && loggedInEmp?.id && (!form.employee || form.employee.id !== loggedInEmp.id)) {
      setForm((prev) => ({ ...prev, employee: loggedInEmp }));
      fetchEmployeeData(loggedInEmp.id);
    }
  }, [open, isEdit, isSelfCare, loggedInEmp, form.employee?.id, fetchEmployeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setForm(INITIAL_FORM);
    setEmployeeProfile(null);
    clearErrors();
  };

  // ── Save / Resubmit ──────────────────────────────────────────
  const handleSave = async () => {
    const rules = [
      { field: 'employee',                label: 'Employee',                required: true },
      { field: 'requestedEncashmentDays', label: 'Encashment Days Taken',   required: true }
    ];

    if (!validate(form, rules)) return;

    const requested = toNum(form.requestedEncashmentDays);

    if (requested <= 0) {
      setErrors((prev) => ({ ...prev, requestedEncashmentDays: 'Encashment days must be greater than 0' }));
      return;
    }

    if (requested % 1 !== 0) {
      setErrors((prev) => ({
        ...prev,
        requestedEncashmentDays: 'Encashment days taken must be a whole number (no decimals allowed)'
      }));
      return;
    }

    if (requested > totalAvailableEncashment) {
      setErrors((prev) => ({
        ...prev,
        requestedEncashmentDays: `Encashment days taken (${requested}) cannot exceed total available leave balance (${fmt2(totalAvailableEncashment)} days)`
      }));
      dispatch(openSnackbar({
        open: true,
        message: `Requested encashment days (${requested}) exceeds total available leave balance (${fmt2(totalAvailableEncashment)} days)!`,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employee:         { id: form.employee.id },
        encashmentYear:   currentYear,

        currentEl:        toNum(form.el),
        currentCl:        toNum(form.cl),
        sl:               toNum(form.sl),
        al:               toNum(form.al),
        pl:               toNum(form.pl),

        prevYrsEl:        0,
        prevYrsCl:        0,

        elEncashment:     requested,
        clEncashment:     0,

        basicSalary:      0,
        perDaySalary:     0,
        encashmentAmount: 0,

        remarks:          form.remarks || null
      };

      if (isEdit) {
        await axios.put(`${API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED}/${item.id}`, payload);
        const isResubmit = item?.status === 'REJECTED';
        dispatch(openSnackbar({
          open: true,
          message: isResubmit ? 'Encashment request resubmitted successfully for verification!' : 'Record updated successfully!',
          variant: 'alert',
          severity: 'success'
        }));
      } else {
        await axios.post(API_PATHS.HRA.LEAVE_ENCASHMENT_VERIFIED, payload);
        dispatch(openSnackbar({ open: true, message: 'Leave Encashment Entry created successfully!', variant: 'alert', severity: 'success' }));
      }
      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
      dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to save record', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const secondaryActions = null;

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={isReadonly ? undefined : handleSave}
      onClear={isReadonly ? undefined : handleClear}
      isViewOnly={isReadonly}
      title={isEdit ? (item?.status === 'REJECTED' ? 'Resubmit Leave Encashment Request' : (isReadonly ? 'View Encashment Record' : 'Edit Encashment Record')) : 'New Leave Encashment Entry'}
      maxWidth="md"
      secondaryActions={secondaryActions}
    >
      <Stack spacing={2.5}>
        {/* ── TOP: Employee Profile Header ── */}
        {(() => {
          const activeEmp = employeeProfile || form.employee || loggedInEmp || (isSelfCare ? user : null);
          if (!activeEmp) return null;

          const activeName = activeEmp.employeeName || activeEmp.name || activeEmp.username || user?.employeeName || user?.name || user?.username || 'Current Employee';
          const activeCode = activeEmp.oldEmpCode || activeEmp.empCode || user?.oldEmpCode || user?.empCode || '';
          const dept = activeEmp.department?.departmentName || activeEmp.departmentName || user?.departmentName || user?.department?.departmentName || '—';
          const desig = activeEmp.designation?.designationName || activeEmp.designationName || user?.designationName || user?.designation?.designationName || '—';
          const rawPhoto = activeEmp.employeePhotoUpload || activeEmp.photoUpload || activeEmp.photo || activeEmp.employeePhoto || activeEmp.photoPath || user?.photo;
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

        {/* ── Rejection Warning & History Banner ── */}
        {item?.status === 'REJECTED' && (
          <Box sx={{ bgcolor: 'error.lighter', p: 2, borderRadius: 2, border: '1.5px solid', borderColor: 'error.light' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <IconAlertCircle size={22} color="#d32f2f" />
              <Typography variant="h5" color="error.dark" fontWeight={800}>
                This Request Was Rejected — Please Review Comments Below & Resubmit
              </Typography>
            </Stack>
            <Typography variant="body2" color="error.dark">
              Modify the requested encashment days or remarks as requested by your manager/HR and click <strong>Save</strong> to resubmit for verification.
            </Typography>
          </Box>
        )}

        {/* ── Form Content ── */}
        <Stack spacing={2.5}>
          {/* Section 1: Employee Selection (Only shown in Admin/HR mode; hidden in Self-Care) */}
          {!isSelfCare && (
            <BOSFormSection title="Employee Details" icon={<IconUser size={20} />}>
              <Box sx={{ mt: 1 }}>
                <BOSEmployeeAutocomplete
                  label="Employee"
                  required
                  name="employee"
                  options={employees}
                  value={form.employee}
                  onChange={(val) => setForm((prev) => ({ ...prev, employee: val }))}
                  disabled={isReadonly}
                  placeholder="Select Employee"
                  error={!!errors.employee}
                  helperText={errors.employee}
                  size="small"
                />
              </Box>
            </BOSFormSection>
          )}

          {/* Section 2: Available Leaves Breakdown (EL, CL, SL, AL, PL) */}
          <BOSFormSection title="Available Leaves" icon={<IconCalendar size={20} />}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                {[
                  { label: 'Earned (EL)',    val: form.el, bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' },
                  { label: 'Casual (CL)',    val: form.cl, bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' },
                  { label: 'Sick (SL)',      val: form.sl, bg: '#ffebee', text: '#c62828', border: '#ef5350' },
                  { label: 'Annual (AL)',    val: form.al, bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
                  { label: 'Privilege (PL)', val: form.pl, bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' }
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      p: 1.5,
                      bgcolor: item.bg,
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: item.border,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: item.text, display: 'block' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: item.text, mt: 0.5 }}>
                      {fmt2(item.val)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Total Available Encashment (Read-Only Sum) */}
              <Box
                sx={{
                  bgcolor: 'info.lighter',
                  p: 1.8,
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: 'info.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Total Available Encashment (Read-Only)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    = EL ({fmt2(form.el)}) + CL ({fmt2(form.cl)}) + SL ({fmt2(form.sl)}) + AL ({fmt2(form.al)}) + PL ({fmt2(form.pl)})
                  </Typography>
                </Box>
                <Chip
                  label={`${fmt2(totalAvailableEncashment)} Days`}
                  color="info"
                  sx={{ fontWeight: 800, fontSize: '1rem', height: 36, px: 1 }}
                />
              </Box>
            </Stack>
          </BOSFormSection>

          {/* Section 3: Encashment Application & Remarks */}
          <BOSFormSection title="Encashment Request" icon={<IconCoins size={20} />}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <BOSTextField
                label="Encashment Days Taken *"
                required
                name="requestedEncashmentDays"
                value={form.requestedEncashmentDays}
                onChange={handleChange}
                type="number"
                disabled={isReadonly}
                placeholder={`0 (Max available: ${Math.floor(totalAvailableEncashment)})`}
                error={!!errors.requestedEncashmentDays}
                helperText={errors.requestedEncashmentDays || `Enter whole number of days (no decimals, max: ${Math.floor(totalAvailableEncashment)} days)`}
                inputProps={{ step: '1', min: 1, max: Math.floor(totalAvailableEncashment) }}
              />

              <BOSTextField
                label="Remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                multiline
                rows={2.5}
                disabled={isReadonly && !perms.approval}
                placeholder={perms.approval && isEdit ? 'Add verification / rejection remarks...' : 'Optional remarks...'}
              />

              {isEdit && (
                <BOSStatusField
                  isCreate={false}
                  name="status"
                  label="Status"
                  value={item?.status || 'PENDING'}
                  disabled={true}
                  fullWidth
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="VERIFIED">Verified</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </BOSStatusField>
              )}
            </Stack>
          </BOSFormSection>

          {/* Section 4: Rejection History Timeline (visible to employee when rejection comments exist) */}
          {(() => {
            const historyStr = item?.rejectionComment || item?.remarks;
            const hasBeenRejected = historyStr && (historyStr.includes('"revNo"') || item?.status === 'REJECTED');
            if (!hasBeenRejected) return null;
            const history = parseRejectionHistory(historyStr, item);
            if (!history.length) return null;
            return (
              <BOSFormSection
                title={`Rejection History (${history.length} record${history.length > 1 ? 's' : ''})`}
                icon={<IconAlertCircle size={20} color="#d32f2f" />}
              >
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {history.map((entry) => (
                    <Box key={entry.revNo || Math.random()} sx={{
                      bgcolor: 'error.lighter',
                      border: '1.5px solid',
                      borderColor: 'error.light',
                      borderRadius: 2,
                      p: 1.8
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          label={`Rejection Revision R-${entry.revNo || 1}`}
                          size="small"
                          sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 800, fontSize: '0.75rem' }}
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          By: {entry.rejectedByName || entry.rejectedBy || 'Manager/HR'}
                        </Typography>
                        {entry.rejectedAt && (
                          <Typography variant="caption" color="text.disabled">
                            • {entry.rejectedAt}
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="body2" color="error.dark" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                        "{entry.remarks || 'No specific comment provided.'}"
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </BOSFormSection>
            );
          })()}
        </Stack>
      </Stack>
    </BOSFormDialog>
  );
};

LeaveEncashmentEntryDialog.propTypes = {
  open:    PropTypes.bool.isRequired,
  item:    PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave:  PropTypes.func.isRequired
};

export default LeaveEncashmentEntryDialog;
