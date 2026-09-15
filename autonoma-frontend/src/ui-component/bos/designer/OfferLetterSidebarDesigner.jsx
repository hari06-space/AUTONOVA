/**
 * Organization: AUTONOVA
 * Owner: hari06-space
 * Created At: 2026-08-30
 * Updated By: Logaraj S
 * Updated At: 2026-09-01
 * Description: Interactive Sidebar Canvas Designer for Offer Letter Templates.
 *              Allows visual drag/drop layout editing with dynamic field bindings.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconPrinter,
  IconDownload,
  IconZoomIn,
  IconZoomOut,
  IconX,
  IconPlus,
  IconTrash,
  IconCopy,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconArrowUp,
  IconArrowDown,
  IconLetterT,
  IconFileText,
  IconSeparator,
  IconUser,
  IconBriefcase,
  IconCalendar,
  IconCashBanknote,
  IconBuildingSkyscraper,
  IconPhoto,
  IconGavel,
  IconPaperclip,
  IconUpload,
  IconChevronDown,
  IconMaximize
} from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { getDisplayString } from '../BOSUtils';

// Available Dynamic Field Options for binding
const DYNAMIC_FIELDS_LIST = [
  { label: 'Candidate Name', value: 'candidate.name' },
  { label: 'Candidate ID', value: 'candidate.id' },
  { label: 'Candidate Email', value: 'candidate.email' },
  { label: 'Candidate Mobile', value: 'candidate.mobile' },
  { label: 'Gender', value: 'candidate.gender' },
  { label: 'Date of Birth', value: 'candidate.dob' },
  { label: 'Designation', value: 'employee.designation' },
  { label: 'Department', value: 'employee.department' },
  { label: 'Reporting Manager', value: 'employee.reportingManager' },
  { label: 'Work Location', value: 'employee.location' },
  { label: 'Employment Type', value: 'employee.employmentType' },
  { label: 'Grade / Band', value: 'employee.grade' },
  { label: 'Offer Letter No', value: 'offer.offerNumber' },
  { label: 'Offer Issue Date', value: 'offer.offerDate' },
  { label: 'Joining Date', value: 'offer.joiningDate' },
  { label: 'Probation Period', value: 'offer.probationPeriod' },
  { label: 'Annual CTC', value: 'salary.ctc' },
  { label: 'Basic Pay', value: 'salary.basicPay' },
  { label: 'HRA Pay', value: 'salary.hraPay' },
  { label: 'Special Allowance', value: 'salary.specialAllowance' },
  { label: 'Gross Monthly Salary', value: 'salary.grossSalary' },
  { label: 'Company Name', value: 'company.name' },
  { label: 'Company Address', value: 'company.address' }
];

// Initial Offer Letter Canvas Layout Components
const INITIAL_SIDEBAR_COMPONENTS = [
  {
    id: 'c_logo',
    type: 'company_logo',
    title: 'Company Logo',
    x: 40,
    y: 30,
    width: 140,
    height: 50,
    alignment: 'left'
  },
  {
    id: 'c_company_details',
    type: 'company_details',
    title: 'Company Header Information',
    x: 200,
    y: 30,
    width: 554,
    height: 65,
    fontSize: 12,
    alignment: 'right'
  },
  {
    id: 'c_divider',
    type: 'divider',
    title: 'Header Separator Line',
    x: 40,
    y: 100,
    width: 714,
    height: 2,
    color: '#1a365d'
  },
  {
    id: 'c_doc_title',
    type: 'heading',
    title: 'Document Title',
    text: 'OFFER OF EMPLOYMENT',
    x: 40,
    y: 115,
    width: 714,
    height: 35,
    fontSize: 18,
    fontWeight: 'bold',
    alignment: 'center',
    color: '#1a365d',
    textDecoration: 'underline'
  },
  {
    id: 'c_meta',
    type: 'offer_details',
    title: 'Offer Metadata & Ref No',
    x: 40,
    y: 155,
    width: 714,
    height: 25,
    fontSize: 12
  },
  {
    id: 'c_candidate_info',
    type: 'candidate_info',
    title: 'Candidate Recipient Block',
    x: 40,
    y: 185,
    width: 714,
    height: 85,
    fontSize: 12
  },
  {
    id: 'c_opening_text',
    type: 'rich_text',
    title: 'Opening Salutation & Paragraph',
    text: 'Dear {{candidate.name}},\n\nWe are pleased to offer you the position of {{employee.designation}} in the {{employee.department}} department at {{company.name}}. Your joining date is scheduled for {{offer.joiningDate}} at {{employee.location}}.',
    x: 40,
    y: 275,
    width: 714,
    height: 65,
    fontSize: 12,
    lineHeight: 1.5,
    alignment: 'left'
  },
  {
    id: 'c_job_details',
    type: 'job_details',
    title: 'Job & Position Details Card',
    x: 40,
    y: 345,
    width: 714,
    height: 80,
    fontSize: 11
  },
  {
    id: 'c_salary_table',
    type: 'salary_details',
    title: 'Compensation Structure Table',
    x: 40,
    y: 435,
    width: 714,
    height: 165,
    fontSize: 11
  },
  {
    id: 'c_terms',
    type: 'terms_conditions',
    title: 'Employment Terms & Policies',
    x: 40,
    y: 610,
    width: 714,
    height: 130,
    fontSize: 11
  },
  {
    id: 'c_signature',
    type: 'signature',
    title: 'Signatures & Authorizations',
    x: 40,
    y: 750,
    width: 714,
    height: 80,
    fontSize: 12
  }
];

export default function OfferLetterSidebarDesigner({
  formData = {},
  onUpdateCompanyInfo,
  onClose
}) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Zoom State (Zoom Out, 100%, Zoom In, Fit)
  const [zoomLevel, setZoomLevel] = useState(70); // 70% fits sidebar neatly
  const [components, setComponents] = useState(INITIAL_SIDEBAR_COMPONENTS);
  const [selectedCompId, setSelectedCompId] = useState('c_doc_title');

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);

  // Selected Component helper
  const selectedComponent = useMemo(() => {
    return components.find(c => c.id === selectedCompId) || null;
  }, [components, selectedCompId]);

  // LIVE DYNAMIC DATA BINDING MAP (Synchronized instantly from current formData props)
  const liveDataMap = useMemo(() => {
    const name = getDisplayString(formData.candidateName) || 'Candidate Name';
    const code = getDisplayString(formData.candidateCode) || 'APP-2026-0001';
    const email = getDisplayString(formData.email) || 'candidate@example.com';
    const mobile = getDisplayString(formData.phone) || '9876543210';
    const gender = getDisplayString(formData.gender) || 'Male';
    const dob = formData.dob || '1996-01-01';

    const designation = getDisplayString(formData.designation) || 'Production Engineer';
    const department = getDisplayString(formData.department) || 'Production';
    const reportingManager = getDisplayString(formData.reportingManager) || 'Rajesh Kumar (Plant Head)';
    const location = getDisplayString(formData.workLocation) || 'Unit 1';
    const employmentType = getDisplayString(formData.employmentType) || 'Permanent';
    const grade = getDisplayString(formData.grade) || 'E1';

    const offerNumber = getDisplayString(formData.offerLetterNo || formData.refNo) || 'OL/2627/0042';
    const offerDate = formData.offerDate || new Date().toISOString().substring(0, 10);
    const joiningDate = formData.joiningDate || new Date().toISOString().substring(0, 10);
    const probationPeriod = formData.probationPeriod ? `${formData.probationPeriod} Months` : '6 Months';

    const basicPay = Number(formData.basicPay) || 30000;
    const hraPay = Number(formData.hraPay) || 12000;
    const specialAllowance = Number(formData.specialAllowance) || 9000;
    const bonusPay = Number(formData.bonusPay) || 3000;
    const variablePay = Number(formData.variablePay) || 0;
    const otherAllowances = Number(formData.otherAllowances) || 2000;
    const deductions = Number(formData.deductions) || 1800;

    const grossSalary = basicPay + hraPay + specialAllowance + bonusPay + variablePay + otherAllowances;
    const ctc = Number(formData.ctc) > 0 ? Number(formData.ctc) : (grossSalary * 12);

    const compInfo = formData.companyInfo || {};

    return {
      'candidate.name': name,
      'candidate.id': code,
      'candidate.email': email,
      'candidate.mobile': mobile,
      'candidate.gender': gender,
      'candidate.dob': dob,

      'employee.designation': designation,
      'employee.department': department,
      'employee.reportingManager': reportingManager,
      'employee.location': location,
      'employee.employmentType': employmentType,
      'employee.grade': grade,

      'offer.offerNumber': offerNumber,
      'offer.offerDate': offerDate,
      'offer.joiningDate': joiningDate,
      'offer.probationPeriod': probationPeriod,

      'salary.ctc': `₹${ctc.toLocaleString('en-IN')}`,
      'salary.basicPay': `₹${basicPay.toLocaleString('en-IN')}`,
      'salary.hraPay': `₹${hraPay.toLocaleString('en-IN')}`,
      'salary.specialAllowance': `₹${specialAllowance.toLocaleString('en-IN')}`,
      'salary.bonusPay': `₹${bonusPay.toLocaleString('en-IN')}`,
      'salary.grossSalary': `₹${grossSalary.toLocaleString('en-IN')}`,
      'salary.deductions': `₹${deductions.toLocaleString('en-IN')}`,

      'company.name': compInfo.companyName || 'AUTONOVA',
      'company.address': compInfo.companyAddress || 'Hosur, Tamil Nadu',
      'company.gstin': compInfo.companyGstin || '33AABCN1234F1Z5',
      'company.phone': compInfo.companyPhone || '+91 4344 278900',
      'company.email': compInfo.companyEmail || 'hr@autonova.com',
      'company.logo': compInfo.companyLogo || '/logo.png',
      'company.hrName': compInfo.hrName || 'Hari Chakkaravarthy',
      'company.hrDesignation': compInfo.hrDesignation || 'Head - HR'
    };
  }, [formData]);

  // Live Substitute Function
  const substitutePlaceholders = (text) => {
    if (!text) return '';
    let result = String(text);
    Object.keys(liveDataMap).forEach(key => {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, liveDataMap[key]);
    });
    return result;
  };

  // Add Component to A4 Canvas
  const handleAddComponent = (type, title, defaultProps = {}) => {
    const newId = `c_${type}_${Date.now()}`;
    const newComp = {
      id: newId,
      type,
      title: title || type.toUpperCase(),
      x: 40,
      y: 150 + (components.length * 35) % 600,
      width: type === 'divider' ? 714 : 350,
      height: type === 'divider' ? 2 : 50,
      fontSize: 12,
      fontWeight: 'normal',
      alignment: 'left',
      ...defaultProps
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedCompId(newId);
    enqueueSnackbar(`Added ${title || type} component to A4 canvas`, { variant: 'info' });
  };

  // Update Component Property
  const handleUpdateComponent = (id, property, value) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, [property]: value } : c));
  };

  // Component Actions (Delete, Duplicate, Layer Order)
  const handleDeleteComponent = (id) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedCompId === id) setSelectedCompId(null);
  };

  const handleDuplicateComponent = (id) => {
    const target = components.find(c => c.id === id);
    if (!target) return;
    const dup = { ...target, id: `c_${target.type}_${Date.now()}`, x: target.x + 15, y: target.y + 15 };
    setComponents(prev => [...prev, dup]);
    setSelectedCompId(dup.id);
  };

  // Dragging Handlers
  const handleMouseDownComp = (e, comp) => {
    e.stopPropagation();
    setSelectedCompId(comp.id);
    setIsDragging(true);

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const mouseX = (e.clientX - canvasBounds.left) / scale;
    const mouseY = (e.clientY - canvasBounds.top) / scale;

    setDragOffset({
      x: mouseX - comp.x,
      y: mouseY - comp.y
    });
  };

  const handleMouseMoveCanvas = (e) => {
    if (!isDragging || !selectedCompId || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;

    let newX = Math.round((e.clientX - canvasBounds.left) / scale - dragOffset.x);
    let newY = Math.round((e.clientY - canvasBounds.top) / scale - dragOffset.y);

    // Keep bounded inside A4 (794px × 1123px)
    newX = Math.max(10, Math.min(newX, 780 - (selectedComponent?.width || 100)));
    newY = Math.max(10, Math.min(newY, 1100 - (selectedComponent?.height || 30)));

    handleUpdateComponent(selectedCompId, 'x', newX);
    handleUpdateComponent(selectedCompId, 'y', newY);
  };

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
  };

  // Download PDF via html2pdf
  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-offer-sidebar-pdf');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Offer_Letter_${liveDataMap['candidate.id'] || 'Candidate'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
    enqueueSnackbar('PDF generated matching exact A4 designer layout!', { variant: 'success' });
  };

  // Render Dynamic Canvas Component
  const renderComponentContent = (comp) => {
    switch (comp.type) {
      case 'company_logo':
        return (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: comp.alignment || 'left' }}>
            <Box
              component="img"
              src={liveDataMap['company.logo']}
              alt="Logo"
              sx={{ maxHeight: comp.height || 50, maxWidth: comp.width || 140, objectFit: 'contain' }}
            />
          </Box>
        );

      case 'company_details':
        return (
          <Box sx={{ width: '100%', textAlign: comp.alignment || 'right', fontSize: `${comp.fontSize || 12}px`, color: '#333' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a365d', fontSize: '1rem' }}>
              {liveDataMap['company.name']}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {liveDataMap['company.address']}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              GSTIN: {liveDataMap['company.gstin']} | Mob: {liveDataMap['company.phone']} | Email: {liveDataMap['company.email']}
            </Typography>
          </Box>
        );

      case 'divider':
        return <Box sx={{ width: '100%', height: `${comp.height || 2}px`, bgcolor: comp.color || '#1a365d' }} />;

      case 'heading':
        return (
          <Typography
            variant="h4"
            sx={{
              fontWeight: comp.fontWeight || 800,
              fontSize: `${comp.fontSize || 18}px`,
              color: comp.color || '#1a365d',
              textAlign: comp.alignment || 'center',
              textDecoration: comp.textDecoration || 'none',
              width: '100%'
            }}
          >
            {substitutePlaceholders(comp.text)}
          </Typography>
        );

      case 'rich_text':
      case 'text':
        return (
          <Typography
            variant="body2"
            sx={{
              fontSize: `${comp.fontSize || 12}px`,
              fontWeight: comp.fontWeight || 'normal',
              textAlign: comp.alignment || 'left',
              lineHeight: comp.lineHeight || 1.5,
              color: comp.color || '#333',
              width: '100%',
              whiteSpace: 'pre-wrap'
            }}
          >
            {substitutePlaceholders(comp.text)}
          </Typography>
        );

      case 'offer_details':
        return (
          <Stack direction="row" justifyContent="space-between" sx={{ width: '100%', fontSize: `${comp.fontSize || 12}px` }}>
            <Typography variant="caption"><b>DOC. No :</b> {liveDataMap['offer.offerNumber']}</Typography>
            <Typography variant="caption"><b>Date :</b> {liveDataMap['offer.offerDate']}</Typography>
          </Stack>
        );

      case 'candidate_info':
        return (
          <Box sx={{ width: '100%', fontSize: `${comp.fontSize || 12}px` }}>
            <Typography variant="body2">To,</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{liveDataMap['candidate.name']}</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Candidate / Employee ID: {liveDataMap['candidate.id']}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Email: {liveDataMap['candidate.email']} | Mobile: {liveDataMap['candidate.mobile']}
            </Typography>
          </Box>
        );

      case 'job_details':
        return (
          <Box sx={{ width: '100%', p: 1, border: '1px solid #e2e8f0', borderRadius: '6px', bgcolor: '#f8fafc', fontSize: `${comp.fontSize || 11}px` }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Designation:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{liveDataMap['employee.designation']}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Department:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{liveDataMap['employee.department']}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Location:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{liveDataMap['employee.location']}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Employment Type:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{liveDataMap['employee.employmentType']}</Typography>
              </Grid>
            </Grid>
          </Box>
        );

      case 'salary_details':
        return (
          <Box sx={{ width: '100%', fontSize: `${comp.fontSize || 11}px` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#1a365d' }}>
              Compensation Structure:
            </Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f4f8' }}>
                  <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'left' }}>Component</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>Monthly (₹)</th>
                  <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>Annual (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>Basic Salary</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{liveDataMap['salary.basicPay']}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>₹{(Number(formData.basicPay || 30000) * 12).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>House Rent Allowance (HRA)</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{liveDataMap['salary.hraPay']}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>₹{(Number(formData.hraPay || 12000) * 12).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>Special Allowance</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{liveDataMap['salary.specialAllowance']}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>₹{(Number(formData.specialAllowance || 9000) * 12).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e6fffa' }}>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>Total CTC (Cost to Company)</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{liveDataMap['salary.grossSalary']}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{liveDataMap['salary.ctc']}</td>
                </tr>
              </tbody>
            </table>
          </Box>
        );

      case 'terms_conditions':
        return (
          <Box sx={{ width: '100%', fontSize: `${comp.fontSize || 11}px`, color: '#444' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#1a365d' }}>
              Standard Terms & Conditions:
            </Typography>
            <ol style={{ paddingLeft: '16px', margin: 0 }}>
              <li>Probation period of {liveDataMap['offer.probationPeriod']} applies from employment start date.</li>
              <li>Notice period of 90 days required upon resignation or salary in lieu.</li>
              <li>Strict confidentiality of company trade secrets and proprietary data.</li>
            </ol>
          </Box>
        );

      case 'signature':
        return (
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ width: '100%', fontSize: `${comp.fontSize || 12}px`, pt: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Prepared By:</Typography>
              <Typography variant="caption" color="text.secondary">HR Operations</Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Verified By / Authorized Signatory:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1a365d' }}>{liveDataMap['company.hrName']}</Typography>
            </Box>
          </Stack>
        );

      case 'dynamic_field':
        return (
          <Box sx={{ width: '100%', fontSize: `${comp.fontSize || 12}px` }}>
            <Typography variant="body2" sx={{ fontWeight: comp.fontWeight || 'normal' }}>
              {comp.label ? `${comp.label}: ` : ''}<b>{substitutePlaceholders(`{{${comp.field || 'candidate.name'}}}`)}</b>
            </Typography>
          </Box>
        );

      default:
        return <Typography variant="body2">{comp.text || comp.title}</Typography>;
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'sticky',
        top: 80,
        borderRadius: '12px',
        bgcolor: '#f1f5f9',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar Header Toolbar (Zoom Controls, Print, Download, Close) */}
      <Box sx={{ p: 1.5, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconPrinter size={20} color={theme.palette.primary.main} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Live A4 PDF Designer
          </Typography>
        </Stack>

        {/* Zoom Controls (Zoom Out, 100%, Zoom In, Fit) */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Stack direction="row" alignItems="center" spacing={0.2} sx={{ bgcolor: 'grey.100', px: 1, py: 0.2, borderRadius: '6px' }}>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={() => setZoomLevel(prev => Math.max(40, prev - 10))}>
                <IconZoomOut size={16} />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 35, textAlign: 'center' }}>
              {zoomLevel}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}>
                <IconZoomIn size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit to Sidebar">
              <IconButton size="small" onClick={() => setZoomLevel(68)}>
                <IconMaximize size={16} />
              </IconButton>
            </Tooltip>
          </Stack>

          <Tooltip title="Download PDF">
            <IconButton size="small" color="primary" onClick={handleDownloadPDF}>
              <IconDownload size={18} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Print Document">
            <IconButton size="small" color="secondary" onClick={() => window.print()}>
              <IconPrinter size={18} />
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={onClose} title="Close Preview Sidebar">
            <IconX size={18} />
          </IconButton>
        </Stack>
      </Box>

      {/* Accordion Component Toolbox & Properties Bar inside Sidebar */}
      <Box sx={{ bgcolor: '#fff', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Accordion size="small" sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<IconChevronDown size={16} />} sx={{ minHeight: 32, p: 0 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
              + Add Components / Edit Selected Element
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1, pt: 0 }}>
            <Stack spacing={1}>
              {/* Component Buttons */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                <Chip label="+ Heading" size="small" onClick={() => handleAddComponent('heading', 'Section Heading', { text: 'HEADING' })} />
                <Chip label="+ Rich Text" size="small" onClick={() => handleAddComponent('rich_text', 'Rich Text', { text: 'Paragraph text...' })} />
                <Chip label="+ Candidate Info" size="small" color="primary" onClick={() => handleAddComponent('candidate_info', 'Candidate Info')} />
                <Chip label="+ Job Details" size="small" color="primary" onClick={() => handleAddComponent('job_details', 'Job Details')} />
                <Chip label="+ Salary Table" size="small" color="primary" onClick={() => handleAddComponent('salary_details', 'Salary Table')} />
                <Chip label="+ Terms" size="small" color="primary" onClick={() => handleAddComponent('terms_conditions', 'Terms')} />
                <Chip label="+ Signatures" size="small" color="primary" onClick={() => handleAddComponent('signature', 'Signatures')} />
                <Chip label="+ Divider" size="small" onClick={() => handleAddComponent('divider', 'Divider', { height: 2 })} />
              </Stack>

              {/* Selected Component Inspector Bar */}
              {selectedComponent && (
                <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1.5, mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}>
                    Inspector: {selectedComponent.title}
                  </Typography>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={3}>
                      <TextField
                        label="X (px)"
                        size="small"
                        type="number"
                        value={selectedComponent.x}
                        onChange={(e) => handleUpdateComponent(selectedComponent.id, 'x', Number(e.target.value))}
                        inputProps={{ style: { fontSize: '11px', padding: '4px' } }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        label="Y (px)"
                        size="small"
                        type="number"
                        value={selectedComponent.y}
                        onChange={(e) => handleUpdateComponent(selectedComponent.id, 'y', Number(e.target.value))}
                        inputProps={{ style: { fontSize: '11px', padding: '4px' } }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        label="W (px)"
                        size="small"
                        type="number"
                        value={selectedComponent.width}
                        onChange={(e) => handleUpdateComponent(selectedComponent.id, 'width', Number(e.target.value))}
                        inputProps={{ style: { fontSize: '11px', padding: '4px' } }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleDuplicateComponent(selectedComponent.id)} title="Duplicate">
                          <IconCopy size={14} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteComponent(selectedComponent.id)} title="Delete">
                          <IconTrash size={14} />
                        </IconButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Main Interactive A4 Document Sheet Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          bgcolor: '#e2e8f0'
        }}
      >
        <Box
          ref={canvasRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          sx={{
            width: 794,
            height: 1123,
            bgcolor: '#ffffff',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            position: 'relative',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: isDragging ? 'none' : 'transform 0.15s ease',
            mb: 4,
            border: '1px solid #cbd5e1'
          }}
        >
          {/* Printable Element for html2pdf */}
          <Box id="printable-offer-sidebar-pdf" sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {components.map((comp) => {
              const isSelected = selectedCompId === comp.id;
              return (
                <Box
                  key={comp.id}
                  onMouseDown={(e) => handleMouseDownComp(e, comp)}
                  sx={{
                    position: 'absolute',
                    left: `${comp.x}px`,
                    top: `${comp.y}px`,
                    width: comp.width ? `${comp.width}px` : 'auto',
                    minHeight: comp.height ? `${comp.height}px` : 'auto',
                    cursor: 'grab',
                    userSelect: 'none',
                    border: isSelected ? '2px solid #2563eb' : '1px dashed transparent',
                    '&:hover': {
                      border: isSelected ? '2px solid #2563eb' : '1px dashed #94a3b8'
                    },
                    p: 0.5,
                    bgcolor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  {renderComponentContent(comp)}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
