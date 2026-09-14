import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import {
  MenuItem,
  Stack,
  Box,
  Typography,
  Chip,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import useLookups from 'hooks/useLookups';
import useAuth from 'hooks/useAuth';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import axios from 'utils/axios';

const getEmployeeName = (idOrCodeOrName, employeesList = []) => {
  if (!idOrCodeOrName || idOrCodeOrName === '-') return '-';
  const parts = String(idOrCodeOrName).split(',').map(p => p.trim());
  const resolvedParts = parts.map(part => {
    const emp = employeesList.find(
      (e) =>
        String(e.id) === String(part) ||
        String(e.empCode) === String(part) ||
        String(e.employeeCode) === String(part) ||
        String(e.employeeName).toLowerCase() === String(part).toLowerCase()
    );
    return emp ? emp.employeeName : part;
  });
  return resolvedParts.join(', ');
};
import {
  IconUser,
  IconCalendar,
  IconChecks,
  IconFileText,
  IconStatusChange,
  IconMessageDots,
  IconCloudUpload,
  IconBan,
  IconDeviceFloppy,
  IconClipboardList,
  IconSettings,
  IconPaperclip
} from '@tabler/icons-react';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSDatePicker,
  BOSStatusChip,
  BOSFileGallery,
  BOSFileUpload,
  parseFileString
} from 'ui-component/bos';
import BOSQmsAttachmentUpload from 'ui-component/bos/BOSQmsAttachmentUpload';

