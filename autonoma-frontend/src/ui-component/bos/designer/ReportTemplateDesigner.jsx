import React, { useState, useEffect, useRef } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Slider,
  Breadcrumbs,
  Link,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconTemplate,
  IconPlus,
  IconDeviceFloppy,
  IconTrash,
  IconCopy,
  IconEye,
  IconDownload,
  IconUpload,
  IconZoomIn,
  IconZoomOut,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconLock,
  IconLockOpen,
  IconLayersIntersect,
  IconBinary,
  IconQrcode,
  IconBarcode,
  IconPhoto,
  IconTable,
  IconLetterT,
  IconFileText,
  IconLine,
  IconSquare,
  IconCircle,
  IconSeparator,
  IconSettings,
  IconPrinter,
  IconFileImport,
  IconArrowUp,
  IconArrowDown,
  IconChevronRight,
  IconChevronLeft,
  IconChevronDown,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconHistory,
  IconHelp,
  IconX
} from '@tabler/icons-react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { enqueueSnackbar } from 'notistack';
import html2pdf from 'html2pdf.js';
import { btnSave, btnCancel, btnEdit, btnDelete } from 'ui-component/bos/BOSStyles';
import { parsePdfToTemplateElements } from 'utils/pdfReverseParser';
import { interpolatePlaceholders, renderReportToPdfBlob, downloadReportPdf } from 'utils/BOSReportExecutor';

// Dynamic data field templates by page code
const PAGE_DATA_FIELDS = {
  // Company Profile
  'AD1110': [
    { label: 'Company Name ({{company.companyName}})', value: 'company.companyName' },
    { label: 'Address ({{company.address}})', value: 'company.address' },
    { label: 'GSTIN ({{company.gstin}})', value: 'company.gstin' },
    { label: 'Email ({{company.email}})', value: 'company.email' },
    { label: 'Phone ({{company.phone}})', value: 'company.phone' }
  ],
  // QMS Meeting Schedule Planner
  'QMS100': [
    { label: 'Schedule No ({{schedule.scheduleNo}})', value: 'schedule.scheduleNo' },
    { label: 'Meeting Date ({{schedule.meetingDate}})', value: 'schedule.meetingDate' },
    { label: 'Start Time ({{schedule.startTime}})', value: 'schedule.startTime' },
    { label: 'End Time ({{schedule.endTime}})', value: 'schedule.endTime' },
    { label: 'Meeting Name ({{schedule.meetingName}})', value: 'schedule.meetingName' },
    { label: 'Host Name ({{schedule.hostName}})', value: 'schedule.hostName' },
    { label: 'Chaired Person ({{schedule.chairedBy}})', value: 'schedule.chairedBy' },
    { label: 'Subject / Agenda ({{schedule.subject}})', value: 'schedule.subject' },
    { label: 'Comments ({{schedule.comments}})', value: 'schedule.comments' },
    { label: 'Status ({{schedule.status}})', value: 'schedule.status' }
  ],
  // QMS MOM Verification & Approval
  'QMS200': [
    { label: 'MIN No ({{mom.minNo}})', value: 'mom.minNo' },
    { label: 'MOM Date ({{mom.momDate}})', value: 'mom.momDate' },
    { label: 'Target Date ({{mom.targetDate}})', value: 'mom.targetDate' },
    { label: 'Discussed Point ({{mom.discussedPoint}})', value: 'mom.discussedPoint' },
    { label: 'Action Taken ({{mom.actionTaken}})', value: 'mom.actionTaken' },
    { label: 'Action Observation ({{mom.actionObservation}})', value: 'mom.actionObservation' },
    { label: 'Assigned By ({{mom.assignedBy}})', value: 'mom.assignedBy' },
    { label: 'Assigned To ({{mom.assignedTo}})', value: 'mom.assignedTo' },
    { label: 'Status ({{mom.status}})', value: 'mom.status' },
    { label: 'Delay Days ({{mom.delayDays}})', value: 'mom.delayDays' }
  ],
  // QMS Audit Observation & Report
  'QMS300': [
    { label: 'Audit No ({{audit.auditNo}})', value: 'audit.auditNo' },
    { label: 'Audit Date ({{audit.auditDate}})', value: 'audit.auditDate' },
    { label: 'Auditor Name ({{audit.auditor}})', value: 'audit.auditor' },
    { label: 'Auditee Department ({{audit.auditee}})', value: 'audit.auditee' },
    { label: 'Audit Clause ({{audit.clause}})', value: 'audit.clause' },
    { label: 'Observation ({{audit.observation}})', value: 'audit.observation' },
    { label: 'Severity Level ({{audit.severity}})', value: 'audit.severity' },
    { label: 'Status ({{audit.status}})', value: 'audit.status' }
  ],
  // Purchase Order
  'PU1000': [
    { label: 'PO Number ({{po.poNo}})', value: 'po.poNo' },
    { label: 'PO Date ({{po.poDate}})', value: 'po.poDate' },
    { label: 'Vendor Name ({{po.vendorName}})', value: 'po.vendorName' },
    { label: 'Vendor Address ({{po.vendorAddress}})', value: 'po.vendorAddress' },
    { label: 'Vendor GSTIN ({{po.gstin}})', value: 'po.gstin' },
    { label: 'Payment Terms ({{po.paymentTerms}})', value: 'po.paymentTerms' },
    { label: 'Delivery Terms ({{po.deliveryTerms}})', value: 'po.deliveryTerms' },
    { label: 'Subtotal Amount ({{po.subtotal}})', value: 'po.subtotal' },
    { label: 'Tax Amount ({{po.taxAmount}})', value: 'po.taxAmount' },
    { label: 'Total Net Amount ({{po.totalAmount}})', value: 'po.totalAmount' }
  ],
  // Gate Entry Trans
  'GE1000': [
    { label: 'Gate Entry No ({{ge.geNo}})', value: 'ge.geNo' },
    { label: 'Entry Date ({{ge.geDate}})', value: 'ge.geDate' },
    { label: 'Vehicle Number ({{ge.vehicleNo}})', value: 'ge.vehicleNo' },
    { label: 'Driver Name ({{ge.driverName}})', value: 'ge.driverName' },
    { label: 'Invoice No ({{ge.invoiceNo}})', value: 'ge.invoiceNo' },
    { label: 'Vendor Name ({{ge.vendorName}})', value: 'ge.vendorName' },
    { label: 'Material Remarks ({{ge.remarks}})', value: 'ge.remarks' },
    { label: 'Status ({{ge.status}})', value: 'ge.status' }
  ],
  // Employee Master
  'M2210': [
    { label: 'Employee ID ({{employee.employeeId}})', value: 'employee.employeeId' },
    { label: 'Employee Name ({{employee.employeeName}})', value: 'employee.employeeName' },
    { label: 'Designation ({{employee.designationName}})', value: 'employee.designationName' },
    { label: 'Department ({{employee.departmentName}})', value: 'employee.departmentName' },
    { label: 'Employee Type ({{employee.employeeType}})', value: 'employee.employeeType' },
    { label: 'Date of Joining ({{employee.dateOfJoining}})', value: 'employee.dateOfJoining' },
    { label: 'Salary Grade ({{employee.salaryGrade}})', value: 'employee.salaryGrade' }
  ],
  // Purchase Request Entry / List
  'AD1200': [
    { label: 'PR No ({{pr.prNo}})', value: 'pr.prNo' },
    { label: 'PR Date ({{pr.prDate}})', value: 'pr.prDate' },
    { label: 'Department ({{pr.departmentName}})', value: 'pr.departmentName' },
    { label: 'Planner ({{pr.plannerName}})', value: 'pr.plannerName' },
    { label: 'Status ({{pr.workflowStatus}})', value: 'pr.workflowStatus' },
    { label: 'Total Amount ({{pr.totalAmount}})', value: 'pr.totalAmount' }
  ],
  // Visitor Pass Trans
  'OM1000': [
    { label: 'Pass No ({{visitor.passNo}})', value: 'visitor.passNo' },
    { label: 'Visitor Name ({{visitor.visitorName}})', value: 'visitor.visitorName' },
    { label: 'Company ({{visitor.companyName}})', value: 'visitor.companyName' },
    { label: 'Purpose ({{visitor.purpose}})', value: 'visitor.purpose' },
    { label: 'Whom to Meet ({{visitor.contactPerson}})', value: 'visitor.contactPerson' },
    { label: 'Check In Time ({{visitor.checkInTime}})', value: 'visitor.checkInTime' },
    { label: 'Check Out Time ({{visitor.checkOutTime}})', value: 'visitor.checkOutTime' },
    { label: 'Status ({{visitor.status}})', value: 'visitor.status' }
  ],
  // Customer Master
  'M5130': [
    { label: 'Customer ID ({{customer.customerId}})', value: 'customer.customerId' },
    { label: 'Customer Name ({{customer.customerName}})', value: 'customer.customerName' },
    { label: 'Contact Person ({{customer.contactPerson}})', value: 'customer.contactPerson' },
    { label: 'GSTIN ({{customer.gstin}})', value: 'customer.gstin' },
    { label: 'Email ({{customer.email}})', value: 'customer.email' },
    { label: 'Phone ({{customer.phone}})', value: 'customer.phone' },
    { label: 'Credit Limit ({{customer.creditLimit}})', value: 'customer.creditLimit' }
  ],
  // Default fallback fields
  'default': [
    { label: 'Document Number ({{doc.number}})', value: 'doc.number' },
    { label: 'Document Date ({{doc.date}})', value: 'doc.date' },
    { label: 'Total Value ({{doc.total}})', value: 'doc.total' },
    { label: 'Remarks ({{doc.remarks}})', value: 'doc.remarks' }
  ]
};

