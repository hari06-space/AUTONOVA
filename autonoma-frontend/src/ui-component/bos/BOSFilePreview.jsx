import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconX,
  IconDownload,
  IconExternalLink,
  IconFileDescription,
  IconPhoto,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconFileText,
  IconPrinter,
  IconChevronLeft,
  IconChevronRight,
  IconZoomIn,
  IconZoomOut,
  IconFocus2,
  IconPresentation
} from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { sanitizeHTML } from 'utils/sanitize';
import * as XLSX from 'xlsx';
import { getFileViewUrl, getFileDownloadUrl } from 'utils/upload-helper';
import { getCleanFileName } from './BOSUtils';

/**
 * ═══════════════════════════════════════════════════════════════
 * BOSFilePreview — Universal Document Preview Dialog
 * ═══════════════════════════════════════════════════════════════
 */

const decodeMimeWord = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/=\?([A-Za-z0-9-_]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const binStr = atob(text.replace(/\s/g, ''));
        const bytes = Uint8Array.from(binStr, c => c.charCodeAt(0));
        return new TextDecoder(charset || 'utf-8').decode(bytes);
      } else if (encoding.toUpperCase() === 'Q') {
        const decodedHex = text
          .replace(/_/g, ' ')
          .replace(/=([0-9A-Fa-f]{2})/g, (__, hex) => String.fromCharCode(parseInt(hex, 16)));
        return decodedHex;
      }
    } catch (e) {
      return text;
    }
    return text;
  });
};

const decodeQuotedPrintable = (str, charset = 'utf-8') => {
  if (!str) return '';
  const cleaned = str.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '=' && i + 2 < cleaned.length && /[0-9A-Fa-f]{2}/.test(cleaned.substring(i + 1, i + 3))) {
      bytes.push(parseInt(cleaned.substring(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(cleaned.charCodeAt(i));
    }
  }
  try {
    return new TextDecoder(charset || 'utf-8').decode(new Uint8Array(bytes));
  } catch (e) {
    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    } catch (e2) {
      return cleaned.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    }
  }
};

const decodeBase64Text = (str, charset = 'utf-8') => {
  if (!str) return '';
  try {
    const binStr = atob(str.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binStr, c => c.charCodeAt(0));
    return new TextDecoder(charset || 'utf-8').decode(bytes);
  } catch (e) {
    try {
      return atob(str.replace(/\s/g, ''));
    } catch (e2) {
      return str;
    }
  }
};

