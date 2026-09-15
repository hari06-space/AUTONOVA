import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Box,
  Button,
  Typography,
  Stack,
  MenuItem,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Select,
  Divider,
  Autocomplete,
  InputAdornment
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconTrash,
  IconEraser,
  IconPlus,
  IconMail,
  IconUpload,
  IconUserCheck,
  IconThumbUp,
  IconEdit,
  IconSearch,
  IconUserPlus,
  IconCheck,
  IconAlertCircle,
  IconFileText,
  IconDownload,
  IconPhoto,
  IconSettings,
  IconFilter,
  IconMinus,
  IconMaximize,
  IconX
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSDatePicker,
  BOSDataTable,
  BOSFileUpload,
  btnSave,
  btnCancel,
  btnClear,
  btnDelete,
  errorStyle
} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import CustomerLookupDialog from './popup/CustomerLookupDialog';
import ProductLookupDialog from './popup/ProductLookupDialog';

const VALIDATION_RULES = [
  { field: 'rfqMode', label: 'Enquiry Mode', required: true },
  { field: 'customerName', label: 'Customer Name', required: true, maxLength: 200 },
  { field: 'country', label: 'Country', required: true },
  { field: 'targetDate', label: 'Target Date', required: true }
];

const INITIAL_STATE = {
  enquiryNo: '',
  enquiryDate: new Date().toISOString().split('T')[0],
  customerName: '',
  country: '',
  custCode: '',
  contactPerson: '',
  email: '',
  phone: '',
  phoneISD: '',
  department: '',
  designation: '',
  contactPerson1: '',
  emailId1: '',
  mobile1: '',
  mobile1ISD: '',
  department1: '',
  designation1: '',
  qualityContact: '',
  qualityEmail: '',
  qualityMobile: '',
  qualityMobileISD: '',
  qualityDept: '',
  qualityDesig: '',
  financeContact: '',
  financeEmail: '',
  financeMobile: '',
  financeMobileISD: '',
  financeDept: '',
  financeDesig: '',
  enquiryContact: '',
  enquiryEmail: '',
  enquiryMobile: '',
  enquiryMobileISD: '',
  enquiryDept: '',
  enquiryDesig: '',
  subject: '',
  requirements: '',
  source: 'Email',
  priority: 'Medium',
  ocrDocumentPath: '',
  ocrExtractedText: '',
  ocrConfidence: '',
  status: '',
  remarks: '',
  rfqMode: '',
  targetDate: '',
  salType: '',
  customerId: null,
  parts: [],
  attachments: []
};

const productColumns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'itemNo', label: 'Part No', minWidth: 120, bold: true },
  { id: 'itemName', label: 'Part Name', minWidth: 200 },
  { id: 'oemPrefix', label: 'OEM Part No', minWidth: 120 },
  { id: 'itemCode', label: 'IPP Part No', minWidth: 120 },
  { id: 'inventoryType', label: 'Prod Type', minWidth: 120 },
  { id: 'itemCategory', label: 'Category', minWidth: 120 },
  { id: 'stockQty', label: 'Stock', minWidth: 90, align: 'right' },
  { id: 'uom', label: 'UOM', minWidth: 85 },
  { id: 'sellingRate', label: 'Price', minWidth: 90, align: 'right' },
  { id: 'hsnCode', label: 'HSN Code', minWidth: 110 }
];

const contactColumns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'title', label: 'Title', minWidth: 70 },
  { id: 'contactName', label: 'Contact Name', minWidth: 180, bold: true },
  { id: 'designation', label: 'Designation', minWidth: 130 },
  { id: 'department', label: 'Department', minWidth: 130 },
  { id: 'emailId', label: 'Email ID', minWidth: 180 },
  { id: 'mobileNo', label: 'Mobile No', minWidth: 120 },
  { id: 'whatsAppNo', label: 'WhatsApp No', minWidth: 120 }
];

