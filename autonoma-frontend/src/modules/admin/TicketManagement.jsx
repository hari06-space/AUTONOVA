import TextField from 'ui-component/CustomTextField';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// material-ui
import { Box, Grid, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Button, useTheme, Tooltip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, MenuItem, CircularProgress, Card, InputLabel, CardContent, Avatar, Autocomplete, TablePagination, InputBase, Select, FormControl, OutlinedInput, InputAdornment, Fab, Tabs, Tab, Collapse } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { setFilterConfig, resetFilters, setFilters } from 'store/slices/search';
import ReactQuillDemo from 'ui-component/third-party/ReactQuill';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import { BOSDataTable, BOSExportButton } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import { sanitizeHTML } from 'utils/sanitize';

// assets
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TicketIcon from '@mui/icons-material/ConfirmationNumber';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ReplayIcon from '@mui/icons-material/Replay';
import HistoryIcon from '@mui/icons-material/History';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MicIcon from '@mui/icons-material/Mic';
import MicNoneIcon from '@mui/icons-material/MicNone';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import ArchiveIcon from '@mui/icons-material/Archive';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TimerIcon from '@mui/icons-material/Timer';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    maxWidth: 'none',
    border: '1px solid #475569',
    borderRadius: '8px',
    boxShadow: theme.shadows[8],
    padding: theme.spacing(1.5),
  },
}));

// ==============================|| MINI CHART CARD ||============================== //

