import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Stack, Typography, Box, Button, Chip, Tooltip, IconButton, Divider, useTheme
} from '@mui/material';
import {
  BOSFormDialog,
  BOSTextField,
  BOSFormSection,
  BOSPersonnelCard,
  BOSFileGallery
} from 'ui-component/bos';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import {
  IconShieldCheck, IconX, IconPaperclip,
  IconUser, IconCircleCheck, IconHistory, IconAlertTriangle, IconChecks
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { getFileViewUrl } from 'utils/upload-helper';

const readOnlyFieldSx = {
  '& .MuiInputBase-input.Mui-disabled': {
    color: '#000000 !important',
    WebkitTextFillColor: '#000000 !important',
    wordBreak: 'normal !important',
    wordWrap: 'break-word !important',
    overflowWrap: 'break-word !important'
  },
  '& .MuiOutlinedInput-root.Mui-disabled': { bgcolor: 'action.hover' },
  '& .MuiInputLabel-root.Mui-disabled': { color: 'rgba(0, 0, 0, 0.6) !important' }
};

const parseRejectionHistory = (cancelRemarks, row = null) => {
  if (!cancelRemarks || !cancelRemarks.trim()) return [];

  const formatHelper = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours() % 12;
    if (hours === 0) hours = 12;
    const hoursStr = String(hours).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hoursStr}:${mins}`;
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal || dateVal === '-') return '-';
    let norm = String(dateVal).trim().replace(' ', 'T');
    norm = norm.replace(/(T\d{2}:\d{2}:\d{2})(\.\d{1,3})\d*/, '$1$2');
    const d = new Date(norm);
    return isNaN(d.getTime()) ? '-' : formatHelper(d);
  };

  try {
    const parsed = JSON.parse(cancelRemarks);
    const rawList = Array.isArray(parsed) ? parsed : [parsed];
    const byRevNo = new Map();
    for (const entry of rawList) {
      const rev = Number(entry.revNo);
      if (!rev || rev <= 0) continue;
      if (!entry.remarks || !String(entry.remarks).trim()) continue;
      const existing = byRevNo.get(rev);
      const isBetter = !existing ||
        (entry.rejectedByName && !existing.rejectedByName) ||
        (entry.rejectedAt && !existing.rejectedAt);
      if (isBetter) byRevNo.set(rev, entry);
    }
    return Array.from(byRevNo.values())
      .sort((a, b) => Number(a.revNo) - Number(b.revNo))
      .map(e => ({ ...e, rejectedAt: formatDateStr(e.rejectedAt) }));
  } catch {
    const text = cancelRemarks.trim();
    if (!text || !row?.revNo || Number(row.revNo) <= 0) return [];
    const rejectedBy = row?.assignedBy?.employeeName || row?.assignedBy || '-';
    let rejectedAt = '-';
    const rawDate = row?._updatedAt || row?.updatedAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) rejectedAt = formatHelper(d);
    }
    return [{ revNo: Number(row.revNo) || 1, remarks: text, rejectedBy, rejectedByName: rejectedBy, rejectedAt }];
  }
};

const MomApprovalDialog = ({ open, onClose, item, onAction }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_MOM_APPROVAL);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleAttachment, setSampleAttachment] = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [originalAttachments, setOriginalAttachments] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [dbDetail, setDbDetail] = useState(null);

  useEffect(() => {
    if (open) {
      axios.get('/api/master/hr/employees')
        .then(res => setEmployees(res.data || []))
        .catch(() => { });
    }
  }, [open]);

  useEffect(() => {
    if (!open || !item) return;
    setRejectComments('');
    setIsSubmitting(false);
    setSampleAttachment(null);
    setOriginalAttachments([]);
    setDbDetail(null);

    const momId = item.momId || item._momId;
    if (momId && item.id) {
      setLoadingOriginal(true);
      setLoadingSample(true);
      axios.get(`${API_PATHS.QMS.MOMS}/${momId}`)
        .then(res => {
          const momData = res.data;

          // 1. Resolve submitted evidence documents
          const matched = momData?.details?.find(d => d.id === item.id);
          if (matched) {
            setDbDetail(matched);
            const rawAttachments = matched.attachmentInfo || item.attachmentInfo;
            if (rawAttachments) {
              try { setOriginalAttachments(JSON.parse(rawAttachments)); }
              catch { setOriginalAttachments([]); }
            } else {
              setOriginalAttachments([]);
            }
          }

          // 2. Resolve sample template document from the meeting type of the schedule
          const meetingMasterId = momData?.schedule?.meetingType?.id;
          if (meetingMasterId) {
            axios.get(`${API_PATHS.QMS.MEETINGS}/${meetingMasterId}`)
              .then(meetingRes => {
                setSampleAttachment(meetingRes.data?.attachmentUrl
                  ? { name: meetingRes.data.attachmentName || 'Sample Template', url: meetingRes.data.attachmentUrl }
                  : null);
              })
              .catch(() => setSampleAttachment(null))
              .finally(() => setLoadingSample(false));
          } else {
            setSampleAttachment(null);
            setLoadingSample(false);
          }
        })
        .catch(() => {
          setOriginalAttachments([]);
          setSampleAttachment(null);
          setLoadingSample(false);
        })
        .finally(() => setLoadingOriginal(false));
    }
  }, [open, item]);

  const getDelayDays = () => {
    if (!item?.targetDate) return 0;
    const diff = Math.floor((new Date() - new Date(item.targetDate)) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const getEmployeeDetails = (nameOrId, empId) => {
    let emp = null;
    if (empId) emp = employees.find(e => String(e.id) === String(empId));
    if (!emp && nameOrId) emp = employees.find(e => e.employeeName === nameOrId || e.empCode === nameOrId);
    if (!emp) return { empCode: '-', departmentName: '-', level: '-' };
    return {
      ...emp,
      departmentName: emp.department?.departmentName || emp.departmentName || '-',
      level: emp.empLevelId ? `L${emp.empLevelId}` : '-'
    };
  };

  const resolveRejectedByName = (rejectedBy) => {
    if (!rejectedBy) return '-';
    const val = String(rejectedBy).trim();
    if (!val || val === '-' || val === 'null' || val === 'undefined') return '-';
    const byId = employees.find(e => String(e.id) === val);
    if (byId) return byId.employeeName || val;
    const byCode = employees.find(e => e.empCode?.toLowerCase() === val.toLowerCase());
    if (byCode) return byCode.employeeName || val;
    const byName = employees.find(e => e.employeeName?.toLowerCase() === val.toLowerCase());
    if (byName) return byName.employeeName || val;
    return val;
  };

  const handleVerify = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_PATHS.QMS.MOMS}/action-items/${item.id}/verify`);
      dispatch(openSnackbar({ open: true, message: 'MOM Verified Successfully.', variant: 'alert', severity: 'success' }));
      onAction();
    } catch {
      dispatch(openSnackbar({ open: true, message: 'Failed to verify', variant: 'alert', severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComments.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Rejection comments are mandatory.', variant: 'alert', severity: 'warning' }));
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_PATHS.QMS.MOMS}/action-items/${item.id}/reject`, {
        remarks: rejectComments.toUpperCase()
      });
      dispatch(openSnackbar({ open: true, message: 'MOM Rejected Successfully.', variant: 'alert', severity: 'warning' }));
      setRejectDialogOpen(false);
      onAction();
    } catch {
      dispatch(openSnackbar({ open: true, message: 'Failed to reject', variant: 'alert', severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentPanel = (title, attachmentsList) => {
    // Format each attachment into the shape BOSFileGallery expects
    const galleryFiles = attachmentsList.map((att) => ({
      name: att.fileName || att.name || att.serverFileName || 'Document',
      serverFileName: att.serverFileName || att.filePath || att.url || '',
      fileType: att.fileType || '',
      docDetails: att.fileType || att.docDetails || '',
      isServer: true
    }));

    return (
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', flex: 1 }}>
        {/* Section title header — no yellow, uses standard BOS divider style */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <IconPaperclip size={15} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>

        {/* Panel body — BOSFileGallery handles the file rows and eye/preview */}
        <Box sx={{ p: 2, minHeight: '120px', bgcolor: 'background.paper' }}>
          <BOSFileGallery files={galleryFiles} isEditing={false} />
        </Box>
      </Box>
    );
  };

  const delayDays = getDelayDays();
  const itemStatusNorm = (item?.status || '').toLowerCase().replace(/_/g, ' ').trim();
  const isReadonly = ['accepted', 'closed', 'rejected'].includes(itemStatusNorm);

  const showVerifyButtons = (perms.approval || perms.write) && (itemStatusNorm === 'pending for verified' || itemStatusNorm === 'pending for verify');

  const assignedByDetails = getEmployeeDetails(
    typeof item?.assignedBy === 'string' ? item?.assignedBy : item?.assignedBy?.employeeName,
    item?.assignedById || item?.assignedBy?.id
  );
  const assignedToDetails = getEmployeeDetails(
    typeof item?.assignedTo === 'string' ? item?.assignedTo : item?.assignedTo?.employeeName,
    item?.assignedToId || item?.assignedTo?.id
  );

  useEffect(() => {
    let spacePressed = false;

    const handleKeyDown = (e) => {
      if (!open || rejectDialogOpen || isSubmitting) return;

      const tag = e.target.tagName.toLowerCase();
      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target.isContentEditable ||
        e.target.closest('[contenteditable="true"]');

      if (e.key === ' ' || e.code === 'Space') {
        if (!isInput) {
          e.preventDefault();
          spacePressed = true;
        }
        return;
      }

      if (!spacePressed) return;

      const key = e.key ? e.key.toLowerCase() : '';
      if (key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        if (showVerifyButtons) {
          handleVerify();
        }
      } else if (key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        if (showVerifyButtons) {
          setRejectDialogOpen(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        spacePressed = false;
      }
    };

    const handleBlur = () => {
      spacePressed = false;
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, [open, rejectDialogOpen, isSubmitting, showVerifyButtons]);

  if (!item) return null;

  const referenceDocs = sampleAttachment ? [sampleAttachment] : [];
  const evidenceDocs = originalAttachments.map(att => ({ ...att, fileType: 'Submitted Document' }));

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={onClose}
        title={`MOM Verification`}
        maxWidth="lg"
        isViewOnly={true}
        showCloseInFooter={false}
        secondaryActions={
          showVerifyButtons && (
            <Stack direction="row" spacing={1.5}>
              <Tooltip title={shortcutTooltip('Reject')}>
                <Button
                  data-shortcut="reject"
                  variant="contained"
                  color="error"
                  startIcon={<IconX size={20} />}
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isSubmitting}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Reject
                </Button>
              </Tooltip>
              <Tooltip title={shortcutTooltip('Verify')}>
                <Button
                  data-shortcut="verify"
                  variant="contained"
                  color="success"
                  startIcon={<IconChecks size={20} />}
                  onClick={handleVerify}
                  disabled={isSubmitting}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </Button>
              </Tooltip>
            </Stack>
          )
        }
      >
        <Stack spacing={3}>
          {/* Status banner */}
          <Box sx={{
            p: 2,
            bgcolor: 'primary.lighter',
            borderRadius: '12px',
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
                MOM Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item?._momDate || item?.momDate || '-'}</Box>
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                Target Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item?.targetDate || '-'}</Box>
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                Status : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{itemStatusNorm === 'pending for verified' || itemStatusNorm === 'pending for verify' ? 'PENDING FOR VERIFY' : itemStatusNorm.toUpperCase()}</Box>
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                Delay Days : <Box component="span" sx={{ color: delayDays > 0 ? 'error.main' : 'primary.main', fontWeight: 800 }}>{delayDays > 0 ? `${delayDays} Days` : '0 Days'}</Box>
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1.2fr' }, gap: 4, width: '100%' }}>
            {/* Left Column: Action Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <BOSFormSection title="Action Details">
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                  <BOSTextField label="Discussed Point" value={dbDetail?.discussedPoint || item?.discussedPoint || '-'} disabled sx={readOnlyFieldSx} multiline minRows={3} fullWidth disableRichText />
                  <BOSTextField label="Action Taken" value={dbDetail?.actionTaken || item?.actionTaken || '-'} disabled sx={readOnlyFieldSx} multiline minRows={3} fullWidth disableRichText />
                  <BOSTextField label="Action Observation" value={dbDetail?.actionObservation || item?.actionObservation || '-'} disabled sx={readOnlyFieldSx} multiline minRows={3} fullWidth disableRichText />
                  {(dbDetail?.processType || item?.processType) && (
                    <BOSTextField label="Process Type" value={dbDetail?.processType || item.processType} disabled sx={readOnlyFieldSx} fullWidth />
                  )}
                </Stack>
              </BOSFormSection>

              {/* Supporting Documents */}
              {(referenceDocs.length > 0 || evidenceDocs.length > 0) && (
                <BOSFormSection title="Supporting Documents">
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                    {referenceDocs.length > 0 && renderDocumentPanel('Sample Template', referenceDocs)}
                    {evidenceDocs.length > 0 && renderDocumentPanel('Submitted Documents', evidenceDocs)}
                  </Stack>
                </BOSFormSection>
              )}

              {/* Rejection History Timeline */}
              {(() => {
                const hasBeenRejected = item?.revNo != null && Number(item?.revNo) > 0;
                if (!hasBeenRejected) return null;
                const history = parseRejectionHistory(item?.cancelRemarks, item);
                if (!history.length) return null;
                return (
                  <BOSFormSection
                    title={`Rejection History (${history.length} record${history.length > 1 ? 's' : ''})`}
                    icon={<IconHistory size={20} color={theme.palette.error.main} />}
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
                                By: {entry.rejectedByName || resolveRejectedByName(entry.rejectedBy)}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">{entry.rejectedAt || '-'}</Typography>
                            </Stack>
                            <Box sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light', borderRadius: 1.5, px: 1.5, py: 1 }}>
                              <Stack direction="row" spacing={0.8} alignItems="flex-start">
                                <IconAlertTriangle size={14} style={{ color: '#d32f2f', marginTop: 2, flexShrink: 0 }} />
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

            {/* Right Column: Personnel Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <BOSFormSection title="Personnel Information" icon={<IconUser size={20} color={theme.palette.primary.main} />}>
                <Stack spacing={3}>
                  <BOSPersonnelCard
                    title="ASSIGNED BY"
                    name={assignedByDetails.employeeName || item?.assignedBy?.employeeName || item?.assignedBy || '-'}
                    empCode={assignedByDetails.oldEmpCode || '-'}
                    department={assignedByDetails.departmentName || '-'}
                    photo={assignedByDetails.employeePhotoUpload}
                    level={assignedByDetails.level || '-'}
                    color="primary.main"
                  />
                  <BOSPersonnelCard
                    title="ASSIGNED TO"
                    name={assignedToDetails.employeeName || item?.assignedTo?.employeeName || item?.assignedTo || '-'}
                    empCode={assignedToDetails.oldEmpCode || '-'}
                    department={assignedToDetails.departmentName || '-'}
                    photo={assignedToDetails.employeePhotoUpload}
                    level={assignedToDetails.level || '-'}
                    color="secondary.main"
                  />
                </Stack>
              </BOSFormSection>
            </Box>
          </Box>
        </Stack>
      </BOSFormDialog>

      {/* File Preview */}
      {previewOpen && previewFile && (
        <BOSFilePreview open={previewOpen} onClose={() => setPreviewOpen(false)} file={previewFile} />
      )}

      {/* Reject Confirmation Dialog */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => !isSubmitting && setRejectDialogOpen(false)}
        onSave={handleReject}
        title="Reject MOM Action"
        maxWidth="sm"
        saveButtonLabel={isSubmitting ? "Rejecting..." : "Confirm Reject"}
        saveButtonDisabled={!rejectComments.trim() || isSubmitting}
      >
        <Stack spacing={2}>
          <BOSTextField
            label="Rejection Comments *"
            value={rejectComments}
            onChange={(e) => setRejectComments(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            placeholder="Please enter rejection reason..."
            inputProps={{ maxLength: 1000 }}
            disabled={isSubmitting}
          />
        </Stack>
      </BOSFormDialog>
    </>
  );
};

MomApprovalDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  onAction: PropTypes.func.isRequired
};

export default MomApprovalDialog;
