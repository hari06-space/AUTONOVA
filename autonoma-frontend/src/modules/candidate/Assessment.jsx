import useConfig from 'hooks/useConfig';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Select,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  MenuItem,
  Tooltip,
  Rating,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Divider,
  Chip,
  Snackbar,
  IconButton,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Logo from 'ui-component/Logo';
import BOSTextField from 'ui-component/bos/BOSTextField';
import {
  CandidatePortalSplash as AssessmentSplash,
  CandidateNetworkBackground as AssessmentNetworkBackground,
  CandidatePortalHeader,
  staticBgStylesheet,
  TranslationTooltip,
  SmoothLoadingSpinner,
  PremiumStarRating,
  UniquePrevSymbolButton,
  UniqueNextSymbolButton
} from './CandidatePortalShared';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { playPortalSound } from 'utils/AudioEngine';
import {
  IconMoon,
  IconSun,
  IconUser,
  IconCalendar,
  IconFileText,
  IconAward,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconUpload,
  IconChevronRight,
  IconClock,
  IconAlertCircle,
  IconCircleCheck,
  IconBriefcase,
  IconLock,
  IconTrendingUp,
  IconDeviceFloppy,
  IconHome,
  IconUsers,
  IconShieldCheck,
  IconEye,
  IconEdit,
  IconX,
  IconPhoto
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOSFileUpload, BOSFilePreview } from 'ui-component/bos';
import { getFileViewUrl, getCompanyImageUrl } from 'utils/upload-helper';
import { getCleanFileName } from 'ui-component/bos/BOSUtils';


// Global focus patch to prevent page-scroll jumping when inputs/elements receive focus
if (typeof window !== 'undefined' && typeof HTMLElement !== 'undefined') {
  const originalFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function (options) {
    return originalFocus.call(this, { ...options, preventScroll: true });
  };
}

const MotionButton = motion(Button);
const MotionCard = motion(Card);
const MotionBox = motion(Box);


const REASON_FOR_LEAVING_OPTIONS = [
  'Better Opportunity',
  'Career Change',
  'Face Book',
  'Personal Reasons',
  'Relocation',
  'Others'
];

const MISTAKE_HANDLING_OPTIONS = [
  'Cover Up Mistakes',
  'Divert Blame',
  'Make Excuse',
  'Owning Mistakes'
];

const STEPS = [
  { id: 1, name: 'Welcome' },
  { id: 2, name: 'Applicant Details' },
  { id: 3, name: 'Personal Details' },
  { id: 4, name: 'Lifestyle & Health' },
  { id: 5, name: 'Reflection' },
  { id: 6, name: 'Career & Expectations' },
  { id: 7, name: 'Behavior' },
  { id: 8, name: 'Documents' },
  { id: 9, name: 'Review & Submit' }
];

/**
 * Safely splits a comma-separated document path string into individual paths.
 * Handles filenames containing commas (e.g. "ChatGPT Image Jul 31, 2026, 04_57_36 PM.png")
 * by only splitting on commas that are followed by a known subdirectory pattern (e.g. "Default/").
 * Falls back to treating the entire string as a single path if no safe delimiter is found.
 */
const parseDocumentPaths = (pathStr) => {
  if (!pathStr || typeof pathStr !== 'string') return [];
  const trimmed = pathStr.trim();
  if (!trimmed) return [];
  // Split only on commas followed by a directory-like segment (e.g. "Default/", "HR_ATS/", "QMS/")
  const paths = trimmed.split(/,(?=[A-Za-z0-9_-]+\/)/).map(p => p.trim()).filter(Boolean);
  return paths;
};

/**
 * Deduplicates a comma-separated document path string.
 * Uses parseDocumentPaths for safe splitting, then removes duplicate entries,
 * and joins them back with commas.
 */
const deduplicatePaths = (pathStr) => {
  if (!pathStr || typeof pathStr !== 'string') return '';
  const paths = parseDocumentPaths(pathStr);
  const unique = Array.from(new Set(paths));
  return unique.join(',');
};

