import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Typography, Button, IconButton, Stack, Tooltip, CircularProgress, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, FormControl, InputLabel, Select, MenuItem, Alert, Grid,
  RadioGroup, FormControlLabel, Radio, Switch
} from '@mui/material';
import {
  IconCloudUpload,
  IconTrash,
  IconEye,
  IconPlus,
  IconPhoto,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileText,
  IconFile,
  IconScan,
  IconCamera,
  IconRefresh,
  IconX,
  IconCheck,
  IconDevices
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import BOSFilePreview from './BOSFilePreview';
import { getFileViewUrl } from 'utils/upload-helper';

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDisplayName = (fileName) => {
  if (!fileName) return '';
  let decodedName = fileName;
  try {
    decodedName = decodeURIComponent(fileName);
  } catch (e) {}
  let cleanName = decodedName.replace(/\\/g, '/').split('/').pop();
  cleanName = cleanName.replace(/^[a-fA-F0-9-]{32,}_/, ''); // UUID
  cleanName = cleanName.replace(/^\d{10,15}_/, ''); // Timestamp
  cleanName = cleanName.replace(/Screenshot.*?\./i, 'Screenshot.'); // Simplify screenshot name
  return cleanName;
};

const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return IconPhoto;
  if (['pdf'].includes(ext)) return IconFileTypePdf;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return IconFileSpreadsheet;
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return IconFileText;
  return IconFile;
};

