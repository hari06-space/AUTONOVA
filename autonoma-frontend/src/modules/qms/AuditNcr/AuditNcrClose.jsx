import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Typography, Stack, Tooltip, IconButton, Box, useTheme, Chip, MenuItem } from '@mui/material';
import { IconAlertTriangle, IconFileDownload, IconEye, IconCircleCheck, IconUser } from '@tabler/icons-react';
import { getFileDownloadUrl } from 'utils/upload-helper';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { format, differenceInDays } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSPersonnelCard,
  BOSFileUpload,
  BOSFileGallery,
  BOSStatusChip,
  BOSTableToolbar,
  getCommonDateFilters
} from 'ui-component/bos';
import useBOSForm from 'hooks/useBOSForm';
import { errorStyle } from 'ui-component/bos/BOSStyles';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';

// ==============================|| AUDIT NCR / OFI CLOSURE (REFACTORED WITH PATTERNS) ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'observationNo', label: 'OBSERVATION NO', minWidth: 130, bold: true },
  { id: 'observationDate', label: 'OBSERVATION DATE', minWidth: 130 },
  { id: 'targetDate', label: 'TARGET DATE', minWidth: 120 },
  { id: 'auditScheduleNo', label: 'SCHEDULE NO', minWidth: 120 },
  { id: 'auditType', label: 'AUDIT TYPE', minWidth: 120 },
  { id: 'departmentName', label: 'DEPARTMENT', minWidth: 120 },
  { id: 'seqNo', label: 'SEQ NO', minWidth: 80 },
  { id: 'clause', label: 'CLAUSE', minWidth: 80 },
  { id: 'criteriaDetails', label: 'CRITERIA DETAILS', minWidth: 250 },
  { id: 'auditee', label: 'AUDITEE', minWidth: 150 },
  { id: 'auditor', label: 'AUDITOR', minWidth: 150 },
  { id: 'ncrApprovedBy', label: 'NC APPROVED BY', minWidth: 150 },
  { id: 'attachmentReq', label: 'ATTACH REQ', minWidth: 100 },
  { id: 'observationStatus', label: 'OBR STATUS', minWidth: 100 },
  { id: 'ncrStatus', label: 'NCR STATUS', minWidth: 130 },
  { id: 'approvalStatus', label: 'VERIFY STATUS', minWidth: 130 },
  { id: 'delayDays', label: 'DELAY DAYS', minWidth: 100 }
];
const readOnlyFieldSx = {
  '& .MuiInputBase-input': {
    color: '#0f172a !important',
    WebkitTextFillColor: '#0f172a !important',
    fontWeight: 600,
    fontSize: '0.875rem'
  },
  '& .MuiInputBase-input.Mui-disabled': {
    color: '#0f172a !important',
    WebkitTextFillColor: '#0f172a !important',
    opacity: '1 !important'
  },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#f8fafc !important',
    opacity: '1 !important',
    '& fieldset': {
      borderColor: '#cbd5e1 !important'
    }
  },
  '& .MuiOutlinedInput-root.Mui-disabled': {
    bgcolor: '#f8fafc !important',
    opacity: '1 !important',
    '& fieldset': {
      borderColor: '#cbd5e1 !important'
    }
  },
  '& .MuiInputLabel-root': {
    color: '#334155 !important',
    fontWeight: 700,
    opacity: '1 !important'
  },
  '& .MuiInputLabel-root.Mui-disabled': {
    color: '#334155 !important',
    fontWeight: 700,
    opacity: '1 !important'
  }
};

const getStatusDisplay = (status) => {
  return status?.replace('_', ' ') || 'PENDING';
};

const parseRejectionHistory = (cancelRemarks) => {
  if (!cancelRemarks || !cancelRemarks.trim()) return [];
  try {
    const parsed = JSON.parse(cancelRemarks);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [{ revNo: 0, remarks: cancelRemarks, rejectedBy: 'system', rejectedAt: '-' }];
  }
};

