import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Typography,
  Button,
  Stack,
  Tooltip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip,
  Paper,
  Alert,
  Divider,
  useTheme,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconMail, IconAlertTriangle, IconCode, IconInfoCircle, IconLayoutGrid, IconAlertCircle, IconBook, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSToggleSwitch, errorStyle, shakeAnimation, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip, btnCancel } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import ReactQuill from 'ui-component/third-party/ReactQuill';

// ==============================|| EMAIL CONTENT MASTER ||============================== //

const parseFooterContent = (footerContent) => {
  const result = {
    footerName: '',
    footerDesignation: '',
    footerDepartment: '',
    footerEmail: '',
    footerNumber: ''
  };
  if (!footerContent) return result;

  const lines = footerContent.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 3) {
    result.footerName = lines[0] || '';
    const desigDept = lines[1] || '';
    if (desigDept.includes(' - ')) {
      const idx = desigDept.indexOf(' - ');
      result.footerDesignation = desigDept.substring(0, idx).trim();
      result.footerDepartment = desigDept.substring(idx + 3).trim();
    } else {
      result.footerDesignation = desigDept;
    }
    result.footerEmail = lines[2] || '';
    result.footerNumber = lines[3] || '';
    return result;
  }

  const parts = footerContent.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    result.footerName = parts[0] || '';
    const desigDept = parts[1] || '';
    if (desigDept.includes(' - ')) {
      const idx = desigDept.indexOf(' - ');
      result.footerDesignation = desigDept.substring(0, idx).trim();
      result.footerDepartment = desigDept.substring(idx + 3).trim();
    } else {
      result.footerDesignation = desigDept;
    }
    result.footerEmail = parts[2] || '';
    result.footerNumber = parts[3] || '';
    return result;
  }

  result.footerName = footerContent;
  return result;
};

const getDynamicFooterText = (preview) => {
  if (!preview) return '';
  const parts = [];
  if (preview.employeeName && preview.employeeName !== 'Not Configured') parts.push(preview.employeeName);
  if (preview.designation && preview.designation !== 'Not Configured') parts.push(preview.designation);
  if (preview.department && preview.department !== 'Not Configured') parts.push(preview.department);
  if (preview.officeEmail && preview.officeEmail !== 'Not Configured') parts.push(preview.officeEmail);
  if (preview.contactNumber && preview.contactNumber !== 'Not Configured') parts.push(preview.contactNumber);
  return parts.join('\n');
};

const INITIAL_STATE = {
  id: null,
  type: '',
  subject: '',
  bodyContent: '',
  yoursWindfully: '',
  footerHeader: 'Thanks & Regards',
  footerContent: '',
  footerName: '',
  footerDesignation: '',
  footerDepartment: '',
  footerEmail: '',
  footerNumber: '',
  useCurrentUserCredentials: false,
  includeCompanyFooter: false,
  includeWebsite: false,
  includeLocation: false,
  isActive: true
};

const TYPE_OPTIONS = [
  'CALL LETTER',
  'OFFER LETTER',
  'DOCUMENT REUPLOAD',
  'BACKGROUND VERIFICATION',
  'REJECTION'
];

const PLACEHOLDER_MAPPINGS_BY_TYPE = {
  'CALL LETTER': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}'] },
    { category: 'Interview & Position', keys: ['{{position}}', '{{department}}', '{{interviewDate}}', '{{interviewTime}}', '{{venue}}'] },
    { category: 'Company & HR Details', keys: ['{{companyName}}', '{{companyAddress}}', '{{hrName}}', '{{hrEmail}}', '{{hrPhone}}'] },
    { category: 'Portal & Validity', keys: ['{{assessmentPortalLink}}', '{{validityDays}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'OFFER LETTER': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{candidateEmail}}'] },
    { category: 'Position Details', keys: ['{{position}}', '{{designation}}', '{{department}}'] },
    { category: 'Company & HR Details', keys: ['{{companyName}}', '{{companyAddress}}', '{{hrName}}', '{{hrEmail}}'] },
    { category: 'Portal & Validity', keys: ['{{onboardingPortalLink}}', '{{validityDays}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'REJECTION': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{candidateEmail}}'] },
    { category: 'Position & Company', keys: ['{{position}}', '{{designation}}', '{{department}}', '{{companyName}}', '{{companyAddress}}', '{{companyMail}}', '{{hrName}}', '{{hrEmail}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'SHORTLISTED': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}'] },
    { category: 'Position & Company', keys: ['{{position}}', '{{department}}', '{{companyName}}', '{{hrName}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'INTERVIEW ASSIGN': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}'] },
    { category: 'Interview Details', keys: ['{{position}}', '{{interviewDate}}', '{{interviewTime}}', '{{venue}}', '{{companyName}}', '{{hrName}}'] }
  ],
  'REJECTED': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}'] },
    { category: 'Position & Company', keys: ['{{position}}', '{{companyName}}', '{{hrName}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'APPOINTMENT LETTER': [
    { category: 'Employee Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{position}}', '{{department}}'] },
    { category: 'Company & HR Details', keys: ['{{companyName}}', '{{companyAddress}}', '{{hrName}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'WELCOME': [
    { category: 'Employee Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{position}}', '{{department}}'] },
    { category: 'Company & HR Details', keys: ['{{companyName}}', '{{companyAddress}}', '{{hrName}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'VISITOR PASS': [
    { category: 'Visitor Information', keys: ['{{visitorName}}', '{{visitDate}}', '{{visitTime}}', '{{hostName}}', '{{department}}', '{{purpose}}', '{{validityDays}}'] },
    { category: 'Company & Map Link', keys: ['{{companyName}}', '{{companyAddress}}', '{{locationMapUrl}}'] }
  ],
  'BACKGROUND VERIFICATION': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{candidateEmail}}'] },
    { category: 'Verification Portal & Support', keys: ['{{verificationPortalLink}}', '{{validityDays}}', '{{supportContact}}', '{{hrName}}', '{{hrEmail}}', '{{companyName}}'] }
  ],
  'DOCUMENT REUPLOAD': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{candidateEmail}}'] },
    { category: 'Rejected Documents & Reason', keys: ['{{rejectedDocumentsList}}', '{{rejectionReason}}'] },
    { category: 'Portal & Support', keys: ['{{reuploadPortalLink}}', '{{validityDays}}', '{{supportContact}}', '{{companyName}}', '{{websiteUrl}}'] }
  ],
  'DOCUMENT VERIFICATION FAILED': [
    { category: 'Candidate Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{candidateEmail}}'] },
    { category: 'Rejection Details', keys: ['{{rejectedDocumentsList}}', '{{rejectionReason}}', '{{reuploadPortalLink}}', '{{supportContact}}', '{{companyName}}'] }
  ],
  'ASSIGN INDUCTION': [
    { category: 'Trainee Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}'] },
    { category: 'Induction Program', keys: ['{{inductionBatchName}}', '{{inductionDate}}', '{{inductionTime}}', '{{trainerName}}'] },
    { category: 'Portal & Actions', keys: ['{{actionPortalLink}}', '{{actionButtonText}}', '{{validityDays}}', '{{companyName}}'] }
  ],
  'INDUCTION TRAINEE REJECT': [
    { category: 'Trainee Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{inductionBatchName}}', '{{trainerName}}', '{{companyName}}'] }
  ],
  'INDUCTION TRAINEE COMPLETED': [
    { category: 'Trainee Details', keys: ['{{candidateName}}', '{{candidateFirstName}}', '{{candidateFullName}}', '{{inductionBatchName}}', '{{trainerName}}', '{{companyName}}'] }
  ],
  'EMPLOYEE MEMO': [
    { category: 'Employee & Memo', keys: ['{{employeeName}}', '{{memoSubject}}', '{{memoBody}}'] },
    { category: 'Company & Dates', keys: ['{{companyName}}', '{{companyAddress}}', '{{hrName}}', '{{currentDate}}', '{{currentYear}}'] }
  ],
  'CUSTOMER SATISFACTION': [
    { category: 'Customer Details', keys: ['{{customerName}}', '{{cycleName}}'] },
    { category: 'Survey & Support', keys: ['{{surveyLink}}', '{{validityDays}}', '{{companyName}}', '{{supportEmail}}'] }
  ],
  'VENDOR SATISFACTION': [
    { category: 'Vendor Details', keys: ['{{vendorName}}', '{{cycleName}}'] },
    { category: 'Survey & Support', keys: ['{{surveyLink}}', '{{validityDays}}', '{{companyName}}', '{{supportEmail}}'] }
  ],
  'EMPLOYEE SATISFACTION': [
    { category: 'Employee Details', keys: ['{{employeeName}}', '{{cycleName}}'] },
    { category: 'Survey & Support', keys: ['{{surveyLink}}', '{{validityDays}}', '{{companyName}}', '{{supportEmail}}'] }
  ],
  'SMTP TEST': [
    { category: 'SMTP Test Info', keys: ['{{smtpHost}}', '{{sentDate}}', '{{companyName}}', '{{hrName}}'] }
  ]
};

