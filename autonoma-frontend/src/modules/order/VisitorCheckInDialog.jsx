import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Stack,
  Typography,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { IconX, IconCamera, IconCheck, IconUser, IconClock, IconCameraRotate, IconPhotoCheck, IconAlertTriangle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { getFileViewUrl } from 'utils/upload-helper';

export default function VisitorCheckInDialog({ open, onClose, onConfirm, visitor }) {
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [inTime, setInTime] = useState('');
  const [visibilityScore, setVisibilityScore] = useState(null);
  const [visibilityError, setVisibilityError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) by default
  const [deviceList, setDeviceList] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const isStartingRef = useRef(false);

  // Stop webcam helper
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Auto-attach stream to video element on state changes to prevent black screen
  useEffect(() => {
    if (webcamActive && streamRef.current && videoRef.current && !capturedImage) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('muted', 'true');
      videoRef.current.play().catch(() => { });
    }
  }, [webcamActive, capturedImage, facingMode, currentDeviceId]);

  // Auto-fetch & 6-month rule states
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [isAutoFetched, setIsAutoFetched] = useState(false);
  const [isPhotoMandatory, setIsPhotoMandatory] = useState(true);
  const [photoMessage, setPhotoMessage] = useState('');
  const [lastPhotoDate, setLastPhotoDate] = useState(null);

  const getImageSrc = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return getFileViewUrl(img);
  };

  const startWebcam = async (mode = facingMode, devId = null) => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError('');

    // Check mediaDevices support (HTTPS required on mobile)
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser context. Please use HTTPS or localhost.');
      isStartingRef.current = false;
      return;
    }

    try {
      stopWebcam();
      // Pause 250ms to release hardware lock on mobile devices
      await new Promise((resolve) => setTimeout(resolve, 250));

      let stream = null;

      // 1. Try simple facingMode constraint first
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode }
        });
      } catch (e1) {
        console.warn('Soft facingMode getUserMedia failed:', e1);
      }

      // 2. Try facingMode with ideal constraint
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: mode } }
          });
        } catch (e2) {
          console.warn('Ideal facingMode getUserMedia failed:', e2);
        }
      }

      // 3. Try explicit deviceId if provided
      if (!stream && devId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: devId }
          });
        } catch (e3) {
          console.warn('Explicit deviceId getUserMedia failed:', e3);
        }
      }

      // 4. Fallback to enumerated device matching
      if (!stream && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setDeviceList(videoInputs);
          if (videoInputs.length > 0) {
            const targetDev = videoInputs.find((d) => {
              const label = (d.label || '').toLowerCase();
              return mode === 'user'
                ? (label.includes('front') || label.includes('user') || label.includes('facing front') || label.includes('selfie') || label.includes('1'))
                : (label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('facing back') || label.includes('0'));
            }) || (mode === 'user' && videoInputs.length > 1 ? videoInputs[1] : videoInputs[0]);

            if (targetDev?.deviceId) {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: targetDev.deviceId }
              });
            }
          }
        } catch (e4) {
          console.warn('Failed device enumeration fallback:', e4);
        }
      }

      // 5. Universal basic fallback
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (stream) {
        streamRef.current = stream;
        setWebcamActive(true);

        const activeTrack = stream.getVideoTracks()?.[0];
        if (activeTrack) {
          const settings = activeTrack.getSettings ? activeTrack.getSettings() : {};
          if (settings.deviceId) setCurrentDeviceId(settings.deviceId);
          if (settings.facingMode) {
            setFacingMode(settings.facingMode);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.setAttribute('muted', 'true');
          await videoRef.current.play().catch(() => { });
        }

        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');
            setDeviceList(videoInputs);
          }).catch(() => { });
        }
      } else {
        setCameraError('Unable to open camera stream.');
      }
    } catch (err) {
      console.error('Error starting webcam:', err);
      setCameraError('Camera permission denied or camera device busy.');
    } finally {
      isStartingRef.current = false;
    }
  };

  // Evaluate photo status when dialog opens
  useEffect(() => {
    if (!open) {
      stopWebcam();
      return;
    }

    // Set current time
    const now = new Date();
    let hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    setInTime(`${String(hours).padStart(2, '0')}:${mins} ${ampm}`);

    setCapturedImage(null);
    setVisibilityScore(null);
    setVisibilityError('');
    setCameraError('');
    setIsAutoFetched(false);
    setIsPhotoMandatory(true);
    setPhotoMessage('');
    setLastPhotoDate(null);

    const mobile = visitor?.mobileNo || visitor?.mobile_no || visitor?.mobile || visitor?.phoneNo || visitor?.contactNo || '';
    const currentPassImg = visitor?.checkInImg || visitor?.checkOutImg;

    if (currentPassImg) {
      setCapturedImage(currentPassImg);
      setIsAutoFetched(true);
      setIsPhotoMandatory(false);
      setPhotoMessage('Auto-fetched existing photo for this visitor pass.');
      return;
    }

    if (!mobile) {
      setIsPhotoMandatory(true);
      setPhotoMessage('⚠️ Mobile number missing. Image Capture is MANDATORY.');
      startWebcam(facingMode, currentDeviceId);
      return;
    }

    setLoadingPhoto(true);
    axios
      .get('/api/order/visitor-gate-pass/photo-info-by-mobile', { params: { mobileNo: mobile } })
      .then((res) => {
        const info = res.data || {};
        if (info.photoUrl && !info.isPhotoMandatory) {
          setCapturedImage(info.photoUrl);
          setIsAutoFetched(true);
          setIsPhotoMandatory(false);
          setLastPhotoDate(info.lastPhotoDate);
          setPhotoMessage(`Auto-fetched previous photo (Last visit: ${info.lastPhotoDate || 'Recent'})`);
        } else {
          setCapturedImage(null);
          setIsAutoFetched(false);
          setIsPhotoMandatory(true);
          setLastPhotoDate(info.lastPhotoDate || null);
          if (info.monthsElapsed >= 6) {
            setPhotoMessage(`⚠️ 6 months passed since last visit (${info.lastPhotoDate}). Image Capture is MANDATORY.`);
          } else {
            setPhotoMessage('⚠️ No previous photo found for this mobile number. Image Capture is MANDATORY.');
          }
          startWebcam(facingMode, currentDeviceId);
        }
      })
      .catch((err) => {
        console.error('Error fetching visitor photo info:', err);
        setIsPhotoMandatory(true);
        setPhotoMessage('⚠️ Photo capture is MANDATORY.');
        startWebcam(facingMode, currentDeviceId);
      })
      .finally(() => {
        setLoadingPhoto(false);
      });

    return () => {
      stopWebcam();
    };
  }, [open, visitor]);

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setCurrentDeviceId('');
    setCapturedImage(null);
    setIsAutoFetched(false);
    await startWebcam(nextMode, '');
  };

  const capturePhoto = async () => {
    const video = videoRef.current || document.getElementById('v-webcam-video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    // Draw photo standard without horizontal flip so text/badges/IDs are non-mirrored
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const detector = new window.FaceDetector({ fastMode: true });
        const detectedFaces = await detector.detect(canvas);
        if (!detectedFaces || detectedFaces.length === 0) {
          setVisibilityScore(0);
          setVisibilityError('⚠️ No visitor face detected! Please stand in front of the camera and align face inside the oval.');
          setCapturedImage(null);
          return;
        }
      } catch (e) { }
    }

    const startX = Math.floor(canvas.width * 0.25);
    const startY = Math.floor(canvas.height * 0.15);
    const regionW = Math.floor(canvas.width * 0.50);
    const regionH = Math.floor(canvas.height * 0.65);

    const faceData = ctx.getImageData(startX, startY, regionW, regionH).data;
    const totalRegionPixels = regionW * regionH;
    let faceSum = 0;
    let skinPixelCount = 0;
    const luminances = new Float32Array(totalRegionPixels);

    let pIdx = 0;
    for (let i = 0; i < faceData.length; i += 4) {
      const r = faceData[i];
      const g = faceData[i + 1];
      const b = faceData[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances[pIdx++] = lum;
      faceSum += lum;

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const isSkin = r > 40 && g > 25 && b > 15 && r > g && r > b && Math.abs(r - g) > 12 && maxC - minC > 15;
      if (isSkin) skinPixelCount++;
    }

    const meanLum = faceSum / totalRegionPixels;
    const faceScore = Math.min(99, Math.round(Math.pow(meanLum / 255, 0.6) * 100));
    const skinRatio = Math.round((skinPixelCount / totalRegionPixels) * 100);

    let varSum = 0;
    for (let i = 0; i < totalRegionPixels; i++) {
      const diff = luminances[i] - meanLum;
      varSum += diff * diff;
    }
    const stdDev = Math.sqrt(varSum / totalRegionPixels);

    if (skinRatio < 15) {
      setVisibilityScore(skinRatio);
      setVisibilityError(`⚠️ Mandatory: No visitor face detected in oval (${skinRatio}% face match). Please position face inside oval guide!`);
      setCapturedImage(null);
      return;
    }

    if (skinRatio > 65 || (skinRatio > 55 && stdDev < 20)) {
      setVisibilityScore(skinRatio);
      setVisibilityError('⚠️ Hand, arm, or object detected! Please show visitor face clearly inside the oval guide.');
      setCapturedImage(null);
      return;
    }

    if (stdDev < 17) {
      setVisibilityScore(faceScore);
      setVisibilityError('⚠️ Facial features (eyes/nose/mouth) not clearly detected! Please align visitor face inside the oval without hands or objects.');
      setCapturedImage(null);
      return;
    }

    if (faceScore < 60) {
      setVisibilityScore(faceScore);
      setVisibilityError(`⚠️ Face clarity & lighting is too low (${faceScore}%). Minimum 60% face clarity is mandatory. Please face towards a light source!`);
      setCapturedImage(null);
      return;
    }

    setVisibilityScore(faceScore);
    setVisibilityError('');
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    setIsAutoFetched(false);
    stopWebcam();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsAutoFetched(false);
    setVisibilityScore(null);
    setVisibilityError('');
    setCameraError('');
    startWebcam();
  };

  const handleConfirm = () => {
    if (!capturedImage) return;
    const now = new Date();
    const formattedInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    onConfirm({
      image: capturedImage,
      inTime: formattedInTime,
      isAutoFetched
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '14px', sm: '18px' },
          m: { xs: 1, sm: 2 },
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0F4C81 0%, #1565C0 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.2, sm: 1.6 }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', p: 0.5, display: 'flex', bgcolor: 'rgba(255,255,255,0.1)' }}>
            <IconUser size={18} />
          </Box>
          <Typography variant="h4" color="inherit" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
            Visitor Check IN
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {deviceList && deviceList.length > 1 && (
            <Tooltip title="Switch Camera (Front / Back)">
              <IconButton
                onClick={toggleCameraFacing}
                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                size="small"
              >
                <IconCameraRotate size={18} />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onClose} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }} size="small">
            <IconX size={18} />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Dialog Body Content */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%', mb: 1.5 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.8, fontSize: { xs: '0.75rem', sm: '0.825rem' } }}>
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main' }} />
            Photo & Face Check
            <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'primary.main' }} />
          </Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Stack>

        {loadingPhoto ? (
          <Box sx={{ width: '100%', height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', borderRadius: '12px', mb: 1.5 }}>
            <CircularProgress size={32} sx={{ mb: 1 }} />
            <Typography variant="caption" color="textSecondary">Checking visitor photo history...</Typography>
          </Box>
        ) : (
          /* Viewport */
          <Box
            sx={{
              width: '100%',
              aspectRatio: '4 / 3',
              minHeight: 220,
              maxHeight: 280,
              bgcolor: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              border: '2px solid',
              borderColor: capturedImage ? '#22c55e' : '#3b82f6',
              boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {!capturedImage ? (
              <video
                ref={videoRef}
                id="v-webcam-video"
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <img src={getImageSrc(capturedImage)} alt="Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}

            {!capturedImage && webcamActive && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="160" height="190" viewBox="0 0 170 200">
                  <ellipse cx="85" cy="100" rx="65" ry="85" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" fill="none" />
                </svg>
                <Typography variant="caption" sx={{ color: '#ffffff', bgcolor: 'rgba(15,23,42,0.85)', px: 1.2, py: 0.3, borderRadius: '6px', mt: -1.5, fontWeight: 700, fontSize: '0.7rem' }}>
                  Align Visitor Face Inside Oval
                </Typography>
              </Box>
            )}

            {/* Corner Markers */}
            <Box sx={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, borderTop: '2.5px solid rgba(255,255,255,0.6)', borderLeft: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '4px 0 0 0' }} />
            <Box sx={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderTop: '2.5px solid rgba(255,255,255,0.6)', borderRight: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '0 4px 0 0' }} />
            <Box sx={{ position: 'absolute', bottom: 10, left: 10, width: 16, height: 16, borderBottom: '2.5px solid rgba(255,255,255,0.6)', borderLeft: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '0 0 0 4px' }} />
            <Box sx={{ position: 'absolute', bottom: 10, right: 10, width: 16, height: 16, borderBottom: '2.5px solid rgba(255,255,255,0.6)', borderRight: '2.5px solid rgba(255,255,255,0.6)', borderRadius: '0 0 4px 0' }} />

            {/* Status Badges */}
            {isAutoFetched && capturedImage && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  bgcolor: 'rgba(22, 101, 52, 0.95)',
                  color: '#ffffff',
                  px: 1.2,
                  py: 0.4,
                  borderRadius: '16px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <IconPhotoCheck size={14} /> Auto-Fetched (Last Visit: {lastPhotoDate || 'Recent'})
              </Box>
            )}

            {!isAutoFetched && visibilityScore !== null && capturedImage && (
              <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(22, 101, 52, 0.95)', color: '#ffffff', px: 1.2, py: 0.3, borderRadius: '16px', fontSize: '0.72rem', fontWeight: 800 }}>
                Clarity: {visibilityScore}%
              </Box>
            )}
          </Box>
        )}

        {cameraError && (
          <Alert severity="error" sx={{ width: '100%', mb: 1.5, py: 0.3, px: 1.2, fontSize: '0.75rem', fontWeight: 600 }}>
            {cameraError}
          </Alert>
        )}

        {photoMessage && (
          <Alert
            severity={isAutoFetched ? 'success' : isPhotoMandatory ? 'warning' : 'info'}
            icon={isAutoFetched ? <IconPhotoCheck size={18} /> : <IconAlertTriangle size={18} />}
            sx={{ width: '100%', mb: 1.5, py: 0.3, px: 1.2, fontSize: '0.75rem', fontWeight: 600 }}
          >
            {photoMessage}
          </Alert>
        )}

        {visibilityError && (
          <Box sx={{ width: '100%', bgcolor: '#fef2f2', border: '1px solid #fecaca', p: 1, borderRadius: '10px', mb: 1.5 }}>
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, display: 'block', textAlign: 'center', fontSize: '0.72rem' }}>
              {visibilityError}
            </Typography>
          </Box>
        )}

        {!capturedImage ? (
          <Button
            variant="contained"
            fullWidth
            size="medium"
            sx={{
              background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
              boxShadow: '0 4px 14px rgba(21,101,192,0.35)',
              py: 1.1,
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              mb: 1.5
            }}
            startIcon={<IconCamera size={18} />}
            onClick={capturePhoto}
            disabled={!webcamActive}
          >
            Capture New Photo
          </Button>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            size="medium"
            sx={{ py: 1, borderRadius: '10px', mb: 1.5, fontWeight: 'bold', borderWidth: 2 }}
            startIcon={<IconCamera size={18} />}
            onClick={retakePhoto}
          >
            Recapture New Photo
          </Button>
        )}

        <Box sx={{ width: '100%', height: '1px', bgcolor: 'divider', mb: 1.5 }} />

        {/* IN Time Box */}
        <Stack spacing={0.5} sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', px: 0.5 }}>
            <IconClock size={15} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}>IN Time</Typography>
          </Stack>
          <Box
            sx={{
              bgcolor: 'background.default',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              py: 0.8,
              px: 1.5,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ color: '#0f172a' }}>
              <IconClock size={18} style={{ color: '#2563eb' }} />
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.15rem' }}>{inTime}</Typography>
            </Stack>
          </Box>
        </Stack>

        <Button
          variant="contained"
          size="medium"
          fullWidth
          disabled={!capturedImage}
          sx={{
            mt: 1.8,
            background: 'linear-gradient(135deg, #0F4C81 0%, #1565C0 100%)',
            boxShadow: '0 4px 16px rgba(15,76,129,0.4)',
            '&:hover': { background: 'linear-gradient(135deg, #0D47A1 0%, #0A3266 100%)' },
            '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#94a3b8', background: '#cbd5e1' },
            borderRadius: '10px',
            py: 1.1,
            fontWeight: 'bold',
            fontSize: '0.95rem'
          }}
          startIcon={<IconCheck size={20} />}
          onClick={handleConfirm}
        >
          Confirm Check IN
        </Button>
      </DialogContent>
    </Dialog>
  );
}

