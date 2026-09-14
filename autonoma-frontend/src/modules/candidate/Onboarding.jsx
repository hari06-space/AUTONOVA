import useConfig from 'hooks/useConfig';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  MenuItem,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Paper,
  Skeleton,
  Chip,
  Tooltip,
  InputAdornment,
  Grid,
  Snackbar,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useColorScheme, createTheme, ThemeProvider } from '@mui/material/styles';
import Logo from 'ui-component/Logo';
import { playPortalSound } from 'utils/AudioEngine';
import {
  CandidatePortalSplash as OnboardingSplash,
  CandidateNetworkBackground as OnboardingNetworkBackground,
  CandidatePortalHeader,
  staticBgStylesheet,
  TranslationTooltip,
  SmoothLoadingSpinner,
  UniquePrevSymbolButton,
  UniqueNextSymbolButton
} from './CandidatePortalShared';

import {
  IconPlus,
  IconTrash,
  IconMoon,
  IconSun,
  IconBriefcase,
  IconSchool,
  IconLock,
  IconTrendingUp,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconDeviceFloppy,
  IconAlertCircle,
  IconFileText,
  IconCloudUpload,
  IconClock,
  IconHandStop,
  IconShieldCheck,
  IconMapPin,
  IconId,
  IconCreditCard,
  IconGlobe,
  IconCar,
  IconEye,
  IconFolder,
  IconBallpen,
  IconEdit,
  IconX
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOSTextField, BOSFileUpload, BOSDatePicker, BOSFilePreview } from 'ui-component/bos';
import { getCleanFileName } from 'ui-component/bos/BOSUtils';
import { getCompanyImageUrl, autoUploadFile, getFileViewUrl } from 'utils/upload-helper';


// Global focus patch to prevent page-scroll jumping when inputs/elements receive focus
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (options) {
    return originalFocus.call(this, { ...options, preventScroll: true });
  };
}

const MotionButton = motion.create ? motion.create(Button) : motion(Button);
const MotionCard = motion.create ? motion.create(Card) : motion(Card);
const MotionBox = motion.create ? motion.create(Box) : motion(Box);

const extractLocalPhoneDigits = (phoneStr, codeStr) => {
  if (!phoneStr) return '';
  const raw = String(phoneStr).trim();
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  if (!codeStr) return digitsOnly;
  const codeDigits = String(codeStr).replace(/[^0-9]/g, '');

  if (codeDigits && digitsOnly.startsWith(codeDigits) && digitsOnly.length > codeDigits.length) {
    return digitsOnly.slice(codeDigits.length);
  }
  return digitsOnly;
};

const isValidPhoneNum = (phoneStr, codeStr, countryList = []) => {
  if (!phoneStr || !String(phoneStr).trim()) return false;
  const local = extractLocalPhoneDigits(phoneStr, codeStr);
  if (!/^\d+$/.test(local)) return false;
  const matchedCountry = (countryList || []).find(c => c.countryCode === codeStr || c.isd === codeStr || String(c.id) === String(codeStr));
  const minLen = matchedCountry ? (matchedCountry.phoneMinLength || 8) : 8;
  const maxLen = matchedCountry ? (matchedCountry.phoneMaxLength || 15) : 15;
  return local.length >= minLen && local.length <= maxLen;
};