const VALIDATION_RULES = [
  { field: 'type', label: 'Type', required: true },
  { field: 'subject', label: 'Subject', required: true },
  { field: 'bodyContent', label: 'Body/Content', required: true },
  { field: 'footerHeader', label: 'Footer Header', required: true },
  {
    field: 'footerName',
    label: 'Name',
    validate: (val, formData) => {
      if (formData.useCurrentUserCredentials !== true) {
        if (!val || !String(val).trim()) {
          return 'Name is required';
        }
      }
      return null;
    }
  },
  {
    field: 'footerDesignation',
    label: 'Designation',
    validate: (val, formData) => {
      if (formData.useCurrentUserCredentials !== true) {
        if (!val || !String(val).trim()) {
          return 'Designation is required';
        }
      }
      return null;
    }
  },
  {
    field: 'footerDepartment',
    label: 'Department',
    validate: (val, formData) => {
      if (formData.useCurrentUserCredentials !== true) {
        if (!val || !String(val).trim()) {
          return 'Department is required';
        }
      }
      return null;
    }
  },
  {
    field: 'footerEmail',
    label: 'Office Email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Office Email format is invalid',
    validate: (val, formData) => {
      if (formData.useCurrentUserCredentials !== true) {
        if (!val || !String(val).trim()) {
          return 'Office Email is required';
        }
      }
      return null;
    }
  },
  {
    field: 'footerNumber',
    label: 'Contact Number',
    type: 'phone',
    validate: (val, formData) => {
      if (formData.useCurrentUserCredentials !== true) {
        if (!val || !String(val).trim()) {
          return 'Contact Number is required';
        }
      }
      return null;
    }
  }
];

