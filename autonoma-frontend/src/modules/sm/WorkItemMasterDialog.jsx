import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useMemo } from 'react';
import { Grid, useTheme, MenuItem, Typography, Stack, Select, Box, Button, CircularProgress, Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'utils/axios';
import { sanitizeHTML } from 'utils/sanitize';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import { BOSFormDialog, btnDelete, btnEdit, BOSDatePicker, BOSFormSection, BOSFileUpload, errorStyle, BOSFilePreview } from 'ui-component/bos';
import { format } from 'date-fns';
import { IconTrash, IconUpload, IconMailForward, IconCloudUpload, IconFileCheck, IconX, IconUser, IconSettings, IconMail, IconChecks, IconClock, IconMessageDots } from '@tabler/icons-react';
import { useRef } from 'react';
import ForwardMailDialog from './ForwardMailDialog';
import CustomerGmailDialog from './CustomerGmailDialog';
import CategoryDialog from './CategoryDialog';
import StatusDialog from './StatusDialog';

const fieldConfigs = [
  { field: 'emailSubject', label: 'Subject', required: true, maxLength: 500 },
  { field: 'customerName', label: 'Customer Name', required: true }
];

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

const getCleanDomain = (domainOrEmail) => {
  if (!domainOrEmail) return '';
  let str = domainOrEmail.toLowerCase().trim();
  const idx = str.lastIndexOf('@');
  if (idx !== -1) {
    str = str.slice(idx + 1);
  }
  if (str.startsWith('@')) {
    str = str.slice(1);
  }
  return str.trim();
};

const matchDomain = (email, customerDomain) => {
  const cleanEmailDomain = getCleanDomain(email);
  const cleanCustDomain = getCleanDomain(customerDomain);
  return cleanEmailDomain && cleanCustDomain && cleanEmailDomain === cleanCustDomain;
};

const stripEmailReplyThread = (body) => {
  if (!body) return '';
  const lines = body.split(/\r?\n/);
  const cleanLines = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-----Original Message-----') || 
        trimmed.startsWith('________________________________')) {
      break;
    }
    if (trimmed.toLowerCase().startsWith('from:') && cleanLines.length > 0) {
      break;
    }
    if (trimmed.toLowerCase().startsWith('on ') && trimmed.toLowerCase().endsWith('wrote:')) {
      break;
    }
    if (/^on\s+.*\s+wrote:\s*$/i.test(trimmed)) {
      break;
    }
    cleanLines.push(line);
  }
  return cleanLines.join('\n').trim();
};

