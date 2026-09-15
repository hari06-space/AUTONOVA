import React, { useState, useEffect, useMemo } from 'react';
import { sanitizeHTML } from 'utils/sanitize';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Stack,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Autocomplete,
  Breadcrumbs,
  Paper,
  useTheme,
  Checkbox,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  IconUserCheck,
  IconEye,
  IconFileText,
  IconHome,
  IconEdit,
  IconTrash,
  IconInfoCircle,
  IconAlertCircle,
  IconSettings,
  IconSearch
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, BOSDataTable, BOSFormDialog, BOSFormSection, BOSPersonnelCard, errorStyle } from 'ui-component/bos';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactQuillDemo from 'ui-component/third-party/ReactQuill';

// ==============================|| DOCUMENT BOILERPLATES (STANDARD SOP) ||============================== //

const TEMPLATES = {
  offer: `
<div style="font-family: 'Outfit', sans-serif; padding: 24px; color: #1a223f; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
  <h3 style="text-align: center; color: #1e90ff; font-size: 1.5rem; margin-top: 0;">OFFER OF EMPLOYMENT</h3>
  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
  <p>Date: <strong>{{joiningDate}}</strong></p>
  <p>Dear <strong>{{employeeName}}</strong>,</p>
  <p>We are pleased to offer you the position of <strong>{{designationName}}</strong> at AUTONOVA.</p>
  <p>Your annual salary package will be <strong>{{salaryPackage}}</strong> CTC. Your planned joining date is <strong>{{joiningDate}}</strong>.</p>
  <p>Please review and sign this offer letter as acceptance of the terms.</p>
  <br /><br />
  <p>Sincerely,</p>
  <p><strong>{{authorizingSignatory}}</strong><br/><span style="color: #666; font-size: 0.9rem;">Human Resources Head</span></p>
</div>
  `,
  appointment: `
<div style="font-family: 'Outfit', sans-serif; padding: 24px; color: #1a223f; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
  <h3 style="text-align: center; color: #1e90ff; font-size: 1.5rem; margin-top: 0;">APPOINTMENT ORDER</h3>
  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
  <p>Dear <strong>{{employeeName}}</strong>,</p>
  <p>Pursuant to your acceptance of our offer, the management is pleased to appoint you as <strong>{{designationName}}</strong> with effect from <strong>{{joiningDate}}</strong>.</p>
  <p>Your compensation is fixed at <strong>{{salaryPackage}}</strong> CTC per annum as detailed in the annexure.</p>
  <p>We welcome you to our organization and wish you a successful career.</p>
  <br /><br />
  <p>Authorized Signatory:</p>
  <p><strong>{{authorizingSignatory}}</strong></p>
</div>
  `,
  confirmation: `
<div style="font-family: 'Outfit', sans-serif; padding: 24px; color: #1a223f; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
  <h3 style="text-align: center; color: #1e90ff; font-size: 1.5rem; margin-top: 0;">LETTER OF CONFIRMATION</h3>
  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
  <p>Dear <strong>{{employeeName}}</strong>,</p>
  <p>Following the successful completion of your probation period, we are pleased to confirm your appointment as <strong>{{designationName}}</strong> with effect from <strong>{{joiningDate}}</strong>.</p>
  <p>All other terms and conditions of your appointment remain unchanged.</p>
  <p>We appreciate your dedication and contribution during your probation.</p>
  <br /><br />
  <p>Sincerely,</p>
  <p><strong>{{authorizingSignatory}}</strong></p>
</div>
  `,
  relieving: `
<div style="font-family: 'Outfit', sans-serif; padding: 24px; color: #1a223f; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
  <h3 style="text-align: center; color: #1e90ff; font-size: 1.5rem; margin-top: 0;">RELIEVING ORDER</h3>
  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
  <p>Dear <strong>{{employeeName}}</strong>,</p>
  <p>This is to confirm that your resignation from the services of the company has been accepted. You are hereby relieved of your duties as <strong>{{designationName}}</strong> with effect from the close of business hours on <strong>{{joiningDate}}</strong>.</p>
  <p>We confirm that your full and final settlement has been completed, and there are no outstanding dues.</p>
  <p>We wish you all the best in your future endeavors.</p>
  <br /><br />
  <p>Regards,</p>
  <p><strong>{{authorizingSignatory}}</strong></p>
</div>
  `
};

const INITIAL_FORM_STATE = {
  id: null,
  documentType: 'Offer Letter',
  employeeId: '',
  employeeName: '',
  departmentId: '',
  departmentName: '',
  designationId: '',
  designationName: '',
  documentReferenceNumber: '',
  issueDate: new Date().toISOString().slice(0, 10),
  joiningDate: new Date().toISOString().slice(0, 10),
  probationCompletionDate: new Date().toISOString().slice(0, 10),
  confirmationEffectiveDate: new Date().toISOString().slice(0, 10),
  resignationDate: new Date().toISOString().slice(0, 10),
  lastWorkingDay: new Date().toISOString().slice(0, 10),
  documentContent: '',
  statusName: 'Pending',
  createdBy: '',
  createdDate: null,
  updatedBy: '',
  updatedDate: null
};

// ==============================|| EMPLOYEE ONBOARDING DASHBOARD ||============================== //

