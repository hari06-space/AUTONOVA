import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Stack, Box, Typography, Button, Tooltip, Divider, useTheme } from '@mui/material';
import { BOSFormDialog, BOSTextField, BOSFormSection, BOSFileUpload, BOSPersonnelCard } from 'ui-component/bos';
import { IconChecklist, IconClock, IconPaperclip, IconUser } from '@tabler/icons-react';
import useBOSValidation from 'hooks/useBOSValidation';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

const getLatestRejectionText = (cancelRemarks, revNo = 0) => {
  if (!cancelRemarks || !cancelRemarks.trim()) return '';
  try {
    const history = JSON.parse(cancelRemarks);
    if (Array.isArray(history) && history.length > 0) {
      const rejections = history.filter(h => h.revNo && !h.action);
      if (rejections.length > 0) {
        const latest = rejections[rejections.length - 1];
        const count = Math.max(revNo, rejections.length, ...rejections.map(h => h.revNo || 0));
        return `[Rejected ${count} time(s)] Latest Comment: ${latest.remarks || ''}`;
      } else {
        const byRevNo = new Map();
        for (const entry of history) {
          const r = Number(entry.revNo);
          if (!r || r <= 0) continue;
          if (!entry.remarks || !String(entry.remarks).trim()) continue;
          byRevNo.set(r, entry);
        }
        if (byRevNo.size > 0) {
          const list = Array.from(byRevNo.values()).sort((a, b) => Number(a.revNo) - Number(b.revNo));
          const latest = list[list.length - 1];
          const count = Math.max(revNo, list.length, ...list.map(h => h.revNo || 0));
          return `[Rejected ${count} time(s)] Latest Comment: ${latest.remarks || latest.comments || ''}`;
        } else {
          const latest = history[history.length - 1];
          const count = Math.max(revNo, history.length, ...history.map(h => h.revNo || 0));
          return `[Rejected ${count} time(s)] Latest Comment: ${latest.remarks || latest.comments || ''}`;
        }
      }
    } else if (history && typeof history === 'object') {
      const count = revNo || history.revNo || 1;
      return `[Rejected ${count} time(s)] Latest Comment: ${history.remarks || ''}`;
    }
  } catch {
    const count = revNo || 1;
    return `[Rejected ${count} time(s)] Latest Comment: ${cancelRemarks}`;
  }
  return cancelRemarks;
};

const INITIAL_FORM = {
  actionTaken: '',
  actionObservation: '',
  cancelRemarks: '' // For rejection
};