const getPlaceholderLabel = (token) => {
  const clean = token.replace(/[{}]/g, '');
  const overrides = {
    hrName: 'HR Name',
    hrEmail: 'HR Email',
    hrPhone: 'HR Phone',
    websiteUrl: 'Website URL',
    locationMapUrl: 'Location Map URL',
    smtpHost: 'SMTP Host'
  };
  if (overrides[clean]) return overrides[clean];
  return clean
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function EmailContent() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({ website: '', gmaplink: '' });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [isDragOverEditor, setIsDragOverEditor] = useState(false);
  const quillRef = useRef(null);

  const [currentUserPreview, setCurrentUserPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shakeAlert, setShakeAlert] = useState(false);
  const validationAlertRef = useRef(null);

  const globalQuery = useSelector((state) => state.search.query) || '';
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const perms = usePagePermissions(PAGE_CODES.ATS_EMAIL_CONTENT);

  // ==================== SLASH SUGGESTIONS STATE & LOGIC ====================
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionCoords, setSuggestionCoords] = useState({ top: 0, left: 0 });
  const [suggestionSelectedIndex, setSuggestionSelectedIndex] = useState(0);
  const [suggestionTriggerIndex, setSuggestionTriggerIndex] = useState(-1);
  const [suggestionActiveType, setSuggestionActiveType] = useState('');

  const suggestionOpenRef = useRef(suggestionOpen);
  const suggestionSelectedIndexRef = useRef(suggestionSelectedIndex);
  const filteredPlaceholdersRef = useRef([]);
  const suggestionTriggerIndexRef = useRef(-1);
  const suggestionQueryRef = useRef('');
  const suggestionActiveTypeRef = useRef('');

  useEffect(() => { suggestionOpenRef.current = suggestionOpen; }, [suggestionOpen]);
  useEffect(() => { suggestionSelectedIndexRef.current = suggestionSelectedIndex; }, [suggestionSelectedIndex]);
  useEffect(() => { suggestionTriggerIndexRef.current = suggestionTriggerIndex; }, [suggestionTriggerIndex]);
  useEffect(() => { suggestionQueryRef.current = suggestionQuery; }, [suggestionQuery]);
  useEffect(() => { suggestionActiveTypeRef.current = suggestionActiveType; }, [suggestionActiveType]);

  const availablePlaceholders = useMemo(() => {
    if (!formData.type) return [];
    const normalizedType = String(formData.type).trim().toUpperCase();
    const mappings = PLACEHOLDER_MAPPINGS_BY_TYPE[formData.type] || PLACEHOLDER_MAPPINGS_BY_TYPE[normalizedType];
    if (!mappings) return [];
    const list = [];
    const seen = new Set();
    mappings.forEach(group => {
      group.keys.forEach(key => {
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            token: key,
            label: getPlaceholderLabel(key)
          });
        }
      });
    });
    return list;
  }, [formData.type]);

  const filteredPlaceholders = useMemo(() => {
    if (!suggestionQuery) return availablePlaceholders;
    const q = suggestionQuery.toLowerCase();
    return availablePlaceholders.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.token.toLowerCase().includes(q)
    );
  }, [suggestionQuery, availablePlaceholders]);

  useEffect(() => {
    filteredPlaceholdersRef.current = filteredPlaceholders;
    setSuggestionSelectedIndex(0);
  }, [filteredPlaceholders]);

  const insertPlaceholder = useCallback((token) => {
    const quill = quillRef.current?.getEditor ? quillRef.current.getEditor() : quillRef.current;
    if (!quill) {
      setSuggestionOpen(false);
      return;
    }

    const range = quill.getSelection();
    if (!range) {
      setSuggestionOpen(false);
      return;
    }

    const cursorIndex = range.index;
    const triggerIdx = suggestionTriggerIndexRef.current;
    const activeType = suggestionActiveTypeRef.current;

    // Guard: Ensure Email Type has not changed since the suggestion was triggered
    if (activeType !== formData.type) {
      setSuggestionOpen(false);
      return;
    }

    // Guard: Ensure the selected placeholder is valid for the current active Email Type
    const isValidToken = availablePlaceholders.some(item => item.token === token);
    if (!isValidToken) {
      setSuggestionOpen(false);
      return;
    }

    const lengthToReplace = cursorIndex - triggerIdx;
    
    // Guard: Ensure trigger index and replacement length are valid
    if (triggerIdx < 0 || lengthToReplace < 1) {
      setSuggestionOpen(false);
      return;
    }

    // Guard: Ensure the editor text actually contains the slash trigger query at that location
    const currentQueryText = quill.getText(triggerIdx, lengthToReplace);
    if (!currentQueryText.startsWith('/') || currentQueryText.substring(1) !== suggestionQueryRef.current) {
      setSuggestionOpen(false);
      return;
    }

    // Perform replacement
    quill.deleteText(triggerIdx, lengthToReplace, 'user');
    quill.insertText(triggerIdx, token, 'user');
    quill.setSelection(triggerIdx + token.length, 0, 'user');
    quill.focus();
    setSuggestionOpen(false);
  }, [availablePlaceholders, formData.type]);

  // Hook to handle slash detection and coordinate tracking
  useEffect(() => {
    if (!dialogOpen) {
      setSuggestionOpen(false);
      return;
    }

    const quill = quillRef.current?.getEditor ? quillRef.current.getEditor() : quillRef.current;
    if (!quill) return;

    const checkSuggestions = () => {
      const range = quill.getSelection();
      if (!range || range.length > 0) {
        setSuggestionOpen(false);
        return;
      }

      const cursorIndex = range.index;
      const textBeforeCursor = quill.getText(0, cursorIndex);

      const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
      if (lastSlashIndex === -1) {
        setSuggestionOpen(false);
        return;
      }

      const charBeforeSlash = lastSlashIndex > 0 ? textBeforeCursor.charAt(lastSlashIndex - 1) : ' ';
      const isValidTrigger = (lastSlashIndex === 0 || /\s/.test(charBeforeSlash));

      if (!isValidTrigger) {
        setSuggestionOpen(false);
        return;
      }

      const queryText = textBeforeCursor.substring(lastSlashIndex + 1);
      if (/\n/.test(queryText)) {
        setSuggestionOpen(false);
        return;
      }

      setSuggestionQuery(queryText);
      setSuggestionTriggerIndex(lastSlashIndex);
      setSuggestionActiveType(formData.type);

      try {
        const bounds = quill.getBounds(lastSlashIndex);
        const offsetTop = quill.container.offsetTop || 0;
        const offsetLeft = quill.container.offsetLeft || 0;

        setSuggestionCoords({
          left: bounds.left + offsetLeft,
          top: bounds.top + bounds.height + offsetTop + 4
        });
        setSuggestionOpen(true);
      } catch (err) {
        console.warn('Failed to calculate Quill bounds:', err);
        setSuggestionOpen(false);
      }
    };

    quill.on('text-change', checkSuggestions);
    quill.on('selection-change', checkSuggestions);

    const scrollContainer = quill.root;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkSuggestions);
    }

    return () => {
      quill.off('text-change', checkSuggestions);
      quill.off('selection-change', checkSuggestions);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkSuggestions);
      }
    };
  }, [dialogOpen, formData.type]);

  // Hook to handle keyboard interceptions while dropdown is open
  useEffect(() => {
    const quill = quillRef.current?.getEditor ? quillRef.current.getEditor() : quillRef.current;
    if (!quill || !quill.root) return;

    const handleKeyDown = (e) => {
      if (!suggestionOpenRef.current) return;

      const items = filteredPlaceholdersRef.current;
      const count = items.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionSelectedIndex((prev) => (count > 0 ? (prev + 1) % count : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionSelectedIndex((prev) => (count > 0 ? (prev - 1 + count) % count : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (count > 0 && items[suggestionSelectedIndexRef.current]) {
          insertPlaceholder(items[suggestionSelectedIndexRef.current].token);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionOpen(false);
      }
    };

    quill.root.addEventListener('keydown', handleKeyDown, true);
    return () => {
      quill.root.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [insertPlaceholder]);

  // Hook to handle closing when clicking outside the editor or suggestion panel
  useEffect(() => {
    if (!suggestionOpen) return;

    const handleOutsideClick = (e) => {
      const quill = quillRef.current?.getEditor ? quillRef.current.getEditor() : quillRef.current;
      const isInsideEditor = quill && quill.root.contains(e.target);
      const dropdownEl = document.getElementById('quill-suggestion-dropdown');
      const isInsideDropdown = dropdownEl && dropdownEl.contains(e.target);

      if (!isInsideEditor && !isInsideDropdown) {
        setSuggestionOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [suggestionOpen]);

  const fetchSenderPreview = useCallback(() => {
    if (dialogOpen && formData.useCurrentUserCredentials === true) {
      setLoadingPreview(true);
      axios.get('/api/hr/email-content/sender-preview')
        .then(res => {
          setCurrentUserPreview(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch sender preview:', err);
        })
        .finally(() => {
          setLoadingPreview(false);
        });
    } else if (!formData.useCurrentUserCredentials) {
      setCurrentUserPreview(null);
    }
  }, [dialogOpen, formData.useCurrentUserCredentials]);

  const columns = useMemo(() => [
    { id: 'index', label: '#', minWidth: 60, align: 'center' },
    {
      id: 'type',
      label: 'Type',
      bold: true,
      minWidth: 150,
      align: 'center',
      render: (row) => (
        <span style={{ color: isDark ? '#ffffff' : '#2196f3' }}>
          {row.type}
        </span>
      )
    },
    {
      id: 'useCurrentUserCredentials',
      label: 'USE LOGGED-IN USER',
      minWidth: 180,
      align: 'center',
      render: (row) => (row.useCurrentUserCredentials === true ? 'Yes' : 'No')
    },
    {
      id: 'createdUser',
      label: 'CREATED USER',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        let cUser = row.createdUser || row.createdBy || '-';
        if (cUser === 'Admin istrator' || cUser === 'Administrator') cUser = 'Admin';
        return cUser;
      }
    },
    {
      id: 'createdAt',
      label: 'CREATED DATE',
      minWidth: 180,
      align: 'center',
      render: (row) => {
        const val = row.createdAt || row.createdDate;
        return val ? new Date(val).toLocaleString('en-GB') : '-';
      }
    },
    {
      id: 'updatedUser',
      label: 'UPDATED USER',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        let uUser = row.updatedUser || row.updatedBy || '-';
        if (uUser === 'Admin istrator' || uUser === 'Administrator') uUser = 'Admin';
        return uUser;
      }
    },
    {
      id: 'updatedAt',
      label: 'UPDATED DATE',
      minWidth: 180,
      align: 'center',
      render: (row) => {
        const val = row.updatedAt || row.updatedDate;
        return val ? new Date(val).toLocaleString('en-GB') : '-';
      }
    },
    {
      id: 'isActive',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <BOSStatusChip status={row.isActive !== false ? 'Active' : 'Inactive'} showIcon />
        </Box>
      )
    }
  ], [isDark]);

  // Dispatch starred filter configuration matching Status
  useEffect(() => {
    const config = [{
      id: 'isActive',
      label: 'Status',
      type: 'select',
      isRequired: true,
      options: [
        { value: 'ALL', label: 'ALL' },
        { value: 'ACTIVE', label: 'ACTIVE' },
        { value: 'INACTIVE', label: 'INACTIVE' }
      ],
      defaultValue: 'ACTIVE',
      isStarred: true
    },
    ...getCommonDateFilters('createdAt', 'updatedAt')];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      isActive: 'ACTIVE',
      createdAt: '',
      updatedAt: ''
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/email-content');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch email contents:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const fetchCompanyProfile = useCallback(async () => {
    try {
      const res = await axios.get('/api/company-profile/all');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const activeCompanyName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
        const comp = res.data.find(c => c.companyName === activeCompanyName) || res.data[0];
        setCompanyInfo({
          website: (comp.website || '').trim(),
          gmaplink: (comp.gmaplink || '').trim()
        });
      }
    } catch (err) {
      console.error('Failed to load Company Profile for email designer:', err);
    }
  }, []);

  const fetchDesignationsAndDepartments = useCallback(async () => {
    try {
      const [deptRes, desgRes] = await Promise.all([
        axios.get('/api/master/hr/departments'),
        axios.get('/api/master/hr/designations')
      ]);
      setDepartments(deptRes.data || []);
      setDesignations(desgRes.data || []);
    } catch (err) {
      console.error('Failed to load departments or designations:', err);
    }
  }, []);

  useEffect(() => {
    fetchRows();
    fetchCompanyProfile();
    fetchDesignationsAndDepartments();
  }, [fetchRows, fetchCompanyProfile, fetchDesignationsAndDepartments]);

  useEffect(() => {
    fetchSenderPreview();
  }, [fetchSenderPreview]);

  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const eventData = e.detail;
      if (!eventData) return;
      if (eventData.entityName === 'EmailContentController') {
        fetchRows();
      } else if (eventData.entityName === 'EmployeeMasterController') {
        fetchSenderPreview();
      }
    };
    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
    };
  }, [fetchRows, fetchSenderPreview]);

  const isWebsiteConfigured = useMemo(() => {
    return Boolean(companyInfo.website && companyInfo.website !== '#');
  }, [companyInfo.website]);

  const isLocationConfigured = useMemo(() => {
    return Boolean(companyInfo.gmaplink && companyInfo.gmaplink !== '#');
  }, [companyInfo.gmaplink]);

  const getMissingDetails = useCallback(() => {
    if (formData.useCurrentUserCredentials !== true) return [];
    const missing = [];
    if (!currentUserPreview || !currentUserPreview.employeeName || currentUserPreview.employeeName === 'Not Configured') missing.push('Name');
    if (!currentUserPreview || !currentUserPreview.designation || currentUserPreview.designation === 'Not Configured') missing.push('Designation');
    if (!currentUserPreview || !currentUserPreview.department || currentUserPreview.department === 'Not Configured') missing.push('Department');
    if (!currentUserPreview || !currentUserPreview.officeEmail || currentUserPreview.officeEmail === 'Not Configured') missing.push('Office Email');
    if (!currentUserPreview || !currentUserPreview.contactNumber || currentUserPreview.contactNumber === 'Not Configured') missing.push('Official Contact Number');
    return missing;
  }, [formData.useCurrentUserCredentials, currentUserPreview]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setIsDragOverEditor(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    const parsed = parseFooterContent(row.footerContent || '');
    setFormData({
      ...row,
      includeCompanyFooter: row.includeCompanyFooter === true,
      includeWebsite: row.includeWebsite === true,
      includeLocation: row.includeLocation === true,
      footerHeader: row.footerHeader || 'Thanks & Regards',
      footerContent: row.footerContent || '',
      ...parsed,
      useCurrentUserCredentials: row.useCurrentUserCredentials === true
    });
    setErrors({});
    setIsDragOverEditor(false);
    setDialogOpen(true);
  };

  const handleTypeChange = async (newType) => {
    setSuggestionOpen(false);
    setSuggestionQuery('');
    setSuggestionSelectedIndex(0);
    setSuggestionTriggerIndex(-1);
    setSuggestionActiveType('');

    setFormData(prev => ({ ...prev, type: newType }));
    if (newType) clearErrors('type');

    if (!formData.id && newType) {
      try {
        const response = await axios.get(`/api/hr/email-content/by-type?type=${encodeURIComponent(newType)}`);
        if (response.data) {
          const t = response.data;
          const parsed = parseFooterContent(t.footerContent || '');
          setFormData(prev => ({
            ...prev,
            type: newType,
            subject: t.subject || '',
            bodyContent: t.bodyContent || '',
            yoursWindfully: t.yoursWindfully || '',
            includeCompanyFooter: t.includeCompanyFooter === true,
            includeWebsite: t.includeWebsite === true,
            includeLocation: t.includeLocation === true,
            footerHeader: t.footerHeader || 'Thanks & Regards',
            footerContent: t.footerContent || '',
            ...parsed,
            useCurrentUserCredentials: t.useCurrentUserCredentials === true,
            isActive: t.isActive !== false
          }));
          if (t.subject) clearErrors('subject');
          if (t.bodyContent) clearErrors('bodyContent');
        }
      } catch (err) {
        console.error('Failed to load default template for type:', err);
      }
    } else if (!newType && !formData.id) {
      setFormData(INITIAL_STATE);
      setErrors({});
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'type') {
      handleTypeChange(value);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      if (errors[name]) clearErrors(name);
    }
  };

  const executeSave = async () => {
    try {
      let finalFooterContent = formData.footerContent || '';
      if (formData.useCurrentUserCredentials !== true) {
        const parts = [];
        if (formData.footerName) parts.push(formData.footerName.trim());
        const desig = formData.footerDesignation ? formData.footerDesignation.trim() : '';
        const dept = formData.footerDepartment ? formData.footerDepartment.trim() : '';
        if (desig && dept) {
          parts.push(`${desig} - ${dept}`);
        } else if (desig) {
          parts.push(desig);
        } else if (dept) {
          parts.push(dept);
        }
        if (formData.footerEmail) parts.push(formData.footerEmail.trim());
        if (formData.footerNumber) parts.push(formData.footerNumber.trim());
        finalFooterContent = parts.join('\n');
      }

      const payload = {
        ...formData,
        footerContent: finalFooterContent
      };

      delete payload.footerName;
      delete payload.footerDesignation;
      delete payload.footerDepartment;
      delete payload.footerEmail;
      delete payload.footerNumber;

      if (!formData.id) {
        payload.isActive = true;
      }

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.index;

      if (formData.id) {
        await axios.put(`/api/hr/email-content/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Email Content Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/hr/email-content', payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Email Content Saved Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save email content';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    if (formData.useCurrentUserCredentials === true) {
      const missing = [];
      if (!currentUserPreview || !currentUserPreview.employeeName || currentUserPreview.employeeName === 'Not Configured') missing.push('Name');
      if (!currentUserPreview || !currentUserPreview.designation || currentUserPreview.designation === 'Not Configured') missing.push('Designation');
      if (!currentUserPreview || !currentUserPreview.department || currentUserPreview.department === 'Not Configured') missing.push('Department');
      if (!currentUserPreview || !currentUserPreview.officeEmail || currentUserPreview.officeEmail === 'Not Configured') missing.push('Office Email');
      if (!currentUserPreview || !currentUserPreview.contactNumber || currentUserPreview.contactNumber === 'Not Configured') missing.push('Official Contact Number');

      if (missing.length > 0) {
        validationAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setShakeAlert(true);
        setTimeout(() => {
          setShakeAlert(false);
        }, 500);
        return;
      }
    }

    // Validate Company Profile constraints
    if (formData.includeCompanyFooter !== false) {
      if (formData.includeWebsite === true && !isWebsiteConfigured) {
        dispatch(openSnackbar({
          open: true,
          message: 'Cannot save: Company Website is not configured in Company Profile (Administration → Company Profile → Contact & Web).',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        return;
      }
      if (formData.includeLocation === true && !isLocationConfigured) {
        dispatch(openSnackbar({
          open: true,
          message: 'Cannot save: Company Location Map Link is not configured in Company Profile (Administration → Company Profile → Contact & Web).',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        return;
      }
    }

    const isCurrentActive = formData.isActive !== false;
    if (isCurrentActive) {
      const hasDuplicate = rows.some(r =>
        r.type?.trim().toLowerCase() === formData.type?.trim().toLowerCase() &&
        r.isActive !== false &&
        (!formData.id || r.id !== formData.id)
      );

      if (hasDuplicate) {
        setWarningDialogOpen(true);
        return;
      }
    }

    await executeSave();
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/email-content/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Email Content Deleted Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Failed to delete:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', variant: 'alert', severity: 'error' }));
    }
  };

  const currentPlaceholderCategories = useMemo(() => {
    if (!formData.type) return null;
    const normalizedType = String(formData.type).trim().toUpperCase();
    return PLACEHOLDER_MAPPINGS_BY_TYPE[formData.type] || PLACEHOLDER_MAPPINGS_BY_TYPE[normalizedType] || null;
  }, [formData.type]);

  const resolvedRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdAt', 'updatedAt')) return false;

        const statusFilter = globalFilters.isActive || 'ACTIVE';
        if (statusFilter !== 'ALL') {
          const isActiveVal = statusFilter === 'ACTIVE';
          if (row.isActive !== isActiveVal) return false;
        }

        if (globalQuery) {
          const q = globalQuery.toLowerCase();
          const matchText = (
            (row.type || '') + ' ' +
            (row.subject || '') + ' ' +
            (row.bodyContent || '')
          ).toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .map((r, i) => {
        return {
          ...r,
          index: i + 1,
          createdAt: r.createdAt || r.createdDate,
          updatedAt: r.updatedAt || r.updatedDate
        };
      });
  }, [rows, globalQuery, globalFilters]);

  // Handle Drag & Drop Over ReactQuill Editor using Quill API
  const handleEditorDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOverEditor) {
      setIsDragOverEditor(true);
    }
  };

  const handleEditorDragLeave = (e) => {
    e.preventDefault();
    setIsDragOverEditor(false);
  };

  const handleEditorDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverEditor(false);

    const text = e.dataTransfer.getData('text/plain');
    if (!text || !text.trim()) return;

    const placeholderText = text.trim();

    if (quillRef.current) {
      const quill = quillRef.current.getEditor ? quillRef.current.getEditor() : quillRef.current;
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

        // Fallback to current selection or document end if position calculation fails
        if (dropIndex === null || dropIndex < 0) {
          const selection = quill.getSelection();
          if (selection) {
            dropIndex = selection.index;
          } else {
            dropIndex = Math.max(0, quill.getLength() - 1);
          }
        }

        const maxLen = quill.getLength();
        if (dropIndex > maxLen) dropIndex = maxLen;
        if (dropIndex < 0) dropIndex = 0;

        // Use Quill's official API to insert text at exact drop index
        quill.insertText(dropIndex, placeholderText, 'user');
        quill.setSelection(dropIndex + placeholderText.length, 0, 'user');
        quill.focus();

        if (errors.bodyContent) clearErrors('bodyContent');

        dispatch(openSnackbar({
          open: true,
          message: `Inserted ${placeholderText} into body content`,
          variant: 'alert',
          severity: 'info'
        }));
      }
    }
  };

  // Click-to-insert or Append Placeholder using Quill API
  const handleInsertPlaceholder = (ph) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor ? quillRef.current.getEditor() : quillRef.current;
      if (quill) {
        const range = quill.getSelection(true);
        let index = range ? range.index : Math.max(0, quill.getLength() - 1);
        quill.insertText(index, ph, 'user');
        quill.setSelection(index + ph.length, 0, 'user');
        quill.focus();
        if (errors.bodyContent) clearErrors('bodyContent');
        dispatch(openSnackbar({
          open: true,
          message: `Inserted ${ph} at cursor position`,
          variant: 'alert',
          severity: 'info'
        }));
        return;
      }
    }
    setFormData(prev => ({
      ...prev,
      bodyContent: (prev.bodyContent || '') + ' ' + ph
    }));
    if (errors.bodyContent) clearErrors('bodyContent');
    dispatch(openSnackbar({
      open: true,
      message: `Appended ${ph} to body content`,
      variant: 'alert',
      severity: 'info'
    }));
  };

  const handleDragStart = (e, ph) => {
    e.dataTransfer.setData('text/plain', ph);
    e.dataTransfer.setData('text/html', ph);
    e.dataTransfer.effectAllowed = 'copy';

    const dragEl = document.createElement('div');
    dragEl.innerText = ph;
    dragEl.style.position = 'absolute';
    dragEl.style.top = '-9999px';
    dragEl.style.left = '-9999px';
    dragEl.style.padding = '4px 10px';
    dragEl.style.borderRadius = '8px';
    dragEl.style.border = `1px solid ${isDark ? '#90caf9' : '#2196f3'}`;
    dragEl.style.backgroundColor = isDark ? '#1e293b' : '#ffffff';
    dragEl.style.color = isDark ? '#90caf9' : '#2196f3';
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
    e.dataTransfer.setDragImage(dragEl, xOffset, yOffset);

    setTimeout(() => {
      if (dragEl.parentNode) {
        dragEl.parentNode.removeChild(dragEl);
      }
    }, 0);
  };

  return (
    <MainCard fullWidth
      pageCode={PAGE_CODES.ATS_EMAIL_CONTENT}
      icon={IconMail}
      title={"Email Content Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportFilename="Email_Content"
          hasExportPermission={perms.export}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={handleDelete}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Email Content Designer"
        fullWidth
        maxWidth="lg"
        onSave={handleSave}
        onClear={formData.id ? () => {
          setFormData(INITIAL_STATE);
          setErrors({});
          setIsDragOverEditor(false);
        } : undefined}
        secondaryActions={formData.id ? (
          <Tooltip title="Cancel (Space + C)">
            <Button
              variant="contained"
              onClick={() => setDialogOpen(false)}
              sx={btnCancel}
            >
              Cancel
            </Button>
          </Tooltip>
        ) : undefined}
        hasId={!!formData.id}
        onDelete={() => {
          setDeleteTarget(formData);
          setDeleteDialogOpen(true);
        }}
      >
        {/* FIXED TWO-COLUMN LAYOUT CONTAINER */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            width: '100%',
            boxSizing: 'border-box',
            mt: 0.5,
            alignItems: 'flex-start'
          }}
        >
          {/* LEFT COLUMN: 65% FIXED WIDTH */}
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '0 0 64%' },
              maxWidth: { xs: '100%', md: '64%' },
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.25
            }}
          >
            <BOSTextField
              select
              name="type"
              label="EMAIL TYPE"
              value={formData.type}
              onChange={handleInputChange}
              required
              fullWidth
              helperText={errors.type || "Select email type to load context placeholders"}
              error={!!errors.type}
              sx={{ ...errorStyle(!!errors.type), width: '100%', boxSizing: 'border-box' }}
            >

              {(() => {
                const options = [...TYPE_OPTIONS];
                if (formData.type && !options.includes(formData.type)) {
                  options.push(formData.type);
                }
                return options.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ));
              })()}
            </BOSTextField>

            <BOSTextField
              name="subject"
              label="SUBJECT"
              placeholder="Enter email subject template"
              value={formData.subject}
              onChange={handleInputChange}
              onDrop={(e) => {
                e.preventDefault();
                const text = e.dataTransfer.getData('text/plain');
                if (!text || !text.trim()) return;
                const ph = text.trim();
                const input = e.target;
                const start = input.selectionStart ?? (formData.subject || '').length;
                const end = input.selectionEnd ?? (formData.subject || '').length;
                const currentVal = formData.subject || '';
                const newVal = currentVal.substring(0, start) + ph + currentVal.substring(end);
                setFormData(prev => ({ ...prev, subject: newVal }));
                if (errors.subject) clearErrors('subject');
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              required
              fullWidth
              error={!!errors.subject}
              helperText={errors.subject}
              sx={{ ...errorStyle(!!errors.subject), width: '100%', boxSizing: 'border-box' }}
            />

            <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: errors.bodyContent ? 'error.main' : 'text.primary' }}>
                BODY / CONTENT <span style={{ color: 'red' }}>*</span>
              </Typography>

              {/* EDITOR WRAPPER BOX WITH DRAG & DROP TARGET HIGHLIGHT */}
              <Box
                onDragOver={handleEditorDragOver}
                onDragLeave={handleEditorDragLeave}
                onDrop={handleEditorDrop}
                sx={{
                  position: 'relative',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  border: isDragOverEditor ? '2px dashed #2563eb' : '2px solid transparent',
                  bgcolor: isDragOverEditor ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                  boxShadow: isDragOverEditor ? '0 0 12px rgba(37, 99, 235, 0.18)' : 'none',
                  '& .ql-editor': {
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                    minHeight: '210px',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  },
                  '& .ql-container': {
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    fontFamily: 'inherit'
                  }
                }}
              >
                <ReactQuill
                  ref={quillRef}
                  value={formData.bodyContent || ''}
                  onChange={(content) => {
                    setFormData(prev => ({ ...prev, bodyContent: content }));
                    if (content && content.trim().length > 0 && errors.bodyContent) {
                      clearErrors('bodyContent');
                    }
                  }}
                  editorMinHeight={210}
                />

                {/* Inline Slash Suggestions Dropdown */}
                {suggestionOpen && (
                  <Paper
                    elevation={8}
                    id="quill-suggestion-dropdown"
                    sx={{
                      position: 'absolute',
                      left: suggestionCoords.left,
                      top: suggestionCoords.top,
                      zIndex: 1500,
                      width: '280px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      bgcolor: isDark ? 'dark.800' : 'background.paper',
                      borderColor: 'divider',
                      border: '1px solid',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {filteredPlaceholders.length === 0 ? (
                      <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          No matching placeholders
                        </Typography>
                      </Box>
                    ) : (
                      filteredPlaceholders.map((item, index) => (
                        <MenuItem
                          key={item.token}
                          selected={index === suggestionSelectedIndex}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents focus loss from Quill editor
                            insertPlaceholder(item.token);
                          }}
                          sx={{
                            py: 1,
                            px: 1.5,
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {item.label}
                        </MenuItem>
                      ))
                    )}
                  </Paper>
                )}
              </Box>
              {errors.bodyContent && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.bodyContent}
                </Typography>
              )}
            </Box>

            {/* YOURS WINDFULLY Section */}
            <Box sx={{ width: '100%', boxSizing: 'border-box', mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                YOURS WINDFULLY
              </Typography>

              <Stack spacing={2} sx={{ width: '100%' }}>
                <BOSTextField
                  name="footerHeader"
                  label="Footer Header *"
                  placeholder="Enter footer header (e.g. Thanks & Regards)"
                  value={formData.footerHeader}
                  onChange={handleInputChange}
                  required
                  fullWidth
                  error={!!errors.footerHeader}
                  helperText={errors.footerHeader}
                  sx={{ ...errorStyle(!!errors.footerHeader), width: '100%', boxSizing: 'border-box' }}
                />

                {/* Toggle switch for logged-in user credentials */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.75,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'dark.800' : 'grey.50',
                    borderColor: errors.useCurrentUserCredentials ? 'error.main' : 'divider',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                    '&:focus-within, &:focus': {
                      borderColor: 'primary.main',
                      boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)',
                      outline: 'none'
                    }
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                    Use Current Logged-in User Credentials
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <BOSToggleSwitch
                    name="useCurrentUserCredentials"
                    value={formData.useCurrentUserCredentials !== false}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, useCurrentUserCredentials: val }));
                      if (errors.useCurrentUserCredentials) clearErrors('useCurrentUserCredentials');
                      if (val && errors.footerContent) clearErrors('footerContent');
                    }}
                    checkedLabel="Yes"
                    uncheckedLabel="No"
                    checkedValue={true}
                    uncheckedValue={false}
                  />
                </Paper>

                {/* RED VALIDATION ALERT CARD */}
                {formData.useCurrentUserCredentials === true && getMissingDetails().length > 0 && (
                  <Box
                    ref={validationAlertRef}
                    sx={{
                      p: 2.25,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid',
                      borderColor: '#fca5a5',
                      width: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 2.5,
                      ...(shakeAlert ? shakeAnimation : {})
                    }}
                  >
                    <IconAlertCircle
                      size={24}
                      color="#ef4444"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="#ef4444"
                        sx={{ mb: 0.5, lineHeight: 1.3 }}
                      >
                        Cannot save this template. The following official employee details are not configured:
                      </Typography>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#ef4444', listStyleType: 'disc' }}>
                        {getMissingDetails().map(field => (
                          <li key={field} style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
                            {field}
                          </li>
                        ))}
                      </ul>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                        <IconBook size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                        <Typography
                          variant="body2"
                          color="#ef4444"
                          sx={{ fontWeight: 600 }}
                        >
                          Please configure these details in Employee Master → Job Details and try again.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Current User Preview */}
                {formData.useCurrentUserCredentials === true && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'dark.900' : 'grey.100',
                      borderColor: 'divider',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Preview Details
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    {loadingPreview ? (
                      <Typography variant="body2" color="text.secondary">Loading preview...</Typography>
                    ) : currentUserPreview ? (
                      <Stack spacing={0.75}>
                        <Box sx={{ display: 'flex' }}>
                          <Typography variant="body2" sx={{ width: '130px', fontWeight: 600, color: 'text.secondary' }}>Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>: {currentUserPreview.employeeName || 'Not Configured'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <Typography variant="body2" sx={{ width: '130px', fontWeight: 600, color: 'text.secondary' }}>Designation</Typography>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>: {currentUserPreview.designation || 'Not Configured'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <Typography variant="body2" sx={{ width: '130px', fontWeight: 600, color: 'text.secondary' }}>Department</Typography>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>: {currentUserPreview.department || 'Not Configured'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <Typography variant="body2" sx={{ width: '130px', fontWeight: 600, color: 'text.secondary' }}>Office Email</Typography>
                          <Typography variant="body2" sx={{ color: currentUserPreview.officeEmail === 'Not Configured' ? 'error.main' : 'text.primary', fontWeight: currentUserPreview.officeEmail === 'Not Configured' ? 600 : 400 }}>: {currentUserPreview.officeEmail || 'Not Configured'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex' }}>
                          <Typography variant="body2" sx={{ width: '130px', fontWeight: 600, color: 'text.secondary' }}>Contact Number</Typography>
                          <Typography variant="body2" sx={{ color: currentUserPreview.contactNumber === 'Not Configured' ? 'error.main' : 'text.primary', fontWeight: currentUserPreview.contactNumber === 'Not Configured' ? 600 : 400 }}>: {currentUserPreview.contactNumber || 'Not Configured'}</Typography>
                        </Box>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No preview details available.</Typography>
                    )}
                  </Paper>
                )}

                {formData.useCurrentUserCredentials === true ? (
                  <BOSTextField
                    name="footerContent"
                    label="Footer Content"
                    value={getDynamicFooterText(currentUserPreview)}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    fullWidth
                    disabled={true}
                    sx={{ width: '100%', boxSizing: 'border-box' }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 2,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <BOSTextField
                      name="footerName"
                      label="Name *"
                      placeholder="Enter Name"
                      value={formData.footerName || ''}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={!!errors.footerName}
                      helperText={errors.footerName}
                      sx={{ ...errorStyle(!!errors.footerName), width: '100%', boxSizing: 'border-box' }}
                    />
                    <BOSTextField
                      select
                      name="footerDesignation"
                      label="Designation *"
                      value={formData.footerDesignation || ''}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={!!errors.footerDesignation}
                      helperText={errors.footerDesignation}
                      sx={{ ...errorStyle(!!errors.footerDesignation), width: '100%', boxSizing: 'border-box' }}
                      InputProps={{
                        endAdornment: formData.footerDesignation ? (
                          <InputAdornment position="end" style={{ marginRight: '24px' }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, footerDesignation: '' }));
                              }}
                            >
                              <IconX size={16} />
                            </IconButton>
                          </InputAdornment>
                        ) : null
                      }}
                    >
                      {(designations || []).map((desg) => (
                        <MenuItem key={desg.id} value={desg.designationName}>
                          {desg.designationName}
                        </MenuItem>
                      ))}
                    </BOSTextField>
                    <BOSTextField
                      select
                      name="footerDepartment"
                      label="Department *"
                      value={formData.footerDepartment || ''}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={!!errors.footerDepartment}
                      helperText={errors.footerDepartment}
                      sx={{ ...errorStyle(!!errors.footerDepartment), width: '100%', boxSizing: 'border-box' }}
                      InputProps={{
                        endAdornment: formData.footerDepartment ? (
                          <InputAdornment position="end" style={{ marginRight: '24px' }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, footerDepartment: '' }));
                              }}
                            >
                              <IconX size={16} />
                            </IconButton>
                          </InputAdornment>
                        ) : null
                      }}
                    >
                      {(departments || []).map((dept) => (
                        <MenuItem key={dept.id} value={dept.departmentName}>
                          {dept.departmentName}
                        </MenuItem>
                      ))}
                    </BOSTextField>
                    <BOSTextField
                      name="footerEmail"
                      label="Office Email *"
                      placeholder="Enter Office Email"
                      value={formData.footerEmail || ''}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={!!errors.footerEmail}
                      helperText={errors.footerEmail}
                      sx={{ ...errorStyle(!!errors.footerEmail), width: '100%', boxSizing: 'border-box' }}
                    />
                    <BOSTextField
                      name="footerNumber"
                      type="phone"
                      label="Contact Number *"
                      placeholder="Enter Contact Number"
                      value={formData.footerNumber || ''}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      error={!!errors.footerNumber}
                      helperText={errors.footerNumber}
                      sx={{ ...errorStyle(!!errors.footerNumber), width: '100%', boxSizing: 'border-box' }}
                    />
                  </Box>
                )}
              </Stack>
            </Box>

            {/* STATUS CONTAINER WRAPPER matching ERP Master Forms */}
            <Paper
              variant="outlined"
              tabIndex={0}
              sx={{
                p: 1.75,
                borderRadius: '12px',
                bgcolor: isDark ? 'dark.800' : 'grey.50',
                borderColor: errors.isActive ? 'error.main' : 'divider',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:focus-within, &:focus': {
                  borderColor: 'primary.main',
                  boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)',
                  outline: 'none'
                }
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                STATUS
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <BOSToggleSwitch
                name="isActive"
                value={formData.isActive !== false}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, isActive: e.target.value }));
                  if (errors.isActive) clearErrors('isActive');
                }}
                checkedLabel="Active"
                uncheckedLabel="Inactive"
                checkedValue={true}
                uncheckedValue={false}
                error={!!errors.isActive}
                helperText={errors.isActive}
              />
            </Paper>
          </Box>

          {/* RIGHT COLUMN: 35% FIXED WIDTH (INDEPENDENT SCROLL) */}
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '0 0 36%' },
              maxWidth: { xs: '100%', md: '36%' },
              width: '100%',
              boxSizing: 'border-box',
              position: 'sticky',
              top: 0,
              maxHeight: '620px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.25,
              pr: 0.5
            }}
          >
            {/* CARD 1: DYNAMIC PLACEHOLDERS */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '16px',
                bgcolor: isDark ? 'dark.800' : 'grey.50',
                borderColor: 'divider',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconCode size={20} /> Dynamic Placeholders
                </Typography>
                {formData.type && (
                  <Chip label={formData.type} size="small" color="primary" variant="filled" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                )}
              </Box>

              {!formData.type ? (
                <Box sx={{ py: 3, px: 2, textAlign: 'center', bgcolor: 'background.paper', borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Select an Email Type to view available placeholders.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Alert severity="info" icon={<IconInfoCircle size={18} />} sx={{ mb: 1.75, borderRadius: '10px', py: 1, fontSize: '0.78rem' }}>
                    <strong>Two placeholder insertion methods available:</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      <li>Click or drag & drop any placeholder chip directly into your content editor or subject field.</li>
                      <li>Type "/" in the Subject or Body/Content field to open the contextual placeholder suggestion dropdown and select a relevant placeholder.</li>
                    </ul>
                  </Alert>

                  <Stack spacing={1.75}>
                    {(currentPlaceholderCategories || []).map((group, groupIdx) => (
                      <Paper
                        key={groupIdx}
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'background.paper', borderColor: 'divider' }}
                      >
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, display: 'block', mb: 0.75 }}>
                          {group.category}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {group.keys.map((ph) => (
                            <Chip
                              key={ph}
                              label={getPlaceholderLabel(ph)}
                              size="small"
                              variant="outlined"
                              color="primary"
                              draggable
                              onDragStart={(e) => handleDragStart(e, ph)}
                              onClick={() => handleInsertPlaceholder(ph)}
                              sx={{
                                cursor: 'grab',
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                borderRadius: '8px',
                                wordBreak: 'break-word',
                                '&:active': { cursor: 'grabbing' },
                                '&:hover': {
                                  bgcolor: 'primary.lighter',
                                  borderColor: 'primary.main'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}
            </Paper>

            {/* CARD 2: EMAIL COMPONENTS (COMPACT ERP TOGGLE SWITCHES) */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '16px',
                bgcolor: isDark ? 'dark.800' : 'grey.50',
                borderColor: 'divider',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <IconLayoutGrid size={20} /> Email Components
              </Typography>

              <Stack spacing={1.25}>
                {/* 1. Include Company Footer */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Include Company Footer
                  </Typography>
                  <BOSToggleSwitch
                    name="includeCompanyFooter"
                    value={formData.includeCompanyFooter !== false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      includeCompanyFooter: e.target.value
                    }))}
                    checkedLabel="Yes"
                    uncheckedLabel="No"
                    checkedValue={true}
                    uncheckedValue={false}
                  />
                </Box>

                {/* 2. Include Website Button */}
                <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} color={(formData.includeCompanyFooter === false || !isWebsiteConfigured) ? 'text.disabled' : 'text.primary'}>
                      Include Website Button
                    </Typography>
                    <BOSToggleSwitch
                      name="includeWebsite"
                      value={formData.includeWebsite !== false}
                      disabled={formData.includeCompanyFooter === false || !isWebsiteConfigured}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        includeWebsite: e.target.value
                      }))}
                      checkedLabel="Yes"
                      uncheckedLabel="No"
                      checkedValue={true}
                      uncheckedValue={false}
                    />
                  </Box>
                  {formData.includeCompanyFooter !== false && !isWebsiteConfigured && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.75,
                      mt: 0.75,
                      bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb',
                      border: `1px solid ${isDark ? 'rgba(217, 119, 6, 0.3)' : '#fde68a'}`,
                      p: 1.25,
                      borderRadius: '8px'
                    }}>
                      <IconAlertTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.73rem', fontWeight: 600, lineHeight: 1.4, color: isDark ? '#fbbf24' : '#b45309' }}>
                        Company Website is not configured.<br />Configure it in: <strong>Administration → Company Profile → Contact & Web</strong>.
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* 3. Include Location Button */}
                <Box sx={{ pb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} color={(formData.includeCompanyFooter === false || !isLocationConfigured) ? 'text.disabled' : 'text.primary'}>
                      Include Location Button
                    </Typography>
                    <BOSToggleSwitch
                      name="includeLocation"
                      value={formData.includeLocation !== false}
                      disabled={formData.includeCompanyFooter === false || !isLocationConfigured}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        includeLocation: e.target.value
                      }))}
                      checkedLabel="Yes"
                      uncheckedLabel="No"
                      checkedValue={true}
                      uncheckedValue={false}
                    />
                  </Box>
                  {formData.includeCompanyFooter !== false && !isLocationConfigured && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.75,
                      mt: 0.75,
                      bgcolor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb',
                      border: `1px solid ${isDark ? 'rgba(217, 119, 6, 0.3)' : '#fde68a'}`,
                      p: 1.25,
                      borderRadius: '8px'
                    }}>
                      <IconAlertTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.73rem', fontWeight: 600, lineHeight: 1.4, color: isDark ? '#fbbf24' : '#b45309' }}>
                        Company Location Map Link is not configured.<br />Configure it in: <strong>Administration → Company Profile → Contact & Web</strong>.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic', fontSize: '0.74rem' }}>
                Website and Location buttons will render dynamically from Company Profile if configured.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Email Content"
        message="Are you sure you want to completely remove this email content?"
        itemName={deleteTarget?.type}
      />

      <Dialog
        open={warningDialogOpen}
        onClose={() => setWarningDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'warning.light',
            borderBottom: '1px solid',
            borderColor: 'warning.main',
            py: 2,
            px: 3
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'warning.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconAlertTriangle size={22} color="#b78103" />
          </Box>
          <Typography variant="h5" fontWeight={600} color="#b78103">
            Duplicate Record Warning
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3, px: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Warning: An active record with this email type <strong>{formData.type}</strong> already exists.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Saving this record as active will automatically mark the previous active record as inactive. Do you want to proceed?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setWarningDialogOpen(false)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderColor: 'divider' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setWarningDialogOpen(false);
              executeSave();
            }}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#f57c00', '&:hover': { bgcolor: '#e65100' } }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}