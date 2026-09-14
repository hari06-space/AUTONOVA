import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Stack, Typography, Box, useTheme, Avatar, Paper, Button } from '@mui/material';
import {
  BOSFormDialog,
  BOSTextField,
  BOSFormSection,
  BOSFileUpload,
  BOSPersonnelCard
} from 'ui-component/bos';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import { IconCircleCheck, IconPaperclip, IconUser, IconFileText, IconEye } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseMomDocuments = (item) => {
  if (!item) return [];
  const sources = [
    item.momAttachmentInfo,
    item.discussionPointAttachmentInfo,
    item.discussionPoint?.attachmentInfo,
    item.momAttachments,
    item.attachmentInfo,
    item.attachments,
    item.files,
    item.momFiles
  ];

  for (const src of sources) {
    if (!src) continue;
    if (Array.isArray(src) && src.length > 0) {
      const mapped = src.map((doc) => {
        if (typeof doc === 'string') {
          const fn = doc.split('/').pop().split('\\').pop();
          return { fileName: fn, serverFileName: doc };
        }
        if (typeof doc === 'object' && doc !== null) {
          const fn = doc.fileName || doc.originalFileName || doc.name || (doc.serverFileName ? doc.serverFileName.split('/').pop().split('\\').pop() : '') || (doc.path ? doc.path.split('/').pop().split('\\').pop() : '');
          const serverFn = doc.serverFileName || doc.path || doc.filePath || doc.url || doc.name || '';
          if (fn || serverFn) {
            return {
              fileName: fn || 'Document',
              serverFileName: serverFn,
              fileType: doc.fileType || (fn ? fn.split('.').pop() : '')
            };
          }
        }
        return doc;
      }).filter(d => d && (d.fileName || d.serverFileName));
      if (mapped.length > 0) return mapped;
    }
    if (typeof src === 'string' && src.trim().length > 0 && src !== '[]' && src !== 'null') {
      try {
        const parsed = JSON.parse(src);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((doc) => {
            if (typeof doc === 'string') {
              const fn = doc.split('/').pop().split('\\').pop();
              return { fileName: fn, serverFileName: doc };
            }
            if (typeof doc === 'object' && doc !== null) {
              const fn = doc.fileName || doc.originalFileName || doc.name || (doc.serverFileName ? doc.serverFileName.split('/').pop().split('\\').pop() : '') || (doc.path ? doc.path.split('/').pop().split('\\').pop() : '');
              const serverFn = doc.serverFileName || doc.path || doc.filePath || doc.url || doc.name || '';
              if (fn || serverFn) {
                return {
                  fileName: fn || 'Document',
                  serverFileName: serverFn,
                  fileType: doc.fileType || (fn ? fn.split('.').pop() : '')
                };
              }
            }
            return doc;
          }).filter(d => d && (d.fileName || d.serverFileName));
          if (mapped.length > 0) return mapped;
        }
      } catch {
        const parts = src.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          return parts.map(p => ({
            fileName: p.split('/').pop().split('\\').pop(),
            serverFileName: p
          }));
        }
      }
    }
  }

  return [];
};

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

// ── Component ─────────────────────────────────────────────────────────────────

