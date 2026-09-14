import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// material-ui
import { Paper, Typography, Chip, IconButton, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, InputAdornment, Box, Avatar, Tooltip, Autocomplete, CircularProgress, alpha, Slider } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
import Cropper from 'react-easy-crop';

// project imports
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import useAuth from 'hooks/useAuth';
import getCroppedImg from 'utils/cropImage';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { getUserImageUrl } from 'utils/upload-helper';
import useLookups from 'hooks/useLookups';
import { BOSDataTable, BOSStatusField, BOSExportButton } from 'ui-component/bos';
import { FaceRegistrationEngine, CameraManager, FaceDetectionService } from 'utils/face';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  IconPhoto,
  IconShieldLock,
  IconTrash,
  IconPencil,
  IconX,
  IconUserPlus,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconCrop,
  IconFaceId,
  IconEye,
  IconEyeOff, IconCheck, IconLockCog
} from '@tabler/icons-react';

// const API_BASE = (import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');

// ==============================|| ADMIN - USER CREDENTIALS ||============================== //

const UserOverview = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const perms = usePagePermissions(PAGE_CODES.AD_USER_CREDENTIALS);

  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [resetUser, setResetUser] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState(null);
  const { user: currentUser, updateProfile } = useAuth();
  const searchQuery = useSelector((state) => state.search.query);

  // Crop States
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imgCacheBust, setImgCacheBust] = useState(Date.now());
  // Local blob URL for immediate preview after crop (avoids auth issues with <img> src)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const prevPreviewUrlRef = useRef(null);

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [showFaceImage, setShowFaceImage] = useState(false);
  const [capturingPoses, setCapturingPoses] = useState(false);
  const [poseCount, setPoseCount] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraManagerRef = useRef(null);

  const engineRef = useRef(null);
  const [engineState, setEngineState] = useState(null);

  // Background model preloading for instant face camera startup
  useEffect(() => {
    FaceDetectionService.initialize().catch(err => console.warn('Model background preload notice:', err));
  }, []);

  const setFieldValueRef = useRef(null);

  const startCamera = () => {
    setShowFaceImage(false);
    setCameraActive(true);
  };

  useEffect(() => {
    let active = true;
    if (cameraActive) {
      const initCam = async () => {
        let videoEl = videoRef.current;
        let attempts = 0;
        while (!videoEl && attempts < 15 && active) {
          await new Promise(r => setTimeout(r, 50));
          videoEl = videoRef.current;
          attempts++;
        }

        if (!active) return;
        if (!videoEl) {
          dispatch(openSnackbar({ open: true, message: 'Could not access webcam element for face registration.', variant: 'alert', severity: 'error' }));
          setCameraActive(false);
          return;
        }

        try {
          if (!cameraManagerRef.current) {
            cameraManagerRef.current = new CameraManager({ width: 640, height: 480 });
          }
          await cameraManagerRef.current.start(videoEl);

          // Auto-start multi-pose face capture scan
          if (active && setFieldValueRef.current) {
            setTimeout(() => {
              if (active) {
                captureMultiplePoses(setFieldValueRef.current);
              }
            }, 300);
          }
        } catch (err) {
          if (!active) return;
          console.error("Error accessing camera for registration:", err);
          dispatch(openSnackbar({ open: true, message: typeof err === 'string' ? err : err?.message || 'Could not access webcam for face registration', variant: 'alert', severity: 'error' }));
          setCameraActive(false);
        }
      };
      initCam();
    }
    return () => {
      active = false;
    };
  }, [cameraActive, dispatch]);

  const stopCamera = () => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stop();
      cameraManagerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setCameraActive(false);
    setCapturingPoses(false);
    setEngineState(null);
  };

  const captureMultiplePoses = (setFieldValue) => {
    if (!videoRef.current) return;
    setCapturingPoses(true);

    engineRef.current = new FaceRegistrationEngine(
      videoRef.current,
      (state) => {
        // progress callback
        setEngineState(state);
      },
      async (result) => {
        const { embeddings, displayImage, qualityScore, frameCount, modelVersion } = result;

        try {
            const checkRes = await axios.post('/api/users/check-duplicate-face', {
                faceEmbeddings: JSON.stringify(embeddings),
                currentUserId: editData ? editData.userId : ''
            });

            if (checkRes.data && checkRes.data.isDuplicate) {
                dispatch(openSnackbar({
                  open: true,
                  message: `This face is already registered to User ID: ${checkRes.data.duplicateUserId}. Please clear it there first!`,
                  variant: 'alert',
                  severity: 'error'
                }));
                stopCamera();
                return; // Reject the capture
            }
        } catch (err) {
            console.warn("Duplicate face check failed, proceeding to backend save:", err);
        }

        // Pass JSON array of objects to the backend
        setFieldValue('faceImage', displayImage);
        setFieldValue('faceEmbeddings', JSON.stringify(embeddings));
        if (embeddings && embeddings.length > 0 && embeddings[0].descriptor) {
            setFieldValue('faceDescriptor', JSON.stringify(embeddings[0].descriptor));
        }
        setFieldValue('faceTemplateVersion', modelVersion || 'FACE_API_V1');
        setFieldValue('authMethod', 'BOTH');

        dispatch(openSnackbar({
          open: true,
          message: `Successfully captured ${frameCount} poses with avg quality ${qualityScore}%`,
          variant: 'alert',
          severity: 'success'
        }));

        stopCamera();
      },
      (err) => {
        // error callback
        console.error("Registration error:", err);
        dispatch(openSnackbar({ open: true, message: err?.message || 'Registration failed.', variant: 'alert', severity: 'error' }));
        stopCamera();
      }
    );

    engineRef.current.start();
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    return err?.message || err?.error || err?.detail || JSON.stringify(err) || 'An unexpected error occurred';
  };

  const [userMappingsMap, setUserMappingsMap] = useState({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, divisionsRes, mappingsRes] = await Promise.all([
        axios.get('/api/users/all'),
        axios.get('/api/admin/divisions'),
        axios.get('/api/users/all-mappings')
      ]);
      setDivisions(divisionsRes.data);
      setUsers(usersRes.data);
      setUserMappingsMap(mappingsRes.data || {});
    } catch (err) {
      console.error('Failed to fetch users:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err) || 'Failed to fetch users', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const { departments = [], designations = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS']);

  const getDeptName = useCallback((id) => {
    if (!id) return 'N/A';
    const found = departments.find((d) => String(d.id) === String(id));
    return found ? found.departmentName || found.name : 'N/A';
  }, [departments]);

  const getDesigName = useCallback((id) => {
    if (!id) return 'N/A';
    const found = designations.find((d) => String(d.id) === String(id));
    return found ? found.designationName || found.name : 'N/A';
  }, [designations]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/master/hr/employees/list', { params: { maxResult: 5000 } });
      const data = Array.isArray(response.data) ? response.data : response.data?.content || [];
      setEmployees(data);
      const map = {};
      data.forEach(emp => { map[emp.id] = emp; });
      setEmployeeMap(map);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const [divisions, setDivisions] = useState([]);
  const fetchDivisions = async () => {
    if (divisions.length > 0) return;
    try {
      const response = await axios.get('/api/admin/divisions');
      setDivisions(response.data);
    } catch (err) {
      console.error('Failed to fetch divisions:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const handleClickOpen = () => {
    setEditingUser(null);
    setOpen(true);
    fetchEmployees();
    fetchDivisions();
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setShowPassword(false);
    stopCamera();
  };

  const handleEdit = async (user) => {
    const mapping = userMappingsMap[user.userId];
    if (currentUser?.userLevel !== 5 && mapping?.userLevel === 5) {
      dispatch(openSnackbar({ open: true, message: 'Admins cannot modify Boss Admins', variant: 'alert', severity: 'warning' }));
      return;
    }
    setEditingUser({
      ...user,
      userLevel: mapping?.userLevel || 0,
      mappedDivisionIds: mapping?.mappedDivisionIds || []
    });
    setOpen(true);
    fetchEmployees();
    fetchDivisions();
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleDelete = async (id) => {
    const mapping = userMappingsMap[id];
    if (currentUser?.userLevel !== 5 && mapping?.userLevel === 5) {
      dispatch(openSnackbar({ open: true, message: 'Admins cannot delete Boss Admins', variant: 'alert', severity: 'warning' }));
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        dispatch(openSnackbar({ open: true, message: 'User deleted successfully', variant: 'alert', severity: 'success' }));
        fetchUsers();
      } catch (err) {
        console.error('Delete failed:', err);
        dispatch(openSnackbar({ open: true, message: getErrorMessage(err) || 'Delete failed', variant: 'alert', severity: 'error' }));
      }
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!resetUser) return;
    setResettingPassword(true);
    try {
      const res = await axios.post(`/api/users/${resetUser}/reset-password`);
      const tempPwd = res.data?.tempPassword;
      setGeneratedTempPassword(tempPwd || null);
      dispatch(openSnackbar({ open: true, message: `Password for ${resetUser} has been reset. Temporary password generated.`, variant: 'alert', severity: 'success' }));
    } catch (err) {
      console.error('Reset password failed:', err);
      dispatch(openSnackbar({ open: true, message: getErrorMessage(err) || 'Reset failed', variant: 'alert', severity: 'error' }));
      setResetUser(null);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleResetDialogClose = () => {
    if (resettingPassword) return;
    setResetUser(null);
    setGeneratedTempPassword(null);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setIsCropOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchQuery?.toLowerCase() || '';
      return (
        user.userId?.toLowerCase().includes(query) ||
        user.empId?.toString().includes(query) ||
        employeeMap[user.empId]?.employeeName?.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery, employeeMap]);

  // const paginatedUsers = useMemo(() => filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredUsers, page, rowsPerPage]);

  const divisionMap = useMemo(() => {
    const map = {};
    divisions.forEach(d => {
      map[d.id] = d;
      map[String(d.id)] = d;
      if (d.divisionCode) map[d.divisionCode] = d;
    });
    return map;
  }, [divisions]);

  const columns = useMemo(() => [
    { id: 'index', label: '#', align: 'center' },
    {
      id: 'userId',
      label: 'User Identity',
      align: 'left',
      exportValue: (row) => row.userId || '',
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-start" sx={{ pl: 1 }}>
          <Tooltip
            title={row.imgName ? (
              <Paper elevation={12} sx={{ p: 0.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                <img src={getUserImageUrl(row.imgName)} alt="Profile" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 4, display: 'block' }} />
              </Paper>
            ) : null}
            arrow
          >
            <Avatar
              src={row.imgName ? getUserImageUrl(row.imgName) : ''}
              sx={{ width: 36, height: 36, border: '1px solid #eee', bgcolor: 'primary.light', color: 'primary.dark', cursor: row.imgName ? 'pointer' : 'default' }}
            >
              {row.userId.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#2196f3', textTransform: 'uppercase', fontSize: '0.75rem', lineHeight: 1.2 }}>
              {row.userId}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.6rem' }}>
              CODE: {employeeMap[row.empId]?.empCode || row.empId || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      id: 'userName',
      label: 'User Name',
      align: 'left',
      exportValue: (row) => employeeMap[row.empId]?.employeeName || '—',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: employeeMap[row.empId]?.employeeName ? 'text.primary' : 'text.disabled', fontSize: '0.75rem', pl: 1 }}>
          {employeeMap[row.empId]?.employeeName || '—'}
        </Typography>
      )
    },
    {
      id: 'oldEmpCode',
      label: 'Employee Old Code',
      align: 'center',
      exportValue: (row) => employeeMap[row.empId]?.oldEmpCode || 'N/A',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
          {employeeMap[row.empId]?.oldEmpCode || 'N/A'}
        </Typography>
      )
    },
    {
      id: 'department',
      label: 'Department',
      align: 'center',
      exportValue: (row) => {
        const emp = employeeMap[row.empId];
        if (!emp) return 'N/A';
        return emp.departmentName || getDeptName(emp.departmentId);
      },
      render: (row) => {
        const emp = employeeMap[row.empId];
        const deptName = emp ? (emp.departmentName || getDeptName(emp.departmentId)) : 'N/A';
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
            {deptName}
          </Typography>
        );
      }
    },
    {
      id: 'designation',
      label: 'Designation',
      align: 'center',
      exportValue: (row) => {
        const emp = employeeMap[row.empId];
        if (!emp) return 'N/A';
        return emp.designationName || getDesigName(emp.designationId);
      },
      render: (row) => {
        const emp = employeeMap[row.empId];
        const desigName = emp ? (emp.designationName || getDesigName(emp.designationId)) : 'N/A';
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
            {desigName}
          </Typography>
        );
      }
    },
    {
      id: 'divisions',
      label: 'Division',
      align: 'center',
      exportValue: (row) => {
        const mapping = userMappingsMap[row.userId];
        if (!mapping) return 'N/A';
        if (mapping.userLevel === 5) return 'BOS Admin';
        if (mapping.userLevel === 1) return 'Admin User';
        const divIds = mapping.mappedDivisionIds || [];
        if (divIds.length === 0) return 'No divisions';
        return divIds.map((id) => divisionMap[id]?.divisionName || divisionMap[String(id)]?.divisionName || `Div ${id}`).join(', ');
      },
      render: (row) => {
        const mapping = userMappingsMap[row.userId];
        if (!mapping) return <Typography variant="caption" color="text.disabled">—</Typography>;
        if (mapping.userLevel === 5) return (
          <Chip label="BOS Admin" size="small" sx={{ bgcolor: '#ede7f6', color: '#673ab7', fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px' }} />
        );
        if (mapping.userLevel === 1) return (
          <Chip label="Admin User" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 800, fontSize: '0.65rem', borderRadius: '6px' }} />
        );
        const divIds = mapping.mappedDivisionIds || [];
        if (divIds.length === 0) return <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>No divisions</Typography>;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent="center">
            {divIds.slice(0, 3).map(id => (
              <Chip
                key={id}
                label={divisionMap[id]?.divisionName || `Div ${id}`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700, fontSize: '0.62rem', borderRadius: '6px', mb: 0.5 }}
              />
            ))}
            {divIds.length > 3 && (
              <Tooltip title={divIds.slice(3).map(id => divisionMap[id]?.divisionName || `Div ${id}`).join(', ')} arrow>
                <Chip label={`+${divIds.length - 3}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.62rem', borderRadius: '6px', mb: 0.5 }} />
              </Tooltip>
            )}
          </Stack>
        );
      }
    },
    {
      id: 'status',
      label: 'Account Status',
      align: 'center',
      exportValue: (row) => (row.status === 1 ? 'ACTIVE' : 'SUSPENDED'),
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          {row.status === 1 ? (
            <IconCircleCheckFilled size={18} color="#4caf50" />
          ) : (
            <IconCircleXFilled size={18} color="#f44336" />
          )}
          <Typography variant="caption" sx={{ fontWeight: 800, color: row.status === 1 ? '#4caf50' : '#f44336', fontSize: '0.7rem' }}>
            {row.status === 1 ? 'ACTIVE' : 'SUSPENDED'}
          </Typography>
        </Stack>
      )
    },
    {
      id: 'resetPassword',
      label: 'Reset Password',
      align: 'center',
      exportValue: () => null,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Tooltip title="Reset Password" arrow>
            <IconButton
              onClick={() => setResetUser(row.userId)}
              sx={{
                bgcolor: alpha('#ffb300', 0.1),
                color: '#ffb300',
                borderRadius: '6px',
                p: 0.5,
                '&:hover': { bgcolor: '#ffb300', color: 'white' },
                position: 'relative'
              }}
            >
              <IconLockCog size={20} stroke={2} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [employeeMap, userMappingsMap, divisionMap]);

  const actionColumn = useMemo(() => ({
    render: (row) => (
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <Tooltip title="Modify Account" arrow>
          <IconButton
            onClick={() => handleEdit(row)}
            sx={{
              bgcolor: alpha('#2196f3', 0.1),
              color: '#2196f3',
              borderRadius: '6px',
              p: 0.5,
              '&:hover': { bgcolor: '#2196f3', color: 'white' }
            }}
          >
            {perms.write ? <IconPencil size={18} /> : <Visibility size={18} />}
          </IconButton>
        </Tooltip>
        {perms.delete && (
          <Tooltip title="Revoke Access" arrow>
            <IconButton
              onClick={() => handleDelete(row.userId)}
              sx={{
                bgcolor: alpha('#f44336', 0.1),
                color: '#f44336',
                borderRadius: '6px',
                p: 0.5,
                '&:hover': { bgcolor: '#f44336', color: 'white' }
              }}
            >
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    )
  }), [perms, handleEdit, handleDelete]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 175px)', gap: 1, overflow: 'hidden' }}>
      {/* ── HEADER SECTION ── */}
      <Box sx={{
        bgcolor: 'background.paper',
        p: { xs: '12px 16px', sm: '10px 24px' },
        borderRadius: '12px',
        border: 1, borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1.5, sm: 2 },
        flexShrink: 0
      }}>
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2.5 }} alignItems="center">
          <Avatar
            sx={{
              width: { xs: 42, sm: 50 },
              height: { xs: 42, sm: 50 },
              bgcolor: 'background.default',
              color: '#673ab7',
              border: '1px solid #eee',
              flexShrink: 0
            }}
          >
            <IconShieldLock size={26} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>User Credentials</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', fontSize: '0.65rem' }}>SYSTEM ACCESS MANAGEMENT</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'flex-end', sm: 'flex-end' }}>
          <BOSExportButton
            data={filteredUsers}
            columns={columns}
            filename="User_Credentials_Report"
            reportTitle="User Credentials Management"
          />
          {perms.write && (
            <Button
              variant="contained"
              startIcon={<IconUserPlus size={18} />}
              onClick={handleClickOpen}
              sx={{
                height: 40,
                borderRadius: '8px',
                bgcolor: '#673ab7',
                '&:hover': { bgcolor: '#5e35b1' },
                px: { xs: 2, sm: 3 },
                fontWeight: 700,
                boxShadow: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              New User
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── TABLE SECTION ── */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        border: 1, borderColor: 'divider',
        bgcolor: 'background.paper',
        minHeight: 0
      }}>
        <BOSDataTable
          columns={columns}
          data={filteredUsers}
          page={page}
          size={rowsPerPage}
          totalCount={filteredUsers.length}
          onPageChange={setPage}
          onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
          showActions={true}
          actionColumn={actionColumn}
          loading={loading}
          onDoubleClickRow={handleEdit}
        />
      </Box>

      {/* ── RESET PASSWORD CONFIRMATION DIALOG ── */}
      <Dialog open={Boolean(resetUser)} onClose={handleResetDialogClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha('#ffb300', 0.1), color: '#ffb300', display: 'flex' }}>
            <IconLockCog size={24} stroke={2} />
          </Box>
          <Typography variant="h4" fontWeight={800}>Reset Password</Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 3, pt: '10px !important' }}>
          {generatedTempPassword ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Password for <strong style={{ color: '#2196f3' }}>{resetUser}</strong> has been reset successfully.
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                  Temporary Password — Share with user and ask them to change it immediately
                </Typography>
                <Typography variant="h3" sx={{ fontFamily: 'monospace', color: '#166534', letterSpacing: 2, userSelect: 'all' }}>
                  {generatedTempPassword}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1">
                Are you sure you want to reset the password for user <strong style={{ color: '#2196f3' }}>{resetUser}</strong>?
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, color: 'text.secondary' }}>
                A secure random temporary password will be generated. You will need to share it with the user.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {generatedTempPassword ? (
            <Button onClick={handleResetDialogClose} variant="contained" sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, fontWeight: 700, borderRadius: '8px' }}>Done</Button>
          ) : (
            <>
              <Button onClick={handleResetDialogClose} disabled={resettingPassword} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
              <Button
                onClick={handleResetPasswordConfirm}
                disabled={resettingPassword}
                variant="contained"
                sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' }, fontWeight: 700, borderRadius: '8px' }}
                startIcon={resettingPassword && <CircularProgress size={16} color="inherit" />}
              >
                {resettingPassword ? 'Resetting...' : 'Yes, Reset'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── MODAL DIALOG ── */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth scroll="paper" PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', maxHeight: '92vh' } }}>
        <Formik
          enableReinitialize={true}
          initialValues={{
            userId: editingUser?.userId || '',
            empId: editingUser?.empId || '',
            password: '', // Leave blank to avoid showing hash
            status: editingUser?.status ?? 1,
            imgName: editingUser?.imgName || '',
            userLevel: editingUser?.userLevel ?? 0,
            mappedDivisionIds: editingUser?.mappedDivisionIds || [],
            faceImage: editingUser?.faceImage || '',
            faceDescriptor: editingUser?.faceDescriptor || '',
            faceEmbeddings: editingUser?.faceEmbeddings || '',
            faceTemplateVersion: editingUser?.faceTemplateVersion || '',
            authMethod: editingUser?.authMethod || (editingUser?.faceDescriptor || editingUser?.faceEmbeddings ? 'BOTH' : 'PASSWORD'),
            autoLogoutOnFaceAbsence: editingUser?.autoLogoutOnFaceAbsence ?? 0,
            submit: null
          }}
          validationSchema={Yup.object().shape({
            userId: Yup.string().max(50).required('User ID is required'),
            empId: Yup.number().typeError('Employee ID must be a number').when('userLevel', {
              is: 5,
              then: (schema) => schema.nullable().notRequired(),
              otherwise: (schema) => schema.required('Employee ID is required')
            }),
            password: editingUser ? Yup.string().max(255) : Yup.string().max(255).required('Password is required'),
            status: Yup.number().required('Status is required')
          })}
          onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
            try {
              let savedUserId = values.userId;
              if (editingUser) {
                await axios.put(`/api/users/update/${editingUser.userId}`, {
                  empId: values.empId ? Number(values.empId) : null,
                  password: values.password,
                  status: Number(values.status),
                  imgName: values.imgName,
                  faceImage: values.faceImage,
                  faceDescriptor: values.faceDescriptor,
                  faceEmbeddings: values.faceEmbeddings,
                  faceTemplateVersion: values.faceTemplateVersion,
                  authMethod: values.authMethod,
                  autoLogoutOnFaceAbsence: Number(values.autoLogoutOnFaceAbsence)
                });
              } else {
                await axios.post('/api/users/create', {
                  userId: values.userId,
                  empId: values.empId ? Number(values.empId) : null,
                  password: values.password,
                  status: Number(values.status),
                  imgName: values.imgName,
                  faceImage: values.faceImage,
                  faceDescriptor: values.faceDescriptor,
                  faceEmbeddings: values.faceEmbeddings,
                  faceTemplateVersion: values.faceTemplateVersion,
                  authMethod: values.authMethod,
                  autoLogoutOnFaceAbsence: Number(values.autoLogoutOnFaceAbsence)
                });
              }

              await axios.post(`/api/users/${savedUserId}/mappings`, {
                mappedDivisionIds: values.mappedDivisionIds,
                userLevel: values.userLevel
              });

              if (editingUser?.userId === currentUser?.id || values.userId === currentUser?.id) {
                updateProfile({
                  imgName: values.imgName,
                  autoLogoutOnFaceAbsence: Number(values.autoLogoutOnFaceAbsence)
                });
              }
              dispatch(openSnackbar({ open: true, message: `User ${editingUser ? 'updated' : 'created'} successfully`, variant: 'alert', severity: 'success' }));
              setOpen(false);
              await fetchUsers();
            } catch (err) {
              console.error('Save failed:', err);
              setErrors({ submit: getErrorMessage(err) });
              setSubmitting(false);
            }
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => {
            setFieldValueRef.current = setFieldValue;
            return (
            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <DialogTitle sx={{ p: 0, background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)` }}>
                <Box sx={{ p: 1.5, px: 2.5, color: 'white', position: 'relative' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight={800} color="inherit" sx={{ mb: 0.2, textTransform: 'uppercase' }}>
                        {editingUser ? 'Edit User Credential' : 'New User Account'}
                      </Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ opacity: 0.85 }}>
                        <IconShieldLock size={15} />
                        <Typography variant="caption" fontWeight={500}>{editingUser ? `Updating access for ${editingUser.userId}` : 'Configure credentials for a new system user'}</Typography>
                      </Stack>
                    </Box>
                    <IconButton onClick={handleClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                      <IconX size={18} />
                    </IconButton>
                  </Stack>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ p: 0, bgcolor: 'background.default', position: 'relative' }}>
                <Box sx={{ bgcolor: 'background.paper', mt: -0.5, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', position: 'relative', zIndex: 2, overflowY: 'auto', overflowX: 'hidden', maxHeight: 'calc(94vh - 120px)' }}>
                  <Grid container spacing={0} sx={{ width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                    <Grid item xs={12} md={3.5} sx={{ width: { xs: '100%', md: '28%' }, p: 2, borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
                      <Box sx={{ p: 2, width: '100%', height: '100%', borderRadius: 4, bgcolor: 'background.paper', border: '2px dashed', borderColor: 'secondary.light', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="secondary.main" sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>PROFILE IDENTITY</Typography>
                        <Box sx={{ position: 'relative' }}>
                          <Tooltip
                            title={values.imgName ? (
                              <Paper elevation={12} sx={{ p: 0.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                                <img src={getUserImageUrl(values.imgName)} alt="Preview" style={{ maxWidth: 280, maxHeight: 280, borderRadius: 4, display: 'block' }} />
                              </Paper>
                            ) : null}
                            arrow
                            placement="right"
                          >
                            <Avatar
                              src={
                                profilePreviewUrl
                                  ? profilePreviewUrl
                                  : values.imgName
                                    ? `${getUserImageUrl(values.imgName)}&t=${imgCacheBust}`
                                    : ''
                              }
                              sx={{ width: 200, height: 200, border: '4px solid white', bgcolor: 'secondary.light', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', cursor: (profilePreviewUrl || values.imgName) ? 'pointer' : 'default' }}
                            >
                              <IconPhoto size={36} />
                            </Avatar>
                          </Tooltip>
                          <IconButton component="label" sx={{ position: 'absolute', bottom: 2, right: 2, bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' }, width: 30, height: 30, border: '2px solid white' }}>
                            <IconPencil size={13} />
                            <input type="file" hidden accept="image/*" onChange={(e) => { handleFileSelect(e); e.target.value = ''; }} />
                          </IconButton>
                        </Box>
                        <Typography variant="h4" fontWeight={800} color="secondary.main" sx={{ textAlign: 'center', wordBreak: 'break-all' }}>{values.userId || 'User Name'}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={8.5} sx={{ width: { xs: '100%', md: '72%' }, p: 2, pr: 2.5 }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.2 }}>Account Credentials</Typography>
                        </Box>
                        <Stack spacing={1.5}>
                          <Autocomplete
                            options={employees}
                            getOptionLabel={(option) => `${option.employeeName} (${option.empCode})`}
                            value={employees.find((e) => e.id === values.empId) || null}
                            onChange={async (e, v) => {
                              setFieldValue('empId', v ? v.id : '');
                              if (v && v.employeePhotoUpload) {
                                setFieldValue('imgName', v.employeePhotoUpload);
                                try {
                                  const fileUrl = getUserImageUrl(v.employeePhotoUpload);
                                  const response = await axios.get(fileUrl, { responseType: 'blob' });
                                  const formData = new FormData();
                                  formData.append('file', response.data, v.employeePhotoUpload.split('/').pop() || 'profile.jpg');
                                  const res = await axios.post('/api/users/upload-profile-pic', formData);
                                  setFieldValue('imgName', res.data.fileName);
                                } catch (err) {
                                  console.error('Failed to copy image from employee master:', err);
                                }
                              }
                            }}
                            renderInput={(params) => <TextField {...params} label="Employee Selection" error={Boolean(touched.empId && errors.empId)} helperText={touched.empId && errors.empId} />}
                          />
                          <Grid container spacing={1.5} sx={{ width: '100%' }}>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '48%' } }}>
                              <TextField fullWidth label="User ID" name="userId" value={values.userId}
                                onChange={handleChange} onBlur={handleBlur} disabled={Boolean(editingUser)}
                                error={Boolean(touched.userId && errors.userId)}
                                helperText={touched.userId && errors.userId} />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '48%' } }}>
                              <TextField fullWidth label={editingUser ? 'Update Password' : 'Password'}
                                name="password" placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                                type={showPassword ? 'text' : 'password'} value={values.password} onChange={handleChange}
                                onBlur={handleBlur} error={Boolean(touched.password && errors.password)}
                                helperText={(touched.password && errors.password) || (editingUser ? 'Leave blank to keep existing credentials' : '')}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">
                                    <IconButton onClick={handleClickShowPassword}>{showPassword ? <Visibility /> : <VisibilityOff />}</IconButton></InputAdornment>
                                }}
                                autoComplete="new-password" />
                            </Grid>
                          </Grid>

                          <Grid container spacing={1.5} sx={{ width: '100%' }}>
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '23%' }, display: 'flex', alignItems: 'center' }}>
                              <BOSStatusField
                                isCreate={!editingUser}
                                type="number"
                                name="status"
                                label="Account Status"
                                value={values.status}
                                onChange={handleChange}
                                disabled={!perms.write}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '23%' } }}>
                              <TextField select fullWidth label="User Access Level" name="userLevel" value={values.userLevel} onChange={handleChange} onBlur={handleBlur}>
                                <MenuItem value={0}>Normal User (0)</MenuItem>
                                <MenuItem value={1}>Admin User (1)</MenuItem>
                                {(currentUser?.userLevel === 5 || values.userLevel === 5) && (
                                  <MenuItem value={5}>Boss Admin (5)</MenuItem>
                                )}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '23%' } }}>
                              <TextField select fullWidth label="Preferred Login Method" name="authMethod" value={values.authMethod || 'PASSWORD'} onChange={handleChange} onBlur={handleBlur}>
                                <MenuItem value="PASSWORD">Password Only</MenuItem>
                                <MenuItem value="FACE">Face ID Only</MenuItem>
                                <MenuItem value="BOTH">Password or Face ID</MenuItem>
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', md: '23%' } }}>
                              <TextField select fullWidth label="Auto-Logout on Absence" name="autoLogoutOnFaceAbsence" value={values.autoLogoutOnFaceAbsence ?? 0} onChange={handleChange} onBlur={handleBlur}>
                                <MenuItem value={1}>ENABLED</MenuItem>
                                <MenuItem value={0}>DISABLED</MenuItem>
                              </TextField>
                            </Grid>
                          </Grid>

                          <Box sx={{ pt: 1, borderTop: '1px solid #eef2f6' }}>
                            <Typography variant="subtitle2" fontWeight={800} color="secondary.main" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                              Organization & Division Authorization
                            </Typography>
                            <Stack spacing={1.5}>
                              <Autocomplete
                                multiple
                                options={divisions}
                                getOptionLabel={(option) => `${option.divisionName} (ID: ${option.id})`}
                                value={divisions.filter(d => values.mappedDivisionIds.includes(d.id))}
                                onChange={(e, newValue) => {
                                  setFieldValue('mappedDivisionIds', newValue.map(item => item.id));
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Authorized Divisions"
                                    placeholder="Select divisions"
                                  />
                                )}
                                renderTags={(value, getTagProps) =>
                                  value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return (
                                      <Chip
                                        key={key}
                                        variant="outlined"
                                        label={`${option.divisionName}`}
                                        {...tagProps}
                                        color="secondary"
                                        sx={{ borderRadius: '8px', fontWeight: 700 }}
                                      />
                                    );
                                  })
                                }
                              />
                            </Stack>
                          </Box>

                          <Box sx={{ mt: 1, p: 1.5, borderRadius: '12px', bgcolor: 'background.paper', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#673ab7', mb: 1, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                              FACE DETECTION & VERIFICATION
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ flexShrink: 0 }}>
                                {cameraActive ? (
                                  <Box sx={{ position: 'relative', width: 150, height: 150, borderRadius: '12px', overflow: 'hidden', border: '2px solid #673ab7', bgcolor: '#000' }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                  </Box>
                                ) : values.faceImage ? (
                                  <Box sx={{ position: 'relative', width: 150, height: 150, borderRadius: '12px', overflow: 'hidden', border: '2px solid #10b981', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {showFaceImage ? (
                                      <img src={values.faceImage} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <IconFaceId size={54} color="#10b981" stroke={2} />
                                    )}
                                    <Box sx={{ position: 'absolute', bottom: -3, right: -3, bgcolor: '#10b981', borderRadius: '50%', p: 0.3, display: 'flex', color: '#fff', border: '2px solid #fff' }}>
                                      <IconCheck size={14} stroke={3} />
                                    </Box>
                                    <IconButton
                                      onClick={() => setShowFaceImage(!showFaceImage)}
                                      sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', p: 0.3, color: '#64748b', '&:hover': { bgcolor: 'background.default' }, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    >
                                      {showFaceImage ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Box sx={{ width: 150, height: 150, borderRadius: '12px', border: '2px solid #cbd5e1', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconFaceId size={48} color="#94a3b8" stroke={1.5} />
                                  </Box>
                                )}
                              </Box>

                              <Box sx={{ flex: 1, minWidth: 220 }}>
                                <Typography sx={{ color: '#334155', fontSize: '0.7rem', mb: 1 }}>
                                  {values.faceImage
                                    ? 'Face biometric registered. You can use Face ID to sign in.'
                                    : 'No face registered yet. Turn on the camera to scan and register.'}
                                </Typography>

                                {capturingPoses && engineState && (
                                  <Box sx={{ mb: 1, p: 1, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: engineState.status === 'error' ? 'error.main' : engineState.status === 'low_quality' || engineState.status === 'wrong_pose' ? 'warning.main' : 'success.main' }}>
                                    <Typography variant="caption" fontWeight={800} color={engineState.status === 'error' ? 'error' : 'textPrimary'} display="block">
                                      {engineState.message}
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>Quality: {engineState.qualityScore}%</Typography>
                                    <Box sx={{ mt: 0.5, height: 3, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                                      <Box sx={{ height: '100%', width: `${engineState.progress}%`, bgcolor: 'secondary.main', transition: 'width 0.3s' }} />
                                    </Box>
                                  </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                  {cameraActive ? (
                                    <>
                                      <Button size="small" variant="contained" color="success" onClick={() => captureMultiplePoses(setFieldValue)} disabled={capturingPoses} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, boxShadow: 'none', py: 0.5 }}>
                                        {capturingPoses ? 'Capturing...' : 'Start Multi-Pose Capture'}
                                      </Button>
                                      <Button size="small" variant="contained" color="error" onClick={stopCamera} disabled={capturingPoses} sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, boxShadow: 'none', py: 0.5 }}>
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="small" variant="contained" onClick={() => startCamera()} sx={{
                                        borderRadius: '6px', textTransform: 'none', fontWeight: 600, py: 0.5,
                                        bgcolor: '#673ab7', color: '#fff',
                                        boxShadow: 'none',
                                        '&:hover': { bgcolor: '#5e35b1', boxShadow: 'none' }
                                      }}>
                                        {values.faceImage ? 'Re-Register Face' : 'Register Face'}
                                      </Button>
                                      {values.faceImage && (
                                        <Button size="small" variant="text" color="error" onClick={() => { setFieldValue('faceImage', ''); setFieldValue('faceDescriptor', ''); setFieldValue('faceEmbeddings', ''); setFieldValue('authMethod', 'PASSWORD'); setShowFaceImage(false); }} sx={{ textTransform: 'none', fontWeight: 600, py: 0.5 }}>
                                          Clear
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>

                        </Stack>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                {/* ── CROP DIALOG (Nested inside Content but managed via separate Dialog is better) ── */}
                <Dialog
                  open={isCropOpen}
                  onClose={() => setIsCropOpen(false)}
                  maxWidth="sm"
                  fullWidth
                  PaperProps={{ sx: { borderRadius: '20px', p: 0, overflow: 'hidden' } }}
                >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #eee' }}>
                    <Typography variant="h4" fontWeight={800}>Crop Profile Picture</Typography>
                    <IconButton onClick={() => setIsCropOpen(false)}><IconX size={20} /></IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ p: 0, height: 320, position: 'relative', bgcolor: '#000' }}>
                    {imageToCrop && (
                      <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    )}
                  </DialogContent>
                  <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ width: '100%', px: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" fontWeight={700}>ZOOM</Typography>
                        <Slider
                          value={zoom}
                          min={1}
                          max={3}
                          step={0.1}
                          onChange={(e, v) => setZoom(v)}
                          sx={{ color: 'secondary.main' }}
                        />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Button fullWidth variant="outlined" color="inherit" onClick={() => setIsCropOpen(false)} sx={{ borderRadius: '10px', fontWeight: 700 }}>Cancel</Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        disabled={isUploading}
                        startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <IconCrop size={18} />}
                        sx={{ borderRadius: '10px', fontWeight: 700 }}
                        onClick={async () => {
                          setIsUploading(true);
                          try {
                            const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

                            // 1. Immediately show preview using a local blob URL — no auth required
                            if (prevPreviewUrlRef.current) {
                              URL.revokeObjectURL(prevPreviewUrlRef.current);
                            }
                            const localPreview = URL.createObjectURL(croppedBlob);
                            prevPreviewUrlRef.current = localPreview;
                            setProfilePreviewUrl(localPreview);

                            // 2. Upload to server in background to persist the filename
                            const formData = new FormData();
                            formData.append('file', croppedBlob, 'profile.jpg');
                            const res = await axios.post('/api/users/upload-profile-pic', formData);
                            setFieldValue('imgName', res.data.fileName);
                            setImgCacheBust(Date.now());
                            setIsCropOpen(false);
                            dispatch(openSnackbar({ open: true, message: 'Profile picture updated', variant: 'alert', severity: 'success' }));
                          } catch (err) {
                            console.error('Crop failed', err);
                            setProfilePreviewUrl(null);
                            dispatch(openSnackbar({ open: true, message: 'Upload failed: ' + (err.response?.data || err.message), variant: 'alert', severity: 'error' }));
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      >
                        {isUploading ? 'Uploading...' : 'Apply Crop'}
                      </Button>
                    </Stack>
                  </DialogActions>
                </Dialog>
              </DialogContent>
              <DialogActions sx={{ px: 1, py: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleClose}
                  sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}
                >
                  Cancel
                </Button>
                {perms.write && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    disabled={isSubmitting}
                    sx={{
                      fontWeight: 800,
                      px: 3.5,
                      borderRadius: '8px',
                      boxShadow: theme.customShadows?.secondary || 'none'
                    }}
                  >
                    {isSubmitting ? 'Saving...' : editingUser ? 'Save' : 'Create'}
                  </Button>
                )}
              </DialogActions>
            </form>
          ); }}
        </Formik>
      </Dialog >
    </Box >
  );
};

export default UserOverview;