export default function WorkItemMasterDialog({ open, handleClose, initialData, readOnly, perms, nextWiNo }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isEdit = !!initialData;
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState({
    customerName: '',
    customerCode: '',
    emailFrom: '',
    emailTo: '',
    emailSubject: '',
    emailBody: '',
    rawEmailBody: '',
    enquiryNo: '',
    refDate: '',
    id: '',
    wiNo: '',
    emailReceivedAt: '',
    category: 'Others',
    status: 'Abandoned',
    mode: 'MANUAL',
    emailMessageId: '',
    uploadFiles: ''
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewAllFiles, setPreviewAllFiles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [selectedThreadMsg, setSelectedThreadMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handlePreview = (processingRequestId, attachmentId, fileName) => {
    const files = attachments.map(att => ({
      id: att.id,
      fileName: att.name,
      serverFileName: att.id,
      url: `/api/ocr/processing-requests/${processingRequestId}/attachments/${att.id}`,
      isServer: true
    }));
    const targetFile = files.find(f => f.id === attachmentId) || {
      id: attachmentId,
      fileName: fileName,
      serverFileName: attachmentId,
      url: `/api/ocr/processing-requests/${processingRequestId}/attachments/${attachmentId}`,
      isServer: true
    };
    
    setPreviewAllFiles(files);
    setPreviewFile(targetFile);
    setPreviewOpen(true);
  };

  const handleThreadPreview = (msg) => {
    const processingRequestId = formData.id;
    if (!processingRequestId) return;

    const isInitial = !msg.direction || (msg.direction === 'INCOMING' && (msg.emailType?.toLowerCase().includes('initial') || !msg.emailType));
    const isOutgoing = msg.direction === 'OUTGOING';
    const isReply = msg.emailType?.toLowerCase().includes('reply');

    let relevantAtts = [];

    if (isReply) {
      // ONLY the reply .eml (1st) and the reply completed Excel attachment (2nd) - NO parent enquiry.eml!
      const replyEml = attachments.filter(a =>
        a.name?.toLowerCase().startsWith('re_') ||
        a.name?.toLowerCase().startsWith('reply') ||
        a.id?.toLowerCase().startsWith('reply_eml') ||
        (a.name?.toLowerCase().endsWith('.eml') && a.id !== 'original_email_eml')
      );
      const replyExcel = attachments.filter(a =>
        a.name?.toLowerCase().includes('-') ||
        (a.id?.toLowerCase().startsWith('reply_') && (a.name?.toLowerCase().endsWith('.xls') || a.name?.toLowerCase().endsWith('.xlsx')))
      );
      relevantAtts = [...replyEml, ...replyExcel];
    } else if (isOutgoing) {
      // ONLY the outgoing template
      relevantAtts = attachments.filter(a =>
        a.name?.toLowerCase().includes('template') && !a.name?.toLowerCase().includes('-')
      );
      if (relevantAtts.length === 0) {
        relevantAtts = attachments.filter(a => a.name?.toLowerCase().endsWith('.xls') || a.name?.toLowerCase().endsWith('.xlsx'));
      }
    } else {
      // ONLY the initial email .eml and initial attachments (NO reply eml or reply excel!)
      const initialEml = attachments.filter(a =>
        a.id === 'original_email_eml' ||
        (a.name?.toLowerCase().endsWith('.eml') && !a.name?.toLowerCase().startsWith('re_') && !a.name?.toLowerCase().startsWith('reply'))
      );
      const initialOther = attachments.filter(a =>
        !a.name?.toLowerCase().endsWith('.eml') &&
        !a.name?.toLowerCase().includes('template') &&
        !a.id?.toLowerCase().startsWith('reply_')
      );
      relevantAtts = [...initialEml, ...initialOther];
    }

    if (relevantAtts.length === 0) {
      relevantAtts = attachments;
    }

    const files = relevantAtts.map(att => ({
      id: att.id,
      fileName: att.name,
      serverFileName: att.id,
      url: `/api/ocr/processing-requests/${processingRequestId}/attachments/${att.id}`,
      isServer: true
    }));

    if (files.length > 0) {
      setPreviewAllFiles(files);
      setPreviewFile(files[0]); // Respective .eml selected as default
      setPreviewOpen(true);
    } else {
      handlePreview(processingRequestId, 'original_email_eml', 'Email Content');
    }
  };

  const fetchAttachments = async (processingRequestId) => {
    if (!processingRequestId) return;
    console.debug(`[AddWorkItemDialog] Fetching attachments for processingRequestId: ${processingRequestId}`);
    setLoadingAttachments(true);
    try {
      const res = await axios.get(`/api/ocr/processing-requests/${processingRequestId}/attachments`);
      console.debug(`[AddWorkItemDialog] Attachments fetched:`, res.data);
      setAttachments(res.data || []);
    } catch (err) {
      console.error('[AddWorkItemDialog] Failed to fetch attachments', err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/sm/customers');
      setCustomers(res.data || []);
    } catch (err) {
      console.error('[WorkItemMasterDialog] Failed to fetch customers', err);
    }
  };

  const handleDownload = (emailId, attachmentId) => {
    const url = `/api/ocr/inbox/${emailId}/attachments/${attachmentId}`;
    window.open(url, '_blank');
  };

  const handleCustomerClick = () => {
    const email = formData.emailFrom || '';
    const domain = getCleanDomain(email);
    if (domain !== 'gmail.com' && domain !== 'yahoo.com') {
      dispatch(openSnackbar({
        open: true,
        message: 'Customer mapping is only available for Gmail and Yahoo emails.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }
    setCustomerDialogOpen(true);
  };

  const handleManualUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const upFormData = new FormData();
    upFormData.append('file', file);

    setUploading(true);
    try {
      // Manual uploads go to the main backend file service
      const res = await axios.post('/api/files/upload', upFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(p => ({ ...p, uploadFiles: res.data }));
      dispatch(openSnackbar({ open: true, message: 'File uploaded successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
    } catch (err) {
      console.error('Manual upload failed:', err);
      dispatch(openSnackbar({ open: true, message: 'File upload failed.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    } finally {
      setUploading(false);
    }
  };

  const handleViewManualUpload = () => {
    if (!formData.uploadFiles) return;
    const fileName = formData.uploadFiles.split('/').pop();
    const cleanName = fileName.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i, '');
    const fileObj = {
      fileName: cleanName,
      serverFileName: formData.uploadFiles,
      isServer: true
    };
    
    setPreviewAllFiles([fileObj]);
    setPreviewFile(fileObj);
    setPreviewOpen(true);
  };

  const formatDateForPicker = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd');
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    if (open && initialData && initialData.id) {
      axios.get(`/api/ocr/processing-requests/${initialData.id}`)
        .then(res => {
          if (res.data && res.data.thread) {
            const seen = new Set();
            const uniqueThread = res.data.thread.filter(item => {
              const key = `${item.direction}_${item.emailType}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            setThreadMessages(uniqueThread);
          }
        })
        .catch(err => {
          console.error('[WorkItemMasterDialog] Failed to fetch thread details', err);
        });
    } else {
      setThreadMessages([]);
    }
  }, [initialData, open]);

  useEffect(() => {
    clearErrors();
    if (open) fetchCustomers();
    if (initialData) {
      const emailDate = initialData.emailReceivedAt || '';
      setFormData({
        id: initialData.id || '',
        emailFrom: initialData.emailFrom || '',
        emailTo: initialData.emailTo || '',
        emailSubject: initialData.emailSubject || '',
        customerName: (initialData.customerCode && initialData.customerName) 
          ? `${initialData.customerCode} / ${initialData.customerName}` 
          : (initialData.customerName || ''),
        customerCode: initialData.customerCode || '',
        emailBody: stripHtml(stripEmailReplyThread(initialData.emailBodyPreview || initialData.emailBody || initialData.combinedText || '')),
        rawEmailBody: stripEmailReplyThread(initialData.emailBodyPreview || initialData.emailBody || initialData.combinedText || ''),
        enquiryNo: initialData.enquiryNo || initialData.quotationNo || initialData.invoiceNo || '',
        refDate: initialData.refDate ? formatDateForPicker(initialData.refDate) : (emailDate ? formatDateForPicker(emailDate) : formatDateForPicker(new Date())),
        category: initialData.intent === 'GENERAL_INQUIRY' ? 'Others' : 
                  initialData.intent === 'QUOTATION_REQUEST' ? 'Enquiry' : 
                  initialData.intent === 'INVOICE_REQUEST' ? 'Order' : 
                  initialData.intent === 'LEDGER' ? 'Ledger' :
                  initialData.intent === 'UNCLASSIFIED' ? 'Others' : (initialData.intent || '-Select-'),
        status: initialData.status === 'COMPLETED' ? 'Completed' :
                initialData.status === 'SKIPPED' ? 'Abandoned' : 
                (initialData.status || '-Select-'),
        emailReceivedAt: emailDate,
        wiNo: initialData.wiNo || '',
        mode: (initialData.mode || (initialData.emailMessageId && initialData.emailMessageId.startsWith('MANUAL_') ? 'MANUAL' : (initialData.emailMessageId ? 'OCR' : 'MANUAL'))).toUpperCase(),
        emailMessageId: initialData.emailMessageId || '',
        uploadFiles: initialData.uploadFiles || ''
      });
      if (initialData.id) {
        fetchAttachments(initialData.id);
      }
    } else {
      const now = new Date();
      setFormData({
        customerName: '',
        customerCode: '',
        emailFrom: '',
        emailTo: '',
        emailSubject: '',
        emailBody: '',
        rawEmailBody: '',
        enquiryNo: '',
        refDate: formatDateForPicker(now),
        id: '',
        wiNo: nextWiNo || '',
        emailReceivedAt: now.toISOString(),
        category: '-Select-',
        status: '-Select-',
        mode: 'MANUAL',
        emailMessageId: '',
        uploadFiles: ''
      });
      setAttachments([]);
    }
  }, [initialData, open, clearErrors, nextWiNo]);

  const filteredCustomers = useMemo(() => {
    const senderEmail = formData.emailFrom || '';
    if (!senderEmail) return customers;
    
    const cleanSenderDomain = getCleanDomain(senderEmail);
    const isPublic = cleanSenderDomain === 'gmail.com' || cleanSenderDomain === 'yahoo.com';
    
    if (isPublic) {
      return customers.filter(cust => {
        const domain = getCleanDomain(cust.domainName);
        return domain === 'gmail.com' || domain === 'yahoo.com' || !domain;
      });
    }

    const matching = customers.filter(cust => matchDomain(senderEmail, cust.domainName));
    if (matching.length > 0) {
      return matching;
    }
    return customers;
  }, [customers, formData.emailFrom]);

  useEffect(() => {
    if (open && customers.length > 0 && !formData.customerName) {
      const senderEmail = formData.emailFrom || '';
      if (senderEmail) {
        const cleanSenderDomain = getCleanDomain(senderEmail);
        const isGmail = cleanSenderDomain === 'gmail.com';
        const matching = customers.filter(cust => matchDomain(senderEmail, cust.domainName));
        if (matching.length === 1 && !isGmail) {
          const singleCust = matching[0];
          const displayValue = `${singleCust.customerCode} / ${singleCust.customerName}`;
          setFormData(prev => ({
            ...prev,
            customerName: displayValue,
            customerCode: singleCust.customerCode
          }));
          dispatch(openSnackbar({
            open: true,
            message: `Auto-selected customer: ${singleCust.customerName}`,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          }));
        }
      }
    }
  }, [open, customers, formData.emailFrom, formData.customerName, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    const val = e.target.value;
    if (val) {
      if (val.includes('/')) {
        const parts = val.split('/');
        setFormData(prev => ({
          ...prev,
          customerName: val,
          customerCode: parts[0].trim()
        }));
      } else if (val.includes('-')) {
        const parts = val.split('-');
        setFormData(prev => ({
          ...prev,
          customerName: val,
          customerCode: parts[0].trim()
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          customerName: val,
          customerCode: val
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        customerName: '',
        customerCode: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validate(formData, fieldConfigs)) return;
    const payload = { 
      ...formData, 
      emailBodyPreview: formData.emailBody,
      mode: isEdit ? (formData.mode || 'MANUAL') : 'MANUAL'
    };
    try {
      if (isEdit) {
        await axios.put(`/api/ocr/processing-requests/${initialData.id}`, payload);
      } else {
        await axios.post('/api/ocr/processing-requests', payload);
      }
      dispatch(openSnackbar({ open: true, message: `Work Item ${isEdit ? 'updated' : 'created'} successfully!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to save work item:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to save work item.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const formattedDateTime = formData.emailReceivedAt 
    ? format(new Date(formData.emailReceivedAt), 'dd/MM/yyyy HH:mm') 
    : '';

  const fileArray = useMemo(() => {
    if (!formData.uploadFiles) return [];
    return formData.uploadFiles.split(',').map((fileUrl, idx) => {
      const trimmed = fileUrl.trim();
      return {
        id: `manual_${idx}`,
        fileName: trimmed.split('/').pop(),
        serverFileName: trimmed,
        isServer: true
      };
    });
  }, [formData.uploadFiles]);

  const secondaryActions = (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 'auto' }}>
      {!readOnly && isEdit && (
        <Button
          variant="contained"
          sx={btnDelete}
          startIcon={<IconTrash size={18} />}
        >
          Delete
        </Button>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleCustomerClick}
          disabled={readOnly}
          sx={{ ...btnEdit(theme), bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          startIcon={<IconUser size={18} />}
        >
          Customer
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => setCategoryDialogOpen(true)}
          disabled={readOnly}
          sx={{ ...btnEdit(theme), bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
          startIcon={<IconSettings size={18} />}
        >
          Category
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => setStatusDialogOpen(true)}
          disabled={readOnly}
          sx={{ ...btnEdit(theme), bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
          startIcon={<IconSettings size={18} />}
        >
          Status
        </Button>
      </Box>
      {!readOnly && isEdit && (
        <Button
          variant="contained"
          sx={{ ...btnEdit(theme), bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
          startIcon={<IconMailForward size={18} />}
          onClick={() => setForwardDialogOpen(true)}
        >
          Forward To
        </Button>
      )}
    </Box>
  );

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose(false)}
      onSave={handleSubmit}
      title={isEdit ? (readOnly ? 'View Work Item Master' : 'Edit Work Item Master') : 'Add New Work Item Master'}
      isViewOnly={readOnly}
      maxWidth="lg"
      secondaryActions={secondaryActions}
      fullScreen={true}
    >
      <Box sx={{ p: 2.5, bgcolor: '#f4f6f8', borderBottom: '1px solid #e0e0e0', mb: 2 }}>
        <Grid container spacing={2.5}>
          {/* Row 1: Customer Name, WI No, WI Date */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid size={{ xs: 3 }}>
                <Typography variant="body2" color="text.secondary">Customer Name</Typography>
              </Grid>
              <Grid size={{ xs: 9 }}>
                <Select 
                  size="small" 
                  fullWidth 
                  name="customerName"
                  value={formData.customerName || ''} 
                  onChange={handleCustomerChange}
                  disabled={readOnly}
                  displayEmpty
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="" disabled>Select Customer</MenuItem>
                  {filteredCustomers.map((cust) => {
                    const displayValue = `${cust.customerCode} / ${cust.customerName}`;
                    return (
                      <MenuItem key={cust.id} value={displayValue}>
                        {displayValue}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid size={{ xs: 5 }}>
                <Typography variant="body2" color="text.secondary" align="right">Work Item No</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <TextField 
                  size="small" 
                  fullWidth 
                  disabled 
                  value={isEdit ? (formData.wiNo || formData.id || '') : (nextWiNo || '')} 
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid size={{ xs: 5 }}>
                <Typography variant="body2" color="text.secondary" align="right">Date & Time</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <TextField 
                  size="small" 
                  fullWidth 
                  disabled 
                  value={formattedDateTime} 
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Row 2: Ref No, Ref Date (offset by 6) */}
          <Grid size={{ xs: 0, md: 6 }}></Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid size={{ xs: 5 }}>
                <Typography variant="body2" color="text.secondary" align="right">Ref No*</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <TextField 
                  size="small" 
                  fullWidth 
                  name="enquiryNo"
                  value={formData.enquiryNo} 
                  onChange={handleChange}
                  disabled={readOnly}
                  error={!!errors.enquiryNo}
                  sx={[ { bgcolor: 'background.paper' }, errorStyle(!!errors.enquiryNo) ]}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container alignItems="center" spacing={1}>
              <Grid size={{ xs: 5 }}>
                <Typography variant="body2" color="text.secondary" align="right">Ref Date</Typography>
              </Grid>
              <Grid size={{ xs: 7 }}>
                <BOSDatePicker
                  name="refDate"
                  label=""
                  value={formData.refDate}
                  onChange={handleChange}
                  disabled={readOnly}
                  highlightHolidays={false}
                  blockHolidays={false}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        <Grid container spacing={2}>
          {/* Stacked Full Width Fields */}
          <Grid size={{ xs: 12 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 1.5, md: 0.8 }}>
                <Typography variant="body2" color="text.secondary" align="right">From</Typography>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11.2 }}>
                <TextField size="small" fullWidth name="emailFrom" value={formData.emailFrom} onChange={handleChange} disabled={readOnly} />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 1.5, md: 0.8 }}>
                <Typography variant="body2" color="text.secondary" align="right">To</Typography>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11.2 }}>
                <TextField size="small" fullWidth name="emailTo" value={formData.emailTo} onChange={handleChange} disabled={readOnly} />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 1.5, md: 0.8 }}>
                <Typography variant="body2" color="text.secondary" align="right">Subject</Typography>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11.2 }}>
                <TextField size="small" fullWidth name="emailSubject" value={formData.emailSubject} onChange={handleChange} disabled={readOnly} />
              </Grid>
            </Grid>
          </Grid>

          {/* Attachments Section */}
          {(formData.emailMessageId || attachments.length > 0 || loadingAttachments) && (
            <Grid size={{ xs: 12 }}>
              <Grid container alignItems="center" spacing={2} sx={{ minHeight: 40 }}>
                <Grid size={{ xs: 1.5, md: 0.8 }}>
                  <Typography variant="body2" color="text.secondary" align="right">Attachment</Typography>
                </Grid>
                <Grid size={{ xs: 10.5, md: 11.2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1.5, 
                    alignItems: 'center', 
                    p: 1, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: '8px', 
                    bgcolor: 'background.paper',
                    minHeight: 38
                  }}>
                    {loadingAttachments ? (
                      <CircularProgress size={16} sx={{ ml: 1 }} />
                    ) : attachments.length > 0 ? (
                      attachments.map((att) => (
                        <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={att.name}
                            icon={<AttachFileRoundedIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={() => handlePreview(formData.id, att.id, att.name, att.contentType)}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer', 
                              borderRadius: '24px', 
                              bgcolor: '#e3f2fd',
                              borderColor: '#2196f3',
                              px: 0.5,
                              '&:hover': { bgcolor: '#bbdefb', color: '#1976d2', borderColor: '#1976d2' }
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handlePreview(formData.id, att.id, att.name, att.contentType)}
                            sx={{ color: 'primary.main', p: 0.5 }}
                          >
                            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', ml: 1 }}>
                        No attachments found
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Grid container alignItems="flex-start" spacing={2}>
              <Grid size={{ xs: 1.5, md: 0.8 }}>
                <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>Content</Typography>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11.2 }}>
                {readOnly && formData.rawEmailBody && (/<[a-z][\s\S]*>/i.test(formData.rawEmailBody)) ? (
                  <Box sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    height: '500px',
                    width: '100%'
                  }}>
                    <iframe 
                      title="HTML Content Preview"
                      srcDoc={formData.rawEmailBody} 
                      style={{ width: '100%', height: '100%', border: 'none' }} 
                    />
                  </Box>
                ) : (
                  <TextField 
                    size="small" 
                    fullWidth 
                    multiline 
                    rows={20} 
                    name="emailBody" 
                    value={formData.emailBody} 
                    onChange={handleChange} 
                    disabled={readOnly} 
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                        p: 1.5
                      },
                      '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                )}
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 1.5, md: 0.8 }}>
                <Typography variant="body2" color="text.secondary" align="right">Attachment</Typography>
              </Grid>
              <Grid size={{ xs: 10.5, md: 11.2 }}>
                <BOSFileUpload
                  files={fileArray}
                  onChange={(files) => {
                    if (files && files.length > 0) {
                      const fileUrls = files.map(f => f.serverFileName || f.path || f.filePath || '').filter(Boolean).join(',');
                      setFormData(p => ({ ...p, uploadFiles: fileUrls }));
                    } else {
                      setFormData(p => ({ ...p, uploadFiles: '' }));
                    }
                  }}
                  module="SALES_ENQUIRY"
                  label="Click To Upload Document"
                  multiple={true}
                  disabled={readOnly}
                  compact={true}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Conversation Thread History (Placed at the very bottom) */}
          {threadMessages && threadMessages.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Grid container alignItems="flex-start" spacing={2}>
                <Grid size={{ xs: 1.5, md: 0.8 }}>
                  <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>Thread</Typography>
                </Grid>
                <Grid size={{ xs: 10.5, md: 11.2 }}>
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    bgcolor: 'background.paper',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconMessageDots size={20} color={theme.palette.primary.main} />
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                          Conversation Flow ({threadMessages.length} Messages)
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack spacing={1.5}>
                      {threadMessages.map((msg, idx) => {
                        const isOutgoing = msg.direction === 'OUTGOING';
                        const isReply = msg.emailType?.toLowerCase().includes('reply');
                        
                        const badgeColor = isOutgoing ? '#2e7d32' : (isReply ? '#7b1fa2' : '#1976d2');
                        const badgeBg = isOutgoing ? '#e8f5e9' : (isReply ? '#f3e5f5' : '#e3f2fd');
                        const icon = isOutgoing ? <IconMailForward size={16} color={badgeColor} /> : (isReply ? <IconChecks size={16} color={badgeColor} /> : <IconMail size={16} color={badgeColor} />);
                        
                        return (
                          <Box
                            key={msg.id || idx}
                            sx={{
                              p: 1.5,
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: isOutgoing ? '#c8e6c9' : (isReply ? '#e1bee7' : '#bbdefb'),
                              bgcolor: isOutgoing ? '#f9fbe7' : (isReply ? '#faf5fb' : '#f4f9ff'),
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 1,
                                borderColor: badgeColor
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 0.75 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '6px', bgcolor: badgeBg, border: `1px solid ${badgeColor}` }}>
                                  {icon}
                                  <Typography variant="caption" fontWeight={700} sx={{ color: badgeColor }}>
                                    {msg.emailType || (isOutgoing ? 'Outgoing' : 'Incoming')}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                  {msg.emailSubject}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={1} alignItems="center">
                                {msg.emailReceivedAt && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <IconClock size={14} color="#757575" />
                                    <Typography variant="caption" color="text.secondary">
                                      {format(new Date(msg.emailReceivedAt), 'dd/MM/yyyy HH:mm')}
                                    </Typography>
                                  </Stack>
                                )}
                                {!isOutgoing && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleThreadPreview(msg)}
                                    startIcon={<VisibilityRoundedIcon sx={{ fontSize: '15px !important' }} />}
                                    sx={{
                                      py: 0.2,
                                      px: 1,
                                      fontSize: '0.75rem',
                                      borderRadius: '6px',
                                      borderColor: badgeColor,
                                      color: badgeColor,
                                      minWidth: 'auto',
                                      textTransform: 'none',
                                      '&:hover': {
                                        bgcolor: badgeBg,
                                        borderColor: badgeColor
                                      }
                                    }}
                                  >
                                    Preview
                                  </Button>
                                )}
                              </Stack>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.78rem', color: 'text.secondary', mb: 0.75 }}>
                              <Typography variant="caption">
                                <strong>From:</strong> {msg.emailFrom || '-'}
                              </Typography>
                              <Typography variant="caption">
                                <strong>To:</strong> {msg.emailTo || '-'}
                              </Typography>
                              {msg.emailCc && (
                                <Typography variant="caption">
                                  <strong>CC:</strong> {msg.emailCc}
                                </Typography>
                              )}
                            </Box>

                            {msg.emailBodyPreview && (
                              <Box sx={{ 
                                mt: 0.5, 
                                p: 1, 
                                borderRadius: '4px', 
                                bgcolor: 'background.paper', 
                                border: '1px dashed #e0e0e0',
                                fontSize: '0.8rem',
                                color: 'text.primary',
                                maxHeight: 120,
                                overflowY: 'auto'
                              }}>
                                {stripHtml(msg.emailBodyPreview)}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Box>
      <ForwardMailDialog open={forwardDialogOpen} handleClose={() => setForwardDialogOpen(false)} />

      {/* File Preview Dialog */}
      {previewOpen && (
        <BOSFilePreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewFile(null);
            setPreviewAllFiles([]);
          }}
          file={previewFile}
          allFiles={previewAllFiles}
          onNavigate={(f) => setPreviewFile(f)}
          url={previewFile?.url || (previewFile ? (previewFile.id === 'manual' || !previewFile.id ? `/api/files/view/${previewFile.serverFileName}` : `/api/ocr/processing-requests/${formData.id}/attachments/${previewFile.id}`) : '')}
          title="Attachment"
        />
      )}
      <CustomerGmailDialog 
        open={customerDialogOpen} 
        handleClose={() => setCustomerDialogOpen(false)} 
        emailFrom={formData.emailFrom}
        onSelect={(selectedCustName) => {
          if (selectedCustName) {
            if (selectedCustName.includes('/')) {
              const parts = selectedCustName.split('/');
              setFormData(prev => ({
                ...prev,
                customerName: selectedCustName,
                customerCode: parts[0].trim()
              }));
            } else if (selectedCustName.includes('-')) {
              const parts = selectedCustName.split('-');
              setFormData(prev => ({
                ...prev,
                customerName: selectedCustName,
                customerCode: parts[0].trim()
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                customerName: selectedCustName,
                customerCode: selectedCustName
              }));
            }
          } else {
            setFormData(prev => ({
              ...prev,
              customerName: '',
              customerCode: ''
            }));
          }
        }} 
      />
      <CategoryDialog 
        open={categoryDialogOpen} 
        handleClose={() => setCategoryDialogOpen(false)} 
        onSelect={(selectedCategory) => setFormData(prev => ({ ...prev, category: selectedCategory }))} 
      />
      <StatusDialog 
        open={statusDialogOpen} 
        handleClose={() => setStatusDialogOpen(false)} 
        onSelect={(selectedStatus) => setFormData(prev => ({ ...prev, status: selectedStatus }))} 
      />
    </BOSFormDialog>
  );
}