const HeaderStatCard = ({ title, count, color, icon }) => {
  const theme = useTheme();

  const chartOptions = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0 } },
    colors: [color],
    tooltip: { enabled: false }
  };

  return (
    <Paper elevation={1} sx={{
      p: 1,
      borderRadius: '8px',
      bgcolor: 'background.default',
      border: `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      height: 56,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
      }
    }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ zIndex: 1, position: 'relative' }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.15), color: color, width: 28, height: 28, '& svg': { fontSize: '1rem' } }}>
          {icon}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{count}</Typography>
          <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mt: 0.2, letterSpacing: '0.5px' }}>
            {title}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, opacity: 0.5 }}>
        <Chart options={chartOptions} series={[{ data: [15, 23, 18, 30, 24, 35, 28] }]} type="area" height={20} />
      </Box>
    </Paper>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeDisplay = (name) => {
  if (!name) return 'Unknown';
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'PDF';
  if (['xls', 'xlsx'].includes(ext)) return 'Excel';
  if (['doc', 'docx'].includes(ext)) return 'Word';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'Image';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'Audio';
  return ext.toUpperCase();
};

const isPreviewable = (name) => {
  if (!name) return false;
  const ext = name.split('.').pop().toLowerCase();
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'xls', 'xlsx', 'doc', 'docx', 'csv', 'txt'].includes(ext);
};

const safeFormatDate = (dateVal, fmtStr) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return format(d, fmtStr);
  } catch {
    return '';
  }
};

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'ticketId', label: 'Task ID', minWidth: 100 },
  { id: 'title', label: 'Title / Page Name', minWidth: 200 },
  { id: 'assignedTo', label: 'Assigned To', minWidth: 140 },
  { id: 'createdBy', label: 'Assigned By', minWidth: 140 },
  { id: 'verifiedBy', label: 'Verified By', minWidth: 140 },
  { id: 'testedBy', label: 'Tested By', minWidth: 140 },
  { id: 'priorityLevel', label: 'Priority', minWidth: 100 },
  { id: 'ticketStatus', label: 'Status', minWidth: 120 },
  { id: 'targetDate', label: 'Target Date', minWidth: 120 },
  { id: 'assignedHours', label: 'Estimate Time', minWidth: 120 },
  { id: 'totalSpend', label: 'Total Spend', minWidth: 120 },
  { id: 'reassign', label: 'Reassign', minWidth: 80, align: 'center' },
  { id: 'attachments', label: 'Attachments', minWidth: 100, align: 'center' }
];

// ==============================|| TICKET MANAGEMENT CENTER ||============================== //

export default function TicketManagement({ viewType }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const handleDownloadFileUrl = (url) => {
    if (!url || typeof url !== 'string') return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const extractFilePath = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.filePath || data.path || '';
  };

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialFiltersRef = useRef(location.state?.initialFilters);

  const currentViewType = viewType || (window.location.pathname.includes('ticket-by-me') ? 'raised-by-me' : 'raised-for-me');
  const perms = usePagePermissions(currentViewType === 'raised-by-me' ? PAGE_CODES.SUPPORT_RAISED_BY_ME : PAGE_CODES.SUPPORT_RAISED_FOR_ME);
  const hasCompanyAccess = perms.additional2;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Dynamic field min-width: grows with content length so text is never clipped
  const getFieldMinWidth = (value = '', label = '', pad = 72) =>
    Math.max(140, Math.max((value || '').length, (label || '').length) * 8.5 + pad);


  // Read Global Filters from Redux state
  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);

  // Esc key listener for returning to Dashboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && location.state?.fromDashboard) {
        if (e.defaultPrevented) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

        const hasOpenDialog = document.querySelector('.MuiDialog-root');
        if (!hasOpenDialog) {
          navigate('/dashboard/task-dashboard', {
            state: {
              fromTab: location.state?.fromTab,
              dashboardFilters: location.state?.dashboardFilters
            }
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location, navigate]);

  // Core Data States
  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [pagesData, setPagesData] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const isVerticalHeadState = useMemo(() => employeesList.some(e => e.verticalHead && e.verticalHead.toLowerCase() === (user?.name || '').toLowerCase()), [employeesList, user]);
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFileData, setPreviewFileData] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [commentError, setCommentError] = useState(false);
  const [takenTimeError, setTakenTimeError] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [panelsOpen, setPanelsOpen] = useState({ part1: true, part2: true, part3: true });
  const [filesExpanded, setFilesExpanded] = useState(false);

  // Reassign Modal States
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignEmployee, setReassignEmployee] = useState(null);
  const [reassignComment, setReassignComment] = useState('');
  const [reassignTicket, setReassignTicket] = useState(null);
  const [reassignReason, setReassignReason] = useState('');

  const handleTogglePanel = (panelId) => {
    setPanelsOpen((prev) => {
      const newState = { ...prev, [panelId]: !prev[panelId] };
      if (!newState.part1 && !newState.part2 && !newState.part3) {
        showSnackbar('At least one section must remain open', 'warning');
        return prev;
      }
      return newState;
    });
  };

  const getDelayDays = (ticket) => {
    if (!ticket || !ticket.targetDate) return 0;
    if (['Closed', 'Resolved'].includes(ticket.ticketStatus)) return 0;
    const target = new Date(ticket.targetDate);
    const now = new Date();
    const diffTime = now - target;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Tab State for Details Dialog
  const [tabValue, setTabValue] = useState(0);

  // Sub-resources detail states
  const [ticketComments, setTicketComments] = useState([]);
  const [ticketTimeline, setTicketTimeline] = useState([]);
  const [ticketAttachments, setTicketAttachments] = useState([]);
  const [ticketReopens, setTicketReopens] = useState([]);

  // Form Field States for Raise Ticket
  const [formType, setFormType] = useState('Internal');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPage, setFormPage] = useState(null);

  // Reporter/Employee Info
  const [formEmpCode, setFormEmpCode] = useState('');
  const [formEmpName, setFormEmpName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formDeptName, setFormDeptName] = useState('');

  // Developer Info (External Workflow)
  const [formDevName, setFormDevName] = useState('');
  const [formDevEmail, setFormDevEmail] = useState('');
  const [formDevMobile, setFormDevMobile] = useState('');
  const [formVerifiedBy, setFormVerifiedBy] = useState('');
  const [formTestedBy, setFormTestedBy] = useState('');

  // Severity and General Fields
  const [formSeverity, setFormSeverity] = useState('Medium');
  const [formSourceType, setFormSourceType] = useState('Select');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Select');
  const [formAssignedHours, setFormAssignedHours] = useState('');
  const [hoursPart, setHoursPart] = useState('');
  const [minutesPart, setMinutesPart] = useState('');
  const [isTimeFocused, setIsTimeFocused] = useState(false);
  const [hoursFocused, setHoursFocused] = useState(false);
  const [minutesFocused, setMinutesFocused] = useState(false);
  const [devWorkloadTrail, setDevWorkloadTrail] = useState([]);
  const [detailDevWorkloadTrail, setDetailDevWorkloadTrail] = useState([]);

  // Voice support states
  const [voiceLang, setVoiceLang] = useState('ta-IN'); // ta-IN supports both Tamil and English natively in Chrome
  const [isListening, setIsListening] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const autoRestartRef = useRef(false);

  useEffect(() => {
    if (autoRestartRef.current && !isListening) {
      autoRestartRef.current = false;
      // Small timeout to ensure previous rec instance is fully destroyed
      setTimeout(() => {
        handleToggleVoiceTyping();
      }, 100);
    }
  }, [isListening, voiceLang]);

  const handleToggleVoiceTyping = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported natively. Simulating voice typing.");
      simulateVoiceTyping();
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = voiceLang; // Use state for dynamic switching

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        let text = event.results[event.results.length - 1][0].transcript;
        const lowerText = text.toLowerCase();

        // Voice Command: Engine Switcher
        if (lowerText.includes("tamil") || lowerText.includes("தமிழ்") || lowerText.includes("தமில்") || lowerText.includes("तमिल") || lowerText.includes("తమిళం")) {
          if (voiceLang !== 'ta-IN') {
            setVoiceLang('ta-IN');
            autoRestartRef.current = true;
            rec.stop();
            return;
          }
        } else if (lowerText.includes("english") || lowerText.includes("இங்கிலீஷ்") || lowerText.includes("ஆங்கிலம்") || lowerText.includes("अंग्रेजी") || lowerText.includes("इंग्लिश") || lowerText.includes("ఆంగ్లం") || lowerText.includes("ఇంగ్లీష్")) {
          if (voiceLang !== 'en-IN') {
            setVoiceLang('en-IN');
            autoRestartRef.current = true;
            rec.stop();
            return;
          }
        } else if (lowerText.includes("hindi") || lowerText.includes("हिंदी") || lowerText.includes("ஹிந்தி") || lowerText.includes("హిందీ")) {
          if (voiceLang !== 'hi-IN') {
            setVoiceLang('hi-IN');
            autoRestartRef.current = true;
            rec.stop();
            return;
          }
        } else if (lowerText.includes("telugu") || lowerText.includes("తెలుగు") || lowerText.includes("தெலுங்கு") || lowerText.includes("तेलुगु")) {
          if (voiceLang !== 'te-IN') {
            setVoiceLang('te-IN');
            autoRestartRef.current = true;
            rec.stop();
            return;
          }
        }

        // The native browser engine perfectly handles outputting the correct script 
        // based on the selected voiceLang mode (ta-IN for Tamil script, en-IN for Tanglish/English).
        let processedText = text;

        // Append real spoken text
        if (processedText) {
          setFormDesc((prev) => {
            const cleanPrev = prev ? prev.replace(/<\/p>$/, '') : '';
            if (cleanPrev.startsWith('<p>')) {
              return `${cleanPrev} ${processedText}</p>`;
            } else {
              return `<p>${prev ? prev + ' ' : ''}${processedText}</p>`;
            }
          });
        }
      };

      rec.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        simulateVoiceTyping();
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      simulateVoiceTyping();
    }
  };

  const simulateVoiceTyping = () => {
    const userPrompt = window.prompt("Speak your command (Voice Typing Simulation):", "Tamil la type pannu");
    if (!userPrompt) return;

    setIsListening(true);
    setTimeout(() => {
      let sampleText = userPrompt;
      const lowerText = userPrompt.toLowerCase();

      // 4-Language Simulation mapping
      const tamilMap = {
        'tamil': 'தமிழ்', 'la': 'ல', 'peasumpothu': 'பேசும்போது', 'intha': 'இந்த',
        'error': 'எரர்', 'varuthu': 'வருது', 'enakku': 'எனக்கு', 'peasina': 'பேசினா',
        'aaganum': 'ஆகணும்', 'apadi': 'அப்படி', 'veanum': 'வேணும்', 'english': 'இங்கிலீஷ்',
        'type': 'டைப்', 'ipo': 'இப்போ', 'mattum': 'மட்டும்', 'deduct': 'டிடெக்ட்',
        'pannuthu': 'பண்ணுது', 'correct': 'கரக்ட்', 'aa': 'ஆ', 'nalla': 'நல்லா',
        'understand': 'அண்டர்ஸ்டாண்ட்', 'konjam': 'கொஞ்சம்', 'issue': 'இஸ்யூ',
        'irukku': 'இருக்கு', 'fix': 'பிக்ஸ்', 'panna': 'பண்ண', 'try': 'ட்ரை', 'pannu': 'பண்ணு'
      };
      const hindiMap = {
        'hindi': 'हिंदी', 'kaisa': 'कैसा', 'hai': 'है', 'namaste': 'नमस्ते', 'mera': 'मेरा'
      };
      const teluguMap = {
        'telugu': 'తెలుగు', 'ela': 'ఎలా', 'unnavu': 'ఉన్నావు', 'namaskaram': 'నమస్కారం'
      };

      const words = sampleText.split(/\s+/);
      const translatedWords = words.map(w => {
        const cleanW = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (tamilMap[cleanW]) return w.replace(new RegExp(cleanW, 'i'), tamilMap[cleanW]);
        if (hindiMap[cleanW]) return w.replace(new RegExp(cleanW, 'i'), hindiMap[cleanW]);
        if (teluguMap[cleanW]) return w.replace(new RegExp(cleanW, 'i'), teluguMap[cleanW]);
        return w;
      });

      sampleText = translatedWords.join(' ');

      if (!sampleText.includes('(') && sampleText !== userPrompt) {
        sampleText += " (AI Auto-Translated)";
      }

      setFormDesc((prev) => {
        const cleanPrev = prev ? prev.replace(/<\/p>$/, '') : '';
        if (cleanPrev.startsWith('<p>')) {
          return `${cleanPrev} ${sampleText}</p>`;
        } else {
          return `<p>${prev ? prev + ' ' : ''}${sampleText}</p>`;
        }
      });
      setIsListening(false);
    }, 1500);
  };

  const transcribeAudioFile = async (file) => {
    setTranscriptionStatus('Processing...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', voiceLang);

    try {
      const res = await axios.post('/api/tickets/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Also upload the file to standard file repository (temp voice folder)
      const fileData = new FormData();
      fileData.append('file', file);
      fileData.append('module', 'SUPPORT_TEMP_VOICE');
      const uploadRes = await axios.post('/api/files/upload', fileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const voicePath = extractFilePath(uploadRes.data);
      if (voicePath) {
        setFormVoiceFiles((prev) => [...prev, voicePath]);
      }

      if (res.data) {
        setFormDesc((prev) => {
          const text = res.data.text;
          if (!text || text.trim().length === 0) return prev;
          const cleanPrev = prev ? prev.replace(/<\/p>$/, '') : '';
          if (cleanPrev.startsWith('<p>')) {
            return `${cleanPrev} ${text}</p>`;
          } else {
            return `<p>${prev ? prev + ' ' : ''}${text}</p>`;
          }
        });
        setTranscriptionStatus('Transcription Completed');
      } else {
        setTranscriptionStatus('Transcription Failed');
      }
    } catch (err) {
      console.error(err);
      setTranscriptionStatus('Transcription Failed');
    }
  };

  const handleVoiceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav', 'm4a', 'aac'].includes(ext)) {
      setTranscriptionStatus('Transcription Failed');
      showSnackbar('Invalid audio format. Supported formats: MP3, WAV, M4A, AAC', 'warning');
      return;
    }

    await transcribeAudioFile(file);
  };

  const handleToggleLiveRecording = async () => {
    if (isRecordingAudio) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingAudio(false);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      dispatch(openSnackbar({ open: true, message: 'Audio recording is not supported in this browser or context (requires HTTPS)', variant: 'alert', severity: 'warning' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], `recorded_${voiceLang}_${Date.now()}.wav`, { type: 'audio/wav' });
        await transcribeAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
      setTranscriptionStatus('Recording...');
    } catch (err) {
      console.warn("Error accessing microphone, falling back to simulated recording:", err);
      simulateLiveRecording();
    }
  };

  const simulateLiveRecording = () => {
    setIsRecordingAudio(true);
    setTranscriptionStatus('Recording (Simulated)...');

    setTimeout(() => {
      setIsRecordingAudio(false);
      setTranscriptionStatus('Processing...');

      setTimeout(async () => {
        let sampleText = "";
        if (voiceLang === 'ta-IN') {
          sampleText = "லாகின செய்யும்போது எரர் வருகிறது. Authentication is failing on the main portal, please check and resolve this login error as soon as possible.";
        } else if (voiceLang === 'hi-IN') {
          sampleText = "लॉगिन करते समय त्रुटि आ रही है. Database connection issue is observed in checkout process. Kindly check.";
        } else if (voiceLang === 'es-ES') {
          sampleText = "Hay un problema de conexión con la base de datos al iniciar sesión. Por favor revise el pool de conexiones.";
        } else if (voiceLang === 'fr-FR') {
          sampleText = "Il y a un problème de connexion à la base de données lors de la connexion. Veuillez vérifier le pool de connexions.";
        } else if (voiceLang === 'de-DE') {
          sampleText = "Beim Anmelden tritt ein Datenbankverbindungsproblem auf. Bitte überprüfen Sie den Connection Pool.";
        } else if (voiceLang === 'te-IN') {
          sampleText = "లాగిన్ చేసేటప్పుడు డేటాబേస్ కనెక్షన్ సమస్య వస్తోంది. దయచేసి కనెక్షన్ పూల్ తనిఖీ చేయండి.";
        } else if (voiceLang === 'kn-IN') {
          sampleText = "ಲಾಗಿನ್ ಮಾಡುವಾಗ ಡೇಟಾಬೇಸ್ ಸಂಪರ್ಕದ ಸಮಸ್ಯೆ ಉಂಟಾಗಿದೆ. ದಯವಿಟ್ಟು ಸಂಪರ್ಕ ಪೂಲ್ ಪರಿಶೀಲಿಸಿ.";
        } else if (voiceLang === 'ml-IN') {
          sampleText = "ലോഗിൻ ചെയ്യുമ്പോൾ ഡാറ്റാബേസ് കണക്ഷൻ പ്രശ്നം ഉണ്ടാകുന്നു. ദയവായി കണക്ഷൻ പൂൾ പരിശോധിക്കുക.";
        } else if (voiceLang === 'bn-IN') {
          sampleText = "লগইন করার সময় ডাটাবেস সংযোগের সমস্যা হচ্ছে। অনুগ্রহ করে সংযোগ পুল পরীক্ষা করুন।";
        } else {
          sampleText = "";
        }

        // Upload simulated audio file
        const dummyBlob = new Blob([new Uint8Array(44)], { type: 'audio/wav' });
        const dummyFile = new File([dummyBlob], `simulated_${voiceLang}_${Date.now()}.wav`, { type: 'audio/wav' });
        try {
          const fileData = new FormData();
          fileData.append('file', dummyFile);
          fileData.append('module', 'SUPPORT_TEMP_VOICE');
          const uploadRes = await axios.post('/api/files/upload', fileData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const voicePath = extractFilePath(uploadRes.data);
          if (voicePath) {
            setFormVoiceFiles((prev) => [...prev, voicePath]);
          }
        } catch (e) {
          console.error("Simulated voice file upload failed", e);
        }

        setFormDesc((prev) => {
          const cleanPrev = prev ? prev.replace(/<\/p>$/, '') : '';
          if (cleanPrev.startsWith('<p>')) {
            return `${cleanPrev} ${sampleText}</p>`;
          } else {
            return `<p>${prev ? prev + ' ' : ''}${sampleText}</p>`;
          }
        });
        setTranscriptionStatus('Transcription Completed');
      }, 1500);
    }, 3000);
  };
  const [formTargetDate, setFormTargetDate] = useState('');
  const [targetDateTooltip, setTargetDateTooltip] = useState('');
  const [formAttachment, setFormAttachment] = useState('');
  const [formAttachments, setFormAttachments] = useState([]);
  const [formVoiceFiles, setFormVoiceFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Access control & filtering states
  const [accessLevel, setAccessLevel] = useState('Mine');
  const [raisedToFilter, setRaisedToFilter] = useState('');
  const [detailTakenTime, setDetailTakenTime] = useState('');
  const [detailTakenHours, setDetailTakenHours] = useState('');
  const [detailTakenMinutes, setDetailTakenMinutes] = useState('');
  const [isDetailTakenTimeFocused, setIsDetailTakenTimeFocused] = useState(false);
  const [detailTakenHoursFocused, setDetailTakenHoursFocused] = useState(false);
  const [detailTakenMinutesFocused, setDetailTakenMinutesFocused] = useState(false);
  const [detailReworkTime, setDetailReworkTime] = useState('');
  const [detailEstimatedTime, setDetailEstimatedTime] = useState('');
  const [detailEstimatedHours, setDetailEstimatedHours] = useState('');
  const [detailEstimatedMinutes, setDetailEstimatedMinutes] = useState('');
  const [isDetailEstimatedTimeFocused, setIsDetailEstimatedTimeFocused] = useState(false);
  const [detailEstimatedHoursFocused, setDetailEstimatedHoursFocused] = useState(false);
  const [detailEstimatedMinutesFocused, setDetailEstimatedMinutesFocused] = useState(false);
  const [hasSavedInDetails, setHasSavedInDetails] = useState(false);

  // Validation Popup Reason Dialog State
  const [reasonOpen, setReasonOpen] = useState(false);
  const [dueDateReasonText, setDueDateReasonText] = useState('');
  const [pendingSavePayload, setPendingSavePayload] = useState(null);

  // Dialog for Reopen reason
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');

  // Detail Comment state
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('Public Reply');
  const [commentFile, setCommentFile] = useState('');
  const [commentUploading, setCommentUploading] = useState(false);

  // Detail fields update (Admin/Internal agents only)
  const [detailStatus, setDetailStatus] = useState('');
  const [detailAssignedTo, setDetailAssignedTo] = useState('');
  const [detailDevName, setDetailDevName] = useState('');
  const [detailDevEmail, setDetailDevEmail] = useState('');
  const [detailDevMobile, setDetailDevMobile] = useState('');
  const [detailResolution, setDetailResolution] = useState('');
  const [detailRootCause, setDetailRootCause] = useState('');
  const [detailTargetDate, setDetailTargetDate] = useState('');
  const [reopenTargetDate, setReopenTargetDate] = useState('');
  const [reopenTiming, setReopenTiming] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [detailAdditionalRequirement, setDetailAdditionalRequirement] = useState('');

  // Snackbar Notification State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Register Global Filter config on Mount or when access/employees change
  useEffect(() => {
    const myName = (user?.name || '').toLowerCase();
    const isVerticalHead = employeesList.some(e => e.verticalHead && e.verticalHead.toLowerCase() === myName);

    const taskScopeOptions = [
      { value: 'Mine', label: 'Mine' }
    ];
    if (isVerticalHead) {
      taskScopeOptions.push({ value: 'Team', label: 'Team' });
    }
    if (hasCompanyAccess) {
      taskScopeOptions.push({ value: 'Company', label: 'Company' });
    }

    const config = [
      { id: 'ticketId', label: 'Task ID', type: 'text', isStarred: true },
      {
        id: 'taskScope',
        label: 'Task Scope',
        type: 'select',
        options: taskScopeOptions,
        defaultValue: 'Mine',
        isStarred: true
      },
      {
        id: 'ticketType',
        label: 'Task Type',
        type: 'select',
        options: [
          { value: 'All', label: 'All Types' },
          { value: 'Internal', label: 'Internal' },
          { value: 'External', label: 'External' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'ticketStatus',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Active', label: 'Active Tasks' },
          { value: 'Open', label: 'Open' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'To Be Verified', label: 'To Be Verified' },
          { value: 'Yet To Deploy', label: 'Yet To Deploy' },
          { value: 'To Be Tested', label: 'To Be Tested' },
          { value: 'Reopened', label: 'Reopened' },
          { value: 'Rework', label: 'Rework' },
          { value: 'Completed', label: 'Completed' },
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'priorityLevel',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'All', label: 'All' },
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Critical', label: 'Critical' }
        ],
        defaultValue: 'All',
        isStarred: true
      },
      { id: 'department', label: 'Department', type: 'text', isStarred: true },
      { id: 'assignedTo', label: 'Assigned To', type: 'text', isStarred: true },
      { id: 'startDate', label: 'From Date', type: 'date', isStarred: false },
      { id: 'endDate', label: 'To Date', type: 'date', isStarred: false }
    ];
    dispatch(setFilterConfig(config));

    if (initialFiltersRef.current) {
      dispatch(setFilters(initialFiltersRef.current));

      // Once employeesList is loaded, we can clear the ref so we don't overwrite user changes on any future config updates
      if (employeesList.length > 0) {
        initialFiltersRef.current = null;
      }
    }

    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
    };
  }, [dispatch, employeesList, hasCompanyAccess, user]);

  // Load ticket details on mount
  useEffect(() => {
    fetchTickets();
    fetchUsers();
    fetchPages();
    fetchAllEmployees();
    fetchAllCompanies();
    if (user?.empId) {
      fetchEmployeeDetails();
    } else {
      setFormEmpName(user?.name || '');
      setFormEmail(user?.email || '');
    }
  }, [user, currentViewType]);

  // Handle openNewTask from location state
  useEffect(() => {
    if (location.state?.openNewTask && employeesList.length > 0) {
      setCreateOpen(true);
      if (location.state?.assignTo) {
        const emp = employeesList.find(e => e.employeeName === location.state.assignTo || e.id === location.state.assignTo);
        if (emp) {
          setFormDevName(emp.employeeName);
          setFormDevEmail(emp.officeMail || '');
          axios.get(`/api/master/hr/employees/${emp.id}/contact`)
            .then(c => {
              if (c.data?.mobile) setFormDevMobile(c.data.mobile);
            }).catch(() => { });
        } else {
          setFormDevName(location.state.assignTo);
        }
      }
      navigate(location.pathname, { replace: true, state: { ...location.state, openNewTask: false, assignTo: null } });
    }
  }, [location.state, employeesList, navigate, location.pathname]);

  // Keyboard Shortcut: Ctrl + N for New Task
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        if (currentViewType === 'raised-by-me') {
          e.preventDefault();
          e.stopPropagation();
          resetForm();
          setCreateOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [currentViewType]);

  // Reset details view when viewType (currentViewType) changes (e.g. user navigates between Raised By Me and Raised For Me)
  useEffect(() => {
    setDetailsOpen(false);
    setSelectedTicket(null);
  }, [currentViewType]);

  // Handle Ctrl + S for ticket creation and update
  useEffect(() => {
    const handleSaveShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (createOpen && !isSaving) {
          e.preventDefault();
          e.stopPropagation();
          const submitBtn = document.getElementById('ticket-submit-button');
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
          }
        } else if (detailsOpen && !isSaving) {
          e.preventDefault();
          e.stopPropagation();
          const updateBtn = document.getElementById('ticket-update-button');
          if (updateBtn && !updateBtn.disabled) {
            updateBtn.click();
          }
        }
      }
    };
    window.addEventListener('keydown', handleSaveShortcut, { capture: true });
    return () => window.removeEventListener('keydown', handleSaveShortcut, { capture: true });
  }, [createOpen, detailsOpen, isSaving]);

  const handleCloseDetails = useCallback(() => {
    if (location.state?.fromNotification || location.state?.fromDashboard) {
      navigate(-1);
    } else {
      setDetailsOpen(false);
      setSelectedTicket(null);
      const params = new URLSearchParams(location.search);
      if (params.get('openTicketId')) {
        navigate(location.pathname, { replace: true, state: location.state });
      }
    }
  }, [location, navigate]);

  // Handle openTicketId from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openTicketId = params.get('openTicketId');
    if (openTicketId) {
      if (tickets.length === 0) {
        // Still loading tickets...
        return;
      }
      const ticket = tickets.find(t => t.ticketId === openTicketId);
      if (ticket) {
        if (!detailsOpen) {
          setSelectedTicket(ticket);
          setTabValue(0);
          setDetailsOpen(true);
        }
      }
    }
  }, [location.search, tickets, detailsOpen]);

  // Handle Escape to close details
  useEffect(() => {
    const handleEscapeShortcut = (e) => {
      if (e.key === 'Escape' && detailsOpen && !previewModalOpen) {
        e.preventDefault();
        handleCloseDetails();
      }
    };
    window.addEventListener('keydown', handleEscapeShortcut, { capture: true });
    return () => window.removeEventListener('keydown', handleEscapeShortcut, { capture: true });
  }, [detailsOpen, previewModalOpen, handleCloseDetails]);

  // When a ticket is selected, load its comments/timeline
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketSubresources(selectedTicket.rowId);
      setHasSavedInDetails(false);
      if (selectedTicket.ticketStatus === 'Reopened' && currentViewType === 'raised-for-me') {
        setDetailStatus('Reopened');
        setDetailTakenHours('');
        setDetailTakenMinutes('');
        setDetailTakenTime('');
      } else {
        setDetailStatus(selectedTicket.ticketStatus);
      }
      setDetailAssignedTo(selectedTicket.assignedTo || '');
      setDetailDevName(selectedTicket.developerName || '');
      setDetailDevEmail(selectedTicket.developerEmail || '');
      setDetailDevMobile(selectedTicket.developerMobileNo || '');

      const savedSummary = selectedTicket.resolutionSummary || '';
      const PREDEFINED_REASONS = ['Not Working as Expected', 'Additional Requirement Needed', 'Requirement Not Fully Completed', 'Incorrect Output', 'Missing Functionality', 'UI/Design Changes Required', 'Validation Issue Found', 'Bug Still Exists', 'Rework Required', 'Performance Improvement Needed', 'Requirement Changed', 'Clarification Required', 'Testing Failed', 'Quality Issue Identified'];

      if (selectedTicket.ticketStatus === 'Reopened') {
        if (PREDEFINED_REASONS.includes(savedSummary)) {
          setReopenReason(savedSummary);
          setDetailResolution('');
        } else if (savedSummary) {
          setReopenReason('Others');
          setDetailResolution(savedSummary);
        } else {
          setReopenReason('');
          setDetailResolution('');
        }
      } else {
        setReopenReason('');
        setDetailResolution(savedSummary);
      }

      setCommentError(false);
      setTakenTimeError(false);
      setDetailRootCause(selectedTicket.rootCause || '');
      setDetailAdditionalRequirement(selectedTicket.additionalRequirement || '');

      const isReopenedStatus = selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
      if (isReopenedStatus) {
        setDetailTakenHours('');
        setDetailTakenMinutes('');
        setDetailTakenTime('');
      } else {
        const isReopened = (selectedTicket.reopenedCount && selectedTicket.reopenedCount > 0) || selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
        const rawTime = isReopened ? (selectedTicket.reworkTime || '') : (selectedTicket.takenTime || '');
        if (rawTime) {
          const tMins = parseDurationToMinutes(rawTime);
          setDetailTakenHours(String(Math.floor(tMins / 60)).padStart(2, '0'));
          setDetailTakenMinutes(String(tMins % 60).padStart(2, '0'));
          setDetailTakenTime(`${String(Math.floor(tMins / 60)).padStart(2, '0')}:${String(tMins % 60).padStart(2, '0')}`);
        } else {
          setDetailTakenHours('');
          setDetailTakenMinutes('');
          setDetailTakenTime('');
        }
      }
      setDetailReworkTime('');
      if (selectedTicket.assignedHours) {
        const estMins = parseDurationToMinutes(selectedTicket.assignedHours);
        setDetailEstimatedHours(String(Math.floor(estMins / 60)).padStart(2, '0'));
        setDetailEstimatedMinutes(String(estMins % 60).padStart(2, '0'));
        setDetailEstimatedTime(`${String(Math.floor(estMins / 60)).padStart(2, '0')}:${String(estMins % 60).padStart(2, '0')}`);
      } else {
        setDetailEstimatedHours('');
        setDetailEstimatedMinutes('');
        setDetailEstimatedTime('');
      }
      setDetailTargetDate(selectedTicket.targetDate ? safeFormatDate(selectedTicket.targetDate, 'yyyy-MM-dd') : '');
      setIsReassigning(false);

      if (selectedTicket.developerName) {
        fetchDevWorkload(selectedTicket.developerName);
      } else {
        setDetailDevWorkloadTrail([]);
      }
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (detailEstimatedHours !== '' || detailEstimatedMinutes !== '') {
      const h = detailEstimatedHours !== '' ? detailEstimatedHours : '00';
      const m = detailEstimatedMinutes !== '' ? detailEstimatedMinutes : '00';
      const newEstTime = `${h}:${m}`;
      setDetailEstimatedTime(newEstTime);

      // If estimated time changes, recalculate target date
      if (selectedTicket && newEstTime !== selectedTicket.assignedHours) {
        const calculateDetailTargetDateFromTime = async () => {
          const dev = detailDevName || selectedTicket.developerName;
          if (!dev) return;
          const trail = await buildWorkloadTrail(dev, newEstTime, selectedTicket.ticketId);
          setDetailDevWorkloadTrail(trail);
          const finalDay = trail.find(t => t.isFinal) || trail[trail.length - 1];
          if (finalDay) setDetailTargetDate(finalDay.dateKey);
        };
        calculateDetailTargetDateFromTime();
      }
    } else {
      setDetailEstimatedTime('');
    }
  }, [detailEstimatedHours, detailEstimatedMinutes]);

  useEffect(() => {
    if (detailTakenHours !== '' || detailTakenMinutes !== '') {
      const h = detailTakenHours !== '' ? detailTakenHours : '00';
      const m = detailTakenMinutes !== '' ? detailTakenMinutes : '00';
      const newTime = `${h}:${m}`;
      setDetailTakenTime(newTime);
      if (newTime !== '00:00' && newTime !== ':') {
        setTakenTimeError(false);
      }
    } else {
      setDetailTakenTime('');
    }
  }, [detailTakenHours, detailTakenMinutes]);

  useEffect(() => {
    if (isReassigning && detailDevName) {
      calculateDetailTargetDate(detailDevName);
      fetchDevWorkload(detailDevName);
    }
  }, [detailDevName, isReassigning]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tickets');
      setTickets(res.data || []);
    } catch (err) {
      showSnackbar('Failed to load support tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users/all');
      setUsersList(res.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await axios.get('/api/bos-pages');
      if (res.data) setPagesData(res.data);
    } catch (err) {
      console.warn('Could not load BOS pages/modules list', err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await axios.get('/api/master/hr/employees/filter/active');
      setEmployeesList(res.data || []);
    } catch (err) {
      console.warn('Could not load employees list', err);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      setCompaniesList(res.data || []);
    } catch (err) {
      console.warn('Could not load companies list', err);
    }
  };

  // ── Auto Target Date Calculation ─────────────────────────────────────────────
  //   Working hours: 9 AM – 6 PM = 9 h = 540 min per working day (Mon–Sat, Sundays and Govt Holidays are off).
  //   On the first day (task-raise day), only the remaining time from NOW to 6 PM is counted.
  //   Fetches the assignee's existing workload from the backend, then distributes
  //   the new ticket's assigned minutes across available slots day-by-day.
  const DAILY_CAPACITY_MINS = 9 * 60; // 540 (9 AM to 6 PM)
  const WORK_START_HOUR = 9;  // 9 AM
  const WORK_END_HOUR = 18;   // 6 PM

  const GOVERNMENT_HOLIDAYS = [
    // 2025
    "2025-01-01", "2025-01-26", "2025-03-14", "2025-04-18", "2025-05-01",
    "2025-08-15", "2025-10-02", "2025-10-20", "2025-11-05", "2025-12-25",
    // 2026
    "2026-01-01", "2026-01-26", "2026-03-02", "2026-04-03", "2026-05-01",
    "2026-08-15", "2026-10-02", "2026-10-20", "2026-11-08", "2026-12-25",
    // 2027
    "2027-01-01", "2027-01-26", "2027-03-22", "2027-04-16", "2027-05-01",
    "2027-08-15", "2027-10-02", "2027-10-09", "2027-11-08", "2027-12-25"
  ];

  const isNonWorkingDay = (d) => {
    if (d.getDay() === 0) return true;
    const key = dateKey(d);
    return GOVERNMENT_HOLIDAYS.includes(key);
  };

  const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  const dateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateLabel = (d) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatToCustomDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIdx] || '';
    return `${day}-${monthName}-${year}`;
  };

  const formatMins = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const parseAssignedHoursToMins = (assignedHours) => {
    if (!assignedHours) return 0;
    const hhmmRegex = /^(\d{1,3}):([0-5]\d)$/;
    const match = assignedHours.match(hhmmRegex);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  const buildWorkloadTrail = async (devName, assignedHours, ticketIdToExclude) => {
    if (!devName || !assignedHours) {
      return [];
    }
    const mins = parseAssignedHoursToMins(assignedHours);
    if (mins <= 0) return [];

    let workload = {};
    try {
      const res = await axios.get(`/api/tickets/workload/${encodeURIComponent(devName)}`);
      workload = res.data || {};
    } catch {
      workload = {};
    }

    let remaining = mins;
    const now = new Date(); // actual current time (for first-day partial capacity)
    let cursor = new Date(); // start from today
    cursor.setHours(0, 0, 0, 0);
    const trail = [];
    const MAX_DAYS = 365;

    for (let i = 0; i < MAX_DAYS; i++) {
      const key = dateKey(cursor);
      const formattedDate = format(cursor, 'dd-MM-yyyy');
      const isFirstDay = (i === 0);

      // 1. Sunday check (Silently skip Sundays without showing in Info tooltip)
      if (cursor.getDay() === 0) {
        cursor = addDays(cursor, 1);
        continue;
      }

      // 2. Government Holiday check
      if (GOVERNMENT_HOLIDAYS.includes(key)) {
        trail.push({
          dateStr: formattedDate,
          type: 'holiday',
          isFinal: false
        });
        cursor = addDays(cursor, 1);
        continue;
      }

      // 3. Working Day — determine day capacity
      //    First day: only minutes from NOW until 6 PM are available
      //    Other days: full 9h (9 AM – 6 PM = 540 mins)
      let dayCapacity = DAILY_CAPACITY_MINS;
      if (isFirstDay) {
        const nowHour = now.getHours();
        const nowMin = now.getMinutes();
        if (nowHour >= WORK_END_HOUR) {
          // After 6 PM — no capacity today, move to next working day
          cursor = addDays(cursor, 1);
          continue;
        } else if (nowHour < WORK_START_HOUR) {
          // Before 9 AM — full day available
          dayCapacity = DAILY_CAPACITY_MINS;
        } else {
          // Between 9 AM and 6 PM — remaining minutes until 6 PM
          const minsUntilEnd = (WORK_END_HOUR * 60) - (nowHour * 60 + nowMin);
          dayCapacity = Math.max(0, minsUntilEnd);
        }
      }

      const dayData = workload[key] || { totalMinutes: 0 };
      let existingTickets = [];
      let alreadyAllocated = 0;

      if (dayData.tickets) {
        existingTickets = dayData.tickets.filter(t => t.ticketId !== ticketIdToExclude);
        alreadyAllocated = existingTickets.reduce((sum, t) => sum + t.allocatedMinutes, 0);
      } else {
        alreadyAllocated = dayData.totalMinutes || 0;
      }

      const available = Math.max(0, dayCapacity - alreadyAllocated);
      let allocatedForThis = 0;

      if (remaining > 0 && available > 0) {
        allocatedForThis = Math.min(remaining, available);
        remaining -= allocatedForThis;
      }

      const isFinal = (remaining === 0 && allocatedForThis > 0);

      trail.push({
        dateStr: formattedDate,
        dateKey: key,
        type: 'workday',
        existingTickets: existingTickets.map(t => ({
          ticketId: t.ticketId,
          employeeName: t.employeeName || t.raisedBy || 'Unknown',
          title: t.title || t.ticketHeading || 'No Title',
          allocatedMinutes: t.allocatedMinutes
        })),
        allocatedForThis,
        isFinal,
        alreadyAllocated
      });

      if (remaining <= 0) {
        break;
      }

      cursor = addDays(cursor, 1);
    }

    return trail;
  };

  const renderWorkloadTrail = (trail) => {
    if (!trail || trail.length === 0) {
      return (
        <Typography variant="caption" sx={{ color: '#fff' }}>
          No active workload allocated.
        </Typography>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 0.5 }}>
        {trail.map((item, index) => {
          const isSunday = item.type === 'sunday';
          const isHoliday = item.type === 'holiday';
          const isWorkday = item.type === 'workday';

          return (
            <Box
              key={index}
              sx={{
                borderBottom: index < trail.length - 1 ? '1px dashed rgba(255,255,255,0.15)' : 'none',
                pb: index < trail.length - 1 ? 1 : 0
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: isSunday || isHoliday ? '#ffb74d' : '#81c784',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {item.dateStr}
              </Typography>

              {isSunday && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    pl: 1.5,
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                >
                  * Sunday (Non-Working Day) - Skipped
                </Typography>
              )}

              {isHoliday && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    pl: 1.5,
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                >
                  * Government Holiday - Skipped
                </Typography>
              )}

              {isWorkday && (
                <Box sx={{ pl: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {/* Existing ticket allocations */}
                  {item.existingTickets && item.existingTickets.map((t, tIdx) => (
                    <Typography
                      key={tIdx}
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '0.75rem'
                      }}
                    >
                      * {t.ticketId} | {t.employeeName} | {t.title} | {formatMins(t.allocatedMinutes)}
                    </Typography>
                  ))}

                  {/* New Ticket Allocation on this day */}
                  {item.allocatedForThis > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontFamily: 'monospace',
                        color: '#64b5f6',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}
                    >
                      * Allocation: {formatMins(item.allocatedForThis)} (New/Scheduled)
                    </Typography>
                  )}

                  {/* Workload Full notice */}
                  {item.allocatedForThis === 0 && item.alreadyAllocated >= DAILY_CAPACITY_MINS && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontStyle: 'italic',
                        color: '#e57373',
                        fontSize: '0.7rem'
                      }}
                    >
                      * Workload full (9 AM–6 PM capacity reached) - Skipped
                    </Typography>
                  )}

                  {/* Finalization notices */}
                  {item.isFinal && (
                    <>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#81c784',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          mt: 0.5
                        }}
                      >
                        * Remaining allocation completed
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: '#4db6ac',
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}
                      >
                        * Target Date Finalized
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  const calculateTargetDate = async (devName, assignedHours) => {
    if (!devName || !assignedHours) {
      setFormTargetDate('');
      setTargetDateTooltip('');
      setDevWorkloadTrail([]);
      return;
    }
    const mins = parseAssignedHoursToMins(assignedHours);
    if (mins <= 0) {
      setFormTargetDate('');
      setTargetDateTooltip('');
      setDevWorkloadTrail([]);
      return;
    }

    const trail = await buildWorkloadTrail(devName, assignedHours, null);
    setDevWorkloadTrail(trail);
    const finalDay = trail.find(t => t.isFinal) || trail[trail.length - 1];
    if (finalDay) {
      setFormTargetDate(finalDay.dateKey);
      setTargetDateTooltip(`Target Date: ${finalDay.dateStr}`);
    } else {
      setFormTargetDate('');
      setTargetDateTooltip('');
    }
  };

  const calculateDetailTargetDate = async (devName) => {
    if (!devName || !selectedTicket || !selectedTicket.assignedHours) {
      setDetailDevWorkloadTrail([]);
      return;
    }
    const trail = await buildWorkloadTrail(devName, selectedTicket.assignedHours, selectedTicket.ticketId);
    setDetailDevWorkloadTrail(trail);
    const finalDay = trail.find(t => t.isFinal) || trail[trail.length - 1];
    setDetailTargetDate(finalDay ? finalDay.dateKey : '');
  };

  const fetchDevWorkload = async (devName) => {
    if (!devName || !selectedTicket || !selectedTicket.assignedHours) {
      setDetailDevWorkloadTrail([]);
      return;
    }
    try {
      const trail = await buildWorkloadTrail(devName, selectedTicket.assignedHours, selectedTicket.ticketId);
      setDetailDevWorkloadTrail(trail);
    } catch {
      setDetailDevWorkloadTrail([]);
    }
  };

  // Synchronize hoursPart and minutesPart to formAssignedHours
  useEffect(() => {
    if (hoursPart !== '' || minutesPart !== '') {
      const h = hoursPart !== '' ? hoursPart : '0';
      const m = minutesPart !== '' ? minutesPart : '00';
      const formattedH = String(h).padStart(2, '0');
      const formattedM = String(m).padStart(2, '0');
      setFormAssignedHours(`${formattedH}:${formattedM}`);
    } else {
      setFormAssignedHours('');
    }
  }, [hoursPart, minutesPart]);

  // Re-calculate whenever the assignee or the hours change
  useEffect(() => {
    calculateTargetDate(formDevName, formAssignedHours);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDevName, formAssignedHours]);



  const fetchEmployeeDetails = async () => {
    try {
      const [empRes, contactRes] = await Promise.all([
        axios.get(`/api/master/hr/employees/${user.empId}`),
        axios.get(`/api/master/hr/employees/${user.empId}/contact`).catch(() => ({ data: null }))
      ]);

      if (empRes.data) {
        const emp = empRes.data;
        setFormEmpCode(emp.empCode || '');
        setFormEmpName(emp.employeeName || '');
        setFormEmail(emp.officeMail || user?.email || '');
        setFormDeptName(emp.department?.departmentName || '');
      }

      if (contactRes && contactRes.data) {
        setFormMobile(contactRes.data.mobile || '');
      }
    } catch (err) {
      console.warn('Could not auto-populate profile info', err);
    }
  };

  const fetchTicketSubresources = async (rowId) => {
    try {
      const [commentsRes, historyRes, attachmentsRes, reopensRes] = await Promise.all([
        axios.get(`/api/tickets/${rowId}/comments`),
        axios.get(`/api/tickets/${rowId}/history`),
        axios.get(`/api/tickets/${rowId}/attachments`),
        axios.get(`/api/tickets/${rowId}/reopens`)
      ]);
      setTicketComments(commentsRes.data || []);
      setTicketTimeline(historyRes.data || []);
      setTicketAttachments(attachmentsRes.data || []);
      setTicketReopens(reopensRes.data || []);
    } catch (err) {
      console.warn('Error fetching ticket detailed history', err);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getOverallDuration = (ticket) => {
    if (!ticket || !ticket.createdAt) return '-';
    const start = new Date(ticket.createdAt).getTime();
    const end = ticket.closedAt
      ? new Date(ticket.closedAt).getTime()
      : ticket.resolvedAt
        ? new Date(ticket.resolvedAt).getTime()
        : new Date().getTime();

    const diffMs = end - start;
    if (diffMs < 0) return '0 mins';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(diffMins / (24 * 60));
    const hours = Math.floor((diffMins % (24 * 60)) / 60);
    const mins = diffMins % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);

    return parts.join(', ');
  };

  const parseDurationToMinutes = (str) => {
    if (!str) return 0;
    const clean = str.toLowerCase().replace(/\s+/g, '');
    if (clean.includes(':')) {
      const parts = clean.split(':');
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    const dayMatch = clean.match(/([\d.]+)\s*d/);
    const hrMatch = clean.match(/([\d.]+)\s*h/);
    const minMatch = clean.match(/([\d.]+)\s*m/);

    let totalMins = 0;
    if (dayMatch) {
      totalMins += parseFloat(dayMatch[1]) * 24 * 60;
    }
    if (hrMatch) {
      totalMins += parseFloat(hrMatch[1]) * 60;
    }
    if (minMatch) {
      totalMins += parseFloat(minMatch[1]);
    }
    if (!dayMatch && !hrMatch && !minMatch) {
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        totalMins += num * 60;
      }
    }
    return totalMins;
  };

  const formatMinutesToDuration = (totalMins) => {
    if (totalMins <= 0) return '0 mins';
    const days = Math.floor(totalMins / (24 * 60));
    const hours = Math.floor((totalMins % (24 * 60)) / 60);
    const mins = Math.floor(totalMins % 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const calculateTotalTakenTime = () => {
    let totalMinutes = 0;
    const matchedDurations = [];

    if (ticketTimeline && ticketTimeline.length > 0) {
      ticketTimeline.forEach(item => {
        if (item.comment) {
          const parts = item.comment.split(' | Taken Time: ');
          if (parts.length > 1) {
            const durationStr = parts[1].trim();
            const mins = parseDurationToMinutes(durationStr);
            if (mins > 0) {
              totalMinutes += mins;
              matchedDurations.push(durationStr);
            }
          }
        }
      });
    }

    if (selectedTicket && selectedTicket.ticketStatus === 'Resolved' && selectedTicket.takenTime) {
      const hasInHistory = ticketTimeline && ticketTimeline.some(item =>
        item.toStatus === 'Resolved' && item.comment && item.comment.includes(`Taken Time: ${selectedTicket.takenTime}`)
      );
      if (!hasInHistory) {
        const mins = parseDurationToMinutes(selectedTicket.takenTime);
        if (mins > 0) {
          totalMinutes += mins;
          matchedDurations.push(selectedTicket.takenTime);
        }
      }
    }

    if (totalMinutes === 0) return { formatted: '-', details: '' };
    return {
      formatted: formatMinutesToDuration(totalMinutes),
      details: matchedDurations.join(' + ')
    };
  };

  // Autocomplete lists for Module and Screen Name
  // Logic simplified, we use pagesData directly for Autocomplete

  // File uploads
  const handleFileUpload = async (event, isComment = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (isComment) {
      setCommentUploading(true);
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', 'Support');
      try {
        const res = await axios.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const commentPath = extractFilePath(res.data);
        if (commentPath) {
          setCommentFile(commentPath);
          showSnackbar('Comment attachment uploaded!');
        } else {
          showSnackbar('File upload failed', 'error');
        }
      } catch (err) {
        showSnackbar('File upload failed', 'error');
      } finally {
        setCommentUploading(false);
      }
    } else {
      setUploading(true);
      const uploadedUrls = [...formAttachments];
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('module', 'SUPPORT_TEMP_ATTACHMENT');
          const res = await axios.post('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const path = extractFilePath(res.data);
          if (path) {
            const fileName = (typeof res.data === 'object' && res.data?.fileName) ? res.data.fileName : file.name;
            uploadedUrls.push({
              url: path,
              name: fileName,
              size: file.size,
              type: file.type || file.name.split('.').pop()
            });
          }
        }
        setFormAttachments(uploadedUrls);
        showSnackbar('Attachments uploaded successfully!');
      } catch (err) {
        showSnackbar('Some file uploads failed', 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePaste = async (e, targetEditor) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      const files = e.clipboardData.files;
      const uploadedUrls = [];
      const newAttachments = [];

      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('module', 'SUPPORT_TEMP_ATTACHMENT');
          const res = await axios.post('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const url = extractFilePath(res.data);
          if (!url) continue;
          const isImage = file.type.startsWith('image') || (typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null);
          const fileName = (typeof res.data === 'object' && res.data?.fileName) ? res.data.fileName : file.name;

          uploadedUrls.push({ url, isImage });
          newAttachments.push({
            url: url,
            name: fileName,
            size: file.size,
            type: file.type || file.name.split('.').pop(),
            pasted: isImage
          });
        }

        setFormAttachments(prev => [...prev, ...newAttachments]);

        for (const item of uploadedUrls) {
          if (item.isImage) {
            const actualUrl = (typeof item.url === 'string' && item.url.startsWith('/api/')) ? item.url : `/api/files/view?path=${encodeURIComponent(item.url || '')}`;
            const imgTag = `<img src="${actualUrl}" />`;
            if (targetEditor === 'detailResolution') {
              setDetailResolution(prev => prev ? prev + imgTag : imgTag);
            } else if (targetEditor === 'formDesc') {
              setFormDesc(prev => prev ? prev + imgTag : imgTag);
            }
          }
        }

        showSnackbar('Attachments pasted successfully!');
      } catch (err) {
        showSnackbar('Failed to paste attachments', 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  useEffect(() => {
    setFormAttachments(prev => {
      let changed = false;
      const newAttachments = prev.filter(att => {
        if (att.pasted) {
          const actualUrl = (typeof att.url === 'string' && att.url.startsWith('/api/')) ? att.url : `/api/files/view?path=${encodeURIComponent(att.url || '')}`;
          const inDesc = formDesc && formDesc.includes(actualUrl);
          const inRes = detailResolution && detailResolution.includes(actualUrl);
          if (!inDesc && !inRes) {
            changed = true;
            return false;
          }
        }
        return true;
      });
      return changed ? newAttachments : prev;
    });
  }, [formDesc, detailResolution]);

  // Due Date & Target Date Reason Check
  const validateAndSubmitTicket = (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formTitle.trim() || !formDesc.trim()) {
      showSnackbar('Title and Description are required', 'warning');
      return;
    }
    if (formPriority === 'Select' || !formPriority) {
      showSnackbar('Please select a Priority Level.', 'warning');
      return;
    }
    if (formSourceType === 'Select' || !formSourceType) {
      showSnackbar('Please select a Source Type.', 'warning');
      return;
    }
    if ((formSourceType === 'Web' || formSourceType === 'Mobile') && !formPage) {
      showSnackbar('Please select a Screen / Page Name.', 'warning');
      return;
    }
    if (!formDevName || !formDevName.trim()) {
      showSnackbar('Please select an Assignee (Assigned To).', 'warning');
      return;
    }
    if (!formVerifiedBy || !formVerifiedBy.trim()) {
      showSnackbar('Please select a Verifier (Verified By).', 'warning');
      return;
    }
    if (!formAssignedHours || formAssignedHours === '00:00') {
      showSnackbar('Please select a valid Assigned Time.', 'warning');
      return;
    }

    const payload = {
      ticketType: formType,
      title: formTitle,
      moduleName: null,
      pageName: null,
      pageId: formPage?.pageId || null,
      employeeCode: formEmpCode || user?.empId || '',
      employeeName: formEmpName || user?.name || user?.username || '',
      email: formEmail,
      mobileNo: formMobile,
      department: formDeptName,
      description: formDesc,
      priorityLevel: formPriority,
      severityLevel: formSeverity,
      sourceType: formSourceType,
      ticketStatus: 'Open',
      attachmentPath: formAttachments
        .map(f => (typeof f === 'string' ? f : (f.url || f.filePath || f.path || '')))
        .filter(Boolean)
        .join(','),
      assignedHours: formAssignedHours || null,
      targetDate: formTargetDate ? new Date(formTargetDate) : null,
      developerName: formDevName || null,
      developerEmail: formDevEmail || null,
      developerMobileNo: formDevMobile || null,
      assignedTo: formDevName || 'Unassigned',
      verifiedBy: formVerifiedBy || null,
      testedBy: formTestedBy || null,
      createdBy: user?.username || user?.email || user?.name || 'SYSTEM',
      tempAttachments: formAttachments
        .map(f => (typeof f === 'string' ? f : (f.url || f.filePath || f.path || '')))
        .filter(Boolean),
      tempVoiceRecordings: formVoiceFiles
        .map(v => (typeof v === 'string' ? v : (v.filePath || v.path || '')))
        .filter(Boolean)
    };

    submitTicket(payload);
  };

  const submitTicket = async (payload) => {
    try {
      setIsSaving(true);
      await axios.post('/api/tickets', payload);
      showSnackbar('Task raised successfully!');
      setCreateOpen(false);
      setReasonOpen(false);
      setDueDateReasonText('');
      setPendingSavePayload(null);
      resetForm();
      if (location.state?.fromDashboard) {
        navigate('/dashboard/task-dashboard', {
          state: {
            fromTab: location.state?.fromTab,
            dashboardFilters: location.state?.dashboardFilters
          }
        });
      } else {
        fetchTickets();
      }
    } catch (err) {
      showSnackbar('Failed to create ticket: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReasonSubmit = () => {
    if (!dueDateReasonText.trim()) {
      showSnackbar('A reason is mandatory when target date exceeds due date', 'warning');
      return;
    }
    const updatedPayload = {
      ...pendingSavePayload,
      dueDateReason: dueDateReasonText
    };
    submitTicket(updatedPayload);
  };

  const getReassignReasonOptions = () => {
    const status = reassignTicket?.ticketStatus || '';
    if (status === 'To Be Tested') {
      return [
        'Bug Found During Testing', 'Test Case Failed', 'Regression Issue Identified',
        'Environment Issue', 'Integration Issue', 'Performance Issue',
        'Tester Not Available', 'Tester On Leave', 'Workload Balancing',
        'Requirement Clarification Needed', 'Test Data Not Available',
        'Deployment Dependency Pending', 'Verification Required Before Testing',
        'Testing Scope Changed', 'Others'
      ];
    } else if (status === 'To Be Verified') {
      return [
        'Estimation Exceeded', 'Delay in Progress', 'Incorrect Understanding of Requirement',
        'Quality Issues Identified', 'Additional Requirement Added', 'Priority Changed',
        'Resource Not Suitable', 'Dependency Not Resolved', 'Others'
      ];
    } else if (status === 'Yet To Deploy') {
      return [
        'Deployment Approval Pending',
        'Build Not Ready',
        'Code Merge Pending',
        'QA Verification Pending',
        'UAT Approval Pending',
        'Environment Not Ready',
        'Release Schedule Pending',
        'Dependency Pending',
        'Others'
      ];
    } else {
      return [
        'Workload Balancing', 'Leave / Not Available', 'Skill Set Required',
        'Dependency on Another Resource', 'Module Ownership Change', 'Priority Conflict',
        'Technical Expertise Required', 'Task Complexity Increased', 'Others'
      ];
    }
  };

  const getFilteredEmployeesList = () => {
    let list = employeesList.filter(emp => emp.employeeName !== (reassignTicket?.employeeName || reassignTicket?.createdBy));
    const status = reassignTicket?.ticketStatus || '';

    if (status === 'To Be Tested') {
      list = list.filter(emp => emp.isTaskTester && emp.isTaskTester.toLowerCase() === 'yes');
    } else if (status === 'To Be Verified') {
      const verticalHeads = new Set(employeesList.map(e => (e.verticalHead || '').trim().toLowerCase()).filter(Boolean));
      list = list.filter(emp => verticalHeads.has((emp.employeeName || '').trim().toLowerCase()));
    } else if (status === 'Yet To Deploy') {
      list = list.filter(emp => emp.permissionToggle && emp.permissionToggle.toLowerCase() === 'yes');
    }

    return list;
  };

  // Status transitions or assignee updates
  const handleReassignSubmit = async () => {
    if (!reassignEmployee) {
      showSnackbar('Please select an employee to reassign to', 'warning');
      return;
    }
    if (!reassignReason) {
      showSnackbar('Please select a reassignment reason', 'warning');
      return;
    }
    if (!reassignComment.trim()) {
      showSnackbar('Comments are mandatory for reassignment', 'warning');
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        assignedTo: reassignEmployee.employeeName,
        developerName: reassignEmployee.employeeName,
        developerEmail: reassignEmployee.officeMail || '',
        developerMobileNo: '',
        reassignReason: reassignReason,
        reassignComment: reassignComment
      };
      await axios.put(`/api/tickets/${reassignTicket.rowId}`, payload);
      showSnackbar('Task reassigned successfully!');
      setReassignOpen(false);
      setReassignEmployee(null);
      setReassignReason('');
      setReassignComment('');
      setReassignTicket(null);
      fetchTickets();
    } catch (err) {
      showSnackbar('Failed to reassign ticket: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTicketDetails = async () => {
    if (!selectedTicket) return;

    let rawReason = detailResolution;
    if (detailStatus === 'Reopened') {
      rawReason = (reopenReason === 'Others' || reopenReason === 'Additional Requirement Needed') ? detailResolution : reopenReason;
    }

    let plainTextReason = typeof rawReason === 'string' ? rawReason.replace(/<[^>]*>?/gm, '').trim() : '';

    // Comments mandatory if status is changed
    if (detailStatus !== selectedTicket.ticketStatus && (!plainTextReason)) {
      setCommentError(true);
      showSnackbar('Comments are mandatory for every status change', 'error');
      return;
    }
    setCommentError(false);

    let finalResolution = typeof rawReason === 'string' ? rawReason.trim() : rawReason;

    // ─── RAISED FOR ME RULES ───────────────────────────────────────────────
    if (currentViewType === 'raised-for-me') {
      // TO BE VERIFIED: Taken Time mandatory
      if (detailStatus === 'To Be Verified') {
        const isReopenedTicket = ticketReopens.length > 0 || (selectedTicket.reopenedCount && selectedTicket.reopenedCount > 0) || selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
        if (!detailTakenTime || !detailTakenTime.trim() || detailTakenTime === '00:00' || detailTakenTime === ':') {
          setTakenTimeError(true);
          showSnackbar(isReopenedTicket ? 'Rework Time is mandatory when status is To Be Verified' : 'Taken Time is mandatory when status is To Be Verified', 'warning');
          return;
        }
      }

      // Guard: CLOSED ticket
      if (selectedTicket.ticketStatus === 'Closed') {
        showSnackbar('This task is permanently closed', 'error');
        return;
      }
    } else if (currentViewType === 'raised-by-me') {
      // Guard: CLOSED ticket
      if (selectedTicket.ticketStatus === 'Closed') {
        showSnackbar('This task is permanently closed', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (currentViewType === 'raised-for-me') {
        let newTakenTime = selectedTicket.takenTime || '';
        let newReworkTime = selectedTicket.reworkTime || '';

        if (detailStatus === 'To Be Verified') {
          const isReopenedTicket = ticketReopens.length > 0 || (selectedTicket.reopenedCount && selectedTicket.reopenedCount > 0) || selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
          if (isReopenedTicket) {
            const isTransitionFromRework = selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
            if (isTransitionFromRework) {
              const existRw = parseDurationToMinutes(selectedTicket.reworkTime || '');
              const newRw = parseDurationToMinutes(detailTakenTime || '');
              const totalRw = existRw + newRw;
              newReworkTime = `${String(Math.floor(totalRw / 60)).padStart(2, '0')}:${String(totalRw % 60).padStart(2, '0')}`;
            } else {
              newReworkTime = detailTakenTime;
            }
          } else {
            newTakenTime = detailTakenTime;
          }
        }

        const isAddReq = detailStatus === 'Reopened' && reopenReason === 'Additional Requirement Needed';
        const mappedAttachments = formAttachments
          .map(f => (typeof f === 'string' ? f : (f.url || f.filePath || f.path || '')))
          .filter(Boolean);
        const mappedVoices = formVoiceFiles
          .map(v => (typeof v === 'string' ? v : (v.filePath || v.path || '')))
          .filter(Boolean);
        const commonPayload = {
          additionalRequirement: isAddReq ? detailResolution : detailAdditionalRequirement,
          tempAdditionalAttachments: isAddReq ? mappedAttachments : [],
          tempAdditionalVoiceRecordings: isAddReq ? mappedVoices : [],
          tempAttachments: !isAddReq ? mappedAttachments : [],
          tempVoiceRecordings: !isAddReq ? mappedVoices : []
        };

        const payload = {
          ...commonPayload,
          ticketStatus: detailStatus,
          assignedTo: detailAssignedTo,
          assignedBy: user?.name || user?.username || 'Admin',
          developerName: detailDevName,
          developerEmail: detailDevEmail,
          developerMobileNo: detailDevMobile,
          resolutionSummary: finalResolution,
          takenTime: newTakenTime,
          reworkTime: newReworkTime,
          targetDate: detailTargetDate ? new Date(detailTargetDate) : null,
        };

        if (dueDateReasonText) {
          payload.dueDateReason = dueDateReasonText;
        }

        const res = await axios.put(`/api/tickets/${selectedTicket.rowId}`, payload);
        setSelectedTicket(res.data);
        setDetailResolution('');
        setDetailTakenTime('');
        setDetailReworkTime('');
        await fetchTicketSubresources(selectedTicket.rowId);
        showSnackbar('Task updated successfully!');
        fetchTickets();
        setHasSavedInDetails(true);
        handleCloseDetails();
        setFormAttachments([]);
        setFormVoiceFiles([]);
        return;
      }

      // ─── RAISED BY ME RULES ────────────────────────────────────────────────
      if (currentViewType === 'raised-by-me') {
        const isAddReq = detailStatus === 'Reopened' && reopenReason === 'Additional Requirement Needed';
        const mappedAttachments = formAttachments
          .map(f => (typeof f === 'string' ? f : (f.url || f.filePath || f.path || '')))
          .filter(Boolean);
        const mappedVoices = formVoiceFiles
          .map(v => (typeof v === 'string' ? v : (v.filePath || v.path || '')))
          .filter(Boolean);
        const payload = {
          additionalRequirement: isAddReq ? detailResolution : detailAdditionalRequirement,
          tempAdditionalAttachments: isAddReq ? mappedAttachments : [],
          tempAdditionalVoiceRecordings: isAddReq ? mappedVoices : [],
          tempAttachments: !isAddReq ? mappedAttachments : [],
          tempVoiceRecordings: !isAddReq ? mappedVoices : []
        };

        if (detailEstimatedTime && detailEstimatedTime !== selectedTicket.assignedHours) {
          payload.assignedHours = detailEstimatedTime;
          if (detailTargetDate) {
            payload.targetDate = new Date(detailTargetDate);
          }
        }

        let isStatusUpdate = false;
        // REOPEN: assigned user gets REWORK status
        if (detailStatus === 'Reopened' && detailStatus !== selectedTicket.ticketStatus) {
          payload.ticketStatus = 'Reopened';
          payload.assignedUserStatus = 'Rework';  // signal backend to set assigned user's status to REWORK
          payload.resolutionSummary = finalResolution;
          isStatusUpdate = true;
        } else if (detailStatus === 'To Be Tested' && detailStatus !== selectedTicket.ticketStatus) {
          payload.ticketStatus = 'To Be Tested';
          payload.resolutionSummary = finalResolution;
          isStatusUpdate = true;
        } else if (detailStatus === 'Completed' && detailStatus !== selectedTicket.ticketStatus) {
          // COMPLETED: ticket final complete
          payload.ticketStatus = 'Completed';
          payload.resolutionSummary = finalResolution;
          payload.completedAt = new Date().toISOString();
          isStatusUpdate = true;
        } else {
          // Default: current status view only — update comment or attachments
          let hasChanges = false;
          if (payload.additionalRequirement !== (selectedTicket.additionalRequirement || '')) hasChanges = true;
          if (formAttachments.length > 0 || formVoiceFiles.length > 0) hasChanges = true;
          if (payload.assignedHours) hasChanges = true;
          if (finalResolution !== (selectedTicket.resolutionSummary || '')) {
            payload.resolutionSummary = finalResolution;
            hasChanges = true;
          }

          if (!hasChanges) {
            showSnackbar('No changes to apply', 'info');
            setIsSaving(false);
            return;
          }
        }

        try {
          const res = await axios.put(`/api/tickets/${selectedTicket.rowId}`, payload);
          setSelectedTicket(res.data);
          if (isStatusUpdate) {
            setDetailResolution('');
          }
          await fetchTicketSubresources(selectedTicket.rowId);

          if (detailStatus === 'Reopened') {
            showSnackbar('Task reopened — assigned user status set to REWORK');
          } else if (detailStatus === 'Completed') {
            showSnackbar('Task marked as Completed!');
          } else {
            showSnackbar('Task updated successfully!');
          }

          fetchTickets();
          setHasSavedInDetails(true);
          handleCloseDetails();
          setFormAttachments([]);
          setFormVoiceFiles([]);
        } catch (e) { showSnackbar('Failed to update ticket', 'error'); }
      }
    } catch (error) {
      showSnackbar('Failed to update ticket workflow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reopen flow
  const handleReopenTicket = async () => {
    if (!selectedTicket || !reopenReasonText.trim()) {
      showSnackbar('Reopen reason is mandatory', 'warning');
      return;
    }
    if (!reopenTargetDate) {
      showSnackbar('New target date is mandatory for reopening', 'warning');
      return;
    }
    if (!reopenTiming.trim()) {
      showSnackbar('Expected timing/duration is mandatory for reopening', 'warning');
      return;
    }

    const payload = {
      ticketStatus: 'Reopened',
      resolutionSummary: reopenReasonText,
      targetDate: new Date(reopenTargetDate),
      takenTime: reopenTiming
    };

    try {
      const res = await axios.put(`/api/tickets/${selectedTicket.rowId}`, payload);
      setSelectedTicket(res.data);
      setReopenReasonText('');
      setReopenTargetDate('');
      setReopenTiming('');
      setReopenOpen(false);
      showSnackbar('Ticket has been successfully reopened');
      fetchTickets();
    } catch (err) {
      showSnackbar('Failed to reopen ticket', 'error');
    }
  };

  // Post Comment
  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;

    const payload = {
      commentType: commentType,
      comments: newComment,
      attachmentPath: commentFile
    };

    try {
      await axios.post(`/api/tickets/${selectedTicket.rowId}/comments`, payload);
      setNewComment('');
      setCommentFile('');
      showSnackbar('Comment added successfully');
      fetchTicketSubresources(selectedTicket.rowId);
    } catch (err) {
      showSnackbar('Failed to add comment', 'error');
    }
  };

  const handleAddDirectAttachment = async (fileData, originalName) => {
    if (!selectedTicket) return;
    const path = extractFilePath(fileData);
    if (!path) return;
    const fileName = originalName || ((typeof fileData === 'object' && fileData?.fileName) ? fileData.fileName : path.substring(path.lastIndexOf('/') + 1));
    const payload = {
      fileName: fileName,
      filePath: path
    };

    try {
      await axios.post(`/api/tickets/${selectedTicket.rowId}/attachments`, payload);
      showSnackbar('Attachment uploaded successfully');
      fetchTicketSubresources(selectedTicket.rowId);
    } catch (err) {
      showSnackbar('Failed to attach file', 'error');
    }
  };

  const resetForm = () => {
    setFormType('Internal');
    setFormTitle('');
    setFormCategory('');
    setFormPage(null);
    setFormDesc('');
    setFormPriority('Select');
    setFormSeverity('Medium');
    setFormSourceType('Select');
    setFormAssignedHours('');
    setHoursPart('');
    setMinutesPart('');
    setFormTargetDate('');
    setTargetDateTooltip('');
    setFormAttachment('');
    setFormAttachments([]);
    setFormVoiceFiles([]);
    setFormDevName('');
    setFormDevEmail('');
    setFormDevMobile('');
    setFormVerifiedBy(user?.name || user?.username || '');
    setFormTestedBy('');
    if (user?.empId) {
      fetchEmployeeDetails();
    } else {
      setFormEmpName(user?.name || '');
      setFormEmail(user?.email || '');
      setFormEmpCode('');
      setFormMobile('');
      setFormDeptName('');
    }
  };

  // Helper lists for UI
  const departmentNames = useMemo(() => {
    const depts = new Set();
    employeesList.forEach(e => {
      if (e.department && e.department.departmentName) {
        depts.add(e.department.departmentName);
      }
    });
    return Array.from(depts).sort();
  }, [employeesList]);

  // Base view level filtering for Raised For Me vs Raised By Me
  const baseFilteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const myName = (user?.name || '').trim().toLowerCase();
      const myEmail = (user?.email || '').trim().toLowerCase();
      const myUsername = (user?.username || user?.userId || user?.id || '').trim().toLowerCase();

      // Map current user ID (a.USER_ID)
      const currentUserId = (user?.username || user?.userId || user?.id || '').trim().toLowerCase();
      const currentUserName = (user?.name || '').trim().toLowerCase();

      let myEmpName = '';
      if (user?.empId && employeesList) {
        const emp = employeesList.find(e => e.id == user.empId || e.empCode == user.empId || e.employeeCode == user.empId);
        if (emp && emp.employeeName) myEmpName = emp.employeeName.trim().toLowerCase();
      }

      // Build Team User IDs & Names based on: Vertical Head -> EMP_ID -> USER_ID
      const teamIdentifiers = [];
      employeesList.forEach(b => {
        const vHead = (b.verticalHead || '').trim().toLowerCase();
        if (vHead && (vHead === currentUserId || vHead === currentUserName || (myEmpName && vHead === myEmpName) || (myEmpName && vHead.includes(myEmpName)))) {
          if (b.employeeName) teamIdentifiers.push(b.employeeName.trim().toLowerCase());
          if (b.officeMail) {
            const mail = b.officeMail.trim().toLowerCase();
            teamIdentifiers.push(mail);
            if (mail.includes('@')) teamIdentifiers.push(mail.split('@')[0]);
          }
          const c = usersList.find(u => u.empId == b.id);
          if (c && c.userId) {
            teamIdentifiers.push(c.userId.trim().toLowerCase());
          }
        }
      });
      const scope = globalFilters?.taskScope || 'Mine';

      const matchTeam = (field) => {
        if (!field) return false;
        const f = field.toLowerCase();
        if (f === currentUserId || f === currentUserName || (myEmpName && f === myEmpName)) return true;
        return teamIdentifiers.includes(f);
      };

      if (currentViewType === 'raised-for-me') {
        const assignedTo = (t.assignedTo || t.developerName || '').toLowerCase();
        const createdBy = (t.createdBy || t.assignedBy || '').toLowerCase();
        const testedBy = (t.testedBy || '').toLowerCase();

        if (scope !== 'Company') {
          if (scope === 'Team') {
            // SQL for Request for me: inner join TICKET_TRACEABILITY_CENTER d on c.USER_ID=d.created_by
            if (!matchTeam(createdBy)) return false;
          } else {
            // Default 'Mine'
            const isAssigned = assignedTo && (assignedTo === currentUserId || assignedTo === currentUserName || (myEmpName && assignedTo === myEmpName) || (myEmpName && assignedTo.includes(myEmpName)));

            const hasReachedTesting = ['To Be Tested', 'Reopened', 'Rework', 'Resolved'].includes(t.ticketStatus) || (t.reopenedCount && t.reopenedCount > 0);
            let isTester = false;
            if (hasReachedTesting && testedBy) {
              const _tb = testedBy.trim();
              if (_tb && (_tb === currentUserId || _tb === currentUserName || (myEmpName && _tb === myEmpName))) isTester = true;

              if (employeesList) {
                const testerObj = employeesList.find(e => e.employeeName && e.employeeName.trim().toLowerCase() === _tb);
                if (testerObj) {
                  // Check by Employee ID
                  if (user?.empId && (testerObj.id == user.empId || testerObj.empCode == user.empId || testerObj.employeeCode == user.empId)) {
                    isTester = true;
                  }
                  // Check by User ID
                  if (usersList && currentUserId) {
                    const testerUser = usersList.find(u => u.empId == testerObj.id);
                    if (testerUser && testerUser.userId && testerUser.userId.trim().toLowerCase() === currentUserId) {
                      isTester = true;
                    }
                  }
                }
              }
            }

            if (!isAssigned && !isTester) return false;
          }
        }
      } else {
        const createdBy = (t.employeeName || t.createdBy || t.assignedBy || '').toLowerCase();
        const assignedTo = (t.assignedTo || t.developerName || '').toLowerCase();
        const testedBy = (t.testedBy || '').toLowerCase();

        if (scope !== 'Company') {
          if (scope === 'Team') {
            // SQL for My request: inner join TICKET_TRACEABILITY_CENTER d on c.USER_ID=d.assigned_to
            if (!matchTeam(assignedTo)) return false;
          } else {
            // Default 'Mine'
            const isCreator = createdBy && (createdBy === currentUserId || createdBy === currentUserName || (myEmpName && createdBy === myEmpName) || (myEmpName && createdBy.includes(myEmpName)));

            if (!isCreator) return false;
          }
        }
      }

      if (raisedToFilter) {
        const assignedTo = (t.assignedTo || '').toLowerCase();
        const targetRaisedTo = raisedToFilter.toLowerCase();
        if (assignedTo !== targetRaisedTo) return false;
      }
      const filterStatusVal = globalFilters?.ticketStatus || 'All';
      if (filterStatusVal === 'All' && currentViewType === 'raised-for-me') {
        if (scope === 'Mine' && t.ticketStatus === 'To Be Verified') return false;
        if (t.ticketStatus === 'Yet To Deploy') return false;
      }

      return true;
    });
  }, [tickets, currentViewType, globalFilters, user, raisedToFilter, employeesList, usersList]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = baseFilteredTickets.length;
    const open = baseFilteredTickets.filter(t => t.ticketStatus === 'Open').length;
    const inProgress = baseFilteredTickets.filter(t => t.ticketStatus === 'In Progress').length;
    const toBeVerified = baseFilteredTickets.filter(t => t.ticketStatus === 'To Be Verified').length;
    const yetToDeploy = baseFilteredTickets.filter(t => t.ticketStatus === 'Yet To Deploy').length;
    const toBeTested = baseFilteredTickets.filter(t => t.ticketStatus === 'To Be Tested').length;
    const reopened = baseFilteredTickets.filter(t => t.ticketStatus === 'Reopened' || (t.reopenedCount && t.reopenedCount > 0)).length;
    const completed = baseFilteredTickets.filter(t => t.ticketStatus === 'Completed').length;

    // Overdue is past due_date or has delay hours, and status is not Completed or Closed
    const now = new Date().getTime();
    const overdue = baseFilteredTickets.filter(t => {
      const isNotDone = t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Closed';
      if (!isNotDone) return false;

      // 1. Past due date check
      let isPastDue = false;
      if (t.dueDate) {
        const dTime = new Date(t.dueDate).getTime();
        isPastDue = dTime < now;
      }

      // 2. Delay hours check
      const estMins = parseDurationToMinutes(t.assignedHours || '');
      const actMins = parseDurationToMinutes(t.takenTime || '');
      const rwMins = parseDurationToMinutes(t.reworkTime || '');
      const totalSpent = actMins + rwMins;
      const hasDelayHours = estMins > 0 && totalSpent > estMins;

      return isPastDue || hasDelayHours;
    }).length;

    return { total, open, inProgress, toBeVerified, yetToDeploy, toBeTested, reopened, completed, overdue };
  }, [baseFilteredTickets]);

  // Color mappings
  const getPriorityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return theme.palette.error.dark;
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return theme.palette.info.main;
      case 'assigned': return theme.palette.secondary.main;
      case 'in progress': return theme.palette.warning.main;
      case 'hold': return theme.palette.error.main;
      case 'resolved': return theme.palette.success.main;
      case 'closed': return theme.palette.text.secondary;
      default: return theme.palette.primary.main;
    }
  };

  // Frontend Filters configuration
  const filteredTickets = useMemo(() => {
    return baseFilteredTickets.filter((t) => {
      // Redux Global filters
      const q = (globalQuery || '').toLowerCase();
      const matchesSearch = !q ||
        (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.moduleName && t.moduleName.toLowerCase().includes(q)) ||
        (t.pageName && t.pageName.toLowerCase().includes(q)) ||
        (t.pageCode && t.pageCode.toLowerCase().includes(q)) ||
        (t.employeeName && t.employeeName.toLowerCase().includes(q)) ||
        (t.developerName && t.developerName.toLowerCase().includes(q)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.priorityLevel && t.priorityLevel.toLowerCase().includes(q)) ||
        (t.ticketStatus && t.ticketStatus.toLowerCase().includes(q)) ||
        (t.assignedHours && t.assignedHours.toLowerCase().includes(q)) ||
        (t.takenTime && t.takenTime.toLowerCase().includes(q)) ||
        (t.reworkTime && t.reworkTime.toLowerCase().includes(q)) ||
        (t.targetDate && (() => {
          try {
            return safeFormatDate(t.targetDate, 'dd/MM/yyyy').includes(q);
          } catch {
            return false;
          }
        })()) ||
        (t.dueDate && (() => {
          try {
            return safeFormatDate(t.dueDate, 'dd/MM/yyyy').includes(q);
          } catch {
            return false;
          }
        })());

      // Global specific filters
      const filterId = (globalFilters.ticketId || '').toLowerCase();
      const matchesId = !filterId || (t.ticketId && t.ticketId.toLowerCase().includes(filterId));

      const filterTypeVal = globalFilters.ticketType || 'All';
      const matchesType = filterTypeVal === 'All' || t.ticketType === filterTypeVal;

      const filterStatusVal = globalFilters.ticketStatus || 'All';
      let matchesStatus = true;
      if (filterStatusVal === 'Active') {
        matchesStatus = t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Closed' && t.ticketStatus !== 'To Be Tested';
      } else {
        matchesStatus = filterStatusVal === 'All' ? t.ticketStatus !== 'Completed' : t.ticketStatus === filterStatusVal;
      }

      const filterPriorityVal = globalFilters.priorityLevel || 'All';
      const matchesPriority = filterPriorityVal === 'All' || t.priorityLevel === filterPriorityVal;

      const filterDeptVal = (globalFilters.department || '').toLowerCase();
      const matchesDept = !filterDeptVal || (t.department && t.department.toLowerCase().includes(filterDeptVal));

      const filterAssignedVal = (globalFilters.assignedTo || '').toLowerCase();
      const matchesAssigned = !filterAssignedVal || (t.assignedTo && t.assignedTo.toLowerCase().includes(filterAssignedVal));

      let matchesDate = true;
      if (globalFilters.startDate && t.createdAt) {
        matchesDate = matchesDate && new Date(t.createdAt) >= new Date(globalFilters.startDate + 'T00:00:00');
      }
      if (globalFilters.endDate && t.createdAt) {
        matchesDate = matchesDate && new Date(t.createdAt) <= new Date(globalFilters.endDate + 'T23:59:59');
      }

      const hasActiveFilters = q !== '' || filterId !== '' || filterTypeVal !== 'All' || filterStatusVal !== 'All' || filterPriorityVal !== 'All' || filterDeptVal !== '' || filterAssignedVal !== '' || globalFilters.startDate || globalFilters.endDate;

      let baseMatches = matchesSearch && matchesId && matchesType && matchesStatus && matchesPriority && matchesDept && matchesAssigned && matchesDate;

      // Hide completed tickets in 'raised-by-me' view unless actively searched for
      if (currentViewType === 'raised-by-me' && !hasActiveFilters && t.ticketStatus === 'Completed') {
        return false;
      }

      // Hide To Be Tested and Completed tickets in 'raised-for-me' view unless actively searched for
      if (currentViewType === 'raised-for-me' && !hasActiveFilters && (t.ticketStatus === 'To Be Tested' || t.ticketStatus === 'Completed')) {
        return false;
      }

      return baseMatches;
    });
  }, [baseFilteredTickets, globalQuery, globalFilters, currentViewType]);

  const pagedTickets = useMemo(() => {
    return filteredTickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredTickets, page, rowsPerPage]);

  const renderRoadmap = () => {
    if (!selectedTicket) return null;

    const roadmapEvents = ticketTimeline && ticketTimeline.length > 0
      ? ticketTimeline.filter(event => {
        if (!event.fromStatus) return true;
        if (event.fromStatus !== event.toStatus) return true;
        if (event.comment === 'Ticket created' || (event.comment && (event.comment.startsWith('Reassigned to') || event.comment.startsWith('Reassigned:')))) return true;
        try {
          const parsed = JSON.parse(event.comment);
          if (parsed && (parsed.activityName === 'Estimated Time Updated' || parsed.activityName === 'Estimated Time Set' || parsed.activityName === 'Additional Requirement Added' || parsed.activityName === 'Ticket Reassigned')) {
            return true;
          }
        } catch (e) { }
        return false;
      })
      : [{
        id: 'temp-created',
        toStatus: selectedTicket.ticketStatus,
        updatedBy: selectedTicket.employeeName || selectedTicket.createdBy,
        updatedAt: selectedTicket.createdAt,
        comment: 'Ticket created'
      }];

    return (
      <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', border: '1px solid #eef2f6', bgcolor: 'background.paper' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ display: 'inline-block', width: '8px', height: '16px', borderRadius: '4px', backgroundColor: '#673ab7' }}></span>
          Task Progress Roadmap
        </Typography>

        <Box sx={{ position: 'relative', pl: 1 }}>
          {roadmapEvents.map((event, idx) => {
            const isLast = idx === roadmapEvents.length - 1;
            const isReassign = event.comment && (event.comment.startsWith('Reassigned to') || event.comment.startsWith('Reassigned:'));

            let titleText = '';
            if (event.comment === 'Ticket created') {
              titleText = 'Task Created';
            } else if (isReassign) {
              titleText = event.comment;
            } else {
              titleText = event.fromStatus && event.fromStatus !== event.toStatus
                ? `Status: ${event.fromStatus} → ${event.toStatus}`
                : `Status: ${event.toStatus}`;
            }

            return (
              <Box key={event.id || idx} sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 3 }}>
                {!isLast && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 11,
                      top: 24,
                      bottom: 0,
                      width: '2px',
                      bgcolor: '#673ab7',
                      zIndex: 1
                    }}
                  />
                )}

                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: isLast ? '#ede7f6' : '#673ab7',
                    border: '2px solid #673ab7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLast ? '#673ab7' : '#fff',
                    zIndex: 2,
                    mr: 2,
                    boxShadow: isLast ? '0 0 0 4px rgba(103, 58, 183, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isLast ? (
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#673ab7' }} />
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 900 }}>✓</span>
                  )}
                </Box>

                <Box sx={{ pt: 0.2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    {titleText}
                    {isLast && (
                      <Chip label="Current" size="small" sx={{ bgcolor: '#ede7f6', color: '#673ab7', fontWeight: 700, height: 16, fontSize: '0.65rem' }} />
                    )}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {safeFormatDate(event.updatedAt, 'dd/MM/yyyy HH:mm')} by {event.updatedBy}
                  </Typography>

                  {event.comment && event.comment !== 'Ticket created' && !isReassign && !event.comment.startsWith('Status updated to') && (() => {
                    let textToDisplay = event.comment;
                    let isHtml = false;
                    try {
                      const parsed = JSON.parse(event.comment);
                      if (parsed && parsed.comment) {
                        textToDisplay = parsed.comment;
                        isHtml = true;
                      }
                    } catch (e) {
                      // not JSON
                    }
                    if (isHtml || textToDisplay.includes('<p>')) {
                      return (
                        <Box sx={{ typography: 'caption', display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary', bgcolor: 'background.default', p: 1, borderRadius: '4px', borderLeft: '3px solid #673ab7', '& p': { m: 0 }, '& img': { display: 'none' } }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(textToDisplay) }} />
                      );
                    }
                    return (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary', bgcolor: 'background.default', p: 1, borderRadius: '4px', borderLeft: '3px solid #673ab7' }}>
                        "{textToDisplay}"
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    );
  };

  const getPageDisplay = (t) => {
    if (t.pageId && pagesData.length > 0) {
      const p = pagesData.find(page => page.pageId === t.pageId);
      if (p) {
        return p.pageName || 'Unknown Page';
      }
    }
    return t.pageName || 'Unknown Page';
  };

  const activeTicketsForSelectedPage = useMemo(() => {
    if (!formPage || !tickets) return [];
    return tickets.filter(t =>
      t.pageId === formPage.pageId &&
      ['Open', 'In Progress', 'Reopened', 'Overdue'].includes(t.ticketStatus)
    );
  }, [formPage, tickets]);

  const activeDevelopersForSelectedPage = useMemo(() => {
    if (!formPage || !tickets) return [];
    const activeTickets = tickets.filter(t =>
      String(t.pageId) === String(formPage.pageId) &&
      t.ticketStatus !== 'Completed' &&
      t.ticketStatus !== 'To Be Tested' &&
      t.ticketStatus !== 'Closed' &&
      (t.developerName || t.assignedTo)
    );
    const devs = activeTickets.map(t => (t.developerName || t.assignedTo).trim());
    return Array.from(new Set(devs));
  }, [formPage, tickets]);

  const activeDevelopersInOptions = useMemo(() => {
    if (!employeesList || !user) return [];
    const filteredEmployees = employeesList.filter(
      e => (user?.empId ? Number(e.id) !== Number(user.empId) : true) && (user?.empCode ? String(e.empCode).toLowerCase() !== String(user.empCode).toLowerCase() : true)
    );
    return activeDevelopersForSelectedPage.filter(dev =>
      filteredEmployees.some(opt => opt.employeeName?.trim().toLowerCase() === dev.toLowerCase())
    );
  }, [activeDevelopersForSelectedPage, employeesList, user]);

  if (selectedTicket && detailsOpen) {
    const roadmapEvents = ticketTimeline && ticketTimeline.length > 0
      ? ticketTimeline.filter(event => {
        if (!event.fromStatus) return true;
        if (event.fromStatus !== event.toStatus) return true;
        if (event.comment === 'Ticket created' || (event.comment && (event.comment.startsWith('Reassigned to') || event.comment.startsWith('Reassigned:')))) return true;
        try {
          const parsed = JSON.parse(event.comment);
          if (parsed && (parsed.activityName === 'Estimated Time Updated' || parsed.activityName === 'Estimated Time Set' || parsed.activityName === 'Additional Requirement Added' || parsed.activityName === 'Ticket Reassigned')) {
            return true;
          }
        } catch (e) { }
        return false;
      })
      : [{
        id: 'temp-created',
        toStatus: selectedTicket.ticketStatus,
        updatedBy: selectedTicket.employeeName || selectedTicket.createdBy,
        updatedAt: selectedTicket.createdAt,
        comment: 'Ticket created'
      }];

    if (selectedTicket.developerName) {
      fetchDevWorkload(selectedTicket.developerName);
    } else {
      setDetailDevWorkloadTrail([]);
    }

    return (
      <Box sx={{ flexGrow: 1, pt: 1, pb: { xs: 2, md: 3 }, px: { xs: 1, md: 1.5 }, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
        {/* Header — compact single-line format */}
        {(() => {
          const estMins = parseDurationToMinutes(selectedTicket.assignedHours);
          const actMins = parseDurationToMinutes(selectedTicket.takenTime);
          const rwMins = parseDurationToMinutes(selectedTicket.reworkTime);
          const totalSpent = actMins + rwMins;
          const delayMins = estMins > 0 ? totalSpent - estMins : null;
          const toHHMM = (m) => { const h = Math.floor(Math.abs(m) / 60); const mn = Math.abs(m) % 60; return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`; };
          const delayStr = delayMins === null ? null : delayMins < 0 ? `-${toHHMM(-delayMins)}` : delayMins === 0 ? '00:00' : `+${toHHMM(delayMins)}`;
          const delayColor = delayMins === null ? 'inherit' : delayMins < 0 ? '#16a34a' : delayMins === 0 ? '#d97706' : '#dc2626';
          const sep = <Typography component="span" sx={{ color: '#cbd5e1', mx: 0.5 }}>|</Typography>;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1, flexWrap: 'nowrap', overflowX: 'auto', pb: 0.5 }}>
              {/* Left Side: Back button and Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Tooltip title="Back (Esc)" arrow placement="bottom">
                  <IconButton
                    onClick={handleCloseDetails}
                    sx={{
                      width: 48, height: 48, borderRadius: '12px',
                      bgcolor: '#f3e8ff', color: '#673ab7',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#e9d5ff', transform: 'scale(1.05)' }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>

              </Box>

              {/* Middle Side: Stat Cards */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', flexGrow: 1, ml: 2 }}>
                {[
                  { label: 'Task No', value: selectedTicket.ticketId },
                  { label: 'Title', value: selectedTicket.title },
                  { label: 'Target Date', value: selectedTicket.targetDate ? safeFormatDate(selectedTicket.targetDate, 'dd/MM/yyyy') : '-', icon: <CalendarTodayIcon sx={{ color: '#64748b', fontSize: 20 }} /> },
                  { label: 'Assigned Hrs', value: selectedTicket.assignedHours ? (() => { const m = parseDurationToMinutes(selectedTicket.assignedHours); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; })() : '-', icon: <TimerIcon sx={{ color: '#64748b', fontSize: 20 }} /> },
                  { label: 'Complete Date', value: selectedTicket.resolvedAt ? safeFormatDate(selectedTicket.resolvedAt, 'dd/MM/yyyy hh:mm aa') : '-', icon: <AccessTimeIcon sx={{ color: '#64748b', fontSize: 20 }} /> },
                  { label: 'Actual Spend', value: actMins > 0 ? toHHMM(actMins) : '-', icon: <TimerIcon sx={{ color: '#0369a1', fontSize: 20 }} />, valueColor: '#0369a1' },
                  { label: 'Rework', value: rwMins > 0 ? toHHMM(rwMins) : '-', icon: <TimerIcon sx={{ color: '#92400e', fontSize: 20 }} />, valueColor: '#92400e' },
                  { label: 'Reopen Count', value: ticketReopens.length > 0 ? ticketReopens.length : (selectedTicket.reopenedCount || 0), icon: <ReplayIcon sx={{ color: '#d97706', fontSize: 20 }} />, valueColor: '#d97706' },
                  { label: 'Total Spend', value: totalSpent > 0 ? toHHMM(totalSpent) : '-', icon: <TimerIcon sx={{ color: '#334155', fontSize: 20 }} />, valueColor: '#334155' },
                  { label: 'Delay Hrs', value: delayStr || '-', icon: <InfoOutlinedIcon sx={{ color: delayColor !== 'inherit' ? delayColor : '#64748b', fontSize: 20 }} />, valueColor: delayColor !== 'inherit' ? delayColor : '#1e293b' }
                ].map((stat, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    bgcolor: 'background.paper', border: '1px solid #eef2f6', borderRadius: '12px',
                    py: 0.5, px: 1.5, minWidth: 'auto', position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {stat.label}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5, gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: stat.valueColor || '#1e293b', whiteSpace: 'nowrap' }}>
                        {stat.value}
                      </Typography>
                      {stat.icon && <Box sx={{ display: 'flex', alignItems: 'center' }}>{stat.icon}</Box>}
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Right Side: Save Button */}
              {selectedTicket.ticketStatus !== 'Closed' && (
                <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                  <Tooltip title="Ctrl + S" arrow placement="bottom">
                    <span>
                      <Button
                        id="ticket-update-button"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleUpdateTicketDetails}
                        disabled={isSaving || (hasSavedInDetails && detailStatus === selectedTicket.ticketStatus)}
                        sx={{
                          height: 48, px: 4, fontWeight: 700, borderRadius: '12px',
                          bgcolor: '#673ab7', color: '#fff',
                          boxShadow: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': { bgcolor: '#5e35b1', transform: 'translateY(-2px)', boxShadow: 'none' },
                          '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' }
                        }}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            </Box>
          );
        })()}

        {/* NotebookLM Style Flexible Split Layout */}
        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 180px)' }}>

          {/* Part 1: Task Description (30%) */}
          <Box sx={{
            flex: panelsOpen.part1 ? 3 : '0 0 50px',
            transition: 'all 0.3s ease',
            borderRadius: '12px', border: '1px solid #eef2f6',
            bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f6', cursor: 'pointer', bgcolor: 'background.paper', height: panelsOpen.part1 ? 'auto' : '100%' }} onClick={() => handleTogglePanel('part1')}>
              {panelsOpen.part1 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DescriptionOutlinedIcon sx={{ color: '#673ab7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Task Description</Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ fontWeight: 800, writingMode: 'vertical-rl', transform: 'rotate(180deg)', py: 2, letterSpacing: '1px', color: '#64748b' }}>Task Description</Typography>
              )}
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTogglePanel('part1'); }} sx={{ position: panelsOpen.part1 ? 'relative' : 'absolute', top: panelsOpen.part1 ? 0 : 8 }}>
                {panelsOpen.part1 ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={panelsOpen.part1} sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: '8px', border: '1px solid #eef2f6', minHeight: 60, mb: 2, '& img': { display: 'none' } }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTicket.description || '') }} />

                <Grid container spacing={1.5}>
                  {[
                    { label: 'Severity', value: selectedTicket.severityLevel, icon: <SecurityOutlinedIcon sx={{ color: '#f59e0b', fontSize: 16 }} /> },
                    { label: 'Source', value: selectedTicket.sourceType, icon: <LanguageOutlinedIcon sx={{ color: '#3b82f6', fontSize: 16 }} /> },
                    { label: 'Page Name', value: getPageDisplay(selectedTicket), icon: <DesktopWindowsOutlinedIcon sx={{ color: '#0ea5e9', fontSize: 16 }} />, xs: 12 },
                    { label: 'Created By', value: selectedTicket.employeeName || selectedTicket.createdBy, icon: <PersonOutlineIcon sx={{ color: '#6366f1', fontSize: 16 }} /> },
                    { label: 'Verified By', value: selectedTicket.verifiedBy || selectedTicket.verifierName, icon: <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} /> },
                    { label: 'Tested By', value: selectedTicket.testedBy || 'None', icon: <CheckCircleIcon sx={{ color: '#8b5cf6', fontSize: 16 }} /> },
                    ...(selectedTicket.verifierName ? [{ label: 'Verifier Name', value: selectedTicket.verifierName, icon: <PersonOutlineIcon sx={{ color: '#6366f1', fontSize: 16 }} /> }] : []),
                    ...(selectedTicket.verifierPhone ? [{ label: 'Verifier Phone', value: selectedTicket.verifierPhone, icon: <PersonOutlineIcon sx={{ color: '#6366f1', fontSize: 16 }} /> }] : [])
                  ].map((item, idx) => (
                    <Grid item xs={item.xs || 6} key={idx}>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #eef2f6', borderRadius: '8px', bgcolor: 'background.paper', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '6px', bgcolor: 'background.default' }}>
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0, fontSize: '0.65rem' }}>{item.label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b' }}>{item.value || '-'}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Additional Requirement */}
                {(selectedTicket.additionalRequirement && selectedTicket.additionalRequirement.replace(/<[^>]*>?/gm, '').trim() !== '') && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eef2f6' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, display: 'block' }}>Additional Requirement</Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: 80, mb: 2, '& img': { display: 'none' } }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTicket.additionalRequirement) }} />
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* Part 2: Workflow / Files (50%) */}
          <Box sx={{
            flex: panelsOpen.part2 ? 5 : '0 0 50px',
            transition: 'all 0.3s ease',
            borderRadius: '12px', border: '1px solid #eef2f6',
            bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f6', cursor: 'pointer', bgcolor: 'background.paper', height: panelsOpen.part2 ? 'auto' : '100%' }} onClick={() => handleTogglePanel('part2')}>
              {panelsOpen.part2 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountTreeOutlinedIcon sx={{ color: '#673ab7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Workflow & Files</Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ fontWeight: 800, writingMode: 'vertical-rl', transform: 'rotate(180deg)', py: 2, letterSpacing: '1px', color: '#64748b' }}>Workflow & Files</Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {panelsOpen.part2 && (() => {
                  const isReopenedTicket = ticketReopens.length > 0 || (selectedTicket.reopenedCount && selectedTicket.reopenedCount > 0) || selectedTicket.ticketStatus === 'Reopened' || selectedTicket.ticketStatus === 'Rework';
                  return (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status <span style={{ color: '#dc2626' }}>*</span></Typography>
                        {currentViewType === 'raised-for-me' ? (
                          <TextField
                            select size="small"
                            value={detailStatus}
                            onChange={(e) => {
                              setDetailStatus(e.target.value);
                              setDetailResolution('');
                              setReopenReason('');
                              setDetailTakenTime('');
                              setDetailTakenHours('');
                              setDetailTakenMinutes('');
                              setTakenTimeError(false);
                              setDetailReworkTime('');
                            }}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'background.paper', '& fieldset': { borderColor: '#eef2f6' }, fontSize: '0.875rem' } }}
                          >
                            {!isReopenedTicket && <MenuItem key="Open" value="Open" disabled={selectedTicket.ticketStatus !== 'Open'} sx={{ fontSize: '0.875rem' }}>OPEN</MenuItem>}
                            {!isReopenedTicket && <MenuItem key="InProgress" value="In Progress" sx={{ fontSize: '0.875rem' }}>IN PROGRESS</MenuItem>}
                            <MenuItem key="ToBeVerified" value="To Be Verified" sx={{ fontSize: '0.875rem' }}>TO BE VERIFIED</MenuItem>
                            {globalFilters?.taskScope !== 'Mine' && <MenuItem key="YetToDeploy" value="Yet To Deploy" sx={{ fontSize: '0.875rem' }}>YET TO DEPLOY</MenuItem>}
                            {isReopenedTicket && <MenuItem key="Rework" value="Rework" sx={{ fontSize: '0.875rem' }}>REWORK</MenuItem>}
                            <MenuItem key="Reopened" value="Reopened" disabled sx={{ fontSize: '0.875rem' }}>REOPEN</MenuItem>
                          </TextField>
                        ) : (
                          <TextField
                            select size="small"
                            value={detailStatus}
                            onChange={(e) => { setDetailStatus(e.target.value); setDetailResolution(''); setReopenReason(''); setDetailTakenTime(''); setTakenTimeError(false); }}
                            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'background.paper', '& fieldset': { borderColor: '#eef2f6' }, fontSize: '0.875rem' } }}
                          >
                            <MenuItem key="current" value={selectedTicket.ticketStatus} disabled>{selectedTicket.ticketStatus.toUpperCase()}</MenuItem>
                            <MenuItem key="ToBeTested" value="To Be Tested">TO BE TESTED</MenuItem>
                            <MenuItem key="Reopened" value="Reopened">REOPEN</MenuItem>
                            <MenuItem key="Completed" value="Completed">COMPLETED</MenuItem>
                          </TextField>
                        )}
                      </Box>
                      {currentViewType === 'raised-for-me' && detailStatus === 'To Be Verified' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }} onClick={(e) => e.stopPropagation()}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: takenTimeError ? '#d32f2f' : '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isReopenedTicket ? 'Rework Time' : 'Taken Time'} <span style={{ color: '#dc2626' }}>*</span></Typography>
                          <FormControl sx={{ width: 'max-content', mt: 0 }} variant="outlined">
                            <OutlinedInput
                              notched={false}
                              inputProps={{ sx: { display: 'none' }, readOnly: true }}
                              sx={{
                                p: 0, height: '36px', borderRadius: '8px', bgcolor: 'background.paper',
                                '& fieldset': { borderColor: takenTimeError ? '#d32f2f' : '#eef2f6' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: takenTimeError ? '#d32f2f' : '#1976d2', borderWidth: '1.5px' }
                              }}
                              onFocus={() => setIsDetailTakenTimeFocused(true)}
                              onBlur={(e) => { if (!e.relatedTarget) setIsDetailTakenTimeFocused(false); }}
                              startAdornment={
                                <Box sx={{ display: 'flex', alignItems: 'center', p: '0 8px', gap: 1 }}>
                                  <AccessTimeIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                  <Box sx={{
                                    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    border: detailTakenHoursFocused ? '1px solid #1976d2' : '1px solid transparent',
                                    bgcolor: detailTakenHoursFocused ? '#f0f7ff' : 'transparent',
                                    borderRadius: '6px', width: '45px', height: '32px', cursor: 'pointer', transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#1976d2' }
                                  }}>
                                    <Select variant="standard" disableUnderline value={detailTakenHours || '00'}
                                      onChange={(e) => { const val = e.target.value; setDetailTakenHours(val); if (val === '24') setDetailTakenMinutes('00'); setIsDetailTakenTimeFocused(true); }}
                                      onOpen={() => setDetailTakenHoursFocused(true)} onClose={() => setDetailTakenHoursFocused(false)}
                                      MenuProps={{ PaperProps: { sx: { maxHeight: 250 } } }} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1, cursor: 'pointer' }}>
                                      {Array.from({ length: 25 }, (_, i) => { const val = String(i).padStart(2, '0'); return <MenuItem key={val} value={val} sx={{ fontSize: '0.875rem' }}>{val}</MenuItem>; })}
                                    </Select>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{detailTakenHours || '00'}</Typography>
                                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#64748b', mt: 0.3 }}>Hours</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                        <IconButton size="small" sx={{ p: 0 }} onClick={(e) => { e.stopPropagation(); let h = parseInt(detailTakenHours || '0', 10); h = (h + 1) % 25; setDetailTakenHours(String(h).padStart(2, '0')); if (h === 24) setDetailTakenMinutes('00'); }}>
                                          <KeyboardArrowUpIcon sx={{ fontSize: 12, color: '#64748b' }} />
                                        </IconButton>
                                        <IconButton size="small" sx={{ p: 0 }} onClick={(e) => { e.stopPropagation(); let h = parseInt(detailTakenHours || '0', 10); h = h - 1 < 0 ? 24 : h - 1; setDetailTakenHours(String(h).padStart(2, '0')); if (h === 24) setDetailTakenMinutes('00'); }}>
                                          <KeyboardArrowDownIcon sx={{ fontSize: 12, color: '#64748b' }} />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', pb: 0.5 }}>:</Typography>
                                  <Box sx={{
                                    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    border: detailTakenMinutesFocused ? '1px solid #1976d2' : '1px solid transparent',
                                    bgcolor: detailTakenMinutesFocused ? '#f0f7ff' : 'transparent',
                                    borderRadius: '6px', width: '45px', height: '32px', cursor: 'pointer', transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#1976d2' }
                                  }}>
                                    <Select variant="standard" disableUnderline value={detailTakenMinutes || '00'}
                                      onChange={(e) => { setDetailTakenMinutes(e.target.value); setIsDetailTakenTimeFocused(true); }}
                                      onOpen={() => setDetailTakenMinutesFocused(true)} onClose={() => setDetailTakenMinutesFocused(false)}
                                      MenuProps={{ PaperProps: { sx: { maxHeight: 250 } } }} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1, cursor: 'pointer' }}>
                                      {Array.from({ length: 60 }, (_, i) => { const val = String(i).padStart(2, '0'); return <MenuItem key={val} value={val} disabled={detailTakenHours === '24' && val !== '00'} sx={{ fontSize: '0.875rem' }}>{val}</MenuItem>; })}
                                    </Select>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{detailTakenMinutes || '00'}</Typography>
                                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#64748b', mt: 0.3 }}>Minutes</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                        <IconButton size="small" sx={{ p: 0 }} disabled={detailTakenHours === '24'} onClick={(e) => { e.stopPropagation(); if (detailTakenHours === '24') return; let m = parseInt(detailTakenMinutes || '0', 10); m = (m + 1) % 60; setDetailTakenMinutes(String(m).padStart(2, '0')); }}>
                                          <KeyboardArrowUpIcon sx={{ fontSize: 12, color: detailTakenHours === '24' ? '#cbd5e1' : '#64748b' }} />
                                        </IconButton>
                                        <IconButton size="small" sx={{ p: 0 }} disabled={detailTakenHours === '24'} onClick={(e) => { e.stopPropagation(); if (detailTakenHours === '24') return; let m = parseInt(detailTakenMinutes || '0', 10); m = m - 1 < 0 ? 59 : m - 1; setDetailTakenMinutes(String(m).padStart(2, '0')); }}>
                                          <KeyboardArrowDownIcon sx={{ fontSize: 12, color: detailTakenHours === '24' ? '#cbd5e1' : '#64748b' }} />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              }
                            />
                          </FormControl>
                        </Box>
                      )}
                    </>
                  );
                })()}
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTogglePanel('part2'); }} sx={{ position: panelsOpen.part2 ? 'relative' : 'absolute', top: panelsOpen.part2 ? 0 : 8, right: panelsOpen.part2 ? 'auto' : 0, left: panelsOpen.part2 ? 'auto' : 0, margin: panelsOpen.part2 ? 0 : '0 auto' }}>
                  {panelsOpen.part2 ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
            <Collapse in={panelsOpen.part2} sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
                    {/* Scrollable form area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                      <Stack spacing={2}>
                        {/* COMMENTS */}
                        {detailStatus === 'Reopened' && (
                          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ width: '50%', maxWidth: '400px' }}>
                              <TextField
                                select
                                disabled={currentViewType !== 'raised-by-me'}
                                error={commentError && !reopenReason}
                                helperText={commentError && !reopenReason ? "Please select a reason for reopening" : ""}
                                fullWidth size="small"
                                label="Reason for Reopening *"
                                required
                                value={reopenReason}
                                onChange={(e) => {
                                  setReopenReason(e.target.value);
                                  if (e.target.value === 'Others') setDetailResolution('');
                                  if (e.target.value) setCommentError(false);
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px', bgcolor: 'background.default', transition: 'all 0.2s',
                                    '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused': { bgcolor: 'background.paper', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1px' },
                                    '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#64748b' }
                                  }
                                }}
                              >
                                {['Not Working as Expected', 'Additional Requirement Needed', 'Requirement Not Fully Completed', 'Incorrect Output', 'Missing Functionality', 'UI/Design Changes Required', 'Validation Issue Found', 'Bug Still Exists', 'Rework Required', 'Performance Improvement Needed', 'Requirement Changed', 'Clarification Required', 'Testing Failed', 'Quality Issue Identified', 'Others'].map(r => (
                                  <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                              </TextField>
                            </Box>
                            {reopenReason === 'Additional Requirement Needed' && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: (commentError && !reopenReason) ? -2.5 : 0 }} onClick={(e) => e.stopPropagation()}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ESTIMATED TIME</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '12px', px: 1.5, bgcolor: 'background.default', height: 40 }}>
                                  <AccessTimeIcon sx={{ color: '#6366f1', fontSize: 20, mr: 1.5 }} />
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Select
                                      value={detailEstimatedHours || '00'}
                                      onChange={(e) => {
                                        setDetailEstimatedHours(e.target.value);
                                        if (e.target.value === '24') setDetailEstimatedMinutes('00');
                                      }}
                                      disabled={currentViewType !== 'raised-by-me'}
                                      MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                      sx={{ width: 65, height: 22, '& fieldset': { border: 'none' }, '.MuiSelect-select': { p: '0px 20px 0px 0px !important', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }, '& .MuiSvgIcon-root': { right: 0, fontSize: 18 } }}
                                    >
                                      {Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                        <MenuItem key={h} value={h} sx={{ fontSize: '0.875rem', justifyContent: 'center' }}>{h}</MenuItem>
                                      ))}
                                    </Select>
                                    <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b', mt: '-2px' }}>Hours</Typography>
                                  </Box>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mx: 0.5, mt: '-14px' }}>:</Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Select
                                      value={detailEstimatedMinutes || '00'}
                                      onChange={(e) => setDetailEstimatedMinutes(e.target.value)}
                                      disabled={currentViewType !== 'raised-by-me' || detailEstimatedHours === '24'}
                                      MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                      sx={{ width: 65, height: 22, '& fieldset': { border: 'none' }, '.MuiSelect-select': { p: '0px 20px 0px 0px !important', textAlign: 'center', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }, '& .MuiSvgIcon-root': { right: 0, fontSize: 18 } }}
                                    >
                                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                        <MenuItem key={m} value={m} sx={{ fontSize: '0.875rem', justifyContent: 'center' }}>{m}</MenuItem>
                                      ))}
                                    </Select>
                                    <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b', mt: '-2px' }}>Minutes</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        )}

                        {(detailStatus !== 'Reopened' || reopenReason === 'Others' || reopenReason === 'Additional Requirement Needed') && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', display: 'block', mb: 1 }}>Comments *</Typography>
                            <Box sx={{
                              '.ql-container': { minHeight: '120px !important', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' },
                              '.ql-toolbar': { borderTopLeftRadius: '12px', borderTopRightRadius: '12px', bgcolor: 'background.default' },
                              '& .ql-editor img': { maxWidth: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '4px' },
                              border: commentError ? '1px solid #d32f2f' : '1px solid #e2e8f0',
                              borderRadius: '12px',
                              bgcolor: 'background.paper',
                              mb: 1
                            }} onPasteCapture={(e) => handlePaste(e, 'detailResolution')}>
                              <ReactQuillDemo
                                value={detailResolution}
                                onChange={(val) => {
                                  setDetailResolution(val);
                                  if (val.replace(/<[^>]*>?/gm, '').trim()) setCommentError(false);
                                }}
                              />
                            </Box>
                            {commentError && (
                              <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 1 }}>Comments are mandatory for status changes</Typography>
                            )}

                            {detailStatus === 'Reopened' && reopenReason === 'Additional Requirement Needed' && (
                              <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Button
                                    component="label"
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    sx={{
                                      height: 36,
                                      borderStyle: 'dashed',
                                      borderColor: '#6366f1',
                                      color: '#6366f1',
                                      borderRadius: '8px',
                                      px: 2, fontWeight: 600, fontSize: '0.75rem',
                                      textTransform: 'none',
                                      '&:hover': { borderStyle: 'dashed', borderColor: '#4f46e5', bgcolor: '#e0e7ff' }
                                    }}
                                  >
                                    {uploading ? 'Uploading...' : 'Upload Attachments'}
                                    <input type="file" multiple hidden onChange={(e) => handleFileUpload(e, false)} />
                                  </Button>
                                  <Tooltip title={isRecordingAudio ? "Stop & Save Recording" : "Record Voice Audio Note"}>
                                    <Button
                                      variant={isRecordingAudio ? "contained" : "outlined"}
                                      color={isRecordingAudio ? "error" : "secondary"}
                                      onClick={handleToggleLiveRecording}
                                      sx={{
                                        height: 36,
                                        borderStyle: isRecordingAudio ? 'solid' : 'dashed',
                                        borderColor: isRecordingAudio ? 'error.main' : '#6366f1',
                                        color: isRecordingAudio ? '#fff' : '#6366f1',
                                        borderRadius: '8px',
                                        px: 2, fontWeight: 600, fontSize: '0.75rem',
                                        textTransform: 'none',
                                        animation: isRecordingAudio ? 'pulse-voice 1.5s infinite' : 'none',
                                        '&:hover': { borderStyle: isRecordingAudio ? 'solid' : 'dashed', borderColor: isRecordingAudio ? 'error.dark' : '#4f46e5', bgcolor: isRecordingAudio ? 'error.dark' : '#e0e7ff' }
                                      }}
                                      startIcon={isRecordingAudio ? <StopIcon /> : <MicNoneIcon />}
                                    >
                                      {isRecordingAudio ? "Recording..." : "Record Audio"}
                                    </Button>
                                  </Tooltip>
                                </Box>
                                {(formAttachments.length > 0 || formVoiceFiles.length > 0) && (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, maxHeight: 150, overflowY: 'auto', mb: 2 }}>
                                    {formAttachments.map((fileObj, idx) => {
                                      const isUrlStr = typeof fileObj === 'string';
                                      const rawPath = isUrlStr ? fileObj : (fileObj?.url || fileObj?.filePath || fileObj?.path || '');
                                      const url = typeof rawPath === 'string' ? rawPath : '';
                                      const name = isUrlStr ? (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document') : (fileObj.name || (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document'));
                                      const size = isUrlStr ? null : fileObj.size;
                                      const canPreview = isPreviewable(name);

                                      return (
                                        <Box key={`a-${idx}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default', border: '1px solid #e2e8f0', p: 1, borderRadius: '6px', mb: 0.5 }}>
                                          <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <InsertDriveFileIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <Tooltip title={name} arrow>
                                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {name}
                                              </Typography>
                                            </Tooltip>
                                          </Box>
                                          <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                            {getFileTypeDisplay(name)}
                                          </Typography>
                                          <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                            {size ? formatFileSize(size) : 'Unknown'}
                                          </Typography>
                                          <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                            {canPreview ? (
                                              <Button size="small" onClick={() => {
                                                if (url) {
                                                  setPreviewFileData({ url, name, type: getFileTypeDisplay(name) });
                                                  setPreviewModalOpen(true);
                                                } else {
                                                  showSnackbar('Invalid file path for preview', 'warning');
                                                }
                                              }} sx={{ textTransform: 'none', minWidth: 0, p: '2px 6px', fontSize: '0.7rem' }}>
                                                <VisibilityIcon sx={{ fontSize: 14, mr: 0.5 }} /> Preview
                                              </Button>
                                            ) : (
                                              <Button size="small" onClick={() => {
                                                if (url) {
                                                  handleDownloadFileUrl(`/api/files/download?path=${encodeURIComponent(url)}`);
                                                } else {
                                                  showSnackbar('Invalid file path for download', 'warning');
                                                }
                                              }} sx={{ textTransform: 'none', minWidth: 0, p: '2px 6px', fontSize: '0.7rem' }}>
                                                <DownloadIcon sx={{ fontSize: 14, mr: 0.5 }} /> Download
                                              </Button>
                                            )}
                                          </Box>
                                          <IconButton size="small" onClick={() => setFormAttachments(formAttachments.filter((_, i) => i !== idx))} sx={{ color: 'error.main', p: 0.25 }}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Box>
                                      );
                                    })}
                                    {formVoiceFiles.map((url, idx) => (
                                      <Box key={`v-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f3e8ff', px: 1, py: 0.5, borderRadius: '4px', mt: 0.5 }}>
                                        <Typography variant="caption" sx={{ flexShrink: 0, color: 'secondary.main', fontWeight: 600 }}>
                                          🎤 Audio Note
                                        </Typography>
                                        <audio src={'/api/files/download?path=' + encodeURIComponent(url)} controls style={{ height: '32px', flexGrow: 1, maxWidth: '250px' }} />
                                        <IconButton size="small" onClick={() => setFormVoiceFiles(formVoiceFiles.filter((_, i) => i !== idx))} sx={{ p: 0.25 }}>
                                          <CloseIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                        </IconButton>
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* FILES & ATTACHMENTS */}
                        <Box sx={{ mt: 1, p: 2, border: '1px solid #eef2f6', borderRadius: '8px' }}>
                          <Stack spacing={2} sx={{ mb: 2 }}>
                            {ticketAttachments.filter(f => f.fileType !== 'Additional Requirement Attachment' && f.fileType !== 'Additional Requirement Voice').length > 0 && (
                              <>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, mt: 1 }}>Task Reference Images</Typography>
                                {ticketAttachments.filter(f => f.fileType !== 'Additional Requirement Attachment' && f.fileType !== 'Additional Requirement Voice').map((file) => {
                                  const isVoice = file.fileType === 'Voice Recording' ||
                                    /\.(mp3|wav|m4a|aac|webm|ogg)$/i.test(file.fileName);
                                  return (
                                    <Box key={file.id} sx={{ p: 1, px: 1.5, border: '1px solid #eef2f6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.default' }}>
                                      <Box sx={{ flexGrow: isVoice ? 0 : 1, minWidth: isVoice ? '150px' : 'auto', maxWidth: isVoice ? '200px' : '100%', overflow: 'hidden' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.fileName}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          By {file.uploadedBy} on {safeFormatDate(file.uploadedAt, 'dd/MM/yyyy')}
                                        </Typography>
                                      </Box>
                                      {isVoice && (
                                        <Box sx={{ flexGrow: 1, minWidth: '150px' }}>
                                          <audio controls src={`/api/files/view?path=${encodeURIComponent(file.filePath)}`} style={{ width: '100%', height: '32px' }} />
                                        </Box>
                                      )}
                                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                        {!isVoice && (
                                          <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => { setPreviewFileData({ url: `/api/files/view?path=${encodeURIComponent(file.filePath)}`, name: file.fileName, type: getFileTypeDisplay(file.fileName) }); setPreviewModalOpen(true); }}>
                                            Preview
                                          </Button>
                                        )}
                                        <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => handleDownloadFileUrl(`/api/files/download?path=${encodeURIComponent(file.filePath)}`)}>
                                          Download
                                        </Button>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </>
                            )}

                            {ticketAttachments.filter(f => f.fileType === 'Additional Requirement Attachment' || f.fileType === 'Additional Requirement Voice').length > 0 && (
                              <>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, mt: 2 }}>Additional Requirement</Typography>
                                {ticketAttachments.filter(f => f.fileType === 'Additional Requirement Attachment' || f.fileType === 'Additional Requirement Voice').map((file) => {
                                  const isVoice = file.fileType === 'Additional Requirement Voice' ||
                                    /\.(mp3|wav|m4a|aac|webm|ogg)$/i.test(file.fileName);
                                  return (
                                    <Box key={file.id} sx={{ p: 1, px: 1.5, border: '1px solid #eef2f6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.default' }}>
                                      <Box sx={{ flexGrow: isVoice ? 0 : 1, minWidth: isVoice ? '150px' : 'auto', maxWidth: isVoice ? '200px' : '100%', overflow: 'hidden' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.fileName}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          By {file.uploadedBy} on {safeFormatDate(file.uploadedAt, 'dd/MM/yyyy')}
                                        </Typography>
                                      </Box>
                                      {isVoice && (
                                        <Box sx={{ flexGrow: 1, minWidth: '150px' }}>
                                          <audio controls src={`/api/files/view?path=${encodeURIComponent(file.filePath)}`} style={{ width: '100%', height: '32px' }} />
                                        </Box>
                                      )}
                                      <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                        {!isVoice && (
                                          <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => { setPreviewFileData({ url: `/api/files/view?path=${encodeURIComponent(file.filePath)}`, name: file.fileName, type: getFileTypeDisplay(file.fileName) }); setPreviewModalOpen(true); }}>
                                            Preview
                                          </Button>
                                        )}
                                        <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1, fontSize: '0.75rem', minWidth: 'auto' }} onClick={() => handleDownloadFileUrl(`/api/files/download?path=${encodeURIComponent(file.filePath)}`)}>
                                          Download
                                        </Button>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </>
                            )}
                          </Stack>

                          {(formAttachments.length > 0 || formVoiceFiles.length > 0) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, maxHeight: 150, overflowY: 'auto' }}>
                              {formAttachments.map((fileObj, idx) => {
                                const isUrlStr = typeof fileObj === 'string';
                                const url = isUrlStr ? fileObj : (fileObj?.url || fileObj?.filePath || fileObj?.path || '');
                                const name = isUrlStr ? (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document') : (fileObj.name || (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document'));
                                const size = isUrlStr ? null : fileObj.size;
                                const canPreview = isPreviewable(name);

                                return (
                                  <Box key={`a-${idx}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default', border: '1px solid #e2e8f0', p: 1, borderRadius: '6px', mb: 0.5 }}>
                                    <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <InsertDriveFileIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                      <Tooltip title={name} arrow>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {name}
                                        </Typography>
                                      </Tooltip>
                                    </Box>
                                    <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                      {getFileTypeDisplay(name)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                      {size ? formatFileSize(size) : 'Unknown'}
                                    </Typography>
                                    <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                      {canPreview ? (
                                        <Button size="small" onClick={() => {
                                          if (url) {
                                            setPreviewFileData({ url, name, type: getFileTypeDisplay(name) });
                                            setPreviewModalOpen(true);
                                          } else {
                                            showSnackbar('Invalid file path for preview', 'warning');
                                          }
                                        }} sx={{ textTransform: 'none', minWidth: 0, p: '2px 6px', fontSize: '0.7rem' }}>
                                          <VisibilityIcon sx={{ fontSize: 14, mr: 0.5 }} /> Preview
                                        </Button>
                                      ) : (
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>No Preview</Typography>
                                      )}
                                      <IconButton size="small" onClick={() => setFormAttachments(formAttachments.filter((_, i) => i !== idx))} sx={{ ml: 1, p: 0.25 }}>
                                        <CloseIcon sx={{ fontSize: 14, color: 'error.main' }} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                );
                              })}
                              {formVoiceFiles.map((url, idx) => (
                                <Box
                                  key={`v-${idx}`}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: 'background.default',
                                    border: '1px solid #e2e8f0',
                                    p: 1,
                                    px: 1.5,
                                    borderRadius: '8px',
                                    mb: 0.5,
                                    gap: 2
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                    <Box
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: 'rgba(103, 58, 183, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#673ab7'
                                      }}
                                    >
                                      <SettingsVoiceIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', lineHeight: 1.2 }}>
                                        Voice Recording #{idx + 1}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                        Audio Note
                                      </Typography>
                                    </Box>
                                  </Box>

                                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', minWidth: 220, maxWidth: 380 }}>
                                    <audio
                                      src={'/api/files/download?path=' + encodeURIComponent(url)}
                                      controls
                                      style={{
                                        height: '34px',
                                        width: '100%',
                                        borderRadius: '6px'
                                      }}
                                    />
                                  </Box>

                                  <IconButton
                                    size="small"
                                    onClick={() => setFormVoiceFiles(formVoiceFiles.filter((_, i) => i !== idx))}
                                    sx={{
                                      color: 'error.main',
                                      p: 0.5,
                                      flexShrink: 0,
                                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                                    }}
                                  >
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          )}

                          <Divider sx={{ my: 2 }} />
                          <Button component="label" variant="contained" fullWidth startIcon={<CloudUploadIcon />}>
                            Upload File
                            <input type="file" hidden onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const fd = new FormData();
                                fd.append('file', file);
                                fd.append('module', 'Support');
                                const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                handleAddDirectAttachment(r.data, file.name);
                              }
                            }} />
                          </Button>
                        </Box>

                        {/* CLOSED NOTICE */}
                        {selectedTicket.ticketStatus === 'Closed' && (
                          <Alert severity="info">This task is permanently closed and cannot be edited.</Alert>
                        )}

                      </Stack>


                    </Box>
                  </Box>

                  {/* placeholder to close original tab 0 box — replaced above */}
                  {false && (
                    <Box>
                      <Box sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>Task Description</Typography>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: '#fafafa',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            minHeight: 120,
                            overflowY: 'auto',
                            '& img': { maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px', margin: '4px 0' }
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTicket.description) }}
                        />

                        <Grid container spacing={2} sx={{ mt: 3 }}>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Workflow Type</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.ticketType}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Severity</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.severityLevel || 'Medium'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Source</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.sourceType || 'Portal'}</Typography>
                          </Grid>

                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Page Name</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{getPageDisplay(selectedTicket) || 'None'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Created By</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.employeeName || selectedTicket.createdBy}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Verified By</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.verifiedBy || selectedTicket.verifierName || 'None'}</Typography>
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">Tested By</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedTicket.testedBy || 'None'}</Typography>
                          </Grid>

                          {selectedTicket.takenTime && (
                            <Grid item xs={12}>
                              <Box sx={{
                                mt: 0.5,
                                pt: 1.5,
                                borderTop: '1px dashed #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                flexWrap: 'wrap'
                              }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                                  Taken Time
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', fontSize: '0.95rem' }}>
                                  {selectedTicket.takenTime}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                      <Box sx={{ p: 2, borderRadius: '12px', border: '1px solid #eef2f6', mb: 3 }}>

                        <Stack spacing={3}>
                          {/* Row 1: Status dropdown, Target Date, Taken Time (Stretch to 100% width) */}
                          <Box sx={{ width: '100%' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                              <Box sx={{ flex: '1 1 240px', maxWidth: { sm: 300, xs: '100%' } }}>
                                <TextField
                                  fullWidth
                                  select
                                  size="small"
                                  label="Task Workflow Status"
                                  value={detailStatus}
                                  onChange={(e) => {
                                    setDetailStatus(e.target.value);
                                    setDetailResolution('');
                                    setReopenReason('');
                                    setDetailTakenTime('');
                                    setDetailTakenHours('');
                                    setDetailTakenMinutes('');
                                    setTakenTimeError(false);
                                  }}
                                >
                                  {currentViewType === 'raised-for-me' ? [
                                    <MenuItem key="Open" value="Open" disabled={selectedTicket.ticketStatus !== 'Open'}>Open</MenuItem>,
                                    <MenuItem key="Reopened" value="Reopened" disabled={selectedTicket.ticketStatus !== 'Reopened'}>Reopened</MenuItem>,
                                    <MenuItem key="Assigned" value="Assigned">Assigned</MenuItem>,
                                    <MenuItem key="In Progress" value="In Progress">In Progress</MenuItem>,
                                    <MenuItem key="Hold" value="Hold">Hold</MenuItem>,
                                    <MenuItem key="Resolved" value="Resolved">Resolved</MenuItem>
                                  ] : [
                                    <MenuItem key="current" value={selectedTicket.ticketStatus}>{selectedTicket.ticketStatus}</MenuItem>,
                                    selectedTicket.ticketStatus !== 'Closed' ? <MenuItem key="Closed" value="Closed">Closed</MenuItem> : null
                                  ].filter(Boolean)}
                                </TextField>
                              </Box>

                              {currentViewType === 'raised-for-me' && (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    label="Target Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={detailTargetDate}
                                    onChange={(e) => setDetailTargetDate(e.target.value)}
                                    inputProps={{
                                      min: todayStr,
                                      onClick: (e) => { try { e.target.showPicker(); } catch (err) { } }
                                    }}
                                  />
                                  <HtmlTooltip
                                    title={
                                      <Box sx={{ p: 1, maxHeight: 400, overflowY: 'auto' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5 }}>
                                          Developer Workload Details (Max 12h/day)
                                        </Typography>
                                        {renderWorkloadTrail(detailDevWorkloadTrail)}
                                      </Box>
                                    }
                                    placement="top"
                                    arrow
                                  >
                                    <IconButton size="small" sx={{ color: '#673ab7' }}>
                                      <InfoOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </HtmlTooltip>
                                </Box>
                              )}

                              {currentViewType === 'raised-for-me' && (
                                <Box sx={{ flex: 1 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    error={takenTimeError}
                                    label="Taken Time (e.g. 2 hrs, 1 day)"
                                    value={detailTakenTime}
                                    onChange={(e) => { setDetailTakenTime(e.target.value); setTakenTimeError(false); }}
                                  />
                                </Box>
                              )}
                            </Stack>
                          </Box>

                          {/* Row 2: Currently Assigned To text display (no input box) */}
                          {(currentViewType === 'raised-for-me' || currentViewType === 'raised-by-me') && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                Currently Assigned To
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.05rem' }}>
                                {detailAssignedTo || 'Unassigned'}
                              </Typography>
                            </Box>
                          )}

                          {/* Row 3: Reassign controls / button on the next row (full width) */}
                          {(currentViewType === 'raised-for-me' || currentViewType === 'raised-by-me') && (
                            <Box sx={{ width: '100%' }}>
                              {isReassigning ? (
                                <Stack spacing={2} sx={{ width: '100%' }}>
                                  <Autocomplete
                                    options={employeesList}
                                    getOptionLabel={(option) => option.employeeName || ''}
                                    value={employeesList.find(e => e.employeeName === detailAssignedTo) || null}
                                    onChange={(event, newValue) => {
                                      setDetailAssignedTo(newValue ? newValue.employeeName : '');
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        size="small"
                                        label="Select New Assignee"
                                        placeholder="Choose employee..."
                                        fullWidth
                                      />
                                    )}
                                    sx={{
                                      width: '100%',
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        bgcolor: '#fbfbfe'
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => setIsReassigning(false)}
                                    sx={{ height: 40, width: '100%', fontWeight: 700, borderRadius: '8px' }}
                                  >
                                    Cancel Reassign
                                  </Button>
                                </Stack>
                              ) : (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  onClick={() => setIsReassigning(true)}
                                  sx={{ height: 40, width: '100%', fontWeight: 700, borderRadius: '8px' }}
                                >
                                  Reassign Task
                                </Button>
                              )}
                            </Box>
                          )}

                          {/* Row 3: Developer Auto-fill details for external */}
                          {selectedTicket.ticketType === 'External' && (currentViewType === 'raised-for-me' || currentViewType === 'raised-by-me') && isReassigning && (
                            <Box sx={{ width: '100%' }}>
                              <Divider sx={{ my: 1.5 }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1.5 }}>
                                Developer Contact Details
                              </Typography>
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                                <Box sx={{ flex: 5 }}>
                                  <Autocomplete
                                    size="small"
                                    options={employeesList}
                                    getOptionLabel={(option) => option.employeeName || ''}
                                    value={employeesList.find(e => e.employeeName === detailDevName) || null}
                                    onChange={(event, selectedEmp) => {
                                      if (selectedEmp) {
                                        setDetailDevName(selectedEmp.employeeName || '');
                                        setDetailDevEmail(selectedEmp.officeMail || '');
                                        setDetailDevMobile('');
                                        axios.get(`/api/master/hr/employees/${selectedEmp.id}/contact`)
                                          .then(c => {
                                            if (c.data?.mobile) setDetailDevMobile(c.data.mobile);
                                          }).catch(() => { });
                                      } else {
                                        setDetailDevName('');
                                        setDetailDevEmail('');
                                        setDetailDevMobile('');
                                      }
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Assign Developer" />}
                                    fullWidth
                                  />
                                </Box>
                                <Box sx={{ flex: 4 }}>
                                  <TextField fullWidth size="small" disabled label="Developer Email" value={detailDevEmail} />
                                </Box>
                                <Box sx={{ flex: 3 }}>
                                  <TextField fullWidth size="small" disabled label="Developer Mobile" value={detailDevMobile} />
                                </Box>
                              </Stack>
                            </Box>
                          )}

                          {/* Row 4: Comments Box */}
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1, display: 'block' }}>Comments <span style={{ color: '#dc2626' }}>*</span></Typography>
                            <Box
                              onPasteCapture={(e) => handlePaste(e, 'detailResolution')}
                              sx={{
                                position: 'relative',
                                bgcolor: 'background.paper',
                                borderRadius: '8px',
                                border: '1px solid #673ab7',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(103, 58, 183, 0.05)',
                                '&:hover': { borderColor: '#5e35b1', boxShadow: '0 4px 12px rgba(103, 58, 183, 0.1)' }
                              }}
                            >
                              <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Enter your comments here..."
                                value={detailResolution}
                                onChange={(e) => setDetailResolution(e.target.value)}
                                variant="outlined"
                                sx={{
                                  '& fieldset': { border: 'none' },
                                  '& .MuiInputBase-root': { p: 1.5, fontSize: '0.85rem', color: '#334155' }
                                }}
                              />
                              <Box sx={{ position: 'absolute', bottom: 4, right: 8, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton size="small" sx={{ color: '#64748b', p: 0.5 }}><AttachFileIcon sx={{ fontSize: 16 }} /></IconButton>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>{detailResolution ? detailResolution.length : 0}/4000</Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Row 5: Apply Changes Button & Reopen Task Banner */}
                          <Box sx={{ width: '100%', position: 'sticky', bottom: 16, zIndex: 10, mt: 2 }}>
                            <Button
                              variant="contained"
                              color="secondary"
                              fullWidth
                              startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
                              onClick={handleUpdateTicketDetails}
                              disabled={isSaving}
                              sx={{
                                height: 36, fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px',
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
                              }}
                            >
                              {isSaving ? 'Saving...' : 'Apply Changes (Ctrl+S)'}
                            </Button>
                          </Box>

                          {detailStatus === 'Resolved' && selectedTicket.ticketStatus !== 'Closed' && currentViewType === 'raised-by-me' && (
                            <Box sx={{ width: '100%' }}>
                              <Alert severity="success" action={
                                <Button size="small" color="inherit" startIcon={<ReplayIcon />} onClick={() => setReopenOpen(true)}>
                                  Reopen Task
                                </Button>
                              }>
                                This task is completed. You can reopen it if you require further investigation.
                              </Alert>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Part 3: Progress Roadmap (20%) */}
          <Box sx={{
            flex: panelsOpen.part3 ? 2 : '0 0 50px',
            transition: 'all 0.3s ease',
            borderRadius: '12px', border: '1px solid #eef2f6',
            bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eef2f6', cursor: 'pointer', bgcolor: 'background.paper', height: panelsOpen.part3 ? 'auto' : '100%' }} onClick={() => handleTogglePanel('part3')}>
              {panelsOpen.part3 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapOutlinedIcon sx={{ color: '#673ab7', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Progress Roadmap</Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ fontWeight: 800, writingMode: 'vertical-rl', transform: 'rotate(180deg)', py: 2, letterSpacing: '1px', color: '#64748b' }}>Progress Roadmap</Typography>
              )}
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleTogglePanel('part3'); }} sx={{ position: panelsOpen.part3 ? 'relative' : 'absolute', top: panelsOpen.part3 ? 0 : 8 }}>
                {panelsOpen.part3 ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            <Collapse in={panelsOpen.part3} sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ p: 1.5, height: '100%' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, display: 'none' }}></Typography>

                  <Box sx={{ position: 'relative', pl: 0.5 }}>
                    {roadmapEvents.map((event, idx) => {
                      const isLast = idx === roadmapEvents.length - 1;
                      let parsedEvent = null;
                      try { parsedEvent = JSON.parse(event.comment); } catch (e) { }

                      const isReassignStr = event.comment && (event.comment.startsWith('Reassigned to') || event.comment.startsWith('Reassigned:'));
                      const isReassign = isReassignStr || (parsedEvent && parsedEvent.activityName === 'Ticket Reassigned');

                      let titleText = '';

                      if (event.comment === 'Ticket created' || (parsedEvent && parsedEvent.activityName === 'Task Created')) {
                        titleText = 'Task Created';
                      } else if (isReassign || (parsedEvent && parsedEvent.activityName === 'Ticket Reassigned')) {
                        titleText = 'Reassigned';
                      } else if (parsedEvent && (parsedEvent.activityName === 'Estimated Time Updated' || parsedEvent.activityName === 'Estimated Time Set')) {
                        titleText = 'Estimate Time';
                      } else if (parsedEvent && parsedEvent.activityName === 'Additional Requirement Added') {
                        titleText = 'Additional Req Added';
                      } else {
                        titleText = event.fromStatus && event.fromStatus !== event.toStatus
                          ? `Status: ${event.fromStatus} → ${event.toStatus}`
                          : `Status: ${event.toStatus}`;
                      }

                      return (
                        <Box key={event.id || idx} sx={{ display: 'flex', position: 'relative', pb: isLast ? 0 : 2.5 }}>
                          {!isLast && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 9,
                                top: 20,
                                bottom: 0,
                                width: '2px',
                                bgcolor: '#673ab7',
                                zIndex: 1
                              }}
                            />
                          )}

                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: isLast ? '#ede7f6' : '#673ab7',
                              border: '2px solid #673ab7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isLast ? '#673ab7' : '#fff',
                              zIndex: 2,
                              mr: 1.5,
                              boxShadow: isLast ? '0 0 0 4px rgba(103, 58, 183, 0.2)' : 'none',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {isLast ? (
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#673ab7' }} />
                            ) : (
                              <span style={{ fontSize: '8px', fontWeight: 900 }}>✓</span>
                            )}
                          </Box>

                          <Box sx={{ pt: 0.1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                color: '#1e293b',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              {titleText}
                              {isLast && (
                                <Chip label="Current" size="small" sx={{ bgcolor: '#ede7f6', color: '#673ab7', fontWeight: 700, height: 16, fontSize: '0.55rem' }} />
                              )}
                            </Typography>

                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2, fontSize: '0.65rem' }}>
                              {safeFormatDate(event.updatedAt, 'dd/MM/yyyy HH:mm')} by {event.updatedBy}
                            </Typography>

                            {event.comment && event.comment !== 'Ticket created' && !event.comment.startsWith('Status updated to') && (() => {
                              if (isReassign) {
                                // Extract the inner string if it's JSON
                                let rawComment = event.comment;
                                if (parsedEvent && parsedEvent.comment) {
                                  rawComment = parsedEvent.comment;
                                }

                                let assignText = '';
                                let reasonText = '';
                                let commentText = '';
                                const parts = rawComment.split(' | ');
                                assignText = parts[0].replace('Reassigned: ', '').replace('Reassigned to ', '');

                                parts.forEach(p => {
                                  if (p.startsWith('Reason: ')) reasonText = p.replace('Reason: ', '');
                                  if (p.startsWith('Comment: ')) commentText = p.replace('Comment: ', '');
                                });

                                return (
                                  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: '6px', borderLeft: '3px solid #673ab7' }}>
                                    {assignText && (
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#334155', mb: 0.5 }}>
                                        {assignText.includes('->') ? assignText : `-> ${assignText}`}
                                      </Typography>
                                    )}
                                    {(reasonText || commentText) && (
                                      <Box sx={{ mt: 0.5 }}>
                                        {reasonText && (
                                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>
                                            <span style={{ fontWeight: 600 }}>Reason:</span> {reasonText}
                                          </Typography>
                                        )}
                                        {commentText && (
                                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontStyle: 'italic', mt: 0.2 }}>
                                            <span style={{ fontWeight: 600, fontStyle: 'normal' }}>Comment:</span> {commentText}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                );
                              }

                              let textToDisplay = event.comment;
                              let isHtml = false;
                              try {
                                const parsed = JSON.parse(event.comment);
                                if (parsed && parsed.comment) {
                                  textToDisplay = parsed.comment;
                                  isHtml = true;
                                }
                              } catch (e) {
                                // not JSON
                              }
                              if (isHtml || textToDisplay.includes('<p>')) {
                                return (
                                  <Box sx={{ typography: 'caption', display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary', bgcolor: 'background.default', p: 1, borderRadius: '4px', borderLeft: '3px solid #673ab7', '& p': { m: 0 }, '& img': { display: 'none' } }} dangerouslySetInnerHTML={{ __html: sanitizeHTML(textToDisplay) }} />
                                );
                              }
                              return (
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', color: 'text.secondary', bgcolor: 'background.default', p: 1, borderRadius: '4px', borderLeft: '3px solid #673ab7' }}>
                                  "{textToDisplay}"
                                </Typography>
                              );
                            })()}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Box>

        </Box>


        {/* INLINE ATTACHMENT PREVIEW */}
        <BOSFilePreview
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          file={previewFileData ? {
            serverFileName: typeof previewFileData === 'string' ? previewFileData : (previewFileData.serverFileName || previewFileData.filePath || (typeof previewFileData.url === 'string' ? previewFileData.url : '')),
            fileName: previewFileData.name || previewFileData.fileName || '',
            isServer: true
          } : null}
          url={previewFileData && typeof previewFileData.url === 'string' ? (previewFileData.url.startsWith('/api/') ? previewFileData.url : `/api/files/view?path=${encodeURIComponent(previewFileData.url)}`) : ''}
          fileName={previewFileData?.name || previewFileData?.fileName}
        />
      </Box>
    );
  }

  const renderCell = (col, row) => {
    if (col.id === 'ticketId') {
      return (
        <Typography sx={{ fontWeight: 700, color: row.ticketType === 'External' ? 'secondary.main' : 'primary.main' }}>
          {row.ticketId}
        </Typography>
      );
    }
    if (col.id === 'title') {
      return (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{row.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {getPageDisplay(row)}
          </Typography>
        </Box>
      );
    }
    if (col.id === 'assignedTo') {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.developerName || row.assignedTo || 'Unassigned'}</Typography>
          {row.developerMobileNo && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Mobile: {row.developerMobileNo}
            </Typography>
          )}
        </Box>
      );
    }
    if (col.id === 'createdBy') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.employeeName || row.createdBy}</Typography>
      );
    }
    if (col.id === 'verifiedBy') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.verifiedBy || '-'}</Typography>
      );
    }
    if (col.id === 'testedBy') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.testedBy || '-'}</Typography>
      );
    }
    if (col.id === 'priorityLevel') {
      return (
        <Chip
          label={row.priorityLevel}
          size="small"
          sx={{
            bgcolor: alpha(getPriorityColor(row.priorityLevel), 0.1),
            color: getPriorityColor(row.priorityLevel),
            fontWeight: 700,
            borderRadius: '6px'
          }}
        />
      );
    }
    if (col.id === 'ticketStatus') {
      return (
        <Chip
          label={row.ticketStatus}
          size="small"
          sx={{
            bgcolor: alpha(getStatusColor(row.ticketStatus), 0.1),
            color: getStatusColor(row.ticketStatus),
            fontWeight: 700,
            borderRadius: '6px',
            minWidth: 100,
            textAlign: 'center'
          }}
        />
      );
    }
    if (col.id === 'targetDate') {
      return (
        <Box>
          {row.targetDate ? (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {safeFormatDate(row.targetDate, 'dd/MM/yyyy')}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">-</Typography>
          )}
          {row.dueDate && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', fontWeight: 600 }}>
              Due: {safeFormatDate(row.dueDate, 'dd/MM/yyyy')}
            </Typography>
          )}
        </Box>
      );
    }
    if (col.id === 'assignedHours') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.assignedHours || '-'}</Typography>
      );
    }
    if (col.id === 'totalSpend') {
      const actMins = parseDurationToMinutes(row.takenTime || '');
      const rwMins = parseDurationToMinutes(row.reworkTime || '');
      const totalSpent = actMins + rwMins;
      if (totalSpent === 0) return '-';
      const h = Math.floor(totalSpent / 60);
      const m = totalSpent % 60;
      return (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
        </Typography>
      );
    }
    if (col.id === 'reassign') {
      return (
        <Tooltip title="Reassign Task">
          <IconButton
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              setReassignTicket(row);
              setReassignEmployee(null);
              setReassignComment('');
              setReassignOpen(true);
            }}
            sx={{ bgcolor: alpha(theme.palette.info.light, 0.1), '&:hover': { bgcolor: alpha(theme.palette.info.light, 0.2) } }}
          >
            <PersonOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    if (col.id === 'attachments') {
      return (
        <Tooltip title="View Attachments">
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTicket(row);
              fetchTicketSubresources(row.rowId);
              setAttachmentsDialogOpen(true);
            }}
            sx={{ bgcolor: alpha(theme.palette.primary.light, 0.1), '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.2) } }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: 'calc(100vh - 175px)', overflow: 'hidden' }}>

      {/* ── DASHBOARD STAT CARDS & ACTIONS ── */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        mb: 0.5,
        mt: 1.2
      }}>
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          flexGrow: 1,
          overflowX: 'auto',
          pb: 0.5,
          '& > *': { flex: '1 1 0px', minWidth: '120px', maxWidth: '160px' }
        }}>
          <HeaderStatCard title="Total" count={stats.total} color={theme.palette.primary.main} icon={<AssignmentIcon />} />
          <HeaderStatCard title="Open" count={stats.open} color={theme.palette.info.main} icon={<TicketIcon />} />
          <HeaderStatCard title="In Progress" count={stats.inProgress} color={theme.palette.warning.main} icon={<HistoryIcon />} />
          <HeaderStatCard title="To Be Verified" count={stats.toBeVerified} color={theme.palette.secondary.main} icon={<CheckCircleIcon />} />
          <HeaderStatCard title="Yet To Deploy" count={stats.yetToDeploy} color={theme.palette.info.dark} icon={<CloudUploadIcon />} />
          <HeaderStatCard title="To Be Tested" count={stats.toBeTested} color={theme.palette.success.main} icon={<CheckCircleIcon />} />
          <HeaderStatCard title="Reopened" count={stats.reopened} color={theme.palette.secondary.main} icon={<ReplayIcon />} />
          <HeaderStatCard title="Completed" count={stats.completed} color={theme.palette.text.secondary} icon={<CheckCircleIcon />} />
          <HeaderStatCard title="Overdue" count={stats.overdue} color={theme.palette.error.main} icon={<ErrorOutlineIcon />} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', pb: 0.5, gap: 1.5 }}>
          {perms.export && (
            <BOSExportButton
              data={filteredTickets}
              filename={currentViewType === 'raised-by-me' ? 'Tasks_Raised_By_Me' : 'Tasks_Raised_For_Me'}
              screenColumns={columns.filter(c => c.id !== 'reassign' && c.id !== 'attachments')}
            />
          )}
          {currentViewType === 'raised-by-me' && (
            <Tooltip title="Ctrl + N" placement="top">
              <Button
                variant="contained"
                onClick={() => { resetForm(); setCreateOpen(true); }}
                sx={{
                  height: '46px',
                  borderRadius: '8px',
                  bgcolor: '#673ab7',
                  '&:hover': { bgcolor: '#5e35b1' },
                  px: 3,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px 0 rgba(103,58,183,0.39)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AddIcon fontSize="small" />
                  <span>New Task</span>
                </Box>
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      <BOSDataTable
        id="ticket_management_table"
        sx={{ height: '100%', flexGrow: 1 }}
        columns={columns}
        rows={filteredTickets}
        page={page}
        size={rowsPerPage}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
        showActions={false}
        onDoubleClickRow={(row) => {
          setSelectedTicket(row);
          setTabValue(0);
          setDetailsOpen(true);
        }}
        renderCell={renderCell}
      />

      {/* ── DIALOG: CREATE SUPPORT TICKET ── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <form onSubmit={validateAndSubmitTicket} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
            color: 'white',
            py: 1.5,
            minHeight: 60,
            flexShrink: 0
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', width: 32, height: 32 }}>
                <TicketIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'white', lineHeight: 1, display: 'flex', alignItems: 'center' }}>New Task</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mt: 0.5 }}>Create and assign a new workflow task</Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setCreateOpen(false)} sx={{ color: 'white' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, bgcolor: 'background.default', overflowY: 'auto', flex: 1 }}>
            <Stack spacing={2} sx={{ mt: 1 }}>

              {/* SECTION 1: TICKET INFORMATION */}
              <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 16, bgcolor: '#673ab7', borderRadius: 1 }} />
                  Task Information & Classification
                </Typography>
                {/* Row 1: Title grows */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: '3 1 auto', minWidth: '250px' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Task Title"
                      required
                      placeholder="Summarize the support request..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 auto', minWidth: `${getFieldMinWidth(formPriority, 'Priority Level', 90)}px` }}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Priority Level"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                    >
                      <MenuItem value="Select">Select</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '1 1 auto', minWidth: `${getFieldMinWidth(formSourceType, 'Source Type', 90)}px` }}>
                    <TextField
                      fullWidth
                      select
                      size="small"
                      label="Source Type"
                      value={formSourceType}
                      onChange={(e) => setFormSourceType(e.target.value)}
                    >
                      <MenuItem value="Select">Select</MenuItem>
                      <MenuItem value="Web">Web</MenuItem>
                      <MenuItem value="Mobile">Mobile</MenuItem>
                      <MenuItem value="General">General</MenuItem>
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '2 1 auto', minWidth: `${getFieldMinWidth(formPage?.pageName, 'Screen / Page Name', 90)}px` }}>
                    <Autocomplete
                      size="small"
                      options={pagesData || []}
                      getOptionLabel={(option) => {
                        if (!option) return '';
                        return option.pageCode ? `${option.pageCode} / ${option.pageName}` : (option.pageName || '');
                      }}
                      isOptionEqualToValue={(option, value) => option?.pageId === value?.pageId}
                      value={formPage}
                      onChange={(event, newValue) => {
                        setFormPage(newValue);
                      }}
                      renderInput={(params) => {
                        const originalEndAdornment = params.InputProps.endAdornment;
                        const formatToHHMM = (mins) => {
                          if (!mins) return '00:00';
                          const h = String(Math.floor(mins / 60)).padStart(2, '0');
                          const m = String(mins % 60).padStart(2, '0');
                          return `${h}:${m}`;
                        };
                        return (
                          <TextField
                            {...params}
                            label={`Screen / Page Name (${pagesData ? pagesData.length : 0})`}
                            placeholder="Select..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {activeTicketsForSelectedPage.length > 0 && (
                                    <InputAdornment position="end" sx={{ mr: 2 }}>
                                      <HtmlTooltip
                                        title={
                                          <Box sx={{ p: 1, minWidth: 260 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffb74d', mb: 1 }}>Already Active Task Found</Typography>
                                            {activeTicketsForSelectedPage.map((t, idx) => (
                                              <Box key={t.ticketId} sx={{ mb: idx < activeTicketsForSelectedPage.length - 1 ? 1.5 : 0, pb: idx < activeTicketsForSelectedPage.length - 1 ? 1.5 : 0, borderBottom: idx < activeTicketsForSelectedPage.length - 1 ? '1px dashed rgba(255,255,255,0.2)' : 'none' }}>
                                                <Box sx={{ display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace', mb: 0.5 }}>
                                                  <Box sx={{ width: '95px', color: 'rgba(255,255,255,0.7)' }}>Task No</Box>
                                                  <Box sx={{ flex: 1 }}>: {t.ticketId}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace', mb: 0.5 }}>
                                                  <Box sx={{ width: '95px', color: 'rgba(255,255,255,0.7)' }}>Assigned To</Box>
                                                  <Box sx={{ flex: 1 }}>: {t.developerName || t.assignedTo || 'Unassigned'}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace', mb: 0.5 }}>
                                                  <Box sx={{ width: '95px', color: 'rgba(255,255,255,0.7)' }}>Assigned By</Box>
                                                  <Box sx={{ flex: 1 }}>: {t.createdBy || 'Unknown'}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace', mb: 0.5 }}>
                                                  <Box sx={{ width: '95px', color: 'rgba(255,255,255,0.7)' }}>Status</Box>
                                                  <Box sx={{ flex: 1 }}>: {t.ticketStatus}</Box>
                                                </Box>
                                                <Box sx={{ display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                  <Box sx={{ width: '95px', color: 'rgba(255,255,255,0.7)' }}>Assigned Hrs</Box>
                                                  <Box sx={{ flex: 1 }}>: {t.assignedHours || '00:00'}</Box>
                                                </Box>
                                              </Box>
                                            ))}
                                          </Box>
                                        }
                                        placement="top"
                                        arrow
                                      >
                                        <InfoOutlinedIcon sx={{ color: '#ffb74d', cursor: 'pointer', fontSize: 20 }} />
                                      </HtmlTooltip>
                                    </InputAdornment>
                                  )}
                                  {originalEndAdornment}
                                </>
                              )
                            }}
                          />
                        );
                      }}
                    />
                  </Box>
                </Box>

                {/* Row 2: Assigned To, Verified By, Time, Target Date */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                  <Box sx={{ flex: 1, minWidth: '130px' }}>
                    <Autocomplete
                      size="small"
                      options={employeesList.filter(e => (user?.empId ? Number(e.id) !== Number(user.empId) : true) && (user?.empCode ? String(e.empCode).toLowerCase() !== String(user.empCode).toLowerCase() : true))}
                      getOptionLabel={(option) => option.employeeName || ''}
                      getOptionDisabled={(option) => {
                        if (activeDevelopersInOptions.length > 0) {
                          return !activeDevelopersInOptions.some(
                            dev => dev.toLowerCase() === option.employeeName?.trim().toLowerCase()
                          );
                        }
                        return false;
                      }}
                      value={employeesList.find(e => e.employeeName === formDevName) || null}
                      onChange={(event, selectedEmp) => {
                        if (selectedEmp) {
                          setFormDevName(selectedEmp.employeeName || '');
                          setFormDevEmail(selectedEmp.officeMail || '');
                          axios.get(`/api/master/hr/employees/${selectedEmp.id}/contact`)
                            .then(c => {
                              if (c.data?.mobile) setFormDevMobile(c.data.mobile);
                            }).catch(() => { });
                        } else {
                          setFormDevName('');
                          setFormDevEmail('');
                          setFormDevMobile('');
                        }
                      }}
                      renderInput={(params) => {
                        const originalEndAdornment = params.InputProps.endAdornment;
                        return (
                          <TextField
                            {...params}
                            required
                            label="Assigned To"
                            placeholder="Search employee..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {activeDevelopersForSelectedPage.length > 0 && (
                                    <InputAdornment position="end" sx={{ mr: 2 }}>
                                      <HtmlTooltip
                                        title={
                                          <Box sx={{ p: 1, minWidth: 240 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#ffb74d', mb: 1 }}>
                                              Already Assigned to Page
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                              {activeDevelopersForSelectedPage.join(', ')} is already working on a task for this page. Please assign it to them.
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 1, fontStyle: 'italic' }}>
                                              ({activeDevelopersForSelectedPage.join(', ')} intha task idhae page la pannuraru, avarukae assign pannunga.)
                                            </Typography>
                                          </Box>
                                        }
                                        placement="top"
                                        arrow
                                      >
                                        <InfoOutlinedIcon sx={{ color: '#ffb74d', cursor: 'pointer', fontSize: 20 }} />
                                      </HtmlTooltip>
                                    </InputAdornment>
                                  )}
                                  {originalEndAdornment}
                                </>
                              )
                            }}
                          />
                        );
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '130px' }}>
                    <Autocomplete
                      size="small"
                      options={employeesList.filter(e => e.isTaskVerifier === 'YES')}
                      getOptionLabel={(option) => option.employeeName || ''}
                      value={employeesList.find(e => e.employeeName === formVerifiedBy) || null}
                      onChange={(event, selectedEmp) => {
                        setFormVerifiedBy(selectedEmp ? (selectedEmp.employeeName || '') : '');
                      }}
                      renderInput={(params) => <TextField {...params} required label="Verified By" placeholder="Search employee..." />}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '130px' }}>
                    <Autocomplete
                      size="small"
                      options={employeesList.filter(e => e.isTaskTester === 'YES')}
                      getOptionLabel={(option) => option.employeeName || ''}
                      value={employeesList.find(e => e.employeeName === formTestedBy) || null}
                      onChange={(event, selectedEmp) => {
                        setFormTestedBy(selectedEmp ? (selectedEmp.employeeName || '') : '');
                      }}
                      renderInput={(params) => <TextField {...params} label="Tested By" placeholder="Search employee..." />}
                    />
                  </Box>
                  {/* Custom "Assigned Time" component exactly as designed */}
                  <FormControl sx={{ flex: 1, minWidth: '150px' }} variant="outlined">
                    <InputLabel shrink={true} required sx={{ bgcolor: 'background.paper', px: 0.5, zIndex: 2 }}>Assigned Time</InputLabel>
                    <OutlinedInput
                      notched={true}
                      label="Assigned Time"
                      inputProps={{ sx: { display: 'none' }, readOnly: true }} // Hide native input text area
                      sx={{
                        p: 0,
                        height: '40px', borderRadius: '8px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2', borderWidth: '1.5px' }
                      }}
                      onFocus={() => setIsTimeFocused(true)}
                      onBlur={(e) => {
                        if (!e.relatedTarget) setIsTimeFocused(false);
                      }}
                      startAdornment={
                        <Box sx={{ display: 'flex', alignItems: 'center', p: '0 8px', gap: 1 }}>
                          {/* Clock Icon */}
                          <AccessTimeIcon sx={{ color: '#64748b', fontSize: 18 }} />

                          {/* Hours Box */}
                          <Box sx={{
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            border: hoursFocused ? '1px solid #1976d2' : '1px solid transparent',
                            bgcolor: hoursFocused ? '#f0f7ff' : 'transparent',
                            borderRadius: '6px', width: '45px', height: '36px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            '&:hover': { borderColor: '#1976d2' }
                          }}>
                            {/* Inner Dropdown overlaying the box perfectly to intercept clicks */}
                            <Select
                              variant="standard" disableUnderline
                              value={hoursPart || '00'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setHoursPart(val);
                                if (val === '24') setMinutesPart('00');
                                setIsTimeFocused(true);
                              }}
                              onOpen={() => setHoursFocused(true)}
                              onClose={() => setHoursFocused(false)}
                              MenuProps={{ PaperProps: { sx: { maxHeight: 250 } } }}
                              sx={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1,
                                cursor: 'pointer'
                              }}
                            >
                              {Array.from({ length: 25 }, (_, i) => {
                                const val = String(i).padStart(2, '0');
                                return <MenuItem key={val} value={val} sx={{ fontSize: '0.875rem' }}>{val}</MenuItem>;
                              })}
                            </Select>

                            {/* Visual Content */}
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{hoursPart || '00'}</Typography>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#64748b', mt: 0.3 }}>Hours</Typography>
                              </Box>

                              {/* Arrows Column */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                <IconButton
                                  size="small" sx={{ p: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let h = parseInt(hoursPart || '0', 10);
                                    h = (h + 1) % 25;
                                    setHoursPart(String(h).padStart(2, '0'));
                                    if (h === 24) setMinutesPart('00');
                                  }}
                                >
                                  <KeyboardArrowUpIcon sx={{ fontSize: 12, color: '#64748b' }} />
                                </IconButton>
                                <IconButton
                                  size="small" sx={{ p: 0 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let h = parseInt(hoursPart || '0', 10);
                                    h = h - 1 < 0 ? 24 : h - 1;
                                    setHoursPart(String(h).padStart(2, '0'));
                                    if (h === 24) setMinutesPart('00');
                                  }}
                                >
                                  <KeyboardArrowDownIcon sx={{ fontSize: 12, color: '#64748b' }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>

                          {/* Colon */}
                          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', pb: 0.5 }}>:</Typography>

                          {/* Minutes Box */}
                          <Box sx={{
                            position: 'relative',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            border: minutesFocused ? '1px solid #1976d2' : '1px solid transparent',
                            bgcolor: minutesFocused ? '#f0f7ff' : 'transparent',
                            borderRadius: '6px', width: '45px', height: '36px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            '&:hover': { borderColor: '#1976d2' }
                          }}>
                            {/* Inner Dropdown overlaying the box perfectly to intercept clicks */}
                            <Select
                              variant="standard" disableUnderline
                              value={minutesPart || '00'}
                              onChange={(e) => {
                                setMinutesPart(e.target.value);
                                setIsTimeFocused(true);
                              }}
                              onOpen={() => setMinutesFocused(true)}
                              onClose={() => setMinutesFocused(false)}
                              MenuProps={{ PaperProps: { sx: { maxHeight: 250 } } }}
                              sx={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, zIndex: 1,
                                cursor: 'pointer'
                              }}
                            >
                              {Array.from({ length: 60 }, (_, i) => {
                                const val = String(i).padStart(2, '0');
                                return <MenuItem key={val} value={val} disabled={hoursPart === '24' && val !== '00'} sx={{ fontSize: '0.875rem' }}>{val}</MenuItem>;
                              })}
                            </Select>

                            {/* Visual Content */}
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{minutesPart || '00'}</Typography>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#64748b', mt: 0.3 }}>Minutes</Typography>
                              </Box>

                              {/* Arrows Column */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                <IconButton
                                  size="small" sx={{ p: 0 }}
                                  disabled={hoursPart === '24'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hoursPart === '24') return;
                                    let m = parseInt(minutesPart || '0', 10);
                                    m = (m + 1) % 60;
                                    setMinutesPart(String(m).padStart(2, '0'));
                                  }}
                                >
                                  <KeyboardArrowUpIcon sx={{ fontSize: 12, color: hoursPart === '24' ? '#cbd5e1' : '#64748b' }} />
                                </IconButton>
                                <IconButton
                                  size="small" sx={{ p: 0 }}
                                  disabled={hoursPart === '24'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hoursPart === '24') return;
                                    let m = parseInt(minutesPart || '0', 10);
                                    m = m - 1 < 0 ? 59 : m - 1;
                                    setMinutesPart(String(m).padStart(2, '0'));
                                  }}
                                >
                                  <KeyboardArrowDownIcon sx={{ fontSize: 12, color: hoursPart === '24' ? '#cbd5e1' : '#64748b' }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </FormControl>
                  {/* Target Date */}
                  <Box sx={{ flex: 1.2, minWidth: '180px' }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Target Date (Auto-calculated)"
                      InputLabelProps={{ shrink: true }}
                      value={formTargetDate}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <HtmlTooltip
                              title={
                                <Box sx={{ p: 1, maxHeight: 400, overflowY: 'auto' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5 }}>
                                    Developer Workload Details (9 AM To 6 PM)
                                  </Typography>
                                  {renderWorkloadTrail(devWorkloadTrail)}
                                </Box>
                              }
                              placement="top"
                              arrow
                            >
                              <IconButton size="small" sx={{ color: '#673ab7', mr: -0.5 }}>
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </HtmlTooltip>
                          </InputAdornment>
                        )
                      }}
                      sx={{ '& .MuiInputBase-input': { color: formTargetDate ? '#1a7a4a' : 'text.disabled', fontWeight: 600 } }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* SECTION 4: DESCRIPTION & PLANNING */}
              <Box sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 16, bgcolor: '#f59e0b', borderRadius: 1 }} />
                  Details <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ position: 'relative', mt: 1, width: '100%' }}>

                    {/* Mic Button at top right */}
                    <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 10, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isListening && <VoiceWaveform color="error.main" />}
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem', WebkitUserSelect: 'none', userSelect: 'none' }}>
                        {voiceLang === 'ta-IN' ? 'TA' : voiceLang === 'hi-IN' ? 'HI' : voiceLang === 'te-IN' ? 'TE' : 'EN'}
                      </Typography>
                      <Tooltip title={isListening ? "Listening..." : "Start Voice Typing (Say 'English' or 'Tamil' to switch)"}>
                        <IconButton
                          color={isListening ? "error" : "primary"}
                          onClick={handleToggleVoiceTyping}
                          size="small"
                          sx={{
                            bgcolor: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(103,58,183,0.08)',
                            animation: isListening ? 'pulse-voice 1.5s infinite' : 'none',
                            '@keyframes pulse-voice': {
                              '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
                              '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 10px rgba(239,68,68,0)' },
                              '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239,68,68,0)' }
                            },
                            '&:hover': { bgcolor: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(103,58,183,0.15)' }
                          }}
                        >
                          <MicIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Editor */}
                    <Box sx={{
                      border: '1px solid',
                      borderColor: isListening ? 'error.main' : '#cbd5e1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      bgcolor: '#fafafa',
                      transition: 'border-color 0.3s ease',
                      '& .ql-editor': { minHeight: '180px' },
                      '& .ql-editor img': { maxWidth: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '4px' }
                    }} onPasteCapture={(e) => handlePaste(e, 'formDesc')}>
                      <ReactQuillDemo
                        value={formDesc}
                        onChange={setFormDesc}
                        editorMinHeight={180}
                        placeholder="Type or speak your description here..."
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mt: 1,
                  width: '100%',
                  flexWrap: 'wrap'
                }}>


                  {/* Upload Attachments & Audio Recording */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1.5 1 280px', minWidth: 260, flexWrap: 'wrap' }}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        height: 40,
                        borderStyle: 'dashed',
                        borderColor: '#94a3b8',
                        color: '#475569',
                        borderRadius: '8px',
                        flexShrink: 0,
                        px: 2,
                        '&:hover': { borderStyle: 'dashed', borderColor: '#673ab7', bgcolor: 'rgba(103,58,183,0.04)' }
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Attachments'}
                      <input type="file" multiple hidden onChange={(e) => handleFileUpload(e, false)} />
                    </Button>

                    <Tooltip title={isRecordingAudio ? "Stop & Save Recording" : "Record Voice Audio Note"}>
                      <Button
                        variant={isRecordingAudio ? "contained" : "outlined"}
                        color={isRecordingAudio ? "error" : "secondary"}
                        onClick={handleToggleLiveRecording}
                        sx={{
                          height: 40,
                          borderStyle: isRecordingAudio ? 'solid' : 'dashed',
                          borderRadius: '8px',
                          px: 2,
                          animation: isRecordingAudio ? 'pulse-voice 1.5s infinite' : 'none'
                        }}
                        startIcon={isRecordingAudio ? <StopIcon /> : <SettingsVoiceIcon />}
                      >
                        {isRecordingAudio ? "Recording..." : "Record Audio"}
                      </Button>
                    </Tooltip>
                    {(formAttachments.length > 0 || formVoiceFiles.length > 0) && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, maxHeight: 150, overflowY: 'auto' }}>
                        {formAttachments.map((fileObj, idx) => {
                          const isUrlStr = typeof fileObj === 'string';
                          const rawPath = isUrlStr ? fileObj : (fileObj?.url || fileObj?.filePath || fileObj?.path || '');
                          const url = typeof rawPath === 'string' ? rawPath : '';
                          const name = isUrlStr ? (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document') : (fileObj.name || (url ? url.substring(url.lastIndexOf('/') + 1) : 'Document'));
                          const size = isUrlStr ? null : fileObj.size;
                          const canPreview = isPreviewable(name);

                          return (
                            <Box key={`a-${idx}`} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default', border: '1px solid #e2e8f0', p: 1, borderRadius: '6px', mb: 0.5 }}>
                              <Box sx={{ width: '40%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InsertDriveFileIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                <Tooltip title={name} arrow>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {name}
                                  </Typography>
                                </Tooltip>
                              </Box>
                              <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                {getFileTypeDisplay(name)}
                              </Typography>
                              <Typography variant="caption" sx={{ width: '15%', color: '#64748b', fontWeight: 500 }}>
                                {size ? formatFileSize(size) : 'Unknown'}
                              </Typography>
                              <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                {canPreview ? (
                                  <Button size="small" onClick={() => {
                                    if (url) {
                                      setPreviewFileData({ url, name, type: getFileTypeDisplay(name) });
                                      setPreviewModalOpen(true);
                                    } else {
                                      showSnackbar('Invalid file path for preview', 'warning');
                                    }
                                  }} sx={{ textTransform: 'none', minWidth: 0, p: '2px 6px', fontSize: '0.7rem' }}>
                                    <VisibilityIcon sx={{ fontSize: 14, mr: 0.5 }} /> Preview
                                  </Button>
                                ) : (
                                  <Button size="small" onClick={() => {
                                    if (url) {
                                      window.open(`/api/files/view?path=${encodeURIComponent(url)}`, '_blank');
                                    } else {
                                      showSnackbar('Invalid file path for download', 'warning');
                                    }
                                  }} sx={{ textTransform: 'none', minWidth: 0, p: '2px 6px', fontSize: '0.7rem' }}>
                                    <DownloadIcon sx={{ fontSize: 14, mr: 0.5 }} /> Download
                                  </Button>
                                )}
                              </Box>
                              <IconButton size="small" onClick={() => setFormAttachments(formAttachments.filter((_, i) => i !== idx))} sx={{ color: 'error.main', p: 0.25 }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          );
                        })}
                        {formVoiceFiles.map((url, idx) => (
                          <Box
                            key={`v-${idx}`}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              bgcolor: 'background.default',
                              border: '1px solid #e2e8f0',
                              p: 1,
                              px: 1.5,
                              borderRadius: '8px',
                              mb: 0.5,
                              gap: 2
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(103, 58, 183, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#673ab7'
                                }}
                              >
                                <SettingsVoiceIcon sx={{ fontSize: 16 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', lineHeight: 1.2 }}>
                                  Voice Recording #{idx + 1}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                                  Audio Note
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', minWidth: 220, maxWidth: 380 }}>
                              <audio
                                src={'/api/files/view?path=' + encodeURIComponent(url)}
                                controls
                                style={{
                                  height: '34px',
                                  width: '100%',
                                  borderRadius: '6px'
                                }}
                              />
                            </Box>

                            <IconButton
                              size="small"
                              onClick={() => setFormVoiceFiles(formVoiceFiles.filter((_, i) => i !== idx))}
                              sx={{
                                color: 'error.main',
                                p: 0.5,
                                flexShrink: 0,
                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <Tooltip title="Ctrl + S" arrow placement="top">
                      <span style={{ marginLeft: 'auto' }}>
                        <Button
                          id="ticket-submit-button"
                          variant="contained"
                          type="submit"
                          disabled={isSaving}
                          sx={{
                            height: 43,
                            bgcolor: '#673ab7',
                            fontWeight: 700,
                            px: 4,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: '#5e35b1' },
                            '&.Mui-disabled': { bgcolor: '#b39ddb', color: '#fff' }
                          }}
                        >
                          <SaveIcon sx={{ mr: 1, fontSize: 20 }} />
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

            </Stack>
          </DialogContent>
        </form>
      </Dialog>

      {/* ── DIALOG: MANDATORY DUE DATE REASON POPUP ── */}
      <Dialog open={reasonOpen} onClose={() => setReasonOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Mandatory Target Extension Reason</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The target date exceeds the due date. Please enter a mandatory reason/justification for this extension:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            required
            label="Due Date Reason"
            value={dueDateReasonText}
            onChange={(e) => setDueDateReasonText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReasonOpen(false)}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleReasonSubmit}>Proceed & Save</Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: REOPEN REASON POPUP ── */}
      <Dialog open={reopenOpen} onClose={() => setReopenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reopen Task Confirmation</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please state the reason for reopening this resolved/closed ticket:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            required
            label="Reopen Reason"
            value={reopenReasonText}
            onChange={(e) => setReopenReasonText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            required
            label="New Target Date"
            InputLabelProps={{ shrink: true }}
            value={reopenTargetDate}
            onChange={(e) => setReopenTargetDate(e.target.value)}
            inputProps={{
              min: todayStr,
              onClick: (e) => { try { e.target.showPicker(); } catch (err) { } }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            required
            label="Expected Duration / Timing"
            placeholder="e.g. 2 hrs, 1 day"
            value={reopenTiming}
            onChange={(e) => setReopenTiming(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReopenTicket}>Reopen Task</Button>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: REASSIGN TICKET POPUP ── */}
      <Dialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setReassignOpen(false);
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleReassignSubmit();
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <ManageAccountsIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>Reassign Task</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>Select an employee and add comments to reassign this ticket.</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setReassignOpen(false)} size="small" sx={{ border: '1px solid #e2e8f0', bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ p: 4 }}>
          {/* Read-only top row */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
            pb: 3,
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap'
          }}>
            {/* Task ID */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid #e9d5ff', bgcolor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.2 }}>Task ID</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{reassignTicket?.ticketId || '-'}</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', height: '40px', alignSelf: 'center' }} />

            {/* Task Owner */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid #bae6fd', bgcolor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <PersonOutlineIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.2 }}>Task Owner</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{reassignTicket?.createdBy || '-'}</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', height: '40px', alignSelf: 'center' }} />

            {/* Verification Owner */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid #bbf7d0', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <SecurityOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.2 }}>Verification Owner</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{reassignTicket?.verifiedBy || '-'}</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', height: '40px', alignSelf: 'center' }} />

            {/* Testing Owner */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid #fed7aa', bgcolor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                <ScienceOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.2 }}>Testing Owner</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{reassignTicket?.testedBy || '-'}</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: '#e2e8f0', height: '40px', alignSelf: 'center' }} />

            {/* Current Assignee */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid #e9d5ff', bgcolor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                <PersonOutlineIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.2 }}>Current Assignee</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{reassignTicket?.assignedTo || '-'}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Reassign To <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <Autocomplete
                options={getFilteredEmployeesList()}
                getOptionLabel={(option) => option.employeeName || ''}
                value={reassignEmployee}
                onChange={(e, val) => setReassignEmployee(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select an employee"
                    size="small"
                    fullWidth
                    required
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonOutlineIcon sx={{ color: '#94a3b8', ml: 1, mr: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                    }}
                  />
                )}
              />
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Choose the employee to whom this task should be reassigned.
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Reassignment Reason <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                select
                size="small"
                fullWidth
                required
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                }}
              >
                {getReassignReasonOptions().map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Select the most appropriate reason for reassignment.
              </Typography>
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Reassignment Remarks <span style={{ color: '#ef4444' }}>*</span>
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <TextField
              size="small"
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Enter remarks for reassignment..."
              value={reassignComment}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setReassignComment(e.target.value);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <ChatBubbleOutlineIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '8px' }
              }}
            />
            <Typography variant="caption" sx={{ position: 'absolute', bottom: 12, right: 12, color: '#94a3b8', fontWeight: 600 }}>
              {reassignComment.length} / 500
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
            Provide additional details or context for this reassignment.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end' }}>
          <Tooltip title="Ctrl+S to Save">
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleReassignSubmit}
              disabled={isSaving}
              sx={{
                bgcolor: '#2563eb',
                color: '#fff',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1d4ed8', boxShadow: 'none' }
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* ── DIALOG: ATTACHMENTS PREVIEW ── */}
      <Dialog
        open={attachmentsDialogOpen}
        onClose={() => setAttachmentsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
            color: 'white',
            py: 2,
            px: 3
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', width: 36, height: 36 }}>
              <AttachFileIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                Task Attachments & Media
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mt: 0.3 }}>
                {ticketAttachments.length} file{ticketAttachments.length !== 1 ? 's' : ''} associated with this task
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setAttachmentsDialogOpen(false)} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc', maxHeight: '70vh', overflowY: 'auto' }}>
          {ticketAttachments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AttachFileIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#64748b' }}>
                No attachments found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This task currently does not have any attached files or audio notes.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {ticketAttachments.map((file) => {
                const isVoice = file.fileType === 'Voice Recording' ||
                  file.fileType === 'Additional Requirement Voice' ||
                  /\.(mp3|wav|m4a|aac|webm|ogg)$/i.test(file.fileName);
                const canPreview = isPreviewable(file.fileName);
                const fileExt = (file.fileName && file.fileName.includes('.')) ? file.fileName.split('.').pop().toLowerCase() : '';
                const isExcel = ['xlsx', 'xls', 'csv'].includes(fileExt);
                const isPdf = fileExt === 'pdf';
                const isImg = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt);

                const iconBg = isVoice ? '#f3e8ff' : isExcel ? '#ecfdf5' : isPdf ? '#fef2f2' : isImg ? '#eff6ff' : '#f1f5f9';
                const iconColor = isVoice ? '#7c3aed' : isExcel ? '#059669' : isPdf ? '#dc2626' : isImg ? '#2563eb' : '#64748b';

                return (
                  <Box
                    key={file.id}
                    sx={{
                      p: 1.5,
                      px: 2,
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      gap: 2,
                      '&:hover': {
                        borderColor: '#cbd5e1',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }
                    }}
                  >
                    {/* Left: Icon and Details */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 240px', minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '10px',
                          bgcolor: iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: iconColor,
                          flexShrink: 0
                        }}
                      >
                        {isVoice ? <SettingsVoiceIcon sx={{ fontSize: 20 }} /> : <InsertDriveFileIcon sx={{ fontSize: 20 }} />}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Tooltip title={file.fileName || 'Attachment'} arrow placement="top">
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: '#1e293b',
                              fontSize: '0.875rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {file.fileName || 'Attachment'}
                          </Typography>
                        </Tooltip>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.2 }}>
                          <Chip
                            size="small"
                            label={isVoice ? 'Audio Recording' : getFileTypeDisplay(file.fileName)}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: iconBg,
                              color: iconColor,
                              border: 'none',
                              '& .MuiChip-label': { px: 0.8 }
                            }}
                          />
                          {file.uploadedBy && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              By {file.uploadedBy}
                            </Typography>
                          )}
                          {file.uploadedAt && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              • {safeFormatDate(file.uploadedAt, 'dd MMM yyyy, hh:mm a')}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </Box>

                    {/* Right: Audio Player or Preview/Download Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                      {isVoice ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <audio
                            src={'/api/files/view?path=' + encodeURIComponent(file.filePath)}
                            controls
                            style={{
                              height: '36px',
                              width: '260px',
                              borderRadius: '8px'
                            }}
                          />
                          <Tooltip title="Download Audio" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadFileUrl(`/api/files/download?path=${encodeURIComponent(file.filePath)}`)}
                              sx={{
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                p: 0.75,
                                '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' }
                              }}
                            >
                              <DownloadIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <>
                          {canPreview && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                              onClick={() => {
                                setPreviewFileData({
                                  url: `/api/files/view?path=${encodeURIComponent(file.filePath)}`,
                                  name: file.fileName,
                                  type: getFileTypeDisplay(file.fileName)
                                });
                                setPreviewModalOpen(true);
                              }}
                              sx={{
                                bgcolor: 'rgba(103, 58, 183, 0.08)',
                                color: '#673ab7',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: '8px',
                                boxShadow: 'none',
                                '&:hover': {
                                  bgcolor: 'rgba(103, 58, 183, 0.16)',
                                  boxShadow: 'none'
                                }
                              }}
                            >
                              Preview
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                            onClick={() => handleDownloadFileUrl(`/api/files/download?path=${encodeURIComponent(file.filePath)}`)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              color: '#334155',
                              borderColor: '#cbd5e1',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '8px',
                              '&:hover': {
                                borderColor: '#94a3b8',
                                bgcolor: '#f8fafc'
                              }
                            }}
                          >
                            Download
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: INLINE ATTACHMENT PREVIEW ── */}
      <BOSFilePreview
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={previewFileData ? {
          serverFileName: typeof previewFileData === 'string' ? previewFileData : (previewFileData.serverFileName || previewFileData.filePath || (typeof previewFileData.url === 'string' ? previewFileData.url : '')),
          fileName: previewFileData.name || previewFileData.fileName || '',
          isServer: true
        } : null}
        url={previewFileData && typeof previewFileData.url === 'string' ? (previewFileData.url.startsWith('/api/') ? previewFileData.url : `/api/files/view?path=${encodeURIComponent(previewFileData.url)}`) : ''}
        fileName={previewFileData?.name || previewFileData?.fileName}
      />

      {/* Snackbar notification feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