export default function AuditNcrClose() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_NCR_CLOSE);
  const bosFilters = useBOSFilters(perms);

  const globalMaxResult = useSelector((state) => state.search?.maxResult);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(() => {
    const stored = globalMaxResult || sessionStorage.getItem('maxResult') || localStorage.getItem('defaultMaxRecords');
    return stored ? parseInt(stored, 10) : 50;
  });

  useEffect(() => {
    if (globalMaxResult) {
      const parsed = parseInt(globalMaxResult, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setSize(parsed);
      }
    }
  }, [globalMaxResult]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [nextNcrNo, setNextNcrNo] = useState('');
  const [isNewMode, setIsNewMode] = useState(false);
  const [ncrAttachments, setNcrAttachments] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null); // Issue 5: dirty-check baseline
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const matchingCriteria = useMemo(() => {
    if (!selectedFinding || !criteriaList) return null;
    let match = null;

    if (selectedFinding.criteriaId) {
      match = criteriaList.find((c) => c.id === selectedFinding.criteriaId);
    }

    const normalize = (str) => String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();

    if (!match && selectedFinding.seqNo && String(selectedFinding.seqNo).trim() !== '') {
      match = criteriaList.find((c) => String(c.seqNo).trim() === String(selectedFinding.seqNo).trim());
    }

    if (!match && selectedFinding.clause && String(selectedFinding.clause).trim() !== '') {
      match = criteriaList.find((c) => normalize(c.clause) === normalize(selectedFinding.clause));
    }

    if (!match && selectedFinding.criteriaDetails && String(selectedFinding.criteriaDetails).trim() !== '') {
      match = criteriaList.find((c) => {
        const t1 = normalize(c.criteriaText).replace(/\s/g, '');
        const t2 = normalize(selectedFinding.criteriaDetails).replace(/\s/g, '');
        if (!t1 || !t2) return false;
        return t1 === t2 || t1.includes(t2) || t2.includes(t1);
      });
    }

    if (match && selectedFinding.auditType) {
      const refineMatch = criteriaList.find(
        (c) => {
          const t1 = normalize(c.criteriaText).replace(/\s/g, '');
          const t2 = normalize(selectedFinding.criteriaDetails).replace(/\s/g, '');
          const textMatch = t1 && t2 && (t1 === t2 || t1.includes(t2) || t2.includes(t1));
          return ((selectedFinding.seqNo && String(c.seqNo).trim() === String(selectedFinding.seqNo).trim()) ||
            (selectedFinding.clause && normalize(c.clause) === normalize(selectedFinding.clause)) ||
            (selectedFinding.criteriaDetails && c.criteriaText && textMatch)) &&
            (normalize(c.auditType) === normalize(selectedFinding.auditType) ||
              normalize(c.auditType).includes(normalize(selectedFinding.auditType)));
        }
      );
      if (refineMatch) match = refineMatch;
    }
    console.log("=== CRITERIA MATCHING ===");
    console.log("selectedFinding:", selectedFinding);
    console.log("criteriaList:", criteriaList);
    console.log("match found:", match);
    return match;
  }, [selectedFinding, criteriaList]);

  const criteriaAttachments = useMemo(() => {
    console.log("=== CRITERIA ATTACHMENTS ===");
    console.log("matchingCriteria:", matchingCriteria);
    console.log("attachmentInfo:", matchingCriteria?.attachmentInfo);
    if (!matchingCriteria?.attachmentInfo) return [];
    try {
      const parsed = JSON.parse(matchingCriteria.attachmentInfo);
      console.log("parsed criteria attachments:", parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [matchingCriteria]);

  // Parse observation detail attachments robustly (single path, comma-separated, or JSON)
  const observationAttachments = useMemo(() => {
    const path = selectedFinding?.attachmentPath;
    if (!path || !path.trim()) return [];
    // Try parsing as JSON first (in case it was stored as JSON array)
    try {
      const parsed = JSON.parse(path);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          fileName: item.fileName || item.serverFileName?.split('/').pop() || item.path?.split('/').pop() || 'Document',
          serverFileName: item.path || item.serverFileName || item.filePath || ''
        }));
      }
    } catch {
      // Not JSON, treat as path string
    }
    return [{
      fileName: path.trim().split('/').pop(),
      serverFileName: path.trim()
    }];
  }, [selectedFinding]);

  const formattedCriteriaAttachments = useMemo(() => {
    return criteriaAttachments.map((att) => {
      const path = att.path || att.serverFileName || att.filePath || '';
      const name = att.fileName || path.split('/').pop() || 'Document';
      return {
        id: att.id || path,
        fileName: name,
        serverFileName: path,
        isServer: true
      };
    });
  }, [criteriaAttachments]);

  const formattedObservationAttachments = useMemo(() => {
    const list = [...observationAttachments, ...ncrAttachments.filter(a => a.fileType !== 'ROOT_CAUSE' && a.fileType !== 'CORRECTIVE' && a.fileType !== 'PREVENTIVE' && a.docDetails !== 'ROOT_CAUSE' && a.docDetails !== 'CORRECTIVE' && a.docDetails !== 'PREVENTIVE')];
    return list.map((att) => {
      const path = att.serverFileName || att.filePath || att.path || '';
      const name = att.fileName || path.split('/').pop() || 'Document';
      return {
        id: att.id || path,
        fileName: name,
        serverFileName: path,
        isServer: true,
        docDetails: att.fileType || att.docDetails || 'Evidence'
      };
    });
  }, [observationAttachments, ncrAttachments]);

  const rootCauseFiles = useMemo(() => {
    const prev = ncrAttachments
      .filter((a) => a.fileType === 'ROOT_CAUSE' || a.docDetails === 'ROOT_CAUSE')
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        serverFileName: a.filePath || a.serverFileName,
        isServer: true,
        docDetails: 'ROOT_CAUSE'
      }));
    const next = uploadedFiles.filter((f) => f.docDetails === 'ROOT_CAUSE');
    return [...prev, ...next];
  }, [ncrAttachments, uploadedFiles]);

  const correctiveFiles = useMemo(() => {
    const prev = ncrAttachments
      .filter((a) => a.fileType === 'CORRECTIVE' || a.docDetails === 'CORRECTIVE')
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        serverFileName: a.filePath || a.serverFileName,
        isServer: true,
        docDetails: 'CORRECTIVE'
      }));
    const next = uploadedFiles.filter((f) => f.docDetails === 'CORRECTIVE');
    return [...prev, ...next];
  }, [ncrAttachments, uploadedFiles]);

  const preventiveFiles = useMemo(() => {
    const prev = ncrAttachments
      .filter((a) => a.fileType === 'PREVENTIVE' || a.docDetails === 'PREVENTIVE')
      .map((a) => ({
        id: a.id,
        fileName: a.fileName,
        serverFileName: a.filePath || a.serverFileName,
        isServer: true,
        docDetails: 'PREVENTIVE'
      }));
    const next = uploadedFiles.filter((f) => f.docDetails === 'PREVENTIVE');
    return [...prev, ...next];
  }, [ncrAttachments, uploadedFiles]);

  const handleFilesChange = (category, categoryFiles) => {
    const newFiles = categoryFiles.filter((f) => !ncrAttachments.some((prev) => prev.id === f.id));
    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.docDetails !== category);
      return [...filtered, ...newFiles.map((f) => ({ ...f, name: f.fileName, docDetails: category }))];
    });

    const remainingServerIds = categoryFiles.filter((f) => f.isServer).map((f) => f.id);
    setNcrAttachments((prev) => {
      return prev.filter((a) => {
        const isCurrentCategory = a.fileType === category || a.docDetails === category;
        if (!isCurrentCategory) return true;
        return remainingServerIds.includes(a.id);
      });
    });

    const errorKey =
      category === 'ROOT_CAUSE' ? 'rootCauseFile' : category === 'CORRECTIVE' ? 'correctiveFile' : 'preventiveFile';
    setErrors((prev) => ({ ...prev, [errorKey]: null }));
  };

  // Use the new useBOSForm hook to handle state and eliminate uncontrolled input warnings
  const { formData, handleFormChange, updateForm, resetForm, errors, setErrors } = useBOSForm({
    rootCause: '',
    correctiveAction: '',
    preventiveAction: '',
    targetDate: '',
    remarks: ''
  });

  // Fetch NCR-specific attachments uploaded during previous closure submissions
  const fetchNcrAttachments = async (detailId) => {
    try {
      const res = await axios.get(`/api/qms/ncr-ofi/attachments/${detailId}`);
      setNcrAttachments(res.data || []);
    } catch {
      setNcrAttachments([]);
    }
  };

  const handleFindingSelectChange = async (e) => {
    const findingId = e.target.value;
    const row = rows.find((r) => r.id === findingId);
    if (row) {
      setSelectedFinding(row);
      updateForm({
        rootCause: row.rootCause || '',
        correctiveAction: row.correctiveAction || '',
        preventiveAction: row.preventiveAction || '',
        targetDate: row.targetDate ? format(new Date(row.targetDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        remarks: row.comments || ''
      });
      setUploadedFiles([]);
      setErrors({});
      fetchNcrAttachments(row.observationDetailId || row.id);
      try {
        const res = await axios.get('/api/qms/ncr-ofi/next-no/' + row.observationStatus);
        setNextNcrNo(res.data);
      } catch {
        setNextNcrNo('N/A');
      }
    } else {
      setSelectedFinding(null);
      resetForm();
      setNextNcrNo('');
      setNcrAttachments([]);
    }
  };

  const getEmployeeDetails = (input) => {
    if (!input) return {};
    const parts = input.split(' - ');
    const emp = employees.find((e) => e.employeeName === parts[0]?.trim() || e.empCode === input || e.oldEmpCode === input);
    if (!emp) return { empCode: parts[1]?.trim() || '-', oldEmpCode: parts[1]?.trim() || '-', departmentName: '-', designationName: '-', level: '-' };
    return {
      ...emp,
      departmentName: emp.department?.departmentName || emp.departmentName || '-',
      designationName: emp.designation?.designationName || emp.designationName || '-',
      oldEmpCode: emp.oldEmpCode || emp.empCode || parts[1]?.trim() || '-',
      level: emp.empLevelId ? `L${emp.empLevelId}` : '-'
    };
  };

  const filteredRows = useMemo(() => {
    const activeType = globalFilters.type || 'Mine';
    return rows.filter((row) => {
      const matchScopeLocal = () => {
        // Auditee only - Auditee is responsible for providing Root Cause and Corrective Action
        if (bosFilters.matchScope(activeType, row.auditeeId, row.auditee)) return true;
        return false;
      };

      if (!matchScopeLocal()) return false;
      return true;
    });
  }, [rows, globalFilters.type, user, bosFilters]);

  useEffect(() => {
    setPage(0);
  }, [globalFilters.type]);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    dispatch(
      setFilterConfig([
        { id: 'type', label: 'Scope', type: 'select', options: bosFilters.getFilterOptions(), defaultValue: 'Mine', isStarred: true },
        {
          id: 'observationStatus',
          label: 'Obr Type',
          type: 'select',
          options: [
            { value: 'All', label: 'ALL' },
            { value: 'NCR', label: 'NCR' },
            { value: 'OFI', label: 'OFI' }
          ],
          defaultValue: 'All',
          isStarred: true
        },
        {
          id: 'ncrStatus',
          label: 'NCR Status',
          type: 'select',
          multiple: true,
          options: [
            { value: 'PENDING', label: 'PENDING' },
            { value: 'UNRESOLVED', label: 'UNRESOLVED' },
            { value: 'COMPLETED', label: 'COMPLETED' },

          ],
          defaultValue: ['PENDING', 'UNRESOLVED'],
          isStarred: true
        },
        {
          id: 'searchBy',
          label: 'Search By',
          type: 'select',
          options: [
            { value: 'observationNo', label: 'Observation No' },
            { value: 'ncrNo', label: 'NC No' }
          ],
          defaultValue: 'observationNo'
        },
        ...getCommonDateFilters('createdDate', 'updatedAt')
      ])
    );
    const currentPath = window.location.pathname;
    return () => {
      if (window.location.pathname !== currentPath) {
        dispatch(setFilterConfig(null));
      }
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedRecord(null);
    try {
      const fromDate = globalFilters.createdDateStart || undefined;
      const toDate = globalFilters.createdDateEnd || undefined;
      const considerDate = globalFilters.createdDateConsider || 'No';

      // ncrStatus filter maps to workflowStatus in QMS_NCR_REWORK_LOG
      const workflowStatusRaw = globalFilters.ncrStatus;
      const workflowStatus = Array.isArray(workflowStatusRaw) ? workflowStatusRaw.join(',') : workflowStatusRaw || undefined;

      const [fRes, eRes, cRes] = await Promise.all([
        axios.get('/api/qms/audit/observation/ncr/rework-findings', {
          params: {
            observationStatus: globalFilters.observationStatus,
            workflowStatus,
            fromDate,
            toDate,
            considerDate,
            dashboardFilter: dashboardFilter || undefined,
            query: globalQuery
          }
        }),
        axios.get('/api/master/hr/employees'),
        axios.get('/api/master/qms/audit-criteria')
      ]);
      setRows(fRes.data || []);
      setEmployees(eRes.data || []);
      setCriteriaList(cRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [globalFilters, globalQuery, dashboardFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isViewOnly =
    selectedFinding?.ncrStatus === 'CLOSED' ||
    selectedFinding?.ncrStatus === 'COMPLETED' ||
    selectedFinding?.ncrStatus === 'VERIFIED' ||
    selectedFinding?.approvalStatus === 'VERIFIED' ||
    selectedFinding?.ncrStatus === 'WAITING_APPROVAL' ||
    selectedFinding?.ncrStatus === 'PENDING FOR VERIFY' ||
    (user?.empId && selectedFinding?.auditeeId && Number(user.empId) !== Number(selectedFinding.auditeeId));


  useEffect(() => {
    const channel = new BroadcastChannel('ncr_status_channel');
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'NCR_STATUS_UPDATED') {
        const { id, ncrStatus } = event.data;
        if (ncrStatus === 'CLOSED' || ncrStatus === 'APPROVED') {
          setRows((prevRows) => prevRows.filter((row) => row.id !== id));
          setSelectedRecord((prevRecord) => (prevRecord && prevRecord.id === id ? null : prevRecord));
          setSelectedFinding((prevFinding) => (prevFinding && prevFinding.id === id ? null : prevFinding));
        } else {
          setRows((prevRows) =>
            prevRows.map((row) => {
              if (row.id === id) {
                return { ...row, ncrStatus };
              }
              return row;
            })
          );
          setSelectedRecord((prevRecord) => {
            if (prevRecord && prevRecord.id === id) {
              return { ...prevRecord, ncrStatus };
            }
            return prevRecord;
          });
          setSelectedFinding((prevFinding) => {
            if (prevFinding && prevFinding.id === id) {
              return { ...prevFinding, ncrStatus };
            }
            return prevFinding;
          });
        }
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  const handleOpenClose = async (row) => {
    setIsNewMode(false);
    setSelectedFinding(row);
    const loaded = {
      rootCause: row.rootCause || '',
      correctiveAction: row.correctiveAction || '',
      preventiveAction: row.preventiveAction || '',
      targetDate: row.targetDate ? format(new Date(row.targetDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      remarks: row.comments || ''
    };
    updateForm(loaded);
    setOriginalFormData(loaded); // Issue 5: save baseline for dirty check
    setUploadedFiles([]);
    setErrors({});
    fetchNcrAttachments(row.observationDetailId || row.id);

    try {
      const res = await axios.get('/api/qms/ncr-ofi/next-no/' + row.observationStatus);
      setNextNcrNo(res.data);
    } catch {
      setNextNcrNo('N/A');
    }

    setDialogOpen(true);
  };

  const handleFileSelect = (category, file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      dispatch(openSnackbar({ open: true, message: 'File size exceeds 20MB limit', severity: 'error' }));
      return;
    }
    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.docDetails !== category);
      return [...filtered, { file, name: file.name, docDetails: category }];
    });
    const errorKey = category === 'ROOT_CAUSE' ? 'rootCauseFile' : category === 'CORRECTIVE' ? 'correctiveFile' : 'preventiveFile';
    setErrors((prev) => ({ ...prev, [errorKey]: null }));
  };

  const handleSaveClose = async () => {
    const newErrors = {};
    if (isNewMode && !selectedFinding) {
      newErrors.observationNo = 'Observation No is required *';
    }
    if (!formData.rootCause) newErrors.rootCause = 'Root Cause is required *';
    if (!formData.correctiveAction) newErrors.correctiveAction = 'Corrective Action is required *';
    if (!formData.preventiveAction) newErrors.preventiveAction = 'Preventive Action is required *';
    if (!formData.targetDate) newErrors.targetDate = 'Target Date is required *';

    const hasRootCauseFile = rootCauseFiles.length > 0;
    const hasCorrectiveFile = correctiveFiles.length > 0;
    const hasPreventiveFile = preventiveFiles.length > 0;

    if (!hasRootCauseFile) newErrors.rootCauseFile = 'Root Cause Document is required *';
    if (!hasCorrectiveFile) newErrors.correctiveFile = 'Corrective Action Document is required *';
    if (!hasPreventiveFile) newErrors.preventiveFile = 'Preventive Action Document is required *';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      dispatch(
        openSnackbar({
          open: true,
          message: firstError,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      return;
    }

    // Issue 5: Dirty-check guard — if UNRESOLVED record and nothing changed, block save
    if (!isNewMode && selectedFinding?.ncrStatus === 'UNRESOLVED' && originalFormData) {
      const isDirty =
        formData.rootCause !== originalFormData.rootCause ||
        formData.correctiveAction !== originalFormData.correctiveAction ||
        formData.preventiveAction !== originalFormData.preventiveAction ||
        formData.targetDate !== originalFormData.targetDate ||
        formData.remarks !== originalFormData.remarks ||
        uploadedFiles.length > 0;
      if (!isDirty) {
        dispatch(
          openSnackbar({
            open: true,
            message:
              'Please update at least one field (Root Cause, Corrective Action, Preventive Action, Target Date, or attachment) before resubmitting.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning',
            close: false
          })
        );
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        observationDetailId: selectedFinding.observationDetailId || selectedFinding.id,
        observationId: selectedFinding.observationId,
        type: selectedFinding.observationStatus,
        ...formData,
        ncrOfiNo: nextNcrNo,
        observationDate: selectedFinding.observationDate,
        fileCategories: uploadedFiles.map((f) => ({
          fileName: f.fileName || f.name,
          serverFileName: f.serverFileName,
          docDetails: f.docDetails
        }))
      };

      const submitData = new FormData();
      submitData.append('data', JSON.stringify(payload));

      console.log('Submitting NCR Closure Payload:', payload);
      console.log(
        'Files to upload:',
        uploadedFiles.map((f) => f.name)
      );

      await axios.post('/api/qms/ncr-ofi', submitData);
      // Issue 2: Use filled alert variant for in-app popup (not just console-style)
      dispatch(
        openSnackbar({
          open: true,
          message: 'NC / OFI submitted for closure successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      console.error('Submission Error:', e);
      const msg = e.response?.data?.message || e.response?.data || e.message || 'Failed to submit closure';
      dispatch(
        openSnackbar({
          open: true,
          message: `Submission Failed: ${typeof msg === 'string' ? msg : 'Internal Server Error'}`,
          severity: 'error',
          variant: 'alert'
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'observationStatus') return <BOSStatusChip status={row.observationStatus?.toUpperCase()} showIcon />;
    if (col.id === 'ncrStatus') {
      const status = row.ncrStatus || 'PENDING';
      return <BOSStatusChip status={status.toUpperCase()} showIcon={true} width={130} />;
    }
    if (col.id === 'approvalStatus') {
      const status = row.approvalStatus || 'PENDING';
      return <BOSStatusChip status={status.toUpperCase()} showIcon={true} width={150} />;
    }
    if (col.id === 'delayDays') {
      if (!row.targetDate) return '0';
      const end = row.ncrStatus === 'CLOSED' && row.closedDate ? new Date(row.closedDate) : new Date();
      end.setHours(0, 0, 0, 0);
      const target = new Date(row.targetDate);
      target.setHours(0, 0, 0, 0);
      const d = differenceInDays(end, target);
      return (
        <Typography variant="body2" color={d > 0 ? 'error.main' : 'text.primary'} sx={{ fontWeight: d > 0 ? 700 : 400 }}>
          {d > 0 ? `${d} Days` : '0'}
        </Typography>
      );
    }
    const val = row[col.id];
    if (['observationDate', 'targetDate'].includes(col.id)) return val ? format(new Date(val), 'dd/MM/yyyy') : '-';
    if (col.id === 'createdDate') return val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';
    if (col.id === 'auditee' || col.id === 'auditor') {
      if (val && val.includes(' - ')) return val.split(' - ')[0].trim();
      return val || '-';
    }
    if (col.id === 'ncrApprovedBy') {
      if (val && val.includes(' - ')) {
        return val.split(' - ')[0].trim();
      }
      if (val) {
        const emp = employees.find((e) => String(e.empCode) === String(val));
        if (emp) return emp.employeeName;
      }
      return val || '-';
    }
    return String(val || '-');
  };

  return (
    <MainCard
      fullWidth
      icon={IconCircleCheck}
      title={"Close NC / OFI Findings"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="NC_Closure_List"
          hasExportPermission={perms.export}
          onCloseNcr={perms.write ? () => selectedRecord && handleOpenClose(selectedRecord) : null}
          closeNcrDisabled={!selectedRecord}
          closeNcrTooltip={selectedRecord ? 'Close Selected NC / OFI' : 'Select a record first to close'}
          closeNcrLabel="Close NCR / OFI"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows.slice(page * size, page * size + size)}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={setSize}
        onDoubleClickRow={handleOpenClose}
        renderCell={renderCell}
        selectedRowId={selectedRecord?.id}
        onClickRow={(row) => setSelectedRecord(row)}
        customActions={(row) => (
          <Tooltip title="Submit for Closure">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenClose(row)}
              disabled={row.ncrStatus === 'CLOSED' || row.ncrStatus === 'WAITING_APPROVAL' || row.ncrStatus === 'PENDING FOR VERIFY'}
              sx={{ bgcolor: 'primary.light', color: 'primary.dark', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <IconCircleCheck size={18} />
            </IconButton>
          </Tooltip>
        )}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="NC / OFI Details"
        maxWidth="lg"
        onSave={handleSaveClose}
        isViewOnly={isViewOnly}
        saveButtonDisabled={isSubmitting}
      >
        {selectedFinding && (
          <Stack spacing={3} sx={{ width: '100%' }}>
            {/* Status & Overdue Header Bar (Matches CloseMomDialog design) */}
            <Box sx={{
              bgcolor: '#e3f2fd',
              borderRadius: '12px',
              p: 2,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              border: '1px solid',
              borderColor: 'primary.light',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.05)',
              width: '100%',
              mb: 1
            }}>
              <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  NC No : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{selectedFinding.ncrNo || nextNcrNo || 'N/A'}</Box>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  Observation Date : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{selectedFinding.observationDate ? format(new Date(selectedFinding.observationDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</Box>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  NC/OFI Status : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{selectedFinding.ncrStatus ? selectedFinding.ncrStatus.replace(/_/g, ' ')?.toUpperCase() : 'PENDING'}</Box>
                </Typography>
                {(() => {
                  if (!selectedFinding.targetDate) return null;
                  const end =
                    selectedFinding.ncrStatus === 'CLOSED' && selectedFinding.closedDate
                      ? new Date(selectedFinding.closedDate)
                      : new Date();
                  end.setHours(0, 0, 0, 0);
                  const target = new Date(selectedFinding.targetDate);
                  target.setHours(0, 0, 0, 0);
                  const d = differenceInDays(end, target);
                  return (
                    <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                      Overdue : <Box component="span" sx={{ color: d > 0 ? 'error.main' : 'success.main', fontWeight: 800 }}>{d > 0 ? `${d} Day(s) Overdue` : 'On Time'}</Box>
                    </Typography>
                  );
                })()}
              </Stack>
            </Box>

            {/* NC Details Section */}
            <BOSFormSection title="NC Details" icon={<IconAlertTriangle size={20} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5, mt: 1.5, mb: 2 }}>
                {!isNewMode ? (
                  <BOSTextField
                    label="Observation No"
                    value={selectedFinding.observationNo || ''}
                    disabled={true}
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyFieldSx}
                    fullWidth
                  />
                ) : (
                  <BOSTextField
                    select
                    label="Observation No *"
                    name="observationNoSelect"
                    value={selectedFinding.id || ''}
                    onChange={handleFindingSelectChange}
                    error={!!errors.observationNo}
                    helperText={errors.observationNo}
                    InputLabelProps={{ shrink: true }}
                    sx={errorStyle(!!errors.observationNo)}
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>— Select Observation —</em>
                    </MenuItem>
                    {rows
                      .filter((r) => r.ncrStatus !== 'CLOSED' && r.observationStatus !== 'COMPLIANCE')
                      .map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {`${r.observationNo} (${r.observationStatus}) - ${r.criteriaDetails || ''}`.substring(0, 100)}
                        </MenuItem>
                      ))}
                  </BOSTextField>
                )}
                <BOSTextField
                  label="Schedule No"
                  value={selectedFinding.auditScheduleNo || ''}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyFieldSx}
                  fullWidth
                />
                <BOSTextField
                  label="Audit Type"
                  value={selectedFinding.auditType || ''}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyFieldSx}
                  fullWidth
                />
                <BOSTextField
                  label="Clause"
                  value={selectedFinding.clause || ''}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyFieldSx}
                  fullWidth
                />
                <BOSTextField
                  label="Audit Area"
                  value={selectedFinding.auditAreaDetail || selectedFinding.departmentName || 'ALL DEPARTMENTS'}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...readOnlyFieldSx, gridColumn: { xs: 'span 1', md: 'span 2' } }}
                  fullWidth
                />
                <BOSTextField
                  label="Target Date"
                  value={selectedFinding.targetDate ? format(new Date(selectedFinding.targetDate), 'dd/MM/yyyy') : '-'}
                  disabled={true}
                  InputLabelProps={{ shrink: true }}
                  sx={readOnlyFieldSx}
                  fullWidth
                />
              </Box>
              <BOSTextField
                label="Audit Criteria Details"
                value={selectedFinding.criteriaDetails || ''}
                multiline
                minRows={2}
                disabled={true}
                InputLabelProps={{ shrink: true }}
                sx={readOnlyFieldSx}
                fullWidth
              />
            </BOSFormSection>

            {/* Personnel Information Section (Moved to Top) */}
            <BOSFormSection title="Personnel Information" icon={<IconUser size={20} color={theme.palette.primary.main} />}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%', mt: 1.5 }}>
                <BOSPersonnelCard
                  variant="compact"
                  title="Auditee"
                  name={
                    selectedFinding.auditee && selectedFinding.auditee.includes(' - ')
                      ? selectedFinding.auditee.split(' - ')[0].trim()
                      : selectedFinding.auditee
                  }
                  empCode={getEmployeeDetails(selectedFinding.auditee).empCode}
                  oldEmpCode={getEmployeeDetails(selectedFinding.auditee).oldEmpCode}
                  department={getEmployeeDetails(selectedFinding.auditee).departmentName}
                  designation={getEmployeeDetails(selectedFinding.auditee).designationName}
                  photo={getEmployeeDetails(selectedFinding.auditee).employeePhotoUpload}
                  color="info.main"
                />
                {(() => {
                  const auditTypeStr = selectedFinding.auditType?.toUpperCase() || '';
                  const isExtAuditor =
                    auditTypeStr.includes('CUSTOMER') ||
                    auditTypeStr.includes('EXTERNAL') ||
                    auditTypeStr.includes('SUPPLIER') ||
                    !selectedFinding.auditorId;
                  const auditorName =
                    selectedFinding.auditor && selectedFinding.auditor.includes(' - ')
                      ? selectedFinding.auditor.split(' - ')[0].trim()
                      : selectedFinding.auditor;
                  const auditorEmp = isExtAuditor ? {} : getEmployeeDetails(selectedFinding.auditor);

                  return (
                    <BOSPersonnelCard
                      variant="compact"
                      title={isExtAuditor ? 'Auditor (External)' : 'Auditor'}
                      name={auditorName || '-'}
                      empCode={isExtAuditor ? '' : auditorEmp.empCode}
                      oldEmpCode={isExtAuditor ? '' : auditorEmp.oldEmpCode}
                      department={isExtAuditor ? '' : auditorEmp.departmentName}
                      designation={isExtAuditor ? '' : auditorEmp.designationName}
                      photo={isExtAuditor ? (selectedFinding.externalAuditorImage || '') : auditorEmp.employeePhotoUpload}
                      color="primary.main"
                    />
                  );
                })()}
                <BOSPersonnelCard
                  variant="compact"
                  title="NC Approved By"
                  name={
                    selectedFinding.ncrApprovedBy && selectedFinding.ncrApprovedBy.includes(' - ')
                      ? selectedFinding.ncrApprovedBy.split(' - ')[0].trim()
                      : selectedFinding.ncrApprovedBy
                  }
                  empCode={getEmployeeDetails(selectedFinding.ncrApprovedBy).empCode}
                  oldEmpCode={getEmployeeDetails(selectedFinding.ncrApprovedBy).oldEmpCode}
                  department={getEmployeeDetails(selectedFinding.ncrApprovedBy).departmentName}
                  designation={getEmployeeDetails(selectedFinding.ncrApprovedBy).designationName}
                  photo={getEmployeeDetails(selectedFinding.ncrApprovedBy).employeePhotoUpload}
                  color="secondary.main"
                />
              </Stack>
            </BOSFormSection>

            {/* Supporting Documents Section (Only displayed when attachments exist) */}
            {(formattedCriteriaAttachments.length > 0 || formattedObservationAttachments.length > 0) && (
              <BOSFormSection title="Supporting Documents" icon={<IconCircleCheck size={20} color={theme.palette.primary.main} />}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%', mt: 1.5 }}>
                  {/* Left Panel: Criteria Document */}
                  {formattedCriteriaAttachments.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper', flex: 1 }}>
                      <Box sx={{ bgcolor: 'action.hover', px: 1.75, py: 0.85, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Criteria Document
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5 }}>
                        <BOSFileGallery files={formattedCriteriaAttachments} isEditing={false} />
                      </Box>
                    </Box>
                  )}

                  {/* Right Panel: Observation Document */}
                  {formattedObservationAttachments.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper', flex: 1 }}>
                      <Box sx={{ bgcolor: 'action.hover', px: 1.75, py: 0.85, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Observation Document
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.5 }}>
                        <BOSFileGallery files={formattedObservationAttachments} isEditing={false} />
                      </Box>
                    </Box>
                  )}
                </Stack>
              </BOSFormSection>
            )}

            {/* CAPA Action Details Section (65/35 Side-by-side Comments & Compact Upload Panel) */}
            <BOSFormSection title="CAPA Action Details" icon={<IconCircleCheck size={20} color={theme.palette.primary.main} />}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {/* Root Cause */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, gap: 2, alignItems: 'start' }}>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <BOSTextField
                      label="Root Cause"
                      name="rootCause"
                      value={formData.rootCause}
                      onChange={handleFormChange}
                      multiline
                      minRows={3}
                      error={!!errors.rootCause}
                      helperText={errors.rootCause}
                      disabled={isViewOnly}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    {rootCauseFiles && rootCauseFiles.length > 0 && (
                      <BOSFileUpload
                        files={rootCauseFiles}
                        onChange={(files) => handleFilesChange('ROOT_CAUSE', files)}
                        module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                        multiple={true}
                        disabled={isViewOnly}
                        hideDropzone={true}
                        compact={true}
                        gridColumns={3}
                      />
                    )}
                  </Stack>
                  <Box sx={{ p: errors.rootCauseFile ? 1 : 0, border: errors.rootCauseFile ? '1px solid red' : 'none', borderRadius: 1.5 }}>
                    <BOSFileUpload
                      files={rootCauseFiles}
                      onChange={(files) => handleFilesChange('ROOT_CAUSE', files)}
                      module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                      multiple={true}
                      disabled={isViewOnly}
                      hideFileList={true}
                      compact={true}
                      label="Upload Root Cause Evidence"
                      helperText={errors.rootCauseFile || "Upload evidence for root cause"}
                      error={!!errors.rootCauseFile}
                    />
                  </Box>
                </Box>

                {/* Corrective Action */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, gap: 2, alignItems: 'start' }}>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <BOSTextField
                      label="Corrective Action"
                      name="correctiveAction"
                      value={formData.correctiveAction}
                      onChange={handleFormChange}
                      multiline
                      minRows={3}
                      error={!!errors.correctiveAction}
                      helperText={errors.correctiveAction}
                      disabled={isViewOnly}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    {correctiveFiles && correctiveFiles.length > 0 && (
                      <BOSFileUpload
                        files={correctiveFiles}
                        onChange={(files) => handleFilesChange('CORRECTIVE', files)}
                        module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                        multiple={true}
                        disabled={isViewOnly}
                        hideDropzone={true}
                        compact={true}
                        gridColumns={3}
                      />
                    )}
                  </Stack>
                  <Box sx={{ p: errors.correctiveFile ? 1 : 0, border: errors.correctiveFile ? '1px solid red' : 'none', borderRadius: 1.5 }}>
                    <BOSFileUpload
                      files={correctiveFiles}
                      onChange={(files) => handleFilesChange('CORRECTIVE', files)}
                      module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                      multiple={true}
                      disabled={isViewOnly}
                      hideFileList={true}
                      compact={true}
                      label="Upload Corrective Action Evidence"
                      helperText={errors.correctiveFile || "Upload evidence for corrective action"}
                      error={!!errors.correctiveFile}
                    />
                  </Box>
                </Box>

                {/* Preventive Action */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, gap: 2, alignItems: 'start' }}>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    <BOSTextField
                      label="Preventive Action"
                      name="preventiveAction"
                      value={formData.preventiveAction}
                      onChange={handleFormChange}
                      multiline
                      minRows={3}
                      error={!!errors.preventiveAction}
                      helperText={errors.preventiveAction}
                      disabled={isViewOnly}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    {preventiveFiles && preventiveFiles.length > 0 && (
                      <BOSFileUpload
                        files={preventiveFiles}
                        onChange={(files) => handleFilesChange('PREVENTIVE', files)}
                        module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                        multiple={true}
                        disabled={isViewOnly}
                        hideDropzone={true}
                        compact={true}
                        gridColumns={3}
                      />
                    )}
                  </Stack>
                  <Box sx={{ p: errors.preventiveFile ? 1 : 0, border: errors.preventiveFile ? '1px solid red' : 'none', borderRadius: 1.5 }}>
                    <BOSFileUpload
                      files={preventiveFiles}
                      onChange={(files) => handleFilesChange('PREVENTIVE', files)}
                      module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_NCR_CLOSE"
                      multiple={true}
                      disabled={isViewOnly}
                      hideFileList={true}
                      compact={true}
                      label="Upload Preventive Action Evidence"
                      helperText={errors.preventiveFile || "Upload evidence for preventive action"}
                      error={!!errors.preventiveFile}
                    />
                  </Box>
                </Box>
              </Stack>
            </BOSFormSection>

            {/* Rejection / Rework History Section */}
            {selectedFinding && selectedFinding.cancelRemarks && parseRejectionHistory(selectedFinding.cancelRemarks).length > 0 && (
              <BOSFormSection title="Rejection & Rework History" icon={<IconAlertTriangle size={20} color={theme.palette.error.main} />}>
                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  {parseRejectionHistory(selectedFinding.cancelRemarks).map((h, i) => (
                    <Box key={i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                      <Typography variant="caption" color="error.dark" fontWeight={700}>
                        Rejected By: {h.rejectedBy || '-'} on {h.rejectedAt || '-'} (Rev {h.revNo || '-'})
                      </Typography>
                      {h.approvalComment && (
                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                          Approval Note: {h.approvalComment}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        Comment: {h.remarks || '-'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </BOSFormSection>
            )}

            {/* Closure Comments Section (Moved to Bottom) */}
            <BOSFormSection title="Closure Comments" icon={<IconCircleCheck size={20} color={theme.palette.primary.main} />}>
              <Box sx={{ mt: 1.5 }}>
                <BOSTextField
                  label="Close NC/OFI Comments"
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleFormChange}
                  multiline
                  minRows={2}
                  disabled={isViewOnly}
                  InputLabelProps={{ shrink: true }}
                  sx={isViewOnly ? readOnlyFieldSx : undefined}
                  fullWidth
                />
              </Box>
            </BOSFormSection>
          </Stack>
        )}
      </BOSFormDialog>

      <BOSFilePreview
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
        file={previewFile}
        url={previewFile?.url}
        hideCloseButton
      />
    </MainCard>
  );
}
