import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Typography, Button, Stack, Tooltip, IconButton, MenuItem, Checkbox, Grid, Box, Tabs, Tab, Card, CardContent, FormControlLabel, InputAdornment, Divider, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, useTheme, Rating, Avatar
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import axios from 'utils/axios';
import {
  IconArrowLeft, IconDeviceFloppy, IconEraser, IconUser, IconBriefcase, IconSchool, IconCurrencyDollar, IconAddressBook, IconLock, IconStar, IconTrendingUp, IconPlus, IconTrash, IconCalendar, IconFileText, IconShieldCheck, IconX
} from '@tabler/icons-react';
import { getUserImageUrl, getFileViewUrl } from 'utils/upload-helper';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormSection,
  BOSTextField,
  BOSEmployeeAutocomplete,
  AadharInput,
  BOSDatePicker,
  BOSFileUpload,
  BOSPfpAvatar,
  errorStyle,
  btnSave,
  btnCancel,
  btnClear
} from 'ui-component/bos';
import { useLookups } from 'hooks/useLookups';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { UniquePrevSymbolButton, UniqueNextSymbolButton } from '../candidate/CandidatePortalShared';

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
};

const formatDocName = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => {
    const upper = word.toUpperCase();
    if (upper === 'ID' || upper === 'PAN') return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const INITIAL_FORM_STATE = {
  id: null,
  enRolledNo: '',
  applicantDate: getTodayDateString(),
  positionLookFor: '',
  title: 'Mr',
  firstName: '',
  lastName: '',
  department: '',
  mobileNo: '',
  emailId: '',
  aadharNo: '',
  birthDate: '',
  age: '',
  duplicateAadhar: false,
  refMode: '',
  refComments: '',
  call: 'PENDING',
  interview: 'PENDING',
  offer: 'PENDING',
  verification: 'PENDING',
  status: 'APPLIED',
  isRehired: 'NO',
  previousEmpCode: '',
  backgroundVerificationStatus: 'PENDING'
};

const INITIAL_PERSONAL_STATE = {
  enRollNo: '0',
  gender: '',
  maritalStatus: '',
  birthDate: getTodayDateString(),
  panNo: '',
  officePhoneNo: '',
  phoneNo: '',
  mobileNo: '',
  emailId: '',
  religion: '',
  nationality: 'INDIAN',
  permAdd1: '',
  permAdd2: '',
  city: '',
  state: '',
  sameAsPermanent: false,
  persAdd1: '',
  persAdd2: ''
};

const INITIAL_SALARY_STATE = {
  basic: '',
  da: '',
  hra: '',
  splAllowance: '',
  perfIncentive: '',
  statutoryBonus: '',
  canteenAllowance: '',
  attendanceAllow1: '',
  attendanceAllow2: '',
  uniform: '',
  shoes: '',
  mobileCug: '',
  otAmount: '',
  petrolAllow: '',
  appraisalPer: '',
  otherAllow: '',
  pfEmployee: '',
  pfEmployer: '',
  esiEmployee: '',
  esiEmployer: '',
  canteenDeduct: '',
  profTax: '',
  labourWelFundEmp: '',
  labourWelFundEmployer: '',
  otherDeduct: '',
  suspenseDeduct: ''
};

const INITIAL_EVALUATION_STATE = {
  enRolledNo: '0',
  interviewDate: getTodayDateString(),
  status: 'HOLD',
  comments: '',
  technicalInterviewedBy: '',
  hrInterviewedBy: ''
};

const INITIAL_CONTACT_STATE = {
  enRolledNo: '0',
  address1: '',
  address2: '',
  city: '',
  phoneNo: '',
  mobileNo: ''
};

const INITIAL_ASSESSMENT_STATE = {
  q1_native: '',
  q2_presentAddress: '',
  q3_permanentAddress: '',
  q4_fatherOccupation: '',
  q5_motherOccupation: '',
  q6_maritalStatus: 'UNMARRIED',
  q7_spouseOccupation: '',
  q8_children: '',
  q9_hasRelativesInCompany: '',
  q10_relativesDetails: '',
  q11_siblingsOccupations: '',
  q12_hasTwoWheeler: '',
  q13_hasAndroidPhone: '',
  q14_knowsCarDriving: '',
  q15_willingToTravel: '',
  q16_covidVaccination: '',
  q47_hasInsurance: '',
  q48_insuranceNumber: '',
  q17_positivePoints: '',
  q18_negativePoints: '',
  q19_lifeGoals: '',
  q20_willingRotationalShifts: '',
  q20_improvementSuggestions: '',
  q21_isExperienced: '',
  q22_totalExperience: '',
  q23_coreExperience: '',
  q24_prevNetSalary: '',
  q25_prevGrossSalary: '',
  q26_expectedNetSalary: '',
  q27_expectedGrossSalary: '',
  q28_pfHigherPension: '',
  q29_pfDeductionAmount: '',
  q30_alternativeDepartment: '',
  q31_prevLocation: '',
  q32_prevShift: '',
  q33_reasonForLeaving: '',
  q34_noticePeriod: '',
  q35_prevDeptPosition: '',
  q36_prevDeptCount: '',
  q38_handleMistake: '',
  q39_handleOpinionDifference: '',
  q40_computerSelfRating: '',
  q41_hrMgrName: '',
  q42_hrMgrEmail: '',
  q43_hrMgrPhone: '',
  q43_hrMgrCountryId: '',
  q44_vertHeadName: '',
  q45_vertHeadEmail: '',
  q46_vertHeadPhone: '',
  q46_vertHeadCountryId: '',
  payslip: null
};

const REF_MODES = ['EMPLOYEE', 'LINKED IN', 'NEWS PAPER', 'POSTER', 'WEBSITE', 'WHATS APP', 'OTHERS'];
const TITLE_OPTIONS = ['Mr', 'Miss', 'Mrs', 'Mx'];
const GENDER_OPTIONS = ['MALE', 'FEMALE', 'TRANS GENDER'];
const MARITAL_STATUSES = ['UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED'];
const RELIGIONS = ['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKHISM', 'BUDDHISM'];
const EVALUATION_STATUSES = ['SHORTLISTED', 'SELECTED', 'HOLD', 'REJECTED'];
const CANDIDATE_STATUSES = ['PENDING', 'SHORTLISTED', 'HOLD', 'SELECTED', 'ONBOARDING', 'INDUCTION', 'ACTIVE', 'REJECTED', 'ARCHIVED'];
const BGV_STATUSES = ['PENDING', 'IN_PROGRESS', 'PARTIALLY_VERIFIED', 'VERIFIED', 'FAILED'];

const VALIDATION_RULES = [
  { field: 'enRolledNo', label: 'Enrolled NO', required: true },
  { field: 'firstName', label: 'Applicant Name', required: true },
  { field: 'lastName', label: 'Father Name', required: true },
  { field: 'department', label: 'Department', required: true },
  { field: 'positionLookFor', label: 'Position Look For', required: true },
  { field: 'mobileNo', label: 'Mobile No', required: true, type: 'phone' },
  { field: 'emailId', label: 'Email ID', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { field: 'aadharNo', label: 'Aadhar No', required: true, pattern: /^[0-9]{12}$/, patternMessage: 'Aadhar number must be 12 digits in the format XXXX-XXXX-XXXX' },
  { field: 'birthDate', label: 'Birth Date', required: true }
];

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 3 } }) => {
  const templateColumns = typeof columns === 'object' 
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 3}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5, width: '100%' }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn, width: '100%' }}>{children}</Box>;
};


const PROFILE_SUB_TABS = [
  { id: 'personal', index: 0, label: 'Personal', icon: <IconUser size={18} /> },
  { id: 'experience', index: 1, label: 'Experience', icon: <IconBriefcase size={18} /> },
  { id: 'education', index: 2, label: 'Education', icon: <IconSchool size={18} /> },
  { id: 'salary', index: 3, label: 'Salary Structure', icon: <IconCurrencyDollar size={18} /> },
  { id: 'evaluation', index: 4, label: 'Evaluation', icon: <IconFileText size={18} /> },
  { id: 'contact', index: 5, label: 'Contact', icon: <IconAddressBook size={18} /> },
  { id: 'kyc', index: 6, label: 'KYC', icon: <IconLock size={18} /> },
  { id: 'assessment', index: 7, label: 'Self Assessment', icon: <IconStar size={18} /> },
  { id: 'skill', index: 8, label: 'Skill', icon: <IconTrendingUp size={18} /> },
  { id: 'verification', index: 9, label: 'Verification Details', icon: <IconShieldCheck size={18} /> }
];

