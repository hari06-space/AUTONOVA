import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Box,
  Button,
  Chip,
  IconButton,
  Avatar,
  Divider,
  Tooltip,
  useTheme,
  Badge
} from '@mui/material';
import {
  IconCalendar,
  IconCheck,
  IconEye,
  IconX,
  IconRefresh,
  IconUsers,
  IconUser,
  IconFileText,
  IconHistory,
  IconPaperclip,
  IconClock,
  IconBan,
  IconPlaneTilt,
  IconCoins
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSTableToolbar,
  getCommonDateFilters,
  matchCommonDateFilters,
  BOSFileGallery,
  BOSStatusChip,
  BOSExportButton,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  parseFileString,
  getPhotoUrl,
  parseBOSFiles
} from 'ui-component/bos';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';

export const DYNAMIC_COMPONENTS = [];

const formatDate = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB');
  } catch {
    return '—';
  }
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const dateStr = d.toLocaleDateString('en-GB');
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${dateStr} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  } catch {
    return '—';
  }
};

const getDisplayName = (fileName) => {
  if (!fileName) return '';
  const cleanName = fileName.replace(/\\/g, '/').split('/').pop();
  const parts = cleanName.split('_');
  return parts.length > 1 && parts[0].length >= 32 ? parts.slice(1).join('_') : cleanName;
};