const sanitizeEmailHtml = (dirtyHtml) => {
  if (!dirtyHtml) return '';
  return DOMPurify.sanitize(dirtyHtml, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style', 'head', 'meta', 'link', 'tbody', 'thead', 'tfoot', 'colgroup', 'col', 'center', 'font', 'o:p', 'xml'],
    ADD_ATTR: ['target', 'style', 'src', 'href', 'class', 'id', 'align', 'valign', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'bgcolor', 'color', 'size', 'face'],
    ALLOW_DATA_ATTR: true,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
};

const parseHeaders = (rawHeadersBlock) => {
  if (!rawHeadersBlock) return {};
  const lines = rawHeadersBlock.split(/\r?\n/);
  const headers = {};
  let currentHeader = '';

  for (const line of lines) {
    if (!line.trim() && !currentHeader) continue; // Skip leading blank lines before headers
    if (!line.trim() && currentHeader) break; // Empty line ends the header section

    const match = line.match(/^([A-Za-z0-9-_]+):\s*(.*)$/);
    if (match) {
      currentHeader = match[1].toLowerCase();
      headers[currentHeader] = match[2].trim();
    } else if (currentHeader && (line.startsWith(' ') || line.startsWith('\t'))) {
      headers[currentHeader] += ' ' + line.trim();
    }
  }
  return headers;
};

const parseEml = (emlText) => {
  if (typeof emlText !== 'string') {
    return { subject: '(Invalid Format)', from: '', to: '', date: '', body: 'Unable to parse email content.', isHtml: false };
  }

  // 1. Split top-level headers and body
  const headerEndIndex = emlText.search(/\r?\n\r?\n/);
  let rawHeaders = '';
  let rawBody = '';
  if (headerEndIndex !== -1) {
    rawHeaders = emlText.substring(0, headerEndIndex);
    rawBody = emlText.substring(headerEndIndex).replace(/^\r?\n\r?\n/, '');
  } else {
    rawHeaders = emlText;
    rawBody = '';
  }

  const topHeaders = parseHeaders(rawHeaders);
  const subject = decodeMimeWord(topHeaders['subject']) || '(No Subject)';
  const from = decodeMimeWord(topHeaders['from']) || '(No Sender)';
  const to = decodeMimeWord(topHeaders['to']) || '';
  const date = decodeMimeWord(topHeaders['date']) || '';
  const topContentType = topHeaders['content-type'] || 'text/plain';

  let extractedHtml = '';
  let extractedText = '';
  const cidMap = {};

  // Extract all boundaries defined across headers or present in the body
  const boundaryList = [];
  const findBoundaries = (text) => {
    const regex = /boundary="?([^";\s\r\n]+)"?/gi;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const b = m[1].replace(/^["']|["']$/g, '').trim();
      if (b && !boundaryList.includes(b)) boundaryList.push(b);
    }
  };
  findBoundaries(rawHeaders);
  findBoundaries(rawBody);

  // Process a single MIME leaf part
  const processLeafPart = (headers, bodyStr) => {
    if (!bodyStr || !bodyStr.trim()) return;
    const contentType = (headers['content-type'] || 'text/plain').toLowerCase();
    const encoding = (headers['content-transfer-encoding'] || '').toLowerCase();
    const contentId = (headers['content-id'] || '').replace(/[<>]/g, '').trim();
    const contentDisp = (headers['content-disposition'] || '').toLowerCase();
    const charsetMatch = contentType.match(/charset="?([^";\s]+)"?/i);
    const charset = charsetMatch ? charsetMatch[1].toLowerCase() : 'utf-8';

    const isBase64 = encoding.includes('base64');
    const isQuotedPrintable = encoding.includes('quoted-printable');

    // If it's an image or attached media (or has content-id with image extension):
    if (contentType.startsWith('image/') || contentId.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)/i) || (headers['content-disposition'] || '').match(/filename="?[^"]+\.(jpg|jpeg|png|gif|bmp|webp|svg)"?/i)) {
      const cleanB64 = bodyStr.replace(/[^A-Za-z0-9+/=]/g, '');
      const mimeMatch = contentType.match(/image\/[a-zA-Z0-9.+-]+/i);
      const mimeType = mimeMatch ? mimeMatch[0].toLowerCase() : 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${cleanB64}`;

      if (contentId) {
        cidMap[contentId] = dataUrl;
        const namePart = contentId.split('@')[0];
        if (namePart) cidMap[namePart] = dataUrl;
      }
      const nameMatch = (headers['content-disposition'] || contentType || '').match(/filename="?([^";\r\n]+)"?|name="?([^";\r\n]+)"?/i);
      if (nameMatch) {
        const fn = (nameMatch[1] || nameMatch[2] || '').replace(/["']/g, '').trim();
        if (fn) {
          cidMap[fn] = dataUrl;
          const fnNoExt = fn.split('.')[0];
          if (fnNoExt) cidMap[fnNoExt] = dataUrl;
        }
      }
      // Never treat an image part as text or body!
      return;
    }

    // Skip non-text attachments (pdf, docx, etc.) from being rendered as email body text
    if (contentType.startsWith('application/') || (contentDisp.includes('attachment') && !contentType.includes('text/'))) {
      return;
    }

    let decoded = bodyStr;
    if (isBase64) {
      decoded = decodeBase64Text(bodyStr, charset);
    } else if (isQuotedPrintable) {
      decoded = decodeQuotedPrintable(bodyStr, charset);
    } else {
      // Auto decode base64 if it is a solid base64 block
      const cleanCandidate = bodyStr.trim().replace(/\s/g, '');
      if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleanCandidate) && cleanCandidate.length >= 40 && cleanCandidate.length % 4 === 0) {
        try {
          const autoDec = decodeBase64Text(cleanCandidate, charset);
          if (autoDec && (/<[a-z][\s\S]*>/i.test(autoDec) || /[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(autoDec))) {
            decoded = autoDec;
          }
        } catch (e) {}
      }
    }

    if (contentType.includes('text/html') || /<html|<body|<table|<div|<p|<span/i.test(decoded)) {
      if (!extractedHtml || extractedHtml.length < decoded.length) {
        extractedHtml = decoded;
      }
    } else if (contentType.includes('text/plain')) {
      if (!extractedText) {
        extractedText = decoded;
      } else {
        extractedText += '\n\n' + decoded;
      }
    }
  };

  // Recursive multipart parser
  const parseMultipart = (headers, bodyStr) => {
    if (!bodyStr) return;
    const contentType = (headers['content-type'] || 'text/plain').toLowerCase();

    // Check if it's multipart
    let currentBoundary = null;
    const boundaryMatch = contentType.match(/boundary="?([^";\s\r\n]+)"?/i);
    if (boundaryMatch) {
      currentBoundary = boundaryMatch[1].replace(/^["']|["']$/g, '');
    } else {
      for (const b of boundaryList) {
        if (bodyStr.includes('--' + b)) {
          currentBoundary = b;
          break;
        }
      }
    }

    if (currentBoundary && bodyStr.includes('--' + currentBoundary)) {
      const parts = bodyStr.split('--' + currentBoundary);
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed || trimmed === '--') continue;

        const headerEnd = part.search(/\r?\n\r?\n/);
        let pHeadersBlock = '';
        let pBodyStr = '';
        if (headerEnd !== -1) {
          pHeadersBlock = part.substring(0, headerEnd);
          pBodyStr = part.substring(headerEnd).replace(/^\r?\n\r?\n/, '').replace(/--\s*$/, '');
        } else {
          // If no double newline found, inspect if part starts with headers
          const firstColon = part.indexOf(':');
          const firstNewline = part.indexOf('\n');
          if (firstColon !== -1 && firstColon < firstNewline && firstNewline !== -1) {
            const lines = part.split(/\r?\n/);
            let hEnd = 0;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(':') || (i > 0 && /^\s+/.test(lines[i]))) {
                hEnd = i + 1;
              } else {
                break;
              }
            }
            pHeadersBlock = lines.slice(0, hEnd).join('\n');
            pBodyStr = lines.slice(hEnd).join('\n');
          } else {
            pBodyStr = part.replace(/--\s*$/, '');
          }
        }

        const subHeaders = parseHeaders(pHeadersBlock);
        parseMultipart(subHeaders, pBodyStr);
      }
      return;
    }

    // Leaf part
    processLeafPart(headers, bodyStr);
  };

  parseMultipart(topHeaders, rawBody);

  let finalBody = '';
  let isHtml = false;

  if (extractedHtml) {
    let resolvedHtml = extractedHtml;

    // 1. Resolve all inline CID images (src="cid:...")
    resolvedHtml = resolvedHtml.replace(/src=["']?cid:([^"'\s>]+)["']?/gi, (match, cid) => {
      const cleanCid = cid.replace(/[<>]/g, '').trim();
      if (cidMap[cleanCid]) return `src="${cidMap[cleanCid]}"`;
      const namePart = cleanCid.split('@')[0];
      if (cidMap[namePart]) return `src="${cidMap[namePart]}"`;

      // Case-insensitive lookup across all keys
      const foundKey = Object.keys(cidMap).find(k => k.toLowerCase() === cleanCid.toLowerCase() || k.toLowerCase() === namePart.toLowerCase());
      if (foundKey) return `src="${cidMap[foundKey]}"`;

      // Match by filename extension or prefix
      const matchKey = Object.keys(cidMap).find(k => cleanCid.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cleanCid.toLowerCase()));
      if (matchKey) return `src="${cidMap[matchKey]}"`;

      return match;
    });

    // 2. Strip any dangling boundary markers or MIME headers that leaked into HTML
    resolvedHtml = resolvedHtml.replace(/--_[0-9A-Za-z_.-]+--?/g, '');
    resolvedHtml = resolvedHtml.replace(/Content-Type:\s*[^<\r\n]+/gi, '');
    resolvedHtml = resolvedHtml.replace(/Content-Transfer-Encoding:\s*[^<\r\n]+/gi, '');
    resolvedHtml = resolvedHtml.replace(/\[cid:[^\]]+\]/gi, '');

    finalBody = resolvedHtml;
    isHtml = true;
  } else if (extractedText) {
    let cleanText = extractedText;
    if (cleanText.includes('=3D') || cleanText.includes('=\n') || cleanText.includes('=\r\n')) {
      cleanText = decodeQuotedPrintable(cleanText);
    }
    // Clean ugly artifacts
    cleanText = cleanText.replace(/--_[0-9A-Za-z_.-]+--?/g, '');
    cleanText = cleanText.replace(/\[cid:[^\]]+\]/gi, '');

    if (/<html|<body|<div|<p|<table|<br/i.test(cleanText)) {
      finalBody = cleanText;
      isHtml = true;
    } else {
      finalBody = cleanText.trim();
      isHtml = false;
    }
  } else {
    // Fallback
    let decoded = rawBody;
    const encoding = (topHeaders['content-transfer-encoding'] || '').toLowerCase();
    if (encoding.includes('base64')) {
      decoded = decodeBase64Text(rawBody);
    } else if (encoding.includes('quoted-printable')) {
      decoded = decodeQuotedPrintable(rawBody);
    }
    finalBody = decoded.replace(/--_[0-9A-Za-z_.-]+--?/g, '').replace(/\[cid:[^\]]+\]/gi, '').trim();
    isHtml = topContentType.includes('text/html') || /<html|<body|<div|<p|<table|<br/i.test(finalBody);
  }

  return { subject, from, to, date, body: finalBody, isHtml };
};

const getFileCategory = (fileName) => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if ([
    'csv', 'txt', 'log', 'json', 'xml', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'htm', 'md',
    'yaml', 'yml', 'ini', 'conf', 'sql', 'sh', 'py', 'java', 'pem', 'key', 'cert', 'crt',
    'pub', 'env', 'properties', 'cfg', 'config', 'bash', 'zsh', 'c', 'cpp', 'cs', 'go', 'rs',
    'php', 'rb', 'bat', 'cmd', 'ps1', 'lock', 'toml'
  ].includes(ext)) return 'text';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio';
  if (['eml', 'msg'].includes(ext)) return 'email';
  return 'unknown';
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'image': return IconPhoto;
    case 'pdf': return IconFileTypePdf;
    case 'excel': return IconFileSpreadsheet;
    case 'word': return IconFileText;
    case 'powerpoint': return IconPresentation;
    case 'email': return IconFileText;
    default: return IconFileDescription;
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'image': return '#4caf50';
    case 'pdf': return '#f44336';
    case 'excel': return '#2e7d32';
    case 'word': return '#1565c0';
    case 'powerpoint': return '#e64a19';
    case 'video': return '#9c27b0';
    case 'audio': return '#ff9800';
    case 'email': return '#00acc1';
    default: return '#757575';
  }
};

export default function BOSFilePreview({
  open,
  onClose,
  file,
  url: directUrl,
  fileName: directFileName,
  allFiles = [],
  onNavigate,
  title
}) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [localBlobUrl, setLocalBlobUrl] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [docxBuffer, setDocxBuffer] = useState(null);
  const [docxRendering, setDocxRendering] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState(null);
  const [emlData, setEmlData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const docxContainerRef = useRef(null);
  const [resolvedFileName, setResolvedFileName] = useState('');

  // Pan state for zoomed images
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
  const containerRef = useRef(null);

  // Resolve props safely for both Object and String file types
  const currentFile = typeof file === 'string'
    ? { name: file, fileName: file, serverFileName: file, isServer: true }
    : (file || {});
  const isServer = typeof file === 'string' || (!currentFile.isLocalUrl && (currentFile.isServer || (currentFile.serverFileName && !currentFile.serverFileName.startsWith('blob:') && !currentFile.serverFileName.startsWith('data:'))));

  // Stability key to prevent unnecessary effect executions
  const fileKey = currentFile instanceof File
    ? `${currentFile.name}-${currentFile.size}-${currentFile.lastModified}`
    : `${currentFile.fileName || currentFile.name || ''}-${currentFile.serverFileName || ''}`;

  useEffect(() => {
    if (!open) return;
    const rawPath = currentFile.serverFileName || currentFile.filePath || (typeof file === 'string' ? file : '');
    if (rawPath && isServer && !currentFile.fileName && !currentFile.name) {
      axios.get(`/api/files/metadata?path=${encodeURIComponent(rawPath)}`)
        .then(res => {
          if (res.data && res.data.fileName && res.data.fileName.includes('.')) {
            setResolvedFileName(res.data.fileName);
          } else {
            setResolvedFileName('');
          }
        })
        .catch(() => {
          setResolvedFileName('');
        });
    } else {
      setResolvedFileName('');
    }
  }, [open, fileKey, isServer]);

  const rawFileName = currentFile.fileName || currentFile.name || directFileName || resolvedFileName || currentFile.serverFileName || (typeof file === 'string' ? file : '');
  const fileName = rawFileName ? rawFileName.split('|')[0] : 'Document';
  let category = overrideCategory || getFileCategory(fileName);
  const CategoryIcon = getCategoryIcon(category);
  const categoryColor = getCategoryColor(category);

  // Reset zoom and content states when file changes
  useEffect(() => {
    setZoom(1);
    setContent('');
    setSlides([]);
    setCurrentSlideIndex(0);
    setDocxBuffer(null);
    setBlobUrl('');
    setError('');
    setOverrideCategory(null);
    setEmlData(null);
  }, [currentFile.serverFileName, currentFile.fileName, directUrl]);

  // Manage local blob URL lifecycle for non-server files
  useEffect(() => {
    if (!open) return;
    let urlToRevoke = '';
    if (!directUrl && !isServer) {
      const fileObj = currentFile instanceof File ? currentFile : currentFile.file;
      if (fileObj instanceof File) {
        const url = URL.createObjectURL(fileObj);
        setLocalBlobUrl(url);
        urlToRevoke = url;
      }
    }
    return () => {
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
        setLocalBlobUrl('');
      }
    };
  }, [open, directUrl, isServer, fileKey]);

  // Strip UUID or numeric prefix for display
  const getDisplayName = (name, maxLength = 35) => {
    if (!name) return 'Document';
    const cleanName = getCleanFileName(name);

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
  const displayName = getDisplayName(fileName);

  let viewUrl = directUrl || currentFile.url || (isServer ? getFileViewUrl(currentFile.serverFileName || currentFile.name) : (localBlobUrl || currentFile.serverFileName));
  const downloadUrl = currentFile.url || (isServer ? getFileDownloadUrl(currentFile.serverFileName || currentFile.name) : viewUrl);

  const safeAllFiles = Array.isArray(allFiles) ? allFiles : [];
  const currentIndex = safeAllFiles.findIndex(f =>
    (f.serverFileName || f.fileName || f.name) === (currentFile.serverFileName || currentFile.fileName || currentFile.name)
  );
  const hasMultiple = safeAllFiles.length > 1;

  // ── Print Function ──
  const handlePrint = () => {
    const printUrl = blobUrl || viewUrl;
    if (category === 'pdf' || category === 'image') {
      const printWindow = window.open(printUrl, '_blank');
      printWindow?.focus();
      printWindow?.print();
    } else {
      window.print();
    }
  };

  // ── Navigation (Cyclic / Loop) ──
  const navigate = (direction) => {
    if (!onNavigate || !hasMultiple || safeAllFiles.length <= 1) return;
    const total = safeAllFiles.length;
    let nextIdx;
    if (direction === 'next') {
      nextIdx = (currentIndex + 1) % total;
    } else {
      nextIdx = (currentIndex - 1 + total) % total;
    }
    onNavigate(safeAllFiles[nextIdx], nextIdx);
  };

  // ── Keyboard Arrows Navigation ──
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (category === 'powerpoint' && slides.length > 1) {
        if (e.key === 'ArrowLeft') {
          setCurrentSlideIndex(prev => Math.max(0, prev - 1));
          return;
        } else if (e.key === 'ArrowRight') {
          setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
          return;
        }
      }
      if (hasMultiple) {
        if (e.key === 'ArrowLeft') {
          navigate('prev');
        } else if (e.key === 'ArrowRight') {
          navigate('next');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, hasMultiple, currentIndex, allFiles, category, slides.length]);

  // ── Load secure file blob for PDFs and Images to resolve auth headers ──
  const loadFileBlob = useCallback(async () => {
    if (!open || !viewUrl) return;
    if (['word', 'excel', 'text', 'powerpoint', 'email'].includes(category)) return;

    setLoading(true);
    setError('');
    setBlobUrl('');

    try {
      if (viewUrl.startsWith('blob:')) {
        setBlobUrl(viewUrl);
      } else {
        const response = await axios.get(viewUrl, { responseType: 'arraybuffer' });
        const ext = (fileName || '').split('.').pop()?.toLowerCase();
        const mimeTypes = {
          pdf: 'application/pdf',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          bmp: 'image/bmp',
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          webm: 'audio/webm',
          ogg: 'audio/ogg',
          m4a: 'audio/mp4',
          aac: 'audio/aac',
          mp4: 'video/mp4',
          mov: 'video/quicktime',
          eml: 'message/rfc822',
          msg: 'application/vnd.ms-outlook'
        };
        
        const serverMime = response.headers['content-type'];
        // Use extension-based MIME if server is generic or undefined, otherwise honor correct server MIME
        const resolvedMime = (!serverMime || serverMime.includes('application/octet-stream') || serverMime.includes('octet-stream'))
          ? (mimeTypes[ext] || 'application/octet-stream')
          : serverMime;

        const blobData = new Blob([response.data], { type: resolvedMime });
        const localUrl = URL.createObjectURL(blobData);
        setBlobUrl(localUrl);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('File not found on server (404). The file may have been moved or deleted.');
      } else {
        console.error('[BOSFilePreview] Failed to load secure blob:', err);
        setError('Failed to load document preview. You can download the file locally to view it.');
      }
    } finally {
      setLoading(false);
    }
  }, [open, viewUrl, category, fileName]);

  useEffect(() => {
    if (!open) {
      setBlobUrl('');
      return;
    }
    if (!['word', 'excel', 'text', 'powerpoint', 'email'].includes(category)) {
      loadFileBlob();
    }
    return () => {
      setBlobUrl(prev => {
        if (prev && prev.startsWith('blob:') && !prev.startsWith(localBlobUrl)) {
          URL.revokeObjectURL(prev);
        }
        return '';
      });
    };
  }, [open, loadFileBlob, category, localBlobUrl]);

  // ── Convert Word/Excel to HTML ──
  const convertDocument = useCallback(async () => {
    if (!open || !viewUrl || !['word', 'excel'].includes(category)) return;

    setLoading(true);
    setContent('');
    setDocxBuffer(null);
    setError('');

    try {
      let arrayBuffer;
      if (viewUrl.startsWith('blob:')) {
        const blobRes = await fetch(viewUrl);
        arrayBuffer = await blobRes.arrayBuffer();
      } else {
        const response = await axios.get(viewUrl, { responseType: 'arraybuffer' });
        arrayBuffer = response.data;
      }

      if (arrayBuffer.byteLength < 1000) {
        const text = new TextDecoder().decode(arrayBuffer);
        if (text.includes('{"') || text.includes('message')) {
          console.error('[BOSFilePreview] Server returned error JSON:', text);
          throw new Error('Server error');
        }
      }

      if (category === 'word') {
        setDocxBuffer(arrayBuffer);
      } else if (category === 'excel') {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        setContent(XLSX.utils.sheet_to_html(firstSheet));
      }
    } catch (err) {
      console.error('[BOSFilePreview] Conversion failed:', err);
      setError('Failed to convert and preview document. Try downloading the original file.');
    } finally {
      setLoading(false);
    }
  }, [open, viewUrl, category]);

  // ── Load text files ──
  const loadTextContent = useCallback(async () => {
    if (!open || !viewUrl || category !== 'text') return;

    setLoading(true);
    setContent('');
    setError('');

    try {
      let textData;
      if (viewUrl.startsWith('blob:')) {
        const blobRes = await fetch(viewUrl);
        textData = await blobRes.text();
      } else {
        const response = await axios.get(viewUrl, { responseType: 'text' });
        textData = response.data;
      }
      setContent(`<pre style="white-space:pre-wrap;word-break:break-word;font-family:monospace;font-size:13px;line-height:1.6;padding:16px;">${textData}</pre>`);
    } catch {
      setError('Failed to load text file.');
    } finally {
      setLoading(false);
    }
  }, [open, viewUrl, category]);

  const adjustDocxScaling = useCallback(() => {
    if (!docxContainerRef.current) return;
    const container = docxContainerRef.current;
    const pages = container.querySelectorAll('.docx');
    if (!pages || pages.length === 0) return;

    // Available container width with safety padding
    const containerWidth = container.clientWidth - 48;
    if (containerWidth <= 0) return;

    window.requestAnimationFrame(() => {
      pages.forEach((page) => {
        // Clear any artificial wrappers if left over
        const rawWidth = parseFloat(page.style.width) || page.offsetWidth || 816;
        const rawHeight = parseFloat(page.style.height) || page.offsetHeight || 1056;

        const baseScale = containerWidth < rawWidth ? (containerWidth / rawWidth) : 1;
        const totalScale = Number((baseScale * zoom).toFixed(3));

        page.style.transform = `scale(${totalScale})`;
        page.style.transformOrigin = 'top center';
        page.style.marginBottom = `${-(rawHeight * (1 - totalScale)) + 24}px`;
      });
    });
  }, [zoom]);

  // ── Render DOCX document with docx-preview ──
  useEffect(() => {
    if (category === 'word' && docxBuffer && docxContainerRef.current) {
      setDocxRendering(true);
      docxContainerRef.current.innerHTML = '';
      import('docx-preview').then(({ renderAsync }) => {
        renderAsync(docxBuffer, docxContainerRef.current, null, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          experimental: true,
          useBase64URL: true,
          useMathMLPolyfill: true,
          showChanges: false,
          debug: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          trimXmlDeclaration: true
        }).then(() => {
          setDocxRendering(false);
          setTimeout(() => {
            adjustDocxScaling();
          }, 100);
        }).catch(err => {
          setDocxRendering(false);
          console.error("docx-preview failed:", err);
          setError("Failed to render DOCX document layout. Try downloading the file.");
        });
      }).catch(err => {
        setDocxRendering(false);
        console.error("Failed to load docx-preview package:", err);
        setError("Failed to load DOCX preview library.");
      });
    }
  }, [docxBuffer, category, adjustDocxScaling]);

  // ── Re-adjust docx scaling on zoom changes ──
  useEffect(() => {
    if (category === 'word' && docxBuffer) {
      adjustDocxScaling();
    }
  }, [zoom, category, docxBuffer, adjustDocxScaling]);

  // ── Document resizing and scaling management ──
  useEffect(() => {
    if (category !== 'word' || !docxBuffer) return;

    window.addEventListener('resize', adjustDocxScaling);

    let resizeObserver = null;
    if (docxContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        adjustDocxScaling();
      });
      resizeObserver.observe(docxContainerRef.current);
    }

    const timer = setTimeout(() => {
      adjustDocxScaling();
    }, 300);

    return () => {
      window.removeEventListener('resize', adjustDocxScaling);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timer);
    };
  }, [docxBuffer, category, adjustDocxScaling]);

  // ── Mouse Wheel & Trackpad Pinch Zoom Listener ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !open) return;

    const handleWheelZoom = (e) => {
      // Allow zoom on Ctrl+Wheel, Meta+Wheel, or Trackpad Pinch (which triggers wheel with ctrlKey)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom(prev => {
          const next = Math.min(3.0, Math.max(0.4, Number((prev + delta).toFixed(2))));
          return next;
        });
      }
    };

    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
  }, [open, category]);

  // ── Load PPTX slides from backend ──
  const loadPptxSlides = useCallback(async () => {
    if (!open || !viewUrl || category !== 'powerpoint') return;

    setLoading(true);
    setSlides([]);
    setCurrentSlideIndex(0);
    setError('');

    try {
      let response;
      if (viewUrl.startsWith('blob:')) {
        const fileObj = currentFile instanceof File ? currentFile : currentFile.file;
        const formData = new FormData();
        formData.append('file', fileObj);
        response = await axios.post(`${API_PATHS.FILES}/preview/pptx/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const relativePath = currentFile.serverFileName || currentFile.name || directFileName;
        response = await axios.get(`${API_PATHS.FILES}/preview/pptx?path=${encodeURIComponent(relativePath)}`);
      }
      if (response.data && Array.isArray(response.data)) {
        setSlides(response.data);
      } else {
        throw new Error('Invalid slides data returned');
      }
    } catch (err) {
      console.error('[BOSFilePreview] PPTX loading failed:', err);
      setError('Failed to load PowerPoint preview slides. Try downloading the original file.');
    } finally {
      setLoading(false);
    }
  }, [open, viewUrl, category, fileKey, directFileName]);

  // ── Load EML files ──
  const loadEmailContent = useCallback(async () => {
    if (!open || !viewUrl || category !== 'email') return;

    setLoading(true);
    setEmlData(null);
    setError('');

    try {
      const ext = (fileName || '').split('.').pop()?.toLowerCase();
      if (ext === 'msg') {
        let arrayBuffer;
        if (viewUrl.startsWith('blob:')) {
          const blobRes = await fetch(viewUrl);
          arrayBuffer = await blobRes.arrayBuffer();
        } else {
          const response = await axios.get(viewUrl, { responseType: 'arraybuffer' });
          arrayBuffer = response.data;
        }

        const MSGReader = (await import('msgreader')).default;
        const reader = new MSGReader(arrayBuffer);
        const fileData = reader.getFileData();
        if (fileData.error) {
          throw new Error(fileData.error);
        }

        const subject = fileData.subject || '(No Subject)';
        const from = fileData.senderName ? `${fileData.senderName} <${fileData.senderEmail || ''}>` : (fileData.senderEmail || '(No Sender)');
        const toList = (fileData.recipients || [])
          .filter(r => r.recipType === 'to')
          .map(r => r.name ? `${r.name} <${r.email || ''}>` : r.email)
          .join(', ');
        const date = fileData.headers ? fileData.headers.match(/Date:\s*(.*)/i)?.[1] || '' : '';
        const body = fileData.bodyHTML || fileData.body || '';
        const isHtml = !!fileData.bodyHTML;

        setEmlData({ subject, from, to: toList, date, body, isHtml });
      } else {
        // Try backend JavaMail EmlPreviewService first, fallback to client-side parser
        let loaded = false;
        try {
          let emlDto;
          if (viewUrl.startsWith('blob:')) {
            const fileObj = currentFile instanceof File ? currentFile : currentFile.file;
            if (fileObj) {
              const formData = new FormData();
              formData.append('file', fileObj);
              const backendRes = await axios.post(`${API_PATHS.FILES}/preview/eml/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              emlDto = backendRes.data;
            }
          } else {
            const relativePath = currentFile.serverFileName || currentFile.name || directFileName;
            if (relativePath) {
              const backendRes = await axios.get(`${API_PATHS.FILES}/preview/eml?path=${encodeURIComponent(relativePath)}`);
              emlDto = backendRes.data;
            }
          }

          if (emlDto && (emlDto.htmlBody || emlDto.textBody || emlDto.subject)) {
            setEmlData({
              subject: emlDto.subject || '(No Subject)',
              from: emlDto.from ? `${emlDto.from.name || ''} ${emlDto.from.email ? `<${emlDto.from.email}>` : ''}`.trim() : '(No Sender)',
              to: (emlDto.to || []).map(t => `${t.name || ''} ${t.email ? `<${t.email}>` : ''}`.trim()).filter(Boolean).join(', '),
              cc: (emlDto.cc || []).map(t => `${t.name || ''} ${t.email ? `<${t.email}>` : ''}`.trim()).filter(Boolean).join(', '),
              date: emlDto.date || '',
              body: emlDto.htmlBody || emlDto.textBody || '',
              isHtml: emlDto.isHtml || !!emlDto.htmlBody,
              attachments: emlDto.attachments || []
            });
            loaded = true;
          }
        } catch (backendErr) {
          console.warn('[BOSFilePreview] Backend EML parser fallback to client parser:', backendErr);
        }

        if (!loaded) {
          let textData;
          if (viewUrl.startsWith('blob:')) {
            const blobRes = await fetch(viewUrl);
            textData = await blobRes.text();
          } else {
            const response = await axios.get(viewUrl, { responseType: 'text' });
            textData = response.data;
          }
          const parsed = parseEml(textData);
          setEmlData(parsed);
        }
      }
    } catch (err) {
      console.error('[BOSFilePreview] Email loading failed:', err);
      setError('Failed to load email preview.');
    } finally {
      setLoading(false);
    }
  }, [open, viewUrl, category, fileName]);

  useEffect(() => {
    if (!open) {
      setContent('');
      setError('');
      return;
    }
    if (['word', 'excel'].includes(category)) convertDocument();
    if (category === 'text') loadTextContent();
    if (category === 'powerpoint') loadPptxSlides();
    if (category === 'email') loadEmailContent();
  }, [open, convertDocument, loadTextContent, loadPptxSlides, loadEmailContent, category]);

  // Panning functionality for Zoomed Image
  const handleMouseDown = (e) => {
    if (zoom <= 1 || !containerRef.current) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = scrollStart.left - dx;
    containerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // ── Touch Swipe Gesture Navigation (Mobile) ──
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const handleTouchStart = (e) => {
    touchEndRef.current = null;
    if (e.targetTouches && e.targetTouches.length > 0) {
      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.targetTouches && e.targetTouches.length > 0) {
      touchEndRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      };
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    const minSwipeDistance = 40;

    // Horizontal swipe must be dominant over vertical scroll
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > minSwipeDistance) {
      const isLeftSwipe = distanceX > 0;
      const isRightSwipe = distanceX < 0;

      if (isLeftSwipe) {
        if (hasMultiple) {
          navigate('next');
        }
      } else if (isRightSwipe) {
        if (hasMultiple) {
          navigate('prev');
        }
      }
    }
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: '92vh',
          height: '90vh'
        }
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          py: 1,
          px: { xs: 1.5, sm: 2 },
          gap: 1,
          bgcolor: title ? 'primary.main' : alpha(categoryColor, 0.05),
          color: title ? '#ffffff' : 'text.primary',
          borderBottom: '1px solid',
          borderColor: title ? 'primary.dark' : 'divider',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Top Header Row (Title) */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1.5,
              bgcolor: title ? 'rgba(255, 255, 255, 0.2)' : alpha(categoryColor, 0.12),
              display: 'flex',
              flexShrink: 0
            }}>
              <CategoryIcon size={20} color={title ? '#ffffff' : categoryColor} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={title || getDisplayName(fileName, 1000)} arrow placement="bottom-start">
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {title || displayName}
                </Typography>
              </Tooltip>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={category.toUpperCase()}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    bgcolor: title ? 'rgba(255, 255, 255, 0.2)' : alpha(categoryColor, 0.1),
                    color: title ? '#ffffff' : categoryColor
                  }}
                />
                {hasMultiple && (
                  <Typography variant="caption" color={title ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary'} fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                    {currentIndex + 1} / {allFiles.length}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: title ? '#ffffff' : 'text.secondary', flexShrink: 0, ml: 1, display: { xs: 'inline-flex', sm: 'none' } }}>
            <IconX size={20} />
          </IconButton>
        </Box>

        {/* Toolbar Controls Row */}
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: 'space-between', sm: 'flex-end' }} sx={{ width: { xs: '100%', sm: 'auto' }, pt: { xs: 0.5, sm: 0 }, borderTop: { xs: '1px solid rgba(255,255,255,0.1)', sm: 'none' } }}>
          {['word', 'image', 'excel', 'text', 'powerpoint'].includes(category) && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="Zoom Out (Ctrl + Wheel Down)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                    disabled={zoom <= 0.4}
                    sx={{ color: title ? '#ffffff' : 'inherit' }}
                  >
                    <IconZoomOut size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reset Zoom (Click to reset 100%)">
                <Chip
                  label={`${Math.round(zoom * 100)}%`}
                  size="small"
                  onClick={() => setZoom(1)}
                  sx={{
                    height: 22,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: title ? 'rgba(255, 255, 255, 0.2)' : alpha(categoryColor, 0.12),
                    color: title ? '#ffffff' : categoryColor,
                    border: '1px solid',
                    borderColor: title ? 'rgba(255, 255, 255, 0.3)' : alpha(categoryColor, 0.25),
                    '&:hover': {
                      bgcolor: title ? 'rgba(255, 255, 255, 0.3)' : alpha(categoryColor, 0.2)
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="Zoom In (Ctrl + Wheel Up)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setZoom(z => Math.min(3.0, Number((z + 0.15).toFixed(2))))}
                    disabled={zoom >= 3.0}
                    sx={{ color: title ? '#ffffff' : 'inherit' }}
                  >
                    <IconZoomIn size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reset Zoom">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setZoom(1)}
                    disabled={zoom === 1}
                    sx={{ color: title ? '#ffffff' : 'inherit' }}
                  >
                    <IconFocus2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}

          {hasMultiple && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Tooltip title="Previous File (Left Arrow)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => navigate('prev')}
                    sx={{ color: title ? '#ffffff' : categoryColor }}
                  >
                    <IconChevronLeft size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Next File (Right Arrow)">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => navigate('next')}
                    sx={{ color: title ? '#ffffff' : categoryColor }}
                  >
                    <IconChevronRight size={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )}

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Print Document">
              <IconButton size="small" onClick={handlePrint} color="inherit" sx={{ color: title ? '#ffffff' : 'inherit', display: { xs: 'none', sm: 'inline-flex' } }}><IconPrinter size={18} /></IconButton>
            </Tooltip>
            <Tooltip title="Close Preview">
              <IconButton onClick={onClose} size="small" sx={{ color: title ? '#ffffff' : 'text.secondary', flexShrink: 0, ml: 0.5, display: { xs: 'none', sm: 'inline-flex' } }}>
                <IconX size={20} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </DialogTitle>

      {/* ── Content Area with Sidebar ── */}
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: 'calc(90vh - 120px)',
          bgcolor: isDark ? 'background.default' : '#fafafa',
          overflow: 'hidden'
        }}
      >
        {/* Left Sidebar File List Panel */}
        {hasMultiple && (
          <Box
            sx={{
              width: sidebarCollapsed ? 0 : { xs: '100%', md: 240 },
              minWidth: sidebarCollapsed ? 0 : { xs: '100%', md: 240 },
              maxHeight: { xs: 80, sm: 100, md: 'none' },
              flexShrink: 0,
              borderRight: { xs: 'none', md: sidebarCollapsed ? 'none' : '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              overflowX: { xs: 'auto', md: 'hidden' },
              overflowY: { xs: 'hidden', md: 'auto' },
              opacity: sidebarCollapsed ? 0 : 1,
              pointerEvents: sidebarCollapsed ? 'none' : 'auto',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&::-webkit-scrollbar': { height: 4, width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.divider, 0.2), borderRadius: 2 }
            }}
          >
            <Box sx={{ p: 1.5, px: 2, borderBottom: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                FILES ({allFiles.length})
              </Typography>
              <Tooltip title="Collapse Files List">
                <IconButton size="small" onClick={() => setSidebarCollapsed(true)} sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <IconChevronLeft size={16} />
                </IconButton>
              </Tooltip>
            </Box>
            {allFiles.map((f, idx) => {
              const fName = f.fileName || f.name || 'Document';
              const fCat = getFileCategory(fName);
              const FCatIcon = getCategoryIcon(fCat);
              const fCatColor = getCategoryColor(fCat);
              const isSelected = idx === currentIndex;

              return (
                <Box
                  key={idx}
                  onClick={() => onNavigate && onNavigate(f, idx)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: isSelected ? alpha(fCatColor, 0.08) : 'transparent',
                    borderLeft: { xs: 'none', md: '4px solid' },
                    borderBottom: { xs: isSelected ? `3px solid ${fCatColor}` : '3px solid transparent', md: 'none' },
                    borderColor: isSelected ? fCatColor : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: isSelected ? alpha(fCatColor, 0.08) : (isDark ? 'rgba(255,255,255,0.05)' : 'grey.50')
                    },
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: { xs: 150, sm: 180, md: 'none' },
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Box sx={{
                    p: 0.75,
                    borderRadius: 1.5,
                    bgcolor: alpha(fCatColor, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    flexShrink: 0,
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: isSelected ? `0 2px 8px ${alpha(fCatColor, 0.3)}` : 'none'
                  }}>
                    <FCatIcon size={18} color={fCatColor} />
                  </Box>
                  <Tooltip title={getDisplayName(fName, 1000)} arrow placement="right">
                    <Typography
                      variant="body2"
                      fontWeight={isSelected ? 700 : 500}
                      color={isSelected ? 'text.primary' : 'text.secondary'}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {getDisplayName(fName, 20)}
                    </Typography>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Main Preview Container */}
        <Box
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{
            flex: 1,
            display: (loading || error || (!content && category === 'unknown' && !slides.length)) ? 'flex' : 'block',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            position: 'relative',
            cursor: (category === 'image' && zoom > 1) ? (isDragging ? 'grabbing' : 'grab') : 'default',
            p: 0,
            bgcolor: (category === 'word' || category === 'powerpoint') ? (isDark ? 'background.default' : '#f0f2f5') : (isDark ? 'background.default' : '#fafafa'),
            filter: (isDark && ['word', 'pdf', 'excel', 'powerpoint', 'text', 'email'].includes(category)) ? 'invert(0.9) hue-rotate(180deg)' : 'none',
            transition: 'filter 0.2s ease',
            '@keyframes floatIcon': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-10px) rotate(2deg)' }
            },
            '@keyframes spinHalo': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            },
            '@keyframes pulseWave': {
              '0%': { transform: 'scale(0.92)', opacity: 0.8 },
              '50%': { transform: 'scale(1.2)', opacity: 0.15 },
              '100%': { transform: 'scale(0.92)', opacity: 0.8 }
            },
            '@keyframes pulseGlow': {
              '0%, 100%': { boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.4)' },
              '50%': { boxShadow: '0 16px 36px -2px rgba(2, 132, 199, 0.6)' }
            },
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(16px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            },
            '& img': {
              filter: (isDark && ['word', 'pdf', 'excel', 'powerpoint', 'text', 'email'].includes(category)) ? 'invert(0.9) hue-rotate(180deg)' : 'none',
              transition: 'filter 0.2s ease'
            }
          }}
        >
          {/* Floating Expand Sidebar Button when Collapsed */}
          {sidebarCollapsed && hasMultiple && (
            <Tooltip title="Expand Files List" placement="right">
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => setSidebarCollapsed(false)}
                startIcon={<IconChevronRight size={16} />}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: 16,
                  zIndex: 30,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 0.5,
                  px: 1.25
                }}
              >
                Files ({allFiles.length})
              </Button>
            </Tooltip>
          )}
          {category === 'word' && !error && (
            <Box
              ref={docxContainerRef}
              sx={{
                width: '100%',
                minHeight: '100%',
                display: (loading || docxRendering) ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: isDark ? 'background.default' : '#f0f2f5',
                p: 2,
                overflowX: 'auto',
                overflowY: 'auto',
                boxSizing: 'border-box',
                '& .docx-wrapper': {
                  padding: '24px 16px',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                  minWidth: 'fit-content',
                  width: '100%',
                  boxSizing: 'border-box'
                },
                '& .docx': {
                  background: '#ffffff',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)',
                  borderRadius: '2px',
                  boxSizing: 'border-box',
                  display: 'block',
                  margin: '0 auto 24px auto',
                  transition: 'transform 0.1s ease-out, margin-bottom 0.1s ease-out'
                }
              }}
            />
          )}

          {(loading || docxRendering) ? (
            <Stack alignItems="center" spacing={2} sx={{ m: 'auto' }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Loading document preview...
              </Typography>
            </Stack>
          ) : error ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 460,
                p: 4,
                m: 'auto',
                textAlign: 'center',
                maxWidth: 520,
                animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Floating Animated Error Icon Container */}
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 110,
                  height: 110,
                  mb: 3
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `2px solid ${alpha(theme.palette.error.main, 0.25)}`,
                    animation: 'pulseWave 3s ease-in-out infinite'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: '88%',
                    height: '88%',
                    borderRadius: '50%',
                    border: `2px dashed ${alpha(theme.palette.error.main, 0.5)}`,
                    animation: 'spinHalo 18s linear infinite'
                  }}
                />
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 3.5,
                    background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: `0 12px 24px -6px ${alpha(theme.palette.error.main, 0.5)}`,
                    animation: 'floatIcon 3.5s ease-in-out infinite',
                    zIndex: 1
                  }}
                >
                  <IconFileDescription size={38} color="#ffffff" stroke={1.75} />
                </Box>
              </Box>

              <Typography variant="h4" color="text.primary" fontWeight={700} sx={{ mb: 1 }}>
                No Inline Preview Available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 3, lineHeight: 1.6 }}>
                {error || 'An error occurred while generating the document preview. You can download the file locally to view it.'}
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center">
                {downloadUrl && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<IconDownload size={18} />}
                    onClick={() => window.open(downloadUrl, '_blank')}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
                      }
                    }}
                  >
                    Download File
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconFileText size={18} />}
                  onClick={() => setOverrideCategory('text')}
                  sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}
                >
                  View As Text
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              {/* Excel / Text — Rendered HTML */}
              {content && category !== 'word' && (
                <Box
                  sx={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.15s ease-out',
                    width: zoom > 1 ? `${100 * zoom}%` : '100%',
                    minWidth: 'fit-content'
                  }}
                >
                  <Box
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
                    sx={{
                      width: 'auto',
                      margin: '0',
                      textAlign: 'left',
                      bgcolor: '#ffffff',
                      color: '#0f172a',
                      p: 4,
                      boxShadow: 'none',
                      borderRadius: 0,
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      lineHeight: 1.6,
                      '& table': { borderCollapse: 'collapse', width: '100%', mb: 2, bgcolor: '#ffffff' },
                      '& th, & td': { border: '1px solid #cbd5e1', p: '8px 12px', fontSize: '0.85rem', color: '#0f172a' },
                      '& th': { bgcolor: '#f1f5f9', fontWeight: 700, color: '#0f172a' },
                      '& tr': { bgcolor: '#ffffff' },
                      '& tr:nth-of-type(even)': { bgcolor: '#f8fafc' },
                      '& tr:nth-of-type(even) td': { bgcolor: '#f8fafc' },
                      '& tr:nth-of-type(odd) td': { bgcolor: '#ffffff' },
                      '& h1, & h2, & h3, & h4': { color: '#0d9488', mb: 1.5 }
                    }}
                  />
                </Box>
              )}

              {/* PDF — iframe */}
              {!content && category === 'pdf' && blobUrl && (
                <iframe
                  title="PDF Preview"
                  src={blobUrl}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              )}

              {/* Image — native img with zoom */}
              {!content && category === 'image' && blobUrl && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100%',
                    p: 2
                  }}
                >
                  <Box
                    component="img"
                    src={blobUrl}
                    alt={displayName}
                    draggable={false}
                    sx={{
                      maxWidth: zoom > 1 ? 'none' : '100%',
                      maxHeight: zoom > 1 ? 'none' : 'calc(90vh - 160px)',
                      objectFit: 'contain',
                      borderRadius: 1,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      userSelect: 'none'
                    }}
                  />
                </Box>
              )}

              {/* Video — native video */}
              {!content && category === 'video' && blobUrl && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <video
                    controls
                    style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }}
                    src={blobUrl}
                  />
                </Box>
              )}

              {/* Audio — native audio */}
              {!content && category === 'audio' && blobUrl && (
                <Box sx={{ p: 4, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <audio controls style={{ width: '100%', maxWidth: '600px' }} src={blobUrl} />
                </Box>
              )}

              {/* PowerPoint — Client-Side Slide Renderer */}
              {category === 'powerpoint' && slides.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2, bgcolor: isDark ? 'background.default' : '#f0f2f5' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      width: '100%',
                      maxHeight: 'calc(90vh - 220px)',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={slides[currentSlideIndex]}
                      alt={`Slide ${currentSlideIndex + 1}`}
                      sx={{
                        maxWidth: zoom > 1 ? 'none' : '100%',
                        maxHeight: zoom > 1 ? 'none' : '100%',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                        objectFit: 'contain',
                        borderRadius: 1.5,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        bgcolor: 'background.paper'
                      }}
                    />

                    {/* Overlay navigation arrows for slides */}
                    {slides.length > 1 && (
                      <>
                        <IconButton
                          onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentSlideIndex === 0}
                          sx={{
                            position: 'absolute',
                            left: 16,
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'background.paper' },
                            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          <IconChevronLeft size={24} />
                        </IconButton>
                        <IconButton
                          onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                          disabled={currentSlideIndex === slides.length - 1}
                          sx={{
                            position: 'absolute',
                            right: 16,
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'background.paper' },
                            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                        >
                          <IconChevronRight size={24} />
                        </IconButton>
                      </>
                    )}
                  </Box>

                  {/* Slide navigation controls */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, py: 1, px: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      Slide {currentSlideIndex + 1} of {slides.length}
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ height: 16 }} />
                    <Stack direction="row" spacing={1}>
                      {slides.map((_, idx) => (
                        <Box
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: idx === currentSlideIndex ? categoryColor : 'grey.300',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              )}

              {/* Email — Rendered EML headers & body */}
              {category === 'email' && emlData && (
                <Box sx={{ p: 3, bgcolor: 'background.paper', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Email Headers Card */}
                  <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                        {emlData.subject}
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Typography variant="body2" color="text.secondary">
                          <strong>From:</strong> {emlData.from}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Date:</strong> {emlData.date}
                        </Typography>
                      </Stack>
                      {emlData.to && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>To:</strong> {emlData.to}
                        </Typography>
                      )}
                      {emlData.cc && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Cc:</strong> {emlData.cc}
                        </Typography>
                      )}
                      {emlData.attachments && emlData.attachments.length > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ pt: 1, borderTop: '1px dashed', borderColor: 'divider', mt: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">
                            Attachments ({emlData.attachments.length}):
                          </Typography>
                          {emlData.attachments.map((att, attIdx) => (
                            <Chip
                              key={attIdx}
                              icon={<IconPaperclip size={14} />}
                              label={`${att.filename || 'Attachment'} (${Math.round((att.size || 0) / 1024)} KB)`}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: 'background.paper' }}
                            />
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Box>

                  {/* Email Body */}
                  <Box sx={{ flex: 1, p: 0, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#ffffff', minHeight: '400px' }}>
                    {emlData.isHtml ? (
                      <iframe
                        title="Email Body HTML"
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;background:#ffffff;margin:0;padding:20px;word-break:break-word}img{max-width:100%;height:auto;vertical-align:middle}a{color:#1976d2;text-decoration:none}a:hover{text-decoration:underline}table{border-collapse:collapse}</style></head><body>${sanitizeEmailHtml(emlData.body)}</body></html>`}
                        style={{ width: '100%', minHeight: '560px', height: '100%', border: 'none', background: '#ffffff', display: 'block' }}
                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                      />
                    ) : (
                      <Typography
                        variant="body1"
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'inherit',
                          fontSize: '0.925rem',
                          lineHeight: 1.6,
                          color: 'text.primary',
                          p: 3
                        }}
                      >
                        {emlData.body}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Unknown or Unsupported File — Animated Floating Icon Card */}
              {!content && category === 'unknown' && !slides.length && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 460,
                    p: 4,
                    m: 'auto',
                    textAlign: 'center',
                    maxWidth: 520,
                    animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Floating Glowing Animated Icon Container */}
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 120,
                      height: 120,
                      mb: 3
                    }}
                  >
                    {/* Pulsing outer ring */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid rgba(2, 132, 199, 0.25)',
                        animation: 'pulseWave 3s ease-in-out infinite'
                      }}
                    />
                    {/* Rotating dashed orbital halo */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '88%',
                        height: '88%',
                        borderRadius: '50%',
                        border: '2px dashed rgba(2, 132, 199, 0.5)',
                        animation: 'spinHalo 18s linear infinite'
                      }}
                    />
                    {/* Central 3D floating icon badge */}
                    <Box
                      sx={{
                        width: 76,
                        height: 76,
                        borderRadius: 3.5,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        animation: 'floatIcon 3.5s ease-in-out infinite, pulseGlow 3s ease-in-out infinite',
                        zIndex: 1
                      }}
                    >
                      <IconFileDescription size={40} color="#ffffff" stroke={1.75} />
                    </Box>
                  </Box>

                  {/* Extension Pill Tag */}
                  {fileName.includes('.') && (
                    <Chip
                      label={'.' + fileName.split('.').pop()?.toUpperCase()}
                      size="small"
                      sx={{
                        mb: 1.5,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: 1.2,
                        bgcolor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        borderColor: '#bae6fd',
                        borderRadius: 1.5,
                        borderWidth: 1,
                        borderStyle: 'solid'
                      }}
                    />
                  )}

                  <Typography variant="h4" color="text.primary" fontWeight={700} sx={{ mb: 1 }}>
                    No Inline Preview Available
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 3, lineHeight: 1.6 }}>
                    This file format cannot be rendered directly in the visual viewer. You can download it locally or try viewing its raw text contents.
                  </Typography>

                  <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center">
                    {downloadUrl && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<IconDownload size={18} />}
                        onClick={() => window.open(downloadUrl, '_blank')}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          fontWeight: 700,
                          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)'
                          }
                        }}
                      >
                        Download File
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<IconFileText size={18} />}
                      onClick={() => setOverrideCategory('text')}
                      sx={{ borderRadius: 2, px: 2.5, fontWeight: 700 }}
                    >
                      View As Text
                    </Button>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'background.default' : '#fafafa', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, flexWrap: 'nowrap' }}>
        {/* Mobile Icon Buttons */}
        {downloadUrl && (
          <Tooltip title="Download File">
            <IconButton
              size="small"
              onClick={() => window.open(downloadUrl, '_blank')}
              color="primary"
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <IconDownload size={18} />
            </IconButton>
          </Tooltip>
        )}
        {viewUrl && (
          <Tooltip title="Open in New Tab">
            <IconButton
              size="small"
              onClick={() => window.open(viewUrl, '_blank')}
              color="primary"
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <IconExternalLink size={18} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Print Document">
          <IconButton
            size="small"
            onClick={handlePrint}
            color="primary"
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <IconPrinter size={18} />
          </IconButton>
        </Tooltip>

        {/* Desktop Text Buttons (Aligned Right next to Close) */}
        {downloadUrl && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconDownload size={16} />}
            onClick={() => window.open(downloadUrl, '_blank')}
            sx={{ fontWeight: 600, fontSize: '0.8rem', borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap !important', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Download
          </Button>
        )}
        {viewUrl && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<IconExternalLink size={16} />}
            onClick={() => window.open(viewUrl, '_blank')}
            sx={{ fontWeight: 600, fontSize: '0.8rem', borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap !important', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Open in New Tab
          </Button>
        )}

        {/* Close Button */}
        <Button variant="contained" onClick={onClose} sx={{ fontWeight: 700, borderRadius: 2, px: 3, fontSize: '0.8rem', textTransform: 'none', whiteSpace: 'nowrap !important' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

BOSFilePreview.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  file: PropTypes.shape({
    fileName: PropTypes.string,
    name: PropTypes.string,
    serverFileName: PropTypes.string,
    isServer: PropTypes.bool
  }),
  url: PropTypes.string,
  fileName: PropTypes.string,
  allFiles: PropTypes.array,
  onNavigate: PropTypes.func,
  title: PropTypes.string
};