// Available toolbox items
const TOOLBOX_ITEMS = [
  { type: 'text', label: 'Text Block', icon: IconLetterT, defaultContent: 'Double click to edit text' },
  { type: 'dynamic', label: 'Dynamic Field', icon: IconBinary, defaultContent: '{{doc.number}}' },
  { type: 'image', label: 'Image', icon: IconPhoto, defaultContent: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
  { type: 'table', label: 'Data Table', icon: IconTable },
  { type: 'qrcode', label: 'QR Code', icon: IconQrcode, defaultContent: 'https://autonova.erp' },
  { type: 'barcode', label: 'Barcode', icon: IconBarcode, defaultContent: '1234567890' },
  { type: 'line', label: 'Horizontal Line', icon: IconLine },
  { type: 'rectangle', label: 'Rectangle Shape', icon: IconSquare },
  { type: 'circle', label: 'Circle Shape', icon: IconCircle },
  { type: 'divider', label: 'Section Divider', icon: IconSeparator }
];

export default function ReportTemplateDesigner() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0); // 0 = List, 1 = Designer
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [inlineEditingId, setInlineEditingId] = useState(null);

  // Live Data Simulator State & Context
  const [simulateLive, setSimulateLive] = useState(false);
  const mockSimulationContext = {
    company: {
      companyName: 'AUTONOVA',
      address: 'Chennai, Tamil Nadu, 600122',
      gstin: '33AABCN1234F1Z5',
      email: 'info@autonova.com',
      phone: '+91 9876543210'
    },
    schedule: {
      scheduleNo: 'SCH-2026-089',
      meetingDate: '03/09/2026',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      meetingName: 'Management Review Meeting (MRM)',
      hostName: 'Admin System',
      chairedBy: 'Managing Director',
      subject: 'QMS ISO 9001:2015 Audit Planning',
      comments: 'All HODs must attend with department metrics.',
      status: 'SCHEDULED'
    },
    mom: {
      minNo: 'MIN-2026-042',
      momDate: '03/09/2026',
      targetDate: '15/09/2026',
      discussedPoint: 'Review of Machine Calibration Frequency and Maintenance SLA',
      actionTaken: 'Vendor dispatched replacement pressure transducer',
      actionObservation: 'Calibration verified under ISO Clause 7.1.5',
      assignedBy: 'Akash (QA Lead)',
      assignedTo: 'Naresh S (Maintenance Eng)',
      status: 'VERIFIED',
      delayDays: '0'
    },
    audit: {
      auditNo: 'AUD-2026-015',
      auditDate: '01/09/2026',
      auditor: 'Senior QA Inspector',
      auditee: 'Production & Stores',
      clause: 'Clause 8.5.2 Identification & Traceability',
      observation: 'Batch identification tags missing on raw material rack B-4',
      severity: 'Major NCR',
      status: 'OPEN'
    },
    po: {
      poNo: 'PO-2026-00542',
      poDate: '02/09/2026',
      vendorName: 'Apex Industrial Fasteners Ltd',
      vendorAddress: 'Ambattur Industrial Estate, Chennai',
      gstin: '33AAACA4455F1Z2',
      paymentTerms: '30 Days Net',
      deliveryTerms: 'Ex-Works',
      subtotal: 145000,
      taxAmount: 26100,
      totalAmount: 171100
    },
    doc: {
      number: 'DOC-2026-990',
      date: '03/09/2026',
      total: '₹ 2,45,000',
      remarks: 'Approved for production execution'
    },
    system: {
      pageNo: 1,
      totalPages: 1,
      currentDate: new Date().toLocaleDateString()
    }
  };

  // Template Master Fields
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [templateType, setTemplateType] = useState('PDF');
  const [pageId, setPageId] = useState(1);
  const [version, setVersion] = useState(1);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(1);
  const [isDefault, setIsDefault] = useState(0);

  // Fetch ERP Pages for dropdown selection
  const { data: bosPages = [] } = useSWR('/api/bos-pages', (url) => axios.get(url).then(res => res.data));

  // Determine current active page code
  const selectedPage = bosPages.find((p) => String(p.pageId) === String(pageId));
  const selectedPageCode = selectedPage ? selectedPage.pageCode : '';

  // Fetch dynamically reflected schema entities from the backend
  const { data: pageSchema = [] } = useSWR(selectedPageCode ? `/api/page-schemas/${selectedPageCode}` : null, (url) => axios.get(url).then(res => res.data));

  // Get dynamic tree of DB fields based on selected page
  const getDynamicTree = () => {
    return [
      {
        label: 'Company Details',
        id: 'company_fields',
        children: [
          { label: 'Company Name ({{company.companyName}})', id: 'company.companyName', value: 'company.companyName' },
          { label: 'Address ({{company.address}})', id: 'company.address', value: 'company.address' },
          { label: 'GSTIN ({{company.gstin}})', id: 'company.gstin', value: 'company.gstin' },
          { label: 'Email ({{company.email}})', id: 'company.email', value: 'company.email' },
          { label: 'Phone ({{company.phone}})', id: 'company.phone', value: 'company.phone' }
        ]
      },
      ...pageSchema,
      {
        label: 'System Fields',
        id: 'system_fields',
        children: [
          { label: 'Page Number ({{system.pageNo}})', id: 'system.pageNo', value: 'system.pageNo' },
          { label: 'Total Pages ({{system.totalPages}})', id: 'system.totalPages', value: 'system.totalPages' },
          { label: 'Current Date ({{system.currentDate}})', id: 'system.currentDate', value: 'system.currentDate' }
        ]
      }
    ];
  };

  // Designer Canvas States
  const [canvasWidth, setCanvasWidth] = useState(794); // A4 Width in pixels at 72dpi
  const [canvasHeight, setCanvasHeight] = useState(1123); // A4 Height in pixels
  const [pageSize, setPageSize] = useState('A4_portrait');
  const [zoom, setZoom] = useState(100);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [canvasBackgroundImage, setCanvasBackgroundImage] = useState(null);
  const [showBackground, setShowBackground] = useState(true);

  // Load PDF.js script dynamically for real client-side parsing
  useEffect(() => {
    if (window.pdfjsLib) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib = window['pdfjs-dist/build/pdf'];
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    };
    document.head.appendChild(script);
  }, []);

  // Dialogs & Revision states
  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);

  // Version history states
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [previewHistoryElements, setPreviewHistoryElements] = useState(null);
  const [previewHistoryVersion, setPreviewHistoryVersion] = useState(null);

  // Load Templates
  const loadTemplates = async () => {
    try {
      const res = await axios.get('/api/report-templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to fetch templates', { variant: 'error' });
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Keyboard shortcut to delete selected element
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedElementId) return;
      const activeTagName = document.activeElement?.tagName?.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        pushStateToHistory(elements.filter((el) => el.id !== selectedElementId));
        setSelectedElementId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, elements]);

  // Sync Canvas Dimensions based on page size selection
  useEffect(() => {
    if (pageSize === 'A4_portrait') {
      setCanvasWidth(794);
      setCanvasHeight(1123);
    } else if (pageSize === 'A4_landscape') {
      setCanvasWidth(1123);
      setCanvasHeight(794);
    }
  }, [pageSize]);

  // Undo/Redo Helper
  const pushStateToHistory = (newElements) => {
    setUndoHistory((prev) => [...prev, elements]);
    setRedoHistory([]);
    setElements(newElements);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const prev = undoHistory[undoHistory.length - 1];
    setUndoHistory((prevList) => prevList.slice(0, prevList.length - 1));
    setRedoHistory((prevList) => [...prevList, elements]);
    setElements(prev);
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setRedoHistory((prevList) => prevList.slice(0, prevList.length - 1));
    setUndoHistory((prevList) => [...prevList, elements]);
    setElements(next);
  };

  // Add Element to Canvas
  const handleAddElement = (type, defaultContent) => {
    const newElement = {
      id: 'el_' + Date.now(),
      type,
      x: 50,
      y: 50,
      width: type === 'line' || type === 'divider' ? 500 : 150,
      height: type === 'line' || type === 'divider' ? 20 : 50,
      content: defaultContent || (type === 'table' ? JSON.stringify([['Header 1', 'Header 2'], ['Row 1 Col 1', 'Row 1 Col 2']]) : 'New Component'),
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: 'normal',
      color: '#333333',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      padding: 5,
      textAlign: 'left',
      zIndex: elements.length + 1,
      locked: false,
      rotation: 0
    };
    pushStateToHistory([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  // Drag and Snap logic
  const handleCanvasMouseDown = (e, el) => {
    e.stopPropagation();
    if (el.locked || previewHistoryElements) return; // Disable dragging during history previews
    setSelectedElementId(el.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const elemX = Number(el.x) || 0;
    const elemY = Number(el.y) || 0;

    const handleMouseMove = (moveEvent) => {
      const scale = (zoom || 100) / 100;
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      let newX, newY;
      if (snapToGrid) {
        const snappedDx = Math.round(dx / gridSize) * gridSize;
        const snappedDy = Math.round(dy / gridSize) * gridSize;
        newX = elemX + snappedDx;
        newY = elemY + snappedDy;
      } else {
        newX = elemX + dx;
        newY = elemY + dy;
      }

      setElements((prev) =>
        prev.map((item) => (item.id === el.id ? { ...item, x: Math.max(0, newX), y: Math.max(0, newY) } : item))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setElements((latest) => {
        pushStateToHistory(latest);
        return latest;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Interactive Canvas Resize Handler
  const handleResizeMouseDown = (e, el) => {
    e.stopPropagation();
    if (el.locked || previewHistoryElements) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = Number(el.width) || 0;
    const startHeight = Number(el.height) || 0;

    const handleMouseMove = (moveEvent) => {
      const scale = (zoom || 100) / 100;
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      let newWidth, newHeight;
      if (snapToGrid) {
        const snappedDx = Math.round(dx / gridSize) * gridSize;
        const snappedDy = Math.round(dy / gridSize) * gridSize;
        newWidth = Math.max(10, startWidth + snappedDx);
        newHeight = Math.max(10, startHeight + snappedDy);
      } else {
        newWidth = Math.max(10, startWidth + dx);
        newHeight = Math.max(10, startHeight + dy);
      }

      setElements((prev) =>
        prev.map((item) => (item.id === el.id ? { ...item, width: newWidth, height: newHeight } : item))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setElements((latest) => {
        pushStateToHistory(latest);
        return latest;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Interactive Canvas Rotation Handler
  const handleRotateMouseDown = (e, el) => {
    e.stopPropagation();
    if (el.locked || previewHistoryElements) return;
    const rect = document.getElementById(el.id)?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let deg = Math.round(angle * (180 / Math.PI)) + 90;
      if (deg < 0) deg += 360;

      // Snap rotation to nearest 15 degrees if snapToGrid is active
      if (snapToGrid) {
        deg = Math.round(deg / 15) * 15;
      }

      setElements((prev) =>
        prev.map((item) => (item.id === el.id ? { ...item, rotation: deg } : item))
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setElements((latest) => {
        pushStateToHistory(latest);
        return latest;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Auto-sync JSON model whenever canvas elements or metadata change
  useEffect(() => {
    const templateConfig = {
      templateCode: templateCode || 'REPORT_TEMPLATE_01',
      templateName: templateName || 'New Report Template',
      pageId: pageId,
      pageCode: selectedPageCode,
      pageSize: pageSize,
      pageFormat: pageSize.includes('landscape') ? 'A4 Landscape' : 'A4 Portrait',
      elementsCount: elements.length,
      elements: elements,
      updatedAt: new Date().toISOString()
    };
    setJsonText(JSON.stringify(templateConfig, null, 2));
  }, [elements, pageSize, templateCode, templateName, pageId, selectedPageCode]);

  // Property Update Handler
  const updateSelectedProperty = (key, value) => {
    if (!selectedElementId) return;
    const updated = elements.map((el) => {
      if (el.id === selectedElementId) {
        const newItem = { ...el, [key]: value };
        if (key === 'content' && typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
          newItem.type = 'dynamic';
        }
        return newItem;
      }
      return el;
    });
    setElements(updated);
  };

  // Clear / Reset Canvas to fresh state
  const handleClearCanvas = () => {
    if (elements.length === 0 && !canvasBackgroundImage) {
      enqueueSnackbar('Canvas is already clear', { variant: 'info' });
      return;
    }
    if (window.confirm('Are you sure you want to clear the canvas? All elements, background guides, and edits will be reset to a fresh empty state.')) {
      pushStateToHistory([]);
      setElements([]);
      setSelectedElementId(null);
      setCanvasBackgroundImage(null);
      enqueueSnackbar('Canvas has been reset to a fresh empty state!', { variant: 'success' });
    }
  };

  // Save / Update API Call
  const handleSaveTemplate = async () => {
    if (!templateName || !templateCode) {
      enqueueSnackbar('Please supply template name and code', { variant: 'warning' });
      return;
    }

    const payload = {
      templateName,
      templateCode,
      templateType,
      pageId: parseInt(pageId),
      version: parseInt(version) || 1,
      description,
      status,
      isDefault,
      templateConfig: JSON.stringify({
        pageSize,
        elements
      })
    };

    try {
      let savedData;
      if (selectedTemplate && selectedTemplate.id) {
        const res = await axios.put(`/api/report-templates/${selectedTemplate.id}`, payload);
        savedData = res.data;
        enqueueSnackbar(`Template updated successfully (version auto-incremented to v${savedData.version})`, { variant: 'success' });
      } else {
        const res = await axios.post('/api/report-templates', payload);
        savedData = res.data;
        enqueueSnackbar('Template created successfully', { variant: 'success' });
      }
      loadTemplates();
      setSelectedTemplate(savedData);
      setVersion(savedData.version);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error saving template. Verify code is unique.', { variant: 'error' });
    }
  };

  // Load Version History list
  const handleLoadHistoryList = async () => {
    if (!selectedTemplate || !selectedTemplate.id) return;
    try {
      const res = await axios.get(`/api/report-templates/${selectedTemplate.id}/history`);
      setHistoryList(res.data);
      setHistoryOpen(true);
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to load version history logs', { variant: 'error' });
    }
  };

  // Preview historical version config
  const handlePreviewHistory = (historyItem) => {
    try {
      const config = JSON.parse(historyItem.templateConfig);
      setPreviewHistoryElements(config.elements || []);
      setPreviewHistoryVersion(historyItem.version);
      enqueueSnackbar(`Showing Preview of Revision v${historyItem.version} (Read Only)`, { variant: 'info' });
    } catch (err) {
      enqueueSnackbar('Error parsing history revision template config', { variant: 'error' });
    }
  };

  // Restore selected historical version config
  const handleRestoreHistory = () => {
    if (!previewHistoryElements) return;
    pushStateToHistory(previewHistoryElements);
    setPreviewHistoryElements(null);
    setPreviewHistoryVersion(null);
    setHistoryOpen(false);
    enqueueSnackbar('Revision configuration successfully restored to canvas!', { variant: 'success' });
  };

  // Clone Template Action
  const handleCloneTemplate = async (id) => {
    try {
      await axios.post(`/api/report-templates/${id}/clone`);
      enqueueSnackbar('Template cloned successfully', { variant: 'success' });
      loadTemplates();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error cloning template', { variant: 'error' });
    }
  };

  // Delete Template Action
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`/api/report-templates/${id}`);
      enqueueSnackbar('Template deleted', { variant: 'success' });
      loadTemplates();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error deleting template', { variant: 'error' });
    }
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 1 ? 0 : 1;
    try {
      await axios.put(`/api/report-templates/${id}/status?status=${nextStatus}`);
      enqueueSnackbar(`Template ${nextStatus === 1 ? 'Activated' : 'Deactivated'}`, { variant: 'success' });
      loadTemplates();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error updating status', { variant: 'error' });
    }
  };

  // JSON Import
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.elements) setElements(parsed.elements);
      if (parsed.pageSize) setPageSize(parsed.pageSize);
      setImportJsonOpen(false);
      enqueueSnackbar('JSON configuration imported successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Invalid JSON configuration file format', { variant: 'error' });
    }
  };

  // JSON Export
  const handleExportJson = () => {
    const configStr = JSON.stringify({ pageSize, elements }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(configStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${templateCode || 'report_template'}_config.json`);
    linkElement.click();
  };

  // Snapping and Grid states
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  // Parse and import PDF content using robust reverse parser
  const handleImportPdfFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      enqueueSnackbar('Parsing PDF layout and extracting elements...', { variant: 'info' });
      const result = await parsePdfToTemplateElements(file);
      
      setPageSize(result.isLandscape ? 'A4_landscape' : 'A4_portrait');
      if (result.pageSnapshot) {
        setCanvasBackgroundImage(result.pageSnapshot);
        setShowBackground(false);
      }

      if (result.elements && result.elements.length > 0) {
        setElements(result.elements);
        pushStateToHistory(result.elements);
        enqueueSnackbar(`PDF converted successfully! Extracted ${result.elements.length} editable canvas components. Click any text to edit or bind dynamic ERP data.`, { variant: 'success' });
      } else {
        setShowBackground(true);
        enqueueSnackbar('PDF read successfully (layout template set as background guide).', { variant: 'info' });
      }
    } catch (err) {
      console.error('[PDF Import Error]', err);
      enqueueSnackbar('Failed to parse PDF: ' + err.message, { variant: 'error' });
    } finally {
      if (e.target) e.target.value = '';
      setPdfImportOpen(false);
    }
  };

  // Print PDF Preview Rendering
  const handlePrintPdf = () => {
    const element = document.getElementById('canvas-print-area');
    const opt = {
      margin: 0,
      filename: `${templateCode || 'report_template'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: pageSize.includes('landscape') ? 'landscape' : 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Open Designer with existing template
  const handleOpenDesigner = (template) => {
    setSelectedTemplate(template);
    setTemplateName(template.templateName);
    setTemplateCode(template.templateCode);
    setTemplateType(template.templateType);
    setPageId(template.pageId);
    setVersion(template.version || 1);
    setDescription(template.description || '');
    setStatus(template.status);
    setIsDefault(template.isDefault);
    setPreviewHistoryElements(null);
    setPreviewHistoryVersion(null);

    try {
      const config = JSON.parse(template.templateConfig);
      if (config.elements) setElements(config.elements);
      if (config.pageSize) setPageSize(config.pageSize);
    } catch (e) {
      setElements([]);
    }
    setActiveTab(1);
  };

  // Open Designer with new blank template
  const handleOpenNewDesigner = () => {
    setSelectedTemplate(null);
    setTemplateName('New Report Template');
    setTemplateCode('REP_' + Date.now().toString().substring(8));
    setTemplateType('PDF');
    setPageId(bosPages[0]?.pageId || 1);
    setVersion(1);
    setDescription('');
    setStatus(1);
    setIsDefault(0);
    setElements([]);
    setPageSize('A4_portrait');
    setPreviewHistoryElements(null);
    setPreviewHistoryVersion(null);
    setActiveTab(1);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Helper to find page name matching pageId
  const getPageLabel = (id) => {
    const page = bosPages.find((p) => String(p.pageId) === String(id));
    return page ? `${page.pageName} (${page.pageCode})` : `Page ID: ${id}`;
  };

  return (
    <Box p={1}>
      {activeTab === 0 ? (
        <MainCard
          title="PDF Report Designer"
          pageCode="AD1200"
          stretch={false}
          secondary={
            <Button
              variant="contained"
              color="secondary"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenNewDesigner}
              sx={{ borderRadius: 2 }}
            >
              New Template
            </Button>
          }
        >
          <Grid container spacing={3}>
            {templates.map((tpl) => (
              <Grid item xs={12} sm={6} md={4} key={tpl.id}>
                <Card sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `1px solid ${tpl.isDefault ? theme.palette.primary.main : theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Box>
                      <Typography variant="h5" fontWeight={600}>{tpl.templateName}</Typography>
                      <Typography variant="caption" color="textSecondary">{tpl.templateCode} (v{tpl.version})</Typography>
                    </Box>
                    {tpl.isDefault === 1 && (
                      <Paper sx={{ px: 1, py: 0.25, backgroundColor: theme.palette.primary.light, color: theme.palette.primary.dark, fontSize: 10, fontWeight: 'bold' }}>
                        DEFAULT
                      </Paper>
                    )}
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>
                    {tpl.description || 'No description supplied.'}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="textSecondary" sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      <strong>Page:</strong> {getPageLabel(tpl.pageId)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      <span style={{ color: tpl.status === 1 ? 'green' : 'red', fontWeight: 'bold' }}>
                        {tpl.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box display="flex" justifyContent="space-between">
                    <Box display="flex" gap={0.5}>
                      <IconButton color="primary" onClick={() => handleOpenDesigner(tpl)}>
                        <IconSettings size={18} />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleCloneTemplate(tpl.id)}>
                        <IconCopy size={18} />
                      </IconButton>
                      <IconButton onClick={() => handleToggleStatus(tpl.id, tpl.status)}>
                        <IconLockOpen size={18} />
                      </IconButton>
                    </Box>
                    <IconButton color="error" onClick={() => handleDeleteTemplate(tpl.id)}>
                      <IconTrash size={18} />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
            {templates.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={6}>
                  <Typography color="textSecondary">No report templates defined. Click New Template to start.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </MainCard>
      ) : (
        <MainCard
          title={`Designer: ${templateName}`}
          pageCode="AD1200"
          stretch={false}
          secondary={
            <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
              <Tooltip title={leftSidebarCollapsed ? "Expand Design Tools Panel" : "Collapse Design Tools Panel"}>
                <IconButton 
                  onClick={() => setLeftSidebarCollapsed(prev => !prev)} 
                  color={leftSidebarCollapsed ? 'primary' : 'default'} 
                  sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.75 }}
                >
                  {leftSidebarCollapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
              <IconButton onClick={handleUndo} disabled={undoHistory.length === 0 || previewHistoryElements}><IconArrowBackUp size={20} /></IconButton>
              <IconButton onClick={handleRedo} disabled={redoHistory.length === 0 || previewHistoryElements}><IconArrowForwardUp size={20} /></IconButton>
              <Divider orientation="vertical" flexItem />
              {selectedTemplate && (
                <Button startIcon={<IconHistory size={18} />} color="secondary" variant="outlined" onClick={handleLoadHistoryList}>History Log</Button>
              )}
              <Button startIcon={<IconDeviceFloppy size={18} />} variant="contained" color="success" onClick={handleSaveTemplate} disabled={previewHistoryElements}>Save</Button>
              <Button startIcon={<IconEye size={18} />} variant="outlined" color="primary" onClick={() => setPreviewOpen(true)}>Preview</Button>
              <Button startIcon={<IconDownload size={18} />} variant="outlined" color="primary" onClick={handleExportJson}>Export Config</Button>
              <Button startIcon={<IconUpload size={18} />} variant="outlined" color="primary" onClick={() => setImportJsonOpen(true)} disabled={previewHistoryElements}>Import Config</Button>
              <Button startIcon={<IconFileImport size={18} />} variant="outlined" color="secondary" onClick={() => setPdfImportOpen(true)} disabled={previewHistoryElements}>Import PDF</Button>
              <Button startIcon={<IconTrash size={18} />} variant="outlined" color="warning" onClick={handleClearCanvas} disabled={previewHistoryElements}>Clear Canvas</Button>
              <Button startIcon={<IconArrowBackUp size={18} />} variant="outlined" color="error" onClick={() => setActiveTab(0)}>Exit</Button>
            </Box>
          }
        >
          {/* History Preview Banner */}
          {previewHistoryElements && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fef3c7', border: '1px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" color="#92400e" fontWeight="bold">
                ⚠️ Previewing Revision History v{previewHistoryVersion} (Read Only mode)
              </Typography>
              <Box display="flex" gap={1}>
                <Button variant="contained" color="warning" onClick={handleRestoreHistory}>Restore to Canvas</Button>
                <Button variant="outlined" color="warning" onClick={() => { setPreviewHistoryElements(null); setPreviewHistoryVersion(null); }}>Cancel Preview</Button>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2.5, height: 'calc(100vh - 150px)', width: '100%', overflow: 'hidden' }}>
            {/* Left side: Settings, Toolbox, Properties, and Binding Tree (30% Width) */}
            <Box sx={{
              width: leftSidebarCollapsed ? 0 : '30%',
              minWidth: leftSidebarCollapsed ? 0 : 320,
              maxWidth: leftSidebarCollapsed ? 0 : 400,
              flexShrink: 0,
              opacity: leftSidebarCollapsed ? 0 : 1,
              pointerEvents: leftSidebarCollapsed ? 'none' : 'auto',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}>
              <Card sx={{ p: 1.5, borderRadius: 3, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {/* Sidebar Header with Collapse Icon */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, pb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconTemplate size={18} color={theme.palette.primary.main} /> Design Tools
                  </Typography>
                  <Tooltip title="Collapse Panel">
                    <IconButton size="small" onClick={() => setLeftSidebarCollapsed(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: 0.5 }}>
                      <IconChevronLeft size={16} />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* 1. Template Settings Accordion */}
                <Accordion defaultExpanded disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}>
                    <Typography variant="subtitle1" fontWeight={600}>1. Template Settings</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Template Name" fullWidth size="small" value={templateName} onChange={(e) => setTemplateName(e.target.value)} disabled={previewHistoryElements} />
                    <TextField label="Template Code" fullWidth size="small" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} disabled={previewHistoryElements} />
                    
                    <FormControl fullWidth size="small" disabled={previewHistoryElements}>
                      <InputLabel>Page Format</InputLabel>
                      <Select value={pageSize} label="Page Format" onChange={(e) => setPageSize(e.target.value)}>
                        <MenuItem value="A4_portrait">A4 Portrait (210 × 297 mm)</MenuItem>
                        <MenuItem value="A4_landscape">A4 Landscape (297 × 210 mm)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" disabled={previewHistoryElements}>
                      <InputLabel>Type</InputLabel>
                      <Select value={templateType} label="Type" onChange={(e) => setTemplateType(e.target.value)}>
                        <MenuItem value="PDF">PDF</MenuItem>
                        <MenuItem value="HTML">HTML</MenuItem>
                      </Select>
                    </FormControl>

                    <Autocomplete
                      size="small"
                      disabled={previewHistoryElements}
                      options={bosPages}
                      getOptionLabel={(option) => option ? `${option.pageName} (${option.pageCode})` : ''}
                      value={bosPages.find(p => String(p.pageId) === String(pageId)) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setPageId(newValue.pageId);
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="ERP Page" size="small" />}
                    />
                    
                    <TextField label="Version" type="number" fullWidth size="small" value={previewHistoryVersion || version} disabled />
                    
                    <Divider sx={{ my: 0.5 }} />

                    {/* Canvas Display Controls */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                        Canvas Controls
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Zoom ({zoom}%)</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton size="small" onClick={() => setZoom(Math.max(50, zoom - 10))} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
                            <IconZoomOut size={15} />
                          </IconButton>
                          <IconButton size="small" onClick={() => setZoom(Math.min(200, zoom + 10))} sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}>
                            <IconZoomIn size={15} />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {canvasBackgroundImage && (
                        <FormControlLabel
                          control={<Switch size="small" checked={showBackground} onChange={(e) => setShowBackground(e.target.checked)} />}
                          label={<Typography variant="body2">Show BG Guide</Typography>}
                          disabled={previewHistoryElements}
                        />
                      )}

                      <FormControlLabel
                        control={<Switch size="small" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />}
                        label={<Typography variant="body2">Snap Grid</Typography>}
                        disabled={previewHistoryElements}
                      />

                      <FormControlLabel
                        control={<Switch size="small" checked={simulateLive} onChange={(e) => setSimulateLive(e.target.checked)} color="success" />}
                        label={<Typography variant="body2" sx={{ fontWeight: 700, color: simulateLive ? 'success.main' : 'text.primary' }}>⚡ Live Data Simulation</Typography>}
                      />
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <FormControlLabel control={<Switch size="small" checked={isDefault === 1} onChange={(e) => setIsDefault(e.target.checked ? 1 : 0)} />} label="Default" disabled={previewHistoryElements} />
                      <FormControlLabel control={<Switch size="small" checked={status === 1} onChange={(e) => setStatus(e.target.checked ? 1 : 0)} />} label="Active" disabled={previewHistoryElements} />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* 2. Components Toolbox Accordion */}
                <Accordion defaultExpanded disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}>
                    <Typography variant="subtitle1" fontWeight={600}>2. Components Toolbox</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1 }}>
                    <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={0.75}>
                      {TOOLBOX_ITEMS.map((item) => {
                        const IconComp = item.icon;
                        return (
                          <Button
                            key={item.type}
                            variant="outlined"
                            onClick={() => handleAddElement(item.type, item.defaultContent)}
                            disabled={previewHistoryElements}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              p: 0.5,
                              height: 64,
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontSize: 9,
                              minWidth: 0
                            }}
                          >
                            <IconComp size={18} style={{ marginBottom: 2 }} />
                            <Typography variant="caption" sx={{ fontSize: 8.5, lineHeight: 1.1, textAlign: 'center', wordBreak: 'break-word' }}>
                              {item.label}
                            </Typography>
                          </Button>
                        );
                      })}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* 3. Grid Layout Builder Accordion */}
                <Accordion defaultExpanded={false} disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}>
                    <Typography variant="subtitle1" fontWeight={600}>3. Grid Layout Builder</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      <Button variant="outlined" size="small" onClick={() => handleAddElement('row_50_50')} disabled={previewHistoryElements}>50/50 split</Button>
                      <Button variant="outlined" size="small" onClick={() => handleAddElement('row_30_70')} disabled={previewHistoryElements}>30/70 split</Button>
                      <Button variant="outlined" size="small" onClick={() => handleAddElement('row_25_4')} disabled={previewHistoryElements}>4 Columns</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* 4. Selected Component Properties Accordion */}
                {selectedElement && (
                  <Accordion defaultExpanded disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}>
                      <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center" pr={1}>
                        <Typography variant="subtitle1" fontWeight={600} color="primary">4. Component Properties</Typography>
                        <Box onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="small"
                            color={selectedElement.locked ? 'error' : 'default'}
                            onClick={() => updateSelectedProperty('locked', !selectedElement.locked)}
                            disabled={previewHistoryElements}
                          >
                            {selectedElement.locked ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              pushStateToHistory(elements.filter((e) => e.id !== selectedElementId));
                              setSelectedElementId(null);
                            }}
                            disabled={previewHistoryElements}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </Box>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {/* Sub-group A: Geometry */}
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary">Geometry & Layout</Typography>
                        <Box display="flex" gap={1.5}>
                          <TextField label="X" size="small" type="number" fullWidth value={selectedElement.x} onChange={(e) => updateSelectedProperty('x', e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={(e) => { if (e.target.value === '') updateSelectedProperty('x', 0); }} disabled={previewHistoryElements} />
                          <TextField label="Y" size="small" type="number" fullWidth value={selectedElement.y} onChange={(e) => updateSelectedProperty('y', e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={(e) => { if (e.target.value === '') updateSelectedProperty('y', 0); }} disabled={previewHistoryElements} />
                        </Box>
                        <Box display="flex" gap={1.5}>
                          <TextField label="Width" size="small" type="number" fullWidth value={selectedElement.width} onChange={(e) => updateSelectedProperty('width', e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={(e) => { if (e.target.value === '') updateSelectedProperty('width', 0); }} disabled={previewHistoryElements} />
                          <TextField label="Height" size="small" type="number" fullWidth value={selectedElement.height} onChange={(e) => updateSelectedProperty('height', e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={(e) => { if (e.target.value === '') updateSelectedProperty('height', 0); }} disabled={previewHistoryElements} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">Rotation ({selectedElement.rotation || 0}°)</Typography>
                          <Slider value={selectedElement.rotation || 0} min={0} max={360} onChange={(e, val) => updateSelectedProperty('rotation', val)} disabled={previewHistoryElements} sx={{ py: 1 }} />
                        </Box>
                      </Box>

                      <Divider />

                      {/* Sub-group B: Typography & Style */}
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary">Typography & Style</Typography>
                        <TextField
                          label="Text/Data Content"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          value={selectedElement.content}
                          onChange={(e) => updateSelectedProperty('content', e.target.value)}
                          disabled={previewHistoryElements}
                        />
                        <Box display="flex" gap={1.5}>
                          <TextField label="Font Size" size="small" type="number" fullWidth value={selectedElement.fontSize} onChange={(e) => updateSelectedProperty('fontSize', e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={(e) => { if (e.target.value === '') updateSelectedProperty('fontSize', 12); }} disabled={previewHistoryElements} />
                          <FormControl fullWidth size="small" disabled={previewHistoryElements}>
                            <InputLabel>Font Weight</InputLabel>
                            <Select value={selectedElement.fontWeight || 'normal'} label="Font Weight" onChange={(e) => updateSelectedProperty('fontWeight', e.target.value)}>
                              <MenuItem value="normal">Normal</MenuItem>
                              <MenuItem value="bold">Bold</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box display="flex" gap={1.5}>
                          <FormControl fullWidth size="small" disabled={previewHistoryElements}>
                            <InputLabel>Font Family</InputLabel>
                            <Select value={selectedElement.fontFamily || 'Inter'} label="Font Family" onChange={(e) => updateSelectedProperty('fontFamily', e.target.value)}>
                              <MenuItem value="Inter">Inter</MenuItem>
                              <MenuItem value="Arial">Arial (Sans-serif)</MenuItem>
                              <MenuItem value="Georgia">Georgia (Serif)</MenuItem>
                              <MenuItem value="Courier New">Courier New (Mono)</MenuItem>
                              <MenuItem value="Poppins">Poppins</MenuItem>
                              <MenuItem value="Roboto">Roboto</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Box display="flex" gap={1.5}>
                          <TextField
                            label="Text Color"
                            size="small"
                            fullWidth
                            value={selectedElement.color || '#333333'}
                            onChange={(e) => updateSelectedProperty('color', e.target.value)}
                            disabled={previewHistoryElements}
                            InputProps={{
                              endAdornment: (
                                <input
                                  type="color"
                                  value={selectedElement.color?.startsWith('#') ? selectedElement.color : '#333333'}
                                  onChange={(e) => updateSelectedProperty('color', e.target.value)}
                                  disabled={previewHistoryElements}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    padding: 0,
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent'
                                  }}
                                />
                              )
                            }}
                          />
                          <TextField
                            label="BG Color"
                            size="small"
                            fullWidth
                            value={selectedElement.backgroundColor || 'transparent'}
                            onChange={(e) => updateSelectedProperty('backgroundColor', e.target.value)}
                            disabled={previewHistoryElements}
                            InputProps={{
                              endAdornment: (
                                <input
                                  type="color"
                                  value={selectedElement.backgroundColor?.startsWith('#') ? selectedElement.backgroundColor : '#ffffff'}
                                  onChange={(e) => updateSelectedProperty('backgroundColor', e.target.value)}
                                  disabled={previewHistoryElements}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    border: '1px solid #ddd',
                                    borderRadius: 4,
                                    padding: 0,
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent'
                                  }}
                                />
                              )
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* 5. ERP Data Binding Tree Accordion */}
                <Accordion defaultExpanded disableGutters sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />} sx={{ minHeight: 48, '&.Mui-expanded': { minHeight: 48 } }}>
                    <Typography variant="subtitle1" fontWeight={600}>5. ERP Data Binding Tree</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1.5 }}>
                    <Box sx={{ border: '1px solid #ddd', borderRadius: 1.5, p: 1.5, maxHeight: 300, overflowY: 'auto' }}>
                      {getDynamicTree().map((group) => (
                        <Box key={group.id} mb={1.5}>
                          <Typography variant="body2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <IconChevronDown size={14} />
                            {group.label}
                          </Typography>
                          <Box pl={2} display="flex" flexDirection="column" gap={0.5}>
                            {group.children.map((child) => (
                              <Typography
                                key={child.id}
                                variant="caption"
                                display="block"
                                onClick={() => {
                                  if (!previewHistoryElements && selectedElement) {
                                    updateSelectedProperty('content', `{{${child.value}}}`);
                                    enqueueSnackbar(`Bound field {{${child.value}}} to selected component`, { variant: 'success' });
                                  } else if (!previewHistoryElements) {
                                    handleAddElement('dynamic', `{{${child.value}}}`);
                                    enqueueSnackbar(`Added dynamic field {{${child.value}}} to canvas`, { variant: 'success' });
                                  }
                                }}
                                sx={{
                                  cursor: 'pointer',
                                  py: 0.6,
                                  px: 1,
                                  borderRadius: 1,
                                  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa',
                                  border: '1px solid transparent',
                                  '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? '#3d3d3d' : '#eff6ff', borderColor: theme.palette.primary.main, color: theme.palette.primary.main }
                                }}
                              >
                                {child.label}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>

              </Card>
            </Box>

            {/* Right side: PDF Design Canvas */}
            <Box sx={{ flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
              {leftSidebarCollapsed && (
                <Tooltip title="Expand Design Tools & Settings" placement="right">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setLeftSidebarCollapsed(false)}
                    startIcon={<IconChevronRight size={18} />}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: 16,
                      zIndex: 100,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 700,
                      py: 0.8,
                      px: 1.75
                    }}
                  >
                    Tools & Settings
                  </Button>
                </Tooltip>
              )}
              <Card sx={{
                p: 2,
                borderRadius: 3,
                height: 'calc(100vh - 150px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'auto',
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#e0e4e8'
              }}>
                {/* Printable Design Canvas */}
                <Box sx={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s', my: 'auto', p: 1 }}>
                  <Box
                    id="canvas-print-area"
                    sx={{
                      width: canvasWidth,
                      height: canvasHeight,
                      backgroundColor: '#ffffff',
                      backgroundImage: (canvasBackgroundImage && showBackground) ? `url(${canvasBackgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {(previewHistoryElements || elements).map((el) => {
                      const isSelected = el.id === selectedElementId;
                      const displayContent = (el.type === 'text' || el.type === 'dynamic')
                        ? (simulateLive ? interpolatePlaceholders(el.content, mockSimulationContext) : el.content)
                        : el.content;

                      return (
                        <Box
                          key={el.id}
                          id={el.id}
                          onMouseDown={(e) => handleCanvasMouseDown(e, el)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (el.locked || previewHistoryElements) return;
                            setInlineEditingId(el.id);
                          }}
                          sx={{
                            position: 'absolute',
                            left: Number(el.x) || 0,
                            top: Number(el.y) || 0,
                            width: Number(el.width) || 0,
                            height: Number(el.height) || 0,
                            border: isSelected 
                              ? '2px solid #1e3a8a' 
                              : (el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : '1px dashed transparent'),
                            backgroundColor: isSelected 
                              ? (el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'rgba(239, 246, 255, 0.95)') 
                              : (el.backgroundColor || 'transparent'),
                            borderRadius: `${el.borderRadius || 2}px`,
                            padding: `${el.padding || 2}px`,
                            transform: `rotate(${el.rotation || 0}deg)`,
                            zIndex: isSelected ? 999 : (el.zIndex || 1),
                            cursor: el.locked ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: el.textAlign || 'left',
                            color: el.color || '#0f172a',
                            fontSize: `${Number(el.fontSize) || 12}px`,
                            fontFamily: el.fontFamily || 'Inter',
                            fontWeight: el.fontWeight || 'normal',
                            whiteSpace: 'pre-wrap',
                            overflow: isSelected ? 'visible' : 'hidden',
                            userSelect: 'none',
                            transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                            boxShadow: isSelected ? '0 0 0 3px rgba(30, 58, 138, 0.2)' : 'none',
                            '&:hover': {
                              borderColor: isSelected ? '#1e3a8a' : 'rgba(30, 58, 138, 0.55)',
                              backgroundColor: isSelected ? undefined : 'rgba(59, 130, 246, 0.08)'
                            }
                          }}
                        >
                          {/* Floating Quick Action Toolbar over Selected Element */}
                          {isSelected && !previewHistoryElements && (
                            <Box
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              sx={{
                                position: 'absolute',
                                bottom: 'calc(100% + 4px)',
                                left: 0,
                                zIndex: 1000,
                                bgcolor: '#0f172a',
                                color: '#ffffff',
                                borderRadius: '6px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1,
                                py: 0.5,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => setInlineEditingId(el.id)}
                                sx={{ fontSize: 10, py: 0.2, px: 0.8, minWidth: 0, height: 22, textTransform: 'none' }}
                              >
                                ✏️ Edit
                              </Button>
                              
                              <Select
                                size="small"
                                displayEmpty
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateSelectedProperty('content', e.target.value);
                                    updateSelectedProperty('type', 'dynamic');
                                    enqueueSnackbar(`Bound field ${e.target.value}`, { variant: 'success' });
                                  }
                                }}
                                sx={{
                                  height: 22,
                                  fontSize: 10,
                                  bgcolor: '#1e293b',
                                  color: '#ffffff',
                                  '& .MuiSelect-select': { py: 0.2, px: 0.8 },
                                  '& .MuiSvgIcon-root': { color: '#ffffff' }
                                }}
                              >
                                <MenuItem value="" disabled>⚡ Bind ERP Field...</MenuItem>
                                {getDynamicTree().flatMap(g => g.children || []).map(field => (
                                  <MenuItem key={field.id} value={`{{${field.value}}}`} sx={{ fontSize: 11 }}>
                                    {field.label} ({`{{${field.value}}}`})
                                  </MenuItem>
                                ))}
                              </Select>

                              <IconButton
                                size="small"
                                onClick={() => {
                                  pushStateToHistory(elements.filter(item => item.id !== el.id));
                                  setElements(prev => prev.filter(item => item.id !== el.id));
                                  setSelectedElementId(null);
                                }}
                                sx={{ p: 0.2, color: '#f87171' }}
                              >
                                <IconTrash size={14} />
                              </IconButton>
                            </Box>
                          )}

                          {inlineEditingId === el.id ? (
                            <input
                              autoFocus
                              defaultValue={el.content}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: '2px solid #2563eb',
                                outline: 'none',
                                background: '#ffffff',
                                fontSize: `${Number(el.fontSize) || 12}px`,
                                fontWeight: el.fontWeight || 'normal',
                                color: '#0f172a',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontFamily: el.fontFamily || 'Inter'
                              }}
                              onBlur={(e) => {
                                updateSelectedProperty('content', e.target.value);
                                setInlineEditingId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateSelectedProperty('content', e.target.value);
                                  setInlineEditingId(null);
                                } else if (e.key === 'Escape') {
                                  setInlineEditingId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          ) : el.type === 'text' || el.type === 'dynamic' ? (
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                              {displayContent}
                              {el.content && typeof el.content === 'string' && el.content.startsWith('{{') && (
                                <Typography variant="caption" sx={{ ml: 0.5, px: 0.5, bgcolor: '#dbeafe', color: '#1d4ed8', borderRadius: 0.5, fontSize: 8, fontWeight: 700 }}>
                                  DYNAMIC
                                </Typography>
                              )}
                            </Box>
                          ) : el.type === 'image' ? (
                            <img src={el.content} alt="element" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : el.type === 'qrcode' ? (
                            <Box sx={{ textAlign: 'center', width: '100%' }}>
                              <IconQrcode size={el.height - 10} />
                              <div style={{ fontSize: 8 }}>QR: {displayContent}</div>
                            </Box>
                          ) : el.type === 'barcode' ? (
                            <Box sx={{ textAlign: 'center', width: '100%' }}>
                              <IconBarcode size={el.height - 10} />
                              <div style={{ fontSize: 8 }}>BAR: {displayContent}</div>
                            </Box>
                          ) : el.type === 'line' ? (
                            <Box sx={{ width: '100%', borderTop: '2px solid #333' }} />
                          ) : el.type === 'divider' ? (
                            <Box sx={{ width: '100%', borderTop: '2px dashed #999', marginY: '4px' }} />
                          ) : el.type === 'rectangle' ? (
                            <Box sx={{ width: '100%', height: '100%', border: '2px solid #333', backgroundColor: '#e5e7eb' }} />
                          ) : el.type === 'circle' ? (
                            <Box sx={{ width: '100%', height: '100%', border: '2px solid #333', borderRadius: '50%', backgroundColor: '#e5e7eb' }} />
                          ) : (
                            displayContent
                          )}
                          {isSelected && !previewHistoryElements && (
                            <>
                              {/* Bottom-Right Resize Handle */}
                              <Box
                                onMouseDown={(e) => handleResizeMouseDown(e, el)}
                                sx={{
                                  position: 'absolute',
                                  bottom: -4,
                                  right: -4,
                                  width: 8,
                                  height: 8,
                                  backgroundColor: '#1e3a8a',
                                  border: '1px solid white',
                                  cursor: 'se-resize',
                                  zIndex: 1000
                                }}
                              />
                              {/* Top-Center Rotation Handle */}
                              <Box
                                onMouseDown={(e) => handleRotateMouseDown(e, el)}
                                sx={{
                                  position: 'absolute',
                                  top: -16,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: '#1e3a8a',
                                  border: '1px solid white',
                                  cursor: 'crosshair',
                                  zIndex: 1000,
                                  '&:after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 8,
                                    left: 3,
                                    width: 1,
                                    height: 8,
                                    backgroundColor: '#1e3a8a'
                                  }
                                }}
                              />
                              {/* Top-Right Delete Handle (✕) */}
                              <Box
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  pushStateToHistory(elements.filter((item) => item.id !== el.id));
                                  setSelectedElementId(null);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  backgroundColor: '#ef4444',
                                  border: '1px solid white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  zIndex: 1001,
                                  color: 'white',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  '&:hover': {
                                    backgroundColor: '#dc2626'
                                  }
                                }}
                              >
                                ✕
                              </Box>
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        </MainCard>
      )}

      {/* Version History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Revision Log & Version History</DialogTitle>
        <DialogContent dividers>
          <List>
            {historyList.map((log) => (
              <ListItem key={log.id} divider>
                <ListItemText
                  primary={`Revision v${log.version}`}
                  secondary={`Saved on ${new Date(log.createdDate).toLocaleString()} by ${log.createdBy || 'User'}`}
                />
                <Box display="flex" gap={1}>
                  <Button size="small" startIcon={<IconEye />} onClick={() => { handlePreviewHistory(log); setHistoryOpen(false); }}>
                    Preview
                  </Button>
                </Box>
              </ListItem>
            ))}
            {historyList.length === 0 && (
              <Typography color="textSecondary" align="center" py={4}>No historical revisions saved yet.</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* JSON Import Dialog */}
      <Dialog open={importJsonOpen} onClose={() => setImportJsonOpen(false)} fullWidth>
        <DialogTitle>Import JSON Configuration</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={8}
            fullWidth
            placeholder="Paste config JSON here..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportJsonOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImportJson}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Import Mock Dialog */}
      <Dialog open={pdfImportOpen} onClose={() => setPdfImportOpen(false)}>
        <DialogTitle>Import Document Layout from PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Select a PDF document. The designer parser engine will automatically extract text blocks, horizontal lines, tables, and positioning to generate an editable blueprint.
          </Typography>
          <Button variant="outlined" component="label" fullWidth sx={{ p: 4, borderStyle: 'dashed' }}>
            Choose PDF File
            <input type="file" hidden accept="application/pdf" onChange={handleImportPdfFile} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfImportOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Layout Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f4f6f8',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
          <Typography variant="h4" fontWeight={600}>Document Layout Preview</Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small"><IconX size={20} /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', justifyContent: 'center', p: 3, overflowY: 'auto' }}>
          <Box
            id="preview-print-area"
            sx={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundColor: '#ffffff',
              backgroundImage: canvasBackgroundImage ? `url(${canvasBackgroundImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {elements.map((el) => (
              <Box
                key={el.id}
                sx={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
                  backgroundColor: el.backgroundColor,
                  borderRadius: `${el.borderRadius}px`,
                  padding: `${el.padding}px`,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  zIndex: el.zIndex,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: el.textAlign || 'left',
                  color: el.color || '#333333',
                  fontSize: `${el.fontSize}px`,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  whiteSpace: 'pre-wrap',
                  overflow: 'hidden'
                }}
              >
                {el.type === 'text' || el.type === 'dynamic' ? (
                  el.content
                ) : el.type === 'image' ? (
                  <img src={el.content} alt="element" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : el.type === 'qrcode' ? (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <IconQrcode size={el.height - 10} />
                    <div style={{ fontSize: 8 }}>QR: {el.content}</div>
                  </Box>
                ) : el.type === 'barcode' ? (
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <IconBarcode size={el.height - 10} />
                    <div style={{ fontSize: 8 }}>BAR: {el.content}</div>
                  </Box>
                ) : el.type === 'line' ? (
                  <Box sx={{ width: '100%', borderTop: '2px solid #333' }} />
                ) : el.type === 'divider' ? (
                  <Box sx={{ width: '100%', borderTop: '2px dashed #999', marginY: '4px' }} />
                ) : el.type === 'rectangle' ? (
                  <Box sx={{ width: '100%', height: '100%', border: '2px solid #333', backgroundColor: '#e5e7eb' }} />
                ) : el.type === 'circle' ? (
                  <Box sx={{ width: '100%', height: '100%', border: '2px solid #333', borderRadius: '50%', backgroundColor: '#e5e7eb' }} />
                ) : (
                  el.content
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<IconDownload size={18} />} 
            onClick={() => {
              const element = document.getElementById('preview-print-area');
              const opt = {
                margin: 0,
                filename: `${templateCode || 'report_template'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'pt', format: 'a4', orientation: pageSize.includes('landscape') ? 'landscape' : 'portrait' }
              };
              html2pdf().set(opt).from(element).save();
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