const formatDateForInput = (dateVal) => {
  if (!dateVal) return '';
  try {
    let d;
    if (typeof dateVal === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
      d = new Date(dateVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
};

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    let d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
    return `${day}/${month}/${year} ${strTime}`;
  } catch {
    return '-';
  }
};

/**
 * ExecutionVerifyDialog - Standardized BOS Template for Verification & Execution
 * Handles:
 * 1. Master Template verification (Admin)
 * 2. Assignment Execution verification (Auditor)
 * 3. Assignment Execution reporting (Executor - Editable mode)
 */
// Allowed execution status values — defined outside component to avoid re-creation on every render
const EXECUTION_STATUSES = ['Completed', 'Not Completed'];

const getExecutionStatuses = (category) => {
  if (category?.trim().toUpperCase() === 'RENEWAL') {
    return ['Started', '25%', '50%', '75%', 'Completed'];
  }
  return ['Completed', 'Not Completed'];
};

const ExecutionVerifyDialog = ({ open, handleClose, data, onVerify, onReject, onNotAccept, onSave, isExecution = false, verifyLoading = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { employees = [] } = useLookups(['EMPLOYEES']);

  const isAssignee =
    data?.assignedTo && (
      String(data.assignedTo).trim().toLowerCase() === String(user?.empId).trim().toLowerCase() ||
      String(data.assignedTo).trim().toLowerCase() === String(user?.id).trim().toLowerCase() ||
      String(data.assignedTo).trim().toLowerCase() === String(user?.userName).trim().toLowerCase() ||
      String(data.assignedTo).trim().toLowerCase() === String(user?.employeeName).trim().toLowerCase() ||
      String(data.assignedTo).trim().toLowerCase() === String(user?.name).trim().toLowerCase()
    );
  const [formData, setFormData] = useState({
    status: '',
    remarks: '',
    nextRenewalDate: '',
    actualFiles: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState(false);

  const isAssignment = !!data?.checklist;
  const master = isAssignment ? data?.checklist : data;
  const reminderDaysVal = parseInt(master?.reminderDays || master?.remainderDays || data?.reminderDays || data?.remainderDays || 0, 10);

  const minNextRenewalDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (reminderDaysVal > 0) {
      d.setDate(d.getDate() + 1 + reminderDaysVal);
    } else {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }, [reminderDaysVal]);

  const isChecklistCategory = master?.category?.trim().toUpperCase() === 'CHECK LIST';

  const [rejectionType, setRejectionType] = useState('REJECT'); // 'REJECT' or 'NOT_ACCEPT'
  const [actualQmsFiles, setActualQmsFiles] = useState([]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [shakeAnim, setShakeAnim] = useState(false);
  const [initialFileNames, setInitialFileNames] = useState(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (isExecution) {
          const errors = {};
          let hasError = false;
          const allowedStatuses = getExecutionStatuses(master?.category);
          if (!formData.status || !allowedStatuses.includes(formData.status)) {
            errors.status = 'Status is required.';
            hasError = true;
          }
          if (formData.status === 'Not Completed' && (!formData.remarks || !formData.remarks.trim())) {
            errors.remarks = 'Description is required.';
            hasError = true;
          }
          if (master?.category?.trim().toUpperCase() === 'RENEWAL' && formData.status === 'Completed') {
            if (!formData.nextRenewalDate || !formData.nextRenewalDate.trim()) {
              errors.nextRenewalDate = 'Next Renewal Date is required.';
              hasError = true;
            } else {
              const selectedDate = new Date(formData.nextRenewalDate);
              selectedDate.setHours(0, 0, 0, 0);
              const minDateCheck = new Date();
              minDateCheck.setHours(0, 0, 0, 0);
              if (reminderDaysVal > 0) {
                minDateCheck.setDate(minDateCheck.getDate() + 1 + reminderDaysVal);
                if (selectedDate < minDateCheck) {
                  errors.nextRenewalDate = `Next Renewal Date must be at least ${formatDate(minDateCheck)} (Reminder of ${reminderDaysVal} days requires Reminder Date to be from tomorrow onwards).`;
                  hasError = true;
                }
              } else {
                minDateCheck.setDate(minDateCheck.getDate() + 1);
                if (selectedDate < minDateCheck) {
                  errors.nextRenewalDate = 'Past dates are not allowed for Next Renewal Date.';
                  hasError = true;
                }
              }
            }
          }
          if ((formData.status?.toUpperCase() === 'COMPLETED') && master?.photoRequired?.toUpperCase() === 'YES' && supportingFiles.length === 0) {
            errors.photo = 'Photo/Scanned document is mandatory for completing this checklist item.';
            hasError = true;
          }
          if (data?.rejectedRemarks) {
            const currentFileNames = supportingFiles.map(f => f.serverFileName || f.fileName || f.name);
            const initialSet = new Set(initialFileNames || []);
            const currentSet = new Set(currentFileNames);
            let filesChanged = false;
            if (initialSet.size !== currentSet.size) {
              filesChanged = true;
            } else {
              for (const f of currentFileNames) {
                if (!initialSet.has(f)) {
                  filesChanged = true;
                  break;
                }
              }
            }
            if (!filesChanged) {
              errors.photo = 'You need to make at least one change to the documents (upload or remove a file) before submitting.';
              hasError = true;
            }
          }
          if (hasError) {
            setFormErrors(errors);
            setShakeAnim(false);
            setTimeout(() => setShakeAnim(true), 10);
            dispatch(openSnackbar({ open: true, message: 'Please fix the validation errors before saving.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
            return;
          }
          onSave({
            ...formData,
            actualFiles: supportingFiles.map(f => ({ name: f.fileName || f.name, isServer: true, serverFileName: f.serverFileName || f.fileName || f.name }))
          });
        } else {
          if (onVerify) {
            onVerify(verifyRemarks);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isExecution, formData, supportingFiles, verifyRemarks, onVerify, onSave, master, dispatch]);

  const getDisplayName = (fileName) => {
    if (!fileName) return '';
    const cleanName = fileName.replace(/\\/g, '/').split('/').pop();
    const parts = cleanName.split('_');
    return parts.length > 1 && parts[0].length >= 32 ? parts.slice(1).join('_') : cleanName;
  };



  const fetchReferenceFiles = async (masterObj) => {
    if (!masterObj) {
      setUploadedFiles([]);
      setScannedFiles([]);
      return;
    }
    const uploaded = parseFileString(masterObj.uploadedFiles);
    const scanned = parseFileString(masterObj.scannedFiles);
    setUploadedFiles(uploaded);
    setScannedFiles(scanned);
  };

  const fetchVerificationFiles = async (masterId) => {
    if (!masterId) {
      setVerificationFiles([]);
      return;
    }
    try {
      const res = await axios.get(`/api/master/qms/attachment/QM1110/${masterId}`);
      setVerificationFiles((res.data || []).map(f => ({
        id: f.id,
        name: getDisplayName(f.fileName),
        fileName: f.fileName,
        serverFileName: f.path || f.serverFileName || f.fileName,
        isServer: true,
        size: f.size || 0,
        createdDate: f.createdDate
      })));
    } catch (err) {
      console.error('Failed to fetch verification files:', err);
      setVerificationFiles([]);
    }
  };

  const fetchSupportingFiles = async (isAss, dataObj, masterObj) => {
    let refId = isAss ? dataObj?.id : masterObj?.id;
    if (refId && Number(refId) >= 10000000) {
      refId = Number(refId) - 10000000;
    }
    if (!refId) {
      setSupportingFiles([]);
      return;
    }
    try {
      const res = await axios.get(`/api/master/qms/attachment/QM1120/${refId}`);
      let mapped = (res.data || []).map(f => ({
        id: f.id,
        name: getDisplayName(f.fileName),
        fileName: f.fileName,
        serverFileName: f.path || f.serverFileName || f.fileName,
        isServer: true,
        size: f.size || 0,
        createdDate: f.createdDate
      }));

      // Fallback: If QMS_ATTACHMENT_PATH is empty, try to get it from assignment.actualFiles
      if (mapped.length === 0 && isAss && dataObj?.actualFiles && Array.isArray(dataObj.actualFiles)) {
        dataObj.actualFiles.forEach(fPath => {
          const fn = String(fPath).split(/[/\\]/).pop();
          if (fn) {
            mapped.push({
              id: 'legacy-' + fn,
              name: getDisplayName(fn),
              fileName: fn,
              serverFileName: fPath,
              isServer: true,
              size: 0
            });
          }
        });
      }

      setSupportingFiles(mapped);
      setActualQmsFiles(mapped);
      setInitialFileNames(mapped.map(f => f.serverFileName || f.fileName || f.name));
    } catch (err) {
      console.error('Failed to fetch supporting files:', err);
      setSupportingFiles([]);
      setInitialFileNames([]);
    }
  };

  const fetchRejectedFiles = async (pCode, rId) => {
    if (!rId) {
      setRejectedFiles([]);
      return;
    }
    try {
      const res = await axios.get(`/api/master/qms/attachment/${pCode}/${rId}`, {
        params: { docType: 'REJECTED' }
      });
      setRejectedFiles((res.data || []).map(f => ({
        id: f.id,
        name: getDisplayName(f.fileName),
        fileName: f.fileName,
        serverFileName: f.path || f.serverFileName || f.fileName,
        isServer: true,
        size: f.size || 0,
        createdDate: f.createdDate
      })));
    } catch (err) {
      console.error('Failed to fetch rejected files:', err);
      setRejectedFiles([]);
    }
  };

  const handleVerificationFilesChange = async (newFiles) => {
    if (!master?.id) return;
    const added = newFiles.filter(f => !verificationFiles.some(existing => existing.id === f.id || existing.name === f.name));
    if (added.length > 0) {
      const formData = new FormData();
      added.forEach(file => formData.append('files', file.file));
      try {
        await axios.post(`/api/master/qms/attachment/QM1110/${master.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchVerificationFiles(master.id);
      } catch (err) {
        console.error('Upload failed:', err);
      }
      return;
    }
    const removed = verificationFiles.filter(f => !newFiles.some(existing => existing.id === f.id));
    if (removed.length > 0) {
      try {
        await Promise.all(removed.map(f => axios.delete(`/api/master/qms/attachment/${f.id}`)));
        fetchVerificationFiles(master.id);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleSupportingFilesChange = async (newFiles) => {
    let refId = isAssignment ? data?.id : master?.id;
    if (refId && Number(refId) >= 10000000) {
      refId = Number(refId) - 10000000;
    }
    if (!refId) return;
    const added = newFiles.filter(f => !supportingFiles.some(existing => existing.id === f.id || existing.name === f.name));
    if (added.length > 0) {
      const formData = new FormData();
      added.forEach(file => formData.append('files', file.file));
      try {
        await axios.post(`/api/master/qms/attachment/QM1120/${refId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchSupportingFiles(isAssignment, data, master);
      } catch (err) {
        console.error('Upload failed:', err);
      }
      return;
    }
    const removed = supportingFiles.filter(f => !newFiles.some(existing => existing.id === f.id));
    if (removed.length > 0) {
      try {
        await Promise.all(removed.map(f => axios.delete(`/api/master/qms/attachment/${f.id}`)));
        fetchSupportingFiles(isAssignment, data, master);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open || !data) return;
      if (rejectOpen) return; // Let reject dialog handle its own events

      // Enter for Verify
      if (e.key === 'Enter' && !e.shiftKey) {
        if (document.activeElement.tagName === 'TEXTAREA') {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (onVerify) onVerify(verifyRemarks);
          }
          return;
        }
        e.preventDefault();
        if (onVerify) onVerify(verifyRemarks);
      }
      // Alt+R for Reject
      else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (onReject) {
          setRejectComment('');
          setRejectError(false);
          setRejectOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, data, onVerify, onReject, verifyRemarks, rejectOpen]);

  useEffect(() => {
    if (data) {
      setInitialFileNames(null);
      const isAss = !!data.checklist;
      let currentStatus = '';
      if (isAss) {
        if (typeof data.status === 'object' && data.status !== null) {
          currentStatus = data.status.name;
        } else {
          currentStatus = data.status || '';
        }
      } else {
        currentStatus = data.verifyStatus || '';
      }

      // If current status is not in the allowed execution statuses, reset to empty
      // so the dropdown shows the placeholder and the user must select a valid value.
      // BUT do not reset if it's a locked final status.
      const currentMaster = isAss ? data.checklist : data;
      const allowedStatuses = getExecutionStatuses(currentMaster?.category);
      if (isExecution && currentStatus && !allowedStatuses.includes(currentStatus)) {
        const lockedExecutionStatuses = ['Verified', 'VERIFIED', 'Accepted', 'ACCEPTED', 'Closed', 'CLOSED', 'Pending for Verified', 'PENDING FOR VERIFIED'];
        if (!lockedExecutionStatuses.includes(currentStatus)) {
          currentStatus = '';
        }
      }

      setFormData({
        status: currentStatus,
        remarks: data.remarks || '',
        nextRenewalDate: formatDateForInput(data.nextRenewalDate || ''),
        actualFiles: (data.actualFiles || []).map(f => {
          if (typeof f === 'string') {
            const [name, ...detailsParts] = f.split('|');
            const details = detailsParts.join('|');
            // IMPORTANT: serverFileName must be ONLY the filename for the API to work
            return {
              name: name,
              docDetails: details || '',
              isServer: true,
              serverFileName: name
            };
          }
          return f;
        })
      });
      setVerifyRemarks('');
      setRejectOpen(false);
      setRejectComment('');
      setRejectError(false);
      setActualQmsFiles([]);
      setFormErrors({});

      if (currentMaster) {
        fetchReferenceFiles(currentMaster);
        if (currentMaster.id) {
          fetchVerificationFiles(currentMaster.id);
        } else {
          setVerificationFiles([]);
        }
      } else {
        // currentMaster is null/undefined — clear all reference and verification files
        setUploadedFiles([]);
        setScannedFiles([]);
        setVerificationFiles([]);
      }
      if (data) {
        fetchSupportingFiles(isAss, data, currentMaster);
      } else {
        setSupportingFiles([]);
      }
      const pCode = isAss ? "QM1120" : "QM1110";
      const rId = isAss ? (Number(data?.id) >= 10000000 ? Number(data?.id) - 10000000 : data?.id) : currentMaster?.id;
      if (rId) {
        fetchRejectedFiles(pCode, rId);
      } else {
        setRejectedFiles([]);
      }
    }
  }, [data, open]);

  const handleClear = () => {
    setFormData({
      status: '',
      remarks: '',
      nextRenewalDate: '',
      actualFiles: []
    });
    setFormErrors({});
    setActualQmsFiles([]);
    setUploadedFiles([]);
    setScannedFiles([]);
    setVerificationFiles([]);
    setSupportingFiles([]);
    setRejectedFiles([]);
    setInitialFileNames(null);
  };

  if (!data) return null;

  const statusText = isAssignment
    ? ((typeof data.status === 'object' ? data.status?.name : data.status) || 'Pending')
    : (data.verifyStatus || 'Pending for Verify');

  // Helper for status chip
  let chipStatus = 'PENDING';
  const stUpper = statusText ? statusText.toUpperCase() : '';
  if (stUpper === 'VERIFIED' || stUpper === 'ACCEPTED' || stUpper === 'COMPLETED' || stUpper === 'ACTIVE') chipStatus = 'ACTIVE';
  if (stUpper === 'REJECTED' || stUpper === 'MISSED' || stUpper === 'NOT COMPLETED' || stUpper === 'IN ACTIVE') chipStatus = 'INACTIVE';

  const STATUS_ORDER = { 'Started': 1, '25%': 2, '50%': 3, '75%': 4, 'Completed': 5 };
  const getAvailableStatuses = (currentStatus) => {
    const cs = typeof currentStatus === 'object' ? currentStatus?.name : currentStatus;
    const locked = isExecution
      ? ['Verified', 'VERIFIED', 'Accepted', 'ACCEPTED', 'Closed', 'CLOSED', 'Pending for Verified', 'PENDING FOR VERIFIED']
      : ['Completed', 'COMPLETED', 'Verified', 'VERIFIED', 'Accepted', 'ACCEPTED', 'Pending for Verified', 'Pending for Accepted', 'Closed', 'CLOSED'];
    if (cs && locked.includes(cs)) return [cs];

    const allowed = getExecutionStatuses(master?.category);

    if (isExecution) {
      return allowed;
    }

    if (!cs || cs === 'Pending' || cs === 'Active' || cs === 'Rejected') return allowed;

    if (isChecklistCategory) {
      return allowed;
    }

    const currentOrder = STATUS_ORDER[cs] || 0;
    return Object.entries(STATUS_ORDER)
      .filter(([, order]) => order >= currentOrder)
      .map(([name]) => name);
  };

  const parseFile = (f) => {
    if (typeof f === 'string') {
      const [name, ...detailsParts] = f.split('|');
      const details = detailsParts.join('|');
      return {
        name: name,
        docDetails: details || '',
        isServer: true,
        serverFileName: name
      };
    }
    return f;
  };


  const sidebarContent = (
    <Stack spacing={4} sx={{ minWidth: 0, overflow: 'hidden' }}>
      {uploadedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, minWidth: 0 }}>
            <IconPaperclip size={20} color={theme.palette.primary.main} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Master Document</Typography>
          </Box>
          <BOSFileUpload
            files={uploadedFiles}
            onChange={setUploadedFiles}
            module="MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER"
            multiple={true}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            disabled={true}
            hideDropzone={true}
            label=""
          />
        </Box>
      )}

      {scannedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, minWidth: 0 }}>
            <IconPaperclip size={20} color={theme.palette.primary.main} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Master Scanned Document</Typography>
          </Box>
          <BOSFileUpload
            files={scannedFiles}
            onChange={setScannedFiles}
            module="MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER"
            multiple={true}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            disabled={true}
            hideDropzone={true}
            label=""
          />
        </Box>
      )}

      {isAssignment && !isExecution && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Actual Proof (Execution)</Typography>
          <BOSQmsAttachmentUpload
            pageCode="QM1120"
            refId={isAssignment ? (Number(data?.id) >= 10000000 ? Number(data?.id) - 10000000 : data?.id) : master?.id}
            docType="GENERAL"
            onFilesChange={(files) => {
              setSupportingFiles(files);
              setFormErrors(p => ({ ...p, photo: undefined }));
            }}
            multiple={true}
            disabled={true}
            label="Upload Actual Proof"
          />
        </Box>
      )}

      {isExecution && (
        <Box
          className={formErrors.photo && shakeAnim ? 'shake-animation' : ''}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: formErrors.photo ? 1.5 : 0,
            border: formErrors.photo ? `2px dashed ${theme.palette.error.main}` : 'none',
            borderRadius: 2,
            bgcolor: formErrors.photo ? 'error.lighter' : 'transparent',
            transition: 'all 0.3s ease',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: formErrors.photo ? 'error.main' : 'text.primary', mb: 1 }}>
            Upload Actual Proof {master.photoRequired?.toUpperCase() === 'YES' && <span style={{ color: 'red' }}>*</span>}
          </Typography>
          <BOSQmsAttachmentUpload
            pageCode="QM1120"
            refId={isAssignment ? (Number(data?.id) >= 10000000 ? Number(data?.id) - 10000000 : data?.id) : master?.id}
            docType="GENERAL"
            onFilesChange={(files) => {
              setSupportingFiles(files);
              setFormErrors(p => ({ ...p, photo: undefined }));
            }}
            multiple={true}
            disabled={!isExecution}
            label="Upload Actual Proof"
            error={!!formErrors.photo}
            helperText={formErrors.photo}
          />
          {formErrors.photo && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.8rem' }}>
              {formErrors.photo}
            </Typography>
          )}
        </Box>
      )}

      {rejectedFiles.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, minWidth: 0 }}>
            <IconPaperclip size={20} color={theme.palette.error.main} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rejected Documents</Typography>
          </Box>
          <BOSFileUpload
            files={rejectedFiles}
            onChange={setRejectedFiles}
            module={isAssignment ? "QUALITY_MANAGEMENT_SYSTEMS_CHECKLIST_CLOSE_CHECKLIST_RENEWAL" : "MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER"}
            multiple={true}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            disabled={true}
            hideDropzone={true}
            label=""
          />
        </Box>
      )}
    </Stack>
  );

  return (
    <>
      <style>{`
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .shake-animation {
          animation: shakeError 0.4s ease-in-out;
        }
      `}</style>
      <BOSFormDialog
        open={open}
        onClose={handleClose}
        onSave={isExecution ? () => {
          const errors = {};
          let hasError = false;
          const allowedStatuses = getExecutionStatuses(master?.category);
          if (!formData.status || !allowedStatuses.includes(formData.status)) {
            errors.status = 'Status is required.';
            hasError = true;
          }
          if (formData.status === 'Not Completed' && (!formData.remarks || !formData.remarks.trim())) {
            errors.remarks = 'Description is required.';
            hasError = true;
          }
          if (master?.category?.trim().toUpperCase() === 'RENEWAL' && formData.status === 'Completed') {
            if (!formData.nextRenewalDate || !formData.nextRenewalDate.trim()) {
              errors.nextRenewalDate = 'Next Renewal Date is required.';
              hasError = true;
            } else {
              const selectedDate = new Date(formData.nextRenewalDate);
              selectedDate.setHours(0, 0, 0, 0);
              const minDateCheck = new Date();
              minDateCheck.setHours(0, 0, 0, 0);
              if (reminderDaysVal > 0) {
                minDateCheck.setDate(minDateCheck.getDate() + 1 + reminderDaysVal);
                if (selectedDate < minDateCheck) {
                  errors.nextRenewalDate = `Next Renewal Date must be at least ${formatDate(minDateCheck)} (Reminder of ${reminderDaysVal} days requires Reminder Date to be from tomorrow onwards).`;
                  hasError = true;
                }
              } else {
                minDateCheck.setDate(minDateCheck.getDate() + 1);
                if (selectedDate < minDateCheck) {
                  errors.nextRenewalDate = 'Past dates are not allowed for Next Renewal Date.';
                  hasError = true;
                }
              }
            }
          }
          if ((formData.status?.toUpperCase() === 'COMPLETED') && master.photoRequired?.toUpperCase() === 'YES' && supportingFiles.length === 0) {
            errors.photo = 'Photo/Scanned document is mandatory for completing this checklist item.';
            hasError = true;
          }
          if (data?.rejectedRemarks) {
            const currentFileNames = supportingFiles.map(f => f.serverFileName || f.fileName || f.name);
            const initialSet = new Set(initialFileNames || []);
            const currentSet = new Set(currentFileNames);
            let filesChanged = false;
            if (initialSet.size !== currentSet.size) {
              filesChanged = true;
            } else {
              for (const f of currentFileNames) {
                if (!initialSet.has(f)) {
                  filesChanged = true;
                  break;
                }
              }
            }
            if (!filesChanged) {
              errors.photo = 'You need to make at least one change to the documents (upload or remove a file) before submitting.';
              hasError = true;
            }
          }
          if (hasError) {
            setFormErrors(errors);
            setShakeAnim(false);
            setTimeout(() => setShakeAnim(true), 10);
            dispatch(openSnackbar({ open: true, message: 'Please fix the validation errors before saving.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
            return;
          }
          onSave({
            ...formData,
            actualFiles: supportingFiles.map(f => ({ name: f.fileName || f.name, isServer: true, serverFileName: f.serverFileName || f.fileName || f.name }))
          });
        } : null}
        onClear={isExecution ? handleClear : null}
        title={isExecution ? `Update Progress - ${master.seqNo}${data?.groupName ? ` [${data.groupName}]` : ''}` : (isAssignment ? `Verify Execution - ${master.seqNo}${data?.groupName ? ` [${data.groupName}]` : ''}` : `Verify Master Record - ${master.seqNo}`)}
        maxWidth="lg"
        isViewOnly={!isExecution}
        showCloseInFooter={false}
        sidebar={sidebarContent}
        hideCollapse={true}
        secondaryActions={
          !isExecution && (onVerify || onReject) && !isAssignee && (
            <Stack direction="row" spacing={1.5}>
              <Tooltip title={shortcutTooltip('Reject')} arrow>
                <span>
                  <Button
                    data-shortcut="reject"
                    variant="contained"
                    color="error"
                    onClick={() => {
                      setRejectionType('REJECT');
                      setRejectComment('');
                      setRejectError(false);
                      setRejectOpen(true);
                    }}
                    startIcon={<IconBan size={20} />}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  >
                    Reject
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={shortcutTooltip('Verify')} arrow>
                <span>
                  <Button
                    data-shortcut="verify"
                    variant="contained"
                    color="success"
                    onClick={() => onVerify(verifyRemarks)}
                    startIcon={<IconChecks size={20} />}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          )
        }
      >
        <Stack spacing={3}>
          {isAssignment && (
            <BOSFormSection title="Assignment Header" icon={<IconUser size={20} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: data?.groupName ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr' }, gap: 3, mb: 2 }}>
                <BOSTextField label="Assign To" value={data.assignedToName || getEmployeeName(data.assignedTo || master.assignTo, employees)} InputProps={{ readOnly: true }} />
                <BOSTextField label="Date" value={formatDate(data.checklistDate)} InputProps={{ readOnly: true }} />
                {data?.groupName && (
                  <BOSTextField label="Group Name" value={data.groupName} InputProps={{ readOnly: true }} />
                )}
                <BOSTextField label="Assign Type" value={data.assignType || ''} InputProps={{ readOnly: true }} />
              </Box>
              {master.stockLink === 'YES' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <BOSTextField label="Item Code" value={master.itemCode || '-'} InputProps={{ readOnly: true }} />
                  <BOSTextField label="Qty" value={master.qty || '-'} InputProps={{ readOnly: true }} />
                </Box>
              )}
            </BOSFormSection>
          )}

          <BOSFormSection title="Checklist Category Details" icon={<IconClipboardList size={22} color={theme.palette.primary.main} />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <BOSTextField label="Sequence No" value={master.seqNo || ''} InputProps={{ readOnly: true }} />
              <BOSTextField label="Category" value={master.category || ''} InputProps={{ readOnly: true }} />
            </Box>

            {master.category === 'RENEWAL' && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 3, mt: 3 }}>
                <BOSTextField label="Expiry Date" value={formatDate(master.expiryDate)} InputProps={{ readOnly: true }} />
                <BOSTextField label="Reminder Days" value={master.reminderDays || ''} InputProps={{ readOnly: true }} />
                <BOSTextField label="Reminder Date" value={formatDate(master.reminderDate)} InputProps={{ readOnly: true }} />
                {(() => {
                  const targetDate = data?.nextRenewalDate || master?.nextRenewalDate;
                  if (!targetDate) return null;
                  const d = new Date(targetDate);
                  if (isNaN(d.getTime())) return null;
                  return (
                    <BOSTextField label="Next Renewal Date" value={formatDate(targetDate)} InputProps={{ readOnly: true }} />
                  );
                })()}
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <BOSTextField
                label={master.category === 'RENEWAL' ? "Renewal Point" : "Checking Point"}
                value={master.checkingPoint || ''}
                InputProps={{ readOnly: true }}
              />
            </Box>

            <Box sx={{ mt: 3, '& .ql-editor': { minHeight: '100px !important', pb: '10px !important' } }}>
              <BOSTextField
                label="Descriptions/SOP"
                value={master.description || ''}
                multiline
                minRows={4}
                readOnly={true}
              />
            </Box>
          </BOSFormSection>

          <BOSFormSection title="Execution & Frequency Controls" icon={<IconSettings size={22} color={theme.palette.primary.main} />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <BOSTextField
                label="Department"
                value={(master.departments || []).map(d => d.departmentName || d).join(', ') || ''}
                InputProps={{ readOnly: true }}
              />

              {master.category !== 'RENEWAL' && (
                <BOSTextField
                  label="Effective From"
                  value={formatDate(master.effectiveFrom)}
                  InputProps={{ readOnly: true }}
                />
              )}

              <BOSTextField label="Stock Link ?" value={master.stockLink || ''} InputProps={{ readOnly: true }} />

              {master.category !== 'RENEWAL' && (
                <BOSTextField label="Frequency" value={master.frequency || ''} InputProps={{ readOnly: true }} />
              )}

              {master.category !== 'RENEWAL' && master.frequency === 'WEEKLY' && (
                <BOSTextField label="Week Day" value={master.weekDays || ''} InputProps={{ readOnly: true }} />
              )}

              {master.category !== 'RENEWAL' && master.frequency === 'CUSTOM' && (
                <>
                  <BOSTextField label="Repeat Every" value={master.repeatEveryValue || ''} InputProps={{ readOnly: true }} />
                  <BOSTextField label="Schedule" value={master.repeatEveryUnit || ''} InputProps={{ readOnly: true }} />
                </>
              )}

              <BOSTextField label="Photo Required ?" value={master.photoRequired || ''} InputProps={{ readOnly: true }} />

              <BOSTextField
                label={master.category === 'RENEWAL' ? 'Verification Required ?' : 'Dual Check ?'}
                value={(() => { const v = master.category === 'RENEWAL' ? master.verificationRequired : master.dualCheck; const s = v?.toString().toUpperCase(); return (s === 'YES' || s === '1') ? 'YES' : 'NO'; })()}
                InputProps={{ readOnly: true }}
              />

              {master.category !== 'RENEWAL' && (
                <BOSTextField label="Carry Forward ?" value={master.carryForward || ''} InputProps={{ readOnly: true }} />
              )}

              {master.category !== 'RENEWAL' && (
                <BOSTextField label="Status" value={master.status || ''} InputProps={{ readOnly: true }} />
              )}
            </Box>
          </BOSFormSection>

          {data && (
            <BOSFormSection title="Verification Details" icon={<IconChecks size={22} color={theme.palette.success.main} />}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                <BOSTextField
                  label="Created By"
                  value={data.createdBy || data.checklist?.createdUser || data.checklist?.createdBy || '-'}
                  InputProps={{ readOnly: true }}
                />
                <BOSTextField
                  label="Verification Status"
                  value={(() => {
                    const hasVerifyStatus = data.verifyStatus?.name || (typeof data.verifyStatus === 'string' ? data.verifyStatus : '');
                    if (hasVerifyStatus && hasVerifyStatus !== 'N/A' && hasVerifyStatus !== 'Pending') {
                      return hasVerifyStatus.toUpperCase();
                    }
                    if (data.rejectedBy) {
                      return 'REJECTED';
                    }
                    const s = data.status?.name || (typeof data.status === 'string' ? data.status : '') || '-';
                    return s.toUpperCase();
                  })()}
                  InputProps={{ readOnly: true }}
                />
                <BOSTextField
                  label="Verified By"
                  value={(() => {
                    const hasVerifyStatus = data.verifyStatus?.name || (typeof data.verifyStatus === 'string' ? data.verifyStatus : '');
                    if (hasVerifyStatus && hasVerifyStatus !== 'N/A' && hasVerifyStatus !== 'Pending') {
                      return data.verifiedBy || '-';
                    }
                    if (data.rejectedBy) {
                      return data.rejectedBy;
                    }
                    return data.verifiedBy || '-';
                  })()}
                  InputProps={{ readOnly: true }}
                />
                <BOSTextField
                  label="Created Date & Time"
                  value={formatDateTime(data.createdDate || data.createdAt)}
                  InputProps={{ readOnly: true }}
                />
                <BOSTextField
                  label="Verified Date & Time"
                  value={(() => {
                    const hasVerifyStatus = data.verifyStatus?.name || (typeof data.verifyStatus === 'string' ? data.verifyStatus : '');
                    if (hasVerifyStatus && hasVerifyStatus !== 'N/A' && hasVerifyStatus !== 'Pending') {
                      return formatDateTime(data.verifiedDate || data.updatedAt);
                    }
                    if (data.rejectedBy) {
                      return formatDateTime(data.rejectedDate);
                    }
                    return formatDateTime(data.verifiedDate);
                  })()}
                  InputProps={{ readOnly: true }}
                />
                {(() => {
                  const targetDate = data?.nextRenewalDate || master?.nextRenewalDate;
                  if (!targetDate) return null;
                  const d = new Date(targetDate);
                  if (isNaN(d.getTime())) return null;
                  return (
                    <BOSTextField label="Next Renewal Date" value={formatDate(targetDate)} InputProps={{ readOnly: true }} />
                  );
                })()}
              </Box>
            </BOSFormSection>
          )}

          <BOSFormSection title={isExecution ? "Execution Update" : "Status & Feedback"} icon={<IconStatusChange size={20} color={theme.palette.warning.main} />}>
            <Stack spacing={2.5}>
              {data?.rejectedRemarks && (
                <BOSTextField
                  label={`Rejection Remarks (by ${data.rejectedBy || 'Verifier'} on ${formatDate(data.rejectedDate)})`}
                  value={data.rejectedRemarks}
                  multiline
                  rows={3}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#ffebee', color: '#c62828', borderColor: '#ef9a9a' } }}
                />
              )}
              {!isExecution && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Status:</Typography>
                  <BOSStatusChip status={statusText} showIcon={true} width={120} />
                </Box>
              )}

              {isExecution ? (
                <>
                  {data.remarks && (
                    <BOSTextField
                      label="Previous Remarks / Manager Feedback"
                      value={data.remarks}
                      multiline
                      rows={3}
                      InputProps={{ readOnly: true }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff8f0' } }}
                    />
                  )}
                  <BOSTextField
                    select
                    label="Status"
                    value={formData.status || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(p => ({
                        ...p,
                        status: val,
                        remarks: val === 'Completed' ? '' : p.remarks
                      }));
                      setFormErrors(p => ({ ...p, status: undefined, remarks: undefined, nextRenewalDate: undefined }));
                    }}
                    required
                    disabled={getAvailableStatuses(data?.status).length <= 1 && getAvailableStatuses(data?.status)[0] === (typeof data?.status === 'object' ? data?.status?.name : data?.status)}
                    error={!!formErrors.status}
                    helperText={formErrors.status || (getAvailableStatuses(data?.status).length <= 1 && getAvailableStatuses(data?.status)[0] === (typeof data?.status === 'object' ? data?.status?.name : data?.status) ? 'Status is locked' : '')}
                  >
                    {getAvailableStatuses(data?.status).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </BOSTextField>
                  {master?.category?.trim().toUpperCase() === 'RENEWAL' && formData.status === 'Completed' && (
                    <Box className={formErrors.nextRenewalDate && shakeAnim ? 'shake-animation' : ''}>
                      <BOSDatePicker
                        label="Next Renewal Date"
                        name="nextRenewalDate"
                        value={formData.nextRenewalDate || ''}
                        onChange={(e) => {
                          setFormData(p => ({ ...p, nextRenewalDate: e.target.value }));
                          setFormErrors(p => ({ ...p, nextRenewalDate: undefined }));
                        }}
                        minDate={minNextRenewalDate}
                        disablePast
                        required
                        error={!!formErrors.nextRenewalDate}
                        helperText={formErrors.nextRenewalDate}
                      />
                    </Box>
                  )}
                  {formData.status === 'Not Completed' && (
                    <Box className={formErrors.remarks && shakeAnim ? 'shake-animation' : ''}>
                      <BOSTextField
                        label="Description"
                        value={formData.remarks}
                        onChange={(e) => {
                          setFormData(p => ({ ...p, remarks: e.target.value }));
                          setFormErrors(p => ({ ...p, remarks: undefined }));
                        }}
                        multiline
                        rows={3}
                        placeholder="Describe your progress..."
                        inputProps={{ maxLength: 500 }}
                        required
                        error={!!formErrors.remarks}
                        helperText={formErrors.remarks}
                      />
                    </Box>
                  )}
                </>
              ) : null}

              {isExecution && statusText === 'Rejected' && data.rejReason && (
                <BOSTextField
                  label="Status Feedback"
                  value={data.rejReason}
                  multiline
                  rows={2}
                  InputProps={{ readOnly: true }}
                  color="error"
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'error.lighter' } }}
                />
              )}
            </Stack>
          </BOSFormSection>
        </Stack>

        {/* MANDATORY REJECTION COMMENTS POPUP */}
        <BOSFormDialog
          open={rejectOpen}
          onClose={() => setRejectOpen(false)}
          onSave={() => {
            if (!rejectComment.trim()) {
              setRejectError(true);
              return;
            }
            if (onReject) {
              onReject(rejectComment.trim());
            } else if (onNotAccept) {
              onNotAccept(rejectComment.trim());
            }
            setRejectOpen(false);
          }}
          title={`Reject Checklist - ${master?.seqNo || ''}`}
          maxWidth="sm"
          sx={{ zIndex: 1400 }}
        >
          <Stack spacing={2.5}>
            <Typography variant="body1" color="text.secondary">
              Please enter a comment explaining the reason for rejecting this checklist item. Comments are mandatory to reject.
            </Typography>
            <BOSTextField
              label="Status Feedback"
              value={rejectComment}
              onChange={(e) => { setRejectComment(e.target.value); if (rejectError) setRejectError(false); }}
              multiline
              rows={4}
              placeholder="Provide detailed rejection feedback here..."
              required
              error={rejectError}
              helperText={rejectError ? "Please enter the Status Feedback before rejecting the checklist." : ""}
              fullWidth
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Attachment (Optional)
              </Typography>
              <BOSQmsAttachmentUpload
                pageCode={isAssignment ? "QM1120" : "QM1110"}
                refId={isAssignment ? (Number(data?.id) >= 10000000 ? Number(data?.id) - 10000000 : data?.id) : master?.id}
                docType="REJECTED"
                multiple={true}
                label="Upload Rejection Attachment"
                onFilesChange={(files) => {
                  const pCode = isAssignment ? "QM1120" : "QM1110";
                  const rId = isAssignment ? (Number(data?.id) >= 10000000 ? Number(data?.id) - 10000000 : data?.id) : master?.id;
                  fetchRejectedFiles(pCode, rId);
                }}
              />
            </Box>
          </Stack>
        </BOSFormDialog>
      </BOSFormDialog>
    </>
  );
};

export default ExecutionVerifyDialog;
