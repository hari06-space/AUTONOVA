import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  MenuItem,
  Box,
  Divider,
  Chip,
  Avatar,
  Badge,
  useTheme
} from '@mui/material';
import {
  IconRefresh,
  IconUser,
  IconHistory,
  IconFileText,
  IconCheck,
  IconBan,
  IconUsers,
  IconCalendar,
  IconClock,
  IconPaperclip
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSExportButton,
  BOSStatusChip,
  BOSTableToolbar,
  BOSFormSection,
  BOSFileGallery,
  parseFileString,
  parseBOSFiles
} from 'ui-component/bos';

const getPhotoUrl = (path) => {
  if (!path) return null;
  return `${axios.defaults.baseURL || ''}/api/files/view?path=${encodeURIComponent(path)}`;
};
import useAuth from 'hooks/useAuth';
import useBOSFilters from 'hooks/useBOSFilters';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

// ── Layout helpers (match OD Entry style) ──────────────────────────────────────
function FormRow({ children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      {children}
    </Box>
  );
}

function FormFullRow({ children }) {
  return (
    <Box sx={{ width: '100%' }}>
      {children}
    </Box>
  );
}

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

// ── Component ──────────────────────────────────────────────────────────────────
export default function HraOdVerifyList() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);

  // Rejection sub-dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectRemarkError, setRejectRemarkError] = useState('');

  const perms = usePagePermissions(PAGE_CODES.HRA_ATTENDANCE_OD_VERIFY);

  // Fetch employee master for code lookup
  useEffect(() => {
    axios.get('/api/master/hr/employees')
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
        setEmployees(list);
      })
      .catch(() => setEmployees([]));
  }, []);

  // ── Data Fetch ────────────────────────────────────────────────────────────────
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hra/od-entries');
      const list = (response.data || []).filter(r => r.isActive !== false);
      setRows(list);
    } catch {
      dispatch(openSnackbar({ open: true, message: 'Failed to load OD entries.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ── Open verify dialog on double-click ───────────────────────────────────────
  const handleOpenVerify = useCallback((row) => {
    setSelectedRow(row);
    setRejectRemarks('');
    setRejectRemarkError('');
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRow(null);
  };

  // ── Verify ─────────────────────────────────────────────────────────
  const handleVerify = async () => {
    try {
      await axios.put(`/api/hra/od-entries/${selectedRow.id}/verify`, {
        status: 'Verified',
        rejectionReason: '',
        remarks: ''
      });
      dispatch(openSnackbar({
        open: true,
        message: 'OD Entry successfully verified!',
        variant: 'alert',
        severity: 'success'
      }));
      handleCloseDialog();
      fetchRows();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to verify OD Entry.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', severity: 'error' }));
    }
  };

  // ── Open rejection remarks dialog ─────────────────────────────────────────────
  const handleOpenReject = () => {
    setRejectRemarks('');
    setRejectRemarkError('');
    setRejectDialogOpen(true);
  };

  // ── Confirm rejection ─────────────────────────────────────────────────────────
  const handleConfirmReject = async () => {
    if (!rejectRemarks || !rejectRemarks.trim()) {
      setRejectRemarkError('Rejection remarks are mandatory.');
      return;
    }
    try {
      await axios.put(`/api/hra/od-entries/${selectedRow.id}/verify`, {
        status: 'Rejected',
        rejectionReason: rejectRemarks.trim(),
        remarks: rejectRemarks.trim()
      });
      dispatch(openSnackbar({
        open: true,
        message: 'OD Entry rejected successfully.',
        variant: 'alert',
        severity: 'success'
      }));
      setRejectDialogOpen(false);
      handleCloseDialog();
      fetchRows();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reject OD Entry.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', severity: 'error' }));
    }
  };

  // ── Table Columns ────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: 'attachment',
      label: 'Attachment',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        const files = row.filePaths || row.documents || row.uploadedFiles || row.supportingDocuments || row.files || row.attachment || row.attachments || [];
        const parsed = typeof files === 'string' ? parseBOSFiles(files) : (Array.isArray(files) ? files : []);
        const count = parsed.length;
        const badgeLabel = count > 99 ? '99+' : String(count);

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (count > 0) {
                  setAttachmentFiles(parsed);
                  setAttachmentsDialogOpen(true);
                }
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
    { id: 'index', label: 'No', minWidth: 50, align: 'center' },
    {
      id: 'odNumber', label: 'OD Number', bold: true, minWidth: 140, align: 'center',
      render: (row) => (
        <Box sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{row.odNumber}</Box>
      )
    },
    {
      id: 'employeeCode', label: 'Employee Code', minWidth: 130, align: 'center',
      render: (row) => {
        const emp = employees.find(e => e.id === row.employeeId) || row.employee;
        return <Box>{emp?.empCode || ''}</Box>;
      }
    },
    {
      id: 'employeeName', label: 'Employee Name', minWidth: 180,
      render: (row) => {
        const name = row.employeeName || 'N/A';
        const emp = employees.find(e => e.id === row.employeeId) || row.employee;
        const photo = row.employeePhotoUpload || row.employeePhoto || emp?.employeePhotoUpload || emp?.profileUpload;
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
      id: 'purposeOfOd', label: 'Purpose', minWidth: 180, align: 'center',
      render: (row) => <Box sx={{ textAlign: 'center' }}>{row.purposeOfOd || ''}</Box>
    },
    {
      id: 'odFromDateTime', label: 'Onduty From', minWidth: 150, align: 'center',
      render: (row) => {
        if (!row.odFromDateTime) return '';
        const d = new Date(row.odFromDateTime);
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.toLocaleDateString('en-GB')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </Typography>
          </Box>
        );
      }
    },
    {
      id: 'odToDateTime', label: 'Onduty To', minWidth: 150, align: 'center',
      render: (row) => {
        if (!row.odToDateTime) return '';
        const d = new Date(row.odToDateTime);
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.toLocaleDateString('en-GB')}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </Typography>
          </Box>
        );
      }
    },
    { id: 'visitType', label: 'Visit Type', minWidth: 110, align: 'center' },
    { id: 'vehicleType', label: 'Vehicle', minWidth: 100, align: 'center' },
    { id: 'fromLocation', label: 'From Location', minWidth: 130, align: 'center' },
    { id: 'toLocation', label: 'To Location', minWidth: 130, align: 'center' },
    {
      id: 'distance', label: 'Distance (Km)', minWidth: 110, align: 'center',
      render: (row) => row.distance ? parseFloat(row.distance).toFixed(2) : '0.00'
    },
    {
      id: "whereFrom",
      label: "From Where",
      minWidth: 160,
      align: "center",
      render: (row) => {
        const val = row.whereFrom || "HR OD Entry";
        let bgColor = "rgba(156, 39, 176, 0.08)";
        let textColor = "#7b1fa2";
        let borderColor = "rgba(156, 39, 176, 0.35)";
        if (val.toLowerCase().includes("self care")) {
          bgColor = "rgba(30, 136, 229, 0.08)";
          textColor = "#1565c0";
          borderColor = "rgba(30, 136, 229, 0.35)";
        }
        return (
          <Chip
            label={val}
            size="small"
            sx={{
              fontWeight: "700",
              fontSize: "0.72rem",
              borderRadius: "6px",
              border: "1px solid",
              borderColor,
              color: textColor,
              bgcolor: bgColor,
              letterSpacing: "0.2px"
            }}
          />
        );
      }
    },
    {
      id: "status",
      label: "Status",
      minWidth: 150,
      align: "center",
      render: (row) => <BOSStatusChip status={row.status} />
    },
    {
      id: 'createdUser', label: 'Created By', minWidth: 120, align: 'center',
      render: (row) => row.createdUser || ''
    },
    {
      id: 'createdAt', label: 'Created Date & Time', minWidth: 150, align: 'center',
      render: (row) => {
        if (!row.createdAt) return '';
        const d = new Date(row.createdAt);
        const date = d.toLocaleDateString('en-GB');
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{time}</Typography>
          </Box>
        );
      }
    },
    {
      id: 'verifiedBy', label: 'Verified By', minWidth: 120, align: 'center',
      render: (row) => row.verifiedBy || row.verified_by || '—'
    },
    {
      id: 'verifiedDate', label: 'Verified Date & Time', minWidth: 150, align: 'center',
      render: (row) => {
        const vDate = row.verifiedDate || row.verified_date || row.updatedAt;
        if (!vDate) return '—';
        const d = new Date(vDate);
        const date = d.toLocaleDateString('en-GB');
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{date}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{time}</Typography>
          </Box>
        );
      }
    }
  ], [employees]);

  const { user } = useAuth();
  const { myTeamEmployees = [], matchScope } = useBOSFilters(perms);
  const globalFilters = useSelector((state) => state.search?.filters || {});

  // Starred Filters config
  useEffect(() => {
    const isVerticalHead = myTeamEmployees && myTeamEmployees.length > 0;
    const scopeOptions = [{ value: 'Mine', label: 'Mine' }];
    if (perms?.manager || isVerticalHead) {
      scopeOptions.push({ value: 'Team', label: 'My Team' });
    }
    if (perms?.additional1) {
      scopeOptions.push({ value: 'Company', label: 'My Company' });
    }

    dispatch(setFilterConfig([
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
          { value: 'Pending to Verify', label: 'Pending for Verify' },
          { value: 'Verified', label: 'Verified' },
          { value: 'Rejected', label: 'Rejected' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      }
    ]));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, perms, myTeamEmployees]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Scope filter
      const scopeFilterVal = globalFilters.scope || 'Mine';
      if (!matchScope(scopeFilterVal, row.employeeId, row.employeeName)) return false;

      // Status filter
      const statusFilterVal = globalFilters.status || 'ALL';
      const rowStatus = row.status || 'Pending for Verify';
      if (statusFilterVal !== 'ALL') {
        if (statusFilterVal === 'Pending to Verify') {
          if (rowStatus !== 'Pending for Verify') return false;
        } else {
          if (rowStatus.toLowerCase() !== statusFilterVal.toLowerCase()) return false;
        }
      }
      return true;
    });
  }, [rows, globalFilters, matchScope]);

  const isVerticalHeadForRecord = useCallback((row) => {
    if (!row || !user) return false;
    
    // Admin override — userLevel >= 1 (Admin & SuperAdmin) can approve all records
    if ((user?.userLevel ?? 0) >= 1 || user?.username === 'admin' || user?.id === 'admin') {
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

    // 2. Direct property check on employee object
    const emp = employees.find(e => String(e.id) === empIdOfRecord) || row.employee || {};
    const vhId = String(emp.verticalHeadId || '');
    const vhCode = (emp.verticalHead || emp.verticalHeadName || '').toLowerCase().trim();

    if (vhId && vhId === loggedInEmpId) return true;
    if (vhCode && (vhCode === loggedInEmpCode || vhCode === loggedInName || vhCode.includes(loggedInEmpCode))) return true;

    return false;
  }, [user, myTeamEmployees, employees]);

  // Derived: selected employee object
  const selectedEmp = useMemo(() => {
    if (!selectedRow) return null;
    return employees.find(e => e.id === selectedRow.employeeId) || null;
  }, [selectedRow, employees]);

  const isPendingStatus = useMemo(() => {
    if (!selectedRow?.status) return false;
    const s = selectedRow.status.toLowerCase().trim();
    return s === 'pending for verify' || s === 'pending to verify' || s === 'pending';
  }, [selectedRow]);

  const isAlreadyVerified = selectedRow ? !isPendingStatus : false;
  // Show Verify/Reject buttons when: record is pending AND user has write or approval rights on this page.
  // The matchScope filter already ensures the user only sees records they're authorized to manage.
  const canApproveOdRecord = isPendingStatus && (perms.write || perms.approval);

  const attachedFiles = useMemo(() => {
    return parseFileString(selectedRow?.filePaths);
  }, [selectedRow]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <MainCard
      title={
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>On Duty Verification</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRows} color="primary" size="small" sx={{
              border: '2px solid', borderColor: 'divider', borderRadius: '8px', p: 1,
              transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.light', transform: 'scale(1.05)' }
            }}>
              <IconRefresh size={20} />
            </IconButton>
          </Tooltip>
          {perms.export && (
            <BOSExportButton data={filteredRows} filename="OD_VERIFY_Report" screenColumns={columns} />
          )}
        </Stack>
      }
    >
      <BOSTableToolbar
        columns={columns}
        showFilters
      />
      <BOSDataTable
        id="hra-od-verify-table"
        columns={columns}
        rows={filteredRows}
        loading={loading}
        onDoubleClickRow={handleOpenVerify}
      />

      {/* ── Main Verify Dialog ───────────────────────────────────────────────── */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title="On Duty Verification Details"
        hasId={false}
        maxWidth="lg"
        fullWidth
        contentSx={{ overflowY: 'auto', p: '16px !important' }}
        secondaryActions={
          canApproveOdRecord ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Button
                variant="contained"
                color="error"
                onClick={handleOpenReject}
                startIcon={<IconBan size={16} />}
                size="small"
                sx={{ px: 2, py: 0.6, fontWeight: 700, borderRadius: '8px' }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleVerify}
                startIcon={<IconCheck size={16} />}
                size="small"
                sx={{ px: 2, py: 0.6, fontWeight: 700, borderRadius: '8px' }}
              >
                Verify
              </Button>
            </Stack>
          ) : null
        }
      >
        {/* Two-column root layout: narrow left (profile) + wide right (all content) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 9fr' }, gap: 2, width: '100%' }}>

          {/* ── Left Column: Employee Profile Card only ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
            <Box sx={{
              border: '1.5px solid',
              borderColor: 'divider',
              borderRadius: '14px',
              bgcolor: isDark ? 'background.default' : 'grey.50',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <Avatar
                src={(selectedEmp?.employeePhotoUpload || selectedRow?.employee?.employeePhotoUpload) ? getPhotoUrl(selectedEmp?.employeePhotoUpload || selectedRow?.employee?.employeePhotoUpload) : null}
                alt={selectedRow?.employeeName}
                sx={{ width: 72, height: 72, border: '3px solid', borderColor: 'primary.main', boxShadow: 2 }}
              >
                {selectedRow?.employeeName?.charAt(0) || <IconUser size={36} />}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>
                  {selectedRow?.employeeName || '—'}
                </Typography>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                  Employee ID: {selectedEmp?.empCode || selectedEmp?.oldEmpCode || selectedRow?.employee?.empCode || selectedRow?.employee?.oldEmpCode || '—'}
                </Typography>
              </Box>
              <Divider sx={{ width: '100%' }} />
              <Box sx={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {selectedEmp?.department?.departmentName || selectedRow?.employee?.department?.departmentName || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Designation</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    {selectedEmp?.designation?.designationName || selectedRow?.employee?.designation?.designationName || '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── Right Column: Details + bottom row ── */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>

            {/* On Duty Details & Verification */}
            <BOSFormSection
              icon={<IconFileText size={20} color={theme.palette.primary.main} />}
              title={
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>On Duty Details &amp; Verification</span>
                  <BOSStatusChip status={selectedRow?.status || 'Pending for Verify'} showIcon={true} width={150} />
                </Stack>
              }
              sx={{ '& .MuiCardContent-root': { p: '12px !important' }, mb: 0 }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>On Duty Number</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.odNumber || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Visit Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.visitType || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Onduty From Date &amp; Time</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.odFromDateTime)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Onduty To Date &amp; Time</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDateTime(selectedRow?.odToDateTime)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Vehicle</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.vehicleType || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Distance (Km)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedRow?.distance != null ? `${parseFloat(selectedRow.distance).toFixed(2)} Km` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>From Location</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.fromLocation || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>To Location</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRow?.toLocation || '—'}</Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>Purpose of Duty</Typography>
                  <Typography variant="body2" sx={{
                    p: 1.2, borderRadius: '8px', border: '1px solid', borderColor: 'divider',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    wordBreak: 'break-word', fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 600
                  }}>
                    {selectedRow?.purposeOfOd || '—'}
                  </Typography>
                </Box>
              </Box>
            </BOSFormSection>

            {/* Rejection Remarks — visible only when rejected */}
            {isAlreadyVerified && selectedRow?.status === 'Rejected' && (
              <BOSFormSection title="Rejection Remarks" icon={<IconFileText size={20} color={theme.palette.error.main} />}>
                <Typography variant="body2" sx={{
                  p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'error.light',
                  bgcolor: isDark ? 'rgba(244,67,54,0.08)' : '#fff5f5',
                  color: isDark ? '#ef5350' : '#c62828',
                  wordBreak: 'break-word', fontSize: '0.875rem', lineHeight: 1.5, fontWeight: 600
                }}>
                  {selectedRow?.rejectionReason || selectedRow?.verifiedRemarks || '—'}
                </Typography>
              </BOSFormSection>
            )}

            {/* Bottom row: Supporting Documents (scrollable) + Verification Audit History side-by-side */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>

              {/* Supporting Documents — scrollable */}
              <BOSFormSection title={`Supporting Documents (${attachedFiles.length})`} icon={<IconPaperclip size={20} color={theme.palette.primary.main} />}>
                <Box sx={{ maxHeight: '190px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pr: 0.5 }}>
                  {attachedFiles.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 1, fontSize: '0.8rem' }}>
                      No supporting documents attached.
                    </Typography>
                  ) : (
                    attachedFiles.map((file, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        color="primary"
                        fullWidth
                        startIcon={<IconPaperclip size={14} />}
                        onClick={() => window.open(getPhotoUrl(file), '_blank')}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 0.6, fontSize: '0.8rem' }}
                      >
                        Document {idx + 1}
                      </Button>
                    ))
                  )}
                </Box>
              </BOSFormSection>

              {/* Verification Audit History */}
              <BOSFormSection title="Verification Audit History" icon={<IconHistory size={20} color={theme.palette.primary.main} />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Applied By</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{selectedRow?.createdUser || selectedRow?.createdBy || '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Applied Date &amp; Time</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{formatDateTime(selectedRow?.createdAt || selectedRow?.createdDate)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.25 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {isAlreadyVerified && selectedRow?.status === 'Rejected' ? 'Rejected By' : 'Verified By'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{selectedRow?.updatedUser || selectedRow?.verifiedBy || '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {isAlreadyVerified && selectedRow?.status === 'Rejected' ? 'Rejected Date & Time' : 'Verified Date & Time'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{formatDateTime(selectedRow?.updatedAt || selectedRow?.verifiedDate)}</Typography>
                  </Box>
                </Box>
              </BOSFormSection>

            </Box>
          </Box>

        </Box>
      </BOSFormDialog>

      {/* ── Rejection Remarks Dialog ─────────────────────────────────────────── */}
      <BOSFormDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        title="Reject On Duty Request"
        hasId={false}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1400 }}
        secondaryActions={
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setRejectDialogOpen(false)}
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
              disabled={!rejectRemarks.trim()}
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
            You are about to reject the On Duty request for <strong>{selectedRow?.employeeName}</strong> ({selectedRow?.odNumber}).
          </Typography>

          <BOSTextField
            name="rejectRemarks"
            label="Verification Remarks *"
            value={rejectRemarks}
            onChange={(e) => {
              setRejectRemarks(e.target.value);
              if (rejectRemarkError) setRejectRemarkError('');
            }}
            placeholder="Enter mandatory rejection reason..."
            multiline
            rows={3}
            fullWidth
            required
            error={!!rejectRemarkError}
            helperText={rejectRemarkError || 'Verification remarks are mandatory for rejection.'}
            autoFocus
          />
        </Box>
      </BOSFormDialog>

      <BOSFileGallery
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        files={attachmentFiles}
        title="Attached Supporting Documents"
      />

    </MainCard>
  );
}
