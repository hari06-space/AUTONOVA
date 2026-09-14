import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Box,
  Button,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  Badge
} from '@mui/material';
import {
  IconCalendar,
  IconCheck,
  IconEye,
  IconX,
  IconUsers,
  IconUser,
  IconFileText,
  IconHistory,
  IconPaperclip,
  IconClock,
  IconBan
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
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  parseBOSFiles,
  getCleanFileName,
  getPhotoUrl
} from 'ui-component/bos';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import useConfig from 'hooks/useConfig';
import { formatDate, formatTime, formatDateTime } from 'utils/BOSTimeUtils';

export const DYNAMIC_COMPONENTS = [];

const getDisplayName = (fileName) => {
  if (!fileName) return '';
  return getCleanFileName(fileName);
};

export default function PermissionVerification() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_ATTENDANCE_PERMISSION_VERIFICATION);
  const { myTeamEmployees = [] } = useBOSFilters(perms);
  const globalFilters = useSelector((state) => state.search.filters);
  const { user } = useAuth();
  const { timeFormat, dateFormat } = useConfig();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verification Details Dialog States
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const [monthlyUsage, setMonthlyUsage] = useState({
    usedRequests: 0,
    maxRequests: 2,
    usedMinutes: 0,
    maxMinutes: 120,
    remainingMinutes: 120
  });

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
      const isVerticalHead = myTeamEmployees && myTeamEmployees.length > 0;
      const defaultScope = perms?.manager || isVerticalHead ? 'My Team' : 'Mine';
      const scope = globalFilters?.scope || defaultScope;
      const response = await axios.get(`/api/hra/permission-entries?scope=${scope}`);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch permission entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Permission Verification details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, globalFilters?.scope, myTeamEmployees, perms]);

  // Fetch Employee Profile & Monthly Usage when dialog opens
  useEffect(() => {
    if (selectedRow && dialogOpen) {
      const empId = selectedRow.employeeId || selectedRow.employee?.id;
      if (empId) {
        axios.get(`/api/hr/leave-entries/employee-details/${empId}`)
          .then((res) => {
            if (res.data) setEmployeeProfile(res.data);
          })
          .catch(() => setEmployeeProfile(null));

        const permDateStr = selectedRow.permissionDate ? new Date(selectedRow.permissionDate).toISOString().substring(0, 10) : '';
        axios.get('/api/hra/permission-entries/monthly-usage', {
          params: { employeeId: empId, date: permDateStr }
        })
          .then((res) => {
            if (res.data) setMonthlyUsage(res.data);
          })
          .catch(() => {
            setMonthlyUsage({ usedRequests: 0, maxRequests: 2, usedMinutes: 0, maxMinutes: 120, remainingMinutes: 120 });
          });
      }
    } else {
      setEmployeeProfile(null);
    }
  }, [selectedRow, dialogOpen]);

  // Starred Filters config (Exact layout matching Leave Verification)
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
        defaultValue: perms?.manager || isVerticalHead ? 'My Team' : 'Mine',
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
  }, [dispatch, user, myTeamEmployees, perms]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleOpenVerification = (row) => {
    setSelectedRow(row);
    setRejectReasonInput('');
    setDialogOpen(true);
  };

  const handleVerify = async (targetRow = selectedRow) => {
    const rowToVerify = targetRow || selectedRow;
    if (!rowToVerify || !rowToVerify.id) return;

    setSubmitting(true);
    try {
      await axios.put(`/api/hra/permission-entries/${rowToVerify.id}/approve`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission Request successfully verified.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to verify permission status.';
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

  const handleOpenRejectModal = (targetRow = selectedRow) => {
    if (targetRow) setSelectedRow(targetRow);
    setRejectReasonInput('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRow || !selectedRow.id) return;

    if (!rejectReasonInput.trim()) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Verification Remarks are mandatory when rejecting a permission request.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(`/api/hra/permission-entries/${selectedRow.id}/reject`, {
        rejectionComment: rejectReasonInput.trim()
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Permission Request successfully rejected.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setRejectDialogOpen(false);
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reject permission status.';
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

    return rows
      .filter((r) => {
        let rStatus = r.status || 'Pending to Verify';
        if (rStatus === 'Pending for Verify') rStatus = 'Pending to Verify';

        if (rStatus !== 'Pending to Verify') {
          if (!matchCommonDateFilters(r, globalFilters, 'createdDate', null)) return false;
        }

        const statusFilter = globalFilters?.status;
        if (statusFilter && statusFilter !== 'ALL') {
          const filterLower = statusFilter.toLowerCase();
          const statusLower = rStatus.toLowerCase();
          if (filterLower.includes('pending') && !statusLower.includes('pending')) return false;
          if (filterLower.includes('verified') && (!statusLower.includes('verified') && !statusLower.includes('approved'))) return false;
          if (filterLower.includes('reject') && !statusLower.includes('reject')) return false;
          if (!filterLower.includes('pending') && !filterLower.includes('verified') && !filterLower.includes('reject') && statusLower !== filterLower) return false;
        }
        return true;
      })
      .map((r, i) => {
        let statusVal = r.status || 'Pending to Verify';
        if (statusVal === 'Pending for Verify') statusVal = 'Pending to Verify';

        return {
          ...r,
          index: i + 1,
          empCode: r.employee?.oldEmpCode || r.employee?.empCode || r.employee_code || r.employeeCode || '—',
          employeeName: r.employee?.employeeName || r.employeeName || '—',
          createdBy: r.created_by || r.createdUser || r.createdBy || '—',
          createdDate: r.created_date || r.createdAt || r.createdDate || null,
          updatedBy: r.updated_by || r.updatedBy || '—',
          updatedDate: r.updated_datetime || r.updatedDate || null,
          statusDisplay: statusVal
        };
      });
  }, [rows, globalFilters]);

  // Inline Table Action Buttons (Approve / Reject / View)
  const renderRowActions = (row) => {
    const rawSt = (row.statusDisplay || row.status || '').toUpperCase();
    const isPending = (rawSt.includes('PENDING') || rawSt.includes('VERIFY')) && !rawSt.includes('VERIFIED');

    return (
      <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
        {isPending && (
          <>
            <Tooltip title="Approve Request">
              <IconButton
                color="success"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVerify(row);
                }}
                sx={{
                  border: '1px solid',
                  borderColor: 'success.light',
                  borderRadius: '6px',
                  p: 0.5,
                  bgcolor: 'success.lighter',
                  '&:hover': { bgcolor: 'success.main', color: 'white' }
                }}
              >
                <IconCheck size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reject Request">
              <IconButton
                color="error"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenRejectModal(row);
                }}
                sx={{
                  border: '1px solid',
                  borderColor: 'error.light',
                  borderRadius: '6px',
                  p: 0.5,
                  bgcolor: 'error.lighter',
                  '&:hover': { bgcolor: 'error.main', color: 'white' }
                }}
              >
                <IconBan size={16} />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="View Request Details">
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenVerification(row);
            }}
            sx={{
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: '6px',
              p: 0.5,
              bgcolor: 'primary.lighter',
              '&:hover': { bgcolor: 'primary.main', color: 'white' }
            }}
          >
            <IconEye size={16} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  // Table Columns (Exact Layout Matching Leave Verification)
  const columns = useMemo(() => [
    {
      id: 'attachments',
      label: 'Attachment',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const rawFiles = row.filePaths || row.documents || row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
        const parsed = typeof rawFiles === 'string' ? parseBOSFiles(rawFiles) : (Array.isArray(rawFiles) ? rawFiles : []);
        const count = parsed.length;
        const badgeLabel = count > 99 ? '99+' : String(count);

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) handleViewAttachments(parsed, row.employeeName);
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
      minWidth: 180,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const photo = row.employeePhotoUpload || row.employeePhoto || row.employee?.employeePhotoUpload || row.employee?.profileUpload;
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
                    sx={{ width: 140, height: 150, objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ p: 1, display: 'block' }}>No Photo Available</Typography>
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
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {name}
            </Typography>
          </Stack>
        );
      }
    },
    {
      id: 'permissionDate',
      label: 'Date',
      minWidth: 130,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
          <IconCalendar size={15} style={{ color: '#2196f3', opacity: 0.8 }} />
          <Typography variant="body2" sx={{ fontWeight: '600', fontSize: '0.825rem' }}>
            {row.permissionDate ? formatDate(row.permissionDate, dateFormat) : '—'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'fromTime',
      label: 'From Time',
      minWidth: 100,
      align: 'center',
      render: (row) => formatTime(row.fromTime, timeFormat)
    },
    {
      id: 'toTime',
      label: 'To Time',
      minWidth: 100,
      align: 'center',
      render: (row) => formatTime(row.toTime, timeFormat)
    },
    {
      id: 'actualDuration',
      label: 'Duration',
      minWidth: 110,
      align: 'center',
      render: (row) => {
        const duration = row.actualDuration || 'N/A';
        return <BOSStatusChip status={duration} toneOverride="info" width={110} />;
      }
    },
    { id: 'reason', label: 'Reason', minWidth: 180, align: 'center' },
    {
      id: 'fromWhere',
      label: 'From Where',
      minWidth: 160,
      align: 'center',
      render: (row) => {
        const val = row.fromWhere || row.sourceModule || (row.createdBy === row.employeeName ? 'Employee Self Care' : 'HR Permission Details');
        const isSelf = val === 'Employee Self Care';
        return <BOSStatusChip status={val} toneOverride={isSelf ? 'info' : 'neutral'} width={160} />;
      }
    },
    { id: 'createdBy', label: 'Created By', minWidth: 120, align: 'center' },
    {
      id: 'createdDate',
      label: 'Created Date & Time',
      minWidth: 170,
      align: 'center',
      render: (row) => row.createdDate ? formatDateTime(row.createdDate, timeFormat, dateFormat) : '—'
    },
    { id: 'verifiedBy', label: 'Verified By', minWidth: 120, align: 'center' },
    {
      id: 'verifiedDate',
      label: 'Verified Date & Time',
      minWidth: 170,
      align: 'center',
      render: (row) => row.verifiedDate ? formatDateTime(row.verifiedDate, timeFormat, dateFormat) : '—'
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <BOSStatusChip
          status={row.statusDisplay || row.status || 'Pending to Verify'}
          showIcon={true}
          width={150}
        />
      )
    }
  ], [dateFormat, timeFormat]);

  const attachedFiles = useMemo(() => {
    if (!selectedRow) return [];
    const rawFiles = selectedRow.uploadedFiles || selectedRow.supportingDocuments || selectedRow.files || selectedRow.attachment || selectedRow.attachments || [];
    return typeof rawFiles === 'string' ? parseBOSFiles(rawFiles) : (Array.isArray(rawFiles) ? rawFiles : []);
  }, [selectedRow]);

  // Status checks for read-only vs editable mode
  const currentStatus = selectedRow?.statusDisplay || selectedRow?.status || 'Pending to Verify';
  const isPendingStatus = !currentStatus || currentStatus.toUpperCase().includes('PENDING') || (currentStatus.toUpperCase().includes('VERIFY') && !currentStatus.toUpperCase().includes('VERIFIED'));
  const canApproveRecord = isPendingStatus;
  const isRejected = currentStatus.toUpperCase().includes('REJECT');
  const storedRejectionRemarks = selectedRow?.rejectionReason || selectedRow?.rejectionComment || selectedRow?.rejectReason || selectedRow?.remarks || '';

  return (
    <MainCard
      contentSX={{ p: 0 }}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '8px',
              bgcolor: 'primary.lighter',
              color: 'primary.dark'
            }}
          >
            <IconUsers size={22} />
          </Box>
          <Box
            component="a"
            href="#"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' }
            }}
          >
            <Typography variant="h3" component="span">Permission Verification</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="permission_verification_table"
          onRefresh={fetchRows}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="Permission_Verifications"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Emp Name', key: 'employeeName' },
            { header: 'Date', key: 'permissionDate' },
            { header: 'From Time', key: 'fromTime' },
            { header: 'To Time', key: 'toTime' },
            { header: 'Duration', key: 'actualDuration' },
            { header: 'Reason', key: 'reason' },
            { header: 'From Where', key: 'fromWhere' },
            { header: 'Status', key: 'statusDisplay' }
          ]}
        />
      }
    >
      <BOSTableToolbar
        columns={columns}
        showFilters
      />
      {DYNAMIC_COMPONENTS.map((comp) => comp.render({ rows, resolvedRows, loading, perms }))}

      <BOSDataTable
        id="permission_verification_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        showActions={false}
        disableTableConfig={true}
        onRowClick={(row) => handleOpenVerification(row)}
        onDoubleClickRow={(row) => handleOpenVerification(row)}
      />

      {/* Permission Verification Details Dialog - Exact Layout Matching Leave Verification */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Permission Verification Details"
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
                onClick={() => handleOpenRejectModal(selectedRow)}
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
                onClick={() => handleVerify(selectedRow)}
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
            {/* Right Panel Sidebar - Permission Monthly Usage */}
            <BOSFormSection title="Monthly Permission Usage" icon={<IconClock size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {[
                  { label: 'Used Requests', val: `${monthlyUsage.usedRequests || 0} / ${monthlyUsage.maxRequests || 2}`, colors: { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' } },
                  { label: 'Used Duration', val: `${monthlyUsage.usedMinutes || 0} Mins`, colors: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' } },
                  { label: 'Remaining Duration', val: `${monthlyUsage.remainingMinutes || 120} Mins`, colors: { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' } },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      bgcolor: item.colors.bg,
                      border: '1.5px solid',
                      borderColor: item.colors.border,
                      borderRadius: '10px',
                      px: 1.8,
                      py: 1.1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      '&:hover': { transform: 'translateX(2px)', boxShadow: `0 4px 10px rgba(0,0,0,0.06)` }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 800, color: item.colors.text, fontSize: '0.78rem', letterSpacing: 0.2 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontWeight: 900, color: item.colors.text, fontSize: '1.05rem' }}>
                      {item.val}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </BOSFormSection>

            {/* Right Panel Sidebar - Supporting Documents */}
            <BOSFormSection title={`Supporting Documents (${attachedFiles.length})`} icon={<IconPaperclip size={22} color={theme.palette.primary.main} />}>
              {attachedFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1.5 }}>
                  No attachments uploaded
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {attachedFiles.map((file, idx) => {
                    const name = typeof file === 'string' ? file : (file.name || file.fileName || '');
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
        {/* Main Grid: Left Panel (Profile + Audit History) & Center Panel (Permission Details & Conditional Remarks) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3.8fr 8.2fr' }, gap: 3.5, width: '100%' }}>
          
          {/* Left Panel - Profile Card & Verification Audit History */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            {/* Employee Profile Card */}
            <Box sx={{
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
            }}>
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {employeeProfile?.departmentName || employeeProfile?.department?.departmentName || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employeeProfile?.designationName || employeeProfile?.designation?.designationName || '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Verification Audit History */}
            <BOSFormSection title="Verification Audit History" icon={<IconHistory size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Applied By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.createdBy || '—'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Applied Date & Time</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.createdDate, timeFormat, dateFormat)}</Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected By' : 'Verified By'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.verifiedBy || '—'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected Date & Time' : 'Verified Date & Time'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.verifiedDate, timeFormat, dateFormat)}</Typography>
                </Box>
              </Box>
            </BOSFormSection>
          </Box>

          {/* Center Panel - Permission Details & Permanent Read-Only Rejection Remarks */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            <BOSFormSection
              icon={<IconFileText size={22} color={theme.palette.primary.main} />}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>Permission Details & Verification</span>
                  {/* Status Badge */}
                  <BOSStatusChip status={currentStatus} showIcon={true} width={140} />
                </Stack>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Permission Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatDate(selectedRow?.permissionDate, dateFormat)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      From Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatTime(selectedRow?.fromTime, timeFormat)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      To Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {formatTime(selectedRow?.toTime, timeFormat)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem' }}>
                      {selectedRow?.actualDuration || '—'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    Reason / Purpose
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
                    {selectedRow?.reason || '—'}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>

            {/* Permanent Read-Only Rejection Remarks Section (Displayed ONLY for Rejected records) */}
            {isRejected && storedRejectionRemarks && (
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
                  {storedRejectionRemarks}
                </Typography>
              </BOSFormSection>
            )}
          </Box>

        </Box>
      </BOSFormDialog>

      {/* Dedicated Mandatory Reject Reason Modal (Exact Matching Leave Verification) */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Permission Request"
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
            You are about to reject the permission request for <strong>{selectedRow?.employeeName}</strong> ({formatDate(selectedRow?.permissionDate, dateFormat)}).
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
            helperText={!rejectReasonInput.trim() ? "Verification remarks are mandatory for rejection." : ""}
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