const MomActionClosureDialog = ({ open, item, onClose, onSave }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { clearErrors } = useBOSValidation();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [isAttachmentRequired, setIsAttachmentRequired] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Validation error states
  const [actionTakenError, setActionTakenError] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState(false);

  // Fetch employees list to resolve personnel details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, userRes] = await Promise.all([
          axios.get('/api/master/hr/employees'),
          axios.get('/api/users/all')
        ]);
        setEmployees(empRes.data || []);
        setUsersList(userRes.data || []);
      } catch (e) {
        console.error('Failed to fetch personnel data:', e);
      }
    };
    fetchData();
  }, []);

  // Derive delay days based on SOP
  const getDelayDays = () => {
    if (!item || !item.targetDate) return 0;
    const target = new Date(item.targetDate).getTime();
    const now = new Date().getTime();
    const diff = now - target;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 3600 * 24));
  };

  const delayDays = getDelayDays();
  const normalizedStatus = item?.status ? item.status.toUpperCase().replace(/_/g,' ').trim() : 'OPEN';
  const isPendingForVerified = normalizedStatus === 'PENDING FOR VERIFIED';
  const isAssignedToMe = Boolean(
    user && item && (
      String(user.empId || '') === String(item.assignedTo?.id || item.assignedToId || item.assignedTo || '') ||
      String(user.id || '') === String(item.assignedTo?.id || item.assignedToId || item.assignedTo || '') ||
      String(user.empCode || '').toLowerCase() === String(item.assignedTo?.empCode || item.assignedToEmpCode || '').toLowerCase() ||
      String(user.name || '').toLowerCase() === String(item.assignedTo?.employeeName || item.assignedTo || '').toLowerCase() ||
      String(user.employeeName || '').toLowerCase() === String(item.assignedTo?.employeeName || item.assignedTo || '').toLowerCase() ||
      String(user.username || '').toLowerCase() === String(item.assignedTo?.employeeName || item.assignedTo || '').toLowerCase()
    )
  );
  // Readonly if: pending for verified, accepted, or not the assigned user
  const isReadonly = item && (['PENDING FOR VERIFIED', 'ACCEPTED', 'CLOSED'].includes(normalizedStatus) || !isAssignedToMe);

  useEffect(() => {
    if (open) {
      if (item) {
        setForm({
          actionTaken: item.actionTaken || '',
          actionObservation: item.actionObservation || '',
          cancelRemarks: item.cancelRemarks || ''
        });
        setIsAttachmentRequired(item.attachmentRequired === 'YES');
        if (item.attachmentInfo) {
          try {
            setAttachments(JSON.parse(item.attachmentInfo));
          } catch {
            setAttachments([]);
          }
        } else {
          setAttachments([]);
        }

        const momId = item.momId || item._momId;
        if (momId && item.id) {
          axios.get(`/api/qms/moms/${momId}`)
            .then(res => {
              const matched = res.data?.details?.find(d => d.id === item.id);
              if (matched) {
                setForm({
                  actionTaken: matched.actionTaken || item.actionTaken || '',
                  actionObservation: matched.actionObservation || item.actionObservation || '',
                  cancelRemarks: matched.cancelRemarks || item.cancelRemarks || ''
                });
                const rawAttachments = matched.attachmentInfo || item.attachmentInfo;
                if (rawAttachments) {
                  try {
                    setAttachments(JSON.parse(rawAttachments));
                  } catch {
                    setAttachments([]);
                  }
                }
              }
            })
            .catch(err => console.error("Failed to fetch fresh detail in closure dialog:", err));
        }
      } else {
        setForm(INITIAL_FORM);
        setIsAttachmentRequired(false);
        setAttachments([]);
      }
      setActionTakenError(false);
      setAttachmentsError(false);
      clearErrors();
    }
  }, [open, item, clearErrors]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value.toUpperCase() });
    if (e.target.name === 'actionTaken' && e.target.value.trim()) {
      setActionTakenError(false);
    }
  };

  const handleAction = async (actionType) => {
    if (actionType === 'CLOSE') {
      let hasError = false;
      if (!form.actionTaken.trim()) {
        setActionTakenError(true);
        hasError = true;
      } else {
        setActionTakenError(false);
      }
      if (isAttachmentRequired && (!attachments || attachments.length === 0)) {
        setAttachmentsError(true);
        hasError = true;
      } else {
        setAttachmentsError(false);
      }

      if (hasError) {
        if (!form.actionTaken.trim() && isAttachmentRequired && (!attachments || attachments.length === 0)) {
          dispatch(openSnackbar({ open: true, message: 'Please enter Action Taken and upload required attachments.', variant: 'alert', severity: 'error' }));
        } else if (!form.actionTaken.trim()) {
          dispatch(openSnackbar({ open: true, message: 'Action Taken is mandatory to submit for closure.', variant: 'alert', severity: 'error' }));
        } else {
          dispatch(
            openSnackbar({
              open: true,
              message: 'Attachment is mandatory to submit for closure.',
              variant: 'alert',
              severity: 'error'
            })
          );
        }
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        attachmentInfo: JSON.stringify(attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType || 'FILE',
          serverFileName: att.serverFileName,
          docDetails: att.docDetails || ''
        })))
      };

      await axios.put(`${API_PATHS.QMS.MOMS}/${item.momId}/details/${item.id}/close`, payload);
      dispatch(openSnackbar({ open: true, message: 'Submitted for closure successfully.', variant: 'alert', severity: 'success' }));
      onSave();
    } catch (error) {
      console.error(error);
      dispatch(openSnackbar({ open: true, message: 'Failed to submit for closure', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeDetails = (nameOrId, empId) => {
    if (!nameOrId && !empId) return { empCode: '-', departmentName: '-', level: '-' };
    let emp = null;
    if (empId) {
      emp = employees.find(e => String(e.id) === String(empId));
    }
    if (!emp && nameOrId) {
      emp = employees.find(e => e.employeeName === nameOrId || e.empCode === nameOrId);
    }
    if (!emp) return { empCode: '-', departmentName: '-', level: '-' };
    
    // Find matching user credential to get profile picture
    const matchingUser = usersList.find(u => String(u.empId) === String(emp.id) || String(u.name).toLowerCase() === String(emp.employeeName).toLowerCase());
    const finalPhoto = matchingUser?.imgName || emp.employeePhotoUpload;

    return {
      ...emp,
      employeePhotoUpload: finalPhoto,
      departmentName: emp.department?.departmentName || emp.departmentName || '-',
      level: emp.empLevelId ? `L${emp.empLevelId}` : '-'
    };
  };

  const renderCustomActions = () => {
    if (!item) return null;
    const normStatus = item.status ? item.status.toUpperCase().replace(/_/g,' ').trim() : 'OPEN';
    return (
      <Stack direction="row" spacing={1.5} alignItems="center">
        {['OPEN', 'REJECTED'].includes(normStatus) && (
          <Tooltip title={!isAssignedToMe ? `This action is assigned to ${item.assignedTo?.employeeName || item.assignedTo}. Only they can submit for closure.` : ''}>
            <span>
              <Button variant="contained" color="secondary" onClick={() => handleAction('CLOSE')} disabled={loading || !isAssignedToMe}>
                Submit For Verification
              </Button>
            </span>
          </Tooltip>
        )}
        {normStatus === 'PENDING FOR VERIFIED' && (
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'warning.light', color: '#000000', fontWeight: 800, borderRadius: 2, border: '1px solid', borderColor: 'warning.main' }}>
            ⏳ Pending for Verified
          </Typography>
        )}
        {['ACCEPTED', 'CLOSED'].includes(normStatus) && (
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'success.lighter', color: 'success.dark', fontWeight: 800, borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
            ✅ Accepted
          </Typography>
        )}
      </Stack>
    );
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      title="Action Details"
      maxWidth="lg"
      secondaryActions={renderCustomActions()}
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        {!isAssignedToMe && item && ['OPEN', 'REJECTED'].includes(normalizedStatus) && (
          <Box sx={{ p: 1.5, bgcolor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
            <Typography variant="body2" color="error.dark" fontWeight={700}>
              🚨 Access Restricted: This action is assigned to <b>{item.assignedTo?.employeeName || item.assignedTo}</b>. Only they can submit for closure.
            </Typography>
          </Box>
        )}
        
        {/* Custom Premium Metadata Header Bar */}
        <Box sx={{ 
          bgcolor: '#e3f2fd', 
          borderRadius: '12px', 
          p: 2, 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: 2,
          border: '1px solid',
          borderColor: 'primary.light',
          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.05)',
          width: '100%'
        }}>
          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" alignItems="center">
            <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
              MIN No : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item?.minNo || item?._momNo || item?.meetNo || item?.momNo || '-'}</Box>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
              MOM Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item?.momDate ? item.momDate.split('-').reverse().join('/') : '-'}</Box>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
              Target Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item?.targetDate ? item.targetDate.split('-').reverse().join('/') : '-'}</Box>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
               Status : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{isPendingForVerified ? 'Pending for Verified' : (item?.status || 'Open')}</Box>
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
              Delay Days : <Box component="span" sx={{ color: 'error.main', fontWeight: 800 }}>{delayDays} Days</Box>
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1.2fr' }, gap: 4, width: '100%' }}>
          {/* Left Column: Action Details Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <BOSFormSection title="Action Details" icon={<IconChecklist size={22} />}>
              <Stack spacing={2.5} sx={{ mt: 1 }}>
                <BOSTextField
                  label="Discussed Point"
                  value={item?.discussedPoint || ''}
                  multiline rows={4}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'grey.50' }}
                />
                
                <BOSTextField
                  label="Action Taken *"
                  name="actionTaken"
                  value={form.actionTaken}
                  onChange={handleChange}
                  multiline rows={3}
                  disabled={isReadonly}
                  required
                  error={actionTakenError}
                  helperText={actionTakenError ? 'Action Taken is required' : ''}
                  sx={
                    actionTakenError ? {
                      '& .MuiOutlinedInput-root': {
                        boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
                        '& fieldset': {
                          borderColor: 'error.main',
                          borderWidth: '2px'
                        }
                      }
                    } : {}
                  }
                />

                <BOSTextField
                  label="Action Observation"
                  name="actionObservation"
                  value={form.actionObservation}
                  onChange={handleChange}
                  multiline rows={2}
                  disabled={isReadonly}
                />

                <Stack direction="row" spacing={2}>
                  <BOSTextField
                    label="Status"
                    value={item?.status || ''}
                    InputProps={{ readOnly: true }}
                    sx={{ 
                      bgcolor: normalizedStatus === 'OPEN' ? 'error.lighter' : 'grey.50',
                      '& .MuiInputBase-input': { fontWeight: 800, color: normalizedStatus === 'OPEN' ? 'error.dark' : 'inherit' }
                    }}
                  />
                </Stack>

                {normalizedStatus === 'REJECTED' && (
                  <BOSTextField
                    label="Rejection Comments"
                    name="cancelRemarks"
                    value={getLatestRejectionText(form.cancelRemarks, item?.revNo)}
                    InputProps={{ readOnly: true }}
                    multiline rows={2}
                    sx={{ bgcolor: 'warning.lighter', '& .MuiInputBase-input': { fontWeight: 800, color: 'warning.dark' } }}
                  />
                )}
                
                {/* Read-only waiting state when closure has been submitted */}
                {isPendingForVerified && (
                  <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconClock size={20} />
                    <Typography variant="body2" color="info.dark" fontWeight={700}>
                      Closure submitted successfully. Waiting for verifier to review and take action from the <b>MOM Verify / Approval</b> page.
                    </Typography>
                  </Box>
                )}
              </Stack>
            </BOSFormSection>

            {isAttachmentRequired && (
              <BOSFormSection title="Attachments" icon={<IconPaperclip size={22} />}>
                <Box sx={attachmentsError ? {
                  border: '2px solid',
                  borderColor: 'error.main',
                  borderRadius: '8px',
                  boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
                  p: 1.5
                } : {}}>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <BOSFileUpload
                      files={attachments}
                      onChange={(files) => {
                        setAttachments(files);
                        if (files && files.length > 0) {
                          setAttachmentsError(false);
                        }
                      }}
                      module="QUALITY_MANAGEMENT_SYSTEMS_MEETING_CLOSE_MOM"
                      multiple={true}
                      disabled={isReadonly}
                    />
                  </Stack>
                </Box>
                {attachmentsError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                    Attachment is mandatory for this action item.
                  </Typography>
                )}
              </BOSFormSection>
            )}
          </Box>

          {/* Right Column: Personnel Information Card */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <BOSFormSection title="Personnel Information" icon={<IconUser size={20} color={theme.palette.primary.main} />}>
              <Stack spacing={3}>
                <BOSPersonnelCard 
                    title="Assigned By" 
                    name={item?.assignedBy} 
                    empCode={getEmployeeDetails(item?.assignedBy, item?.assignedById).empCode || '-'}
                    department={getEmployeeDetails(item?.assignedBy, item?.assignedById).departmentName || '-'}
                    photo={getEmployeeDetails(item?.assignedBy, item?.assignedById).employeePhotoUpload}
                    level={getEmployeeDetails(item?.assignedBy, item?.assignedById).level || '-'}
                    color="primary.main"
                />
                <BOSPersonnelCard 
                    title="Assigned To" 
                    name={item?.assignedTo} 
                    empCode={getEmployeeDetails(item?.assignedTo, item?.assignedToId).empCode || '-'}
                    department={getEmployeeDetails(item?.assignedTo, item?.assignedToId).departmentName || '-'}
                    photo={getEmployeeDetails(item?.assignedTo, item?.assignedToId).employeePhotoUpload}
                    level={getEmployeeDetails(item?.assignedTo, item?.assignedToId).level || '-'}
                    color="secondary.main"
                />
              </Stack>
            </BOSFormSection>
          </Box>
        </Box>
      </Stack>
    </BOSFormDialog>
  );
};

MomActionClosureDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default MomActionClosureDialog;