const CloseMomDialog = ({ open, onClose, item, onSave }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_CLOSE_MOM);

  const [actionTaken, setActionTaken] = useState('');
  const [actionObservation, setActionObservation] = useState('');
  const [isEditable, setIsEditable] = useState(true);
  const [isAttachmentRequired, setIsAttachmentRequired] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [momDocuments, setMomDocuments] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [localStatus, setLocalStatus] = useState(null);

  // Validation error states
  const [actionTakenError, setActionTakenError] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState(false);

  // Employee lookup
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!open || employees.length > 0) return;
    let mounted = true;
    axios.get('/api/master/hr/employees')
      .then(res => {
        if (mounted) setEmployees(res.data || []);
      })
      .catch(err => console.error('Failed to load employees', err));
    return () => { mounted = false; };
  }, [open, employees.length]);

  const getEmployeeDetails = (nameOrId, empId) => {
    let emp = null;
    if (empId) emp = employees.find(e => String(e.id) === String(empId));
    if (!emp && nameOrId) emp = employees.find(e => e.employeeName === nameOrId || e.empCode === nameOrId);
    if (!emp) return { employeeName: nameOrId || '-', empCode: '-', departmentName: '-', level: '-' };
    return {
      ...emp,
      employeeName: emp.employeeName || nameOrId || '-',
      departmentName: emp.department?.departmentName || emp.departmentName || '-',
      level: emp.empLevelId ? `L${emp.empLevelId}` : '-'
    };
  };

  useEffect(() => {
    if (open && item) {
      setLocalStatus(null);
      setActionTaken(item.actionTaken || '');
      setActionObservation(item.actionObservation || '');
      setActionTakenError(false);
      setAttachmentsError(false);

      const parsedDocs = parseMomDocuments(item);
      setMomDocuments(parsedDocs);

      const momId = item.momId || item._momId;
      const detailId = item.id || item.detailId;
      if (momId) {
        axios.get(`${API_PATHS.QMS.MOMS}/${momId}`)
          .then((res) => {
            if (res.data) {
              const fullMom = res.data;
              const headerDocs = parseMomDocuments(fullMom);
              let detailDocs = [];
              if (Array.isArray(fullMom.details)) {
                const matchDet = fullMom.details.find(d => String(d.id) === String(detailId));
                if (matchDet) detailDocs = parseMomDocuments(matchDet);
              }
              const combined = [...parsedDocs, ...detailDocs, ...headerDocs];
              const unique = combined.filter((doc, idx, self) =>
                idx === self.findIndex(d => (d.serverFileName || d.fileName) === (doc.serverFileName || doc.fileName))
              );
              setMomDocuments(unique);
            }
          })
          .catch((err) => {
            console.warn('[CloseMomDialog] Failed to fetch full MOM details:', err);
          });
      }

      const statusNorm = (item.status || '').toLowerCase().replace(/_/g, ' ').trim();
      const nonEditable = ['pending for verified', 'accepted', 'closed', 'verified'];
      setIsEditable(!nonEditable.includes(statusNorm));

      const isReq =
        item.attachmentRequired === 'YES' ||
        item.attachmentRequired === true ||
        item.isAttachmentRequired === 'YES' ||
        item.isAttachmentRequired === true ||
        item.discussionPoint?.isAttachmentRequired === 'YES' ||
        item.discussionPoint?.isAttachmentRequired === true ||
        item.discussionPoint?.attachmentRequired === 'YES' ||
        item.discussionPoint?.attachmentRequired === true;
      setIsAttachmentRequired(isReq);

      if (item.attachmentInfo) {
        try { setAttachments(JSON.parse(item.attachmentInfo)); }
        catch { setAttachments([]); }
      } else {
        setAttachments([]);
      }
    }
  }, [open, item]);

  const getDelayDays = () => {
    if (!item?.targetDate) return 0;
    const target = new Date(item.targetDate);
    const now = new Date();
    const diff = Math.floor((now - target) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleSave = async () => {
    const isInfo = item?.processType === 'INFO';

    if (!isInfo) {
      let hasError = false;
      if (!actionTaken.trim()) {
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
        if (!actionTaken.trim() && isAttachmentRequired && (!attachments || attachments.length === 0)) {
          dispatch(openSnackbar({ open: true, message: 'Please enter Action Taken and upload required attachments.', variant: 'alert', severity: 'error' }));
        } else if (!actionTaken.trim()) {
          dispatch(openSnackbar({ open: true, message: 'Please enter Action Taken', variant: 'alert', severity: 'error' }));
        } else {
          dispatch(openSnackbar({
            open: true,
            message: 'Attachment is mandatory for this action item. Please upload at least one supporting document.',
            variant: 'alert',
            severity: 'error'
          }));
        }
        return;
      }

      const currentStatusNorm = (item.status || '').toLowerCase().replace(/_/g, ' ').trim();
      if (currentStatusNorm === 'rejected' || currentStatusNorm === 'unresolved') {
        const origActionTaken = (item.actionTaken || '').trim().toUpperCase();
        const origActionObs = (item.actionObservation || '').trim().toUpperCase();
        const newActionTaken = actionTaken.trim().toUpperCase();
        const newActionObs = actionObservation.trim().toUpperCase();
        
        let origAttachmentsStr = '[]';
        if (item.attachmentInfo) {
          try { 
            const parsed = JSON.parse(item.attachmentInfo); 
            origAttachmentsStr = JSON.stringify(parsed.map(a => a.serverFileName || a.fileName).sort());
          } catch {}
        }
        const newAttachmentsStr = JSON.stringify(attachments.map(a => a.serverFileName || a.fileName).sort());

        if (origActionTaken === newActionTaken && origActionObs === newActionObs && origAttachmentsStr === newAttachmentsStr) {
          dispatch(openSnackbar({
            open: true,
            message: 'Please make at least one update to Action Taken, Action Observation, or Attachments before resubmitting.',
            variant: 'alert',
            severity: 'warning'
          }));
          return;
        }
      }
    }

    try {
      await axios.put(`${API_PATHS.QMS.MOMS}/${item.momId}/details/${item.id}/close`, {
        actionTaken: actionTaken.trim() ? actionTaken.toUpperCase() : 'ACKNOWLEDGED',
        actionObservation: actionObservation.trim() ? actionObservation.toUpperCase() : 'ACKNOWLEDGED',
        attachmentInfo: JSON.stringify(attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType || 'FILE',
          serverFileName: att.serverFileName,
          docDetails: att.docDetails || ''
        })))
      });
      dispatch(openSnackbar({
        open: true,
        message: isInfo ? 'Information Acknowledged & Closed successfully' : 'Action submitted for Verify',
        variant: 'alert',
        severity: 'success'
      }));
      setLocalStatus(isInfo ? 'CLOSED' : 'PENDING FOR VERIFY');
      onSave();
      onClose();
    } catch {
      dispatch(openSnackbar({ open: true, message: 'Failed to save action', variant: 'alert', severity: 'error' }));
    }
  };

  if (!item) return null;

  const delayDays = getDelayDays();
  const rawStatus = localStatus || item.status || '';
  const statusNorm = rawStatus.toLowerCase().replace(/_/g, ' ').trim();
  const isWaitingForVerify = statusNorm === 'PENDING FOR VERIFIED' || statusNorm === 'PENDING FOR VERIFY';

  const myName = String(user?.name || '').toLowerCase().trim();
  const myEmpCode = String(user?.empCode || user?.employeeCode || '').toLowerCase().trim();
  const myUsername = String(user?.id || '').toLowerCase().trim();
  const assignedName = String(item?.assignedTo?.employeeName || item?.assignedTo || '').toLowerCase().trim();
  const assignedId = String(item?.assignedTo?.id || item?.assignedToId || '').toLowerCase().trim();
  const assignedEmpCode = String(item?.assignedTo?.empCode || '').toLowerCase().trim();

  const isAssignedToMe = Boolean(
    user && item && (
      (myUsername && assignedId && myUsername === assignedId) ||
      (myEmpCode && assignedEmpCode && myEmpCode === assignedEmpCode) ||
      (myName && assignedName && (myName === assignedName || myName.includes(assignedName) || assignedName.includes(myName)))
    )
  );

  const isInfo = item?.processType === 'INFO';

  const canEdit = (isInfo || isAssignedToMe || perms.write) && !isWaitingForVerify && (
    statusNorm === 'open' ||
    statusNorm === 'rejected' ||
    statusNorm === 'created' ||
    statusNorm === 'unresolved' ||
    !item.status
  );

  const isSaveDisabled = !canEdit;

  const formatDateOnly = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  };

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={onClose}
        onSave={handleSave}
        title="Close Mom"
        maxWidth="lg"
        saveButtonDisabled={isSaveDisabled}
        saveButtonLabel={item?.processType === 'INFO' ? "Acknowledge & Close" : "Save"}
        secondaryActions={
          isWaitingForVerify ? (
            <Typography
              variant="subtitle2"
              sx={{
                px: 2, py: 1,
                bgcolor: 'warning.light',
                color: '#000000',
                fontWeight: 800,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'warning.main',
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.15)'
              }}
            >
              ⏳ PENDING FOR VERIFY
            </Typography>
          ) : undefined
        }
      >
        <Stack spacing={3} sx={{ width: '100%' }}>

          {/* ══════════════ STANDARD HEADER BAR ══════════════ */}
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
                MIN No : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item.minNo || item._momNo || item.meetNo || item.momNo || '-'}</Box>
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                MOM Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{formatDateOnly(item._momDate || item.momDate)}</Box>
              </Typography>
              {isInfo ? (
                <>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Meeting No : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item.momNo || item._momNo || '-'}</Box>
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Host : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{item.hostName || item.createdUser || item.createdBy || '-'}</Box>
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Target Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{formatDateOnly(item.targetDate)}</Box>
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Status : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{rawStatus.replace(/_/g, ' ')?.toUpperCase() || 'OPEN'}</Box>
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Delay Days : <Box component="span" sx={{ color: delayDays > 0 ? 'error.main' : 'success.main', fontWeight: 800 }}>{delayDays} Day{delayDays !== 1 ? 's' : ''}</Box>
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                    Review Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{formatDateOnly(item.reviewDate)}</Box>
                  </Typography>
                </>
              )}
            </Stack>
          </Box>

          {/* Access restricted banner */}
          {!isInfo && !isAssignedToMe && item && isEditable && (
            <Box sx={{ p: 1.5, bgcolor: 'error.lighter', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
              <Typography variant="body2" color="error.dark" fontWeight={700}>
                🚨 Access Restricted: This action is assigned to <b>{item.assignedTo?.employeeName || item.assignedTo}</b>. Only they can submit for closure.
              </Typography>
            </Box>
          )}

          {/* Rejection Remarks Alert Box */}
          {(statusNorm === 'rejected' || (item.rejectionRemarks && item.rejectionRemarks.trim())) && (
            <Box sx={{
              p: 2,
              bgcolor: '#fff5f5',
              borderRadius: 2,
              border: '1.5px solid',
              borderColor: 'error.main',
              boxShadow: '0 2px 8px rgba(211, 47, 47, 0.1)'
            }}>
              <Typography variant="subtitle1" color="error.main" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                ❌ ACTION ITEM REJECTED BY ASSIGNER {item.revNo > 0 ? `(Revision #${item.revNo})` : ''}
              </Typography>
              <Typography variant="body2" color="text.primary" fontWeight={600} sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                <b>Rejection Comments:</b> {item.rejectionRemarks || getLatestRejectionText(item.cancelRemarks, item.revNo) || 'No specific comments provided.'}
              </Typography>
              <Typography variant="caption" color="error.dark" sx={{ display: 'block', fontWeight: 700 }}>
                ⚠️ Please review the rejection comments above and update your Action Taken / Action Observation with necessary modifications before resubmitting.
              </Typography>
            </Box>
          )}

          {/* ══════════════ GRID LAYOUT ══════════════ */}
          <Box sx={{ display: 'grid', gridTemplateColumns: isInfo ? '1fr' : { xs: '1fr', md: '1.8fr 1.2fr' }, gap: 4, width: '100%' }}>

            {/* ── LEFT: Action Details + Attachments ── */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

              <BOSFormSection title="Action Details" icon={<IconCircleCheck size={22} color={theme.palette.primary.main} />}>
                <Stack spacing={2.5} sx={{ mt: 1.5 }}>
                  <BOSTextField
                    label="Discussed Point"
                    value={item.discussedPoint || ''}
                    multiline
                    rows={4}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
                  />

                  {!isInfo && (
                    <>
                      <BOSTextField
                        label="Action Taken *"
                        value={actionTaken}
                        onChange={(e) => {
                          setActionTaken(e.target.value.toUpperCase());
                          if (e.target.value.trim()) {
                            setActionTakenError(false);
                          }
                        }}
                        multiline
                        rows={3}
                        fullWidth
                        required
                        error={actionTakenError}
                        helperText={actionTakenError ? 'Action Taken is required' : ''}
                        InputProps={{ readOnly: !canEdit }}
                        sx={
                          actionTakenError ? {
                            '& .MuiOutlinedInput-root': {
                              boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
                              '& fieldset': {
                                borderColor: 'error.main',
                                borderWidth: '2px'
                              }
                            }
                          } : (!canEdit ? { '& .MuiInputBase-root': { bgcolor: 'action.hover' } } : {})
                        }
                      />

                      <BOSTextField
                        label="Action Observation"
                        value={actionObservation}
                        onChange={(e) => setActionObservation(e.target.value.toUpperCase())}
                        multiline
                        rows={3}
                        fullWidth
                        InputProps={{ readOnly: !canEdit }}
                        sx={!canEdit ? { '& .MuiInputBase-root': { bgcolor: 'action.hover' } } : {}}
                      />
                    </>
                  )}


                  {statusNorm === 'rejected' && item.cancelRemarks && (
                    <BOSTextField
                      label="Rejection Comments"
                      value={getLatestRejectionText(item.cancelRemarks, item.revNo)}
                      multiline
                      rows={2}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{ '& .MuiInputBase-root': { bgcolor: 'error.lighter' } }}
                    />
                  )}

                  {isWaitingForVerify && (
                    <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
                      <Typography variant="body2" color="info.dark" fontWeight={700}>
                        ⏳ Closure submitted successfully. Waiting for verifier/assigner to verify.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </BOSFormSection>

              {/* ── MOM Documents (Attached during Meeting Minutes Entry) ── */}
              {Boolean(momDocuments && momDocuments.length > 0) && (
                <BOSFormSection title="MOM Documents" icon={<IconPaperclip size={22} color={theme.palette.primary.main} />}>
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    {momDocuments.map((doc, idx) => {
                      const displayName = doc.fileName || doc.originalFileName || doc.name || doc.serverFileName || `MOM Document #${idx + 1}`;
                      const fileUrl = doc.serverFileName || doc.filePath || doc.url || doc;

                      return (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8f9fa',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(33,150,243,0.08)' : '#f0f7ff'
                            }
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.lighter',
                                color: 'primary.main',
                                width: 36,
                                height: 36,
                                borderRadius: '8px'
                              }}
                            >
                              <IconFileText size={20} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {displayName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Attached in Meeting Minutes
                              </Typography>
                            </Box>
                          </Stack>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<IconEye size={15} />}
                            onClick={() => {
                              setPreviewFile({
                                fileName: displayName,
                                serverFileName: fileUrl,
                                fileType: doc.fileType || displayName.split('.').pop()
                              });
                              setPreviewOpen(true);
                            }}
                            sx={{ borderRadius: '8px', fontWeight: 600, textTransform: 'none', px: 2 }}
                          >
                            View / Preview
                          </Button>
                        </Paper>
                      );
                    })}
                  </Stack>
                </BOSFormSection>
              )}

            </Box>

            {!isInfo && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <BOSFormSection title="Personnel Information" icon={<IconUser size={20} color={theme.palette.primary.main} />}>
                  <Stack spacing={3}>
                    {(() => {
                      const assignedByEmp = getEmployeeDetails(item.assignedBy?.employeeName || item.assignedBy, item.assignedById || item.assignedBy?.id);
                      const assignedToEmp = getEmployeeDetails(item.assignedTo?.employeeName || item.assignedTo, item.assignedToId || item.assignedTo?.id);

                      return (
                        <>
                          <BOSPersonnelCard
                            title="Assigned By"
                            name={assignedByEmp.employeeName}
                            empCode={assignedByEmp.oldEmpCode || '-'}
                            department={assignedByEmp.departmentName || '-'}
                            photo={assignedByEmp.employeePhotoUpload}
                            level={assignedByEmp.level || '-'}
                            color="primary.main"
                          />
                          <BOSPersonnelCard
                            title="Assigned To"
                            name={assignedToEmp.employeeName}
                            empCode={assignedToEmp.oldEmpCode || '-'}
                            department={assignedToEmp.departmentName || '-'}
                            photo={assignedToEmp.employeePhotoUpload}
                            level={assignedToEmp.level || '-'}
                            color="secondary.main"
                          />
                        </>
                      );
                    })()}
                  </Stack>
                </BOSFormSection>

                {/* Attachments */}
                {isAttachmentRequired && (
                  <BOSFormSection title="Attachments" icon={<IconPaperclip size={22} color={theme.palette.primary.main} />}>
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
                          disabled={!canEdit}
                          onPreview={(file) => { setPreviewFile(file); setPreviewOpen(true); }}
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
            )}
          </Box>
        </Stack>
      </BOSFormDialog>

      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
      />
    </>
  );
};

CloseMomDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default CloseMomDialog;