const TabNotesBanner = ({ title = "NOTES", titleTamil, notes = [], themeMode }) => {
  const isLight = themeMode === 'light';
  return (
    <Box
      sx={{
        ml: { xs: 0, sm: 6.5 },
        mb: 3,
        p: 2,
        px: 2.5,
        borderRadius: '14px',
        background: isLight ? 'rgba(13, 148, 136, 0.04)' : 'rgba(13, 148, 136, 0.07)',
        border: `1px solid ${isLight ? 'rgba(13, 148, 136, 0.18)' : 'rgba(99, 217, 196, 0.18)'}`,
        borderLeft: '4px solid #0d9488',
        boxShadow: isLight ? '0 4px 15px rgba(13, 148, 136, 0.03)' : '0 4px 15px rgba(0,0,0,0.2)'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconAlertCircle size={18} color="#0d9488" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isLight ? '#0f766e' : '#63d9c4', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>
          {title}
          <TranslationTooltip tamilText={titleTamil || "குறிப்புகள்"} themeMode={themeMode} />
        </Typography>
      </Stack>

      <Stack spacing={1}>
        {notes.map((note, i) => (
          <Typography
            key={i}
            variant="body2"
            component="div"
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              color: isLight ? '#1e293b' : '#f1f5f9',
              lineHeight: 1.6
            }}
          >
            <span style={{ color: '#0d9488', fontWeight: 800, marginRight: '6px' }}>•</span>
            {note.en}
            {note.ta && (
              <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', ml: 0.75 }}>
                <TranslationTooltip tamilText={note.ta} themeMode={themeMode} />
              </Box>
            )}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
};

const STEPS = [
  { id: 0, name: 'Experience', icon: IconBriefcase },
  { id: 1, name: 'Education', icon: IconSchool },
  { id: 2, name: 'KYC Documents', icon: IconLock },
  { id: 3, name: 'Skills', icon: IconTrendingUp }
];


export default function CandidateOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stableToken = searchParams.get('token') ||
    sessionStorage.getItem('candidateSessionToken') ||
    localStorage.getItem('candidateSessionToken');
  const sectionParam = searchParams.get('section');
  const tabParam = searchParams.get('tab');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [candidate, setCandidate] = useState(() => {
    try {
      const cached = localStorage.getItem(`candidate_details_${stableToken}`);
      if (cached) return JSON.parse(cached);
    } catch (e) { }
    return null;
  });
  const [verifying, setVerifying] = useState(true);
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('candidateThemeMode') || 'dark');
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('candidate_onboarding_active_tab');
    return savedTab ? parseInt(savedTab, 10) : 0;
  });
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [fieldErrors, setFieldErrors] = useState({});
  const isInitialMount = useRef(true);
  const [navDone, setNavDone] = useState(false);

  const registerField = () => { };

  const localTheme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: '#0d9488'
        }
      }
    });
  }, [themeMode]);

  const wrapTheme = (content) => (
    <ThemeProvider theme={localTheme}>
      <div className={themeMode === 'light' ? 'theme-light' : 'theme-dark'} style={{ minHeight: '100vh' }}>
        <style>{`
          .pulse-highlight-amber {
            box-shadow: none !important;
            animation: none !important;
          }
        `}</style>
        {content}
      </div>
    </ThemeProvider>
  );


  const [onboardingStarted, setOnboardingStarted] = useState(() => {
    const saved = sessionStorage.getItem('candidate_onboarding_started');
    const token = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('token') || sessionStorage.getItem('candidateSessionToken') || localStorage.getItem('candidateSessionToken')) : null;
    const savedLocal = token ? localStorage.getItem(`candidate_onboarding_started_${token}`) : null;
    const hasTarget = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('targetId');
    return saved === 'true' || savedLocal === 'true' || hasTarget;
  });

  // Splash animation only shows on the first page, and is skipped on reload/remaining pages
  const [splashDone, setSplashDone] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setMinSplashTimeElapsed(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setMinSplashTimeElapsed(true);
    }
  }, [showSplash]);

  useEffect(() => {
    if (!verifying && minSplashTimeElapsed && showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        // delay marking done until exit animation finishes (0.8s)
        setTimeout(() => setSplashDone(true), 800);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [verifying, minSplashTimeElapsed, showSplash]);

  // Safe scoped scroll restoration management (restores browser default on unmount)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      const previousScrollRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      return () => {
        window.history.scrollRestoration = previousScrollRestoration;
      };
    }
  }, []);

  // Unlock scrolling on root document when onboarding/assessment starts
  useEffect(() => {
    if (onboardingStarted || isMobile) {
      document.documentElement.style.overflowY = 'auto';
      document.body.style.overflowY = 'auto';
    } else {
      document.documentElement.style.overflowY = 'hidden';
      document.body.style.overflowY = 'hidden';
    }
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, [onboardingStarted, isMobile]);

  // Reset scroll position to top whenever activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const resetScrollPosition = () => {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      };

      resetScrollPosition();
      const timer = setTimeout(resetScrollPosition, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Rows state
  const [experienceRows, setExperienceRows] = useState([]);
  const [repMgrName, setRepMgrName] = useState('');
  const [repMgrEmail, setRepMgrEmail] = useState('');
  const [repMgrPhone, setRepMgrPhone] = useState('');
  const [repMgrPhoneCode, setRepMgrPhoneCode] = useState('');
  const [vertHeadName, setVertHeadName] = useState('');
  const [vertHeadEmail, setVertHeadEmail] = useState('');
  const [vertHeadPhone, setVertHeadPhone] = useState('');
  const [vertHeadPhoneCode, setVertHeadPhoneCode] = useState('');
  const [educationRows, setEducationRows] = useState([]);
  const [openEduTypeIndex, setOpenEduTypeIndex] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [countries, setCountries] = useState([]);

  // Fetch active countries dynamically from public candidate portal API
  useEffect(() => {
    axios.get('/api/hra/applicants/portal/countries')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCountries(list);
      })
      .catch(() => {
        setCountries([]);
      });
  }, []);

  // Close Education Type dropdown immediately when scrolling starts anywhere
  useEffect(() => {
    if (openEduTypeIndex === null) return;
    const handleScroll = () => {
      // Instantly hide open menu popovers in DOM synchronously (0ms lag)
      const openPopovers = document.querySelectorAll('.MuiMenu-root, .MuiPopover-root');
      openPopovers.forEach(el => {
        el.style.display = 'none';
      });
      setOpenEduTypeIndex(null);
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    };
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('wheel', handleScroll, true);
    document.addEventListener('touchmove', handleScroll, true);
    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleScroll, true);
      document.removeEventListener('touchmove', handleScroll, true);
    };
  }, [openEduTypeIndex]);

  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingError, setBrandingError] = useState(null);
  const [companyBranding, setCompanyBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('candidate_company_branding');
      if (cached) return JSON.parse(cached);
    } catch (e) { }
    return {
      companyName: 'Company Information',
      logoUrl: null,
      shortName: 'Company Information',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      emailId: '',
      mobileNo: '',
      phoneNo: '',
      website: '',
      supportEmail: '',
      supportPhone: ''
    };
  });

  // Fetch dynamic company profile branding with error fallback (caching removed to always fetch fresh company profile updates)
  useEffect(() => {
    setBrandingLoading(true);
    axios.get('/api/hra/applicants/portal/branding')
      .then(res => {
        if (res.data) {
          const data = res.data;
          const logoFileName = data.logoFileName;
          const lUrl = logoFileName ? getCompanyImageUrl(logoFileName) : null;

          const brandingData = {
            companyName: data.companyName || 'Company Information',
            logoUrl: lUrl,
            shortName: data.shortName || data.companyName || 'Company Information',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            pincode: data.pincode || '',
            emailId: data.emailId || '',
            mobileNo: data.mobileNo || '',
            phoneNo: data.phoneNo || '',
            website: data.website || '',
            supportEmail: data.supportEmail || '',
            supportPhone: data.supportPhone || ''
          };

          setCompanyBranding(brandingData);
          localStorage.setItem('candidate_company_branding', JSON.stringify(brandingData));
        }
      })
      .catch(err => {
        console.error("Failed to fetch public portal branding", err);
        setBrandingError(err);
        // Fallback: Neutral company information
        setCompanyBranding({
          companyName: 'Company Information',
          logoUrl: null,
          shortName: 'Company Information',
          address: '',
          city: '',
          state: '',
          country: '',
          pincode: '',
          emailId: '',
          mobileNo: '',
          phoneNo: '',
          website: '',
          supportEmail: '',
          supportPhone: ''
        });
      })
      .finally(() => {
        setBrandingLoading(false);
      });
  }, []);



  const [kycRows, setKycRows] = useState([
    { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', files: [] }
  ]);
  const [rejectedDocuments, setRejectedDocuments] = useState([]);
  const [userReplacedDocs, setUserReplacedDocs] = useState(new Set());
  const [skillsRows, setSkillsRows] = useState([]);
  const [uploadingKyc, setUploadingKyc] = useState({});
  const [docPreview, setDocPreview] = useState({ open: false, docs: [], currentIndex: 0 });

  const openDocPreview = (docs, index = 0) => {
    setDocPreview({ open: true, docs, currentIndex: index });
  };

  const closeDocPreview = () => {
    setDocPreview(prev => ({ ...prev, open: false }));
  };
  const [newSkillText, setNewSkillText] = useState('');
  const [newSkillFiles, setNewSkillFiles] = useState([]);
  const [uploadingSkillFile, setUploadingSkillFile] = useState(false);
  const [uploadingSkillRow, setUploadingSkillRow] = useState({});
  const skillFileInputRef = useRef(null);
  const skillRowFileInputRefs = useRef({});
  const fileInputRefs = useRef({});

  const isRequiredDoc = (name) => {
    const n = (name || '').toUpperCase();
    return n === 'AADHAR CARD';
  };

  const isDocRejected = (docNameKey) => {
    const isReuploadMode = rejectedDocuments && rejectedDocuments.length > 0;
    if (!isReuploadMode) return true; // if not reupload mode, everything is editable
    const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return rejectedDocuments.some(rd => {
      const rdClean = clean(rd.documentName);
      const keyClean = clean(docNameKey);
      return rdClean.includes(keyClean) || keyClean.includes(rdClean);
    });
  };

  const autoNavigateToNextUnresolved = (justResolvedDocName) => {
    if (!rejectedDocuments || rejectedDocuments.length === 0) return;

    const nextUnresolved = rejectedDocuments.find(rd => {
      const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean(rd.documentName) === clean(justResolvedDocName)) {
        return false;
      }
      return !hasReplacementForDoc(rd.documentName);
    });

    if (nextUnresolved) {
      const targetId = resolveTargetIdForDocument(nextUnresolved.documentName);
      if (targetId) {
        setTimeout(() => {
          jumpToField(targetId);
        }, 1000);
      }
    }
  };

  const trackDocumentReplacement = (docName, hasFiles) => {
    if (!docName) return;
    const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    setUserReplacedDocs(prev => {
      const next = new Set(prev);
      if (hasFiles) {
        next.add(clean(docName));
      } else {
        next.delete(clean(docName));
      }
      return next;
    });

    if (hasFiles) {
      autoNavigateToNextUnresolved(docName);
    }
  };

  const hasReplacementForDoc = (docNameKey) => {
    const targetId = resolveTargetIdForDocument(docNameKey);
    if (targetId) {
      const currentFiles = getCurrentFilesForTargetId(targetId);
      if (currentFiles.some(f => f && f.uploadedAt)) {
        return true;
      }
    }

    const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const keyClean = clean(docNameKey);
    for (const item of userReplacedDocs) {
      const itemClean = clean(item);
      if (keyClean.includes(itemClean) || itemClean.includes(keyClean)) {
        return true;
      }
    }
    return false;
  };

  const getRejectionReason = (docNameKey) => {
    const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = rejectedDocuments.find(rd => {
      const rdClean = clean(rd.documentName);
      const keyClean = clean(docNameKey);
      return rdClean.includes(keyClean) || keyClean.includes(rdClean);
    });
    return found ? found.rejectReason : null;
  };

  const renderRejectionAlert = (docNameKey) => {
    const reason = getRejectionReason(docNameKey);
    if (!reason) return null;
    // If a replacement has already been selected, suppress the rejection alert
    if (hasReplacementForDoc(docNameKey)) return null;
    return (
      <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
        <strong>Rejection Reason:</strong> {reason}
      </Alert>
    );
  };

  const getShortFileName = (fileName) => {
    if (!fileName) return 'Document';
    // Remove UUID prefix if any (e.g. 46c48a06-4d93-4ac0-af51-eabbb72e3f01_)
    let name = fileName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    if (name.length > 20) {
      const extIndex = name.lastIndexOf('.');
      if (extIndex !== -1 && name.length - extIndex <= 5) {
        const ext = name.substring(extIndex);
        return name.substring(0, 15) + '...' + ext;
      }
      return name.substring(0, 20) + '...';
    }
    return name;
  };

  const getAllOnboardingDocsList = () => {
    const list = [];
    
    // 1. KYC Documents
    if (kycRows && kycRows.length > 0) {
      kycRows.forEach(row => {
        if (row.files && row.files.length > 0) {
          row.files.forEach(f => {
            const rawName = f.fileName || f.name || f.serverFileName || 'Document';
            const serverFileName = f.serverFileName || f.fileName || f.filePath || f.path || rawName;
            const cleanName = getCleanFileName(rawName);
            const label = `${row.docName || 'KYC Document'} - ${cleanName}`;
            list.push({
              url: f.preview || getFileViewUrl(serverFileName),
              name: cleanName,
              fileName: label,
              serverFileName: serverFileName,
              isServer: true,
              label: label
            });
          });
        }
      });
    }

    // 2. Education Documents
    if (educationRows && educationRows.length > 0) {
      educationRows.forEach(row => {
        if (row.files && row.files.length > 0) {
          row.files.forEach(f => {
            const rawName = f.fileName || f.name || f.serverFileName || 'Document';
            const serverFileName = f.serverFileName || f.fileName || f.filePath || f.path || rawName;
            const cleanName = getCleanFileName(rawName);
            const label = `Education (${row.education || 'Degree'}) - ${cleanName}`;
            list.push({
              url: f.preview || getFileViewUrl(serverFileName),
              name: cleanName,
              fileName: label,
              serverFileName: serverFileName,
              isServer: true,
              label: label
            });
          });
        }
      });
    }

    // 3. Experience Documents
    if (experienceRows && experienceRows.length > 0) {
      experienceRows.forEach(row => {
        if (row.files && row.files.length > 0) {
          row.files.forEach(f => {
            const rawName = f.fileName || f.name || f.serverFileName || 'Document';
            const serverFileName = f.serverFileName || f.fileName || f.filePath || f.path || rawName;
            const cleanName = getCleanFileName(rawName);
            const label = `Experience (${row.companyName || 'Company'}) - ${cleanName}`;
            list.push({
              url: f.preview || getFileViewUrl(serverFileName),
              name: cleanName,
              fileName: label,
              serverFileName: serverFileName,
              isServer: true,
              label: label
            });
          });
        }
      });
    }

    // 4. Skills Documents
    if (skillsRows && skillsRows.length > 0) {
      skillsRows.forEach(row => {
        if (row.files && row.files.length > 0) {
          row.files.forEach(f => {
            const rawName = f.fileName || f.name || f.serverFileName || 'Document';
            const serverFileName = f.serverFileName || f.fileName || f.filePath || f.path || rawName;
            const cleanName = getCleanFileName(rawName);
            const label = `Skill (${row.activityDetails || 'Activity'}) - ${cleanName}`;
            list.push({
              url: f.preview || getFileViewUrl(serverFileName),
              name: cleanName,
              fileName: label,
              serverFileName: serverFileName,
              isServer: true,
              label: label
            });
          });
        }
      });
    }

    return list;
  };

  const handlePreview = (fileObj) => {
    const allDocsList = getAllOnboardingDocsList();
    const targetServerFile = fileObj.serverFileName || fileObj.filePath || fileObj.fileName || fileObj.name;
    const cleanName = getCleanFileName(fileObj.fileName || fileObj.name || 'document');
    let clickIdx = allDocsList.findIndex(d => d.serverFileName === targetServerFile || d.name === cleanName);

    if (allDocsList.length === 0) {
      const singleDoc = [{
        url: fileObj.preview || getFileViewUrl(targetServerFile),
        name: cleanName,
        fileName: cleanName,
        serverFileName: targetServerFile,
        isServer: true,
        label: cleanName
      }];
      openDocPreview(singleDoc, 0);
    } else {
      openDocPreview(allDocsList, clickIdx >= 0 ? clickIdx : 0);
    }
  };

  const getDocIcon = (name) => {
    const n = (name || '').toUpperCase();
    if (n === 'AADHAR CARD') return <IconId size={20} color="#2563EB" />;
    if (n === 'PAN CARD') return <IconCreditCard size={20} color="#2563EB" />;
    if (n === 'VOTER ID') return <IconBallpen size={20} color="#2563EB" />;
    if (n === 'PASSPORT') return <IconGlobe size={20} color="#2563EB" />;
    if (n === 'DRIVING LICENCE') return <IconCar size={20} color="#2563EB" />;
    if (n === 'RATION CARD') return <IconFileText size={20} color="#2563EB" />;
    return <IconFolder size={20} color="#2563EB" />;
  };

  const getVerificationStatusLabel = (row) => {
    const docName = (row.docName || '').toUpperCase();
    let status = 'PENDING';
    if (docName === 'AADHAR CARD' && candidate?.aadharVerifiedStatus) {
      status = candidate.aadharVerifiedStatus;
    } else {
      const overallStatus = String(candidate?.offerStatus || '').toUpperCase();
      const isOfferVerified = ['VERIFIED', 'APPROVED', 'ACCEPTED', 'CONFIRM'].includes(overallStatus);
      if (isOfferVerified) {
        status = 'VERIFIED';
      } else {
        status = 'PENDING';
      }
    }

    // Safely coerce to string in case status is a numeric ID or a StatusMaster object from the DB
    const resolvedStatus = status && typeof status === 'object' ? (status.name || status.id || 'PENDING') : (status || 'PENDING');
    const statusStr = String(resolvedStatus).toUpperCase();
    if (statusStr === 'VERIFIED') return 'Verified';
    if (statusStr === 'REJECTED') return 'Rejected';
    return statusStr;
  };

  const getStatusColor = (status) => {
    if (status === 'Verified') return 'success';
    if (status === 'Rejected') return 'error';
    return 'warning';
  };

  const handleFileChange = async (idx, e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const currentFiles = kycRows[idx].files || [];
    if (currentFiles.length + selectedFiles.length > 5) {
      setError('Maximum 5 files can be uploaded for each document.');
      e.target.value = '';
      return;
    }

    setUploadingKyc(prev => ({ ...prev, [idx]: true }));

    const maxSizeMB = 10;
    const newUploadedFiles = [];
    for (const selectedFile of selectedFiles) {
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${selectedFile.name}" exceeds the ${maxSizeMB}MB limit.`);
        continue;
      }

      try {
        const serverPath = await autoUploadFile(selectedFile, 'HRA_KYC');
        const cleanName = (selectedFile.name || '').replace(/\\/g, '/').split('/').pop();
        newUploadedFiles.push({
          fileName: cleanName,
          serverFileName: serverPath,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          isServer: true,
          uploadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }

    if (newUploadedFiles.length > 0) {
      setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, files: [...(item.files || []), ...newUploadedFiles] } : item));
      const docName = kycRows[idx]?.docName;
      if (docName) {
        trackDocumentReplacement(docName, true);
      }
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[`kyc_${idx}_file`];
        return next;
      });
    }
    setUploadingKyc(prev => ({ ...prev, [idx]: false }));
    e.target.value = '';
  };

  const handleSkillFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_FILES = 5;
    const remaining = MAX_FILES - newSkillFiles.length;
    if (remaining <= 0) {
      setError('Maximum 5 files allowed per skill.');
      e.target.value = '';
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`Only ${remaining} more file(s) can be added (max 5 per skill).`);
    }

    const maxSizeMB = 10;
    for (const file of toUpload) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        e.target.value = '';
        return;
      }
    }

    setUploadingSkillFile(true);
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const serverPath = await autoUploadFile(file, 'HRA_SKILLS');
        const cleanName = (file.name || '').replace(/\\/g, '/').split('/').pop();
        uploaded.push({ fileName: cleanName, serverFileName: serverPath, fileSize: file.size, fileType: file.type, isServer: true, uploadedAt: new Date().toISOString() });
      }
      setNewSkillFiles(prev => [...prev, ...uploaded]);
      trackDocumentReplacement('Skills', true);
    } catch (error) {
      console.error('Skill file upload failed:', error);
      setError('Failed to upload skill document.');
    } finally {
      setUploadingSkillFile(false);
      e.target.value = '';
    }
  };

  const handleSkillRowFileChange = async (e, rowIdx) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_FILES = 5;
    const currentFiles = skillsRows[rowIdx]?.files || [];
    const remaining = MAX_FILES - currentFiles.length;
    if (remaining <= 0) {
      setError('Maximum 5 files allowed per skill.');
      e.target.value = '';
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) setError(`Only ${remaining} more file(s) can be added (max 5 per skill).`);

    const maxSizeMB = 10;
    for (const file of toUpload) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
        e.target.value = '';
        return;
      }
    }

    setUploadingSkillRow(prev => ({ ...prev, [rowIdx]: true }));
    try {
      const uploaded = [];
      for (const file of toUpload) {
        const serverPath = await autoUploadFile(file, 'HRA_SKILLS');
        const cleanName = (file.name || '').replace(/\\/g, '/').split('/').pop();
        uploaded.push({ fileName: cleanName, serverFileName: serverPath, fileSize: file.size, fileType: file.type, isServer: true, uploadedAt: new Date().toISOString() });
      }
      setSkillsRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, files: [...(r.files || []), ...uploaded] } : r));
      trackDocumentReplacement('Skills', true);
    } catch (error) {
      console.error('Skill file upload failed:', error);
      setError('Failed to upload skill document.');
    } finally {
      setUploadingSkillRow(prev => ({ ...prev, [rowIdx]: false }));
      e.target.value = '';
    }
  };

  const handleAddStandardKyc = (label, key) => {
    setKycRows(prev => {
      const nextSlNo = prev.length + 1;
      return [
        ...prev,
        { slNo: nextSlNo, seqNo: nextSlNo, docName: key, docNo: '', files: [], isCustom: false }
      ];
    });
  };

  const handleRemoveKycRow = (index) => {
    setKycRows(prev => prev.filter((_, rIdx) => rIdx !== index).map((item, rIdx) => ({ ...item, slNo: rIdx + 1, seqNo: rIdx + 1 })));
  };

  // Helper to check if a row has actual user input (ignoring default empty objects)
  const hasRowData = (sectionId, row) => {
    if (!row) return false;

    let inputFields = [];
    if (sectionId === 'experience') {
      inputFields = ['companyName', 'location', 'fromDate', 'toDate', 'expYears', 'file'];
    } else if (sectionId === 'education') {
      inputFields = ['education', 'institutionName', 'files'];
    } else if (sectionId === 'kyc') {
      // prefilled docName, only docNo and file indicate candidate data entry
      inputFields = ['docNo', 'files'];
    } else if (sectionId === 'skills') {
      inputFields = ['activityDetails', 'file'];
    } else {
      inputFields = Object.keys(row).filter(k => !['slNo', 'seqNo', 'isCustom', 'id'].includes(k));
    }

    return inputFields.some(f => {
      const val = row[f];
      if (f === 'file') return val !== null && val !== undefined;
      if (f === 'files') return Array.isArray(val) && val.length > 0;
      return val && String(val).trim() !== '';
    });
  };

  // Metadata Configuration for Onboarding Completion
  const onboardingMetadata = [
    {
      id: 'experience',
      name: 'Experience',
      required: (cand) => cand?.q21_is_experienced?.toUpperCase() === 'YES',
      requiredFields: ['companyName', 'location', 'fromDate', 'toDate', 'expYears', 'file'],
      minRows: (cand) => cand?.q21_is_experienced?.toUpperCase() === 'YES' ? 1 : 0
    },
    {
      id: 'education',
      name: 'Education',
      required: () => true,
      requiredFields: ['education', 'institutionName', 'files'],
      minRows: () => 1
    },
    {
      id: 'kyc',
      name: 'KYC Documents',
      required: () => true,
      requiredFields: ['docName', 'docNo', 'file'],
      minRows: () => 3
    },
    {
      id: 'skills',
      name: 'Skills',
      required: () => false,
      requiredFields: ['activityDetails', 'file'],
      minRows: () => 0
    }
  ];

  // Resolver: Maps metadata section ID to the component's state data
  const resolveSectionData = (sectionId) => {
    switch (sectionId) {
      case 'experience': return experienceRows;
      case 'education': return educationRows;
      case 'kyc': return kycRows;
      case 'skills': return skillsRows;
      default: return [];
    }
  };

  const calculateOnboardingProgress = () => {
    if (!onboardingStarted) return 0;
    if (submitted || alreadySubmitted) return 100;
    return Math.min(100, 20 + activeTab * 20);
  };

  const resolveTargetIdForDocument = (documentName) => {
    if (!documentName) return null;
    const docClean = documentName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Check Education
    for (let idx = 0; idx < educationRows.length; idx++) {
      const edu = educationRows[idx];
      const matchStr = `Education - ${edu.education || ''} - ${edu.institutionName || ''}`;
      const nameClean = (edu.education || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (docClean.includes(matchStr.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        (nameClean && docClean.includes(nameClean))) {
        return `edu_${idx}`;
      }
    }

    // 2. Check Experience
    for (let idx = 0; idx < experienceRows.length; idx++) {
      const exp = experienceRows[idx];
      const matchStr = `Experience - ${exp.companyName || ''}`;
      const nameClean = (exp.companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (docClean.includes(matchStr.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        (nameClean && docClean.includes(nameClean))) {
        return `exp_${idx}`;
      }
    }

    // 3. Check KYC
    for (let idx = 0; idx < kycRows.length; idx++) {
      const k = kycRows[idx];
      const matchStr = k.docName ? `${k.docName} (${k.docNo || ''})` : 'KYC Document';
      const nameClean = (k.docName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (docClean.includes(matchStr.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        (nameClean && docClean.includes(nameClean))) {
        return `kyc_${idx}`;
      }
    }

    // 4. Check Skills
    for (let idx = 0; idx < skillsRows.length; idx++) {
      const s = skillsRows[idx];
      const matchStr = s.activityDetails ? `Skills - ${s.activityDetails}` : 'Skills Certificate';
      const nameClean = (s.activityDetails || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (docClean.includes(matchStr.toLowerCase().replace(/[^a-z0-9]/g, '')) ||
        (nameClean && docClean.includes(nameClean))) {
        return `skill_${idx}`;
      }
    }

    return null;
  };

  const getCurrentFilesForTargetId = (targetId) => {
    if (!targetId) return [];
    const cleanTargetId = targetId.replace(/_file_\d+/g, '');
    const match = cleanTargetId.match(/^([a-z]+)_(\d+)$/);
    if (!match) return [];

    const [_, type, idxStr] = match;
    const idx = parseInt(idxStr, 10);

    if (type === 'edu' && educationRows[idx]) {
      return educationRows[idx].files || [];
    }
    if (type === 'exp' && experienceRows[idx]) {
      return experienceRows[idx].files || [];
    }
    if (type === 'kyc' && kycRows[idx]) {
      return kycRows[idx].files || [];
    }
    if (type === 'skill' && skillsRows[idx]) {
      return skillsRows[idx].files || [];
    }
    return [];
  };

  const resolveTargetFieldInfo = (targetId) => {
    if (!targetId) return null;
    const cleanTargetId = targetId.replace(/_file_\d+/g, '');

    const match = cleanTargetId.match(/^([a-z]+)_(\d+)$/);
    if (!match) return null;

    const [_, type, idxStr] = match;
    const idx = parseInt(idxStr, 10);

    if (type === 'edu') {
      return { tabIndex: 1, elementId: `education_${idx}_file` };
    }
    if (type === 'exp') {
      return { tabIndex: 0, elementId: `experience_${idx}_file` };
    }
    if (type === 'kyc') {
      return { tabIndex: 2, elementId: `kyc_${idx}` };
    }
    if (type === 'skill') {
      return { tabIndex: 3, elementId: `skills_row_${idx}` };
    }

    return null;
  };

  const jumpToField = (targetId) => {
    if (!targetId) return;
    const field = resolveTargetFieldInfo(targetId);
    if (field) {
      setOnboardingStarted(true);
      handleTabChange(field.tabIndex, true);
      setTimeout(() => {
        const el = document.getElementById(field.elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('pulse-highlight-amber');
          setTimeout(() => el.classList.remove('pulse-highlight-amber'), 4000);

          const input = el.querySelector('input, select, textarea');
          if (input) {
            input.focus({ preventScroll: true });
          }
        } else {
          console.warn(`Element with ID "${field.elementId}" not found in DOM.`);
        }
      }, 300);
    } else {
      console.warn(`Requested document targetId="${targetId}" could not be resolved.`);
      setError('The requested document could not be located.');
    }
  };

  // Deep-link navigation effect
  useEffect(() => {
    if (!verifying && candidate && !navDone) {
      let targetId = searchParams.get('targetId');

      // Fallback: if targetId is not specified in URL but rejectedDocuments list has items,
      // resolve the targetId from the first rejected document.
      if (!targetId && rejectedDocuments && rejectedDocuments.length > 0) {
        targetId = resolveTargetIdForDocument(rejectedDocuments[0].documentName);
      }

      if (targetId) {
        const field = resolveTargetFieldInfo(targetId);
        if (field) {
          setOnboardingStarted(true);
          handleTabChange(field.tabIndex, true);

          let attempts = 0;
          let activeTimer = null;

          const pollScroll = () => {
            attempts++;
            const el = document.getElementById(field.elementId);
            if (el) {
              // Scroll element into view
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });

              // Dual window scroll offset for mobile headers
              const rect = el.getBoundingClientRect();
              const targetY = window.pageYOffset + rect.top - 110;
              window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });

              // Visual glow highlight
              el.classList.add('pulse-highlight-amber');
              setTimeout(() => el.classList.remove('pulse-highlight-amber'), 5000);

              // Focus input
              const input = el.querySelector('input, select, textarea');
              if (input) {
                try { input.focus({ preventScroll: true }); } catch (e) {}
              }
              setNavDone(true);
            } else if (attempts < 25) {
              activeTimer = setTimeout(pollScroll, 120);
            } else {
              setNavDone(true);
            }
          };

          activeTimer = setTimeout(pollScroll, 100);
          return () => { if (activeTimer) clearTimeout(activeTimer); };
        } else {
          setNavDone(true);
        }
      } else {
        setNavDone(true);
      }
    }
  }, [verifying, candidate, rejectedDocuments, searchParams, navDone]);

  // Verify token and load data on mount
  useEffect(() => {
    if (stableToken && (sectionParam === 'upload' || tabParam === 'upload')) {
      navigate(`/candidate/assessment?token=${stableToken}&section=upload`, { replace: true });
      return;
    }
    if (!stableToken) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        axios.get('/api/hra/applicants/portal/generate-test-token?empCode=APPL-0001')
          .then(res => {
            if (res.data && res.data.token) {
              navigate(`/candidate/onboarding?token=${res.data.token}`, { replace: true });
            } else {
              setError('Access denied. Please use the direct link provided in your email.');
              setVerifying(false);
            }
          })
          .catch(() => {
            setError('Access denied. Please use the direct link provided in your email.');
            setVerifying(false);
          });
        return;
      }
      setError('Access denied. Please use the direct link provided in your email.');
      setVerifying(false);
      return;
    }

    setVerifying(true);
    axios.get(`/api/hra/applicants/portal/verify-onboarding-token?token=${stableToken}`)
      .then(res => {
        if (res.data && res.data.valid) {
          const app = res.data.applicant;
          const onboardingRejections = res.data.rejectedDocuments || [];
          setRejectedDocuments(onboardingRejections);

          const resume = resolveResumeState(app);
          const isReuploadSession = onboardingRejections.length > 0 || !!searchParams.get('targetId') || resume.shouldResume;
          if (isReuploadSession) {
            setOnboardingStarted(true);
            sessionStorage.setItem('candidate_onboarding_started', 'true');
            localStorage.setItem(`candidate_onboarding_started_${stableToken}`, 'true');
            if (resume.shouldResume && onboardingRejections.length === 0 && !searchParams.get('targetId')) {
              setActiveTab(resume.activeTab);
              sessionStorage.setItem('candidate_onboarding_active_tab', resume.activeTab);
            }
          }

          const getStatusVal = (val) => {
            if (!val) return '';
            if (typeof val === 'object') return val.name || val.id || '';
            return val;
          };

          const hasRejection = app && onboardingRejections.length === 0 && (
            String(getStatusVal(app.photoVerifiedStatus)).toUpperCase() === 'REJECTED' ||
            String(getStatusVal(app.resumeVerifiedStatus)).toUpperCase() === 'REJECTED' ||
            String(getStatusVal(app.aadharVerifiedStatus)).toUpperCase() === 'REJECTED' ||
            String(getStatusVal(app.payslipVerifiedStatus)).toUpperCase() === 'REJECTED'
          );

          if (hasRejection) {
            navigate(`/candidate/assessment?token=${stableToken}&section=upload`, { replace: true });
            return;
          }

          sessionStorage.setItem('candidateSessionToken', stableToken);
          localStorage.setItem('candidateSessionToken', stableToken);
          setCandidate(app);
          localStorage.setItem(`candidate_details_${stableToken}`, JSON.stringify(app));
          setRepMgrName(app?.q41_hr_mgr_name || app?.q41_hrMgrName || '');
          setRepMgrEmail(app?.q42_hr_mgr_email || app?.q42_hrMgrEmail || '');
          setRepMgrPhone(app?.q43_hr_mgr_phone || app?.q43_hrMgrPhone || '');
          setVertHeadName(app?.q44_vert_head_name || app?.q44_vertHeadName || '');
          setVertHeadEmail(app?.q45_vert_head_email || app?.q45_vertHeadEmail || '');
          setVertHeadPhone(app?.q46_vert_head_phone || app?.q46_vertHeadPhone || '');
          if (res.data.alreadySubmitted) {
            setAlreadySubmitted(true);
            setShowSplash(false);
            setSplashDone(true);
          } else {
            const original = res.data.applicant;

            const parseFilePaths = (pathStr) => {
              if (!pathStr || !pathStr.trim()) return [];
              return pathStr.split(',')
                .map(p => p.trim())
                .filter(Boolean)
                .map(p => {
                  const fileName = p.replace(/\\/g, '/').split('/').pop();
                  return {
                    fileName: fileName || 'document',
                    serverFileName: p,
                    isServer: true
                  };
                });
            };

            // Map experience rows
            if (original.experience && original.experience.length > 0) {
              setExperienceRows(original.experience.map((exp, idx) => ({
                id: exp.id,
                slNo: idx + 1,
                companyName: exp.companyName || '',
                location: exp.location || '',
                fromDate: exp.fromDate || '',
                toDate: exp.toDate || '',
                expYears: calculateExperience(exp.fromDate, exp.toDate) || exp.expYears || '',
                files: parseFilePaths(exp.filePath)
              })));
            } else if (app?.q21_is_experienced?.toUpperCase() === 'YES') {
              setExperienceRows([{
                id: null,
                slNo: 1,
                companyName: '',
                location: '',
                fromDate: '',
                toDate: '',
                expYears: '',
                files: []
              }]);
            }

            // Map education rows
            const dbEduList = original.education || [];
            if (dbEduList.length > 0) {
              setEducationRows(dbEduList.map((edu, idx) => {
                const eduVal = edu.education || '';
                const isOld10th = eduVal === '10th / Secondary Qualification';
                const isOld12th = eduVal === '12th / Higher Secondary Qualification';
                return {
                  id: edu.id,
                  slNo: idx + 1,
                  education: isOld10th ? '10TH' : isOld12th ? '12TH' : eduVal,
                  university: edu.university || '',
                  institutionName: edu.institutionName || '',
                  type: edu.type || '',
                  yearOfPassing: edu.yearOfPassing || '',
                  grade: edu.grade || '',
                  stream: edu.stream || '',
                  isDefault10th: isOld10th || undefined,
                  isDefault12th: isOld12th || undefined,
                  files: parseFilePaths(edu.filePath)
                };
              }));
            } else {
              // First load: set default empty rows
              setEducationRows([
                { id: null, slNo: 1, education: '10TH', university: '', institutionName: '', type: 'FULL TIME', yearOfPassing: '', grade: '', stream: '', isDefault10th: true, files: [] },
                { id: null, slNo: 2, education: '12TH', university: '', institutionName: '', type: 'FULL TIME', yearOfPassing: '', grade: '', stream: '', isDefault12th: true, files: [] },
                { id: null, slNo: 3, education: '', university: 'Diploma', institutionName: '', type: '', yearOfPassing: '', grade: '', stream: '', files: [] },
                { id: null, slNo: 4, education: '', university: 'UG', institutionName: '', type: '', yearOfPassing: '', grade: '', stream: '', files: [] },
                { id: null, slNo: 5, education: '', university: 'PG', institutionName: '', type: '', yearOfPassing: '', grade: '', stream: '', files: [] }
              ]);
            }

            // Map KYC rows
            let mappedKyc = [];
            if (original.kyc && original.kyc.length > 0) {
              mappedKyc = original.kyc.map((k, idx) => ({
                id: k.id,
                slNo: idx + 1,
                seqNo: k.seqNo,
                docName: k.docName,
                docNo: k.docNo || '',
                files: parseFilePaths(k.filePath),
                isCustom: !['AADHAR CARD', 'PAN CARD', 'VOTER ID', 'PASSPORT'].includes((k.docName || '').toUpperCase())
              }));
            }

            // Find or create Aadhar Card row
            const aadharRowIndex = mappedKyc.findIndex(k => k.docName?.toUpperCase() === 'AADHAR CARD');
            const defaultAadharNo = original.aadharNo || '';
            const defaultAadharPath = original.aadharPath || '';

            if (aadharRowIndex !== -1) {
              // Pre-fill Aadhaar from applicant if draft row is empty
              if (!mappedKyc[aadharRowIndex].docNo && defaultAadharNo) {
                mappedKyc[aadharRowIndex].docNo = defaultAadharNo;
              }
              if ((!mappedKyc[aadharRowIndex].files || mappedKyc[aadharRowIndex].files.length === 0) && defaultAadharPath) {
                mappedKyc[aadharRowIndex].files = parseFilePaths(defaultAadharPath);
              }
            } else {
              mappedKyc.unshift({
                id: null,
                slNo: 1,
                seqNo: 'KYC-01',
                docName: 'AADHAR CARD',
                docNo: defaultAadharNo,
                files: parseFilePaths(defaultAadharPath),
                isCustom: false
              });
            }

            // Filter out empty standard documents: only keep Aadhar, and any others that have data
            const filteredKyc = mappedKyc.filter(k => {
              const nameUpper = (k.docName || '').toUpperCase();
              if (nameUpper === 'AADHAR CARD') return true;
              if (['PAN CARD', 'VOTER ID', 'PASSPORT'].includes(nameUpper)) {
                return !!k.docNo?.trim() || (k.files && k.files.length > 0);
              }
              return true; // keep custom docs
            });

            // Re-sequence slNo and seqNo
            const finalKyc = filteredKyc.map((k, idx) => ({
              ...k,
              slNo: idx + 1,
              seqNo: `KYC-${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`
            }));

            setKycRows(finalKyc);

            // Map skills rows
            if (original.skills && original.skills.length > 0) {
              setSkillsRows(original.skills.map((s, idx) => ({
                id: s.id,
                slNo: idx + 1,
                activityDetails: s.activityDetails || '',
                files: parseFilePaths(s.filePath)
              })));
            }
          }
        } else {
          setError('Invalid or expired onboarding token.');
          sessionStorage.removeItem('candidateSessionToken');
          localStorage.removeItem('candidateSessionToken');
        }
      })
      .catch(err => {
        console.error(err);
        sessionStorage.removeItem('candidateSessionToken');
        localStorage.removeItem('candidateSessionToken');
        if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !searchParams.get('token')) {
          axios.get('/api/hra/applicants/portal/generate-test-token?empCode=APPL-0001')
            .then(res => {
              if (res.data && res.data.token) {
                navigate(`/candidate/onboarding?token=${res.data.token}`, { replace: true });
              } else {
                setError(err.response?.data || 'Failed to verify session token.');
              }
            })
            .catch(() => setError(err.response?.data || 'Failed to verify session token.'));
          return;
        }
        setError(err.response?.data || 'Failed to verify session token.');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [stableToken, sectionParam, tabParam, navigate, searchParams]);

  // Handle 401 Unauthorized globally for candidate page
  useEffect(() => {
    const handleUnauthorized = (e) => {
      sessionStorage.removeItem('candidateSessionToken');
      localStorage.removeItem('candidateSessionToken');
      if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !searchParams.get('token')) {
        axios.get('/api/hra/applicants/portal/generate-test-token?empCode=APPL-0001')
          .then(res => {
            if (res.data && res.data.token) {
              navigate(`/candidate/onboarding?token=${res.data.token}`, { replace: true });
            } else {
              setError(e.detail || 'This onboarding link is invalid or has expired. Please contact HR.');
            }
          })
          .catch(() => setError(e.detail || 'This onboarding link is invalid or has expired. Please contact HR.'));
        return;
      }
      setError(e.detail || 'This onboarding link is invalid or has expired. Please contact HR.');
    };
    window.addEventListener('bos-candidate-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bos-candidate-unauthorized', handleUnauthorized);
  }, [searchParams, navigate]);

  // Sync form inputs to server database (auto save on change)
  useEffect(() => {
    if (!candidate || verifying || alreadySubmitted || submitted) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');

    const timer = setTimeout(async () => {
      try {
        const token = sessionStorage.getItem('candidateSessionToken') || searchParams.get('token');
        if (!token) return;

        const payload = {
          token,
          q21_is_experienced: candidate?.q21_is_experienced,
          q41_hr_mgr_name: repMgrName || null,
          q42_hr_mgr_email: repMgrEmail || null,
          q43_hr_mgr_phone: repMgrPhone || null,
          q44_vert_head_name: vertHeadName || null,
          q45_vert_head_email: vertHeadEmail || null,
          q46_vert_head_phone: vertHeadPhone || null,
          experience: experienceRows.map((row, idx) => ({
            id: row.id || null,
            slNo: idx + 1,
            companyName: row.companyName,
            location: row.location,
            fromDate: row.fromDate || null,
            toDate: row.toDate || null,
            expYears: row.expYears,
            filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
          })),
          education: educationRows.map((row, idx) => ({
            id: row.id || null,
            slNo: idx + 1,
            education: row.education,
            institutionName: row.institutionName,
            type: row.type || null,
            yearOfPassing: row.yearOfPassing,
            grade: row.grade,
            stream: row.stream || null,
            filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null,
            university: row.university || null
          })),
          kyc: kycRows
            .filter(row => row.docName?.trim() || row.docNo?.trim() || (row.files && row.files.length > 0))
            .map((row, idx) => ({
              id: row.id || null,
              slNo: idx + 1,
              seqNo: idx + 1,
              docName: row.docName,
              docNo: row.docNo,
              filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
            })),
          skills: skillsRows.map((row, idx) => ({
            id: row.id || null,
            slNo: idx + 1,
            activityDetails: row.activityDetails,
            filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
          }))
        };

        await axios.post('/api/hra/applicants/portal/save-onboarding-draft', payload);
        setSaveStatus('saved');
      } catch (err) {
        console.error("Failed to auto-save onboarding draft", err);
        setSaveStatus('error');
      }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [experienceRows, educationRows, kycRows, skillsRows, candidate, verifying, alreadySubmitted, submitted, repMgrName, repMgrEmail, repMgrPhone, vertHeadName, vertHeadEmail, vertHeadPhone]);

  // Exit warning listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitted && !alreadySubmitted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to exit? Your progress is auto-saved but you have not submitted yet.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submitted, alreadySubmitted]);

  const toggleTheme = () => {
    playPortalSound('click');
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('candidateThemeMode', nextTheme);
  };

  // Row operations
  const handleAddExperienceRow = () => {
    playPortalSound('click');
    setExperienceRows(prev => [
      ...prev,
      { slNo: prev.length + 1, companyName: '', location: '', fromDate: '', toDate: '', expYears: '', files: [] }
    ]);
  };

  function calculateExperience(fromStr, toStr) {
    if (!fromStr || !toStr) return '';
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return '';
    if (toDate < fromDate) return '';
    const diffTime = toDate - fromDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = (diffDays / 365.25).toFixed(1);
    return parseFloat(years) >= 0 ? years : '';
  }

  const handleExperienceRowChange = (index, field, value) => {
    setExperienceRows(prev => prev.map((row, i) => {
      if (i === index) {
        const updated = { ...row, [field]: value };
        if (field === 'fromDate' || field === 'toDate') {
          updated.expYears = calculateExperience(updated.fromDate, updated.toDate);
        }
        return updated;
      }
      return row;
    }));

    if (field === 'files') {
      trackDocumentReplacement('Experience', (value || []).length > 0);
    }

    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`experience_${index}_${field}`];
      if (field === 'files') {
        delete next[`experience_${index}_file`];
      }
      return next;
    });
  };

  const isSchoolEdu = (row) => {
    if (!row) return false;
    if (row.isSchoolEducation) return true;
    const edu = (row.education || '').toLowerCase();
    const uni = (row.university || '').toLowerCase();
    return (
      edu.includes('10th') ||
      edu.includes('12th') ||
      edu.includes('11th') ||
      edu.includes('9th') ||
      edu.includes('8th') ||
      edu.includes('7th') ||
      edu.includes('6th') ||
      edu.includes('5th') ||
      edu.includes('school') ||
      edu.includes('sslc') ||
      edu.includes('secondary') ||
      uni.includes('board') ||
      uni.includes('cbse') ||
      uni.includes('icse') ||
      uni.includes('matric') ||
      uni.includes('state')
    );
  };

  const handleAddSchoolEducationRow = () => {
    setEducationRows(prev => [
      ...prev,
      {
        id: null,
        slNo: prev.length + 1,
        education: '',
        university: 'State Board',
        institutionName: '',
        type: 'FULL TIME',
        yearOfPassing: '',
        grade: '',
        stream: '',
        files: [],
        isSchoolEducation: true
      }
    ]);
  };

  const handleAddEducationRow = () => {
    setEducationRows(prev => [
      ...prev,
      { slNo: prev.length + 1, education: '', university: '', institutionName: '', type: '', yearOfPassing: '', grade: '', stream: '', files: [] }
    ]);
  };

  const is11thOr12th = (eduStr) => {
    if (!eduStr) return false;
    const str = String(eduStr).toLowerCase();
    if (str.includes('10th') || str.includes('10')) return false;
    return str.includes('11th') || str.includes('12th') || str.includes('11') || str.includes('12') || str.includes('higher secondary') || str.includes('hsc');
  };

  const handleEducationRowChange = (index, field, value) => {
    setEducationRows(prev => prev.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, [field]: value };
      if (field === 'education') {
        if (!is11thOr12th(value)) {
          updated.stream = 'N/A';
        }
      }
      return updated;
    }));

    if (field === 'files') {
      const row = educationRows[index];
      const docName = row ? (row.education || row.university) : null;
      if (docName) {
        trackDocumentReplacement(docName, (value || []).length > 0);
      }
    }

    if ((field === 'education' || field === 'university') && candidate?.id && value) {
      const valLower = value.toLowerCase();
      let restoredKey = null;
      if (valLower.includes('10th')) restoredKey = '10th';
      else if (valLower.includes('12th')) restoredKey = '12th';
      else if (valLower.includes('diploma')) restoredKey = 'diploma';
      else if (valLower.includes('ug')) restoredKey = 'ug';
      else if (valLower.includes('pg')) restoredKey = 'pg';

      if (restoredKey) {
        const deletedKeysStr = localStorage.getItem(`onboarding_deleted_education_${candidate.id}`);
        if (deletedKeysStr) {
          const deletedKeys = JSON.parse(deletedKeysStr);
          const updated = deletedKeys.filter(k => k !== restoredKey);
          localStorage.setItem(`onboarding_deleted_education_${candidate.id}`, JSON.stringify(updated));
        }
      }
    }

    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`education_${index}_${field}`];
      if (field === 'files') {
        delete next[`education_${index}_file`];
      }
      return next;
    });
  };

  const handleAddSkillRow = () => {
    setSkillsRows(prev => [
      ...prev,
      { slNo: prev.length + 1, activityDetails: '', file: null }
    ]);
  };

  const handleSkillRowChange = (index, field, value) => {
    setSkillsRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));

    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`skills_${index}_${field}`];
      return next;
    });
  };

  const handleCustomKycChange = (idx, field, value) => {
    setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[`kyc_${idx}_${field}`];
      return next;
    });
  };

  const handleRemoveCustomKyc = (idx) => {
    setKycRows(prev => prev.filter((_, rIdx) => rIdx !== idx).map((item, rIdx) => ({ ...item, slNo: rIdx + 1, seqNo: rIdx + 1 })));
  };

  const handleSkillFileClick = () => {
    skillFileInputRef.current?.click();
  };


  const handleAddSkillFromInput = (skillName) => {
    const name = skillName?.trim();
    if (!name) return;
    if (skillsRows.some(s => s.activityDetails?.toLowerCase() === name.toLowerCase())) {
      setNewSkillText('');
      setNewSkillFiles([]);
      return;
    }
    setSkillsRows(prev => [
      ...prev,
      { slNo: prev.length + 1, activityDetails: name, files: [...newSkillFiles] }
    ]);
    setNewSkillText('');
    setNewSkillFiles([]);
  };

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkillFromInput(e.target.value);
    }
  };

  const renderSectionHeader = (title, description) => (
    <Box sx={{ mb: 4, mt: 2, textAlign: 'left' }}>
      <Typography
        variant="h2"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '24px', sm: '32px' },
          color: textPrimaryColor,
          mb: 1,
          letterSpacing: '-0.5px'
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: textMutedColor,
          fontSize: { xs: '14px', sm: '16px' },
          lineHeight: 1.5
        }}
      >
        {description}
      </Typography>
    </Box>
  );

  const getTabValidationError = (tabIndex, customData = null, options = {}) => {
    const data = customData || {
      candidate,
      repMgrName,
      repMgrEmail,
      repMgrPhone,
      vertHeadName,
      vertHeadEmail,
      vertHeadPhone,
      experienceRows,
      educationRows,
      kycRows,
      skillsRows
    };

    const hasValidTextContent = (val, minAlphaNum = 2) => {
      if (val === undefined || val === null) return false;
      const str = val.toString().trim();
      if (!str) return false;
      const matches = str.match(/[a-zA-Z0-9\u0B80-\u0BFF]/g);
      return matches !== null && matches.length >= minAlphaNum;
    };

    const newErrors = {};

    if (tabIndex === 0) {
      // 1. Experience validation
      const isExperiencedVal = data.candidate?.q21_is_experienced?.toUpperCase()?.trim() === 'YES' || data.candidate?.q21_isExperienced?.toUpperCase()?.trim() === 'YES';
      if (isExperiencedVal) {
        if (!hasValidTextContent(data.repMgrName, 2)) {
          newErrors['experience_repMgrName'] = 'HR Manager Name must contain valid text (at least 2 letters/digits)';
        }
        if (!data.repMgrEmail?.trim()) {
          newErrors['experience_repMgrEmail'] = 'HR Manager Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.repMgrEmail.trim())) {
          newErrors['experience_repMgrEmail'] = 'Invalid email format';
        }
        if (!data.repMgrPhone?.trim()) {
          newErrors['experience_repMgrPhone'] = 'HR Manager Phone is required';
        } else if (!isValidPhoneNum(data.repMgrPhone, data.repMgrPhoneCode, countries)) {
          newErrors['experience_repMgrPhone'] = 'Invalid phone number for the selected country';
        }

        if (!hasValidTextContent(data.vertHeadName, 2)) {
          newErrors['experience_vertHeadName'] = 'Vertical Head Name must contain valid text (at least 2 letters/digits)';
        }
        if (!data.vertHeadEmail?.trim()) {
          newErrors['experience_vertHeadEmail'] = 'Vertical Head Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.vertHeadEmail.trim())) {
          newErrors['experience_vertHeadEmail'] = 'Invalid email format';
        }
        if (!data.vertHeadPhone?.trim()) {
          newErrors['experience_vertHeadPhone'] = 'Vertical Head Phone is required';
        } else if (!isValidPhoneNum(data.vertHeadPhone, data.vertHeadPhoneCode, countries)) {
          newErrors['experience_vertHeadPhone'] = 'Invalid phone number for the selected country';
        }

        if (data.repMgrEmail?.trim() && data.vertHeadEmail?.trim() &&
          data.repMgrEmail.trim().toLowerCase() === data.vertHeadEmail.trim().toLowerCase()) {
          newErrors['experience_repMgrEmail'] = 'Manager Email and Vertical Head Email cannot be the same';
          newErrors['experience_vertHeadEmail'] = 'Vertical Head Email and Manager Email cannot be the same';
        }

        if (data.experienceRows.length === 0) {
          return 'You are registered as an experienced candidate. Please add at least one experience record.';
        }
      }

      for (let i = 0; i < data.experienceRows.length; i++) {
        const exp = data.experienceRows[i];
        if (!hasValidTextContent(exp.companyName, 2)) {
          newErrors[`experience_${i}_companyName`] = 'Company name must contain valid text (at least 2 letters/digits)';
        }
        if (!hasValidTextContent(exp.location, 2)) {
          newErrors[`experience_${i}_location`] = 'Location must contain valid text (at least 2 letters/digits)';
        }
        if (!exp.fromDate) {
          newErrors[`experience_${i}_fromDate`] = 'From date is required';
        }
        if (!exp.toDate) {
          newErrors[`experience_${i}_toDate`] = 'To date is required';
        }
        if (!exp.expYears) {
          newErrors[`experience_${i}_expYears`] = 'Years of experience is required';
        }
        if (!exp.files || exp.files.length === 0) {
          newErrors[`experience_${i}_file`] = 'Attachment is required';
        }
      }
    }

    if (tabIndex === 1) {
      // 2. Education validation
      if (data.educationRows.length === 0) {
        return 'Please add at least one education record.';
      }
      for (let i = 0; i < data.educationRows.length; i++) {
        const edu = data.educationRows[i];
        if (!hasValidTextContent(edu.education, 2)) {
          newErrors[`education_${i}_education`] = 'Education / Degree must contain valid text (at least 2 letters/digits)';
        }
        if (!hasValidTextContent(edu.university, 2)) {
          newErrors[`education_${i}_university`] = isSchoolEdu(edu) ? 'Board Name must contain valid text (at least 2 letters/digits)' : 'Qualification Type must contain valid text';
        }
        if (!hasValidTextContent(edu.institutionName, 2)) {
          newErrors[`education_${i}_institutionName`] = 'Institution Name must contain valid text (at least 2 letters/digits)';
        }
        if (edu.education === '12th / Higher Secondary Qualification' && !hasValidTextContent(edu.stream, 2)) {
          newErrors[`education_${i}_stream`] = 'Stream / Specification must contain valid text';
        }
        if (!edu.type?.trim()) {
          newErrors[`education_${i}_type`] = 'Education Type is required';
        }
        if (!edu.yearOfPassing || String(edu.yearOfPassing).trim() === '') {
          newErrors[`education_${i}_yearOfPassing`] = 'Year of Passing is required';
        } else if (String(edu.yearOfPassing).trim().length < 4) {
          newErrors[`education_${i}_yearOfPassing`] = 'Year of Passing must be exactly 4 digits';
        }
        if (!hasValidTextContent(edu.grade, 1)) {
          newErrors[`education_${i}_grade`] = '% / Grade is required';
        }
        if (!edu.files || edu.files.length === 0) {
          newErrors[`education_${i}_file`] = 'Certificate / Document is required';
        }
      }
    }

    if (tabIndex === 2) {
      // 3. KYC validation
      const hasAadhar = data.kycRows.some(r => r.docName?.toUpperCase() === 'AADHAR CARD');
      if (!hasAadhar) {
        return 'Aadhaar Card is mandatory. Please add Aadhaar Card.';
      }

      for (let i = 0; i < data.kycRows.length; i++) {
        const kyc = data.kycRows[i];
        const isCustom = kyc.isCustom;
        if (!isCustom) {
          // Only Aadhaar is core and required by default. Other standard documents are validated if data is entered.
          const nameUpper = kyc.docName?.toUpperCase();
          const isCore = nameUpper === 'AADHAR CARD';
          const isRequired = isCore || kyc.docNo?.trim() || (kyc.files && kyc.files.length > 0);

          if (isRequired) {
            if (!hasValidTextContent(kyc.docNo, 2)) {
              newErrors[`kyc_${i}_docNo`] = `${kyc.docName} number must contain valid digits/characters`;
            } else {
              const cleanedDocNo = kyc.docNo.trim().toUpperCase();
              if (nameUpper === 'PAN CARD') {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(cleanedDocNo)) {
                  newErrors[`kyc_${i}_docNo`] = 'Invalid PAN card format (e.g. ABCDE1234F)';
                }
              } else if (nameUpper === 'AADHAR CARD') {
                const aadhaarRegex = /^\d{12}$/;
                const stripped = cleanedDocNo.replace(/\s/g, '');
                if (!aadhaarRegex.test(stripped)) {
                  newErrors[`kyc_${i}_docNo`] = 'Invalid Aadhaar number format (must be 12 digits)';
                }
              } else if (nameUpper === 'VOTER ID') {
                const voterRegex = /^[A-Z]{3}[0-9]{7}$/;
                if (!voterRegex.test(cleanedDocNo)) {
                  newErrors[`kyc_${i}_docNo`] = 'Invalid Voter ID format (e.g. ABC1234567)';
                }
              } else if (nameUpper === 'PASSPORT') {
                const passportRegex = /^[A-Z][0-9]{7}$/;
                if (!passportRegex.test(cleanedDocNo)) {
                  newErrors[`kyc_${i}_docNo`] = 'Invalid Passport number format (e.g. A1234567)';
                }
              }
            }
            if (!kyc.files || kyc.files.length === 0) {
              newErrors[`kyc_${i}_file`] = `${kyc.docName} file is required`;
            }
          }
        } else {
          // Custom additional documents: validate if they have any content
          const hasSomeData = kyc.docName?.trim() || kyc.docNo?.trim() || (kyc.files && kyc.files.length > 0);
          if (hasSomeData) {
            if (!hasValidTextContent(kyc.docName, 2)) newErrors[`kyc_${i}_docName`] = 'Document Name must contain valid text (at least 2 letters/digits)';
            if (!hasValidTextContent(kyc.docNo, 2)) newErrors[`kyc_${i}_docNo`] = 'Document Number must contain valid text/digits';
            if (!kyc.files || kyc.files.length === 0) newErrors[`kyc_${i}_file`] = 'Attachment is required';
          }
        }
      }

      // Also verify minimum completed count
      const completedKycCount = data.kycRows.filter(row => row.docName?.trim() && row.docNo?.trim() && row.files && row.files.length > 0).length;
      if (completedKycCount < 3 && Object.keys(newErrors).length === 0) {
        const warningMsg = `Minimum 3 KYC documents are mandatory. You have completed only ${completedKycCount} document(s). Please add and complete at least 3 documents.`;
        return warningMsg;
      }
    }

    if (tabIndex === 3) {
      // 4. Skills validation (document is optional, name must be filled if present)
      for (let i = 0; i < data.skillsRows.length; i++) {
        const skill = data.skillsRows[i];
        if (!skill.activityDetails?.trim()) {
          newErrors[`skills_${i}_activityDetails`] = 'Skill Name is required';
        }
      }
    }

    if (!customData) {
      setFieldErrors(newErrors);

      const errorKeys = Object.keys(newErrors);
      if (errorKeys.length > 0) {
        const firstErrorField = errorKeys[0];
        setTimeout(() => {
          let element = document.getElementById(firstErrorField);
          if (!element) {
            const lastUnderscore = firstErrorField.lastIndexOf('_');
            if (lastUnderscore !== -1) {
              const prefix = firstErrorField.substring(0, lastUnderscore);
              element = document.getElementById(prefix);
            }
          }
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = element.querySelector('input, select, textarea');
            if (input) {
              input.focus();
            }
          }
        }, 150);

        return 'Please fill in all the required field* indicators correctly.';
      }
    } else {
      if (Object.keys(newErrors).length > 0) {
        return 'Please fill in all the required field* indicators correctly.';
      }
    }

    return null;
  };

  const resolveResumeState = (applicant) => {
    if (!applicant) {
      return { shouldResume: false, onboardingStarted: false, activeTab: 0 };
    }

    const isStartedLocally = sessionStorage.getItem('candidate_onboarding_started') === 'true' ||
                             (stableToken && localStorage.getItem(`candidate_onboarding_started_${stableToken}`) === 'true');

    const shouldResume = !!applicant.onboardingStarted || isStartedLocally;

    if (!shouldResume) {
      return { shouldResume: false, onboardingStarted: false, activeTab: 0 };
    }

    // Normalize backend data structure for dry-run validation evaluation
    const parseFilePaths = (pathStr) => {
      if (!pathStr || !pathStr.trim()) return [];
      return pathStr.split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const fileName = p.replace(/\\/g, '/').split('/').pop();
          return {
            fileName: fileName || 'document',
            serverFileName: p,
            isServer: true
          };
        });
    };

    const normExperience = (applicant.experience || []).map((exp, idx) => ({
      id: exp.id,
      slNo: idx + 1,
      companyName: exp.companyName || '',
      location: exp.location || '',
      fromDate: exp.fromDate || '',
      toDate: exp.toDate || '',
      expYears: exp.expYears || '',
      files: parseFilePaths(exp.filePath)
    }));

    const normEducation = (applicant.education || []).map((edu, idx) => ({
      id: edu.id,
      slNo: idx + 1,
      education: edu.education || '',
      university: edu.university || '',
      institutionName: edu.institutionName || '',
      type: edu.type || '',
      yearOfPassing: edu.yearOfPassing || '',
      grade: edu.grade || '',
      stream: edu.stream || '',
      files: parseFilePaths(edu.filePath)
    }));

    let mappedKyc = (applicant.kyc || []).map((k, idx) => ({
      id: k.id,
      slNo: idx + 1,
      seqNo: k.seqNo,
      docName: k.docName,
      docNo: k.docNo || '',
      files: parseFilePaths(k.filePath),
      isCustom: !['AADHAR CARD', 'PAN CARD', 'VOTER ID', 'PASSPORT'].includes((k.docName || '').toUpperCase())
    }));

    const aadharRowIndex = mappedKyc.findIndex(k => k.docName?.toUpperCase() === 'AADHAR CARD');
    const defaultAadharNo = applicant.aadharNo || '';
    const defaultAadharPath = applicant.aadharPath || '';

    if (aadharRowIndex !== -1) {
      if (!mappedKyc[aadharRowIndex].docNo && defaultAadharNo) {
        mappedKyc[aadharRowIndex].docNo = defaultAadharNo;
      }
      if ((!mappedKyc[aadharRowIndex].files || mappedKyc[aadharRowIndex].files.length === 0) && defaultAadharPath) {
        mappedKyc[aadharRowIndex].files = parseFilePaths(defaultAadharPath);
      }
    } else {
      mappedKyc.unshift({
        id: null,
        slNo: 1,
        seqNo: 'KYC-01',
        docName: 'AADHAR CARD',
        docNo: defaultAadharNo,
        files: parseFilePaths(defaultAadharPath),
        isCustom: false
      });
    }

    const normKyc = mappedKyc.filter(k => {
      const nameUpper = (k.docName || '').toUpperCase();
      if (nameUpper === 'AADHAR CARD') return true;
      if (['PAN CARD', 'VOTER ID', 'PASSPORT'].includes(nameUpper)) {
        return !!k.docNo?.trim() || (k.files && k.files.length > 0);
      }
      return true;
    }).map((k, idx) => ({
      ...k,
      slNo: idx + 1,
      seqNo: `KYC-${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`
    }));

    const normSkills = (applicant.skills || []).map((s, idx) => ({
      id: s.id,
      slNo: idx + 1,
      activityDetails: s.activityDetails || '',
      files: parseFilePaths(s.filePath)
    }));

    const customValidationData = {
      candidate: applicant,
      repMgrName: applicant.q41_hr_mgr_name || applicant.q41_hrMgrName || '',
      repMgrEmail: applicant.q42_hr_mgr_email || applicant.q42_hrMgrEmail || '',
      repMgrPhone: applicant.q43_hr_mgr_phone || applicant.q43_hrMgrPhone || '',
      repMgrPhoneCode: applicant.q43_hr_mgr_phone_code || applicant.q43_hrMgrPhoneCode || '+91',
      vertHeadName: applicant.q44_vert_head_name || applicant.q44_vertHeadName || '',
      vertHeadEmail: applicant.q45_vert_head_email || applicant.q45_vertHeadEmail || '',
      vertHeadPhone: applicant.q46_vert_head_phone || applicant.q46_vertHeadPhone || '',
      vertHeadPhoneCode: applicant.q46_vert_head_phone_code || applicant.q46_vertHeadPhoneCode || '+91',
      experienceRows: normExperience,
      educationRows: normEducation,
      kycRows: normKyc,
      skillsRows: normSkills
    };

    let calculatedTab = 0;
    for (let tab = 0; tab <= 3; tab++) {
      const tabError = getTabValidationError(tab, customValidationData);
      if (tabError) {
        calculatedTab = tab;
        break;
      }
      if (tab === 3) {
        calculatedTab = 4;
      }
    }

    const activeTab = Math.max(0, Math.min(4, calculatedTab));

    return {
      shouldResume: true,
      onboardingStarted: true,
      activeTab
    };
  };

  const handleStartOnboarding = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/hra/applicants/portal/start-onboarding?token=${stableToken}`);
      setOnboardingStarted(true);
      sessionStorage.setItem('candidate_onboarding_started', 'true');
      localStorage.setItem(`candidate_onboarding_started_${stableToken}`, 'true');
    } catch (err) {
      console.error("Failed to start onboarding:", err);
      setError("Failed to initialize onboarding session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (targetTab, bypassValidation = false) => {
    setError('');
    if (!bypassValidation && targetTab > activeTab) {
      // Validate all tabs between activeTab and targetTab - 1
      for (let t = activeTab; t < targetTab; t++) {
        const validationError = getTabValidationError(t);
        if (validationError) {
          setError(validationError);
          playPortalSound('error');
          if (!validationError.includes('correctly')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }
      }
    }
    if (targetTab > activeTab) {
      playPortalSound('next');
    } else if (targetTab < activeTab) {
      playPortalSound('prev');
    }
    setActiveTab(targetTab);
    sessionStorage.setItem('candidate_onboarding_active_tab', targetTab);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!confirmSubmit) {
      setFieldErrors(prev => ({ ...prev, confirmSubmit: "Please confirm the declaration before submitting *" }));
      setError("Please confirm the declaration before submitting *");
      playPortalSound('error');
      jumpToField('confirmSubmit');
      return;
    }

    if (rejectedDocuments && rejectedDocuments.length > 0) {
      const unresolvedDocs = rejectedDocuments.filter(rd => !hasReplacementForDoc(rd.documentName));
      if (unresolvedDocs.length > 0) {
        setError("Please re-upload all rejected document(s) before submitting.");
        playPortalSound('error');

        const newErrors = {};
        unresolvedDocs.forEach(rd => {
          const targetId = resolveTargetIdForDocument(rd.documentName);
          if (targetId) {
            const field = resolveTargetFieldInfo(targetId);
            if (field) {
              newErrors[field.elementId] = true;
            }
          }
        });
        setFieldErrors(newErrors);

        const firstUnresolved = unresolvedDocs[0];
        const targetId = resolveTargetIdForDocument(firstUnresolved.documentName);
        if (targetId) {
          jumpToField(targetId);
        }
        return;
      }
    }

    // Validate all tabs before submitting
    for (let t = 0; t < 4; t++) {
      const validationError = getTabValidationError(t);
      if (validationError) {
        setError(validationError);
        if (!validationError.includes('correctly')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
    }

    setLoading(true);
    const token = sessionStorage.getItem('candidateSessionToken') ||
      localStorage.getItem('candidateSessionToken') ||
      searchParams.get('token');

    const payload = {
      token,
      q21_is_experienced: candidate?.q21_is_experienced,
      q41_hr_mgr_name: repMgrName || null,
      q42_hr_mgr_email: repMgrEmail || null,
      q43_hr_mgr_phone: repMgrPhone || null,
      q44_vert_head_name: vertHeadName || null,
      q45_vert_head_email: vertHeadEmail || null,
      q46_vert_head_phone: vertHeadPhone || null,
      experience: experienceRows.map((row, idx) => ({
        id: row.id || null,
        slNo: idx + 1,
        companyName: row.companyName,
        location: row.location,
        fromDate: row.fromDate || null,
        toDate: row.toDate || null,
        expYears: row.expYears,
        filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
      })),
      education: educationRows.map((row, idx) => ({
        id: row.id || null,
        slNo: idx + 1,
        education: row.education,
        institutionName: row.institutionName,
        type: row.type || null,
        yearOfPassing: row.yearOfPassing,
        grade: row.grade,
        stream: row.stream || null,
        filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null,
        university: row.university || null
      })),
      kyc: kycRows
        .filter(row => row.docName?.trim() || row.docNo?.trim() || (row.files && row.files.length > 0))
        .map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          seqNo: idx + 1,
          docName: row.docName,
          docNo: row.docNo,
          filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
        })),
      skills: skillsRows.map((row, idx) => ({
        id: row.id || null,
        slNo: idx + 1,
        activityDetails: row.activityDetails,
        filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName).join(',') : null
      }))
    };

    try {
      await axios.post('/api/hra/applicants/portal/submit-onboarding', payload);
      playPortalSound('submit');
      setSubmitted(true);
      sessionStorage.removeItem('candidateSessionToken');
      localStorage.removeItem('candidateSessionToken');
    } catch (err) {
      console.error(err);
      setError(err.response?.data || 'Failed to submit onboarding details. Please try again.');
      playPortalSound('error');
    } finally {
      setLoading(false);
    }
  };

  const textPrimaryColor = themeMode === 'light' ? '#0f172a' : '#f8fafc';
  const textSecondaryColor = themeMode === 'light' ? '#475569' : '#cbd5e1';
  const textMutedColor = themeMode === 'light' ? '#64748b' : '#94a3b8';
  const borderCol = themeMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';

  const pageBg = themeMode === 'light'
    ? '#f8fafc'
    : 'radial-gradient(circle, #0f172a 0%, #020617 100%)';

  const cardStyle = {
    background: themeMode === 'light' ? '#ffffff' : '#1e293b',
    border: `1.5px solid ${themeMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    boxShadow: themeMode === 'light'
      ? '0 20px 45px rgba(30, 40, 70, 0.04)'
      : '0 30px 65px rgba(0, 0, 0, 0.4)',
    p: { xs: 2, sm: 3, md: 4 },
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: themeMode === 'light' ? '#7c8cf8' : '#63d9c4',
      boxShadow: themeMode === 'light'
        ? '0 32px 50px rgba(124, 140, 248, 0.1), 0 0 0 1px rgba(124, 140, 248, 0.05)'
        : '0 32px 50px rgba(99, 217, 196, 0.1), 0 0 0 1.5px rgba(99, 217, 196, 0.2)'
    }
  };

  const innerCardStyle = {
    p: { xs: 2, sm: 2.75, md: 3.5 },
    borderRadius: '20px',
    border: `1px solid ${borderCol}`,
    borderLeft: `5px solid #7c8cf8`,
    bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b',
    boxShadow: themeMode === 'light' ? '0 10px 25px -5px rgba(124,140,248,0.02)' : '0 10px 25px -5px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      borderColor: themeMode === 'light' ? '#7c8cf8' : '#63d9c4',
      boxShadow: themeMode === 'light'
        ? '0 20px 40px rgba(124, 140, 248, 0.08)'
        : '0 20px 40px rgba(0, 0, 0, 0.3)'
    }
  };

  const renderAssessmentFileCards = (files) => {
    if (!files || files.length === 0) return null;
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, width: '100%', mt: 1.5 }}>
        {files.map((fileObj, fIdx) => {
          const rawName = fileObj.fileName || fileObj.name || fileObj.serverFileName || 'Document';
          const cleanName = getCleanFileName(rawName);
          const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawName);
          const fileUrl = fileObj.preview || getFileViewUrl(fileObj.serverFileName || fileObj.fileName || fileObj.path || rawName);

          const handleEyeClick = (e) => {
            e.stopPropagation();
            const allDocsList = getAllOnboardingDocsList();
            const targetServerFile = fileObj.serverFileName || fileObj.fileName || fileObj.path || rawName;
            let clickIdx = allDocsList.findIndex(d => d.serverFileName === targetServerFile || d.name === cleanName);
            
            if (allDocsList.length === 0) {
              const isolatedList = (files || []).map(f => {
                const rName = f.fileName || f.name || f.serverFileName || 'Document';
                const sName = f.serverFileName || f.fileName || f.filePath || f.path || rName;
                const cName = getCleanFileName(rName);
                return {
                  url: f.preview || getFileViewUrl(sName),
                  name: cName,
                  fileName: cName,
                  serverFileName: sName,
                  isServer: true,
                  label: cName
                };
              });
              clickIdx = isolatedList.findIndex(d => d.serverFileName === targetServerFile || d.name === cleanName);
              openDocPreview(isolatedList, clickIdx >= 0 ? clickIdx : 0);
            } else {
              openDocPreview(allDocsList, clickIdx >= 0 ? clickIdx : 0);
            }
          };

          return (
            <Box 
              key={fIdx} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: { xs: 0.75, sm: 1 },
                borderRadius: '10px',
                border: `1px solid ${themeMode === 'light' ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.3)'}`,
                backgroundColor: themeMode === 'light' ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.08)',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: themeMode === 'light' ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.15)',
                  border: `1px solid ${themeMode === 'light' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.25)'}`
                }}
              >
                {isImg ? (
                  <Box
                    component="img"
                    src={fileUrl}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                  />
                ) : null}
                <Box sx={{ display: isImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <IconFileText size={16} color="#22c55e" />
                </Box>
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                <Tooltip title={cleanName} arrow placement="top">
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
                      color: themeMode === 'light' ? '#15803d' : '#4ade80',
                      fontSize: '0.78rem'
                    }}
                  >
                    {cleanName}
                  </Typography>
                </Tooltip>
              </Box>

              <Tooltip title={`Preview ${cleanName}`} arrow>
                <IconButton
                  size="small"
                  onClick={handleEyeClick}
                  sx={{
                    flexShrink: 0,
                    bgcolor: themeMode === 'light' ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.15)',
                    color: '#22c55e',
                    '&:hover': { bgcolor: '#22c55e', color: 'white' }
                  }}
                >
                  <IconEye size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}
      </Box>
    );
  };

  const placeholderColor = themeMode === 'light' ? '#aab4be' : '#3d4a56';
  const textColor = themeMode === 'light' ? '#0f172a' : '#e2e8f0';
  const bgColor = themeMode === 'light' ? '#F8FAFC' : 'rgba(255,255,255,0.06)';

  const inputStyle = {
    '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
      borderRadius: '10px !important',
      backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
      '&.Mui-focused fieldset': {
        borderColor: '#0d9488 !important',
        borderWidth: '1px !important',
        boxShadow: '0 0 0 3px rgba(13,148,136,0.18) !important'
      },
      '&:hover fieldset': {
        borderColor: (themeMode === 'light' ? '#94a3b8' : 'rgba(13,148,136,0.55)') + ' !important'
      }
    },
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px !important',
      backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
      '&.Mui-focused fieldset': {
        borderColor: '#0d9488 !important',
        borderWidth: '1px !important'
      }
    },
    // Dim placeholder text so it's clearly lighter than typed input
    '& .MuiOutlinedInput-root input::placeholder': {
      color: (themeMode === 'light' ? '#aab4be' : '#4a5568') + ' !important',
      opacity: '1 !important'
    },
    '& .MuiOutlinedInput-root textarea::placeholder': {
      color: (themeMode === 'light' ? '#aab4be' : '#4a5568') + ' !important',
      opacity: '1 !important'
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#0d9488 !important'
    }
  };

  const formatDocName = (name) => {
    if (!name) return '';
    return name.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleAddKycRow = () => {
    setKycRows(prev => {
      const nextSlNo = prev.length + 1;
      return [
        ...prev,
        { slNo: nextSlNo, seqNo: nextSlNo, docName: '', docNo: '', files: [], isCustom: true }
      ];
    });
  };

  const getKycDisplaySeqNo = (seqNo, index) => {
    const num = parseInt(seqNo) || (index + 1);
    return `KYC-${num < 10 ? '0' + num : num}`;
  };

  const renderUploadCard = (files, onChange, label, hasError = false, multiple = false, _sideBySide = false, disabled = false, module = "HR_ATS") => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, width: '100%' }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: hasError ? '#d32f2f' : textSecondaryColor, display: 'inline-flex', alignItems: 'center' }}>
          {label}
          <TranslationTooltip label={label} themeMode={themeMode} />
        </Typography>
        <BOSFileUpload
          files={files}
          onChange={onChange}
          multiple={multiple}
          maxFiles={multiple ? 5 : 1}
          compact={true}
          label="Browse or Drag Files"
          helperText={multiple ? "PDF, PNG, JPG, DOCX • Max 5 files" : "PDF, PNG, JPG, DOCX • Single file"}
          module={module}
          error={hasError}
          candidatePortalLayout={true}
          disabled={disabled}
        />
      </Box>
    );
  };

  if (showSplash) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: themeMode === 'light' ? '#f8fafc' : '#0f172a' }}>
        <style>{staticBgStylesheet}</style>
        <AnimatePresence mode="wait">
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'all' }}
          >
            <OnboardingSplash
              logoUrl={companyBranding.logoUrl}
              companyName={companyBranding.companyName}
              candidateName={
                candidate ? `${candidate.firstName} ${candidate.lastName}` : ''
              }
              subtext={verifying ? "Verifying secure credentials..." : "Initialising candidate portal..."}
              themeMode={themeMode}
            />
          </motion.div>
        </AnimatePresence>
      </Box>
    );
  }

  if (verifying && !showSplash) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <OnboardingNetworkBackground themeMode={themeMode} />
        <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <SmoothLoadingSpinner size={54} color="#0d9488" label="Resuming onboarding session..." />
        </Box>
      </Box>
    );
  }

  if (error && !candidate) {
    return wrapTheme(
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: pageBg,
          p: 2
        }}
      >
        <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
          <Button
            onClick={toggleTheme}
            variant="outlined"
            sx={{
              minWidth: 'auto',
              p: 1,
              borderRadius: '50%',
              borderColor: borderCol,
              color: textPrimaryColor,
              backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
              '&:hover': {
                backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
              }
            }}
          >
            {themeMode === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
          </Button>
        </Box>
        <Container maxWidth="sm">
          <Card sx={cardStyle}>
            <CardContent sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h3" color="error" sx={{ fontWeight: 'bold', mb: 2 }}>
                Authentication Error
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Typography variant="body2" sx={{ color: textMutedColor }}>
                Please make sure you clicked the exact link provided in your email.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  if (alreadySubmitted) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <OnboardingNetworkBackground themeMode={themeMode} />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            p: { xs: 2.5, md: 4 },
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
            <Button
              onClick={toggleTheme}
              variant="outlined"
              sx={{
                minWidth: 'auto',
                p: 1,
                borderRadius: '50%',
                borderColor: borderCol,
                color: textPrimaryColor,
                backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
                '&:hover': {
                  backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
                }
              }}
            >
              {themeMode === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
            </Button>
          </Box>

          {/* Scan Rings rotating in background */}
          <div className="scan-ring"></div>
          <div className="scan-ring inner"></div>

          <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
            <MotionCard
              className="welcome-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              whileHover={{ y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(34,197,94,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(34,197,94,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
              sx={{
                ...cardStyle,
                p: { xs: 1.5, sm: 3, md: 5 },
                borderTop: '5px solid transparent',
                backgroundImage: cardStyle.background ? `${cardStyle.background}` : undefined,
                borderImageSlice: 1,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #22c55e 0%, #63d9c4 100%)',
                  borderRadius: '24px 24px 0 0'
                }
              }}
            >
              <CardContent sx={{ p: 0, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3.5 }}>
                  {companyBranding.logoUrl ? (
                    <Box sx={{
                      p: 0.5,
                      bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${borderCol}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      width: '38px'
                    }}>
                      <img
                        src={companyBranding.logoUrl}
                        alt={companyBranding.companyName}
                        style={{ maxHeight: '28px', maxWidth: '32px', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                  )}
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                      {companyBranding.companyName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 500, fontSize: '12px' }}>
                      Candidate Portal
                    </Typography>
                  </Box>
                </Box>

                {/* SVG Success Verification Illustration */}
                <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                  <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                    <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.06)'} stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(34, 197, 94, 0.35)'} strokeWidth="1.5" />
                    <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.45)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'} strokeWidth="3" strokeLinecap="round" />

                    <circle className="success-pulse s1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                    <path className="success-pulse s1" d="M94 22l4 4 8-8" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <circle className="success-pulse s2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                    <path className="success-pulse s2" d="M122 40l4 4 8-8" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <g className="lock-float">
                      <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                      <circle className="success-pulse s3" cx="45" cy="91" r="10.5" fill="#22c55e" />
                      <path className="success-pulse s3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                  </svg>
                </Box>

                <Typography variant="h2" sx={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: '28px',
                  mb: 2,
                  backgroundImage: 'linear-gradient(90deg, #22c55e, #63d9c4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Onboarding Completed
                </Typography>

                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: 4, lineHeight: 1.6 }}>
                  Dear <strong>{candidate?.firstName || candidate?.employeeName?.split(' ')[0] || 'Candidate'}</strong>, you have completed and submitted your documentation.
                </Typography>

                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', lineHeight: 1.5, px: 2 }}>
                  No further action is required. You may now safely close this browser window.
                </Typography>
              </CardContent>
            </MotionCard>
          </Container>
        </Box>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <OnboardingNetworkBackground themeMode={themeMode} />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            p: { xs: 2.5, md: 4 },
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
            <Button
              onClick={toggleTheme}
              variant="outlined"
              sx={{
                minWidth: 'auto',
                p: 1,
                borderRadius: '50%',
                borderColor: borderCol,
                color: textPrimaryColor,
                backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
                '&:hover': {
                  backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)'
                }
              }}
            >
              {themeMode === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
            </Button>
          </Box>

          {/* Scan Rings rotating in background */}
          <div className="scan-ring"></div>
          <div className="scan-ring inner"></div>

          <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
            <MotionCard
              className="welcome-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              whileHover={{ y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(34,197,94,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(34,197,94,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
              sx={{
                ...cardStyle,
                p: { xs: 2.5, sm: 5 },
                borderTop: '5px solid transparent',
                backgroundImage: cardStyle.background ? `${cardStyle.background}` : undefined,
                borderImageSlice: 1,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #22c55e 0%, #63d9c4 100%)',
                  borderRadius: '24px 24px 0 0'
                }
              }}
            >
              <CardContent sx={{ p: 0, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3.5 }}>
                  {companyBranding.logoUrl ? (
                    <Box sx={{
                      p: 0.5,
                      bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${borderCol}`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      width: '38px'
                    }}>
                      <img
                        src={companyBranding.logoUrl}
                        alt={companyBranding.companyName}
                        style={{ maxHeight: '28px', maxWidth: '32px', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                  )}
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                      {companyBranding.companyName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 500, fontSize: '12px' }}>
                      Candidate Portal
                    </Typography>
                  </Box>
                </Box>

                {/* SVG Success Verification Illustration */}
                <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                  <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                    <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.06)'} stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.35)' : 'rgba(34, 197, 94, 0.35)'} strokeWidth="1.5" />
                    <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.45)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'} strokeWidth="3" strokeLinecap="round" />

                    <circle className="success-pulse s1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                    <path className="success-pulse s1" d="M94 22l4 4 8-8" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <circle className="success-pulse s2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                    <path className="success-pulse s2" d="M122 40l4 4 8-8" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <g className="lock-float">
                      <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke="#22c55e" strokeWidth="1.5" />
                      <circle className="success-pulse s3" cx="45" cy="91" r="10.5" fill="#22c55e" />
                      <path className="success-pulse s3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                  </svg>
                </Box>

                <Typography variant="h2" sx={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: '28px',
                  mb: 2,
                  backgroundImage: 'linear-gradient(90deg, #22c55e, #63d9c4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Submission Successful!
                </Typography>

                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: 4, lineHeight: 1.6 }}>
                  Thank you, <strong>{candidate?.firstName || candidate?.employeeName?.split(' ')[0] || 'Candidate'}</strong>. Your details have been successfully uploaded. Our HR department has been notified.
                </Typography>

                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', lineHeight: 1.5, px: 2 }}>
                  You may now safely close this browser window.
                </Typography>
              </CardContent>
            </MotionCard>
          </Container>
        </Box>
      </Box>
    );
  }

  // Pre-load loading experience skeletons
  if (brandingLoading) {
    return (
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: pageBg,
          p: { xs: 2.5, md: 4 }
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'center',
              width: '100%'
            }}
          >
            {/* Left Column Skeleton */}
            <Box>
              <Skeleton width="180px" height={32} sx={{ mb: 3, borderRadius: '100px' }} />
              <Skeleton width="80%" height={60} sx={{ mb: 2 }} />
              <Skeleton width="60%" height={60} sx={{ mb: 3 }} />
              <Skeleton width="90%" height={24} sx={{ mb: 1.5 }} />
              <Skeleton width="85%" height={24} sx={{ mb: 1.5 }} />
              <Skeleton width="70%" height={24} sx={{ mb: 4 }} />
              <Stack direction="row" spacing={3}>
                <Skeleton width="120px" height={24} />
                <Skeleton width="120px" height={24} />
                <Skeleton width="120px" height={24} />
              </Stack>
            </Box>

            {/* Right Column Skeleton */}
            <Card sx={{ ...cardStyle, p: { xs: 2.5, sm: 5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4.5 }}>
                <Skeleton variant="circular" width={60} height={60} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton width="60%" height={24} />
                  <Skeleton width="40%" height={16} />
                </Box>
              </Box>
              <Skeleton width="70%" height={32} sx={{ mb: 2 }} />
              <Skeleton width="90%" height={20} sx={{ mb: 1 }} />
              <Skeleton width="80%" height={20} sx={{ mb: 4.5 }} />
              <Skeleton variant="rectangular" height={52} sx={{ borderRadius: '14px', mb: 3 }} />
              <Skeleton width="80%" height={16} sx={{ mx: 'auto' }} />
            </Card>
          </Box>
        </Container>
      </Box>
    );
  }

  const renderEducationCard = (row, idx) => {
    registerField("edu_" + idx, 1, `education_${idx}_file`, row.education || row.university || "Education Details");
    let cardTitle = "Education Details";
    if (row.isDefault10th) {
      cardTitle = "10th / Secondary Qualification";
    } else if (row.isDefault12th) {
      cardTitle = "12th / Higher Secondary Qualification";
    } else if (row.university === 'Diploma') {
      cardTitle = "Diploma Details";
    } else if (row.university === 'UG') {
      cardTitle = "UG Details";
    } else if (row.university === 'PG') {
      cardTitle = "PG Details";
    } else if (row.education) {
      cardTitle = row.education.toLowerCase().includes('details') || row.education.toLowerCase().includes('qualification') ? row.education : `${row.education} Qualification Details`;
    } else if (isSchoolEdu(row)) {
      cardTitle = "School Education Details";
    }

    const isEduCardError = Object.keys(fieldErrors).some(key => key.startsWith(`education_${idx}_`));

    return (
      <Stack key={idx} direction="column" spacing={2} sx={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
        <Card
          sx={{
            ...cardStyle,
            p: { xs: 1.5, sm: 2.5, md: 4 },
            width: '100%',
            boxSizing: 'border-box',
            border: isEduCardError ? '1.5px solid #ef4444' : `1.5px solid ${borderCol}`,
            borderLeft: isEduCardError ? '5px solid #ef4444' : '5px solid #0d9488',
            borderRadius: '20px',
            boxShadow: isEduCardError
              ? '0 0 0 1px rgba(239, 68, 68, 0.15)'
              : (themeMode === 'light' ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)'),
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: isEduCardError ? '#ef4444' : (themeMode === 'light' ? '#0d9488' : '#63d9c4'),
              boxShadow: themeMode === 'light'
                ? '0 20px 40px rgba(13, 148, 136, 0.08)'
                : '0 20px 40px rgba(99, 217, 196, 0.15)'
            },
            ...(isEduCardError ? {
              animation: 'shakeError 0.4s ease-in-out',
              '@keyframes shakeError': {
                '0%, 100%': { transform: 'translateX(0)' },
                '20%, 60%': { transform: 'translateX(-4px)' },
                '40%, 80%': { transform: 'translateX(4px)' }
              }
            } : {})
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <IconSchool size={22} color="#0d9488" />
                <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '16.5px', fontFamily: "'Manrope', sans-serif" }}>
                  {cardTitle}
                </Typography>
              </Stack>
              <IconButton
                color="error"
                size="small"
                onClick={() => {
                  const rowToDelete = educationRows[idx];
                  let matchKey = null;
                  if (rowToDelete.education?.toLowerCase()?.includes('10th')) {
                    matchKey = '10th';
                  } else if (rowToDelete.education?.toLowerCase()?.includes('12th')) {
                    matchKey = '12th';
                  } else if (rowToDelete.university?.toLowerCase()?.includes('diploma')) {
                    matchKey = 'diploma';
                  } else if (rowToDelete.university?.toLowerCase()?.includes('ug')) {
                    matchKey = 'ug';
                  } else if (rowToDelete.university?.toLowerCase()?.includes('pg')) {
                    matchKey = 'pg';
                  }

                  if (matchKey && candidate?.id) {
                    const deletedKeysStr = localStorage.getItem(`onboarding_deleted_education_${candidate.id}`);
                    const deletedKeys = deletedKeysStr ? JSON.parse(deletedKeysStr) : [];
                    if (!deletedKeys.includes(matchKey)) {
                      deletedKeys.push(matchKey);
                      localStorage.setItem(`onboarding_deleted_education_${candidate.id}`, JSON.stringify(deletedKeys));
                    }
                  }

                  setEducationRows(prev => prev.filter((_, rIdx) => rIdx !== idx).map((r, i) => ({ ...r, slNo: i + 1 })));
                }}
                sx={{
                  border: `1px solid ${borderCol}`,
                  borderRadius: '10px',
                  p: 0.8,
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)'
                  }
                }}
              >
                <IconTrash size={18} />
              </IconButton>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 1.5, sm: 2.5 } }}>
              <Box id={`education_${idx}_university`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  {isSchoolEdu(row) ? 'Board Name' : 'Qualification Type'}
                  <TranslationTooltip label={isSchoolEdu(row) ? 'Board Name' : 'Qualification Type'} themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  value={row.university || ''}
                  onChange={(e) => {
                    handleEducationRowChange(idx, 'university', e.target.value);
                    setFieldErrors(prev => {
                      const next = { ...prev };
                      delete next[`education_${idx}_university`];
                      return next;
                    });
                  }}
                  placeholder={isSchoolEdu(row) ? 'e.g. CBSE / State Board' : 'Diploma or UG or PG...'}
                  size="small"
                  fullWidth
                  sx={inputStyle}
                  error={!!fieldErrors[`education_${idx}_university`]}
                  helperText={fieldErrors[`education_${idx}_university`]}
                />
              </Box>

              <Box id={`education_${idx}_education`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  {isSchoolEdu(row) ? 'Education / Standard' : 'Education / Degree'}
                  <TranslationTooltip label={isSchoolEdu(row) ? 'Education / Standard' : 'Education / Degree'} themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  value={row.education}
                  onChange={(e) => handleEducationRowChange(idx, 'education', e.target.value)}
                  placeholder={
                    isSchoolEdu(row)
                      ? '12TH/11TH/10TH/9TH/8TH/....'
                      : row.university?.toUpperCase() === 'PG'
                        ? 'e.g. M.Tech Computer Science'
                        : (row.university?.toUpperCase() === 'DIPLOMA' || row.university?.toUpperCase() === 'DIPLOMO')
                          ? 'e.g. Diploma in Mechanical Engineering'
                          : 'e.g. B.Tech Computer Science'
                  }
                  disabled={false}
                  size="small"
                  fullWidth
                  sx={inputStyle}
                  error={!!fieldErrors[`education_${idx}_education`]}
                  helperText={fieldErrors[`education_${idx}_education`]}
                />
              </Box>

              <Box id={`education_${idx}_institutionName`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  Institution Name
                  <TranslationTooltip label="Institution Name" themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  value={row.institutionName}
                  onChange={(e) => handleEducationRowChange(idx, 'institutionName', e.target.value)}
                  placeholder={isSchoolEdu(row) ? 'Enter Your School Name' : 'e.g. Anna University'}
                  size="small"
                  fullWidth
                  sx={inputStyle}
                  error={!!fieldErrors[`education_${idx}_institutionName`]}
                  helperText={fieldErrors[`education_${idx}_institutionName`]}
                />
              </Box>

              {isSchoolEdu(row) && (
                <Box id={`education_${idx}_stream`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: fieldErrors[`education_${idx}_stream`] ? '#d32f2f' : textSecondaryColor }}>
                    Stream / Group
                    <TranslationTooltip label="Stream / Group" themeMode={themeMode} />
                  </Typography>
                  <BOSTextField
                    value={is11thOr12th(row.education) ? (row.stream || '') : 'N/A'}
                    onChange={(e) => {
                      if (is11thOr12th(row.education)) {
                        handleEducationRowChange(idx, 'stream', e.target.value);
                      }
                    }}
                    placeholder={is11thOr12th(row.education) ? 'e.g. Physics, Chemistry, Biology (PCB)' : 'N/A'}
                    disabled={!is11thOr12th(row.education)}
                    size="small"
                    fullWidth
                    sx={inputStyle}
                    error={!!fieldErrors[`education_${idx}_stream`]}
                    helperText={fieldErrors[`education_${idx}_stream`]}
                  />
                </Box>
              )}

              <Box id={`education_${idx}_type`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  Education Type
                  <TranslationTooltip label="Education Type" themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  select
                  value={
                    isSchoolEdu(row)
                      ? (row.type || 'FULL TIME')
                      : (row.type || '')
                  }
                  onChange={(e) => {
                    handleEducationRowChange(idx, 'type', e.target.value);
                    setOpenEduTypeIndex(null);
                  }}
                  size="small"
                  fullWidth
                  sx={inputStyle}
                  error={!!fieldErrors[`education_${idx}_type`]}
                  helperText={fieldErrors[`education_${idx}_type`]}
                  SelectProps={{
                    open: openEduTypeIndex === idx,
                    onOpen: () => setOpenEduTypeIndex(idx),
                    onClose: () => setOpenEduTypeIndex(null),
                    MenuProps: {
                      disableScrollLock: true,
                      transitionDuration: 0,
                      PaperProps: {
                        sx: {
                          transition: 'none !important',
                          animation: 'none !important'
                        }
                      }
                    }
                  }}

                  InputProps={{
                    endAdornment: (!isSchoolEdu(row) && row.type) ? (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEducationRowChange(idx, 'type', '');
                          }}
                          sx={{ color: 'text.secondary', p: 0.25 }}
                        >
                          <IconX size={16} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                >
                  <MenuItem value="FULL TIME">FULL TIME</MenuItem>
                  <MenuItem value="PART TIME">PART TIME</MenuItem>
                  <MenuItem value="CORRESPONDENCE">CORRESPONDENCE</MenuItem>
                </BOSTextField>
              </Box>

              <Box id={`education_${idx}_yearOfPassing`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  Year of Passing
                  <TranslationTooltip label="Year of Passing" themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  type="text"
                  value={row.yearOfPassing}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 4) {
                      handleEducationRowChange(idx, 'yearOfPassing', val);
                    }
                  }}
                  placeholder="2024"
                  size="small"
                  sx={inputStyle}
                  fullWidth
                  error={!!fieldErrors[`education_${idx}_yearOfPassing`]}
                  helperText={fieldErrors[`education_${idx}_yearOfPassing`]}
                  inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Box>

              <Box id={`education_${idx}_grade`} sx={{ gridColumn: { xs: 'span 1', sm: 'span 1' }, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                  % / Grade
                  <TranslationTooltip label="% / Grade" themeMode={themeMode} />
                </Typography>
                <BOSTextField
                  value={row.grade}
                  onChange={(e) => handleEducationRowChange(idx, 'grade', e.target.value)}
                  placeholder="8.5 CGPA"
                  size="small"
                  sx={inputStyle}
                  fullWidth
                  error={!!fieldErrors[`education_${idx}_grade`]}
                  helperText={fieldErrors[`education_${idx}_grade`]}
                />
              </Box>

              <Box id={`education_${idx}_file`} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                {renderRejectionAlert(row.education || row.university)}
                {renderUploadCard(
                  row.files || [],
                  (files) => handleEducationRowChange(idx, 'files', files),
                  "Upload Certificate / Documents",
                  !!fieldErrors[`education_${idx}_file`],
                  true,
                  true,
                  !isDocRejected(row.education || row.university),
                  'HRA_EDUCATION'
                )}
                {fieldErrors[`education_${idx}_file`] && (
                  <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', ml: 1 }}>
                    {fieldErrors[`education_${idx}_file`]}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  const renderSchoolPlaceholderCard = (schoolType) => {
    const is10th = schoolType === '10th';
    const title = is10th ? '10th / Secondary Qualification' : '12th / Higher Secondary Qualification';

    const handleRestore = () => {
      if (candidate?.id) {
        const deletedKeysStr = localStorage.getItem(`onboarding_deleted_education_${candidate.id}`);
        if (deletedKeysStr) {
          const deletedKeys = JSON.parse(deletedKeysStr);
          const updated = deletedKeys.filter(k => k !== schoolType);
          localStorage.setItem(`onboarding_deleted_education_${candidate.id}`, JSON.stringify(updated));
        }
      }
      setEducationRows(prev => {
        const newRow = {
          id: null,
          slNo: is10th ? 1 : 2,
          education: is10th ? '10TH' : '12TH',
          university: '',
          institutionName: '',
          type: 'FULL TIME',
          yearOfPassing: '',
          grade: '',
          stream: '',
          isDefault10th: is10th,
          isDefault12th: !is10th,
          files: []
        };

        let copy = [...prev];
        if (is10th) {
          return [newRow, ...prev].map((r, idx) => ({ ...r, slNo: idx + 1 }));
        } else {
          const idx10 = prev.findIndex(r => r.isDefault10th);
          if (idx10 !== -1) {
            copy.splice(idx10 + 1, 0, newRow);
          } else {
            copy.unshift(newRow);
          }
          return copy.map((r, idx) => ({ ...r, slNo: idx + 1 }));
        }
      });
    };

    return (
      <Card
        onClick={handleRestore}
        sx={{
          border: `2px dashed ${borderCol}`,
          borderRadius: '20px',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '260px',
          cursor: 'pointer',
          boxSizing: 'border-box',
          backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#0d9488',
            backgroundColor: themeMode === 'light' ? 'rgba(13,148,136,0.02)' : 'rgba(13,148,136,0.05)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <IconPlus size={32} color="#0d9488" style={{ marginBottom: '12px' }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
          Add {is10th ? '10th Card' : '12th Card'}
        </Typography>
        <Typography variant="body2" sx={{ color: textMutedColor, maxWidth: '280px' }}>
          Click here to add your {is10th ? '10th / Secondary' : '12th / Higher Secondary'} qualification details.
        </Typography>
      </Card>
    );
  };

  const progressPercent = calculateOnboardingProgress();

  return (
    <ThemeProvider theme={localTheme}>
      <>
        <style>{staticBgStylesheet}</style>
        <AnimatePresence mode="wait">
          {showSplash && (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'all' }}
            >
              <OnboardingSplash
                logoUrl={companyBranding.logoUrl}
                companyName={companyBranding.companyName}
                greetingName={candidate ? `Welcome, ${(candidate.firstName || candidate.employeeName || '').split(' ')[0]}` : 'Welcome'}
                subtext="Initialising candidate onboarding..."
                themeMode={themeMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {splashDone && (
          <>
            <OnboardingNetworkBackground themeMode={themeMode} />
            <Box
              sx={{
                minHeight: '100vh',
                height: { xs: 'auto', md: !onboardingStarted ? '100vh' : 'auto' },
                overflow: { xs: 'visible', md: !onboardingStarted ? 'hidden' : 'visible' },
                background: 'transparent',
                position: 'relative',
                transition: 'background 0.3s ease, color 0.3s ease',
                color: textPrimaryColor,
                display: 'flex',
                flexDirection: 'column',
                pb: { xs: 8, md: !onboardingStarted ? 0 : 12 },
                zIndex: 1,
                overflowX: 'hidden'
              }}
            >
              {/* Standard Reusable Candidate Portal Header */}
              <CandidatePortalHeader
                logoUrl={companyBranding.logoUrl}
                companyName={companyBranding.companyName}
                portalTitle="Candidate Portal"
                candidateName={candidate?.firstName || candidate?.employeeName || candidate?.q1_full_name || ''}
                candidateId={candidate?.enRolledNo || candidate?.enrolledNo || candidate?.enRollNo || candidate?.applicantCode || candidate?.candidateCode || candidate?.empCode || candidate?.candidateNo || candidate?.appNo || ''}
                saveStatus={saveStatus}
                themeMode={themeMode}
                toggleTheme={toggleTheme}
                progressPercent={progressPercent}
                borderCol={borderCol}
                textPrimaryColor={textPrimaryColor}
                textMutedColor={textMutedColor}
                onboardingStarted={onboardingStarted}
                activeTab={activeTab}
                totalSteps={5}
                onNextStep={activeTab < 4 ? () => handleTabChange(activeTab + 1) : undefined}
                onPrevStep={activeTab > 0 ? () => handleTabChange(activeTab - 1) : undefined}
                canGoNext={activeTab < 4}
                canGoPrev={activeTab > 0}
              />

              <AnimatePresence mode="wait">
                {!splashDone ? null : !onboardingStarted ? (
                  <motion.div
                    key="welcome-portal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
                  >
                    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 6 }, mb: 4, flexGrow: 1, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                      {/* Scan Rings rotating in background */}
                      <div className="scan-ring"></div>
                      <div className="scan-ring inner"></div>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                          gap: { xs: 4, md: 8 },
                          alignItems: 'center',
                          width: '100%',
                          mt: { xs: 2, md: 0 },
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {/* Left Column: Welcoming Section */}
                        <Box sx={{ textAlign: 'left' }}>
                          <Box
                            className="welcome-badge"
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.8,
                              borderRadius: '999px',
                              background: themeMode === 'light'
                                ? 'linear-gradient(90deg, rgba(124,140,248,0.18), rgba(99,217,196,0.22))'
                                : 'linear-gradient(90deg, rgba(124,140,248,0.12), rgba(99,217,196,0.15))',
                              border: themeMode === 'light' ? '1px solid rgba(124,140,248,0.25)' : '1px solid rgba(124,140,248,0.15)',
                              fontSize: '12px',
                              fontWeight: 700,
                              letterSpacing: '0.6px',
                              color: '#7c8cf8',
                              mb: 3
                            }}
                          >
                            SECURE DOCUMENT VERIFICATION
                          </Box>

                          <Typography variant="h1" sx={{
                            fontFamily: "'Manrope', sans-serif",
                            fontWeight: 800,
                            color: textPrimaryColor,
                            fontSize: { xs: '32px', sm: '48px', md: '56px' },
                            lineHeight: 1.05,
                            mb: 2.5,
                            letterSpacing: '-1px'
                          }}>
                            <span className="welcome-word-1" style={{ marginRight: '12px' }}>Welcome,</span>
                            <span className="welcome-word-2" style={{
                              backgroundImage: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {candidate?.employeeName?.split(' ')[0] || 'Candidate'}
                            </span>
                          </Typography>

                          <Typography className="welcome-sub" variant="h2" sx={{
                            fontFamily: "'Manrope', sans-serif",
                            fontWeight: 700,
                            fontSize: { xs: '18px', sm: '22px', md: '24px' },
                            lineHeight: 1.2,
                            mb: 2,
                            color: textPrimaryColor
                          }}>
                            We're excited to have you on board.
                          </Typography>

                          <Typography className="welcome-desc" variant="body1" sx={{
                            fontWeight: 400,
                            color: textMutedColor,
                            mb: 3.5,
                            fontSize: '15px',
                            lineHeight: 1.6,
                            maxWidth: '440px'
                          }}>
                            Please upload your documents and complete identity verification — it only takes a few minutes.
                          </Typography>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
                          >
                            <Stack direction="row" spacing={3} sx={{ pt: 1, flexWrap: 'wrap', gap: '12px 20px' }}>
                              {[
                                { label: '256-bit encrypted', icon: <IconLock size={18} stroke={3} color="#fff" /> },
                                { label: 'GDPR & DPDP compliant', icon: <IconShieldCheck size={18} stroke={3} color="#fff" /> },
                                { label: 'Progress auto-saved', icon: <IconDeviceFloppy size={18} stroke={3} color="#fff" /> }
                              ].map(({ label, icon }, i) => (
                                <motion.div
                                  key={label}
                                  initial={{ opacity: 0, x: -12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
                                >
                                  <Tooltip title={label} arrow placement="bottom">
                                    <Box sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 36,
                                      height: 36,
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #7c8cf8, #63d9c4)',
                                      flexShrink: 0,
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                      '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 10px rgba(124,140,248,0.3)'
                                      }
                                    }}>
                                      {icon}
                                    </Box>
                                  </Tooltip>
                                </motion.div>
                              ))}
                            </Stack>
                          </motion.div>
                        </Box>



                        {/* Right Column: Start Onboarding Card */}
                        <MotionCard
                          className="welcome-card"
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                          whileHover={isMobile ? {} : { y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
                          sx={{
                            ...cardStyle,
                            p: { xs: 1.5, sm: 3, md: 5 },
                            borderTop: '5px solid transparent',
                            backgroundImage: cardStyle.background
                              ? `${cardStyle.background}`
                              : undefined,
                            borderImageSlice: 1,
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '24px',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '5px',
                              background: 'linear-gradient(90deg, #7c8cf8 0%, #63d9c4 100%)',
                              borderRadius: '24px 24px 0 0'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 0, textAlign: 'left' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                              {companyBranding.logoUrl ? (
                                <Box sx={{
                                  p: 0.5,
                                  bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                                  border: `1px solid ${borderCol}`,
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '38px',
                                  width: '38px'
                                }}>
                                  <img
                                    src={companyBranding.logoUrl}
                                    alt={companyBranding.companyName}
                                    style={{ maxHeight: '28px', maxWidth: '32px', objectFit: 'contain' }}
                                  />
                                </Box>
                              ) : (
                                <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </Box>
                              )}
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                                  {companyBranding.companyName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 500, fontSize: '12px' }}>
                                  Candidate Portal
                                </Typography>
                              </Box>
                            </Box>


                            {/* SVG Document & Identity Verification Illustration */}
                            <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                              <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                                <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(124,140,248,0.12)' : 'rgba(124,140,248,0.06)'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.35)' : 'rgba(140,155,255,0.35)'} strokeWidth="1.5" />
                                <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.45)' : 'rgba(140,155,255,0.45)'} strokeWidth="3" strokeLinecap="round" />
                                <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />
                                <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />

                                <circle className="check-pulse c1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                <path className="check-pulse c1" d="M94 22l4 4 8-8" stroke="#7c8cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                                <circle className="check-pulse c2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                <path className="check-pulse c2" d="M122 40l4 4 8-8" stroke="#63d9c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                                <g className="lock-float">
                                  <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                  <path d="M31 72v-9a14 14 0 0128 0v9" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.5)' : 'rgba(140,155,255,0.5)'} strokeWidth="3" fill="none" strokeLinecap="round" />
                                  <circle className="check-pulse c3" cx="45" cy="91" r="10.5" fill="#63d9c4" />
                                  <path className="check-pulse c3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </g>
                              </svg>
                            </Box>

                            <MotionButton
                              component={motion.button}
                              whileHover={{ scale: 1.03, translateY: -2 }}
                              whileTap={{ scale: 0.98 }}
                              variant="contained"
                              onClick={handleStartOnboarding}
                              endIcon={<IconArrowRight size={18} />}
                              fullWidth
                              className="cta-sweep-btn"
                              sx={{
                                background: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                                py: 2,
                                borderRadius: '14px',
                                fontSize: '15.5px',
                                fontWeight: 700,
                                boxShadow: '0 14px 30px -12px rgba(124,140,248,0.55)',
                                textTransform: 'none',
                                mb: 3,
                                color: '#fff'
                              }}
                            >
                              Start Onboarding
                            </MotionButton>

                            <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', textAlign: 'center', lineHeight: 1.5, px: 2 }}>
                              You've received a secure invitation link from {companyBranding.companyName}. Please do not share it.
                            </Typography>
                          </CardContent>
                        </MotionCard>
                      </Box>
                    </Container>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form-portal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}
                  >

                    {/* Form Content */}
                    <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3 } }}>

                      {rejectedDocuments && rejectedDocuments.length > 0 && (
                        <Card
                          sx={{
                            mb: 4,
                            p: 3,
                            borderRadius: '20px',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            background: themeMode === 'light'
                              ? 'linear-gradient(135deg, #fff5f5, #fff0f0)'
                              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03))',
                            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.05)'
                          }}
                        >
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                            <Box>
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <IconAlertCircle size={22} color="#dc2626" />
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626', fontFamily: "'Manrope', sans-serif" }}>
                                  Action Required: Rejected Documents
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ color: textSecondaryColor, maxWidth: '750px' }}>
                                Please review and re-upload the documents listed below. Clicking a document will automatically take you to the correct section and focus the upload field.
                              </Typography>
                            </Box>
                          </Stack>
                          <Divider sx={{ my: 2, borderColor: 'rgba(239, 68, 68, 0.15)' }} />
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {rejectedDocuments.map((rd, i) => {
                              const targetId = resolveTargetIdForDocument(rd.documentName);
                              return (
                                <Tooltip key={i} title={rd.rejectReason ? `Reason: ${rd.rejectReason}` : 'Click to fix document'} arrow>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                      if (targetId) {
                                        jumpToField(targetId);
                                      } else {
                                        const fallbackId = resolveTargetIdForDocument(rd.documentName);
                                        if (fallbackId) {
                                          jumpToField(fallbackId);
                                        } else {
                                          setError(`Could not locate field for "${rd.documentName}"`);
                                        }
                                      }
                                    }}
                                    startIcon={<IconAlertCircle size={15} />}
                                    sx={{
                                      borderRadius: '30px',
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      fontSize: '12.5px',
                                      px: 2.5,
                                      py: 0.8,
                                      borderColor: 'rgba(239, 68, 68, 0.3)',
                                      bgcolor: 'rgba(239, 68, 68, 0.02)',
                                      '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                                        borderColor: '#dc2626'
                                      }
                                    }}
                                  >
                                    {rd.documentName}
                                  </Button>
                                </Tooltip>
                              );
                            })}
                          </Box>
                        </Card>
                      )}
                      {/* Top Form Navigation Arrows (Visible on mobile & desktop at form top) */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          mb: { xs: 2, sm: 3 },
                          px: { xs: 1.5, sm: 2 },
                          py: 1.25,
                          borderRadius: '16px',
                          backgroundColor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                          border: `1.5px solid ${borderCol}`,
                          boxShadow: themeMode === 'light' ? '0 4px 14px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)'
                        }}
                      >
                        <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                          {activeTab > 0 ? (
                            <UniquePrevSymbolButton
                              onClick={() => handleTabChange(activeTab - 1)}
                              tooltip="Previous Step"
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40 }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', px: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '0.875rem' }}>
                            Step {activeTab + 1} of 5
                          </Typography>
                        </Box>
                        <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                          {activeTab < 4 ? (
                            <UniqueNextSymbolButton
                              onClick={() => handleTabChange(activeTab + 1)}
                              tooltip="Next Step"
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40 }} />
                          )}
                        </Box>
                      </Box>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                        >
                          {/* 1. EXPERIENCE SECTION */}
                          {/* 1. EXPERIENCE SECTION */}
                          {activeTab === 0 && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1, ml: { xs: 0, sm: 6.5 } }}>
                                Professional Background
                              </Typography>
                              <Typography variant="body2" sx={{ color: textMutedColor, mb: 3, ml: { xs: 0, sm: 6.5 } }}>
                                Share your work history and details from your previous employer.
                              </Typography>

                              <TabNotesBanner
                                title="EXPERIENCE NOTES"
                                titleTamil="அனுபவம் பற்றிய குறிப்புகள்"
                                themeMode={themeMode}
                                notes={[
                                  {
                                    en: "If you have prior employment experience, enter details of your previous employers and upload experience certificates or payslips.",
                                    ta: "உங்களுக்கு முந்தைய பணி அனுபவம் இருந்தால், வேலை செய்த நிறுவனங்கள், பதவி விவரங்களை உள்ளிட்டு அனுபவச் சான்றிதழ்கள் / சம்பளச் சீட்டுகளை பதிவேற்றவும்."
                                  },
                                  {
                                    en: "Freshers with no prior work experience can skip adding records and click 'Continue' to proceed directly to Education.",
                                    ta: "முன் அனுபவம் இல்லாதவர்கள் இந்த பிரிவைத் தவிர்த்து 'Continue' கிளிக் செய்து நேரடியாக கல்வி தகுதி பிரிவுக்குச் செல்லலாம்."
                                  }
                                ]}
                              />

                              {candidate?.q21_is_experienced?.toUpperCase() !== 'YES' ? (
                                <Box sx={{ py: 6, px: 2, textAlign: 'center', bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)', border: `1px dashed ${borderCol}`, borderRadius: '20px', ml: { xs: 0, sm: 6.5 } }}>
                                  <Typography variant="body1" sx={{ color: textSecondaryColor, fontStyle: 'italic' }}>
                                    You do not have prior work experience. Click "Continue" to proceed.
                                  </Typography>
                                </Box>
                              ) : (
                                experienceRows.length === 0 ? (
                                  <Stack spacing={3} alignItems="center" sx={{ py: 6, textAlign: 'center', border: `1px dashed ${borderCol}`, borderRadius: '20px', bgcolor: themeMode === 'light' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.01)', ml: { xs: 0, sm: 6.5 } }}>
                                    <Typography variant="body1" sx={{ color: textSecondaryColor, fontStyle: 'italic' }}>
                                      No experience records added.
                                    </Typography>
                                    <Button
                                      variant="outlined"
                                      startIcon={<IconPlus size={16} />}
                                      onClick={handleAddExperienceRow}
                                      sx={{
                                        borderColor: '#0d9488',
                                        color: '#0d9488',
                                        borderWidth: '1.5px',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        height: '46px',
                                        px: 4,
                                        fontWeight: 600,
                                        '&:hover': {
                                          borderColor: '#0f766e',
                                          backgroundColor: themeMode === 'light' ? 'rgba(13,148,136,0.04)' : 'rgba(13,148,136,0.1)'
                                        }
                                      }}
                                    >
                                      Add experience
                                    </Button>
                                  </Stack>
                                ) : (
                                  <Stack spacing={4}>
                                    {experienceRows.map((row, idx) => {
                                      registerField("exp_" + idx, 0, `experience_${idx}_file`, row.companyName ? `Experience - ${row.companyName}` : `Experience ${idx + 1}`);
                                      const isExpCardError = Object.keys(fieldErrors).some(key => key.startsWith(`experience_${idx}_`));
                                      return (
                                        <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start" sx={{ position: 'relative', width: '100%' }}>
                                          {/* Number Badge */}
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: 32,
                                              height: 32,
                                              borderRadius: '50%',
                                              backgroundColor: isExpCardError ? '#ef4444' : '#0d9488',
                                              color: '#ffffff',
                                              fontWeight: 700,
                                              fontSize: '14px',
                                              flexShrink: 0,
                                              mt: { xs: 0, sm: 1.5 },
                                              boxShadow: isExpCardError ? '0 4px 10px rgba(239,68,68,0.2)' : '0 4px 10px rgba(13,148,136,0.2)'
                                            }}
                                          >
                                            {idx + 1}
                                          </Box>

                                          {/* Card Container */}
                                          <Card
                                            sx={{
                                              ...cardStyle,
                                              flexGrow: 1,
                                              p: { xs: 1.5, sm: 2.5, md: 4 },
                                              width: '100%',
                                              border: isExpCardError ? '1.5px solid #ef4444' : `1.5px solid ${borderCol}`,
                                              borderLeft: isExpCardError ? '5px solid #ef4444' : '5px solid #0d9488',
                                              borderRadius: '20px',
                                              boxShadow: isExpCardError
                                                ? '0 0 0 1px rgba(239, 68, 68, 0.15)'
                                                : (themeMode === 'light' ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)'),
                                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                              '&:hover': {
                                                borderColor: isExpCardError ? '#ef4444' : (themeMode === 'light' ? '#0d9488' : '#63d9c4'),
                                                boxShadow: themeMode === 'light'
                                                  ? '0 20px 40px rgba(13, 148, 136, 0.08)'
                                                  : '0 20px 40px rgba(99, 217, 196, 0.15)'
                                              },
                                              ...(isExpCardError ? {
                                                animation: 'shakeError 0.4s ease-in-out',
                                                '@keyframes shakeError': {
                                                  '0%, 100%': { transform: 'translateX(0)' },
                                                  '20%, 60%': { transform: 'translateX(-4px)' },
                                                  '40%, 80%': { transform: 'translateX(4px)' }
                                                }
                                              } : {})
                                            }}
                                          >
                                            <CardContent sx={{ p: 0 }}>
                                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: idx === 0 ? 2 : 3.5 }}>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                  <IconBriefcase size={22} color="#0d9488" />
                                                  <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '16.5px', fontFamily: "'Manrope', sans-serif" }}>
                                                    {idx === 0 ? 'Last Worked Company' : (
                                                      <span>
                                                        Experience details
                                                      </span>
                                                    )}
                                                  </Typography>
                                                </Stack>
                                                {(experienceRows.length > 1 || candidate?.q21_is_experienced?.toUpperCase()?.trim() !== 'YES') && (
                                                  <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setExperienceRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}
                                                    sx={{
                                                      border: `1px solid ${borderCol}`,
                                                      borderRadius: '10px',
                                                      p: 0.8,
                                                      '&:hover': {
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                                      }
                                                    }}
                                                  >
                                                    <IconTrash size={18} />
                                                  </IconButton>
                                                )}
                                              </Stack>

                                              {idx === 0 && candidate?.q21_is_experienced?.toUpperCase()?.trim() === 'YES' && (
                                                <Typography sx={{ color: '#d97706', fontWeight: 600, fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: 1, mb: 3.5, pl: 0.5 }}>
                                                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#d97706' }}></span>
                                                  Please verify that the provided information is correct.
                                                </Typography>
                                              )}

                                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 1.5, sm: 2.5, md: '24px 28px' } }}>
                                                {idx === 0 && candidate?.q21_is_experienced?.toUpperCase()?.trim() === 'YES' && (
                                                  <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' }, mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0d9488', mb: 2.5, fontFamily: "'Manrope', sans-serif" }}>
                                                      HR Manager Reference Details
                                                    </Typography>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: { xs: 1.5, sm: 2.5 }, mb: { xs: 2.5, sm: 4 }, alignItems: 'start' }}>
                                                      <Box id="experience_repMgrName" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          HR Manager Name
                                                          <TranslationTooltip label="HR Manager Name" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          name="repMgrName"
                                                          type="text"
                                                          value={repMgrName}
                                                          onChange={(e) => {
                                                            const val = e.target.value;
                                                            setRepMgrName(val);
                                                            if (fieldErrors['experience_repMgrName']) {
                                                              setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next['experience_repMgrName'];
                                                                return next;
                                                              });
                                                            }
                                                          }}
                                                          placeholder="e.g. John Doe"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_repMgrName']}
                                                          helperText={fieldErrors['experience_repMgrName']}
                                                        />
                                                      </Box>
                                                      <Box id="experience_repMgrEmail" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          HR Manager Email
                                                          <TranslationTooltip label="HR Manager Email" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          name="repMgrEmail"
                                                          type="email"
                                                          value={repMgrEmail}
                                                          onChange={(e) => {
                                                            const val = e.target.value;
                                                            setRepMgrEmail(val);
                                                            setFieldErrors(prev => {
                                                              const next = { ...prev };
                                                              delete next['experience_repMgrEmail'];
                                                              if (val?.trim() && vertHeadEmail?.trim() && val.trim().toLowerCase() === vertHeadEmail.trim().toLowerCase()) {
                                                                next['experience_repMgrEmail'] = 'Manager Email and Vertical Head Email cannot be the same';
                                                                next['experience_vertHeadEmail'] = 'Vertical Head Email and Manager Email cannot be the same';
                                                              } else {
                                                                if (next['experience_vertHeadEmail'] === 'Vertical Head Email and Manager Email cannot be the same') {
                                                                  delete next['experience_vertHeadEmail'];
                                                                }
                                                              }
                                                              return next;
                                                            });
                                                          }}
                                                          placeholder="e.g. manager@company.com"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_repMgrEmail']}
                                                          helperText={fieldErrors['experience_repMgrEmail']}
                                                        />
                                                      </Box>
                                                      <Box id="experience_repMgrPhone" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          HR Manager Phone
                                                          <TranslationTooltip label="HR Manager Phone" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          name="repMgrPhone"
                                                          type="phone"
                                                          value={repMgrPhone}
                                                          onChange={(e) => {
                                                            const val = e.target.local || e.target.value;
                                                            const code = e.target.code;
                                                            setRepMgrPhone(val);
                                                            if (code) setRepMgrPhoneCode(code);
                                                            setFieldErrors(prev => {
                                                              const next = { ...prev };
                                                              if (!val || !val.trim()) {
                                                                next['experience_repMgrPhone'] = 'HR Manager Phone is required';
                                                              } else if (!isValidPhoneNum(val, code, countries)) {
                                                                const matchedCountry = (countries || []).find(c => c.countryCode === code || c.isd === code || String(c.id) === String(code));
                                                                const minLen = matchedCountry ? (matchedCountry.phoneMinLength || 8) : 8;
                                                                const maxLen = matchedCountry ? (matchedCountry.phoneMaxLength || 15) : 15;
                                                                next['experience_repMgrPhone'] = minLen === maxLen 
                                                                  ? `HR Manager Phone must be at least ${minLen} digits`
                                                                  : `HR Manager Phone must be ${minLen}–${maxLen} digits`;
                                                              } else {
                                                                delete next['experience_repMgrPhone'];
                                                              }
                                                              return next;
                                                            });
                                                          }}
                                                          placeholder="e.g. 9876543210"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_repMgrPhone']}
                                                          helperText={fieldErrors['experience_repMgrPhone']}
                                                        />
                                                      </Box>
                                                    </Box>

                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0d9488', mb: 2.5, fontFamily: "'Manrope', sans-serif" }}>
                                                      Vertical Head Reference Details
                                                    </Typography>
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: { xs: 1.5, sm: 2.5 }, mb: { xs: 2, sm: 3 }, alignItems: 'start' }}>
                                                      <Box id="experience_vertHeadName" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          Vertical Head Name
                                                          <TranslationTooltip label="Vertical Head Name" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          value={vertHeadName}
                                                          onChange={(e) => {
                                                            const val = e.target.value;
                                                            setVertHeadName(val);
                                                            if (fieldErrors['experience_vertHeadName']) {
                                                              setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next['experience_vertHeadName'];
                                                                return next;
                                                              });
                                                            }
                                                          }}
                                                          placeholder="e.g. Jane Smith"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_vertHeadName']}
                                                          helperText={fieldErrors['experience_vertHeadName']}
                                                        />
                                                      </Box>
                                                      <Box id="experience_vertHeadEmail" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          Vertical Head Email
                                                          <TranslationTooltip label="Vertical Head Email" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          name="vertHeadEmail"
                                                          type="email"
                                                          value={vertHeadEmail}
                                                          onChange={(e) => {
                                                            const val = e.target.value;
                                                            setVertHeadEmail(val);
                                                            setFieldErrors(prev => {
                                                              const next = { ...prev };
                                                              delete next['experience_vertHeadEmail'];
                                                              if (val?.trim() && repMgrEmail?.trim() && val.trim().toLowerCase() === repMgrEmail.trim().toLowerCase()) {
                                                                next['experience_repMgrEmail'] = 'Manager Email and Vertical Head Email cannot be the same';
                                                                next['experience_vertHeadEmail'] = 'Vertical Head Email and Manager Email cannot be the same';
                                                              } else {
                                                                if (next['experience_repMgrEmail'] === 'Manager Email and Vertical Head Email cannot be the same') {
                                                                  delete next['experience_repMgrEmail'];
                                                                }
                                                              }
                                                              return next;
                                                            });
                                                          }}
                                                          placeholder="e.g. head@company.com"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_vertHeadEmail']}
                                                          helperText={fieldErrors['experience_vertHeadEmail']}
                                                        />
                                                      </Box>
                                                      <Box id="experience_vertHeadPhone" sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textMutedColor }}>
                                                          Vertical Head Phone
                                                          <TranslationTooltip label="Vertical Head Phone" themeMode={themeMode} />
                                                        </Typography>
                                                        <BOSTextField
                                                          name="vertHeadPhone"
                                                          type="phone"
                                                          value={vertHeadPhone}
                                                          onChange={(e) => {
                                                            const val = e.target.local || e.target.value;
                                                            const code = e.target.code || '+91';
                                                            setVertHeadPhone(val);
                                                            if (code) setVertHeadPhoneCode(code);
                                                            setFieldErrors(prev => {
                                                              const next = { ...prev };
                                                              if (!val || !val.trim()) {
                                                                next['experience_vertHeadPhone'] = 'Vertical Head Phone is required';
                                                              } else if (!isValidPhoneNum(val, code, countries)) {
                                                                const matchedCountry = (countries || []).find(c => c.countryCode === code || c.isd === code || String(c.id) === String(code));
                                                                const minLen = matchedCountry ? (matchedCountry.phoneMinLength || 8) : 8;
                                                                const maxLen = matchedCountry ? (matchedCountry.phoneMaxLength || 15) : 15;
                                                                next['experience_vertHeadPhone'] = minLen === maxLen 
                                                                  ? `Vertical Head Phone must be at least ${minLen} digits`
                                                                  : `Vertical Head Phone must be ${minLen}–${maxLen} digits`;
                                                              } else {
                                                                delete next['experience_vertHeadPhone'];
                                                              }
                                                              return next;
                                                            });
                                                          }}
                                                          placeholder="e.g. 9876543210"
                                                          size="small"
                                                          fullWidth
                                                          sx={inputStyle}
                                                          error={!!fieldErrors['experience_vertHeadPhone']}
                                                          helperText={fieldErrors['experience_vertHeadPhone']}
                                                        />
                                                      </Box>
                                                    </Box>
                                                    <Divider sx={{ my: 3.5, borderColor: borderCol, borderStyle: 'dashed' }} />
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0d9488', mb: 1, fontFamily: "'Manrope', sans-serif" }}>
                                                      Experience Details
                                                    </Typography>
                                                  </Box>
                                                )}
                                                {/* Company Name */}
                                                <Box id={`experience_${idx}_companyName`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                                                    Company Name
                                                    <TranslationTooltip label="Company Name" themeMode={themeMode} />
                                                  </Typography>
                                                  <BOSTextField
                                                    value={row.companyName}
                                                    onChange={(e) => handleExperienceRowChange(idx, 'companyName', e.target.value)}
                                                    placeholder="e.g. Acme Corporation"
                                                    size="small"
                                                    fullWidth
                                                    sx={inputStyle}
                                                    error={!!fieldErrors[`experience_${idx}_companyName`]}
                                                    helperText={fieldErrors[`experience_${idx}_companyName`]}
                                                  />
                                                </Box>

                                                {/* Location */}
                                                <Box id={`experience_${idx}_location`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                                                    Location
                                                    <TranslationTooltip label="Location" themeMode={themeMode} />
                                                  </Typography>
                                                  <BOSTextField
                                                    value={row.location}
                                                    onChange={(e) => handleExperienceRowChange(idx, 'location', e.target.value)}
                                                    placeholder="City, country"
                                                    size="small"
                                                    fullWidth
                                                    sx={inputStyle}
                                                    error={!!fieldErrors[`experience_${idx}_location`]}
                                                    helperText={fieldErrors[`experience_${idx}_location`]}
                                                    InputProps={{
                                                      startAdornment: (
                                                        <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                          <IconMapPin size={18} color="#94a3b8" />
                                                        </InputAdornment>
                                                      ),
                                                    }}
                                                  />
                                                </Box>

                                                {/* From Date */}
                                                <Box id={`experience_${idx}_fromDate`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                                                    From Date
                                                    <TranslationTooltip label="From Date" themeMode={themeMode} />
                                                  </Typography>
                                                  <BOSDatePicker
                                                    name="fromDate"
                                                    value={row.fromDate}
                                                    onChange={(e) => handleExperienceRowChange(idx, 'fromDate', e.target.value)}
                                                    size="small"
                                                    sx={inputStyle}
                                                    fullWidth
                                                    disableHolidayLookup={true}
                                                    error={!!fieldErrors[`experience_${idx}_fromDate`]}
                                                    helperText={fieldErrors[`experience_${idx}_fromDate`]}
                                                  />
                                                </Box>

                                                {/* To Date */}
                                                <Box id={`experience_${idx}_toDate`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                                                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                                                    To Date
                                                    <TranslationTooltip label="To Date" themeMode={themeMode} />
                                                  </Typography>
                                                  <BOSDatePicker
                                                    name="toDate"
                                                    value={row.toDate}
                                                    onChange={(e) => handleExperienceRowChange(idx, 'toDate', e.target.value)}
                                                    size="small"
                                                    sx={inputStyle}
                                                    fullWidth
                                                    disableHolidayLookup={true}
                                                    error={!!fieldErrors[`experience_${idx}_toDate`]}
                                                    helperText={fieldErrors[`experience_${idx}_toDate`]}
                                                  />
                                                </Box>

                                                {/* Calculated Experience */}
                                                <Box id={`experience_${idx}_expYears`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                                                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: textSecondaryColor }}>
                                                    Years of Experience
                                                    <TranslationTooltip label="Years of Experience" themeMode={themeMode} />
                                                  </Typography>
                                                  <BOSTextField
                                                    value={row.expYears || ''}
                                                    onChange={(e) => handleExperienceRowChange(idx, 'expYears', e.target.value)}
                                                    placeholder="—"
                                                    type="number"
                                                    size="small"
                                                    fullWidth
                                                    sx={inputStyle}
                                                    error={!!fieldErrors[`experience_${idx}_expYears`]}
                                                    helperText={fieldErrors[`experience_${idx}_expYears`]}
                                                  />
                                                </Box>

                                                {/* Certificate Upload */}
                                                <Box id={`experience_${idx}_file`} sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                                                  {renderRejectionAlert(row.companyName ? "Experience - " + row.companyName : "Experience")}
                                                  {renderUploadCard(
                                                    row.files || [],
                                                    (files) => handleExperienceRowChange(idx, 'files', files),
                                                    "Upload experience certificate",
                                                    !!fieldErrors[`experience_${idx}_file`],
                                                    true,
                                                    true,
                                                    !isDocRejected(row.companyName ? "Experience - " + row.companyName : "Experience"),
                                                    'HRA_EXPERIENCE'
                                                  )}
                                                  {fieldErrors[`experience_${idx}_file`] && (
                                                    <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', ml: 1 }}>
                                                      {fieldErrors[`experience_${idx}_file`]}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              </Box>
                                            </CardContent>
                                          </Card>
                                        </Stack>
                                      );
                                    })}

                                    <Box sx={{ pl: { xs: 0, sm: 6.5 }, width: '100%' }}>
                                      <Button
                                        variant="outlined"
                                        startIcon={<IconPlus size={16} color="#0d9488" />}
                                        onClick={handleAddExperienceRow}
                                        fullWidth
                                        sx={{
                                          borderColor: '#0d9488',
                                          color: '#0d9488',
                                          borderStyle: 'dashed',
                                          borderWidth: '1px',
                                          borderRadius: '12px',
                                          textTransform: 'none',
                                          height: '46px',
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          bgcolor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.02)' : 'rgba(13, 148, 136, 0.05)',
                                          mt: 1,
                                          '&:hover': {
                                            borderColor: '#0f766e',
                                            borderWidth: '1px',
                                            borderStyle: 'dashed',
                                            backgroundColor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.06)' : 'rgba(13, 148, 136, 0.1)'
                                          }
                                        }}
                                      >
                                        Add experience
                                      </Button>
                                    </Box>
                                  </Stack>
                                ))}


                            </Box>
                          )}

                          {/* 2. EDUCATION SECTION */}
                          {activeTab === 1 && (
                            <Box sx={{ width: '100%' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1, ml: { xs: 0, sm: 6.5 } }}>
                                Academic Qualifications
                              </Typography>
                              <Typography variant="body2" sx={{ color: textMutedColor, mb: 3, ml: { xs: 0, sm: 6.5 }, textAlign: 'left', fontWeight: 500 }}>
                                Provide your educational background from school through higher studies.
                              </Typography>

                              <TabNotesBanner
                                title="EDUCATION NOTES"
                                titleTamil="கல்வி தகுதி பற்றிய குறிப்புகள்"
                                themeMode={themeMode}
                                notes={[
                                  {
                                    en: "School Education: 10th and 12th cards are shown by default. Use '+ Add School Education' to add 11th, 9th, 8th, 7th, 6th, 5th, or other school levels.",
                                    ta: "பள்ளிப் படிப்பு: 10வது மற்றும் 12வது படிவங்கள் இயல்பாகக் காட்டப்படும். 11, 9, 8, 7 அல்லது பிற பள்ளி வகுப்புகளைச் சேர்க்க '+ Add School Education' பொத்தானைப் பயன்படுத்தவும்."
                                  },
                                  {
                                    en: "For school qualifications other than 11th & 12th, Stream / Specification automatically defaults to 'N/A'.",
                                    ta: "11 மற்றும் 12 தவிர மற்ற பள்ளி வகுப்புகளுக்கு பாடப்பிரிவு (Stream) தானாகவே 'N/A' என அமைத்து பூட்டப்படும்."
                                  },
                                  {
                                    en: "Higher Education: Click '+ Add Higher Education' to add Diploma, Undergraduate (UG), Postgraduate (PG), or Doctorate degrees.",
                                    ta: "உயர்கல்வி: டிப்ளோமா, இளங்கலை (UG), முதுகலை (PG) போன்ற உயர்கல்வி படிப்புகளைச் சேர்க்க '+ Add Higher Education' பொத்தானைப் பயன்படுத்தவும்."
                                  }
                                ]}
                              />

                              {(() => {
                                const schoolRows = educationRows
                                  .map((row, idx) => ({ row, idx }))
                                  .filter(({ row }) => isSchoolEdu(row));

                                const higherRows = educationRows
                                  .map((row, idx) => ({ row, idx }))
                                  .filter(({ row }) => !isSchoolEdu(row));

                                const has10th = educationRows.some(row => row.isDefault10th);
                                const has12th = educationRows.some(row => row.isDefault12th);

                                return (
                                  <Stack spacing={4}>
                                    {/* Section A: School Education */}
                                    <Box>
                                      <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: textPrimaryColor, mb: 1, ml: { xs: 0, sm: 6.5 } }}>
                                        School Education
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: textMutedColor, mb: 3, ml: { xs: 0, sm: 6.5 }, textAlign: 'left', fontWeight: 500 }}>
                                        Your secondary, higher secondary, or other school educational background.
                                      </Typography>
                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 1.5, sm: 2.5, lg: '24px' }, ml: { xs: 0, sm: 6.5 }, mb: 3 }}>
                                        {/* 10th Slot */}
                                        {has10th && schoolRows.filter(({ row }) => row.isDefault10th).map(({ row, idx }) => renderEducationCard(row, idx))}

                                        {/* 12th Slot */}
                                        {has12th && schoolRows.filter(({ row }) => row.isDefault12th).map(({ row, idx }) => renderEducationCard(row, idx))}

                                        {/* Custom / Additional School Education Cards (11th, 9th, 8th, 7th, etc.) */}
                                        {schoolRows
                                          .filter(({ row }) => !row.isDefault10th && !row.isDefault12th)
                                          .map(({ row, idx }) => renderEducationCard(row, idx))}
                                      </Box>

                                      <Box sx={{ ml: { xs: 0, sm: 6.5 } }}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<IconPlus size={16} color="#0d9488" />}
                                          onClick={handleAddSchoolEducationRow}
                                          sx={{
                                            borderColor: '#0d9488',
                                            color: '#0d9488',
                                            borderStyle: 'dashed',
                                            borderWidth: '1px',
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            height: '42px',
                                            fontSize: '13.5px',
                                            fontWeight: 600,
                                            bgcolor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.02)' : 'rgba(13, 148, 136, 0.05)',
                                            '&:hover': {
                                              borderColor: '#0f766e',
                                              borderWidth: '1px',
                                              borderStyle: 'dashed',
                                              backgroundColor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.06)' : 'rgba(13, 148, 136, 0.1)'
                                            }
                                          }}
                                        >
                                          Add School Education
                                        </Button>
                                      </Box>
                                    </Box>

                                    <Divider sx={{ my: 2, ml: { xs: 0, sm: 6.5 }, borderColor: borderCol }} />

                                    {/* Section B: Higher Education */}
                                    <Box>
                                      <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: textPrimaryColor, mb: 1, ml: { xs: 0, sm: 6.5 } }}>
                                        Higher Education
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: textMutedColor, mb: 3, ml: { xs: 0, sm: 6.5 }, textAlign: 'left', fontWeight: 500 }}>
                                        Diplomas, Undergraduate (UG), Postgraduate (PG), or other credentials.
                                      </Typography>

                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 1.5, sm: 2.5, lg: '24px' }, ml: { xs: 0, sm: 6.5 }, mb: 3 }}>
                                        {higherRows.map(({ row, idx }) => renderEducationCard(row, idx))}
                                        {higherRows.length === 0 && (
                                          <Box sx={{ gridColumn: 'span 2', py: 4, textAlign: 'center', border: `1px dashed ${borderCol}`, borderRadius: '20px' }}>
                                            <Typography variant="body2" sx={{ color: textMutedColor, fontStyle: 'italic' }}>
                                              No higher education records added.
                                            </Typography>
                                          </Box>
                                        )}
                                      </Box>

                                      <Box sx={{ ml: { xs: 0, sm: 6.5 } }}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<IconPlus size={16} color="#0d9488" />}
                                          onClick={handleAddEducationRow}
                                          sx={{
                                            borderColor: '#0d9488',
                                            color: '#0d9488',
                                            borderStyle: 'dashed',
                                            borderWidth: '1px',
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            height: '46px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            px: 3,
                                            bgcolor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.02)' : 'rgba(13, 148, 136, 0.05)',
                                            '&:hover': {
                                              borderColor: '#0f766e',
                                              backgroundColor: themeMode === 'light' ? 'rgba(13, 148, 136, 0.06)' : 'rgba(13, 148, 136, 0.1)'
                                            }
                                          }}
                                        >
                                          Add Education
                                        </Button>
                                      </Box>
                                    </Box>
                                  </Stack>
                                );
                              })()}
                            </Box>
                          )}

                          {/* 3. KYC DOCUMENTS SECTION */}
                          {activeTab === 2 && (() => {
                            const standardDocs = [
                              { label: 'Aadhar Card', key: 'AADHAR CARD' },
                              { label: 'Pan Card', key: 'PAN CARD' },
                              { label: 'Voter Id', key: 'VOTER ID' },
                              { label: 'Passport', key: 'PASSPORT' },
                              { label: 'Driving Licence', key: 'DRIVING LICENCE' },
                              { label: 'Ration Card', key: 'RATION CARD' }
                            ];

                            const missingStandardDocs = standardDocs.filter(d =>
                              !kycRows.some(row => row.docName?.toUpperCase() === d.key)
                            );

                            return (
                              <>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1, ml: { xs: 0, sm: 0 } }}>
                                  Identity Verification
                                </Typography>
                                <Typography variant="body2" sx={{ color: textMutedColor, mb: 3 }}>
                                  Upload your identity and address proof documents for verification.
                                </Typography>

                                <TabNotesBanner
                                  title="KYC & DOCUMENT NOTES"
                                  titleTamil="அடையாள ஆவணங்கள் பற்றிய குறிப்புகள்"
                                  themeMode={themeMode}
                                  notes={[
                                    {
                                      en: "Aadhaar Card is mandatory for onboarding verification. Click '+ Add Document' if you need to upload additional government proofs.",
                                      ta: "சரிபார்ப்பிற்கு ஆதார் அட்டை கண்டிப்பாக பதிவேற்றப்பட வேண்டும். கூடுதல் ஆவணங்களைச் சேர்க்க '+ Add Document' பயன்படுத்தவும்."
                                    },
                                    {
                                      en: "Please upload clear scanned copies or clear photos (PDF, PNG, JPG) of your identity proofs (Aadhaar, PAN, Bank Passbook, Passport, License).",
                                      ta: "உங்களது அடையாள ஆவணங்களின் (ஆதார், பான், வங்கி கணக்கு புத்தகம் போன்றவை) தெளிவான நகல்கள் அல்லது புகைப்படங்களை பதிவேற்றவும்."
                                    }
                                  ]}
                                />
                                <Card sx={{ ...cardStyle, p: { xs: 1.5, sm: 3, md: 5 } }}>

                                  <Stack spacing={4}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 1.5, sm: 2.5, md: 4 } }}>
                                      {kycRows.map((row, idx) => {
                                        registerField("kyc_" + idx, 2, `kyc_${idx}`, row.docName || 'KYC Document');
                                        const isRequired = isRequiredDoc(row.docName);
                                        const docLabel = formatDocName(row.docName || 'Document');

                                        const isKycCardError = Object.keys(fieldErrors).some(key => key.startsWith(`kyc_${idx}_`) || key === `kyc_${idx}`);
                                        return (
                                          <Box
                                            key={row.id || idx}
                                            id={`kyc_${idx}`}
                                            sx={{
                                              p: { xs: 1.5, sm: 2.5, md: 3 },
                                              border: isKycCardError ? '1.5px solid #ef4444' : `1.5px solid ${borderCol}`,
                                              borderLeft: isKycCardError ? '5px solid #ef4444' : '5px solid #0d9488',
                                              borderRadius: '20px',
                                              bgcolor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.2)',
                                              boxShadow: isKycCardError
                                                ? '0 0 0 1px rgba(239, 68, 68, 0.15)'
                                                : (themeMode === 'light' ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)'),
                                              display: 'flex',
                                              flexDirection: 'column',
                                              
                                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                              '&:hover': {
                                                borderColor: isKycCardError ? '#ef4444' : (themeMode === 'light' ? '#0d9488' : '#63d9c4'),
                                                boxShadow: themeMode === 'light'
                                                  ? '0 20px 40px rgba(13, 148, 136, 0.08)'
                                                  : '0 20px 40px rgba(99, 217, 196, 0.15)'
                                              },
                                              ...(isKycCardError ? {
                                                animation: 'shakeError 0.4s ease-in-out',
                                                '@keyframes shakeError': {
                                                  '0%, 100%': { transform: 'translateX(0)' },
                                                  '20%, 60%': { transform: 'translateX(-4px)' },
                                                  '40%, 80%': { transform: 'translateX(4px)' }
                                                }
                                              } : {})
                                            }}
                                          >
                                            <Stack spacing={2.5}>
                                              {/* Card Header */}
                                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                  {getDocIcon(row.docName)}
                                                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563EB', fontSize: '15px', fontFamily: "'Manrope', sans-serif", display: 'inline-flex', alignItems: 'center' }}>
                                                    {row.docName ? docLabel : 'New Document'}
                                                    <TranslationTooltip label={row.docName ? docLabel : 'New Document'} themeMode={themeMode} />
                                                    {isRequired && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
                                                  </Typography>
                                                </Stack>
                                                <IconButton
                                                  color="error"
                                                  size="small"
                                                  onClick={() => handleRemoveKycRow(idx)}
                                                  sx={{
                                                    border: `1px solid ${borderCol}`,
                                                    borderRadius: '10px',
                                                    p: 0.8,
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                                    }
                                                  }}
                                                >
                                                  <IconTrash size={16} />
                                                </IconButton>
                                              </Stack>

                                              {/* Card Body */}
                                              <Stack spacing={2}>
                                                {renderRejectionAlert(row.docName)}
                                                {row.isCustom && (
                                                  <BOSTextField
                                                    label={
                                                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        Document Name
                                                        <TranslationTooltip label="Document Name" themeMode={themeMode} />
                                                      </Box>
                                                    }
                                                    value={row.docName}
                                                    onChange={(e) => handleCustomKycChange(idx, 'docName', e.target.value)}
                                                    placeholder="Enter Document Name"
                                                    size="small"
                                                    fullWidth
                                                    sx={inputStyle}
                                                    error={!!fieldErrors[`kyc_${idx}_docName`]}
                                                    helperText={fieldErrors[`kyc_${idx}_docName`]}
                                                  />
                                                )}

                                                <Box sx={{ position: 'relative' }}>
                                                  <input
                                                    type="file"
                                                    multiple
                                                    ref={(el) => {
                                                      if (el) fileInputRefs.current[idx] = el;
                                                    }}
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleFileChange(idx, e)}
                                                  />
                                                  <BOSTextField
                                                    label={
                                                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        {row.docName ? `${docLabel} Number` : "Document Number"}
                                                        <TranslationTooltip label={row.docName ? `${docLabel} Number` : "Document Number"} themeMode={themeMode} />
                                                      </Box>
                                                    }
                                                    value={row.docNo}
                                                    onChange={(e) => handleCustomKycChange(idx, 'docNo', e.target.value)}
                                                    placeholder={row.docName ? `Enter ${docLabel} Number` : "Enter Document Number"}
                                                    size="small"
                                                    fullWidth
                                                    sx={inputStyle}
                                                    error={!!fieldErrors[`kyc_${idx}_docNo`]}
                                                    helperText={fieldErrors[`kyc_${idx}_docNo`]}
                                                    InputProps={{
                                                      endAdornment: (row.files || []).length >= 5 ? null : (
                                                        <InputAdornment position="end">
                                                          {uploadingKyc[idx] ? (
                                                            <CircularProgress size={20} sx={{ color: '#0d9488', mx: 1 }} />
                                                          ) : !isDocRejected(row.docName) ? null : (
                                                            <IconButton
                                                              color="primary"
                                                              size="small"
                                                              onClick={() => fileInputRefs.current[idx]?.click()}
                                                              sx={{
                                                                color: '#0d9488',
                                                                '&:hover': { bgcolor: 'rgba(13,148,136,0.06)' }
                                                              }}
                                                            >
                                                              <IconCloudUpload size={20} />
                                                            </IconButton>
                                                          )}
                                                        </InputAdornment>
                                                      )
                                                    }}
                                                  />
                                                </Box>

                                                {fieldErrors[`kyc_${idx}_file`] && (
                                                  <Typography variant="caption" color="error.main" sx={{ display: 'block', ml: 1 }}>
                                                    {fieldErrors[`kyc_${idx}_file`]}
                                                  </Typography>
                                                )}

                                                 {row.files && row.files.length > 0 && (
                                                   <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5, mt: 1.5, width: '100%', boxSizing: 'border-box' }}>
                                                     {row.files.map((file, fileIdx) => {
                                                       const rawName = file.fileName || file.name || file.serverFileName || file.path || 'document';
                                                       const cleanName = getCleanFileName(rawName);
                                                       const ext = (rawName.split('.').pop() || '').toLowerCase();
                                                       const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
                                                       const fileUrl = file.preview || getFileViewUrl(file.serverFileName || file.path || file.filePath || rawName);

                                                       return (
                                                         <Box
                                                           key={fileIdx}
                                                           sx={{
                                                             display: 'flex',
                                                             alignItems: 'center',
                                                             justifyContent: 'space-between',
                                                             gap: 1.5,
                                                             p: 1,
                                                             px: 1.5,
                                                             borderRadius: 1.5,
                                                             border: '1px solid',
                                                             borderColor: borderCol,
                                                             bgcolor: themeMode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.03)',
                                                             boxSizing: 'border-box',
                                                             width: '100%',
                                                              minWidth: 0,
                                                             overflow: 'hidden',
                                                             transition: 'all 0.2s',
                                                             '&:hover': {
                                                               borderColor: '#0d9488',
                                                               boxShadow: '0 2px 8px rgba(13,148,136,0.12)'
                                                             }
                                                           }}
                                                         >
                                                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
                                                             <Box sx={{
                                                               width: 32, height: 32, borderRadius: 1,
                                                               bgcolor: 'rgba(13,148,136,0.08)',
                                                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                               flexShrink: 0,
                                                               overflow: 'hidden',
                                                               border: '1px solid rgba(13,148,136,0.15)'
                                                             }}>
                                                               {isImg && fileUrl ? (
                                                                 <Box
                                                                   component="img"
                                                                   src={fileUrl}
                                                                   sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                   onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                                 />
                                                               ) : (
                                                                 <IconFileText size={16} color="#0d9488" />
                                                               )}
                                                               <Box sx={{ display: isImg && fileUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                                 <IconFileText size={16} color="#0d9488" />
                                                               </Box>
                                                             </Box>
                                                             <Tooltip title={cleanName} arrow placement="top">
                                                               <Typography
                                                                 variant="body2"
                                                                 sx={{
                                                                   fontWeight: 600,
                                                                   whiteSpace: 'nowrap',
                                                                   overflow: 'hidden',
                                                                   textOverflow: 'ellipsis',
                                                                   color: textPrimaryColor,
                                                                   fontSize: '0.8rem',
                                                                   flexShrink: 1,
                                                                   minWidth: 0
                                                                 }}
                                                               >
                                                                 {cleanName}
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
                                                                   bgcolor: 'rgba(13,148,136,0.08)',
                                                                   color: '#0d9488',
                                                                   '&:hover': { bgcolor: '#0d9488', color: 'white' }
                                                                 }}
                                                               >
                                                                 <IconEye size={14} />
                                                               </IconButton>
                                                             </Tooltip>
                                                             {!isDocRejected(row.docName) ? null : (
                                                               <Tooltip title="Delete Document" arrow>
                                                                 <IconButton
                                                                   size="small"
                                                                   onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     const updatedFiles = (row.files || []).filter((_, fI) => fI !== fileIdx);
                                                                     setKycRows(prev => prev.map((item, i) => i === idx ? {
                                                                       ...item,
                                                                       files: updatedFiles
                                                                     } : item));
                                                                     if (row.docName) {
                                                                       trackDocumentReplacement(row.docName, updatedFiles.length > 0);
                                                                     }
                                                                   }}
                                                                   sx={{
                                                                     p: 0.5,
                                                                     borderRadius: 1,
                                                                     bgcolor: 'rgba(239,68,68,0.08)',
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
                                                     })}
                                                   </Box>
                                                 )}
                                              </Stack>
                                            </Stack>
                                          </Box>
                                        );
                                      })}
                                    </Box>

                                    {/* "Choose document to add" section */}
                                    <Box sx={{ pt: 2, borderTop: `1px solid ${borderCol}` }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: textSecondaryColor, mb: 1.5 }}>
                                        Choose document to add:
                                      </Typography>
                                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1.5 }}>
                                        {missingStandardDocs.map(doc => (
                                          <Button
                                            key={doc.key}
                                            variant="outlined"
                                            startIcon={<IconPlus size={16} />}
                                            onClick={() => handleAddStandardKyc(doc.label, doc.key)}
                                            sx={{
                                              borderColor: '#2563EB',
                                              color: '#2563EB',
                                              borderRadius: '12px',
                                              textTransform: 'none',
                                              height: '42px',
                                              fontSize: '13px',
                                              fontWeight: 600,
                                              '&:hover': {
                                                borderColor: '#1d4ed8',
                                                backgroundColor: 'rgba(37,99,235,0.04)'
                                              }
                                            }}
                                          >
                                            {doc.label}
                                          </Button>
                                        ))}
                                        <Button
                                          variant="outlined"
                                          startIcon={<IconPlus size={16} />}
                                          onClick={handleAddKycRow}
                                          sx={{
                                            borderColor: '#2563EB',
                                            color: '#2563EB',
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            height: '42px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            '&:hover': {
                                              borderColor: '#1d4ed8',
                                              backgroundColor: 'rgba(37,99,235,0.04)'
                                            }
                                          }}
                                        >
                                          Other Documents
                                        </Button>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                </Card>
                              </>
                            );
                          })()}

                          {/* 4. SKILLS SECTION */}
                          {activeTab === 3 && (
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1, display: 'inline-flex', alignItems: 'center' }}>
                                Professional Skills
                                <TranslationTooltip label="Professional Skills" themeMode={themeMode} />
                              </Typography>
                              <Typography variant="body2" sx={{ color: textMutedColor, mb: 3 }}>
                                Add your areas of expertise and attach supporting certificates if available.
                              </Typography>

                              <TabNotesBanner
                                title="SKILLS NOTES"
                                titleTamil="திறன்கள் பற்றிய குறிப்புகள்"
                                themeMode={themeMode}
                                notes={[
                                  {
                                    en: "Select or type key technical competencies, software tools (e.g. MS Office, AutoCAD, Java, Tally), and professional skills.",
                                    ta: "உங்களது முக்கிய தொழில்நுட்ப திறன்கள், கணினி பயன்பாட்டு அறிவு (MS Office, AutoCAD போன்றவை) மற்றும் பிற திறன்களைத் தேர்ந்தெடுத்துச் சேர்க்கவும்."
                                  },
                                  {
                                    en: "Adding your core skills helps HR match your profile with relevant operational roles and department assignments.",
                                    ta: "உங்களது திறன்களைச் சேர்ப்பது மனிதவளத் துறை உங்களை சரியான பணிப் பொறுப்பில் அமர்த்த உதவும்."
                                  }
                                ]}
                              />
                              {renderRejectionAlert("Skills")}
                              {/* Two-column layout: Skills input | Added Skills */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', md: 'row' },
                                  gap: { xs: 2.5, md: 4 },
                                  alignItems: 'stretch',
                                  width: '100%'
                                }}
                              >
                                {/* LEFT COLUMN — Add Professional Skill */}
                                {isDocRejected("Skills") && (
                                  <Card
                                    sx={{
                                      flex: { xs: '1 1 100%', md: '0 0 42%' },
                                      p: { xs: 1.5, sm: 2.5, md: 3 },
                                      border: `1.5px solid ${borderCol}`,
                                      borderLeft: `5px solid #0d9488`,
                                      borderRadius: '20px',
                                      bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                                      boxShadow: themeMode === 'light' ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 2
                                    }}
                                  >
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                      <Box sx={{ p: 1, bgcolor: themeMode === 'light' ? '#eef2ff' : 'rgba(37,99,235,0.1)', borderRadius: '8px', color: '#2563EB', display: 'flex' }}>
                                        <IconBriefcase size={18} />
                                      </Box>
                                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563EB', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>
                                        Skills
                                        <TranslationTooltip label="Skills" themeMode={themeMode} />
                                      </Typography>
                                    </Stack>

                                    {/* Skill name input */}
                                    <Box>
                                      <input
                                        type="file"
                                        ref={skillFileInputRef}
                                        style={{ display: 'none' }}
                                        multiple
                                        onChange={handleSkillFileChange}
                                      />
                                      <BOSTextField
                                        placeholder="Type skill name & press Enter"
                                        value={newSkillText}
                                        onChange={(e) => setNewSkillText(e.target.value)}
                                        onKeyDown={handleSkillInputKeyDown}
                                        size="small"
                                        fullWidth
                                        sx={{ ...inputStyle }}
                                        InputProps={{
                                          endAdornment: (
                                            <InputAdornment position="end">
                                              {uploadingSkillFile ? (
                                                <CircularProgress size={18} sx={{ color: '#0d9488', mx: 0.5 }} />
                                              ) : newSkillFiles.length < 5 ? (
                                                <Tooltip title="Attach documents (max 5)">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => skillFileInputRef.current?.click()}
                                                    sx={{ color: '#0d9488', '&:hover': { bgcolor: 'rgba(13,148,136,0.06)' } }}
                                                  >
                                                    <IconCloudUpload size={18} />
                                                  </IconButton>
                                                </Tooltip>
                                              ) : null}
                                            </InputAdornment>
                                          )
                                        }}
                                      />
                                    </Box>

                                    {/* Files queued for the new skill — KYC-style pills */}
                                    {newSkillFiles.length > 0 && (
                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1, width: '100%', boxSizing: 'border-box' }}>
                                        {newSkillFiles.map((f, fIdx) => (
                                          <Box
                                            key={fIdx}
                                            sx={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 1.5,
                                              p: '6px 12px',
                                              borderRadius: '10px',
                                              border: `1px solid ${borderCol}`,
                                              bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                                              maxWidth: '100%'
                                            }}
                                          >
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: '100px', sm: '140px' }, fontSize: '13px' }}>
                                              {f.fileName || f.name || 'document'}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5}>
                                              <Tooltip title="View Document" arrow>
                                                <IconButton size="small" onClick={() => handlePreview(f)} sx={{ p: 0.5, color: 'primary.main', bgcolor: themeMode === 'light' ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.1)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                                  <IconEye size={14} />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Remove" arrow>
                                                <IconButton size="small" onClick={() => {
                                                  const updatedSkillFiles = newSkillFiles.filter((_, i) => i !== fIdx);
                                                  setNewSkillFiles(updatedSkillFiles);
                                                  const hasAnyFiles = updatedSkillFiles.length > 0 || skillsRows.some(r => (r.files || []).length > 0);
                                                  trackDocumentReplacement('Skills', hasAnyFiles);
                                                }} sx={{ p: 0.5, color: 'error.main', bgcolor: themeMode === 'light' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.1)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                                  <IconTrash size={14} />
                                                </IconButton>
                                              </Tooltip>
                                            </Stack>
                                          </Box>
                                        ))}
                                      </Box>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                      <Button
                                        variant="outlined"
                                        startIcon={<IconPlus size={16} />}
                                        onClick={() => handleAddSkillFromInput(newSkillText)}
                                        sx={{
                                          borderColor: '#2563EB',
                                          color: '#2563EB',
                                          borderWidth: '1.5px',
                                          borderRadius: '10px',
                                          textTransform: 'none',
                                          height: '38px',
                                          px: 2.5,
                                          fontWeight: 700,
                                          '&:hover': { borderColor: '#1d4ed8', borderWidth: '1.5px', backgroundColor: themeMode === 'light' ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.1)' }
                                        }}
                                      >
                                        Add Skill
                                      </Button>
                                      {newSkillFiles.length > 0 && (
                                        <Typography variant="caption" sx={{ color: textMutedColor }}>{newSkillFiles.length}/5 files</Typography>
                                      )}
                                    </Box>
                                  </Card>
                                )}

                                {/* RIGHT COLUMN — Added Skills */}
                                <Card sx={{ flex: 1, p: { xs: 1.5, sm: 2.5, md: 3 }, border: `1.5px solid ${borderCol}`, borderLeft: `5px solid #0d9488`, borderRadius: '20px', bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b', boxShadow: themeMode === 'light' ? '0 10px 30px rgba(0,0,0,0.02)' : '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: '600px' }}>
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Box sx={{ p: 1, bgcolor: themeMode === 'light' ? '#f0fdf4' : 'rgba(16,185,129,0.1)', borderRadius: '8px', color: '#059669', display: 'flex' }}>
                                      <IconBriefcase size={18} />
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>
                                      Added Skills
                                      <TranslationTooltip label="Added Skills" themeMode={themeMode} />
                                    </Typography>
                                    {skillsRows.length > 0 && (
                                      <Chip label={`${skillsRows.length}`} size="small" sx={{ bgcolor: '#059669', color: 'white', fontWeight: 700, height: '20px' }} />
                                    )}
                                  </Stack>

                                  {skillsRows.length === 0 ? (
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${borderCol}`, borderRadius: '12px', minHeight: '160px' }}>
                                      <Typography variant="body2" sx={{ color: textMutedColor }}>No skills added yet. Type a skill name and press Enter.</Typography>
                                    </Box>
                                  ) : (
                                    <Stack spacing={1.5}>
                                      {skillsRows.map((row, idx) => {
                                        registerField("skill_" + idx, 3, `skills_row_${idx}`, row.activityDetails || 'Skills Certificate');
                                        const isSkillCardError = Object.keys(fieldErrors).some(key => key.startsWith(`skills_${idx}_`) || key === `skills_row_${idx}`);
                                        return (
                                          <Box
                                            key={idx}
                                            id={`skills_row_${idx}`}
                                            sx={{
                                              p: { xs: 1.25, sm: 2 },
                                              border: isSkillCardError ? '1.5px solid #ef4444' : `1.5px solid ${borderCol}`,
                                              borderLeft: isSkillCardError ? '5px solid #ef4444' : '5px solid #0d9488',
                                              borderRadius: '16px',
                                              bgcolor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.2)',
                                              boxShadow: isSkillCardError
                                                ? '0 0 0 1px rgba(239, 68, 68, 0.15)'
                                                : (themeMode === 'light' ? '0 4px 12px rgba(0,0,0,0.01)' : '0 4px 12px rgba(0,0,0,0.1)'),
                                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                              '&:hover': {
                                                borderColor: isSkillCardError ? '#ef4444' : (themeMode === 'light' ? '#0d9488' : '#63d9c4'),
                                                boxShadow: themeMode === 'light'
                                                  ? '0 8px 16px rgba(13, 148, 136, 0.08)'
                                                  : '0 8px 16px rgba(99, 217, 196, 0.15)'
                                              },
                                              ...(isSkillCardError ? {
                                                animation: 'shakeError 0.4s ease-in-out',
                                                '@keyframes shakeError': {
                                                  '0%, 100%': { transform: 'translateX(0)' },
                                                  '20%, 60%': { transform: 'translateX(-4px)' },
                                                  '40%, 80%': { transform: 'translateX(4px)' }
                                                }
                                              } : {})
                                            }}
                                          >
                                            {/* Skill name row + actions */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: (row.files && row.files.length > 0) ? 1.5 : 0 }}>
                                              <Stack direction="row" spacing={1} alignItems="center">
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB', flexShrink: 0 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '13px' }}>
                                                  {row.activityDetails}
                                                </Typography>
                                              </Stack>
                                              <Stack direction="row" spacing={0.5} alignItems="center">
                                                {/* Upload files to existing skill */}
                                                {(row.files || []).length < 5 && isDocRejected("Skills") && (
                                                  <>
                                                    <input
                                                      type="file"
                                                      multiple
                                                      ref={el => skillRowFileInputRefs.current[idx] = el}
                                                      style={{ display: 'none' }}
                                                      onChange={(e) => handleSkillRowFileChange(e, idx)}
                                                    />
                                                    {uploadingSkillRow[idx] ? (
                                                      <CircularProgress size={14} sx={{ color: '#0d9488', mx: 0.5 }} />
                                                    ) : (
                                                      <Tooltip title="Attach documents (max 5)">
                                                        <IconButton
                                                          size="small"
                                                          onClick={() => skillRowFileInputRefs.current[idx]?.click()}
                                                          sx={{ p: 0.5, color: '#0d9488', bgcolor: themeMode === 'light' ? 'rgba(13,148,136,0.06)' : 'rgba(13,148,136,0.1)', borderRadius: '6px', '&:hover': { bgcolor: '#0d9488', color: 'white' } }}
                                                        >
                                                          <IconCloudUpload size={13} />
                                                        </IconButton>
                                                      </Tooltip>
                                                    )}
                                                  </>
                                                )}
                                                {!isDocRejected("Skills") ? null : (
                                                  <Tooltip title="Remove skill">
                                                    <IconButton
                                                      size="small"
                                                      onClick={() => {
                                                        const updatedRows = skillsRows.filter((_, rIdx) => rIdx !== idx);
                                                        setSkillsRows(updatedRows);
                                                        const hasAnyFiles = newSkillFiles.length > 0 || updatedRows.some(r => (r.files || []).length > 0);
                                                        trackDocumentReplacement('Skills', hasAnyFiles);
                                                      }}
                                                      sx={{ p: 0.5, color: 'error.main', bgcolor: themeMode === 'light' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.1)', borderRadius: '6px', '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                                                    >
                                                      <IconTrash size={13} />
                                                    </IconButton>
                                                  </Tooltip>
                                                )}
                                              </Stack>
                                            </Box>

                                            {/* Attached files — KYC-style pills */}
                                            {row.files && row.files.length > 0 && (
                                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1, pt: 1, borderTop: `1px solid ${borderCol}`, width: '100%', boxSizing: 'border-box' }}>
                                                {row.files.map((f, fIdx) => (
                                                  <Box
                                                    key={fIdx}
                                                    sx={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 1.5,
                                                      p: '6px 12px',
                                                      borderRadius: '10px',
                                                      border: `1px solid ${borderCol}`,
                                                      bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)',
                                                      maxWidth: '100%'
                                                    }}
                                                  >
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: '90px', sm: '130px' }, fontSize: '13px' }}>
                                                      {f.fileName || f.name || 'document'}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.5}>
                                                      <Tooltip title="View Document" arrow>
                                                        <IconButton size="small" onClick={() => handlePreview(f)} sx={{ p: 0.5, color: 'primary.main', bgcolor: themeMode === 'light' ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.1)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                                                          <IconEye size={14} />
                                                        </IconButton>
                                                      </Tooltip>
                                                      {!isDocRejected("Skills") ? null : (
                                                        <Tooltip title="Delete Document" arrow>
                                                          <IconButton size="small" onClick={() => {
                                                            const updatedRows = skillsRows.map((r, i) => {
                                                              if (i === idx) {
                                                                return { ...r, files: r.files.filter((_, fi) => fi !== fIdx) };
                                                              }
                                                              return r;
                                                            });
                                                            setSkillsRows(updatedRows);
                                                            const hasAnyFiles = newSkillFiles.length > 0 || updatedRows.some(r => (r.files || []).length > 0);
                                                            trackDocumentReplacement('Skills', hasAnyFiles);
                                                          }} sx={{ p: 0.5, color: 'error.main', bgcolor: themeMode === 'light' ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.1)', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                                            <IconTrash size={14} />
                                                          </IconButton>
                                                        </Tooltip>
                                                      )}
                                                    </Stack>
                                                  </Box>
                                                ))}
                                                <Typography variant="caption" sx={{ color: textMutedColor, alignSelf: 'center', ml: 'auto' }}>
                                                  {row.files.length}/5
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        );
                                      })}
                                    </Stack>
                                  )}
                                </Card>
                              </Box>
                            </Box>
                          )}



                          {/* 5. DETAILS REVIEW SECTION */}
                          {activeTab === 4 && (
                            <Card sx={cardStyle}>
                              <CardContent sx={{ p: { xs: 0.5, sm: 1.5, md: 2 } }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1, display: 'inline-flex', alignItems: 'center' }}>
                                  Review & Submit
                                  <TranslationTooltip label="Review & Submit" themeMode={themeMode} />
                                </Typography>
                                <Typography variant="body2" sx={{ color: textMutedColor, mb: 3.5 }}>
                                  Review all your entered details below before submitting. You can return to edit any section if needed.
                                </Typography>

                                <TabNotesBanner
                                  title="SUBMISSION NOTES"
                                  titleTamil="சமர்ப்பித்தல் பற்றிய குறிப்புகள்"
                                  themeMode={themeMode}
                                  notes={[
                                    {
                                      en: "Carefully verify all entered information across Experience, Education, KYC Documents, and Skills tabs before clicking 'Final Submit'.",
                                      ta: "இறுதியாக சமர்ப்பிப்பதற்கு முன் அனுபவம், கல்வி, KYC ஆவணங்கள் மற்றும் திறன்கள் ஆகியவற்றில் உள்ளீடு செய்யப்பட்ட விவரங்களைச் சரிபார்க்கவும்."
                                    },
                                    {
                                      en: "Once submitted, your onboarding profile will be handed over to the HR team for verification and employee record creation.",
                                      ta: "சமர்ப்பித்த பிறகு, உங்களது விவரங்கள் சரிபார்ப்பிற்காக மனிதவள (HR) குழுவிற்கு அனுப்பப்படும்."
                                    }
                                  ]}
                                />

                                <Stack spacing={{ xs: 3, sm: 4 }}>
                                  {/* Section 0: Experience Details */}
                                  <Box sx={innerCardStyle}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center' }}>
                                        1. Experience Details
                                        <TranslationTooltip label="1. Experience Details" themeMode={themeMode} />
                                      </Typography>
                                      <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => handleTabChange(0)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                                      </Button>
                                    </Stack>
                                    <Stack spacing={{ xs: 2.5, sm: 3 }}>
                                      <Box sx={{ p: { xs: 1.75, sm: 2 }, bgcolor: themeMode === 'light' ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                                        <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 600, display: 'block', mb: 0.5 }}>Prior Experience</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: textPrimaryColor }}>
                                          {candidate?.q21_is_experienced?.toUpperCase()?.trim() === 'YES' ? 'Yes' : 'No'}
                                        </Typography>
                                      </Box>

                                      {candidate?.q21_is_experienced?.toUpperCase()?.trim() === 'YES' && (
                                        <>
                                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2.5 }, p: { xs: 2, sm: 2.5 }, bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${borderCol}` }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                              <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>HR Manager Reference</Typography>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Name</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor }}>{repMgrName || '—'}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Email</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor, wordBreak: 'break-all' }}>{repMgrEmail || '—'}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Phone</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{repMgrPhone || '—'}</Typography>
                                              </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                              <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vertical Head Reference</Typography>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Name</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor }}>{vertHeadName || '—'}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Email</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor, wordBreak: 'break-all' }}>{vertHeadEmail || '—'}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Phone</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{vertHeadPhone || '—'}</Typography>
                                              </Box>
                                            </Box>
                                          </Box>

                                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimaryColor, mt: 1 }}>
                                            Employment History
                                          </Typography>
                                          {experienceRows.length === 0 ? (
                                            <Typography variant="body2" sx={{ color: textMutedColor, fontStyle: 'italic' }}>No employment records added.</Typography>
                                          ) : (
                                            <Stack spacing={2}>
                                              {experienceRows.map((row, idx) => (
                                                <Box key={idx} sx={{ p: { xs: 2, sm: 2.5 }, border: `1px solid ${borderCol}`, borderRadius: '14px', backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)', width: '100%', boxSizing: 'border-box' }}>
                                                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.75, sm: 2 } }}>
                                                    <Box>
                                                      <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Company & Location</Typography>
                                                      <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor }}>{row.companyName} {row.location ? `(${row.location})` : ''}</Typography>
                                                    </Box>
                                                    <Box>
                                                      <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Duration</Typography>
                                                      <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{row.fromDate || '—'} to {row.toDate || '—'}</Typography>
                                                    </Box>
                                                    <Box>
                                                      <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Total Experience</Typography>
                                                      <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{row.expYears ? `${row.expYears} Years` : '—'}</Typography>
                                                    </Box>
                                                  </Box>
                                                  {row.files && row.files.length > 0 ? (
                                                    <Box sx={{ mt: 2, pt: 1.75, borderTop: `1px solid ${borderCol}` }}>
                                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, width: '100%', gap: 1 }}>
                                                        <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                          Experience Certificate
                                                        </Typography>
                                                        <Chip label="Uploaded" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                                      </Box>
                                                      {renderAssessmentFileCards(row.files)}
                                                    </Box>
                                                  ) : null}
                                                </Box>
                                              ))}
                                            </Stack>
                                          )}
                                        </>
                                      )}
                                    </Stack>
                                  </Box>

                                  {/* Section 1: Education Details */}
                                  <Box sx={innerCardStyle}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center' }}>
                                        2. Education Details
                                        <TranslationTooltip label="2. Education Details" themeMode={themeMode} />
                                      </Typography>
                                      <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => handleTabChange(1)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                                      </Button>
                                    </Stack>
                                    {educationRows.length === 0 ? (
                                      <Typography variant="body2" sx={{ color: textMutedColor, fontStyle: 'italic' }}>No education records added.</Typography>
                                    ) : (
                                      <Stack spacing={2}>
                                        {educationRows.map((row, idx) => (
                                          <Box key={idx} sx={{ p: { xs: 2, sm: 2.5 }, border: `1px solid ${borderCol}`, borderRadius: '14px', backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.75, sm: 2 } }}>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Education / Degree</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor }}>{row.education || '—'}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Institution / Board</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{row.institutionName || '—'} {row.university ? `(${row.university})` : ''}</Typography>
                                              </Box>
                                              <Box>
                                                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 0.25, fontSize: '0.75rem', fontWeight: 600 }}>Passing Year & Grade</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{row.yearOfPassing || '—'} {row.grade ? `(${row.grade})` : ''}</Typography>
                                              </Box>
                                            </Box>
                                            {row.files && row.files.length > 0 ? (
                                              <Box sx={{ mt: 2, pt: 1.75, borderTop: `1px solid ${borderCol}` }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, width: '100%', gap: 1 }}>
                                                  <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Educational Certificate
                                                  </Typography>
                                                  <Chip label="Uploaded" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                                </Box>
                                                {renderAssessmentFileCards(row.files)}
                                              </Box>
                                            ) : null}
                                          </Box>
                                        ))}
                                      </Stack>
                                    )}
                                  </Box>

                                  {/* Section 2: KYC Documents */}
                                  <Box sx={innerCardStyle}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center' }}>
                                        3. KYC Documents
                                        <TranslationTooltip label="3. KYC Documents" themeMode={themeMode} />
                                      </Typography>
                                      <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => handleTabChange(2)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                                      </Button>
                                    </Stack>
                                    {kycRows.length === 0 ? (
                                      <Typography variant="body2" sx={{ color: textMutedColor, fontStyle: 'italic' }}>No KYC documents added.</Typography>
                                    ) : (
                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2.5 } }}>
                                        {kycRows.map((row, idx) => {
                                          const hasFiles = row.files && row.files.length > 0;
                                          const docTitle = row.docName ? formatDocName(row.docName) : `Document ${idx + 1}`;
                                          return (
                                            <Box
                                              key={idx}
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                p: { xs: 2, sm: 2.5 },
                                                border: `1px solid ${borderCol}`,
                                                borderRadius: '14px',
                                                backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, width: '100%', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                  {docTitle}
                                                </Typography>
                                                {hasFiles ? (
                                                  <Chip label="Uploaded" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                                ) : (
                                                  <Chip label="Missing" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                                )}
                                              </Box>
                                              {row.docNo ? (
                                                <Box sx={{ mb: 1.5 }}>
                                                  <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', fontSize: '0.75rem' }}>Document Number</Typography>
                                                  <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimaryColor }}>{row.docNo}</Typography>
                                                </Box>
                                              ) : null}
                                              {hasFiles ? (
                                                renderAssessmentFileCards(row.files)
                                              ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                                  Missing ✗
                                                </Typography>
                                              )}
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    )}
                                  </Box>

                                  {/* Section 3: Skills */}
                                  <Box sx={innerCardStyle}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', display: 'inline-flex', alignItems: 'center' }}>
                                        4. Skills
                                        <TranslationTooltip label="4. Skills" themeMode={themeMode} />
                                      </Typography>
                                      <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => handleTabChange(3)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                                      </Button>
                                    </Stack>
                                    {skillsRows.length === 0 ? (
                                      <Typography variant="body2" sx={{ color: textMutedColor, fontStyle: 'italic' }}>No skills added.</Typography>
                                    ) : (
                                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, sm: 2.5 } }}>
                                        {skillsRows.map((row, idx) => {
                                          const hasFiles = row.files && row.files.length > 0;
                                          return (
                                            <Box
                                              key={idx}
                                              sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                p: { xs: 2, sm: 2.5 },
                                                border: `1px solid ${borderCol}`,
                                                borderRadius: '14px',
                                                backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: hasFiles ? 1.5 : 0, width: '100%', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimaryColor }}>
                                                  {row.activityDetails}
                                                </Typography>
                                                {hasFiles ? (
                                                  <Chip label="Uploaded" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                                ) : null}
                                              </Box>
                                              {hasFiles ? renderAssessmentFileCards(row.files) : null}
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    )}
                                  </Box>
                                </Stack>

                                <Divider sx={{ my: { xs: 3, sm: 4 }, borderColor: borderCol }} />

                                {/* Declaration Checkbox Box */}
                                <Box
                                  id="field-container-confirmSubmit"
                                  sx={{
                                    p: { xs: 2, sm: 2.5 },
                                    mb: { xs: 3, sm: 4 },
                                    borderRadius: '14px',
                                    border: `1px solid ${fieldErrors.confirmSubmit ? '#d32f2f' : (themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)')}`,
                                    backgroundColor: fieldErrors.confirmSubmit
                                      ? (themeMode === 'light' ? 'rgba(211, 47, 47, 0.04)' : 'rgba(211, 47, 47, 0.08)')
                                      : 'transparent',
                                    transition: 'all 0.3s ease',
                                    ...(fieldErrors.confirmSubmit ? {
                                      animation: 'shakeError 0.4s ease-in-out',
                                      '@keyframes shakeError': {
                                        '0%, 100%': { transform: 'translateX(0)' },
                                        '20%, 60%': { transform: 'translateX(-4px)' },
                                        '40%, 80%': { transform: 'translateX(4px)' }
                                      }
                                    } : {})
                                  }}
                                >
                                  <FormControlLabel
                                    control={
                                      <Checkbox 
                                        checked={confirmSubmit} 
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setConfirmSubmit(checked);
                                          if (checked && fieldErrors.confirmSubmit) {
                                            setFieldErrors(prev => {
                                              const next = { ...prev };
                                              delete next.confirmSubmit;
                                              return next;
                                            });
                                          }
                                        }}
                                        sx={{
                                          color: fieldErrors.confirmSubmit ? '#d32f2f' : borderCol,
                                          '&.Mui-checked': { color: '#2563EB' }
                                        }} 
                                      />
                                    }
                                    label={
                                      <Typography variant="body2" sx={{ color: textPrimaryColor, fontWeight: 600 }}>
                                        I declare that all information submitted by me is genuine, accurate, and complete.
                                      </Typography>
                                    }
                                    sx={{ m: 0 }}
                                  />
                                  {fieldErrors.confirmSubmit && (
                                    <Typography variant="caption" sx={{ color: '#d32f2f', mt: 1, display: 'block', fontSize: '0.75rem', fontWeight: 600, pl: 4 }}>
                                      {fieldErrors.confirmSubmit}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Full-width Main Submit Button */}
                                <Button
                                  disabled={loading}
                                  onClick={handleSubmit}
                                  variant="contained"
                                  size="large"
                                  fullWidth
                                  sx={{
                                    backgroundColor: '#22c55e',
                                    '&:hover': { backgroundColor: '#16a34a' },
                                    py: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 18px rgba(34, 197, 94, 0.35)',
                                    textTransform: 'none'
                                  }}
                                >
                                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                                </Button>
                              </CardContent>
                            </Card>
                          )}

                        </motion.div>
                      </AnimatePresence>

                    {/* Sticky Bottom Action Footer */}
                    <Box
                      sx={{
                        position: 'sticky',
                        bottom: 24,
                        left: 0,
                        right: 0,
                        zIndex: 90,
                        mt: 6,
                        mx: 'auto',
                        maxWidth: '1200px',
                        width: '100%',
                        px: { xs: 2, sm: 3 }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 2,
                          py: 1.25,
                          borderRadius: '16px',
                          backgroundColor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                          border: `1.5px solid ${borderCol}`,
                          boxShadow: themeMode === 'light' ? '0 4px 14px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)'
                        }}
                      >
                        {/* Left: Previous Button */}
                        <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                          {activeTab > 0 ? (
                            <UniquePrevSymbolButton
                              onClick={() => handleTabChange(activeTab - 1)}
                              tooltip="Previous Step"
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40 }} />
                          )}
                        </Box>

                        {/* Center: Step Indicator */}
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', px: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '0.875rem' }}>
                            Step {activeTab + 1} of 5
                          </Typography>
                        </Box>

                        {/* Right: Next / Submit Button */}
                        <Box sx={{ minWidth: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                          {activeTab < 4 ? (
                            <UniqueNextSymbolButton
                              onClick={() => handleTabChange(activeTab + 1)}
                              tooltip="Next Step"
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 40 }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Container>
                </motion.div>
              )}
            </AnimatePresence>

              <Snackbar
                open={Boolean(error) && onboardingStarted}
                autoHideDuration={5000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Alert
                  onClose={() => setError('')}
                  severity="error"
                  variant="filled"
                  sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
                >
                  {error}
                </Alert>
              </Snackbar>

              {docPreview.open && docPreview.docs.length > 0 && (
                <BOSFilePreview
                  open={docPreview.open}
                  onClose={closeDocPreview}
                  file={docPreview.docs[docPreview.currentIndex]}
                  allFiles={docPreview.docs}
                  onNavigate={(newFile) => {
                    const idx = docPreview.docs.findIndex(d =>
                      (d.serverFileName && newFile.serverFileName && d.serverFileName === newFile.serverFileName) ||
                      (d.fileName && newFile.fileName && d.fileName === newFile.fileName) ||
                      (d.url && newFile.url && d.url === newFile.url)
                    );
                    if (idx >= 0) {
                      setDocPreview(prev => ({ ...prev, currentIndex: idx }));
                    }
                  }}
                />
              )}
            </Box>
          </>
        )}
      </>
    </ThemeProvider>
  );
}
