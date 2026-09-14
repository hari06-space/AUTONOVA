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
  BOSExportButton,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  parseFileString
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

const getPhotoUrl = (path) => {
  if (!path) return null;
  return `${axios.defaults.baseURL || ''}/api/files/view?path=${encodeURIComponent(path)}`;
};

export default function LeaveVerification() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.PAY_LEAVE_VERIFICATION);
  const { myTeamEmployees = [] } = useBOSFilters(perms);
  const globalFilters = useSelector((state) => state.search.filters);
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verification Details Dialog States
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({ el: 0, cl: 0, sl: 0, pl: 0, al: 0 });

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
      const response = await axios.get(`/api/hr/leave-entries/verification-list?scope=${scope}`);
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leave entries:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Leave Verification details.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, globalFilters?.scope, user]);

  // Fetch Leave Master Balances for selected employee
  useEffect(() => {
    if (selectedRow && dialogOpen) {
      const empId = selectedRow.employeeId || selectedRow.employee?.id;
      if (empId) {
        axios.get('/api/hr/leave-masters')
          .then((res) => {
            const list = res.data || [];
            const empMaster = list.find((lm) => String(lm.employeeId || lm.employee?.id) === String(empId));
            if (empMaster) {
              setLeaveBalances({
                el: empMaster.el ?? 0,
                cl: empMaster.cl ?? 0,
                sl: empMaster.sl ?? 0,
                pl: empMaster.pl ?? 0,
                al: empMaster.al ?? 0,
              });
            } else {
              setLeaveBalances({ el: 0, cl: 0, sl: 0, pl: 0, al: 0 });
            }
          })
          .catch(() => {
            setLeaveBalances({ el: 0, cl: 0, sl: 0, pl: 0, al: 0 });
          });
      }
    }
  }, [selectedRow, dialogOpen]);

  // Starred Filters config
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
  }, [dispatch, user, myTeamEmployees, perms]);

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
      await axios.post(`/api/hr/leave-entries/${selectedRow.id}/verify`, {
        status: 'Verified',
        remarks: ''
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Request successfully verified.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to verify leave status.';
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
          message: 'Verification Remarks are mandatory when rejecting a leave request.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/hr/leave-entries/${selectedRow.id}/verify`, {
        status: 'Rejected',
        remarks: rejectReasonInput.trim()
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Leave Request successfully rejected.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        })
      );
      setRejectDialogOpen(false);
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reject leave status.';
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
        const rStatus = r.status || 'Pending to Verify';
        if (rStatus !== 'Pending to Verify') {
          if (!matchCommonDateFilters(r, globalFilters, 'createdDate', null)) return false;
        }

        const statusFilter = globalFilters?.status;
        if (statusFilter && statusFilter !== 'ALL') {
          const statuses = statusFilter.split(',').map(s => s.trim().toLowerCase());
          if (!statuses.includes(rStatus.toLowerCase())) return false;
        }
        return true;
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
          empCode: r.employee?.oldEmpCode || r.employee?.empCode || '—',
          employeeName: r.employee?.employeeName || '—',
          dateRange: dateRangeStr
        };
      });
  }, [rows, globalFilters]);

  // Table Columns
  const columns = useMemo(() => [
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
        const name = row.employeeName || row.employee?.employeeName || 'N/A';
        const photo = row.employeePhotoUpload || row.employeePhoto || row.employee?.employeePhotoUpload || row.employee?.photoUpload;
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
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
      id: 'leaveType',
      label: 'Leave Type',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const type = row.leaveType;
        const colors = {
          CL: { bg: 'rgba(33, 150, 243, 0.12)', text: '#0d47a1', border: 'rgba(33, 150, 243, 0.3)' },
          SL: { bg: 'rgba(244, 67, 54, 0.12)', text: '#b71c1c', border: 'rgba(244, 67, 54, 0.3)' },
          EL: { bg: 'rgba(76, 175, 80, 0.12)', text: '#1b5e20', border: 'rgba(76, 175, 80, 0.3)' },
          PL: { bg: 'rgba(156, 39, 176, 0.12)', text: '#4a148c', border: 'rgba(156, 39, 176, 0.3)' },
          WFH: { bg: 'rgba(0, 150, 136, 0.12)', text: '#004d40', border: 'rgba(0, 150, 136, 0.3)' },
          LOP: { bg: 'rgba(244, 67, 54, 0.12)', text: '#b71c1c', border: 'rgba(244, 67, 54, 0.3)' }
        }[type] || { bg: 'rgba(158, 158, 158, 0.12)', text: '#424242', border: 'rgba(158, 158, 158, 0.3)' };

        return (
          <Chip
            label={type}
            size="small"
            sx={{
              background: colors.bg,
              color: colors.text,
              border: '1px solid',
              borderColor: colors.border,
              fontWeight: '800',
              fontSize: '0.75rem',
              borderRadius: '6px',
              px: 0.5
            }}
          />
        );
      }
    },
    { id: 'noOfDays', label: 'No of Days', minWidth: 100, align: 'center' },
    {
      id: 'halfDay',
      label: 'Half Day',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        const val = (row.halfDay || 'No').toLowerCase();
        return val === 'morning' || val === 'afternoon' || val === 'yes'
          ? (val === 'morning' ? 'Morning' : val === 'afternoon' ? 'Afternoon' : 'Yes')
          : 'No';
      }
    },
    { id: 'reason', label: 'Reason', minWidth: 180, align: 'center' },

    { id: 'createdBy', label: 'Created By', minWidth: 120 },
    {
      id: 'createdDate',
      label: 'Created Date',
      minWidth: 150,
      align: 'center',
      render: (row) => row.createdDate ? formatDate(row.createdDate) : '—'
    },
    { id: 'verifiedBy', label: 'Verified By', minWidth: 120 },
    {
      id: 'verifiedDate',
      label: 'Verified Date',
      minWidth: 150,
      align: 'center',
      render: (row) => row.verifiedDate ? formatDate(row.verifiedDate) : '—'
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
          width={150}
        />
      )
    }
  ], []);

  const isVerticalHeadForRecord = useCallback((row) => {
    if (!row || !user) return false;
    
    // Admin override (userLevel >= 5 or username 'admin')
    if (user?.userLevel >= 5 || user?.username === 'admin' || user?.id === 'admin') {
      return true;
    }

    const empIdOfRecord = String(row.employeeId || row.employee?.id || '');
    const loggedInEmpId = String(user?.empId || user?.id || '');
    const loggedInEmpCode = (user?.empCode || user?.oldEmpCode || user?.username || '').toLowerCase().trim();
    const loggedInName = (user?.employeeName || user?.name || user?.displayName || '').toLowerCase().trim();

    // 1. Check if record employee is in myTeamEmployees list
    if (myTeamEmployees && myTeamEmployees.length > 0) {
      const isTeamMember = myTeamEmployees.some(e => String(e.id) === empIdOfRecord);
      if (isTeamMember) return true;
    }

    // 2. Direct property check on row.employee object
    const emp = row.employee || {};
    const vhId = String(emp.verticalHeadId || '');
    const vhCode = (emp.verticalHead || emp.verticalHeadName || '').toLowerCase().trim();

    if (vhId && vhId === loggedInEmpId) return true;
    if (vhCode && (vhCode === loggedInEmpCode || vhCode === loggedInName || vhCode.includes(loggedInEmpCode))) return true;

    return false;
  }, [user, myTeamEmployees]);

  const employeeProfile = selectedRow?.employee || null;
  const attachedFiles = parseFileString(selectedRow?.filePaths);

  // Status checks for read-only vs editable mode
  const currentStatus = selectedRow?.status || 'Pending to Verify';
  const isPendingStatus = currentStatus === 'Pending to Verify' || currentStatus === 'Pending' || currentStatus === 'Pending for verify';
  const canApproveRecord = (perms.write || perms.approval) && isPendingStatus && (perms.additional1 || perms.approval || user?.userLevel >= 1 || isVerticalHeadForRecord(selectedRow));
  const isRejected = currentStatus === 'Rejected';
  const isVerified = currentStatus === 'Verified';
  const storedRejectionRemarks = selectedRow?.rejectReason || selectedRow?.remarks || selectedRow?.verificationRemarks || '';

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
            <Typography variant="h3" component="span">Leave Verification</Typography>
          </Box>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          id="hr_leave_verification_table"
          onRefresh={fetchRows}
          columns={columns}
          exportData={resolvedRows}
          exportFilename="Leave_Verifications"
          hasExportPermission={perms.export}
          exportColumns={[
            { header: 'Emp Code', key: 'empCode' },
            { header: 'Emp Name', key: 'employeeName' },
            { header: 'From Date & To Date', key: 'dateRange' },
            { header: 'Days', key: 'noOfDays' },
            { header: 'Leave Type', key: 'leaveType' },
            { header: 'Reason', key: 'reason' },
            { header: 'Status', key: 'status' }
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
        id="hr_leave_verification_table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        showActions={false}
        disableTableConfig={true}
        onRowClick={(row) => handleOpenVerification(row)}
        onDoubleClickRow={(row) => handleOpenVerification(row)}
      />

      {/* Leave Verification Details Dialog - Verify Action Disabled/Hidden for Rejected & Verified records */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Leave Verification Details"
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
            {/* Right Panel Sidebar - Leave Balances */}
            <BOSFormSection title="Leave Balances" icon={<IconClock size={22} color={theme.palette.primary.main} />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {[
                  { type: 'EL', label: 'Earn Leave (EL)', val: leaveBalances.el, colors: { bg: '#e8f5e9', text: '#2e7d32', border: '#4caf50' } },
                  { type: 'CL', label: 'Casual Leave (CL)', val: leaveBalances.cl, colors: { bg: '#e3f2fd', text: '#1565c0', border: '#2196f3' } },
                  { type: 'SL', label: 'Sick Leave (SL)', val: leaveBalances.sl, colors: { bg: '#ffebee', text: '#c62828', border: '#ef5350' } },
                  { type: 'PL', label: 'Privilege Leave (PL)', val: leaveBalances.pl, colors: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ce93d8' } },
                  { type: 'AL', label: 'Annual Leave (AL)', val: leaveBalances.al, colors: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' } },
                ].map((item) => (
                  <Box
                    key={item.type}
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
                      {item.val !== undefined && item.val !== null ? item.val : 0}
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
        {/* Main Grid: Left Panel (Profile + Audit History) & Center Panel (Leave Details & Conditional Remarks) */}
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
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>{employeeProfile?.department?.departmentName || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employeeProfile?.designation?.designationName || '—'}</Typography>
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.createdDate)}</Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected By' : 'Verified By'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.verifiedBy || selectedRow?.updatedBy || selectedRow?.createdBy || '—'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {isRejected ? 'Rejected Date & Time' : 'Verified Date & Time'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.verifiedDate || selectedRow?.updatedDate || selectedRow?.createdDate)}</Typography>
                </Box>
              </Box>
            </BOSFormSection>
          </Box>

          {/* Center Panel - Leave Details & Permanent Read-Only Rejection Remarks */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            <BOSFormSection
              icon={<IconFileText size={22} color={theme.palette.primary.main} />}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>Leave Details & Verification</span>
                  {/* Status Badge */}
                  <BOSStatusChip status={currentStatus} showIcon={true} width={140} />
                </Stack>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Leave Type
                    </Typography>
                    <Chip
                      label={selectedRow?.leaveType || '—'}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        px: 1,
                        height: '28px'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Half Day Session
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {selectedRow?.halfDay || 'No'}
                    </Typography>
                  </Box>

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

                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      Duration
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.9rem' }}>
                      {selectedRow?.noOfDays ? `${selectedRow.noOfDays} Days` : '—'}
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

      {/* Dedicated Mandatory Reject Reason Modal */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject Leave Request"
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
            You are about to reject the leave request for <strong>{selectedRow?.employeeName}</strong> ({formatDate(selectedRow?.fromDate)} to {formatDate(selectedRow?.toDate)}).
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
