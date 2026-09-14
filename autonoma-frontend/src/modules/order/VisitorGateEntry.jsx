import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Divider,
  Avatar,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  IconDoorEnter,
  IconDoorExit,
  IconCheck,
  IconUserCheck,
  IconPhone,
  IconBuilding,
  IconFileText,
  IconQrcode,
  IconCamera,
  IconCameraOff,
  IconX,
  IconScan,
  IconAlertTriangle,
  IconCameraRotate,
  IconInfoCircle
} from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { getFileViewUrl } from 'utils/upload-helper';
import MainCard from 'ui-component/cards/MainCard';
import VisitorCheckInDialog from './VisitorCheckInDialog';
import VisitorCheckOutDialog from './VisitorCheckOutDialog';

const VisitorGateEntry = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [searchNo, setSearchNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [passData, setPassData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);

  // QR Camera Scanner & Permission States
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [cameraErrorDetails, setCameraErrorDetails] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // Default to rear/back camera
  const html5QrcodeRef = useRef(null);

  // Detect if site is accessed over HTTP on local IP
  const isHttpIpAccess = typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  // Dynamic QR Code & String Extractor (extracts whatever number is between "Gate Pass No :" and "Gate Pass Date")
  const extractGatePassNo = (text) => {
    if (!text) return '';
    let str = text.trim();

    // 1) If selecting from Autocomplete formatted label: "26-27/VP-000667 - Visitor Name"
    if (str.includes(' - ')) {
      str = str.split(' - ')[0].trim();
    }

    // 2) Dynamic extraction: Extract whatever text/number is BETWEEN "Gate Pass No :" and "Gate Pass Date" (or next key)
    const matchBetween = str.match(/Gate\s*Pass\s*(?:No|Number|#)?\s*:\s*(.*?)(?=\s*Gate\s*Pass\s*Date|\s*Visitor|\s*Address|\s*Food|\s*Kit|\s*To\s*Meet|\s*Purpose|\s*In\s*Time|\r|\n|$)/i);
    if (matchBetween && matchBetween[1] && matchBetween[1].trim()) {
      return matchBetween[1].trim();
    }

    // 3) Fallback line by line colon match if formatted differently
    const matchPassNo = str.match(/Gate\s*Pass\s*(?:No|Number|#)?\s*:\s*([^\s]+)/i);
    if (matchPassNo && matchPassNo[1]) {
      return matchPassNo[1].trim();
    }

    // 4) URL format: ...?gatePassNo=26-27/VP-000667
    if (str.includes('gatePassNo=')) {
      try {
        const urlObj = new URL(str);
        const val = urlObj.searchParams.get('gatePassNo');
        if (val) return val.trim();
      } catch {
        const m = str.match(/gatePassNo=([^&]+)/i);
        if (m && m[1]) return m[1].trim();
      }
    }

    // 5) JSON format: {"gatePassNo":"26-27/VP-000667"}
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const obj = JSON.parse(str);
        if (obj.gatePassNo) return String(obj.gatePassNo).trim();
        if (obj.passNo) return String(obj.passNo).trim();
      } catch { }
    }

    return str;
  };

  // Date Helper — Check if visitor date is TODAY (date matching only, ignores time component)
  const isTodayDate = (dateVal) => {
    if (!dateVal) return true;
    try {
      const today = new Date();
      const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

      let passStr = '';
      if (typeof dateVal === 'string') {
        const str = dateVal.trim();
        if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
          passStr = str.substring(0, 10);
        } else if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const parts = str.split('T')[0].split('-');
          passStr = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        } else {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            passStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
          }
        }
      } else if (dateVal instanceof Date) {
        passStr = `${String(dateVal.getDate()).padStart(2, '0')}/${String(dateVal.getMonth() + 1).padStart(2, '0')}/${dateVal.getFullYear()}`;
      }

      // Fallback using formatDate
      if (!passStr && formatDate) {
        passStr = formatDate(dateVal);
      }

      return !passStr || passStr === todayStr;
    } catch {
      return true;
    }
  };

  // Status Helper — Get clean status label dynamically (from AD_STATUS_MASTER or pass object)
  const formatStatusText = (statusVal, passObj) => {
    if (passObj && passObj.statusName) {
      return String(passObj.statusName).trim().toUpperCase();
    }
    if (passObj && passObj.status && typeof passObj.status === 'object' && passObj.status.name) {
      return String(passObj.status.name).trim().toUpperCase();
    }
    if (statusVal === null || statusVal === undefined) return '';
    return String(statusVal).trim().toUpperCase();
  };

  const isValidPassStatus = (statusVal, passObj) => {
    const s = formatStatusText(statusVal, passObj);
    const invalidStatuses = ['CLOSED', 'AUTO CLOSED', 'CHECKED-OUT', 'CHECKED_OUT', 'CANCELLED', 'REJECTED'];
    return !invalidStatuses.includes(s);
  };

  // Auto Fetch Gate Pass when searchNo changes (debounce 450ms)
  useEffect(() => {
    const rawNo = searchNo ? searchNo.trim() : '';
    if (!rawNo || rawNo.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchingSuggestions(true);
    const timer = setTimeout(() => {
      axios.get(`/api/order/visitor-gate-pass/suggestions?q=${encodeURIComponent(rawNo)}`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setSuggestions(res.data);
          }
        })
        .catch(() => { })
        .finally(() => setSearchingSuggestions(false));

      if (rawNo.length >= 6) {
        executeFetchPass(rawNo);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchNo]);

  // Execute Pass Lookup & Strict Validations
  const executeFetchPass = (targetPassNo) => {
    const rawInput = targetPassNo || searchNo;
    const queryNo = extractGatePassNo(rawInput);
    if (!queryNo) {
      setErrorMsg('Please enter or scan a valid Gate Pass Number');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    axios.get(`/api/order/visitor-gate-pass/by-no?gatePassNo=${encodeURIComponent(queryNo.trim())}`)
      .then(res => {
        if (res.data && res.data.id) {
          const data = res.data;
          const vDate = data.visitorDate || data.gatePassDate || (data.createdDate ? data.createdDate.split('T')[0] : null);
          const status = formatStatusText(data.status, data);

          // Validation 2: Status check (pass must be active OPEN or CHECKED-IN)
          if (!isValidPassStatus(data.status, data)) {
            setPassData(null);
            setErrorMsg(`Visitor Pass '${queryNo}' Status: ${status}`);
            return;
          }

          // Validation 1: Visitor Date must be TODAY (date strings matching)
          const passDateStr = formatDate(vDate);
          const todayStr = formatDate(new Date());
          if (vDate && passDateStr !== '-' && passDateStr !== todayStr) {
            setPassData(null);
            setErrorMsg(`Visitor Pass Date (${passDateStr}) does not match today's date (${todayStr}).`);
            return;
          }

          // All validations passed!
          setPassData(data);
          setSuggestions([]);
          setErrorMsg('');
        } else {
          setPassData(null);
          setErrorMsg(`No Gate Pass found with number: ${queryNo}`);
        }
      })
      .catch(err => {
        setPassData(null);
        setErrorMsg(err.response?.data?.message || `No Gate Pass found with number: ${queryNo}`);
      })
      .finally(() => setLoading(false));
  };

  // Stop current QR camera scanner instance safely
  const stopQrScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error('Error stopping QR scanner:', e);
      }
      html5QrcodeRef.current = null;
    }
  };

  const handleOpenQrDialog = () => {
    setCameraPermissionError(false);
    setErrorMsg('');
    setQrDialogOpen(true);
  };

  const handleCloseQrDialog = async () => {
    await stopQrScanner();
    setQrDialogOpen(false);
  };

  // Fetch all available cameras when Dialog opens
  useEffect(() => {
    if (!qrDialogOpen) return;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          const backCam = devices.find(d =>
            /back|rear|environment|main|facing back|0/i.test(d.label)
          );
          if (backCam) {
            setActiveCameraId(backCam.id);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras:', err);
      });
  }, [qrDialogOpen]);

  // Start Camera Stream cleanly
  useEffect(() => {
    if (!qrDialogOpen) return;

    const qrRegionId = 'qr-reader-container';
    let isSubscribed = true;

    const startScanner = async () => {
      try {
        await stopQrScanner();
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!isSubscribed) return;

        const html5Qrcode = new Html5Qrcode(qrRegionId, {
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        html5QrcodeRef.current = html5Qrcode;

        let cameraConfig = activeCameraId
          ? { deviceId: activeCameraId }
          : { facingMode: facingMode };

        await html5Qrcode.start(
          cameraConfig,
          {
            fps: 15
          },
          (decodedText) => {
            if (decodedText && isSubscribed) {
              const passNo = extractGatePassNo(decodedText);
              setSearchNo(passNo);
              handleCloseQrDialog();
              executeFetchPass(passNo);
            }
          },
          () => { }
        );

        // Force mobile Chrome video element to playsinline and play
        setTimeout(() => {
          const container = document.getElementById(qrRegionId);
          if (container) {
            const videoEl = container.querySelector('video');
            if (videoEl) {
              videoEl.setAttribute('playsinline', 'true');
              videoEl.setAttribute('autoplay', 'true');
              videoEl.setAttribute('muted', 'true');
              videoEl.play().catch(() => { });
            }
          }
        }, 350);

      } catch (err) {
        console.error('Failed to start camera with config:', err);
        const errStr = String(err?.name || err?.message || err).toLowerCase();

        if (errStr.includes('notallowed') || errStr.includes('permission')) {
          if (isSubscribed) {
            setCameraErrorDetails('Camera permission was blocked by browser. Please allow camera access in address bar.');
            setCameraPermissionError(true);
            handleCloseQrDialog();
          }
          return;
        }

        // Retry once with basic facingMode
        try {
          if (!isSubscribed) return;
          await new Promise((r) => setTimeout(r, 400));
          const html5Qrcode = new Html5Qrcode(qrRegionId, {
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          });
          html5QrcodeRef.current = html5Qrcode;
          await html5Qrcode.start(
            { facingMode: facingMode },
            { fps: 15 },
            (decodedText) => {
              if (decodedText && isSubscribed) {
                const passNo = extractGatePassNo(decodedText);
                setSearchNo(passNo);
                handleCloseQrDialog();
                executeFetchPass(passNo);
              }
            },
            () => { }
          );
        } catch (fallbackErr) {
          console.error('Fallback camera start failed:', fallbackErr);
        }
      }
    };

    startScanner();

    return () => {
      isSubscribed = false;
      stopQrScanner();
    };
  }, [qrDialogOpen, activeCameraId, facingMode]);

  // Switch Camera toggle
  const handleSwitchCamera = () => {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacingMode);

    if (availableCameras && availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex(c => c.id === activeCameraId);
      let nextIndex = (currentIndex + 1) % availableCameras.length;
      if (currentIndex === -1) {
        const targetCamIdx = availableCameras.findIndex(c => {
          const l = (c.label || '').toLowerCase();
          return nextFacingMode === 'user'
            ? (l.includes('front') || l.includes('user') || l.includes('selfie') || l.includes('1'))
            : (l.includes('back') || l.includes('rear') || l.includes('environment') || l.includes('0'));
        });
        if (targetCamIdx !== -1) nextIndex = targetCamIdx;
      }
      setActiveCameraId(availableCameras[nextIndex].id);
    } else {
      setActiveCameraId('');
    }
  };

  const handleCheckIn = () => {
    if (!passData || !passData.id) return;
    setCheckInDialogOpen(true);
  };

  const confirmCheckIn = async ({ image, inTime }) => {
    setCheckInDialogOpen(false);
    if (!passData || !passData.id) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = new Date();
      const formattedInTime = inTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let uploadedImgPath = image;
      if (image && image.startsWith('data:image')) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], `visitor_checkin_${passData.id}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post('/api/files/upload?module=VISITOR_GATE_PASS', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data) {
          uploadedImgPath = typeof uploadRes.data === 'string' ? uploadRes.data : (uploadRes.data.filePath || uploadRes.data.path || '');
        }
      }

      const res = await axios.post(`/api/order/visitor-gate-pass/${passData.id}/check-in`, {
        checkInBy: user?.userName || user?.name || user?.userId || 'Gate Security',
        checkInImg: uploadedImgPath,
        checkInTime: formattedInTime
      });

      const visitorName = res.data?.visitorName || passData.visitorName;
      const checkInTimeStr = formatTime(res.data?.checkInTime);
      setSuccessMsg(`SUCCESS: Visitor '${visitorName}' Checked In at ${checkInTimeStr}`);

      // Auto-clear visitor details and search input
      setPassData(null);
      setSearchNo('');
      setSuggestions([]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to process Check-In. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = () => {
    if (!passData || !passData.id) return;
    setCheckOutDialogOpen(true);
  };

  const confirmCheckOut = async ({ image, outTime }) => {
    setCheckOutDialogOpen(false);
    if (!passData || !passData.id) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const now = new Date();
      const formattedOutTime = outTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      let uploadedImgPath = image;
      if (image && image.startsWith('data:image')) {
        const res = await fetch(image);
        const blob = await res.blob();
        const file = new File([blob], `visitor_checkout_${passData.id}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await axios.post('/api/files/upload?module=VISITOR_GATE_PASS', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data) {
          uploadedImgPath = typeof uploadRes.data === 'string' ? uploadRes.data : (uploadRes.data.filePath || uploadRes.data.path || '');
        }
      }

      const res = await axios.post(`/api/order/visitor-gate-pass/${passData.id}/check-out`, {
        checkOutBy: user?.userName || user?.name || user?.userId || 'Gate Security',
        checkOutImg: uploadedImgPath,
        checkOutTime: formattedOutTime
      });

      const visitorName = res.data?.visitorName || passData.visitorName;
      const checkOutTimeStr = formatTime(res.data?.checkOutTime);
      setSuccessMsg(`SUCCESS: Visitor '${visitorName}' Checked Out at ${checkOutTimeStr}`);

      // Auto-clear visitor details and search input
      setPassData(null);
      setSearchNo('');
      setSuggestions([]);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to process Check-Out. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const s = formatStatusText(status);
    if (s === 'CHECKED-IN' || s === 'CHECKED_IN') {
      return <Chip icon={<IconDoorEnter size={16} />} label="CHECKED IN" sx={{ fontWeight: 'bold', fontSize: '0.85rem', bgcolor: '#E3F2FD', color: '#1565C0' }} />;
    }
    if (s === 'AUTO CLOSED' || s === 'CHECKED-OUT' || s === 'CLOSED') {
      return <Chip icon={<IconDoorExit size={16} />} label="CLOSED" sx={{ fontWeight: 'bold', bgcolor: '#FFF9C4', color: '#FBC02D' }} />;
    }
    if (s === 'APPROVED') {
      return <Chip icon={<IconCheck size={16} />} label="APPROVED" sx={{ fontWeight: 'bold', bgcolor: '#E3F2FD', color: '#1565C0' }} />;
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      return <Chip label={s} sx={{ fontWeight: 'bold', bgcolor: '#FFEBEE', color: '#C62828' }} />;
    }
    return <Chip label="OPEN" sx={{ fontWeight: 'bold', bgcolor: '#E8F5E9', color: '#2E7D32' }} />;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return String(dateVal);
    }
  };

  const formatTime = (timeVal) => {
    if (!timeVal) return '-';
    try {
      const d = new Date(timeVal);
      if (isNaN(d.getTime())) return String(timeVal);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(timeVal);
    }
  };

  const isCheckedIn = passData && (String(passData.status || '').toUpperCase() === 'CHECKED-IN' || String(passData.status || '').toUpperCase() === 'CHECKED_IN' || !!passData.checkInTime);
  const isCheckedOut = passData && (String(passData.status || '').toUpperCase() === 'CHECKED-OUT' || String(passData.status || '').toUpperCase() === 'CHECKED_OUT' || String(passData.status || '').toUpperCase() === 'CLOSED' || !!passData.checkOutTime);
  const isCancelled = passData && ['CANCELLED', 'REJECTED'].includes(String(passData.status || '').toUpperCase());

  return (
    <MainCard
      title={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{ width: '100%' }}
        >
          <Typography variant="h3" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Visitor Gate Entry Control
          </Typography>
          <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Today: {formatDate(new Date())}
          </Typography>
        </Stack>
      }
      contentSX={{ p: { xs: 1.5, sm: 2.5 } }}
    >
      <Box sx={{ width: '100%' }}>
        {/* Full-width Modern Header Banner */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            borderRadius: '20px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 30px rgba(0,0,0,0.5)'
              : '0 10px 30px rgba(15, 23, 42, 0.05)'
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="center"
            sx={{ width: '100%' }}
          >
            {/* Auto-fetching Autocomplete Search Field */}
            <Box sx={{ flex: 1, width: '100%' }}>
              <Autocomplete
                freeSolo
                open={!passData && suggestions.length > 0}
                options={suggestions}
                getOptionLabel={(option) => typeof option === 'string' ? extractGatePassNo(option) : (option.gatePassNo || '')}
                inputValue={searchNo}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'clear' || !newInputValue || newInputValue.trim() === '') {
                    setSearchNo('');
                    setPassData(null);
                    setSuggestions([]);
                    setErrorMsg('');
                    setSuccessMsg('');
                    return;
                  }
                  setSearchNo(newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (!newValue) {
                    setSearchNo('');
                    setPassData(null);
                    setSuggestions([]);
                    setErrorMsg('');
                    setSuccessMsg('');
                    return;
                  }
                  const passNo = typeof newValue === 'string' ? extractGatePassNo(newValue) : (newValue.gatePassNo || extractGatePassNo(newValue.visitorName));
                  setSearchNo(passNo);
                  setSuggestions([]);
                  executeFetchPass(passNo);
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id} sx={{ py: 1, px: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                        {option.gatePassNo}
                      </Typography>
                      <Typography variant="body2" color="textPrimary">
                        {option.visitorName} ({option.mobileNo || 'No Mobile'}) — To Meet: {option.personToMeet || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Visitor Gate Pass Code"
                    placeholder="Type Gate Pass No or scan QR Code"
                    variant="outlined"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setSuggestions([]);
                        executeFetchPass();
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <IconQrcode size={24} style={{ marginRight: 10, color: theme.palette.primary.main }} />,
                      endAdornment: (
                        <>
                          {loading || searchingSuggestions ? <CircularProgress color="primary" size={22} sx={{ mr: 1 }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      sx: {
                        borderRadius: '12px',
                        fontSize: { xs: '0.95rem', sm: '1.05rem' },
                        bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'
                      }
                    }}
                  />
                )}
              />
            </Box>

            {/* Scan QR Code Button */}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpenQrDialog}
              startIcon={<IconCamera size={24} />}
              sx={{
                width: { xs: '100%', md: 'auto' },
                minWidth: { md: '230px' },
                height: { xs: '52px', sm: '56px' },
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              Scan QR Code with Camera
            </Button>
          </Stack>
        </Paper>

        {/* Camera Permission Required Modal Dialog */}
        <Dialog
          open={cameraPermissionError}
          onClose={() => setCameraPermissionError(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              p: 1,
              boxShadow: '0 12px 32px rgba(239, 68, 68, 0.2)'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Avatar
              sx={{
                bgcolor: '#fee2e2',
                color: '#ef4444',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 1.5
              }}
            >
              <IconCameraOff size={36} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" color="error.main">
              Camera Access Required
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', px: 2.5 }}>
            <Typography variant="body1" color="textPrimary" fontWeight="600" mb={1.5}>
              Camera permission is required to scan Visitor Pass QR Codes.
            </Typography>
            <Alert severity="warning" sx={{ borderRadius: '12px', textAlign: 'left', mb: 1, fontSize: '0.875rem' }}>
              <strong>How to allow Camera access:</strong><br />
              1. Tap the <strong>Lock 🔒 or Camera icon</strong> in your browser address bar.<br />
              2. Set <strong>Camera</strong> to <strong>Allow / Enable</strong>.<br />
              3. Tap <strong>Retry Camera</strong> below.
            </Alert>
            {cameraErrorDetails && (
              <Typography variant="caption" color="textSecondary" display="block" sx={{ fontStyle: 'italic', mt: 1 }}>
                Details: {cameraErrorDetails}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={handleOpenQrDialog}
              startIcon={<IconCamera size={20} />}
              sx={{
                borderRadius: '12px',
                fontWeight: 'bold',
                py: 1.2,
                fontSize: '0.95rem'
              }}
            >
              Retry Camera Access
            </Button>
          </DialogActions>
        </Dialog>

        {/* Camera QR Reader Popup Dialog */}
        <Dialog
          open={qrDialogOpen}
          onClose={handleCloseQrDialog}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              m: { xs: 1.5, sm: 2 },
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <DialogTitle
            sx={{
              py: 1.8,
              px: 2.5,
              background: theme.palette.mode === 'dark' ? '#1e293b' : '#eff6ff',
              borderBottom: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#dbeafe'
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconScan size={22} color={theme.palette.primary.main} />
                <Typography variant="h4" fontWeight="bold" color="textPrimary">
                  Camera QR Scanner
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {availableCameras && availableCameras.length > 1 && (
                  <Tooltip title="Switch Camera (Front / Back)">
                    <IconButton size="small" color="primary" onClick={handleSwitchCamera} sx={{ bgcolor: 'rgba(37, 99, 235, 0.1)' }}>
                      <IconCameraRotate size={20} />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={handleCloseQrDialog} sx={{ color: 'text.secondary' }}>
                  <IconX size={20} />
                </IconButton>
              </Stack>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 2, pb: 1.5, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff' }}>
            <Typography variant="caption" color="textSecondary" display="block" mb={1} fontWeight="500">
              Align Visitor Pass QR Code inside frame (Camera: {facingMode === 'environment' ? 'Rear/Back' : 'Front'})
            </Typography>

            {/* HTTP Network Camera Help Banner */}
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <Alert severity="warning" icon={<IconInfoCircle size={20} />} sx={{ mb: 1.5, p: 1, borderRadius: '10px', fontSize: '0.78rem', textAlign: 'left' }}>
                <strong>Mobile Chrome HTTP Camera Fix:</strong><br />
                Chrome blocks camera on HTTP local IP (<code>{window.location.host}</code>). To allow:<br />
                1. Open <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> in Chrome.<br />
                2. Enable & enter <code>http://{window.location.host}</code> &rarr; Relaunch.
              </Alert>
            )}

            {/* Video Preview Container */}
            <Box
              id="qr-reader-container"
              sx={{
                width: '100%',
                height: '260px',
                borderRadius: '14px',
                overflow: 'hidden',
                bgcolor: '#000',
                border: '2.5px dashed #2563eb',
                boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)',
                '& video': {
                  objectFit: 'cover !important',
                  width: '100% !important',
                  height: '100% !important',
                  display: 'block !important'
                }
              }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1, bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<IconCameraRotate size={16} />}
              onClick={handleSwitchCamera}
              sx={{ borderRadius: '8px', fontWeight: 'bold' }}
            >
              Switch Cam ({facingMode === 'environment' ? 'Back' : 'Front'})
            </Button>

            <Button
              onClick={handleCloseQrDialog}
              variant="contained"
              color="inherit"
              size="small"
              sx={{ borderRadius: '8px', fontWeight: 'bold', px: 2.5 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notification Snackbars (Bottom Center, Auto-Hide 4s) */}
        <Snackbar
          open={Boolean(errorMsg)}
          autoHideDuration={4000}
          onClose={() => setErrorMsg('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setErrorMsg('')}
            sx={{
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.925rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              minWidth: '280px'
            }}
          >
            {errorMsg}
          </Alert>
        </Snackbar>

        <Snackbar
          open={Boolean(successMsg)}
          autoHideDuration={4000}
          onClose={() => setSuccessMsg('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSuccessMsg('')}
            sx={{
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.925rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              minWidth: '280px'
            }}
          >
            {successMsg}
          </Alert>
        </Snackbar>

        {/* Visitor Details Card & Check-In / Check-Out Control Panel */}
        {passData ? (() => {
          const currentStatus = formatStatusText(passData.status, passData);
          const isCheckedIn = currentStatus === 'CHECKED-IN' || currentStatus === 'CHECKED_IN' || !!passData.checkInTime;
          const isCheckedOut = currentStatus === 'AUTO CLOSED' || currentStatus === 'CLOSED' || currentStatus === 'CHECKED-OUT' || currentStatus === 'CHECKED_OUT' || !!passData.checkOutTime;
          const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';

          return (
            <Grid container spacing={3}>
              {/* Left Column: Visitor Gate Pass Details Card */}
              <Grid item xs={12} md={7} lg={8}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: '20px',
                    boxShadow: theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(37,99,235,0.08)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    background: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                    overflow: 'hidden'
                  }}
                >
                  {/* Accent Top Header Banner */}
                  <Box sx={{
                    p: { xs: 2.5, sm: 3 },
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                      : 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#cbd5e1'
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Box>
                        <Typography variant="caption" color="primary.main" textTransform="uppercase" fontWeight="800" letterSpacing={1.2}>
                          GATE PASS NUMBER
                        </Typography>
                        <Typography variant="h2" color="primary.dark" fontWeight="900" sx={{ fontSize: { xs: '1.75rem', sm: '2.3rem' }, letterSpacing: '0.5px' }}>
                          {passData.gatePassNo}
                        </Typography>
                      </Box>
                      <Box>{getStatusChip(passData.status)}</Box>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                    <Grid container spacing={2.5}>
                      {/* Visitor Name */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#dbeafe', color: '#2563eb', width: 46, height: 46, fontWeight: 'bold' }}>
                              <IconUserCheck size={26} />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight="600">Visitor Name</Typography>
                              <Typography variant="h4" fontWeight="800" color="textPrimary">{passData.visitorName || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      {/* Mobile Number */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7', width: 46, height: 46 }}>
                              <IconPhone size={26} />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight="600">Mobile Number</Typography>
                              <Typography variant="h4" fontWeight="800" color="textPrimary">{passData.mobileNo || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      {/* Person To Meet */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 46, height: 46 }}>
                              <IconBuilding size={26} />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight="600">Person to Meet</Typography>
                              <Typography variant="h5" fontWeight="700" color="textPrimary">{passData.personToMeet || passData.personName || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      {/* Purpose of Visit */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: '#f3e8ff', color: '#9333ea', width: 46, height: 46 }}>
                              <IconFileText size={26} />
                            </Avatar>
                            <Box>
                              <Typography variant="caption" color="textSecondary" fontWeight="600">Purpose of Visit</Typography>
                              <Typography variant="h5" fontWeight="700" color="textPrimary">{passData.purpose || '-'}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>

                      {/* Visitor Type */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">Visitor Type</Typography>
                          <Typography variant="subtitle1" fontWeight="700" color="textPrimary">{passData.visitorType || 'Guest'}</Typography>
                        </Paper>
                      </Grid>

                      {/* Gate Pass Date */}
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">Gate Pass Date</Typography>
                          <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                            {formatDate(passData.visitorDate || passData.gatePassDate || passData.createdDate)}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Food Allowance */}
                      {passData.foodAllowance && (
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">Food Allowance</Typography>
                            <Typography variant="subtitle1" fontWeight="700">{passData.foodAllowance} ({passData.foodCategory || 'Normal'})</Typography>
                          </Paper>
                        </Grid>
                      )}

                      {/* No of Persons */}
                      {passData.noOfPersons > 1 && (
                        <Grid item xs={12} sm={6}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">No. of Persons</Typography>
                            <Typography variant="subtitle1" fontWeight="700">{passData.noOfPersons}</Typography>
                          </Paper>
                        </Grid>
                      )}

                      {/* Comments */}
                      {passData.comments && (
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">Comments / Instructions</Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.5 }}>
                              {passData.comments}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column: Check-In & Check-Out Control Actions */}
              <Grid item xs={12} md={5} lg={4}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: '20px',
                    boxShadow: theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)',
                    background: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                    <Typography variant="h3" fontWeight="800" align="center" mb={2.5} color="textPrimary" sx={{ letterSpacing: '0.3px' }}>
                      Gate Access Controls
                    </Typography>

                    <Stack spacing={2.5}>
                      {/* If NOT checked in yet (OPEN / APPROVED) -> Show Check In Action */}
                      {!isCheckedIn && !isCheckedOut && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '16px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f0fdf4',
                            border: '2px solid #22c55e',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                            <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 38, height: 38 }}>
                              <IconDoorEnter size={22} />
                            </Avatar>
                            <Typography variant="h5" fontWeight="800" color="success.main">
                              Ready for Check In
                            </Typography>
                          </Stack>

                          <Button
                            fullWidth
                            size="large"
                            variant="contained"
                            color="success"
                            disabled={actionLoading || isCancelled}
                            onClick={handleCheckIn}
                            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <IconDoorEnter size={24} />}
                            sx={{
                              py: 1.5,
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                              }
                            }}
                          >
                            Check In Visitor
                          </Button>
                        </Paper>
                      )}

                      {/* If Already Checked In -> Show Check In Summary + Check Out Action in same row */}
                      {isCheckedIn && !isCheckedOut && (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: '14px',
                                bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <IconDoorEnter size={20} color="#16a34a" />
                                    <Typography variant="subtitle2" fontWeight="800" color="success.main">
                                      Checked In at {formatTime(passData.checkInTime)}
                                    </Typography>
                                  </Stack>
                                  <Chip label="DONE" size="small" color="success" sx={{ fontWeight: '800', height: 22 }} />
                                </Stack>
                                {passData.checkInBy && (
                                  <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                                    Operator: {passData.checkInBy}
                                  </Typography>
                                )}
                              </Box>

                              {passData.checkInImg && (
                                <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                                  <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block" mb={0.5}>
                                    CAPTURED CHECK-IN PHOTO
                                  </Typography>
                                  <Box
                                    component="img"
                                    src={getFileViewUrl(passData.checkInImg)}
                                    alt="Check In Visitor Photo"
                                    sx={{
                                      width: '100%',
                                      maxHeight: 180,
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      border: '2px solid #22c55e',
                                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                                    }}
                                  />
                                </Box>
                              )}
                            </Paper>
                          </Grid>

                          <Grid item xs={12} sm={6}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2.5,
                                borderRadius: '16px',
                                bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#eff6ff',
                                border: '2px solid #3b82f6',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease-in-out'
                              }}
                            >
                              <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
                                <Avatar sx={{ bgcolor: '#dbeafe', color: '#2563eb', width: 38, height: 38 }}>
                                  <IconDoorExit size={22} />
                                </Avatar>
                                <Typography variant="h5" fontWeight="800" color="primary.main">
                                  Ready for Check Out
                                </Typography>
                              </Stack>

                              <Button
                                fullWidth
                                size="large"
                                variant="contained"
                                color="primary"
                                disabled={actionLoading || isCancelled}
                                onClick={handleCheckOut}
                                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <IconDoorExit size={24} />}
                                sx={{
                                  py: 1.5,
                                  borderRadius: '12px',
                                  fontWeight: 'bold',
                                  fontSize: '1rem',
                                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                                  }
                                }}
                              >
                                Check Out Visitor
                              </Button>
                            </Paper>
                          </Grid>
                        </Grid>
                      )}

                      {/* If Checked Out -> Show Completed Summary */}
                      {isCheckedOut && (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '16px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                            border: '2px solid #64748b'
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Avatar sx={{ bgcolor: '#e2e8f0', color: '#475569', width: 38, height: 38 }}>
                                <IconDoorExit size={22} />
                              </Avatar>
                              <Typography variant="h5" fontWeight="800" color="text.secondary">
                                Gate Entry Closed
                              </Typography>
                            </Stack>
                            <Chip label="COMPLETED" size="small" sx={{ fontWeight: '800' }} />
                          </Stack>

                          <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                            <Typography variant="body2" color="textSecondary">
                              Check In: <strong>{formatTime(passData.checkInTime)}</strong>
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mt={0.5}>
                              Check Out: <strong>{formatTime(passData.checkOutTime)}</strong>
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1.5} mt={2} justifyContent="center">
                            {passData.checkInImg && (
                              <Box sx={{ textCenter: 'center', flex: 1 }}>
                                <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block" mb={0.5}>
                                  CHECK-IN PHOTO
                                </Typography>
                                <Box
                                  component="img"
                                  src={getFileViewUrl(passData.checkInImg)}
                                  alt="Check In Photo"
                                  sx={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #22c55e' }}
                                />
                              </Box>
                            )}
                            {passData.checkOutImg && (
                              <Box sx={{ textCenter: 'center', flex: 1 }}>
                                <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block" mb={0.5}>
                                  CHECK-OUT PHOTO
                                </Typography>
                                <Box
                                  component="img"
                                  src={getFileViewUrl(passData.checkOutImg)}
                                  alt="Check Out Photo"
                                  sx={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #3b82f6' }}
                                />
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          );
        })() : (
          /* Empty State Placeholder */
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, sm: 6 },
              textAlign: 'center',
              borderRadius: '16px',
              borderStyle: 'dashed',
              borderColor: '#cbd5e1',
              bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fafafa'
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: '#eff6ff',
                color: '#2563eb',
                mx: 'auto',
                mb: 2
              }}
            >
              <IconQrcode size={40} />
            </Avatar>
            <Typography variant="h3" fontWeight="bold" mb={1} sx={{ fontSize: { xs: '1.3rem', sm: '1.8rem' } }}>
              Scan or Type Gate Pass Code
            </Typography>
            <Typography variant="body1" color="textSecondary" maxWidth={540} mx="auto" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Tap <strong>Scan QR Code with Camera</strong> or type the Gate Pass Number above. Details will be verified and fetched automatically for Check-In / Check-Out.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Visitor Photo Capture Check In Dialog */}
      <VisitorCheckInDialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
        onConfirm={confirmCheckIn}
        visitor={passData}
      />

      {/* Visitor Photo Capture Check Out Dialog */}
      <VisitorCheckOutDialog
        open={checkOutDialogOpen}
        onClose={() => setCheckOutDialogOpen(false)}
        onConfirm={confirmCheckOut}
        visitor={passData}
      />
    </MainCard>
  );
};

export default VisitorGateEntry;
