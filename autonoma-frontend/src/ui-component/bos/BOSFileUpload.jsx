import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconCloudUpload,
  IconTrash,
  IconEye,
  IconPhoto,
  IconFile,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileText,
  IconScan,
  IconCamera,
  IconRefresh,
  IconX,
  IconCheck,
  IconDevices
} from '@tabler/icons-react';
import { autoUploadFiles, getFileViewUrl } from 'utils/upload-helper';
import axios from 'utils/axios';
import BOSFilePreview from './BOSFilePreview';
import { getCleanFileName } from './BOSUtils';

/**
 * ═══════════════════════════════════════════════════════════════
 * BOSFileUpload — BOS Standard File Upload Component
 * ═══════════════════════════════════════════════════════════════
 * 
 * Unified file upload with:
 *  ✓ Single & multiple file support
 *  ✓ Drag & drop zone
 *  ✓ Auto-upload to server via FileService
 *  ✓ Eye icon preview for all document types
 *  ✓ File type icons (PDF, Image, Excel, Doc, etc.)
 *  ✓ Delete/remove capability
 *  ✓ Module auto-detection (syncs with BosDocConstants)
 *
 * Usage:
 *   import { BOSFileUpload } from 'ui-component/bos';
 *
 *   <BOSFileUpload
 *     files={form.attachments}
 *     onChange={(files) => setForm({ ...form, attachments: files })}
 *     module="QMS_CHECKLIST"         // maps to BOS_DOCUMENTS/QMS/Checklist
 *     multiple={true}
 *     accept="image/*,.pdf,.docx,.xlsx"
 *     maxFiles={10}
 *     disabled={isReadOnly}
 *   />
 */

// ── File Type Icon Resolver ──────────────────────────────────
const getFileIcon = (fileName) => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return IconPhoto;
  if (['pdf'].includes(ext)) return IconFileTypePdf;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return IconFileSpreadsheet;
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return IconFileText;
  return IconFile;
};

// ── File Size Formatter ──────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const stripUUIDPrefix = getCleanFileName;

const getDisplayName = (name, maxLength = 25) => {
  if (!name) return 'Unknown File';
  let targetName = name;
  if (typeof name === 'object' && name !== null) {
    targetName = name.fileName || name.name || name.originalFileName || name.serverFileName || name.path || '';
  }
  let cleanName = stripUUIDPrefix(targetName);
  if (!cleanName || cleanName === '[object Object]') cleanName = 'File';

  if (cleanName.length <= maxLength) return cleanName;

  const lastDotIndex = cleanName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? cleanName.substring(lastDotIndex + 1) : '';
  const base = lastDotIndex !== -1 ? cleanName.substring(0, lastDotIndex) : cleanName;

  if (ext) {
    const charsToShow = maxLength - ext.length - 4; // 3 for '...', 1 for '.'
    if (charsToShow > 0) {
      const frontChars = Math.ceil(charsToShow / 2);
      const backChars = Math.floor(charsToShow / 2);
      return base.substring(0, frontChars) + '...' + base.slice(-backChars) + '.' + ext;
    }
  }

  return cleanName.substring(0, maxLength - 3) + '...';
};

const getCompactDisplayName = (name) => {
  if (!name) return 'Unknown File';
  let targetName = name;
  if (typeof name === 'object' && name !== null) {
    targetName = name.fileName || name.name || name.originalFileName || name.serverFileName || name.path || '';
  }
  let cleanName = stripUUIDPrefix(targetName);
  if (!cleanName || cleanName === '[object Object]') cleanName = 'File';

  const lastDot = cleanName.lastIndexOf('.');
  if (lastDot === -1) {
    return cleanName.length > 22 ? cleanName.slice(0, 19) + '...' : cleanName;
  }
  const base = cleanName.slice(0, lastDot);
  const ext = cleanName.slice(lastDot);
  if (base.length > 18) {
    return base.slice(0, 15) + '...' + ext;
  }
  return cleanName;
};

const SecureThumbnail = ({ src, alt, fallback, sx, hoverPreview = true, name = '' }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setImgSrc(src);
      return;
    }

    let active = true;
    let objectUrl = '';

    axios.get(src, { responseType: 'blob' })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data);
        setImgSrc(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (failed || !imgSrc) {
    return fallback;
  }

  const thumbElement = (
    <Box
      component="img"
      src={imgSrc}
      alt={alt}
      sx={sx}
    />
  );

  if (!hoverPreview) {
    return thumbElement;
  }

  return (
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
            src={imgSrc}
            alt={alt || name}
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
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {thumbElement}
      </Box>
    </Tooltip>
  );
};