const getProductImageUrl = (partName = '', partNo = '', selectedMasterProduct = null) => {
  if (selectedMasterProduct && selectedMasterProduct.attachments && selectedMasterProduct.attachments.length > 0) {
    const firstAttachment = selectedMasterProduct.attachments[0];
    const path = firstAttachment.path || firstAttachment.serverFileName;
    if (path) {
      return `/api/files/view?path=${encodeURIComponent(path)}`;
    }
  }

  const name = String(partName || '').toLowerCase();
  const no = String(partNo || '').toLowerCase();

  let primaryColor = '#2196f3'; // Blue
  let innerStructure = '';

  if (name.includes('gear') || no.includes('gear')) {
    primaryColor = '#3f51b5'; // Indigo
    innerStructure = `
      <circle cx="50" cy="50" r="24" fill="none" stroke="${primaryColor}" stroke-width="4" stroke-dasharray="6,3"/>
      <circle cx="50" cy="50" r="14" fill="#94a3b8"/>
      <circle cx="50" cy="50" r="6" fill="#1e293b"/>
    `;
  } else if (name.includes('bolt') || name.includes('screw') || name.includes('fastener') || no.includes('blt') || no.includes('scr')) {
    primaryColor = '#e91e63'; // Pink
    innerStructure = `
      <rect x="42" y="20" width="16" height="50" fill="#94a3b8" rx="2"/>
      <rect x="35" y="10" width="30" height="10" fill="#475569" rx="2"/>
      <line x1="42" y1="30" x2="58" y2="30" stroke="#1e293b" stroke-width="2"/>
      <line x1="42" y1="42" x2="58" y2="42" stroke="#1e293b" stroke-width="2"/>
      <line x1="42" y1="54" x2="58" y2="54" stroke="#1e293b" stroke-width="2"/>
    `;
  } else {
    // Default: bearing/shaft / general component outline
    primaryColor = '#009688'; // Teal
    innerStructure = `
      <circle cx="50" cy="50" r="26" fill="none" stroke="${primaryColor}" stroke-width="5"/>
      <circle cx="50" cy="50" r="18" fill="none" stroke="#64748b" stroke-width="3"/>
      <circle cx="50" cy="50" r="8" fill="#1e293b"/>
    `;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#f8fafc" rx="8"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="50" y1="5" x2="50" y2="95" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2"/>
      <line x1="5" y1="50" x2="95" y2="50" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2"/>
      ${innerStructure}
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

const R = ({ children, lg = 3, md = 4, sm = 6 }) => <Grid item xs={12} sm={sm} md={md} lg={lg}>{children}</Grid>;

export default function EnquiryForm() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('id');
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusList, setStatusList] = useState([]);

  // Quick Create Customer states
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({ vendorName: '', shortName: '', mobileNo: '', mobileISD: '+91', referenceCode: '', gstin: '', country: '', state: '', city: '', pinCode: '', address: '' });
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({});

  // Customer lookup state
  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);

  // Contact list popup states
  const [contactLookupOpen, setContactLookupOpen] = useState(false);
  const [contactLookupType, setContactLookupType] = useState('SCM');
  const [contacts, setContacts] = useState([]);
  const [enquiryContact, setEnquiryContact] = useState({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });
  const [contactPage, setContactPage] = useState(0);
  const [contactSize, setContactSize] = useState(5);

  // Product/Part lookup states
  const [partLookupOpen, setPartLookupOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [prodPage, setProdPage] = useState(0);
  const [prodSize, setProdSize] = useState(10);



  // Track parts whose images were uploaded in this specific session
  const [sessionUploadedParts, setSessionUploadedParts] = useState(new Set());


  // Add Contact sub-dialog states
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContactData, setNewContactData] = useState({
    title: 'Mr.', contactName: '', designation: '', department: '',
    emailId: '', mobileNo: '', whatsAppNo: '', status: 'Active',
    mobileISD: '+91', whatsAppISD: '+91'
  });
  const [contactErrors, setContactErrors] = useState({});


  // Assignments / Feasibility / Email dialog states
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailFormData, setEmailFormData] = useState({ to: '', cc: '', subject: '', body: '' });

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignFormData, setAssignFormData] = useState({ department: '', employeeId: '' });

  const [feasibilityDialogOpen, setFeasibilityDialogOpen] = useState(false);
  const [feasibilityFormData, setFeasibilityFormData] = useState({ commercial: 'Yes', technical: 'Yes' });

  // Load Initial Data
  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const [custRes, empRes, countryRes, stateRes, prodRes, statusRes] = await Promise.all([
          axios.get('/api/master/vendors?type=customer'),
          axios.get('/api/master/hr/employees'),
          axios.get('/api/admin/countries'),
          axios.get('/api/admin/states'),
          axios.get('/api/master/npd/product-master'),
          axios.get('/api/sm/enquiry/statuses')
        ]);
        setCustomers(custRes.data || []);
        setEmployees(empRes.data || []);
        const productsList = prodRes.data || [];
        setAllProducts(productsList);
        setFilteredProducts(productsList);
        setCountries(countryRes.data || []);
        setAllStates(stateRes.data || []);
        const loadedStatuses = statusRes.data || [];
        setStatusList(loadedStatuses);
        if (countryRes.data && countryRes.data.length > 0) {
          const defaultCode = countryRes.data[0].countryCode || '+91';
          setNewContactData(prev => ({
            ...prev,
            mobileISD: defaultCode,
            whatsAppISD: defaultCode
          }));
        }

        if (enquiryId) {
          const res = await axios.get(`${API_PATHS.SM.ENQUIRIES}/${enquiryId}`);
          if (res.data) {
            const matchedCustomer = custRes.data.find(c => c.id === res.data.customerId);

            let initialForm = {
              id: res.data.id,
              enquiryNo: res.data.enquiryNo || '',
              enquiryDate: res.data.enquiryDate ? new Date(res.data.enquiryDate).toISOString().split('T')[0] : '',
              customerId: res.data.customerId || null,
              customerName: matchedCustomer ? matchedCustomer.vendorName : (res.data.customerName || ''),
              country: matchedCustomer ? matchedCustomer.country : (res.data.country || ''),
              custCode: matchedCustomer ? matchedCustomer.referenceCode : (res.data.custCode || ''),
              contactPerson: res.data.contactPerson || '',
              email: res.data.email || '',
              phone: res.data.phone || '',
              department: res.data.department || '',
              designation: res.data.designation || '',
              contactPerson1: res.data.contactPerson1 || '',
              emailId1: res.data.emailId1 || '',
              mobile1: res.data.mobile1 || '',
              department1: res.data.department1 || '',
              designation1: res.data.designation1 || '',
              qualityContact: '',
              qualityEmail: '',
              qualityMobile: '',
              qualityDept: '',
              qualityDesig: '',
              financeContact: '',
              financeEmail: '',
              financeMobile: '',
              financeDept: '',
              financeDesig: '',
              enquiryContact: '',
              enquiryEmail: '',
              enquiryMobile: '',
              enquiryDept: '',
              enquiryDesig: '',
              subject: res.data.subject || '',
              requirements: res.data.requirements || '',
              source: res.data.source || 'Email',
              priority: res.data.priority || 'Medium',
              ocrDocumentPath: res.data.ocrDocumentPath || '',
              ocrExtractedText: res.data.ocrExtractedText || '',
              ocrConfidence: res.data.ocrConfidence || '',
              status: res.data.status || '',
              remarks: res.data.remarks || '',
              rfqMode: res.data.rfqMode || 'MAIL',
              targetDate: res.data.targetDate ? new Date(res.data.targetDate).toISOString().split('T')[0] : '',
              salType: res.data.salType || '',
              attachments: (res.data.attachments || []).map(a => ({
                id: a.id,
                fileName: a.fileName,
                serverFileName: a.path,
                isServer: true
              })),
              parts: (res.data.parts || []).map(p => {
                const prod = p.partNoId ? productsList.find(x => x.id === p.partNoId) : null;
                return {
                  ...p,
                  partNo: p.partNo || (prod ? prod.itemNo : ''),
                  name: p.name || (prod ? prod.itemName : ''),
                  oemPartNo: p.oemPartNo || (prod ? prod.oemPrefix : ''),
                  ippPartNo: p.ippPartNo || (prod ? prod.itemCode : ''),
                  uom: p.uom || (prod ? prod.uom : ''),
                  annualReqQty: p.reqQty || 0,
                  status: p.status === false ? 'Completed' : 'WIP'
                };
              })
            };

            // Dynamically load contacts from ContactMaster
            if (initialForm.customerName) {
              try {
                const contactRes = await axios.get('/api/sm/contacts');
                const custContacts = (contactRes.data || []).filter(c => c.groupName === initialForm.customerName);

                const parsePhone = (c) => {
                  let isd = '', phoneNum = c.mobileNo || '';
                  if (phoneNum.includes('-')) {
                    const parts = phoneNum.split('-'); isd = (parts[0] || '').split(' ')[0]; phoneNum = parts.slice(1).join('-');
                  } else if (phoneNum.startsWith('+')) {
                    const matched = (countryRes.data || []).find(co => co.isd && phoneNum.startsWith(co.isd));
                    if (matched) { isd = matched.isd; phoneNum = phoneNum.slice(matched.isd.length).trim(); }
                  }
                  return { isd, phoneNum };
                };

                const primary = custContacts.find(c => c.contactType === 'Primary');
                if (primary) {
                  const { isd, phoneNum } = parsePhone(primary);
                  initialForm.contactPerson = primary.contactName; initialForm.email = primary.emailId;
                  initialForm.phone = phoneNum; initialForm.phoneISD = isd;
                  initialForm.department = primary.department || ''; initialForm.designation = primary.designation || '';
                }
                const secondary = custContacts.find(c => c.contactType === 'Secondary');
                if (secondary) {
                  const { isd, phoneNum } = parsePhone(secondary);
                  initialForm.contactPerson1 = secondary.contactName; initialForm.emailId1 = secondary.emailId;
                  initialForm.mobile1 = phoneNum; initialForm.mobile1ISD = isd;
                  initialForm.department1 = secondary.department || ''; initialForm.designation1 = secondary.designation || '';
                }
                const quality = custContacts.find(c => c.contactType === 'Technical');
                if (quality) {
                  const { isd, phoneNum } = parsePhone(quality);
                  initialForm.qualityContact = quality.contactName; initialForm.qualityEmail = quality.emailId;
                  initialForm.qualityMobile = phoneNum; initialForm.qualityMobileISD = isd;
                  initialForm.qualityDept = quality.department || ''; initialForm.qualityDesig = quality.designation || '';
                }
                const finance = custContacts.find(c => c.contactType === 'Accounts' || c.contactType === 'Commercial');
                if (finance) {
                  const { isd, phoneNum } = parsePhone(finance);
                  initialForm.financeContact = finance.contactName; initialForm.financeEmail = finance.emailId;
                  initialForm.financeMobile = phoneNum; initialForm.financeMobileISD = isd;
                  initialForm.financeDept = finance.department || ''; initialForm.financeDesig = finance.designation || '';
                }
                const enquiryCont = custContacts.find(c => c.contactType === 'Other');
                if (enquiryCont) {
                  const { isd, phoneNum } = parsePhone(enquiryCont);
                  initialForm.enquiryContact = enquiryCont.contactName; initialForm.enquiryEmail = enquiryCont.emailId;
                  initialForm.enquiryMobile = phoneNum; initialForm.enquiryMobileISD = isd;
                  initialForm.enquiryDept = enquiryCont.department || ''; initialForm.enquiryDesig = enquiryCont.designation || '';
                }

                const specificContact = custContacts.find(c => c.id === res.data.contactId);
                if (specificContact) {
                  const { isd, phoneNum } = parsePhone(specificContact);
                  setEnquiryContact({
                    id: specificContact.id,
                    contactName: specificContact.contactName || '',
                    mobileNo: phoneNum,
                    emailId: specificContact.emailId || '',
                    department: specificContact.department || '',
                    designation: specificContact.designation || '',
                    mobileISD: isd || '+91'
                  });
                } else {
                  setEnquiryContact({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });
                }

              } catch (e) {
                console.error('Failed to fetch latest contacts dynamically', e);
              }
            }

            setFormData(initialForm);
          }
        } else {
          const nextCodeRes = await axios.get('/api/sm/enquiry/next-code');
          if (nextCodeRes.data && nextCodeRes.data.code) {
            setFormData(prev => ({ ...prev, enquiryNo: nextCodeRes.data.code }));
          }
        }

        // Auto-select 'Created' status for new enquiries if available
        if (!enquiryId) {
          const createdStatus = loadedStatuses.find(s => s.name === 'Created' || s.name === 'CREATED');
          if (createdStatus) {
            setFormData(prev => ({ ...prev, status: createdStatus.id }));
          }
        }
      } catch (err) {
        console.error('Failed to load master data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, [enquiryId]);

  // Slideshow auto-rotation effect for product attachments

  // Load customer based contacts
  const fetchCustomerContacts = async (custName) => {
    try {
      const res = await axios.get('/api/sm/contacts');
      const filtered = (res.data || []).filter(c => c.groupName === custName);
      setContacts(filtered);
      return filtered;
    } catch (err) {
      console.error('Failed to load contacts:', err);
      return [];
    }
  };

  const applyContactData = (c, type = 'SCM') => {
    let isd = '';
    let phoneNum = c.mobileNo || '';
    if (phoneNum.includes('-')) {
      const parts = phoneNum.split('-');
      isd = parts[0];
      phoneNum = parts.slice(1).join('-');
    } else if (phoneNum.startsWith('+')) {
      const matched = countries.find(co => phoneNum.startsWith(co.countryCode));
      if (matched) {
        isd = matched.countryCode;
        phoneNum = phoneNum.slice(matched.countryCode.length).trim();
      }
    }
    setFormData(prev => {
      const updates = {};
      if (type === 'SCM') {
        updates.contactPerson = c.contactName;
        updates.email = c.emailId;
        updates.phone = phoneNum;
        updates.phoneISD = isd;
        updates.department = c.department || '';
        updates.designation = c.designation || '';
      } else if (type === 'Sourcing') {
        updates.contactPerson1 = c.contactName;
        updates.emailId1 = c.emailId;
        updates.mobile1 = phoneNum;
        updates.mobile1ISD = isd;
        updates.department1 = c.department || '';
        updates.designation1 = c.designation || '';
      } else if (type === 'Quality') {
        updates.qualityContact = c.contactName;
        updates.qualityEmail = c.emailId;
        updates.qualityMobile = phoneNum;
        updates.qualityMobileISD = isd;
        updates.qualityDept = c.department || '';
        updates.qualityDesig = c.designation || '';
      } else if (type === 'Finance') {
        updates.financeContact = c.contactName;
        updates.financeEmail = c.emailId;
        updates.financeMobile = phoneNum;
        updates.financeMobileISD = isd;
        updates.financeDept = c.department || '';
        updates.financeDesig = c.designation || '';
      } else if (type === 'Enquiry') {
        updates.enquiryContact = c.contactName;
        updates.enquiryEmail = c.emailId;
        updates.enquiryMobile = phoneNum;
        updates.enquiryMobileISD = isd;
        updates.enquiryDept = c.department || '';
        updates.enquiryDesig = c.designation || '';
      }
      return { ...prev, ...updates };
    });
  };

  const handleSelectCustomer = async (cust) => {
    setCustomerLookupOpen(false);
    if (!cust) return;

    const val = cust.vendorName;

    setFormData((prev) => ({
      ...prev,
      customerName: val,
      customerId: cust.id,
      country: cust.country || prev.country,
      custCode: cust.referenceCode || prev.custCode,
      contactPerson: '',
      email: '',
      phone: '',
      phoneISD: '',
      department: '',
      designation: '',
      contactPerson1: '',
      emailId1: '',
      mobile1: '',
      mobile1ISD: '',
      department1: '',
      designation1: '',
      qualityContact: '',
      qualityEmail: '',
      qualityMobile: '',
      qualityMobileISD: '',
      qualityDept: '',
      qualityDesig: '',
      financeContact: '',
      financeEmail: '',
      financeMobile: '',
      financeMobileISD: '',
      financeDept: '',
      financeDesig: '',
      enquiryContact: '',
      enquiryEmail: '',
      enquiryMobile: '',
      enquiryMobileISD: '',
      enquiryDept: '',
      enquiryDesig: ''
    }));

    if (val) {
      const custContacts = await fetchCustomerContacts(val);
      if (custContacts && custContacts.length > 0) {
        custContacts.forEach(c => {
          if (c.contactType === 'Primary') applyContactData(c, 'SCM');
          else if (c.contactType === 'Secondary') applyContactData(c, 'Sourcing');
          else if (c.contactType === 'Technical') applyContactData(c, 'Quality');
          else if (c.contactType === 'Accounts' || c.contactType === 'Commercial') applyContactData(c, 'Finance');
          else if (c.contactType === 'Other') applyContactData(c, 'Enquiry');
        });


        const parsePhone = (c) => {
          let isd = '', phoneNum = c.mobileNo || '';
          if (phoneNum.includes('-')) {
            const parts = phoneNum.split('-'); isd = (parts[0] || '').split(' ')[0]; phoneNum = parts.slice(1).join('-');
          } else if (phoneNum.startsWith('+')) {
            const matched = (countries || []).find(co => co.countryCode && phoneNum.startsWith(co.countryCode));
            if (matched) { isd = matched.countryCode; phoneNum = phoneNum.slice(matched.countryCode.length).trim(); }
          }
          return { isd, phoneNum };
        };

        setEnquiryContact({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });
      } else {
        setEnquiryContact({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });
      }
    } else {
      setEnquiryContact({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });

    }
  };

  const handleOpenContactLookup = (type) => {
    if (!formData.customerName) {
      dispatch(openSnackbar({ open: true, message: 'Please select a Customer first!', variant: 'alert', severity: 'warning' }));
      return;
    }
    setContactLookupType(type);
    setContactPage(0);
    fetchCustomerContacts(formData.customerName);
    setContactLookupOpen(true);
  };

  const handleSelectContact = (c) => {
    applyContactData(c, contactLookupType);
    setContactLookupOpen(false);
  };

  const handleAddContact = async () => {
    setContactErrors({});

    if (!newContactData.contactName) {
      setContactErrors(prev => ({ ...prev, contactName: 'Contact Name is required!' }));
      dispatch(openSnackbar({ open: true, message: 'Contact Name is required!', variant: 'alert', severity: 'error' }));
      return;
    }

    const validatePhone = (isd, num, label, fieldName) => {
      if (!num) return true;
      const digits = num.replace(/\D/g, '');
      const match = countries.find(c => c.countryCode === isd);
      if (match) {
        const minL = match.phoneMinLength != null ? match.phoneMinLength : 10;
        const maxL = match.phoneMaxLength != null ? match.phoneMaxLength : 10;
        if (digits.length < minL || digits.length > maxL) {
          const rangeMsg = minL === maxL ? `exactly ${minL} digits` : `between ${minL} and ${maxL} digits`;
          setContactErrors(prev => ({ ...prev, [fieldName]: `${label} must be ${rangeMsg}` }));
          dispatch(openSnackbar({
            open: true,
            message: `${label} must be ${rangeMsg} for ${isd}`,
            variant: 'alert',
            severity: 'error'
          }));
          return false;
        }
      } else {
        if (digits.length < 9 || digits.length > 13) {
          setContactErrors(prev => ({ ...prev, [fieldName]: `${label} length is invalid` }));
          dispatch(openSnackbar({ open: true, message: `${label} length is invalid for ${isd}`, variant: 'alert', severity: 'error' }));
          return false;
        }
      }
      return true;
    };

    if (!validatePhone(newContactData.mobileISD, newContactData.mobileNo, 'Mobile No', 'mobileNo')) return;
    if (!validatePhone(newContactData.whatsAppISD, newContactData.whatsAppNo, 'WhatsApp No', 'whatsAppNo')) return;

    const submission = {
      ...newContactData,
      groupName: formData.customerName,
      type: 'Customer',
      contactType: 'Customer',
      mobileNo: newContactData.mobileNo ? `${newContactData.mobileISD}-${newContactData.mobileNo}` : '',
      whatsAppNo: newContactData.whatsAppNo ? `${newContactData.whatsAppISD}-${newContactData.whatsAppNo}` : ''
    };
    try {
      await axios.post('/api/sm/contacts', submission);
      dispatch(openSnackbar({ open: true, message: 'Contact added successfully!', variant: 'alert', severity: 'success' }));
      setAddContactOpen(false);
      setNewContactData({ title: 'Mr.', contactName: '', designation: '', department: '', emailId: '', mobileNo: '', whatsAppNo: '', status: 'Active', mobileISD: '+91', whatsAppISD: '+91' });
      setContactErrors({});
      fetchCustomerContacts(formData.customerName);
    } catch (err) {
      console.error('Failed to save contact:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to save contact.', variant: 'alert', severity: 'error' }));
    }
  };

  const handleSaveQuickCustomer = async () => {
    setQuickCustomerErrors({});
    if (!quickCustomerData.vendorName) {
      setQuickCustomerErrors({ vendorName: 'Customer Name is required!' });
      dispatch(openSnackbar({ open: true, message: 'Customer Name is required!', variant: 'alert', severity: 'error' }));
      return;
    }

    setLoading(true);
    try {
      // 1. Create Customer
      const vendorPayload = {
        ...quickCustomerData,
        isCustomer: true,
        isSupplier: false,
        isSubcon: false
      };
      const vendorRes = await axios.post('/api/master/vendors', vendorPayload);
      const newCustomer = vendorRes.data;

      // 2. Create Contact if mobile no is provided
      if (quickCustomerData.mobileNo) {
        const contactPayload = {
          title: 'Mr.',
          contactName: quickCustomerData.shortName || quickCustomerData.vendorName,
          designation: '',
          department: '',
          emailId: '',
          mobileNo: quickCustomerData.mobileNo ? `${quickCustomerData.mobileISD || '+91'}-${quickCustomerData.mobileNo}` : '',
          whatsAppNo: '',
          status: 'Active',
          mobileISD: quickCustomerData.mobileISD || '+91',
          whatsAppISD: '+91',
          groupName: newCustomer.vendorName,
          type: 'Customer',
          contactType: 'Customer'
        };
        try {
          await axios.post('/api/sm/contacts', contactPayload);
        } catch (contactErr) {
          console.error('Failed to create initial contact', contactErr);
        }
      }

      // Update customers list
      const updatedCustomersRes = await axios.get('/api/master/vendors?type=customer');
      const updatedCustomers = updatedCustomersRes.data || [];
      setCustomers(updatedCustomers);

      // Automatically select in Enquiry Form
      const createdMatch = updatedCustomers.find(c => c.id === newCustomer.id || c.vendorName === newCustomer.vendorName);
      if (createdMatch) {
        handleSelectCustomer(createdMatch);
      } else {
        handleSelectCustomer(newCustomer);
      }

      dispatch(openSnackbar({ open: true, message: 'Customer created successfully!', variant: 'alert', severity: 'success' }));
      setQuickCustomerOpen(false);
      setQuickCustomerData({
        vendorName: '', shortName: '', referenceCode: '', mobileNo: '',
        address: '', city: '', state: '', country: 'India', pinCode: '', gstin: ''
      });
    } catch (err) {
      console.error('Failed to save quick customer:', err);
      dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to create customer.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    const hasValidContactName = enquiryContact.contactName && enquiryContact.contactName.trim() !== '';
    const hasValidMobile = enquiryContact.mobileNo && enquiryContact.mobileNo.trim().length === 10;

    if (!hasValidContactName || !hasValidMobile) {
      dispatch(openSnackbar({ open: true, message: 'Please provide both Contact Name and a valid 10-digit Mobile No.', variant: 'alert', severity: 'error' }));
      return;
    }

    const hasValidPart = formData.parts && formData.parts.length > 0;
    if (!hasValidPart) {
      dispatch(openSnackbar({ open: true, message: 'Please add at least one Part No in the parts list.', variant: 'alert', severity: 'error' }));
      return;
    }

    const invalidPartIndex = formData.parts.findIndex(p => !p.partNo || !p.name || !p.uom || !p.annualReqQty || Number(p.annualReqQty) <= 0);
    if (invalidPartIndex !== -1) {
      dispatch(openSnackbar({ open: true, message: `Row ${invalidPartIndex + 1}: Part No, Part Name, UOM, and Required Qty are mandatory.`, variant: 'alert', severity: 'error' }));
      return;
    }

    setLoading(true);
    try {
      let savedContactId = enquiryContact.id;
      // Save Contact to Master first so we can link its ID
      try {
        const existingContactsRes = await axios.get('/api/sm/contacts');
        const existingMasterContacts = existingContactsRes.data || [];

        const contact = enquiryContact;
        const formattedMobile = contact.mobileNo ? `${contact.mobileISD || '+91'}-${contact.mobileNo}` : '';

        const contactPayload = {
          title: 'Mr.',
          contactName: contact.contactName,
          designation: contact.designation,
          department: contact.department,
          emailId: contact.emailId,
          mobileNo: formattedMobile,
          whatsAppNo: '',
          status: 'Active',
          mobileISD: contact.mobileISD || '+91',
          whatsAppISD: '+91',
          groupName: formData.customerName,
          type: 'Customer',
          contactType: 'Customer'
        };

        const match = existingMasterContacts.find(c =>
          c.groupName === formData.customerName &&
          ((contact.emailId && c.emailId === contact.emailId) ||
            (contact.mobileNo && (c.mobileNo === formattedMobile || c.mobileNo === contact.mobileNo || (c.mobileNo || '').endsWith('-' + contact.mobileNo)))
          )
        );

        if (match) {
          await axios.put(`/api/sm/contacts/${match.id}`, { ...contactPayload, id: match.id });
          savedContactId = match.id;
        } else {
          const postRes = await axios.post('/api/sm/contacts', contactPayload);
          savedContactId = postRes.data.id;
        }
      } catch (contactErr) {
        console.error('Failed to save contact to master:', contactErr);
      }

      // Map to exact backend entity structure to avoid UnrecognizedPropertyException
      const payload = {
        id: formData.id,
        enquiryNo: formData.enquiryNo,
        enquiryDate: formData.enquiryDate || null,
        rfqMode: formData.rfqMode,
        customerId: formData.customerId,
        contactId: savedContactId,
        targetDate: formData.targetDate || null,
        salType: formData.salType,
        source: formData.source,
        priority: formData.priority,
        remarks: formData.remarks,
        attachments: formData.attachments ? formData.attachments.map(a => ({
          id: (a.id && typeof a.id !== 'string') ? a.id : null,
          fileName: a.fileName || a.name || 'document',
          path: a.serverFileName || a.path || '',
          docType: 'ENQUIRY_DOC'
        })) : [],
        status: formData.status || null,
        parts: formData.parts.map(p => {
          // Auto-find partNoId if we have a match
          const match = allProducts.find(prod => prod.itemNo === p.partNo);
          return {
            id: (p.id && typeof p.id !== 'string') ? p.id : null,
            partNoId: match ? match.id : null,
            partNo: p.partNo,
            name: p.name,
            oemPartNo: p.oemPartNo,
            ippPartNo: p.ippPartNo,
            uom: p.uom,
            reqQty: p.annualReqQty || 0,
            commerciallyFeasible: p.comerciallyFeasible,
            technicallyFeasible: p.technicallyFeasible,
            assignTo: p.assignTo,
            status: true // Always active for now
          };
        })
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.SM.ENQUIRIES}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Enquiry updated successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.SM.ENQUIRIES, payload);
        dispatch(openSnackbar({ open: true, message: 'Enquiry created successfully!', variant: 'alert', severity: 'success' }));
      }

      navigate('/sm/enquiries');
    } catch (error) {
      console.error('Failed to save:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to save enquiry.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.ENQUIRIES}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Enquiry deleted successfully!', variant: 'alert', severity: 'success' }));
      navigate('/sm/enquiries');
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', severity: 'error' }));
    }
  };

  // Add empty row in datatable
  const handleAddEmptyRow = () => {
    const hasEmptyRow = formData.parts.some(p => !p.partNo || p.partNo.trim() === '');
    if (hasEmptyRow) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill the empty Part No in existing rows before adding a new one.',
        variant: 'alert',
        severity: 'warning'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      parts: [
        ...prev.parts,
        {
          partNo: '', name: '', oemPartNo: '', ippPartNo: '', drawingNo: '', drawingRevNo: '',
          rmType: '', annualReqQty: '', comerciallyFeasible: '', technicallyFeasible: '',
          quoteNo: '', quoteDate: '', currencyCd: '', rate: '', rateInInr: '', poNo: '', poDate: '',
          remarks: '', department: '', assignTo: '', status: ''
        }
      ]
    }));
  };

  const handlePartFieldChange = (index, field, value) => {
    if (field === 'partNo' && value && value.trim() !== '') {
      const isDuplicate = formData.parts.some((p, i) => i !== index && p.partNo === value);
      if (isDuplicate) {
        dispatch(openSnackbar({
          open: true,
          message: `Part No "${value}" has already been added to the enquiry.`,
          variant: 'alert',
          severity: 'error'
        }));
        setFormData(prev => {
          const newParts = [...prev.parts];
          newParts[index] = { ...newParts[index], partNo: '', name: '', uom: '' };
          return { ...prev, parts: newParts };
        });
        return false;
      }
    }

    setFormData(prev => {
      const newParts = [...prev.parts];
      newParts[index] = { ...newParts[index], [field]: value };
      return { ...prev, parts: newParts };
    });
    return true;
  };

  // Product details search & lookup

  const handleUploadPartImage = async (e, match, part) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!match && !part?.partNo) {
      dispatch(openSnackbar({ open: true, message: 'Please enter a Part No first to upload an image.', variant: 'alert', severity: 'warning' }));
      return;
    }

    setLoading(true);
    const fileData = new FormData();
    fileData.append('file', file);
    try {
      const uploadRes = await axios.post('/api/files/upload?module=NPD_PRODUCT_MASTER', fileData, { headers: { 'Content-Type': 'multipart/form-data' } });

      let filePath = '';
      if (typeof uploadRes.data === 'string') {
        filePath = uploadRes.data;
      } else {
        const uploadedFile = Array.isArray(uploadRes.data) ? uploadRes.data[0] : uploadRes.data;
        filePath = uploadedFile?.serverFileName || uploadedFile?.path || '';
      }

      const newAttachment = {
        fileName: file.name,
        serverFileName: filePath,
        path: filePath,
        docType: 'IMAGE',
        isServer: true
      };

      if (!match) {
        const newProdPayload = {
          itemNo: part.partNo,
          itemName: part.name || part.partNo,
          uom: part.uom || 'NOS',
          status: 'RFQ',
          attachments: [newAttachment]
        };
        const createRes = await axios.post('/api/master/npd/product-master', newProdPayload);
        const savedProd = createRes.data;
        setAllProducts(prev => [...prev, savedProd]);
      } else {
        const updatedProduct = {
          ...match,
          attachments: [newAttachment]
        };
        const updateRes = await axios.put(`/api/master/npd/product-master/${match.id}`, updatedProduct);
        const savedProd = updateRes.data;
        setAllProducts(prev => prev.map(p => p.id === match.id ? savedProd : p));
      }

      setSessionUploadedParts(prev => new Set([...prev, part.partNo]));

      dispatch(openSnackbar({ open: true, message: 'Image uploaded and attached to product successfully!', variant: 'alert', severity: 'success' }));
    } catch (err) {
      console.error('Failed to upload image:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to upload image.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleRemovePartImage = async (match, part) => {
    try {
      if (match && match.id) {
        const updatedProduct = {
          ...match,
          attachments: []
        };
        await axios.put(`/api/master/npd/product-master/${match.id}`, updatedProduct);
        setAllProducts(prev => prev.map(p => p.id === match.id ? updatedProduct : p));
      }
      setSessionUploadedParts(prev => {
        const newSet = new Set(prev);
        newSet.delete(part.partNo);
        return newSet;
      });
      dispatch(openSnackbar({ open: true, message: 'Image removed successfully.', variant: 'alert', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Failed to remove image.', variant: 'alert', severity: 'error' }));
    }
  };


  const handleOpenPartLookup = (index = null) => {
    setActiveRowIndex(index);
    setPartLookupOpen(true);
  };

  const handleSearchProducts = () => {
    let filtered = [...allProducts];
    if (searchKeyword.trim() !== '') {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(p =>
        (p.itemNo && p.itemNo.toLowerCase().includes(kw)) ||
        (p.itemName && p.itemName.toLowerCase().includes(kw)) ||
        (p.oemPrefix && p.oemPrefix.toLowerCase().includes(kw)) ||
        (p.itemCode && p.itemCode.toLowerCase().includes(kw))
      );
    }
    setFilteredProducts(filtered);
    setProdPage(0);
  };

  const handleSelectProduct = (prod) => {
    const currentIndex = activeRowIndex !== null ? activeRowIndex : editingPartIndex;
    const isDuplicate = formData.parts.some((p, idx) =>
      idx !== currentIndex && p.partNo && p.partNo.toLowerCase() === (prod.itemNo || '').toLowerCase()
    );

    if (isDuplicate) {
      dispatch(openSnackbar({
        open: true,
        message: `Part No ${prod.itemNo} is already added to this enquiry.`,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setSelectedMasterProduct(prod);

    if (activeRowIndex !== null) {
      setFormData(prev => {
        const newParts = [...prev.parts];
        newParts[activeRowIndex] = {
          ...newParts[activeRowIndex],
          partNo: prod.itemNo || '',
          name: prod.itemName || '',
          oemPartNo: prod.oemPrefix || '',
          ippPartNo: prod.itemCode || '',
          drawingNo: prod.drawingNo || '',
          drawingRevNo: prod.revNo || '',
          rate: prod.sellingRate || 0,
          currencyCd: 'INR',
          stockQty: prod.stockQty || 0,
          inventoryType: prod.inventoryType || '',
          itemCategory: prod.itemCategory || '',
          hsnCode: prod.hsnCode || '',
          uom: prod.uom || '',
          status: newParts[activeRowIndex].status || 'WIP'
        };
        return { ...prev, parts: newParts };
      });
      setActiveRowIndex(null);
    } else {
      setPartFormData(prev => ({
        ...prev,
        partNo: prod.itemNo || '',
        name: prod.itemName || '',
        oemPartNo: prod.oemPrefix || '',
        ippPartNo: prod.itemCode || '',
        drawingNo: prod.drawingNo || '',
        drawingRevNo: prod.revNo || '',
        rate: prod.sellingRate || 0,
        currencyCd: 'INR',
        stockQty: prod.stockQty || 0,
        inventoryType: prod.inventoryType || '',
        itemCategory: prod.itemCategory || '',
        hsnCode: prod.hsnCode || '',
        uom: prod.uom || ''
      }));
    }
    setPartLookupOpen(false);
  };


  const handleDeletePart = (index) => {
    const updated = formData.parts.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, parts: updated }));
  };

  // Excel Bulk Upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await axios.post('/api/sm/enquiry/upload-excel', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, parts: [...prev.parts, ...res.data] }));
      dispatch(openSnackbar({ open: true, message: 'Excel parsing complete. Parts added!', variant: 'alert', severity: 'success' }));
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Failed to import Excel.', variant: 'alert', severity: 'error' }));
    }
  };

  // Bulk Assignment
  const handleSaveAssign = () => {
    const updated = formData.parts.map(p => ({
      ...p,
      department: assignFormData.department,
      assignTo: assignFormData.employeeId,
      status: 'ASSIGNED'
    }));
    setFormData(prev => ({ ...prev, parts: updated }));
    setAssignDialogOpen(false);
    dispatch(openSnackbar({ open: true, message: 'Bulk assignments updated!', variant: 'alert', severity: 'success' }));
  };

  // Feasibility
  const handleSaveFeasibility = () => {
    const updated = formData.parts.map(p => ({
      ...p,
      comerciallyFeasible: feasibilityFormData.commercial,
      technicallyFeasible: feasibilityFormData.technical,
      status: 'FEASIBILITY_DONE'
    }));
    setFormData(prev => ({ ...prev, parts: updated }));
    setFeasibilityDialogOpen(false);
    dispatch(openSnackbar({ open: true, message: 'Bulk feasibility study updated!', variant: 'alert', severity: 'success' }));
  };

  // Email Notification
  const handleOpenEmailDialog = () => {
    setEmailFormData({
      to: formData.email || '',
      cc: '',
      subject: `RFQ Enquiry Notification: ${formData.enquiryNo || 'Draft'}`,
      body: `Dear Customer,\n\nWe have received your enquiry regarding: ${formData.subject}.\n\nThanks & Regards,\nSales Team`
    });
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    try {
      await axios.post('/api/sm/enquiry/send-email', emailFormData);
      dispatch(openSnackbar({ open: true, message: 'RFQ Notification email sent successfully!', variant: 'alert', severity: 'success' }));
      setEmailDialogOpen(false);
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Failed to send notification email.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'space+s': handleSave,
    'escape': () => {
      if (emailDialogOpen) setEmailDialogOpen(false);
      else if (assignDialogOpen) setAssignDialogOpen(false);
      else if (feasibilityDialogOpen) setFeasibilityDialogOpen(false);
      else if (partLookupOpen) setPartLookupOpen(false);
      else if (contactLookupOpen) setContactLookupOpen(false);
      else if (addContactOpen) setAddContactOpen(false);
      else if (deleteOpen) setDeleteOpen(false);
      else navigate('/sm/enquiries');
    }
  }, true);

  return (
    <MainCard
      title={formData.id ? `Edit Enquiry Register: ${formData.enquiryNo}` : 'Enquiry Register'}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 2 }}>
            <Box sx={{ px: 2, py: 0.75, borderRadius: 1.5, bgcolor: 'primary.light', color: 'primary.dark', border: '1px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.8 }}>ENQUIRY NO :</Typography>
              <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5 }}>{formData.enquiryNo || 'Auto-generated'}</Typography>
            </Box>
            <Box sx={{ px: 2, py: 0.75, borderRadius: 1.5, bgcolor: 'secondary.light', color: 'secondary.dark', border: '1px solid', borderColor: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.8 }}>ENQUIRY DATE :</Typography>
              <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5 }}>
                {formData.enquiryDate ? formData.enquiryDate.split('-').reverse().join('/') : '-'}
              </Typography>
            </Box>
          </Box>
          <Tooltip title={shortcutTooltip('Back', 'Esc')}>
            <Button variant="outlined" color="secondary" startIcon={<IconArrowLeft />} onClick={() => navigate('/sm/enquiries')} sx={btnCancel}>
              Back
            </Button>
          </Tooltip>
          {formData.id && (
            <Button variant="contained" color="error" startIcon={<IconTrash />} onClick={() => setDeleteOpen(true)} sx={btnDelete}>
              Delete
            </Button>
          )}
          <Tooltip title={shortcutTooltip('Save')}>
            <Button variant="contained" color="primary" startIcon={<IconDeviceFloppy />} onClick={handleSave} sx={btnSave} disabled={loading}>
              Save
            </Button>
          </Tooltip>
        </Stack>
      }
    >
      <Box sx={{ p: 1 }}>
        <BOSFormSection title="Customer Details & Enquiry Header" defaultExpanded>
          <Stack spacing={2.5}>
            {/* Row 1 */}
            <Box sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField fullWidth select name="rfqMode" label="Enquiry Mode *" required error={!!errors.rfqMode} helperText={errors.rfqMode} sx={errorStyle(!!errors.rfqMode)} value={formData.rfqMode || ''} onChange={(e) => setFormData({ ...formData, rfqMode: e.target.value })}>
                  <MenuItem value=""><em>-Select-</em></MenuItem>
                  <MenuItem value="MAIL">MAIL</MenuItem>
                  <MenuItem value="ASN">ASN</MenuItem>
                  <MenuItem value="WHATSAPP">WHATSAPP</MenuItem>
                  <MenuItem value="TELEPHONE">TELEPHONE</MenuItem>
                  <MenuItem value="WEBSITE">WEBSITE</MenuItem>
                  <MenuItem value="CUSTOMER VISIT -OUR PREMIES">CUSTOMER VISIT -OUR PREMIES</MenuItem>
                  <MenuItem value="CUSTOMER VISIT -THEIR PREMIES">CUSTOMER VISIT -THEIR PREMIES</MenuItem>
                  <MenuItem value="EXPO">EXPO</MenuItem>
                  <MenuItem value="TENDER">TENDER</MenuItem>
                </BOSTextField>
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.vendorName || ''}
                  value={customers.find((c) => c.vendorName === formData.customerName) || null}
                  onChange={(event, newValue) => {
                    handleSelectCustomer(newValue);
                  }}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      fullWidth
                      name="customerName"
                      label="Customer *"
                      placeholder="Type to search..."
                      required
                      error={!!errors.customerName}
                      helperText={errors.customerName}
                      sx={errorStyle(!!errors.customerName)}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {params.InputProps.endAdornment}
                            <InputAdornment position="end">
                              <IconButton onClick={() => setQuickCustomerOpen(true)} edge="end" size="small" title="Quick Create Customer">
                                <IconPlus size={18} />
                              </IconButton>
                            </InputAdornment>
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField
                  fullWidth
                  name="country"
                  label="Country *"
                  required
                  error={!!errors.country}
                  helperText={errors.country}
                  sx={errorStyle(!!errors.country)}
                  value={formData.country || ''}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSDatePicker
                  fullWidth
                  name="targetDate"
                  label="Target Date *"
                  required
                  disablePast={true}
                  disableFuture={false}
                  error={!!errors.targetDate}
                  helperText={errors.targetDate}
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField fullWidth select name="status" label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  {statusList
                    .filter(s => s.name === 'Created' || s.name === 'CREATED' || s.id === formData.status)
                    .map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))
                  }
                </BOSTextField>
              </Box>
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField fullWidth name="salType" label="Sales Type" value={formData.salType} onChange={(e) => setFormData({ ...formData, salType: e.target.value })} />
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField fullWidth select name="source" label="Source" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Website">Website</MenuItem>
                  <MenuItem value="Walk-in">Walk-in</MenuItem>
                  <MenuItem value="Referral">Referral</MenuItem>
                  <MenuItem value="OCR Document">OCR Document</MenuItem>
                </BOSTextField>
              </Box>
              <Box sx={{ flex: 1, minWidth: '130px' }}>
                <BOSTextField fullWidth select name="priority" label="Priority" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </BOSTextField>
              </Box>
              <Box sx={{ flex: 2, minWidth: '260px' }}>
                <BOSTextField
                  fullWidth
                  name="remarks"
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  multiline
                  rows={2}
                  disableRichText
                />
              </Box>
            </Box>
          </Stack>
        </BOSFormSection>

        <Box sx={{ height: 16 }} />

        <BOSFormSection title="Contact Details" defaultExpanded>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Autocomplete
                  freeSolo
                  options={contacts}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.contactName || '';
                  }}
                  value={
                    contacts.find(c => c.contactName === enquiryContact.contactName) || enquiryContact.contactName || ''
                  }
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                      setEnquiryContact(prev => ({ ...prev, contactName: newValue }));
                    } else if (newValue && newValue.contactName) {
                      let isd = '+91', phoneNum = newValue.mobileNo || '';
                      if (phoneNum.includes('-')) {
                        const parts = phoneNum.split('-'); isd = (parts[0] || '').split(' ')[0]; phoneNum = parts.slice(1).join('-');
                      } else if (phoneNum.startsWith('+')) {
                        const matched = (countries || []).find(co => co.countryCode && phoneNum.startsWith(co.countryCode));
                        if (matched) { isd = matched.countryCode; phoneNum = phoneNum.slice(matched.countryCode.length).trim(); }
                      }
                      setEnquiryContact({
                        id: newValue.id,
                        contactName: newValue.contactName || '',
                        mobileNo: phoneNum,
                        emailId: newValue.emailId || '',
                        department: newValue.department || '',
                        designation: newValue.designation || '',
                        mobileISD: isd || '+91'
                      });
                    } else {
                      setEnquiryContact({ id: null, contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' });
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    setEnquiryContact(prev => ({ ...prev, contactName: newInputValue }));
                  }}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      fullWidth
                      label="Contact Name *"
                      placeholder="Type or select contact"
                      required
                      error={!enquiryContact.contactName}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: 1.5, minWidth: '180px' }}>
                <BOSTextField
                  fullWidth
                  label="Mobile No *"
                  required
                  value={enquiryContact.mobileNo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                    setEnquiryContact(prev => ({ ...prev, mobileNo: val }));
                  }}
                  error={!enquiryContact.mobileNo || (enquiryContact.mobileNo.trim().length > 0 && enquiryContact.mobileNo.trim().length !== 10)}
                  helperText={enquiryContact.mobileNo && enquiryContact.mobileNo.trim().length > 0 && enquiryContact.mobileNo.trim().length !== 10 ? "Invalid length: must be between 10 and 10 digits" : ""}
                  inputProps={{
                    maxLength: 10,
                    onInput: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0, '& .MuiSelect-select': { py: 0, pr: 3, pl: 1, fontWeight: 700, color: '#111827', fontSize: '13px' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}>
                        <Select
                          variant="outlined"
                          value={enquiryContact.mobileISD || "+91"}
                          onChange={(e) => {
                            setEnquiryContact(prev => ({ ...prev, mobileISD: e.target.value }));
                          }}
                          sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-select': { paddingRight: '24px !important', paddingLeft: 1 } }}
                          IconComponent={undefined}
                        >
                          {(() => {
                            const validCountries = countries.filter(c => c.isd);
                            if (validCountries.length > 0) {
                              return Array.from(new Map(validCountries.map(c => [c.isd, c])).values()).map(c => (
                                <MenuItem key={c.countryCode || c.isd} value={c.isd}>
                                  {c.isd} ({c.countryName})
                                </MenuItem>
                              ));
                            } else {
                              return <MenuItem value="+91">+91 (INDIA)</MenuItem>;
                            }
                          })()}
                        </Select>
                        <Box sx={{ width: '1px', height: '24px', bgcolor: '#E5E7EB', mx: 1 }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { paddingLeft: 0 } }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '120px' }}>
                <BOSTextField
                  fullWidth
                  label="Email"
                  value={enquiryContact.emailId}
                  onChange={(e) => {
                    setEnquiryContact(prev => ({ ...prev, emailId: e.target.value }));
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '100px' }}>
                <BOSTextField
                  fullWidth
                  label="Department"
                  value={enquiryContact.department}
                  onChange={(e) => {
                    setEnquiryContact(prev => ({ ...prev, department: e.target.value }));
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: '100px' }}>
                <BOSTextField
                  fullWidth
                  label="Designation"
                  value={enquiryContact.designation}
                  onChange={(e) => {
                    setEnquiryContact(prev => ({ ...prev, designation: e.target.value }));
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </BOSFormSection>

        <Box sx={{ height: 16 }} />

        <BOSFormSection title="Enquiry Attachments" defaultExpanded>
          <Box sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start' }}>
            <BOSFileUpload
              files={formData.attachments || []}
              onChange={(files) => {
                setFormData(prev => ({ ...prev, attachments: files }));
              }}
              module="SM_ENQUIRY"
              multiple={true}
              compact={true}
              label="Upload Enquiry Documents"
            />
          </Box>
        </BOSFormSection>

        <Box sx={{ height: 16 }} />

        <BOSFormSection
          title="Enquiry Parts Specification Matrix"
          defaultExpanded
          action={
            <Button
              variant="contained"
              startIcon={<IconPlus />}
              onClick={() => handleAddEmptyRow()}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
                fontWeight: 600,
                borderRadius: '6px',
                px: 2.5,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)'
                },
                transition: 'all 0.2s'
              }}
            >
              Add Item
            </Button>
          }
        >

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: 250 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                  <TableCell>#</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Part No</TableCell>
                  <TableCell>Part Name</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell>OEM Part No</TableCell>
                  <TableCell>IPP Part No</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Req Qty</TableCell>
                  <TableCell>Feasibility</TableCell>
                  <TableCell>Quote Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.parts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      No part items associated with this enquiry. Add or upload items.
                    </TableCell>
                  </TableRow>
                ) : (
                  formData.parts.map((part, index) => {
                    const match = allProducts.find((p) => p.itemNo === part.partNo);
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: theme.palette.action.hover }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ py: 0.75 }}>
                          {part.partNo ? (
                            (match && match.attachments && match.attachments.length > 0) ? (
                              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5, maxWidth: 300, maxHeight: 300 }}>
                                      <img
                                        src={getProductImageUrl(part.name, part.partNo, match)}
                                        alt={part.name}
                                        style={{ width: '100%', height: 'auto', borderRadius: '4px', display: 'block' }}
                                      />
                                    </Box>
                                  }
                                  arrow
                                  placement="right"
                                >
                                  <Box
                                    component="img"
                                    src={getProductImageUrl(part.name, part.partNo, match)}
                                    alt={part.name}
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      objectFit: 'cover',
                                      borderRadius: '6px',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      cursor: 'zoom-in'
                                    }}
                                  />
                                </Tooltip>
                                {sessionUploadedParts.has(part.partNo) && (
                                  <Tooltip title="Remove Image" arrow placement="top">
                                    <Box
                                      onClick={() => handleRemovePartImage(match, part)}
                                      sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                                        '&:hover': { backgroundColor: '#dc2626', transform: 'scale(1.1)' },
                                        transition: 'all 0.2s',
                                        zIndex: 10
                                      }}
                                    >
                                      <IconX size={12} stroke={3} />
                                    </Box>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                                <input
                                  type="file"
                                  style={{ display: 'none' }}
                                  accept="image/*"
                                  onChange={(e) => handleUploadPartImage(e, match, part)}
                                />
                                <Tooltip title="Click to upload image" arrow placement="right">
                                  <Box
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '6px',
                                      border: '1px dashed #cbd5e1',
                                      backgroundColor: '#f8fafc',
                                      color: '#64748b',
                                      '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        backgroundColor: '#eff6ff'
                                      },
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <IconPlus size={20} />
                                  </Box>
                                </Tooltip>
                              </label>
                            )
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            disabled={!formData.customerName}
                            options={allProducts.map((p) => p.itemNo)}
                            value={part.partNo || ''}
                            inputValue={part.partNo || ''}
                            onChange={(e, newValue) => {
                              const match = allProducts.find((p) => p.itemNo === newValue);
                              if (match) {
                                if (handlePartFieldChange(index, 'partNo', newValue)) {
                                  handlePartFieldChange(index, 'name', match.itemName || '');
                                  handlePartFieldChange(index, 'uom', match.uom || '');
                                }
                              } else {
                                if (handlePartFieldChange(index, 'partNo', newValue || '')) {
                                  handlePartFieldChange(index, 'name', '');
                                  handlePartFieldChange(index, 'uom', '');
                                }
                              }
                            }}
                            onInputChange={(e, newInputValue) => {
                              if (handlePartFieldChange(index, 'partNo', newInputValue)) {
                                // Clear auto-populated fields if part no is changed manually and no longer matches
                                const oldMatch = allProducts.find((p) => p.itemNo === part.partNo);
                                const newMatch = allProducts.find((p) => p.itemNo === newInputValue);
                                if (oldMatch && !newMatch) {
                                  handlePartFieldChange(index, 'name', '');
                                  handlePartFieldChange(index, 'uom', '');
                                }
                              }
                            }}
                            renderInput={(params) => (
                              <BOSTextField
                                {...params}
                                placeholder="Type or Select..."
                                sx={{ minWidth: 140 }}
                                inputProps={{ ...params.inputProps, style: { padding: '6px 8px' } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField
                            size="small"
                            value={part.name || (match ? match.itemName : '') || ''}
                            onChange={(e) => handlePartFieldChange(index, 'name', e.target.value)}
                            sx={{ minWidth: 130 }}
                            inputProps={{ style: { padding: '6px 8px' } }}
                            disabled={!!match && !!match.itemName}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            options={['NOS', 'KGS', 'MTRS', 'LTRS', 'SETS', 'PCS']}
                            value={part.uom || (match ? match.uom : '') || ''}
                            onChange={(e, newValue) => handlePartFieldChange(index, 'uom', newValue || '')}
                            onInputChange={(e, newInputValue) => handlePartFieldChange(index, 'uom', newInputValue)}
                            disabled={!!match && !!match.uom}
                            renderInput={(params) => (
                              <BOSTextField
                                {...params}
                                placeholder="UOM"
                                sx={{ minWidth: 100 }}
                                inputProps={{ ...params.inputProps, style: { padding: '6px 8px' } }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField size="small" value={part.oemPartNo} onChange={(e) => handlePartFieldChange(index, 'oemPartNo', e.target.value)} sx={{ minWidth: 110 }} inputProps={{ style: { padding: '6px 8px' } }} />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField size="small" value={part.ippPartNo} onChange={(e) => handlePartFieldChange(index, 'ippPartNo', e.target.value)} sx={{ minWidth: 110 }} inputProps={{ style: { padding: '6px 8px' } }} />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 0.5 }}>
                          <BOSTextField size="small" value={match?.stockQty || ''} InputProps={{ readOnly: true }} sx={{ minWidth: 70, width: 70 }} inputProps={{ style: { padding: '6px 8px', textAlign: 'right' } }} />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 0.5 }}>
                          <BOSTextField size="small" type="number" value={part.annualReqQty} onChange={(e) => handlePartFieldChange(index, 'annualReqQty', e.target.value)} sx={{ minWidth: 70, width: 70 }} inputProps={{ style: { padding: '6px 8px', textAlign: 'right' } }} />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField
                            size="small"
                            value={part.technicallyFeasible === 'Any' && part.comerciallyFeasible === 'Any' ? '' : (part.technicallyFeasible || '')}
                            placeholder="Type Feasibility..."
                            onChange={(e) => {
                              handlePartFieldChange(index, 'technicallyFeasible', e.target.value);
                              handlePartFieldChange(index, 'comerciallyFeasible', e.target.value);
                            }}
                            sx={{ minWidth: 120 }}
                            inputProps={{ style: { padding: '6px 8px' } }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField size="small" value={part.status} onChange={(e) => handlePartFieldChange(index, 'status', e.target.value)} sx={{ minWidth: 80 }} inputProps={{ style: { padding: '6px 8px' } }} />
                        </TableCell>
                        <TableCell sx={{ p: 0.5 }}>
                          <BOSTextField size="small" value={part.assignTo || (part.partNo ? 'Unassigned' : '')} InputProps={{ readOnly: true }} sx={{ minWidth: 110 }} inputProps={{ style: { padding: '6px 8px' } }} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => handleDeletePart(index)}>
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })

                )}
              </TableBody>
            </Table>
          </TableContainer>
        </BOSFormSection>



      </Box>

      {/* Contact Lookup Dialog */}
      <BOSFormDialog
        open={contactLookupOpen}
        onClose={() => setContactLookupOpen(false)}
        title="Select Contact Person"
        maxWidth="lg"
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" color="secondary" startIcon={<IconUserPlus size={18} />} onClick={() => setAddContactOpen(true)}>
            Add Contact
          </Button>
        </Box>
        {contacts.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ py: 3, color: 'text.secondary' }}>
            No contacts found for {formData.customerName || 'this customer'}. Click 'Add Contact' to create one.
          </Typography>
        ) : (
          <BOSDataTable
            id="enquiry-contact-lookup-table"
            columns={contactColumns}
            rows={contacts.slice(contactPage * contactSize, (contactPage + 1) * contactSize).map((c, idx) => ({
              ...c,
              index: contactPage * contactSize + idx + 1
            }))}
            page={contactPage}
            size={contactSize}
            totalCount={contacts.length}
            onPageChange={(p) => setContactPage(p)}
            onSizeChange={(s) => { setContactSize(s); setContactPage(0); }}
            onDoubleClickRow={(row) => handleSelectContact(row)}
            onEditRow={(row) => handleSelectContact(row)}
            editTooltip="Select Contact"
            showActions={true}
            sx={{ minHeight: 300 }}
          />
        )}
      </BOSFormDialog>

      {/* Add Contact Dialog */}
      <BOSFormDialog
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onSave={handleAddContact}
        title="Create Customer Contact"
        maxWidth="sm"
      >
        <Stack spacing={2}>
          <BOSTextField select label="Title" value={newContactData.title} onChange={(e) => setNewContactData({ ...newContactData, title: e.target.value })}>
            <MenuItem value="Mr.">Mr.</MenuItem>
            <MenuItem value="Mrs.">Mrs.</MenuItem>
            <MenuItem value="Ms.">Ms.</MenuItem>
          </BOSTextField>
          <BOSTextField
            label="Contact Name"
            required
            value={newContactData.contactName}
            error={!!contactErrors.contactName}
            helperText={contactErrors.contactName}
            onChange={(e) => {
              setNewContactData({ ...newContactData, contactName: e.target.value });
              if (contactErrors.contactName) setContactErrors(prev => ({ ...prev, contactName: '' }));
            }}
          />
          <BOSTextField label="Designation" value={newContactData.designation} onChange={(e) => setNewContactData({ ...newContactData, designation: e.target.value })} />
          <BOSTextField label="Department" value={newContactData.department} onChange={(e) => setNewContactData({ ...newContactData, department: e.target.value })} />
          <BOSTextField label="Email ID" value={newContactData.emailId} onChange={(e) => setNewContactData({ ...newContactData, emailId: e.target.value })} />

          <BOSTextField
            label="Mobile No"
            value={newContactData.mobileNo}
            error={!!contactErrors.mobileNo}
            helperText={contactErrors.mobileNo}
            onChange={(e) => {
              setNewContactData({ ...newContactData, mobileNo: e.target.value });
              if (contactErrors.mobileNo) setContactErrors(prev => ({ ...prev, mobileNo: '' }));
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <Select
                  value={newContactData.mobileISD}
                  onChange={(e) => setNewContactData({ ...newContactData, mobileISD: e.target.value })}
                  variant="standard"
                  disableUnderline
                  IconComponent={() => null}
                  sx={{
                    width: 75,
                    minWidth: 75,
                    mr: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '& .MuiSelect-select': {
                      py: 0,
                      pr: '4px !important',
                      pl: 1
                    }
                  }}
                >
                  {countries.map(c => (
                    <MenuItem key={c.id} value={c.countryCode}>
                      {c.countryIso} ({c.countryCode})
                    </MenuItem>
                  ))}
                </Select>
              )
            }}
          />

          <BOSTextField
            label="WhatsApp No"
            value={newContactData.whatsAppNo}
            error={!!contactErrors.whatsAppNo}
            helperText={contactErrors.whatsAppNo}
            onChange={(e) => {
              setNewContactData({ ...newContactData, whatsAppNo: e.target.value });
              if (contactErrors.whatsAppNo) setContactErrors(prev => ({ ...prev, whatsAppNo: '' }));
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <Select
                  value={newContactData.whatsAppISD}
                  onChange={(e) => setNewContactData({ ...newContactData, whatsAppISD: e.target.value })}
                  variant="standard"
                  disableUnderline
                  IconComponent={() => null}
                  sx={{
                    width: 75,
                    minWidth: 75,
                    mr: 1.5,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '& .MuiSelect-select': {
                      py: 0,
                      pr: '4px !important',
                      pl: 1
                    }
                  }}
                >
                  {countries.map(c => (
                    <MenuItem key={c.id} value={c.countryCode}>
                      {c.countryIso} ({c.countryCode})
                    </MenuItem>
                  ))}
                </Select>
              )
            }}
          />
        </Stack>
      </BOSFormDialog>



      {/* Bulk Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Costing/Technical Assign</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <BOSTextField
              select
              label="Department"
              value={assignFormData.department}
              onChange={(e) => setAssignFormData({ ...assignFormData, department: e.target.value })}
              fullWidth
            >
              <MenuItem value="DESIGN & DEVELOPMENT">DESIGN & DEVELOPMENT</MenuItem>
              <MenuItem value="STRATEGIC PROCUREMENT">STRATEGIC PROCUREMENT</MenuItem>
              <MenuItem value="MANAGEMENT">MANAGEMENT</MenuItem>
            </BOSTextField>
            <BOSTextField
              select
              label="Assign To"
              value={assignFormData.employeeId}
              onChange={(e) => setAssignFormData({ ...assignFormData, employeeId: e.target.value })}
              fullWidth
            >
              {employees.map(emp => (
                <MenuItem key={emp.id} value={emp.employeeCode}>
                  {emp.employeeName} ({emp.employeeCode})
                </MenuItem>
              ))}
            </BOSTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAssign}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Feasibility study Dialog */}
      <Dialog open={feasibilityDialogOpen} onClose={() => setFeasibilityDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Feasibility study</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <BOSTextField
              select
              label="Commercially Feasible"
              value={feasibilityFormData.commercial}
              onChange={(e) => setFeasibilityFormData({ ...feasibilityFormData, commercial: e.target.value })}
              fullWidth
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
              <MenuItem value="Any">Any</MenuItem>
            </BOSTextField>
            <BOSTextField
              select
              label="Technically Feasible"
              value={feasibilityFormData.technical}
              onChange={(e) => setFeasibilityFormData({ ...feasibilityFormData, technical: e.target.value })}
              fullWidth
            >
              <MenuItem value="Yes">Yes</MenuItem>
              <MenuItem value="No">No</MenuItem>
              <MenuItem value="Any">Any</MenuItem>
            </BOSTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeasibilityDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFeasibility}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Mail Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compose RFQ Mail</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <BOSTextField label="TO" value={emailFormData.to} onChange={(e) => setEmailFormData({ ...emailFormData, to: e.target.value })} fullWidth />
            <BOSTextField label="CC" value={emailFormData.cc} onChange={(e) => setEmailFormData({ ...emailFormData, cc: e.target.value })} fullWidth />
            <BOSTextField label="SUBJECT" value={emailFormData.subject} onChange={(e) => setEmailFormData({ ...emailFormData, subject: e.target.value })} fullWidth />
            <BOSTextField label="BODY / CONTENT" value={emailFormData.body} onChange={(e) => setEmailFormData({ ...emailFormData, body: e.target.value })} multiline rows={8} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="info" onClick={handleSendEmail}>Send Mail</Button>
        </DialogActions>
      </Dialog>

      <ProductLookupDialog
        open={partLookupOpen}
        onClose={() => setPartLookupOpen(false)}
        onSelect={handleSelectProduct}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
        itemName={formData.enquiryNo}
      />      <Dialog
        open={quickCustomerOpen}
        onClose={() => setQuickCustomerOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '1150px',
            maxWidth: '1150px',
            height: '720px',
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <Box sx={{ bgcolor: '#EAF4FF', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Typography sx={{ color: '#1976D2', fontWeight: 700, fontSize: '1.25rem' }}>
            Quick Create Customer
          </Typography>
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', right: 24 }}>
            <IconButton size="small" sx={{ color: '#64748B' }}><IconMinus size={18} /></IconButton>
            <IconButton size="small" sx={{ color: '#64748B' }}><IconMaximize size={18} /></IconButton>
            <IconButton size="small" onClick={() => setQuickCustomerOpen(false)} sx={{ color: '#64748B' }}><IconX size={18} /></IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: '36px', flex: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '24px', rowGap: '20px' }}>
            {/* Row 1 */}
            <Box>
              <BOSTextField fullWidth name="vendorName" label="Customer Name *" placeholder="Enter customer name" value={quickCustomerData.vendorName} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, vendorName: e.target.value })} error={!!quickCustomerErrors.vendorName} helperText={quickCustomerErrors.vendorName} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>
            <Box>
              <BOSTextField fullWidth name="shortName" label="Short Name" placeholder="Enter short name" value={quickCustomerData.shortName} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, shortName: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>

            {/* Row 2 */}
            <Box>
              <BOSTextField
                fullWidth
                name="mobileNo"
                label="Mobile No"
                placeholder="Enter mobile number"
                value={quickCustomerData.mobileNo}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setQuickCustomerData({ ...quickCustomerData, mobileNo: val });
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0, '& .MuiSelect-select': { py: 0, pr: 3, pl: 1, fontWeight: 700, color: '#111827', fontSize: '15px' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}>
                      <Select
                        variant="outlined"
                        value={quickCustomerData.mobileISD || "+91"}
                        onChange={(e) => setQuickCustomerData({ ...quickCustomerData, mobileISD: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-select': { paddingRight: '24px !important', paddingLeft: 1 } }}
                        IconComponent={undefined}
                      >
                        {(() => {
                          const validCountries = countries.filter(c => c.isd);
                          if (validCountries.length > 0) {
                            return Array.from(new Map(validCountries.map(c => [c.isd, c])).values()).map(c => (
                              <MenuItem key={c.countryCode || c.isd} value={c.isd}>
                                {c.isd} ({c.countryName})
                              </MenuItem>
                            ));
                          } else {
                            return <MenuItem value="+91">+91 (INDIA)</MenuItem>;
                          }
                        })()}
                      </Select>
                      <Box sx={{ width: '1px', height: '24px', bgcolor: '#E5E7EB', mx: 1 }} />
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', paddingLeft: 0, '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }}
              />
            </Box>
            <Box>
              <BOSTextField fullWidth name="referenceCode" label="Reference Code" placeholder="Enter reference code" value={quickCustomerData.referenceCode} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, referenceCode: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>

            {/* Row 3 */}
            <Box>
              <BOSTextField fullWidth name="gstin" label="GSTIN" placeholder="Enter GSTIN" value={quickCustomerData.gstin} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, gstin: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>
            <Box>
              <BOSTextField select fullWidth name="country" label="Country" value={quickCustomerData.country || ""} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, country: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiSelect-select': { color: quickCustomerData.country ? 'inherit' : '#9AA3AF' } }} displayEmpty>
                <MenuItem value="" disabled sx={{ color: '#9AA3AF', display: 'none' }}>Select country</MenuItem>
                {countries.map(c => <MenuItem key={c.id} value={c.countryName}>{c.countryName}</MenuItem>)}
              </BOSTextField>
            </Box>

            {/* Row 4 */}
            <Box>
              <BOSTextField select fullWidth name="state" label="State" value={quickCustomerData.state || ""} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, state: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiSelect-select': { color: quickCustomerData.state ? 'inherit' : '#9AA3AF' } }} displayEmpty>
                <MenuItem value="" disabled sx={{ color: '#9AA3AF', display: 'none' }}>Select state</MenuItem>
                {allStates.filter(s => s.countryName === quickCustomerData.country).map(s => <MenuItem key={s.id} value={s.stateName}>{s.stateName}</MenuItem>)}
              </BOSTextField>
            </Box>
            <Box>
              <BOSTextField fullWidth name="city" label="City" placeholder="Enter city" value={quickCustomerData.city} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, city: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>

            {/* Row 5 */}
            <Box>
              <BOSTextField fullWidth name="pinCode" label="Pincode" placeholder="Enter pincode" value={quickCustomerData.pinCode} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, pinCode: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { height: '56px', borderRadius: '10px', '& fieldset': { borderColor: '#E5E7EB' } }, '& .MuiInputLabel-root': { fontSize: '16px' }, '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 } }} />
            </Box>
            <Box></Box>

            {/* Row 6 */}
            <Box sx={{ gridColumn: 'span 2' }}>
              <BOSTextField
                fullWidth
                name="address"
                label="Address"
                placeholder="Enter full address"
                multiline
                rows={4}
                disableRichText
                value={quickCustomerData.address}
                onChange={(e) => setQuickCustomerData({ ...quickCustomerData, address: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '120px',
                    borderRadius: '10px',
                    alignItems: 'flex-start',
                    '& fieldset': { borderColor: '#E5E7EB' }
                  },
                  '& .MuiInputLabel-root': { fontSize: '16px' },
                  '& .MuiInputBase-input::placeholder': { color: '#9AA3AF', opacity: 1 }
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: '36px', pb: '36px', pt: '24px', display: 'flex', justifyContent: 'flex-end', gap: '24px' }}>
          <Button
            variant="outlined"
            onClick={() => setQuickCustomerOpen(false)}
            sx={{ height: '48px', width: '140px', borderRadius: '8px', color: '#374151', borderColor: '#D1D5DB', fontWeight: 600, textTransform: 'none', fontSize: '16px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuickCustomer}
            sx={{ height: '48px', width: '140px', borderRadius: '8px', bgcolor: '#2196F3', color: '#fff', fontWeight: 600, textTransform: 'none', fontSize: '16px', boxShadow: 'none', '&:hover': { bgcolor: '#1976D2', boxShadow: 'none' } }}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <CustomerLookupDialog
        open={customerLookupOpen}
        onClose={() => setCustomerLookupOpen(false)}
        onSelect={handleSelectCustomer}
      />
    </MainCard>
  );
}