export default function ApplicantProfile() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const applicantId = searchParams.get('id');

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [personalData, setPersonalData] = useState(INITIAL_PERSONAL_STATE);
  const [evaluationData, setEvaluationData] = useState(INITIAL_EVALUATION_STATE);
  const [contactData, setContactData] = useState(INITIAL_CONTACT_STATE);
  const [assessmentData, setAssessmentData] = useState(INITIAL_ASSESSMENT_STATE);
  const [salaryData, setSalaryData] = useState(INITIAL_SALARY_STATE);
  const [experienceRows, setExperienceRows] = useState([]);
  const [educationRows, setEducationRows] = useState([]);
  const [kycRows, setKycRows] = useState([
    { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', files: [] },
    { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', files: [] },
    { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', files: [] },
    { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', files: [] }
  ]);
  const [skillsRows, setSkillsRows] = useState([]);
  const [countries, setCountries] = useState([]);
  const [basicLoading, setBasicLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [verificationReviews, setVerificationReviews] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Lookups mapping
  const { departments = [], designations = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS']);

  const availableTabs = useMemo(() => {
    const tabs = [
      { id: 'personal', index: 0, label: 'Personal', icon: <IconUser size={18} /> },
      { id: 'experience', index: 1, label: 'Experience', icon: <IconBriefcase size={18} /> },
      { id: 'education', index: 2, label: 'Education', icon: <IconSchool size={18} /> },
      { id: 'salary', index: 3, label: 'Salary Structure', icon: <IconCurrencyDollar size={18} /> },
      { id: 'evaluation', index: 4, label: 'Evaluation', icon: <IconFileText size={18} /> },
      { id: 'contact', index: 5, label: 'Contact', icon: <IconAddressBook size={18} /> },
      { id: 'kyc', index: 6, label: 'KYC', icon: <IconLock size={18} /> },
      { id: 'assessment', index: 7, label: 'Self Assessment', icon: <IconStar size={18} /> },
      { id: 'skill', index: 8, label: 'Skill', icon: <IconTrendingUp size={18} /> }
    ];

    const isExperiencedCandidate = assessmentData.q21_isExperienced === 'YES';
    const bgvSent = ['SENT', 'RESENT', 'TO BE VERIFIED', 'VERIFIED', 'REJECTED'].includes(String(formData.verification || '').toUpperCase());

    if (isExperiencedCandidate && bgvSent) {
      tabs.push({ id: 'verification', index: 9, label: 'Verification Details', icon: <IconShieldCheck size={18} /> });
    }

    return tabs;
  }, [assessmentData.q21_isExperienced, formData.verification]);

  const empLookupTypes = useMemo(() => {
    return formData.refMode === 'EMPLOYEE' ? ['EMPLOYEES'] : [];
  }, [formData.refMode]);
  const { employees = [] } = useLookups(empLookupTypes);

  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const handleClear = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setPersonalData(INITIAL_PERSONAL_STATE);
    setEvaluationData(INITIAL_EVALUATION_STATE);
    setContactData(INITIAL_CONTACT_STATE);
    setAssessmentData(INITIAL_ASSESSMENT_STATE);
    setSalaryData(INITIAL_SALARY_STATE);
    setExperienceRows([]);
    setEducationRows([]);
    setSkillsRows([]);
    setKycRows([
      { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', file: null },
      { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', file: null },
      { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', file: null },
      { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', file: null }
    ]);
    setErrors({});
  }, [setErrors]);

  const fetchApplicantDetails = useCallback(async () => {
    if (!applicantId) {
      // Create mode: fetch next enRolledNo
      setBasicLoading(true);
      setLoadedTabs({ basic: true });
      try {
        const { data } = await axios.get('/api/hra/applicants/next-code');
        setFormData(prev => ({
          ...prev,
          enRolledNo: data || '',
          applicantDate: getTodayDateString()
        }));
      } catch (e) {
        console.error('Failed to fetch next enrolled number', e);
        const respData = e.response?.data;
        const errMsg = typeof respData === 'string' ? respData : (respData?.message || 'Failed to fetch next enrolled number.');
        dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
        setFormData(prev => ({ ...prev, enRolledNo: '' }));
      } finally {
        setBasicLoading(false);
      }
      return;
    }

    setBasicLoading(true);
    setLoadedTabs({ basic: true });
    try {
      const { data: original } = await axios.get(`/api/hra/applicants/${applicantId}`);
      if (!original) return;
      setOriginalData(original);

      try {
        const { data: vData } = await axios.get(`/api/hra/applicants/verification/reviews/${applicantId}`);
        setVerificationReviews(vData || null);
      } catch (err) {
        console.warn("Failed to load verification reviews", err);
      }

      setFormData({
        id: original.id,
        enRolledNo: original.enRolledNo,
        applicantDate: original.applicantDate,
        positionLookFor: original.positionLookFor,
        title: original.title || 'Mr',
        firstName: original.firstName,
        lastName: original.lastName,
        department: original.department,
        mobileNo: original.mobileNo,
        emailId: original.emailId,
        aadharNo: original.aadharNo,
        birthDate: original.birthDate,
        age: original.age || '',
        duplicateAadhar: original.duplicateAadhar || false,
        refMode: original.refMode || '',
        refComments: original.refComments || '',
        call: original.callStatus || 'PENDING',
        interview: original.interviewStatus || 'PENDING',
        offer: original.offerStatus || 'PENDING',
        verification: original.verificationStatus || 'PENDING',
        status: original.status || 'APPLIED',
        isRehired: original.isRehired || 'NO',
        previousEmpCode: original.previousEmpCode || '',
        backgroundVerificationStatus: original.backgroundVerificationStatus || 'PENDING'
      });

      setPersonalData({
        enRollNo: original.enRolledNo || '0',
        gender: original.gender || '',
        maritalStatus: original.maritalStatus || '',
        birthDate: original.birthDate || '',
        panNo: original.panNo || '',
        officePhoneNo: original.officePhoneNo || '',
        phoneNo: original.phoneNo || '',
        mobileNo: original.mobileNo || '',
        emailId: original.emailId || '',
        religion: original.religion || '',
        nationality: original.nationality || 'INDIAN',
        permAdd1: original.permAdd1 || '',
        permAdd2: original.permAdd2 || '',
        city: original.city || '',
        state: original.state || '',
        sameAsPermanent: original.sameAsPermanent || false,
        persAdd1: original.persAdd1 || '',
        persAdd2: original.persAdd2 || ''
      });

      setSalaryData({
        basic: original.basic || '',
        da: original.da || '',
        hra: original.hra || '',
        splAllowance: original.splAllowance || '',
        perfIncentive: original.perfIncentive || '',
        statutoryBonus: original.statutoryBonus || '',
        canteenAllowance: original.canteenAllowance || '',
        attendanceAllow1: original.attendanceAllow1 || '',
        attendanceAllow2: original.attendanceAllow2 || '',
        uniform: original.uniform || '',
        shoes: original.shoes || '',
        mobileCug: original.mobileCug || '',
        otAmount: original.otAmount || '',
        petrolAllow: original.petrolAllow || '',
        appraisalPer: original.appraisalPer || '',
        otherAllow: original.otherAllow || '',
        pfEmployee: original.pfEmployee || '',
        pfEmployer: original.pfEmployer || '',
        esiEmployee: original.esiEmployee || '',
        esiEmployer: original.esiEmployer || '',
        canteenDeduct: original.canteenDeduct || '',
        profTax: original.profTax || '',
        labourWelFundEmp: original.labourWelFundEmp || '',
        labourWelFundEmployer: original.labourWelFundEmployer || '',
        otherDeduct: original.otherDeduct || '',
        suspenseDeduct: original.suspenseDeduct || ''
      });

      setEvaluationData({
        enRolledNo: original.enRolledNo || '0',
        interviewDate: original.interviewDate || getTodayDateString(),
        status: original.evaluationStatus || 'HOLD',
        comments: original.evaluationComments || '',
        technicalInterviewedBy: original.technicalInterviewedBy || '',
        hrInterviewedBy: original.hrInterviewedBy || ''
      });

      setContactData({
        enRolledNo: original.enRolledNo || '0',
        address1: original.contactAddress1 || '',
        address2: original.contactAddress2 || '',
        city: original.contactCity || '',
        phoneNo: original.contactPhone || '',
        mobileNo: original.contactMobile || original.mobileNo || ''
      });

      const assessmentDataCleaned = {
        q1_native: original.q1_native || '',
        q2_presentAddress: original.q2_present_address || '',
        q3_permanentAddress: original.q3_permanent_address || '',
        q4_fatherOccupation: original.q4_father_occupation || '',
        q5_motherOccupation: original.q5_mother_occupation || '',
        q6_maritalStatus: original.q6_marital_status || '',
        q7_spouseOccupation: original.q7_spouse_occupation || '',
        q8_children: original.q8_children || '',
        q9_hasRelativesInCompany: original.q9_has_relatives || '',
        q10_relativesDetails: original.q10_relatives_details || '',
        q11_siblingsOccupations: original.q11_siblings_occupations || '',
        q12_hasTwoWheeler: original.q12_has_two_wheeler || '',
        q13_hasAndroidPhone: original.q13_has_android_phone || '',
        q14_knowsCarDriving: original.q14_knows_car_driving || '',
        q15_willingToTravel: original.q15_willing_to_travel || '',
        q16_covidVaccination: original.q16_covid_vaccination || '',
        q47_hasInsurance: original.q47_has_insurance || original.q47_hasInsurance || '',
        q48_insuranceNumber: original.q48_insurance_number || original.q48_insuranceNumber || '',
        q17_positivePoints: original.q17_positive_points || '',
        q18_negativePoints: original.q18_negative_points || '',
        q19_lifeGoals: original.q19_life_goals || '',
        q20_willingRotationalShifts: original.q20_willing_rotational_shifts || original.q20_willingRotationalShifts || '',
        q20_improvementSuggestions: original.q20_improvement_suggestions || '',
        q21_isExperienced: original.q21_is_experienced || '',
        q22_totalExperience: original.q22_total_experience || '',
        q23_coreExperience: original.q23_core_experience || '',
        q24_prevNetSalary: original.q24_prev_net_salary || '',
        q25_prevGrossSalary: original.q25_prev_gross_salary || '',
        q26_expectedNetSalary: original.q26_expected_net_salary || '',
        q27_expectedGrossSalary: original.q27_expected_gross_salary || '',
        q28_pfHigherPension: original.q28_pf_higher_pension || 'NO',
        q29_pfDeductionAmount: original.q29_pf_deduction_amount || '',
        q30_alternativeDepartment: original.q30_alternative_department || '',
        q31_prevLocation: original.q31_prev_location || '',
        q32_prevShift: original.q32_prev_shift || '',
        q33_reasonForLeaving: original.q33_reason_for_leaving || '',
        q34_noticePeriod: original.q34_notice_period || '',
        q35_prevDeptPosition: original.q35_prev_dept_position || '',
        q36_prevDeptCount: original.q36_prev_dept_count || '',
        q38_handleMistake: original.q38_handle_mistake || '',
        q39_handleOpinionDifference: original.q39_handle_opinion_difference || '',
        q40_computerSelfRating: original.q40_computer_self_rating || '',
        q41_hrMgrName: original.q41_hr_mgr_name || original.q41_rep_mgr_name || '',
        q42_hrMgrEmail: original.q42_hr_mgr_email || original.q42_rep_mgr_email || '',
        q43_hrMgrPhone: original.q43_hr_mgr_phone || original.q43_rep_mgr_phone || '',
        q43_hrMgrCountryId: original.q43_hr_mgr_country_id || original.q43_rep_mgr_country_id || '',
        q44_vertHeadName: original.q44_vert_head_name || '',
        q45_vertHeadEmail: original.q45_vert_head_email || '',
        q46_vertHeadPhone: original.q46_vert_head_phone || '',
        q46_vertHeadCountryId: original.q46_vert_head_country_id || '',
        payslip: original.payslipPath ? { fileName: original.payslipPath.split('/').pop(), serverFileName: original.payslipPath, isServer: true } : null
      };

      const textFieldsToClean = [
        'q8_children', 'q22_totalExperience', 'q23_coreExperience', 'q24_prevNetSalary', 'q25_prevGrossSalary',
        'q26_expectedNetSalary', 'q27_expectedGrossSalary', 'q29_pfDeductionAmount', 'q34_noticePeriod', 'q36_prevDeptCount'
      ];
      textFieldsToClean.forEach(key => {
        const val = assessmentDataCleaned[key];
        if (val === 0 || val === 0.0 || val === '0' || val === '0.0' || val === '0.00') {
          assessmentDataCleaned[key] = '';
        }
      });
      setAssessmentData(assessmentDataCleaned);

      setExperienceRows((original.experience || []).map(exp => ({
        id: exp.id,
        slNo: exp.slNo,
        companyName: exp.companyName || '',
        location: exp.location || '',
        fromDate: exp.fromDate || '',
        toDate: exp.toDate || '',
        expYears: exp.expYears || '',
        file: exp.filePath ? { fileName: exp.fileName || exp.filePath.split('/').pop(), serverFileName: exp.filePath, isServer: true } : null
      })));

      setEducationRows((original.education || []).map(edu => ({
        id: edu.id,
        slNo: edu.slNo,
        education: edu.education || '',
        institutionName: edu.institutionName || '',
        type: edu.type || 'FULL TIME',
        yearOfPassing: edu.yearOfPassing || '',
        grade: edu.grade || '',
        file: edu.filePath ? { fileName: edu.fileName || edu.filePath.split('/').pop(), serverFileName: edu.filePath, isServer: true } : null
      })));

      setKycRows((original.kyc || [
        { slNo: 1, seqNo: 'KYC-01', docName: 'AADHAR CARD', docNo: '', files: [] },
        { slNo: 2, seqNo: 'KYC-02', docName: 'PAN CARD', docNo: '', files: [] },
        { slNo: 3, seqNo: 'KYC-03', docName: 'VOTER ID', docNo: '', files: [] },
        { slNo: 4, seqNo: 'KYC-04', docName: 'PASSPORT', docNo: '', files: [] }
      ]).map(k => {
        const paths = k.filePath ? k.filePath.split(',') : [];
        const names = k.fileName ? k.fileName.split(',') : [];
        const parsedFiles = paths.map((path, idx) => {
          const trimmedPath = path.trim();
          const originalName = names[idx] ? names[idx].trim() : trimmedPath.split('/').pop().split('\\').pop();
          return {
            fileName: originalName,
            serverFileName: trimmedPath,
            isServer: true
          };
        }).filter(f => f.serverFileName);
        return {
          id: k.id,
          slNo: k.slNo,
          seqNo: k.seqNo,
          docName: k.docName,
          docNo: k.docNo || '',
          files: parsedFiles
        };
      }));

      setSkillsRows((original.skills || []).map(s => ({
        id: s.id,
        slNo: s.slNo,
        activityDetails: s.activityDetails || '',
        file: s.filePath ? { fileName: s.fileName || s.filePath.split('/').pop(), serverFileName: s.filePath, isServer: true } : null
      })));

    } catch {
      dispatch(openSnackbar({ open: true, message: 'Failed to fetch candidate details.', variant: 'alert', severity: 'error' }));
    } finally {
      setBasicLoading(false);
    }
  }, [applicantId, dispatch]);

  // Lazy load countries only on first access to Self Assessment tab (Tab index 7)
  useEffect(() => {
    if (activeTab === 7 && countries.length === 0) {
      axios.get('/api/admin/countries')
        .then(res => {
          const activeCountries = (res.data || []).filter(c => c.isActive !== false);
          setCountries(activeCountries);
        })
        .catch(err => console.error('Failed to load countries in ApplicantProfile', err));
    }
  }, [activeTab, countries.length]);

  useEffect(() => {
    fetchApplicantDetails();
  }, [fetchApplicantDetails]);

  useKeyboardShortcuts({
    'ctrl+s': () => handleSave(),
    'escape': () => navigate('/master/hr/ats')
  });

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    setFormData(prev => {
      const updated = { ...prev, [name]: finalVal };
      if (name === 'birthDate') {
        updated.age = calculateAge(finalVal);
      }
      if (name === 'refMode') {
        updated.refComments = '';
      }
      if (name === 'title') {
        const titleUpper = (finalVal || '').toString().trim().replace(/\.$/, '').toUpperCase();
        if (titleUpper === 'MR') {
          updated.gender = 'MALE';
        } else if (titleUpper === 'MISS' || titleUpper === 'MRS' || titleUpper === 'MS') {
          updated.gender = 'FEMALE';
        } else if (titleUpper === 'MX') {
          updated.gender = 'TRANS';
        }
      }
      return updated;
    });

    if (name === 'birthDate') {
      const computedAge = calculateAge(finalVal);
      const ageNum = Number(computedAge);
      if (!finalVal) {
        setErrors(prev => ({
          ...prev,
          birthDate: 'Birth Date is required',
          age: 'Age is required'
        }));
      } else if (computedAge === '' || isNaN(ageNum) || ageNum < 18 || ageNum > 56) {
        setErrors(prev => ({
          ...prev,
          birthDate: 'Age must be between 18 and 56 years.',
          age: 'Age must be between 18 and 56 years.'
        }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.birthDate;
          delete next.age;
          return next;
        });
      }
    } else {
      setErrors(prev => {
        if (!prev || !prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === 'duplicateAadhar' && checked) {
      clearErrors('aadharNo');
    }

    if (name === 'refMode') {
      setErrors(prev => {
        if (!prev || !prev.refComments) return prev;
        const next = { ...prev };
        delete next.refComments;
        return next;
      });
    }
  };

  const handlePersonalChange = (e) => {
    const { name, value, checked, type } = e.target;
    const finalVal = type === 'checkbox' ? checked : value;
    setPersonalData(prev => {
      const updated = { ...prev, [name]: finalVal };
      if (name === 'sameAsPermanent') {
        if (finalVal) {
          updated.persAdd1 = prev.permAdd1;
          updated.persAdd2 = prev.permAdd2;
        } else {
          updated.persAdd1 = '';
          updated.persAdd2 = '';
        }
      }
      return updated;
    });
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setSalaryData(prev => ({ ...prev, [name]: value }));
  };

  const computedGross = useMemo(() => {
    const sum =
      Number(salaryData.basic || 0) +
      Number(salaryData.da || 0) +
      Number(salaryData.hra || 0) +
      Number(salaryData.splAllowance || 0) +
      Number(salaryData.perfIncentive || 0) +
      Number(salaryData.statutoryBonus || 0) +
      Number(salaryData.canteenAllowance || 0) +
      Number(salaryData.attendanceAllow1 || 0) +
      Number(salaryData.attendanceAllow2 || 0) +
      Number(salaryData.uniform || 0) +
      Number(salaryData.shoes || 0) +
      Number(salaryData.mobileCug || 0) +
      Number(salaryData.otAmount || 0) +
      Number(salaryData.petrolAllow || 0) +
      Number(salaryData.otherAllow || 0);
    return parseFloat(sum.toFixed(2));
  }, [salaryData]);

  const computedNet = useMemo(() => {
    const deduct =
      Number(salaryData.pfEmployee || 0) +
      Number(salaryData.esiEmployee || 0) +
      Number(salaryData.canteenDeduct || 0) +
      Number(salaryData.profTax || 0) +
      Number(salaryData.labourWelFundEmp || 0) +
      Number(salaryData.otherDeduct || 0) +
      Number(salaryData.suspenseDeduct || 0);
    return parseFloat((computedGross - deduct).toFixed(2));
  }, [computedGross, salaryData]);

  const computedCTC = useMemo(() => {
    const employerCost =
      Number(salaryData.pfEmployer || 0) +
      Number(salaryData.esiEmployer || 0) +
      Number(salaryData.labourWelFundEmployer || 0);
    return parseFloat((computedGross + employerCost).toFixed(2));
  }, [computedGross, salaryData]);

  const handleAddExperienceRow = () => {
    setExperienceRows(prev => [
      ...prev,
      { slNo: prev.length + 1, companyName: '', location: '', fromDate: '', toDate: '', expYears: '', file: null }
    ]);
  };

  const handleExperienceRowChange = (index, field, value) => {
    setExperienceRows(prev =>
      prev.map((row, i) => {
        if (i === index) {
          const updatedRow = { ...row, [field]: value };
          if (field === 'fromDate' || field === 'toDate') {
            const fromDateVal = field === 'fromDate' ? value : row.fromDate;
            const toDateVal = field === 'toDate' ? value : row.toDate;
            if (fromDateVal && toDateVal) {
              const from = new Date(fromDateVal);
              const to = new Date(toDateVal);
              if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
                const diffTime = to - from;
                if (diffTime > 0) {
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  updatedRow.expYears = Math.round(diffDays / 365.25);
                } else {
                  updatedRow.expYears = 0;
                }
              }
            } else {
              updatedRow.expYears = '';
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleAddEducationRow = () => {
    setEducationRows(prev => [
      ...prev,
      { slNo: prev.length + 1, education: '', institutionName: '', type: 'FULL TIME', yearOfPassing: '', grade: '', file: null }
    ]);
  };

  const handleEducationRowChange = (index, field, value) => {
    setEducationRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleAddSkillRow = () => {
    setSkillsRows(prev => [
      ...prev,
      { slNo: prev.length + 1, activityDetails: '', file: null }
    ]);
  };

  const handleSkillRowChange = (index, field, value) => {
    setSkillsRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const isApplicantSaveDisabled = useMemo(() => {
    if (loading) return true;

    const hasRequiredBase =
      !!formData.enRolledNo?.toString().trim() &&
      !!formData.firstName?.toString().trim() &&
      !!formData.lastName?.toString().trim() &&
      !!formData.department?.toString().trim() &&
      !!formData.designationId?.toString().trim() &&
      !!formData.mobileNo?.toString().trim() &&
      !!formData.emailId?.toString().trim() &&
      !!formData.aadharNo?.toString().trim() &&
      !!formData.birthDate?.toString().trim();

    if (!hasRequiredBase) return true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((formData.emailId || '').trim())) return true;

    const cleanAadhar = (formData.aadharNo || '').replace(/\D/g, '');
    if (cleanAadhar.length !== 12) return true;

    const ageNum = Number(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 56) return true;

    if (formData.refMode) {
      if (!formData.refComments?.toString().trim()) return true;
    }

    if (formData.isRehired === 'YES') {
      if (!formData.previousEmpCode?.toString().trim()) return true;
    }

    if (errors && Object.keys(errors).some(key => !!errors[key])) return true;

    return false;
  }, [formData, errors, loading]);

  const handleSave = async () => {
    const dynamicRules = [...VALIDATION_RULES];
    if (formData.refMode) {
      dynamicRules.push({ field: 'refComments', label: formData.refMode === 'EMPLOYEE' ? 'Emp Name' : 'Ref Comments', required: true });
    }
    if (formData.isRehired === 'YES') {
      dynamicRules.push({ field: 'previousEmpCode', label: 'Previous Employee Code', required: true });
    }
    let isFormValid = validate(formData, dynamicRules);

    const age = Number(formData.age);
    if (!formData.birthDate || isNaN(age) || age < 18 || age > 56) {
      const msg = !formData.birthDate ? 'Birth Date is required' : 'Age must be between 18 and 56 years.';
      setErrors(prev => ({
        ...prev,
        birthDate: msg,
        age: msg
      }));
      isFormValid = false;
    }

    if (assessmentData.q43_hrMgrPhone && !assessmentData.q43_hrMgrCountryId) {
      dispatch(openSnackbar({ open: true, message: 'HR Manager Country is required if phone is provided.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (assessmentData.q46_vertHeadPhone && !assessmentData.q46_vertHeadCountryId) {
      dispatch(openSnackbar({ open: true, message: 'Vertical Head Country is required if phone is provided.', variant: 'alert', severity: 'error' }));
      return;
    }

    for (const row of kycRows) {
      if (row.files && row.files.length > 5) {
        dispatch(openSnackbar({ open: true, message: `${row.docName} cannot have more than 5 uploaded files.`, variant: 'alert', severity: 'error' }));
        return;
      }
    }

    if (!isFormValid) {
      dispatch(openSnackbar({ open: true, message: 'Please fill in all required fields and correct validation errors.', variant: 'alert', severity: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: formData.id,
        enRolledNo: formData.enRolledNo,
        applicantDate: formData.applicantDate,
        positionLookFor: formData.positionLookFor,
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        mobileNo: formData.mobileNo,
        emailId: formData.emailId,
        aadharNo: formData.aadharNo,
        birthDate: formData.birthDate,
        age: formData.age ? parseInt(formData.age) : null,
        duplicateAadhar: formData.duplicateAadhar,
        refMode: formData.refMode,
        refComments: formData.refComments,
        isRehired: formData.isRehired || 'NO',
        previousEmpCode: formData.previousEmpCode || '',
        backgroundVerificationStatus: formData.backgroundVerificationStatus || 'PENDING',

        gender: personalData.gender,
        maritalStatus: personalData.maritalStatus,
        panNo: personalData.panNo,
        officePhoneNo: personalData.officePhoneNo,
        phoneNo: personalData.phoneNo,
        religion: personalData.religion,
        nationality: personalData.nationality,
        permAdd1: personalData.permAdd1,
        permAdd2: personalData.permAdd2,
        city: personalData.city,
        state: personalData.state,
        sameAsPermanent: personalData.sameAsPermanent,
        persAdd1: personalData.persAdd1,
        persAdd2: personalData.persAdd2,

        basic: Number(salaryData.basic || 0),
        da: Number(salaryData.da || 0),
        hra: Number(salaryData.hra || 0),
        splAllowance: Number(salaryData.splAllowance || 0),
        perfIncentive: Number(salaryData.perfIncentive || 0),
        statutoryBonus: Number(salaryData.statutoryBonus || 0),
        canteenAllowance: Number(salaryData.canteenAllowance || 0),
        attendanceAllow1: Number(salaryData.attendanceAllow1 || 0),
        attendanceAllow2: Number(salaryData.attendanceAllow2 || 0),
        uniform: Number(salaryData.uniform || 0),
        shoes: Number(salaryData.shoes || 0),
        mobileCug: Number(salaryData.mobileCug || 0),
        otAmount: Number(salaryData.otAmount || 0),
        petrolAllow: Number(salaryData.petrolAllow || 0),
        appraisalPer: Number(salaryData.appraisalPer || 0),
        otherAllow: Number(salaryData.otherAllow || 0),
        pfEmployee: Number(salaryData.pfEmployee || 0),
        pfEmployer: Number(salaryData.pfEmployer || 0),
        esiEmployee: Number(salaryData.esiEmployee || 0),
        esiEmployer: Number(salaryData.esiEmployer || 0),
        canteenDeduct: Number(salaryData.canteenDeduct || 0),
        profTax: Number(salaryData.profTax || 0),
        labourWelFundEmp: Number(salaryData.pfEmployee ? 20 : 0), // Defaulting or keeping values
        labourWelFundEmployer: Number(salaryData.pfEmployer ? 40 : 0),
        otherDeduct: Number(salaryData.otherDeduct || 0),
        suspenseDeduct: Number(salaryData.suspenseDeduct || 0),
        grossSalary: computedGross,
        netSalary: computedNet,
        ctc: computedCTC,

        interviewDate: evaluationData.interviewDate,
        evaluationStatus: evaluationData.status || 'HOLD',
        evaluationComments: evaluationData.comments,
        technicalInterviewedBy: evaluationData.technicalInterviewedBy,
        hrInterviewedBy: evaluationData.hrInterviewedBy,

        contactAddress1: personalData.permAdd1,
        contactAddress2: personalData.permAdd2,
        contactCity: personalData.city,
        contactPhone: personalData.phoneNo,
        contactMobile: formData.mobileNo,

        q1_native: assessmentData.q1_native,
        q2_present_address: assessmentData.q2_presentAddress,
        q3_permanent_address: assessmentData.q3_permanentAddress,
        q4_father_occupation: assessmentData.q4_fatherOccupation,
        q5_mother_occupation: assessmentData.q5_motherOccupation,
        q6_marital_status: assessmentData.q6_maritalStatus,
        q7_spouse_occupation: assessmentData.q7_spouseOccupation,
        q8_children: assessmentData.q8_children,
        q9_has_relatives: assessmentData.q9_hasRelativesInCompany,
        q10_relatives_details: assessmentData.q10_relativesDetails,
        q11_siblings_occupations: assessmentData.q11_siblingsOccupations,
        q12_has_two_wheeler: assessmentData.q12_hasTwoWheeler,
        q13_has_android_phone: assessmentData.q13_hasAndroidPhone,
        q14_knows_car_driving: assessmentData.q14_knowsCarDriving,
        q15_willing_to_travel: assessmentData.q15_willingToTravel,
        q16_covid_vaccination: assessmentData.q16_covidVaccination,
        q47_has_insurance: assessmentData.q47_hasInsurance,
        q48_insurance_number: assessmentData.q48_insuranceNumber,
        q17_positive_points: assessmentData.q17_positivePoints,
        q18_negative_points: assessmentData.q18_negativePoints,
        q19_life_goals: assessmentData.q19_lifeGoals,
        q20_willing_rotational_shifts: assessmentData.q20_willingRotationalShifts,
        q20_improvement_suggestions: assessmentData.q20_improvementSuggestions,
        q21_is_experienced: assessmentData.q21_isExperienced,
        q22_total_experience: assessmentData.q22_totalExperience,
        q23_core_experience: assessmentData.q23_coreExperience,
        q24_prev_net_salary: assessmentData.q24_prevNetSalary,
        q25_prev_gross_salary: assessmentData.q25_prevGrossSalary,
        q26_expected_net_salary: assessmentData.q26_expectedNetSalary,
        q27_expected_gross_salary: assessmentData.q27_expectedGrossSalary,
        q28_pf_higher_pension: assessmentData.q28_pfHigherPension,
        q29_pf_deduction_amount: assessmentData.q29_pfDeductionAmount,
        q30_alternative_department: assessmentData.q30_alternativeDepartment,
        q31_prev_location: assessmentData.q31_prevLocation,
        q32_prev_shift: assessmentData.q32_prevShift,
        q33_reason_for_leaving: assessmentData.q33_reasonForLeaving,
        q34_notice_period: assessmentData.q34_noticePeriod,
        q35_prev_dept_position: assessmentData.q35_prevDeptPosition,
        q36_prev_dept_count: assessmentData.q36_prevDeptCount,
        q38_handle_mistake: assessmentData.q38_handleMistake,
        q39_handle_opinion_difference: assessmentData.q39_handleOpinionDifference,
        q40_computer_self_rating: assessmentData.q40_computerSelfRating,
        q41_hr_mgr_name: assessmentData.q41_hrMgrName,
        q42_hr_mgr_email: assessmentData.q42_hrMgrEmail,
        q43_hr_mgr_phone: assessmentData.q43_hrMgrPhone,
        q43_hr_mgr_country_id: assessmentData.q43_hrMgrCountryId || null,
        q44_vert_head_name: assessmentData.q44_vertHeadName,
        q45_vert_head_email: assessmentData.q45_vertHeadEmail,
        q46_vert_head_phone: assessmentData.q46_vertHeadPhone,
        q46_vert_head_country_id: assessmentData.q46_vertHeadCountryId || null,
        payslipPath: assessmentData.payslip ? assessmentData.payslip.serverFileName : null,

        experience: experienceRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          companyName: row.companyName,
          location: row.location,
          fromDate: row.fromDate || null,
          toDate: row.toDate || null,
          expYears: row.expYears,
          filePath: row.file ? row.file.serverFileName : null
        })),
        education: educationRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          education: row.education,
          institutionName: row.institutionName,
          type: row.type || 'FULL TIME',
          yearOfPassing: row.yearOfPassing,
          grade: row.grade,
          filePath: row.file ? row.file.serverFileName : null
        })),
        kyc: kycRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          seqNo: row.seqNo,
          docName: row.docName,
          docNo: row.docNo,
          filePath: row.files && row.files.length > 0 ? row.files.map(f => f.serverFileName || f.path || f.filePath).filter(p => p).join(',') : null
        })),
        skills: skillsRows.map((row, idx) => ({
          id: row.id || null,
          slNo: idx + 1,
          activityDetails: row.activityDetails,
          filePath: row.file ? row.file.serverFileName : null
        }))
      };

      if (formData.id) {
        await axios.put(`/api/hra/applicants/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Applicant updated successfully.', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post('/api/hra/applicants', payload);
        dispatch(openSnackbar({ open: true, message: 'Applicant registered successfully.', variant: 'alert', severity: 'success' }));
      }
      navigate('/master/hr/ats');
    } catch (e) {
      const respData = e.response?.data;
      const errMsg = typeof respData === 'string'
        ? respData
        : (respData?.message || respData?.error || 'Failed to save applicant. Please check required fields and duplicate values.');
      
      const lowerMsg = errMsg.toLowerCase();
      if (lowerMsg.includes('aadhar') || lowerMsg.includes('aadhaar') || lowerMsg.includes('adhar')) {
        setErrors(prev => ({ ...prev, aadharNo: errMsg }));
      } else if (lowerMsg.includes('mobile') || lowerMsg.includes('phone')) {
        setErrors(prev => ({ ...prev, mobileNo: errMsg }));
      } else if (lowerMsg.includes('email')) {
        setErrors(prev => ({ ...prev, emailId: errMsg }));
      } else if (lowerMsg.includes('enrolled') || lowerMsg.includes('enrol')) {
        setErrors(prev => ({ ...prev, enRolledNo: errMsg }));
      } else if (lowerMsg.includes('birth') || lowerMsg.includes('age')) {
        setErrors(prev => ({ ...prev, birthDate: errMsg, age: errMsg }));
      } else {
        dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard
      icon={IconUser}
      title={
        <Stack direction="row" spacing={2} alignItems="center">
          <BOSPfpAvatar
            photoPath={originalData?.employeePhotoUpload || originalData?.employeePhoto || formData?.employeePhotoUpload || formData?.employeePhoto}
            name={`${formData.firstName || ''} ${formData.lastName || ''}`}
            size={42}
            previewSize={150}
          />
          <Typography variant="h3">{applicantId ? `Edit Applicant Profile - ${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'New Applicant Registration'}</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Back to List">
            <Button variant="contained" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/master/hr/ats')} sx={{ ...btnCancel, px: 2.2, py: 0.75 }}>
              Back
            </Button>
          </Tooltip>
          <Tooltip title="Clear Form">
            <Button variant="contained" startIcon={<IconEraser size={18} onClick={handleClear} />} sx={{ ...btnClear, px: 2.2, py: 0.75 }}>
              Clear
            </Button>
          </Tooltip>
          <Tooltip title={shortcutTooltip('Save Candidate', 'Ctrl + S')}>
            <span>
              <Button variant="contained" startIcon={<IconDeviceFloppy size={18} />} onClick={handleSave} disabled={isApplicantSaveDisabled} sx={{ ...btnSave, px: 2.2, py: 0.75 }}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      }
    >
      <Stack spacing={3} sx={{ width: '100%' }}>
        {/* ── TOP SECTION: Main Registry Form ── */}
        {/* ── TOP SECTION: Main Registry Form in 3 QMS Cards ── */}
        <Stack spacing={2.5} sx={{ width: '100%', mb: 1 }}>
          {/* CARD 1: Applicant Information */}
          <BOSFormSection icon={<IconUser size={20} />} title="Applicant Information" defaultOpen={true}>
            <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
              <R>
                <BOSTextField
                  required
                  label="Enrolled NO"
                  name="enRolledNo"
                  value={formData.enRolledNo}
                  disabled={true}
                  placeholder="ATS-XXXX-XXX"
                  error={!!errors.enRolledNo}
                  helperText={errors.enRolledNo}
                  sx={errorStyle(!!errors.enRolledNo)}
                />
              </R>
              <R>
                <BOSDatePicker
                  label="Applicant Date"
                  name="applicantDate"
                  value={formData.applicantDate}
                  onChange={handleInputChange}
                  disableFuture
                />
              </R>
              <R>
                <BOSTextField
                  select
                  required
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  error={!!errors.department}
                  helperText={errors.department}
                  sx={errorStyle(!!errors.department)}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) return "";
                      const matched = departments.find(d => String(d.id) === String(selected));
                      return matched ? matched.departmentName : selected;
                    }
                  }}
                  InputProps={{
                    endAdornment: formData.department ? (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange({ target: { name: 'department', value: '' } });
                          }}
                          sx={{ color: 'text.secondary', p: 0.25 }}
                        >
                          <IconX size={16} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                >
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.id.toString()}>{d.departmentName}</MenuItem>
                  ))}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField
                  select
                  required
                  label="Designation"
                  name="designationId"
                  value={formData.designationId ? formData.designationId.toString() : ''}
                  onChange={handleInputChange}
                  error={!!errors.designationId}
                  helperText={errors.designationId}
                  sx={errorStyle(!!errors.designationId)}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) return "";
                      const matched = designations.find(d => String(d.id) === String(selected));
                      return matched ? matched.designationName : selected;
                    }
                  }}
                  InputProps={{
                    endAdornment: formData.designationId ? (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange({ target: { name: 'designationId', value: '' } });
                          }}
                          sx={{ color: 'text.secondary', p: 0.25 }}
                        >
                          <IconX size={16} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                >
                  {Array.from(new Map(designations.map(d => [d.id.toString(), d])).values()).map(d => (
                    <MenuItem key={d.id} value={d.id.toString()}>{d.designationName}</MenuItem>
                  ))}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField
                  select
                  label="Ref Mode"
                  name="refMode"
                  value={formData.refMode}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: formData.refMode ? (
                      <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputChange({ target: { name: 'refMode', value: '' } });
                          }}
                          sx={{ color: 'text.secondary', p: 0.25 }}
                        >
                          <IconX size={16} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                >
                  {REF_MODES.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </BOSTextField>
              </R>

              {formData.refMode === 'EMPLOYEE' && (
                <R lg={8}>
                  <BOSEmployeeAutocomplete
                    required
                    label="Emp Name"
                    options={employees}
                    value={formData.refComments}
                    onChange={(val) => {
                      let actualStr = '';
                      if (typeof val === 'object' && val !== null) {
                        const code = val.oldEmpCode || val.empCode || val.employeeCode || '';
                        const name = val.employeeName || val.firstName || '';
                        actualStr = code ? `${code} - ${name}` : name;
                      } else {
                        actualStr = val || '';
                      }
                      setFormData(prev => ({ ...prev, refComments: actualStr }));
                      setErrors(prev => {
                        if (!prev || !prev.refComments) return prev;
                        const next = { ...prev };
                        delete next.refComments;
                        return next;
                      });
                    }}
                    error={!!errors.refComments}
                    helperText={errors.refComments}
                    sx={errorStyle(!!errors.refComments)}
                  />
                </R>
              )}

              {formData.refMode && formData.refMode !== 'EMPLOYEE' && (
                <R>
                  <BOSTextField
                    required={true}
                    label="Ref Comments"
                    name="refComments"
                    value={formData.refComments}
                    onChange={handleInputChange}
                    error={!!errors.refComments}
                    helperText={errors.refComments}
                    sx={errorStyle(!!errors.refComments)}
                    disabled={!formData.refMode}
                    InputLabelProps={{ shrink: true }}
                  />
                </R>
              )}
            </GridContainer>
          </BOSFormSection>

          {/* CARD 2: Personal Information */}
          <BOSFormSection icon={<IconUserCheck size={20} />} title="Personal Information" defaultOpen={true}>
            <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
              <R>
                <BOSTextField
                  select
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                >
                  {TITLE_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </BOSTextField>
              </R>
              <R>
                <BOSTextField
                  required
                  label="Applicant Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={errorStyle(!!errors.firstName)}
                />
              </R>
              <R>
                <BOSTextField
                  required
                  label="Father Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  sx={errorStyle(!!errors.lastName)}
                />
              </R>
              <R>
                <BOSDatePicker
                  required
                  label="Birth Date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  disableFuture
                  error={!!errors.birthDate}
                  helperText={errors.birthDate}
                  sx={errorStyle(!!errors.birthDate)}
                />
              </R>
              <R>
                <BOSTextField
                  label="Age"
                  name="age"
                  value={formData.age}
                  disabled
                  error={!!errors.age}
                  helperText={errors.age}
                  sx={errorStyle(!!errors.age)}
                  InputProps={{ readOnly: true }}
                />
              </R>
            </GridContainer>
          </BOSFormSection>

          {/* CARD 3: Contact Information */}
          <BOSFormSection icon={<IconAddressBook size={20} />} title="Contact Information" defaultOpen={true}>
            <GridContainer columns={{ xs: 1, sm: 2, md: 3 }}>
              <R>
                <BOSTextField
                  required
                  label="Mobile No"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  error={!!errors.mobileNo}
                  helperText={errors.mobileNo}
                  sx={errorStyle(!!errors.mobileNo)}
                />
              </R>
              <R>
                <BOSTextField
                  required
                  label="Email ID"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  placeholder="example@mail.com"
                  error={!!errors.emailId}
                  helperText={errors.emailId}
                  sx={errorStyle(!!errors.emailId)}
                />
              </R>
              <R>
                <Box sx={{ width: '100%' }}>
                  <AadharInput
                    required
                    label="Aadhar No"
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    error={!!errors.aadharNo}
                    helperText={errors.aadharNo}
                  />
                  <Box sx={{ mt: 0.5, px: 0 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!formData.duplicateAadhar}
                          onChange={handleInputChange}
                          name="duplicateAadhar"
                          size="small"
                          sx={{ p: 0.5, mr: 0.5, color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
                        />
                      }
                      label="I know it's duplicate Aadhaar No"
                      sx={{
                        m: 0,
                        color: formData.duplicateAadhar ? 'primary.main' : 'text.secondary',
                        '& .MuiFormControlLabel-label': { fontSize: '0.75rem', fontWeight: 600 }
                      }}
                    />
                  </Box>
                </Box>
              </R>
            </GridContainer>
          </BOSFormSection>
        </Stack>
        
        {/* ── SECTION HEADER TABS (QMS DESIGN SYSTEM) ── */}
        {applicantId && (
          <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: isDark ? 'dark.800' : 'grey.50',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              p: 0.75,
              mb: 2.5
            }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Tabs
                value={activeTab}
                onChange={(e, newTab) => setActiveTab(newTab)}
                variant="scrollable"
                scrollButtons={false}
                sx={{
                  minHeight: 40,
                  '& .MuiTabs-flexContainer': { gap: 1 },
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTabScrollButton-root': { display: 'none !important' }
                }}
              >
                {availableTabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    value={tab.index}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{
                      minHeight: 38,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      px: 2.5,
                      py: 0.75,
                      color: 'text.secondary',
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        color: '#ffffff',
                        bgcolor: 'primary.main',
                        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                      },
                      '&:hover:not(.Mui-selected)': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(33, 150, 243, 0.08)',
                        color: 'primary.main'
                      }
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          </Box>

          <Box sx={{ minHeight: '300px', p: 1, width: '100%' }}>
            {/* 1. PERSONAL DETAILS */}
            {activeTab === 0 && (
              basicLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <GridContainer>
                <R>
                  <BOSTextField
                    label="Enrolled NO"
                    name="enRollNo"
                    value={formData.enRolledNo}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R>
                  <BOSTextField
                    select
                    label="Gender"
                    name="gender"
                    value={personalData.gender}
                    onChange={handlePersonalChange}
                    required
                    InputProps={{
                      endAdornment: personalData.gender ? (
                        <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePersonalChange({ target: { name: 'gender', value: '' } });
                            }}
                            sx={{ color: 'text.secondary', p: 0.25 }}
                          >
                            <IconX size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  >
                    {GENDER_OPTIONS.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </BOSTextField>
                </R>
                <R>
                  <BOSTextField
                    select
                    label="Marital Status"
                    name="maritalStatus"
                    value={personalData.maritalStatus}
                    onChange={handlePersonalChange}
                    InputProps={{
                      endAdornment: personalData.maritalStatus ? (
                        <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePersonalChange({ target: { name: 'maritalStatus', value: '' } });
                            }}
                            sx={{ color: 'text.secondary', p: 0.25 }}
                          >
                            <IconX size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  >
                    {MARITAL_STATUSES.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </BOSTextField>
                </R>
                <R>
                  <BOSDatePicker
                    label="Birth Date"
                    name="birthDate"
                    value={formData.birthDate}
                    disabled
                    onChange={() => {}}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="PAN No"
                    name="panNo"
                    value={personalData.panNo}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    select
                    label="Religion"
                    name="religion"
                    value={personalData.religion}
                    onChange={handlePersonalChange}
                    InputProps={{
                      endAdornment: personalData.religion ? (
                        <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePersonalChange({ target: { name: 'religion', value: '' } });
                            }}
                            sx={{ color: 'text.secondary', p: 0.25 }}
                          >
                            <IconX size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  >
                    {RELIGIONS.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </BOSTextField>
                </R>
                <R>
                  <BOSTextField
                    label="Nationality"
                    name="nationality"
                    value={personalData.nationality}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Office Phone No"
                    name="officePhoneNo"
                    value={personalData.officePhoneNo}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Phone No"
                    name="phoneNo"
                    value={personalData.phoneNo}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Mobile No"
                    name="mobileNo"
                    value={personalData.mobileNo || formData.mobileNo}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Email Id"
                    name="emailId"
                    value={personalData.emailId || formData.emailId}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R lg={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ mb: 1, fontWeight: 600 }}>PERMANENT ADDRESS</Typography>
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Address line 1"
                    name="permAdd1"
                    value={personalData.permAdd1}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Address line 2"
                    name="permAdd2"
                    value={personalData.permAdd2}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="City"
                    name="city"
                    value={personalData.city}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="State"
                    name="state"
                    value={personalData.state}
                    onChange={handlePersonalChange}
                  />
                </R>
                <R lg={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={personalData.sameAsPermanent}
                        onChange={handlePersonalChange}
                        name="sameAsPermanent"
                      />
                    }
                    label="Personal Address as above"
                    sx={{ fontWeight: 'bold' }}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Personal Add1"
                    name="persAdd1"
                    value={personalData.persAdd1}
                    onChange={handlePersonalChange}
                    disabled={personalData.sameAsPermanent}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Personal Add2"
                    name="persAdd2"
                    value={personalData.persAdd2}
                    onChange={handlePersonalChange}
                    disabled={personalData.sameAsPermanent}
                  />
                </R>
              </GridContainer>
              )
            )}

            {/* 2. EXPERIENCE DETAILS */}
            {activeTab === 1 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', mb: 2, overflowX: 'auto', width: '100%' }}>
                  <Table size="small" sx={{ minWidth: 1200 }}>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '5%' }}>Sl.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 250, width: '30%' }}>Company Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 200, width: '20%' }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '12%' }}>From Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '12%' }}>To Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Experience (Years)</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '16%' }}>File Attachment</TableCell>
                        <TableCell align="center" sx={{ width: '5%' }}>
                          <IconButton color="primary" size="small" onClick={handleAddExperienceRow}>
                            <IconPlus size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {experienceRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                            No experience records added. Click '+' to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        experienceRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.companyName}
                                onChange={(e) => handleExperienceRowChange(idx, 'companyName', e.target.value)}
                                size="small"
                                fullWidth
                                multiline
                                minRows={1}
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.location}
                                onChange={(e) => handleExperienceRowChange(idx, 'location', e.target.value)}
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                type="date"
                                value={row.fromDate}
                                onChange={(e) => handleExperienceRowChange(idx, 'fromDate', e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                type="date"
                                value={row.toDate}
                                onChange={(e) => handleExperienceRowChange(idx, 'toDate', e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                type="number"
                                value={row.expYears}
                                onChange={(e) => handleExperienceRowChange(idx, 'expYears', e.target.value)}
                                placeholder="Years"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <BOSFileUpload
                                files={row.file && row.file.serverFileName ? row.file.serverFileName.split(',').map((path, pIdx) => ({ fileName: path.split('/').pop() || `Attachment_${pIdx+1}`, serverFileName: path.trim(), isServer: true })) : []}
                                onChange={(files) => handleExperienceRowChange(idx, 'file', files[0] || null)}
                                multiple={false}
                                compact={true}
                                label="Upload File"
                                helperText="Max 25MB"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => setExperienceRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}>
                                <IconTrash size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 3. EDUCATION DETAILS */}
            {activeTab === 2 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', mb: 2, overflowX: 'auto', width: '100%' }}>
                  <Table size="small" sx={{ minWidth: 1200 }}>
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '5%' }}>Sl.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '25%' }}>Education</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>Institution Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Year of Passing</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>% / Grade</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '15%' }}>Documents</TableCell>
                        <TableCell align="center" sx={{ width: '5%' }}>
                          <IconButton color="primary" size="small" onClick={handleAddEducationRow}>
                            <IconPlus size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {educationRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                            No education records added. Click '+' to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        educationRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.education}
                                onChange={(e) => handleEducationRowChange(idx, 'education', e.target.value)}
                                size="small"
                                fullWidth
                                multiline
                                minRows={1}
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.institutionName}
                                onChange={(e) => handleEducationRowChange(idx, 'institutionName', e.target.value)}
                                size="small"
                                fullWidth
                                multiline
                                minRows={1}
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                select
                                value={row.type}
                                onChange={(e) => handleEducationRowChange(idx, 'type', e.target.value)}
                                size="small"
                              >
                                <MenuItem value="FULL TIME">FULL TIME</MenuItem>
                                <MenuItem value="PART TIME">PART TIME</MenuItem>
                                <MenuItem value="CORRESPONDENCE">CORRESPONDENCE</MenuItem>
                              </BOSTextField>
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                type="number"
                                value={row.yearOfPassing}
                                onChange={(e) => handleEducationRowChange(idx, 'yearOfPassing', e.target.value)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.grade}
                                onChange={(e) => handleEducationRowChange(idx, 'grade', e.target.value)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <BOSFileUpload
                                files={row.file && row.file.serverFileName ? row.file.serverFileName.split(',').map((path, pIdx) => ({ fileName: path.split('/').pop() || `Attachment_${pIdx+1}`, serverFileName: path.trim(), isServer: true })) : []}
                                onChange={(files) => handleEducationRowChange(idx, 'file', files[0] || null)}
                                multiple={false}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => setEducationRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}>
                                <IconTrash size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 4. SALARY STRUCTURE */}
            {activeTab === 3 && (
              <Grid container spacing={2}>
                {/* Earnings column */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                    <Typography variant="h5" color="primary" sx={{ mb: 2, fontWeight: 700 }}>EARNING ALLOWANCES</Typography>
                    <Grid container spacing={1.5}>
                      {[
                        { name: 'basic', label: 'Basic' },
                        { name: 'da', label: 'DA' },
                        { name: 'hra', label: 'HRA' },
                        { name: 'splAllowance', label: 'Spl. Allowance' },
                        { name: 'perfIncentive', label: 'Performance Incentive' },
                        { name: 'statutoryBonus', label: 'Statutory Bonus' },
                        { name: 'canteenAllowance', label: 'Canteen Allowance' },
                        { name: 'attendanceAllow1', label: 'Attendance Allow 1' },
                        { name: 'attendanceAllow2', label: 'Attendance Allow 2' },
                        { name: 'uniform', label: 'Uniform' },
                        { name: 'shoes', label: 'Shoes' },
                        { name: 'mobileCug', label: 'Mobile CUG' },
                        { name: 'otAmount', label: 'OT Amount' },
                        { name: 'petrolAllow', label: 'Petrol Allow' },
                        { name: 'otherAllow', label: 'Other Allow' }
                      ].map((f) => (
                        <Grid item xs={12} sm={6} key={f.name}>
                          <BOSTextField
                            type="number"
                            label={f.label}
                            name={f.name}
                            value={salaryData[f.name] === 0 || salaryData[f.name] === '0' ? '' : salaryData[f.name]}
                            onChange={handleSalaryChange}
                            placeholder="0"
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Card>
                </Grid>

                {/* Deductions & Employer Contributions */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Card variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                      <Typography variant="h5" color="error" sx={{ mb: 2, fontWeight: 700 }}>DEDUCTIONS</Typography>
                      <Grid container spacing={1.5}>
                        {[
                          { name: 'pfEmployee', label: 'PF Employee' },
                          { name: 'esiEmployee', label: 'ESI Employee' },
                          { name: 'canteenDeduct', label: 'Canteen Deduct' },
                          { name: 'profTax', label: 'Prof. Tax' },
                          { name: 'labourWelFundEmp', label: 'Labour Wel Fund Emp' },
                          { name: 'otherDeduct', label: 'Other Deduct' },
                          { name: 'suspenseDeduct', label: 'Suspense Deduct' }
                        ].map((f) => (
                          <Grid item xs={12} sm={6} key={f.name}>
                            <BOSTextField
                              type="number"
                              label={f.label}
                              name={f.name}
                              value={salaryData[f.name] === 0 || salaryData[f.name] === '0' ? '' : salaryData[f.name]}
                              onChange={handleSalaryChange}
                              placeholder="0"
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Card>

                    <Card variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                      <Typography variant="h5" color="secondary" sx={{ mb: 2, fontWeight: 700 }}>EMPLOYER CONTRIBUTION</Typography>
                      <Grid container spacing={1.5}>
                        {[
                          { name: 'pfEmployer', label: 'PF Employer' },
                          { name: 'esiEmployer', label: 'ESI Employer' },
                          { name: 'labourWelFundEmployer', label: 'Labour Wel Fund Employer' }
                        ].map((f) => (
                          <Grid item xs={12} sm={6} key={f.name}>
                            <BOSTextField
                              type="number"
                              label={f.label}
                              name={f.name}
                              value={salaryData[f.name] === 0 || salaryData[f.name] === '0' ? '' : salaryData[f.name]}
                              onChange={handleSalaryChange}
                              placeholder="0"
                              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Card>
                  </Stack>
                </Grid>

                {/* Calculations summary row */}
                <Grid item xs={12}>
                  <Card variant="elevation" elevation={4} sx={{ p: 2, borderRadius: '16px', bgcolor: 'primary.light', border: '1px solid', borderColor: 'primary.main' }}>
                    <Grid container spacing={3} justifyContent="space-around">
                      <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>GROSS SALARY</Typography>
                        <Typography variant="h3" color="primary.dark">₹{computedGross.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>NET SALARY</Typography>
                        <Typography variant="h3" color="success.dark">₹{computedNet.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>COST TO COMPANY (CTC)</Typography>
                        <Typography variant="h3" color="secondary.dark">₹{computedCTC.toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* 5. EVALUATION DETAILS */}
            {activeTab === 4 && (
              <GridContainer>
                <R>
                  <BOSTextField
                    label="Enrolled No"
                    name="enRolledNo"
                    value={formData.enRolledNo}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R>
                  <BOSDatePicker
                    label="Interview Date"
                    name="interviewDate"
                    value={evaluationData.interviewDate}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, interviewDate: e.target.value }))}
                  />
                </R>
                <R>
                  <BOSTextField
                    select
                    label="Interview Status"
                    name="status"
                    value={evaluationData.status}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    {EVALUATION_STATUSES.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </BOSTextField>
                </R>

                {/* BGV Status in Evaluation for quick reference */}
                <R>
                  <BOSTextField
                    select
                    label="BGV Status (Background Verification)"
                    value={formData.backgroundVerificationStatus || 'PENDING'}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundVerificationStatus: e.target.value }))}
                  >
                    {BGV_STATUSES.map(s => (
                      <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                    ))}
                  </BOSTextField>
                </R>
                <R>
                  <BOSTextField
                    label="Technical Interviewed By"
                    name="technicalInterviewedBy"
                    value={evaluationData.technicalInterviewedBy}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, technicalInterviewedBy: e.target.value }))}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="HR Interviewed By"
                    name="hrInterviewedBy"
                    value={evaluationData.hrInterviewedBy}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, hrInterviewedBy: e.target.value }))}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Comments"
                    name="comments"
                    value={evaluationData.comments}
                    onChange={(e) => setEvaluationData(prev => ({ ...prev, comments: e.target.value }))}
                    multiline
                    rows={3}
                  />
                </R>
              </GridContainer>
            )}

            {/* 6. CONTACT DETAILS */}
            {activeTab === 5 && (
              <GridContainer>
                <R>
                  <BOSTextField
                    label="Enrolled No"
                    name="enRolledNo"
                    value={formData.enRolledNo}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Phone No"
                    name="phoneNo"
                    value={personalData.phoneNo}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="Mobile No"
                    name="mobileNo"
                    value={formData.mobileNo}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R>
                  <BOSTextField
                    label="City"
                    name="city"
                    value={personalData.city}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Address line 1"
                    name="address1"
                    value={personalData.permAdd1}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
                <R lg={12}>
                  <BOSTextField
                    label="Address line 2"
                    name="address2"
                    value={personalData.permAdd2}
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                </R>
              </GridContainer>
            )}

            {/* 7. KYC DETAILS */}
            {activeTab === 6 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflowX: 'auto', width: '100%' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '5%' }}>Sl.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Seq No</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '25%' }}>Doc Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>DOC No</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>File</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {kycRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.slNo}</TableCell>
                          <TableCell>{row.seqNo}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.docName}</TableCell>
                          <TableCell>
                            <BOSTextField
                              value={row.docNo}
                              onChange={(e) => setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, docNo: e.target.value } : item))}
                              placeholder={`Enter ${formatDocName(row.docName)} Number`}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <BOSFileUpload
                              files={row.files || []}
                              onChange={(files) => setKycRows(prev => prev.map((item, i) => i === idx ? { ...item, files: files } : item))}
                              multiple={true}
                              maxFiles={5}
                              compact={true}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 8. SELF ASSESSMENT */}
            {activeTab === 7 && (() => {
              const selfAssessmentQuestions = [
                {
                  group: 'I. PERSONAL & FAMILY DETAILS',
                  fields: [
                    { name: 'q1_native', label: '1. Native Place' },
                    { name: 'q2_presentAddress', label: '2. Present Address', lg: 12 },
                    { name: 'q3_permanentAddress', label: '3. Permanent Address', lg: 12 },
                    { name: 'q4_fatherOccupation', label: "4. Father's Occupation" },
                    { name: 'q5_motherOccupation', label: "5. Mother's Occupation" },
                    { name: 'q6_maritalStatus', label: '6. Marital Status', select: true, options: MARITAL_STATUSES },
                    { name: 'q7_spouseOccupation', label: "7. Occupation of Spouse" },
                    { name: 'q8_children', label: '8. Children' },
                    { name: 'q9_hasRelativesInCompany', label: '9. Any relative or friends working here?', select: true, options: ['NO', 'YES'] },
                    { name: 'q10_relativesDetails', label: '10. Relative or friends details', lg: 12 },
                    { name: 'q11_siblingsOccupations', label: '11. Siblings and their occupations', lg: 12 }
                  ]
                },
                {
                  group: 'II. GENERAL HABITS, VEHICLE & HEALTH',
                  fields: [
                    { name: 'q12_hasTwoWheeler', label: '12. Do you have two wheeler?', select: true, options: ['NO', 'YES'] },
                    { name: 'q13_hasAndroidPhone', label: '13. Do you have Android phone?', select: true, options: ['NO', 'YES'] },
                    { name: 'q14_knowsCarDriving', label: '14. Do you know car driving?', select: true, options: ['NO', 'YES'] },
                    { name: 'q15_willingToTravel', label: '15. Willing to travel?', select: true, options: ['NO', 'YES'] },
                    { name: 'q16_covidVaccination', label: '16. COVID vaccination with booster?', select: true, options: ['NO', 'YES'] },
                    { name: 'q47_hasInsurance', label: '17. Do you have Health / Medical Insurance?', select: true, options: ['NO', 'YES'] },
                    { name: 'q48_insuranceNumber', label: '18. Insurance Number / Policy ID' }
                  ]
                },
                {
                  group: 'III. PERSONAL GOALS & REFLECTION',
                  fields: [
                    { name: 'q17_positivePoints', label: '17. Brief about positive points', lg: 12 },
                    { name: 'q18_negativePoints', label: '18. Brief about negative points', lg: 12 },
                    { name: 'q19_lifeGoals', label: "19. Life goals & action plan", lg: 12 },
                    { name: 'q20_willingRotationalShifts', label: '20. Willing to work in rotational shifts', lg: 12 }
                  ]
                },
                {
                  group: 'IV. CAREER, SALARY & BENEFITS',
                  fields: [
                    { name: 'q21_isExperienced', label: '21. Experienced?', select: true, options: ['NO', 'YES'] },
                    { name: 'q22_totalExperience', label: '22. Total years of experience' },
                    { name: 'q23_coreExperience', label: '23. Core department experience years' },
                    { name: 'q24_prevNetSalary', label: '24. Previous Net Salary' },
                    { name: 'q25_prevGrossSalary', label: '25. Previous Gross Salary' },
                    { name: 'q26_expectedNetSalary', label: '26. Expected Net Salary' },
                    { name: 'q27_expectedGrossSalary', label: '27. Expected Gross Salary' },
                    { name: 'q30_alternativeDepartment', label: '28. Alternate department interest' }
                  ]
                },
                {
                  group: 'V. PREVIOUS EMPLOYMENT DETAILS',
                  fields: [
                    { name: 'q31_prevLocation', label: '29. Previous/current company location' },
                    { name: 'q32_prevShift', label: '30. Previously worked shift' },
                    { name: 'q33_reasonForLeaving', label: '31. Reason for leaving previous job', lg: 12 },
                    { name: 'q34_noticePeriod', label: '32. Notice period (days)' },
                    { name: 'q35_prevDeptPosition', label: '33. Prev dept and position details', lg: 12 },
                    { name: 'q36_prevDeptCount', label: '34. Prev dept employee count' }
                  ]
                },
                {
                  group: 'VI. BEHAVIORAL & WORK RATINGS',
                  fields: [
                    { name: 'q38_handleMistake', label: '36. How you handle mistakes', lg: 12 },
                    { name: 'q39_handleOpinionDifference', label: '37. Handle team opinion differences', lg: 12 },
                    { name: 'q40_computerSelfRating', label: '38. Self rating (MS-Office, Outlook)', select: true, options: ['EXCELLENT', 'VERY GOOD', 'GOOD', 'AVERAGE', 'POOR'] },
                    { name: 'payslip', label: 'PAY SLIP', type: 'file' }
                  ]
                }
              ];

              return (
                <Stack spacing={3}>
                  {selfAssessmentQuestions.map((g, gIdx) => {
                    if (g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && assessmentData.q21_isExperienced !== 'YES') {
                      return null;
                    }
                    return (
                      <Card key={gIdx} variant="outlined" sx={{ p: 2.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h5" color="primary" sx={{ mb: 2.5, fontWeight: 700, borderBottom: '1.5px solid', borderColor: 'primary.light', pb: 1 }}>
                          {g.group}
                        </Typography>
                        <GridContainer>
                          {g.fields.map(f => (
                            <R key={f.name} lg={f.lg}>
                              {f.type === 'file' ? (
                                <Box>
                                  <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', mb: 1 }}>
                                    {f.label}
                                  </Typography>
                                  <BOSFileUpload
                                    label="Upload Payslip"
                                    files={assessmentData.payslip ? [assessmentData.payslip] : []}
                                    onChange={(files) => setAssessmentData(p => ({ ...p, payslip: files[0] || null }))}
                                    multiple={false}
                                  />
                                </Box>
                              ) : f.name === 'q40_computerSelfRating' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Typography sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                                    {f.label}
                                  </Typography>
                                  <Rating
                                    name="q40_computerSelfRating"
                                    max={5}
                                    value={
                                      assessmentData.q40_computerSelfRating === 'EXCELLENT' ? 5 :
                                      assessmentData.q40_computerSelfRating === 'VERY GOOD' ? 4 :
                                      assessmentData.q40_computerSelfRating === 'GOOD' ? 3 :
                                      assessmentData.q40_computerSelfRating === 'AVERAGE' ? 2 :
                                      assessmentData.q40_computerSelfRating === 'POOR' ? 1 : 0
                                    }
                                    onChange={(event, newValue) => {
                                      const ratings = { 1: 'POOR', 2: 'AVERAGE', 3: 'GOOD', 4: 'VERY GOOD', 5: 'EXCELLENT' };
                                      setAssessmentData(prev => ({ ...prev, q40_computerSelfRating: ratings[newValue] || '' }));
                                    }}
                                    sx={{
                                      '& .MuiRating-iconFilled': { color: '#2563EB' },
                                      '& .MuiRating-iconHover': { color: '#1d4ed8' }
                                    }}
                                  />
                                </Box>
                              ) : f.select ? (
                                <BOSTextField
                                  select
                                  fullWidth
                                  label={f.label}
                                  value={assessmentData[f.name] || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, [f.name]: e.target.value }))}
                                  InputProps={{
                                    endAdornment: assessmentData[f.name] ? (
                                      <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAssessmentData(p => ({ ...p, [f.name]: '' }));
                                          }}
                                          sx={{ color: 'text.secondary', p: 0.25 }}
                                        >
                                          <IconX size={16} />
                                        </IconButton>
                                      </InputAdornment>
                                    ) : null
                                  }}
                                >
                                  {(f.options || []).map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                  ))}
                                </BOSTextField>
                              ) : (
                                <BOSTextField
                                  fullWidth
                                  label={f.label}
                                  value={assessmentData[f.name] || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, [f.name]: e.target.value }))}
                                />
                              )}
                            </R>
                          ))}
                        </GridContainer>
                        {g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && (
                          <Stack spacing={2.5} sx={{ mt: 3 }}>
                            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                              <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                                HR Manager Reference Details
                              </Typography>
                              <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
                                <BOSTextField
                                  fullWidth
                                  label="HR Manager Name"
                                  value={assessmentData.q41_hrMgrName || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, q41_hrMgrName: e.target.value }))}
                                />
                                <BOSTextField
                                  fullWidth
                                  label="HR Manager Email"
                                  value={assessmentData.q42_hrMgrEmail || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, q42_hrMgrEmail: e.target.value }))}
                                />
                                <BOSTextField
                                   select
                                   fullWidth
                                   label="HR Manager Country"
                                   value={assessmentData.q43_hrMgrCountryId || ''}
                                   onChange={(e) => setAssessmentData(p => ({ ...p, q43_hrMgrCountryId: e.target.value }))}
                                   SelectProps={{
                                     displayEmpty: true,
                                     renderValue: (selected) => {
                                       if (!selected) return "";
                                       const matched = countries.find(c => String(c.id) === String(selected));
                                       return matched ? `${matched.countryName} (${matched.isd})` : selected;
                                     }
                                   }}
                                   InputProps={{
                                     endAdornment: assessmentData.q43_hrMgrCountryId ? (
                                       <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                         <IconButton
                                           size="small"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setAssessmentData(p => ({ ...p, q43_hrMgrCountryId: '' }));
                                           }}
                                           sx={{ color: 'text.secondary', p: 0.25 }}
                                         >
                                           <IconX size={16} />
                                         </IconButton>
                                       </InputAdornment>
                                     ) : null
                                   }}
                                 >
                                   {countries.map(c => (
                                     <MenuItem key={c.id} value={c.id}>
                                       {c.countryName} ({c.isd})
                                     </MenuItem>
                                   ))}
                                 </BOSTextField>
                                <BOSTextField
                                  fullWidth
                                  label="HR Manager Phone"
                                  value={assessmentData.q43_hrMgrPhone || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d]/g, '');
                                    setAssessmentData(p => ({ ...p, q43_hrMgrPhone: val }));
                                  }}
                                />
                              </GridContainer>
                            </Box>

                            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                              <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                                Vertical Head Reference Details
                              </Typography>
                              <GridContainer columns={{ xs: 1, sm: 2, md: 4 }}>
                                <BOSTextField
                                  fullWidth
                                  label="Vertical Head Name"
                                  value={assessmentData.q44_vertHeadName || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, q44_vertHeadName: e.target.value }))}
                                />
                                <BOSTextField
                                  fullWidth
                                  label="Vertical Head Email"
                                  value={assessmentData.q45_vertHeadEmail || ''}
                                  onChange={(e) => setAssessmentData(p => ({ ...p, q45_vertHeadEmail: e.target.value }))}
                                />
                                <BOSTextField
                                   select
                                   fullWidth
                                   label="Vertical Head Country"
                                   value={assessmentData.q46_vertHeadCountryId || ''}
                                   onChange={(e) => setAssessmentData(p => ({ ...p, q46_vertHeadCountryId: e.target.value }))}
                                   SelectProps={{
                                     displayEmpty: true,
                                     renderValue: (selected) => {
                                       if (!selected) return "";
                                       const matched = countries.find(c => String(c.id) === String(selected));
                                       return matched ? `${matched.countryName} (${matched.isd})` : selected;
                                     }
                                   }}
                                   InputProps={{
                                     endAdornment: assessmentData.q46_vertHeadCountryId ? (
                                       <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                                         <IconButton
                                           size="small"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setAssessmentData(p => ({ ...p, q46_vertHeadCountryId: '' }));
                                           }}
                                           sx={{ color: 'text.secondary', p: 0.25 }}
                                         >
                                           <IconX size={16} />
                                         </IconButton>
                                       </InputAdornment>
                                     ) : null
                                   }}
                                 >
                                   {countries.map(c => (
                                     <MenuItem key={c.id} value={c.id}>
                                       {c.countryName} ({c.isd})
                                     </MenuItem>
                                   ))}
                                 </BOSTextField>
                                <BOSTextField
                                  fullWidth
                                  label="Vertical Head Phone"
                                  value={assessmentData.q46_vertHeadPhone || ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d]/g, '');
                                    setAssessmentData(p => ({ ...p, q46_vertHeadPhone: val }));
                                  }}
                                />
                              </GridContainer>
                            </Box>
                          </Stack>
                        )}
                      </Card>
                    );
                  })}
                </Stack>
              );
            })()}

            {/* 9. SKILLS */}
            {activeTab === 8 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', mb: 2, overflowX: 'auto', width: '100%' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'primary.light' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '5%' }}>Sl.No</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '60%' }}>Activity Details</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '30%' }}>File Name</TableCell>
                        <TableCell align="center" sx={{ width: '5%' }}>
                          <IconButton color="primary" size="small" onClick={handleAddSkillRow}>
                            <IconPlus size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {skillsRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                            No skills added yet. Click '+' to add one.
                          </TableCell>
                        </TableRow>
                      ) : (
                        skillsRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <BOSTextField
                                value={row.activityDetails}
                                onChange={(e) => handleSkillRowChange(idx, 'activityDetails', e.target.value)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <BOSFileUpload
                                files={row.file ? [row.file] : []}
                                onChange={(files) => handleSkillRowChange(idx, 'file', files[0] || null)}
                                multiple={false}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton color="error" size="small" onClick={() => setSkillsRows(prev => prev.filter((_, rIdx) => rIdx !== idx))}>
                                <IconTrash size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* 10. VERIFICATION DETAILS */}
            {activeTab === 9 && (
              <VerificationDetailsPanel
                formData={formData}
                originalData={originalData}
                verificationReviews={verificationReviews}
                verificationLoading={verificationLoading}
                assessmentData={assessmentData}
                isDark={isDark}
              />
            )}
          </Box>
        </Box>
        )}
      </Stack>
    </MainCard>
  );
}
