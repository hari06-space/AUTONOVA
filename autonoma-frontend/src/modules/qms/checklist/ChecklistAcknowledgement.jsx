import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Stack,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';
import {
  IconCheck,
  IconX,
  IconEye,
  IconUserCheck,
  IconAlertCircle,
  IconClipboardList,
  IconShieldCheck,
  IconSettings,
  IconPaperclip,
  IconInfoCircle,
  IconLock
} from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTextField, BOSFormSection, BOSFileUpload } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSValidation from 'hooks/useBOSValidation';
import useBOSFilters from 'hooks/useBOSFilters';
import useAuth from 'hooks/useAuth';
import { formatDate } from 'utils/BOSTimeUtils';

export default function ChecklistAcknowledgement() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES.QMS_CHECKLIST_ACKNOWLEDGEMENT);
  const bosFilters = useBOSFilters(perms);
  const globalQuery = useSelector((state) => state.search.query) || '';
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const { clearErrors } = useBOSValidation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [acknowledgements, setAcknowledgements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Review Dialog & Master Detail State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAck, setSelectedAck] = useState(null);
  const [masterDetail, setMasterDetail] = useState(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchAcknowledgements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/qms/checklist/acknowledgement/all');
      setAcknowledgements(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch checklist acknowledgements:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: err?.response?.data?.message || 'Failed to load acknowledgements',
          severity: 'error',
          variant: 'alert'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAcknowledgements();
  }, [fetchAcknowledgements]);

  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const scopeOptions = bosFilters.getFilterOptions();

    dispatch(
      setFilterConfig({
        config: [
          {
            id: 'scope',
            label: 'Scope',
            type: 'select',
            options: scopeOptions,
            defaultValue: scopeOptions[0]?.value || 'Mine',
            isStarred: true
          },
          {
            id: 'ackStatus',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'All', label: 'ALL' },
              { value: 'PENDING', label: 'PENDING' },
              { value: 'ACCEPTED', label: 'ACCEPTED' },
              { value: 'REJECTED', label: 'REJECTED' },
              { value: 'INACTIVE', label: 'INACTIVE' }
            ],
            defaultValue: 'All',
            isStarred: true
          },
          { id: 'memberType', label: 'Role Type', type: 'text', placeholder: 'Primary/Secondary...', isStarred: true },
          { id: 'reassignedBy', label: 'Reassigned By', type: 'text', placeholder: 'Search reassigner...' }
        ],
        path: '/qms/checklist/acknowledgement'
      })
    );

    return () => dispatch(setFilterConfig({ config: null, path: '/qms/checklist/acknowledgement' }));
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded]);

  // Helper to determine if current logged-in user is the assigned target of a reassignment request
  const isAssignedToMe = useCallback(
    (ack) => {
      if (!ack || !user) return false;
      const loggedInEmpId = String(user?.empId || user?.id || user?.userId || '').trim();
      const loggedInUsername = String(user?.userId || user?.id || user?.name || '').toLowerCase().trim();
      const loggedInName = String(user?.name || '').toLowerCase().trim();

      const isNewAssigneeIdMatch = ack.newAssigneeId && String(ack.newAssigneeId).trim() === loggedInEmpId;
      const isOldAssigneeIdMatch = ack.oldAssigneeId && String(ack.oldAssigneeId).trim() === loggedInEmpId;
      const isNewAssigneeNameMatch =
        ack.newAssigneeName &&
        (String(ack.newAssigneeName).toLowerCase().trim() === loggedInName ||
          String(ack.newAssigneeName).toLowerCase().trim() === loggedInUsername);

      return Boolean(isNewAssigneeIdMatch || isOldAssigneeIdMatch || isNewAssigneeNameMatch);
    },
    [user]
  );

  const handleOpenReviewDialog = async (row) => {
    setSelectedAck(row);
    setRejectionReason('');
    setShowRejectInput(false);
    clearErrors();
    setReviewDialogOpen(true);
    setMasterDetail(null);

    if (row?.checklistId) {
      setMasterLoading(true);
      try {
        const res = await axios.get(`/api/qms/checklist/${row.checklistId}`);
        setMasterDetail(res.data);
      } catch (err) {
        console.error('Failed to load master checklist details:', err);
      } finally {
        setMasterLoading(false);
      }
    }
  };

  const handleAcceptFromModal = async () => {
    if (!selectedAck) return;
    if (!isAssignedToMe(selectedAck)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission Denied: Only the assigned recipient can accept or reject this reassignment.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    setProcessingId(selectedAck.id);
    try {
      await axios.post('/api/qms/checklist/acknowledgement/respond', {
        id: selectedAck.id,
        action: 'ACCEPTED'
      });
      dispatch(
        openSnackbar({
          open: true,
          message: `Checklist #${selectedAck.checklistId} reassignment ACCEPTED successfully!`,
          severity: 'success',
          variant: 'alert'
        })
      );
      setReviewDialogOpen(false);
      fetchAcknowledgements();
    } catch (err) {
      console.error('Accept error:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: err?.response?.data?.message || 'Failed to accept reassignment',
          severity: 'error',
          variant: 'alert'
        })
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFromModal = async () => {
    if (!selectedAck) return;
    if (!isAssignedToMe(selectedAck)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission Denied: Only the assigned recipient can accept or reject this reassignment.',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please state a valid rejection reason (minimum 5 characters).',
          severity: 'error',
          variant: 'alert'
        })
      );
      return;
    }

    setProcessingId(selectedAck.id);
    try {
      await axios.post('/api/qms/checklist/acknowledgement/respond', {
        id: selectedAck.id,
        action: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      });
      dispatch(
        openSnackbar({
          open: true,
          message: `Checklist #${selectedAck.checklistId} reassignment REJECTED. Administrators notified.`,
          severity: 'warning',
          variant: 'alert'
        })
      );
      setReviewDialogOpen(false);
      fetchAcknowledgements();
    } catch (err) {
      console.error('Reject error:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: err?.response?.data?.message || 'Failed to reject reassignment',
          severity: 'error',
          variant: 'alert'
        })
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Helper formatting for Departments
  const formatDepartments = (depts) => {
    if (!depts) return '-';
    if (Array.isArray(depts)) {
      const list = depts
        .map((d) => {
          if (typeof d === 'object' && d !== null) {
            return d.departmentName || d.name || d.label || d.department || '';
          }
          return String(d || '');
        })
        .filter(Boolean);
      return list.length > 0 ? list.join(', ') : '-';
    }
    if (typeof depts === 'object' && depts !== null) {
      return depts.departmentName || depts.name || depts.label || '-';
    }
    return String(depts);
  };

  // Helper formatting for Yes/No boolean flags
  const formatYesNo = (val) => {
    if (val === true || val === 1 || val === '1' || val === 'Yes' || val === 'YES' || val === 'true') return 'Yes';
    return 'No';
  };

  // Helper to parse file attachment strings/arrays into BOSFileUpload file objects
  const parseFileString = (str) => {
    if (!str || str === '-' || str === '[]') return [];
    try {
      if (typeof str === 'string' && str.startsWith('[')) {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            if (typeof item === 'string') {
              const nameOnly = item.split('/').pop().replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
              return { name: nameOnly, serverFileName: item, path: item };
            }
            return item;
          });
        }
      }
    } catch (e) {}
    if (typeof str === 'string') {
      return str
        .split(',')
        .map((f) => {
          const trimmed = f.trim();
          const nameOnly = trimmed.split('/').pop().replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
          return { name: nameOnly, serverFileName: trimmed, path: trimmed };
        })
        .filter((f) => f.serverFileName);
    }
    return [];
  };

  // Filtered Rows logic
  const filteredRows = acknowledgements.filter((row) => {
    if (globalFilters.scope) {
      const scopeVal = String(globalFilters.scope).toLowerCase();
      if (scopeVal === 'mine') {
        const loggedInName = String(user?.name || '').toLowerCase().trim();
        const loggedInUsername = String(user?.userId || user?.id || '').toLowerCase().trim();
        const loggedInEmpId = String(user?.empId || user?.id || user?.userId || '').trim();

        const matchReassignedBy =
          row.reassignedBy &&
          (String(row.reassignedBy).toLowerCase().trim() === loggedInName ||
            String(row.reassignedBy).toLowerCase().trim() === loggedInUsername ||
            String(row.reassignedBy).toLowerCase().trim().includes(loggedInName) ||
            String(row.reassignedBy).toLowerCase().trim().includes(loggedInUsername));

        const matchCreatedBy =
          row.createdBy &&
          (String(row.createdBy).toLowerCase().trim() === loggedInName ||
            String(row.createdBy).toLowerCase().trim() === loggedInUsername ||
            String(row.createdBy).toLowerCase().trim().includes(loggedInName) ||
            String(row.createdBy).toLowerCase().trim().includes(loggedInUsername));

        const matchNewAssignee = row.newAssigneeId && String(row.newAssigneeId).trim() === loggedInEmpId;
        const matchOldAssignee = row.oldAssigneeId && String(row.oldAssigneeId).trim() === loggedInEmpId;

        const isMine = matchReassignedBy || matchCreatedBy || matchNewAssignee || matchOldAssignee;
        if (!isMine) return false;
      } else {
        const scopeMatch =
          bosFilters.matchScope(globalFilters.scope, row.newAssigneeId, row.reassignedBy) ||
          bosFilters.matchScope(globalFilters.scope, row.oldAssigneeId, row.reassignedBy) ||
          bosFilters.matchScope(globalFilters.scope, null, row.reassignedBy) ||
          bosFilters.matchScope(globalFilters.scope, null, row.createdBy);
        if (!scopeMatch) return false;
      }
    }

    if (globalQuery) {
      const q = globalQuery.toLowerCase().trim();
      const matchQuery =
        String(row.checklistId || '').toLowerCase().includes(q) ||
        String(row.memberType || '').toLowerCase().includes(q) ||
        String(row.reassignedBy || '').toLowerCase().includes(q) ||
        String(row.ackStatus || '').toLowerCase().includes(q) ||
        String(row.reassignmentReason || '').toLowerCase().includes(q);
      if (!matchQuery) return false;
    }

    if (globalFilters.ackStatus && globalFilters.ackStatus !== 'All') {
      if (String(row.ackStatus).toUpperCase() !== String(globalFilters.ackStatus).toUpperCase()) return false;
    }
    if (globalFilters.memberType) {
      if (!String(row.memberType || '').toLowerCase().includes(globalFilters.memberType.toLowerCase())) return false;
    }
    if (globalFilters.reassignedBy) {
      if (!String(row.reassignedBy || '').toLowerCase().includes(globalFilters.reassignedBy.toLowerCase())) return false;
    }

    return true;
  });

  const columns = [
    { id: 'index', label: 'NO', minWidth: 60, align: 'center' },
    {
      id: 'checklistId',
      label: 'CHECKLIST ID',
      minWidth: 120,
      align: 'center',
      bold: true,
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        return <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>#{row?.checklistId || '-'}</Typography>;
      }
    },
    {
      id: 'memberType',
      label: 'ROLE TYPE',
      minWidth: 120,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        const type = row?.memberType || 'PRIMARY';
        return (
          <Chip
            label={type}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.68rem',
              borderRadius: '6px',
              bgcolor: type === 'PRIMARY' ? 'primary.lighter' : type === 'SECONDARY' ? 'secondary.lighter' : 'warning.lighter',
              color: type === 'PRIMARY' ? 'primary.main' : type === 'SECONDARY' ? 'secondary.main' : 'warning.dark'
            }}
          />
        );
      }
    },
    {
      id: 'reassignedBy',
      label: 'REASSIGNED BY',
      minWidth: 130,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        return row?.reassignedBy || '-';
      }
    },
    {
      id: 'reassignedDate',
      label: 'REASSIGNED DATE',
      minWidth: 150,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        return formatDate(row?.reassignedDate) || '-';
      }
    },
    {
      id: 'reassignmentReason',
      label: 'REASSIGNMENT REASON',
      minWidth: 200,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        return (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {row?.reassignmentReason || '-'}
          </Typography>
        );
      }
    },
    {
      id: 'ackStatus',
      label: 'STATUS',
      minWidth: 130,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        let color = 'default';
        let bg = 'action.selected';
        let statusText = row?.ackStatus || 'PENDING';

        if (statusText === 'PENDING') {
          color = '#ed6c02';
          bg = isDark ? 'rgba(237,108,2,0.15)' : '#fff3e0';
        } else if (statusText === 'ACCEPTED') {
          color = '#2e7d32';
          bg = isDark ? 'rgba(46,125,50,0.15)' : '#e8f5e9';
        } else if (statusText === 'REJECTED') {
          color = '#d32f2f';
          bg = isDark ? 'rgba(211,47,47,0.15)' : '#ffebee';
        } else if (statusText === 'INACTIVE') {
          color = '#757575';
          bg = isDark ? 'rgba(117,117,117,0.15)' : '#f5f5f5';
        }

        return (
          <Chip
            label={statusText}
            size="small"
            sx={{
              fontWeight: 800,
              borderRadius: '8px',
              fontSize: '0.68rem',
              bgcolor: bg,
              color: color,
              border: '1px solid',
              borderColor: color
            }}
          />
        );
      }
    },
    {
      id: 'rejectionReason',
      label: 'REJECTION COMMENTS',
      minWidth: 180,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        return row?.rejectionReason ? (
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
            {row.rejectionReason}
          </Typography>
        ) : '-';
      }
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      minWidth: 120,
      align: 'center',
      renderCell: (param1, param2) => {
        const row = param2 || param1?.row || param1;
        const isPending = row?.ackStatus === 'PENDING';
        const assignedToMe = isAssignedToMe(row);

        if (isPending && assignedToMe) {
          return (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleOpenReviewDialog(row)}
              startIcon={<IconUserCheck size={16} />}
              sx={{
                fontWeight: 800,
                borderRadius: '8px',
                height: 32,
                px: 1.5,
                boxShadow: 2
              }}
            >
              Acknowledge
            </Button>
          );
        }

        return (
          <Tooltip title={isPending ? 'Read-only view for Team/Company reassignment' : 'View Checklist Details & Response History'}>
            <IconButton
              color={isPending ? 'warning' : 'default'}
              size="small"
              onClick={() => handleOpenReviewDialog(row)}
              sx={{
                border: '1px solid',
                borderColor: isPending ? 'warning.main' : 'divider',
                bgcolor: isPending ? (isDark ? 'rgba(237, 108, 2, 0.15)' : 'warning.lighter') : 'transparent',
                '&:hover': {
                  bgcolor: isPending ? 'warning.light' : 'action.hover'
                }
              }}
            >
              <IconEye size={18} />
            </IconButton>
          </Tooltip>
        );
      }
    }
  ];

  return (
    <MainCard pageCode={PAGE_CODES.QMS_CHECKLIST_ACKNOWLEDGEMENT} title="Checklist Acknowledgement Portal">
      {/* Main Data Table */}
      <BOSDataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        page={page}
        size={size}
        totalElements={filteredRows.length}
        onPageChange={(e, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onDoubleClickRow={(row) => handleOpenReviewDialog(row)}
      />

      {/* Review & Details Modal */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconUserCheck color="#2196f3" size={26} />
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Checklist Reassignment Review (#{selectedAck?.checklistId || '-'})
            </Typography>
          </Stack>
          <IconButton onClick={() => setReviewDialogOpen(false)} size="small">
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedAck && (
            <Stack spacing={3}>
              {/* Read-Only Notice Banner if Pending but NOT assigned to current user */}
              {selectedAck.ackStatus === 'PENDING' && !isAssignedToMe(selectedAck) && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: 'warning.main',
                    bgcolor: isDark ? 'rgba(237,108,2,0.15)' : '#fff3e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <IconLock color="#ed6c02" size={22} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                    Read-Only View: You are inspecting this reassignment under Team / Company scope. Only the assigned recipient can accept or reject this request.
                  </Typography>
                </Box>
              )}

              {/* 1. TOP SECTION: Master Checklist Specifications Form Section */}
              <BOSFormSection
                icon={<IconClipboardList size={22} color={theme.palette.secondary.main} />}
                title={`Checklist Master Specifications (#${selectedAck.checklistId})`}
              >
                {masterLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, gap: 1.5 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Loading Master Checklist Specifications...</Typography>
                  </Box>
                ) : masterDetail ? (
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5 }}>
                      <BOSTextField
                        label="Sequence No *"
                        value={masterDetail.seqNo || '-'}
                        disabled
                      />
                      <BOSTextField
                        label="Category *"
                        value={masterDetail.category || 'CHECK LIST'}
                        disabled
                      />
                      <BOSTextField
                        label="Checking Point *"
                        value={masterDetail.checkingPoint || '-'}
                        disabled
                      />
                    </Box>

                    {/* Standard Normal Text Format for Description / SOP */}
                    <BOSTextField
                      label="Description / SOP *"
                      multiline
                      rows={4}
                      value={masterDetail.description || '-'}
                      disabled
                    />

                    {/* Execution & Frequency Controls */}
                    <BOSFormSection
                      icon={<IconSettings size={20} color={theme.palette.primary.main} />}
                      title="Execution & Frequency Controls"
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                        <BOSTextField
                          label="Department *"
                          value={formatDepartments(masterDetail.departments)}
                          disabled
                        />
                        <BOSTextField
                          label="Effective From *"
                          value={formatDate(masterDetail.effectiveFrom) || '-'}
                          disabled
                        />
                        <BOSTextField
                          label="Frequency *"
                          value={masterDetail.frequency || '-'}
                          disabled
                        />
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                        <BOSTextField
                          label="Stock Link"
                          value={formatYesNo(masterDetail.stockLink)}
                          disabled
                        />
                        <BOSTextField
                          label="Photo Required"
                          value={formatYesNo(masterDetail.photoRequired)}
                          disabled
                        />
                        <BOSTextField
                          label="Dual Check"
                          value={formatYesNo(masterDetail.dualCheck)}
                          disabled
                        />
                        <BOSTextField
                          label="Carry Forward"
                          value={formatYesNo(masterDetail.carryForward)}
                          disabled
                        />
                      </Box>
                    </BOSFormSection>

                    {/* Uploaded Master Checklist Documents (If Attached) */}
                    {(() => {
                      const uploadedDocs = parseFileString(masterDetail.uploadedFiles);
                      const scannedDocs = parseFileString(masterDetail.scannedFiles);
                      const allDocs = [...uploadedDocs, ...scannedDocs];
                      if (allDocs.length === 0) return null;

                      return (
                        <BOSFormSection
                          icon={<IconPaperclip size={20} color={theme.palette.info.main} />}
                          title={`Uploaded Master Checklist Documents (${allDocs.length})`}
                        >
                          <BOSFileUpload
                            files={allDocs}
                            module="MASTER_QMS_CHECKLIST_CHECK_LIST_MASTER"
                            multiple={true}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            disabled={true}
                            hideDropzone={true}
                            label=""
                          />
                        </BOSFormSection>
                      );
                    })()}

                    {/* Verification & Audit Details */}
                    <BOSFormSection
                      icon={<IconShieldCheck size={20} color={theme.palette.success.main} />}
                      title="Verification Details"
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                        <BOSTextField
                          label="Status"
                          value={masterDetail.status || 'Active'}
                          disabled
                        />
                        <BOSTextField
                          label="Created By"
                          value={masterDetail.createdBy || '-'}
                          disabled
                        />
                        <BOSTextField
                          label="Created Date & Time"
                          value={formatDate(masterDetail.createdDate) || '-'}
                          disabled
                        />
                        <BOSTextField
                          label="Verification Status"
                          value={masterDetail.verifyStatus || 'VERIFIED'}
                          disabled
                        />
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2 }}>
                        <BOSTextField
                          label="Verified By"
                          value={masterDetail.verifiedBy || '-'}
                          disabled
                        />
                      </Box>
                    </BOSFormSection>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Master Checklist specifications not available.
                  </Typography>
                )}
              </BOSFormSection>

              {/* 2. BOTTOM SECTION: Reassignment Request Details Form Section */}
              <BOSFormSection
                icon={<IconUserCheck size={22} color={theme.palette.primary.main} />}
                title="Reassignment Request Details"
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                  <BOSTextField
                    label="CHECKLIST DOCUMENT ID"
                    value={`#${selectedAck.checklistId}`}
                    disabled
                  />
                  <BOSTextField
                    label="ASSIGNED ROLE TYPE"
                    value={selectedAck.memberType || 'PRIMARY'}
                    disabled
                  />
                  <BOSTextField
                    label="ACKNOWLEDGEMENT STATUS"
                    value={selectedAck.ackStatus || 'PENDING'}
                    disabled
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                  <BOSTextField
                    label="REASSIGNED BY"
                    value={selectedAck.reassignedBy || '-'}
                    disabled
                  />
                  <BOSTextField
                    label="REASSIGNMENT DATE & TIME"
                    value={formatDate(selectedAck.reassignedDate) || '-'}
                    disabled
                  />
                </Box>

                <BOSTextField
                  label="REASSIGNMENT REASON / EXPLANATION"
                  multiline
                  rows={2}
                  value={selectedAck.reassignmentReason || 'No reassignment reason provided.'}
                  disabled
                />

                {selectedAck.ackStatus !== 'PENDING' && (
                  <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
                      RESPONSE HISTORY
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                      <BOSTextField
                        label="RESPONSE DATE"
                        value={formatDate(selectedAck.acknowledgedDate) || '-'}
                        disabled
                      />
                      <BOSTextField
                        label="REJECTION COMMENTS"
                        value={selectedAck.rejectionReason || '-'}
                        disabled
                      />
                    </Box>
                  </Box>
                )}
              </BOSFormSection>

              {/* 3. Mandatory Rejection Reason Form - Shown ONLY when Reject is clicked and user is assigned recipient */}
              {selectedAck.ackStatus === 'PENDING' && isAssignedToMe(selectedAck) && showRejectInput && (
                <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'error.main', bgcolor: isDark ? 'rgba(211,47,47,0.08)' : '#ffebee' }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconAlertCircle color="#d32f2f" size={20} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main' }}>
                        Mandatory Rejection Reason
                      </Typography>
                    </Stack>
                    <BOSTextField
                      multiline
                      rows={3}
                      fullWidth
                      required
                      placeholder="Please enter the reason for rejecting this checklist reassignment..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600 }}>
                      Note: Minimum 5 characters required. Administrators will be dispatched this notification immediately.
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="inherit" onClick={() => setReviewDialogOpen(false)} sx={{ borderRadius: '8px', fontWeight: 600 }}>
            Close
          </Button>

          {selectedAck?.ackStatus === 'PENDING' && isAssignedToMe(selectedAck) && (
            <Stack direction="row" spacing={1.5}>
              {!showRejectInput ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={processingId === selectedAck.id}
                    onClick={() => setShowRejectInput(true)}
                    startIcon={<IconX size={18} />}
                    sx={{ borderRadius: '8px', fontWeight: 800, px: 2.5 }}
                  >
                    Reject Reassignment
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={processingId === selectedAck.id}
                    onClick={handleAcceptFromModal}
                    startIcon={<IconCheck size={18} />}
                    sx={{ borderRadius: '8px', fontWeight: 800, px: 2.5 }}
                  >
                    Accept & Acknowledge
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setShowRejectInput(false)}
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  >
                    Cancel Rejection
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={processingId === selectedAck.id}
                    onClick={handleRejectFromModal}
                    startIcon={<IconX size={18} />}
                    sx={{ borderRadius: '8px', fontWeight: 800, px: 2.5 }}
                  >
                    Confirm Rejection
                  </Button>
                </>
              )}
            </Stack>
          )}
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