export default function HraLTAVerifyList() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.PAY_LTA_VERIFICATION);
  const { myTeamEmployees = [] } = useBOSFilters(perms);
  const globalFilters = useSelector((state) => state.search.filters);
  const searchQuery = useSelector((state) => state.search.query);
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verification Details Dialog States
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mandatory Reject Reason Modal States
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Gallery states
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryEmpName, setGalleryEmpName] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const scope = globalFilters?.scope || 'Mine';
      let response;
      try {
        response = await axios.get(`/api/hr/leave-travel-applications/verification-list?scope=${scope}`);
      } catch (e) {
        response = await axios.get('/api/hr/leave-travel-applications');
      }
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave travel applications:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Travel Allowance Verification details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, globalFilters?.scope]);

  // Starred Filters config matching Leave Verification
  useEffect(() => {
    const isVerticalHead = myTeamEmployees && myTeamEmployees.length > 0;
    const scopeOptions = [{ value: 'Mine', label: 'Mine' }];
    if (perms?.manager || isVerticalHead) {
      scopeOptions.push({ value: 'My Team', label: 'My Team' });
    }
    if (perms?.additional1) {
      scopeOptions.push({ value: 'My Company', label: 'My Company' });
    }

    const config = [
      {
        id: 'scope',
        label: 'Request Scope',
        type: 'select',
        options: scopeOptions,
        defaultValue: 'Mine',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Pending to Verify', label: 'Pending to Verify' },
          { value: 'Verified', label: 'Verified' },
          { value: 'Rejected', label: 'Rejected' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'createdDate',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, myTeamEmployees, perms]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenVerification = (row) => {
    setSelectedRow(row);
    setRejectReasonInput('');
    setDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedRow) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/hr/leave-travel-applications/${selectedRow.id}/verify`, {
        status: 'Verified',
        remarks: ''
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Travel Allowance Request successfully verified.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to verify status.';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectReasonInput('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRow) return;

    if (!rejectReasonInput.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Verification Remarks are mandatory when rejecting a request.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/hr/leave-travel-applications/${selectedRow.id}/verify`, {
        status: 'Rejected',
        remarks: rejectReasonInput.trim()
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Travel Allowance Request successfully rejected.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setRejectDialogOpen(false);
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reject status.';
      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAttachments = (files, empName) => {
    setGalleryFiles(files);
    setGalleryEmpName(empName);
    setGalleryOpen(true);
  };

  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    const q = (searchQuery || '').toLowerCase();

    return rows
      .filter((r) => {
        const rStatus = r.status || 'Pending to Verify';

        if (rStatus !== 'Pending to Verify') {
          if (!matchCommonDateFilters(r, globalFilters, 'createdDate', null)) return false;
        }

        const statusFilter = globalFilters?.status;
        if (statusFilter && statusFilter !== 'ALL') {
          const statuses = statusFilter.split(',').map((s) => s.trim().toLowerCase());
          if (!statuses.includes(rStatus.toLowerCase())) return false;
        }

        const empName = r.employeeName || r.employee?.employeeName || '';
        const empCode = r.empCode || r.employee?.empCode || r.employee?.oldEmpCode || '';
        const desc = r.description || '';

        const matchesSearch =
          !q ||
          empName.toLowerCase().includes(q) ||
          empCode.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          rStatus.toLowerCase().includes(q);

        return matchesSearch;
      })
      .map((r, i) => {
        const fromStr = formatDate(r.fromDate);
        const toStr = formatDate(r.toDate);
        let dateRangeStr = '';
        if (fromStr && toStr) {
          dateRangeStr = fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
        } else {
          dateRangeStr = fromStr;
        }

        return {
          ...r,
          index: i + 1,
          empCode: r.employee?.oldEmpCode || r.employee?.empCode || r.empCode || '—',
          employeeName: r.employee?.employeeName || r.employeeName || '—',
          dateRange: dateRangeStr,
          whereFrom: r.whereFrom || 'HRA Module'
        };
      });
  }, [rows, globalFilters, searchQuery]);

  // Table Columns matching Leave Verification exactly
  const columns = useMemo(
    () => [
      {
        id: 'attachments',
        label: 'Attachment',
        minWidth: 100,
        align: 'center',
        render: (row) => {
          const rawFiles = row.filePaths || row.documents || row.uploadedFiles || row.supportingDocuments;
          const files = typeof rawFiles === 'string' ? parseFileString(rawFiles) : (Array.isArray(rawFiles) ? rawFiles : []);
          const count = files.length;
          const badgeLabel = count > 99 ? '99+' : String(count);

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  if (count > 0) handleViewAttachments(files, row.employeeName);
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: count > 0 ? 'pointer' : 'default',
                  p: 0.5,
                  m: 0.5,
                  borderRadius: '8px',
                  transition: 'background 0.18s ease',
                  '&:hover': { backgroundColor: count > 0 ? 'action.hover' : 'transparent' }
                }}
              >
                <Badge
                  badgeContent={count > 0 ? badgeLabel : null}
                  color="primary"
                  anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                  sx={{
                    '& .MuiBadge-badge': {
                      transform: 'scale(1) translate(-25%, -25%)',
                      fontSize: count > 99 ? '0.55rem' : '0.65rem',
                      fontWeight: 800,
                      minWidth: count > 9 ? '20px' : '17px',
                      height: count > 9 ? '20px' : '17px',
                      boxShadow: (theme) => `0 2px 6px 0 ${theme.palette.primary.main}80`
                    }
                  }}
                >
                  <IconPaperclip
                    size={20}
                    style={{
                      display: 'block',
                      color: count > 0 ? 'inherit' : '#9e9e9e',
                      opacity: count > 0 ? 1 : 0.4
                    }}
                  />
                </Badge>
              </Box>
            </Box>
          );
        }
      },
      { id: 'index', label: 'No', minWidth: 55, frozen: true, align: 'center' },
      { id: 'empCode', label: 'Emp Code', bold: true, minWidth: 100, align: 'center' },
      {
        id: 'employeeName',
        label: 'Emp Name',
        bold: true,
        minWidth: 190,
        render: (row) => {
          const name = row.employeeName || 'N/A';
          const photo = row.employee?.employeePhotoUpload;
          const photoUrl = photo ? getPhotoUrl(photo) : null;
          return (
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Tooltip
                placement="right"
                arrow
                title={
                  photoUrl ? (
                    <Box
                      component="img"
                      src={photoUrl}
                      alt={name}
                      sx={{
                        width: 140,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: '8px',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ p: 1, display: 'block' }}>
                      No Photo Available
                    </Typography>
                  )
                }
              >
                <Avatar
                  src={photoUrl}
                  alt={name}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    border: '1.5px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.25)',
                      zIndex: 10
                    }
                  }}
                >
                  {name.charAt(0)}
                </Avatar>
              </Tooltip>
              <Typography variant="body2" sx={{ fontWeight: '700', color: 'text.primary' }}>
                {name}
              </Typography>
            </Stack>
          );
        }
      },
      {
        id: 'dateRange',
        label: 'From Date & To Date',
        minWidth: 180,
        align: 'center',
        render: (row) => (
          <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
            <IconCalendar size={15} style={{ color: '#2196f3', opacity: 0.8 }} />
            <Typography variant="body2" sx={{ fontWeight: '600', fontSize: '0.825rem' }}>
              {row.dateRange}
            </Typography>
          </Stack>
        )
      },
      {
        id: 'totalDays',
        label: 'Days',
        minWidth: 90,
        align: 'center',
        render: (row) => (
          <Chip
            label={`${row.totalDays || 1} Days`}
            size="small"
            sx={{ fontWeight: '700', fontSize: '0.72rem', borderRadius: '6px', bgcolor: 'rgba(33, 150, 243, 0.08)', color: '#0d47a1' }}
          />
        )
      },
      {
        id: 'amount',
        label: 'Amount (₹)',
        minWidth: 120,
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark' }}>
            ₹{parseFloat(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Typography>
        )
      },
      { id: 'description', label: 'Purpose / Travel Details', minWidth: 200 },
      { id: 'createdBy', label: 'Created By', minWidth: 120 },
      {
        id: 'createdDate',
        label: 'Created Date & Time',
        minWidth: 170,
        align: 'center',
        render: (row) => (row.createdDate ? formatDate(row.createdDate) : '—')
      },
      { id: 'verifiedBy', label: 'Verified By', minWidth: 120 },
      {
        id: 'verifiedDate',
        label: 'Verified Date & Time',
        minWidth: 170,
        align: 'center',
        render: (row) => (row.verifiedDate ? formatDate(row.verifiedDate) : '—')
      },
      {
        id: 'whereFrom',
        label: 'From Where',
        minWidth: 160,
        align: 'center',
        render: (row) => {
          const rawVal = row.whereFrom || 'Employee Self Care';
          const val = rawVal === 'Self Care' ? 'Employee Self Care' : rawVal;
          const isSelf = val.toLowerCase().includes('self care');
          return <BOSStatusChip status={val} toneOverride={isSelf ? 'info' : 'neutral'} width={160} />;
        }
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 150,
        align: 'center',
        render: (row) => (
          <BOSStatusChip
            status={row.status || 'Pending to Verify'}
            showIcon={true}
            width={160}
          />
        )
      }
    ],
    []
  );

  const isVerticalHeadForRecord = useCallback(
    (row) => {
      if (!row || !user) return false;
      if (user?.userLevel >= 5 || user?.username === 'admin' || user?.id === 'admin') {
        return true;
      }
      const empIdOfRecord = String(row.employeeId || row.employee?.id || '');
      if (myTeamEmployees && myTeamEmployees.length > 0) {
        const isTeamMember = myTeamEmployees.some((e) => String(e.id) === empIdOfRecord);
        if (isTeamMember) return true;
      }
      return false;
    },
    [user, myTeamEmployees]
  );

  const employeeProfile = selectedRow?.employee || null;
  const attachedFiles = parseFileString(selectedRow?.filePaths || selectedRow?.uploadedFiles);

  const currentStatus = selectedRow?.status || 'Pending to Verify';
  const isPendingStatus =
    currentStatus === 'Pending to Verify' ||
    currentStatus === 'Pending' ||
    currentStatus === 'Pending for verify';
  const canApproveRecord =
    (perms.write || perms.approval) &&
    isPendingStatus &&
    (perms.additional1 || perms.approval || user?.userLevel >= 1 || isVerticalHeadForRecord(selectedRow));
  const isRejected = currentStatus === 'Rejected';
  const storedRejectionRemarks =
    selectedRow?.rejectReason || selectedRow?.remarks || selectedRow?.verificationRemarks || '';

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconPlaneTilt size={24} color={theme.palette.primary.main} />
          <Box
            component="a"
            href="/hra/attendance/lta-verification"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            <Typography variant="h3" component="span">
              Leave Travel Allowance Verification
            </Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_lta_verification_table"
          onRefresh={fetchRows}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="Leave_Travel_Allowance_verification"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Emp Name', key: 'employeeName' },
            { header: 'From Date & To Date', key: 'dateRange' },
            { header: 'Days', key: 'totalDays' },
            { header: 'Amount (₹)', key: 'amount' },
            { header: 'Purpose / Details', key: 'description' },
            { header: 'Status', key: 'status' }
          ]}
        />
      }
    >
      <BOSTableToolbar columns={columns} showFilters />
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, resolvedRows, loading, perms }))}

      <BOSDataTable
        id="hr_lta_verification_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        showActions={false}
        disableTableConfig={true}
        onRowClick={(row) => handleOpenVerification(row)}
        onDoubleClickRow={(row) => handleOpenVerification(row)}
      />

      {/* Leave Travel Allowance Verification Details Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Leave Travel Allowance Verification Details"
        hasId={false}
        maxWidth="lg"
        fullWidth
        contentSx={{ overflowY: 'visible', p: '24px !important' }}
        secondaryActions={
          canApproveRecord ? (
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
              <Button
                variant="contained"
                color="error"
                onClick={handleOpenRejectModal}
                startIcon={<IconBan size={18} />}
                disabled={submitting}
                size="medium"
                sx={{ px: 2.5, fontWeight: 700, borderRadius: '8px' }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleVerify}
                startIcon={<IconCheck size={18} />}
                disabled={submitting}
                size="medium"
                sx={{ px: 2.5, fontWeight: 700, borderRadius: '8px' }}
              >
                Verify
              </Button>
            </Stack>
          ) : null
        }
        sidebar={
          <>
            {/* Right Panel Sidebar - Supporting Documents */}
            <BOSFormSection
              title={`Supporting Documents (${attachedFiles.length})`}
              icon={<IconPaperclip size={22} color={theme.palette.primary.main} />}
            >
              {attachedFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5 }}>
                  No attachments uploaded
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {attachedFiles.map((file, idx) => {
                    const name = file.name || file;
                    const displayName = getDisplayName(name);
                    return (
                      <Tooltip key={idx} title={displayName} placement="top">
                        <Box
                          onClick={() => handleViewAttachments(attachedFiles, selectedRow?.employeeName)}
                          sx={{
                            p: 1.1,
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '160px'
                            }}
                          >
                            {displayName}
                          </Typography>
                          <IconEye size={18} style={{ color: theme.palette.primary.main, flexShrink: 0 }} />
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            </BOSFormSection>
          </>
        }
      >
        {/* Main Grid: Left Panel (Profile + Audit History) & Center Panel (Allowance Details & Verification) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.8fr 8.2fr' }, gap: 3.5, width: '100%' }}>
          {/* Left Panel - Profile Card & Verification Audit History */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            {/* Employee Profile Card */}
            <Box
              sx={{
                border: '1.5px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                bgcolor: isDark ? 'background.default' : 'grey.50',
                p: 3.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  textAlign: 'center'
                }}
              >
                <Avatar
                  src={employeeProfile?.employeePhotoUpload ? getPhotoUrl(employeeProfile.employeePhotoUpload) : null}
                  alt={selectedRow?.employeeName}
                  sx={{
                    width: 88,
                    height: 88,
                    border: '3px solid',
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }}
                >
                  {selectedRow?.employeeName?.charAt(0) || <IconUser size={44} />}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {selectedRow?.employeeName || '—'}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Employee ID: {selectedRow?.empCode || '—'}
                  </Typography>
                </Box>
                <Divider sx={{ width: '100%', my: 0.5 }} />
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      Department
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {employeeProfile?.department?.departmentName || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      Designation
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employeeProfile?.designation?.designationName || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Verification Audit History */}
            <BOSFormSection
              title="Verification Audit History"
              icon={<IconHistory size={22} color={theme.palette.primary.main} />}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Applied By
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedRow?.createdBy || '—'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Applied Date & Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDateTime(selectedRow?.createdDate)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected By' : 'Verified By'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedRow?.verifiedBy || selectedRow?.updatedBy || selectedRow?.createdBy || '—'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected Date & Time' : 'Verified Date & Time'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDateTime(selectedRow?.verifiedDate || selectedRow?.updatedDate || selectedRow?.createdDate)}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>
          </Box>

          {/* Center Panel - Allowance Details & Verification */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            <BOSFormSection
              icon={<IconFileText size={22} color={theme.palette.primary.main} />}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>Allowance & Period Details</span>
                  <BOSStatusChip status={currentStatus} showIcon={true} width={160} />
                </Stack>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      From Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatDate(selectedRow?.fromDate)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      To Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatDate(selectedRow?.toDate)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Total Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem' }}>
                      {selectedRow?.totalDays ? `${selectedRow.totalDays} Days` : '1 Day'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Total Claim Amount (₹)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark', fontSize: '0.9rem' }}>
                      ₹{parseFloat(selectedRow?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Purpose / Travel Details
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                      wordBreak: 'break-word',
                      fontSize: '0.85rem',
                      lineHeight: 1.4
                    }}
                  >
                    {selectedRow?.description || '—'}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>

            {/* Permanent Read-Only Rejection Remarks Section */}
            {isRejected && (
              <BOSFormSection title="Rejection Remarks" icon={<IconFileText size={22} color={theme.palette.error.main} />}>
                <Typography
                  variant="body2"
                  sx={{
                    p: 1.8,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'error.light',
                    bgcolor: isDark ? 'rgba(244, 67, 54, 0.08)' : '#fff5f5',
                    color: isDark ? '#ef5350' : '#c62828',
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    fontWeight: 600
                  }}
                >
                  {storedRejectionRemarks || selectedRow?.rejectReason || selectedRow?.remarks || 'No rejection reason specified.'}
                </Typography>
              </BOSFormSection>
            )}
          </Box>
        </Box>
      </BOSFormDialog>

      {/* Mandatory Reject Reason Modal */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Leave Travel Allowance Request"
        hasId={false}
        maxWidth="xs"
        fullWidth
        secondaryActions={
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setRejectDialogOpen(false)}
              disabled={submitting}
              size="medium"
              sx={{ fontWeight: 700, borderRadius: '8px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmReject}
              startIcon={<IconBan size={18} />}
              disabled={submitting || !rejectReasonInput.trim()}
              size="medium"
              sx={{ px: 2.5, fontWeight: 700, borderRadius: '8px' }}
            >
              Confirm Rejection
            </Button>
          </Stack>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            You are about to reject the Leave Travel Allowance request for{' '}
            <strong>{selectedRow?.employeeName}</strong> ({formatDate(selectedRow?.fromDate)} to{' '}
            {formatDate(selectedRow?.toDate)}).
          </Typography>

          <BOSTextField
            name="rejectReasonInput"
            label="Verification Remarks *"
            value={rejectReasonInput}
            onChange={(e) => setRejectReasonInput(e.target.value)}
            placeholder="Enter mandatory rejection reason..."
            multiline
            rows={3}
            fullWidth
            required
            error={!rejectReasonInput.trim()}
            helperText={!rejectReasonInput.trim() ? 'Verification remarks are mandatory for rejection.' : ''}
            autoFocus
          />
        </Box>
      </BOSFormDialog>

      {/* Attachments Gallery Modal */}
      <BOSFileGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        files={galleryFiles}
        title={`Attachments - ${galleryEmpName}`}
      />
    </MainCard>
  );
}