export default function BOSFileUpload({
  files = [],
  onChange,
  module,
  multiple = true,
  accept = '*',
  pageCode = null,
  refId = null,
  maxFiles = 20,
  maxSizeMB = 25,
  disabled = false,
  compact = false,
  label = 'Upload Files',
  helperText = '',
  error = false,
  colorScheme = 'default',
  icon: IconComponent = null,
  hideDropzoneOnUpload = false,
  hideDropzone = false,
  scan = false,
  maxListHeight = null,
  sideBySide = false,
  verticalList = false,
  onLimitExceeded = null,
  compactDropzoneOnly = false,
  candidatePortalLayout = false,
  hideFileList = false,
  inlineList = false,
  verticalDropzones = false,
  gridColumns = null,
  sx = {}
}) {
  const theme = useTheme();
  const { colorScheme: appColorScheme } = useColorScheme();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [resolvedNames, setResolvedNames] = useState({});

  useEffect(() => {
    if (!files || files.length === 0) return;
    files.forEach(f => {
      if (!f) return;
      const path = f.serverFileName || f.path || f.filePath;
      if (path && (f.isServer || f.serverFileName || f.path || f.filePath)) {
        if (resolvedNames[path] === undefined) {
          setResolvedNames(prev => {
            if (prev[path] !== undefined) return prev;
            return { ...prev, [path]: null };
          });
          axios.get(`/api/files/metadata?path=${encodeURIComponent(path)}`)
            .then(res => {
              if (res.data && res.data.fileName) {
                setResolvedNames(prev => ({ ...prev, [path]: res.data.fileName }));
              }
            })
            .catch(() => {});
        }
      }
    });
  }, [files]);

  const themeColors = useCallback(() => {
    if (error) {
      return {
        border: theme.palette.error.main,
        bg: alpha(theme.palette.error.main, 0.04),
        iconBg: alpha(theme.palette.error.main, 0.08),
        iconColor: theme.palette.error.main,
        hoverBorder: theme.palette.error.dark,
        hoverBg: alpha(theme.palette.error.main, 0.06),
      };
    }
    if (colorScheme === 'green') {
      return {
        border: 'rgba(16, 185, 129, 0.6)',
        bg: 'rgba(16, 185, 129, 0.04)',
        iconBg: alpha('#10b981', 0.08),
        iconColor: '#10b981',
        hoverBorder: '#10b981',
        hoverBg: alpha('#10b981', 0.08),
      };
    }
    if (colorScheme === 'orange' || colorScheme === 'amber') {
      return {
        border: 'rgba(245, 158, 11, 0.6)',
        bg: 'rgba(245, 158, 11, 0.04)',
        iconBg: alpha('#f59e0b', 0.08),
        iconColor: '#f59e0b',
        hoverBorder: '#f59e0b',
        hoverBg: alpha('#f59e0b', 0.08),
      };
    }
    return {
      border: dragActive ? theme.palette.primary.main : 'divider',
      bg: dragActive
        ? alpha(theme.palette.primary.main, 0.04)
        : (disabled ? alpha(theme.palette.grey[500], 0.04) : (compact ? alpha(theme.palette.primary.main, 0.015) : 'transparent')),
      iconBg: alpha(disabled ? theme.palette.grey[500] : theme.palette.primary.main, 0.08),
      iconColor: disabled ? theme.palette.grey[500] : theme.palette.primary.main,
      hoverBorder: 'primary.light',
      hoverBg: alpha(theme.palette.primary.main, 0.04),
    };
  }, [error, colorScheme, theme, dragActive, disabled, compact])();

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
  const dropzoneHoveredRef = useRef(false);

  // ── Fix: Assign stream to video element AFTER React renders it ──────────
  // The <video> element is conditionally rendered (only when cameraActive=true),
  // so videoRef.current is null during startCamera(). This effect fires after
  // cameraActive turns true and the video element is mounted in the DOM.
  useEffect(() => {
    if (cameraActive && videoStream && videoRef.current) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, videoStream]);

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

      await processFiles([file]);
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
      // Mirror the context horizontally to match the mirrored video preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Reset transformation matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);

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
      console.error('[Scan WebSocket] Setup error:', err);
      setConnectionStatus('failed');
    }
  }, [scanOpen]);

  // ── Drag & Drop Handlers ──
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, [disabled]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [disabled, files, multiple, maxFiles]);

  // ── Clipboard Paste Handler (Ctrl + V / Paste Files & Screenshots) ──
  const handlePasteFiles = useCallback((e) => {
    if (disabled) return;
    if (!e.clipboardData) return;

    const clipboardFiles = e.clipboardData.files ? Array.from(e.clipboardData.files) : [];
    const clipboardItems = e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
    const extractedFiles = [];

    if (clipboardFiles.length > 0) {
      extractedFiles.push(...clipboardFiles);
    } else if (clipboardItems.length > 0) {
      clipboardItems.forEach((item, idx) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            let fileName = file.name;
            if (!fileName || fileName === 'image.png' || fileName === 'blob') {
              const ext = (file.type && file.type.split('/')[1]) || 'png';
              fileName = `pasted_${Date.now()}_${idx + 1}.${ext}`;
            }
            const namedFile = new File([file], fileName, { type: file.type });
            extractedFiles.push(namedFile);
          }
        }
      });
    }

    if (extractedFiles.length > 0) {
      // Check if target is a text input field - if text is being pasted, don't block text
      const target = e.target;
      const isTextInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      // If user pasted a file or image (not pure text), consume event and upload file
      e.preventDefault();
      e.stopPropagation();
      processFiles(extractedFiles);
    }
  }, [disabled, files, multiple, maxFiles, maxSizeMB, module]);

  // Window paste listener — ONLY triggers if mouse cursor is directly hovering over THIS specific upload dropzone box
  useEffect(() => {
    const onWindowPaste = (e) => {
      if (disabled) return;
      if (hideDropzone || (hideDropzoneOnUpload && files.length > 0)) return;
      if (multiple ? files.length >= maxFiles : files.length >= 1) return;

      // Strict condition: Only activate paste if user's mouse cursor is directly hovering over the upload dropzone box
      if (!dropzoneHoveredRef.current) {
        return;
      }

      const clipboardFiles = e.clipboardData?.files ? Array.from(e.clipboardData.files) : [];
      const clipboardItems = e.clipboardData?.items ? Array.from(e.clipboardData.items) : [];
      const hasFiles = clipboardFiles.length > 0 || clipboardItems.some(it => it.kind === 'file');

      // Only trigger if clipboard contains actual files or image blobs
      if (hasFiles) {
        handlePasteFiles(e);
      }
    };

    window.addEventListener('paste', onWindowPaste);
    return () => {
      window.removeEventListener('paste', onWindowPaste);
    };
  }, [disabled, hideDropzone, hideDropzoneOnUpload, multiple, files.length, maxFiles, handlePasteFiles]);

  // ── Process & Upload Files ──
  const processFiles = async (newFiles) => {
    if (!newFiles.length) return;

    // Enforce limits — reject the entire selection if it exceeds available slots
    if (multiple) {
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) {
        const msg = `Maximum ${maxFiles} file(s) already uploaded. Please remove existing files before uploading new ones.`;
        if (typeof onLimitExceeded === 'function') {
          onLimitExceeded(msg);
        } else {
          console.warn(`[BOSFileUpload] ${msg}`);
        }
        return;
      }
      if (newFiles.length > remainingSlots) {
        const msg = `You can upload at most ${maxFiles} files. You already have ${files.length} file(s) and selected ${newFiles.length} new file(s). Please select ${remainingSlots} or fewer.`;
        if (typeof onLimitExceeded === 'function') {
          onLimitExceeded(msg);
        } else {
          console.warn(`[BOSFileUpload] ${msg}`);
        }
        return;
      }
    }
    const filesToUpload = multiple ? newFiles : [newFiles[0]];

    // Validate file sizes
    const oversized = filesToUpload.filter(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized.length) {
      const msg = `${oversized.length} file(s) exceed the ${maxSizeMB}MB size limit.`;
      if (typeof onLimitExceeded === 'function') {
        onLimitExceeded(msg);
      } else {
        console.warn(`[BOSFileUpload] ${msg}`);
      }
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded = await autoUploadFiles(filesToUpload, module, (progress) => {
        setUploadProgress(progress);
      }, { pageCode, refId });

      const newEntries = uploaded.map((serverPath, i) => {
        const f = filesToUpload[i];
        const isImage = f.type && f.type.startsWith('image/');
        const cleanName = (f.name || '').replace(/\\/g, '/').split('/').pop();
        return {
          id: `${Date.now()}_${i}`,
          fileName: cleanName,
          serverFileName: serverPath,
          fileSize: f.size,
          fileType: f.type,
          isServer: true,
          uploadedAt: new Date().toISOString(),
          preview: isImage ? URL.createObjectURL(f) : null
        };
      });

      if (multiple) {
        onChange([...files, ...newEntries]);
      } else {
        onChange(newEntries);
      }
    } catch (error) {
      console.error('[BOSFileUpload] Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── File Input Handler ──
  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = ''; // reset input
  };

  // ── Remove File ──
  const handleRemove = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  // ── Preview File ──
  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const fileCount = files.length;
  const atLimit = fileCount >= (multiple ? maxFiles : 1);

  const renderRightContent = () => {
    return (
      <>
        {/* ── Add More Files Button when Dropzone is Hidden ── */}
        {hideDropzoneOnUpload && fileCount > 0 && !atLimit && !disabled && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Attached Files
            </Typography>
          </Box>
        )}

        {/* ── Upload Progress ── */}
        {uploading && (
          <Box sx={{ mt: 1.5, width: '100%' }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': { borderRadius: 3 }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Uploading... {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}

        {/* ── File List ── */}
        {!hideFileList && fileCount > 0 && (
          <Box sx={{
            display: (candidatePortalLayout || gridColumns) ? 'grid' : 'flex',
            gridTemplateColumns: gridColumns 
              ? { xs: '1fr', sm: gridColumns >= 3 ? 'repeat(2, minmax(0, 1fr))' : '1fr', md: `repeat(${gridColumns}, minmax(0, 1fr))` } 
              : (candidatePortalLayout ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : undefined),
            flexDirection: (candidatePortalLayout || gridColumns) ? undefined : (inlineList ? 'row' : 'column'),
            flexWrap: inlineList ? 'wrap' : 'nowrap',
            gap: compact ? 1 : 1.5,
            mt: (sideBySide || inlineList) ? 0 : (compact ? 0 : 1.5),
            pr: 0.5,
            width: inlineList ? 'auto' : '100%',
            flex: inlineList ? '1 1 auto' : undefined,
            minWidth: 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            overflowY: maxListHeight ? 'auto' : 'hidden',
            maxHeight: maxListHeight || 'none',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 4 }
          }}>
            {files.map((file, i) => {
              const path = file ? (typeof file === 'string' ? file : (file.serverFileName || file.path || file.filePath)) : null;
              const rawName = (path && resolvedNames[path]) || (file ? (typeof file === 'string' ? file : (file.fileName || file.name || file.originalFileName || file.serverFileName || file.path)) : null) || 'Unknown';
              const name = getCleanFileName(rawName);
              const displayName = getDisplayName(name);
              const FileIcon = getFileIcon(name);
              const isOnServer = file && (typeof file === 'object' ? (file.isServer || file.serverFileName || file.path || file.filePath) : true);
              const fileKey = file
                ? `${file.attachmentType || (file.readonly || file.readOnly ? 'GATE_ENTRY' : 'FILE')}-${file.id != null ? file.id : ''}-${path || name}-${i}`
                : `file-${i}`;

              if (candidatePortalLayout) {
                return (
                  <Box
                    key={fileKey}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      p: 1,
                      px: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      boxSizing: 'border-box',
                      width: '100%',
                      minWidth: 0,
                      marginLeft: 0,
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        borderColor: 'primary.light',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1)
                      }}>
                        {['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(name.split('.').pop()?.toLowerCase()) ? (
                          <SecureThumbnail
                            src={file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath)}
                            alt={name}
                            fallback={<FileIcon size={16} color={theme.palette.primary.main} />}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <FileIcon size={16} color={theme.palette.primary.main} />
                        )}
                        <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                          <FileIcon size={16} color={theme.palette.primary.main} />
                        </Box>
                      </Box>
                      <Tooltip title={name} arrow placement="top">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'text.primary',
                            fontSize: '0.8rem',
                            flexShrink: 1,
                            minWidth: 0
                          }}
                        >
                          {name}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Tooltip title="View Document" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(file);
                          }}
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' }
                          }}
                        >
                          <IconEye size={14} />
                        </IconButton>
                      </Tooltip>
                      {!disabled && (
                        <Tooltip title="Delete Document" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(i);
                            }}
                            sx={{
                              p: 0.5,
                              borderRadius: 1,
                              bgcolor: alpha(theme.palette.error.main, 0.08),
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.main', color: 'white' }
                            }}
                          >
                            <IconTrash size={14} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                );
              }

              if (compact && !compactDropzoneOnly) {
                const shortenedName = getCompactDisplayName(name);
                return (
                  <Box
                    key={fileKey}
                    onClick={() => handlePreview(file)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.4,
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: error ? 'error.main' : themeColors.border,
                      bgcolor: themeColors.bg,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      width: (sideBySide || verticalList) ? '100%' : '190px',
                      maxWidth: '100%',
                      minHeight: '74px',
                      height: 'auto',
                      flexShrink: 0,
                      minWidth: 0,
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`
                      },
                      '&:hover .file-actions-overlay': {
                        opacity: 1
                      }
                    }}
                  >
                    {/* Top: File Icon or Thumbnail */}
                    <Box sx={{
                      width: 28, height: 28, borderRadius: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.15)
                    }}>
                      {['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(name.split('.').pop()?.toLowerCase()) ? (
                        <SecureThumbnail
                          src={file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath)}
                          alt={name}
                          name={name}
                          hoverPreview={true}
                          fallback={<FileIcon size={16} color={theme.palette.primary.main} />}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <FileIcon size={16} color={theme.palette.primary.main} />
                      )}
                      <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <FileIcon size={16} color={theme.palette.primary.main} />
                      </Box>
                    </Box>

                    {/* Middle: Shortened filename */}
                    <Tooltip title={name} arrow placement="top">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap !important',
                          wordBreak: 'normal !important',
                          overflowWrap: 'normal !important',
                          overflow: 'hidden !important',
                          textOverflow: 'ellipsis !important',
                          color: 'text.primary',
                          fontSize: '0.72rem',
                          lineHeight: 1.2,
                          maxWidth: '90%',
                          textAlign: 'center'
                        }}
                      >
                        {shortenedName}
                      </Typography>
                    </Tooltip>

                    {/* Bottom: Saved indicator */}
                    {isOnServer && (
                      <Chip
                        label="Saved"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700, px: 0.5, flexShrink: 0 }}
                      />
                    )}

                    {/* Overlay: Action buttons visible on hover */}
                    <Box
                      className="file-actions-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: appColorScheme === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        borderRadius: 2
                      }}
                    >
                      <Tooltip title="View Document" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(file);
                          }}
                          sx={{
                            p: 0.5,
                            borderRadius: 1,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }}
                        >
                          <IconEye size={14} />
                        </IconButton>
                      </Tooltip>

                      {!disabled && !file.readonly && !file.readOnly && (
                        <Tooltip title="Delete Document" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(i);
                            }}
                            sx={{
                              p: 0.5,
                              borderRadius: 1,
                              bgcolor: 'error.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'error.dark' }
                            }}
                          >
                            <IconTrash size={14} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                );
              }

              return (
                <Box
                  key={fileKey}
                  onClick={() => handlePreview(file)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    flex: inlineList ? '0 0 auto' : '1 1 100%',
                    flexShrink: 0,
                    width: inlineList ? 'auto' : '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
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
                  {isOnServer && (
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0,
                      width: 3, height: '100%',
                      bgcolor: 'success.main'
                    }} />
                  )}

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
                      <SecureThumbnail
                        src={file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath)}
                        alt={name}
                        name={name}
                        hoverPreview={true}
                        fallback={<FileIcon size={20} color={theme.palette.primary.main} />}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileIcon size={20} color={theme.palette.primary.main} />
                    )}
                    {/* Fallback icon if image fails to load */}
                    <Box sx={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <FileIcon size={20} color={theme.palette.primary.main} />
                    </Box>
                  </Box>

                  {/* File Info */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Tooltip title={getDisplayName(name, 1000)} arrow placement="top">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          whiteSpace: 'nowrap !important',
                          wordBreak: 'normal !important',
                          overflowWrap: 'normal !important',
                          overflow: 'hidden !important',
                          textOverflow: 'ellipsis !important',
                          display: 'block',
                          color: 'text.primary'
                        }}
                      >
                        {displayName}
                      </Typography>
                    </Tooltip>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {file.fileSize && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.fileSize)}
                        </Typography>
                      )}
                      {isOnServer && (
                        <Chip
                          label="Saved"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    <Tooltip title="Preview" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(file);
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.main', color: 'white' }
                        }}
                      >
                        <IconEye size={16} />
                      </IconButton>
                    </Tooltip>
                    {!disabled && !file.readonly && !file.readOnly && (
                      <Tooltip title="Remove" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(i);
                          }}
                          sx={{
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.main', color: 'white' }
                          }}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              );
            })}
            
            {verticalList && !atLimit && !disabled && (
              <Button
                variant="text"
                color="primary"
                size="small"
                startIcon={<IconCloudUpload size={16} />}
                onClick={() => {
                  const input = document.getElementById(`bos-file-upload-${module || 'default'}`);
                  if (input) input.click();
                }}
                sx={{ mt: 1, alignSelf: 'flex-start' }}
              >
                + Add more files
              </Button>
            )}
          </Box>
        )}

        {/* ── Count Badge ── */}
        {multiple && fileCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {fileCount} of {maxFiles} file{maxFiles > 1 ? 's' : ''} uploaded
          </Typography>
        )}
      </>
    );
  };

  return (
    <Box sx={{
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      ...(inlineList && {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5
      }),
      ...(sideBySide && {
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: 'flex-start'
      }),
      ...sx
    }}>
      {/* ── Drop Zone ── */}
      {!hideDropzone && (!atLimit || disabled) && !(hideDropzoneOnUpload && fileCount > 0) && (
        <Box sx={{
          display: 'flex',
          flexDirection: verticalDropzones ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'stretch',
          width: inlineList ? 'auto' : '100%',
          flex: inlineList ? '0 0 auto' : undefined,
          minWidth: 0,
          ...(sideBySide && {
            flex: { xs: '1 1 100%', md: '1 1 50%' },
            width: 'auto'
          })
        }}>
            <Box
            onDragEnter={!disabled ? handleDrag : undefined}
            onDragLeave={!disabled ? handleDrag : undefined}
            onDragOver={!disabled ? handleDrag : undefined}
            onDrop={!disabled ? handleDrop : undefined}
            onPaste={!disabled ? handlePasteFiles : undefined}
            onMouseEnter={() => { dropzoneHoveredRef.current = true; }}
            onMouseLeave={() => { dropzoneHoveredRef.current = false; }}
            tabIndex={disabled ? -1 : 0}
            component={disabled ? 'div' : 'label'}
            sx={{
              flex: inlineList ? '0 0 200px' : (verticalDropzones ? '0 0 auto' : '1 1 140px'),
              width: inlineList ? '200px' : (verticalDropzones ? '100%' : 'auto'),
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: compact ? 0.5 : 1,
              p: compact ? 1 : 3,
              border: '2px dashed',
              borderColor: themeColors.border,
              borderRadius: 2,
              bgcolor: themeColors.bg,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.25s ease',
              outline: 'none',
              '&:focus-visible': !disabled ? {
                borderColor: 'primary.main',
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
              } : {},
              '&:hover': !disabled ? {
                borderColor: themeColors.hoverBorder,
                bgcolor: themeColors.hoverBg
              } : {},
              '&:active': !disabled ? {
                borderColor: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                transform: 'scale(0.99)'
              } : {}
            }}
          >
            {!disabled && (
              <input
                id={`bos-file-upload-${module || 'default'}`}
                type="file"
                style={{ display: 'block', width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                multiple={multiple}
                accept={accept && accept !== '*' ? accept : undefined}
                onChange={handleInputChange}
              />
            )}
            <Box sx={{
              p: compact ? 0.5 : 1.5,
              borderRadius: '50%',
              bgcolor: themeColors.iconBg,
              display: 'flex'
            }}>
              {IconComponent ? (
                <IconComponent
                  size={compact ? 18 : 32}
                  color={themeColors.iconColor}
                  stroke={1.5}
                />
              ) : (
                <IconCloudUpload
                  size={compact ? 18 : 32}
                  color={themeColors.iconColor}
                  stroke={1.5}
                />
              )}
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant={compact ? 'body2' : 'subtitle2'} fontWeight={600} color={error ? 'error.main' : (disabled ? 'text.disabled' : 'text.primary')} sx={{ fontSize: compact ? '0.75rem' : undefined, lineHeight: compact ? 1.2 : undefined }}>
                {label} {disabled && '(Disabled)'}
              </Typography>
              <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'} sx={{ fontSize: compact ? '0.65rem' : undefined, lineHeight: compact ? 1.1 : undefined, display: 'block', mt: 0.2 }}>
                {disabled ? (helperText || 'Upload is disabled') : (helperText || `Drag & drop, paste (Ctrl+V) or click • ${multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max ${maxSizeMB}MB each`)}
              </Typography>
            </Box>
          </Box>

          {scan && !disabled && (
            <Box
              onClick={() => setScanOpen(true)}
              sx={{
                flex: verticalDropzones ? '0 0 auto' : '1 1 140px',
                width: verticalDropzones ? '100%' : 'auto',
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
                bgcolor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                '&:hover': {
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
          )}
        </Box>
      )}

      {/* ── Right Column Container if sideBySide is active ── */}
      {sideBySide ? (
        <Box sx={{
          flex: { xs: '1 1 100%', md: '1 1 50%' },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          width: '100%',
          minWidth: 0
        }}>
          {renderRightContent()}
        </Box>
      ) : (
        renderRightContent()
      )}

      {/* ── Universal Preview Dialog ── */}
      <BOSFilePreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        allFiles={files}
        onNavigate={(newFile) => setPreviewFile(newFile)}
      />

      {/* ── Direct Scan Dialog ── */}
      <Dialog
        open={scanOpen}
        onClose={scanning ? undefined : () => setScanOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' } }}
      >
        {/* ── Dialog Header ── */}
        <Box sx={{
          px: 3, py: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 42, height: 42, borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}>
              <IconScan size={22} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">Upload / Scan Document</Typography>
              <Typography variant="caption" color="text.secondary">Use camera, hardware scanner, or simulation</Typography>
            </Box>
          </Stack>
          {!scanning && (
            <IconButton
              onClick={() => setScanOpen(false)}
              sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
            >
              <IconX size={18} />
            </IconButton>
          )}
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', height: '100%', minHeight: 480 }}>

            {/* ── LEFT PANEL: Controls ── */}
            <Box sx={{
              width: { xs: '100%', md: 300 },
              flexShrink: 0,
              borderRight: { md: '1px solid' },
              borderColor: 'divider',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: alpha(theme.palette.grey[100], 0.5),
              overflowY: 'auto'
            }}>
              {/* Connection Status Badge */}
              <Box sx={{
                p: 1.5, borderRadius: 2,
                border: '1px solid',
                borderColor: connectionStatus === 'connected' ? alpha(theme.palette.success.main, 0.3)
                  : connectionStatus === 'connecting' ? alpha(theme.palette.info.main, 0.3)
                  : alpha(theme.palette.error.main, 0.2),
                bgcolor: connectionStatus === 'connected' ? alpha(theme.palette.success.main, 0.06)
                  : connectionStatus === 'connecting' ? alpha(theme.palette.info.main, 0.06)
                  : alpha(theme.palette.grey[500], 0.06),
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {connectionStatus === 'connecting' && <CircularProgress size={14} color="info" />}
                  {connectionStatus === 'connected' && (
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />
                  )}
                  {connectionStatus === 'failed' && (
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }} />
                  )}
                  <Typography variant="caption" fontWeight={700} color={
                    connectionStatus === 'connected' ? 'success.dark'
                    : connectionStatus === 'connecting' ? 'info.dark'
                    : 'error.dark'
                  }>
                    Scan Agent: {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting…' : 'Not Running'}
                  </Typography>
                </Stack>
                {connectionStatus === 'failed' && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', lineHeight: 1.4 }}>
                    Launch the <strong>ERP Scan Client</strong> on your desktop to enable hardware scanning.
                  </Typography>
                )}
              </Box>

              {/* ── Scanner / Camera Controls ── */}
              {connectionStatus === 'connected' ? (
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>Hardware Scanner</Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Scanning Device</InputLabel>
                    <Select value={selectedDevice} label="Scanning Device" onChange={(e) => setSelectedDevice(e.target.value)}>
                      {devices.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Resolution (DPI)</InputLabel>
                    <Select value={scanDpi} label="Resolution (DPI)" onChange={(e) => setScanDpi(e.target.value)}>
                      <MenuItem value={150}>150 DPI — Fast</MenuItem>
                      <MenuItem value={200}>200 DPI — Recommended</MenuItem>
                      <MenuItem value={300}>300 DPI — High Quality</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Color Mode</InputLabel>
                    <Select value={scanColorMode} label="Color Mode" onChange={(e) => setScanColorMode(e.target.value)}>
                      <MenuItem value="Color">Full Color</MenuItem>
                      <MenuItem value="Grayscale">Grayscale</MenuItem>
                      <MenuItem value="BlackAndWhite">Black & White</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" color="primary" onClick={handleTriggerScan}
                    disabled={scanning || !selectedDevice} startIcon={<IconScan size={16} />} fullWidth
                    sx={{ mt: 0.5, fontWeight: 700, borderRadius: 2 }}>
                    {scanning ? 'Scanning…' : 'Trigger Machine Scan'}
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>Capture Options</Typography>

                  <Button
                    variant={cameraActive ? 'contained' : 'outlined'}
                    color={cameraActive ? 'error' : 'primary'}
                    onClick={() => { if (cameraActive) stopCamera(); else startCamera(); }}
                    startIcon={<IconCamera size={16} />}
                    fullWidth
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    {cameraActive ? 'Stop Camera' : 'Use Camera Scanner'}
                  </Button>

                  <Button variant="outlined" color="secondary" onClick={handleDemoScan} disabled={scanning}
                    startIcon={<IconDevices size={16} />} fullWidth sx={{ borderRadius: 2, fontWeight: 700 }}>
                    {scanning ? 'Generating…' : 'Simulate Scan (Demo)'}
                  </Button>

                  <Button variant="text" size="small" onClick={() => setConnectionStatus('connecting')}
                    startIcon={<IconRefresh size={13} />} sx={{ alignSelf: 'center', fontSize: '0.72rem' }}>
                    Retry Connection
                  </Button>
                </Stack>
              )}

              {/* Camera Filter & Capture (only when camera is active) */}
              {cameraActive && (
                <Stack spacing={1.5}>
                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>Capture Settings</Typography>
                  {cameraDevices.length > 1 && (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Select Camera</InputLabel>
                      <Select value={selectedCamera} label="Select Camera"
                        onChange={(e) => { setSelectedCamera(e.target.value); startCamera(e.target.value); }}>
                        {cameraDevices.map(d => (
                          <MenuItem key={d.deviceId} value={d.deviceId}>
                            {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <FormControl size="small" fullWidth>
                    <InputLabel>Scan Filter</InputLabel>
                    <Select value={cameraFilter} label="Scan Filter" onChange={(e) => setCameraFilter(e.target.value)}>
                      <MenuItem value="Original">Original (Photo)</MenuItem>
                      <MenuItem value="Grayscale">Grayscale Document</MenuItem>
                      <MenuItem value="High Contrast B&W">High Contrast B&W</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" color="success" disabled={scanning || !!cameraError}
                    onClick={handleCapture} startIcon={<IconCheck size={16} />} fullWidth
                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.9rem' }}>
                    Capture Page
                  </Button>
                </Stack>
              )}

              {scanError && <Alert severity="error" sx={{ fontSize: '0.75rem' }}>{scanError}</Alert>}
            </Box>

            {/* ── RIGHT PANEL: Preview ── */}
            <Box sx={{
              flexGrow: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              bgcolor: 'background.default',
              position: 'relative',
            }}>
              {cameraActive ? (
                <Box sx={{
                  width: '100%', height: '100%', maxHeight: 420,
                  borderRadius: 2, overflow: 'hidden',
                  border: '3px solid', borderColor: 'primary.main',
                  bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
                }}>
                  {cameraError ? (
                    <Stack alignItems="center" spacing={1}>
                      <IconX size={32} color={theme.palette.error.main} />
                      <Typography color="error" variant="body2" align="center">{cameraError}</Typography>
                    </Stack>
                  ) : (
                    <video ref={videoRef} autoPlay playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  )}
                </Box>
              ) : scanning ? (
                <Stack spacing={2.5} alignItems="center">
                  <CircularProgress size={56} thickness={3} color="secondary" />
                  <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                    Processing document…
                  </Typography>
                </Stack>
              ) : (
                <Stack alignItems="center" spacing={2} sx={{ opacity: 0.45 }}>
                  <Box sx={{
                    width: 120, height: 120, borderRadius: '50%',
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed', borderColor: alpha(theme.palette.primary.main, 0.15)
                  }}>
                    <IconScan size={56} color={theme.palette.primary.main} stroke={1} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 280, lineHeight: 1.6 }}>
                    {connectionStatus === 'connected'
                      ? 'Scanner connected. Load paper into feeder and trigger scan from the left panel.'
                      : 'Choose a capture method from the left panel to begin.'}
                  </Typography>
                </Stack>
              )}
            </Box>

          </Box>
        </DialogContent>

        <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="error" onClick={() => setScanOpen(false)} disabled={scanning}
            sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

BOSFileUpload.propTypes = {
  files: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  module: PropTypes.string,
  multiple: PropTypes.bool,
  accept: PropTypes.string,
  maxFiles: PropTypes.number,
  maxSizeMB: PropTypes.number,
  disabled: PropTypes.bool,
  compact: PropTypes.bool,
  label: PropTypes.string,
  helperText: PropTypes.string,
  hideDropzone: PropTypes.bool,
  scan: PropTypes.bool,
  maxListHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  colorScheme: PropTypes.string,
  sideBySide: PropTypes.bool,
  onLimitExceeded: PropTypes.func,
  candidatePortalLayout: PropTypes.bool,
  sx: PropTypes.object
};
