import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MenuItem, Stack, Box, Typography, Paper, useTheme, Grid, Button, Tooltip, Autocomplete, InputAdornment, IconButton, Dialog, Select } from '@mui/material';
import { IconSettings, IconScan, IconReceipt2, IconTruckDelivery, IconCreditCard, IconX, IconDeviceFloppy, IconFileInvoice, IconArrowLeft, IconPlus, IconMinus, IconMaximize, IconTrash } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormSection, BOSTextField, BOSAutocomplete, BOSFileUpload, BOSDatePicker, errorStyle, btnSave, btnCancel } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSForm from 'hooks/useBOSForm';
import { autoUploadFiles } from 'utils/upload-helper';
import MainCard from 'ui-component/cards/MainCard';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { isInterStateTransaction } from 'utils/taxUtils';
import QuotationPartsMatrix from './QuotationPartsMatrix';

// ==============================|| QUOTATION ENTRY - PROFESSIONAL TEMPLATE ||============================== //

const QuotationEntry = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isViewOnly = new URLSearchParams(location.search).get('view') === 'true';

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [quotationContacts, setQuotationContacts] = useState([{ contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91 (INDIA)' }]);

  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({
    vendorName: '', shortName: '', mobileNo: '', mobileISD: '+91', referenceCode: '', gstin: '', country: '', state: '', city: '', pinCode: '', address: ''
  });
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [despatchModes, setDespatchModes] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [hsnList, setHsnList] = useState([]);
  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    quotationNo: '',
    quotationDate: new Date().toISOString().split('T')[0],
    enquiryRef: '',
    customerName: '',
    customerId: '',
    productName: '',
    description: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    currency: 'INR',
    validityPeriod: '30 Days',
    deliveryTerms: '',
    paymentTerms: '',
    customerGroup: '',
    enquiryMode: '',
    transportMode: '',
    exchangeRate: '',
    requestDate: new Date().toISOString().split('T')[0],
    ocrDocumentPath: '',
    ocrExtractedText: '',
    ocrConfidence: '',
    status: true,
    quotationStatus: 34,
    remarks: '',
    attachmentPath: '',
    parts: [],

    // Contact Details
    contactPerson: '',
    phone: '',
    email: '',
    department: '',
    designation: '',

    contactPerson1: '',
    mobile1: '',
    emailId1: '',
    department1: '',
    designation1: '',

    qualityContact: '',
    qualityMobile: '',
    qualityEmail: '',
    qualityDept: '',
    qualityDesig: '',

    financeContact: '',
    financeMobile: '',
    financeEmail: '',
    financeDept: '',
    financeDesig: '',

    enquiryContact: '',
    enquiryMobile: '',
    enquiryEmail: '',
    enquiryDept: '',
    enquiryDesig: '',
    attachments: [] // Added for Gold Standard compliance
  });

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [custRes, countryRes, stateRes, enquiryRes, prodRes, hsnRes, dispatchRes] = await Promise.all([
          axios.get(API_PATHS.SM.CUSTOMERS),
          axios.get('/api/admin/countries', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/admin/states', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get(API_PATHS.SM.ENQUIRIES, { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get(API_PATHS.NPD.PRODUCT_MASTER, { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get(API_PATHS.NPD.HSN_MASTER, { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/sm/despatch-mode', { skipGlobalAlert: true }).catch(() => ({ data: [] }))
        ]);
        setCustomers(custRes.data || []);
        setCountries(countryRes.data || []);
        setAllStates(stateRes.data || []);
        setEnquiries(enquiryRes.data || []);
        setAllProducts(prodRes.data || []);
        setHsnList(hsnRes.data || []);
        setDespatchModes((dispatchRes.data || []).map(m => m.modeName || m.despatchMode || m.description || m.termName));
      } catch (err) {
        console.error('Failed to fetch master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  const fetchContacts = async (custName) => {
    try {
      const res = await axios.get('/api/sm/contacts');
      const filtered = (res.data || []).filter(c => c.groupName === custName);
      setContacts(filtered);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setContacts([]);
    }
  };

  const handleAddContact = (e) => {
    e.stopPropagation();

    // Validate existing contacts
    const hasEmptyFields = quotationContacts.some(
      contact => !contact.contactName || !contact.contactName.trim() || !contact.mobileNo || !contact.mobileNo.trim() || !contact.emailId || !contact.emailId.trim()
    );

    if (hasEmptyFields) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill the Contact Name, Mobile No, and Email in existing rows before adding a new one.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setQuotationContacts([...quotationContacts, { contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' }]);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const res = await axios.get(`${API_PATHS.SM.QUOTATIONS}/${id}`);
          const initialData = res.data;

          let customerName = '';
          const customerId = initialData.customerId;

          if (customerId) {
            try {
              const custRes = await axios.get(`${API_PATHS.SM.CUSTOMERS}/${customerId}`);
              customerName = custRes.data?.customerName || '';
              if (customerName) {
                fetchContacts(customerName);
              }
            } catch (e) { }
          }

          if (initialData.contactId) {
            try {
              const contactRes = await axios.get(`/api/sm/contacts/${initialData.contactId}`);
              if (contactRes.data) {
                let isd = contactRes.data.mobileISD || '+91';
                let phoneNum = contactRes.data.mobileNo || '';

                if (phoneNum.includes('-')) {
                  const parts = phoneNum.split('-');
                  isd = (parts[0] || '').split(' ')[0];
                  phoneNum = parts.slice(1).join('-');
                } else if (phoneNum.startsWith('+')) {
                  const matched = (countries || []).find(co => co.countryCode && phoneNum.startsWith(co.countryCode));
                  if (matched) { isd = matched.countryCode; phoneNum = phoneNum.slice(matched.countryCode.length).trim(); }
                }

                setQuotationContacts([{
                  contactName: contactRes.data.contactName || '',
                  mobileNo: phoneNum,
                  emailId: contactRes.data.emailId || '',
                  department: contactRes.data.department || '',
                  designation: contactRes.data.designation || '',
                  mobileISD: isd
                }]);
              }
            } catch (e) {
              console.error('Failed to load quotation contact details', e);
            }
          }

          let products = allProducts;
          if (!products || products.length === 0) {
            const prodRes = await axios.get(API_PATHS.NPD.PRODUCT_MASTER, { skipGlobalAlert: true }).catch(() => ({ data: [] }));
            products = prodRes.data || [];
          }

          const mappedParts = await Promise.all((initialData.parts || []).map(async p => {
            const product = products.find(prod => prod.id === p.partNoId) || {};
            let fetchedPrice = product.sellingRate || product.price || product.unitRate || 0;
            if (product.id && customerId) {
              try {
                const res = await axios.get('/api/sales/price-master/applicable-price', {
                  params: { customerId: customerId, productId: product.id }
                });
                if (res.data && res.data > 0) {
                  fetchedPrice = res.data;
                }
              } catch (err) { }
            }

            return {
              id: p.id,
              partNoId: p.partNoId,
              partNo: product.itemNo || '',
              name: product.itemName || '',
              hsnCode: product.hsnCode || '',
              uom: product.uom || 'Nos',
              reqQty: p.qty || 0,
              unitRate: p.amount || 0,
              fetchedPrice: fetchedPrice,
              disType: p.disType || 'N/A',
              discount: p.discount || 0,
              capacity: p.capacity || 0,
              additionalComments: p.additionalComments || '',
              warranty: p.warrenty || '',
              leadTimeType: p.leadTimeType || 'N/A',
              leadTimeDays: p.leadTimeDays || p.leadTime || 0,
              remarks: p.remarks || '',
              approvalStatus: p.approvalStatus ? 'APPROVED' : 'OPEN',
              status: p.status ? 'CREATED' : 'OPEN',
              amount: (p.qty || 0) * (p.amount || 0),
              imageUrl: product.attachments && product.attachments.length > 0 ? (product.attachments[0].path || product.attachments[0].attachmentPath || '') : '',
              cgstRate: product.cgstRate || 0,
              sgstRate: product.sgstRate || 0,
              igstRate: product.igstRate || 0,
              freightAmt: p.frightAmount || 0,
              freightTaxRate: p.frightPer || 0
            };
          }));

          const attachmentsMapped = (initialData.attachments || []).map(a => ({
            fileName: a.fileName || (a.path ? a.path.split('/').pop() : 'document.pdf'),
            serverFileName: a.path,
            isServer: true
          }));

          setFormData({
            ...initialData,
            quotationDate: initialData.quotationDate ? new Date(initialData.quotationDate).toISOString().split('T')[0] : '',
            customerId: customerId || '',
            parts: mappedParts,
            attachments: attachmentsMapped
          });
        } catch (error) {
          dispatch(openSnackbar({ open: true, message: 'Failed to fetch quotation details.', severity: 'error', variant: 'alert' }));
        }
      } else {
        resetForm();
        setQuotationContacts([{ contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' }]);

        try {
          const codeRes = await axios.get('/api/sm/quotation/next-code');
          if (codeRes.data && codeRes.data.code) {
            setFormData(prev => ({ ...prev, quotationNo: codeRes.data.code }));
          }
        } catch (e) {
          console.error('Failed to get next quotation code', e);
        }

      }
    };
    fetchData();
  }, [id, setFormData, resetForm, dispatch, allProducts]);

  const handleCustomChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const selectedCust = customers.find(c => c.id === value);
      setFormData((prev) => ({
        ...prev,
        customerId: value,
        customerName: selectedCust ? selectedCust.customerName : prev.customerName,
        contactPerson: selectedCust ? selectedCust.contactPerson : prev.contactPerson
      }));
      if (selectedCust && selectedCust.customerName) {
        fetchContacts(selectedCust.customerName);
      }
    } else {
      handleFormChange(e);
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
      const vendorPayload = {
        ...quickCustomerData,
        isCustomer: true,
        isSupplier: false,
        isSubcon: false
      };
      const vendorRes = await axios.post('/api/master/vendors', vendorPayload);
      const newCustomer = vendorRes.data;

      // Create Contact if mobile no is provided
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
      const updatedCustomersRes = await axios.get(API_PATHS.SM.CUSTOMERS);
      const updatedCustomers = updatedCustomersRes.data || [];
      setCustomers(updatedCustomers);

      // Select new customer
      const createdMatch = updatedCustomers.find(c => c.id === newCustomer.id || c.customerName === newCustomer.vendorName);
      if (createdMatch) {
        setFormData(prev => ({
          ...prev,
          customerId: createdMatch.id,
          customerName: createdMatch.customerName,
          contactPerson: createdMatch.contactPerson || ''
        }));
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
    const { isValid, firstMissing } = validate([
      { field: 'customerId', label: 'Customer' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    const hasValidContact = quotationContacts.some(c => c.contactName && c.contactName.trim() !== '');
    if (!hasValidContact) {
      dispatch(openSnackbar({ open: true, message: 'Please add at least one Contact Person.', variant: 'alert', severity: 'error' }));
      return;
    }

    if (!formData.parts || formData.parts.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please add at least one Part Item in Quotation Parts Specification Matrix.',
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    for (let i = 0; i < formData.parts.length; i++) {
      const part = formData.parts[i];
      const rowNum = i + 1;

      if (!part.partNo || !part.partNo.trim()) {
        dispatch(openSnackbar({
          open: true,
          message: `Row ${rowNum}: Part No is mandatory.`,
          variant: 'alert',
          severity: 'error',
          alert: { variant: 'filled' }
        }));
        return;
      }

      const qtyVal = parseFloat(part.reqQty);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Row ${rowNum}: Quantity (Qty) must be greater than 0.`,
          variant: 'alert',
          severity: 'error',
          alert: { variant: 'filled' }
        }));
        return;
      }

      const rateVal = parseFloat(part.unitRate);
      if (isNaN(rateVal) || rateVal <= 0) {
        dispatch(openSnackbar({
          open: true,
          message: `Row ${rowNum}: Unit Rate must be greater than 0.`,
          variant: 'alert',
          severity: 'error',
          alert: { variant: 'filled' }
        }));
        return;
      }
    }

    const hasInvalidMobile = quotationContacts.some(
      contact => contact.mobileNo && contact.mobileNo.trim().length > 0 && contact.mobileNo.trim().length !== 10
    );

    if (hasInvalidMobile) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please ensure all Mobile Numbers are exactly 10 digits.',
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    const submissionData = {
      ...formData,
      customer: formData.customerId ? { id: formData.customerId } : null
    };

    let needsVerification = false;
    if (submissionData.parts) {
      submissionData.parts.forEach(part => {
        const unitRate = parseFloat(part.unitRate || 0);
        const fetchedPrice = parseFloat(part.fetchedPrice || 0);
        const discount = parseFloat(part.discount || 0);
        if (unitRate < fetchedPrice || discount > 0) {
          needsVerification = true;
        }
      });
    }
    submissionData.needsVerification = needsVerification;

    try {
      if (submissionData.parts && submissionData.parts.length > 0) {
        for (const part of submissionData.parts) {
          if (part.partNo && part.partNo.trim() !== '') {
            const match = allProducts.find(p => p.itemNo === part.partNo.trim());
            if (match) {
              part.partNoId = match.id;
            } else {
              try {
                const newProduct = {
                  itemNo: part.partNo.trim(),
                  itemName: part.name || part.partNo.trim(),
                  hsnCode: part.hsnCode || '',
                  uom: part.uom || 'Nos',
                  modelNo: part.model || '',
                  sellingRate: part.unitRate || 0,
                  status: 'RFQ',
                  attachments: part.imageUrl ? [{ attachmentPath: part.imageUrl, docType: 'IMAGE', pageCode: 'M3115' }] : []
                };
                const prodRes = await axios.post('/api/master/npd/product-master', newProduct);
                part.partNoId = prodRes.data.id;
              } catch (productErr) {
                if (productErr?.response?.data === 'Item No already exists!' || productErr?.response?.status === 400) {
                  // Handled by global interceptor anyway, but fallback logic
                } else {
                  console.error(`Failed to create product ${part.partNo}:`, productErr);
                }
              }
            }
          }
        }

        // Format parts to match SmQuotationDetail entity exactly
        submissionData.parts = submissionData.parts.map(p => {
          const mapped = {
            partNoId: p.partNoId,

            partNo: p.partNo || '',
            name: p.name || '',
            hsnCode: p.hsnCode || '',
            uom: p.uom || '',
            qty: p.reqQty || 0,

            amount: p.unitRate || 0,
            disType: p.disType || 'N/A',
            discount: p.discount || 0,
            totalValue: (p.reqQty || 0) * (p.unitRate || 0) - (p.discount || 0),
            capacity: p.capacity || 0,
            additionalComments: p.additionalComments || '',
            warrenty: p.warranty || '',
            leadTimeType: p.leadTimeType || 'N/A',
            leadTimeDays: p.leadTimeDays || 0,
            remarks: p.remarks || '',
            approvalStatus: p.approvalStatus === 'APPROVED' ? true : false,
            status: true
          };
          if (p.id && p.id < 10000000000) {
            mapped.id = p.id;
          }
          return mapped;
        });
      }

      if (formData.attachments && formData.attachments.length > 0) {
        const filesToUpload = formData.attachments.filter(f => !f.isServer);
        let uploadedPaths = [];
        if (filesToUpload.length > 0) {
          uploadedPaths = await autoUploadFiles(filesToUpload, 'SM_QUOTATION');
        }

        let uploadedIndex = 0;
        submissionData.attachments = formData.attachments.map(f => {
          if (f.isServer) {
            return { fileName: f.fileName || f.serverFileName || 'document.pdf', path: f.serverFileName || f.fileName, docType: 'IMAGE', pageCode: 'SM1140' };
          } else {
            const uploadedPath = uploadedPaths[uploadedIndex++];
            return { fileName: f.name || 'document.pdf', path: uploadedPath, docType: 'IMAGE', pageCode: 'SM1140' };
          }
        });
      }

      // Save Contacts to Master First
      try {
        const existingContactsRes = await axios.get('/api/sm/contacts');
        const existingMasterContacts = existingContactsRes.data || [];

        for (const contact of quotationContacts) {
          if (!contact.contactName && !contact.mobileNo) continue;

          const formattedMobile = contact.mobileNo ? `${contact.mobileISD || '+91'}-${contact.mobileNo}` : '';

          const payload = {
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
            await axios.put(`/api/sm/contacts/${match.id}`, { ...payload, id: match.id });
            submissionData.contactId = match.id;
          } else {
            const res = await axios.post('/api/sm/contacts', payload);
            if (res.data && res.data.id) {
              submissionData.contactId = res.data.id;
            }
          }
          break; // We only need the primary contact ID
        }
      } catch (contactErr) {
        console.error('Failed to save contacts to master:', contactErr);
      }

      if (id) {
        await axios.put(`${API_PATHS.SM.QUOTATIONS}/${id}`, submissionData);
      } else {
        await axios.post(API_PATHS.SM.QUOTATIONS, submissionData);
      }

      dispatch(openSnackbar({ open: true, message: id ? 'Quotation updated successfully!' : 'Quotation created successfully!', severity: 'success', variant: 'alert' }));
      navigate('/sm/quotations');
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save quotation.', severity: 'error', variant: 'alert' }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.QUOTATIONS}/${id}`);
      dispatch(openSnackbar({ open: true, message: 'Quotation deleted!', severity: 'success', variant: 'alert' }));
      navigate('/sm/quotations');
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', severity: 'error', variant: 'alert' }));
    }
  };

  useKeyboardShortcuts({
    'space+s': handleSave,
    'escape': () => navigate('/sm/quotations')
  }, true);

  return (
    <>
      <MainCard
        fullWidth
        title={id ? `Edit Quotation - ${formData.quotationNo}` : 'Create New Quotation'}
        icon={IconFileInvoice}
        secondary={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 2 }}>
              <Box sx={{ px: 2, py: 0.75, borderRadius: 1.5, bgcolor: 'primary.light', color: 'primary.dark', border: '1px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.8 }}>QUOTATION NO :</Typography>
                <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5 }}>{formData.quotationNo || 'Auto-generated'}</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.75, borderRadius: 1.5, bgcolor: 'secondary.light', color: 'secondary.dark', border: '1px solid', borderColor: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.8 }}>QUOTATION DATE :</Typography>
                <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5 }}>
                  {formData.quotationDate ? formData.quotationDate.split('-').reverse().join('/') : '-'}
                </Typography>
              </Box>
            </Box>
            <Tooltip title={shortcutTooltip('Back', 'Esc')}>
              <Button variant="outlined" color="secondary" onClick={() => navigate('/sm/quotations')} startIcon={<IconArrowLeft />} sx={btnCancel}>
                Back
              </Button>
            </Tooltip>
            {!isViewOnly && (
              <Tooltip title={shortcutTooltip('Save', 'Space+S')}>
                <Button variant="contained" color="primary" onClick={handleSave} startIcon={<IconDeviceFloppy />} sx={btnSave}>
                  Save
                </Button>
              </Tooltip>
            )}
          </Stack>
        }
      >
        <Box sx={{ p: 2, width: '100%' }}>
          {/* Main Content */}
          <Stack spacing={2}>
            <BOSFormSection icon={<IconReceipt2 size={22} color={theme.palette.primary.main} />} title="General Information">
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.customerName || ''}
                  value={customers.find((c) => c.id === formData.customerId) || null}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      customerId: newValue?.id || '',
                      customerName: newValue?.customerName || newValue?.vendorName || '',
                      contactPerson: newValue?.contactPerson || '',
                      customerGroup: newValue?.groupName || newValue?.customerGroup || prev.customerGroup,
                      paymentTerms: newValue?.paymentTerms || prev.paymentTerms,
                      currency: newValue?.currency || prev.currency,
                      exchangeRate: newValue?.exchangeRate || prev.exchangeRate
                    }));
                    if (newValue && (newValue.customerName || newValue.vendorName)) {
                      fetchContacts(newValue.customerName || newValue.vendorName);
                    } else {
                      setQuotationContacts([{ contactName: '', mobileNo: '', emailId: '', department: '', designation: '', mobileISD: '+91' }]);
                    }
                  }}
                  disabled={isViewOnly}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      fullWidth
                      name="customerId"
                      label="Customer *"
                      placeholder="Type to search..."
                      required
                      error={!!errors.customerId}
                      helperText={errors.customerId}
                      sx={errorStyle(!!errors.customerId)}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {params.InputProps.endAdornment}
                            {!isViewOnly && (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setQuickCustomerOpen(true)} edge="end" size="small" title="Quick Create Customer">
                                  <IconPlus size={18} />
                                </IconButton>
                              </InputAdornment>
                            )}
                          </>
                        )
                      }}
                    />
                  )}
                />
                <Autocomplete
                  options={enquiries.filter(e =>
                    (e.customerId && String(e.customerId) === String(formData.customerId)) ||
                    (e.customer && String(e.customer.id) === String(formData.customerId)) ||
                    (e.customerName && e.customerName === formData.customerName) ||
                    (e.vendorName && e.vendorName === formData.customerName)
                  )}
                  getOptionLabel={(option) => option.enquiryNo || option.rfqNo || ''}
                  value={enquiries.find((e) => (e.enquiryNo === formData.enquiryRef || e.rfqNo === formData.enquiryRef)) || null}
                  onChange={async (event, newValue) => {
                    if (!newValue) {
                      setFormData(prev => ({ ...prev, enquiryRef: '' }));
                      return;
                    }

                    if (newValue.contactId && contacts.length > 0) {
                      const specificContact = contacts.find(c => c.id === newValue.contactId);
                      if (specificContact) {
                        let isd = '+91', phoneNum = specificContact.mobileNo || '';
                        if (phoneNum.includes('-')) {
                          const parts = phoneNum.split('-'); isd = (parts[0] || '').split(' ')[0]; phoneNum = parts.slice(1).join('-');
                        } else if (phoneNum.startsWith('+')) {
                          const matched = (countries || []).find(co => co.countryCode && phoneNum.startsWith(co.countryCode));
                          if (matched) { isd = matched.countryCode; phoneNum = phoneNum.slice(matched.countryCode.length).trim(); }
                        }
                        setQuotationContacts([{
                          contactName: specificContact.contactName || '',
                          mobileNo: phoneNum,
                          emailId: specificContact.emailId || '',
                          department: specificContact.department || '',
                          designation: specificContact.designation || '',
                          mobileISD: isd || '+91'
                        }]);
                      }
                    }

                    const currentCustomerId = formData.customerId || '';
                    const isInter = isInterStateTransaction(currentCustomerId, customers, '33');

                    let updatedParts = [];
                    if (newValue.parts && newValue.parts.length > 0) {
                      updatedParts = await Promise.all(newValue.parts.map(async p => {
                        const match = allProducts.find(prod => (prod.id && p.partNoId && prod.id === p.partNoId) || (prod.itemNo && p.partNo && prod.itemNo === p.partNo));
                        let unitRate = p.rate || match?.sellingRate || match?.price || match?.unitRate || 0;
                        let fetchedPrice = unitRate;

                        if (match && match.id && currentCustomerId) {
                          try {
                            const res = await axios.get('/api/sales/price-master/applicable-price', {
                              params: { customerId: currentCustomerId, productId: match.id }
                            });
                            if (res.data && res.data > 0) {
                              unitRate = res.data;
                              fetchedPrice = res.data;
                            }
                          } catch (err) { }
                        }

                        const reqQty = p.reqQty || p.annualReqQty || 0;
                        const amount = reqQty * unitRate;
                        const hsnCode = match?.hsnCode || '';
                        let cgstRate = 0, sgstRate = 0, igstRate = 0;

                        if (hsnCode) {
                          const hsnData = hsnList.find(h => h.hsnCode === hsnCode);
                          if (hsnData) {
                            cgstRate = hsnData.cgstPer || 0;
                            sgstRate = hsnData.sgstPer || 0;
                            igstRate = hsnData.igstPer || 0;
                          } else {
                            cgstRate = match?.cgstRate || 0;
                            sgstRate = match?.sgstRate || 0;
                            igstRate = match?.igstRate || 0;
                          }
                        }

                        let finalAmount = amount;
                        let cgstAmt = 0, sgstAmt = 0, igstAmt = 0;

                        if (isInter) {
                          igstAmt = amount * (igstRate / 100);
                          finalAmount += igstAmt;
                        } else {
                          cgstAmt = amount * (cgstRate / 100);
                          sgstAmt = amount * (sgstRate / 100);
                          finalAmount += (cgstAmt + sgstAmt);
                        }

                        return {
                          partNo: match?.itemNo || p.partNo || '',
                          name: match ? (match.description || match.partName || match.itemName || '') : (p.name || ''),
                          hsnCode: match?.hsnCode || '',
                          model: match?.modelNo || match?.model || '',
                          custPartNo: '',
                          uom: match?.uom || p.uom || 'Nos',
                          unitRate: unitRate,
                          fetchedPrice: fetchedPrice,
                          curStock: match?.stockQty || 0,
                          reqQty: reqQty,
                          amount: amount.toFixed(2),
                          disType: 'N/A',
                          discount: 0,
                          assValue: amount.toFixed(2),
                          cgstRate: isInter ? 0 : cgstRate, cgstAmt: isInter ? 0 : cgstAmt.toFixed(2),
                          sgstRate: isInter ? 0 : sgstRate, sgstAmt: isInter ? 0 : sgstAmt.toFixed(2),
                          igstRate: isInter ? igstRate : 0, igstAmt: isInter ? igstAmt.toFixed(2) : 0,
                          freightAmt: 0, freightTaxRate: 0, freightTaxAmt: 0, finalAmount: finalAmount.toFixed(2),
                          enquiryNo: newValue.enquiryNo || newValue.rfqNo || '',
                          oemPartNo: match?.oemPartNo || p.oemPartNo || '',
                          capacity: '',
                          additionalComments: '',
                          warranty: '',
                          leadTimeType: 'N/A', leadTimeDays: 0,
                          lastQuotedPrice: 0,
                          remarks: p.remarks || '',
                          status: 'OPEN',
                          approvalStatus: 'CREATED'
                        };
                      }));
                    }

                    setFormData(prev => {
                      const updatedData = {
                        ...prev,
                        enquiryRef: newValue?.enquiryNo || newValue?.rfqNo || '',
                        enquiryMode: newValue?.rfqMode || newValue?.enquiryMode || prev.enquiryMode,
                        currency: newValue?.currency || prev.currency,
                        paymentTerms: newValue?.paymentTerms || prev.paymentTerms,
                        requestDate: newValue?.enquiryDate || newValue?.rfqDate || prev.requestDate,
                        remarks: newValue?.remarks || prev.remarks
                      };

                      if (updatedParts.length > 0) {
                        updatedData.parts = updatedParts;
                        const total = updatedParts.reduce((sum, p) => sum + parseFloat(p.finalAmount || 0), 0);
                        updatedData.totalAmount = total.toFixed(3);
                      }

                      return updatedData;
                    });
                  }}
                  disabled={isViewOnly || !formData.customerId}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      fullWidth
                      name="enquiryRef"
                      label="Enquiry No"
                      placeholder="Select Enquiry..."
                    />
                  )}
                />
                <BOSTextField name="customerGroup" label="Customer Group" value={formData.customerGroup || ''} onChange={handleCustomChange} disabled={isViewOnly} />

                <BOSTextField select name="enquiryMode" label="Enquiry Mode" value={formData.enquiryMode || ''} onChange={handleCustomChange} disabled={isViewOnly}>
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
                <BOSDatePicker name="requestDate" label="Request Date" value={formData.requestDate || ''} onChange={handleCustomChange} disabled={isViewOnly} disableFuture={false} />
                <BOSTextField name="paymentTerms" label="Payment Terms" value={formData.paymentTerms || ''} onChange={handleCustomChange} disabled={isViewOnly} />

                <BOSTextField select name="currency" label="Currency" value={formData.currency || 'INR'} onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, currency: val, exchangeRate: val === 'INR' ? 1 : prev.exchangeRate }));
                }} disabled={true}>
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </BOSTextField>
                <BOSTextField name="exchangeRate" label="Exchange Rate" type="number" value={formData.currency === 'INR' ? 1 : (formData.exchangeRate || '')} onChange={handleCustomChange} disabled={isViewOnly || formData.currency === 'INR'} />
                <BOSAutocomplete fullWidth name="transportMode" label="Transport Mode" value={formData.transportMode || null} onChange={(val) => setFormData(prev => ({ ...prev, transportMode: val?.value ?? val ?? '' }))} options={despatchModes} disabled={isViewOnly} freeSolo />
              </Box>
              <Box sx={{ mt: 2 }}>
                <BOSTextField disableRichText multiline minRows={3} label="Remarks" name="remarks" value={formData.remarks || ''} onChange={handleCustomChange} disabled={isViewOnly} />
              </Box>
            </BOSFormSection>

            <BOSFormSection
              title="Contact Details"
              defaultExpanded
            >
              <Stack spacing={2.5}>
                {quotationContacts.map((contact, index) => (
                  <Box key={index} sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start', flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
                    <Box sx={{ flex: 1, minWidth: '120px' }}>
                      <Autocomplete
                        freeSolo
                        options={contacts}
                        getOptionLabel={(option) => typeof option === 'string' ? option : (option.contactName || '')}
                        value={contacts.find(c => c.contactName === contact.contactName) || contact.contactName || ''}
                        disabled={isViewOnly}
                        onChange={(event, newValue) => {
                          const newContacts = [...quotationContacts];
                          if (typeof newValue === 'string') {
                            newContacts[index].contactName = newValue;
                          } else if (newValue && newValue.contactName) {
                            let isd = '+91', phoneNum = newValue.mobileNo || '';
                            if (phoneNum.includes('-')) {
                              const parts = phoneNum.split('-'); isd = (parts[0] || '').split(' ')[0]; phoneNum = parts.slice(1).join('-');
                            } else if (phoneNum.startsWith('+')) {
                              const matched = (countries || []).find(co => co.countryCode && phoneNum.startsWith(co.countryCode));
                              if (matched) { isd = matched.countryCode; phoneNum = phoneNum.slice(matched.countryCode.length).trim(); }
                            }
                            newContacts[index].contactName = newValue.contactName || '';
                            newContacts[index].mobileNo = phoneNum;
                            newContacts[index].emailId = newValue.emailId || '';
                            newContacts[index].department = newValue.department || '';
                            newContacts[index].designation = newValue.designation || '';
                            newContacts[index].mobileISD = isd || '+91';
                          } else {
                            newContacts[index].contactName = '';
                            newContacts[index].mobileNo = '';
                            newContacts[index].emailId = '';
                            newContacts[index].department = '';
                            newContacts[index].designation = '';
                            newContacts[index].mobileISD = '+91';
                          }
                          setQuotationContacts(newContacts);
                        }}
                        onInputChange={(event, newInputValue) => {
                          const newContacts = [...quotationContacts];
                          newContacts[index].contactName = newInputValue;
                          setQuotationContacts(newContacts);
                        }}
                        renderInput={(params) => (
                          <BOSTextField
                            {...params}
                            fullWidth
                            label="Contact Name"
                            placeholder="Type contact name"
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: 1.5, minWidth: '180px' }}>
                      <BOSTextField
                        fullWidth
                        label="Mobile No"
                        value={contact.mobileNo}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          const newContacts = [...quotationContacts];
                          newContacts[index].mobileNo = val;
                          setQuotationContacts(newContacts);
                        }}
                        error={contact.mobileNo && contact.mobileNo.trim().length > 0 && contact.mobileNo.trim().length !== 10}
                        helperText={contact.mobileNo && contact.mobileNo.trim().length > 0 && contact.mobileNo.trim().length !== 10 ? "Invalid length: must be between 10 and 10 digits" : ""}
                        disabled={isViewOnly}
                        inputProps={{
                          maxLength: 10,
                          onInput: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 0, '& .MuiSelect-select': { py: 0, pr: 3, pl: 1, fontWeight: 700, color: '#111827', fontSize: '13px' }, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}>
                              <Select
                                variant="outlined"
                                value={contact.mobileISD || "+91"}
                                onChange={(e) => {
                                  const newContacts = [...quotationContacts];
                                  newContacts[index].mobileISD = e.target.value;
                                  setQuotationContacts(newContacts);
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
                        value={contact.emailId}
                        onChange={(e) => {
                          const newContacts = [...quotationContacts];
                          newContacts[index].emailId = e.target.value;
                          setQuotationContacts(newContacts);
                        }}
                        disabled={isViewOnly}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '100px' }}>
                      <BOSTextField
                        fullWidth
                        label="Department"
                        value={contact.department}
                        onChange={(e) => {
                          const newContacts = [...quotationContacts];
                          newContacts[index].department = e.target.value;
                          setQuotationContacts(newContacts);
                        }}
                        disabled={isViewOnly}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: '100px' }}>
                      <BOSTextField
                        fullWidth
                        label="Designation"
                        value={contact.designation}
                        onChange={(e) => {
                          const newContacts = [...quotationContacts];
                          newContacts[index].designation = e.target.value;
                          setQuotationContacts(newContacts);
                        }}
                        disabled={isViewOnly}
                      />
                    </Box>

                  </Box>
                ))}
                {quotationContacts.length === 0 && (
                  <Typography color="textSecondary" align="center">No contacts found. Click 'Add Contact' to create one.</Typography>
                )}
              </Stack>
            </BOSFormSection>

            <Box sx={{ height: 16 }} />

            <BOSFormSection title="Quotation Attachments" defaultExpanded>
              <Box sx={{ display: 'flex', width: '100%', gap: 1.5, alignItems: 'flex-start' }}>
                <BOSFileUpload
                  files={formData.attachments || []}
                  onChange={(files) => {
                    setFormData(prev => ({ ...prev, attachments: files }));
                  }}
                  module="SM_QUOTATION"
                  multiple={true}
                  compact={true}
                  label="Upload Quotation Documents"
                  disabled={isViewOnly}
                />
              </Box>
            </BOSFormSection>

            <Box sx={{ height: 16 }} />

            <QuotationPartsMatrix
              formData={formData}
              setFormData={setFormData}
              isViewOnly={isViewOnly}
              isInterState={isInterStateTransaction(customers.find(c => c.id === formData.customerId)?.stateCode)}
            />

          </Stack>
        </Box>
      </MainCard>

      <ConfirmDeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Quotation" message="Are you sure you want to delete this quotation?" itemName={formData.quotationNo || formData.customerName} />

      <Dialog
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
            disabled={loading}
            sx={{ height: '48px', width: '140px', borderRadius: '8px', bgcolor: '#2196F3', color: '#fff', fontWeight: 600, textTransform: 'none', fontSize: '16px', boxShadow: 'none', '&:hover': { bgcolor: '#1976D2', boxShadow: 'none' } }}
          >
            Save
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default QuotationEntry;
