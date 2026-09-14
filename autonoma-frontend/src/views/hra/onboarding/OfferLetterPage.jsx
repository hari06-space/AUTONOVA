/**
 * Organization: Nutech Wind Parts Pvt Ltd
 * Owner: Yuvanesh M
 * Created At: 2026-08-30
 * Updated By: Yuvanesh M
 * Updated At: 2026-09-03
 * Description: Authoritative view for HRA Offer Letters (HA1360).
 *              Integrates eligible ATS candidates, dynamic salary calculation,
 *              per-offer template section isolation, optimistic locking, and BOS UI standards.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconPrinter,
  IconTrash,
  IconFileText,
  IconInfoCircle,
  IconPencil,
  IconDownload,
  IconMail,
  IconX,
  IconPaperclip,
  IconTemplate,
  IconDeviceFloppy,
  IconRefresh,
  IconArrowLeft,
  IconHistory
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import { format } from 'date-fns';
import MainCard from 'ui-component/cards/MainCard';
import SendOfferLetterDialog from './SendOfferLetterDialog';
import {
  BOSDataTable,
  BOSTableToolbar,
  BOSStatusChip,
  getCommonDateFilters,
  matchDateRange,
  btnSave,
  btnClear,
  btnCancel,
  btnEdit,
  getDisplayString,
  normalizeGender,
  extractDateString
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import OfferLetterDesigner, { buildCleanOfferLetterHtml, DEFAULT_DOCUMENT_SECTIONS, cleanMobileNumber } from 'ui-component/bos/designer/OfferLetterDesigner';
import { buildOfferLetterDocumentModel } from 'utils/offerLetterDocumentModel';
import { getCompanyImageUrl } from 'utils/upload-helper';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { reevaluateAndBalanceComponents } from 'utils/salaryBalancingEngine';
import { exportOfferLetterToPdf } from 'utils/digitalPdfExport';
import OfferLetterFormDialog from './OfferLetterFormDialog';
import useMasterDataStore from 'store/useMasterDataStore';

const EMPTY_TERMS = {
  workingHours: '',
  workingDays: '',
  noticePeriod: '',
  leavePolicy: '',
  confidentialityClause: '',
  bgvClause: '',
  otherTerms: ''
};

export { resolveCandidateEmail } from 'utils/offerLetterDocumentModel';
import { resolveCandidateEmail } from 'utils/offerLetterDocumentModel';

// ==============================|| MAIN COMPONENT ||============================== //

export default function OfferLetterPage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Resolve Logged-in User Full Name & Designation for HR Signatory / Designer
  const loggedInUserName = useMemo(() => {
    if (!user) return '';
    return getDisplayString(user.name || user.employeeName || user.displayName || user.username || user.userId || '');
  }, [user]);

  const loggedInUserDesignation = useMemo(() => {
    if (!user) return '';
    const desig = user.designationName || user.designation || (typeof user.designation === 'object' ? (user.designation?.designationName || user.designation?.name) : '');
    return getDisplayString(desig || '');
  }, [user]);
  const fetchLookups = useMasterDataStore((s) => s.fetchLookups);

  // Redux Search & Filter Integration
  const searchQuery = useSelector((state) => state.search?.query || '');
  const rawFilters = useSelector((state) => state.search?.filters);
  const globalFilters = useMemo(() => rawFilters || {}, [rawFilters]);
  const { errors, validate, clearErrors } = useBOSValidation();

  // Navigation View Mode ('list' | 'new')
  const [viewMode, setViewMode] = useState('list');

  // Overview Table State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Master Data State (Dynamic from Database)
  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [employeeTypesList, setEmployeeTypesList] = useState([]);
  const [employeeTypesMaster, setEmployeeTypesMaster] = useState([]);
  const employeeTypesMasterRef = useRef([]);
  const [gradesList, setGradesList] = useState([]);
  const [locationsList, setLocationsList] = useState([]);

  // Authoritative Tenant Company Profile State
  const [companyInfo, setCompanyInfo] = useState(null);

  // ATS Candidates & Employee Master Dual Source State
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form Fields - Candidate Information
  const [candidateName, setCandidateName] = useState('');
  const [candidateCode, setCandidateCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [candidatePhoto, setCandidatePhoto] = useState('');

  // Form Fields - Job Details
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [grade, setGrade] = useState('');

  // Form Fields - Offer Details
  const [refNo, setRefNo] = useState('');
  const [offerLetterNo, setOfferLetterNo] = useState('');
  const [offerDate, setOfferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [joiningDate, setJoiningDate] = useState('');
  const [probationPeriod, setProbationPeriod] = useState('');
  const [lockVersion, setLockVersion] = useState(0);
  const [statusId, setStatusId] = useState(null);
  const [templateId, setTemplateId] = useState(null);

  // Dynamic Salary State — driven by HR Settings payroll configuration (same as ATS InterviewFinalProcess)
  const [activeCompsList, setActiveCompsList] = useState([]);
  const [localSalary, setLocalSalary] = useState({});
  const [salaryLoading, setSalaryLoading] = useState(false);

  // Form Fields - Terms
  const [terms, setTerms] = useState({ ...EMPTY_TERMS });
  const [customSections, setCustomSections] = useState(null);
  const candidateRequestSeqRef = useRef(0);

  const resolveEffectiveSections = useCallback((explicitSections) => {
    if (explicitSections && Array.isArray(explicitSections) && explicitSections.length > 0) {
      return explicitSections;
    }
    try {
      const cached = localStorage.getItem('AUTONOMA_OFFER_LETTER_TEMPLATE_CACHE');
      if (cached) {
        const p = JSON.parse(cached);
        if (p.sections && Array.isArray(p.sections) && p.sections.length > 0) {
          return p.sections;
        }
      }
    } catch (e) {}
    return DEFAULT_DOCUMENT_SECTIONS;
  }, []);

  // UI Modals
  const [designerOpen, setDesignerOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [selectedOfferForEmail, setSelectedOfferForEmail] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [lastGeneratedPdfArtifact, setLastGeneratedPdfArtifact] = useState(null);

  const isReadOnly = dialogMode === 'view';

  const handleOpenPreview = useCallback(async (row) => {
    if (!row) return;
    let fullRow = { ...row };
    if (row.id) {
      try {
        const { data: detail } = await axios.get(`/api/hra/letters/${row.id}`);
        if (detail) {
          let parsedFormData = {};
          if (detail.formData) {
            try {
              parsedFormData = typeof detail.formData === 'string' ? JSON.parse(detail.formData) : detail.formData;
            } catch (_) {}
          }
          const resolvedWorkLoc = getDisplayString(detail.workLocation || parsedFormData.workLocation || row.workLocation || '');
          const resolvedEmail = resolveCandidateEmail(parsedFormData) || resolveCandidateEmail(detail) || resolveCandidateEmail(row) || '';
          fullRow = {
            ...row,
            ...detail,
            ...parsedFormData,
            email: resolvedEmail,
            workLocation: resolvedWorkLoc,
            fullRecord: {
              ...detail,
              ...parsedFormData,
              email: resolvedEmail,
              workLocation: resolvedWorkLoc
            }
          };
        }
      } catch (e) {
        console.warn('Failed to fetch offer letter full detail for preview', e);
      }
    }
    setPreviewRecord(fullRow);
    setPreviewDialogOpen(true);
  }, []);

  const handleOpenSendEmailDialog = useCallback(async (row = null, precomputedModel = null, precomputedArtifact = null) => {
    let target = row;
    if (!target && selectedRowIds.length === 1) {
      const selId = selectedRowIds[0];
      target = rows.find(r => String(r.id) === String(selId) || String(r.applicantCode) === String(selId) || String(r.uniqueRowId) === String(selId));
    }

    if (!target) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select exactly one Offer Letter record from the table to send email.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }

    let fullTarget = { ...target, activeCompsList };
    if (!precomputedModel && target.id) {
      try {
        const { data: detail } = await axios.get(`/api/hra/letters/${target.id}`);
        if (detail) {
          let parsedFormData = {};
          if (detail.formData) {
            try {
              parsedFormData = typeof detail.formData === 'string' ? JSON.parse(detail.formData) : detail.formData;
            } catch (e) {}
          }
          const resolvedEmail = resolveCandidateEmail(parsedFormData) || resolveCandidateEmail(detail) || resolveCandidateEmail(target) || '';
          fullTarget = {
            ...target,
            ...detail,
            ...parsedFormData,
            email: resolvedEmail,
            activeCompsList,
            fullRecord: {
              ...detail,
              ...parsedFormData,
              email: resolvedEmail,
              activeCompsList
            }
          };
        }
      } catch (e) {
        console.warn('Failed to fetch offer letter full detail for sending email', e);
      }
    }

    const canonicalModel = precomputedModel || buildOfferLetterDocumentModel(fullTarget, {
      customSections,
      companyInfo,
      signatoryData: { hrName: loggedInUserName, hrDesignation: loggedInUserDesignation },
      activeCompsList
    });

    setSelectedOfferForEmail({
      ...fullTarget,
      canonicalModel,
      pdfArtifact: precomputedArtifact
    });
    setSendEmailDialogOpen(true);
  }, [selectedRowIds, rows, activeCompsList, customSections, companyInfo, loggedInUserName, loggedInUserDesignation, dispatch]);

  // Dynamic Salary Computed Values (same logic as ATS InterviewFinalProcess)
  const isPFEnabled = localSalary.providentFund === undefined || localSalary.providentFund === null || localSalary.providentFund === true || String(localSalary.providentFund) === '1' || String(localSalary.providentFund).toLowerCase() === 'true' || localSalary.providentFund === 'YES';
  const isESIEnabled = localSalary.esiAllowed === undefined || localSalary.esiAllowed === null || localSalary.esiAllowed === true || String(localSalary.esiAllowed) === '1' || String(localSalary.esiAllowed).toLowerCase() === 'true' || localSalary.esiAllowed === 'YES';
  const isPTaxEnabled = localSalary.professionalTax === undefined || localSalary.professionalTax === null || localSalary.professionalTax === true || String(localSalary.professionalTax) === '1' || String(localSalary.professionalTax).toLowerCase() === 'true' || localSalary.professionalTax === 'YES';

  const filterEnabled = useCallback((c) => {
    const compCode = (c.componentCode || '').toUpperCase();
    const compName = (c.displayName || c.componentName || '').toUpperCase();
    if ((compCode.includes('PF') || compName.includes('PF') || compName.includes('PROVIDENT')) && !isPFEnabled) return false;
    if ((compCode.includes('ESI') || compName.includes('ESI')) && !isESIEnabled) return false;
    if ((compCode.includes('PT') || compCode.includes('PROF_TAX') || compCode.includes('PROFESSIONAL_TAX') || compName.includes('PTAX') || compName.includes('PROFESSIONAL TAX') || compName.includes('PROF. TAX')) && !isPTaxEnabled) return false;
    if ((compCode.includes('LTA') || compName.includes('LTA') || compName.includes('LEAVE TRAVEL')) && !(localSalary.ltaEligible === true || String(localSalary.ltaEligible) === '1' || String(localSalary.ltaEligible).toLowerCase() === 'true')) return false;
    return true;
  }, [isPFEnabled, isESIEnabled, isPTaxEnabled, localSalary.ltaEligible]);

  const salaryEarnings = useMemo(() => activeCompsList.filter(c => c.componentType === 'EARNING' && c.componentCode !== 'GROSS' && c.componentCode !== 'NET_SALARY' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c)), [activeCompsList, filterEnabled]);
  const salaryDeductions = useMemo(() => activeCompsList.filter(c => c.componentType === 'DEDUCTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c)), [activeCompsList, filterEnabled]);
  const salaryContributions = useMemo(() => activeCompsList.filter(c => c.componentType === 'EMPLOYER_CONTRIBUTION' && (c.showInRegister === true || String(c.showInRegister) === 'true' || c.showInRegister === 1 || String(c.showInRegister) === '1') && filterEnabled(c)), [activeCompsList, filterEnabled]);

  const grossVal = useMemo(() => salaryEarnings.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (parseFloat(localSalary[c.componentCode]) || 0), 0), [salaryEarnings, localSalary]);
  const deductionsVal = useMemo(() => salaryDeductions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (parseFloat(localSalary[c.componentCode]) || 0), 0), [salaryDeductions, localSalary]);
  const contributionsVal = useMemo(() => salaryContributions.filter(c => c.calculationType !== 'DAILY_RATE').reduce((s, c) => s + (parseFloat(localSalary[c.componentCode]) || 0), 0), [salaryContributions, localSalary]);
  const netVal = grossVal - deductionsVal;
  const ctcVal = grossVal + contributionsVal;
  const totalCTC = ctcVal * 12;

  // Space + Key Shortcut Handling (BOS SOP #4)
  useKeyboardShortcuts({
    'space+o': () => {
      if (previewDialogOpen && previewRecord) {
        const target = previewRecord;
        setPreviewDialogOpen(false);
        setPreviewRecord(null);
        handleOpenSendEmailDialog(target);
      } else if (viewMode === 'list' && !sendEmailDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenSendEmailDialog();
      }
    },
    'o': () => {
      if (previewDialogOpen && previewRecord) {
        const target = previewRecord;
        setPreviewDialogOpen(false);
        setPreviewRecord(null);
        handleOpenSendEmailDialog(target);
      } else if (viewMode === 'list' && !sendEmailDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenSendEmailDialog();
      }
    },
    'offer': () => {
      if (previewDialogOpen && previewRecord) {
        const target = previewRecord;
        setPreviewDialogOpen(false);
        setPreviewRecord(null);
        handleOpenSendEmailDialog(target);
      } else if (viewMode === 'list' && !sendEmailDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenSendEmailDialog();
      }
    },
    'space+n': () => {
      if (viewMode === 'list' && !sendEmailDialogOpen && !previewDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenAdd();
      }
    },
    'n': () => {
      if (viewMode === 'list' && !sendEmailDialogOpen && !previewDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenAdd();
      }
    },
    'new': () => {
      if (viewMode === 'list' && !sendEmailDialogOpen && !previewDialogOpen && !designerOpen && !dialogOpen && !deleteDialogOpen && !infoModalOpen) {
        handleOpenAdd();
      }
    },
    'space+t': () => {
      if (viewMode === 'new' && !designerOpen) {
        setDesignerOpen(true);
      }
    },
    't': () => {
      if (viewMode === 'new' && !designerOpen) {
        setDesignerOpen(true);
      }
    },
    'template': () => {
      if (viewMode === 'new' && !designerOpen) {
        setDesignerOpen(true);
      }
    },
    'space+s': () => {
      if (viewMode === 'new' && !saving && !designerOpen) {
        handleSave();
      }
    },
    's': () => {
      if (viewMode === 'new' && !saving && !designerOpen) {
        handleSave();
      }
    },
    'save': () => {
      if (viewMode === 'new' && !saving && !designerOpen) {
        handleSave();
      }
    },
    'space+c': () => {
      if (viewMode === 'new' && !designerOpen) {
        handleClearForm();
      }
    },
    'c': () => {
      if (viewMode === 'new' && !designerOpen) {
        handleClearForm();
      }
    },
    'clear': () => {
      if (viewMode === 'new' && !designerOpen) {
        handleClearForm();
      }
    },
    'space+b': () => {
      if (viewMode === 'new' && !designerOpen) {
        setViewMode('list');
      }
    },
    'b': () => {
      if (viewMode === 'new' && !designerOpen) {
        setViewMode('list');
      }
    },
    'back': () => {
      if (viewMode === 'new' && !designerOpen) {
        setViewMode('list');
      }
    },
    'escape': () => {
      if (designerOpen) setDesignerOpen(false);
      else if (sendEmailDialogOpen) { setSendEmailDialogOpen(false); setSelectedOfferForEmail(null); }
      else if (previewDialogOpen) { setPreviewDialogOpen(false); setPreviewRecord(null); }
      else if (deleteDialogOpen) setDeleteDialogOpen(false);
      else if (dialogOpen) setDialogOpen(false);
      else if (infoModalOpen) setInfoModalOpen(false);
      else if (viewMode === 'new') setViewMode('list');
    }
  });

  // Starred Filters Configuration (Registers controls directly into global top bar)
  useEffect(() => {
    const config = [
      {
        id: 'department',
        label: 'Department',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          ...departmentsList.map(d => ({ value: d, label: d }))
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Draft', label: 'Draft' },
          { value: 'Sent', label: 'Sent' },
          { value: 'Resent', label: 'Resent' },
          { value: 'Accepted', label: 'Accepted' },
          { value: 'Rejected', label: 'Rejected' },
          { value: 'Cancelled', label: 'Cancelled' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      ...getCommonDateFilters('offerDate'),
      { id: 'candidateName', label: 'Candidate / Employee Name', type: 'text' },
      { id: 'applicantCode', label: 'Candidate / Employee ID', type: 'text' },
      { id: 'offerLetterNo', label: 'Offer No', type: 'text' }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, departmentsList]);

  // Fetch Offer Letters List
  const fetchOfferLetters = useCallback(() => {
    setLoading(true);
    axios.get('/api/hra/letters?page=0&size=200')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
        const formatted = list.filter(i => (i.letterType || 'OFFER_LETTER') === 'OFFER_LETTER').map((item) => {
          let parsedData = {};
          try {
            parsedData = typeof item.formData === 'string' ? JSON.parse(item.formData) : (item.formData || {});
          } catch (e) { }

          const resolvedEmail = resolveCandidateEmail(item) || resolveCandidateEmail(parsedData) || '';
          const resolvedPhone = item.phone || parsedData.phone || '';
          const resolvedJoiningDate = item.joiningDate ? String(item.joiningDate).substring(0, 10) : (parsedData.joiningDate || '-');
          const resolvedAnnualCtc = item.annualCtc !== undefined && item.annualCtc !== null
            ? Number(item.annualCtc)
            : (parsedData.compensation?.annualCTC || parsedData.compensation?.totalCTC || parsedData.totalCTC || 0);
          const resolvedStatus = item.statusName || item.status || parsedData.status || 'Draft';

          return {
            id: item.id,
            refNo: item.refNo || (item.id ? `OL-${item.id}` : ''),
            offerLetterNo: parsedData.offerLetterNo || item.refNo || (item.id ? `OL-${item.id}` : ''),
            applicantId: item.applicantId || parsedData.applicantId || null,
            applicantCode: getDisplayString(item.employeeCode || parsedData.candidateCode || parsedData.applicantCode || ''),
            candidateName: getDisplayString(item.employeeName || parsedData.candidateName || ''),
            department: getDisplayString(item.department || parsedData.department || ''),
            designation: getDisplayString(item.designation || parsedData.designation || ''),
            employmentType: getDisplayString(item.employmentType || parsedData.employmentType || ''),
            workLocation: getDisplayString(item.workLocation || parsedData.workLocation || ''),
            offerDate: item.letterDate ? String(item.letterDate).substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
            joiningDate: resolvedJoiningDate,
            totalCTC: resolvedAnnualCtc,
            grossSalary: item.grossSalary !== undefined && item.grossSalary !== null ? Number(item.grossSalary) : (parsedData.compensation?.grossSalary || 0),
            netSalary: item.netSalary !== undefined && item.netSalary !== null ? Number(item.netSalary) : (parsedData.compensation?.netSalary || 0),
            status: resolvedStatus,
            statusId: item.statusId || null,
            statusName: resolvedStatus,
            emailStatus: parsedData.emailStatus || 'Not Sent',
            sentDate: parsedData.sentDate || '-',
            createdBy: item.createdBy || '',
            createdDate: item.createdDate ? String(item.createdDate).substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
            email: resolvedEmail,
            personalEmail: resolvedEmail,
            phone: resolvedPhone,
            employeeCode: item.employeeCode || parsedData.candidateCode || parsedData.applicantCode || '',
            templateId: item.templateId || null,
            lockVersion: item.lockVersion || 0,

            fullRecord: { ...item, ...parsedData, email: resolvedEmail, phone: resolvedPhone }
          };
        });
        if (formatted.length > 0) setRows(formatted);
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch Dynamic Masters from Backend via Consolidated Bulk Lookup API
  const fetchMasterData = useCallback(async () => {
    try {
      const [lookupsResult, empTypesResult] = await Promise.allSettled([
        fetchLookups(['DEPARTMENTS', 'DESIGNATIONS', 'GRADES', 'DIVISIONS']),
        axios.get('/api/master/hr/employee-types')
      ]);

      const storeData = useMasterDataStore.getState().data || {};

      const deptNames = (storeData.departments || []).map((d) => getDisplayString(d.departmentName || d.name || d)).filter(Boolean);
      if (deptNames.length > 0) setDepartmentsList(Array.from(new Set(deptNames)));

      const desigNames = (storeData.designations || []).map((d) => getDisplayString(d.designationName || d.name || d)).filter(Boolean);
      if (desigNames.length > 0) setDesignationsList(Array.from(new Set(desigNames)));

      let empTypesMasterList = [];
      if (empTypesResult.status === 'fulfilled') {
        const rawTypes = Array.isArray(empTypesResult.value?.data) ? empTypesResult.value.data : (empTypesResult.value?.data?.content || []);
        empTypesMasterList = rawTypes;
      }
      if (empTypesMasterList.length === 0) {
        empTypesMasterList = storeData.employeeTypes || storeData.types || [];
      }

      if (empTypesMasterList.length > 0) {
        setEmployeeTypesMaster(empTypesMasterList);
        employeeTypesMasterRef.current = empTypesMasterList;
        const stringNames = empTypesMasterList
          .filter((t) => t.isActive !== false && t.status !== 'INACTIVE')
          .map((t) => getDisplayString(t.typeName || t.name || t.type_name || t))
          .filter(Boolean);
        setEmployeeTypesList(Array.from(new Set(stringNames)));
      }

      const gradeNames = (storeData.grades || []).map((g) => getDisplayString(g.gradeCode || g.gradeName || g.name || g)).filter(Boolean);
      if (gradeNames.length > 0) setGradesList(Array.from(new Set(gradeNames)));

      const locNames = (storeData.divisions || []).map((div) => getDisplayString(div.divisionName || div.name || div)).filter(Boolean);
      if (locNames.length > 0) setLocationsList(locNames);
    } catch (e) {
      console.warn('Failed to fetch dynamic master data', e);
    }
  }, [fetchLookups]);

  // Fetch Authoritative Company Profile for Header Binding & Token Substitution
  const fetchCompanyProfile = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/company-profile/all', { skipGlobalAlert: true });
      const profiles = Array.isArray(data) ? data : (data ? [data] : []);
      if (profiles.length > 0) {
        const activeName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
        const activeProf = profiles.find((c) => c.companyName === activeName) || profiles[0];
        const addressParts = [activeProf.address, activeProf.city, activeProf.state].filter(Boolean);
        const fullAddress = addressParts.join(', ') + (activeProf.pincode ? ` - ${activeProf.pincode}` : '');
        setCompanyInfo({
          companyName: activeProf.companyName || '',
          companyAddress: fullAddress || activeProf.address || '',
          companyGstin: activeProf.gstIn || '',
          companyPhone: activeProf.phoneNo || activeProf.mobileNo || '',
          companyEmail: activeProf.emailId || '',
          companyWeb: activeProf.website || '',
          companyLogo: activeProf.logoFileName ? getCompanyImageUrl(activeProf.logoFileName) : (activeProf.companyLogo || ''),
          logoFileName: activeProf.logoFileName || '',
          hrName: loggedInUserName || '',
          hrDesignation: loggedInUserDesignation || 'HR Manager'
        });
      }
    } catch (e) {
      console.warn('[OfferLetterPage] Failed to fetch company profile', e);
    }
  }, [loggedInUserName, loggedInUserDesignation]);

  // Fetch Eligible ATS Selected Candidates & Active Employees for Offer Letter Generation
  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const [atsRes, empRes] = await Promise.allSettled([
        axios.get('/api/hra/applicants/eligible-for-offer').catch(() => axios.get('/api/hra/applicants')),
        axios.get('/api/master/hr/employees/filter/active')
      ]);

      const rawAtsList = atsRes.status === 'fulfilled' && Array.isArray(atsRes.value?.data) ? atsRes.value.data : (atsRes.value?.data?.content || []);
      let rawEmpList = empRes.status === 'fulfilled' && Array.isArray(empRes.value?.data) ? empRes.value.data : (empRes.value?.data?.content || []);

      // Fallback to standard employee list if filter/active returns empty
      if (rawEmpList.length === 0) {
        try {
          const fallbackRes = await axios.get('/api/master/hr/employees');
          rawEmpList = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.content || []);
        } catch (_) {}
      }

      const storeData = useMasterDataStore.getState().data || {};
      const rawDesigList = storeData.designations || [];
      const rawDeptList = storeData.departments || [];

      const desigMap = new Map();
      rawDesigList.forEach(d => {
        if (d && d.id) {
          desigMap.set(String(d.id), d.designationName || d.name || '');
        }
      });

      const deptMap = new Map();
      rawDeptList.forEach(d => {
        if (d && (d.id !== undefined || d.departmentId !== undefined)) {
          const idKey = String(d.id !== undefined ? d.id : d.departmentId);
          const nameVal = d.departmentName || d.name || '';
          if (idKey && nameVal) deptMap.set(idKey, nameVal);
        }
      });

      const recordsMap = new Map();

      // 1. Ingest ATS Tracking System Records (Filter strictly to eligible candidates)
      rawAtsList.forEach(item => {
        const ivStatus = String(
          item.interviewStatusName ||
          (typeof item.interviewStatus === 'object' && item.interviewStatus !== null ? (item.interviewStatus.name || item.interviewStatus.statusName) : item.interviewStatus) ||
          item.interviewResult ||
          item.interview ||
          ''
        ).toUpperCase().trim();

        const overallStatus = String(
          item.atsOverallStatusName ||
          (typeof item.atsOverallStatus === 'object' && item.atsOverallStatus !== null ? (item.atsOverallStatus.name || item.atsOverallStatus.statusName) : item.atsOverallStatus) ||
          ''
        ).toUpperCase().trim();

        const candStatus = String(
          item.statusName ||
          (typeof item.status === 'object' && item.status !== null ? (item.status.name || item.status.statusName) : item.status) ||
          item.applicationStatus ||
          ''
        ).toUpperCase().trim();

        const offerStatus = String(
          item.offerStatusName ||
          (typeof item.offerStatus === 'object' && item.offerStatus !== null ? (item.offerStatus.name || item.offerStatus.statusName) : item.offerStatus) ||
          item.offer ||
          ''
        ).toUpperCase().trim();

        // Skip candidates who are rejected, cancelled, on-hold, pending, or in-progress
        if (
          ivStatus.includes('REJECT') ||
          ivStatus.includes('CANCEL') ||
          ivStatus.includes('HOLD') ||
          ivStatus.includes('PENDING') ||
          ivStatus.includes('WAITING') ||
          ivStatus.includes('PROGRESS') ||
          candStatus.includes('REJECT') ||
          candStatus.includes('CANCEL') ||
          overallStatus.includes('REJECT') ||
          overallStatus.includes('CANCEL')
        ) {
          return;
        }

        // Only include candidates selected in ATS Final Process
        const isSelectedInFinalProcess = (
          ivStatus === 'SELECTED' ||
          ivStatus.includes('SELECT') ||
          candStatus === 'SELECTED' ||
          candStatus === 'OFFERED' ||
          overallStatus === 'SELECTED' ||
          overallStatus === 'OFFERED'
        );

        if (!isSelectedInFinalProcess) {
          return;
        }

        // Exclude candidates who have already completed Offer Letter document verification (VERIFIED / ON-ROLL)
        const isOfferDocVerified = (
          offerStatus === 'VERIFIED' ||
          offerStatus === 'VERIFY' ||
          offerStatus.includes('VERIFIED') ||
          offerStatus === 'JOINED' ||
          item.isAlreadyOnRoll === true ||
          candStatus === 'ON-ROLL' ||
          overallStatus === 'ON-ROLL' ||
          (item.empCode && String(item.empCode).trim() !== '' && !String(item.empCode).startsWith('ATS-'))
        );

        if (isOfferDocVerified) {
          return;
        }

        const name = getDisplayString(item.employeeName || item.applicantName || item.candidateName || `${item.firstName || ''} ${item.lastName || ''}`.trim());
        const emailVal = resolveCandidateEmail(item);
        const phoneVal = cleanMobileNumber(
          item.mobileNo ||
          item.mobile ||
          item.phone ||
          item.phoneNo ||
          item.contactNo ||
          item.contactNumber ||
          item.phoneNumber ||
          item.mobileNumber ||
          item.applicantMobile ||
          item.candidateMobile ||
          item.primaryContact ||
          item.communicationNumber ||
          item.cellPhone ||
          item.emergencyContactNo ||
          (item.personal && (item.personal.mobileNo || item.personal.mobile || item.personal.phone || item.personal.contactNo)) ||
          (item.personalDetail && (item.personalDetail.mobileNo || item.personalDetail.mobile || item.personalDetail.phone || item.personalDetail.contactNo)) ||
          (item.personalDetails && (item.personalDetails.mobileNo || item.personalDetails.mobile || item.personalDetails.phone || item.personalDetails.contactNo)) ||
          (item.communication && (item.communication.mobileNo || item.communication.phone || item.communication.contactNo)) ||
          (item.contact && (item.contact.mobileNo || item.contact.phone || item.contact.contactNo)) ||
          ''
        );
        const codeVal = getDisplayString(item.enRolledNo || item.applicantCode || item.empCode) || (item.id ? `ATS-${String(item.id).padStart(4, '0')}` : '');
        const rawDept = item.departmentName || item.department || item.departmentId || '';
        const deptVal = deptMap.get(String(rawDept)) || getDisplayString(rawDept);
        const rawRole = item.designationName || item.positionLookFor || item.appliedRole || item.designation;
        const roleVal = desigMap.get(String(rawRole)) || getDisplayString(rawRole);
        const genderVal = normalizeGender(item.gender || item.sex);
        const dobVal = extractDateString(item.birthDate || item.dob || item.dateOfBirth || item.birth_date || item.personal?.birthDate || item.personalDetail?.birthDate);
        const photoVal = item.candidatePhoto || item.employeePhotoUpload || item.photoUpload || item.photo || item.profileUpload || item.photoPath || item.profileImage || (item.personal && item.personal.photo) || (item.personalDetail && item.personalDetail.photo) || '';

        const key = (codeVal || emailVal || name).toLowerCase().trim();
        if (!key) return;

        let empTypeVal = '';
        if (item.employmentType) {
          empTypeVal = typeof item.employmentType === 'object' ? (item.employmentType.typeName || item.employmentType.name || item.employmentType.type_name) : item.employmentType;
        } else if (item.employeeType) {
          empTypeVal = typeof item.employeeType === 'object' ? (item.employeeType.typeName || item.employeeType.name || item.employeeType.type_name) : item.employeeType;
        } else if (item.jobProfile?.employmentType) {
          empTypeVal = typeof item.jobProfile.employmentType === 'object' ? (item.jobProfile.employmentType.typeName || item.jobProfile.employmentType.name) : item.jobProfile.employmentType;
        } else if (item.jobProfile?.employeeType) {
          empTypeVal = typeof item.jobProfile.employeeType === 'object' ? (item.jobProfile.employeeType.typeName || item.jobProfile.employeeType.name) : item.jobProfile.employeeType;
        } else if (item.employeeTypeId || item.employmentTypeId) {
          const tid = item.employeeTypeId || item.employmentTypeId;
          const match = employeeTypesMasterRef.current?.find(t => String(t.id) === String(tid));
          if (match) empTypeVal = match.typeName || match.name;
        } else if (item.empType || item.jobType || item.engagementType || item.hiringType) {
          empTypeVal = item.empType || item.jobType || item.engagementType || item.hiringType;
        }
        empTypeVal = getDisplayString(empTypeVal);

        recordsMap.set(key, {
          ...item,
          id: item.id,
          sourceTag: 'ATS',
          sourceType: 'ATS',
          applicantCode: codeVal,
          candidateName: name,
          applicantName: name,
          candidatePhoto: photoVal,
          employeePhotoUpload: photoVal,
          photo: photoVal,
          email: emailVal,
          emailId: emailVal,
          phone: phoneVal,
          mobileNo: phoneVal,
          mobile: phoneVal,
          gender: genderVal,
          dob: dobVal,
          birthDate: dobVal,
          department: deptVal,
          departmentName: deptVal,
          appliedRole: roleVal,
          designation: roleVal,
          designationName: roleVal,
          joiningDate: item.joiningDate || '',
          workLocation: getDisplayString(item.workLocation || item.location),
          employmentType: empTypeVal,
          grade: getDisplayString(item.grade || item.gradeName),
          basicPay: Number(item.basicPay) || 0,
          hraPay: Number(item.hraPay) || 0,
          specialAllowance: Number(item.specialAllowance) || 0,
          bonusPay: Number(item.bonusPay) || 0,
          ctc: Number(item.ctc || item.salaryOffered) || 0
        });
      });

      // 2. Ingest Active Employees from Employee Master
      rawEmpList.forEach(emp => {
        if (!emp) return;
        const st = emp.status;
        const stStr = String(typeof st === 'object' && st !== null ? (st.name || st.statusName || '') : (st || '')).toUpperCase();
        if (
          stStr.includes('INACTIVE') ||
          stStr.includes('TERMINAT') ||
          stStr.includes('RESIGN') ||
          stStr.includes('RELIEV') ||
          stStr.includes('EXIT') ||
          stStr.includes('ABSCOND')
        ) {
          return;
        }

        const name = getDisplayString(emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name);
        if (!name) return;

        const codeVal = getDisplayString(emp.empCode || emp.oldEmpCode || emp.employeeCode) || (emp.id ? `EMP-${emp.id}` : '');

        const personalObj = emp.personal || emp.personalDetail || emp.personalDetails || {};
        const jobObj = emp.jobProfile || emp.job || emp.jobDetails || {};
        const orgObj = emp.organization || {};
        const commObj = emp.communication || emp.communicationDetail || {};

        const emailVal = resolveCandidateEmail(emp);

        const phoneVal = cleanMobileNumber(
          personalObj.mobileNo ||
          personalObj.mobile ||
          personalObj.phone ||
          personalObj.contactNo ||
          commObj.mobileNo ||
          commObj.phone ||
          emp.mobileNo ||
          emp.mobile ||
          emp.phone ||
          emp.contactNo
        );

        const rawDept = jobObj.department?.name || jobObj.departmentName || orgObj.department?.name || orgObj.departmentName || emp.departmentName || emp.department || emp.departmentId || '';
        const deptVal = deptMap.get(String(rawDept)) || getDisplayString(rawDept);

        const rawRole = jobObj.designation?.name || jobObj.designationName || orgObj.designation?.name || orgObj.designationName || emp.designationName || emp.designation || emp.designationId || '';
        const roleVal = desigMap.get(String(rawRole)) || getDisplayString(rawRole);

        const genderVal = normalizeGender(personalObj.gender || personalObj.sex || emp.gender || emp.sex);
        const rawDob = personalObj.birthDate || personalObj.dob || personalObj.dateOfBirth || emp.birthDate || emp.dob || emp.dateOfBirth || '';
        const dobVal = extractDateString(rawDob);

        const photoVal = emp.employeePhotoUpload || emp.profileUpload || emp.photo || emp.photoUpload || personalObj.photo || personalObj.photoPath || '';

        let empTypeVal = '';
        if (jobObj.employmentType) {
          empTypeVal = typeof jobObj.employmentType === 'object' ? (jobObj.employmentType.typeName || jobObj.employmentType.name || jobObj.employmentType.type_name) : jobObj.employmentType;
        } else if (jobObj.employeeType) {
          empTypeVal = typeof jobObj.employeeType === 'object' ? (jobObj.employeeType.typeName || jobObj.employeeType.name || jobObj.employeeType.type_name) : jobObj.employeeType;
        } else if (emp.employmentType) {
          empTypeVal = typeof emp.employmentType === 'object' ? (emp.employmentType.typeName || emp.employmentType.name || emp.employmentType.type_name) : emp.employmentType;
        } else if (emp.employeeType) {
          empTypeVal = typeof emp.employeeType === 'object' ? (emp.employeeType.typeName || emp.employeeType.name || emp.employeeType.type_name) : emp.employeeType;
        } else if (emp.employeeTypeId || jobObj.employeeTypeId || orgObj.employeeTypeId || jobObj.employmentTypeId) {
          const tid = emp.employeeTypeId || jobObj.employeeTypeId || orgObj.employeeTypeId || jobObj.employmentTypeId;
          const match = employeeTypesMasterRef.current?.find(t => String(t.id) === String(tid));
          if (match) empTypeVal = match.typeName || match.name;
        } else if (emp.empType || emp.jobType || emp.engagementType || emp.hiringType) {
          empTypeVal = emp.empType || emp.jobType || emp.engagementType || emp.hiringType;
        }
        empTypeVal = getDisplayString(empTypeVal);
        const gradeVal = getDisplayString(jobObj.grade?.name || jobObj.grade || emp.grade || emp.gradeName);
        const locVal = getDisplayString(jobObj.location?.name || jobObj.location || jobObj.workLocation || emp.workLocation || emp.plantLocation || emp.location);
        const joinDateVal = extractDateString(jobObj.dateOfJoining || jobObj.joiningDate || emp.dateOfJoining || emp.joiningDate || emp.createdDate);
        const mgrVal = getDisplayString(jobObj.reportingTo?.employeeName || jobObj.reportingTo?.name || jobObj.reportingManager || orgObj.reportingTo?.employeeName || orgObj.reportingTo?.name || emp.reportingManager || '');

        const key = `EMP_${emp.id || codeVal || name}`.toLowerCase().trim();

        recordsMap.set(key, {
          ...emp,
          id: emp.id,
          employeeId: emp.id,
          sourceTag: 'Employee',
          sourceType: 'Employee',
          applicantCode: codeVal,
          employeeCode: codeVal,
          empCode: codeVal,
          candidateName: name,
          applicantName: name,
          employeeName: name,
          candidatePhoto: photoVal,
          employeePhotoUpload: photoVal,
          photo: photoVal,
          email: emailVal,
          emailId: emailVal,
          officeMail: emailVal,
          personalEmail: personalObj.email || emailVal,
          phone: phoneVal,
          mobileNo: phoneVal,
          mobile: phoneVal,
          gender: genderVal,
          dob: dobVal,
          birthDate: dobVal,
          department: deptVal,
          departmentName: deptVal,
          appliedRole: roleVal,
          designation: roleVal,
          designationName: roleVal,
          joiningDate: joinDateVal,
          workLocation: locVal,
          employmentType: empTypeVal,
          grade: gradeVal,
          basicPay: Number(emp.basicSalary || emp.basicPay) || 0,
          ctc: Number(emp.ctc || emp.annualCtc) || 0
        });
      });

      const combinedList = Array.from(recordsMap.values());
      setCandidates(combinedList);
    } catch (e) {
      console.warn("Failed to fetch eligible candidates and employees", e);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyProfile();
    fetchOfferLetters();
    fetchCandidates();
    fetchMasterData();
  }, [fetchCompanyProfile, fetchOfferLetters, fetchCandidates, fetchMasterData]);

  // Helper to test if a toggle value represents true / enabled
  const isValTrue = useCallback((v) => v === true || v === 1 || String(v) === '1' || String(v).toUpperCase() === 'YES' || String(v).toLowerCase() === 'true', []);
  const isValFalse = useCallback((v) => v === false || v === 0 || String(v) === '0' || String(v).toUpperCase() === 'NO' || String(v).toLowerCase() === 'false', []);

  // ==============================|| SALARY LOADING (reuses ATS/Employee Master API pattern) ||============================== //

  const loadPayrollComponents = useCallback(async (employeeId, employeeType, savedSalaryComponents) => {
    setSalaryLoading(true);
    // Reset salary before loading new candidate's salary
    setActiveCompsList([]);
    setLocalSalary({});
    try {
      let compsList = [];
      const empId = employeeId || 0;
      const empTypeParam = employeeType ? `?employeeType=${encodeURIComponent(employeeType)}` : '';
      try {
        const { data } = await axios.get(`/api/master/hr/employees/${empId}/payroll-components${empTypeParam}`);
        compsList = Array.isArray(data) ? data.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      } catch (err) {
        console.warn('Could not fetch employee-specific payroll components, falling back to global components', err);
      }
      if (compsList.length === 0) {
        const { data } = await axios.get('/api/payroll/components');
        compsList = Array.isArray(data) ? data.filter(c => c.isActive !== false).sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      }
      setActiveCompsList(compsList);

      // Build initialSalaryMap
      const initialSalaryMap = {};
      let hasSavedAmount = false;

      // 1. If we have a previously saved offer letter salary structure, restore those values first
      if (savedSalaryComponents && typeof savedSalaryComponents === 'object') {
        Object.assign(initialSalaryMap, savedSalaryComponents);
        hasSavedAmount = Object.keys(savedSalaryComponents).some(k => !['providentFund', 'esiAllowed', 'professionalTax'].includes(k) && parseFloat(savedSalaryComponents[k]) > 0);
      }

      // 2. Fill from component amounts (employee saved salary) where not already set
      compsList.forEach(c => {
        const code = c.componentCode;
        if (initialSalaryMap[code] === undefined) {
          if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
            initialSalaryMap[code] = parseFloat(c.amount).toFixed(2);
            hasSavedAmount = true;
          } else if (c.calculationType === 'FIXED') {
            initialSalaryMap[code] = parseFloat(c.calculationValue || 0).toFixed(2);
          } else {
            initialSalaryMap[code] = '0.00';
          }
        }
      });

      // 3. Resolve Salary Structure Toggles (Provident Fund, ESI, Professional Tax)
      // Hierarchy:
      // a) Saved in Job Profile (from Employee Master or ATS Final Process) or candidate
      // b) Explicitly saved in Offer Letter (savedSalaryComponents)
      // c) Default to true (Enabled)
      let resolvedPF = true;
      let resolvedESI = true;
      let resolvedPTAX = true;

      if (employeeId) {
        try {
          const { data: jp } = await axios.get(`/api/master/hr/employees/${employeeId}/job-profile`);
          if (jp) {
            if (jp.providentFund !== undefined && jp.providentFund !== null && jp.providentFund !== '') {
              resolvedPF = isValTrue(jp.providentFund);
            }
            if (jp.esiAllowed !== undefined && jp.esiAllowed !== null && jp.esiAllowed !== '') {
              resolvedESI = isValTrue(jp.esiAllowed);
            }
            if (jp.professionalTax !== undefined && jp.professionalTax !== null && jp.professionalTax !== '') {
              resolvedPTAX = isValTrue(jp.professionalTax);
            }

            // Also check dynamic components in job profile if initial amounts not yet set
            if (jp.dynamicComponents && typeof jp.dynamicComponents === 'string') {
              try {
                const dyn = JSON.parse(jp.dynamicComponents);
                if (dyn && typeof dyn === 'object') {
                  Object.keys(dyn).forEach(k => {
                    if (initialSalaryMap[k] === undefined || initialSalaryMap[k] === '0.00') {
                      initialSalaryMap[k] = parseFloat(dyn[k] || 0).toFixed(2);
                      if (parseFloat(dyn[k]) > 0) hasSavedAmount = true;
                    }
                  });
                }
              } catch (_) {}
            }
          }
        } catch (_) { /* Use defaults */ }
      }

      // Explicitly saved offer letter values override if present
      if (savedSalaryComponents && typeof savedSalaryComponents === 'object') {
        if (savedSalaryComponents.providentFund !== undefined && savedSalaryComponents.providentFund !== null) {
          resolvedPF = isValTrue(savedSalaryComponents.providentFund);
        }
        if (savedSalaryComponents.esiAllowed !== undefined && savedSalaryComponents.esiAllowed !== null) {
          resolvedESI = isValTrue(savedSalaryComponents.esiAllowed);
        }
        if (savedSalaryComponents.professionalTax !== undefined && savedSalaryComponents.professionalTax !== null) {
          resolvedPTAX = isValTrue(savedSalaryComponents.professionalTax);
        }
      }

      initialSalaryMap.providentFund = resolvedPF;
      initialSalaryMap.esiAllowed = resolvedESI;
      initialSalaryMap.professionalTax = resolvedPTAX;

      const evaluated = reevaluateAndBalanceComponents(initialSalaryMap, compsList, null, null);
      setLocalSalary(evaluated);
    } catch (err) {
      console.error('Failed to load payroll components for offer letter', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to load salary configuration.', variant: 'alert', severity: 'warning' }));
    } finally {
      setSalaryLoading(false);
    }
  }, [dispatch, isValTrue]);

  // Salary field change handler (reuses same pattern as ATS handleFieldChange)
  const handleSalaryFieldChange = useCallback((fieldName, val) => {
    const updatedSalary = { ...localSalary, [fieldName]: val };
    const reevaluated = reevaluateAndBalanceComponents(updatedSalary, activeCompsList, fieldName, null);
    setLocalSalary(reevaluated);
  }, [localSalary, activeCompsList]);

  // Toggle handler for PF/ESI/PTAX (same pattern as ATS handleToggleChange)
  const handleSalaryToggleChange = useCallback((name, value) => {
    const inputMap = {
      ...localSalary,
      providentFund: name === 'providentFund' ? value : localSalary.providentFund,
      esiAllowed: name === 'esiAllowed' ? value : localSalary.esiAllowed,
      professionalTax: name === 'professionalTax' ? value : localSalary.professionalTax
    };
    const reevaluated = reevaluateAndBalanceComponents(inputMap, activeCompsList, null, null);
    setLocalSalary(reevaluated);
  }, [localSalary, activeCompsList]);

  // Handle Employee Type change — dynamically reloads salary structure for that employee type (same as ATS InterviewFinalProcess)
  const handleEmploymentTypeChange = useCallback(async (newType) => {
    const typeStr = getDisplayString(newType);
    setEmploymentType(typeStr);

    const empId = selectedCandidate?.id || selectedCandidate?.employeeId || 0;
    try {
      setSalaryLoading(true);
      const empTypeParam = typeStr ? `?employeeType=${encodeURIComponent(typeStr)}` : '';
      let compsList = [];
      try {
        const { data } = await axios.get(`/api/master/hr/employees/${empId}/payroll-components${empTypeParam}`);
        compsList = Array.isArray(data) ? data.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      } catch (e) {
        console.warn('Could not fetch employee-type specific payroll components, falling back to global components', e);
      }

      if (compsList.length === 0) {
        const { data: globalData } = await axios.get('/api/payroll/components');
        compsList = Array.isArray(globalData) ? globalData.filter(c => c.isActive !== false).sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0)) : [];
      }
      setActiveCompsList(compsList);

      // Re-evaluate salary structure with the new components, preserving entered manual amounts if present
      const resetSalaryMap = {};
      compsList.forEach(c => {
        let val = '0.00';
        if (localSalary[c.componentCode] !== undefined && parseFloat(localSalary[c.componentCode]) > 0 && c.calculationType === 'MANUAL') {
          val = parseFloat(localSalary[c.componentCode]).toFixed(2);
        } else if (c.amount !== null && c.amount !== undefined && parseFloat(c.amount) > 0) {
          val = parseFloat(c.amount).toFixed(2);
        } else if (c.calculationType === 'FIXED') {
          val = parseFloat(c.calculationValue || 0).toFixed(2);
        }
        resetSalaryMap[c.componentCode] = val;
      });

      // Retain the current toggle states (Provident Fund, ESI, Professional Tax)
      resetSalaryMap.providentFund = isPFEnabled;
      resetSalaryMap.esiAllowed = isESIEnabled;
      resetSalaryMap.professionalTax = isPTaxEnabled;

      const evaluatedSalary = reevaluateAndBalanceComponents(resetSalaryMap, compsList, null, null);
      setLocalSalary(evaluatedSalary);
    } catch (err) {
      console.error('Failed to reload payroll components for employee type', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to update salary components for employee type.', variant: 'alert', severity: 'warning' }));
    } finally {
      setSalaryLoading(false);
    }
  }, [selectedCandidate, localSalary, isPFEnabled, isESIEnabled, isPTaxEnabled, dispatch]);

  // Salary Component Change Log State
  const [salaryChangeLogOpen, setSalaryChangeLogOpen] = useState(false);
  const [salaryChangeLogLoading, setSalaryChangeLogLoading] = useState(false);
  const [salaryChangeLog, setSalaryChangeLog] = useState([]);

  const formatDateTime = useCallback((dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy hh:mm a');
    } catch {
      return dateStr;
    }
  }, []);

  // Auto Calculate — identical logic to ATS InterviewFinalProcess handleAutoCalculate
  const handleAutoCalculate = useCallback(async () => {
    try {
      const { data: designationLevels } = await axios.get('/api/master/hr/designation-levels');
      const levelsList = Array.isArray(designationLevels) ? designationLevels : [];

      let matchedLevel = null;
      // 1. Match by candidate's empLevelId or grade
      if (selectedCandidate?.empLevelId) {
        matchedLevel = levelsList.find(l => String(l.rowId || l.id) === String(selectedCandidate.empLevelId) || l.level === selectedCandidate.empLevelId);
      }
      // 2. Match by Grade / Band field
      if (!matchedLevel && grade) {
        matchedLevel = levelsList.find(l => String(l.level || '').trim().toUpperCase() === String(grade).trim().toUpperCase() || String(l.rowId || l.id) === String(grade));
      }
      // 3. Match by Designation
      if (!matchedLevel && designation) {
        try {
          const { data: desigData } = await axios.get('/api/master/hr/designations');
          const dList = Array.isArray(desigData) ? desigData : [];
          const desigObj = dList.find(d => String(d.designationName || d.name || '').trim().toUpperCase() === String(designation).trim().toUpperCase());
          if (desigObj && (desigObj.subCategoryLevel || desigObj.level)) {
            const targetLvl = desigObj.subCategoryLevel || desigObj.level;
            matchedLevel = levelsList.find(l => l.level === targetLvl || String(l.rowId || l.id) === String(targetLvl));
          }
        } catch (_) { }
      }

      if (!matchedLevel) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Designation Level details not found for this candidate / designation.',
            variant: 'alert',
            severity: 'warning'
          })
        );
        return;
      }

      const nextForm = { ...localSalary };
      activeCompsList.forEach(c => {
        const code = c.componentCode;
        if (c.calculationType === 'MANUAL') {
          if (code === 'BASIC') {
            nextForm['BASIC'] = String(matchedLevel.basic || 0);
          } else if (code === 'HRA') {
            nextForm['HRA'] = String(matchedLevel.hra || 0);
          } else if (code === 'DA') {
            nextForm['DA'] = String(matchedLevel.da || 0);
          }
        }
      });

      // Pass toggle states
      nextForm.providentFund = isPFEnabled;
      nextForm.esiAllowed = isESIEnabled;
      nextForm.professionalTax = isPTaxEnabled;

      const reevaluated = reevaluateAndBalanceComponents(nextForm, activeCompsList, 'BASIC', null);
      setLocalSalary(reevaluated);

      dispatch(
        openSnackbar({
          open: true,
          message: `Salary structure auto-calculated successfully based on Level ${matchedLevel.level || 'N/A'}!`,
          variant: 'alert',
          severity: 'success'
        })
      );
    } catch (err) {
      console.error("Auto calculate error:", err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error fetching designation level configurations.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  }, [selectedCandidate, grade, designation, localSalary, activeCompsList, isPFEnabled, isESIEnabled, isPTaxEnabled, dispatch]);

  // Salary Component Audit History — identical API/handler to Employee Master & ATS InterviewFinalProcess
  const handleOpenSalaryChangeLog = useCallback(async () => {
    const candidateId = selectedCandidate?.id || (selectedCandidate?.applicantId ? selectedCandidate.applicantId : null);
    if (!candidateId && !editingId) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a candidate / employee first to view salary audit history.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }

    setSalaryChangeLogOpen(true);
    setSalaryChangeLogLoading(true);
    try {
      const targetId = candidateId || editingId;
      const { data } = await axios.get(`/api/master/hr/employees/${targetId}/salary-history`);
      const logs = Array.isArray(data) ? data : [];
      const filteredLogs = logs.filter(log => {
        const match = activeCompsList.find(c => (c.componentCode || '').trim().toUpperCase() === (log.componentCode || '').trim().toUpperCase());
        if (match) {
          return match.showInRegister === true || String(match.showInRegister) === 'true' || match.showInRegister === 1 || String(match.showInRegister) === '1' || match.showInRegister === undefined;
        }
        return true;
      });
      setSalaryChangeLog(filteredLogs);
    } catch (e) {
      console.error('Failed to load salary change log', e);
      setSalaryChangeLog([]);
    } finally {
      setSalaryChangeLogLoading(false);
    }
  }, [selectedCandidate, editingId, activeCompsList, dispatch]);

  // Handle Candidate Selection from Dropdown (with Concurrency Protection)
  const handleSelectCandidate = async (candidateOrId) => {
    const currentSeq = ++candidateRequestSeqRef.current;
    let candidate = null;
    if (candidateOrId && typeof candidateOrId === 'object') {
      candidate = candidateOrId;
    } else if (candidateOrId) {
      candidate = candidates.find(c => String(c.id) === String(candidateOrId) || String(c.applicantCode) === String(candidateOrId)) || { id: candidateOrId };
    }

    if (!candidate) {
      setSelectedCandidate(null);
      setCandidateName('');
      setCandidateCode('');
      setEmail('');
      setPhone('');
      setGender('');
      setDob('');
      setDepartment('');
      setDesignation('');
      setWorkLocation('');
      setEmploymentType('');
      setGrade('');
      return;
    }

    setSelectedCandidate(candidate);

    // Reset previous person's values immediately to prevent stale data
    setCandidateName('');
    setCandidateCode('');
    setEmail('');
    setPhone('');
    setGender('');
    setDob('');
    setDepartment('');
    setDesignation('');
    setWorkLocation('');
    setEmploymentType('');
    setGrade('');

    try {
      let fullData = { ...candidate };
      if (candidate.id) {
        try {
          const { data: full } = await axios.get(`/api/hra/applicants/${candidate.id}`);
          if (currentSeq !== candidateRequestSeqRef.current) return;
          if (full) fullData = { ...fullData, ...full };
        } catch (e) { }

        try {
          const { data: empMaster } = await axios.get(`/api/master/hr/employees/${candidate.id}`);
          if (currentSeq !== candidateRequestSeqRef.current) return;
          if (empMaster) fullData = { ...fullData, ...empMaster };
        } catch (e) { }
      }

      if (currentSeq !== candidateRequestSeqRef.current) return;

      const nameVal = getDisplayString(fullData.employeeName || fullData.applicantName || fullData.candidateName);
      const codeVal = getDisplayString(fullData.applicantCode || fullData.enRolledNo || fullData.empCode || (candidate.id ? `APP-${candidate.id}` : ''));
      const emailVal = resolveCandidateEmail(fullData) || resolveCandidateEmail(candidate) || '';
      const phoneVal = getDisplayString(fullData.mobileNo || fullData.phone || fullData.mobile);
      const genderVal = normalizeGender(fullData.gender || fullData.sex || candidate.gender);
      const rawDob = fullData.birthDate || fullData.dob || fullData.dateOfBirth || fullData.birth_date || fullData.personal?.birthDate || fullData.personalDetail?.birthDate || fullData.personal?.dob || candidate.birthDate || candidate.dob || candidate.dateOfBirth || '';
      const dobVal = extractDateString(rawDob);
      const deptVal = getDisplayString(fullData.departmentName || fullData.department);
      const roleVal = getDisplayString(fullData.designationName || fullData.designation || fullData.positionLookFor || fullData.appliedRole);

      // Intelligent Resolution of Employee Type from ATS Interview Final Process / Employee Master
      let empTypeVal = '';
      const jobObj = fullData.jobProfile || fullData.job || fullData.jobDetails || {};
      const orgObj = fullData.organization || {};

      if (fullData.employmentType) {
        empTypeVal = typeof fullData.employmentType === 'object' ? (fullData.employmentType.typeName || fullData.employmentType.name || fullData.employmentType.type_name) : fullData.employmentType;
      } else if (fullData.employeeType) {
        empTypeVal = typeof fullData.employeeType === 'object' ? (fullData.employeeType.typeName || fullData.employeeType.name || fullData.employeeType.type_name) : fullData.employeeType;
      } else if (jobObj.employmentType) {
        empTypeVal = typeof jobObj.employmentType === 'object' ? (jobObj.employmentType.typeName || jobObj.employmentType.name || jobObj.employmentType.type_name) : jobObj.employmentType;
      } else if (jobObj.employeeType) {
        empTypeVal = typeof jobObj.employeeType === 'object' ? (jobObj.employeeType.typeName || jobObj.employeeType.name || jobObj.employeeType.type_name) : jobObj.employeeType;
      } else if (orgObj.employmentType) {
        empTypeVal = typeof orgObj.employmentType === 'object' ? (orgObj.employmentType.typeName || orgObj.employmentType.name || orgObj.employmentType.type_name) : orgObj.employmentType;
      } else if (orgObj.employeeType) {
        empTypeVal = typeof orgObj.employeeType === 'object' ? (orgObj.employeeType.typeName || orgObj.employeeType.name || orgObj.employeeType.type_name) : orgObj.employeeType;
      }

      // Check employeeTypeId saved from Interview Final Process / Employee Master against Employee Type Master
      const targetTypeId = fullData.employeeTypeId || candidate.employeeTypeId || jobObj.employeeTypeId || orgObj.employeeTypeId || fullData.employmentTypeId || jobObj.employmentTypeId;
      if (!empTypeVal && targetTypeId) {
        const masterList = employeeTypesMasterRef.current?.length > 0 ? employeeTypesMasterRef.current : employeeTypesMaster;
        const matchingType = masterList.find(t => String(t.id) === String(targetTypeId));
        if (matchingType) {
          empTypeVal = getDisplayString(matchingType.typeName || matchingType.name || matchingType.type_name);
        } else {
          try {
            const { data: singleType } = await axios.get(`/api/master/hr/employee-types/${targetTypeId}`);
            if (singleType) {
              empTypeVal = getDisplayString(singleType.typeName || singleType.name || singleType.type_name);
            }
          } catch (e) { }
        }
      }

      if (!empTypeVal) {
        empTypeVal = fullData.empType || fullData.jobType || fullData.engagementType || fullData.hiringType || candidate.employmentType || candidate.employeeType || '';
      }
      empTypeVal = getDisplayString(empTypeVal);

      const gradeVal = getDisplayString(fullData.grade || fullData.gradeName);
      const locVal = getDisplayString(fullData.workLocation || fullData.location);
      const photoVal = fullData.candidatePhoto || fullData.employeePhotoUpload || fullData.photoUpload || fullData.photo || fullData.profileUpload || fullData.photoPath || fullData.profileImage || candidate.candidatePhoto || candidate.employeePhotoUpload || candidate.photo || '';

      setCandidateName(nameVal);
      setCandidateCode(codeVal);
      setEmail(emailVal);
      setPhone(phoneVal);
      setGender(genderVal);
      setDob(dobVal);
      setCandidatePhoto(photoVal);
      setDepartment(deptVal);
      setDesignation(roleVal);
      setEmploymentType(empTypeVal);
      setGrade(gradeVal);
      setWorkLocation(locVal);

      // Resolve initial salary components and toggles from candidate/employee
      let initialCandidateSalary = {};
      if (fullData.salaryComponents) {
        try {
          const sc = typeof fullData.salaryComponents === 'string' ? JSON.parse(fullData.salaryComponents) : fullData.salaryComponents;
          if (sc && typeof sc === 'object') Object.assign(initialCandidateSalary, sc);
        } catch (_) {}
      }
      const pfVal = fullData.providentFund !== undefined ? fullData.providentFund : (candidate.providentFund !== undefined ? candidate.providentFund : fullData.jobProfile?.providentFund);
      const esiVal = fullData.esiAllowed !== undefined ? fullData.esiAllowed : (candidate.esiAllowed !== undefined ? candidate.esiAllowed : fullData.jobProfile?.esiAllowed);
      const ptaxVal = fullData.professionalTax !== undefined ? fullData.professionalTax : (candidate.professionalTax !== undefined ? candidate.professionalTax : fullData.jobProfile?.professionalTax);
      if (pfVal !== undefined && pfVal !== null) initialCandidateSalary.providentFund = pfVal;
      if (esiVal !== undefined && esiVal !== null) initialCandidateSalary.esiAllowed = esiVal;
      if (ptaxVal !== undefined && ptaxVal !== null) initialCandidateSalary.professionalTax = ptaxVal;

      // Load dynamic payroll components for this candidate
      await loadPayrollComponents(candidate.id, empTypeVal, Object.keys(initialCandidateSalary).length > 0 ? initialCandidateSalary : null);

      if (nameVal) {
        dispatch(openSnackbar({
          open: true,
          message: `Loaded profile for ${nameVal} from ${fullData.sourceTag || 'ATS / Employee Master'}.`,
          variant: 'alert',
          severity: 'success'
        }));
      }
    } catch (err) {
      console.error("Failed to populate candidate details", err);
    }
  };

  // Start New Offer Letter Form View
  const handleOpenAdd = async () => {
    setDialogMode('add');
    setEditingId(null);

    let nextNo = '';
    try {
      const res = await axios.get('/api/hra/letters/next-no');
      if (res?.data?.offerLetterNo) {
        nextNo = res.data.offerLetterNo;
      }
    } catch (e) {
      console.warn('Could not fetch next offer letter no from API', e);
    }

    if (!nextNo) {
      dispatch(openSnackbar({
        open: true,
        message: 'Could not allocate the next Offer Letter number. Fill the form and retry save after the sequence is available.',
        variant: 'alert',
        severity: 'warning'
      }));
    }

    setRefNo(nextNo);
    setOfferLetterNo(nextNo);
    setOfferDate(format(new Date(), 'yyyy-MM-dd'));

    setSelectedCandidate(null);
    setCandidateName('');
    setCandidateCode('');
    setEmail('');
    setPhone('');
    setGender('');
    setDob('');
    setDepartment('');
    setDesignation('');
    setWorkLocation('');
    setEmploymentType('');
    setGrade('');
    setJoiningDate(format(new Date(), 'yyyy-MM-dd'));
    setProbationPeriod('');


    // Initialize Employment Terms & Clauses as completely empty for manual entry
    setTerms({
      workingHours: '',
      workingDays: '',
      noticePeriod: '',
      leavePolicy: '',
      confidentialityClause: '',
      bgvClause: '',
      otherTerms: ''
    });

    setActiveCompsList([]);
    setLocalSalary({});
    setCustomSections(null);
    // Load global payroll components for new empty offer letter
    loadPayrollComponents(null, null, null);

    clearErrors();
    setViewMode('new');
  };

  // Clear Form Inputs (SOP Requirement)
  const handleClearForm = () => {
    setSelectedCandidate(null);
    setCandidateName('');
    setCandidateCode('');
    setEmail('');
    setPhone('');
    setGender('');
    setDob('');
    setCandidatePhoto('');
    setDepartment('');
    setDesignation('');
    setWorkLocation('');
    setEmploymentType('');
    setGrade('');
    setJoiningDate(format(new Date(), 'yyyy-MM-dd'));
    setProbationPeriod('');


    setTerms({
      workingHours: '',
      workingDays: '',
      noticePeriod: '',
      leavePolicy: '',
      confidentialityClause: '',
      bgvClause: '',
      otherTerms: ''
    });

    setActiveCompsList([]);
    setLocalSalary({});
    setCustomSections(null);
    clearErrors();
    setLockVersion(0);
    setStatusId(null);
    setTemplateId(null);
    loadPayrollComponents(null, null, null);
  };

  // Handle Edit / Double Click Row
  const handleDoubleClickRow = useCallback(async (record) => {
    setDialogMode('edit');
    setEditingId(record.id);
    setRefNo(record.refNo);
    setOfferLetterNo(record.offerLetterNo);
    setCandidateName(getDisplayString(record.candidateName));
    setCandidateCode(getDisplayString(record.applicantCode));
    setDepartment(getDisplayString(record.department));
    setDesignation(getDisplayString(record.designation));
    setEmploymentType(getDisplayString(record.employmentType));
    setWorkLocation(getDisplayString(record.workLocation));
    setOfferDate(record.offerDate || format(new Date(), 'yyyy-MM-dd'));
    setJoiningDate(record.joiningDate || '');

    let full = record.fullRecord || {};
    let resolvedEmail = '';
    let parsedFormData = {};

    if (record.id) {
      try {
        const { data: detail } = await axios.get(`/api/hra/letters/${record.id}`);
        if (detail) {
          if (detail.formData) {
            try {
              parsedFormData = typeof detail.formData === 'string' ? JSON.parse(detail.formData) : detail.formData;
            } catch (_) {}
          }

          const targetCandidateCode = getDisplayString(detail.employeeCode || record.applicantCode || record.employeeCode || parsedFormData.candidateCode || parsedFormData.applicantCode);
          const targetCandidateName = getDisplayString(detail.employeeName || record.candidateName || parsedFormData.candidateName);
          const candidateMatch = candidates.find(c =>
            (targetCandidateCode && (c.applicantCode === targetCandidateCode || c.empCode === targetCandidateCode || c.candidateCode === targetCandidateCode || c.employeeCode === targetCandidateCode)) ||
            (targetCandidateName && (c.candidateName === targetCandidateName || c.applicantName === targetCandidateName || c.employeeName === targetCandidateName))
          );

          resolvedEmail = resolveCandidateEmail(parsedFormData) ||
            resolveCandidateEmail(detail) ||
            resolveCandidateEmail(record) ||
            (candidateMatch ? resolveCandidateEmail(candidateMatch) : '') ||
            '';

          const empOrAppId = detail.applicantId || record.applicantId || (candidateMatch ? candidateMatch.id : null);
          if (!resolvedEmail && empOrAppId) {
            try {
              const [empRes, appRes] = await Promise.allSettled([
                axios.get(`/api/master/hr/employees/${empOrAppId}`),
                axios.get(`/api/hra/applicants/${empOrAppId}`)
              ]);
              if (empRes.status === 'fulfilled' && empRes.value?.data) {
                resolvedEmail = resolveCandidateEmail(empRes.value.data) || resolvedEmail;
              }
              if (!resolvedEmail && appRes.status === 'fulfilled' && appRes.value?.data) {
                resolvedEmail = resolveCandidateEmail(appRes.value.data) || resolvedEmail;
              }
            } catch (_) {}
          }

          full = { ...detail, ...parsedFormData, email: resolvedEmail };
        }
      } catch (e) {
        console.warn('Failed to fetch offer letter full detail', e);
      }
    }

    if (!resolvedEmail) {
      resolvedEmail = resolveCandidateEmail(full) || resolveCandidateEmail(record) || '';
    }

    setLockVersion(full.lockVersion ?? record.lockVersion ?? 0);
    setStatusId(full.statusId ?? record.statusId ?? null);
    setTemplateId(full.templateId ?? record.templateId ?? null);

    setEmail(resolvedEmail);
    if (full.phone) setPhone(getDisplayString(full.phone));
    if (full.gender) setGender(normalizeGender(full.gender));
    if (full.dob || full.birthDate || full.dateOfBirth) setDob(extractDateString(full.dob || full.birthDate || full.dateOfBirth));
    const recordPhoto = full.candidatePhoto || full.employeePhotoUpload || full.photoUpload || full.photo || full.profileUpload || full.photoPath || full.profileImage || record.candidatePhoto || record.photo || '';
    setCandidatePhoto(recordPhoto);
    if (full.grade) setGrade(getDisplayString(full.grade));
    if (full.probationPeriod !== undefined) setProbationPeriod(full.probationPeriod);

    const resolvedWorkLocation = getDisplayString(full.workLocation || record.workLocation || full.location || record.location || '');
    setWorkLocation(resolvedWorkLocation);
    const resolvedDept = getDisplayString(full.department || record.department || '');
    if (resolvedDept) setDepartment(resolvedDept);
    const resolvedRole = getDisplayString(full.designation || record.designation || '');
    if (resolvedRole) setDesignation(resolvedRole);
    const resolvedEmpType = getDisplayString(full.employmentType || record.employmentType || '');
    if (resolvedEmpType) setEmploymentType(resolvedEmpType);

    // Ensure currently editing candidate is preserved in selectedCandidate
    const currentCandidateObj = {
      id: record.applicantId || record.employeeId || full.applicantId || full.employeeId || record.id,
      candidateName: record.candidateName || full.candidateName || full.employeeName || '',
      applicantName: record.candidateName || full.candidateName || full.employeeName || '',
      applicantCode: record.applicantCode || full.applicantCode || full.empCode || '',
      email: resolvedEmail,
      phone: full.phone || full.mobileNo || record.phone || '',
      gender: full.gender || record.gender || '',
      dob: full.dob || full.birthDate || record.dob || '',
      candidatePhoto: recordPhoto,
      photo: recordPhoto,
      employeePhotoUpload: recordPhoto,
      sourceTag: full.sourceTag || record.sourceTag || 'ATS',
      ...full,
      department: resolvedDept,
      designation: resolvedRole,
      employmentType: resolvedEmpType,
      workLocation: resolvedWorkLocation
    };
    setSelectedCandidate(currentCandidateObj);

    const resolvedNoticePeriod = getDisplayString(full.noticePeriod || record.noticePeriod || full.terms?.noticePeriod || record.terms?.noticePeriod || '');
    if (full.terms && typeof full.terms === 'object') {
      setTerms({
        workingHours: getDisplayString(full.terms.workingHours),
        workingDays: getDisplayString(full.terms.workingDays),
        noticePeriod: resolvedNoticePeriod,
        leavePolicy: getDisplayString(full.terms.leavePolicy),
        confidentialityClause: getDisplayString(full.terms.confidentialityClause),
        bgvClause: getDisplayString(full.terms.bgvClause),
        otherTerms: getDisplayString(full.terms.otherTerms)
      });
    } else {
      setTerms({
        workingHours: getDisplayString(full.workingHours || ''),
        workingDays: getDisplayString(full.workingDays || ''),
        noticePeriod: resolvedNoticePeriod,
        leavePolicy: getDisplayString(full.leavePolicy || ''),
        confidentialityClause: getDisplayString(full.confidentialityClause || ''),
        bgvClause: getDisplayString(full.bgvClause || ''),
        otherTerms: getDisplayString(full.otherTerms || '')
      });
    }

    // Restore dynamic salary: prefer new salaryComponents map; fall back to legacy fields for backward compatibility
    let savedSalaryComponents = {};
    if (full.compensation) {
      if (full.compensation.salaryComponents && typeof full.compensation.salaryComponents === 'object') {
        savedSalaryComponents = { ...full.compensation.salaryComponents };
      } else {
        // Backward compatibility: map old fixed fields to component codes
        if (full.compensation.basicPay) savedSalaryComponents['BASIC'] = String(full.compensation.basicPay);
        if (full.compensation.hraPay) savedSalaryComponents['HRA'] = String(full.compensation.hraPay);
        if (full.compensation.specialAllowance) savedSalaryComponents['SPECIAL_ALLOWANCE'] = String(full.compensation.specialAllowance);
        if (full.compensation.bonusPay) savedSalaryComponents['BONUS'] = String(full.compensation.bonusPay);
        if (full.compensation.variablePay) savedSalaryComponents['VARIABLE_PAY'] = String(full.compensation.variablePay);
        if (full.compensation.otherAllowances) savedSalaryComponents['OTHER_ALLOWANCES'] = String(full.compensation.otherAllowances);
      }

      if (full.compensation.providentFund !== undefined && full.compensation.providentFund !== null) {
        savedSalaryComponents.providentFund = full.compensation.providentFund;
      }
      if (full.compensation.esiAllowed !== undefined && full.compensation.esiAllowed !== null) {
        savedSalaryComponents.esiAllowed = full.compensation.esiAllowed;
      }
      if (full.compensation.professionalTax !== undefined && full.compensation.professionalTax !== null) {
        savedSalaryComponents.professionalTax = full.compensation.professionalTax;
      }
    }

    // Resolve actual employee/applicant ID (not the offer letter's record.id)
    const candidateMatch = candidates.find(c =>
      (record.applicantCode && (c.applicantCode === record.applicantCode || c.empCode === record.applicantCode || c.candidateCode === record.applicantCode)) ||
      (record.candidateName && c.candidateName === record.candidateName)
    );
    const resolvedEmployeeId = record.applicantId || record.employeeId || full.applicantId || full.employeeId || (candidateMatch ? candidateMatch.id : null);

    const empType = getDisplayString(record.employmentType);
    setCustomSections(full.sections && Array.isArray(full.sections) ? full.sections : null);
    loadPayrollComponents(resolvedEmployeeId, empType, Object.keys(savedSalaryComponents).length > 0 ? savedSalaryComponents : null);
    setDialogOpen(true);
  }, [candidates, loadPayrollComponents]);

  // Save Handler
  const handleSave = async () => {
    if (isReadOnly) return;

    const validationRules = {
      candidateName: { value: candidateName, required: true, label: 'Candidate / Employee Name' },
      department: { value: department, required: true, label: 'Department' },
      designation: { value: designation, required: true, label: 'Designation' },
      email: { value: email, required: true, email: true, label: 'Email ID' },
      phone: { value: phone, required: true, type: 'phone', label: 'Mobile Number' }
    };

    if (!validate(validationRules)) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please complete all required fields correctly.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    const normalizedGross = Math.round(Number(grossVal || 0) * 100) / 100;
    const normalizedAnnualCtc = Math.round(Number(totalCTC || 0) * 100) / 100;
    const normalizedNet = Math.round(Number(netVal || 0) * 100) / 100;
    const normalizedMonthlyCtc = Math.round(Number(ctcVal || 0) * 100) / 100;

    const payload = {
      id: editingId,
      letterType: 'OFFER_LETTER',
      refNo,
      letterDate: new Date(offerDate),
      applicantId: selectedCandidate?.id || selectedCandidate?.applicantId || null,
      employeeCode: candidateCode || selectedCandidate?.applicantCode || selectedCandidate?.empCode || null,
      employeeName: getDisplayString(candidateName),
      email: getDisplayString(email),
      phone: getDisplayString(phone),
      departmentId: selectedCandidate?.departmentId || null,
      department: getDisplayString(department),
      designationId: selectedCandidate?.designationId || null,
      designation: getDisplayString(designation),
      employmentType: getDisplayString(employmentType),
      workLocation: getDisplayString(workLocation),
      grade: getDisplayString(grade),
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      probationPeriodMonths: probationPeriod ? parseInt(probationPeriod, 10) : null,
      noticePeriod: getDisplayString(terms?.noticePeriod || ''),
      grossSalary: normalizedGross,
      annualCtc: normalizedAnnualCtc,
      netSalary: normalizedNet,
      monthlyCtc: normalizedMonthlyCtc,
      templateId: templateId || null,
      statusId: statusId || null,
      lockVersion: lockVersion || 0,
      formData: JSON.stringify({
        refNo,
        offerLetterNo,
        candidateName: getDisplayString(candidateName),
        candidateCode: getDisplayString(candidateCode),
        email: getDisplayString(email),
        phone: getDisplayString(phone),
        gender: getDisplayString(gender),
        dob,
        offerDate,
        joiningDate,
        probationPeriod,
        workLocation: getDisplayString(workLocation),
        department: getDisplayString(department),
        designation: getDisplayString(designation),
        employmentType: getDisplayString(employmentType),
        grade: getDisplayString(grade),
        companyInfo: (customSections?.companyInfo && Object.keys(customSections.companyInfo).length > 0) ? customSections.companyInfo : (companyInfo || {}),
        compensation: {
          components: activeCompsList.map(c => ({
            componentCode: c.componentCode,
            componentName: c.componentName,
            displayName: c.displayName,
            componentType: c.componentType,
            calculationType: c.calculationType,
            calculationValue: c.calculationValue,
            sequenceNo: c.sequenceNo,
            showInRegister: c.showInRegister,
            isActive: c.isActive
          })),
          salaryComponents: (() => {
            const map = {};
            activeCompsList.forEach(c => {
              if (localSalary[c.componentCode] !== undefined) {
                map[c.componentCode] = String(localSalary[c.componentCode]);
              }
            });
            Object.entries(localSalary).forEach(([k, v]) => {
              if (v !== undefined && v !== null) {
                map[k] = v;
              }
            });
            return map;
          })(),
          providentFund: localSalary.providentFund,
          esiAllowed: localSalary.esiAllowed,
          professionalTax: localSalary.professionalTax,
          grossSalary: normalizedGross,
          totalDeductions: Math.round(Number(deductionsVal || 0) * 100) / 100,
          totalContributions: Math.round(Number(contributionsVal || 0) * 100) / 100,
          netSalary: normalizedNet,
          monthlyCtc: normalizedMonthlyCtc,
          annualCTC: normalizedAnnualCtc,
          totalCTC: normalizedAnnualCtc
        },
        terms,
        sections: resolveEffectiveSections(customSections),
        emailStatus: 'Not Sent'
      })
    };

    try {
      await axios.post('/api/hra/letters', payload);
      dispatch(openSnackbar({
        open: true,
        message: 'Offer Letter saved successfully!',
        variant: 'alert',
        severity: 'success'
      }));
      fetchOfferLetters();
      setViewMode('list');
      setDialogOpen(false);
    } catch (err) {
      const apiMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      dispatch(openSnackbar({
        open: true,
        message: err.response?.status === 409
          ? (apiMessage || 'This Offer Letter was updated by another user. Please reload and try again.')
          : (apiMessage || 'Failed to save Offer Letter. Please try again.'),
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  // Delete Prompt & Execution
  const handlePromptDelete = useCallback((record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await axios.delete(`/api/hra/letters/${recordToDelete.id}`);
      setRows(prev => prev.filter(i => i.id !== recordToDelete.id));
      dispatch(openSnackbar({
        open: true,
        message: `Offer Letter ${recordToDelete.refNo} deleted.`,
        variant: 'alert',
        severity: 'success'
      }));
    } catch (e) {
      dispatch(openSnackbar({
        open: true,
        message: e.response?.data?.message || `Failed to delete Offer Letter ${recordToDelete.refNo}.`,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  // Download PDF via clean offscreen render
  const handleDownloadPreviewPDF = async () => {
    if (!previewRecord || isDownloadingPDF) return;
    try {
      setIsDownloadingPDF(true);
      const model = buildOfferLetterDocumentModel(previewRecord, {
        customSections,
        companyInfo,
        signatoryData: { hrName: loggedInUserName, hrDesignation: loggedInUserDesignation },
        activeCompsList
      });

      const ref = getDisplayString(model.candidateData.applicantCode || model.candidateData.refNo || 'Candidate').replaceAll(/[^a-zA-Z0-9_.-]/g, '_');
      const filename = `Offer_Letter_${ref}`;

      const artifact = await exportOfferLetterToPdf(model, filename);
      setLastGeneratedPdfArtifact(artifact);

      dispatch(openSnackbar({
        open: true,
        message: 'Offer Letter PDF downloaded successfully.',
        variant: 'alert',
        severity: 'success'
      }));
    } catch (e) {
      console.error('PDF download error', e);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to download PDF.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Clean Direct Print Handler with Loading State
  const handlePrintPreview = async () => {
    if (!previewRecord || isPrinting) return;
    try {
      setIsPrinting(true);
      const full = previewRecord.fullRecord || {};
      const comp = full.compensation || previewRecord.compensation || {};

      const resolvedCompanyData = (full.companyInfo && Object.keys(full.companyInfo).length > 0)
        ? full.companyInfo
        : (previewRecord.companyInfo && Object.keys(previewRecord.companyInfo).length > 0)
          ? previewRecord.companyInfo
          : (companyInfo || {});

      const resolvedSignatoryData = {
        hrName: resolvedCompanyData.hrName || full.signatoryName || previewRecord.signatoryName || loggedInUserName || '',
        hrDesignation: resolvedCompanyData.hrDesignation || full.signatoryDesignation || previewRecord.signatoryDesignation || loggedInUserDesignation || 'HR Manager'
      };

      const cleanHtml = buildCleanOfferLetterHtml({
        candidateData: {
          candidateName: previewRecord.candidateName || full.candidateName,
          applicantCode: previewRecord.applicantCode || full.applicantCode,
          email: previewRecord.email || full.email,
          phone: previewRecord.phone || full.phone,
          gender: previewRecord.gender || full.gender,
          dob: previewRecord.dob || full.dob,
          department: previewRecord.department || full.department,
          designation: previewRecord.designation || full.designation,
          employmentType: previewRecord.employmentType || full.employmentType,
          workLocation: getDisplayString(previewRecord.workLocation || full.workLocation || (full.formData && typeof full.formData === 'object' ? full.formData.workLocation : '') || ''),
          grade: previewRecord.grade || full.grade,
          offerLetterNo: previewRecord.offerLetterNo || previewRecord.refNo,
          refNo: previewRecord.refNo,
          offerDate: previewRecord.offerDate,
          joiningDate: previewRecord.joiningDate,
          probationPeriod: previewRecord.probationPeriod || full.probationPeriod
        },
        companyData: resolvedCompanyData,
        signatoryData: resolvedSignatoryData,
        salaryData: {
          gross: Number(comp.grossSalary || 0),
          monthlyCtc: Number(comp.monthlyCtc || (Number(comp.grossSalary || 0) + Number(comp.totalContributions || 0)) || 0),
          annualCtc: Number(previewRecord.totalCTC || previewRecord.annualCtc || comp.annualCTC || comp.totalCTC || 0),
          ctc: Number(previewRecord.totalCTC || previewRecord.annualCtc || comp.annualCTC || comp.totalCTC || 0),
          salaryComponents: comp.salaryComponents || {}
        },
        compsList: comp.components || activeCompsList,
        activeCompsList: comp.components || activeCompsList,
        sections: resolveEffectiveSections(customSections || full.sections || previewRecord.sections),
        localSalary: comp.salaryComponents || {},
        grossVal: Number(comp.grossSalary || 0),
        deductionsVal: Number(comp.totalDeductions || 0),
        contributionsVal: Number(comp.totalContributions || 0),
        netVal: Number(comp.netSalary || 0),
        ctcVal: Number(comp.monthlyCtc || (Number(comp.grossSalary || 0) + Number(comp.totalContributions || 0)) || 0),
        annualCtc: Number(previewRecord.totalCTC || previewRecord.annualCtc || comp.annualCTC || comp.totalCTC || 0)
      });

      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offer Letter Print - ${previewRecord.candidateName || 'Candidate'}</title>
            <style>
              @page { size: A4 portrait; margin: 0; }
              body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${cleanHtml}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
          setIsPrinting(false);
        }, 1000);
      }, 500);
    } catch (e) {
      console.error('Print error', e);
      setIsPrinting(false);
      window.print();
    }
  };

  // Filter Rows for Data Table
  const filteredRows = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return rows.filter((row) => {
      const candName = getDisplayString(row.candidateName).toLowerCase();
      const offerNo = getDisplayString(row.offerLetterNo).toLowerCase();
      const ref = getDisplayString(row.refNo).toLowerCase();
      const appCode = getDisplayString(row.applicantCode).toLowerCase();
      const dept = getDisplayString(row.department).toLowerCase();

      const matchSearch = !q ||
        candName.includes(q) ||
        offerNo.includes(q) ||
        ref.includes(q) ||
        appCode.includes(q) ||
        dept.includes(q);

      const deptFilter = globalFilters.department || 'ALL';
      const matchDept = deptFilter === 'ALL' || getDisplayString(row.department) === deptFilter;

      const statusFilter = globalFilters.status || 'ALL';
      const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;

      const matchDate = matchDateRange(row, globalFilters, 'offerDate');

      const candFilter = globalFilters.candidateName || '';
      const matchCand = !candFilter || candName.includes(candFilter.toLowerCase());

      const codeFilter = globalFilters.applicantCode || '';
      const matchCode = !codeFilter || appCode.includes(codeFilter.toLowerCase());

      return matchSearch && matchDept && matchStatus && matchDate && matchCand && matchCode;
    }).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, searchQuery, globalFilters]);

  // Overview Data Table Columns Configuration
  const columns = useMemo(() => [
    { id: 'index', label: 'No', minWidth: 55, align: 'center' },
    {
      id: 'attachment',
      label: 'Doc',
      minWidth: 70,
      align: 'center',
      render: (row) => (
        <IconButton size="small" color="primary" onClick={() => handleOpenPreview(row)}>
          <IconPaperclip size={18} />
        </IconButton>
      )
    },
    { id: 'offerLetterNo', label: 'Offer No', bold: true, minWidth: 140, render: (row) => getDisplayString(row.offerLetterNo) },
    { id: 'applicantCode', label: 'Candidate / Employee ID', bold: true, minWidth: 140, align: 'center', render: (row) => getDisplayString(row.applicantCode) },
    {
      id: 'candidateName',
      label: 'Candidate / Employee Name',
      bold: true,
      minWidth: 190,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {getDisplayString(row.candidateName)}
        </Typography>
      )
    },
    { id: 'department', label: 'Department', minWidth: 130, render: (row) => getDisplayString(row.department) },
    { id: 'designation', label: 'Designation', minWidth: 140, render: (row) => getDisplayString(row.designation) },
    { id: 'employmentType', label: 'Employment Type', minWidth: 130, align: 'center', render: (row) => getDisplayString(row.employmentType) },
    { id: 'offerDate', label: 'Offer Date', minWidth: 110, align: 'center' },
    { id: 'joiningDate', label: 'Joining Date', minWidth: 110, align: 'center' },
    {
      id: 'totalCTC',
      label: 'Annual CTC',
      minWidth: 130,
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
          ₹{(Number(row.totalCTC) || 0).toLocaleString('en-IN')}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 140,
      align: 'center',
      render: (row) => <BOSStatusChip status={row.status || 'Draft'} showIcon={true} width={130} />
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 90,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <Tooltip title="Edit Offer">
            <IconButton size="small" onClick={() => handleDoubleClickRow(row)} color="info">
              <IconPencil size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Offer">
            <IconButton size="small" onClick={() => handlePromptDelete(row)} color="error">
              <IconTrash size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [handlePromptDelete, handleDoubleClickRow, handleOpenPreview]);

  const exportColumns = useMemo(() => [
    { id: 'offerLetterNo', header: 'Offer No', key: (row) => getDisplayString(row.offerLetterNo) },
    { id: 'applicantCode', header: 'Candidate / Employee ID', key: (row) => getDisplayString(row.applicantCode) },
    { id: 'candidateName', header: 'Candidate / Employee Name', key: (row) => getDisplayString(row.candidateName) },
    { id: 'department', header: 'Department', key: (row) => getDisplayString(row.department) },
    { id: 'designation', header: 'Designation', key: (row) => getDisplayString(row.designation) },
    { id: 'employmentType', header: 'Employment Type', key: (row) => getDisplayString(row.employmentType) },
    { id: 'offerDate', header: 'Offer Date', key: (row) => row.offerDate || '-' },
    { id: 'joiningDate', header: 'Joining Date', key: (row) => row.joiningDate || '-' },
    { id: 'totalCTC', header: 'Annual CTC', key: (row) => (row.totalCTC !== undefined && row.totalCTC !== null) ? `₹${(Number(row.totalCTC) || 0).toLocaleString('en-IN')}` : '-' },
    { id: 'status', header: 'Status', key: (row) => row.status || 'Draft' }
  ], []);

  const offerFormFields = {
    candidates,
    selectedCandidate,
    onSelectCandidate: handleSelectCandidate,
    loadingCandidates,
    candidateName,
    candidateCode,
    email,
    onEmailChange: setEmail,
    phone,
    onPhoneChange: setPhone,
    gender,
    onGenderChange: setGender,
    dob,
    onDobChange: setDob,
    candidatePhoto,
    department,
    onDepartmentChange: setDepartment,
    departmentsList,
    designation,
    onDesignationChange: setDesignation,
    designationsList,
    employmentType,
    onEmploymentTypeChange: handleEmploymentTypeChange,
    employeeTypesList,
    workLocation,
    onWorkLocationChange: setWorkLocation,
    locationsList,
    grade,
    onGradeChange: setGrade,
    gradesList,
    refNo,
    offerDate,
    onOfferDateChange: setOfferDate,
    joiningDate,
    onJoiningDateChange: setJoiningDate,
    probationPeriod,
    onProbationPeriodChange: setProbationPeriod,
    salaryEarnings,
    salaryDeductions,
    salaryContributions,
    localSalary,
    onSalaryFieldChange: handleSalaryFieldChange,
    salaryLoading,
    isPFEnabled,
    isESIEnabled,
    isPTaxEnabled,
    onSalaryToggleChange: handleSalaryToggleChange,
    grossVal,
    deductionsVal,
    contributionsVal,
    netVal,
    ctcVal,
    totalCTC,
    onOpenSalaryChangeLog: handleOpenSalaryChangeLog,
    onAutoCalculate: handleAutoCalculate,
    activeCompsList,
    terms,
    onTermsChange: setTerms,
    errors
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-offer-letter-pdf, #printable-offer-letter-pdf * { visibility: visible; }
          #printable-offer-letter-pdf {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* MODE 1: OVERVIEW LISTING TABLE                                            */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <MainCard
          contentSX={{ p: 0 }}
          pageCode="HA1360"
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconFileText size={24} color={theme.palette.primary.main} />
              <Typography variant="h3" component="span" sx={{ fontWeight: 800 }}>
                Offer Letter
              </Typography>
            </Stack>
          }
          secondary={
            <BOSTableToolbar
              id="hr_offer_letter_table"
              onRefresh={fetchOfferLetters}
              onNew={handleOpenAdd}
              newTooltip="+ New Offer Letter"
              newSx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5
              }}
              exportSx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5
              }}
              hasWritePermission={true}
              columns={columns}
              exportData={filteredRows}
              exportColumns={exportColumns}
              exportFilename="Offer_Letters_List"
            >
              <Tooltip title={selectedRowIds.length !== 1 ? 'Select a record to send offer letter (Space + O)' : shortcutTooltip('Offer Letter')}>
                <span>
                  <Button
                    data-shortcut="offer"
                    variant="contained"
                    color="primary"
                    disabled={selectedRowIds.length !== 1}
                    onClick={() => handleOpenSendEmailDialog()}
                    startIcon={<IconMail size={18} />}
                    sx={{
                      borderRadius: '24px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 2.5,
                      boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                    }}
                  >
                    Offer Letter
                  </Button>
                </span>
              </Tooltip>
            </BOSTableToolbar>
          }
        >
          {/* Data Table */}
          <BOSDataTable
            id="hr_offer_letter_table"
            columns={columns}
            rows={filteredRows}
            loading={loading}
            selectable={true}
            selectedRowId={selectedRowIds}
            onClickRow={(row, newSelected) => {
              const ids = Array.isArray(newSelected) ? newSelected : (newSelected ? [newSelected] : (row?.id ? [row.id] : []));
              setSelectedRowIds(ids);
            }}
            onSelectionChange={(selected) => {
              const ids = (selected || []).map(r => (typeof r === 'object' ? (r.id || r.uniqueRowId || r.applicantCode) : r));
              setSelectedRowIds(ids);
            }}
            onDoubleClickRow={handleDoubleClickRow}
          />
        </MainCard>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: NEW OFFER LETTER PAGE (WITH SAVE, CLEAR, BACK BUTTONS)            */}
      {/* ========================================================================= */}
      {viewMode === 'new' && (
        <MainCard
          pageCode="HA1360"
          title={
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconFileText size={24} color={theme.palette.primary.main} />
              <Box>
                <Typography variant="h3" component="span" sx={{ fontWeight: 800 }}>
                  New Offer Letter
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Offer Letter No: {offerLetterNo || refNo}
                </Typography>
              </Box>
            </Stack>
          }
          secondary={
            /* PERSISTENT BOS ACTION BUTTONS: TEMPLATE DESIGNER | SAVE | CLEAR | BACK */
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title={shortcutTooltip('Template Designer', 'Space + T')}>
                <Button
                  data-shortcut="template"
                  variant="contained"
                  startIcon={<IconTemplate size={18} />}
                  onClick={() => setDesignerOpen(true)}
                  sx={btnEdit(theme)}
                >
                  Template Designer
                </Button>
              </Tooltip>

              <Tooltip title={shortcutTooltip('Save', 'Space + S')}>
                <Button
                  data-shortcut="save"
                  variant="contained"
                  startIcon={<IconDeviceFloppy size={18} />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={btnSave}
                >
                  Save
                </Button>
              </Tooltip>

              <Tooltip title={shortcutTooltip('Clear', 'Space + C')}>
                <Button
                  data-shortcut="clear"
                  variant="contained"
                  startIcon={<IconRefresh size={18} />}
                  onClick={handleClearForm}
                  sx={btnClear}
                >
                  Clear
                </Button>
              </Tooltip>

              <Tooltip title={shortcutTooltip('Back', 'Space + B')}>
                <Button
                  data-shortcut="back"
                  variant="contained"
                  startIcon={<IconArrowLeft size={18} />}
                  onClick={() => setViewMode('list')}
                  sx={btnCancel}
                >
                  Back
                </Button>
              </Tooltip>
            </Stack>
          }
        >
          <Box sx={{ width: '100%' }}>
            <OfferLetterFormDialog embedded dialogMode="new" {...offerFormFields} />
          </Box>
        </MainCard>
      )}

      {/* ========================================================================= */}
      {/* CANDIDATE / EMPLOYEE INFORMATION MODAL (ⓘ)                                */}
      {/* ========================================================================= */}
      <Dialog
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconInfoCircle size={24} color={theme.palette.primary.main} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Profile Details - {getDisplayString(candidateName) || 'Candidate / Employee'}
            </Typography>
            {selectedCandidate?.sourceTag && (
              <Chip
                label={selectedCandidate.sourceTag === 'Employee' || selectedCandidate.sourceTag === 'Employee Master' ? 'Employee' : 'ATS'}
                color={selectedCandidate.sourceTag === 'Employee' || selectedCandidate.sourceTag === 'Employee Master' ? 'secondary' : 'primary'}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            )}
          </Stack>
          <IconButton onClick={() => setInfoModalOpen(false)} size="small">✕</IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Candidate / Employee ID</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(candidateCode || selectedCandidate?.applicantCode) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(candidateName) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Email ID</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(email) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Mobile Number</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(phone) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Department</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(department) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Designation</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(designation) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Work Location</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{getDisplayString(workLocation) || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Offered Annual CTC</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>₹{totalCTC.toLocaleString('en-IN')}</Typography>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT / VIEW MODAL (FOR EXISTING RECORDS DOUBLE CLICK)                     */}
      {/* ========================================================================= */}
      <OfferLetterFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        dialogMode={dialogMode}
        onSave={handleSave}
        saving={saving}
        onClear={handleClearForm}
        {...offerFormFields}
      />

      {/* Full Screen Offer Letter Template Designer Dialog */}
      <OfferLetterDesigner
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        candidates={candidates}
        initialCandidate={selectedCandidate}
        initialSections={customSections || DEFAULT_DOCUMENT_SECTIONS}
        companyInfo={companyInfo}
        loggedInUser={{ name: loggedInUserName, designation: loggedInUserDesignation }}
        localSalary={localSalary}
        activeCompsList={activeCompsList}
        grossVal={grossVal}
        ctcVal={ctcVal}
        annualCtc={totalCTC}
        totalCTC={totalCTC}
        offerMetadata={{
          candidateName,
          candidateCode,
          email,
          phone,
          gender,
          dob,
          designation,
          department,
          workLocation,
          employmentType,
          grade,
          refNo,
          offerLetterNo,
          offerDate,
          joiningDate,
          probationPeriod
        }}
        onSelectCandidate={handleSelectCandidate}
        onSaveOfferLetter={(designerData) => {
          if (designerData.candidate && designerData.candidate.id && String(designerData.candidate.id) !== String(selectedCandidate?.id)) {
            handleSelectCandidate(designerData.candidate);
          }
          if (designerData.sections && Array.isArray(designerData.sections)) {
            setCustomSections(designerData.sections);
          }
          if (designerData.companyInfo) {
            setCompanyInfo(prev => ({ ...prev, ...designerData.companyInfo }));
          }
          setViewMode('new');
          setDesignerOpen(false);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Offer Letter"
        content={`Are you sure you want to delete Offer Letter ${recordToDelete?.refNo}? This action cannot be undone.`}
      />

      {/* Send Offer Letter Email Dialog */}
      <SendOfferLetterDialog
        open={sendEmailDialogOpen}
        onClose={() => {
          setSendEmailDialogOpen(false);
          setSelectedOfferForEmail(null);
        }}
        offerLetter={selectedOfferForEmail}
        initialModel={selectedOfferForEmail?.canonicalModel}
        initialPdfArtifact={selectedOfferForEmail?.pdfArtifact}
        onSuccess={() => {
          fetchOfferLetters();
        }}
      />

      {/* Salary Component Change Log Dialog — identical to Employee Master & ATS InterviewFinalProcess */}
      <Dialog open={salaryChangeLogOpen} onClose={() => setSalaryChangeLogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: theme.palette.mode === 'dark' ? 'dark.800' : 'background.default', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, py: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHistory size={22} color={theme.palette.secondary.main} />
            <span>Salary Change Log — {candidateName || 'Candidate / Employee'}</span>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {salaryChangeLogLoading ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : salaryChangeLog.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                No salary changes recorded yet.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Changes are recorded each time salary is saved with modifications.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date &amp; Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Component</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Old Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>New Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salaryChangeLog.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdDate)}</TableCell>
                      <TableCell>{log.createdBy || 'System'}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {log.componentCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {log.componentName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.actionType}
                          size="small"
                          color={
                            log.actionType === 'INSERT' ? 'success' :
                              log.actionType === 'UPDATE' ? 'warning' :
                                'error'
                          }
                          variant="filled"
                          sx={{ fontWeight: 700, borderRadius: '6px', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{(log.oldAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: log.actionType === 'DELETE' ? 'error.main' : 'primary.main' }}>
                        ₹{(log.newAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, bgcolor: theme.palette.mode === 'dark' ? 'dark.800' : 'background.default', borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
          <Button onClick={() => setSalaryChangeLogOpen(false)} variant="outlined" sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Offer Letter Document Preview & Print Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewRecord(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxHeight: '92vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.75, px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconFileText size={22} color={theme.palette.primary.main} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Offer Letter Preview & Print
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Offer Letter No: {previewRecord?.offerLetterNo || previewRecord?.refNo || 'N/A'}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => { setPreviewDialogOpen(false); setPreviewRecord(null); }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: '#cbd5e1', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
          {previewRecord && (
            <Box
              id="printable-offer-letter-pdf"
              sx={{
                width: 794,
                minHeight: 1123,
                bgcolor: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                boxSizing: 'border-box'
              }}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const model = buildOfferLetterDocumentModel(previewRecord, {
                    customSections,
                    companyInfo,
                    signatoryData: { hrName: loggedInUserName, hrDesignation: loggedInUserDesignation },
                    activeCompsList
                  });
                  return model.cleanHtml;
                })()
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
          <Button variant="outlined" color="inherit" onClick={() => { setPreviewDialogOpen(false); setPreviewRecord(null); }} sx={{ borderRadius: '20px', textTransform: 'none' }}>
            Close
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="primary"
              disabled={isPrinting || isDownloadingPDF}
              startIcon={isPrinting ? <CircularProgress size={16} color="inherit" /> : <IconPrinter size={18} />}
              onClick={handlePrintPreview}
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
            >
              {isPrinting ? 'Printing...' : 'Print'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={isDownloadingPDF || isPrinting}
              startIcon={isDownloadingPDF ? <CircularProgress size={16} color="inherit" /> : <IconDownload size={18} />}
              onClick={handleDownloadPreviewPDF}
              sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
            >
              {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Tooltip title={shortcutTooltip('Send Offer Letter')}>
              <span>
                <Button
                  data-shortcut="offer"
                  variant="contained"
                  color="primary"
                  disabled={isDownloadingPDF || isPrinting}
                  startIcon={<IconMail size={18} />}
                  onClick={() => {
                    const target = previewRecord;
                    const model = buildOfferLetterDocumentModel(previewRecord, {
                      customSections,
                      companyInfo,
                      signatoryData: { hrName: loggedInUserName, hrDesignation: loggedInUserDesignation },
                      activeCompsList
                    });
                    setPreviewDialogOpen(false);
                    setPreviewRecord(null);
                    handleOpenSendEmailDialog(target, model, lastGeneratedPdfArtifact);
                  }}
                  sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700 }}
                >
                  Send Offer Letter
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