export default function CandidateAssessment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const urlToken = (searchParams.get('token') || '').trim();
  const stableToken = urlToken ||
    (sessionStorage.getItem('candidateSessionToken') || '').trim() ||
    (localStorage.getItem('candidateSessionToken') || '').trim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [candidate, setCandidate] = useState(() => {
    try {
      const cached = localStorage.getItem(`candidate_details_${stableToken}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });
  const [verifying, setVerifying] = useState(true);
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('candidateThemeMode') || 'dark');
  
  // Active step state
  const [currentStep, setCurrentStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [docPreview, setDocPreview] = useState({ open: false, docs: [], currentIndex: 0 });

  const openDocPreview = (docs, startIndex = 0) => setDocPreview({ open: true, docs, currentIndex: startIndex });
  const closeDocPreview = () => setDocPreview({ open: false, docs: [], currentIndex: 0 });
  const prevDoc = () => setDocPreview(prev => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  const nextDoc = () => setDocPreview(prev => ({ ...prev, currentIndex: Math.min(prev.docs.length - 1, prev.currentIndex + 1) }));

  const isImageFile = (url) => {
    if (!url) return false;
    let checkUrl = url;
    try {
      if (url.includes('?')) {
        const urlObj = new URL(url, window.location.origin);
        const pathParam = urlObj.searchParams.get('path');
        if (pathParam) {
          checkUrl = pathParam;
        }
      }
    } catch (e) {}
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test((checkUrl || '').split('?')[0]);
  };
  const [errors, setErrors] = useState({});

  const assessmentStarted = currentStep > 1;

  // Splash animation only shows on the first page, and is skipped on reload/remaining pages
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('candidate_assessment_started') === 'true' || localStorage.getItem(`candidate_assessment_started_${stableToken}`) === 'true';
  });
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('candidate_assessment_started') !== 'true' && localStorage.getItem(`candidate_assessment_started_${stableToken}`) !== 'true';
  });

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
        // delay marking done until exit animation completes (0.8s)
        setTimeout(() => setSplashDone(true), 800);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [verifying, minSplashTimeElapsed, showSplash]);

  // Set assessment started state when stepping beyond first page
  useEffect(() => {
    if (currentStep > 1) {
      sessionStorage.setItem('candidate_assessment_started', 'true');
      localStorage.setItem(`candidate_assessment_started_${stableToken}`, 'true');
    }
  }, [currentStep, stableToken]);

  // Reset scroll position to top whenever currentStep changes
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
  }, [currentStep]);

  // Unlock scrolling on root document when assessment starts
  useEffect(() => {
    if (assessmentStarted || isMobile) {
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
  }, [assessmentStarted, isMobile]);

  const showSnackbar = (message, severity = 'error') => {
    playPortalSound(severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'success');
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const [companyBranding, setCompanyBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('candidate_company_branding');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      companyName: '',
      logoUrl: null
    };
  });

  const getCandidateFirstNameOnly = (cand) => {
    if (!cand) return 'Candidate';
    if (cand.firstName && cand.firstName.trim()) {
      const firstWord = cand.firstName.trim().split(/\s+/)[0];
      const clean = firstWord.replace(/[^a-zA-Z0-9]/g, '');
      if (clean) return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
    const fullName = cand.employeeName || cand.name || '';
    if (!fullName.trim()) return 'Candidate';
    const firstWord = fullName.trim().split(/\s+/)[0];
    const clean = firstWord.replace(/[^a-zA-Z0-9]/g, '');
    return clean ? (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()) : 'Candidate';
  };



  const [rejectedDocuments, setRejectedDocuments] = useState([]);
  const [userReplacedDocs, setUserReplacedDocs] = useState(new Set());

  // Form State
  const [formData, setFormData] = useState({
    gender: '',
    religion: '',
    q1_native: '',
    q2_present_address: '',
    q3_permanent_address: '',
    q4_father_occupation: '',
    q5_mother_occupation: '',
    q6_marital_status: '',
    q7_spouse_occupation: '',
    q8_children: '',
    q9_has_relatives: '',
    q10_relatives_details: '',
    q11_siblings_occupations: '',
    q12_has_two_wheeler: '',
    q13_has_android_phone: '',
    q14_knows_car_driving: '',
    q15_willing_to_travel: '',
    q16_covid_vaccination: '',
    q47_has_insurance: '',
    q48_insurance_number: '',
    q17_positive_points: '',
    q18_negative_points: '',
    q19_life_goals: '',
    q20_willing_rotational_shifts: '',
    q20_improvement_suggestions: '',
    q21_is_experienced: '',
    q22_total_experience: '',
    q23_core_experience: '',
    q24_prev_net_salary: '',
    q25_prev_gross_salary: '',
    q26_expected_net_salary: '',
    q27_expected_gross_salary: '',
    q28_pf_higher_pension: '',
    q29_pf_deduction_amount: '',
    q30_alternative_department: '',
    q31_prev_location: '',
    q32_prev_shift: '',
    q33_reason_for_leaving: '',
    q34_notice_period: '',
    q35_prev_dept_position: '',
    q36_prev_dept_count: '',
    q38_handle_mistake: '',
    q39_handle_opinion_difference: '',
    q40_computer_self_rating: '',
    q41_hr_mgr_name: '',
    q42_hr_mgr_email: '',
    q43_hr_mgr_phone: '',
    q43_hr_mgr_country_id: '',
    q44_vert_head_name: '',
    q45_vert_head_email: '',
    q46_vert_head_phone: '',
    q46_vert_head_country_id: '',
    employeePhotoUpload: '',
    resumePath: '',
    payslipPath: '',
    aadharPath: '',
    photoVerifiedStatus: '',
    resumeVerifiedStatus: '',
    payslipVerifiedStatus: '',
    aadharVerifiedStatus: '',
    photoRejectReason: '',
    resumeRejectReason: '',
    payslipRejectReason: '',
    aadharRejectReason: '',
    same_as_current_address: 'NO'
  });

  const [portalDepartments, setPortalDepartments] = useState([]);
  const [portalShifts, setPortalShifts] = useState([]);
  const [countries, setCountries] = useState([]);

  // Fetch dynamic company profile branding and portal masters on mount
  useEffect(() => {
    axios.get('/api/hra/applicants/portal/branding')
      .then(res => {
        if (res.data) {
          const cName = res.data.companyName || 'Autonova ERP Corp';
          const logoFileName = res.data.logoFileName;
          const lUrl = logoFileName ? getCompanyImageUrl(logoFileName) : null;
          const brandingData = { companyName: cName, logoUrl: lUrl };
          setCompanyBranding(brandingData);
          localStorage.setItem('candidate_company_branding', JSON.stringify(brandingData));
        }
      })
      .catch(err => console.error("Failed to fetch public portal branding", err));

    axios.get('/api/hra/applicants/portal/masters')
      .then(res => {
        if (res.data) {
          setPortalDepartments(res.data.departments || []);
          setPortalShifts(res.data.shifts || []);
        }
      })
      .catch(err => console.error("Failed to fetch public portal masters", err));

    axios.get('/api/hra/applicants/portal/countries')
      .then(res => {
        if (res.data) {
          setCountries(res.data || []);
        }
      })
      .catch(err => console.error("Failed to fetch public portal countries", err));
  }, []);

  // Verify token
  useEffect(() => {
    const token = stableToken;

    if (!token) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        axios.get('/api/hra/applicants/portal/generate-test-token?empCode=APPL-0001')
          .then(res => {
            if (res.data && res.data.token) {
              navigate(`/candidate/assessment?token=${res.data.token}`, { replace: true });
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

    const verifyToken = async () => {
      try {
        setVerifying(true);
        setError('');
        const response = await axios.get('/api/hra/applicants/portal/verify-token', {
          params: { token }
        });

        if (response.data && response.data.valid) {
          sessionStorage.setItem('candidateSessionToken', stableToken);
          localStorage.setItem('candidateSessionToken', stableToken);
          setCandidate(response.data.applicant);
          localStorage.setItem(`candidate_details_${stableToken}`, JSON.stringify(response.data.applicant));
          setRejectedDocuments(response.data.rejectedDocuments || []);
          
          const cName = response.data.companyName || 'Autonova ERP Corp';
          const logoFileName = response.data.logoFileName;
          const lUrl = logoFileName ? getCompanyImageUrl(logoFileName) : null;
          const brandingData = { companyName: cName, logoUrl: lUrl };
          setCompanyBranding(brandingData);
          localStorage.setItem('candidate_company_branding', JSON.stringify(brandingData));
          
          if (response.data.applicant) {
            const app = response.data.applicant;
            
            // Restore currentStep from localStorage or backend API response
            const savedStep = localStorage.getItem(`assessment_step_${stableToken}`);
            const backendStep = response.data.currentStep || app.currentStep;
            const restoredStep = savedStep ? parseInt(savedStep, 10) : (backendStep ? parseInt(backendStep, 10) : 1);
            if (restoredStep >= 1 && restoredStep <= 9) {
              setCurrentStep(restoredStep);
            }

            // Try loading from localStorage draft first
            let draft = {};
            const savedDraft = localStorage.getItem(`assessment_draft_${stableToken}`);
            if (savedDraft) {
              try {
                draft = JSON.parse(savedDraft);
              } catch (e) {
                console.error("Failed to parse saved draft", e);
              }
            }

            const responseRejDocs = response.data.rejectedDocuments || [];
            const hasRejection = (app && (
              String(app.photoVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
              String(app.resumeVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
              String(app.aadharVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
              String(app.payslipVerifiedStatus || '').toUpperCase() === 'REJECTED'
            )) || (responseRejDocs.length > 0);

            const rawReligion = draft.religion !== undefined ? draft.religion : (app.religion || '');
            const PREDEFINED_RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];
            let initReligionSelect = '';
            let initReligionOther = '';

            if (rawReligion) {
              if (PREDEFINED_RELIGIONS.includes(rawReligion)) {
                initReligionSelect = rawReligion;
              } else if (rawReligion === 'Other') {
                initReligionSelect = 'Other';
              } else {
                initReligionSelect = 'Other';
                initReligionOther = rawReligion;
              }
            }
            if (draft.religionSelect !== undefined) {
              initReligionSelect = draft.religionSelect;
            }
            if (draft.religion_other !== undefined) {
              initReligionOther = draft.religion_other;
            }

            const rawReason = draft.q33_reason_for_leaving !== undefined ? draft.q33_reason_for_leaving : (app.q33_reason_for_leaving || app.q33_reasonForLeaving || '');
            const PREDEFINED_REASONS = ['Better Opportunity', 'Career Change', 'Face Book', 'Personal Reasons', 'Relocation', 'Others', 'Other'];
            let initReasonSelect = '';
            let initReasonOther = '';

            if (rawReason) {
              if (rawReason.startsWith('Others:') || rawReason.startsWith('Other:')) {
                initReasonSelect = 'Others';
                const parts = rawReason.split(':');
                initReasonOther = parts.slice(1).join(':').trim();
              } else if (PREDEFINED_REASONS.includes(rawReason)) {
                initReasonSelect = (rawReason === 'Other' || rawReason === 'Others') ? 'Others' : rawReason;
              } else {
                initReasonSelect = 'Others';
                initReasonOther = rawReason;
              }
            }
            if (draft.q33_reason_for_leaving !== undefined) {
              initReasonSelect = draft.q33_reason_for_leaving;
            }
            if (draft.q33_reason_for_leaving_other !== undefined) {
              initReasonOther = draft.q33_reason_for_leaving_other;
            }

            // Helper to retrieve field value from draft or database applicant object
            const getVal = (draftVal, appVal) => {
              if (draftVal !== undefined && draftVal !== null && draftVal !== '') return draftVal;
              if (appVal !== undefined && appVal !== null && appVal !== 'null') return appVal;
              return '';
            };

            const deriveGenderFromTitle = (titleVal) => {
              if (!titleVal) return '';
              const t = titleVal.toString().trim().replace(/\.$/, '').toUpperCase();
              if (t === 'MR') return 'MALE';
              if (t === 'MISS' || t === 'MRS' || t === 'MS') return 'FEMALE';
              if (t === 'MX') return 'TRANS';
              return '';
            };

            const tempFormData = {
              gender: getVal(draft.gender, app.gender) || deriveGenderFromTitle(app.title || candidate?.title),
              religion: rawReligion,
              religionSelect: initReligionSelect,
              religion_other: initReligionOther,
              q1_native: getVal(draft.q1_native, app.q1_native),
              q2_present_address: getVal(draft.q2_present_address, app.q2_present_address || app.q2_presentAddress),
              q3_permanent_address: getVal(draft.q3_permanent_address, app.q3_permanent_address || app.q3_permanentAddress),
              q4_father_occupation: getVal(draft.q4_father_occupation, app.q4_father_occupation || app.q4_fatherOccupation),
              q5_mother_occupation: getVal(draft.q5_mother_occupation, app.q5_mother_occupation || app.q5_motherOccupation),
              q6_marital_status: getVal(draft.q6_marital_status, app.q6_marital_status || app.q6_maritalStatus),
              q7_spouse_occupation: getVal(draft.q7_spouse_occupation, app.q7_spouse_occupation || app.q7_spouseOccupation),
              q8_children: getVal(draft.q8_children, app.q8_children),
              q9_has_relatives: getVal(draft.q9_has_relatives, app.q9_has_relatives || app.q9_hasRelativesInCompany),
              q10_relatives_details: getVal(draft.q10_relatives_details, app.q10_relatives_details || app.q10_relativesDetails),
              q11_siblings_occupations: getVal(draft.q11_siblings_occupations, app.q11_siblings_occupations || app.q11_siblingsOccupations),
              q12_has_two_wheeler: getVal(draft.q12_has_two_wheeler, app.q12_has_two_wheeler || app.q12_hasTwoWheeler),
              q13_has_android_phone: getVal(draft.q13_has_android_phone, app.q13_has_android_phone || app.q13_hasAndroidPhone),
              q14_knows_car_driving: getVal(draft.q14_knows_car_driving, app.q14_knows_car_driving || app.q14_knowsCarDriving),
              q15_willing_to_travel: getVal(draft.q15_willing_to_travel, app.q15_willing_to_travel || app.q15_willingToTravel),
              q16_covid_vaccination: getVal(draft.q16_covid_vaccination, app.q16_covid_vaccination || app.q16_covidVaccination),
              q47_has_insurance: getVal(draft.q47_has_insurance, app.q47_has_insurance || app.q47_hasInsurance),
              q48_insurance_number: getVal(draft.q48_insurance_number, app.q48_insurance_number || app.q48_insuranceNumber),
              q17_positive_points: getVal(draft.q17_positive_points, app.q17_positive_points || app.q17_positivePoints),
              q18_negative_points: getVal(draft.q18_negative_points, app.q18_negative_points || app.q18_negativePoints),
              q19_life_goals: getVal(draft.q19_life_goals, app.q19_life_goals || app.q19_lifeGoals),
              q20_willing_rotational_shifts: getVal(draft.q20_willing_rotational_shifts, app.q20_willing_rotational_shifts || app.q20_willingRotationalShifts),
              q20_improvement_suggestions: getVal(draft.q20_improvement_suggestions, app.q20_improvement_suggestions || app.q20_improvementSuggestions),
              q21_is_experienced: getVal(draft.q21_is_experienced, app.q21_is_experienced || app.q21_isExperienced),
              q22_total_experience: getVal(draft.q22_total_experience, app.q22_total_experience || app.q22_totalExperience),
              q23_core_experience: getVal(draft.q23_core_experience, app.q23_core_experience || app.q23_coreExperience),
              q24_prev_net_salary: getVal(draft.q24_prev_net_salary, app.q24_prev_net_salary || app.q24_prevNetSalary),
              q25_prev_gross_salary: getVal(draft.q25_prev_gross_salary, app.q25_prev_gross_salary || app.q25_prevGrossSalary),
              q26_expected_net_salary: getVal(draft.q26_expected_net_salary, app.q26_expected_net_salary || app.q26_expectedNetSalary),
              q27_expected_gross_salary: getVal(draft.q27_expected_gross_salary, app.q27_expected_gross_salary || app.q27_expectedGrossSalary),
              q28_pf_higher_pension: getVal(draft.q28_pf_higher_pension, app.q28_pf_higher_pension || app.q28_pfHigherPension),
              q29_pf_deduction_amount: getVal(draft.q29_pf_deduction_amount, app.q29_pf_deduction_amount || app.q29_pfDeductionAmount),
              q30_alternative_department: getVal(draft.q30_alternative_department, app.q30_alternative_department || app.q30_alternativeDepartment),
              q31_prev_location: getVal(draft.q31_prev_location, app.q31_prev_location || app.q31_prevLocation),
              q32_prev_shift: getVal(draft.q32_prev_shift, app.q32_prev_shift || app.q32_prevShift),
              q33_reason_for_leaving: initReasonSelect,
              q33_reason_for_leaving_other: initReasonOther,
              q34_notice_period: getVal(draft.q34_notice_period, app.q34_notice_period || app.q34_noticePeriod),
              q35_prev_dept_position: getVal(draft.q35_prev_dept_position, app.q35_prev_dept_position || app.q35_prevDeptPosition),
              q36_prev_dept_count: getVal(draft.q36_prev_dept_count, app.q36_prev_dept_count || app.q36_prevDeptCount),
              q38_handle_mistake: getVal(draft.q38_handle_mistake, app.q38_handle_mistake || app.q38_handleMistake),
              q39_handle_opinion_difference: getVal(draft.q39_handle_opinion_difference, app.q39_handle_opinion_difference || app.q39_handleOpinionDifference),
              q40_computer_self_rating: getVal(draft.q40_computer_self_rating, app.q40_computer_self_rating || app.q40_computerSelfRating || ''),
              q41_hr_mgr_name: getVal(draft.q41_hr_mgr_name, app.q41_hr_mgr_name || app.q41_hrMgrName),
              q42_hr_mgr_email: getVal(draft.q42_hr_mgr_email, app.q42_hr_mgr_email || app.q42_hrMgrEmail),
              q43_hr_mgr_phone: getVal(draft.q43_hr_mgr_phone, app.q43_hr_mgr_phone || app.q43_hrMgrPhone),
              q43_hr_mgr_country_id: getVal(draft.q43_hr_mgr_country_id, app.q43_hr_mgr_country_id || app.q43_repMgrCountryId || app.q43_hrMgrCountryId),
              q44_vert_head_name: getVal(draft.q44_vert_head_name, app.q44_vert_head_name || app.q44_vertHeadName),
              q45_vert_head_email: getVal(draft.q45_vert_head_email, app.q45_vert_head_email || app.q45_vertHeadEmail),
              q46_vert_head_phone: getVal(draft.q46_vert_head_phone, app.q46_vert_head_phone || app.q46_vertHeadPhone),
              q46_vert_head_country_id: getVal(draft.q46_vert_head_country_id, app.q46_vert_head_country_id || app.q46_vertHeadCountryId),
              employeePhotoUpload: deduplicatePaths(getVal(draft.employeePhotoUpload, app.employeePhotoUpload)),
              resumePath: deduplicatePaths(getVal(draft.resumePath, app.resumePath)),
              payslipPath: deduplicatePaths(getVal(draft.payslipPath, app.payslipPath)),
              aadharPath: deduplicatePaths(getVal(draft.aadharPath, app.aadharPath))
            };

            const resume = resolveAssessmentResumeState(app, response.data.currentStep, tempFormData);
            const targetStep = resume.currentStep;

            setCurrentStep(targetStep);

            if (targetStep > 1 || response.data.alreadySubmitted) {
              setShowSplash(false);
              setSplashDone(true);
            }

            if (response.data.alreadySubmitted) {
              if (hasRejection) {
                setAlreadySubmitted(false);
              } else {
                setAlreadySubmitted(true);
              }
            }

            setFormData(prev => ({
              ...prev,
              gender: getVal(draft.gender, app.gender),
              religion: rawReligion,
              religionSelect: initReligionSelect,
              religion_other: initReligionOther,
              q1_native: getVal(draft.q1_native, app.q1_native),
              q2_present_address: getVal(draft.q2_present_address, app.q2_present_address || app.q2_presentAddress),
              q3_permanent_address: getVal(draft.q3_permanent_address, app.q3_permanent_address || app.q3_permanentAddress),
              q4_father_occupation: getVal(draft.q4_father_occupation, app.q4_father_occupation || app.q4_fatherOccupation),
              q5_mother_occupation: getVal(draft.q5_mother_occupation, app.q5_mother_occupation || app.q5_motherOccupation),
              q6_marital_status: getVal(draft.q6_marital_status, app.q6_marital_status || app.q6_maritalStatus),
              q7_spouse_occupation: getVal(draft.q7_spouse_occupation, app.q7_spouse_occupation || app.q7_spouseOccupation),
              q8_children: getVal(draft.q8_children, app.q8_children),
              q9_has_relatives: getVal(draft.q9_has_relatives, app.q9_has_relatives || app.q9_hasRelativesInCompany),
              q10_relatives_details: getVal(draft.q10_relatives_details, app.q10_relatives_details || app.q10_relativesDetails),
              q11_siblings_occupations: getVal(draft.q11_siblings_occupations, app.q11_siblings_occupations || app.q11_siblingsOccupations),
              q12_has_two_wheeler: getVal(draft.q12_has_two_wheeler, app.q12_has_two_wheeler || app.q12_hasTwoWheeler),
              q13_has_android_phone: getVal(draft.q13_has_android_phone, app.q13_has_android_phone || app.q13_hasAndroidPhone),
              q14_knows_car_driving: getVal(draft.q14_knows_car_driving, app.q14_knows_car_driving || app.q14_knowsCarDriving),
              q15_willing_to_travel: getVal(draft.q15_willing_to_travel, app.q15_willing_to_travel || app.q15_willingToTravel),
              q16_covid_vaccination: getVal(draft.q16_covid_vaccination, app.q16_covid_vaccination || app.q16_covidVaccination),
              q47_has_insurance: getVal(draft.q47_has_insurance, app.q47_has_insurance || app.q47_hasInsurance),
              q48_insurance_number: getVal(draft.q48_insurance_number, app.q48_insurance_number || app.q48_insuranceNumber),
              q17_positive_points: getVal(draft.q17_positive_points, app.q17_positive_points || app.q17_positivePoints),
              q18_negative_points: getVal(draft.q18_negative_points, app.q18_negative_points || app.q18_negativePoints),
              q19_life_goals: getVal(draft.q19_life_goals, app.q19_life_goals || app.q19_lifeGoals),
              q20_willing_rotational_shifts: getVal(draft.q20_willing_rotational_shifts, app.q20_willing_rotational_shifts || app.q20_willingRotationalShifts),
              q20_improvement_suggestions: getVal(draft.q20_improvement_suggestions, app.q20_improvement_suggestions || app.q20_improvementSuggestions),
              q21_is_experienced: getVal(draft.q21_is_experienced, app.q21_is_experienced || app.q21_isExperienced),
              q22_total_experience: getVal(draft.q22_total_experience, app.q22_total_experience || app.q22_totalExperience),
              q23_core_experience: getVal(draft.q23_core_experience, app.q23_core_experience || app.q23_coreExperience),
              q24_prev_net_salary: getVal(draft.q24_prev_net_salary, app.q24_prev_net_salary || app.q24_prevNetSalary),
              q25_prev_gross_salary: getVal(draft.q25_prev_gross_salary, app.q25_prev_gross_salary || app.q25_prevGrossSalary),
              q26_expected_net_salary: getVal(draft.q26_expected_net_salary, app.q26_expected_net_salary || app.q26_expectedNetSalary),
              q27_expected_gross_salary: getVal(draft.q27_expected_gross_salary, app.q27_expected_gross_salary || app.q27_expectedGrossSalary),
              q28_pf_higher_pension: getVal(draft.q28_pf_higher_pension, app.q28_pf_higher_pension || app.q28_pfHigherPension),
              q29_pf_deduction_amount: getVal(draft.q29_pf_deduction_amount, app.q29_pf_deduction_amount || app.q29_pfDeductionAmount),
              q30_alternative_department: getVal(draft.q30_alternative_department, app.q30_alternative_department || app.q30_alternativeDepartment),
              q31_prev_location: getVal(draft.q31_prev_location, app.q31_prev_location || app.q31_prevLocation),
              q32_prev_shift: getVal(draft.q32_prev_shift, app.q32_prev_shift || app.q32_prevShift),
              q33_reason_for_leaving: getVal(draft.q33_reason_for_leaving, app.q33_reason_for_leaving || app.q33_reasonForLeaving),
              q34_notice_period: getVal(draft.q34_notice_period, app.q34_notice_period || app.q34_noticePeriod),
              q35_prev_dept_position: getVal(draft.q35_prev_dept_position, app.q35_prev_dept_position || app.q35_prevDeptPosition),
              q36_prev_dept_count: getVal(draft.q36_prev_dept_count, app.q36_prev_dept_count || app.q36_prevDeptCount),
              q38_handle_mistake: getVal(draft.q38_handle_mistake, app.q38_handle_mistake || app.q38_handleMistake),
              q39_handle_opinion_difference: getVal(draft.q39_handle_opinion_difference, app.q39_handle_opinion_difference || app.q39_handleOpinionDifference),
              q40_computer_self_rating: getVal(draft.q40_computer_self_rating, app.q40_computer_self_rating || app.q40_computerSelfRating || ''),
              q41_hr_mgr_name: getVal(draft.q41_hr_mgr_name, app.q41_hr_mgr_name || app.q41_hrMgrName),
              q42_hr_mgr_email: getVal(draft.q42_hr_mgr_email, app.q42_hr_mgr_email || app.q42_hrMgrEmail),
              q43_hr_mgr_phone: getVal(draft.q43_hr_mgr_phone, app.q43_hr_mgr_phone || app.q43_hrMgrPhone),
              q43_hr_mgr_country_id: getVal(draft.q43_hr_mgr_country_id, app.q43_hr_mgr_country_id || app.q43_repMgrCountryId || app.q43_hrMgrCountryId),
              q44_vert_head_name: getVal(draft.q44_vert_head_name, app.q44_vert_head_name || app.q44_vertHeadName),
              q45_vert_head_email: getVal(draft.q45_vert_head_email, app.q45_vert_head_email || app.q45_vertHeadEmail),
              q46_vert_head_phone: getVal(draft.q46_vert_head_phone, app.q46_vert_head_phone || app.q46_vertHeadPhone),
              q46_vert_head_country_id: getVal(draft.q46_vert_head_country_id, app.q46_vert_head_country_id || app.q46_vertHeadCountryId),
              employeePhotoUpload: deduplicatePaths(getVal(draft.employeePhotoUpload, app.employeePhotoUpload)),
              resumePath: deduplicatePaths(getVal(draft.resumePath, app.resumePath)),
              payslipPath: deduplicatePaths(getVal(draft.payslipPath, app.payslipPath)),
              aadharPath: deduplicatePaths(getVal(draft.aadharPath, app.aadharPath)),
              photoVerifiedStatus: app.photoVerifiedStatus || '',
              resumeVerifiedStatus: app.resumeVerifiedStatus || '',
              payslipVerifiedStatus: app.payslipVerifiedStatus || '',
              aadharVerifiedStatus: app.aadharVerifiedStatus || '',
              photoRejectReason: app.photoRejectReason || '',
              resumeRejectReason: app.resumeRejectReason || '',
              payslipRejectReason: app.payslipRejectReason || '',
              aadharRejectReason: app.aadharRejectReason || '',
              same_as_current_address: getVal(draft.same_as_current_address, app.same_as_current_address || 'NO')
            }));
          }
        } else {
          setError('Invalid verification response. Please request a new link from HR.');
          sessionStorage.removeItem('candidateSessionToken');
          localStorage.removeItem('candidateSessionToken');
        }
      } catch (err) {
        console.error(err);
        sessionStorage.removeItem('candidateSessionToken');
        sessionStorage.removeItem('candidateDetails');
        localStorage.removeItem('candidateSessionToken');

        const errData = err.response?.data;
        let errorMessage = 'This assessment link is invalid or has expired. Please contact HR.';
        if (typeof errData === 'object' && errData !== null) {
          if (errData.error) {
            errorMessage = errData.error;
          }
          if (errData.companyName) {
            const logoFileName = errData.logoFileName;
            setCompanyBranding({
              companyName: errData.companyName,
              logoUrl: logoFileName ? getCompanyImageUrl(logoFileName) : null
            });
          }
        } else if (typeof errData === 'string' && errData.trim() !== '') {
          errorMessage = errData;
        }

        setError(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, []);

  // Handle 401 Unauthorized globally for candidate page
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const errMsg = (typeof e.detail === 'string' ? e.detail : e.detail?.message || e.detail?.error) || 'This assessment link is invalid or has expired. Please contact HR.';
      setError(errMsg);
    };
    window.addEventListener('bos-candidate-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bos-candidate-unauthorized', handleUnauthorized);
  }, []);

  // Auto-scroll and focus direct rejected document upload field on landing
  const [navDone, setNavDone] = useState(false);

  useEffect(() => {
    if (!verifying && candidate && !navDone && (currentStep === 8 || (rejectedDocuments && rejectedDocuments.length > 0))) {
      const docNameToFieldMap = {
        "Passport Size Photo": "employeePhotoUpload",
        "Latest Resume": "resumePath",
        "Aadhaar Card": "aadharPath",
        "Salary Payslip": "payslipPath"
      };

      let fieldToScroll = null;
      if (rejectedDocuments && rejectedDocuments.length > 0) {
        fieldToScroll = docNameToFieldMap[rejectedDocuments[0].documentName];
      }
      if (!fieldToScroll && candidate) {
        if (String(candidate.photoVerifiedStatus || '').toUpperCase() === 'REJECTED') fieldToScroll = 'employeePhotoUpload';
        else if (String(candidate.resumeVerifiedStatus || '').toUpperCase() === 'REJECTED') fieldToScroll = 'resumePath';
        else if (String(candidate.aadharVerifiedStatus || '').toUpperCase() === 'REJECTED') fieldToScroll = 'aadharPath';
        else if (String(candidate.payslipVerifiedStatus || '').toUpperCase() === 'REJECTED') fieldToScroll = 'payslipPath';
      }
      if (!fieldToScroll) {
        setNavDone(true);
        return;
      }

      let attempts = 0;
      let activeTimer = null;

      const pollScroll = () => {
        attempts++;
        const targetId = `field-container-${fieldToScroll}`;
        const el = document.getElementById(targetId);

        if (el) {
          // Scroll element into view
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Dual window scroll offset for mobile headers
          const rect = el.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - 110;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });

          // Focus input
          const input = el.querySelector('input, button');
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
    }
  }, [verifying, candidate, currentStep, rejectedDocuments, navDone]);

  // Sync form inputs to localStorage draft and database (auto save on change)
  useEffect(() => {
    const token = searchParams.get('token') || 
                  sessionStorage.getItem('candidateSessionToken') || 
                  localStorage.getItem('candidateSessionToken');
    if (token && candidate) {
      // Debounce localStorage save to 400ms to guarantee persistent local storage
      const localTimer = setTimeout(() => {
        try {
          localStorage.setItem(`assessment_draft_${token}`, JSON.stringify(formData));
          localStorage.setItem(`assessment_step_${token}`, String(currentStep));
          setSaveStatus('saved');
        } catch (e) {
          console.error("Failed to auto-save local draft", e);
        }
      }, 400);

      // Debounce server database draft save to 2.5 seconds for guaranteed backend sync
      const serverTimer = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          const cleanPayload = { token, currentStep, ...formData };
          if (cleanPayload.q34_notice_period && !/^\d+$/.test(String(cleanPayload.q34_notice_period).trim())) {
            delete cleanPayload.q34_notice_period;
          }
          await axios.post('/api/hra/applicants/portal/save-draft', cleanPayload);
          setSaveStatus('saved');
        } catch (e) {
          console.error("Failed to auto-save draft to server", e);
          // If local draft saved cleanly, mark as saved so UI doesn't display false failure indicator
          setSaveStatus('saved');
        }
      }, 2500);

      return () => {
        clearTimeout(localTimer);
        clearTimeout(serverTimer);
      };
    }
  }, [formData, candidate, currentStep]);

  const formatGenderDisplay = (val) => {
    if (!val) return '—';
    const upper = val.toString().trim().toUpperCase();
    if (upper === 'MALE') return 'Male';
    if (upper === 'FEMALE') return 'Female';
    if (upper === 'TRANS') return 'Trans';
    if (upper === 'OTHER') return 'Other';
    return val;
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    // Dismiss any open validation snackbar as soon as the user starts typing
    if (snackbar.open) setSnackbar(prev => ({ ...prev, open: false }));

    if (name === 'religionSelect') {
      setFormData((prev) => {
        const newRelOther = prev.religion_other || '';
        const resolvedReligion = value === 'Other' ? newRelOther : value;
        return {
          ...prev,
          religionSelect: value,
          religion: resolvedReligion
        };
      });
      if (errors.religionSelect) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.religionSelect;
          delete next.religion_other;
          return next;
        });
      }
      return;
    }

    if (name === 'religion_other') {
      setFormData((prev) => ({
        ...prev,
        religion_other: value,
        religion: value
      }));
      if (errors.religion_other) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.religion_other;
          return next;
        });
      }
      return;
    }

    if (name === 'q2_present_address') {
      setFormData((prev) => {
        const next = { ...prev, q2_present_address: value };
        if (prev.same_as_current_address === 'YES') {
          next.q3_permanent_address = value;
        }
        return next;
      });
      if (errors.q2_present_address) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.q2_present_address;
          return next;
        });
      }
      return;
    }

    if (name === 'q3_permanent_address') {
      setFormData((prev) => ({
        ...prev,
        q3_permanent_address: value,
        same_as_current_address: 'NO'
      }));
      if (errors.q3_permanent_address) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.q3_permanent_address;
          return next;
        });
      }
      return;
    }

    if (name === 'q34_notice_period') {
      const cleanValue = value.replace(/[^\d]/g, '');
      setFormData((prev) => ({ ...prev, q34_notice_period: cleanValue }));
      if (errors.q34_notice_period) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.q34_notice_period;
          return next;
        });
      }
      return;
    }

    if (name === 'q36_prev_dept_count') {
      const cleanValue = value.replace(/[^\d]/g, '');
      setFormData((prev) => ({ ...prev, q36_prev_dept_count: cleanValue }));
      if (errors.q36_prev_dept_count) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.q36_prev_dept_count;
          return next;
        });
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const renderReadOnlyField = (label, value, icon, helperTextTamil) => (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: textPrimaryColor, fontSize: '0.875rem' }}>
          {label}
        </Typography>
        <TranslationTooltip label={label} customTamil={helperTextTamil} themeMode={themeMode} />
      </Box>
      <TextField
        fullWidth
        disabled
        size="small"
        value={value || '—'}
        InputProps={{
          startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
          readOnly: true
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: themeMode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            '& fieldset': { borderColor: borderCol }
          },
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: textPrimaryColor,
            fontWeight: 600
          }
        }}
      />
    </Box>
  );

  const formatDisplayLabel = (val) => {
    if (val === undefined || val === null) return '';
    const str = val.toString().trim();
    if (!str) return str;

    const knownMappings = {
      'UNMARRIED': 'Unmarried',
      'MARRIED': 'Married',
      'DIVORCED': 'Divorced',
      'WIDOWED': 'Widowed',
      'MALE': 'Male',
      'FEMALE': 'Female',
      'OTHER': 'Other',
      'OTHERS': 'Other',
      'YES': 'Yes',
      'NO': 'No'
    };

    if (knownMappings[str.toUpperCase()]) {
      return knownMappings[str.toUpperCase()];
    }

    if (str === str.toUpperCase() && /^[A-Z_]+$/.test(str)) {
      return str
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return str;
  };

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('candidateThemeMode', next);
      return next;
    });
  };

  const getCountryRules = useCallback((countryId) => {
    let c = countries.find(item => String(item.id) === String(countryId));
    if (!c && countries.length > 0) {
      c = countries[0];
    }
    return c || { phoneMinLength: 7, phoneMaxLength: 15 };
  }, [countries]);

  const validatePhoneByCountry = useCallback((phoneFieldName, countryIdFieldName, fieldLabel, customData = formData) => {
    const val = customData[phoneFieldName];
    const countryId = customData[countryIdFieldName];
    
    if (!val?.trim()) {
      return `${fieldLabel} is required *`;
    }
    
    const cleanVal = val.trim();
    if (!/^\d+$/.test(cleanVal)) {
      return `${fieldLabel} must contain digits only`;
    }
    
    const rules = getCountryRules(countryId);
    const len = cleanVal.length;
    if (rules.phoneMinLength !== undefined && rules.phoneMinLength !== null && len < rules.phoneMinLength) {
      if (rules.phoneMinLength === rules.phoneMaxLength) {
        return `Invalid phone number for the selected country (${rules.phoneMinLength} digits required)`;
      }
      return `Invalid phone number for the selected country (must be at least ${rules.phoneMinLength} digits)`;
    }
    if (rules.phoneMaxLength !== undefined && rules.phoneMaxLength !== null && len > rules.phoneMaxLength) {
      if (rules.phoneMinLength === rules.phoneMaxLength) {
        return `Invalid phone number for the selected country (${rules.phoneMaxLength} digits required)`;
      }
      return `Invalid phone number for the selected country (must not exceed ${rules.phoneMaxLength} digits)`;
    }
    return null;
  }, [countries, formData, getCountryRules]);

  // Step validation
  const validateStep = (step, customFormData = null, options = {}) => {
    const data = customFormData || formData;
    const stepErrors = {};
    const isValidNumber = (val) => {
      if (val === undefined || val === null) return false;
      const str = val.toString().trim();
      if (!str) return false;
      return /^\d+(\.\d+)?$/.test(str);
    };

    const hasValidTextContent = (val, minAlphaNum = 2) => {
      if (val === undefined || val === null) return false;
      const str = val.toString().trim();
      if (!str) return false;
      const matches = str.match(/[a-zA-Z0-9\u0B80-\u0BFF]/g);
      return matches !== null && matches.length >= minAlphaNum;
    };

    if (step === 2) {
      if (!data.gender?.trim()) {
        stepErrors.gender = "Gender is required *";
      }
      if (!data.religionSelect?.trim()) {
        stepErrors.religionSelect = "Religion is required *";
      } else if (data.religionSelect === 'Other' && !hasValidTextContent(data.religion_other, 2)) {
        stepErrors.religion_other = "Specify Religion must contain valid text (at least 2 letters/digits) *";
      }
    }
    if (step === 3) {
      if (!hasValidTextContent(data.q1_native, 2)) stepErrors.q1_native = "Native Place must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q2_present_address, 2)) stepErrors.q2_present_address = "Present Address must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q3_permanent_address, 2)) stepErrors.q3_permanent_address = "Permanent Address must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q4_father_occupation, 2)) stepErrors.q4_father_occupation = "Father's Occupation must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q5_mother_occupation, 2)) stepErrors.q5_mother_occupation = "Mother's Occupation must contain valid text (at least 2 letters/digits) *";
      if (!data.q6_marital_status?.trim()) stepErrors.q6_marital_status = "Marital Status is required *";
      if (data.q6_marital_status === 'MARRIED' && !hasValidTextContent(data.q7_spouse_occupation, 2)) {
        stepErrors.q7_spouse_occupation = "Spouse's Occupation must contain valid text (at least 2 letters/digits) *";
      }
      if (!data.q9_has_relatives?.trim()) stepErrors.q9_has_relatives = "Company connections selection is required *";
      if (data.q9_has_relatives === 'YES' && !hasValidTextContent(data.q10_relatives_details, 2)) {
        stepErrors.q10_relatives_details = "Relative or Friends Details must contain valid text (at least 2 letters/digits) *";
      }
    }
    if (step === 4) {
      if (!data.q12_has_two_wheeler?.trim()) stepErrors.q12_has_two_wheeler = "Two wheeler ownership is required *";
      if (!data.q13_has_android_phone?.trim()) stepErrors.q13_has_android_phone = "Android smartphone ownership is required *";
      if (!data.q14_knows_car_driving?.trim()) stepErrors.q14_knows_car_driving = "Car driving skill is required *";
      if (!data.q15_willing_to_travel?.trim()) stepErrors.q15_willing_to_travel = "Travel willingness is required *";
      if (!data.q16_covid_vaccination?.trim()) stepErrors.q16_covid_vaccination = "COVID-19 vaccination status is required *";
      if (!data.q47_has_insurance?.trim()) stepErrors.q47_has_insurance = "Medical Insurance status is required *";
      if (data.q47_has_insurance === 'YES' && !hasValidTextContent(data.q48_insurance_number, 2)) {
        stepErrors.q48_insurance_number = "Insurance Number / Policy ID must contain valid text (at least 2 letters/digits) *";
      }
    }
    if (step === 5) {
      if (!hasValidTextContent(data.q17_positive_points, 2)) stepErrors.q17_positive_points = "Strengths / Positive Points must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q18_negative_points, 2)) stepErrors.q18_negative_points = "Weaknesses / Areas of Improvement must contain valid text (at least 2 letters/digits) *";
      if (!hasValidTextContent(data.q19_life_goals, 2)) stepErrors.q19_life_goals = "Life Goals must contain valid text (at least 2 letters/digits) *";
      if (!data.q20_willing_rotational_shifts?.trim()) stepErrors.q20_willing_rotational_shifts = "Rotational Shifts willingness is required *";
    }
    if (step === 6) {
      if (!data.q21_is_experienced?.trim()) {
        stepErrors.q21_is_experienced = "Prior work experience status is required *";
      } else if (data.q21_is_experienced === 'YES') {
        if (!data.q22_total_experience?.toString().trim()) {
          stepErrors.q22_total_experience = "Total Experience is required *";
        } else if (!isValidNumber(data.q22_total_experience)) {
          stepErrors.q22_total_experience = "Total Experience must be a valid number";
        }

        if (!data.q23_core_experience?.toString().trim()) {
          stepErrors.q23_core_experience = "Core Department Experience is required *";
        } else if (!isValidNumber(data.q23_core_experience)) {
          stepErrors.q23_core_experience = "Core Department Experience must be a valid number";
        }

        if (!data.q24_prev_net_salary?.toString().trim()) {
          stepErrors.q24_prev_net_salary = "Previous Net Salary is required *";
        } else if (!isValidNumber(data.q24_prev_net_salary)) {
          stepErrors.q24_prev_net_salary = "Previous Net Salary must be a valid number";
        }

        if (!data.q25_prev_gross_salary?.toString().trim()) {
          stepErrors.q25_prev_gross_salary = "Previous Gross Salary is required *";
        } else if (!isValidNumber(data.q25_prev_gross_salary)) {
          stepErrors.q25_prev_gross_salary = "Previous Gross Salary must be a valid number";
        }

        if (!hasValidTextContent(data.q31_prev_location, 2)) {
          stepErrors.q31_prev_location = "Previous Company Location must contain valid text (at least 2 letters/digits) *";
        }

        if (!data.q32_prev_shift?.trim()) {
          stepErrors.q32_prev_shift = "Previously Worked Shift is required *";
        }

        if (!data.q34_notice_period?.toString().trim()) {
          stepErrors.q34_notice_period = "Notice Period is required *";
        } else if (!/^\d+$/.test(data.q34_notice_period.toString().trim())) {
          stepErrors.q34_notice_period = "Notice Period must be a positive whole number of days";
        }

        if (!data.q36_prev_dept_count?.toString().trim()) {
          stepErrors.q36_prev_dept_count = "Department Employee Count is required *";
        } else if (!isValidNumber(data.q36_prev_dept_count)) {
          stepErrors.q36_prev_dept_count = "Department Employee Count must be a valid number";
        }

        if (!hasValidTextContent(data.q35_prev_dept_position, 2)) {
          stepErrors.q35_prev_dept_position = "Previous Department & Position must contain valid text (at least 2 letters/digits) *";
        }

        if (!data.q33_reason_for_leaving?.trim()) {
          stepErrors.q33_reason_for_leaving = "Reason for leaving previous job is required *";
        } else if ((data.q33_reason_for_leaving === 'Others' || data.q33_reason_for_leaving === 'Other' || data.q33_reason_for_leaving?.startsWith('Other')) && !hasValidTextContent(data.q33_reason_for_leaving_other, 2)) {
          stepErrors.q33_reason_for_leaving_other = "Specify Reason for Leaving must contain valid text (at least 2 letters/digits) *";
        }

        if (!hasValidTextContent(data.q41_hr_mgr_name, 2)) {
          stepErrors.q41_hr_mgr_name = "HR Manager Name must contain valid text (at least 2 letters/digits) *";
        }

        if (!data.q42_hr_mgr_email?.trim()) {
          stepErrors.q42_hr_mgr_email = "HR Manager Email is required *";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.q42_hr_mgr_email.trim())) {
          stepErrors.q42_hr_mgr_email = "Valid HR Manager Email is required *";
        }

        const mgrPhoneErr = validatePhoneByCountry('q43_hr_mgr_phone', 'q43_hr_mgr_country_id', 'HR Manager Phone', data);
        if (mgrPhoneErr) {
          stepErrors.q43_hr_mgr_phone = mgrPhoneErr;
        }

        if (!hasValidTextContent(data.q44_vert_head_name, 2)) {
          stepErrors.q44_vert_head_name = "Vertical Head Name must contain valid text (at least 2 letters/digits) *";
        }

        if (!data.q45_vert_head_email?.trim()) {
          stepErrors.q45_vert_head_email = "Vertical Head Email is required *";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.q45_vert_head_email.trim())) {
          stepErrors.q45_vert_head_email = "Valid Vertical Head Email is required *";
        }

        if (data.q42_hr_mgr_email?.trim() && data.q45_vert_head_email?.trim() &&
            data.q42_hr_mgr_email.trim().toLowerCase() === data.q45_vert_head_email.trim().toLowerCase()) {
          stepErrors.q42_hr_mgr_email = "Manager Email and Vertical Head Email cannot be the same";
          stepErrors.q45_vert_head_email = "Vertical Head Email and Manager Email cannot be the same";
        }

        const vertPhoneErr = validatePhoneByCountry('q46_vert_head_phone', 'q46_vert_head_country_id', 'Vertical Head Phone', data);
        if (vertPhoneErr) {
          stepErrors.q46_vert_head_phone = vertPhoneErr;
        }

        if (data.q43_hr_mgr_phone?.trim() && data.q46_vert_head_phone?.trim() &&
            data.q43_hr_mgr_phone.trim() === data.q46_vert_head_phone.trim()) {
          stepErrors.q43_hr_mgr_phone = "Manager Phone and Vertical Head Phone cannot be the same";
          stepErrors.q46_vert_head_phone = "Vertical Head Phone and Manager Phone cannot be the same";
        }
      }

      if (!data.q26_expected_net_salary?.toString().trim()) {
        stepErrors.q26_expected_net_salary = "Expected Net Salary is required *";
      } else if (!isValidNumber(data.q26_expected_net_salary)) {
        stepErrors.q26_expected_net_salary = "Expected Net Salary must be a valid number";
      }

      if (!data.q27_expected_gross_salary?.toString().trim()) {
        stepErrors.q27_expected_gross_salary = "Expected Gross Salary is required *";
      } else if (!isValidNumber(data.q27_expected_gross_salary)) {
        stepErrors.q27_expected_gross_salary = "Expected Gross Salary must be a valid number";
      }
    }
    if (step === 7) {
      if (!data.q38_handle_mistake?.trim()) {
        stepErrors.q38_handle_mistake = "Mistake handling response is required *";
      }
      if (!data.q40_computer_self_rating?.toString().trim()) {
        stepErrors.q40_computer_self_rating = "Computer proficiency rating is required *";
      }
    }
    if (step === 8) {
      if (!data.employeePhotoUpload?.trim()) stepErrors.employeePhotoUpload = "Passport Photo is required *";
      if (!data.resumePath?.trim()) stepErrors.resumePath = "Resume Document is required *";
      if (!data.aadharPath?.trim()) stepErrors.aadharPath = "Aadhar Card is required *";
      if (data.q21_is_experienced === 'YES' && !data.payslipPath?.trim()) {
        stepErrors.payslipPath = "Previous Payslip is required *";
      }
    }
    return stepErrors;
  };

  const resolveAssessmentResumeState = (applicant, backendStep, tempFormData) => {
    // 1. Jump directly to Document Upload if section=upload or document is rejected
    const sectionParam = searchParams.get('section') || searchParams.get('tab');
    const responseRejDocs = (applicant && applicant.rejectedDocuments) || [];
    const hasRejection = (applicant && (
      String(applicant.photoVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
      String(applicant.resumeVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
      String(applicant.aadharVerifiedStatus || '').toUpperCase() === 'REJECTED' ||
      String(applicant.payslipVerifiedStatus || '').toUpperCase() === 'REJECTED'
    )) || (responseRejDocs.length > 0);

    if (sectionParam === 'upload' || hasRejection) {
      return { shouldResume: true, assessmentStarted: true, currentStep: 8 };
    }

    // 2. Resume at saved step if candidate has explicitly saved draft progress beyond Step 1 in the backend (backendStep > 1)
    if (backendStep && backendStep > 1) {
      const clampedStep = Math.max(1, Math.min(9, backendStep));
      return { shouldResume: true, assessmentStarted: true, currentStep: clampedStep };
    }

    // 3. Default: Fresh candidates land on Step 1 (Welcome / Landing Page)
    return {
      shouldResume: false,
      assessmentStarted: false,
      currentStep: 1
    };
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    const errorKeys = Object.keys(stepErrors);

    if (errorKeys.length > 0) {
      setErrors(stepErrors);
      const firstErrorField = errorKeys[0];
      const firstErrorMessage = stepErrors[firstErrorField];

      showSnackbar(firstErrorMessage || "Please complete all required fields before continuing.", 'error');

      // Auto-scroll and focus the FIRST missing required field in visual order
      setTimeout(() => {
        const cardContainer = document.getElementById(`step-card-${currentStep}`) || document;
        const targetContainer = document.getElementById(`field-container-${firstErrorField}`);
        const targetInput = cardContainer.querySelector(`[name="${firstErrorField}"]`);

        if (targetContainer) {
          targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (targetInput) {
          targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (targetInput) {
          targetInput.focus();
        }
      }, 100);
      return;
    }

    setErrors({});
    setError('');
    playPortalSound('next');
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    const token = searchParams.get('token') || 
                  sessionStorage.getItem('candidateSessionToken') || 
                  localStorage.getItem('candidateSessionToken');
    if (token) {
      localStorage.setItem(`assessment_step_${token}`, nextStep);
      axios.post('/api/hra/applicants/portal/save-draft', { token, currentStep: nextStep, ...formData }).catch(err => console.error("Error saving draft on next step", err));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      playPortalSound('prev');
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const token = searchParams.get('token') || 
                    sessionStorage.getItem('candidateSessionToken') || 
                    localStorage.getItem('candidateSessionToken');
      if (token) {
        localStorage.setItem(`assessment_step_${token}`, prevStep);
        axios.post('/api/hra/applicants/portal/save-draft', { token, currentStep: prevStep, ...formData }).catch(err => console.error("Error saving draft on back step", err));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const sessionToken = searchParams.get('token') || 
                         sessionStorage.getItem('candidateSessionToken') || 
                         localStorage.getItem('candidateSessionToken');
    if (!sessionToken) {
      showSnackbar('Your session has expired. Please reload using the link from your email.', 'error');
      return;
    }

    // Final full verification
    const allErrors = {};
    for (let i = 1; i < STEPS.length; i++) {
      Object.assign(allErrors, validateStep(i));
    }

    if (!confirmSubmit) {
      allErrors.confirmSubmit = "Please confirm the declaration before submitting *";
    }

    const errorKeys = Object.keys(allErrors);
    if (errorKeys.length > 0) {
      setErrors(allErrors);
      const firstErrorField = errorKeys[0];
      const firstErrorMessage = allErrors[firstErrorField];
      showSnackbar(firstErrorMessage || "Please complete all required fields before submitting.", 'error');

      setTimeout(() => {
        const targetContainer = document.getElementById(`field-container-${firstErrorField}`);
        if (targetContainer) {
          targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isOtherReason = formData.q33_reason_for_leaving === 'Others' || formData.q33_reason_for_leaving === 'Other' || formData.q33_reason_for_leaving?.startsWith('Other');
      const submitPayload = {
        token: sessionToken,
        ...formData,
        q33_reason_for_leaving: (isOtherReason && formData.q33_reason_for_leaving_other?.trim())
          ? `Others: ${formData.q33_reason_for_leaving_other.trim()}`
          : formData.q33_reason_for_leaving
      };

      await axios.post('/api/hra/applicants/portal/submit', submitPayload);
      playPortalSound('submit');
      setSubmitted(true);
      setAlreadySubmitted(false);
      localStorage.removeItem(`assessment_draft_${sessionToken}`); // Clear saved draft on success
      localStorage.removeItem(`assessment_step_${sessionToken}`);
      localStorage.removeItem('candidateSessionToken');
      sessionStorage.removeItem('candidateSessionToken');
      sessionStorage.removeItem('candidateDetails');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || 'Failed to submit self assessment. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const textPrimaryColor = themeMode === 'light' ? '#0f172a' : '#f8fafc';
  const textSecondaryColor = themeMode === 'light' ? '#475569' : '#cbd5e1';
  const textMutedColor = themeMode === 'light' ? '#64748b' : '#94a3b8';
  const borderCol = themeMode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)';

  const pageBg = themeMode === 'light' 
    ? '#f8fafc' 
    : 'radial-gradient(circle, #0f172a 0%, #020617 100%)';

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
        {content}
      </div>
    </ThemeProvider>
  );


  const cardStyle = {
    background: themeMode === 'light' ? '#ffffff' : '#1e293b',
    border: `1.5px solid ${themeMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    boxShadow: themeMode === 'light' 
      ? '0 20px 45px rgba(30, 40, 70, 0.04)' 
      : '0 30px 65px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    '&:hover': {
      borderColor: themeMode === 'light' ? '#7c8cf8' : '#63d9c4',
      boxShadow: themeMode === 'light'
        ? '0 32px 50px rgba(124, 140, 248, 0.1), 0 0 0 1px rgba(124, 140, 248, 0.05)'
        : '0 32px 50px rgba(99, 217, 196, 0.1), 0 0 0 1.5px rgba(99, 217, 196, 0.2)'
    }
  };

  const innerCardStyle = {
    p: { xs: 1.5, sm: 2.5, md: 3 },
    borderRadius: '20px',
    border: `1px solid ${borderCol}`,
    borderLeft: `5px solid #7c8cf8`,
    bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b',
    boxShadow: themeMode === 'light' ? '0 10px 25px -5px rgba(124,140,248,0.02)' : '0 10px 25px -5px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    '&:hover': {
      borderColor: themeMode === 'light' ? '#7c8cf8' : '#63d9c4',
      boxShadow: themeMode === 'light'
        ? '0 20px 40px rgba(124, 140, 248, 0.08)'
        : '0 20px 40px rgba(0, 0, 0, 0.3)'
    }
  };

  const progressPercent = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  // Form input builders
  const renderPhoneInput = (phoneFieldName, countryIdFieldName, label, required, placeholder = '', tamilLabel = '') => {
    const isError = Boolean(errors[phoneFieldName]);
    const errorMessage = typeof errors[phoneFieldName] === 'string' ? errors[phoneFieldName] : `${label} is required *`;

    const selectedCountryId = formData[countryIdFieldName];
    let selectedCountry = countries.find(c => String(c.id) === String(selectedCountryId));
    
    if (!selectedCountry && countries.length > 0) {
      selectedCountry = countries[0];
      if (selectedCountry && !formData[countryIdFieldName]) {
        setTimeout(() => {
          setFormData(prev => ({ ...prev, [countryIdFieldName]: selectedCountry.id }));
        }, 0);
      }
    }

    const getIso3Code = (countryObj) => {
      if (!countryObj) return '';
      const rawCode = countryObj.countryCode || countryObj.countryIso || countryObj.code || '';
      const clean = String(rawCode).trim().toUpperCase();
      if (clean) return clean;
      const name = countryObj.countryName || countryObj.country || '';
      return String(name).trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    };

    const formatIsd = (isdVal) => {
      if (!isdVal) return '';
      let clean = String(isdVal).trim().replace(/^[A-Za-z\s]+/, '').replace(/[()]/g, '').trim();
      if (!clean) return '';
      return clean.startsWith('+') ? clean : `+${clean}`;
    };

    return (
      <Box 
        id={`field-container-${phoneFieldName}`}
        sx={{ 
          mb: 2.5,
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '25%': { transform: 'translateX(-4px)' },
              '50%': { transform: 'translateX(4px)' },
              '75%': { transform: 'translateX(-4px)' }
            }
          } : {}),
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0.5, 
          width: '100%', 
          minWidth: 0, 
          boxSizing: 'border-box',
          opacity: (submitted || alreadySubmitted) ? 0.75 : 1 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isError ? '#d32f2f' : textPrimaryColor, fontSize: '0.875rem' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </Typography>
          <TranslationTooltip label={label} customTamil={tamilLabel} themeMode={themeMode} />
        </Box>

        <BOSTextField
          fullWidth
          size="small"
          name={phoneFieldName}
          type="phone"
          disabled={submitted || alreadySubmitted}
          error={isError}
          value={formData[phoneFieldName] !== undefined ? formData[phoneFieldName] : ''}
          onChange={(e) => {
            const cleanVal = e.target.local !== undefined ? e.target.local : (e.target.value || '').replace(/[^\d]/g, '');
            const newCountryId = e.target.countryId || formData[countryIdFieldName];
            const nextFormData = { 
              ...formData, 
              [phoneFieldName]: cleanVal,
              ...(newCountryId ? { [countryIdFieldName]: newCountryId } : {})
            };
            setFormData(nextFormData);

            if (snackbar.open) setSnackbar(prev => ({ ...prev, open: false }));

            const newErr = validatePhoneByCountry(phoneFieldName, countryIdFieldName, label, nextFormData);
            setErrors(prev => {
              const next = { ...prev };
              if (newErr) {
                next[phoneFieldName] = newErr;
              } else {
                delete next[phoneFieldName];
              }
              return next;
            });
          }}
          placeholder={placeholder}
          helperText={isError ? errorMessage : null}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              color: textPrimaryColor,
              backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
              '& fieldset': { borderColor: isError ? '#d32f2f' : borderCol }
            }
          }}
        />
      </Box>
    );
  };

  const renderInput = (name, label, required, placeholder = '', tamilLabel = '', type = 'text', startAdornment = null) => {
    const isError = Boolean(errors[name]);
    const errorMessage = typeof errors[name] === 'string' ? errors[name] : `${label} is required *`;

    return (
      <Box 
        id={`field-container-${name}`}
        sx={{ 
          mb: 2.5,
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {})
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isError ? '#d32f2f' : textPrimaryColor, fontSize: '0.875rem' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </Typography>
          <TranslationTooltip label={label} customTamil={tamilLabel} themeMode={themeMode} />
        </Box>
        <TextField
          fullWidth
          size="small"
          name={name}
          error={isError}
          value={formData[name] !== undefined ? formData[name] : ''}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (name === 'q36_prev_dept_count' && (e.key === '.' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+')) {
              e.preventDefault();
            }
          }}
          type={type}
          placeholder={placeholder}
          variant="outlined"
          InputProps={startAdornment ? { startAdornment } : undefined}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              color: textPrimaryColor,
              backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              '& fieldset': {
                borderColor: isError ? '#d32f2f' : borderCol
              },
              '&:hover fieldset': {
                borderColor: isError ? '#d32f2f' : (themeMode === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)')
              },
              '&.Mui-focused fieldset': {
                borderColor: isError ? '#d32f2f' : '#2563EB',
                borderWidth: '1px'
              },
              '&.Mui-focused': {
                boxShadow: isError
                  ? '0 0 0 4px rgba(211, 47, 47, 0.15)'
                  : (themeMode === 'light' ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.15)')
              }
            }
          }}
        />
        {isError && (
          <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.75, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>
    );
  };

  const renderTextarea = (name, label, required, rows = 3, placeholder = '', tamilLabel = '') => {
    const isError = Boolean(errors[name]);
    const errorMessage = typeof errors[name] === 'string' ? errors[name] : `${label} is required *`;

    return (
      <Box 
        id={`field-container-${name}`}
        sx={{ 
          mb: 2.5,
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {})
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isError ? '#d32f2f' : textPrimaryColor, fontSize: '0.875rem' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </Typography>
          <TranslationTooltip label={label} customTamil={tamilLabel} themeMode={themeMode} />
        </Box>
        <TextField
          fullWidth
          multiline
          rows={rows}
          name={name}
          error={isError}
          value={formData[name] !== undefined ? formData[name] : ''}
          onChange={handleTextChange}
          placeholder={placeholder}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              color: textPrimaryColor,
              backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              '& fieldset': {
                borderColor: isError ? '#d32f2f' : borderCol
              },
              '&:hover fieldset': {
                borderColor: isError ? '#d32f2f' : (themeMode === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)')
              },
              '&.Mui-focused fieldset': {
                borderColor: isError ? '#d32f2f' : '#2563EB',
                borderWidth: '1px'
              },
              '&.Mui-focused': {
                boxShadow: isError 
                  ? '0 0 0 4px rgba(211, 47, 47, 0.15)' 
                  : (themeMode === 'light' ? '0 0 0 4px rgba(37, 99, 235, 0.1)' : '0 0 0 4px rgba(59, 130, 246, 0.15)')
              }
            }
          }}
        />
        {isError && (
          <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.75, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>
    );
  };

  const renderSelect = (name, label, rawOptions, required, tamilLabel = '', placeholder = '- Select -') => {
    const isError = Boolean(errors[name]);
    const errorMessage = typeof errors[name] === 'string' ? errors[name] : `${label} is required *`;
    const currentValue = formData[name] !== undefined && formData[name] !== null ? formData[name].toString() : '';

    const options = (rawOptions || []).map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          label: formatDisplayLabel(opt.label),
          value: opt.value.toString()
        };
      }
      return {
        label: formatDisplayLabel(opt),
        value: opt.toString()
      };
    });

    if (currentValue && !options.some((o) => o.value === currentValue)) {
      options.unshift({
        label: formatDisplayLabel(currentValue),
        value: currentValue
      });
    }

    return (
      <Box 
        id={`field-container-${name}`}
        sx={{ 
          mb: 2.5,
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {})
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isError ? '#d32f2f' : textPrimaryColor, fontSize: '0.875rem' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </Typography>
          <TranslationTooltip label={label} customTamil={tamilLabel} themeMode={themeMode} />
        </Box>
        <TextField
          select
          fullWidth
          size="small"
          name={name}
          error={isError}
          value={currentValue}
          onChange={handleTextChange}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              color: currentValue ? textPrimaryColor : textMutedColor,
              backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(15, 23, 42, 0.4)',
              '& fieldset': {
                borderColor: isError ? '#d32f2f' : borderCol
              },
              '&:hover fieldset': {
                borderColor: isError ? '#d32f2f' : (themeMode === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)')
              },
              '&.Mui-focused fieldset': {
                borderColor: isError ? '#d32f2f' : '#2563EB',
                borderWidth: '1px'
              }
            },
            '& .MuiSelect-icon': {
              color: textMutedColor
            }
          }}
          SelectProps={{
            displayEmpty: true,
            renderValue: (selected) => {
              if (!selected) return "";
              const matched = options.find(o => String(o.value) === String(selected));
              return matched ? matched.label : selected;
            },
            MenuProps: {
              disableScrollLock: true,
              transitionDuration: 0,
              PaperProps: {
                sx: {
                  maxHeight: 280,
                  transition: 'none !important',
                  animation: 'none !important'
                }
              }
            }
          }}
          InputProps={{
            endAdornment: currentValue ? (
              <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextChange({ target: { name, value: '' } });
                  }}
                  sx={{ color: textMutedColor, p: 0.25 }}
                >
                  <IconX size={16} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        {isError && (
          <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.75, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>
    );
  };

  const renderYesNoSegment = (name, label, required, tamilLabel = '') => {
    const currentValue = formData[name] || '';
    const isError = Boolean(errors[name]);
    const errorMessage = typeof errors[name] === 'string' ? errors[name] : `${label} is required *`;

    return (
      <Box 
        id={`field-container-${name}`}
        sx={{ 
          mb: 2.5,
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {})
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isError ? '#d32f2f' : textPrimaryColor, fontSize: '0.875rem' }}>
            {label}
            {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
          </Typography>
          <TranslationTooltip label={label} customTamil={tamilLabel} themeMode={themeMode} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
          {['NO', 'YES'].map((opt) => {
            const isSelected = currentValue === opt;
            const displayLabel = formatDisplayLabel(opt);
            return (
              <Button
                key={opt}
                onClick={() => {
                  setFormData((prev) => {
                    const next = { ...prev, [name]: opt };
                    if (name === 'q28_pf_higher_pension' && opt !== 'YES') {
                      next.q29_pf_deduction_amount = '';
                    }
                    return next;
                  });
                  if (errors[name] || (name === 'q28_pf_higher_pension' && opt !== 'YES' && errors.q29_pf_deduction_amount)) {
                    setErrors((prev) => {
                      const newErr = { ...prev };
                      delete newErr[name];
                      if (name === 'q28_pf_higher_pension' && opt !== 'YES') {
                        delete newErr.q29_pf_deduction_amount;
                      }
                      return newErr;
                    });
                  }
                }}
                variant={isSelected ? 'contained' : 'outlined'}
                sx={{
                  flex: 1,
                  py: 1.25,
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: isSelected ? '#2563EB' : 'transparent',
                  color: isSelected ? '#ffffff' : (isError ? '#d32f2f' : textSecondaryColor),
                  borderColor: isSelected ? 'transparent' : (isError ? '#d32f2f' : borderCol),
                  '&:hover': {
                    backgroundColor: isSelected ? '#1d4ed8' : (themeMode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)'),
                    borderColor: isSelected ? 'transparent' : (isError ? '#d32f2f' : borderCol)
                  },
                  boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {displayLabel}
              </Button>
            );
          })}
        </Box>
        {isError && (
          <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.75, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
            {errorMessage}
          </Typography>
        )}
      </Box>
    );
  };

  const renderUploadCard = (fieldName, label, required, verifiedStatus, rejectReason, disabled = false) => {
    if (disabled && fieldName === 'payslipPath') {
      return null;
    }
    const isError = Boolean(errors[fieldName]);
    const errorMessage = typeof errors[fieldName] === 'string' ? errors[fieldName] : `${label} is required *`;

    const dbDocNameMap = {
      employeePhotoUpload: "Passport Size Photo",
      resumePath: "Latest Resume",
      aadharPath: "Aadhaar Card",
      payslipPath: "Salary Payslip"
    };
    const dbDocName = dbDocNameMap[fieldName];
    const isReuploadMode = rejectedDocuments && rejectedDocuments.length > 0;
    const isThisDocRejected = isReuploadMode && rejectedDocuments.some(rd => rd.documentName === dbDocName);
    // If the user has already selected a replacement file, clear rejection styling (local-only, backend unchanged)
    const hasReplacementSelected = isThisDocRejected && userReplacedDocs.has(fieldName);

    const isApproved = isReuploadMode ? (!isThisDocRejected) : ['APPROVED', 'VERIFIED', 'Verified', 'Approved'].includes(verifiedStatus);
    const isRejected = isReuploadMode ? (isThisDocRejected && !hasReplacementSelected) : ['REJECTED', 'Rejected'].includes(verifiedStatus);
    const activeRej = (isReuploadMode && !hasReplacementSelected) ? rejectedDocuments.find(rd => rd.documentName === dbDocName) : null;
    const displayRejectReason = activeRej ? activeRej.rejectReason : rejectReason;

    const filePath = formData[fieldName];
    const isPending = hasReplacementSelected || verifiedStatus === 'PENDING' || (!isApproved && !isRejected && Boolean(filePath));

    const fileList = filePath 
      ? parseDocumentPaths(filePath).map((path, idx) => ({
          id: `${fieldName}_${idx}`,
          fileName: path.split('/').pop()?.split('\\').pop() || 'Uploaded File',
          serverFileName: path
        }))
      : [];

    let IconComponent = IconFileText;
    if (fieldName === 'employeePhotoUpload') IconComponent = IconUser;
    if (fieldName === 'aadharPath') IconComponent = IconLock;
    if (fieldName === 'payslipPath') IconComponent = IconAward;

    return (
      <Box 
        id={`field-container-${fieldName}`}
        sx={{ 
          border: isRejected ? '1.5px solid #ef4444' : (isError ? '1.5px solid #d32f2f' : (isApproved ? '1.5px solid #22c55e' : (isPending ? '1.5px solid #2563eb' : `1.5px solid ${borderCol}`))), 
          borderLeft: isRejected ? '5px solid #ef4444' : (isError ? '5px solid #d32f2f' : (isApproved ? '5px solid #22c55e' : (isPending ? '5px solid #2563eb' : '5px solid #7c8cf8'))),
          borderRadius: '20px', 
          p: 3, 
          backgroundColor: themeMode === 'light' ? '#ffffff' : '#1e293b',
          boxShadow: isRejected 
            ? (themeMode === 'light' ? '0 10px 25px rgba(239, 68, 68, 0.08)' : '0 10px 25px rgba(239, 68, 68, 0.2)')
            : (themeMode === 'light' ? '0 10px 25px -5px rgba(124,140,248,0.02)' : '0 10px 25px -5px rgba(0,0,0,0.02)'),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: isRejected ? '#ef4444' : (isError ? '#d32f2f' : (themeMode === 'light' ? '#7c8cf8' : '#63d9c4')),
            boxShadow: themeMode === 'light'
              ? `0 20px 40px ${isRejected ? 'rgba(239, 68, 68, 0.08)' : 'rgba(124, 140, 248, 0.08)'}`
              : `0 20px 40px ${isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 217, 196, 0.15)'}`
          },
          ...(isError ? {
            animation: 'shakeError 0.4s ease-in-out',
            '@keyframes shakeError': {
              '0%, 100%': { transform: 'translateX(0)' },
              '20%, 60%': { transform: 'translateX(-4px)' },
              '40%, 80%': { transform: 'translateX(4px)' }
            }
          } : {})
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box 
              sx={{ 
                p: 1, 
                borderRadius: '8px', 
                backgroundColor: isRejected ? 'rgba(239, 68, 68, 0.15)' : (isError ? 'rgba(211, 47, 47, 0.1)' : (themeMode === 'light' ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)')),
                color: isRejected ? '#dc2626' : (isError ? '#d32f2f' : '#2563EB'),
                display: 'inline-flex'
              }}
            >
              <IconComponent size={24} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isRejected ? '#dc2626' : (isError ? '#d32f2f' : textPrimaryColor), display: 'inline-flex', alignItems: 'center' }}>
                {label}
                <TranslationTooltip label={label} themeMode={themeMode} />
                {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </Typography>
              <Typography variant="caption" sx={{ color: isRejected ? '#ef4444' : (isError ? '#d32f2f' : textMutedColor) }}>
                {fieldName === 'employeePhotoUpload' ? 'PNG, JPG, JPEG only' : 'PDF, DOCX, PNG, JPG (Max 25MB)'}
              </Typography>
            </Box>
          </Stack>

          {isApproved && (
            <Alert severity="success" icon={<IconCircleCheck size={18} />} sx={{ py: 0.5, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              Document Verified & Approved
            </Alert>
          )}


          {isRejected && (
            <Box
              sx={{
                p: 2,
                borderRadius: '10px',
                backgroundColor: themeMode === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconAlertCircle size={20} color="#dc2626" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626' }}>
                  Document Rejected
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f1d1d' }}>
                <strong>Reason:</strong> {displayRejectReason || 'Please upload a valid replacement document.'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#991b1b', fontStyle: 'italic' }}>
                Please upload a valid document.
              </Typography>
            </Box>
          )}

           <BOSFileUpload
            files={fileList}
            onChange={(files) => {
              const newPath = deduplicatePaths(files.map(f => f.serverFileName).filter(Boolean).join(','));
              setUserReplacedDocs(prev => {
                const next = new Set(prev);
                if (newPath) {
                  next.add(fieldName);
                } else {
                  next.delete(fieldName);
                }
                return next;
              });
              setFormData(prev => ({ 
                ...prev, 
                [fieldName]: newPath,
                ...(fieldName === 'employeePhotoUpload' ? { photoVerifiedStatus: newPath ? 'PENDING' : '', photoRejectReason: newPath ? '' : prev.photoRejectReason } : {}),
                ...(fieldName === 'resumePath' ? { resumeVerifiedStatus: newPath ? 'PENDING' : '', resumeRejectReason: newPath ? '' : prev.resumeRejectReason } : {}),
                ...(fieldName === 'aadharPath' ? { aadharVerifiedStatus: newPath ? 'PENDING' : '', aadharRejectReason: newPath ? '' : prev.aadharRejectReason } : {}),
                ...(fieldName === 'payslipPath' ? { payslipVerifiedStatus: newPath ? 'PENDING' : '', payslipRejectReason: newPath ? '' : prev.payslipRejectReason } : {})
              }));
              if (newPath && errors[fieldName]) {
                setErrors(prev => {
                  const updated = { ...prev };
                  delete updated[fieldName];
                  return updated;
                });
              }
            }}
            multiple={fieldName !== 'employeePhotoUpload' && fieldName !== 'resumePath'}
            maxFiles={fieldName === 'employeePhotoUpload' || fieldName === 'resumePath' ? 1 : 5}
            compact={true}
            accept={fieldName === 'employeePhotoUpload' ? 'image/*' : '.pdf,.png,.jpg,.jpeg,.doc,.docx'}
            label={isRejected ? 'Upload New Document' : (fieldName === 'employeePhotoUpload' ? 'Select Photo' : 'Select File')}
            helperText={
              fieldName === 'employeePhotoUpload'
                ? 'Max 1 file (PNG, JPG, JPEG)'
                : (fieldName === 'resumePath'
                    ? 'Max 1 file (PDF, DOCX, PNG, JPG, JPEG)'
                    : 'Max 5 files (PDF, DOCX, PNG, JPG, JPEG)')
            }
            disabled={isApproved}
            candidatePortalLayout={true}
            module={{
              employeePhotoUpload: 'HRA_PROFILE_IMAGE',
              resumePath: 'HRA_RESUME',
              aadharPath: 'HRA_KYC',
              payslipPath: 'HRA_PAYSLIP'
            }[fieldName] || 'HR_ATS'}
            onLimitExceeded={(msg) => setSnackbar({ open: true, message: msg, severity: 'warning' })}
          />

          {isError && (
            <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.75, display: 'block', fontSize: '0.75rem', fontWeight: 500 }}>
              {errorMessage}
            </Typography>
          )}
        </Stack>
      </Box>
    );
  };

  // Copy Present Address to Permanent
  // Clear spouse occupation error if marital status is not MARRIED
  useEffect(() => {
    if (formData.q6_marital_status !== 'MARRIED') {
      if (errors.q7_spouse_occupation) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.q7_spouse_occupation;
          return updated;
        });
      }
    }
  }, [formData.q6_marital_status]);

  const handleCopyAddress = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => {
      const next = {
        ...prev,
        same_as_current_address: isChecked ? 'YES' : 'NO'
      };
      if (isChecked) {
        next.q3_permanent_address = prev.q2_present_address;
      }
      return next;
    });
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
            <AssessmentSplash
              logoUrl={companyBranding.logoUrl}
              companyName={companyBranding.companyName}
              candidateName={
                candidate ? `${candidate.firstName} ${candidate.lastName}` : ''
              }
              subtext={verifying ? "Verifying secure credentials..." : "Initialising assessment portal..."}
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
        <AssessmentNetworkBackground themeMode={themeMode} />
        <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <SmoothLoadingSpinner size={54} color="#7c8cf8" label="Resuming assessment session..." />
        </Box>
      </Box>
    );
  }

  if (error && !candidate) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <AssessmentNetworkBackground themeMode={themeMode} />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            p: 2,
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
              <CardContent sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  <Logo height={70} logoUrl={companyBranding.logoUrl} />
                </Box>
                <Typography variant="h3" color="error.main" sx={{ fontWeight: 700, mb: 2 }}>
                  Link Expired or Invalid
                </Typography>
                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: 4, lineHeight: 1.6 }}>
                  {error}
                </Typography>
                <Typography variant="body2" sx={{ color: textMutedColor }}>
                  Please contact the HR team to receive a new direct link.
                </Typography>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>
    );
  }

  if (alreadySubmitted) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <AssessmentNetworkBackground themeMode={themeMode} />
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
                backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
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
              whileHover={{ y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
              sx={{
                ...cardStyle,
                p: { xs: 4, sm: 5 },
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
                  background: 'linear-gradient(90deg, #7c8cf8 0%, #63d9c4 100%)',
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
                      Assessment Portal
                    </Typography>
                  </Box>
                </Box>

                {/* SVG Success Verification Illustration */}
                <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                  <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                    <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(124, 140, 248, 0.12)' : 'rgba(124, 140, 248, 0.06)'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.35)' : 'rgba(140, 155, 255, 0.35)'} strokeWidth="1.5" />
                    <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.45)' : 'rgba(140, 155, 255, 0.45)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.3)' : 'rgba(140, 155, 255, 0.3)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.3)' : 'rgba(140, 155, 255, 0.3)'} strokeWidth="3" strokeLinecap="round" />

                    <circle className="check-pulse c1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                    <path className="check-pulse c1" d="M94 22l4 4 8-8" stroke="#7c8cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <circle className="check-pulse c2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                    <path className="check-pulse c2" d="M122 40l4 4 8-8" stroke="#63d9c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <g className="lock-float">
                      <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                      <circle className="check-pulse c3" cx="45" cy="91" r="10.5" fill="#63d9c4" />
                      <path className="check-pulse c3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                  </svg>
                </Box>

                <Typography variant="h2" sx={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: '28px',
                  mb: 2,
                  backgroundImage: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Assessment Completed
                </Typography>

                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: 4, lineHeight: 1.6 }}>
                  Dear <strong>{getCandidateFirstNameOnly(candidate)}</strong>, you have completed and submitted your Self-Assessment.
                </Typography>

                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', lineHeight: 1.5, px: 2 }}>
                  No further action is required. You may safely close this browser window.
                </Typography>
              </CardContent>
            </MotionCard>
          </Container>
        </Box>
      </Box>
    );
  }

  if (submitted) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <AssessmentNetworkBackground themeMode={themeMode} />
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
                backgroundColor: themeMode === 'light' ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
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
              whileHover={{ y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
              sx={{
                ...cardStyle,
                p: { xs: 3, sm: 5 },
                borderTop: '5px solid transparent',
                backgroundImage: cardStyle.background ? `${cardStyle.background}` : undefined,
                borderImageSlice: 1,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: { xs: '18px', sm: '24px' },
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
              <CardContent sx={{ p: 0, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: { xs: 2, sm: 3.5 } }}>
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
                      Assessment Portal
                    </Typography>
                  </Box>
                </Box>

                {/* SVG Success Verification Illustration */}
                <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 2, sm: 3.5 } }}>
                  <svg viewBox="0 0 150 130" fill="none" style={{ width: '110px', height: '95px' }}>
                    <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(124, 140, 248, 0.12)' : 'rgba(124, 140, 248, 0.06)'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.35)' : 'rgba(140, 155, 255, 0.35)'} strokeWidth="1.5" />
                    <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.45)' : 'rgba(140, 155, 255, 0.45)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.3)' : 'rgba(140, 155, 255, 0.3)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.3)' : 'rgba(140, 155, 255, 0.3)'} strokeWidth="3" strokeLinecap="round" />

                    <circle className="success-pulse s1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                    <path className="success-pulse s1" d="M94 22l4 4 8-8" stroke="#7c8cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <circle className="success-pulse s2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                    <path className="success-pulse s2" d="M122 40l4 4 8-8" stroke="#63d9c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <g className="lock-float">
                      <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90, 100, 190, 0.4)' : 'rgba(140, 155, 255, 0.4)'} strokeWidth="1.5" />
                      <circle className="success-pulse s3" cx="45" cy="91" r="10.5" fill="#63d9c4" />
                      <path className="success-pulse s3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                  </svg>
                </Box>

                <Typography variant="h2" sx={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: '22px', sm: '28px' },
                  mb: { xs: 1.5, sm: 2 },
                  backgroundImage: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Assessment Submitted
                </Typography>

                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '14px', sm: '15px' }, lineHeight: 1.5 }}>
                  Dear <strong>{getCandidateFirstNameOnly(candidate)}</strong>, your Self-Assessment has been successfully submitted.
                </Typography>

                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: { xs: 2.5, sm: 4 }, fontSize: { xs: '13.5px', sm: '15px' }, lineHeight: 1.5 }}>
                  Thank you for completing the assessment. Your responses have been recorded successfully, and no further action is required.
                </Typography>

                <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', lineHeight: 1.5, px: 2, fontSize: { xs: '11.5px', sm: '12.5px' } }}>
                  You may now safely close this browser window.
                </Typography>
              </CardContent>
            </MotionCard>
          </Container>
        </Box>
      </Box>
    );
  }

  return wrapTheme(
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
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
            <AssessmentSplash
              logoUrl={companyBranding.logoUrl}
              companyName={companyBranding.companyName}
              greetingName={candidate ? `Welcome, ${getCandidateFirstNameOnly(candidate)}` : 'Welcome'}
              subtext="Initialising assessment portal..."
              themeMode={themeMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {splashDone && (
        <>
          <AssessmentNetworkBackground themeMode={themeMode} />
      <Box
        sx={{
          minHeight: '100vh',
          height: { xs: 'auto', md: !assessmentStarted ? '100vh' : 'auto' },
          overflow: { xs: 'visible', md: !assessmentStarted ? 'hidden' : 'visible' },
          background: 'transparent',
          position: 'relative',
          transition: 'background 0.3s ease, color 0.3s ease',
          color: textPrimaryColor,
          display: 'flex',
          flexDirection: 'column',
          pb: { xs: 8, md: !assessmentStarted ? 0 : 12 },
          zIndex: 1,
          overflowX: 'hidden'
        }}
      >
        <CandidatePortalHeader
          logoUrl={companyBranding.logoUrl}
          companyName={companyBranding.companyName}
          portalTitle="Assessment Portal"
          candidateName={candidate?.firstName || candidate?.employeeName || candidate?.q1_full_name || ''}
          candidateId={candidate?.enRolledNo || candidate?.enrolledNo || candidate?.enRollNo || candidate?.applicantCode || candidate?.candidateCode || candidate?.empCode || candidate?.candidateNo || candidate?.appNo || ''}
          saveStatus={saveStatus}
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          progressPercent={progressPercent}
          borderCol={borderCol}
          textPrimaryColor={textPrimaryColor}
          textMutedColor={textMutedColor}
          onboardingStarted={assessmentStarted}
          activeTab={currentStep - 1}
          onNextStep={currentStep > 1 && currentStep < 9 ? handleNext : undefined}
          onPrevStep={currentStep > 2 ? handleBack : undefined}
          canGoNext={currentStep > 1 && currentStep < 9}
          canGoPrev={currentStep > 2}
        />

        {/* Main Form Body */}
        <Box sx={{ flexGrow: 1, py: { xs: 3, md: 6 } }}>
          <Container maxWidth="lg" sx={{ maxWidth: '1280px', mx: 'auto', px: { xs: 1.5, sm: 2.5, md: 3 }, width: '100%', boxSizing: 'border-box' }}>
            {/* Top Form Navigation Arrows (Visible on mobile & desktop at form top) */}
            {currentStep > 1 && currentStep < 9 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  px: 2,
                  py: 1.25,
                  borderRadius: '16px',
                  backgroundColor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                  border: `1.5px solid ${borderCol}`,
                  boxShadow: themeMode === 'light' ? '0 4px 14px rgba(0,0,0,0.03)' : '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                {currentStep > 2 ? (
                  <UniquePrevSymbolButton
                    onClick={handleBack}
                    tooltip="Previous Step"
                  />
                ) : (
                  <Box sx={{ width: 40, height: 40 }} />
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: textPrimaryColor, fontSize: '0.875rem' }}>
                  Step {currentStep - 1} of 7
                </Typography>
                <UniqueNextSymbolButton
                  onClick={handleNext}
                  disabled={currentStep >= 9}
                  tooltip="Next Step"
                />
              </Box>
            )}
          <AnimatePresence mode="wait">
            <motion.div
              id={`step-card-${currentStep}`}
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1: WELCOME SCREEN */}
              {currentStep === 1 && splashDone && (
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Scan Rings rotating in background */}
                  <div className="scan-ring"></div>
                  <div className="scan-ring inner"></div>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                      gap: { xs: 5, md: 8 },
                      alignItems: 'center',
                      width: '100%',
                      mt: { xs: 4, md: 0 },
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
                        SECURE ASSESSMENT GATEWAY
                      </Box>

                      <Typography variant="h1" sx={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 800,
                        color: textPrimaryColor,
                        fontSize: { xs: '38px', sm: '48px', md: '56px' },
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
                          {getCandidateFirstNameOnly(candidate)}
                        </span>
                      </Typography>

                      <Typography className="welcome-sub" variant="h2" sx={{
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 700,
                        fontSize: { xs: '20px', sm: '22px', md: '24px' },
                        lineHeight: 1.2,
                        mb: 2,
                        color: textPrimaryColor
                      }}>
                        We're excited to learn more about you!
                      </Typography>

                      <Typography className="welcome-desc" variant="body1" sx={{
                        fontWeight: 400,
                        color: textMutedColor,
                        mb: 4.5,
                        fontSize: '16px',
                        lineHeight: 1.6,
                        maxWidth: '440px'
                      }}>
                        This self-assessment questionnaire helps us understand your background, work style, career aspirations, and organizational fit.
                      </Typography>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
                      >
                        <Stack direction="row" spacing={3} sx={{ pt: 1, flexWrap: 'wrap', gap: '12px 20px' }}>
                          {[
                            { label: '256-bit encrypted', icon: <IconLock size={18} stroke={3} color="#fff" /> },
                            { label: 'Completion time: ~8 mins', icon: <IconClock size={18} stroke={3} color="#fff" /> },
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

                    {/* Right Column: Start Assessment Card */}
                    <MotionCard
                      className="welcome-card"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                      whileHover={isMobile ? {} : { y: -8, boxShadow: themeMode === 'light' ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)' : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)' }}
                      sx={{
                        ...cardStyle,
                        p: { xs: 4, sm: 5 },
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
                              Assessment Portal
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
                          onClick={() => setCurrentStep(2)}
                          endIcon={<IconChevronRight size={18} />}
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
                          Start Assessment
                        </MotionButton>

                        <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', textAlign: 'center', lineHeight: 1.5, px: 2 }}>
                          You've received a secure invitation link from {companyBranding.companyName}. Please do not share it.
                        </Typography>
                      </CardContent>
                    </MotionCard>
                  </Box>
                </Box>
              )}

              {/* STEP 2: APPLICANT DETAILS (NEW) */}
              {currentStep === 2 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor }}>
                        Applicant Details
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Review your applicant details captured during recruitment before filling out the assessment.
                    </Typography>

                    <Stack spacing={3}>
                      {/* Personal & Contact Information */}
                      <Box sx={innerCardStyle}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconUser size={18} />
                          Personal & Contact Information
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                          {renderReadOnlyField('Applicant Name', candidate?.firstName, null, 'விண்ணப்பதாரர் பெயர்')}
                          {renderReadOnlyField('Father Name', candidate?.lastName, null, 'தந்தை பெயர்')}
                          {renderReadOnlyField('Mobile Number', candidate?.mobileNo || candidate?.phoneNo, null, 'கைபேசி எண்')}
                          {renderReadOnlyField('Email ID', candidate?.emailId, null, 'மின்னஞ்சல் முகவரி')}
                          {renderReadOnlyField('Aadhaar Number', candidate?.aadharNo, null, 'ஆதார் எண்')}
                          
                          {renderSelect(
                            'gender',
                            'Gender',
                            [
                              { label: 'Male', value: 'MALE' },
                              { label: 'Female', value: 'FEMALE' },
                              { label: 'Trans', value: 'TRANS' }
                            ],
                            true,
                            'பாலினம்',
                            'Select Gender'
                          )}

                          {renderSelect(
                            'religionSelect',
                            'Religion',
                            ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'],
                            true,
                            'மதம்',
                            'Select Religion'
                          )}
                          {formData.religionSelect === 'Other' && (
                            renderInput(
                              'religion_other',
                              'Specify Religion',
                              true,
                              'Enter your religion',
                              'மதம் விவரம்'
                            )
                          )}
                        </Box>
                      </Box>

                      {/* Position & Interview Details */}
                      <Box sx={innerCardStyle}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconBriefcase size={18} />
                          Position & Interview Details
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                          {renderReadOnlyField('Department', candidate?.departmentName || candidate?.department, null, 'துறை')}
                          {renderReadOnlyField('Position / Designation', candidate?.positionLookFor, null, 'பதவி')}
                          {renderReadOnlyField('Interview Date', candidate?.callLetterDate, <IconCalendar size={18} />, 'நேர்காணல் தேதி')}
                          {renderReadOnlyField('Reference Mode', candidate?.refMode || candidate?.referMode, null, 'குறிப்பு முறை')}
                          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
                            {renderReadOnlyField('Reference Details', candidate?.referenceComments || candidate?.refComments, null, 'குறிப்பு விவரங்கள்')}
                          </Box>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3: PERSONAL DETAILS */}
              {currentStep === 3 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Personal Details
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Tell us about your background, current residence, and family configurations.
                    </Typography>
                    
                    <Stack spacing={3}>
                      {/* Residence & Family Background Grid */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                        {/* Residence & Address Background */}
                        <Box sx={{ ...innerCardStyle, height: '100%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconHome size={18} />
                            Residence & Native Background
                          </Typography>
                          {renderInput('q1_native', 'Native Place', true, 'City/Town', 'சொந்த ஊர்')}
                          {renderTextarea('q2_present_address', 'Present Address', true, 3, 'Enter your current residential address', 'தற்போதைய முகவரி')}
                          
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={formData.same_as_current_address === 'YES'}
                                    onChange={handleCopyAddress} 
                                    sx={{ color: borderCol, '&.Mui-checked': { color: '#2563EB' } }} 
                                  />
                                }
                                label={<Typography variant="body2" sx={{ color: textSecondaryColor, fontWeight: 500 }}>Permanent address is same as present address</Typography>}
                              />
                            </Box>
                            {renderTextarea('q3_permanent_address', 'Permanent Address', true, 3, 'Enter your permanent address', 'நிரந்தர முகவரி')}
                          </Box>

                        </Box>

                        {/* Family Background */}
                        <Box sx={{ ...innerCardStyle, height: '100%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconUser size={18} />
                            Family Background
                          </Typography>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {renderInput('q4_father_occupation', "Father's Occupation", true, 'e.g. Farmer / Retired', 'தந்தையின் தொழில்')}
                            {renderInput('q5_mother_occupation', "Mother's Occupation", true, 'e.g. Homemaker', 'தாயின் தொழில்')}
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            {renderSelect('q6_marital_status', 'Marital Status', ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'], true, 'திருமண நிலை', '--SELECT--')}
                            {formData.q6_marital_status === 'MARRIED' && renderInput('q7_spouse_occupation', "Occupation of Spouse", true, 'e.g. Salaried / Homemaker', 'கணவர் / மனைவியின் தொழில்')}
                          </Box>
                          {formData.q6_marital_status === 'MARRIED' && (
                            renderInput('q8_children', 'Children Details (count & ages)', false, 'e.g. 1 Child - Age 5', 'குழந்தைகளின் விவரங்கள் (எண்ணிக்கை / வயது)')
                          )}
                          {renderTextarea('q11_siblings_occupations', 'Siblings and their occupations', false, 2, 'e.g. Elder Brother - Civil Engineer', 'உடன்பிறந்தவர்கள் மற்றும் அவர்களின் தொழில் விவரங்கள்')}
                        </Box>
                      </Box>

                      {/* Company Connections */}
                      <Box sx={innerCardStyle}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconUsers size={18} />
                          Internal Company Connections
                        </Typography>
                        {renderYesNoSegment('q9_has_relatives', 'Any relatives or friends working in our company?', true, 'உறவினர்கள் அல்லது நண்பர்கள் யாராவது இங்கு வேலை செய்கிறார்களா?')}
                        {formData.q9_has_relatives === 'YES' && renderTextarea('q10_relatives_details', 'Relatives or Friends Details', true, 2, 'Please list names and their departments', 'உறவினர் அல்லது நண்பர்களின் விவரங்கள்')}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* STEP 4: LIFESTYLE & HEALTH */}
              {currentStep === 4 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Lifestyle & Health
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      General information regarding your travel assets and vaccination status.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                      {/* Transport Assets */}
                      <Box sx={{ ...innerCardStyle, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2 }}>
                          Vehicles & Asset Ownership
                        </Typography>
                        {renderYesNoSegment('q12_has_two_wheeler', 'Do you own a two wheeler?', true, 'உங்களிடம் இருசக்கர வாகனம் உள்ளதா?')}
                        {renderYesNoSegment('q13_has_android_phone', 'Do you own an Android smartphone?', true, 'உங்களிடம் ஆண்ட்ராய்டு மொபைல் போன் உள்ளதா?')}
                        {renderYesNoSegment('q14_knows_car_driving', 'Do you know how to drive a car?', true, 'உங்களுக்கு கார் ஓட்ட தெரியுமா?')}
                      </Box>

                      {/* Travel & Health */}
                      <Box sx={{ ...innerCardStyle, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2 }}>
                          Travel Duties & Health Status
                        </Typography>
                        {renderYesNoSegment('q15_willing_to_travel', 'Are you willing to travel for work duties?', true, 'வேலைக்காக பயணம் செய்ய விருப்பமா?')}
                        {renderYesNoSegment('q16_covid_vaccination', 'Have you completed COVID-19 vaccination (including Booster)?', true, 'பூஸ்டர் டோஸுடன் கோவிட் தடுப்பூசி போடப்பட்டுள்ளதா?')}
                        {renderYesNoSegment('q47_has_insurance', 'Do you have Health / Medical Insurance?', true, 'உங்களிடம் மருத்துவக் காப்பீடு உள்ளதா?')}
                        {formData.q47_has_insurance === 'YES' && renderInput('q48_insurance_number', 'Insurance Number / Policy ID', true, 'e.g. POL-98765432', 'காப்பீட்டு எண் / பாலிசி எண்')}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* STEP 5: PERSONAL REFLECTION */}
              {currentStep === 5 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Personal Reflection & Goals
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Help us understand your self-awareness, goals, and thoughts on productivity.
                    </Typography>

                    <Box sx={innerCardStyle}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2.5 }}>
                        Self Awareness & Career Goals
                      </Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                        {/* Column 1 (Left) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                          {renderTextarea('q17_positive_points', 'Brief about your positive points / strengths', true, 3, 'Describe your strengths, qualities, or attributes...', 'உங்களது நேர்மறையான குணங்கள் / பலங்கள் பற்றி சுருக்கமாக கூறவும்')}
                          {renderTextarea('q18_negative_points', 'Brief about your negative points / areas of improvement', true, 3, 'Identify weaknesses or habits you are working on...', 'உங்களது எதிர்மறையான குணங்கள் / பலவீனங்கள் பற்றி சுருக்கமாக கூறவும்')}
                        </Box>

                        {/* Column 2 (Right) */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                          {renderTextarea('q19_life_goals', 'What are your life goals, and what are you currently doing to achieve them?', true, 3, 'Outline your life goals and the steps you are taking to achieve them...', 'உங்களது வாழ்க்கை லட்சியங்கள் என்ன, அதை அடைய என்ன செய்கிறீர்கள்?')}
                          {renderYesNoSegment('q20_willing_rotational_shifts', 'Willing to work in rotational shifts?', true, 'சுழற்சி முறையில் (Rotational Shifts) வேலை செய்ய விருப்பமா?')}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* STEP 6: CAREER & EXPECTATIONS */}
              {currentStep === 6 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Career & Expectations
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Provide details about your previous work experience and expected compensation rates.
                    </Typography>

                    <Stack spacing={3}>
                      {/* Prior Employment Details */}
                      <Box sx={innerCardStyle}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconBriefcase size={18} />
                          Prior Employment History
                        </Typography>

                        {renderYesNoSegment('q21_is_experienced', 'Do you have prior work experience?', true, 'முன் அனுபவம் உள்ளதா?')}

                        {formData.q21_is_experienced === 'YES' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box sx={{ mt: 3, pt: 3, borderTop: `1px dashed ${borderCol}` }}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                {renderInput('q22_total_experience', 'Total Experience (Years)', true, 'e.g. 5', 'மொத்த அனுபவ ஆண்டுகள்', 'number')}
                                {renderInput('q23_core_experience', 'Core Department Experience (Years)', true, 'e.g. 3', 'முக்கிய துறை சார்ந்த அனுபவ ஆண்டுகள்', 'number')}
                              </Box>

                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                {renderInput('q24_prev_net_salary', 'Previous Net Salary (Monthly)', true, 'e.g. 25000', 'முந்தைய நிறுவனத்தில் கைக்கு கிடைத்த நிகர சம்பளம்', 'number')}
                                {renderInput('q25_prev_gross_salary', 'Previous Gross Salary (Monthly)', true, 'e.g. 28000', 'முந்தைய நிறுவனத்தில் பெற்ற மொத்த சம்பளம்', 'number')}
                              </Box>

                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                {renderInput('q31_prev_location', 'Previous Company Location', true, 'e.g. Chennai', 'முந்தைய நிறுவனத்தின் இடம்')}
                                {renderSelect('q32_prev_shift', 'Previously Worked Shift', portalShifts, true, 'முன்பு வேலை செய்த ஷிப்ட் விவரம்')}
                              </Box>

                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                {renderInput('q34_notice_period', 'Notice Period (Days)', true, 'e.g. 30', 'அறிவிப்பு காலம் (நாட்கள்)', 'number')}
                                {renderInput('q36_prev_dept_count', 'Department Employee Count', true, 'e.g. 15', 'முந்தைய துறையில் இருந்த ஊழியர்களின் எண்ணிக்கை', 'number')}
                              </Box>

                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                {renderInput('q35_prev_dept_position', 'Previous Department & Position', true, 'e.g. Production Inspector', 'முந்தைய துறை மற்றும் பதவி விவரங்கள்')}
                                {renderSelect('q33_reason_for_leaving', 'Reason for leaving previous job', REASON_FOR_LEAVING_OPTIONS, true, 'முந்தைய வேலையிலிருந்து விலகியதற்கான காரணம்')}
                              </Box>

                              {(formData.q33_reason_for_leaving === 'Others' || formData.q33_reason_for_leaving === 'Other' || formData.q33_reason_for_leaving?.startsWith('Other')) && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                  <Box sx={{ gridColumn: { sm: 2 } }}>
                                    {renderInput('q33_reason_for_leaving_other', 'Specify Reason for Leaving', true, 'e.g. Relocation / Higher Studies', 'காரணத்தைக் குறிப்பிடவும்')}
                                  </Box>
                                </Box>
                              )}

                              {/* Manager References */}
                              <Box sx={{ mt: 3, mb: 2.5, p: 2.5, border: `1px solid ${borderCol}`, borderRadius: '12px', backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 1.5 }}>
                                  HR Manager Reference Details <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: 2 }}>
                                  {renderInput('q41_hr_mgr_name', 'HR Manager Name', true, 'e.g. John Doe', 'மனிதவள மேலாளர் பெயர்')}
                                  {renderInput('q42_hr_mgr_email', 'HR Manager Email', true, 'e.g. manager@company.com', 'மனிதவள மேலாளர் மின்னஞ்சல்', 'email')}
                                  {renderPhoneInput('q43_hr_mgr_phone', 'q43_hr_mgr_country_id', 'HR Manager Phone', true, 'e.g. 9876543210', 'மனிதவள மேலாளர் தொலைபேசி')}
                                </Box>
                              </Box>

                              {/* Vertical Head References */}
                              <Box sx={{ mt: 2.5, mb: 1, p: 2.5, border: `1px solid ${borderCol}`, borderRadius: '12px', backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 1.5 }}>
                                  Vertical Head Reference Details <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.5fr' }, gap: 2 }}>
                                  {renderInput('q44_vert_head_name', 'Vertical Head Name', true, 'e.g. Jane Smith', 'துறைத் தலைவர் பெயர்')}
                                  {renderInput('q45_vert_head_email', 'Vertical Head Email', true, 'e.g. head@company.com', 'துறைத் தலைவர் மின்னஞ்சல்', 'email')}
                                  {renderPhoneInput('q46_vert_head_phone', 'q46_vert_head_country_id', 'Vertical Head Phone', true, 'e.g. 9876543210', 'துறைத் தலைவர் தொலைபேசி')}
                                </Box>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </Box>

                      {/* Compensation Expectations */}
                      <Box sx={innerCardStyle}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconTrendingUp size={18} />
                          Salary Expectations & Preferences
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
                          {renderInput(
                            'q26_expected_net_salary',
                            'Expected Net Salary (Take-home)',
                            true,
                            'e.g. 30000',
                            'எதிர்பார்க்கும் நிகர சம்பளம்',
                            'number',
                            <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: textMutedColor } }}>₹</InputAdornment>
                          )}
                          {renderInput(
                            'q27_expected_gross_salary',
                            'Expected Gross Salary',
                            true,
                            'e.g. 35000',
                            'எதிர்பார்க்கும் மொத்த சம்பளம்',
                            'number',
                            <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: textMutedColor } }}>₹</InputAdornment>
                          )}
                          {renderSelect(
                            'q30_alternative_department',
                            'Alternative Department of Interest (If any)',
                            portalDepartments,
                            false,
                            'மாற்றுத் துறையில் பணிபுரிய ஆர்வம் உள்ளதா?'
                          )}
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* STEP 7: BEHAVIORAL QUESTIONS */}
              {currentStep === 7 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2.5, sm: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Behavioral & Skill Rating
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Help us understand how you deal with work situations and rate your core computer skills.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
                      {/* Behavioral Questions */}
                      <Box sx={{ ...innerCardStyle, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2 }}>
                          Behavioral & Workplace Situations
                        </Typography>
                        {renderSelect('q38_handle_mistake', 'If you made a mistake in your office location, how will you handle it?', MISTAKE_HANDLING_OPTIONS, true, 'அலுவலகத்தில் தவறு செய்தால் அதை எப்படி கையாளுவீர்கள்?')}
                        {renderTextarea('q39_handle_opinion_difference', 'If your team members have a different opinion than yours, how will you handle it?', false, 3, 'e.g. Discuss calmly, evaluate facts, choose path best for goals...', 'குழுவில் உள்ள கருத்து வேறுபாடுகளை எவ்வாறு கையாள்வீர்கள்?')}
                        {renderTextarea('q20_improvement_suggestions', 'To make your workplace more productive, what are your improvement ideas and suggestions?', false, 3, 'Share your ideas and suggestions...', 'பணி இடத்தை மேலும் திறம்பட மாற்ற உங்களின் ஆலோசனைகள் என்ன?')}
                      </Box>

                      {/* Computer Skill Self-Rating */}
                      <Box sx={{ ...innerCardStyle, height: '100%' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 2 }}>
                          Computer Proficiency Rating
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: textPrimaryColor, fontSize: '0.875rem' }}>
                              Kindly give a self-rating for MS-Office, Outlook & basic computer skills.
                            </Typography>
                            <Tooltip title={<Typography variant="body2" sx={{ p: 0.5, fontSize: '0.9rem', color: '#ffffff' }}>நிலையான அலுவலக பயன்பாடுகளை (MS-Office, Outlook) பயன்படுத்தும் உங்களது திறன் அளவை சுய மதிப்பீடு செய்யவும்?</Typography>} arrow placement="top">
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', backgroundColor: themeMode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)', color: textMutedColor, cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', ml: 1 }}>?</Box>
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', mb: 2 }}>
                            Rate your proficiency level using standard workplace computer applications.
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3, border: `1px solid ${borderCol}`, borderRadius: '14px', backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)' }}>
                            <PremiumStarRating
                              value={formData.q40_computer_self_rating}
                              onChange={(strRating) => {
                                setFormData(prev => ({ ...prev, q40_computer_self_rating: strRating }));
                              }}
                              themeMode={themeMode}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* STEP 8: DOCUMENT UPLOAD */}
              {currentStep === 8 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 2.5, sm: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Document Uploads
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Please upload scanned copies of your photo, resume, and identification cards.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
                      {renderUploadCard('employeePhotoUpload', 'Passport Photo', true, formData.photoVerifiedStatus, formData.photoRejectReason)}
                      {renderUploadCard('resumePath', 'Resume Document', true, formData.resumeVerifiedStatus, formData.resumeRejectReason)}
                      {renderUploadCard('aadharPath', 'Aadhar Card Scan', true, formData.aadharVerifiedStatus, formData.aadharRejectReason)}
                      {renderUploadCard(
                        'payslipPath',
                        'Previous payslip',
                        formData.q21_is_experienced === 'YES',
                        formData.payslipVerifiedStatus,
                        formData.payslipRejectReason,
                        formData.q21_is_experienced !== 'YES'
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* STEP 9: REVIEW & SUBMIT */}
              {currentStep === 9 && (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 4, md: 5 } }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimaryColor, mb: 1 }}>
                      Review & Submit
                    </Typography>
                    <Typography variant="body2" sx={{ color: textMutedColor, mb: 4 }}>
                      Review all your responses below. You can return to edit any section if needed.
                    </Typography>

                    <Stack spacing={4}>
                      {/* Section 0: Applicant Details */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            Applicant Details (Read-Only)
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEye size={18} />} onClick={() => setCurrentStep(2)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>View Section</Box>
                          </Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Candidate Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.firstName || candidate?.employeeName || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Father Name</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.lastName || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Mobile / Email</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.mobileNo || candidate?.phoneNo || '—'} / {candidate?.emailId || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Aadhaar Number</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.aadharNo || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Gender</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatGenderDisplay(formData.gender || candidate?.gender)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Religion</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.religion || candidate?.religion || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Department / Position</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.departmentName || candidate?.department || '—'} / {candidate?.positionLookFor || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Interview Date</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{candidate?.callLetterDate || '—'}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Section 1: Personal Details */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            1. Personal Details
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(3)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Native Place</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q1_native || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Marital Status</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q6_marital_status) || '—'}</Typography>
                          </Box>
                          {formData.q6_marital_status === 'MARRIED' && (
                            <Box>
                              <Typography variant="caption" sx={{ color: textMutedColor }}>Spouse's Occupation</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q7_spouse_occupation || '—'}</Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Father's Occupation</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q4_father_occupation || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Mother's Occupation</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q5_mother_occupation || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Children Count / Details</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q8_children || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Relatives / Friends in Company</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q9_has_relatives) === 'Yes' ? `Yes (${formData.q10_relatives_details})` : 'No'}</Typography>
                          </Box>
                          <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Sibling Occupations</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q11_siblings_occupations || '—'}</Typography>
                          </Box>
                          <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Present Address</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q2_present_address || '—'}</Typography>
                          </Box>
                          <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Permanent Address</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q3_permanent_address || '—'}</Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Section 2: Lifestyle & Health */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            2. Lifestyle & Health
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(4)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Owns Two Wheeler</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q12_has_two_wheeler) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Owns Android Phone</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q13_has_android_phone) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Knows Car Driving</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q14_knows_car_driving) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Willing to Travel</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q15_willing_to_travel) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Vaccinated</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q16_covid_vaccination) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Health Insurance</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q47_has_insurance) || '—'}</Typography>
                          </Box>
                          {formData.q47_has_insurance === 'YES' && (
                            <Box>
                              <Typography variant="caption" sx={{ color: textMutedColor }}>Insurance Policy No</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q48_insurance_number || '—'}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Section 3: Reflections */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            3. Reflections
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(5)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Strengths</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q17_positive_points || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Areas of Improvement</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q18_negative_points || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Life Goals & Action Plan</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q19_life_goals || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Willing to work in Rotational Shifts</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q20_willing_rotational_shifts) || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Section 4: Career & Expectations */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            4. Career & Expectations
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(6)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Experienced</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formatDisplayLabel(formData.q21_is_experienced) || '—'}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Expected Salary (Net)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q26_expected_net_salary ? `₹ ${formData.q26_expected_net_salary}` : '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Expected Salary (Gross)</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q27_expected_gross_salary ? `₹ ${formData.q27_expected_gross_salary}` : '—'}</Typography>
                          </Box>

                          {formData.q21_is_experienced === 'YES' && (
                            <>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Total Experience</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q22_total_experience} Years</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Core Experience</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q23_core_experience} Years</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Previous Net Salary (Monthly)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q24_prev_net_salary ? `₹ ${formData.q24_prev_net_salary}` : '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Previous Gross Salary (Monthly)</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q25_prev_gross_salary ? `₹ ${formData.q25_prev_gross_salary}` : '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Previous Company Location</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q31_prev_location || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Previously Worked Shift</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q32_prev_shift || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Reason for Leaving</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q33_reason_for_leaving || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Notice Period</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q34_notice_period ? `${formData.q34_notice_period} Days` : '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Previous Department & Position</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q35_prev_dept_position || '—'}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: textMutedColor }}>Department Employee Count</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q36_prev_dept_count || '—'}</Typography>
                              </Box>
                              <Box sx={{ gridColumn: 'span 2', mt: 1, p: 2, border: `1px solid ${borderCol}`, borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 1 }}>
                                  HR Manager Reference
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: textMutedColor }}>Name</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q41_hr_mgr_name || '—'}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: textMutedColor }}>Email / Phone</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q42_hr_mgr_email || '—'} / {formData.q43_hr_mgr_phone || '—'}</Typography>
                                  </Box>
                                </Box>
                              </Box>
                              <Box sx={{ gridColumn: 'span 2', mt: 1, p: 2, border: `1px solid ${borderCol}`, borderRadius: '8px' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB', mb: 1 }}>Vertical Head Reference</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: textMutedColor }}>Name</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q44_vert_head_name || '—'}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: textMutedColor }}>Email / Phone</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q45_vert_head_email || '—'} / {formData.q46_vert_head_phone || '—'}</Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>

                      {/* Section 5: Behavioral Questions */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            5. Behavioral Questions
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(7)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Proficiency in MS Office</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB' }}>{formatDisplayLabel(formData.q40_computer_self_rating) || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Handling Mistakes</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q38_handle_mistake || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Team Opinion Differences</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q39_handle_opinion_difference || '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: textMutedColor }}>Productivity & Improvement Suggestions</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: textPrimaryColor }}>{formData.q20_improvement_suggestions || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {/* Section 6: Uploaded Documents */}
                      <Box sx={innerCardStyle}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                            6. Uploaded Documents
                          </Typography>
                          <Button size="small" variant="text" startIcon={<IconEdit size={18} />} onClick={() => setCurrentStep(8)} sx={{ fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: { xs: 0.75, sm: '4px 8px' } }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Edit Section</Box>
                          </Button>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          {(() => {
                            const fields = [
                              { key: 'employeePhotoUpload', label: 'Passport Photo', displayLabel: 'Passport Photo' },
                              { key: 'resumePath', label: 'Resume Document', displayLabel: 'Resume' },
                              { key: 'aadharPath', label: 'Aadhaar Card', displayLabel: 'Aadhaar Card' },
                              { key: 'payslipPath', label: 'Salary Payslip', displayLabel: 'Payslip', cond: formData.q21_is_experienced === 'YES' }
                            ];

                            return fields.map((f, idx) => {
                              if (f.cond === false) return null;
                              const val = formData[f.key];
                              const files = val ? parseDocumentPaths(val) : [];
                              const hasFiles = files.length > 0;

                              return (
                                <Box 
                                  key={idx} 
                                  sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    p: { xs: 1.25, sm: 2 },
                                    border: `1px solid ${borderCol}`,
                                    borderRadius: '12px',
                                    backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, width: '100%', gap: 1 }}>
                                    <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      {f.label}
                                    </Typography>
                                    {hasFiles ? (
                                      <Chip label="Uploaded" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                    ) : (
                                      <Chip label="Missing" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }} />
                                    )}
                                  </Box>
                                  
                                  {hasFiles ? (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, width: '100%', mt: 1 }}>
                                      {files.map((filePath, fileIdx) => {
                                        const rawName = filePath.split('/').pop()?.split('\\').pop() || `${f.displayLabel} File`;
                                        const cleanName = getCleanFileName(rawName);
                                        const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(rawName);
                                        
                                        const handleEyeClick = () => {
                                          const allDocsList = [];
                                          fields.forEach(field => {
                                            if (field.cond === false) return;
                                            const pathStr = formData[field.key];
                                            if (pathStr) {
                                              parseDocumentPaths(pathStr).forEach(p => {
                                                allDocsList.push({
                                                  url: getFileViewUrl(p), name: p.split('/').pop()?.split('\\').pop() || 'File', fileName: `${field.displayLabel} - ${p.split('/').pop()?.split('\\').pop() || 'File'}`, serverFileName: p, isServer: true,
                                                  label: `${field.displayLabel} - ${p.split('/').pop()?.split('\\').pop() || 'File'}`
                                                });
                                              });
                                            }
                                          });
                                          const thisUrl = filePath;
                                          const clickIdx = allDocsList.findIndex(d => d.serverFileName === thisUrl);
                                          openDocPreview(allDocsList, clickIdx >= 0 ? clickIdx : 0);
                                        };

                                        return (
                                          <Box 
                                            key={fileIdx} 
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
                                            {/* Thumbnail / Icon */}
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
                                                  src={getFileViewUrl(filePath)}
                                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                                                />
                                              ) : null}
                                              <Box sx={{ display: isImg ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                {f.key === 'employeePhotoUpload' ? <IconUser size={16} color="#22c55e" /> :
                                                 f.key === 'aadharPath' ? <IconLock size={16} color="#22c55e" /> :
                                                 f.key === 'payslipPath' ? <IconAward size={16} color="#22c55e" /> :
                                                 <IconFileText size={16} color="#22c55e" />}
                                              </Box>
                                            </Box>

                                            {/* File Name */}
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

                                            {/* Preview Button */}
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
                                  ) : (
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                      Missing ✗
                                    </Typography>
                                  )}
                                </Box>
                              );
                            });
                          })()}
                        </Box>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 4, borderColor: borderCol }} />

                    <Box
                      id="field-container-confirmSubmit"
                      sx={{
                        p: 2,
                        mb: 4,
                        borderRadius: '12px',
                        border: `1px solid ${errors.confirmSubmit ? '#d32f2f' : (themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)')}`,
                        backgroundColor: errors.confirmSubmit
                          ? (themeMode === 'light' ? 'rgba(211, 47, 47, 0.04)' : 'rgba(211, 47, 47, 0.08)')
                          : 'transparent',
                        transition: 'all 0.3s ease',
                        ...(errors.confirmSubmit ? {
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
                              if (checked && errors.confirmSubmit) {
                                setErrors(prev => {
                                  const next = { ...prev };
                                  delete next.confirmSubmit;
                                  return next;
                                });
                              }
                            }}
                            sx={{
                              color: errors.confirmSubmit ? '#d32f2f' : borderCol,
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
                      {errors.confirmSubmit && (
                        <Typography variant="caption" sx={{ color: '#d32f2f', mt: 1, display: 'block', fontSize: '0.75rem', fontWeight: 600, pl: 4 }}>
                          {errors.confirmSubmit}
                        </Typography>
                      )}
                    </Box>

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
                        borderRadius: '10px',
                        boxShadow: '0 4px 18px rgba(34, 197, 94, 0.35)',
                        textTransform: 'none'
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Assessment'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Navigation Symbol Buttons (for steps 2 to 8) */}
          {currentStep > 1 && currentStep < 9 && (
            <Box sx={{
              mt: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              borderRadius: '16px',
              backgroundColor: themeMode === 'light' ? '#ffffff' : '#1e293b',
              border: `1.5px solid ${borderCol}`
            }}>
              {currentStep > 2 ? (
                <UniquePrevSymbolButton
                  onClick={handleBack}
                  size="large"
                  tooltip="Previous Step"
                />
              ) : (
                <Box sx={{ width: 48, height: 48 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600, color: textMutedColor, textAlign: 'center' }}>
                Step {currentStep - 1} of 7
              </Typography>
              <UniqueNextSymbolButton
                onClick={handleNext}
                size="large"
                tooltip="Next Step"
              />
            </Box>
          )}

          {/* Special buttons for step 9 review navigation back */}
          {currentStep === 9 && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{
                  height: { xs: 44, sm: 48 },
                  width: { xs: 44, sm: 'auto' },
                  minWidth: { xs: 44, sm: 'auto' },
                  px: { xs: 0, sm: 3 },
                  borderRadius: '12px',
                  borderColor: borderCol,
                  color: textSecondaryColor,
                  fontWeight: 600,
                  textTransform: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}
              >
                <IconArrowLeft size={20} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Back to Documents
                </Box>
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Candidate Document Universal Preview */}
      <BOSFilePreview
        open={docPreview.open}
        onClose={closeDocPreview}
        file={docPreview.docs[docPreview.currentIndex]}
        allFiles={docPreview.docs}
        onNavigate={(newFile) => {
          const idx = docPreview.docs.findIndex(d => d.serverFileName === newFile.serverFileName);
          if (idx >= 0) {
            setDocPreview(prev => ({ ...prev, currentIndex: idx }));
          }
        }}
      />

      {/* Bottom Right Validation Toast / Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
      </>
      )}
    </Box>
  );
}