export default function EmployeeOnboarding() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Data states
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Search/Page states
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [viewRow, setViewRow] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Wizard state and dynamic mapping configuration
  const [activeStep, setActiveStep] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [columnMapping, setColumnMapping] = useState([
    { name: 'id', customRename: 'id', enabled: true },
    { name: 'employeeName', customRename: 'employeeName', enabled: true },
    { name: 'empCode', customRename: 'empCode', enabled: true },
    { name: 'departmentName', customRename: 'departmentName', enabled: true },
    { name: 'designationName', customRename: 'designationName', enabled: true },
    { name: 'documentReferenceNumber', customRename: 'documentReferenceNumber', enabled: true },
    { name: 'joiningDate', customRename: 'joiningDate', enabled: true },
    { name: 'createdDate', customRename: 'createdDate', enabled: true },
    { name: 'description', customRename: 'description', enabled: true },
    { name: 'status', customRename: 'status', enabled: true }
  ]);
  const [searchColumnQuery, setSearchColumnQuery] = useState('');
  const [templateData, setTemplateData] = useState({
    subject: 'CALL LETTER - {{employeeName}}',
    body: '',
    footer: 'AUTONOVA'
  });
  const [activeField, setActiveField] = useState(null); // 'subject' | 'body' | 'footer'
  const [cursorPos, setCursorPos] = useState(0);
  const quillRef = React.useRef(null);

  const getActiveDocumentType = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('offer-letter')) return 'Offer Letter';
    if (path.includes('appointment-order')) return 'Appointment Order';
    if (path.includes('relieving-order')) return 'Relieving Order';
    return 'Offer Letter';
  };

  const getHeaderTitle = () => {
    const activeDocType = getActiveDocumentType();
    return `Employee Onboarding - ${activeDocType}`;
  };

  // Reset page and search when route changes to isolate state
  useEffect(() => {
    setPage(0);
    setSearchQuery('');
  }, [location.pathname]);

  const getTemplateType = (docType) => {
    const tp = docType || formData.documentType;
    if (tp === 'Appointment Order') return 'appointment';
    if (tp === 'Confirmation Order') return 'confirmation';
    if (tp === 'Relieving Order') return 'relieving';
    return 'offer';
  };

  // Column toggle and rename helpers
  const handleToggleField = (name, checked) => {
    setColumnMapping((prev) =>
      prev.map((f) => (f.name === name ? { ...f, enabled: checked } : f))
    );
  };

  const handleRenameField = (name, value) => {
    setColumnMapping((prev) =>
      prev.map((f) => (f.name === name ? { ...f, customRename: value } : f))
    );
  };

  // Step transition helpers
  const handleNextStep = () => {
    if (activeStep === 0) {
      const errors = {};
      if (!formData.employeeId) errors.employeeId = 'Employee selection is required';
      if (!formData.departmentId) errors.departmentId = 'Department selection is required';
      if (formData.documentType === 'Appointment Order' && !formData.designationId) {
        errors.designationId = 'Designation is required';
      }
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
      setActiveStep(1);
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBackStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // Resolve actual value of system fields
  const resolveFieldValue = (fieldName) => {
    const selectedEmp = employees.find((x) => x.id === formData.employeeId) || null;
    if (fieldName === 'id') return formData.id || 'Draft';
    if (fieldName === 'employeeName') return selectedEmp?.employeeName || '___________';
    if (fieldName === 'empCode') return selectedEmp?.empCode || '___________';
    if (fieldName === 'departmentName') return selectedEmp?.departmentName || formData.departmentName || '___________';
    if (fieldName === 'designationName') {
      if (formData.documentType === 'Appointment Order') {
        return formData.designationName || '___________';
      }
      return selectedEmp?.designationName || selectedEmp?.designation?.designationName || '___________';
    }
    if (fieldName === 'documentReferenceNumber') return formData.documentReferenceNumber || '___________';
    if (fieldName === 'joiningDate') {
      let dateVal = null;
      if (formData.documentType === 'Offer Letter') dateVal = formData.issueDate;
      else if (formData.documentType === 'Appointment Order') dateVal = formData.joiningDate;
      else if (formData.documentType === 'Confirmation Order') dateVal = formData.confirmationEffectiveDate;
      else if (formData.documentType === 'Relieving Order') dateVal = formData.lastWorkingDay;
      return dateVal ? new Date(dateVal).toLocaleDateString('en-GB') : '___________';
    }
    if (fieldName === 'createdDate') return new Date().toLocaleDateString('en-GB');
    if (fieldName === 'description') return formData.documentReferenceNumber || '';
    if (fieldName === 'status') return formData.statusName || 'Pending';
    return '';
  };

  // Compile templates into final HTML
  const compileTemplate = () => {
    let compiledSubject = templateData.subject || '';
    let compiledBody = templateData.body || '';
    let compiledFooter = templateData.footer || '';

    // 1. Replace standard parameters
    const standardParams = {
      todayDate: new Date().toLocaleDateString('en-GB'),
      totalCount: records.length.toString(),
      reportData: `Records Count: ${records.length} total generated onboarding documents.`
    };

    Object.entries(standardParams).forEach(([key, val]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      compiledSubject = compiledSubject.replace(regex, val);
      compiledBody = compiledBody.replace(regex, val);
      compiledFooter = compiledFooter.replace(regex, val);
    });

    // 2. Replace mapped columns (dynamic fields)
    columnMapping.forEach((mapping) => {
      if (mapping.enabled) {
        const val = resolveFieldValue(mapping.name);
        const regex = new RegExp(`{{${mapping.customRename}}}`, 'g');
        compiledSubject = compiledSubject.replace(regex, val);
        compiledBody = compiledBody.replace(regex, val);
        compiledFooter = compiledFooter.replace(regex, val);
      }
    });

    // 3. Compose final document HTML
    return `
<div style="font-family: 'Outfit', sans-serif; padding: 24px; color: #1a223f; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fafafa;">
  <h3 style="color: #1e90ff; font-size: 1.25rem; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Subject: ${compiledSubject}</h3>
  <div class="email-body" style="margin-top: 16px; margin-bottom: 24px;">${compiledBody}</div>
  <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px; margin-bottom: 10px;" />
  <p style="color: #666; font-size: 0.9rem; font-style: italic; margin: 0;">${compiledFooter}</p>
</div>
    `;
  };

  // Cursor chip insertion logic
  const handleInsertChip = (chipText) => {
    if (activeField === 'subject') {
      const text = templateData.subject || '';
      const newText = text.substring(0, cursorPos) + chipText + text.substring(cursorPos);
      setTemplateData(prev => ({ ...prev, subject: newText }));
      setCursorPos(cursorPos + chipText.length);
    } else if (activeField === 'footer') {
      const text = templateData.footer || '';
      const newText = text.substring(0, cursorPos) + chipText + text.substring(cursorPos);
      setTemplateData(prev => ({ ...prev, footer: newText }));
      setCursorPos(cursorPos + chipText.length);
    } else if (activeField === 'body') {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        if (range) {
          editor.insertText(range.index, chipText);
          editor.setSelection(range.index + chipText.length);
        } else {
          const length = editor.getLength();
          editor.insertText(length - 1, chipText);
        }
      }
    }
  };

  // Fetch Onboarding Records (Parallel fetch and merge)
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const endpoints = [
        '/api/hr/onboarding/offer-letters',
        '/api/hr/onboarding/appointment-orders',
        '/api/hr/onboarding/relieving-orders'
      ];
      const [offers, appointments, relievings] = await Promise.all(
        endpoints.map(url => axios.get(url).then(res => res.data || []))
      );

      const offersWithTp = offers.map(x => ({ ...x, documentType: 'Offer Letter' }));
      const appointmentsWithTp = appointments.map(x => ({ ...x, documentType: 'Appointment Order' }));
      const relievingsWithTp = relievings.map(x => ({ ...x, documentType: 'Relieving Order' }));

      const merged = [
        ...offersWithTp,
        ...appointmentsWithTp,
        ...relievingsWithTp
      ];

      // Sort by newest createdDate or ID first
      merged.sort((a, b) => {
        const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        return dateB - dateA;
      });

      setRecords(merged);
    } catch (err) {
      console.error('Error fetching onboarding records', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to fetch onboarding data.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial master lists
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const response = await axios.get('/api/master/hr/employees/filter/active');
        setEmployees(response.data || []);
      } catch (err) {
        console.error('Failed to load employee list', err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    const fetchDesignations = async () => {
      try {
        const response = await axios.get('/api/master/hr/designations');
        setDesignations(response.data || []);
      } catch (err) {
        console.error('Failed to load designation list', err);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await axios.get('/api/master/hr/departments/active');
        setDepartments(response.data || []);
      } catch (err) {
        console.error('Failed to load department list', err);
      }
    };

    fetchEmployees();
    fetchDesignations();
    fetchDepartments();
    fetchRecords();
  }, []);

  // Compile default content upon employee selection
  const handleEmployeeChange = (newValue) => {
    if (!newValue) {
      setFormData(prev => ({
        ...prev,
        employeeId: '',
        employeeName: '',
        departmentId: '',
        departmentName: '',
        designationId: '',
        designationName: ''
      }));
      return;
    }

    let deptId = newValue.departmentId || (newValue.department ? newValue.department.id : '');
    let deptName = newValue.department ? newValue.department.departmentName : (newValue.departmentName || '');
    if (!deptId && departments.length > 0) {
      deptId = departments[0].id;
      deptName = departments[0].departmentName;
    } else if (!deptId) {
      deptId = 1;
      deptName = 'Default Department';
    }

    let desigId = newValue.designationId || (newValue.designation ? newValue.designation.id : '');
    let desigName = newValue.designation ? newValue.designation.designationName : (newValue.designationName || '');
    if (!desigId && designations.length > 0) {
      desigId = designations[0].id;
      desigName = designations[0].designationName;
    } else if (!desigId) {
      desigId = 1;
      desigName = 'Default Designation';
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        employeeId: newValue.id,
        employeeName: newValue.employeeName,
        departmentId: deptId,
        departmentName: deptName,
        designationId: desigId,
        designationName: desigName
      };

      const tempType = getTemplateType(prev.documentType);
      const rawTemplate = TEMPLATES[tempType];

      // Update template data with placeholders
      setTemplateData(td => ({
        ...td,
        subject: `CALL LETTER - {{employeeName}}`,
        body: rawTemplate,
        footer: 'AUTONOVA'
      }));

      return updated;
    });

    if (formErrors.employeeId) {
      setFormErrors(prev => ({ ...prev, employeeId: '' }));
    }
  };

  const handleDocumentTypeChange = (newType) => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prefixMap = {
      'Offer Letter': 'OL',
      'Appointment Order': 'AO',
      'Confirmation Order': 'CO',
      'Relieving Order': 'RO'
    };
    const prefix = prefixMap[newType] || 'OL';
    const refNo = `NWP-${prefix}-${year}-${rand}`;

    setFormData(prev => {
      const updated = {
        ...prev,
        documentType: newType,
        documentReferenceNumber: refNo
      };

      if (newType !== 'Appointment Order') {
        updated.designationId = '';
        updated.designationName = '';
      }

      const tempType = getTemplateType(newType);
      setTemplateData(td => ({
        ...td,
        body: TEMPLATES[tempType]
      }));

      return updated;
    });
  };

  // Open creation modal
  const handleOpenAdd = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const activeDocType = getActiveDocumentType();
    const prefixMap = {
      'Offer Letter': 'OL',
      'Appointment Order': 'AO',
      'Confirmation Order': 'CO',
      'Relieving Order': 'RO'
    };
    const prefix = prefixMap[activeDocType] || 'OL';
    setFormData({
      ...INITIAL_FORM_STATE,
      documentType: activeDocType,
      documentReferenceNumber: `NWP-${prefix}-${year}-${rand}`
    });
    setFormErrors({});
    setActiveStep(0);
    setPreviewExpanded(true);
    setSearchColumnQuery('');
    setTemplateData({
      subject: `CALL LETTER - {{employeeName}}`,
      body: TEMPLATES[getTemplateType(activeDocType)],
      footer: 'AUTONOVA'
    });
    setColumnMapping([
      { name: 'id', customRename: 'id', enabled: true },
      { name: 'employeeName', customRename: 'employeeName', enabled: true },
      { name: 'empCode', customRename: 'empCode', enabled: true },
      { name: 'departmentName', customRename: 'departmentName', enabled: true },
      { name: 'designationName', customRename: 'designationName', enabled: true },
      { name: 'documentReferenceNumber', customRename: 'documentReferenceNumber', enabled: true },
      { name: 'joiningDate', customRename: 'joiningDate', enabled: true },
      { name: 'createdDate', customRename: 'createdDate', enabled: true },
      { name: 'description', customRename: 'description', enabled: true },
      { name: 'status', customRename: 'status', enabled: true }
    ]);
    setFormOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (row) => {
    let deptId = row.departmentId;
    let deptName = row.department ? row.department.departmentName : '';
    if (!deptId && departments.length > 0) {
      deptId = departments[0].id;
      deptName = departments[0].departmentName;
    } else if (!deptId) {
      deptId = 1;
      deptName = 'Default Department';
    }

    let desigId = row.designationId || (row.employee && (row.employee.designationId || (row.employee.designation && row.employee.designation.id))) || '';
    let desigName = row.designation ? row.designation.designationName : (row.employee && (row.employee.designationName || (row.employee.designation && row.employee.designation.designationName))) || '';
    if (!desigId && designations.length > 0) {
      desigId = designations[0].id;
      desigName = designations[0].designationName;
    } else if (!desigId) {
      desigId = 1;
      desigName = 'Default Designation';
    }

    const resolvedForm = {
      id: row.id,
      employeeId: row.employeeId,
      employeeName: row.employee ? row.employee.employeeName : '',
      departmentId: deptId,
      departmentName: deptName,
      designationId: desigId,
      designationName: desigName,
      documentReferenceNumber: row.documentReferenceNumber,
      documentContent: row.documentContent || '',
      statusName: row.status ? row.status.name : (row.approvalStatus ? row.approvalStatus.name : 'Pending'),

      issueDate: row.issueDate ? new Date(row.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      joiningDate: row.joiningDate ? new Date(row.joiningDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      probationCompletionDate: row.probationCompletionDate ? new Date(row.probationCompletionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      confirmationEffectiveDate: row.confirmationEffectiveDate ? new Date(row.confirmationEffectiveDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      resignationDate: row.resignationDate ? new Date(row.resignationDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      lastWorkingDay: row.lastWorkingDay ? new Date(row.lastWorkingDay).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),

      createdBy: row.createdBy || '',
      createdDate: row.createdDate || null,
      updatedBy: row.updatedBy || '',
      updatedDate: row.updatedDate || null
    };
    setFormData(resolvedForm);
    setFormErrors({});
    setActiveStep(0);
    setPreviewExpanded(true);
    setSearchColumnQuery('');

    let extractedSubject = `CALL LETTER - ${row.employee ? row.employee.employeeName : ''}`;
    let extractedBody = row.documentContent || '';
    let extractedFooter = 'AUTONOVA';

    if (row.documentContent && row.documentContent.includes('Subject:')) {
      try {
        const doc = new DOMParser().parseFromString(row.documentContent, 'text/html');
        const h3 = doc.querySelector('h3');
        if (h3) {
          extractedSubject = h3.textContent.replace('Subject: ', '').trim();
        }
        const bodyDiv = doc.querySelector('.email-body');
        if (bodyDiv) {
          extractedBody = bodyDiv.innerHTML;
        }
        const footerP = doc.querySelector('p');
        if (footerP) {
          extractedFooter = footerP.textContent.trim();
        }
      } catch (e) {
        console.error('Failed to parse existing HTML content', e);
      }
    }

    setTemplateData({
      subject: extractedSubject,
      body: extractedBody,
      footer: extractedFooter
    });

    setColumnMapping([
      { name: 'id', customRename: 'id', enabled: true },
      { name: 'employeeName', customRename: 'employeeName', enabled: true },
      { name: 'empCode', customRename: 'empCode', enabled: true },
      { name: 'departmentName', customRename: 'departmentName', enabled: true },
      { name: 'designationName', customRename: 'designationName', enabled: true },
      { name: 'documentReferenceNumber', customRename: 'documentReferenceNumber', enabled: true },
      { name: 'joiningDate', customRename: 'joiningDate', enabled: true },
      { name: 'createdDate', customRename: 'createdDate', enabled: true },
      { name: 'description', customRename: 'description', enabled: true },
      { name: 'status', customRename: 'status', enabled: true }
    ]);
    setFormOpen(true);
  };

  const handleOpenView = (row) => {
    setViewRow(row);
    setViewOpen(true);
  };

  const handleOpenDelete = (row) => {
    setDeleteId(row.id);
    setDeleteType(row.documentType);
    setDeleteOpen(true);
  };

  // Dispatch POST / PUT CRUD
  const handleSave = async () => {
    if (saving) return;

    const compiledContent = compileTemplate();
    if (!compiledContent || !compiledContent.trim()) {
      dispatch(openSnackbar({
        open: true,
        message: 'Compiled document content cannot be empty.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setSaving(true);
    try {
      const endpointMap = {
        'Offer Letter': '/api/hr/onboarding/offer-letters',
        'Appointment Order': '/api/hr/onboarding/appointment-orders',
        'Relieving Order': '/api/hr/onboarding/relieving-orders'
      };
      const endpoint = endpointMap[formData.documentType];

      // Prepare request body
      const payload = {
        employeeId: formData.employeeId,
        documentReferenceNumber: formData.documentReferenceNumber,
        departmentId: formData.departmentId,
        documentContent: compiledContent
      };

      if (formData.documentType === 'Offer Letter') {
        payload.issueDate = new Date(formData.issueDate).getTime();
        payload.approvalStatus = formData.statusName;
      } else if (formData.documentType === 'Appointment Order') {
        payload.designationId = formData.designationId;
        payload.joiningDate = new Date(formData.joiningDate).getTime();
        payload.status = formData.statusName;
      } else if (formData.documentType === 'Relieving Order') {
        payload.resignationDate = new Date(formData.resignationDate).getTime();
        payload.lastWorkingDay = new Date(formData.lastWorkingDay).getTime();
        payload.status = formData.statusName;
      }

      if (formData.id) {
        await axios.put(`${endpoint}/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Onboarding document updated successfully!',
          variant: 'alert',
          severity: 'success'
        }));
      } else {
        await axios.post(endpoint, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Onboarding document generated successfully!',
          variant: 'alert',
          severity: 'success'
        }));
      }
      setFormOpen(false);
      fetchRecords();
    } catch (err) {
      console.error('Error saving onboarding document', err);
      dispatch(openSnackbar({
        open: true,
        message: err.response?.data || 'Failed to save onboarding document.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  // Dispatch DELETE
  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;
    setDeleting(true);
    try {
      const endpointMap = {
        'Offer Letter': '/api/hr/onboarding/offer-letters',
        'Appointment Order': '/api/hr/onboarding/appointment-orders',
        'Relieving Order': '/api/hr/onboarding/relieving-orders'
      };
      const endpoint = endpointMap[deleteType];
      await axios.delete(`${endpoint}/${deleteId}`);
      dispatch(openSnackbar({
        open: true,
        message: 'Onboarding document deleted successfully!',
        variant: 'alert',
        severity: 'success'
      }));
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteType(null);
      fetchRecords();
    } catch (err) {
      console.error('Error deleting onboarding document', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to delete onboarding document.',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Search table records (dynamically filter by active step)
  const resolvedRows = useMemo(() => {
    const activeDocType = getActiveDocumentType();
    let list = records.filter(row => row.documentType === activeDocType);

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(row => {
        const empName = row.employee ? row.employee.employeeName : '';
        const empCode = row.employee ? row.employee.empCode : '';
        const refNo = row.documentReferenceNumber || '';
        return (
          empName.toLowerCase().includes(q) ||
          empCode.toLowerCase().includes(q) ||
          refNo.toLowerCase().includes(q)
        );
      });
    }
    return list.map((item, idx) => ({
      ...item,
      index: idx + 1
    }));
  }, [records, searchQuery, location.pathname]);

  const paginatedRows = useMemo(() => {
    return resolvedRows.slice(page * size, (page + 1) * size);
  }, [resolvedRows, page, size]);

  const selectedEmp = useMemo(() => {
    if (!formData.employeeId) return null;
    return employees.find((x) => x.id === formData.employeeId) || null;
  }, [formData.employeeId, employees]);

  // Status Chip helper
  const renderStatusChip = (statusName) => {
    const colors = {
      Pending: { bg: '#fffde7', fg: '#f57f17' },
      Approved: { bg: '#e8f5e9', fg: '#2e7d32' },
      Issued: { bg: '#e3f2fd', fg: '#1565c0' }
    };
    const st = colors[statusName] || { bg: '#f5f5f5', fg: '#757575' };
    return (
      <Chip
        label={statusName}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: '0.7rem',
          bgcolor: st.bg,
          color: st.fg,
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}
      />
    );
  };

  // Sync Columns configuration (Unified columns without tabs)
  const columns = useMemo(() => {
    const list = [
      { id: 'index', label: 'No', minWidth: 55, align: 'center' }
    ];

    columnMapping.forEach((col) => {
      if (!col.enabled) return;

      const label = col.customRename || col.name;
      if (col.name === 'id') {
        list.push({
          id: 'id',
          label: label,
          minWidth: 80,
          align: 'center',
          render: (row) => row.id
        });
      } else if (col.name === 'employeeName') {
        list.push({
          id: 'employeeName',
          label: label,
          minWidth: 180,
          align: 'left',
          render: (row) => row.employee ? row.employee.employeeName : 'N/A'
        });
      } else if (col.name === 'empCode') {
        list.push({
          id: 'empCode',
          label: label,
          minWidth: 120,
          align: 'center',
          render: (row) => row.employee ? row.employee.empCode : 'N/A'
        });
      } else if (col.name === 'departmentName') {
        list.push({
          id: 'departmentName',
          label: label,
          minWidth: 150,
          align: 'left',
          render: (row) => row.department ? row.department.departmentName : 'N/A'
        });
      } else if (col.name === 'designationName') {
        list.push({
          id: 'designationName',
          label: label,
          minWidth: 150,
          align: 'left',
          render: (row) => row.designation ? row.designation.designationName : (row.employee?.designationName || row.employee?.designation?.designationName || 'N/A')
        });
      } else if (col.name === 'documentReferenceNumber') {
        list.push({
          id: 'documentReferenceNumber',
          label: label,
          minWidth: 180,
          align: 'center',
          bold: true,
          render: (row) => row.documentReferenceNumber
        });
      } else if (col.name === 'joiningDate') {
        list.push({
          id: 'joiningDate',
          label: label,
          minWidth: 140,
          align: 'center',
          render: (row) => {
            let dateVal = null;
            if (row.documentType === 'Offer Letter') dateVal = row.issueDate;
            else if (row.documentType === 'Appointment Order') dateVal = row.joiningDate;
            else if (row.documentType === 'Confirmation Order') dateVal = row.confirmationEffectiveDate;
            else if (row.documentType === 'Relieving Order') dateVal = row.lastWorkingDay;
            return dateVal ? new Date(dateVal).toLocaleDateString('en-GB') : '-';
          }
        });
      } else if (col.name === 'createdDate') {
        list.push({
          id: 'createdDate',
          label: label,
          minWidth: 140,
          align: 'center',
          render: (row) => row.createdDate ? new Date(row.createdDate).toLocaleDateString('en-GB') : '-'
        });
      } else if (col.name === 'description') {
        list.push({
          id: 'description',
          label: label,
          minWidth: 150,
          align: 'left',
          render: (row) => row.documentReferenceNumber || ''
        });
      } else if (col.name === 'status') {
        list.push({
          id: 'status',
          label: label,
          minWidth: 120,
          align: 'center',
          render: (row) => renderStatusChip(row.status ? row.status.name : (row.approvalStatus ? row.approvalStatus.name : 'Pending'))
        });
      }
    });

    return list;
  }, [columnMapping]);

  // Actions Column Configuration
  const actionColumn = {
    label: 'ACTIONS',
    align: 'center',
    minWidth: 120,
    render: (row) => (
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent="center"
        alignItems="center"
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          size="small"
          onClick={() => handleOpenView(row)}
          sx={{
            color: 'primary.main',
            bgcolor: 'rgba(30, 144, 255, 0.08)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'primary.main', color: '#fff', transform: 'scale(1.05)' }
          }}
        >
          <IconEye size={16} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleOpenDelete(row)}
          sx={{
            color: 'error.main',
            bgcolor: 'rgba(211, 47, 47, 0.08)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'error.main', color: '#fff', transform: 'scale(1.05)' }
          }}
        >
          <IconTrash size={16} />
        </IconButton>
      </Stack>
    )
  };

  return (
    <MainCard
      contentSX={{ p: 0 }}
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0
      }}
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <BOSTextField
            size="small"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            onClick={handleOpenAdd}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              bgcolor: '#1e90ff',
              color: '#fff',
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            + New
          </Button>
        </Stack>
      }
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconUserCheck size={24} />
          <Typography variant="h3">{getHeaderTitle()}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', fontSize: '0.65rem', alignSelf: 'flex-end', pb: 0.3 }}>
            ONBOARDING VIEWER &amp; HISTORIC ARCHIVE
          </Typography>
        </Stack>
      }
    >
      <BOSDataTable
        id="onboarding-data-table"
        columns={columns}
        rows={paginatedRows}
        page={page}
        size={size}
        totalCount={resolvedRows.length}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleOpenEdit}
        actionColumn={actionColumn}
        noRecordsMessage="No onboarding log entries found."
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          overflow: 'hidden',
          '& .MuiTableContainer-root': {
            border: 'none',
            borderRadius: '12px'
          }
        }}
      />


      {/* ── INLINE DIALOG FORM EDITOR ── */}
      <BOSFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formData.id ? 'Edit Onboarding Record' : 'Generate New Onboarding Document'}
        maxWidth="xl"
        onSave={null}
        onClear={null}
        onDelete={formData.id ? () => { setDeleteId(formData.id); setDeleteOpen(true); } : null}
        hasId={!!formData.id}
        secondaryActions={
          <Stack direction="row" spacing={2} alignItems="center">
            <Button onClick={() => setFormOpen(false)} variant="outlined" color="primary" sx={{ borderRadius: '8px', textTransform: 'none' }}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBackStep} variant="outlined" color="secondary" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                Back
              </Button>
            )}
            {activeStep < 2 ? (
              <Button onClick={handleNextStep} variant="contained" color="primary" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} variant="contained" color="success" sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: 'success.main', color: '#fff', '&:hover': { bgcolor: 'success.dark' } }}>
                Save Template
              </Button>
            )}
          </Stack>
        }
        sidebar={
          selectedEmp ? (
            <BOSPersonnelCard
              title="Employee Profile"
              name={selectedEmp.employeeName}
              empCode={selectedEmp.empCode || `EMP-${selectedEmp.id}`}
              department={selectedEmp.departmentName || (selectedEmp.department ? selectedEmp.department.departmentName : '')}
              photo={selectedEmp.employeePhotoUpload}
            />
          ) : (
            <Paper sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: '12px', border: '1px dashed', borderColor: 'grey.300', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Select an employee profile to preview their details.
              </Typography>
            </Paper>
          )
        }
      >
        {activeStep === 0 && (
          <Stack spacing={3}>
            {/* Form Controls Panel */}
            <BOSFormSection icon={<IconSettings size={22} color={theme.palette.primary.main} />} title="Document Parameters">
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <BOSTextField
                    select
                    label="Document Type"
                    required
                    value={formData.documentType}
                    onChange={(e) => handleDocumentTypeChange(e.target.value)}
                    disabled={!!formData.id}
                  >
                    <MenuItem value="Offer Letter">Offer Letter</MenuItem>
                    <MenuItem value="Appointment Order">Appointment Order</MenuItem>
                    <MenuItem value="Confirmation Order">Confirmation Order</MenuItem>
                    <MenuItem value="Relieving Order">Relieving Order</MenuItem>
                  </BOSTextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    fullWidth
                    sx={{ width: '100%' }}
                    options={employees}
                    getOptionLabel={(option) => `${option.employeeName} (${option.empCode || option.id})`}
                    value={employees.find((x) => x.id === formData.employeeId) || null}
                    onChange={(event, newValue) => handleEmployeeChange(newValue)}
                    disabled={loadingEmployees || !!formData.id}
                    renderInput={(params) => (
                      <BOSTextField
                        {...params}
                        label="Select Employee Profile"
                        required
                        error={!!formErrors.employeeId}
                        helperText={formErrors.employeeId}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <BOSTextField
                    label="Department"
                    value={formData.departmentName || ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <BOSTextField
                    label="Designation"
                    value={formData.designationName || ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <BOSTextField
                    label="Document Reference ID"
                    value={formData.documentReferenceNumber || ''}
                    InputProps={{ readOnly: true }}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  {formData.documentType === 'Offer Letter' && (
                    <BOSTextField
                      label="Issue / Execution Date"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  {formData.documentType === 'Appointment Order' && (
                    <BOSTextField
                      label="Joining Date"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, joiningDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  {formData.documentType === 'Confirmation Order' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <BOSTextField
                          label="Probation Completion Date"
                          type="date"
                          value={formData.probationCompletionDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, probationCompletionDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <BOSTextField
                          label="Confirmation Effective Date"
                          type="date"
                          value={formData.confirmationEffectiveDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, confirmationEffectiveDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  )}
                  {formData.documentType === 'Relieving Order' && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <BOSTextField
                          label="Resignation Date"
                          type="date"
                          value={formData.resignationDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, resignationDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <BOSTextField
                          label="Last Working Day"
                          type="date"
                          value={formData.lastWorkingDay}
                          onChange={(e) => setFormData((prev) => ({ ...prev, lastWorkingDay: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <BOSTextField
                    select
                    label="Status"
                    value={formData.statusName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, statusName: e.target.value }))}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Issued">Issued</MenuItem>
                  </BOSTextField>
                </Grid>
              </Grid>
            </BOSFormSection>

            {/* Live View Container (Bottom Span) */}
            <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: 'grey.50',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setPreviewExpanded(!previewExpanded)}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconFileText size={20} color={theme.palette.primary.main} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Live Document Content Preview
                  </Typography>
                </Stack>
                <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                  {previewExpanded ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </Box>
              {previewExpanded && (
                <Box sx={{ p: 2.5, bgcolor: '#fafafa', minHeight: 250, maxHeight: 450, overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(compileTemplate()) }} />
                </Box>
              )}
            </Paper>
          </Stack>
        )}

        {activeStep === 1 && (
          <Box sx={{ width: '100%', py: 1 }}>
            {/* Header & Subtitle */}
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.main' }}>
              Step 2: Dynamic Column Mapping
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Toggle output columns and optionally rename their headers
            </Typography>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search discovered entity columns..."
              value={searchColumnQuery}
              onChange={(e) => setSearchColumnQuery(e.target.value)}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} color="#757575" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Grid Component Layout */}
            <Grid container spacing={2}>
              {columnMapping
                .filter((field) =>
                  field.name.toLowerCase().includes(searchColumnQuery.toLowerCase())
                )
                .map((field) => (
                  <Grid item xs={12} sm={6} md={4} key={field.name}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        gap: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={field.enabled}
                          onChange={(e) => handleToggleField(field.name, e.target.checked)}
                          sx={{
                            color: '#1e90ff',
                            '&.Mui-checked': {
                              color: '#1e90ff',
                            },
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                          {field.name}
                        </Typography>
                      </Box>
                      <TextField
                        label="Rename Header"
                        variant="outlined"
                        size="small"
                        value={field.customRename}
                        onChange={(e) => handleRenameField(field.name, e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          width: 140,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                            },
                            '&:hover fieldset': {
                              borderColor: '#b0b0b0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#1e90ff',
                            },
                          },
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ width: '100%', py: 1 }}>
            {/* Header & Subtitle */}
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.main' }}>
              Step 8: Email Subject & Body templates
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Draft dynamic templates using replacement parameter fields
            </Typography>

            <Grid container spacing={3}>
              {/* Dynamic Placeholders Repository (Left Sidebar) */}
              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    bgcolor: 'rgba(30, 144, 255, 0.04)',
                    borderColor: 'rgba(30, 144, 255, 0.25)',
                    borderRadius: '12px',
                    height: '100%'
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <IconInfoCircle size={20} color="#1e90ff" />
                    <Typography variant="subtitle1" sx={{ color: '#1565c0', fontWeight: 800 }}>
                      Dynamic Placeholders
                    </Typography>
                  </Stack>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 2, fontWeight: 500 }}>
                    💡 Drag chips directly into any text input below, or click a chip to insert at your last cursor position.
                  </Typography>

                  {/* Section 1: Standard Parameters */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'grey.600' }}>
                      Standard Parameters
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                      {['{{todayDate}}', '{{totalCount}}', '{{reportData}}'].map((param) => (
                        <Chip
                          key={param}
                          label={param}
                          variant="outlined"
                          onClick={() => handleInsertChip(param)}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', param)}
                          sx={{
                            borderColor: '#1e90ff',
                            color: '#1e90ff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            bgcolor: 'background.paper',
                            '&:hover': {
                              bgcolor: 'rgba(30, 144, 255, 0.08)',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Section 2: Selected Entity Columns */}
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'grey.600' }}>
                      Selected Entity Columns (Dynamic Row Binding)
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                      {columnMapping
                        .filter((field) => field.enabled)
                        .map((field) => {
                          const chipText = `{{${field.customRename}}}`;
                          return (
                            <Chip
                              key={field.name}
                              label={chipText}
                              variant="outlined"
                              onClick={() => handleInsertChip(chipText)}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('text/plain', chipText)}
                              sx={{
                                borderColor: '#1e90ff',
                                color: '#1e90ff',
                                fontWeight: 700,
                                cursor: 'pointer',
                                bgcolor: 'background.paper',
                                '&:hover': {
                                  bgcolor: 'rgba(30, 144, 255, 0.08)',
                                },
                              }}
                            />
                          );
                        })}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>

              {/* Workspace Template Input Blocks (Right Workspace) */}
              <Grid item xs={12} md={8}>
                <Stack spacing={3}>
                  {/* Subject Line Box */}
                  <TextField
                    fullWidth
                    label="Email Subject line template"
                    placeholder="Email Subject line template"
                    variant="outlined"
                    value={templateData.subject}
                    onFocus={() => setActiveField('subject')}
                    onBlur={(e) => {
                      setActiveField('subject');
                      setCursorPos(e.target.selectionStart);
                    }}
                    onChange={(e) => setTemplateData((prev) => ({ ...prev, subject: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />

                  {/* Body Editor Box */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', ml: 1 }}>
                      Email Body layout template (HTML allowed)
                    </Typography>
                    <Box
                      onFocusCapture={() => setActiveField('body')}
                      sx={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}
                    >
                      <ReactQuillDemo
                        ref={quillRef}
                        value={templateData.body}
                        onChange={(val) => setTemplateData((prev) => ({ ...prev, body: val }))}
                        editorMinHeight={300}
                      />
                    </Box>
                  </Box>

                  {/* Footer Box */}
                  <TextField
                    fullWidth
                    label="Email Footer text"
                    variant="outlined"
                    value={templateData.footer}
                    onFocus={() => setActiveField('footer')}
                    onBlur={(e) => {
                      setActiveField('footer');
                      setCursorPos(e.target.selectionStart);
                    }}
                    onChange={(e) => setTemplateData((prev) => ({ ...prev, footer: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}
      </BOSFormDialog>

      {/* ── INLINE PREVIEW DIALOG ── */}
      <BOSFormDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Preview Onboarding Document"
        maxWidth="xl"
        isViewOnly={true}
        sidebar={
          viewRow && (
            <BOSPersonnelCard
              title="Employee"
              name={viewRow.employee ? viewRow.employee.employeeName : 'N/A'}
              empCode={viewRow.employee ? viewRow.employee.empCode : `EMP-${viewRow.employeeId}`}
              department={viewRow.department ? viewRow.department.departmentName : 'N/A'}
              photo={viewRow.employee ? viewRow.employee.employeePhotoUpload : null}
            />
          )
        }
      >
        {viewRow && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Document Content</Typography>
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                p: 2.5,
                bgcolor: '#fafafa',
                minHeight: 450,
                maxHeight: 650,
                overflow: 'auto'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(viewRow.documentContent || '') }} />
            </Box>
          </Box>
        )}
      </BOSFormDialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Confirm Deletion</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to permanently delete this onboarding record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