export default function BOSQmsAttachmentUpload({
  pageCode,
  refId,
  docType,
  disabled = false,
  compact = false,
  label = 'Scan & Upload',
  helperText = '',
  error = false,
  multiple = false,
  onUploadSuccess,
  onFilesChange
}) {
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // ── Scanner Integration State ──
  const [scanOpen, setScanOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'failed'
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [scanDpi, setScanDpi] = useState(200);
  const [scanColorMode, setScanColorMode] = useState('Grayscale');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [videoStream, setVideoStream] = useState(null);
  const [cameraFilter, setCameraFilter] = useState('High Contrast B&W'); // 'Original', 'Grayscale', 'High Contrast B&W'

  const wsRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (pageCode && refId) {
      fetchAttachments();
    } else {
      setFiles([]);
    }
  }, [pageCode, refId, docType]);

  const onFilesChangeRef = useRef(onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  useEffect(() => {
    if (onFilesChangeRef.current) {
      onFilesChangeRef.current(files);
    }
  }, [files]);

  const fetchAttachments = async () => {
    if (!refId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (docType) {
        params.docType = docType;
      }
      const res = await axios.get(`/api/master/qms/attachment/${pageCode}/${refId}`, { params });
      setFiles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filesRef = useRef([]);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, []);

  const uploadFileObjects = async (fileArray) => {
    if (!fileArray || !fileArray.length) return;

    if (!refId) {
      // Local pending mode! Add files to local state and propagate
      setFiles((prev) => {
        const nextFiles = [...prev];
        fileArray.forEach((f, idx) => {
          // Assign a local unique ID to help with keying/removing
          const localId = `local-${Date.now()}-${idx}`;
          f.id = localId;
          f.isLocal = true;
          try {
            f.previewUrl = URL.createObjectURL(f);
          } catch (e) {
            console.error('Failed to create preview url', e);
          }
          nextFiles.push(f);
        });
        return nextFiles;
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    fileArray.forEach((file) => formData.append('files', file));

    try {
      const params = {};
      if (docType) {
        params.docType = docType;
      }
      await axios.post(`/api/master/qms/attachment/${pageCode}/${refId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params
      });
      await fetchAttachments();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await uploadFileObjects(selectedFiles);
    e.target.value = '';
  };

  const handleRemove = async (fileId) => {
    if (String(fileId).startsWith('local-')) {
      setFiles((prev) => {
        const target = prev.find(f => f.id === fileId);
        if (target && target.previewUrl) {
          URL.revokeObjectURL(target.previewUrl);
        }
        return prev.filter(f => f.id !== fileId);
      });
      return;
    }

    try {
      await axios.delete(`/api/master/qms/attachment/${fileId}`);
      await fetchAttachments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handlePreview = (file) => {
    const isLocal = file.isLocal || String(file.id).startsWith('local-');
    if (isLocal) {
      setPreviewFile({
        serverFileName: file.previewUrl || '',
        fileName: file.name,
        fileType: file.type || (file.name.endsWith('pdf') ? 'application/pdf' : 'image/jpeg'),
        isLocalUrl: true
      });
    } else {
      setPreviewFile({
        serverFileName: file.path || file.serverFileName,
        fileName: getDisplayName(file.fileName),
        fileType: file.fileName.endsWith('pdf') ? 'application/pdf' : 'image/jpeg'
      });
    }
    setPreviewOpen(true);
  };

  // ── Scanner Handlers ──
  const handleScanSuccess = async (base64Data, fileName) => {
    setScanning(true);
    try {
      let dataUrl = base64Data;
      if (!base64Data.startsWith('data:')) {
        dataUrl = `data:application/pdf;base64,${base64Data}`;
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName || `scan_${Date.now()}.pdf`, { type: blob.type });

      await uploadFileObjects([file]);
      setScanOpen(false);
    } catch (err) {
      console.error('[Scan success handler] Ingestion failed:', err);
      setScanError('Failed to upload scanned file.');
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async (deviceId = '') => {
    stopCamera();
    setCameraError('');
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices.filter(d => d.kind === 'videoinput');
      setCameraDevices(cameras);
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(deviceId || cameras[0].deviceId);
      }
    } catch (err) {
      console.error('[Camera] Access failed:', err);
      setCameraError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setScanning(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (cameraFilter === 'Grayscale') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (cameraFilter === 'High Contrast B&W') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const val = gray > 120 ? 255 : 0;
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      await handleScanSuccess(dataUrl, `camera_scan_${Date.now()}.jpg`);
    } catch (err) {
      console.error('[Camera capture] Capture failed:', err);
      setScanError('Failed to capture and process photo.');
      setScanning(false);
    }
  };

  const handleDemoScan = async () => {
    setScanning(true);
    setScanError('');
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 15;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      ctx.fillStyle = '#1e88e5';
      ctx.fillRect(40, 40, canvas.width - 80, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('SIMULATED SCAN DOCUMENT', 70, 90);

      ctx.fillStyle = '#333333';
      ctx.font = '18px sans-serif';
      ctx.fillText(label ? `${label} proof document` : 'BOS Proof Document', 60, 180);
      ctx.fillText(`Scanned on: ${new Date().toLocaleString()}`, 60, 210);
      ctx.fillText(`DPI: ${scanDpi} DPI | Mode: ${scanColorMode}`, 60, 240);

      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 4;
      for (let y = 300; y < 700; y += 40) {
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(canvas.width - 60, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(480, 680, 50, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#d32f2f';
      ctx.font = 'bold 16px Courier New';
      ctx.fillText('VERIFIED', 445, 685);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      await handleScanSuccess(dataUrl, `simulated_scan_${Date.now()}.jpg`);
    } catch (err) {
      console.error('[Demo Scan] Simulation failed:', err);
      setScanError('Failed to generate simulated scan.');
      setScanning(false);
    }
  };

  const handleTriggerScan = () => {
    if (!wsRef.current || connectionStatus !== 'connected') {
      setScanError('Scanner agent is not connected.');
      return;
    }
    setScanning(true);
    setScanError('');
    wsRef.current.send(JSON.stringify({
      action: 'START_SCAN',
      device: selectedDevice,
      dpi: scanDpi,
      colorMode: scanColorMode
    }));
  };

  useEffect(() => {
    if (!scanOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      stopCamera();
      return;
    }

    setScanError('');
    setScanning(false);
    setConnectionStatus('connecting');
    setDevices([]);
    setSelectedDevice('');

    const wsUrl = 'ws://localhost:12345';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(JSON.stringify({ action: 'GET_DEVICES' }));
      };

      ws.onerror = () => {
        setConnectionStatus('failed');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'DEVICES') {
            setDevices(msg.devices || []);
            if (msg.devices && msg.devices.length > 0) {
              setSelectedDevice(msg.devices[0]);
            }
          } else if (msg.type === 'SCAN_SUCCESS') {
            handleScanSuccess(msg.fileData, msg.fileName || 'scanned_doc.pdf');
          } else if (msg.type === 'SCAN_ERROR') {
            setScanError(msg.message || 'Scanning failed.');
            setScanning(false);
          }
        } catch (e) {
          console.error('[Scan WebSocket] Error parsing message:', e);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('failed');
      };
    } catch (err) {
      setConnectionStatus('failed');
    }
  }, [scanOpen]);

  return (
    <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* ── Add Files Button / Zone ── */}
      {!disabled && (
        <Box sx={{ display: 'flex', flexDirection: compact ? 'column' : 'row', flexWrap: 'wrap', gap: 2, alignItems: 'stretch', width: '100%', minWidth: 0 }}>
          <Box
            component="label"
            sx={{
              flex: compact ? '1 1 100%' : '1 1 140px',
              minWidth: 0,
              display: 'flex',
              flexDirection: compact ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 1.5 : 1,
              p: compact ? 1.5 : 3,
              border: '2px dashed',
              borderColor: error ? 'error.main' : 'divider',
              borderRadius: 2.5,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                borderColor: error ? 'error.main' : 'primary.light',
                bgcolor: alpha(theme.palette.primary.main, 0.02)
              }
            }}
          >
            <input type="file" style={{ display: 'block', width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }} multiple={multiple} onChange={handleInputChange} disabled={uploading || disabled} />
            <Box sx={{
              p: compact ? 0.8 : 1.5,
              borderRadius: '50%',
              bgcolor: alpha(error ? theme.palette.error.main : theme.palette.primary.main, 0.08),
              display: 'flex'
            }}>
              <IconCloudUpload size={compact ? 20 : 32} color={error ? theme.palette.error.main : theme.palette.primary.main} stroke={1.5} />
            </Box>
            <Box sx={{ textAlign: compact ? 'left' : 'center' }}>
              <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={600} color={error ? 'error.main' : 'text.primary'}>
                {uploading ? 'Uploading...' : label}
              </Typography>
              {!uploading && (
                <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'}>
                  {helperText || 'Drag & drop or click to browse'}
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            onClick={disabled ? undefined : () => setScanOpen(true)}
            sx={{
              flex: compact ? '1 1 100%' : '1 1 140px',
              minWidth: 0,
              display: 'flex',
              flexDirection: compact ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 1.5 : 1,
              p: compact ? 1.5 : 3,
              border: '2px dashed',
              borderColor: error ? 'error.main' : 'secondary.main',
              borderRadius: 2.5,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.25s ease',
              '&:hover': disabled ? {} : {
                borderColor: 'secondary.light',
                bgcolor: alpha(theme.palette.secondary.main, 0.02)
              }
            }}
          >
            <Box sx={{
              p: compact ? 0.8 : 1.5,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              display: 'flex'
            }}>
              <IconScan
                size={compact ? 20 : 32}
                color={theme.palette.secondary.main}
                stroke={1.5}
              />
            </Box>
            <Box sx={{ textAlign: compact ? 'left' : 'center' }}>
              <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={600} color="text.primary">
                Scan Document
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Direct scanner input
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* ── File List ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={24} /></Box>
      ) : (
        files.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5, pr: 0.5, width: '100%', minWidth: 0, overflow: 'hidden' }}>
            {files.map((file) => {
              const isLocal = file.isLocal || String(file.id).startsWith('local-');
              const name = getDisplayName(isLocal ? file.name : (file.fileName || 'Unknown'));
              const FileIcon = getFileIcon(name);
              return (
                <Box
                  key={file.id}
                  onClick={() => handlePreview(file)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 1,
                    borderRadius: 1.5, border: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.paper', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.2s ease', flex: '1 1 100%', width: '100%', minWidth: 0, boxSizing: 'border-box',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      borderColor: 'primary.main',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {/* Server indicator bar */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0,
                    width: 3, height: '100%',
                    bgcolor: isLocal ? 'warning.main' : 'success.main'
                  }} />

                  {/* File Icon or Image Thumbnail */}
                  <Box sx={{
                    width: 38, height: 38, borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  }}>
                    {['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(name.split('.').pop()?.toLowerCase()) ? (
                      <Tooltip
                        placement="right-start"
                        arrow
                        enterDelay={100}
                        leaveDelay={80}
                        slotProps={{
                          popper: {
                            modifiers: [{ name: 'offset', options: { offset: [0, 12] } }],
                            sx: { zIndex: 14000 }
                          },
                          tooltip: {
                            sx: {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.15)',
                              borderRadius: 3,
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              maxWidth: 'none',
                              pointerEvents: 'none'
                            }
                          }
                        }}
                        title={
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 0.5 }}>
                            <Box
                              component="img"
                              src={isLocal ? (file.previewUrl || '') : getFileViewUrl(file.path || file.serverFileName || file.fileName)}
                              alt={name}
                              sx={{
                                width: 'auto',
                                maxWidth: { xs: 320, sm: 480, md: 540 },
                                maxHeight: { xs: 280, sm: 420, md: 480 },
                                minWidth: { xs: 180, sm: 260 },
                                minHeight: { xs: 120, sm: 180 },
                                borderRadius: 2,
                                objectFit: 'contain',
                                display: 'block',
                                bgcolor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                              }}
                            />
                            {name && (
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: 'text.primary',
                                  fontSize: '0.85rem',
                                  maxWidth: { xs: 300, sm: 460, md: 520 },
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {name}
                              </Typography>
                            )}
                          </Box>
                        }
                      >
                        <Box
                          component="img"
                          src={isLocal ? (file.previewUrl || '') : getFileViewUrl(file.path || file.serverFileName || file.fileName)}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      </Tooltip>
                    ) : (
                      <FileIcon size={20} color={theme.palette.primary.main} />
                    )}
                    {/* Fallback icon if image fails to load */}
                    <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <FileIcon size={20} color={theme.palette.primary.main} />
                    </Box>
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Tooltip title={name} arrow placement="top">
                      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {name}
                      </Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary">
                      {isLocal ? 'Pending Save' : new Date(file.createdDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Preview" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(file);
                        }}
                        sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
                      >
                        <IconEye size={16} />
                      </IconButton>
                    </Tooltip>
                    {!disabled && (
                      <Tooltip title="Remove" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(file.id);
                          }}
                          sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main' }}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )
      )}

      {/* ── Direct Scan Dialog ── */}
      <Dialog
        open={scanOpen}
        onClose={scanning ? undefined : () => setScanOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, bgcolor: 'secondary.lighter', borderRadius: 1.5, display: 'flex', color: 'secondary.main' }}>
              <IconScan size={24} />
            </Box>
            <Typography variant="h4" fontWeight={800}>Scan & Upload Document</Typography>
          </Stack>
          {!scanning && (
            <IconButton onClick={() => setScanOpen(false)} sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}>
              <IconX size={20} />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: '24px !important' }}>
          <Grid container spacing={3}>
            {/* Left Side: Scanner Settings / Instructions */}
            <Grid item xs={12} md={5}>
              <Stack spacing={3}>
                {/* Agent Connection Status */}
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: connectionStatus === 'connected' ? 'success.light' : (connectionStatus === 'connecting' ? 'info.light' : 'divider'), bgcolor: connectionStatus === 'connected' ? 'success.lighter' : (connectionStatus === 'connecting' ? 'info.lighter' : 'grey.50') }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {connectionStatus === 'connecting' && <CircularProgress size={16} />}
                    {connectionStatus === 'connected' && <IconCheck size={18} color="green" />}
                    {connectionStatus === 'failed' && <IconX size={18} color="red" />}
                    <Typography variant="subtitle2" fontWeight={700}>
                      Scan Client: {connectionStatus === 'connected' ? 'CONNECTED' : (connectionStatus === 'connecting' ? 'CONNECTING...' : 'NOT RUNNING')}
                    </Typography>
                  </Stack>
                  {connectionStatus === 'failed' && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      To scan directly from a machine, please launch the <strong>ERP Scan Client</strong> on your desktop.
                    </Typography>
                  )}
                </Box>

                {connectionStatus === 'connected' ? (
                  /* Standard Hardware Scanner Settings */
                  <Stack spacing={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Scanning Device</InputLabel>
                      <Select
                        value={selectedDevice}
                        label="Scanning Device"
                        onChange={(e) => setSelectedDevice(e.target.value)}
                      >
                        {devices.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Resolution (DPI)</InputLabel>
                      <Select
                        value={scanDpi}
                        label="Resolution (DPI)"
                        onChange={(e) => setScanDpi(e.target.value)}
                      >
                        <MenuItem value={150}>150 DPI (Fast)</MenuItem>
                        <MenuItem value={200}>200 DPI (Recommended)</MenuItem>
                        <MenuItem value={300}>300 DPI (High Quality)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Color Mode</InputLabel>
                      <Select
                        value={scanColorMode}
                        label="Color Mode"
                        onChange={(e) => setScanColorMode(e.target.value)}
                      >
                        <MenuItem value="Color">Full Color</MenuItem>
                        <MenuItem value="Grayscale">Grayscale</MenuItem>
                        <MenuItem value="BlackAndWhite">Black & White (Lineart)</MenuItem>
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleTriggerScan}
                      disabled={scanning || !selectedDevice}
                      startIcon={<IconScan size={18} />}
                      fullWidth
                    >
                      {scanning ? 'Scanning...' : 'Trigger Machine Scan'}
                    </Button>
                  </Stack>
                ) : (
                  /* Call-to-actions when scanner agent is not running */
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        if (cameraActive) {
                          stopCamera();
                        } else {
                          startCamera();
                        }
                      }}
                      startIcon={<IconCamera size={18} />}
                      fullWidth
                    >
                      {cameraActive ? 'Stop Camera Scanner' : 'Use Camera Scanner'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleDemoScan}
                      disabled={scanning}
                      startIcon={<IconDevices size={18} />}
                      fullWidth
                    >
                      {scanning ? 'Generating...' : 'Simulate Scan (Demo)'}
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setConnectionStatus('connecting')}
                      startIcon={<IconRefresh size={14} />}
                      sx={{ alignSelf: 'center' }}
                    >
                      Retry Connection
                    </Button>
                  </Stack>
                )}

                {scanError && (
                  <Alert severity="error" sx={{ mt: 2 }}>{scanError}</Alert>
                )}
              </Stack>
            </Grid>

            {/* Right Side: Camera View Finder / Simulator Preview */}
            <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {cameraActive ? (
                <Stack spacing={2} alignItems="center">
                  {cameraDevices.length > 1 && (
                    <FormControl size="small" sx={{ width: '100%' }}>
                      <InputLabel>Select Camera</InputLabel>
                      <Select
                        value={selectedCamera}
                        label="Select Camera"
                        onChange={(e) => {
                          setSelectedCamera(e.target.value);
                          startCamera(e.target.value);
                        }}
                      >
                        {cameraDevices.map(d => (
                          <MenuItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Box sx={{
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    bgcolor: 'black',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cameraError ? (
                      <Typography color="error">{cameraError}</Typography>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Filter / Enhancement</InputLabel>
                      <Select
                        value={cameraFilter}
                        label="Filter / Enhancement"
                        onChange={(e) => setCameraFilter(e.target.value)}
                      >
                        <MenuItem value="Original">Original Color</MenuItem>
                        <MenuItem value="Grayscale">Grayscale</MenuItem>
                        <MenuItem value="High Contrast B&W">High Contrast B&W</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCapture}
                      disabled={scanning || cameraError}
                      sx={{ flex: 1 }}
                    >
                      Capture Photo
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Box sx={{
                  width: '100%',
                  aspectRatio: '4/3',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.50',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 3,
                  textAlign: 'center'
                }}>
                  {scanning ? (
                    <>
                      <CircularProgress size={40} thickness={4} color="secondary" />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>
                        Processing scanned document...
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Applying filters and conversion
                      </Typography>
                    </>
                  ) : (
                    <>
                      <IconDevices size={48} color={theme.palette.text.secondary} stroke={1} />
                      <Typography variant="subtitle2" fontWeight={700}>Scanner Preview Window</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: '300px' }}>
                        Start Camera or use the direct scan client to see the scanned document preview here.
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        allFiles={files.map(file => ({
          ...file,
          serverFileName: file.isLocal ? '' : (file.path || file.serverFileName),
          fileName: file.isLocal ? file.name : getDisplayName(file.fileName),
          isLocalUrl: !!file.isLocal
        }))}
        onNavigate={(nextFile) => handlePreview(nextFile)}
      />
    </Box>
  );
}

BOSQmsAttachmentUpload.propTypes = {
  pageCode: PropTypes.string.isRequired,
  refId: PropTypes.number,
  docType: PropTypes.string,
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  label: PropTypes.string,
  helperText: PropTypes.string,
  error: PropTypes.bool,
  multiple: PropTypes.bool,
  onUploadSuccess: PropTypes.func,
  onFilesChange: PropTypes.func
};
