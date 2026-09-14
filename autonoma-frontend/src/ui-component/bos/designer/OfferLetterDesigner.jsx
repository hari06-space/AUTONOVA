import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Stack,
  Chip,
  Avatar,
  Popper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Slider,
  Alert
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { getCompanyImageUrl } from 'utils/upload-helper';
import {
  IconPlus,
  IconDeviceFloppy,
  IconTrash,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconDownload,
  IconZoomIn,
  IconZoomOut,
  IconFileText,
  IconUser,
  IconBriefcase,
  IconCalendar,
  IconCashBanknote,
  IconBuildingSkyscraper,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconMaximize,
  IconHelpCircle,
  IconSearch,
  IconRefresh,
  IconLayoutRows,
  IconSparkles,
  IconSignature,
  IconGripVertical,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconChevronLeft,
  IconChevronRight,
  IconAdjustments,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconHistory,
  IconRotate2,
  IconArrowsVertical,
  IconColumnInsertRight,
  IconMail,
  IconInfoCircle,
  IconCode,
  IconLayoutGrid
} from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import axios from 'utils/axios';
import { format } from 'date-fns';
import ReactQuill from 'ui-component/third-party/ReactQuill';
import BOSAutocomplete from 'ui-component/bos/BOSAutocomplete';
import BOSCandidateAutocomplete from 'ui-component/bos/BOSCandidateAutocomplete';
import BOSTextField from 'ui-component/bos/BOSTextField';
import BOSToggleSwitch from 'ui-component/bos/BOSToggleSwitch';
import { getFileViewUrl } from 'utils/upload-helper';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { OfferLetterDesignerManual } from '../manuals/OfferLetterDesignerManual';
import { reevaluateAndBalanceComponents } from 'utils/salaryBalancingEngine';
import { exportOfferLetterToPdf } from 'utils/digitalPdfExport';
import {
  cleanMobileNumber,
  resolveCandidateEmail,
  DEFAULT_DOCUMENT_SECTIONS,
  ESTIMATED_SECTION_HEIGHTS,
  substituteOfferTokens,
  resolveOfferDataMap,
  OFFER_LETTER_PDF_CONFIG,
  getOfferLetterPdfOptions,
  normalizeOfferSalaryStructure,
  formatQuillHtmlForExport,
  buildCleanOfferLetterHtml,
  buildOfferLetterDocumentModel
} from 'utils/offerLetterDocumentModel';

export {
  cleanMobileNumber,
  resolveCandidateEmail,
  DEFAULT_DOCUMENT_SECTIONS,
  ESTIMATED_SECTION_HEIGHTS,
  substituteOfferTokens,
  resolveOfferDataMap,
  OFFER_LETTER_PDF_CONFIG,
  getOfferLetterPdfOptions,
  normalizeOfferSalaryStructure,
  formatQuillHtmlForExport,
  buildCleanOfferLetterHtml,
  buildOfferLetterDocumentModel
};

import { getDisplayString, normalizeGender, extractDateString } from 'ui-component/bos/BOSUtils';

const getSafeQuillEditor = (quillWrapper) => {
  if (!quillWrapper) return null;
  try {
    if (quillWrapper.editor) return quillWrapper.editor;
    if (typeof quillWrapper.getEditor === 'function') {
      return quillWrapper.getEditor();
    }
  } catch (err) {
    return null;
  }
  return null;
};

// ==============================|| DISPLAY HELPERS & STRING CONVERTERS ||============================== //

export { getDisplayString, normalizeGender, extractDateString };

// ==============================|| DYNAMIC FIELD CATALOG (VERIFIED) ||============================== //

export const VERIFIED_DYNAMIC_FIELDS = [
  // Candidate
  { label: 'Candidate Name', token: '{{candidateName}}', category: 'Candidate', icon: IconUser, desc: 'Full candidate or applicant name' },
  { label: 'Candidate First Name', token: '{{candidateFirstName}}', category: 'Candidate', icon: IconUser, desc: 'First name for personal salutations' },
  { label: 'Candidate ID / Code', token: '{{candidateId}}', category: 'Candidate', icon: IconUser, desc: 'Applicant code or employee code' },
  { label: 'Candidate Email', token: '{{candidateEmail}}', category: 'Candidate', icon: IconUser, desc: 'Personal or communication email' },
  { label: 'Candidate Mobile', token: '{{candidateMobile}}', category: 'Candidate', icon: IconUser, desc: 'Candidate contact phone number' },

  // Job
  { label: 'Designation', token: '{{designation}}', category: 'Job', icon: IconBriefcase, desc: 'Designation / job role title' },
  { label: 'Department', token: '{{department}}', category: 'Job', icon: IconBuildingSkyscraper, desc: 'Assigned organizational department' },
  { label: 'Employment Type', token: '{{employmentType}}', category: 'Job', icon: IconBriefcase, desc: 'Permanent / Probation / Contract' },
  { label: 'Work Location (Optional)', token: '{{workLocation}}', category: 'Job', icon: IconBuildingSkyscraper, desc: 'Optional plant / unit or branch office location' },
  { label: 'Reporting Manager', token: '{{reportingManager}}', category: 'Job', icon: IconUser, desc: 'Name of the reporting supervisor / HOD' },

  // Offer
  { label: 'Offer Document No', token: '{{offerNumber}}', category: 'Offer', icon: IconFileText, desc: 'Formal offer letter reference number' },
  { label: 'Offer Issue Date', token: '{{offerDate}}', category: 'Offer', icon: IconCalendar, desc: 'Date of offer letter issuance' },
  { label: 'Proposed Joining Date', token: '{{joiningDate}}', category: 'Offer', icon: IconCalendar, desc: 'Expected joining / reporting date' },
  { label: 'Probation Period', token: '{{probationPeriod}}', category: 'Offer', icon: IconCalendar, desc: 'Duration of initial probation' },
  { label: 'Offer Validity Days', token: '{{validityDays}}', category: 'Offer', icon: IconCalendar, desc: 'Acceptance validity in working days' },

  // Salary
  { label: 'Total Annual CTC', token: '{{annualCTC}}', category: 'Salary', icon: IconCashBanknote, desc: 'Total cost to company per annum' },
  { label: 'Gross Monthly Salary', token: '{{grossSalary}}', category: 'Salary', icon: IconCashBanknote, desc: 'Total monthly gross earnings' },
  { label: 'Basic Salary (Monthly)', token: '{{basicSalary}}', category: 'Salary', icon: IconCashBanknote, desc: 'Base wage component' },
  { label: 'House Rent Allowance (HRA)', token: '{{hra}}', category: 'Salary', icon: IconCashBanknote, desc: 'Monthly HRA entitlement' },
  { label: 'Special Allowance', token: '{{specialAllowance}}', category: 'Salary', icon: IconCashBanknote, desc: 'Monthly special / flexible allowance' },

  // Company
  { label: 'Company Name', token: '{{companyName}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Official registered company name' },
  { label: 'Company Address', token: '{{companyAddress}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Registered factory / corporate address' },
  { label: 'Company GSTIN', token: '{{companyGstin}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Tax identification number' },
  { label: 'Company Phone', token: '{{companyPhone}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Corporate helpline phone number' },
  { label: 'Company Email', token: '{{companyEmail}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Official HR communications email' },
  { label: 'Company Web', token: '{{companyWeb}}', category: 'Company', icon: IconBuildingSkyscraper, desc: 'Corporate website URL' },

  // Signatory
  { label: 'HR Signatory Name', token: '{{hrSignatoryName}}', category: 'Signatory', icon: IconSignature, desc: 'Name of the issuing HR executive' },
  { label: 'HR Signatory Designation', token: '{{hrSignatoryTitle}}', category: 'Signatory', icon: IconSignature, desc: 'Designation of the issuing HR executive' }
];

export const OFFER_LETTER_PLACEHOLDER_GROUPS = [
  {
    category: 'CANDIDATE DETAILS',
    keys: [
      { token: '{{candidateName}}', label: 'Candidate Name' },
      { token: '{{candidateFirstName}}', label: 'Candidate First Name' },
      { token: '{{candidateFullName}}', label: 'Candidate Full Name' },
      { token: '{{candidateEmail}}', label: 'Candidate Email' },
      { token: '{{candidateMobile}}', label: 'Candidate Mobile' }
    ]
  },
  {
    category: 'POSITION DETAILS',
    keys: [
      { token: '{{position}}', label: 'Position' },
      { token: '{{designation}}', label: 'Designation' },
      { token: '{{department}}', label: 'Department' },
      { token: '{{employmentType}}', label: 'Employment Type' },
      { token: '{{workLocation}}', label: 'Work Location' }
    ]
  },
  {
    category: 'COMPANY & HR DETAILS',
    keys: [
      { token: '{{companyName}}', label: 'Company Name' },
      { token: '{{companyAddress}}', label: 'Company Address' }
    ]
  },
  {
    category: 'PORTAL & VALIDITY',
    keys: [
      { token: '{{joiningDate}}', label: 'Proposed Joining Date' },
      { token: '{{probationPeriod}}', label: 'Probation Period' },
      { token: '{{validityDays}}', label: 'Validity Days' }
    ]
  }
];

// ==============================|| REUSABLE CLEAN REACT DOCUMENT RENDERER ||============================== //
/**
 * Pure presentation React component for rendering clean Offer Letters.
 */
