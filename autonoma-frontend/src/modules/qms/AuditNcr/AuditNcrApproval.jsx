import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Box,
  Chip,
  MenuItem,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider
} from '@mui/material';
import { IconFileDownload, IconCircleCheck, IconUser, IconChecks, IconX, IconEye, IconShieldCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
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
  BOSActionSection,
  useBOSForm,
  BOSStatusChip,
  BOSTableToolbar,
  getCommonDateFilters,
  BOSFilePreview,
  BOSFileGallery
} from 'ui-component/bos';
import { getFileDownloadUrl, getFileViewUrl } from 'utils/upload-helper';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import { shortcutTooltip, SHORTCUT_KEYS } from 'hooks/useKeyboardShortcuts';

// ==============================|| CLOSE NCR / OFI VERIFICATION (QM1250) ||============================== //

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

export default function AuditNcrApproval() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_NCR_APPROVAL);
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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [ncrAttachments, setNcrAttachments] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');

  const { formData, handleFormChange, updateForm, resetForm } = useBOSForm({ remarks: '' });
  const [errors, setErrors] = useState({});

  // Match criteria by seqNo or clause+auditType
  const matchingCriteria = useMemo(() => {
    if (!selectedFinding || !criteriaList.length) return null;
    let match = criteriaList.find((c) => String(c.seqNo) === String(selectedFinding.seqNo));
    if (!match && selectedFinding.clause) {
      match = criteriaList.find(
        (c) =>
          String(c.clause).toLowerCase() === String(selectedFinding.clause).toLowerCase() &&
          (!selectedFinding.auditType ||
            !c.auditType ||
            String(c.auditType).toLowerCase().includes(String(selectedFinding.auditType).toLowerCase()))
      );
    }
    return match;
  }, [selectedFinding, criteriaList]);

  const criteriaAttachments = useMemo(() => {
    if (!matchingCriteria?.attachmentInfo) return [];
    try {
      const parsed = JSON.parse(matchingCriteria.attachmentInfo);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [matchingCriteria]);

  const observationAttachments = useMemo(() => {
    const path = selectedFinding?.attachmentPath;
    if (!path || !path.trim()) return [];
    try {
      const parsed = JSON.parse(path);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          fileName: item.fileName || item.serverFileName?.split('/').pop() || 'Document',
          serverFileName: item.serverFileName || item.filePath || ''
        }));
      }
    } catch { /* Not JSON */ }
    return [{
      fileName: path.trim().split('/').pop(),
      filePath: path.trim(),
      isServer: true
    }];
  }, [selectedFinding]);

  const rootCauseAttachments = useMemo(() => ncrAttachments.filter((a) => a.fileType === 'ROOT_CAUSE'), [ncrAttachments]);
  const correctiveAttachments = useMemo(() => ncrAttachments.filter((a) => a.fileType === 'CORRECTIVE'), [ncrAttachments]);
  const preventiveAttachments = useMemo(() => ncrAttachments.filter((a) => a.fileType === 'PREVENTIVE'), [ncrAttachments]);

  const referenceDocs = useMemo(() => {
    const crit = criteriaAttachments.map((a) => ({ ...a, fileType: 'Criteria' }));
    const obs = observationAttachments.map((a) => ({ ...a, fileType: 'Observation' }));
    return [...crit, ...obs];
  }, [criteriaAttachments, observationAttachments]);

  const capaEvidenceDocs = useMemo(() => {
    const rc = rootCauseAttachments.map((a) => ({ ...a, fileType: 'Root Cause' }));
    const ca = correctiveAttachments.map((a) => ({ ...a, fileType: 'Corrective' }));
    const pa = preventiveAttachments.map((a) => ({ ...a, fileType: 'Preventive' }));
    return [...rc, ...ca, ...pa];
  }, [rootCauseAttachments, correctiveAttachments, preventiveAttachments]);

  const formattedReferenceDocs = useMemo(() => {
    return referenceDocs.map((doc) => {
      const path = doc.path || doc.filePath || doc.serverFileName || '';
      const name = doc.fileName || doc.name || path.split('/').pop() || 'Document';
      return {
        fileName: name,
        serverFileName: path,
        isServer: true,
        docDetails: doc.fileType || 'Document'
      };
    });
  }, [referenceDocs]);

  const formattedRootCauseDocs = useMemo(() => {
    return rootCauseAttachments.map((doc) => {
      const path = doc.filePath || doc.serverFileName || doc.path || '';
      return {
        fileName: doc.fileName || doc.name || path.split('/').pop() || 'Document',
        serverFileName: path,
        isServer: true,
        docDetails: 'ROOT_CAUSE'
      };
    });
  }, [rootCauseAttachments]);

  const formattedCorrectiveDocs = useMemo(() => {
    return correctiveAttachments.map((doc) => {
      const path = doc.filePath || doc.serverFileName || doc.path || '';
      return {
        fileName: doc.fileName || doc.name || path.split('/').pop() || 'Document',
        serverFileName: path,
        isServer: true,
        docDetails: 'CORRECTIVE'
      };
    });
  }, [correctiveAttachments]);

  const formattedPreventiveDocs = useMemo(() => {
    return preventiveAttachments.map((doc) => {
      const path = doc.filePath || doc.serverFileName || doc.path || '';
      return {
        fileName: doc.fileName || doc.name || path.split('/').pop() || 'Document',
        serverFileName: path,
        isServer: true,
        docDetails: 'PREVENTIVE'
      };
    });
  }, [preventiveAttachments]);

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
    const loggedInEmpId = user?.empId || user?.employeeId;
    return rows.filter((row) => {
      if (activeType === 'Mine') {
        // Compare with QMS_AUDIT_SCHEDULE.NCR_APPROVED_BY_ID
        if (loggedInEmpId && row.ncrApprovedById && Number(row.ncrApprovedById) === Number(loggedInEmpId)) {
          return true;
        }
        return false;
      }
      // Match against auditee, auditor, or ncrApprovedBy for Team/Company scope
      if (bosFilters.matchScope(activeType, row.auditeeId, row.auditee)) return true;
      if (bosFilters.matchScope(activeType, row.auditorId, row.auditor)) return true;
      if (bosFilters.matchScope(activeType, row.ncrApprovedById, row.ncrApprovedBy)) return true;
      return false;
    });
  }, [rows, globalFilters.type, user, bosFilters]);

  useEffect(() => { setPage(0); }, [globalFilters.type]);

  // ── Filter config ─────────────────────────────────────────────────────────
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
          id: 'verifyStatus',
          label: 'Verify Status',
          type: 'select',
          options: [
            { value: 'All', label: 'ALL' },
            { value: 'PENDING FOR VERIFY', label: 'PENDING FOR VERIFY' },
            { value: 'VERIFIED', label: 'VERIFIED' },
            { value: 'REJECTED', label: 'REJECTED' }
          ],
          defaultValue: 'PENDING FOR VERIFY',
          isStarred: true
        },
        {
          id: 'searchBy',
          label: 'Search By',
          type: 'select',
          options: [
            { value: 'ncrNo', label: 'NC No' },
            { value: 'observationNo', label: 'Observation No' }
          ],
          defaultValue: 'ncrNo'
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

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedRecord(null);
    try {
      const fromDate = globalFilters.createdDateStart || undefined;
      const toDate = globalFilters.createdDateEnd || undefined;
      const considerDate = globalFilters.createdDateConsider || 'No';
      const verifyStatus = globalFilters.verifyStatus && globalFilters.verifyStatus !== 'All' ? globalFilters.verifyStatus : 'All';

      const [fRes, eRes, cRes] = await Promise.all([
        axios.get('/api/qms/audit/observation/ncr/verify-findings', {
          params: {
            verifyStatus,
            observationStatus: globalFilters.observationStatus,
            fromDate,
            toDate,
            considerDate,
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
  }, [globalFilters, globalQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchNcrAttachments = async (detailId) => {
    try {
      const res = await axios.get(`/api/qms/ncr-ofi/attachments/${detailId}`);
      setNcrAttachments(res.data || []);
    } catch {
      setNcrAttachments([]);
    }
  };

  const handleOpenReview = async (row) => {
    setSelectedFinding(row);
    updateForm({ remarks: '' });
    setErrors({});
    setNcrAttachments([]);
    fetchNcrAttachments(row.observationDetailId || row.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFinding(null);
    setSelectedRecord(null);
    resetForm();
    setNcrAttachments([]);
  };

  // ── Verify action ──────────────────────────────────────────────────────────
  const handleVerifyClick = () => {
    setErrors({});
    handleProcessVerify('VERIFIED', formData.remarks);
  };

  // ── Reject action ──────────────────────────────────────────────────────────
  const handleRejectClick = () => {
    setErrors({});
    setRejectionComment('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionComment || !rejectionComment.trim()) {
      setErrors((prev) => ({ ...prev, rejectionComment: 'Rejection Reason is required.' }));
      dispatch(openSnackbar({ open: true, message: 'Rejection Reason is required.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      return;
    }
    setErrors({});
    handleProcessVerify('REJECTED', formData.remarks, rejectionComment);
    setRejectDialogOpen(false);
  };

  const handleProcessVerify = async (action, remarks = '', rejComment = '') => {
    if (!selectedFinding || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (action === 'VERIFIED') {
        await axios.put(`/api/qms/audit/observation/ncr/verify/${selectedFinding.id}`, null, {
          params: { remarks }
        });
      } else {
        await axios.put(`/api/qms/audit/observation/ncr/verify-reject/${selectedFinding.id}`, null, {
          params: {
            verificationComment: remarks,
            rejectionReason: rejComment
          }
        });
      }

      dispatch(
        openSnackbar({
          open: true,
          message: action === 'VERIFIED' ? 'NCR Verified Successfully.' : 'NCR Rejected Successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: action === 'VERIFIED' ? 'success' : 'error',
          close: false
        })
      );

      handleCloseDialog();
      fetchData();
    } catch (e) {
      let errorMsg = 'Action failed';
      if (typeof e === 'string') errorMsg = e;
      else if (e.response?.data) errorMsg = e.response.data.message || (typeof e.response.data === 'string' ? e.response.data : errorMsg);
      else if (e.message) errorMsg = e.message;
      dispatch(openSnackbar({ open: true, message: errorMsg, severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delay days helper ──────────────────────────────────────────────────────
  const getDelayDays = () => {
    if (!selectedFinding?.targetDate) return 0;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const target = new Date(selectedFinding.targetDate);
    target.setHours(0, 0, 0, 0);
    const d = differenceInDays(end, target);
    return d > 0 ? d : 0;
  };

  // ── Current verify status from filters ─────────────────────────────────────
  const activeVerifyStatus = globalFilters.verifyStatus || 'PENDING FOR VERIFY';
  const isPendingView = activeVerifyStatus === 'PENDING FOR VERIFY';

  // ── Cell renderer ──────────────────────────────────────────────────────────
  const renderCell = (col, row, idx) => {
    if (col.id === 'index') return idx + 1 + page * size;
    if (col.id === 'approvalStatus') {
      const vs = row.approvalStatus || 'PENDING FOR VERIFY';
      return <BOSStatusChip status={vs} showIcon={true} width={160} />;
    }
    if (col.id === 'ncrStatus') {
      const status = row.ncrStatus || 'PENDING';
      return <BOSStatusChip status={status} showIcon={true} width={130} />;
    }
    if (col.id === 'observationStatus') {
      const s = row.observationStatus || row.ncrStatus || '-';
      return <Chip label={s} size="small" color={s === 'NC' || s === 'NCR' ? 'error' : 'warning'} variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 700 }} />;
    }
    if (col.id === 'remarks') {
      const vs = row.approvalStatus || '';
      if (vs === 'REJECTED' && row.cancelRemarks) {
        const history = parseRejectionHistory(row.cancelRemarks);
        if (history.length > 0) return history[history.length - 1].remarks || '-';
      }
      return row.remarks || '-';
    }
    if (col.id === 'delayDays') {
      if (!row.targetDate) return '0';
      const end = row.approvalStatus === 'VERIFIED' && row.closedDate ? new Date(row.closedDate) : new Date();
      end.setHours(0, 0, 0, 0);
      const target = new Date(row.targetDate);
      target.setHours(0, 0, 0, 0);
      const d = differenceInDays(end, target);
      return String(d > 0 ? d : 0);
    }
    const val = row[col.id];
    if (['observationDate', 'targetDate'].includes(col.id)) return val ? format(new Date(val), 'dd/MM/yyyy') : '-';
    if (col.id === 'createdDate') return val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';
    if (col.id === 'auditor' || col.id === 'auditee' || col.id === 'ncrApprovedBy') {
      if (val && val.includes(' - ')) return val.split(' - ')[0].trim();
      return val || '-';
    }
    return String(val || '-');
  };

  // ── Helper methods removed ────────────────────────────────────────────────

  const auditeeDetails = useMemo(() => getEmployeeDetails(selectedFinding?.auditee), [selectedFinding, employees]);
  const auditorDetails = useMemo(() => getEmployeeDetails(selectedFinding?.auditor), [selectedFinding, employees]);
  const ncrApprovedByDetails = useMemo(() => getEmployeeDetails(selectedFinding?.ncrApprovedBy), [selectedFinding, employees]);

  return (
    <MainCard
      fullWidth
      icon={IconShieldCheck}
      title="Close NCR / OFI Verification"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="NC_Verification_Report"
          hasExportPermission={perms.export}
          columns={columns}
          hideAddButton
        />
      }
    >
      {/* ── Data Table ── */}
      <BOSDataTable
        columns={columns}
        rows={filteredRows.slice(page * size, page * size + size)}
        page={page}
        size={size}
        totalCount={filteredRows.length}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={setSize}
        renderCell={renderCell}
        selectedRowId={selectedRecord?.id}
        onClickRow={(row) => setSelectedRecord(row)}
        onDoubleClickRow={(row) => { setSelectedRecord(row); handleOpenReview(row); }}
        actionColumn
        renderActions={(row) => {
          const vs = row.approvalStatus || '';
          const isPending = vs === 'Pending For Verify' || vs === 'Pending for Verify';
          if (!isPending) return null;
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Verify">
                <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleOpenReview(row); }}>
                  <IconChecks size={18} />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        }}
      />

      {/* ── Review Dialog ── */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={`NCR Verification — ${selectedFinding?.ncrNo || selectedFinding?.observationNo || ''}`}
        maxWidth="lg"
        isViewOnly={true}
        showCloseInFooter={false}
        secondaryActions={
          isPendingView && (
            <Stack direction="row" spacing={1.5}>
              <Tooltip title={shortcutTooltip('Reject')}>
                <Button
                  data-shortcut="reject"
                  variant="contained"
                  color="error"
                  startIcon={<IconX size={20} />}
                  onClick={handleRejectClick}
                  disabled={!perms.write || isSubmitting}
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
                  onClick={handleVerifyClick}
                  disabled={!perms.write || isSubmitting}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Verify
                </Button>
              </Tooltip>
            </Stack>
          )
        }
      >
        {selectedFinding && (
          <Stack spacing={3}>
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
              width: '100%'
            }}>
              <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  NC No : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{selectedFinding.ncrNo || selectedFinding.observationNo || 'N/A'}</Box>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  Verify Status : <Box component="span" sx={{ color: 'primary.main', fontWeight: 800 }}>{(selectedFinding.approvalStatus || 'PENDING FOR VERIFY').replace(/_/g, ' ')?.toUpperCase()}</Box>
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#0A2540', fontWeight: 600 }}>
                  Overdue : <Box component="span" sx={{ color: getDelayDays() > 0 ? 'error.main' : 'success.main', fontWeight: 800 }}>{getDelayDays() > 0 ? `${getDelayDays()} Day(s) Overdue` : 'On Time'}</Box>
                </Typography>
              </Stack>
            </Box>

            {/* Personnel Information */}
            <BOSFormSection title="Personnel Information">
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ width: '100%' }}>
                <BOSPersonnelCard
                  title="AUDITEE"
                  variant="compact"
                  name={
                    selectedFinding?.auditee && selectedFinding.auditee.includes(' - ')
                      ? selectedFinding.auditee.split(' - ')[0].trim()
                      : selectedFinding?.auditee || '-'
                  }
                  empCode={auditeeDetails.empCode}
                  oldEmpCode={auditeeDetails.oldEmpCode}
                  department={auditeeDetails.departmentName}
                  designation={auditeeDetails.designationName}
                  photo={auditeeDetails.employeePhotoUpload}
                  color="info.main"
                />
                {(() => {
                  const auditTypeStr = selectedFinding?.auditType?.toUpperCase() || '';
                  const isExtAuditor =
                    auditTypeStr.includes('CUSTOMER') ||
                    auditTypeStr.includes('EXTERNAL') ||
                    auditTypeStr.includes('SUPPLIER') ||
                    !selectedFinding?.auditorId;
                  const auditorName =
                    selectedFinding?.auditor && selectedFinding.auditor.includes(' - ')
                      ? selectedFinding.auditor.split(' - ')[0].trim()
                      : selectedFinding?.auditor || '-';

                  return (
                    <BOSPersonnelCard
                      title={isExtAuditor ? 'AUDITOR (EXTERNAL)' : 'AUDITOR'}
                      variant="compact"
                      name={auditorName}
                      empCode={isExtAuditor ? '' : auditorDetails.empCode}
                      oldEmpCode={isExtAuditor ? '' : auditorDetails.oldEmpCode}
                      department={isExtAuditor ? '' : auditorDetails.departmentName}
                      designation={isExtAuditor ? '' : auditorDetails.designationName}
                      photo={isExtAuditor ? (selectedFinding?.externalAuditorImage || '') : auditorDetails.employeePhotoUpload}
                      color="primary.main"
                    />
                  );
                })()}
                <BOSPersonnelCard
                  title="NC APPROVED BY"
                  variant="compact"
                  name={
                    selectedFinding?.ncrApprovedBy && selectedFinding.ncrApprovedBy.includes(' - ')
                      ? selectedFinding.ncrApprovedBy.split(' - ')[0].trim()
                      : selectedFinding?.ncrApprovedBy || '-'
                  }
                  empCode={ncrApprovedByDetails.empCode}
                  oldEmpCode={ncrApprovedByDetails.oldEmpCode}
                  department={ncrApprovedByDetails.departmentName}
                  designation={ncrApprovedByDetails.designationName}
                  photo={ncrApprovedByDetails.employeePhotoUpload}
                  color="secondary.main"
                />
              </Stack>
            </BOSFormSection>

            {/* NCR Details */}
            <BOSFormSection title="NCR Details">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5, mb: 2 }}>
                <BOSTextField label="Observation No" value={selectedFinding.observationNo || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="NC No" value={selectedFinding.ncrNo || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Schedule No" value={selectedFinding.auditScheduleNo || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Audit Type" value={selectedFinding.auditType || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Department" value={selectedFinding.departmentName || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Clause" value={selectedFinding.clause || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Seq No" value={selectedFinding.seqNo || '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Observation Date" value={selectedFinding.observationDate ? format(new Date(selectedFinding.observationDate), 'dd/MM/yyyy') : '-'} disabled sx={readOnlyFieldSx} fullWidth />
                <BOSTextField label="Target Date" value={selectedFinding.targetDate ? format(new Date(selectedFinding.targetDate), 'dd/MM/yyyy') : '-'} disabled sx={readOnlyFieldSx} fullWidth />
              </Box>
              <BOSTextField label="Criteria Details" value={selectedFinding.criteriaDetails || '-'} disabled sx={{ ...readOnlyFieldSx }} multiline minRows={2} fullWidth />
            </BOSFormSection>

            {/* CAPA Action Details (Read-only text & side-by-side uploaded evidence document galleries) */}
            <BOSFormSection title="CAPA Action Details">
              <Stack spacing={2} sx={{ mt: 1 }}>
                {/* Root Cause */}
                <Box sx={{ display: 'grid', gridTemplateColumns: formattedRootCauseDocs.length > 0 ? { xs: '1fr', md: '1.8fr 1fr' } : '1fr', gap: 2, alignItems: 'start' }}>
                  <BOSTextField
                    label="Root Cause"
                    value={selectedFinding.rootCause || '-'}
                    multiline
                    minRows={3}
                    disabled={true}
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyFieldSx}
                    fullWidth
                  />
                  {formattedRootCauseDocs.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Box sx={{ bgcolor: 'action.hover', px: 1.5, py: 0.65, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Root Cause Evidence
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <BOSFileGallery files={formattedRootCauseDocs} isEditing={false} />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Corrective Action */}
                <Box sx={{ display: 'grid', gridTemplateColumns: formattedCorrectiveDocs.length > 0 ? { xs: '1fr', md: '1.8fr 1fr' } : '1fr', gap: 2, alignItems: 'start' }}>
                  <BOSTextField
                    label="Corrective Action"
                    value={selectedFinding.correctiveAction || '-'}
                    multiline
                    minRows={3}
                    disabled={true}
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyFieldSx}
                    fullWidth
                  />
                  {formattedCorrectiveDocs.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Box sx={{ bgcolor: 'action.hover', px: 1.5, py: 0.65, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Corrective Action Evidence
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <BOSFileGallery files={formattedCorrectiveDocs} isEditing={false} />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Preventive Action */}
                <Box sx={{ display: 'grid', gridTemplateColumns: formattedPreventiveDocs.length > 0 ? { xs: '1fr', md: '1.8fr 1fr' } : '1fr', gap: 2, alignItems: 'start' }}>
                  <BOSTextField
                    label="Preventive Action"
                    value={selectedFinding.preventiveAction || '-'}
                    multiline
                    minRows={3}
                    disabled={true}
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyFieldSx}
                    fullWidth
                  />
                  {formattedPreventiveDocs.length > 0 && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', overflow: 'hidden', bgcolor: 'background.paper' }}>
                      <Box sx={{ bgcolor: 'action.hover', px: 1.5, py: 0.65, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Preventive Action Evidence
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <BOSFileGallery files={formattedPreventiveDocs} isEditing={false} />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Close NC Comments */}
                {selectedFinding.remarks && (
                  <BOSTextField
                    label="Close NC/OFI Comments"
                    value={selectedFinding.remarks || '-'}
                    multiline
                    minRows={2}
                    disabled={true}
                    InputLabelProps={{ shrink: true }}
                    sx={readOnlyFieldSx}
                    fullWidth
                  />
                )}
              </Stack>
            </BOSFormSection>

            {/* Supporting Reference Documents (Shown only if reference documents exist) */}
            {formattedReferenceDocs.length > 0 && (
              <BOSFormSection title="Supporting Reference Documents" icon={<IconCircleCheck size={20} color={theme.palette.primary.main} />}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5, bgcolor: 'background.paper', mt: 1.5 }}>
                  <BOSFileGallery files={formattedReferenceDocs} isEditing={false} />
                </Box>
              </BOSFormSection>
            )}

            {/* Verification comment — shown only in pending view */}
            {isPendingView && (
              <BOSFormSection title="Verification">
                <BOSTextField
                  label="Verification Comment"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  multiline
                  minRows={3}
                  fullWidth
                  error={!!errors.remarks}
                  helperText={errors.remarks}
                />
              </BOSFormSection>
            )}

            {/* Rejection history */}
            {selectedFinding.cancelRemarks && parseRejectionHistory(selectedFinding.cancelRemarks).length > 0 && (
              <BOSFormSection title="Rejection History">
                <Stack spacing={1}>
                  {parseRejectionHistory(selectedFinding.cancelRemarks).map((h, i) => (
                    <Box key={i} sx={{ p: 1.5, borderRadius: 1, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                      <Typography variant="caption" color="error.dark" fontWeight={600}>
                        Rejected By: {h.rejectedBy || '-'} on {h.rejectedAt || '-'} (Rev {h.revNo || '-'})
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(h.remarks) }} /></Typography>
                    </Box>
                  ))}
                </Stack>
              </BOSFormSection>
            )}
          </Stack>
        )}
      </BOSFormDialog>

      {/* ── Reject Comment Dialog (BOS Standard Design) ── */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onSave={handleConfirmReject}
        title="Reject NCR / OFI"
        maxWidth="sm"
        saveLabel="Save"
        saveButtonDisabled={!rejectionComment.trim() || isSubmitting}
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Please provide a reason for rejection. The NCR will be sent back to UNRESOLVED status.
          </Typography>
          <BOSTextField
            label="Reason for Rejection *"
            value={rejectionComment}
            onChange={(e) => setRejectionComment(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
            autoFocus
            placeholder="Please enter rejection reason..."
            error={!!errors.rejectionComment}
            helperText={errors.rejectionComment}
          />
        </Stack>
      </BOSFormDialog>

      {/* ── File Preview ── */}
      {previewOpen && previewFile && (
        <BOSFilePreview
          open={previewOpen}
          onClose={() => { setPreviewOpen(false); setPreviewFile(null); }}
          file={previewFile}
          url={previewFile.url}
          hideCloseButton
        />
      )}
    </MainCard>
  );
}