export const OfferLetterDocumentRenderer = ({
  sections = DEFAULT_DOCUMENT_SECTIONS,
  candidateData = {},
  salaryData = {},
  companyData = {},
  signatoryData = {},
  dataMap = null,
  activeCompsList = [],
  localSalary = {},
  grossVal = 0,
  ctcVal = 0
}) => {
  const html = useMemo(() => {
    return buildCleanOfferLetterHtml({
      sections,
      candidateData,
      salaryData,
      companyData,
      signatoryData,
      dataMap,
      activeCompsList,
      localSalary,
      grossVal,
      ctcVal
    });
  }, [sections, candidateData, salaryData, companyData, signatoryData, dataMap, activeCompsList, localSalary, grossVal, ctcVal]);

  return (
    <Box
      sx={{
        width: 794,
        minHeight: 1123,
        bgcolor: '#ffffff',
        boxSizing: 'border-box'
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// ==============================|| MAIN OFFER LETTER DESIGNER COMPONENT ||============================== //
export default function OfferLetterDesigner({
  open = false,
  onClose,
  candidates = [],
  initialCandidate = null,
  initialSections = null,
  companyInfo = null,
  loggedInUser = null,
  localSalary = {},
  activeCompsList = [],
  grossVal = 0,
  ctcVal = 0,
  annualCtc = 0,
  totalCTC = 0,
  offerMetadata = {},
  onSaveOfferLetter,
  onSelectCandidate
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();

  // Document Flow State - initialized with per-offer initialSections or default sections
  const [sections, setSections] = useState(() => {
    if (initialSections && Array.isArray(initialSections) && initialSections.length > 0) {
      return initialSections;
    }
    try {
      const cached = localStorage.getItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          return parsed.sections;
        }
      }
    } catch (e) {}
    return DEFAULT_DOCUMENT_SECTIONS;
  });

  // Sync sections when designer opens or initialSections changes
  useEffect(() => {
    if (open) {
      if (initialSections && Array.isArray(initialSections) && initialSections.length > 0) {
        setSections(initialSections);
      } else {
        setSections(DEFAULT_DOCUMENT_SECTIONS);
      }
    }
  }, [open, initialSections]);
  const [activeSectionId, setActiveSectionId] = useState('sec_body');
  const [activeTab, setActiveTab] = useState(0); // 0: Sections, 1: Deleted
  const [rightPanelTab, setRightPanelTab] = useState(0); // 0: Dynamic Placeholders, 1: Section Properties
  const [searchToken, setSearchToken] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Live Candidate Selection State
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate || null);
  const [candidateContext, setCandidateContext] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [employeeTypesList, setEmployeeTypesList] = useState([]);
  const [fallbackCompanyInfo, setFallbackCompanyInfo] = useState(null);

  // Defensive fallback company profile fetch if not supplied via props
  useEffect(() => {
    if (open && (!companyInfo || Object.keys(companyInfo).length === 0) && !fallbackCompanyInfo) {
      axios.get('/api/company-profile/all', { skipGlobalAlert: true })
        .then((res) => {
          const profiles = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
          if (profiles.length > 0) {
            const activeName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
            const activeProf = profiles.find((c) => c.companyName === activeName) || profiles[0];
            const addressParts = [activeProf.address, activeProf.city, activeProf.state].filter(Boolean);
            const fullAddress = addressParts.join(', ') + (activeProf.pincode ? ` - ${activeProf.pincode}` : '');
            setFallbackCompanyInfo({
              companyName: activeProf.companyName || '',
              companyAddress: fullAddress || activeProf.address || '',
              companyGstin: activeProf.gstIn || '',
              companyPhone: activeProf.phoneNo || activeProf.mobileNo || '',
              companyEmail: activeProf.emailId || '',
              companyWeb: activeProf.website || '',
              companyLogo: activeProf.logoFileName ? getCompanyImageUrl(activeProf.logoFileName) : (activeProf.companyLogo || ''),
              logoFileName: activeProf.logoFileName || '',
              hrName: loggedInUser?.name || '',
              hrDesignation: loggedInUser?.designation || 'HR Manager'
            });
          }
        })
        .catch((e) => {
          console.warn('[OfferLetterDesigner] Failed to fetch fallback company profile', e);
        });
    }
  }, [open, companyInfo, fallbackCompanyInfo, loggedInUser]);

  const effectiveCompanyInfo = useMemo(() => {
    if (companyInfo && Object.keys(companyInfo).length > 0) return companyInfo;
    if (fallbackCompanyInfo && Object.keys(fallbackCompanyInfo).length > 0) return fallbackCompanyInfo;
    return {};
  }, [companyInfo, fallbackCompanyInfo]);

  // Dynamic Candidate Salary State in Designer
  const [designerSalary, setDesignerSalary] = useState(localSalary || {});
  const [designerCompsList, setDesignerCompsList] = useState(activeCompsList || []);
  const [designerGrossVal, setDesignerGrossVal] = useState(grossVal || 0);
  const [designerCtcVal, setDesignerCtcVal] = useState(ctcVal || 0);
  const [designerAnnualCtc, setDesignerAnnualCtc] = useState(annualCtc || totalCTC || (ctcVal ? ctcVal * 12 : 0));
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState(null);
  const salaryReqIdRef = useRef(0);
  const lastCandidateKeyRef = useRef(null);

  // Template Persistence State
  const [templateRecordId, setTemplateRecordId] = useState(null);
  const [templateCode, setTemplateCode] = useState('DEFAULT_OFFER_TEMPLATE');
  const [templateName, setTemplateName] = useState('Standard Executive Offer Letter');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Drag & Drop / Active Editor Ref
  const quillRefs = useRef({});
  const [draggedSectionIdx, setDraggedSectionIdx] = useState(null);
  const [dragOverSectionIdx, setDragOverSectionIdx] = useState(null);
  const [dragOverPlaceholderSecId, setDragOverPlaceholderSecId] = useState(null);

  // Undo / Redo History Engine
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const skipHistoryPushRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Canvas measurement for multi-page visual indicators
  const canvasRef = useRef(null);
  const [canvasHeight, setCanvasHeight] = useState(1123);

  // Inspector & Panel layout state
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Deleted Block Restore Bin
  const [deletedBlocks, setDeletedBlocks] = useState([]);

  // Drag Resize State (bottom-edge handle)
  const resizingRef = useRef({ active: false, sectionId: null, startY: 0, startH: 0 });
  const [resizingId, setResizingId] = useState(null);
  const [sectionLivePreviewMap, setSectionLivePreviewMap] = useState({});

  // Slash Commands / Suggestions State
  const [activeQuillSecId, setActiveQuillSecId] = useState('sec_body');
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionCoords, setSuggestionCoords] = useState({ top: 0, left: 0 });
  const [suggestionSelectedIndex, setSuggestionSelectedIndex] = useState(0);
  const [suggestionTriggerIndex, setSuggestionTriggerIndex] = useState(-1);

  const suggestionOpenRef = useRef(suggestionOpen);
  const suggestionSelectedIndexRef = useRef(suggestionSelectedIndex);
  const filteredSuggestionPlaceholdersRef = useRef([]);
  const suggestionTriggerIndexRef = useRef(-1);
  const suggestionQueryRef = useRef('');

  useEffect(() => { suggestionOpenRef.current = suggestionOpen; }, [suggestionOpen]);
  useEffect(() => { suggestionSelectedIndexRef.current = suggestionSelectedIndex; }, [suggestionSelectedIndex]);
  useEffect(() => { suggestionTriggerIndexRef.current = suggestionTriggerIndex; }, [suggestionTriggerIndex]);
  useEffect(() => { suggestionQueryRef.current = suggestionQuery; }, [suggestionQuery]);

  const allOfferPlaceholders = useMemo(() => {
    const list = [];
    OFFER_LETTER_PLACEHOLDER_GROUPS.forEach((group) => {
      group.keys.forEach((k) => {
        list.push({
          token: k.token,
          label: k.label,
          category: group.category
        });
      });
    });
    return list;
  }, []);

  const filteredSuggestionPlaceholders = useMemo(() => {
    if (!suggestionQuery) return allOfferPlaceholders;
    const q = suggestionQuery.toLowerCase();
    return allOfferPlaceholders.filter(
      (item) => item.label.toLowerCase().includes(q) || item.token.toLowerCase().includes(q)
    );
  }, [suggestionQuery, allOfferPlaceholders]);

  useEffect(() => {
    filteredSuggestionPlaceholdersRef.current = filteredSuggestionPlaceholders;
    setSuggestionSelectedIndex(0);
  }, [filteredSuggestionPlaceholders]);

  const insertSlashPlaceholder = useCallback((token) => {
    const secId = activeQuillSecId || activeSectionId || 'sec_body';
    const quillWrapper = quillRefs.current[secId];
    const quill = getSafeQuillEditor(quillWrapper);
    if (!quill) {
      setSuggestionOpen(false);
      return;
    }
    try {
      const range = quill.getSelection();
      if (!range) {
        setSuggestionOpen(false);
        return;
      }
      const cursorIndex = range.index;
      const triggerIdx = suggestionTriggerIndexRef.current;
      const lengthToReplace = cursorIndex - triggerIdx;
      if (triggerIdx >= 0 && lengthToReplace > 0) {
        quill.deleteText(triggerIdx, lengthToReplace, 'user');
        quill.insertText(triggerIdx, token, 'user');
        quill.setSelection(triggerIdx + token.length, 0, 'user');
        quill.focus();
      }
    } catch (_) {}
    setSuggestionOpen(false);
  }, [activeQuillSecId, activeSectionId]);

  // Handle slash detection across Quill instances
  useEffect(() => {
    if (!open) {
      setSuggestionOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const unsubs = [];

      Object.entries(quillRefs.current).forEach(([secId, quillWrapper]) => {
        const quill = getSafeQuillEditor(quillWrapper);
        if (!quill || typeof quill.on !== 'function') return;

        const checkSuggestions = () => {
          try {
            const range = quill.getSelection();
            if (!range || range.length > 0) {
              if (activeQuillSecId === secId) setSuggestionOpen(false);
              return;
            }

            const cursorIndex = range.index;
            const textBeforeCursor = quill.getText(0, cursorIndex);
            const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
            if (lastSlashIndex === -1) {
              if (activeQuillSecId === secId) setSuggestionOpen(false);
              return;
            }

            const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor.charAt(lastSlashIndex - 1) : ' ';
            const isValidTrigger = (lastSlashIndex === 0 || /\s/.test(charBeforeSlash));
            if (!isValidTrigger) {
              if (activeQuillSecId === secId) setSuggestionOpen(false);
              return;
            }

            const queryText = textBeforeCursor.substring(lastSlashIndex + 1);
            if (/\n/.test(queryText)) {
              if (activeQuillSecId === secId) setSuggestionOpen(false);
              return;
            }

            setActiveQuillSecId(secId);
            setSuggestionQuery(queryText);
            setSuggestionTriggerIndex(lastSlashIndex);

            const bounds = quill.getBounds(lastSlashIndex);
            const offsetTop = quill.container?.offsetTop || 0;
            const offsetLeft = quill.container?.offsetLeft || 0;

            setSuggestionCoords({
              left: bounds.left + offsetLeft,
              top: bounds.top + bounds.height + offsetTop + 4
            });
            setSuggestionOpen(true);
          } catch (err) {
            setSuggestionOpen(false);
          }
        };

        try {
          quill.on('text-change', checkSuggestions);
          quill.on('selection-change', checkSuggestions);

          unsubs.push(() => {
            try {
              quill.off('text-change', checkSuggestions);
              quill.off('selection-change', checkSuggestions);
            } catch (_) {}
          });
        } catch (_) {}
      });

      return () => {
        unsubs.forEach((unsub) => unsub());
      };
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [open, activeSectionId, sections, activeQuillSecId]);

  // Keyboard navigation for slash menu
  useEffect(() => {
    const handleSlashNav = (e) => {
      if (!suggestionOpenRef.current) return;
      const items = filteredSuggestionPlaceholdersRef.current;
      const count = items.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionSelectedIndex((prev) => (prev + 1) % (count || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionSelectedIndex((prev) => (prev - 1 + count) % (count || 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (count > 0 && suggestionSelectedIndexRef.current >= 0 && suggestionSelectedIndexRef.current < count) {
          e.preventDefault();
          e.stopPropagation();
          insertSlashPlaceholder(items[suggestionSelectedIndexRef.current].token);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionOpen(false);
      }
    };

    window.addEventListener('keydown', handleSlashNav, true);
    return () => window.removeEventListener('keydown', handleSlashNav, true);
  }, [insertSlashPlaceholder]);

  // Update selectedCandidate when initialCandidate prop updates
  useEffect(() => {
    if (initialCandidate) {
      setSelectedCandidate(initialCandidate);
    }
  }, [initialCandidate]);

  // Synchronize salary state when parent passes calculated salary props
  useEffect(() => {
    if (localSalary && Object.keys(localSalary).length > 0) {
      setDesignerSalary(localSalary);
    }
    if (activeCompsList && activeCompsList.length > 0) {
      setDesignerCompsList(activeCompsList);
    }
    if (grossVal > 0) setDesignerGrossVal(grossVal);
    if (ctcVal > 0) setDesignerCtcVal(ctcVal);
    if (annualCtc > 0 || totalCTC > 0) {
      setDesignerAnnualCtc(annualCtc || totalCTC);
    } else if (ctcVal > 0) {
      setDesignerAnnualCtc(ctcVal * 12);
    }
  }, [localSalary, activeCompsList, grossVal, ctcVal, annualCtc, totalCTC]);

  // Load Department, Designation and Employee Type Masters for mapping IDs and Signature configuration
  useEffect(() => {
    if (open) {
      axios
        .get('/api/master/hr/departments')
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
          setDepartmentsList(list);
        })
        .catch(() => {});

      axios
        .get('/api/master/hr/designations')
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
          setDesignationsList(list);
        })
        .catch(() => {});

      axios
        .get('/api/master/hr/employee-types')
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
          setEmployeeTypesList(list);
        })
        .catch(() => {});
    }
  }, [open]);

  const updateSectionContent = useCallback((secId, contentUpdates) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? { ...s, content: { ...(s.content || {}), ...contentUpdates } }
          : s
      )
    );
  }, []);

  const deptMasterMap = useMemo(() => {
    const map = new Map();
    departmentsList.forEach((d) => {
      if (d && (d.id || d.departmentCode)) {
        map.set(String(d.id), d.departmentName || d.name);
        if (d.departmentCode) map.set(String(d.departmentCode), d.departmentName || d.name);
      }
    });
    return map;
  }, [departmentsList]);

  const empTypeMasterMap = useMemo(() => {
    const map = new Map();
    employeeTypesList.forEach((t) => {
      if (t && (t.id || t.typeCode)) {
        const name = t.typeName || t.name || t.type_name || '';
        if (t.id) map.set(String(t.id), name);
        if (t.typeCode) map.set(String(t.typeCode), name);
      }
    });
    return map;
  }, [employeeTypesList]);

  // Load Candidate Salary dynamically with deep fetching, level resolution, race condition protection & guaranteed finally cleanup
  const loadCandidateSalary = useCallback(
    async (cand) => {
      if (!cand) {
        setSalaryLoading(false);
        setSalaryError(null);
        return;
      }

      const candId = cand.id || cand.applicantId || cand.employeeId;
      const isEmployee = cand.sourceTag === 'Employee' || cand.sourceType === 'Employee';
      const candKey = `${isEmployee ? 'EMP' : 'ATS'}_${candId}`;

      // If parent provided localSalary for this candidate, use parent's authoritative salary directly!
      const isInitial = initialCandidate && String(initialCandidate.id || initialCandidate.applicantId || initialCandidate.employeeId) === String(candId);
      const parentHasSalary = localSalary && typeof localSalary === 'object' && Object.keys(localSalary).some(k => !['providentFund', 'esiAllowed', 'professionalTax'].includes(k) && parseFloat(localSalary[k]) > 0);

      if (isInitial && parentHasSalary) {
        setDesignerSalary(localSalary);
        if (activeCompsList && activeCompsList.length > 0) {
          setDesignerCompsList(activeCompsList);
        }
        setDesignerGrossVal(grossVal || 0);
        setDesignerCtcVal(ctcVal || 0);
        setDesignerAnnualCtc(annualCtc || totalCTC || (ctcVal ? ctcVal * 12 : 0));
        setCandidateContext(cand);
        lastCandidateKeyRef.current = candKey;
        setSalaryLoading(false);
        setSalaryError(null);
        return;
      }

      const reqId = ++salaryReqIdRef.current;
      setSalaryLoading(true);
      setSalaryError(null);

      // Clear stale candidate context
      setCandidateContext(null);
      setDesignerSalary({});
      setDesignerGrossVal(0);
      setDesignerCtcVal(0);
      setDesignerAnnualCtc(0);

      try {
        let fullData = { ...cand };

        if (candId) {
          if (isEmployee) {
            try {
              const { data: empData } = await axios.get(`/api/master/hr/employees/${candId}`);
              if (empData) fullData = { ...fullData, ...empData };
            } catch (_) {}
          } else {
            try {
              const { data: appData } = await axios.get(`/api/hra/applicants/${candId}`);
              if (appData) fullData = { ...fullData, ...appData };
            } catch (_) {}
          }
        }

        // Dynamically resolve employmentType from candidate / employee details
        let resolvedEmpType = '';
        const jobObj = fullData.jobProfile || fullData.job || fullData.jobDetails || {};
        const orgObj = fullData.organization || {};

        if (fullData.employmentType) {
          resolvedEmpType = typeof fullData.employmentType === 'object' ? (fullData.employmentType.typeName || fullData.employmentType.name || fullData.employmentType.type_name) : fullData.employmentType;
        } else if (fullData.employeeType) {
          resolvedEmpType = typeof fullData.employeeType === 'object' ? (fullData.employeeType.typeName || fullData.employeeType.name || fullData.employeeType.type_name) : fullData.employeeType;
        } else if (jobObj.employmentType) {
          resolvedEmpType = typeof jobObj.employmentType === 'object' ? (jobObj.employmentType.typeName || jobObj.employmentType.name || jobObj.employmentType.type_name) : jobObj.employmentType;
        } else if (jobObj.employeeType) {
          resolvedEmpType = typeof jobObj.employeeType === 'object' ? (jobObj.employeeType.typeName || jobObj.employeeType.name || jobObj.employeeType.type_name) : jobObj.employeeType;
        } else if (orgObj.employmentType) {
          resolvedEmpType = typeof orgObj.employmentType === 'object' ? (orgObj.employmentType.typeName || orgObj.employmentType.name || orgObj.employmentType.type_name) : orgObj.employmentType;
        } else if (orgObj.employeeType) {
          resolvedEmpType = typeof orgObj.employeeType === 'object' ? (orgObj.employeeType.typeName || orgObj.employeeType.name || orgObj.employeeType.type_name) : orgObj.employeeType;
        }

        const targetTypeId = fullData.employeeTypeId || cand.employeeTypeId || jobObj.employeeTypeId || orgObj.employeeTypeId || fullData.employmentTypeId || jobObj.employmentTypeId;
        if (!resolvedEmpType && targetTypeId) {
          if (empTypeMasterMap && empTypeMasterMap.has(String(targetTypeId))) {
            resolvedEmpType = empTypeMasterMap.get(String(targetTypeId));
          } else {
            try {
              const { data: singleType } = await axios.get(`/api/master/hr/employee-types/${targetTypeId}`);
              if (singleType) {
                resolvedEmpType = singleType.typeName || singleType.name || singleType.type_name || '';
              }
            } catch (_) {}
          }
        }

        if (!resolvedEmpType) {
          resolvedEmpType = fullData.empType || fullData.jobType || fullData.engagementType || fullData.hiringType || cand.employmentType || cand.employeeType || '';
        }
        fullData.employmentType = getDisplayString(resolvedEmpType);
        fullData.employeeType = getDisplayString(resolvedEmpType);

        if (reqId !== salaryReqIdRef.current) return;
        setCandidateContext(fullData);

        // Fetch payroll components for this candidate / employee
        let compsList = [];
        if (candId || fullData.employmentType || fullData.employeeType) {
          try {
            const empTypeParam = fullData.employmentType || fullData.employeeType ? `?employeeType=${encodeURIComponent(getDisplayString(fullData.employmentType || fullData.employeeType))}` : '';
            const { data } = await axios.get(`/api/master/hr/employees/${candId || 0}/payroll-components${empTypeParam}`);
            compsList = Array.isArray(data) ? data.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
          } catch (_) {}
        }

        if (compsList.length === 0 && activeCompsList && activeCompsList.length > 0) {
          compsList = activeCompsList;
        }

        if (compsList.length === 0) {
          try {
            const { data } = await axios.get('/api/payroll/components');
            compsList = Array.isArray(data)
              ? data.filter((c) => c.isActive !== false).sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0))
              : [];
          } catch (_) {}
        }

        if (reqId !== salaryReqIdRef.current) return;
        setDesignerCompsList(compsList);

        // Build candidate's salary map
        const initialMap = {};

        if (fullData.salaryComponents) {
          try {
            const sc = typeof fullData.salaryComponents === 'string' ? JSON.parse(fullData.salaryComponents) : fullData.salaryComponents;
            if (sc && typeof sc === 'object') Object.assign(initialMap, sc);
          } catch (_) {}
        }

        const candBasic = fullData.basicPay || fullData.basic || fullData.basicSalary;
        const candHra = fullData.hraPay || fullData.hra;
        const candDa = fullData.daPay || fullData.da;
        const candSpl = fullData.specialAllowance || fullData.splAllowance || fullData.specialPay;
        const candBonus = fullData.bonusPay || fullData.statutoryBonus;

        if (candBasic && !initialMap.BASIC) initialMap.BASIC = String(candBasic);
        if (candHra && !initialMap.HRA) initialMap.HRA = String(candHra);
        if (candDa && !initialMap.DA) initialMap.DA = String(candDa);
        if (candSpl && !initialMap.SPECIAL_ALLOWANCE) initialMap.SPECIAL_ALLOWANCE = String(candSpl);
        if (candBonus && !initialMap.STATUTORY_BONUS) initialMap.STATUTORY_BONUS = String(candBonus);

        // Fill from component amounts
        compsList.forEach((c) => {
          const code = c.componentCode;
          if (initialMap[code] === undefined) {
            if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
              initialMap[code] = parseFloat(c.amount).toFixed(2);
            } else if (c.calculationType === 'FIXED') {
              initialMap[code] = parseFloat(c.calculationValue || 0).toFixed(2);
            } else {
              initialMap[code] = '0.00';
            }
          }
        });

        // Ingest passed localSalary ONLY if this is the initial candidate
        if (isInitial && localSalary && typeof localSalary === 'object' && Object.keys(localSalary).length > 0) {
          Object.assign(initialMap, localSalary);
        }

        // If manual basic/hra are still 0, auto-match from designation levels
        const isManualAllZero = (!initialMap.BASIC || parseFloat(initialMap.BASIC) === 0) && (!initialMap.HRA || parseFloat(initialMap.HRA) === 0);
        if (isManualAllZero) {
          try {
            const { data: designationLevels } = await axios.get('/api/master/hr/designation-levels');
            const levelsList = Array.isArray(designationLevels) ? designationLevels : [];
            let matchedLevel = null;
            if (fullData.empLevelId) {
              matchedLevel = levelsList.find(l => String(l.rowId || l.id) === String(fullData.empLevelId) || l.level === fullData.empLevelId);
            }
            if (!matchedLevel && fullData.grade) {
              matchedLevel = levelsList.find(l => String(l.level || '').trim().toUpperCase() === String(fullData.grade).trim().toUpperCase() || String(l.rowId || l.id) === String(fullData.grade));
            }
            if (!matchedLevel && (fullData.designationName || fullData.designation)) {
              const desigName = fullData.designationName || fullData.designation;
              try {
                const { data: desigData } = await axios.get('/api/master/hr/designations');
                const dList = Array.isArray(desigData) ? desigData : [];
                const desigObj = dList.find(d => String(d.designationName || d.name || '').trim().toUpperCase() === String(desigName).trim().toUpperCase());
                if (desigObj && (desigObj.subCategoryLevel || desigObj.level)) {
                  const targetLvl = desigObj.subCategoryLevel || desigObj.level;
                  matchedLevel = levelsList.find(l => l.level === targetLvl || String(l.rowId || l.id) === String(targetLvl));
                }
              } catch (_) {}
            }
            if (matchedLevel) {
              if (matchedLevel.basic) initialMap.BASIC = String(matchedLevel.basic);
              if (matchedLevel.hra) initialMap.HRA = String(matchedLevel.hra);
              if (matchedLevel.da) initialMap.DA = String(matchedLevel.da);
            }
          } catch (_) {}
        }

        if (fullData.providentFund !== undefined && fullData.providentFund !== null) {
          initialMap.providentFund = fullData.providentFund === 'YES' || fullData.providentFund === true || String(fullData.providentFund) === '1' || String(fullData.providentFund).toLowerCase() === 'true';
        }
        if (fullData.esiAllowed !== undefined && fullData.esiAllowed !== null) {
          initialMap.esiAllowed = fullData.esiAllowed === 'YES' || fullData.esiAllowed === true || String(fullData.esiAllowed) === '1' || String(fullData.esiAllowed).toLowerCase() === 'true';
        }
        if (fullData.professionalTax !== undefined && fullData.professionalTax !== null) {
          initialMap.professionalTax = fullData.professionalTax === 'YES' || fullData.professionalTax === true || String(fullData.professionalTax) === '1' || String(fullData.professionalTax).toLowerCase() === 'true';
        }

        if (initialMap.providentFund === undefined) initialMap.providentFund = true;
        if (initialMap.esiAllowed === undefined) initialMap.esiAllowed = true;
        if (initialMap.professionalTax === undefined) initialMap.professionalTax = true;

        const targetGross = (isInitial && grossVal) ? grossVal : (fullData.grossSalary || cand.grossSalary || cand.gross || fullData.gross || (fullData.salary && fullData.salary.grossSalary) || (fullData.jobProfile && fullData.jobProfile.grossSalary) || undefined);
        const evaluated = reevaluateAndBalanceComponents(initialMap, compsList, null, targetGross);

        if (reqId !== salaryReqIdRef.current) return;

        setDesignerSalary(evaluated);

        const isPFEnabled = evaluated.providentFund === undefined || evaluated.providentFund === null || evaluated.providentFund === true || String(evaluated.providentFund) === '1' || String(evaluated.providentFund).toLowerCase() === 'true' || evaluated.providentFund === 'YES';
        const isESIEnabled = evaluated.esiAllowed === undefined || evaluated.esiAllowed === null || evaluated.esiAllowed === true || String(evaluated.esiAllowed) === '1' || String(evaluated.esiAllowed).toLowerCase() === 'true' || evaluated.esiAllowed === 'YES';
        const isPTaxEnabled = evaluated.professionalTax === undefined || evaluated.professionalTax === null || evaluated.professionalTax === true || String(evaluated.professionalTax) === '1' || String(evaluated.professionalTax).toLowerCase() === 'true' || evaluated.professionalTax === 'YES';

        const localFilter = (c) => {
          const cc = (c.componentCode || '').toUpperCase();
          const cn = (c.displayName || c.componentName || '').toUpperCase();
          if ((cc.includes('PF') || cn.includes('PF') || cn.includes('PROVIDENT')) && !isPFEnabled) return false;
          if ((cc.includes('ESI') || cn.includes('ESI')) && !isESIEnabled) return false;
          if ((cc.includes('PT') || cc.includes('PROF_TAX') || cc.includes('PROFESSIONAL_TAX') || cn.includes('PTAX') || cn.includes('PROFESSIONAL TAX') || cn.includes('PROF. TAX')) && !isPTaxEnabled) return false;
          return true;
        };

        const isShowInReg = (c) => c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1' || c.showInRegister === undefined;

        const earns = compsList.filter(
          (c) => (c.componentType || '').toUpperCase() === 'EARNING' &&
            c.componentCode !== 'GROSS' &&
            c.componentCode !== 'NET_SALARY' &&
            c.componentCode !== 'EARNING' &&
            c.componentCode !== 'TOTAL_EARNING' &&
            c.componentCode !== 'TOTAL_DEDUCTIONS' &&
            isShowInReg(c) &&
            localFilter(c)
        );

        const contribs = compsList.filter(
          (c) => (c.componentType || '').toUpperCase() === 'EMPLOYER_CONTRIBUTION' &&
            isShowInReg(c) &&
            localFilter(c)
        );

        const g = (isInitial && grossVal) ? grossVal : earns.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (parseFloat(evaluated[c.componentCode]) || 0), 0);
        const c = contribs.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, comp) => s + (parseFloat(evaluated[comp.componentCode]) || 0), 0);

        const monthlyTotal = (isInitial && ctcVal) ? ctcVal : (g + c);
        const annualTotal = (isInitial && (annualCtc || totalCTC)) ? (annualCtc || totalCTC) : (monthlyTotal * 12);

        setDesignerGrossVal(g);
        setDesignerCtcVal(monthlyTotal);
        setDesignerAnnualCtc(annualTotal);
        setSalaryError(null);
        lastCandidateKeyRef.current = candKey;
      } catch (err) {
        if (reqId === salaryReqIdRef.current) {
          console.warn('Could not load candidate salary for designer', err);
          setSalaryError('Unable to load salary structure. Please try again.');
        }
      } finally {
        if (reqId === salaryReqIdRef.current) {
          setSalaryLoading(false);
        }
      }
    },
    [localSalary, activeCompsList, grossVal, ctcVal, annualCtc, totalCTC, initialCandidate, empTypeMasterMap]
  );

  const currentCandId = selectedCandidate?.id || selectedCandidate?.applicantId || selectedCandidate?.employeeId || null;
  const currentCandSource = selectedCandidate?.sourceTag || selectedCandidate?.sourceType || '';

  useEffect(() => {
    if (selectedCandidate && currentCandId) {
      const key = `${currentCandSource}_${currentCandId}`;
      const isInitial = initialCandidate && String(initialCandidate.id || initialCandidate.applicantId || initialCandidate.employeeId) === String(currentCandId);
      const parentHasSalary = localSalary && typeof localSalary === 'object' && Object.keys(localSalary).some(k => !['providentFund', 'esiAllowed', 'professionalTax'].includes(k) && parseFloat(localSalary[k]) > 0);

      if (isInitial && parentHasSalary) {
        lastCandidateKeyRef.current = key;
        setDesignerSalary(localSalary);
        if (activeCompsList && activeCompsList.length > 0) {
          setDesignerCompsList(activeCompsList);
        }
        setDesignerGrossVal(grossVal || 0);
        setDesignerCtcVal(ctcVal || 0);
        setSalaryLoading(false);
        return;
      }

      if (lastCandidateKeyRef.current !== key) {
        loadCandidateSalary(selectedCandidate);
      }
    } else {
      setSalaryLoading(false);
    }
  }, [currentCandId, currentCandSource, selectedCandidate, initialCandidate, localSalary, activeCompsList, grossVal, ctcVal, loadCandidateSalary]);

  // Fetch default Salutation body from ATS Email Content Master (OFFER LETTER type)
  // This populates sec_body only when no saved template overrides it.
  const fetchAtsOfferContent = useCallback(async () => {
    try {
      const res = await axios.get('/api/hr/email-content/by-type?type=' + encodeURIComponent('OFFER LETTER'));
      const item = Array.isArray(res.data) ? res.data[0] : res.data;
      if (item && (item.bodyContent || item.body || item.templateBody)) {
        const atsBody = item.bodyContent || item.body || item.templateBody || '';
        if (atsBody.trim()) {
          setSections((prev) =>
            prev.map((s) => {
              if (s.id === 'sec_body' && s.type === 'salutation_body') {
                // Only replace if still using the hardcoded default content
                const defaultSnippet = 'We are pleased to offer you';
                const currentHtml = s.content?.html || '';
                const isDefault = currentHtml.includes(defaultSnippet);
                if (isDefault) {
                  return { ...s, content: { ...s.content, html: atsBody } };
                }
              }
              return s;
            })
          );
        }
      }
    } catch (err) {
      // ATS Email Content not available — default hardcoded salutation remains
    }
  }, []);

  // Load Saved Template from Backend
  const loadSavedTemplate = useCallback(async () => {
    try {
      const res = await axios.get('/api/hra/letters?type=OFFER_TEMPLATE');
      const templates = Array.isArray(res.data) ? res.data : [];
      if (templates.length > 0) {
        // Sort descending to get the most recently saved template record
        const sorted = [...templates].sort((a, b) => (b.id || 0) - (a.id || 0));
        const activeTpl = sorted[0];
        if (activeTpl) {
          if (activeTpl.id) {
            setTemplateRecordId(activeTpl.id);
          }
          if (activeTpl.formData) {
            try {
              const parsed = typeof activeTpl.formData === 'string' ? JSON.parse(activeTpl.formData) : activeTpl.formData;
              if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
                const cleanSections = parsed.sections
                  .filter(
                    (s) =>
                      s.id !== 'sec_terms' &&
                      s.type !== 'terms_conditions' &&
                      s.id !== 'sec_meta' &&
                      s.type !== 'offer_meta' &&
                      s.id !== 'sec_job' &&
                      s.type !== 'job_card'
                  )
                  .map((s) => ({
                    ...s,
                    title: s.title || (s.id === 'sec_header' ? 'Company Header & Document Details' : s.title),
                    sectionWidth: s.sectionWidth !== undefined ? Number(s.sectionWidth) : 100,
                    sectionMinHeight: s.sectionMinHeight !== undefined ? Number(s.sectionMinHeight) : 0
                  }));
                const finalSections = cleanSections.length > 0 ? cleanSections : parsed.sections;
                setSections(finalSections);
                if (parsed.templateName) setTemplateName(parsed.templateName);
                if (parsed.templateCode) setTemplateCode(parsed.templateCode);
                try {
                  localStorage.setItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE', JSON.stringify({
                    templateName: parsed.templateName || 'Standard Executive Offer Letter',
                    templateCode: parsed.templateCode || 'DEFAULT_OFFER_TEMPLATE',
                    sections: finalSections,
                    templateRecordId: activeTpl.id
                  }));
                } catch (e) {}
                return; // Successfully loaded custom saved template
              }
            } catch (e) {
              console.error('Failed to parse saved offer template formData', e);
            }
          }
        }
      }
      // Check local cache if server returned no records
      try {
        const cached = localStorage.getItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            setSections(parsed.sections);
            if (parsed.templateName) setTemplateName(parsed.templateName);
            if (parsed.templateCode) setTemplateCode(parsed.templateCode);
            if (parsed.templateRecordId) setTemplateRecordId(parsed.templateRecordId);
            return;
          }
        }
      } catch (e) {}
      // Fallback: Fetch ATS default salutation only if no saved template exists
      fetchAtsOfferContent();
    } catch (err) {
      console.warn('No custom template loaded from server; using local/default template.', err);
      try {
        const cached = localStorage.getItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            setSections(parsed.sections);
            return;
          }
        }
      } catch (e) {}
      fetchAtsOfferContent();
    }
  }, [fetchAtsOfferContent]);

  useEffect(() => {
    if (open) {
      loadSavedTemplate();
    }
  }, [open, loadSavedTemplate]);

  // Live Data Map
  const liveDataMap = useMemo(() => {
    const isSelectedInitial = !selectedCandidate || (initialCandidate && String(selectedCandidate?.id || selectedCandidate?.applicantId || selectedCandidate?.employeeId) === String(initialCandidate?.id || initialCandidate?.applicantId || initialCandidate?.employeeId));

    const activeCand = candidateContext || selectedCandidate || initialCandidate || {};
    const rawDept = activeCand?.department || activeCand?.departmentName || activeCand?.departmentCode || (isSelectedInitial ? offerMetadata.department : '') || '';
    const resolvedDept = deptMasterMap.get(String(rawDept)) || getDisplayString(rawDept) || '';

    const resolvedMobile = cleanMobileNumber(
      activeCand?.mobileNo ||
      activeCand?.mobile ||
      activeCand?.phone ||
      activeCand?.phoneNo ||
      activeCand?.contactNo ||
      activeCand?.contactNumber ||
      activeCand?.phoneNumber ||
      activeCand?.mobileNumber ||
      activeCand?.applicantMobile ||
      activeCand?.candidateMobile ||
      activeCand?.primaryContact ||
      activeCand?.communicationNumber ||
      activeCand?.cellPhone ||
      (activeCand?.personal && (activeCand.personal.mobileNo || activeCand.personal.mobile || activeCand.personal.phone)) ||
      (activeCand?.personalDetail && (activeCand.personalDetail.mobileNo || activeCand.personalDetail.mobile || activeCand.personalDetail.phone)) ||
      (activeCand?.personalDetails && (activeCand.personalDetails.mobileNo || activeCand.personalDetails.mobile || activeCand.personalDetails.phone)) ||
      (isSelectedInitial ? offerMetadata.phone : '') ||
      ''
    );

    let dynamicEmpType = '';
    const candJob = activeCand?.jobProfile || activeCand?.job || activeCand?.jobDetails || {};
    const candOrg = activeCand?.organization || {};

    if (activeCand?.employmentType) {
      dynamicEmpType = typeof activeCand.employmentType === 'object' ? (activeCand.employmentType.typeName || activeCand.employmentType.name || activeCand.employmentType.type_name) : activeCand.employmentType;
    } else if (activeCand?.employeeType) {
      dynamicEmpType = typeof activeCand.employeeType === 'object' ? (activeCand.employeeType.typeName || activeCand.employeeType.name || activeCand.employeeType.type_name) : activeCand.employeeType;
    } else if (candJob.employmentType) {
      dynamicEmpType = typeof candJob.employmentType === 'object' ? (candJob.employmentType.typeName || candJob.employmentType.name || candJob.employmentType.type_name) : candJob.employmentType;
    } else if (candJob.employeeType) {
      dynamicEmpType = typeof candJob.employeeType === 'object' ? (candJob.employeeType.typeName || candJob.employeeType.name || candJob.employeeType.type_name) : candJob.employeeType;
    } else if (candOrg.employmentType) {
      dynamicEmpType = typeof candOrg.employmentType === 'object' ? (candOrg.employmentType.typeName || candOrg.employmentType.name || candOrg.employmentType.type_name) : candOrg.employmentType;
    } else if (candOrg.employeeType) {
      dynamicEmpType = typeof candOrg.employeeType === 'object' ? (candOrg.employeeType.typeName || candOrg.employeeType.name || candOrg.employeeType.type_name) : candOrg.employeeType;
    } else if (isSelectedInitial && offerMetadata.employmentType) {
      dynamicEmpType = offerMetadata.employmentType;
    }

    const tId = activeCand?.employeeTypeId || candJob.employeeTypeId || candOrg.employeeTypeId || activeCand?.employmentTypeId;
    if (!dynamicEmpType && tId && empTypeMasterMap && empTypeMasterMap.has(String(tId))) {
      dynamicEmpType = empTypeMasterMap.get(String(tId));
    }
    if (!dynamicEmpType) {
      dynamicEmpType = activeCand?.empType || activeCand?.jobType || activeCand?.engagementType || activeCand?.hiringType || '';
    }
    dynamicEmpType = getDisplayString(dynamicEmpType);

    const candidateDataObj = {
      ...(activeCand || {}),
      candidateName: activeCand?.candidateName || activeCand?.applicantName || activeCand?.employeeName || activeCand?.name || (isSelectedInitial ? offerMetadata.candidateName : ''),
      applicantCode: activeCand?.applicantCode || activeCand?.employeeCode || activeCand?.candidateCode || activeCand?.empCode || (isSelectedInitial ? offerMetadata.candidateCode : ''),
      designation: activeCand?.designation || activeCand?.designationName || activeCand?.positionLookFor || activeCand?.position || activeCand?.appliedRole || (isSelectedInitial ? offerMetadata.designation : ''),
      department: resolvedDept || activeCand?.department || activeCand?.departmentName || (isSelectedInitial ? offerMetadata.department : ''),
      phone: resolvedMobile || (isSelectedInitial ? offerMetadata.phone : '') || activeCand?.mobileNo || '',
      mobileNo: resolvedMobile || (isSelectedInitial ? offerMetadata.phone : '') || activeCand?.mobileNo || '',
      mobile: resolvedMobile || (isSelectedInitial ? offerMetadata.phone : '') || activeCand?.mobileNo || '',
      email: resolveCandidateEmail(activeCand) || (isSelectedInitial ? offerMetadata.email : '') || '',
      employmentType: dynamicEmpType || (isSelectedInitial ? offerMetadata.employmentType : ''),
      employeeType: dynamicEmpType || (isSelectedInitial ? offerMetadata.employmentType : ''),
      grade: activeCand?.grade || (isSelectedInitial ? offerMetadata.grade : ''),
      workLocation: activeCand?.workLocation || activeCand?.location || activeCand?.locationName || activeCand?.plantLocation || activeCand?.placeOfPosting || activeCand?.facility || (isSelectedInitial ? offerMetadata.workLocation : ''),
      offerLetterNo: (isSelectedInitial ? offerMetadata.offerLetterNo : '') || activeCand?.offerLetterNo,
      refNo: (isSelectedInitial ? offerMetadata.refNo : '') || activeCand?.refNo,
      offerDate: (isSelectedInitial ? offerMetadata.offerDate : '') || activeCand?.offerDate,
      joiningDate: (isSelectedInitial ? offerMetadata.joiningDate : '') || activeCand?.joiningDate,
      probationPeriod: (isSelectedInitial ? offerMetadata.probationPeriod : '') || activeCand?.probationPeriod
    };

    return resolveOfferDataMap({
      candidateData: candidateDataObj,
      companyData: effectiveCompanyInfo || {},
      signatoryData: {
        hrName: loggedInUser?.name || loggedInUser?.employeeName || effectiveCompanyInfo?.hrName || '',
        hrDesignation: loggedInUser?.designation || loggedInUser?.designationName || effectiveCompanyInfo?.hrDesignation || 'HR Manager'
      },
      salaryData: {
        gross: designerGrossVal || grossVal,
        ctc: designerCtcVal || ctcVal
      },
      localSalary: designerSalary,
      grossVal: designerGrossVal || grossVal,
      ctcVal: designerCtcVal || ctcVal
    });
  }, [candidateContext, selectedCandidate, initialCandidate, effectiveCompanyInfo, loggedInUser, designerSalary, designerGrossVal, designerCtcVal, grossVal, ctcVal, offerMetadata, deptMasterMap, empTypeMasterMap]);

  const substituteTokens = useCallback((text) => substituteOfferTokens(text, liveDataMap), [liveDataMap]);

  // ==============================|| UNDO / REDO ENGINE ||============================== //

  useEffect(() => {
    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }
    const snapshot = JSON.stringify(sections);
    if (historyRef.current.length === 0 || snapshot !== historyRef.current[historyIdxRef.current]) {
      historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 50) historyRef.current.shift();
      historyIdxRef.current = historyRef.current.length - 1;
      setCanUndo(historyIdxRef.current > 0);
      setCanRedo(false);
    }
  }, [sections]);

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      skipHistoryPushRef.current = true;
      historyIdxRef.current--;
      setSections(JSON.parse(historyRef.current[historyIdxRef.current]));
      setCanUndo(historyIdxRef.current > 0);
      setCanRedo(true);
      enqueueSnackbar('Undone last change', { variant: 'info' });
    }
  }, [enqueueSnackbar]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      skipHistoryPushRef.current = true;
      historyIdxRef.current++;
      setSections(JSON.parse(historyRef.current[historyIdxRef.current]));
      setCanUndo(true);
      setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
      enqueueSnackbar('Redone change', { variant: 'info' });
    }
  }, [enqueueSnackbar]);

  // ResizeObserver: track canvas height for page break indicators
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setCanvasHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  // Bottom-edge drag resize: global mouse handlers
  useEffect(() => {
    if (!open) return;

    const onMouseMove = (e) => {
      const r = resizingRef.current;
      if (!r.active) return;
      const deltaY = e.clientY - r.startY;
      const newH = Math.max(40, r.startH + deltaY);
      // Live preview: directly update the DOM element for smoothness
      const el = document.getElementById(`section-resize-target-${r.sectionId}`);
      if (el) el.style.minHeight = `${newH}px`;
    };

    const onMouseUp = (e) => {
      const r = resizingRef.current;
      if (!r.active) return;
      const deltaY = e.clientY - r.startY;
      const newH = Math.max(40, r.startH + deltaY);
      // Commit to state
      setSections((prev) =>
        prev.map((s) => (s.id === r.sectionId ? { ...s, sectionMinHeight: newH } : s))
      );
      resizingRef.current = { active: false, sectionId: null, startY: 0, startH: 0 };
      setResizingId(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [open]);

  const handleResizeStart = useCallback((e, sec) => {
    e.stopPropagation();
    e.preventDefault();
    const el = document.getElementById(`section-resize-target-${sec.id}`);
    const startH = el ? el.getBoundingClientRect().height : (sec.sectionMinHeight || 40);
    resizingRef.current = { active: true, sectionId: sec.id, startY: e.clientY, startH };
    setResizingId(sec.id);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Section Handlers
  const handleUpdateSectionContent = (sectionId, field, val) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, content: { ...sec.content, [field]: val } } : sec))
    );
  };

  const handleToggleSectionEnabled = (sectionId) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec))
    );
  };

  const handleMoveSection = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    setSections((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const handleDuplicateSection = (index) => {
    const target = sections[index];
    if (!target) return;
    const newSection = {
      ...target,
      id: `sec_custom_${Date.now()}`,
      title: `${target.title} (Copy)`,
      order: index + 2,
      deletable: true
    };
    setSections((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newSection);
      return copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
    enqueueSnackbar(`Duplicated section "${target.title}"`, { variant: 'info' });
  };

  const handleDeleteSection = (sectionId) => {
    const target = sections.find((s) => s.id === sectionId);
    if (target) {
      setDeletedBlocks((prev) => [
        { ...target, deletedAt: Date.now() },
        ...prev.filter((b) => b.id !== sectionId)
      ]);
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId).map((s, idx) => ({ ...s, order: idx + 1 })));
    enqueueSnackbar('Section removed — restore it from the Deleted Blocks tab', { variant: 'warning' });
  };

  const handleRestoreSection = (block) => {
    const restored = { ...block, deletedAt: undefined };
    setSections((prev) => [...prev, restored].map((s, idx) => ({ ...s, order: idx + 1 })));
    setDeletedBlocks((prev) => prev.filter((b) => b.id !== block.id));
    setActiveSectionId(block.id);
    enqueueSnackbar(`Restored "${block.title}" to the document`, { variant: 'success' });
  };

  const handleAddCustomSection = () => {
    const newId = `sec_custom_${Date.now()}`;
    const newSection = {
      id: newId,
      type: 'custom_rich_text',
      title: `Custom Policy / Clause ${sections.length + 1}`,
      enabled: true,
      order: sections.length + 1,
      deletable: true,
      sectionWidth: 100,
      sectionMinHeight: 0,
      content: {
        html: '<p><strong>Custom Clause Heading:</strong></p><p>Insert your custom terms, conditions, bonus clauses, or relocation details here.</p>'
      }
    };
    setSections((prev) => [...prev, newSection]);
    setActiveSectionId(newId);
    enqueueSnackbar('Added new custom rich-text section', { variant: 'success' });
  };

  const handleResetToDefault = () => {
    setSections(DEFAULT_DOCUMENT_SECTIONS);
    setDeletedBlocks([]);
    setZoomLevel(100);
    setConfirmResetOpen(false);
    try {
      localStorage.removeItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE');
    } catch (e) {}
    // Re-fetch default salutation from ATS if possible
    fetchAtsOfferContent();
    enqueueSnackbar('Restored standard ERP offer letter template structure', { variant: 'info' });
  };

  // Section Drag & Drop
  const handleSectionDragStart = (e, index) => {
    setDraggedSectionIdx(index);
    e.dataTransfer.setData('text/section-index', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSectionIdx !== index) {
      setDragOverSectionIdx(index);
    }
  };

  const handleSectionDrop = (e, targetIndex) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/section-index');
    const fromIndex = draggedSectionIdx !== null ? draggedSectionIdx : (data ? parseInt(data, 10) : null);

    if (fromIndex === null || isNaN(fromIndex) || fromIndex === targetIndex || fromIndex < 0 || fromIndex >= sections.length || targetIndex < 0 || targetIndex >= sections.length) {
      setDraggedSectionIdx(null);
      setDragOverSectionIdx(null);
      return;
    }

    setSections((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    });

    setDraggedSectionIdx(null);
    setDragOverSectionIdx(null);
    enqueueSnackbar('Updated section sequence in document flow', { variant: 'success' });
  };

  // Token Insertions
  const handleInsertTokenIntoActiveEditor = (token) => {
    const secId = activeSectionId || 'sec_body';
    const quillWrapper = quillRefs.current[secId];
    const quill = getSafeQuillEditor(quillWrapper);
    const liveVal = liveDataMap[token] || '';
    const valFeedback = liveVal ? ` (Live value: "${liveVal}")` : '';

    if (quill) {
      try {
        const range = quill.getSelection(true);
        const insertPos = range ? range.index : quill.getLength() - 1;
        quill.insertText(insertPos, token, 'user');
        quill.setSelection(insertPos + token.length, 0, 'user');
        enqueueSnackbar(`Inserted ${token}${valFeedback}`, { variant: 'success' });
        return;
      } catch (_) {}
    }
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === secId) {
          const currentHtml = sec.content?.html || '';
          return { ...sec, content: { ...sec.content, html: `${currentHtml} ${token}` } };
        }
        return sec;
      })
    );
    enqueueSnackbar(`Appended ${token} to section${valFeedback}`, { variant: 'info' });
  };

  const handleDragStartToken = (e, tok) => {
    const ph = typeof tok === 'string' ? tok : (tok?.token || '');
    e.dataTransfer.setData('text/plain', ph);
    e.dataTransfer.setData('text/html', ph);
    e.dataTransfer.setData('text/offer-placeholder', ph);
    e.dataTransfer.effectAllowed = 'copy';

    const dragEl = document.createElement('div');
    dragEl.innerText = ph;
    dragEl.style.position = 'absolute';
    dragEl.style.top = '-9999px';
    dragEl.style.left = '-9999px';
    dragEl.style.padding = '4px 10px';
    dragEl.style.borderRadius = '8px';
    dragEl.style.border = '1px solid #2196f3';
    dragEl.style.backgroundColor = '#ffffff';
    dragEl.style.color = '#2196f3';
    dragEl.style.fontFamily = 'monospace';
    dragEl.style.fontSize = '0.72rem';
    dragEl.style.fontWeight = '600';
    dragEl.style.pointerEvents = 'none';
    dragEl.style.whiteSpace = 'nowrap';
    dragEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    document.body.appendChild(dragEl);

    const rect = e.currentTarget.getBoundingClientRect();
    const xOffset = rect.width / 2;
    const yOffset = rect.height / 2;
    try {
      e.dataTransfer.setDragImage(dragEl, xOffset, yOffset);
    } catch (_) {}

    setTimeout(() => {
      if (dragEl.parentNode) {
        dragEl.parentNode.removeChild(dragEl);
      }
    }, 0);
  };

  const handlePlaceholderDropOnSection = (e, sec) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPlaceholderSecId(null);

    const text = e.dataTransfer.getData('text/offer-placeholder') || e.dataTransfer.getData('text/plain');
    if (!text || !text.trim()) return;
    const ph = text.trim();
    const liveVal = liveDataMap[ph] || '';
    const valFeedback = liveVal ? ` (Live value: "${liveVal}")` : '';

    if (sec.type === 'salutation_body' || sec.type === 'custom_rich_text') {
      const quillWrapper = quillRefs.current[sec.id];
      const quill = getSafeQuillEditor(quillWrapper);

      if (quill) {
        let dropIndex = null;
        try {
          if (document.caretRangeFromPoint) {
            const caretRange = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (caretRange && caretRange.startContainer) {
              const blot = quill.scroll ? quill.scroll.find(caretRange.startContainer) : null;
              if (blot) {
                const blotIndex = quill.getIndex(blot);
                dropIndex = blotIndex + (caretRange.startOffset || 0);
              }
            }
          } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (pos && pos.offsetNode) {
              const blot = quill.scroll ? quill.scroll.find(pos.offsetNode) : null;
              if (blot) {
                const blotIndex = quill.getIndex(blot);
                dropIndex = blotIndex + (pos.offset || 0);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to resolve drop caret position in Quill:', err);
        }

        if (dropIndex === null || dropIndex < 0) {
          const selection = quill.getSelection();
          dropIndex = selection ? selection.index : Math.max(0, quill.getLength() - 1);
        }

        const maxLen = quill.getLength();
        if (dropIndex > maxLen) dropIndex = maxLen;
        if (dropIndex < 0) dropIndex = 0;

        quill.insertText(dropIndex, ph, 'user');
        quill.setSelection(dropIndex + ph.length, 0, 'user');
        quill.focus();
        enqueueSnackbar(`Inserted ${ph}${valFeedback}`, { variant: 'success' });
        return;
      }

      setActiveSectionId(sec.id);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sec.id) {
            const currentHtml = s.content?.html || '';
            const newHtml = currentHtml ? `${currentHtml} ${ph}` : `<p>${ph}</p>`;
            return { ...s, content: { ...s.content, html: newHtml } };
          }
          return s;
        })
      );
      enqueueSnackbar(`Inserted ${ph} into ${sec.title || 'section'}${valFeedback}`, { variant: 'success' });
    } else if (sec.type === 'document_title') {
      setActiveSectionId(sec.id);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === sec.id) {
            const currentText = s.content?.text || '';
            return { ...s, content: { ...s.content, text: `${currentText} ${ph}` } };
          }
          return s;
        })
      );
      enqueueSnackbar(`Inserted ${ph} into Document Title${valFeedback}`, { variant: 'success' });
    }
  };

  // Save Template
  const handleSaveTemplateToBackend = useCallback(async () => {
    try {
      setIsSavingTemplate(true);
      const payload = {
        ...(templateRecordId ? { id: templateRecordId } : {}),
        letterType: 'OFFER_TEMPLATE',
        refNo: templateCode || 'TEMPLATE_OFFER_STANDARD',
        letterDate: new Date().toISOString(),
        formData: JSON.stringify({
          templateName,
          templateCode,
          layoutMode: 'document_flow',
          sections,
          updatedAt: new Date().toISOString()
        }),
        status: 'ACTIVE'
      };

      const res = await axios.post('/api/hra/letters', payload);
      if (res?.data?.id) {
        setTemplateRecordId(res.data.id);
      }
      try {
        localStorage.setItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE', JSON.stringify({
          templateName,
          templateCode,
          sections,
          templateRecordId: res?.data?.id || templateRecordId
        }));
      } catch (e) {}
      enqueueSnackbar('Offer letter template saved successfully!', { variant: 'success' });
      if (onSaveOfferLetter) {
        onSaveOfferLetter({ templateName, templateCode, sections, candidate: selectedCandidate, companyInfo: effectiveCompanyInfo });
      }
    } catch (err) {
      console.error('Failed to save offer template', err);
      enqueueSnackbar('Failed to persist offer template to server.', { variant: 'error' });
    } finally {
      setIsSavingTemplate(false);
    }
  }, [templateRecordId, templateCode, templateName, sections, enqueueSnackbar, onSaveOfferLetter, selectedCandidate, effectiveCompanyInfo]);

  // High Quality PDF Download (Direct Clean HTML Conversion - No Screen Overlay)
  const handleDownloadPDF = useCallback(async () => {
    setIsDownloadingPDF(true);
    try {
      const compsToUse = designerCompsList && designerCompsList.length > 0 ? designerCompsList : activeCompsList;
      const salaryToUse = Object.keys(designerSalary).length > 0 ? designerSalary : localSalary;
      const gToUse = designerGrossVal > 0 ? designerGrossVal : grossVal;
      const cToUse = designerCtcVal > 0 ? designerCtcVal : (ctcVal > 0 ? ctcVal : (gToUse > 0 ? gToUse : 0));
      const aToUse = designerAnnualCtc > 0 ? designerAnnualCtc : (annualCtc > 0 ? annualCtc : (totalCTC > 0 ? totalCTC : cToUse * 12));

      const candCode = (liveDataMap['{{candidateId}}'] || liveDataMap['{{candidateName}}'] || 'Candidate').replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filename = `Offer_Letter_${candCode}`;

      const cleanHtml = buildCleanOfferLetterHtml({
        sections,
        dataMap: liveDataMap,
        compsList: compsToUse,
        activeCompsList: compsToUse,
        salaryMap: salaryToUse,
        localSalary: salaryToUse,
        grossVal: gToUse,
        ctcVal: cToUse,
        annualCtc: aToUse
      });

      await exportOfferLetterToPdf({
        cleanHtml,
        sections,
        dataMap: liveDataMap,
        companyData: effectiveCompanyInfo,
        candidateData: selectedCandidate,
        compsList: compsToUse,
        activeCompsList: compsToUse,
        salaryMap: salaryToUse,
        localSalary: salaryToUse,
        grossVal: gToUse,
        ctcVal: cToUse,
        annualCtc: aToUse
      }, filename);

      enqueueSnackbar('Offer letter PDF downloaded successfully!', { variant: 'success' });
    } catch (err) {
      console.error('[OfferLetterDesigner] PDF generation failed:', err);
      enqueueSnackbar('Failed to generate PDF. Please try again.', { variant: 'error' });
    } finally {
      setIsDownloadingPDF(false);
    }
  }, [designerCompsList, activeCompsList, designerSalary, localSalary, designerGrossVal, grossVal, designerCtcVal, ctcVal, designerAnnualCtc, annualCtc, totalCTC, liveDataMap, sections, enqueueSnackbar, effectiveCompanyInfo, selectedCandidate]);

  // Sequential Keyboard Shortcuts: Space + S (Save), Space + P (Preview), Space + D (Download), Space + R (Reset)
  const spacePressedRef = useRef(false);
  const spaceTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      const isEditable = activeEl?.isContentEditable || activeEl?.classList?.contains('ql-editor') || tag === 'input' || tag === 'textarea' || tag === 'select';
      if (isEditable) return; // Never override normal typing in text fields or editor

      if (e.key === ' ' || e.code === 'Space') {
        spacePressedRef.current = true;
        if (spaceTimerRef.current) clearTimeout(spaceTimerRef.current);
        spaceTimerRef.current = setTimeout(() => {
          spacePressedRef.current = false;
        }, 1200);
        return;
      }

      if (spacePressedRef.current) {
        const k = e.key.toLowerCase();
        if (k === 's') {
          e.preventDefault();
          e.stopPropagation();
          spacePressedRef.current = false;
          handleSaveTemplateToBackend();
          return;
        } else if (k === 'p') {
          e.preventDefault();
          e.stopPropagation();
          spacePressedRef.current = false;
          setPreviewOpen(true);
          return;
        } else if (k === 'd') {
          e.preventDefault();
          e.stopPropagation();
          spacePressedRef.current = false;
          handleDownloadPDF();
          return;
        } else if (k === 'r') {
          e.preventDefault();
          e.stopPropagation();
          spacePressedRef.current = false;
          setConfirmResetOpen(true);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (spaceTimerRef.current) clearTimeout(spaceTimerRef.current);
    };
  }, [open, handleUndo, handleRedo, handleSaveTemplateToBackend, handleDownloadPDF]);

  // Filtered Dynamic Fields
  const filteredDynamicFields = useMemo(() => {
    return VERIFIED_DYNAMIC_FIELDS.filter((f) => {
      const matchCat = selectedCategory === 'ALL' || f.category === selectedCategory;
      const matchQuery = !searchToken || f.label.toLowerCase().includes(searchToken.toLowerCase()) || f.token.toLowerCase().includes(searchToken.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchToken]);
    // Section Renderer in Canvas
  const renderSection = (sec, index) => {
    if (!sec.enabled) return null;
    const isFocused = activeSectionId === sec.id;
    const isTargetDrop = dragOverSectionIdx === index && draggedSectionIdx !== null && draggedSectionIdx !== index;

    return (
      <Box
        key={sec.id}
        id={`section-resize-target-${sec.id}`}
        onClick={() => setActiveSectionId(sec.id)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('text/section-index')) {
            handleSectionDragOver(e, index);
          } else {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            if (dragOverPlaceholderSecId !== sec.id) {
              setDragOverPlaceholderSecId(sec.id);
            }
          }
        }}
        onDragLeave={(e) => {
          if (!e.dataTransfer.types.includes('text/section-index')) {
            e.preventDefault();
            setDragOverPlaceholderSecId((prev) => (prev === sec.id ? null : prev));
          }
        }}
        onDrop={(e) => {
          if (e.dataTransfer.types.includes('text/section-index')) {
            handleSectionDrop(e, index);
          } else {
            handlePlaceholderDropOnSection(e, sec);
          }
        }}
        sx={{
          position: 'relative',
          mb: 1.25,
          p: 0.75,
          borderRadius: '6px',
          border: dragOverPlaceholderSecId === sec.id
            ? `2px dashed ${theme.palette.primary.main}`
            : (isTargetDrop ? `2px dashed ${theme.palette.primary.main}` : (isFocused ? `1px dashed ${theme.palette.primary.main}` : '1px solid transparent')),
          bgcolor: dragOverPlaceholderSecId === sec.id
            ? alpha(theme.palette.primary.main, 0.05)
            : (isTargetDrop ? alpha(theme.palette.primary.main, 0.04) : 'transparent'),
          boxShadow: dragOverPlaceholderSecId === sec.id ? `0 0 10px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
          transition: 'all 0.15s ease',
          height: 'auto',
          minHeight: sec.sectionMinHeight > 0 ? `${sec.sectionMinHeight}px` : '20px',
          width: sec.sectionWidth && sec.sectionWidth < 100 ? `${sec.sectionWidth}%` : '100%',
          mx: sec.sectionWidth && sec.sectionWidth < 100 ? 'auto' : 0,
          boxSizing: 'border-box',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          '&:hover': {
            border: isTargetDrop ? `2px dashed ${theme.palette.primary.main}` : `1px dashed ${theme.palette.divider}`,
            '& .section-action-toolbar': { opacity: 1 },
            '& .section-resize-handle': { opacity: 1 }
          },
          ...(isFocused && { '& .section-resize-handle': { opacity: 1 } })
        }}
      >
        {/* Resize Handle */}
        <Box
          className="section-resize-handle"
          sx={{
            position: 'absolute',
            bottom: -5,
            right: 0,
            width: '100%',
            height: '10px',
            cursor: 'row-resize',
            opacity: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 5
          }}
          onMouseDown={(e) => handleResizeStart(e, sec)}
        >
          <div style={{ width: '40px', height: '3px', background: theme.palette.divider, borderRadius: '2px' }} />
        </Box>

        {/* Hover Action Bar */}
        <Stack
          className="section-action-toolbar"
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: -14,
            right: 12,
            bgcolor: isDark ? 'background.paper' : (theme.palette.dark?.main || '#1e293b'),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            px: 1,
            py: 0.3,
            opacity: isFocused ? 1 : 0,
            transition: 'opacity 0.2s ease',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <Tooltip title="Drag to Reorder">
            <IconButton
              size="small"
              draggable
              onDragStart={(e) => handleSectionDragStart(e, index)}
              sx={{ color: 'text.secondary', p: 0.3, cursor: 'grab' }}
            >
              <IconGripVertical size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Move Up">
            <span>
              <IconButton size="small" disabled={index === 0} onClick={(e) => { e.stopPropagation(); handleMoveSection(index, -1); }} sx={{ color: isDark ? 'text.primary' : '#fff', p: 0.3 }}>
                <IconArrowUp size={14} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move Down">
            <span>
              <IconButton size="small" disabled={index === sections.length - 1} onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 1); }} sx={{ color: isDark ? 'text.primary' : '#fff', p: 0.3 }}>
                <IconArrowDown size={14} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Duplicate Section">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDuplicateSection(index); }} sx={{ color: isDark ? 'text.primary' : '#fff', p: 0.3 }}>
              <IconCopy size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title={sec.enabled ? 'Hide Section' : 'Show Section'}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggleSectionEnabled(sec.id); }} sx={{ color: isDark ? 'text.primary' : '#fff', p: 0.3 }}>
              {sec.enabled ? <IconEye size={14} /> : <IconEyeOff size={14} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Configure Properties">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSectionId(sec.id);
                setInspectorOpen(true);
                setRightPanelTab(1);
              }}
              sx={{ color: isDark ? 'text.primary' : '#fff', p: 0.3 }}
            >
              <IconAdjustments size={14} />
            </IconButton>
          </Tooltip>
          {sec.deletable && (
            <Tooltip title="Delete Section">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }} sx={{ color: '#f87171', p: 0.3 }}>
                <IconTrash size={14} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Section Body */}
        {(() => {
          switch (sec.type) {
            case 'company_header':
              return (
                <div style={{ marginBottom: '10px', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(30, 58, 138, 0.08)', border: '1px solid #dbeafe' }}>
                  <div style={{ height: '6px', background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 40%, #38bdf8 100%)', borderRadius: '6px 6px 0 0' }} />
                  <div style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)', padding: '12px 18px 10px 18px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '120px', verticalAlign: 'middle', paddingRight: '14px' }}>
                            {liveDataMap['{{companyLogo}}'] ? (
                              <img
                                src={liveDataMap['{{companyLogo}}']}
                                alt="Company Logo"
                                style={{ maxHeight: '56px', maxWidth: '115px', objectFit: 'contain' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: '54px', height: '54px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#fff', fontWeight: 900, fontSize: '20px' }}>{(liveDataMap['{{companyName}}'] || 'C').charAt(0)}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {liveDataMap['{{companyName}}']}
                            </div>
                            <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>{liveDataMap['{{companyAddress}}']}</div>
                            {liveDataMap['{{companyGstin}}'] && (
                              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>GSTIN: {liveDataMap['{{companyGstin}}']}</div>
                            )}
                            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                              {[
                                liveDataMap['{{companyPhone}}'] ? `Mob: ${liveDataMap['{{companyPhone}}']}` : '',
                                liveDataMap['{{companyEmail}}'] ? `Email: ${liveDataMap['{{companyEmail}}']}` : '',
                                liveDataMap['{{companyWeb}}'] ? `Web: ${liveDataMap['{{companyWeb}}']}` : ''
                              ].filter(Boolean).join(' | ')}
                            </div>
                          </td>
                          <td style={{ verticalAlign: 'top', textAlign: 'right', width: '200px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', borderRadius: '6px', padding: '7px 12px', display: 'inline-block', textAlign: 'left', minWidth: '175px' }}>
                              <div style={{ fontSize: '10px', color: '#bfdbfe', lineHeight: 1.45 }}>
                                <span style={{ fontWeight: 600 }}>{sec.content?.docNoPrefix || 'DOC. No :'}</span>
                                <strong style={{ color: '#ffffff', marginLeft: '3px' }}>{liveDataMap['{{offerNumber}}']}</strong>
                              </div>
                              <div style={{ fontSize: '10px', color: '#bfdbfe', marginTop: '3px', lineHeight: 1.45 }}>
                                <span style={{ fontWeight: 600 }}>{sec.content?.issueDatePrefix || 'Issue Date :'}</span>
                                <strong style={{ color: '#ffffff', marginLeft: '3px' }}>{liveDataMap['{{offerDate}}']}</strong>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 40%, #38bdf8 100%)' }} />
                </div>
              );

            case 'document_title': {
              const fontSizeMapCanvas = { small: '13px', medium: '15px', large: '17.5px' };
              const docTitleAlign = sec.content?.alignment || 'center';
              const docTitleFSize = fontSizeMapCanvas[sec.content?.fontSize] || '15px';
              return (
                <div style={{ textAlign: docTitleAlign, margin: '8px 0 12px 0', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'inline-block', position: 'relative', maxWidth: '100%', padding: '4px 20px', boxSizing: 'border-box' }}>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateSectionContent(sec.id, 'text', e.currentTarget.innerText || '')}
                      style={{
                        fontSize: docTitleFSize,
                        fontWeight: 800,
                        color: '#1e3a8a',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        textAlign: docTitleAlign,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        borderBottom: isFocused ? '2px dashed #2563eb' : 'none',
                        outline: 'none',
                        minWidth: '120px',
                        display: 'inline-block',
                        maxWidth: '100%',
                        lineHeight: 1.35
                      }}
                    >
                      {sec.content?.text ?? 'OFFER OF APPOINTMENT'}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '2px', background: 'linear-gradient(90deg, transparent, #2563eb, #38bdf8, transparent)', borderRadius: '2px' }} />
                  </div>
                </div>
              );
            }

            case 'candidate_recipient':
              return (
                <div style={{ marginBottom: '12px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%)', borderLeft: '4px solid #2563eb', borderRadius: '0 6px 6px 0', padding: '10px 16px', boxShadow: '0 1px 4px rgba(37, 99, 235, 0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'top', width: '55%' }}>
                          <div style={{ color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.8px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IconUser size={12} /> TO CANDIDATE
                          </div>
                          <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>{liveDataMap['{{candidateName}}']}</div>
                          <div style={{ color: '#475569', marginTop: '3px', fontSize: '11px' }}>
                            Email: <strong style={{ color: '#1e293b' }}>{liveDataMap['{{candidateEmail}}']}</strong> | Mobile: <strong style={{ color: '#1e293b' }}>{liveDataMap['{{candidateMobile}}']}</strong>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', width: '45%', textAlign: 'right' }}>
                          <table style={{ display: 'inline-table', borderCollapse: 'collapse', textAlign: 'right', fontSize: '11px' }}>
                            <tbody>
                              {liveDataMap['{{employmentType}}'] && (
                                <tr>
                                  <td style={{ color: '#64748b', fontSize: '9.5px', padding: '1px 0' }}>Employment Type:</td>
                                  <td style={{ fontWeight: 700, color: '#0f172a', padding: '1px 0 1px 6px', textTransform: 'uppercase' }}>{liveDataMap['{{employmentType}}']}</td>
                                </tr>
                              )}
                              {liveDataMap['{{workLocation}}'] && (
                                <tr>
                                  <td style={{ color: '#64748b', fontSize: '9.5px', padding: '1px 0' }}>Work Location:</td>
                                  <td style={{ fontWeight: 700, color: '#0f172a', padding: '1px 0 1px 6px' }}>{liveDataMap['{{workLocation}}']}</td>
                                </tr>
                              )}
                              <tr>
                                <td style={{ color: '#64748b', fontSize: '9.5px', padding: '1px 0' }}>Proposed Joining Date:</td>
                                <td style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e3a8a', padding: '1px 0 1px 6px' }}>{liveDataMap['{{joiningDate}}']}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );

            case 'salutation_body':
            case 'terms_conditions':
            case 'custom_rich_text': {
              const htmlContent = sec.content?.html || '';
              return (
                <Box
                  onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes('text/section-index')) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dragOverPlaceholderSecId !== sec.id) {
                        setDragOverPlaceholderSecId(sec.id);
                      }
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.dataTransfer.types.includes('text/section-index')) {
                      e.preventDefault();
                      setDragOverPlaceholderSecId((prev) => (prev === sec.id ? null : prev));
                    }
                  }}
                  onDrop={(e) => {
                    if (!e.dataTransfer.types.includes('text/section-index')) {
                      handlePlaceholderDropOnSection(e, sec);
                    }
                  }}
                  sx={{
                    mb: 1.5,
                    position: 'relative',
                    borderRadius: '6px',
                    transition: 'all 0.15s ease',
                    border: dragOverPlaceholderSecId === sec.id ? `2px dashed ${theme.palette.primary.main}` : '2px solid transparent',
                    bgcolor: dragOverPlaceholderSecId === sec.id ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                    boxShadow: dragOverPlaceholderSecId === sec.id ? `0 0 12px ${alpha(theme.palette.primary.main, 0.18)}` : 'none',
                    '& .quill': { bgcolor: '#ffffff', borderRadius: '6px' },
                    '& .ql-container': { border: isFocused ? `1px solid ${theme.palette.primary.light}` : '1px solid transparent', borderRadius: '0 0 6px 6px', fontSize: '12px', fontFamily: 'inherit' },
                    '& .ql-editor': { minHeight: '40px', p: '6px 8px', fontSize: '12px', lineHeight: 1.65, color: '#334155', textAlign: 'justify', '& p': { margin: '0 0 8px 0' } },
                    '& .ql-toolbar': { border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, borderRadius: '6px 6px 0 0', bgcolor: alpha(theme.palette.primary.main, 0.02), py: 0.3 },
                    '& .offer-body-rendered p': { margin: '0 0 8px 0', lineHeight: 1.65 },
                    '& .offer-body-rendered p:last-child': { margin: 0 },
                    '& .offer-body-rendered ul': { listStyleType: 'disc !important', paddingLeft: '24px', margin: '6px 0 8px 0' },
                    '& .offer-body-rendered ol': { listStyleType: 'decimal !important', paddingLeft: '24px', margin: '6px 0 8px 0' },
                    '& .offer-body-rendered li': { mb: 0.5, lineHeight: 1.6 },
                    '& .offer-body-rendered li[data-list="bullet"], & .offer-body-rendered ul li': { listStyleType: 'disc !important' },
                    '& .offer-body-rendered li[data-list="ordered"], & .offer-body-rendered ol li': { listStyleType: 'decimal !important' }
                  }}
                >
                  {isFocused ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : alpha(theme.palette.primary.main, 0.04),
                          p: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: isDark ? 'divider' : alpha(theme.palette.primary.main, 0.15)
                        }}
                      >
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label="Edit Template Tokens"
                            size="small"
                            variant={!sectionLivePreviewMap[sec.id] ? 'filled' : 'outlined'}
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSectionLivePreviewMap((prev) => ({ ...prev, [sec.id]: false }));
                            }}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          />
                          <Chip
                            label="Live Preview"
                            size="small"
                            variant={sectionLivePreviewMap[sec.id] ? 'filled' : 'outlined'}
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSectionLivePreviewMap((prev) => ({ ...prev, [sec.id]: true }));
                            }}
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          />
                        </Stack>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconInfoCircle size={13} />
                          Tokens like &#123;&#123;name&#125;&#125; evaluate to candidate data
                        </Typography>
                      </Box>

                      {sectionLivePreviewMap[sec.id] ? (
                        <Box
                          className="offer-body-rendered"
                          sx={{
                            p: 1.5,
                            borderRadius: '6px',
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.06)' : alpha(theme.palette.success.main, 0.04),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.success.main, 0.3),
                            fontSize: '12px',
                            color: isDark ? '#e2e8f0' : '#334155',
                            lineHeight: 1.65,
                            textAlign: 'justify',
                            minHeight: '40px'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: formatQuillHtmlForExport(substituteTokens(htmlContent))
                          }}
                        />
                      ) : (
                        <>
                          <ReactQuill
                            ref={(el) => { if (el) quillRefs.current[sec.id] = el; }}
                            value={htmlContent}
                            onChange={(content) => handleUpdateSectionContent(sec.id, 'html', content)}
                          />
                          {suggestionOpen && activeQuillSecId === sec.id && (
                            <Paper
                              elevation={8}
                              sx={{
                                position: 'absolute',
                                left: Math.min(suggestionCoords.left, 450),
                                top: suggestionCoords.top,
                                zIndex: 1500,
                                width: '280px',
                                maxHeight: '220px',
                                overflowY: 'auto',
                                bgcolor: 'background.paper',
                                borderColor: 'divider',
                                border: '1px solid',
                                borderRadius: '8px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
                              }}
                            >
                              {filteredSuggestionPlaceholders.length === 0 ? (
                                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    No matching placeholders
                                  </Typography>
                                </Box>
                              ) : (
                                filteredSuggestionPlaceholders.map((item, index) => (
                                  <MenuItem
                                    key={item.token}
                                    selected={index === suggestionSelectedIndex}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      insertSlashPlaceholder(item.token);
                                    }}
                                    sx={{
                                      py: 0.6,
                                      px: 1.25,
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start'
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                                      {item.token}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                                      {item.label} • {item.category}
                                    </Typography>
                                  </MenuItem>
                                ))
                              )}
                            </Paper>
                          )}
                        </>
                      )}
                    </Box>
                  ) : (
                    <div
                      className="offer-body-rendered"
                      style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, textAlign: 'justify', minHeight: '24px', padding: '3px 0' }}
                      dangerouslySetInnerHTML={{
                        __html: formatQuillHtmlForExport(substituteTokens(htmlContent))
                      }}
                    />
                  )}
                </Box>
              );
            }

            case 'job_card':
              return null;

            case 'salary_table': {
              const title = sec.content?.customTitle || 'Compensation Structure & Emoluments';
              const compsToUse = designerCompsList && designerCompsList.length > 0 ? designerCompsList : activeCompsList;

              const salaryStruct = normalizeOfferSalaryStructure({
                compsList: compsToUse,
                salaryMap: designerSalary,
                grossVal: designerGrossVal || grossVal || 0,
                ctcVal: designerCtcVal || ctcVal || 0,
                annualCtc: designerAnnualCtc || annualCtc || totalCTC || 0
              });

              const { earnings, deductions, contributions, totals } = salaryStruct;
              const formatCurr = (val) => Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

              return (
                <div style={{ margin: '12px 0', border: '1px solid #dbeafe', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(30, 58, 138, 0.06)' }}>
                  <div style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IconCashBanknote size={14} color="#ffffff" />
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>{title}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#eff6ff', color: '#1e3a8a' }}>
                        <th style={{ padding: '6px 12px', border: '1px solid #bfdbfe', textAlign: 'left', fontWeight: 700 }}>Salary Component</th>
                        <th style={{ padding: '6px 12px', border: '1px solid #bfdbfe', textAlign: 'right', width: '130px', fontWeight: 700 }}>Monthly (₹)</th>
                        <th style={{ padding: '6px 12px', border: '1px solid #bfdbfe', textAlign: 'right', width: '130px', fontWeight: 700 }}>Annual (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryLoading ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '20px 14px', textAlign: 'center', color: 'text.secondary', fontSize: '11px', background: isDark ? 'background.default' : '#f8fafc' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <CircularProgress size={14} thickness={5} color="primary" />
                              <span style={{ fontWeight: 600 }}>Loading and calculating candidate salary structure...</span>
                            </div>
                          </td>
                        </tr>
                      ) : salaryError ? (
                        <tr>
                          <td colSpan={3} style={{ padding: '14px', textAlign: 'center', color: '#ef4444', fontSize: '11px', background: '#fef2f2' }}>
                            {salaryError}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* 1. EARNINGS */}
                          <tr style={{ background: '#eff6ff', color: '#1e3a8a', fontWeight: 700 }}>
                            <td colSpan={3} style={{ padding: '5px 12px', border: '1px solid #bfdbfe', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Earnings
                            </td>
                          </tr>
                          {earnings.length > 0 ? (
                            earnings.map((comp, idx) => (
                              <tr key={comp.code || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fbff' }}>
                                <td style={{ border: '1px solid #dbeafe', padding: '5px 12px' }}>{comp.name}</td>
                                <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.monthly)}</td>
                                <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.annual)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'center', color: 'text.secondary', fontSize: '11px' }}>
                                No earning components configured.
                              </td>
                            </tr>
                          )}
                          <tr style={{ fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                            <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px' }}>Total Gross Salary (A)</td>
                            <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.grossMonthly)}</td>
                            <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.grossAnnual)}</td>
                          </tr>

                          {/* 2. DEDUCTIONS */}
                          {deductions.length > 0 && (
                            <>
                              <tr style={{ background: '#fef2f2', color: '#991b1b', fontWeight: 700 }}>
                                <td colSpan={3} style={{ padding: '5px 12px', border: '1px solid #bfdbfe', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Deductions
                                </td>
                              </tr>
                              {deductions.map((comp, idx) => (
                                <tr key={comp.code || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fbff' }}>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px' }}>{comp.name}</td>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.monthly)}</td>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.annual)}</td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px' }}>Total Deductions (B)</td>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.deductionsMonthly)}</td>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.deductionsAnnual)}</td>
                              </tr>
                            </>
                          )}

                          {/* 3. EMPLOYER CONTRIBUTIONS */}
                          {contributions.length > 0 && (
                            <>
                              <tr style={{ background: '#faf5ff', color: '#6b21a8', fontWeight: 700 }}>
                                <td colSpan={3} style={{ padding: '5px 12px', border: '1px solid #bfdbfe', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Employer Contributions
                                </td>
                              </tr>
                              {contributions.map((comp, idx) => (
                                <tr key={comp.code || idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fbff' }}>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px' }}>{comp.name}</td>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.monthly)}</td>
                                  <td style={{ border: '1px solid #dbeafe', padding: '5px 12px', textAlign: 'right' }}>₹{formatCurr(comp.annual)}</td>
                                </tr>
                              ))}
                              <tr style={{ fontWeight: 700, background: '#f3e8ff', color: '#7e22ce' }}>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px' }}>Total Contributions (C)</td>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.contributionsMonthly)}</td>
                                <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.contributionsAnnual)}</td>
                              </tr>
                            </>
                          )}

                          {/* 4. NET PAYABLE */}
                          {deductions.length > 0 && (
                            <tr style={{ fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>
                              <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px' }}>Net Salary (Take Home) (A - B)</td>
                              <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.netMonthly)} / Month</td>
                              <td style={{ border: '1px solid #bfdbfe', padding: '6px 12px', textAlign: 'right' }}>₹{formatCurr(totals.netAnnual)}</td>
                            </tr>
                          )}

                          {/* 5. TOTAL COST TO COMPANY (CTC) */}
                          <tr style={{ fontWeight: 800, background: '#1e3a8a', color: '#ffffff' }}>
                            <td style={{ border: '1px solid #1e3a8a', padding: '8px 12px' }}>Total Cost to Company (CTC) (A + C)</td>
                            <td style={{ border: '1px solid #1e3a8a', padding: '8px 12px', textAlign: 'right', fontSize: '11px' }}>₹{formatCurr(totals.ctcMonthly)} / Month</td>
                            <td style={{ border: '1px solid #1e3a8a', padding: '8px 12px', textAlign: 'right', fontSize: '11.5px' }}>₹{formatCurr(totals.ctcAnnual)} / Annum</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            }

            case 'signature_block': {
              const content = sec.content || {};
              const canvasAuthLbl = content.authLabel || 'Authorized By';
              const canvasCandLbl = content.candLabel || 'Candidate Acceptance';
              const useCurrent = content.useCurrentUserCredentials !== false;
              const showCand = content.showCandidateAcceptance !== false;
              const showComp = content.includeCompanyName !== false;
              const showSigLine = content.includeSignatureLine !== false;

              const resolvedAuthName = useCurrent
                ? (liveDataMap['{{hrSignatoryName}}'] || loggedInUser?.name || 'SUPER BOSS')
                : (content.authName || liveDataMap['{{hrSignatoryName}}'] || '');
              const resolvedAuthDesig = useCurrent
                ? (liveDataMap['{{hrSignatoryTitle}}'] || loggedInUser?.designation || 'Administrator')
                : (content.authDesignation || liveDataMap['{{hrSignatoryTitle}}'] || '');
              const resolvedAuthDept = !useCurrent && content.authDepartment ? content.authDepartment : '';
              const resolvedAuthPhone = !useCurrent && content.authPhone ? content.authPhone : '';

              const desigDeptLine = [resolvedAuthDesig, resolvedAuthDept].filter(Boolean).join(' • ');
              const contactLine = resolvedAuthPhone ? `Mob: ${resolvedAuthPhone}` : '';

              return (
                <div style={{ marginTop: '14px', border: '1px solid #dbeafe', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(30, 58, 138, 0.06)' }}>
                  <div style={{ height: '3px', background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 40%, #38bdf8 100%)' }} />
                  <div style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)', padding: '12px 18px 10px 18px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: showCand ? '50%' : '100%', verticalAlign: 'top' }}>
                            <div style={{ color: '#2563eb', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                              {canvasAuthLbl}
                            </div>
                            <div style={{ display: 'inline-block', minWidth: '140px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px', lineHeight: 1.25 }}>{resolvedAuthName}</div>
                              {desigDeptLine && (
                                <div style={{ color: '#475569', fontSize: '10px', lineHeight: 1.25, marginTop: '2px' }}>{desigDeptLine}</div>
                              )}
                              {showComp && (
                                <div style={{ color: '#2563eb', fontSize: '9.5px', fontWeight: 600, marginTop: '2px' }}>For {liveDataMap['{{companyName}}']}</div>
                              )}
                              {contactLine && (
                                <div style={{ color: '#64748b', fontSize: '9px', lineHeight: 1.25, marginTop: '2px' }}>{contactLine}</div>
                              )}
                            </div>
                          </td>
                          {showCand && (
                            <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'right' }}>
                              <div style={{ color: '#64748b', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: showSigLine ? '26px' : '4px' }}>
                                {canvasCandLbl}
                              </div>
                              <div style={{ display: 'inline-block', textAlign: 'center' }}>
                                <div style={{ borderTop: showSigLine ? '2px solid #64748b' : 'none', paddingTop: '4px', minWidth: '170px' }}>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12px', lineHeight: 1.25 }}>{liveDataMap['{{candidateName}}']}</div>
                                  {showSigLine && <div style={{ color: '#64748b', fontSize: '9.5px', lineHeight: 1.25, marginTop: '2px' }}>Signature &amp; Date</div>}
                                </div>
                              </div>
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            default:
              return null;
          }
        })()}
      </Box>
    );
  };

  // Live DOM measurement of section heights for authentic multi-page partitioning
  const [measuredHeights, setMeasuredHeights] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const newHeights = {};
      sections.forEach((s) => {
        const el = document.getElementById(`section-resize-target-${s.id}`);
        if (el) {
          newHeights[s.id] = Math.round(el.getBoundingClientRect().height);
        }
      });
      setMeasuredHeights(newHeights);
    }, 100);
    return () => clearTimeout(timer);
  }, [sections, liveDataMap, designerSalary, zoomLevel]);

  // Partition enabled sections across distinct A4 pages (safe single-page capacity: ~1000px)
  const paginatedPages = useMemo(() => {
    const enabledSections = sections.filter((s) => s.enabled);
    if (enabledSections.length === 0) return [[]];

    const getSecH = (sec) => {
      const customMinH = sec.sectionMinHeight && Number(sec.sectionMinHeight) > 0 ? Number(sec.sectionMinHeight) : 0;
      if (sec.type === 'company_header') return Math.max(customMinH, 110);
      if (sec.type === 'document_title') return Math.max(customMinH, 45);
      if (sec.type === 'candidate_recipient') return Math.max(customMinH, 85);
      if (sec.type === 'salutation_body' || sec.type === 'custom_rich_text' || sec.type === 'terms_conditions') {
        const rawHtml = sec.content?.html || sec.content?.bodyText || '';
        const text = rawHtml.replace(/<[^>]+>/g, '').trim();
        const bulletCount = (rawHtml.match(/<li/gi) || []).length;
        const pCount = (rawHtml.match(/<p/gi) || []).length;
        const itemsCount = Math.max(bulletCount, pCount, Math.ceil(text.length / 85));
        return Math.max(customMinH, Math.max(35, itemsCount * 22 + 10) + 15);
      }
      if (sec.type === 'job_card') return Math.max(customMinH, 75);
      if (sec.type === 'salary_table') {
        const allComps = designerCompsList || activeCompsList || [];
        const earnCount = allComps.filter(c => (c.componentType || '').toUpperCase() === 'EARNING').length || 4;
        const dedCount = allComps.filter(c => (c.componentType || '').toUpperCase() === 'DEDUCTION').length || 0;
        const contribCount = allComps.filter(c => (c.componentType || '').toUpperCase() === 'CONTRIBUTION').length || 0;
        const categoryHeaders = 1 + (dedCount > 0 ? 1 : 0) + (contribCount > 0 ? 1 : 0);
        const summaryRows = 1 + (dedCount > 0 ? 2 : 0) + (contribCount > 0 ? 1 : 0) + 1;
        const totalRows = earnCount + dedCount + contribCount + categoryHeaders + summaryRows;
        return Math.max(customMinH, 26 + 24 + (totalRows * 22) + 2 + 15);
      }
      if (sec.type === 'signature_block') return Math.max(customMinH, 125);
      return Math.max(customMinH, 40);
    };

    const totalHeight = enabledSections.reduce((acc, sec) => acc + getSecH(sec), 0);

    const SINGLE_PAGE_THRESHOLD = 1000;
    if (totalHeight <= SINGLE_PAGE_THRESHOLD) {
      return [enabledSections];
    }

    const pages = [];
    let currentPage = [];
    let currentH = 0;
    const PAGE_CAPACITY = 960;

    enabledSections.forEach((sec) => {
      const secH = getSecH(sec);
      if (currentH + secH > PAGE_CAPACITY && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [sec];
        currentH = secH;
      } else {
        currentPage.push(sec);
        currentH += secH;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    // Avoid orphan signature block on the last page: if last page has only 1 section and previous page has >= 3 sections, balance them
    if (pages.length >= 2 && pages[pages.length - 1].length === 1) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.length >= 3) {
        const pulledSec = prevPage.pop();
        pages[pages.length - 1].unshift(pulledSec);
      }
    }

    return pages;
  }, [sections, designerCompsList, activeCompsList]);

  const estimatedPageCount = paginatedPages.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      disableScrollLock
      disableAutoFocus
      disableRestoreFocus
      disableEnforceFocus
      transitionDuration={0}
      TransitionProps={{ timeout: 0 }}
      BackdropProps={{
        transitionDuration: 0,
        sx: { transition: 'none !important' }
      }}
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: isDark ? 'background.default' : '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* ==============================|| TOP HEADER BAR ||============================== */}
      <Box
        sx={{
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          px: 3,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconFileText size={24} color={theme.palette.primary.main} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Offer Letter Template Designer
          </Typography>
          <Tooltip title="Help & SOP Manual">
            <IconButton size="small" onClick={() => setManualOpen(true)} color="primary" sx={{ ml: 0.5 }}>
              <IconHelpCircle size={20} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Action Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Candidate Live Tester Dropdown */}
          {candidates && candidates.length > 0 && (
            <Box sx={{ minWidth: 260, maxWidth: 340 }}>
              <BOSCandidateAutocomplete
                size="small"
                fullWidth
                label="Live Preview Candidate"
                placeholder="Live Preview Candidate"
                candidates={candidates}
                value={selectedCandidate || null}
                onChange={(selected) => {
                  setSelectedCandidate(selected || null);
                  if (selected) {
                    if (onSelectCandidate) {
                      onSelectCandidate(selected).catch((e) => console.warn('onSelectCandidate error', e));
                    }
                    loadCandidateSalary(selected);
                  } else {
                    setCandidateContext(null);
                    setDesignerSalary({});
                    setDesignerGrossVal(0);
                    setDesignerCtcVal(0);
                  }
                }}
                minPopperWidth={380}
              />
            </Box>
          )}

          {/* Undo / Redo Controls */}
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ bgcolor: isDark ? 'background.default' : 'grey.100', px: 0.75, height: 36, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton size="small" disabled={!canUndo} onClick={handleUndo} sx={{ p: 0.5 }}>
                  <IconArrowBackUp size={16} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton size="small" disabled={!canRedo} onClick={handleRedo} sx={{ p: 0.5 }}>
                  <IconArrowForwardUp size={16} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Zoom Controls */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: isDark ? 'background.default' : 'grey.100', px: 1, height: 36, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))} sx={{ p: 0.5 }}>
                <IconZoomOut size={16} />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35, textAlign: 'center', fontSize: '0.78rem' }}>
              {zoomLevel}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))} sx={{ p: 0.5 }}>
                <IconZoomIn size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to 100%">
              <IconButton size="small" onClick={() => setZoomLevel(100)} sx={{ p: 0.5 }}>
                <IconMaximize size={16} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Reset Template */}
          <Tooltip title={shortcutTooltip('Reset Template', 'Space + R')}>
            <Button
              data-shortcut="clear"
              variant="outlined"
              color="inherit"
              startIcon={<IconRefresh size={17} />}
              onClick={() => setConfirmResetOpen(true)}
              sx={{
                borderRadius: '20px',
                height: 36,
                px: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap',
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  bgcolor: isDark ? 'action.hover' : 'grey.100'
                }
              }}
            >
              Reset
            </Button>
          </Tooltip>

          {/* Preview PDF */}
          <Tooltip title={shortcutTooltip('Preview PDF', 'Space + P')}>
            <Button
              data-shortcut="preview"
              variant="outlined"
              color="primary"
              startIcon={<IconEye size={17} />}
              onClick={() => setPreviewOpen(true)}
              sx={{
                borderRadius: '20px',
                height: 36,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                whiteSpace: 'nowrap'
              }}
            >
              Preview PDF
            </Button>
          </Tooltip>

          {/* Download PDF */}
          <Tooltip title={shortcutTooltip('Download PDF', 'Space + D')}>
            <span>
              <Button
                data-shortcut="export"
                variant="outlined"
                color="secondary"
                startIcon={isDownloadingPDF ? <CircularProgress size={16} color="inherit" /> : <IconDownload size={17} />}
                disabled={isDownloadingPDF || isSavingTemplate}
                onClick={handleDownloadPDF}
                sx={{
                  borderRadius: '20px',
                  height: 36,
                  px: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
              </Button>
            </span>
          </Tooltip>

          {/* Save Template Button */}
          <Tooltip title={shortcutTooltip('Save Template', 'Space + S')}>
            <span>
              <Button
                data-shortcut="save"
                variant="contained"
                color="primary"
                startIcon={isSavingTemplate ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={17} />}
                disabled={isSavingTemplate || isDownloadingPDF}
                onClick={handleSaveTemplateToBackend}
                sx={{
                  borderRadius: '20px',
                  height: 36,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.12)'
                }}
              >
                {isSavingTemplate ? 'Saving...' : 'Save Template'}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={shortcutTooltip('Close Designer', 'Esc')}>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: 'grey.500',
                p: 0.75,
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.15s ease',
                '&:hover': {
                  color: 'error.main',
                  bgcolor: isDark ? alpha(theme.palette.error.main, 0.15) : 'error.lighter',
                  borderColor: 'error.light'
                }
              }}
            >
              <IconX size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ==============================|| MAIN 2-PANEL WORKSPACE ||============================== */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* LEFT TOOLBOX PANEL */}
        <Paper
          elevation={0}
          sx={{
            width: leftPanelCollapsed ? 42 : 330,
            minWidth: leftPanelCollapsed ? 42 : 330,
            maxWidth: leftPanelCollapsed ? 42 : 330,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 260ms cubic-bezier(0.4, 0, 0.2, 1), min-width 260ms cubic-bezier(0.4, 0, 0.2, 1), max-width 260ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {leftPanelCollapsed ? (
            <Box
              onClick={() => setLeftPanelCollapsed(false)}
              sx={{
                width: 42,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
                  '& .toolbox-collapsed-title': { color: 'primary.main' }
                }
              }}
            >
              {/* Top Chevron button */}
              <Tooltip title="Expand Toolbox" placement="right">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setLeftPanelCollapsed(false); }} sx={{ p: 0.5 }}>
                  <IconChevronRight size={18} />
                </IconButton>
              </Tooltip>

              {/* Centered Vertical "TOOLBOX" Label */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <Typography
                  className="toolbox-collapsed-title"
                  variant="caption"
                  sx={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontWeight: 800,
                    fontSize: '0.76rem',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease'
                  }}
                >
                  Toolbox
                </Typography>
              </Box>

              {/* Bottom empty spacing placeholder */}
              <Box sx={{ height: 28, width: 28 }} />
            </Box>
          ) : (
            <Box sx={{ width: 330, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Toolbox header with collapse toggle */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.6, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? alpha(theme.palette.background.default, 0.8) : 'grey.50' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>Toolbox</Typography>
                <Tooltip title="Collapse Panel">
                  <IconButton size="small" onClick={() => setLeftPanelCollapsed(true)} sx={{ p: 0.3 }}>
                    <IconChevronLeft size={15} />
                  </IconButton>
                </Tooltip>
              </Box>
          <Tabs
            value={activeTab}
            onChange={(e, nv) => setActiveTab(nv)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 44 }}
          >
            <Tab icon={<IconLayoutRows size={16} />} iconPosition="start" label="Sections" sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }} />
            <Tab
              icon={<IconHistory size={16} />}
              iconPosition="start"
              label={deletedBlocks.length > 0 ? `Deleted (${deletedBlocks.length})` : 'Deleted'}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: deletedBlocks.length > 0 ? 'error.main' : 'inherit' }}
            />
          </Tabs>

          {/* TAB 0: SECTIONS LIST */}
          {activeTab === 0 && (
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Document Section Structure (Drag to Reorder)
              </Typography>

              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {sections.map((sec, idx) => {
                  const isDragTarget = dragOverSectionIdx === idx && draggedSectionIdx !== null && draggedSectionIdx !== idx;
                  const isDraggingThis = draggedSectionIdx === idx;

                  return (
                    <Paper
                      key={sec.id}
                      variant="outlined"
                      draggable
                      onDragStart={(e) => handleSectionDragStart(e, idx)}
                      onDragOver={(e) => handleSectionDragOver(e, idx)}
                      onDrop={(e) => handleSectionDrop(e, idx)}
                      onDragEnd={() => {
                        setDraggedSectionIdx(null);
                        setDragOverSectionIdx(null);
                      }}
                      onClick={() => setActiveSectionId(sec.id)}
                      sx={{
                        p: 1,
                        borderRadius: '8px',
                        cursor: 'grab',
                        bgcolor: isDragTarget ? alpha(theme.palette.primary.main, 0.12) : (activeSectionId === sec.id ? (isDark ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.08)) : (isDark ? alpha(theme.palette.background.default, 0.5) : '#ffffff')),
                        borderColor: isDragTarget ? 'primary.main' : (activeSectionId === sec.id ? 'primary.main' : 'divider'),
                        borderWidth: isDragTarget ? 2 : 1,
                        borderStyle: isDragTarget ? 'dashed' : 'solid',
                        opacity: isDraggingThis ? 0.4 : 1,
                        transform: isDragTarget ? 'scale(1.02)' : 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: activeSectionId === sec.id ? (isDark ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.primary.main, 0.12)) : (isDark ? alpha(theme.palette.primary.main, 0.06) : 'grey.50') }
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexGrow: 1, minWidth: 0, pr: 0.5 }}>
                          <IconGripVertical size={16} color={theme.palette.text.secondary} style={{ cursor: 'grab', flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', minWidth: 16 }}>
                            {idx + 1}.
                          </Typography>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: activeSectionId === sec.id ? 800 : 600,
                              color: sec.enabled ? 'text.primary' : 'text.disabled',
                              fontSize: '0.8rem'
                            }}
                          >
                            {sec.title}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.2} alignItems="center" sx={{ flexShrink: 0 }}>
                          <Tooltip title="Move Up">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveSection(idx, -1);
                                }}
                                sx={{ p: 0.3 }}
                              >
                                <IconArrowUp size={14} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move Down">
                            <span>
                              <IconButton
                                size="small"
                                disabled={idx === sections.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveSection(idx, 1);
                                }}
                                sx={{ p: 0.3 }}
                              >
                                <IconArrowDown size={14} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={sec.enabled ? 'Visible in Document' : 'Hidden from Document'}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSectionEnabled(sec.id);
                              }}
                              sx={{ p: 0.3 }}
                            >
                              {sec.enabled ? <IconEye size={15} color={theme.palette.primary.main} /> : <IconEyeOff size={15} color={theme.palette.text.disabled} />}
                            </IconButton>
                          </Tooltip>
                          {sec.deletable && (
                            <Tooltip title="Delete Section">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSection(sec.id);
                                }}
                                sx={{ p: 0.3 }}
                              >
                                <IconTrash size={14} color={theme.palette.error.main} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddCustomSection}
                  sx={{
                    mt: 2,
                    borderStyle: 'dashed',
                    color: 'primary.main',
                    borderColor: 'primary.main',
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      borderColor: 'primary.dark'
                    }
                  }}
                >
                  Add Custom Rich Text Section
                </Button>
              </Stack>
            </Box>
          )}

          {/* TAB 1: DELETED BLOCKS (RESTORE BIN) */}
          {activeTab === 1 && (
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              {deletedBlocks.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <IconHistory size={32} color={theme.palette.text.disabled} />
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, fontSize: '0.75rem' }}>
                    No deleted blocks yet.
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.5 }}>
                    When you delete a section, it will appear here and can be restored at any time.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Deleted Blocks — Click to Restore
                  </Typography>
                  {deletedBlocks.map((block) => (
                    <Paper
                      key={block.id}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: '8px',
                        borderColor: isDark ? alpha(theme.palette.error.main, 0.4) : '#fca5a5',
                        bgcolor: isDark ? alpha(theme.palette.error.main, 0.12) : '#fff5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {block.title}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', textTransform: 'capitalize' }}>
                          {block.type?.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                      <Tooltip title="Restore this block to document">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<IconRotate2 size={13} />}
                          onClick={() => handleRestoreSection(block)}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', py: 0.4, px: 1, minWidth: 'auto', flexShrink: 0 }}
                        >
                          Restore
                        </Button>
                      </Tooltip>
                    </Paper>
                  ))}
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    fullWidth
                    onClick={() => setDeletedBlocks([])}
                    sx={{ mt: 1, textTransform: 'none', fontSize: '0.7rem' }}
                  >
                    Clear All Deleted Blocks
                  </Button>
                </Stack>
              )}
            </Box>
          )}
            </Box>
          )}
        </Paper>

        {/* CENTER A4 DOCUMENT WORKSPACE */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: isDark ? (theme.palette.dark?.[900] || '#0f172a') : (theme.palette.grey?.[200] || '#cbd5e1')
          }}
        >
          <Box
            ref={canvasRef}
            id="printable-offer-document-flow"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              position: 'relative',
              width: 794
            }}
          >
            {paginatedPages.map((pageSections, pageIndex) => (
              <Box
                key={`a4-page-${pageIndex + 1}`}
                className="a4-document-page-sheet"
                sx={{
                  width: 794,
                  minHeight: 1123,
                  bgcolor: '#ffffff',
                  p: 3.5,
                  mb: 4,
                  borderRadius: '2px',
                  boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.5)' : '0 10px 25px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15, 23, 42, 0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  boxSizing: 'border-box',
                  fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  color: '#1e293b'
                }}
              >
                {/* Visual Page Sheet Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    pb: 0.75,
                    borderBottom: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: 'text.secondary',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem'
                    }}
                  >
                    PAGE {pageIndex + 1} OF {paginatedPages.length}
                  </Typography>
                  <Chip
                    label={`A4 PORTRAIT • 210 × 297 mm`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      bgcolor: isDark ? 'grey.100' : 'grey.50',
                      color: 'text.secondary',
                      fontWeight: 700,
                      borderRadius: '4px'
                    }}
                  />
                </Box>

                {/* Sections placed on this page */}
                {pageSections.map((sec) => {
                  const overallIdx = sections.findIndex((s) => s.id === sec.id);
                  return renderSection(sec, overallIdx);
                })}

                {/* Visual Page Sheet Footer */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 28,
                    right: 28,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 0.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    fontSize: '8px',
                    color: 'text.secondary'
                  }}
                >
                  <span>{liveDataMap['{{companyName}}'] || 'Offer of Appointment'}</span>
                  <span>Page {pageIndex + 1} of {paginatedPages.length}</span>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>


        {/* ==============================|| RIGHT DYNAMIC PLACEHOLDERS & PROPERTIES PANEL ||============================== */}
        <Paper
          elevation={0}
          sx={{
            width: inspectorOpen ? 360 : 42,
            minWidth: inspectorOpen ? 360 : 42,
            maxWidth: inspectorOpen ? 360 : 42,
            borderLeft: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 260ms cubic-bezier(0.4, 0, 0.2, 1), min-width 260ms cubic-bezier(0.4, 0, 0.2, 1), max-width 260ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {!inspectorOpen ? (
            <Box
              onClick={() => setInspectorOpen(true)}
              sx={{
                width: 42,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
                  '& .inspector-collapsed-title': { color: 'primary.main' }
                }
              }}
            >
              {/* Top Chevron button */}
              <Tooltip title="Expand Placeholders & Properties" placement="left">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setInspectorOpen(true); }} sx={{ p: 0.5 }}>
                  <IconChevronLeft size={18} />
                </IconButton>
              </Tooltip>

              {/* Centered Vertical "DYNAMIC PLACEHOLDERS" Label */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <Typography
                  className="inspector-collapsed-title"
                  variant="caption"
                  sx={{
                    writingMode: 'vertical-rl',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s ease'
                  }}
                >
                  Dynamic Placeholders
                </Typography>
              </Box>

              {/* Bottom empty spacing placeholder */}
              <Box sx={{ height: 28, width: 28 }} />
            </Box>
          ) : (() => {
            const activeInspSec = sections.find((s) => s.id === activeSectionId);
            return (
              <Box sx={{ width: 360, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.6, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? alpha(theme.palette.background.default, 0.8) : 'grey.50' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Inspector
                  </Typography>
                  <Tooltip title="Collapse Panel">
                    <IconButton size="small" onClick={() => setInspectorOpen(false)} sx={{ p: 0.3 }}>
                      <IconChevronRight size={15} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Tabs Header - matching left Toolbox Tabs style */}
                <Tabs
                  value={rightPanelTab}
                  onChange={(e, nv) => setRightPanelTab(nv)}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 44 }}
                >
                  <Tab
                    icon={<IconSparkles size={16} />}
                    iconPosition="start"
                    label="Dynamic Placeholders"
                    sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  <Tab
                    icon={<IconAdjustments size={16} />}
                    iconPosition="start"
                    label="Section Properties"
                    sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                </Tabs>

                {/* TAB 0: DYNAMIC PLACEHOLDERS */}
                {rightPanelTab === 0 && (
                  <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Method Instructions Alert */}
                    <Alert severity="info" icon={<IconInfoCircle size={18} />} sx={{ borderRadius: '10px', py: 1, fontSize: '0.76rem' }}>
                      <strong>Two placeholder insertion methods available:</strong>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        <li>Click or drag & drop any placeholder chip directly into your content editor or subject field.</li>
                        <li>Type "/" in any Rich Text section to open the contextual placeholder suggestion dropdown and select a relevant placeholder.</li>
                      </ul>
                    </Alert>

                    {/* Categorized Placeholder Groups */}
                    <Stack spacing={1.75}>
                      {OFFER_LETTER_PLACEHOLDER_GROUPS.map((group, groupIdx) => (
                        <Paper
                          key={groupIdx}
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'background.default' : 'background.paper', borderColor: 'divider' }}
                        >
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 0.75 }}>
                            {group.category}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {group.keys.map((ph) => {
                              const liveVal = liveDataMap[ph.token] || '';
                              return (
                                <Tooltip
                                  key={ph.token}
                                  arrow
                                  placement="top"
                                  title={
                                    <Box sx={{ p: 0.5, maxWidth: 240 }}>
                                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#fff' }}>
                                        {ph.label} ({ph.token})
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', color: '#93c5fd', mt: 0.25 }}>
                                        Live Value: <strong>{liveVal || '(No preview value)'}</strong>
                                      </Typography>
                                      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', mt: 0.5 }}>
                                        Drag & drop or click to insert into template
                                      </Typography>
                                    </Box>
                                  }
                                >
                                  <Chip
                                    label={
                                      <span>
                                        {ph.label}
                                        {liveVal ? (
                                          <span style={{ opacity: 0.85, marginLeft: 4, fontWeight: 500, color: isDark ? '#93c5fd' : '#1e40af' }}>
                                            : <strong>{liveVal.length > 18 ? liveVal.substring(0, 18) + '…' : liveVal}</strong>
                                          </span>
                                        ) : null}
                                      </span>
                                    }
                                    size="small"
                                    variant="outlined"
                                    color={liveVal ? 'primary' : 'default'}
                                    draggable
                                    onDragStart={(e) => handleDragStartToken(e, ph)}
                                    onClick={() => handleInsertTokenIntoActiveEditor(ph.token)}
                                    sx={{
                                      cursor: 'grab',
                                      fontWeight: 600,
                                      fontSize: '0.72rem',
                                      borderRadius: '8px',
                                      wordBreak: 'break-word',
                                      '&:active': { cursor: 'grabbing' },
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        borderColor: 'primary.main'
                                      }
                                    }}
                                  />
                                </Tooltip>
                              );
                            })}
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* TAB 1: SECTION PROPERTIES */}
                {rightPanelTab === 1 && (
                  <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activeInspSec ? (
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.75, borderRadius: '12px', bgcolor: isDark ? alpha(theme.palette.background.default, 0.8) : 'grey.50', borderColor: 'divider' }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <IconAdjustments size={16} color={theme.palette.primary.main} />
                            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.primary' }}>
                              Section Properties
                            </Typography>
                          </Stack>
                          <Chip
                            label={activeInspSec.type.replace(/_/g, ' ')}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: '0.6rem', height: 18, textTransform: 'capitalize' }}
                          />
                        </Stack>

                        <Stack spacing={1.5}>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: 0.4 }}>
                              Section Label
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={activeInspSec.title}
                              onChange={(e) => setSections((prev) => prev.map((s) => s.id === activeInspSec.id ? { ...s, title: e.target.value } : s))}
                              inputProps={{ style: { fontSize: '0.8rem' } }}
                            />
                          </Box>

                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: 0.4 }}>
                              Show in Document
                            </Typography>
                            <IconButton size="small" onClick={() => handleToggleSectionEnabled(activeInspSec.id)} sx={{ p: 0.5 }}>
                              {activeInspSec.enabled
                                ? <IconEye size={18} color={theme.palette.primary.main} />
                                : <IconEyeOff size={18} color={theme.palette.text.disabled} />}
                            </IconButton>
                          </Stack>

                          <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: 0.4 }}>
                                Block Width ({activeInspSec.sectionWidth ?? 100}%)
                              </Typography>
                            </Stack>
                            <Slider
                              size="small"
                              value={activeInspSec.sectionWidth ?? 100}
                              min={50}
                              max={100}
                              step={5}
                              color="primary"
                              onChange={(e, val) => setSections((prev) => prev.map((s) => s.id === activeInspSec.id ? { ...s, sectionWidth: val } : s))}
                            />
                          </Box>

                          {/* Signatures & Acceptance Block Properties (Reusing ATS Email Content Master Editability) */}
                          {activeInspSec.type === 'signature_block' && (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                              <Divider />

                              {/* Section 1: Authorized Signatory Configuration */}
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <IconSignature size={16} /> Authorized Signatory
                              </Typography>

                              <BOSTextField
                                label="Signatory Header *"
                                placeholder="e.g. Authorized By"
                                size="small"
                                fullWidth
                                value={activeInspSec.content?.authLabel ?? 'Authorized By'}
                                onChange={(e) => updateSectionContent(activeInspSec.id, { authLabel: e.target.value })}
                                inputProps={{ style: { fontSize: '0.8rem' } }}
                              />

                              {/* Use Current Logged-in User Credentials Toggle (Matching ATS Email Content Designer) */}
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: '12px',
                                  bgcolor: isDark ? 'dark.800' : 'grey.50',
                                  borderColor: 'divider',
                                  width: '100%',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5, fontSize: '0.64rem' }}>
                                  Use Current Logged-in User Credentials
                                </Typography>
                                <Divider sx={{ mb: 1 }} />
                                <BOSToggleSwitch
                                  name="useCurrentUserCredentials"
                                  value={activeInspSec.content?.useCurrentUserCredentials !== false}
                                  onChange={(e) => updateSectionContent(activeInspSec.id, { useCurrentUserCredentials: e.target.value })}
                                  checkedLabel="Yes"
                                  uncheckedLabel="No"
                                  checkedValue={true}
                                  uncheckedValue={false}
                                />
                              </Paper>

                              {/* When Yes: Preview Details box matching ATS Email Content Master */}
                              {activeInspSec.content?.useCurrentUserCredentials !== false ? (
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    bgcolor: isDark ? 'dark.900' : 'grey.100',
                                    borderColor: 'divider',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', fontSize: '0.64rem' }}>
                                    Preview Details (Current User)
                                  </Typography>
                                  <Divider sx={{ mb: 1 }} />
                                  <Stack spacing={0.5}>
                                    <Box sx={{ display: 'flex', fontSize: '0.75rem' }}>
                                      <Typography variant="caption" sx={{ width: '85px', fontWeight: 600, color: 'text.secondary' }}>Name</Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>: {liveDataMap['{{hrSignatoryName}}'] || loggedInUser?.name || 'SUPER BOSS'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', fontSize: '0.75rem' }}>
                                      <Typography variant="caption" sx={{ width: '85px', fontWeight: 600, color: 'text.secondary' }}>Designation</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.primary' }}>: {liveDataMap['{{hrSignatoryTitle}}'] || loggedInUser?.designation || 'Administrator'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', fontSize: '0.75rem' }}>
                                      <Typography variant="caption" sx={{ width: '85px', fontWeight: 600, color: 'text.secondary' }}>Company</Typography>
                                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>: {liveDataMap['{{companyName}}'] || 'AUTONOMA'}</Typography>
                                    </Box>
                                  </Stack>
                                </Paper>
                              ) : (
                                /* When No: Manual entry fields matching ATS Email Content Master */
                                <Stack spacing={1.25}>
                                  <BOSTextField
                                    label="Signatory Name *"
                                    placeholder="Enter Signatory Name"
                                    size="small"
                                    fullWidth
                                    value={activeInspSec.content?.authName || ''}
                                    onChange={(e) => updateSectionContent(activeInspSec.id, { authName: e.target.value })}
                                    inputProps={{ style: { fontSize: '0.8rem' } }}
                                  />
                                  <BOSTextField
                                    select
                                    label="Designation *"
                                    size="small"
                                    fullWidth
                                    value={activeInspSec.content?.authDesignation || ''}
                                    onChange={(e) => updateSectionContent(activeInspSec.id, { authDesignation: e.target.value })}
                                    inputProps={{ style: { fontSize: '0.8rem' } }}
                                  >
                                    {(designationsList || []).map((desg) => (
                                      <MenuItem key={desg.id || desg.designationCode || desg.designationName} value={desg.designationName || desg.name}>
                                        {desg.designationName || desg.name}
                                      </MenuItem>
                                    ))}
                                  </BOSTextField>
                                  <BOSTextField
                                    select
                                    label="Department *"
                                    size="small"
                                    fullWidth
                                    value={activeInspSec.content?.authDepartment || ''}
                                    onChange={(e) => updateSectionContent(activeInspSec.id, { authDepartment: e.target.value })}
                                    inputProps={{ style: { fontSize: '0.8rem' } }}
                                  >
                                    {(departmentsList || []).map((dept) => (
                                      <MenuItem key={dept.id || dept.departmentCode || dept.departmentName} value={dept.departmentName || dept.name}>
                                        {dept.departmentName || dept.name}
                                      </MenuItem>
                                    ))}
                                  </BOSTextField>
                                  <BOSTextField
                                    label="Contact Number"
                                    placeholder="Enter Contact Number"
                                    size="small"
                                    fullWidth
                                    value={activeInspSec.content?.authPhone || ''}
                                    onChange={(e) => updateSectionContent(activeInspSec.id, { authPhone: e.target.value })}
                                    inputProps={{ style: { fontSize: '0.8rem' } }}
                                  />
                                </Stack>
                              )}

                              {/* Section 2: Signature Components & Toggles (Matching ATS "Email Components" Card) */}
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.75,
                                  borderRadius: '14px',
                                  bgcolor: isDark ? 'dark.800' : 'grey.50',
                                  borderColor: 'divider',
                                  width: '100%',
                                  boxSizing: 'border-box'
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.64rem' }}>
                                  <IconLayoutGrid size={15} /> Signature Components
                                </Typography>

                                <Stack spacing={1}>
                                  {/* Toggle 1: Include Candidate Acceptance */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontSize: '0.75rem' }}>
                                      Include Candidate Acceptance
                                    </Typography>
                                    <BOSToggleSwitch
                                      name="showCandidateAcceptance"
                                      value={activeInspSec.content?.showCandidateAcceptance !== false}
                                      onChange={(e) => updateSectionContent(activeInspSec.id, { showCandidateAcceptance: e.target.value })}
                                      checkedLabel="Yes"
                                      uncheckedLabel="No"
                                      checkedValue={true}
                                      uncheckedValue={false}
                                    />
                                  </Box>

                                  {/* Candidate Acceptance Header Input if enabled */}
                                  {activeInspSec.content?.showCandidateAcceptance !== false && (
                                    <Box sx={{ pt: 0.5, pb: 0.5 }}>
                                      <BOSTextField
                                        label="Acceptance Header"
                                        placeholder="e.g. Candidate Acceptance"
                                        size="small"
                                        fullWidth
                                        value={activeInspSec.content?.candLabel ?? 'Candidate Acceptance'}
                                        onChange={(e) => updateSectionContent(activeInspSec.id, { candLabel: e.target.value })}
                                        inputProps={{ style: { fontSize: '0.8rem' } }}
                                      />
                                    </Box>
                                  )}

                                  {/* Toggle 2: Include Company Name ("For [Company]") */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontSize: '0.75rem' }}>
                                      Include Company Name
                                    </Typography>
                                    <BOSToggleSwitch
                                      name="includeCompanyName"
                                      value={activeInspSec.content?.includeCompanyName !== false}
                                      onChange={(e) => updateSectionContent(activeInspSec.id, { includeCompanyName: e.target.value })}
                                      checkedLabel="Yes"
                                      uncheckedLabel="No"
                                      checkedValue={true}
                                      uncheckedValue={false}
                                    />
                                  </Box>

                                  {/* Toggle 3: Include Date & Signature Line */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.4 }}>
                                    <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ fontSize: '0.75rem' }}>
                                      Include Signature Line
                                    </Typography>
                                    <BOSToggleSwitch
                                      name="includeSignatureLine"
                                      value={activeInspSec.content?.includeSignatureLine !== false}
                                      onChange={(e) => updateSectionContent(activeInspSec.id, { includeSignatureLine: e.target.value })}
                                      checkedLabel="Yes"
                                      uncheckedLabel="No"
                                      checkedValue={true}
                                      uncheckedValue={false}
                                    />
                                  </Box>
                                </Stack>
                              </Paper>
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: '12px',
                          textAlign: 'center',
                          bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : 'grey.50',
                          borderColor: 'divider'
                        }}
                      >
                        <IconAdjustments size={32} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                          No Section Selected
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.75rem' }}>
                          Select a section from the document canvas or left Toolbox to configure its properties.
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            );
          })()}
        </Paper>
      </Box>

      {/* ==============================|| CONFIRM RESET TEMPLATE DIALOG ||============================== */}
      <Dialog open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)} maxWidth="xs" fullWidth disableScrollLock>
        <DialogTitle sx={{ fontWeight: 800, color: 'text.primary' }}>Reset to Standard Template?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to restore the default ERP standard offer letter template? Any custom section reordering or custom paragraphs will be reset.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setConfirmResetOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleResetToDefault} color="error" variant="contained">
            Reset Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==============================|| SOP USER MANUAL DIALOG ||============================== */}
      <Dialog open={manualOpen} onClose={() => setManualOpen(false)} maxWidth="sm" fullWidth disableScrollLock>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {OfferLetterDesignerManual.title}
          </Typography>
          <IconButton onClick={() => setManualOpen(false)} size="small">
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {OfferLetterDesignerManual.introduction}
          </Typography>
          <Stack spacing={1.5}>
            {OfferLetterDesignerManual.steps.map((st) => (
              <Paper key={st.num} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: isDark ? 'background.default' : 'background.paper', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Chip label={st.num} size="small" color="primary" sx={{ fontWeight: 800 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {st.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                      {st.desc}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setManualOpen(false)} color="primary" variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==============================|| PREVIEW PDF MODAL DIALOG ||============================== */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        disableScrollLock
        disableAutoFocus
        disableRestoreFocus
        disableEnforceFocus
        transitionDuration={0}
        TransitionProps={{ timeout: 0 }}
        BackdropProps={{
          transitionDuration: 0,
          sx: { transition: 'none !important' }
        }}
        sx={{
          zIndex: 1400,
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            bgcolor: isDark ? 'background.default' : '#f1f5f9',
            maxHeight: '92vh',
            maxWidth: 920,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'background.paper' : '#ffffff', borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconEye size={22} color={theme.palette.primary.main} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>Offer Letter Document Preview</Typography>
            <Chip label="A4 Print Simulation" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
          </Stack>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: isDark ? 'background.default' : '#94a3b830', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
          <Box
            sx={{
              width: 794,
              minWidth: 794,
              maxWidth: 794,
              bgcolor: '#ffffff',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.18)',
              borderRadius: '2px',
              border: '1px solid',
              borderColor: 'divider',
              my: 1,
              boxSizing: 'border-box'
            }}
            dangerouslySetInnerHTML={{
              __html: buildCleanOfferLetterHtml({
                sections,
                dataMap: liveDataMap,
                compsList: designerCompsList && designerCompsList.length > 0 ? designerCompsList : activeCompsList,
                salaryMap: Object.keys(designerSalary).length > 0 ? designerSalary : localSalary,
                grossVal: designerGrossVal > 0 ? designerGrossVal : grossVal,
                ctcVal: designerCtcVal > 0 ? designerCtcVal : (ctcVal > 0 ? ctcVal : (designerGrossVal || grossVal)),
                annualCtc: designerAnnualCtc > 0 ? designerAnnualCtc : (annualCtc > 0 ? annualCtc : (totalCTC > 0 ? totalCTC : (designerCtcVal ? designerCtcVal * 12 : 0)))
              })
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: isDark ? 'background.paper' : '#ffffff', borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5, justifyContent: 'flex-end', gap: 1.5 }}>
          <Tooltip title={shortcutTooltip('Close', 'Esc')}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setPreviewOpen(false)}
              sx={{
                borderRadius: '20px',
                height: 36,
                px: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.84rem'
              }}
            >
              Close
            </Button>
          </Tooltip>
          <Tooltip title={shortcutTooltip('Download PDF', 'Space + D')}>
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={isDownloadingPDF ? <CircularProgress size={16} color="inherit" /> : <IconDownload size={17} />}
                disabled={isDownloadingPDF}
                onClick={async () => {
                  setPreviewOpen(false);
                  await handleDownloadPDF();
                }}
                sx={{
                  borderRadius: '20px',
                  height: 36,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  boxShadow: '0 3px 10px 0 rgba(0,0,0,0.12)'
                }}
              >
                {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

OfferLetterDesigner.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  candidates: PropTypes.array,
  initialCandidate: PropTypes.object,
  initialSections: PropTypes.array,
  companyInfo: PropTypes.object,
  loggedInUser: PropTypes.object,
  localSalary: PropTypes.object,
  activeCompsList: PropTypes.array,
  grossVal: PropTypes.number,
  ctcVal: PropTypes.number,
  offerMetadata: PropTypes.object,
  onSaveOfferLetter: PropTypes.func,
  onSelectCandidate: PropTypes.func
};
